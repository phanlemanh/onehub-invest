// _quet.mjs — quét khoá theo git diff, không có danh sách tệp viết tay. Dùng chung cho `that-chi-doc` và `do-nhom-hai-lan`. Chỉ trả số, không in khoá.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

/** Commit gộp PR #315 của hồ sơ nhom-dang-ky-hai-lan-s03. */
export const MERGE_315 = "d10ffcc0"
export const DAY_315 = `${MERGE_315}^1..${MERGE_315}`

const git = (root, ...a) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8", maxBuffer: 1 << 28 })
const dong = (s) => s.split("\n").filter(Boolean)
const chuaCommitCua = (root) => [...dong(git(root, "diff", "--name-only", "--diff-filter=d", "HEAD")), ...dong(git(root, "ls-files", "-o", "--exclude-standard"))]

/** Dải từ điểm rẽ với nhánh chính tới HEAD. */
export const dayNhanh = (root) => `${git(root, "merge-base", "HEAD", "origin/main").trim()}..HEAD`

/** Tệp đổi trong các dải `git diff`, bỏ tệp đã xoá; `chuaCommit` thêm tệp đổi chưa commit và tệp chưa theo dõi. Rỗng thì ném: thước không được xanh vì không có gì để quét. */
export function tepTheoDiff(root, day, { chuaCommit = false } = {}) {
  const ds = new Set(day.flatMap((r) => dong(git(root, "diff", "--name-only", "--diff-filter=d", r))))
  if (chuaCommit) for (const f of chuaCommitCua(root)) ds.add(f)
  if (ds.size === 0) throw new Error("danh sach tep rong")
  return [...ds].sort()
}

/** Tệp nhánh này thêm mới so với nhánh chính, gồm tệp chưa theo dõi. */
export function tepThemMoi(root) {
  return [...new Set([...dong(git(root, "diff", "--name-only", "--diff-filter=A", dayNhanh(root))), ...dong(git(root, "ls-files", "-o", "--exclude-standard"))])].sort()
}

export const demKhop = (chu, khoa) => khoa.reduce((n, k) => n + (chu.includes(k) ? 1 : 0), 0)

/** Tổng số khoá khớp trên các tệp còn trên đĩa. */
export function quetTep(root, tep, khoa) {
  return tep.reduce((n, f) => {
    const d = path.join(root, f)
    return existsSync(d) && statSync(d).isFile() ? n + demKhop(readFileSync(d, "utf8"), khoa) : n
  }, 0)
}
