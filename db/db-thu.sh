#!/usr/bin/env bash
# db-thu.sh — DB thử riêng trên cùng server :5433 cho test/phép đo nạp migration CHƯA merge (luật giám sát đợt
# dot0-cam-mau, 27/10, sau sự cố khoá DB dùng chung khi đo PL15): không chạy chúng trên DB `oneinvest` dùng chung.
# Chép lược đồ + dữ liệu của oneinvest bằng pg_dump (createdb -T cần không ai nối vào oneinvest — launchd luôn nối),
# bỏ pg_cron (chỉ sống ở DB chính) và dữ liệu hai bảng staging lớn không phép đo nào dùng (stg_calendar, stg_abnb_nights).
# pg_dump chỉ lấy khoá đọc (AccessShare) trên oneinvest — không chặn đọc/ghi của job khác.
#   bash db/db-thu.sh <tên>          dựng lại từ đầu (xoá nếu có)
#   bash db/db-thu.sh <tên> --xoa    xoá DB thử
# Trỏ lệnh vào DB thử: DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/<tên>
set -euo pipefail
TEN="${1:?thiếu tên DB thử}"
[[ "$TEN" =~ ^oneinvest_[a-z0-9_]+$ ]] || { echo "db-thu: tên phải dạng oneinvest_<dãy>_<việc> (không được là oneinvest)"; exit 2; }
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db)
"${DX[@]}" dropdb -U oneinvest -h localhost --if-exists "$TEN"
if [ "${2:-}" = "--xoa" ]; then echo "db-thu: đã xoá $TEN"; exit 0; fi
"${DX[@]}" createdb -U oneinvest -h localhost "$TEN"
"${DX[@]}" sh -c "pg_dump -U oneinvest -h localhost --no-owner --exclude-extension=pg_cron --exclude-schema=cron \
  --exclude-table-data=stg_calendar --exclude-table-data=stg_abnb_nights oneinvest \
  | psql -U oneinvest -h localhost -q -v ON_ERROR_STOP=1 $TEN" >/dev/null
echo "db-thu: $TEN dựng xong — DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/$TEN"
