#!/usr/bin/env bash
# tran-30.sh — cham-bong-cau-tra-loi-khong-bi-cat E7 (AC-7): mức chi cao nhất của 30 thẻ đầu trên DB máy thu (giao dịch chỉ đọc), trần
# token ra mới, bảng giá cấu hình; phải ≤ 0,1 USD. Chiều đỏ trên cùng dữ liệu: --tran 0.01 phải thoát 1 với thông điệp «vượt trần».
set -uo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC/agent"
M="$GOC/_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/tran-30.mjs"
node --import tsx "$M"; A=$?
D=$(node --import tsx "$M" --tran 0.01 2>&1); B=$?
echo "chiều đỏ (--tran 0.01): thoát $B — $(echo "$D" | tail -1)"
[ "$A" = 0 ] || { echo "ĐỎ: mức chi cao nhất vượt 0,1 USD (thoát $A)"; exit 1; }
[ "$B" = 1 ] && echo "$D" | grep -q "vượt trần" || { echo "ĐỎ: chiều đỏ không đỏ đúng (thoát $B)"; exit 1; }
echo "XANH: mức chi cao nhất 30 thẻ ≤ 0,1 USD; chiều đỏ đỏ đúng"
