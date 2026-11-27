#!/usr/bin/env bash
# moc.sh <ON25-AC-n> — hồ sơ ops-hien-dung-chang-s03, E1/E2: chạy các ca mang mã trong pipeline/tests/so-moc-s03.itest.mjs trên DB
# của riêng lượt (db/db-thu.sh oneinvest_suite_on25_moc --chay-trong: cụm dùng một lần dựng từ migration, không DB chung), rồi đòi đúng số ca đạt đã khai cho mã và 0 ca hỏng.
# Lọc sai tên ra 0 ca thì đỏ — không xanh oan. Gốc kho suy từ vị trí tệp, không hardcode.
set -euo pipefail
MA="${1:?cách dùng: moc.sh ON25-AC-1|ON25-AC-2}"
case "$MA" in
  ON25-AC-1) CAN=4 ;;
  ON25-AC-2) CAN=2 ;;
  *) echo "moc.sh: mã lạ $MA" >&2; exit 2 ;;
esac
GOC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LOG="$(mktemp -t on25-moc.XXXXXX)"
trap 'rm -f "$LOG"' EXIT
set +e
( cd "$GOC/pipeline" && bash ../db/db-thu.sh oneinvest_suite_on25_moc --chay-trong \
    node --test --test-concurrency=1 --test-name-pattern="^$MA " tests/so-moc-s03.itest.mjs ) >"$LOG" 2>&1
RC=$?
set -e
cat "$LOG"
PASS=$(grep -E '^# pass |^ℹ pass ' "$LOG" | tail -1 | grep -oE '[0-9]+$' || echo 0)
FAIL=$(grep -E '^# fail |^ℹ fail ' "$LOG" | tail -1 | grep -oE '[0-9]+$' || echo 0)
echo "moc.sh $MA: đạt $PASS/$CAN ca, hỏng $FAIL, mã lệnh $RC"
[ "$RC" -eq 0 ] && [ "$FAIL" -eq 0 ] && [ "$PASS" -eq "$CAN" ]
