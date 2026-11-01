#!/bin/bash
# chuyen-huong-ma-thi-truong E9 — mọi tệp đổi so gốc của hàng thuộc danh sách được phép; không chạm cổng auth, không thêm
# route; data-api typecheck xanh. Gốc: đỉnh nhánh s06 (#252) khi nó chưa vào origin/main, ngược lại merge-base origin/main.
set -uo pipefail
cd "${1:?gốc kho}"; bad=0
S06=origin/feat/s06-vung-moi-len-canonical
if git rev-parse -q --verify "$S06" >/dev/null && ! git merge-base --is-ancestor "$S06" origin/main 2>/dev/null; then
  base=$(git merge-base "$S06" HEAD) || { echo "scope: không tính được gốc với $S06"; exit 2; }
else
  base=$(git merge-base origin/main HEAD) || { echo "scope: không tính được merge-base với origin/main"; exit 2; }
fi
ds=$(git diff --name-only "$base" HEAD) || { echo "scope: git diff lỗi"; exit 2; }
[ -n "$ds" ] || { echo "scope: diff rỗng — không có gì để kiểm"; exit 2; }
moi=$(git diff --name-only --diff-filter=A "$base" HEAD) || { echo "scope: git diff lỗi"; exit 2; }
while read -r f; do
  case "$f" in
    app/src/proxy.ts|data-api/src/middleware/*) echo "CỔNG AUTH BỊ CHẠM $f"; bad=1;;
    app/src/lib/ma-thi-truong.ts|app/src/lib/queries.ts|data-api/src/lib/ma-thi-truong.ts|data-api/src/routes/*.ts|\
    "app/src/app/(app)/[country]/page.tsx"|"app/src/app/(app)/[country]/[market]/page.tsx"|\
    "app/src/app/(app)/[country]/[market]/listings/page.tsx"|"app/src/app/(app)/[country]/[market]/[submarket]/page.tsx"|\
    "app/src/app/(app)/yield/page.tsx"|"app/src/app/(app)/compare/page.tsx"|app/src/app/api/v1/*/route.ts|\
    app/tests/chuyen-huong-ma-thi-truong.itest.tsx|scripts/chuyen-huong-ma-thi-truong/*|_acceptance/chuyen-huong-ma-thi-truong/*|\
    _acceptance/config.yaml|docs/superpowers/specs/2026-11-01-chuyen-huong-ma-thi-truong-design.md|\
    docs/superpowers/plans/2026-11-01-chuyen-huong-ma-thi-truong.md|PRODUCT-MAP.md|LO-TRINH.html|docs/ROADMAP.md) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done <<< "$ds"
while read -r f; do
  case "$f" in */page.tsx|*/route.ts) echo "ROUTE MỚI $f"; bad=1;; esac
done <<< "$moi"
(cd data-api && npm run -s typecheck) || { echo "data-api typecheck đỏ"; bad=1; }
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
