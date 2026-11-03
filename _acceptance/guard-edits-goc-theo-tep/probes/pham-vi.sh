#!/bin/bash
# AC-7: tệp đổi so với merge-base của origin/main chỉ gồm vật của vòng; typecheck-changed.sh không đổi.
# AC-8: selftest và đầu dò của vòng không gọi lệnh prune của git (kho dùng chung, hồ sơ test-khong-prune-worktree).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
MAU_PRUNE='worktree["'"'"', ]+prune'
if printf 'git worktree prune\n["worktree", "prune"]\n' | grep -Ec "$MAU_PRUNE" | grep -qx 2; then echo "doi chung: bat 2/2 dang mau prune"; else echo "DOI CHUNG KHONG BAT"; exit 1; fi
for t in .claude/hooks/tests/guard-edits.selftest.sh _acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh; do
  if grep -Eq "$MAU_PRUNE" "$t"; then echo "CON PRUNE $t"; exit 1; fi
done
echo "khong goi prune"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
if [ -z "$tep" ]; then echo "nhanh da hop main: khong con diff de so"; echo "PHAM-VI OK"; exit 0; fi
bad=0
git diff --quiet "$base" HEAD -- .claude/hooks/typecheck-changed.sh || { echo "HOOK TYPECHECK BI DOI"; bad=1; }
for t in .claude/hooks/guard-edits.sh .claude/hooks/tests/guard-edits.selftest.sh; do
  printf '%s\n' "$tep" | grep -qx "$t" || { echo "THIEU TEP $t"; bad=1; }
done
while IFS= read -r f; do
  case "$f" in
    .claude/hooks/guard-edits.sh|.claude/hooks/tests/guard-edits.selftest.sh|_acceptance/guard-edits-goc-theo-tep/*|\
    _acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|\
    docs/superpowers/specs/*guard-edits-goc-theo-tep-design.md|docs/superpowers/plans/*guard-edits-goc-theo-tep.md) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
