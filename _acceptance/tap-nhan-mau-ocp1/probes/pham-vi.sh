#!/bin/bash
# AC-10 (tap-nhan-mau-ocp1, E10): tệp đổi so merge-base origin/main chỉ trong danh sách của hợp đồng.
# Đối chứng: cùng hàm phân loại trên tệp giả (migration, transform) phải ra NGOAI PHAM VI.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
files=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
cho_phep() {
  case "$1" in
    pipeline/lib/tap-mau.mjs|pipeline/lib/khuon-mau-ocp1.mjs|pipeline/lib/tap-mau.test.mjs|pipeline/label-mau.mjs|\
    pipeline/CLAUDE.md|app/tests/labels-mau.test.tsx|_acceptance/config.yaml|_acceptance/tap-nhan-mau-ocp1/*|\
    docs/superpowers/specs/2026-10-30-tap-nhan-mau-ocp1-design.md|docs/superpowers/plans/2026-10-30-tap-nhan-mau-ocp1.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$files"
if cho_phep "pipeline/lib/tap-mau.mjs" && ! cho_phep "db/migrations/055_x.sql" && ! cho_phep "pipeline/transform-zalo.mjs"; then
  echo "doi chung: db/migrations/055_x.sql → NGOAI PHAM VI; pipeline/transform-zalo.mjs → NGOAI PHAM VI"
else echo "DOI CHUNG PHAM VI KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
