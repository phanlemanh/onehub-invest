// node --test scripts/bo-worktree.test.mjs
// Hồ sơ test-khong-prune-worktree (AC-2): boWorktree gỡ đúng worktree tạm của mình; worktree «của phiên khác» có thư mục
// đang vắng giữ nguyên metadata. Kho git THẬT trong thư mục tạm. Ma trận: kho {chính, worktree liên kết — `.git` là tệp} ×
// gỡ {lỗi thật — worktree bị lock nên `remove --force` trả mã ≠ 0; thành công}; worktree tạm nằm dưới đường symlink (đường
// dựng khác đường thật git ghi). Không đụng kho thật.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { boWorktree } from "./lib/bo-worktree.mjs";

const git = (cwd, ...a) =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@local.test", "-C", cwd, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const roots = [];
after(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

/** gitdir của mọi mục quản trị worktree trong kho chính `k`. */
function gitdirs(k) {
  const goc = path.join(k, ".git", "worktrees");
  if (!existsSync(goc)) return [];
  return readdirSync(goc).map((ten) => readFileSync(path.join(goc, ten, "gitdir"), "utf8").trim());
}

function dung(kieuKho) {
  const T = realpathSync(mkdtempSync(path.join(tmpdir(), "bo-worktree-")));
  roots.push(T);
  const K = path.join(T, "kho");
  mkdirSync(K);
  git(K, "init", "-q");
  writeFileSync(path.join(K, "a"), "x\n");
  git(K, "add", "a");
  git(K, "commit", "-qm", "a");
  let repo = K;
  if (kieuKho === "lienket") {
    repo = path.join(T, "repo-wt");
    git(K, "worktree", "add", "-q", "--detach", repo, "HEAD");
  }
  const khac = path.join(T, "khac");
  git(repo, "worktree", "add", "-q", "--detach", khac, "HEAD");
  rmSync(khac, { recursive: true, force: true }); // phiên khác: thư mục đang vắng — đúng loại mà prune sẽ gỡ
  mkdirSync(path.join(T, "thuc", "tmp"), { recursive: true });
  symlinkSync(path.join(T, "thuc"), path.join(T, "lk"));
  const wt = path.join(T, "lk", "tmp", "wt"); // đường dựng qua symlink
  git(repo, "worktree", "add", "-q", "--detach", wt, "HEAD");
  return { T, K, repo, khac, wt };
}

for (const kieuKho of ["chinh", "lienket"]) {
  for (const go of ["loi", "ok"]) {
    test(`BW-AC-2 kho ${kieuKho}, remove ${go}: gỡ đúng worktree tạm, worktree của phiên khác còn metadata`, () => {
      const { T, K, repo, khac, wt } = dung(kieuKho);
      if (go === "loi") {
        git(repo, "worktree", "lock", wt);
        const r = spawnSync("git", ["-C", repo, "worktree", "remove", "--force", wt], { encoding: "utf8" });
        console.log(`# remove loi that: rc=${r.status}`);
        assert.notEqual(r.status, 0, "worktree bị lock mà remove --force vẫn thành công — ca lỗi không chứng nhánh dự phòng");
      }
      const ket = boWorktree(repo, wt);
      const ds = gitdirs(K);
      assert.ok(ds.includes(path.join(khac, ".git")), `worktree của phiên khác bị gỡ metadata — còn lại: ${ds.join(", ")}`);
      assert.equal(ket, go === "loi" ? "du-phong" : "remove", `nhánh đã chạy: ${ket}`);
      const thuc = path.join(T, "thuc", "tmp", "wt", ".git");
      assert.ok(!ds.includes(path.join(wt, ".git")) && !ds.includes(thuc), `worktree tạm còn metadata: ${ds.join(", ")}`);
      assert.ok(!existsSync(path.join(T, "thuc", "tmp", "wt")), "thư mục worktree tạm còn trên đĩa");
    });
  }
}
