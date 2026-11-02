#!/usr/bin/env bash
# luu-tang-huong-db.sh — hồ sơ _acceptance/s03-luu-tang-huong: dựng DB thử rồi chạy ca DB (E1, E2, E8, E10, E12). DB thử chưa áp 067;
# ca nạp 067 trong BEGIN…ROLLBACK nên chạy lại được và đo được cả hai trạng thái trên một DB. Không chạm DB oneinvest dùng chung.
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../.." && pwd)"
TEN=oneinvest_n1_sv2
bash "$GOC/db/db-thu.sh" "$TEN"
cd "$GOC/pipeline"
DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node --test --test-concurrency=1 scripts/luu-tang-huong.itest.mjs
