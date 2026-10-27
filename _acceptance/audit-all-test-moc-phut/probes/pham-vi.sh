#!/bin/bash
# AC-4: tệp đổi so với merge-base của origin/main — chỉ tệp test + hồ sơ + cấu hình + tệp máy sinh + hồ sơ ghim lại.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
printf '%s\n' "$tep" | grep -qx "scripts/audit-all.test.mjs" || { echo "THIEU TEP TEST scripts/audit-all.test.mjs"; bad=1; }
git diff --quiet "$base" HEAD -- scripts/audit-all.sh || { echo "AUDIT-ALL.SH BI DOI"; bad=1; }
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    scripts/audit-all.test.mjs|_acceptance/audit-all-test-moc-phut/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|\
    docs/superpowers/specs/2026-10-26-audit-all-test-moc-phut-design.md|docs/superpowers/plans/2026-10-26-audit-all-test-moc-phut.md|\
    _acceptance/audit-all-noi-that/run-log.jsonl|_acceptance/audit-all-noi-that/evidence-report.md|_acceptance/audit-all-noi-that/decisions.jsonl|\
    _acceptance/audit-all-doc-log-o-checkout/run-log.jsonl|_acceptance/audit-all-doc-log-o-checkout/evidence-report.md|_acceptance/audit-all-doc-log-o-checkout/decisions.jsonl) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
