#!/bin/bash
# E2, E7, E3 (sellers-view-len-cloud): DB thử chép máy thu (sau 060, sellers là view) đứng vai cloud; cloud-gia.mjs chạy
# mọi bước trong BEGIN … ROLLBACK. Đối số `doc` → chỉ E3 (đọc view đúng cột cho phép). DB thử xoá khi xong.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_svc
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash _acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh "$TEN"
DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN" node _acceptance/sellers-view-len-cloud/probes/cloud-gia.mjs "${1:-cloud}"
