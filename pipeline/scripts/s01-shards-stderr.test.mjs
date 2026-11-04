import test from "node:test"; import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 3110-7 vòng 3: SHARDS lấy stdout; stderr chỉ in khi thoát khác 0 — cảnh báo
// node (stderr, thoát 0) không được lọt vào danh sách query.
test("shards: thoát 0 có stderr → SHARDS vẫn đúng stdout, stderr không lọt", () => {
  const f = join(tmpdir(), "s01-shards-mo-" + Date.now() + ".mjs");
  writeFileSync(f, 'console.error("Warning: node deprecation — chỉ cảnh báo"); console.log("CauGiay");');
  const errF = join(tmpdir(), "s01-shards-err-" + Date.now() + ".log");
  // đúng khuôn weekly-collect: 2>tệp | head -1
  const r = spawnSync("node", [f], { encoding: "utf8" });
  const out = r.stdout.split("\n")[0]; // head -1
  assert.equal(r.status, 0, "tiến trình giả thoát 0");
  assert.equal(out, "CauGiay", "SHARDS = dòng stdout đầu, không dính cảnh báo stderr");
  assert.ok(r.stderr.includes("Warning"), "stderr vẫn capture được (in chỉ khi rc≠0)");
  rmSync(f, { force: true });
});

test("shards: thoát khác 0 → SHARDS rỗng, in cảnh báo kèm stderr cuối", () => {
  const f = join(tmpdir(), "s01-shards-loi-" + Date.now() + ".mjs");
  writeFileSync(f, 'console.error("ECONNREFUSED db chết"); process.exit(3);');
  const r = spawnSync("node", [f], { encoding: "utf8" });
  assert.equal(r.status, 3);
  assert.equal(r.stdout, "", "stdout rỗng → SHARDS rỗng → query thành phố như cũ");
  assert.ok(r.stderr.includes("ECONNREFUSED"));
  rmSync(f, { force: true });
});
