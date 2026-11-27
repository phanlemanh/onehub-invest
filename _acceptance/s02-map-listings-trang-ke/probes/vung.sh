#!/usr/bin/env bash
# Phép đo AC-3 (hồ sơ s02-map-listings-trang-ke): so với ĐỈNH NHÁNH THỬ NGHIỆM (nhánh bộ thu đi cửa API — nhánh này
# đặt trên đó), hàng chỉ đổi đúng vùng của mình — tệp bộ thu S02 (tả bằng vai trò: [a-z]+-research.ts), tệp test bộ thu
# của hàng S02 (collector/src/test/s02-bo-thu-cua-api.test.ts), hồ sơ này và hai tệp sinh LO-TRINH.html, PRODUCT-MAP.md
# (luật kho bắt vẽ lại sau mỗi lần nhận main; config khai chúng là ngoài vật). collector/src/cli.ts, tệp phiên S02,
# hai tệp test còn lại của hàng S02, collector/src/core/** và pipeline/** KHÔNG đổi.
# Chiều đỏ: cùng bộ lọc trên danh sách có cấy một tệp ngoài vùng → ĐỎ ghim tên tệp.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
VUNG='^(collector/src/collectors/[a-z]+-research\.ts|collector/src/test/s02-bo-thu-cua-api\.test\.ts|_acceptance/s02-map-listings-trang-ke/.*|LO-TRINH\.html|PRODUCT-MAP\.md)$'
# ZT 27/11: mốc so là nhánh hồ sơ ZC22 (fix/s02-cua-api) mà nhánh này chồng lên — không còn là nhánh zcode, vì nhánh hồ sơ đã
# gộp main mới hơn; ghi đè bằng S02_MOC_SO khi ZC22 đã vào main (khi đó dùng origin/main).
MOC="${S02_MOC_SO:-origin/fix/s02-cua-api}"
BASE="$(git merge-base "$MOC" HEAD)" || { echo "ĐỎ: không tính được mốc gộp với $MOC"; exit 2; }
loc() { grep -Ev "$VUNG" || true; }
DS="$(git diff --name-only "$BASE" HEAD)"
NGOAI="$(printf '%s\n' "$DS" | sed '/^$/d' | loc)"
echo "tệp đổi so với $BASE: $(printf '%s\n' "$DS" | sed '/^$/d' | wc -l | tr -d ' ')"
for cay in pipeline/transform-ngoai-vung.mjs collector/src/cli.ts; do
  if [ "$(printf '%s\n' "$cay" | loc)" = "$cay" ]; then
    echo "đạt: chiều đỏ — cấy $cay thì bộ lọc gọi tên nó"
  else
    echo "ĐỎ: thước mù — bộ lọc không bắt tệp cấy ngoài vùng: $cay"; exit 1
  fi
done
F_BO_THU="$(grep -l "export function docExpAppToken" collector/src/collectors/*.ts | head -1)"
for p in "$F_BO_THU:tệp bộ thu S02 (xuất docExpAppToken)" "collector/src/test/s02-bo-thu-cua-api.test.ts:tệp test bộ thu của hàng S02"; do
  t="${p%%:*}"; v="${p#*:}"
  printf '%s\n' "$DS" | grep -qx "$t" && echo "đạt: có $v" || { echo "ĐỎ: thiếu thay đổi của $v"; exit 1; }
done
if [ -n "$NGOAI" ]; then echo "ĐỎ: tệp ngoài vùng: $NGOAI"; exit 1; fi
echo "XANH: mọi tệp đổi nằm trong vùng"
