#!/usr/bin/env bash
# finalize-hanoi.sh — import mọi snapshot airbnb-listing mới + transform + metrics.
# Idempotent: snapshot đã nạp thì ON CONFLICT bỏ qua.
set -euo pipefail
cd "$(dirname "$0")"

COLLECTOR="${COLLECTOR:-/bin/../collector}"
DB_DIR="$(cd ../db && pwd)"
PSQL=(docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest)

echo "=== 1. Import các snapshot chưa nạp ==="
for d in "../collector"/snapshots/hanoi/hanoi__airbnb-*__*; do
  [ -d "$d" ] || continue
  sid=$(basename "$d")
  n=$(cd "$DB_DIR" && "${PSQL[@]}" -t -A -c "SELECT count(*) FROM airbnb_snapshots WHERE snapshot_id='$sid'")
  if [ "$n" = "0" ]; then
    node import-airbnb.mjs "$d"
  else
    # snapshot đã nạp nhưng có thể có items mới? items PK (listing,snapshot) — nạp lại idempotent
    :
  fi
done

echo "=== 2. Transform (areas + listings + nights) ==="
node transform-airbnb.mjs

echo "=== 3. Rebuild metrics ==="
cd "$DB_DIR" && "${PSQL[@]}" -q < ../pipeline/sql/300_metrics.sql

echo "=== 4. Sanity ==="
"${PSQL[@]}" -c "
SELECT count(*) FILTER (WHERE area_id LIKE 'vn-hanoi-%') listings_hn,
       count(price_listed) FILTER (WHERE area_id LIKE 'vn-hanoi-%') co_gia
FROM listings;
SELECT month, listing_count, booked_nights, round(adr) adr_vnd, round(occupancy*100,1) occ
FROM market_metrics WHERE area_id='vn-hanoi' ORDER BY month LIMIT 3;"
echo "=== done ==="
