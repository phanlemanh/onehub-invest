// Gỡ ĐÚNG MỘT worktree tạm khỏi kho — không bao giờ dùng lệnh prune của git: prune quét mọi worktree của kho dùng chung và gỡ
// metadata của phiên khác khi thư mục của nó đang vắng (hồ sơ test-khong-prune-worktree).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import path from "node:path";

const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** Thư mục quản trị `<git-common-dir>/worktrees/<tên>` có tệp gitdir trỏ về `<wt>/.git` (đường dựng hoặc đường thật). */
export function adminCuaWorktree(repo, wt, duongThat = "") {
  const goc = path.join(path.resolve(repo, git(repo, "rev-parse", "--git-common-dir").trim()), "worktrees");
  if (!existsSync(goc)) return "";
  const dich = new Set([path.join(wt, ".git")]);
  if (duongThat) dich.add(path.join(duongThat, ".git"));
  for (const ten of readdirSync(goc)) {
    let tro = "";
    try {
      tro = readFileSync(path.join(goc, ten, "gitdir"), "utf8").trim();
    } catch {
      continue;
    }
    if (dich.has(tro)) return path.join(goc, ten);
  }
  return "";
}

/**
 * `git worktree remove --force`; lỗi (vd worktree bị lock) → xoá thư mục cây và CHỈ thư mục quản trị của chính nó.
 * Trả "remove" | "du-phong" | "khong-thay" để test chứng nhánh nào đã chạy.
 */
export function boWorktree(repo, wt) {
  let duongThat = "";
  try {
    duongThat = realpathSync(wt);
  } catch {}
  try {
    git(repo, "worktree", "remove", "--force", wt);
    return "remove";
  } catch {}
  let admin = "";
  // >>> du-phong — gỡ đúng mục quản trị của wt; không prune cả kho
  admin = adminCuaWorktree(repo, wt, duongThat);
  rmSync(wt, { recursive: true, force: true });
  if (admin) rmSync(admin, { recursive: true, force: true });
  // <<< du-phong
  return admin ? "du-phong" : "khong-thay";
}
