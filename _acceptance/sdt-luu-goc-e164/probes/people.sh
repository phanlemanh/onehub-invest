#!/bin/bash
# E8 (sdt-luu-goc-e164): test che bí danh sdt + bộ đo E.164, rồi loader thật /ops/people trên DB thử sau 060 + dựng danh bạ.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
node --test pipeline/do-danh-ba-sdt.test.mjs pipeline/scripts/boc-sdt.test.mjs >/dev/null
(cd app && node --import tsx --test tests/sdt-che-tren-people.test.tsx) | grep -E "^ℹ (pass|fail)"
TEN=oneinvest_p4_sd3_people
trap 'bash db/db-thu.sh "$TEN" --xoa >/dev/null 2>&1 || true' EXIT
bash db/db-thu.sh "$TEN" >/dev/null
DB_URL="postgres://oneinvest:oneinvest@localhost:5433/$TEN"
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$TEN" -v ON_ERROR_STOP=1 -q < db/migrations/060_sdt_e164.sql
DATABASE_URL="$DB_URL" node pipeline/dung-nguoi.mjs | tail -1
cd app && DB_URL="$DB_URL" DATABASE_URL="$DB_URL" node --import tsx ../_acceptance/sdt-luu-goc-e164/probes/people.tsx
