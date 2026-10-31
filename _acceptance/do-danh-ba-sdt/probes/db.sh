#!/bin/bash
# E2, E3 (do-danh-ba-sdt): dựng DB thử oneinvest_p4_ddb, chạy db.mjs, xoá DB thử khi xong (kể cả khi đỏ). Không ghi DB oneinvest.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_ddb
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
DDB_DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node _acceptance/do-danh-ba-sdt/probes/db.mjs
