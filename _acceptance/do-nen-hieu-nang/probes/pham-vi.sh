#!/bin/bash
# AC-6: tệp đổi so với merge-base của origin/main — chỉ script đo, tài liệu nghiên cứu, hồ sơ, cấu hình, máy sinh, design/plan.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    scripts/do-nen-hieu-nang/*|docs/research/do-nen-hieu-nang-2610.md|docs/research/do-nen-hieu-nang-2610.json|_acceptance/do-nen-hieu-nang/*|\
    _acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md|docs/superpowers/plans/2026-10-27-do-nen-hieu-nang.md) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$(git diff --name-only "$base" HEAD)"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
