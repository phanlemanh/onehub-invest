#!/usr/bin/env bash
# Phép đo AC-6 (hồ sơ s02-luot-loi-sach-va-kiem-han-token): nhánh tích hợp chỉ đổi đúng vùng của hàng
# (5 tệp collector của hai nhánh ZCode + hồ sơ). Chiều đỏ: cùng bộ lọc trên danh sách có cấy một
# tệp ngoài vùng → ĐỎ ghim tên tệp.
# LO-TRINH.html, PRODUCT-MAP.md là tệp sinh: luật kho bắt vẽ lại sau mỗi lần nhận main, và config khai chúng ngoài vật.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
VUNG='^(collector/src/collectors/[a-z]+-research\.ts|collector/src/core/scheduler\.ts|collector/src/core/storage\.ts|collector/src/test/snapshot-loi-khong-tac-thu-muc\.test\.ts|collector/src/test/apptoken-exp\.test\.ts|LO-TRINH\.html|PRODUCT-MAP\.md|_acceptance/s02-luot-loi-sach-va-kiem-han-token/.*)$'
BASE="$(git merge-base origin/main HEAD)" || { echo "ĐỎ: không tính được merge-base với origin/main"; exit 2; }
loc() { grep -Ev "$VUNG" || true; }
DS="$(git diff --name-only "$BASE" HEAD)"
NGOAI="$(printf '%s\n' "$DS" | sed '/^$/d' | loc)"
echo "tệp đổi so với $BASE: $(printf '%s\n' "$DS" | sed '/^$/d' | wc -l | tr -d ' ')"
CAY="$(printf 'collector/src/core/storage.ts\npipeline/transform-ngoai-vung.mjs\n' | loc)"
[ "$CAY" = "pipeline/transform-ngoai-vung.mjs" ] && echo "đạt: chiều đỏ — cấy pipeline/transform-ngoai-vung.mjs thì bộ lọc gọi tên nó" || { echo "ĐỎ: thước mù — bộ lọc không bắt tệp cấy ngoài vùng"; exit 1; }
F_S02="$(grep -l "export function kiemAppToken" collector/src/collectors/*.ts | head -1)"
for t in "$F_S02" collector/src/core/scheduler.ts collector/src/core/storage.ts collector/src/test/snapshot-loi-khong-tac-thu-muc.test.ts collector/src/test/apptoken-exp.test.ts; do
  hien="$t"; [ "$t" = "$F_S02" ] && hien="tệp bộ thu S02 (xuất kiemAppToken)"
  printf '%s\n' "$DS" | grep -qx "$t" && echo "đạt: có $hien" || { echo "ĐỎ: thiếu thay đổi của $hien (nhánh ZCode chưa vào)"; exit 1; }
done
if [ -n "$NGOAI" ]; then echo "ĐỎ: tệp ngoài vùng: $NGOAI"; exit 1; fi
echo "XANH: mọi tệp đổi nằm trong vùng"
