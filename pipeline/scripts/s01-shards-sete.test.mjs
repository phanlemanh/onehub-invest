import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 3110-7 vòng 4: khuôn gán SHARDS chạy dưới `set -euo pipefail` — node lỗi phải
// KHÔNG làm cả script thoát; || RC=$? bắt lỗi, SHARDS rỗng, query thành phố chạy tiếp.
const khuon = (f) => `
set -euo pipefail
PIPELINE_DIR="${tmpdir()}"
CITY="hanoi"
SHARDS_ERR="$(mktemp)"
RC_SHARDS=0
SHARDS="$(node "${f}" 2>"$SHARDS_ERR" | head -1)" || RC_SHARDS=$?
if [ $RC_SHARDS -ne 0 ]; then
  echo "CANH-BAO rc=$RC_SHARDS"
  SHARDS=""
fi
echo "SHARDS=[$SHARDS]"
echo "TIEP-TUC"
`;

test("set -euo pipefail: node lỗi → script KHÔNG thoát, SHARDS rỗng, có cảnh báo, chạy tiếp", () => {
  const f = join(tmpdir(), "s01-shards-loi4-" + Date.now() + ".mjs");
  writeFileSync(f, 'console.error("ECONNREFUSED"); process.exit(3);');
  const sh = join(tmpdir(), "khuon4-" + Date.now() + ".sh");
  writeFileSync(sh, khuon(f));
  const r = spawnSync("bash", [sh], { encoding: "utf8" });
  assert.equal(r.status, 0, `script phải thoát 0 (không chết theo set -e), được ${r.status}: ${r.stderr.slice(0, 120)}`);
  assert.ok(r.stdout.includes("CANH-BAO rc=3"), "có dòng cảnh báo");
  assert.ok(r.stdout.includes("SHARDS=[]"), "SHARDS rỗng");
  assert.ok(r.stdout.includes("TIEP-TUC"), "script chạy tới dòng sau — query thành phố vẫn được");
  rmSync(f, { force: true }); rmSync(sh, { force: true });
});

test("set -euo pipefail: node OK (có stderr cảnh báo) → SHARDS đúng stdout, không cảnh báo", () => {
  const f = join(tmpdir(), "s01-shards-ok4-" + Date.now() + ".mjs");
  writeFileSync(f, 'console.error("Warning: deprecation"); console.log("CauGiay");');
  const sh = join(tmpdir(), "khuon4-ok-" + Date.now() + ".sh");
  writeFileSync(sh, khuon(f));
  const r = spawnSync("bash", [sh], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes("SHARDS=[CauGiay]"), "SHARDS đúng stdout, không dính cảnh báo");
  assert.ok(!r.stdout.includes("CANH-BAO"), "không cảnh báo khi rc=0");
  assert.ok(r.stdout.includes("TIEP-TUC"));
  rmSync(f, { force: true }); rmSync(sh, { force: true });
});
