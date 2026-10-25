#!/bin/bash
# AC-8: tệp đổi so với main chỉ thuộc hai lời giao 2510-4/2510-9 + hồ sơ; hai tệp bọc qua bash -n.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"; bad=0
base=$(git merge-base origin/main HEAD)
while read -r f; do
  case "$f" in
    pipeline/apify-facebook-collector.mjs|pipeline/scripts/s05-paused.test.mjs|scripts/apify-facebook-daily.sh|scripts/zalo-import-daily.sh|scripts/au3-nap-bao-loi/acceptance.mjs|_acceptance/khoa-nap-s05-paused/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done < <(git diff --name-only "$base" HEAD)
bash -n scripts/apify-facebook-daily.sh && bash -n scripts/zalo-import-daily.sh && echo "SYNTAX OK" || bad=1
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
