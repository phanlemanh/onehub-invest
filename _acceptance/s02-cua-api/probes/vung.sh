#!/usr/bin/env bash
# Phép đo AC-10 (hồ sơ s02-cua-api): nhánh chỉ đổi đúng vùng của hàng — hai tệp bộ thu S02 (tả bằng vai trò:
# [a-z]+-research.ts và [a-z]+-session.ts), collector/src/cli.ts, ba tệp test của hàng (collector/src/test/s02-*.test.ts),
# collector/CLAUDE.md, collector/AGENTS.md, hồ sơ này và hai tệp sinh LO-TRINH.html, PRODUCT-MAP.md (luật kho bắt
# vẽ lại sau mỗi lần nhận main; config khai chúng là ngoài vật). Hợp đồng Collector (collector/src/core/**) KHÔNG đổi.
# Chiều đỏ: cùng bộ lọc trên danh sách có cấy một tệp ngoài vùng → ĐỎ ghim tên tệp.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
VUNG='^(collector/src/collectors/[a-z]+-research\.ts|collector/src/collectors/[a-z]+-session\.ts|collector/src/cli\.ts|collector/src/test/s02-[a-z-]+\.test\.ts|collector/CLAUDE\.md|collector/AGENTS\.md|_acceptance/s02-cua-api/.*|LO-TRINH\.html|PRODUCT-MAP\.md)$'
BASE="$(git merge-base origin/main HEAD)" || { echo "ĐỎ: không tính được merge-base với origin/main"; exit 2; }
loc() { grep -Ev "$VUNG" || true; }
DS="$(git diff --name-only "$BASE" HEAD)"
NGOAI="$(printf '%s\n' "$DS" | sed '/^$/d' | loc)"
echo "tệp đổi so với $BASE: $(printf '%s\n' "$DS" | sed '/^$/d' | wc -l | tr -d ' ')"
for cay in pipeline/transform-ngoai-vung.mjs collector/src/core/types.ts; do
  if [ "$(printf '%s\n' "$cay" | loc)" = "$cay" ]; then
    echo "đạt: chiều đỏ — cấy $cay thì bộ lọc gọi tên nó"
  else
    echo "ĐỎ: thước mù — bộ lọc không bắt tệp cấy ngoài vùng: $cay"; exit 1
  fi
done
F_BO_THU="$(grep -l "export function docExpAppToken" collector/src/collectors/*.ts | head -1)"
F_PHIEN="$(grep -l "export function docPhienTuProfile" collector/src/collectors/*.ts | head -1)"
for p in "$F_BO_THU:tệp bộ thu S02 (xuất docExpAppToken)" "$F_PHIEN:tệp phiên S02 (xuất docPhienTuProfile)" \
         "collector/src/cli.ts:collector/src/cli.ts" \
         "collector/src/test/s02-doc-phien.test.ts:tệp test đọc phiên" \
         "collector/src/test/s02-cua-api.test.ts:tệp test tra đổi token" \
         "collector/src/test/s02-bo-thu-cua-api.test.ts:tệp test bộ thu và lệnh login" \
         "collector/CLAUDE.md:collector/CLAUDE.md" "collector/AGENTS.md:collector/AGENTS.md"; do
  t="${p%%:*}"; v="${p#*:}"
  printf '%s\n' "$DS" | grep -qx "$t" && echo "đạt: có $v" || { echo "ĐỎ: thiếu thay đổi của $v"; exit 1; }
done
if [ -n "$NGOAI" ]; then echo "ĐỎ: tệp ngoài vùng: $NGOAI"; exit 1; fi
echo "XANH: mọi tệp đổi nằm trong vùng"
