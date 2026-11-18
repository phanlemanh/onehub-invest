#!/usr/bin/env bash
# db.sh <SM1-AC-n> — chạy đúng các ca của một AC (AC-1…AC-5) trong pipeline/tests/so-moc-s03.itest.mjs trên DB của riêng lượt.
# Mã thoát là mã thoát của test; thiếu hay sai đối số thoát 2; lọc không trúng ca nào thoát 1, không xanh oan.
set -uo pipefail
MA="${1:-}"
[[ "$MA" =~ ^SM1-AC-[1-5]$ ]] || { echo "cách dùng: db.sh SM1-AC-<1..5>" >&2; exit 2; }
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
RA="$(mktemp)"
trap 'rm -f "$RA"' EXIT
cd "$GOC" || exit 2
bash db/db-thu.sh oneinvest_suite_sm1_db --chay node --test --test-concurrency=1 --test-reporter=spec \
  --test-name-pattern="^$MA " pipeline/tests/so-moc-s03.itest.mjs 2>&1 | tee "$RA"
MA_THOAT=${PIPESTATUS[0]}
[ "$MA_THOAT" -eq 0 ] || exit "$MA_THOAT"
/usr/bin/grep -Eq 'pass [1-9]' "$RA" || { echo "db.sh: không ca nào khớp $MA" >&2; exit 1; }
