#!/bin/bash
# PreToolUse (Edit|Write|MultiEdit|NotebookEdit) — chặn sửa những thứ bất biến.
#   1. Migration đã commit trong db/migrations/  → phải tạo migration mới (luật #2)
#   2. Raw snapshots / profile đăng nhập AirDNA   → bất biến / chứa cookie (luật #1)
# Exit 2 = chặn, stderr được đưa lại cho Claude làm lý do.
set -uo pipefail

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")
[ -z "$file" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
rel="${file#"$root"/}"
# Gốc theo kho chứa tệp, không theo phiên: phiên có thể sửa tệp ở worktree khác. show-toplevel trả đường thật nên đường
# tệp cũng phải về đường thật (symlink ~/dev/one-invest). Thư mục chưa có hoặc ngoài git → giữ đường trên.
dir=$(cd "$(dirname "$file")" 2>/dev/null && pwd -P)
file_root=$([ -n "$dir" ] && git -C "$dir" rev-parse --show-toplevel 2>/dev/null)
if [ -n "$file_root" ]; then
  root="$file_root"
  real_file="$dir/$(basename "$file")"
  rel="${real_file#"$root"/}"
fi

case "$rel" in
  */snapshots/*|snapshots/*)
    echo "Chặn: raw snapshot là BẤT BIẾN (AGENTS.md luật #1). Sửa cách diễn giải ở pipeline/, không sửa snapshot." >&2
    exit 2 ;;
  *.airdna-profile/*)
    echo "Chặn: .airdna-profile/ là profile đăng nhập (chứa cookie) — không đọc/sửa." >&2
    exit 2 ;;
  db/migrations/*.sql)
    if git -C "$root" cat-file -e "HEAD:$rel" 2>/dev/null; then
      echo "Chặn: $rel đã commit. Schema chỉ đổi qua migration MỚI (số kế tiếp) — dùng /new-migration. Nếu thật sự cần sửa migration cũ, hỏi user." >&2
      exit 2
    fi ;;
esac
exit 0
