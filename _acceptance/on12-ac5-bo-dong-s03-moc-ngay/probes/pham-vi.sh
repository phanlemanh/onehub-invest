#!/usr/bin/env bash
# pham-vi.sh — on12-ac5-bo-dong-s03-moc-ngay AC-3: nhánh chỉ đổi vùng của hàng; ca ON12-AC-5 không còn chép tay điều kiện loại;
# dqLatestSql dùng hằng chung. Chạy từ gốc kho: bash _acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh [--base <ref>]
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); cd "$ROOT"
BASE=origin/main; [ "${1:-}" = "--base" ] && BASE=$2
echo "root $ROOT sha $(git rev-parse HEAD)"
MB=$(git merge-base "$BASE" HEAD)
loi=0
while read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    app/tests/ops-nhan-theo-context.test.tsx|app/src/lib/dq-checks.ts|app/src/lib/dq-labels.ts|_acceptance/on12-ac5-bo-dong-s03-moc-ngay/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html) echo "ok $f";;
    *) echo "NGOAI PHAM VI $f"; loi=1;;
  esac
done < <(git diff --name-only "$MB" HEAD; git diff --name-only HEAD)
T=app/tests/ops-nhan-theo-context.test.tsx
if grep -q "NOT LIKE 'do1-%'" "$T"; then echo "CA CON CHEP TAY DIEU KIEN LOAI"; loi=1; else echo "ok ca khong chep tay dieu kien loai"; fi
grep -q 'DQ_SHARED_TABLE_FILTER_SQL' "$T" && echo "ok ca doc hang chung" || { echo "CA KHONG DOC HANG CHUNG"; loi=1; }
grep -q 'AND ${DQ_SHARED_TABLE_FILTER_SQL}' app/src/lib/dq-checks.ts && echo "ok dqLatestSql doc hang chung" || { echo "BANG KHONG DOC HANG CHUNG"; loi=1; }
[ "$(grep -c "s03-moc-ngay" app/src/lib/dq-checks.ts)" -ge 1 ] && echo "ok hang chung co s03-moc-ngay" || { echo "HANG THIEU S03-MOC-NGAY"; loi=1; }
[ $loi = 0 ] && echo "PHAM-VI OK"
exit $loi
