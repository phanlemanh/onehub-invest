#!/bin/bash
# AC-10 (so-cuoc-goi-ai): tệp đổi so merge-base origin/main chỉ trong danh sách của hợp đồng (+ docs/architecture/portals.md
# theo luật cổng — dòng sổ S3; bốn test bất biến của kho khai trang/khối mới — dòng sổ S3); không chạm làn ZCode. Đối chứng: cùng hàm phân loại trên tệp giả.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
files=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
cho_phep() {
  case "$1" in
    collector/*|pipeline/import-*|pipeline/cron/*) return 1 ;;
    agent/src/runtime/*|agent/tests/*|agent/package.json|agent/package-lock.json|db/migrations/052_ai_calls.sql|\
    pipeline/push-ops-facts.mjs|pipeline/lib/ai-calls.mjs|pipeline/lib/ai-calls.test.mjs|app/src/app/ops/ai-calls/*|\
    app/src/components/ops/ai-calls/*|app/src/lib/ai-calls-queries.ts|app/src/lib/ops-facts.ts|app/src/components/shell/nav.tsx|\
    app/tests/ai-calls.test.tsx|_acceptance/config.yaml|CONTEXT.md|.claude/skills/onehub-ui/routes.md|_acceptance/so-cuoc-goi-ai/*|\
    docs/superpowers/specs/2026-10-29-so-cuoc-goi-ai-design.md|docs/superpowers/plans/2026-10-29-so-cuoc-goi-ai.md|\
    docs/architecture/portals.md|PRODUCT-MAP.md|LO-TRINH.html|\
    app/tests/viewer-the-duyet.test.tsx|app/tests/ops-nhan/visible-strings.ts|app/tests/ops-facts-so-tong-hop.test.tsx|\
    pipeline/scripts/ops-facts-so-tong-hop.test.mjs) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$files"
if cho_phep "app/tests/ai-calls.test.tsx" && ! cho_phep "app/tests/x.test.tsx" && ! cho_phep "collector/x.ts" && ! cho_phep "pipeline/import-x.mjs" && ! cho_phep "app/src/lib/khac.ts"; then
  echo "doi chung: app/tests/ai-calls.test.tsx → ok; app/tests/x.test.tsx, collector/x.ts, pipeline/import-x.mjs, app/src/lib/khac.ts → NGOAI PHAM VI"
else echo "DOI CHUNG PHAM VI KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
