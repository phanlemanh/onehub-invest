// node --test pipeline/scripts/vong-doi.test.mjs (cd pipeline && npm test)
// TV2a `vong-doi-nguon` AC-4: luật chạy isRunnable trên ma trận viết trước 7 nguồn × 7 đơn vị = 49 ô. Thuần, không DB.
// Ca DB của hồ sơ ở vong-doi.itest.mjs (ngoài npm test).
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { TRANG_THAI, isRunnable } from "../lib/vong-doi.mjs";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "vong-doi.mjs");
const VANG = Symbol("vắng"); // không hỏi đơn vị
const NGUON = ["draft", "active", "paused", "retired", "completed", "xyz", null];
const DON_VI = [VANG, "draft", "active", "paused", "retired", "completed", "xyz"];
const CHAN = ["draft", "paused", "retired", "completed"];

// Kỳ vọng viết tay từng ô — không suy từ hàm đang đo.
const BANG = [
  ...DON_VI.map((u) => ["draft", u, false, "nguon-draft"]),
  ["active", VANG, true, "chay"],
  ["active", "draft", false, "don-vi-draft"],
  ["active", "active", true, "chay"],
  ["active", "paused", false, "don-vi-paused"],
  ["active", "retired", false, "don-vi-retired"],
  ["active", "completed", false, "don-vi-completed"],
  ["active", "xyz", false, "trang-thai-la:don-vi"],
  ...DON_VI.map((u) => ["paused", u, false, "nguon-paused"]),
  ...DON_VI.map((u) => ["retired", u, false, "nguon-retired"]),
  ...DON_VI.map((u) => ["completed", u, false, "nguon-completed"]),
  ...DON_VI.map((u) => ["xyz", u, false, "trang-thai-la:nguon"]),
  ...DON_VI.map((u) => [null, u, false, "nguon-khong-co"]),
];

const goi = (fn, n, u) => fn(n === null ? null : { code: "S0A", status: n }, u === VANG ? undefined : { status: u });
const nhan = (n, u) => `(${n}, ${u === VANG ? "vắng" : u})`;

test("VD-AC-4 isRunnable: đủ 49 ô nguồn × đơn vị, đúng hai ô chạy", () => {
  assert.equal(BANG.length, 49, "bảng viết trước phải đủ 7 × 7 ô");
  assert.deepEqual([...TRANG_THAI], ["draft", "active", "paused", "retired", "completed"]);
  for (const n of NGUON) for (const u of DON_VI) assert.ok(BANG.some((r) => r[0] === n && r[1] === u), `thiếu ô ${nhan(n, u)}`);
  let chay = 0;
  for (const [n, u, run, ly_do] of BANG) {
    const kq = goi(isRunnable, n, u);
    assert.deepEqual(kq, { run, ly_do }, `ô ${nhan(n, u)}`);
    if (kq.run) chay++;
  }
  assert.equal(chay, 2);
  for (const tt of CHAN) assert.equal(goi(isRunnable, "active", tt).ly_do, `don-vi-${tt}`);
});

test("VD-AC-4 isRunnable: hỏi đơn vị mà không có dòng → don-vi-khong-co; nguồn chặn trước", () => {
  assert.deepEqual(isRunnable({ code: "S0A", status: "active" }, null), { run: false, ly_do: "don-vi-khong-co" });
  assert.deepEqual(isRunnable({ code: "S0A", status: "paused" }, null), { run: false, ly_do: "nguon-paused" });
  assert.deepEqual(isRunnable({ code: "S0A", status: "Active" }), { run: false, ly_do: "trang-thai-la:nguon" });
  assert.deepEqual(isRunnable({ code: "S0A", status: null }), { run: false, ly_do: "trang-thai-la:nguon" });
});

test("VD-AC-4b đột biến ghim: completed qua cổng nguồn như active → đúng 7 ô nguồn completed lệch", async () => {
  const GOC = 'const NGUON_CHAY = new Set(["active"]);';
  const src = readFileSync(LIB, "utf8");
  assert.ok(src.includes(GOC), `vong-doi.mjs phải có chuỗi ghim ${GOC}`);
  const dir = mkdtempSync(path.join(tmpdir(), "vd-dot-bien-"));
  const dich = path.join(dir, "vong-doi.mjs");
  writeFileSync(dich, src.replace(GOC, 'const NGUON_CHAY = new Set(["active", "completed"]);'));
  const { isRunnable: dotBien } = await import(pathToFileURL(dich).href);
  const lech = BANG.filter(([n, u, run, ly_do]) => {
    const kq = goi(dotBien, n, u);
    return kq.run !== run || kq.ly_do !== ly_do;
  }).map(([n, u]) => nhan(n, u));
  assert.deepEqual(lech, DON_VI.map((u) => nhan("completed", u)), "đột biến cho 'completed' chạy phải làm lệch đúng 7 ô nguồn completed");
});
