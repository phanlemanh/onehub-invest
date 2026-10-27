#!/bin/bash
# AC-4: tệp đổi so với merge-base của origin/main — chỉ hai thước, tài liệu baseline, evals.yaml (+ ghim lại) của ui-standards-reui,
# hồ sơ này, cấu hình, máy sinh, design/plan. Luật lint (eslint.config, quy tắc plugin, eslint-suppressions.json) KHÔNG đổi.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
for t in app/eslint-plugin-onehub-ui/selftest.mjs scripts/ui-standards/acceptance.mjs docs/research/ui-baseline-2026-10.md _acceptance/ui-standards-reui/evals.yaml; do
  printf '%s\n' "$tep" | grep -qx "$t" || { echo "THIEU TEP $t"; bad=1; }
done
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    app/eslint-suppressions.json|app/eslint.config.mjs|app/eslint-plugin-onehub-ui/rules/*|app/eslint-plugin-onehub-ui/index.*) echo "LUAT LINT BI DOI $f"; bad=1 ;;
    app/eslint-plugin-onehub-ui/selftest.mjs|scripts/ui-standards/acceptance.mjs|docs/research/ui-baseline-2026-10.md|\
    _acceptance/ui-standards-reui/evals.yaml|_acceptance/ui-standards-reui/run-log.jsonl|_acceptance/ui-standards-reui/evidence-report.md|\
    _acceptance/ui-standards-reui-thuoc-loi-thoi/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|\
    docs/superpowers/specs/2026-10-27-ui-standards-reui-thuoc-loi-thoi-design.md|docs/superpowers/plans/2026-10-27-ui-standards-reui-thuoc-loi-thoi.md) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
