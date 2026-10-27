#!/bin/bash
# AC-4: tệp đổi so với merge-base của origin/main — ba tệp mã + hồ sơ + cấu hình + máy sinh + design/plan + ghim lại.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
git diff --quiet "$base" HEAD -- .claude/hooks/typecheck-changed.sh || { echo "HOOK BI DOI"; bad=1; }
for t in scripts/lib/bo-worktree.mjs scripts/bo-worktree.test.mjs scripts/zalo-import-job-lan.test.mjs .claude/hooks/tests/typecheck-changed.selftest.sh; do
  printf '%s\n' "$tep" | grep -qx "$t" || { echo "THIEU TEP $t"; bad=1; }
done
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    scripts/lib/bo-worktree.mjs|scripts/bo-worktree.test.mjs|scripts/zalo-import-job-lan.test.mjs|.claude/hooks/tests/typecheck-changed.selftest.sh|_acceptance/test-khong-prune-worktree/*|\
    _acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|\
    docs/superpowers/specs/2026-10-27-test-khong-prune-worktree-design.md|docs/superpowers/plans/2026-10-27-test-khong-prune-worktree.md|\
    _acceptance/zalo-import-so-phan-nap-khong-do-gia/run-log.jsonl|_acceptance/zalo-import-so-phan-nap-khong-do-gia/evidence-report.md|\
    _acceptance/ui-standards-reui/run-log.jsonl|_acceptance/ui-standards-reui/evidence-report.md) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
