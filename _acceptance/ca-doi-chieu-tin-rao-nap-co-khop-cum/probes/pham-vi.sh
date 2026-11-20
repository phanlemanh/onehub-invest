#!/usr/bin/env bash
# pham-vi.sh — ca-doi-chieu-tin-rao-nap-co-khop-cum AC-4: nhánh chỉ đổi vùng của hàng; ca E4b không còn tự đọc real_name/
# source_ids từ source_registry và nạp qua docSourceNameEntries. Chạy từ gốc kho: bash …/probes/pham-vi.sh [--base <ref>]
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); cd "$ROOT"
BASE=origin/main; [ "${1:-}" = "--base" ] && BASE=$2
echo "root $ROOT sha $(git rev-parse HEAD)"
MB=$(git merge-base "$BASE" HEAD)
loi=0
while read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    app/tests/tin-rao-doi-chieu.test.tsx|_acceptance/ca-doi-chieu-tin-rao-nap-co-khop-cum/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok $f";;
    *) echo "NGOAI PHAM VI $f"; loi=1;;
  esac
done < <({ git diff --name-only "$MB" HEAD; git diff --name-only HEAD; } | sort -u)
T=app/tests/tin-rao-doi-chieu.test.tsx
if grep -qE '(real_name|source_ids)[^;`]*FROM[[:space:]]+(public\.)?source_registry' "$T"; then echo "CA CON TU DOC SO NGUON"; loi=1; else echo "ok ca khong tu doc so nguon"; fi
grep -q 'await docSourceNameEntries(c)' "$T" && echo "ok ca nap qua ham chung" || { echo "CA KHONG NAP QUA HAM CHUNG"; loi=1; }
grep -q 'tokensFromEntries(entries)' "$T" && echo "ok token giu co" || { echo "TOKEN KHONG GIU CO"; loi=1; }
[ $loi = 0 ] && echo "PHAM-VI OK"
exit $loi
