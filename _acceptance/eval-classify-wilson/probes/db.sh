#!/bin/bash
# E5, E7 (eval-classify-wilson): dựng DB thử oneinvest_p4_ecw, nạp fixture nhãn qua bên ghi PL7 (nap-nhan.tsx), chạy db.mjs,
# xoá DB thử khi xong (kể cả khi đỏ). Không ghi DB oneinvest.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_ecw
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
(cd app && DATABASE_URL="$URL" node --import tsx ../_acceptance/eval-classify-wilson/probes/nap-nhan.tsx)
ECW_DB_URL="$URL" node _acceptance/eval-classify-wilson/probes/db.mjs
