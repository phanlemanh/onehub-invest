#!/bin/bash
# AC-8: tệp đổi so với main chỉ thuộc ba lời giao 2510-4/2510-9/2510-14 + hồ sơ; hai tệp bọc qua bash -n.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"; bad=0
base=$(git merge-base origin/main HEAD); tip=HEAD
# Đã gộp (verified_commit là tổ tiên của main) → đo đúng diff của PR gốc (cặp cha của commit gộp đầu tiên
# chứa nó), không đo nhánh đang chạy: thước nói về phạm vi PR này, không về mọi nhánh sau (revisit 31/10).
V=$(sed -n 's/^verified_commit: *//p' _acceptance/khoa-nap-s05-paused/evidence-report.md | head -1)
if [ -n "$V" ] && git merge-base --is-ancestor "$V" origin/main 2>/dev/null; then
  M=$(git log --format=%H --ancestry-path --merges "$V"..origin/main | tail -1)
  [ -n "$M" ] && { base=$(git merge-base "$M^1" "$M^2"); tip="$M^2"; echo "PR gốc đã gộp ($(git log -1 --format=%h "$M")) — đo diff của PR đó"; }
fi
while read -r f; do
  case "$f" in
    pipeline/apify-facebook-collector.mjs|pipeline/scripts/s05-paused.test.mjs|pipeline/scripts/s05-b-lich.test.mjs|pipeline/cron/com.oneinvest.apify-facebook.plist|scripts/apify-facebook-daily.sh|scripts/zalo-import-daily.sh|scripts/au3-nap-bao-loi/acceptance.mjs|_acceptance/khoa-nap-s05-paused/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok  $f";;
    *) echo "NGOÀI PHẠM VI $f"; bad=1;;
  esac
done < <(git diff --name-only "$base" "$tip")
bash -n scripts/apify-facebook-daily.sh && bash -n scripts/zalo-import-daily.sh && echo "SYNTAX OK" || bad=1
[ "$bad" = 0 ] && echo "SCOPE OK"; exit "$bad"
