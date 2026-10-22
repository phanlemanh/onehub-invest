#!/bin/bash
# Stop — trước khi Claude kết thúc lượt: kiểm kiểu các file TS/JS vừa đổi.
#   - Module TS (app, collector, data-api, agent): tsc --noEmit, CHỈ báo lỗi nằm
#     trong file đã đổi (lỗi tồn đọng chỗ khác không chặn).
#   - .mjs (pipeline/, scripts/): node --check từng file.
#   - app/src/**/*.{ts,tsx}: eslint (luật onehub-ui chặn tự vẽ tay) trên đúng các file vừa đổi.
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

# Lint UI (onehub-ui) — chỉ các file app/src còn tồn tại, đường dẫn tương đối theo app/.
# Lưu ý: bash 3.2 (macOS) không có mapfile → dựng mảng bằng vòng while.
lint_files=()
while read -r f; do
  case "$f" in app/src/*.ts|app/src/*.tsx) ;; *) continue ;; esac
  [ -f "$f" ] && lint_files+=("${f#app/}")
done <<<"$changed"
if [ "${#lint_files[@]}" -gt 0 ]; then
  if [ ! -x app/node_modules/.bin/eslint ]; then
    report+="[app] bỏ qua lint UI — chưa cài node_modules (cd app && npm install)."$'\n'
  else
    lint_out=$(cd app && ./node_modules/.bin/eslint "${lint_files[@]}" 2>&1)
    lint_rc=$?
    # eslint thoát khác 0 (có lỗi, hoặc suppressions chưa prune ở file vừa đổi) kèm output → chặn.
    # Chỉ cảnh báo (warning) thì exit 0 → không chặn.
    if [ "$lint_rc" -ne 0 ] && [ -n "$lint_out" ]; then
      report+="[app] lỗi lint UI trong file vừa đổi:"$'\n'"$lint_out"$'\n'
    fi
  fi
fi

while read -r f; do
  case "$f" in pipeline/*.mjs|pipeline/*/*.mjs|scripts/*.mjs) ;; *) continue ;; esac
  [ -f "$f" ] || continue
  err=$(node --check "$f" 2>&1) || report+="[node --check] $f"$'\n'"$err"$'\n'
done <<<"$changed"

# Chỉ dòng "bỏ qua" (typecheck/lint) thì không chặn
blocking=$(sed '/^$/d' <<<"$report" | grep -Ev 'bỏ qua (typecheck|lint)')
if [ -n "$blocking" ]; then
  echo "$report" >&2
  exit 2
fi
exit 0
