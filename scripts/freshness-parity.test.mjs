// node --test scripts/freshness-parity.test.mjs
// AU6 `slo-mot-nguon` AC-1: định nghĩa độ tươi của app (app/src/lib/freshness.ts — /ops, /ops/collections, API) và của
// CLI (scripts/lib/freshness.mjs — check-freshness, AU4) là HAI bản chép; ca này giữ chúng khớp từng hằng, từng câu SQL
// và từng hàng đầu ra. Node 24 nạp thẳng tệp TS thuần (bỏ kiểu), không cần tsx. Không chạm DB: client giả.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, describe, test } from "node:test";

import * as cli from "./lib/freshness.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_TS = path.join(REPO, "app/src/lib/freshness.ts");
const app = await import(pathToFileURL(APP_TS).href);

const NOW = new Date("2026-10-23T12:00:00Z");
const ago = (h) => new Date(NOW.getTime() - h * 3.6e6).toISOString();
const IDS = { S01: ["s01a", "s01b"], S02: ["s02"], S03: ["s03agent", "s03mock"], S05: ["s05hook"], S06: ["s06"], S07: ["s07"] };
const MEASURED = ["S01", "S02", "S03", "S05", "S06"];
// Mã active không khai SLO: S07 (ma trận đòi một mã như vậy).
const REGISTRY = [...MEASURED, "S07"].map((code) => ({ code, source_ids: IDS[code] }));

/** Hàng probe theo trạng thái: tươi = một thành phố 1 giờ; quá hạn = một thành phố quá SLO + một tươi; chưa có = rỗng. */
function probeRows(code, state) {
  const slo = cli.SLO_HOURS[code];
  if (state === "fresh") return [{ city: "hanoi", last: ago(1) }];
  if (state === "stale") return [{ city: "hanoi", last: ago(slo + 5) }, { city: "hcmc", last: ago(1) }];
  return [];
}

/** Client giả: trả registry và hàng probe theo mã; nhận diện mã bằng tham số (S02 bằng bảng). Ghi mọi lời gọi. */
function fakeClient(states) {
  const calls = [];
  return {
    calls,
    async query(sql, args = []) {
      calls.push([sql.replace(/\s+/g, " ").trim(), JSON.stringify(args)]);
      if (sql.includes("FROM source_registry")) return { rows: REGISTRY };
      const code = sql.includes("airdna_markets")
        ? "S02"
        : Object.keys(IDS).find((c) => JSON.stringify(IDS[c]) === JSON.stringify(args[0]));
      return { rows: probeRows(code, states[code]) };
    },
  };
}

/** Ma trận viết trước: mỗi trạng thái cho cả 5 mã, rồi một ca trộn. */
const MATRIX = [
  ["mọi mã tươi", Object.fromEntries(MEASURED.map((c) => [c, "fresh"]))],
  ["mọi mã quá hạn", Object.fromEntries(MEASURED.map((c) => [c, "stale"]))],
  ["mọi mã chưa có", Object.fromEntries(MEASURED.map((c) => [c, "none"]))],
  ["trộn", { S01: "stale", S02: "fresh", S03: "none", S05: "fresh", S06: "stale" }],
];

const norm = (s) => s.replace(/\s+/g, " ").trim();

