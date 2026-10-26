#!/bin/bash
# AC-3: tệp đổi so với origin/main chỉ là tệp test + hồ sơ + cấu hình + tệp máy sinh; tệp test chỉ thêm dòng.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 2
bad=0
for f in $(git diff --name-only origin/main...HEAD); do
  case "$f" in
    agent/tests/enrich-db.test.ts|_acceptance/enrich-db-test-khoanh-tin/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok $f" ;;
    *) echo "NGOAI PHAM VI $f"; bad=1 ;;
  esac
done
xoa=$(git diff origin/main...HEAD -- agent/tests/enrich-db.test.ts | grep -c '^-[^-]')
[ "$xoa" -eq 0 ] || { echo "XOA DONG $xoa"; bad=1; }
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
