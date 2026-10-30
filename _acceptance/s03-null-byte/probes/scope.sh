#!/bin/bash
# AC-6: nhánh chỉ đổi importer, test mới, hồ sơ này, config.yaml và hai tệp máy sinh; trong importer chỉ đổi đường S03.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
B=$(git merge-base HEAD origin/main)
f=$(git diff --name-only "$B"...HEAD; git diff --name-only; git ls-files --others --exclude-standard)
f=$(echo "$f" | sort -u | grep -v '^$'); echo "$f"; bad=0
echo "$f" | grep -vE '^(pipeline/import-airbnb\.mjs|pipeline/scripts/s03-null-byte\.test\.mjs|_acceptance/s03-null-byte/.*|_acceptance/config\.yaml|PRODUCT-MAP\.md|LO-TRINH\.html)$' && { echo "tệp ngoài phạm vi"; bad=1; }
d=$(git diff -U0 "$B" -- pipeline/import-airbnb.mjs | grep -E '^[+-][^+-]')
echo "$d" | grep '^-' | grep -vE 'it\.payload\?\.(group|author|text|senderName|senderId|conversationId|media|agent_id)|mediaFiles \? JSON' && { echo "dòng xoá ngoài đường S03"; bad=1; }
echo "$d" | grep '^-' | grep -qE 'stg_abnb|stg_s08|stg_osm|airbnb_snapshots' && { echo "chạm nhánh khác"; bad=1; }
echo "dòng xoá: $(echo "$d" | grep -c '^-') · dòng thêm: $(echo "$d" | grep -c '^+')"
[ "$bad" = 0 ] && echo "SCOPE OK"
exit "$bad"
