#!/bin/bash
# E4 (sellers-view-len-cloud): tệp catch-up cloud 060 — khối ÁP không DDL/không chép 060, khối ĐO TRƯỚC chạy trên DB thử ở ba
# trạng thái (catchup.mjs, BEGIN … ROLLBACK). DB thử xoá khi xong.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_svc_catchup
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash _acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh "$TEN"
DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node _acceptance/sellers-view-len-cloud/probes/catchup.mjs
