#!/usr/bin/env bash
# do-may-thu.sh — phép đo AC-9 (E9) của SM1 trên bản chép mới của DB máy thu; bản chép xoá khi lệnh dừng.
# Kết quả ghi ở .acceptance-runs/so-so-tren-man-theo-ngay/do-may-thu.md. Mã thoát 0 khi mọi điều kiện đạt.
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC"
# Dựng bản chép MỚI từ DB máy thu, không dùng bản mẫu của --chay: bản mẫu có thể cũ tới 24 giờ nên số tuyệt đối sẽ lệch số trên màn.
TEN=oneinvest_suite_sm1_do
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN"
# Bản chép vừa nạp chưa có thống kê đủ: không ANALYZE thì planner chọn kế hoạch tệ, câu 600 có thể chạy hàng chục phút.
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -q -v ON_ERROR_STOP=1 -d "$TEN" -c 'ANALYZE'
DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node _acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.mjs
