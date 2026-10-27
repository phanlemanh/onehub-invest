#!/bin/bash
# AC-6: tệp đổi so với merge-base của origin/main — chỉ app/tests/**, dòng script test của app/package.json, hồ sơ, cấu hình,
# máy sinh, design/plan; không tệp nào dưới app/src/.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
dong=$(git diff -U0 "$base" HEAD -- app/package.json | grep -E '^[+-][^+-]' || true)
if [ -n "$dong" ] && ! printf '%s\n' "$dong" | grep -vq '"test":'; then echo "app/package.json chi doi dong test"; else echo "PACKAGE DOI NGOAI SCRIPT TEST"; printf '%s\n' "$dong"; bad=1; fi
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    app/src/*) echo "DOI APP SRC $f"; bad=1 ;;
    app/tests/*|app/package.json|_acceptance/test-nen-on22-on12/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|\
    docs/superpowers/specs/2026-10-27-test-nen-on22-on12-design.md|docs/superpowers/plans/2026-10-27-test-nen-on22-on12.md|\
    _acceptance/*/run-log.jsonl|_acceptance/*/evidence-report.md) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
