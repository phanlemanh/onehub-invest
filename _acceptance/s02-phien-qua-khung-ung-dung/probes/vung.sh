#!/usr/bin/env bash
# Phép đo AC-10 (hồ sơ s02-phien-qua-khung-ung-dung): nhánh chỉ đổi đúng vùng của hàng — tệp bộ thu S02 (tê tả
# bằng vai trò: [a-z]+-research.ts), collector/src/core/types.ts, collector/src/cli.ts, tệp test của hàng,
# collector/CLAUDE.md, hồ sơ này và hai tệp sinh LO-TRINH.html, PRODUCT-MAP.md (luật kho bắt vẽ lại sau mỗi lần
# nhận main; config khai chúng là ngoài vật). Chiều đỏ: cùng bộ lọc trên danh sách có cấy một tệp ngoài vùng
# → ĐỎ ghim tên tệp.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
VUNG='^(collector/src/collectors/[a-z]+-research\.ts|collector/src/core/types\.ts|collector/src/cli\.ts|collector/src/test/s02-phien-qua-khung-ung-dung\.test\.ts|collector/CLAUDE\.md|_acceptance/s02-phien-qua-khung-ung-dung/.*|LO-TRINH\.html|PRODUCT-MAP\.md)$'
BASE="$(git merge-base origin/main HEAD)" || { echo "ĐỎ: không tính được merge-base với origin/main"; exit 2; }
loc() { grep -Ev "$VUNG" || true; }
DS="$(git diff --name-only "$BASE" HEAD)"
NGOAI="$(printf '%s\n' "$DS" | sed '/^$/d' | loc)"
echo "tệp đổi so với $BASE: $(printf '%s\n' "$DS" | sed '/^$/d' | wc -l | tr -d ' ')"
CAY="$(printf 'collector/src/core/types.ts\npipeline/transform-ngoai-vung.mjs\n' | loc)"
[ "$CAY" = "pipeline/transform-ngoai-vung.mjs" ] && echo "đạt: chiều đỏ — cấy pipeline/transform-ngoai-vung.mjs thì bộ lọc gọi tên nó" || { echo "ĐỎ: thước mù — bộ lọc không bắt tệp cấy ngoài vùng"; exit 1; }
F_S02="$(grep -l "export function docExpAppToken" collector/src/collectors/*.ts | head -1)"
for t in "$F_S02" collector/src/core/types.ts collector/src/cli.ts collector/src/test/s02-phien-qua-khung-ung-dung.test.ts collector/CLAUDE.md; do
  hien="$t"; [ "$t" = "$F_S02" ] && hien="tệp bộ thu S02 (xuất docExpAppToken)"
  printf '%s\n' "$DS" | grep -qx "$t" && echo "đạt: có $hien" || { echo "ĐỎ: thiếu thay đổi của $hien"; exit 1; }
done
if [ -n "$NGOAI" ]; then echo "ĐỎ: tệp ngoài vùng: $NGOAI"; exit 1; fi
echo "XANH: mọi tệp đổi nằm trong vùng"
