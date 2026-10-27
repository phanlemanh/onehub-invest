#!/usr/bin/env bash
# check-idempotent-tam.sh — chạy check-idempotent.sh trên một DB TẠM dựng từ lược đồ (không dữ liệu) của DB local, rồi
# xoá DB tạm (bỏ pg_cron — phần mở rộng chỉ sống ở DB chính). Dùng khi migration chưa được áp lên DB dùng chung trước merge (PL15: 045 thay hàm apply/revert enrich mà
# các dãy khác đang gọi trên mã main — áp thật trước merge là đổi hành vi của họ).
# Dùng: bash db/check-idempotent-tam.sh db/migrations/NNN_x.sql [bảng-đếm-dòng ...]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TAM="idem_tam_$$"
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db)
don() { "${DX[@]}" dropdb -U oneinvest -h localhost --if-exists "$TAM" >/dev/null 2>&1 || true; }
trap don EXIT
"${DX[@]}" createdb -U oneinvest -h localhost "$TAM"
"${DX[@]}" sh -c "pg_dump -U oneinvest -h localhost --schema-only --no-owner --exclude-extension=pg_cron --exclude-schema=cron oneinvest | psql -U oneinvest -h localhost -q -v ON_ERROR_STOP=1 $TAM" >/dev/null
echo "DB tạm $TAM: lược đồ chép từ oneinvest (không dữ liệu)"
IDEM_DB="$TAM" bash "$HERE/check-idempotent.sh" "$@"
