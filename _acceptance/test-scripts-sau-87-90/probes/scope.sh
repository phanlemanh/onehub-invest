#!/bin/bash
# Vòng này chỉ sửa test: mọi tệp đổi so với main nằm trong danh sách cho phép — không đụng mã sản phẩm, importer, tệp bọc.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
base=$(git merge-base origin/main HEAD)
bad=0
while read -r f; do
  case "$f" in
    scripts/check-freshness.test.mjs|scripts/job-exit.test.mjs|_acceptance/test-scripts-sau-87-90/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done < <(git diff --name-only "$base" HEAD)
[ "$bad" = 0 ] && echo "SCOPE OK"
exit "$bad"
