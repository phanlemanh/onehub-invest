#!/usr/bin/env bash
# sl1-ac5-the-gioi-069 AC-3: itest s03-len-cong từ chối DATABASE_URL trỏ DB dùng chung `oneinvest` trước khi nối DB.
# URL trỏ cổng 1 (không có server) nên kể cả bản mất chốt cũng không chạm DB thật nào.
# Chiều đỏ: bản sao tệp với dòng ném lỗi bị gỡ → không còn thông điệp → probe thoát 1 gọi tên bản sao.
set -uo pipefail
GOC=$(cd "$(dirname "$0")/../../.." && pwd -P)
TEP=${1:-$GOC/pipeline/scripts/s03-len-cong.itest.mjs}
URL="postgres://localhost:1/oneinvest"
out=$(cd "$GOC/pipeline" && DATABASE_URL="$URL" node --test "$TEP" 2>&1); rc=$?
if [ $rc -ne 0 ] && printf '%s' "$out" | grep -q 'không chạy trên oneinvest'; then
  echo "tu-choi-oneinvest: PASS — $(basename "$TEP") từ chối DATABASE_URL trỏ oneinvest (exit $rc)"; exit 0
fi
echo "tu-choi-oneinvest: ĐỎ — $TEP không từ chối DATABASE_URL trỏ oneinvest (exit $rc)"; exit 1
