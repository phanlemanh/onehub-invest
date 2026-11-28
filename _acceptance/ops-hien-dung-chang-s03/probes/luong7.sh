#!/usr/bin/env bash
# luong7.sh <ON25-AC-n> — hồ sơ ops-hien-dung-chang-s03, E4/E5/E6: chạy các ca mang mã trong app/tests/luong-7-ngay-dung-so.test.tsx trên
# cụm dùng một lần (db/db-thu.sh oneinvest_suite_on25_l7 --chay-trong, không DB chung), đòi đúng số ca đạt đã khai, 0 ca hỏng.
set -euo pipefail
MA="${1:?cách dùng: luong7.sh ON25-AC-4|ON25-AC-5|ON25-AC-6}"
case "$MA" in
  ON25-AC-4) CAN=4 ;;
  ON25-AC-5) CAN=2 ;;
  ON25-AC-6) CAN=2 ;;
  *) echo "luong7.sh: mã lạ $MA" >&2; exit 2 ;;
esac
GOC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LOG="$(mktemp -t on25-l7.XXXXXX)"
trap 'rm -f "$LOG"' EXIT
set +e
( cd "$GOC/app" && bash ../db/db-thu.sh oneinvest_suite_on25_l7 --chay-trong \
    node --import tsx --test --test-concurrency=1 --test-name-pattern="^$MA " tests/luong-7-ngay-dung-so.test.tsx ) >"$LOG" 2>&1
RC=$?
set -e
cat "$LOG"
PASS=$(grep -E '^ℹ pass ' "$LOG" | tail -1 | grep -oE '[0-9]+$' || echo 0)
FAIL=$(grep -E '^ℹ fail ' "$LOG" | tail -1 | grep -oE '[0-9]+$' || echo 0)
echo "luong7.sh $MA: đạt $PASS/$CAN ca, hỏng $FAIL, mã lệnh $RC"
[ "$RC" -eq 0 ] && [ "$FAIL" -eq 0 ] && [ "$PASS" -eq "$CAN" ]
