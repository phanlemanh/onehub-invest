#!/bin/bash
# AC-1: không mã đang theo dõi nào gọi `worktree prune` (chuỗi lệnh lẫn mảng đối số). Đối chứng dương: bộ soát bắt cả hai
# dạng trên tệp mẫu. Đầu dò của chính hồ sơ này chứa mẫu nên được loại trừ.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
MAU='worktree[^A-Za-z0-9]{0,6}prune'
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
printf '%s\n' 'git(REPO, "worktree", "prune");' > "$TAM/a.mjs"
printf '%s\n' 'git -C "$ROOT" worktree prune' > "$TAM/b.sh"
bat=$(grep -lE "$MAU" "$TAM/a.mjs" "$TAM/b.sh" | wc -l | tr -d ' ')
echo "doi chung: bat $bat/2 dang mau"
[ "$bat" = 2 ] || { echo "DOI CHUNG KHONG BAT"; exit 1; }
tep=$(git ls-files -- '*.mjs' '*.js' '*.cjs' '*.ts' '*.tsx' '*.sh' '*.py' | grep -v '^_acceptance/test-khong-prune-worktree/probes/')
n=$(printf '%s\n' "$tep" | grep -c .)
echo "da soat $n tep ma"
[ "$n" -ge 100 ] || { echo "QUA IT TEP ($n)"; exit 1; }
trung=$(printf '%s\n' "$tep" | tr '\n' '\0' | xargs -0 grep -nE "$MAU" 2>/dev/null)
if [ -n "$trung" ]; then printf '%s\n' "$trung" | sed 's/^/CON PRUNE /'; exit 1; fi
echo "khong con worktree prune"
echo "SOAT OK"
