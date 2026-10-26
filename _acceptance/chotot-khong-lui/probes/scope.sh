#!/bin/bash
# AC-6: tệp đổi so với main chỉ thuộc 2510-6 + hồ sơ.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"; bad=0
base=$(git merge-base origin/main HEAD)
while read -r f; do
  case "$f" in
    pipeline/import-chotot.mjs|pipeline/scripts/chotot-khong-lui-noi-dung.test.mjs|scripts/chotot-khong-lui/acceptance.mjs|_acceptance/chotot-khong-lui/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done < <(git diff --name-only "$base" HEAD)
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
