#!/usr/bin/env bash
# tang-tren-tin-db.sh — hồ sơ _acceptance/tang-tren-tin-s03 (DV4): dựng DB thử oneinvest_u1_dv4 (chép từ DB máy thu bằng
# db/db-thu.sh) nếu chưa có, rồi chạy phần việc trên DB thử. DB thử CHƯA áp 095; mọi ca nạp 095 trong BEGIN…ROLLBACK nên chạy lại
# được và đo được cả hai trạng thái. Không chạm DB oneinvest dùng chung (luật đợt 27/10).
#   bash pipeline/scripts/tang-tren-tin-db.sh itest   ca DB: DV4-AC-1, AC-2, AC-4, AC-6, AC-7 (dq)
#   bash pipeline/scripts/tang-tren-tin-db.sh do      đo toàn bộ S03 (AC-2, AC-8), chỉ in số
#   bash pipeline/scripts/tang-tren-tin-db.sh luat    ca luật AC-7 (DQ ba trạng thái + vocab --check-db)
#   bash pipeline/scripts/tang-tren-tin-db.sh dung-lai dựng lại DB thử từ đầu (dữ liệu máy thu mới)
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../.." && pwd)"
TEN=oneinvest_u1_dv4
VIEC="${1:?thiếu việc: itest | do | luat | dung-lai}"
if [ "$VIEC" = "dung-lai" ]; then bash "$GOC/db/db-thu.sh" "$TEN"; exit; fi
bash "$GOC/db/db-thu.sh" "$TEN" --neu-chua-co
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
cd "$GOC/pipeline"
case "$VIEC" in
  itest) node --test --test-concurrency=1 --test-name-pattern='DV4-AC-(1|2|4|6)' scripts/tang-tren-tin.itest.mjs ;;
  luat)  node --test --test-concurrency=1 --test-name-pattern='DV4-AC-7' scripts/tang-tren-tin.itest.mjs ;;
  do)    node scripts/do-tang-tren-tin.mjs --toan-bo ;;
  *) echo "tang-tren-tin-db: việc lạ «$VIEC»"; exit 2 ;;
esac
