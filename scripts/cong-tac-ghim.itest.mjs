// node --test scripts/cong-tac-ghim.itest.mjs — cần DB local :5433 (chạy lại ca thử công tắc của app; ngoài CI).
// Hồ sơ _acceptance/cong-tac-test-ghim-ban-cu, ca «GB-AC-n»: ca thử công tắc đối chứng với bản route trước sửa đã GHIM
// thành fixture, nên vẫn xanh khi «origin/main» đã là route mới. Mô phỏng sau-gộp bằng một `git` giả đứng đầu PATH.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "app");
const TEST = "app/tests/cong-tac-nhom-go.test.tsx";
const FIXTURE = "app/tests/fixtures/source-groups-route.truoc-cong-tac.ts.txt";
const ROUTE = "app/src/app/api/v1/ops/source-groups/route.ts";
const GOC_142 = "8fc9603d"; // gốc của PR #142 (main sau PL12) — bản route trước sửa
const DINH_142 = "f036fcb7"; // đỉnh PR #142 — bản ca thử còn đọc origin/main

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });
const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Chạy ca thử công tắc trong app với một `git` giả in route HIỆN TẠI cho mọi `git show …` (origin/main sau gộp). */
function chayVoiGitGia(tepTest) {
  const thu = mkdtempSync(path.join(tmpdir(), "gb-git-"));
  const that = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
  writeFileSync(path.join(thu, "git"), `#!/bin/sh\nif [ "$1" = show ]; then cat '${path.join(ROOT, ROUTE)}'; else exec '${that}' "$@"; fi\n`);
  chmodSync(path.join(thu, "git"), 0o755);
  const env = { ...process.env, PATH: `${thu}${path.delimiter}${process.env.PATH}` };
  delete env.NODE_TEST_CONTEXT; // tiến trình con chạy node --test riêng, in khuôn spec thường
  try {
    const r = spawnSync("node", ["--import", "tsx", "--test", "--test-reporter=spec", tepTest], { cwd: APP, env, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout}\n${r.stderr}` };
  } finally {
    rmSync(thu, { recursive: true, force: true });
  }
}

test("GB-AC-1 ca thử không đọc ref nhánh lúc chạy; fixture là đúng bản route ở gốc #142; đối chứng: bản ở đỉnh #142 bị bắt", () => {
  const cam = ["origin/main", "merge-base", 'execFileSync("git"', "git show"];
  const vanBan = readFileSync(path.join(ROOT, TEST), "utf8");
  assert.deepEqual(cam.filter((c) => vanBan.includes(c)), []);
  assert.equal(sha(readFileSync(path.join(ROOT, FIXTURE), "utf8")), sha(git("show", `${GOC_142}:${ROUTE}`)));
  // đối chứng dương: phép soát bắt được chính bản ca thử còn đọc origin/main
  assert.ok(cam.filter((c) => git("show", `${DINH_142}:${TEST}`).includes(c)).includes("origin/main"));
});

test("GB-AC-2 git giả trả route mới cho origin/main: ca thử sau sửa 5/5 xanh; đối chứng: bản ca thử ở đỉnh #142 đỏ ở CT-AC-1/2", () => {
  const moi = chayVoiGitGia("tests/cong-tac-nhom-go.test.tsx");
  assert.equal(moi.code, 0, moi.out);
  assert.match(moi.out, /ℹ pass 5\b/);
  assert.match(moi.out, /ℹ fail 0\b/);

  const banCu = path.join(APP, "tests", `.gb-cu-${process.pid}.test.tsx`);
  writeFileSync(banCu, git("show", `${DINH_142}:${TEST}`));
  try {
    const cu = chayVoiGitGia(path.relative(APP, banCu));
    assert.notEqual(cu.code, 0, cu.out);
    const hong = cu.out.slice(cu.out.lastIndexOf("failing tests:"));
    assert.ok(hong.includes("CT-AC-1") || hong.includes("CT-AC-2"), cu.out);
  } finally {
    rmSync(banCu, { force: true });
  }
});
