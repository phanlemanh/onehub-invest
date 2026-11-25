// s06-tran-trang E1 — trần trang mặc định của bộ thu S06.
// Rút NGUYÊN hàm argPages() từ pipeline/collect-chotot.mjs (đường suy từ vị trí tệp) rồi gọi nó với argv/env
// giả: không cờ, không biến → 210; CHOTOT_MAX_PAGES=7 → 7; --pages 3 → 3 (cờ thắng biến).
// Chiều đỏ: đổi mặc định về "25" thì ca đầu đỏ với thông điệp «mặc định phải là 210».
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const nguon = readFileSync(join(REPO, "pipeline", "collect-chotot.mjs"), "utf8");
const m = nguon.match(/function argPages\(\) \{[\s\S]*?\n\}/);
assert.ok(m, "không tìm thấy hàm argPages() trong collect-chotot.mjs");
const goi = (argv, env) => new Function("process", `${m[0]}\nreturn argPages();`)({ argv: ["node", "x", ...argv], env });

test("không cờ, không biến → mặc định 210", () => {
  assert.equal(goi([], {}), 210, "mặc định phải là 210");
});
test("CHOTOT_MAX_PAGES=7 → 7", () => {
  assert.equal(goi([], { CHOTOT_MAX_PAGES: "7" }), 7);
});
test("--pages 3 thắng CHOTOT_MAX_PAGES", () => {
  assert.equal(goi(["--pages", "3"], { CHOTOT_MAX_PAGES: "7" }), 3);
});