/** Danh sách chỗ lệch giữa hai bản, mỗi dòng gọi tên mã — rỗng là khớp. */
async function parityProblems(a, b) {
  const out = [];
  for (const code of new Set([...Object.keys(a.SLO_HOURS), ...Object.keys(b.SLO_HOURS)]))
    if (a.SLO_HOURS[code] !== b.SLO_HOURS[code]) out.push(`${code}: SLO ${a.SLO_HOURS[code]} ≠ ${b.SLO_HOURS[code]}`);
  for (const code of new Set([...Object.keys(a.TIME_SOURCE), ...Object.keys(b.TIME_SOURCE)]))
    if (a.TIME_SOURCE[code] !== b.TIME_SOURCE[code]) out.push(`${code}: cột thời gian lệch`);
  for (const code of new Set([...Object.keys(a.PROBES), ...Object.keys(b.PROBES)])) {
    const pa = a.PROBES[code];
    const pb = b.PROBES[code];
    if (!pa || !pb) { out.push(`${code}: probe chỉ có ở một bản`); continue; }
    if (norm(pa.sql) !== norm(pb.sql)) out.push(`${code}: SQL lệch`);
    if (JSON.stringify(pa.args(["x"], ["y"])) !== JSON.stringify(pb.args(["x"], ["y"]))) out.push(`${code}: tham số lệch`);
  }
  for (const [name, states] of MATRIX) {
    const ca = fakeClient(states);
    const cb = fakeClient(states);
    const ra = await a.readFreshness(ca, { now: NOW });
    const rb = await b.readFreshness(cb, { now: NOW });
    for (const code of [...MEASURED, "S07"]) {
      const sa = JSON.stringify(ra.filter((r) => r.code === code));
      const sb = JSON.stringify(rb.filter((r) => r.code === code));
      if (sa !== sb) out.push(`${code}: hàng đầu ra lệch ở ca «${name}»`);
    }
    if (JSON.stringify(ca.calls) !== JSON.stringify(cb.calls)) out.push(`ca «${name}»: chuỗi truy vấn lệch`);
  }
  return out;
}

const tmps = [];
after(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("định nghĩa độ tươi app ↔ CLI (AU6)", () => {
  test("SL-AC-1 hằng + SQL hai bản bằng nhau", async () => {
    assert.deepEqual(app.SLO_HOURS, cli.SLO_HOURS);
    assert.deepEqual(app.TIME_SOURCE, cli.TIME_SOURCE);
    assert.deepEqual(Object.keys(app.PROBES).sort(), Object.keys(cli.PROBES).sort());
    for (const code of Object.keys(cli.PROBES)) assert.equal(norm(app.PROBES[code].sql), norm(cli.PROBES[code].sql), code);
  });

  test("SL-AC-1 readFreshness hai bản ra cùng hàng trên client giả (ma trận 5 mã × 3 + mã không SLO)", async () => {
    assert.deepEqual(await parityProblems(app, cli), []);
    // đối chứng dương: ma trận thật sự đủ trạng thái, kể cả mã không SLO
    const rows = await cli.readFreshness(fakeClient(MATRIX[3][1]), { now: NOW });
    assert.deepEqual([...new Set(rows.map((r) => r.status))].sort(), ["fresh", "no-slo", "none", "stale"]);
    for (const [, states] of MATRIX.slice(0, 3)) {
      const st = await app.readFreshness(fakeClient(states), { now: NOW });
      assert.equal(st.filter((r) => r.code === "S07")[0].status, "no-slo");
    }
  });

  test("SL-AC-1 bản sao TS đổi SLO S03 → ca đỏ nêu S03", async () => {
    const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "freshness-parity-")));
    tmps.push(dir);
    const src = readFileSync(APP_TS, "utf8");
    const mutated = src.replace("S03: 72,", "S03: 2,");
    assert.notEqual(mutated, src, "không tìm thấy chỗ đột biến — bản sao không đổi gì");
    const copy = path.join(dir, "freshness.ts");
    writeFileSync(copy, mutated);
    const bad = await import(pathToFileURL(copy).href);
    assert.equal(bad.SLO_HOURS.S03, 2, "bản sao đột biến phải thật sự được nạp");
    const problems = await parityProblems(bad, cli);
    assert.ok(problems.some((p) => p.startsWith("S03")), `ca đỏ phải nêu S03, được: ${problems.join(" | ")}`);
    assert.ok(problems.every((p) => p.startsWith("S03") || p.startsWith("ca «")), `chỉ S03 được lệch: ${problems.join(" | ")}`);
  });
});

