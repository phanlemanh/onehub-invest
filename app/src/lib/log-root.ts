// Gốc đọc log job (ON16 `audit-all-doc-log-o-checkout`). Job launchd ghi pipeline/logs ở checkout chính; app chạy từ
// worktree thì thư mục log của worktree rỗng → trang Ops báo «Chưa kiểm được»/«Hỏng» giả. Cùng luật với
// scripts/audit-all.sh (LOG_ROOT): git báo thư mục git chung <X>/.git → gốc log <X>; git lỗi hay kho trần → chính cây.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/** Gốc cây đang chạy: Next chạy ở app/ — bỏ đuôi /app (cách suy cũ của collections-queries, ops-queries). */
export function treeRoot(cwd: string = process.cwd()): string {
  return cwd.endsWith("/app") ? path.resolve(cwd, "..") : cwd;
}

const cache = new Map<string, string>();

/** Thư mục chứa pipeline/logs: checkout chính khi cây là worktree, ngược lại chính cây. Một lần gọi git mỗi cwd. */
export function logRoot(cwd: string = process.cwd()): string {
  const tree = treeRoot(cwd);
  const hit = cache.get(tree);
  if (hit) return hit;
  let root = tree;
  try {
    const common = execFileSync("git", ["-C", tree, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (path.basename(common) === ".git" && existsSync(path.dirname(common))) root = path.dirname(common);
  } catch {
    /* không phải kho git, .git hỏng, checkout chính đã dời → đọc log của chính cây */
  }
  cache.set(tree, root);
  return root;
}

/** Thư mục log job (`<gốc log>/pipeline/logs`) — chỗ duy nhất dựng đường này phía app. */
export function logsDir(cwd: string = process.cwd()): string {
  return path.join(logRoot(cwd), "pipeline/logs");
}
