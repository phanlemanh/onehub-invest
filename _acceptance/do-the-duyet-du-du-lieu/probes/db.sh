#!/bin/bash
# E2, E3, E4b (do-the-duyet-du-du-lieu): dựng DB thử oneinvest_p4_dtd, chạy db.mjs, xoá DB thử khi xong (kể cả khi đỏ).
# Không ghi DB oneinvest.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_dtd
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
DTD_DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node _acceptance/do-the-duyet-du-du-lieu/probes/db.mjs
