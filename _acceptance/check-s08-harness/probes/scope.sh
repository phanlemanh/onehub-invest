#!/bin/bash
# AC-4: nhánh chỉ đổi script kiểm, hồ sơ này và config.yaml; trong script kiểm chỉ đổi dòng danh sách chép.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
B=$(git merge-base HEAD origin/main)
f=$(git diff --name-only "$B"...HEAD; git diff --name-only; git ls-files --others --exclude-standard)
f=$(echo "$f" | sort -u | grep -v '^$'); echo "$f"; bad=0
echo "$f" | grep -vE '^(pipeline/scripts/check-s08-inventory\.mjs|_acceptance/check-s08-harness/.*|_acceptance/config\.yaml)$' && { echo "tệp ngoài phạm vi"; bad=1; }
d=$(git diff "$B" -- pipeline/scripts/check-s08-inventory.mjs | grep -E '^[+-][^+-]')
echo "$d"
[ "$(echo "$d" | grep -c '^-')" = 1 ] && [ "$(echo "$d" | grep -c '^+')" = 1 ] || { echo "script kiểm đổi hơn một dòng"; bad=1; }
echo "$d" | grep '^+' | grep -q '"import-s08-row.mjs"\]' || { echo "dòng mới không thêm import-s08-row.mjs"; bad=1; }
[ "$bad" = 0 ] && echo "SCOPE OK"
exit "$bad"
