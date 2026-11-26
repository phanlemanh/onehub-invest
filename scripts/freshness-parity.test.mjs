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
import { cadenceMap122 } from "./lib/so-nguon-122.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_TS = path.join(REPO, "app/src/lib/freshness.ts");
const app = await import(pathToFileURL(APP_TS).href);

const NOW = new Date("2026-10-23T12:00:00Z");
const ago = (h) => new Date(NOW.getTime() - h * 3.6e6).toISOString();
const IDS = { S01: ["s01a", "s01b"], S02: ["s02"], S03: ["s03agent", "s03mock"], S05: ["s05hook"], S06: ["s06"], S07: ["s07"], S10: ["s10"], S11: ["s11"], S16: [] };
// S10, S11: khai-slo-s10-s11. S16 (NK1): mã không có câu đo riêng, đo qua stg_tables.
const MEASURED = ["S01", "S02", "S03", "S05", "S06", "S10", "S11", "S16"];
// NK1: nhịp đọc từ sổ — dòng sổ giả mang cadence_hours lấy từ migration 122 (một chỗ ghi), không chép số tay.
const SLO = cadenceMap122();
const STG = { S16: ["stg_s16_can", "stg_s16_can_chi_tiet"] };
// Mã active không khai SLO: S07 (ma trận đòi một mã như vậy).
const REGISTRY = [...MEASURED, "S07"].map((code) => ({
  code, source_ids: IDS[code], cadence_hours: SLO[code] ?? null, stg_tables: STG[code] ?? [], measured_markets: null,
}));

/** Hàng probe theo trạng thái: tươi = một thành phố 1 giờ; quá hạn = một thành phố quá SLO + một tươi; chưa có = rỗng. */
function probeRows(code, state) {
  const slo = SLO[code];
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
      if (sql.includes("unnest($1::text[])")) return { rows: args[0].map((t) => ({ t })) }; // mọi bảng nạp có thật
      if (sql.includes("stg_s16_")) return { rows: probeRows("S16", states.S16) };
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
  ["trộn", { S01: "stale", S02: "fresh", S03: "none", S05: "fresh", S06: "stale", S10: "fresh", S11: "stale", S16: "stale" }],
];

const norm = (s) => s.replace(/\s+/g, " ").trim();

