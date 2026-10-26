#!/bin/bash
# AC-4: tệp đổi so với merge-base của origin/main — chỉ hai tệp test + hồ sơ + cấu hình + tệp máy sinh.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
tep=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
for t in app/tests/ops-facts-so-tong-hop.test.tsx app/tests/listings-browse.test.tsx; do
  printf '%s\n' "$tep" | grep -qx "$t" || { echo "THIEU TEP TEST $t"; bad=1; }
done
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    app/tests/ops-facts-so-tong-hop.test.tsx|app/tests/listings-browse.test.tsx|_acceptance/on-dinh-test-app-chap-chon/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done <<< "$tep"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
