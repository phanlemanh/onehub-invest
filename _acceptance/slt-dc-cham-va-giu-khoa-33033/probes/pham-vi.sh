#!/usr/bin/env bash
# pham-vi.sh — AC-8: mọi tệp nhánh đổi so với merge-base origin/main nằm trong vùng của hàng slt-dc-cham-va-giu-khoa-33033.
# Tự kiểm: một đường giả ngoài vùng phải ra «NGOAI PHAM VI».
set -uo pipefail
cd "$(dirname "$0")/../../.."
cho_phep() {
  case "$1" in
    pipeline/lib/assert.mjs|pipeline/scripts/assert-rut-thay.test.mjs|pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs|\
    pipeline/test-nua.json|_acceptance/config.yaml|_acceptance/slt-dc-cham-va-giu-khoa-33033/*|\
    docs/superpowers/specs/2026-11-20-slt-dc-cham-va-giu-khoa-33033-design.md|docs/superpowers/plans/2026-11-20-slt-dc-cham-va-giu-khoa-33033.md|\
    PRODUCT-MAP.md|LO-TRINH.html|docs/plan/lo-trinh.json) return 0 ;;
    *) return 1 ;;
  esac
}
cho_phep "app/src/app/page.tsx" && { echo "TU KIEM HONG: đường ngoài vùng lọt"; exit 2; }
cho_phep "pipeline/lib/assert.mjs" || { echo "TU KIEM HONG: tệp trong vùng bị chặn"; exit 2; }
echo "tự kiểm: app/src/app/page.tsx → NGOAI PHAM VI; pipeline/lib/assert.mjs → ok"
base=$(git merge-base HEAD origin/main) || { echo "pham-vi: không tìm được merge-base"; exit 2; }
ngoai=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; ngoai=1; fi
done < <(git diff --name-only "$base" HEAD)
[ "$ngoai" -eq 0 ] && echo "PHAM-VI OK" || exit 1