/** Danh sách chỗ lệch giữa hai bản, mỗi dòng gọi tên mã — rỗng là khớp. */
async function parityProblems(a, b) {
  const out = [];
  for (const k of ["LOI_122", "STG_TIME_SOURCE"]) if (a[k] !== b[k]) out.push(`${k} lệch`);
  if (norm(a.REGISTRY_SQL) !== norm(b.REGISTRY_SQL)) out.push("câu đọc sổ lệch");
  if (String(a.STG_TEN) !== String(b.STG_TEN)) out.push("khuôn tên bảng nạp lệch");
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

describe("KSL-AC-6 tóm tắt /ops tính S10, S11 vào mẫu số", () => {
  const cacMaKhac = MEASURED.filter((c) => c !== "S10" && c !== "S11");
  const tom = async (s1011) => {
    const states = { ...Object.fromEntries(cacMaKhac.map((c) => [c, "fresh"])), S10: s1011, S11: s1011 };
    return app.sloSummaryText(app.summarizeFreshness(await app.readFreshness(fakeClient(states), { now: NOW })));
  };
  test("S10, S11 chưa có dữ liệu → đếm vào tổng, không vào số đạt", async () => {
    assert.equal(await tom("none"), `${cacMaKhac.length}/${cacMaKhac.length + 2} nguồn đạt SLO`);
  });
  test("S10, S11 tươi → đủ", async () => {
    assert.equal(await tom("fresh"), `${cacMaKhac.length + 2}/${cacMaKhac.length + 2} nguồn đạt SLO`);
  });
});

describe("định nghĩa độ tươi app ↔ CLI (AU6)", () => {
  test("SL-AC-1 hằng + SQL hai bản bằng nhau", async () => {
    // NK1: nhịp không còn là hằng — hai bản cùng câu đọc sổ, cùng khuôn bảng nạp, cùng lỗi thiếu cột.
    assert.equal(norm(app.REGISTRY_SQL), norm(cli.REGISTRY_SQL));
    assert.equal(String(app.STG_TEN), String(cli.STG_TEN));
    assert.equal(app.LOI_122, cli.LOI_122);
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
    // NK1: nhịp đọc từ sổ, nên đột biến là bản TS đọc sai nhịp riêng cho S03 (2 giờ thay cho cadence_hours).
    const mutated = src.replace("const sloHours = cadence ?? null", 'const sloHours = code === "S03" ? 2 : (cadence ?? null)');
    assert.notEqual(mutated, src, "không tìm thấy chỗ đột biến — bản sao không đổi gì");
    const copy = path.join(dir, "freshness.ts");
    writeFileSync(copy, mutated);
    const bad = await import(pathToFileURL(copy).href);
    const s03 = (await bad.readFreshness(fakeClient(MATRIX[0][1]), { now: NOW })).find((r) => r.code === "S03");
    assert.equal(s03.sloHours, 2, "bản sao đột biến phải thật sự được nạp");
    const problems = await parityProblems(bad, cli);
    assert.ok(problems.some((p) => p.startsWith("S03")), `ca đỏ phải nêu S03, được: ${problems.join(" | ")}`);
    assert.ok(problems.every((p) => p.startsWith("S03") || p.startsWith("ca «")), `chỉ S03 được lệch: ${problems.join(" | ")}`);
  });
});


// NK1 so-nguon-kho-khai-bao AC-2: không bản nào còn hằng nhịp — chỗ ghi nhịp duy nhất là migration 122.
const HANG_NHIP = /\bSLO_HOURS\b|\bS\d{2}["']?\s*:\s*\d+\b/g;
/** Chỗ còn ghi nhịp trong mã (bỏ chú thích) và bản không đọc cadence_hours — mỗi mục gọi tên tệp. */
function hangNhipLoi(tep) {
  const out = [];
  for (const [ten, src] of tep) {
    const ma = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    const hit = ma.match(HANG_NHIP);
    if (hit) out.push(`${ten}: còn hằng nhịp ${hit.join(", ")}`);
    if (!ma.includes("cadence_hours")) out.push(`${ten}: không đọc cadence_hours`);
  }
  return out;
}
describe("NK-AC-2 một nguồn nhịp", () => {
  const HAI = [["scripts/lib/freshness.mjs", readFileSync(path.join(REPO, "scripts/lib/freshness.mjs"), "utf8")], ["app/src/lib/freshness.ts", readFileSync(APP_TS, "utf8")]];
  test("NK-AC-2 hai bản không còn hằng nhịp: nhịp đọc từ cadence_hours", () => {
    assert.deepEqual(hangNhipLoi(HAI), []);
    assert.ok(!("SLO_HOURS" in cli) && !("SLO_HOURS" in app), "còn xuất SLO_HOURS");
  });
  test("chiều đỏ NK-AC-2: cấy lại hằng nhịp vào bản app thì bắt, gọi tên tệp", () => {
    const cay = [[HAI[0][0], HAI[0][1]], [HAI[1][0], HAI[1][1] + "\nexport const SLO_HOURS = { S05: 96 }\n"]];
    assert.deepEqual(hangNhipLoi(cay), ["app/src/lib/freshness.ts: còn hằng nhịp SLO_HOURS, S05: 96"]);
  });
});

// ON17 (07/11): bản thu lẻ dán `vn-hcmc` không được thành ô «quá hạn» riêng khi vùng thật dán `hcmc` vẫn thu đều.
describe("ON17 gộp nhãn thành phố vn-<tp> vào <tp>", () => {
  const rows = [
    { city: "hcmc", last: ago(3) },
    { city: "vn-hcmc", last: ago(109) },
    { city: "vn", last: ago(354) },
    { city: "vn-da-nang", last: ago(2) },
  ];
  test("lấy lần thu mới nhất mỗi nơi; nhãn quốc gia giữ nguyên", () => {
    const by = Object.fromEntries(cli.gopThanhPho(rows).map((r) => [r.city, r.last]));
    assert.deepEqual(Object.keys(by).sort(), ["da-nang", "hcmc", "vn"]);
    assert.equal(by.hcmc, ago(3));
    assert.equal(by.vn, ago(354));
  });
  test("bản app và bản CLI cho cùng kết quả", () => {
    assert.deepEqual(app.gopThanhPho(rows), cli.gopThanhPho(rows));
  });
});
