#!/bin/bash
# PreToolUse (Bash) — chỉ hỏi người ở chỗ ghi khó đảo, thay hai luật ask rộng cũ
# (`git push *`, `vercel *` hỏi cả push nhánh riêng và lệnh vercel chỉ đọc, kể cả bypass).
#   1. git push có đích main/master: `origin main`, `HEAD:main`, `refs/heads/main`, `+main`,
#      `:main`/--delete main, --all/--branches/--mirror, push không refspec khi nhánh hiện tại
#      hoặc upstream là main; mọi cờ force (deny `--force *` trong settings chỉ bắt khi cờ đứng đầu).
#   2. vercel / npx vercel ghi: lệnh trần (= deploy), deploy, --prod, promote, rollback, redeploy,
#      alias, rm, env add|rm|pull, domains add|rm, project rm, link, git connect|disconnect…
#      Chỉ ls/list/inspect/logs/whoami/help và `<nhóm> ls` được cho qua.
# Lệnh ghép (&&, ;, |, $(…), bash -c, heredoc vào shell) xét từng vế. Không chắc → hỏi.
# Phân tích ở guard-push-deploy.mjs; lớp này chỉ lọc nhanh + giữ fail-closed khi node hỏng.
# Trả JSON permissionDecision "ask" (không chặn, không tự cho phép); im lặng = luật quyền thường quyết.
set -uo pipefail

input=$(cat)
# Đường nhanh: lệnh không nhắc push/vercel thì không cần node.
grep -qE 'push|vercel' <<<"$input" || exit 0

ask() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Cổng onehub: %s (guard-push-deploy)."}}\n' "$1"
  exit 0
}

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
command -v node >/dev/null 2>&1 || ask "không có node để phân tích lệnh push/vercel"
out=$(node "$dir/guard-push-deploy.mjs" <<<"$input" 2>/dev/null) || ask "hook phân tích lỗi"
[ -n "$out" ] && printf '%s\n' "$out"
exit 0
