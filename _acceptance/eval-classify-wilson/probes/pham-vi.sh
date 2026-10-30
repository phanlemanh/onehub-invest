#!/bin/bash
# AC-10 (eval-classify-wilson, E10): tệp đổi so merge-base origin/main chỉ trong danh sách của hợp đồng.
# Đối chứng: cùng hàm phân loại trên tệp giả (migration, transform) phải ra NGOAI PHAM VI.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
files=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
cho_phep() {
  case "$1" in
    pipeline/lib/eval-classify.mjs|pipeline/lib/eval-classify.test.mjs|pipeline/eval-classify.mjs|\
    pipeline/package.json|pipeline/CLAUDE.md|app/src/lib/dq-labels.ts|app/tests/dq-eval-classify-label.test.tsx|\
    app/tests/eval-classify-mien.test.tsx|CONTEXT.md|_acceptance/config.yaml|_acceptance/eval-classify-wilson/*|\
    docs/superpowers/specs/2026-10-30-eval-classify-wilson-design.md|docs/superpowers/plans/2026-10-30-eval-classify-wilson.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$files"
if cho_phep "pipeline/lib/eval-classify.mjs" && ! cho_phep "db/migrations/057_x.sql" && ! cho_phep "pipeline/transform-zalo.mjs"; then
  echo "doi chung: db/migrations/057_x.sql → NGOAI PHAM VI; pipeline/transform-zalo.mjs → NGOAI PHAM VI"
else echo "DOI CHUNG PHAM VI KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
