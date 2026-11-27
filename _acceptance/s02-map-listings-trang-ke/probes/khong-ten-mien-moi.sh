#!/usr/bin/env bash
# s02-map-listings-trang-ke — AC-6 (ZT, 27/11; gap-probe F1): hàng không thêm dòng mới mang tên miền nguồn thật vào kho công khai.
# Tên miền không gõ ở đây: đọc từ hằng APP_ORIGIN của tệp bộ thu (tìm theo hàm nó xuất), lấy phần tên miền gốc.
set -uo pipefail
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
F=$(grep -l 'export function docExpAppToken' collector/src/collectors/*.ts | head -1)
GOC=$(sed -n 's/^const APP_ORIGIN = "https:\/\/[a-z]*\.\([^"]*\)".*/\1/p' "$F")
[ -n "$GOC" ] || { echo "ĐỎ: không rút được tên miền gốc từ tệp bộ thu"; exit 2; }
if [ -n "${S02_MOC_SO:-}" ]; then MOC="$S02_MOC_SO"
elif git rev-parse -q --verify origin/fix/s02-cua-api >/dev/null && ! git merge-base --is-ancestor origin/fix/s02-cua-api origin/main; then MOC=origin/fix/s02-cua-api
else MOC=origin/main; fi
echo "mốc so: $MOC"
BASE=$(git merge-base "$MOC" HEAD)
dem() { grep -E '^\+[^+]' | grep -c -F "$GOC" || true; }
N=$(git diff "$BASE" HEAD -- collector | dem)
do=0
if [ "$N" = 0 ]; then echo "đạt: bản thật · AC-6 0 dòng mới mang tên miền nguồn trong collector/ so với mốc"; else echo "ĐỎ: bản thật · AC-6 $N dòng mới mang tên miền nguồn trong collector/ so với mốc"; do=1; fi
C=$( { git diff "$BASE" HEAD -- collector; printf '+  const u = "https://api.%s/x";\n' "$GOC"; } | dem)
if [ "$C" -gt "$N" ]; then echo "đạt: bản đột biến (cấy một dòng mang tên miền) bị bắt"; else echo "ĐỎ: bản đột biến (cấy một dòng mang tên miền) KHÔNG bị bắt"; do=1; fi
[ "$do" = 0 ] && { echo XANH; exit 0; } || { echo ĐỎ; exit 1; }
