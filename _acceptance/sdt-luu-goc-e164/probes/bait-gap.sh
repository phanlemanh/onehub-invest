#!/bin/bash
# E6 (sdt-luu-goc-e164): test bait gap / sync-cloud / test-posts / deals-phi-ly trên DB thử (test tự nạp 060 trong giao
# dịch), rồi áp 060 lên DB thử và chạy refresh-bait-gap.mjs thật (bait-gap.mjs). DB thử xoá khi xong.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
TEN=oneinvest_p4_sd3_bait_gap
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash _acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh "$TEN"
DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
DATABASE_URL="$DB_URL" node --test pipeline/scripts/bait-gap-sellers.test.mjs pipeline/sync-cloud.test.mjs \
  pipeline/scripts/test-posts.test.mjs pipeline/scripts/deals-phi-ly.test.mjs | grep -E "^ℹ (pass|fail)"
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$TEN" -v ON_ERROR_STOP=1 -q < db/migrations/060_sdt_e164.sql
DATABASE_URL="$DB_URL" node pipeline/dung-nguoi.mjs | tail -1
DB_URL="$DB_URL" node _acceptance/sdt-luu-goc-e164/probes/bait-gap.mjs
