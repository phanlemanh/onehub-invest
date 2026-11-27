// thay-nguon-hook.test.mjs — PL36: hai rào của hook thay nguồn (pipeline/tests/thay-nguon-hook.mjs), GS phán 27/11.
// Rào 1: hook chỉ nạp khi tiến trình được gọi với NODE_OPTIONS="--import <hook>" (probe đặt cho riêng lệnh con), không có
//        trong npm script hay lệnh suite thường.
// Rào 2: không đặt biến thì không thay gì — thiếu --import thì hook không nạp; có --import mà thiếu THAY_NGUON_* thì không đăng ký.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOOK = fileURLToPath(new URL("../tests/thay-nguon-hook.mjs", import.meta.url));
const PIPE = fileURLToPath(new URL("..", import.meta.url));

function chay(env) {
  const dir = mkdtempSync(path.join(tmpdir(), "thay-nguon-"));
  try {
    const a = path.join(dir, "a.mjs"), b = path.join(dir, "b.mjs");
    writeFileSync(a, "export const v = 'goc';\n"); writeFileSync(b, "export const v = 'thay';\n");
    const e = { ...process.env, NODE_OPTIONS: "" , THAY_NGUON_GOC: "", THAY_NGUON_TEP: "" };
    for (const [k, v] of Object.entries(env(a, b))) e[k] = v;
    const r = spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(a).href)}); console.log(m.v);`], { env: e, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("hook-nap-va-dat-bien-thi-thay-nguon", () => {
  assert.equal(chay((a, b) => ({ NODE_OPTIONS: `--import ${HOOK}`, THAY_NGUON_GOC: a, THAY_NGUON_TEP: b })), "thay");
});
test("khong-import-hook-thi-khong-thay-du-co-bien", () => {
  assert.equal(chay((a, b) => ({ THAY_NGUON_GOC: a, THAY_NGUON_TEP: b })), "goc", "thiếu --import mà vẫn thay nguồn: hook bị nạp ngoài ý muốn");
});
test("import-hook-ma-thieu-bien-thi-khong-thay", () => {
  assert.equal(chay(() => ({ NODE_OPTIONS: `--import ${HOOK}` })), "goc", "có --import, thiếu THAY_NGUON_* mà vẫn thay nguồn");
});
test("npm-script-khong-nap-hook", () => {
  const { scripts } = JSON.parse(readFileSync(path.join(PIPE, "package.json"), "utf8"));
  const co = Object.entries(scripts ?? {}).filter(([, s]) => /thay-nguon-hook|THAY_NGUON/.test(s)).map(([k]) => k);
  assert.deepEqual(co, [], `npm script nạp hook thay nguồn: ${co.join(", ")}`);
});
