// do-phut-s4.test.mjs — hồ sơ db-thu-tach-khoi-cum-that E8. Mẫu: dòng s4 rút nguyên văn từ su-kien.jsonl thật của đợt
// dot0-cam-mau (23/11 12Z → 25/11 03:11:41Z), scripts/fixtures/su-kien-s4-2311-2511.jsonl.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.join(import.meta.dirname, "do-phut-s4.mjs");
const MAU = path.join(import.meta.dirname, "fixtures/su-kien-s4-2311-2511.jsonl");
const chay = (script, ...a) => spawnSync(process.execPath, [script, "--tep", MAU, "--json", ...a], { encoding: "utf8" });
const kq = (r) => { assert.equal(r.status, 0, r.stderr); return JSON.parse(r.stdout); };
const ghim = (r) => { const k = kq(r); if (k.n !== 15) throw new Error(`n khác 15: ${k.n}`); return k; };

test("mẫu thật 23/11 12Z → 25/11 03:11:41Z: n=15, trung vị 99, p75 174", () => {
  const k = ghim(chay(SCRIPT, "--tu", "2026-11-23T12:00:00Z", "--den", "2026-11-25T03:11:41.999Z"));
  assert.equal(Math.round(k.trung_vi), 99);
  assert.equal(Math.round(k.p75), 174);
  const r = spawnSync(process.execPath, [SCRIPT, "--tep", MAU, "--tu", "2026-11-23T12:00:00Z"], { encoding: "utf8" });
  assert.match(r.stdout, /n=15 · trung vị 99′ · p75 174′/);
});

test("cửa sổ rỗng → n=0, không trung vị giả", () => {
  const k = kq(chay(SCRIPT, "--tu", "2026-12-01T00:00:00Z"));
  assert.deepEqual(k, { n: 0, trung_vi: null, p75: null });
  const r = spawnSync(process.execPath, [SCRIPT, "--tep", MAU, "--tu", "2026-12-01T00:00:00Z"], { encoding: "utf8" });
  assert.match(r.stdout, /n=0/);
  assert.doesNotMatch(r.stdout, /trung vị \d/);
});

test("ca tay: lần cấp theo sau bởi thu-hoi thì mốc kết là thu-hoi", async () => {
  const { khoangCap } = await import(SCRIPT);
  const ev = [
    { luc: "2026-11-01T00:00:00Z", loai: "cap", tai_nguyen: "s4" },
    { luc: "2026-11-01T00:30:00Z", loai: "thu-hoi", tai_nguyen: "s4" },
    { luc: "2026-11-01T00:40:00Z", loai: "cap", tai_nguyen: "s4" },
    { luc: "2026-11-01T00:45:00Z", loai: "cap", tai_nguyen: "merge" },
    { luc: "2026-11-01T01:50:00Z", loai: "cap", tai_nguyen: "s4" },
  ];
  assert.deepEqual(khoangCap(ev), [30, 70]);
});

test("chiều đỏ: bản sao bỏ lọc cửa sổ --tu → ghim «n khác 15»", () => {
  const d = mkdtempSync(path.join(tmpdir(), "do-phut-s4-"));
  const ban = path.join(d, "do-phut-s4.mjs");
  const goc = readFileSync(SCRIPT, "utf8");
  const sua = goc.replace("(tu == null || t(e.luc) >= t(tu))", "true");
  assert.notEqual(sua, goc, "bản sao phải khác bản thật");
  writeFileSync(ban, sua);
  // Mẫu không có lần cấp nào trước 12Z 23/11: thêm một lần sớm hơn cửa sổ để bản bỏ lọc lộ ra.
  const mau2 = path.join(d, "mau.jsonl");
  writeFileSync(mau2, '{"luc":"2026-11-23T10:00:00Z","loai":"cap","tai_nguyen":"s4"}\n' + readFileSync(MAU, "utf8"));
  const r = spawnSync(process.execPath, [ban, "--tep", mau2, "--json", "--tu", "2026-11-23T12:00:00Z", "--den", "2026-11-25T03:11:41.999Z"], { encoding: "utf8" });
  assert.throws(() => ghim(r), /n khác 15/);
  const r2 = spawnSync(process.execPath, [SCRIPT, "--tep", mau2, "--json", "--tu", "2026-11-23T12:00:00Z", "--den", "2026-11-25T03:11:41.999Z"], { encoding: "utf8" });
  ghim(r2);
});
