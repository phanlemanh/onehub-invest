#!/bin/bash
# AC-10 (man-gan-nhan-mu, E13): tệp đổi so merge-base origin/main chỉ trong danh sách của hợp đồng (+ sổ bề mặt API và test
# đếm hành động quyền của kho — dòng sổ S3); không chạm làn ZCode. Đối chứng: cùng hàm phân loại trên tệp giả.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
files=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
cho_phep() {
  case "$1" in
    collector/*|pipeline/import-*|pipeline/collect-*|pipeline/cron/*) return 1 ;;
    db/migrations/054_labels.sql|pipeline/label-sample.mjs|pipeline/label-agreement.mjs|pipeline/lib/eval-labels.mjs|\
    pipeline/lib/eval-labels.test.mjs|app/src/app/ops/labels/*|app/src/components/ops/labels/*|app/src/app/api/v1/ops/labels/*|\
    app/src/lib/labels-*.ts|app/src/lib/ops-access.ts|app/src/lib/api-surface.ts|app/src/components/shell/nav.tsx|\
    app/tests/labels*.test.tsx|app/tests/quyen-bon-vai.test.tsx|app/tests/viewer-the-duyet.test.tsx|app/tests/ops-nhan/visible-strings.ts|CONTEXT.md|.claude/skills/onehub-ui/routes.md|\
    docs/architecture/portals.md|_acceptance/config.yaml|_acceptance/man-gan-nhan-mu/*|\
    docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md|docs/superpowers/plans/2026-10-30-man-gan-nhan-mu.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$files"
if cho_phep "app/tests/labels.test.tsx" && ! cho_phep "collector/x" && ! cho_phep "pipeline/import-x.mjs" && ! cho_phep "app/src/lib/khac.ts"; then
  echo "doi chung: collector/x → NGOAI PHAM VI collector/x; pipeline/import-x.mjs, app/src/lib/khac.ts → NGOAI PHAM VI"
else echo "DOI CHUNG PHAM VI KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
