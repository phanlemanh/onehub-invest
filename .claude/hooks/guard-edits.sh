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
