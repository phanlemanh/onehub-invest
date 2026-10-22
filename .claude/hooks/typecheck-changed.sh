#!/bin/bash
# Stop — trước khi Claude kết thúc lượt: kiểm kiểu các file TS/JS vừa đổi.
#   - Module TS (app, collector, data-api, agent): tsc --noEmit, CHỈ báo lỗi nằm
#     trong file đã đổi (lỗi tồn đọng chỗ khác không chặn).
#   - .mjs (pipeline/, scripts/): node --check từng file.
# Có lỗi → exit 2 để Claude sửa tiếp; lần dừng thứ hai (stop_hook_active) cho qua.
set -uo pipefail

input=$(cat)
[ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
cd "$root" || exit 0

changed=$( { git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null; } \
  | grep -E '\.(ts|tsx|mts|mjs)$' | sort -u)
[ -z "$changed" ] && exit 0

report=""

for mod in app collector data-api agent; do
  files=$(grep -E "^$mod/" <<<"$changed" | grep -E '\.(ts|tsx|mts)$' | while read -r f; do [ -f "$f" ] && echo "$f"; done)
  [ -z "$files" ] && continue
  if [ ! -x "$mod/node_modules/.bin/tsc" ]; then
    report+="[$mod] bỏ qua typecheck — chưa cài node_modules (cd $mod && npm install)."$'\n'
    continue
  fi
  out=$(cd "$mod" && ./node_modules/.bin/tsc --noEmit -p . 2>&1)
  # tsc in đường dẫn tương đối theo module: src/x.ts(1,2): error …
  hits=""
  while read -r f; do
    relf="${f#"$mod"/}"
    hits+=$(grep -F "$relf(" <<<"$out")$'\n'
  done <<<"$files"
  hits=$(sed '/^$/d' <<<"$hits")
  [ -n "$hits" ] && report+="[$mod] lỗi TypeScript trong file vừa đổi:"$'\n'"$hits"$'\n'
done

while read -r f; do
  case "$f" in pipeline/*.mjs|pipeline/*/*.mjs|scripts/*.mjs) ;; *) continue ;; esac
  [ -f "$f" ] || continue
  err=$(node --check "$f" 2>&1) || report+="[node --check] $f"$'\n'"$err"$'\n'
done <<<"$changed"

# Chỉ dòng "bỏ qua" thì không chặn
blocking=$(sed '/^$/d' <<<"$report" | grep -v 'bỏ qua typecheck')
if [ -n "$blocking" ]; then
  echo "$report" >&2
  exit 2
fi
exit 0
