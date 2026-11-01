#!/bin/bash
# s06-vung-moi-len-canonical E11 — mọi tệp đổi so merge-base thuộc danh sách được phép của hàng.
set -uo pipefail
cd "${1:?gốc kho}"; bad=0
base=$(git merge-base origin/main HEAD) || { echo "scope: không tính được merge-base với origin/main"; exit 2; }
ds=$(git diff --name-only "$base" HEAD) || { echo "scope: git diff lỗi"; exit 2; }
[ -n "$ds" ] || { echo "scope: diff rỗng — không có gì để kiểm"; exit 2; }
while read -r f; do
  case "$f" in
    db/migrations/064_ma_thi_truong_ngan.sql|pipeline/lib/thi-truong.mjs|pipeline/lib/thi-truong.test.mjs|pipeline/reassign-areas.mjs|pipeline/transform-chotot.mjs|scripts/s06-vung-moi/*|_acceptance/s06-vung-moi-len-canonical/*|collector/src/config/cities.ts|_acceptance/config.yaml|docs/superpowers/specs/2026-10-31-s06-vung-moi-len-canonical-design.md|docs/superpowers/plans/2026-10-31-s06-vung-moi-len-canonical.md|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done <<< "$ds"
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
