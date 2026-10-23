#!/usr/bin/env bash
# finalize-airbnb.sh — import mọi snapshot airbnb-listing mới (multi-city:
# hanoi, hcmc, danang, vn-worklist) + gán phường + transform + metrics.
# Tổng quát hoá finalize-hanoi.sh cho chế độ worklist (Task 5 plan
# 2026-10-21-coverage-worklist). Idempotent: snapshot đã nạp thì bỏ qua.
set -euo pipefail
cd "$(dirname "$0")"

DB_DIR="$(cd ../db && pwd)"
PSQL=(docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest)

echo "=== 1. Import các snapshot airbnb-listing chưa nạp (mọi city) ==="
for d in "../collector"/snapshots/{hanoi,hcmc,danang,vn}/*__airbnb-listing__*; do
  [ -d "$d" ] || continue
  sid=$(basename "$d")
  n=$(cd "$DB_DIR" && "${PSQL[@]}" -t -A -c "SELECT count(*) FROM airbnb_snapshots WHERE snapshot_id='$sid'")
  if [ "$n" = "0" ]; then
    node import-airbnb.mjs "$d"
  fi
done

echo "=== 2. Gán phường OSM theo tọa độ (mọi city đã khai MARKETS) ==="
node reassign-areas.mjs

echo "=== 3. Transform listings + nights ==="
node transform-airbnb.mjs

echo "=== 4. Rebuild metrics + breakdowns + listing_stats + DQ checks ==="
cd "$DB_DIR" && "${PSQL[@]}" -q < ../pipeline/sql/300_metrics.sql
"${PSQL[@]}" -q < ../pipeline/sql/400_breakdowns.sql
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 < ../pipeline/sql/410_listing_stats.sql
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 < ../pipeline/sql/450_dq_checks.sql | tail -15

echo "=== 5. Sanity (3 market lớn; listings gán theo phường) ==="
"${PSQL[@]}" -c "
SELECT 'hanoi' AS market, count(*) FROM listings WHERE area_id LIKE 'vn-hanoi-%'
UNION ALL SELECT 'hcmc',  count(*) FROM listings WHERE area_id LIKE 'vn-hcmc-%'
UNION ALL SELECT 'danang',count(*) FROM listings WHERE area_id LIKE 'vn-thanh-pho-da-nang-%';"
echo "=== done ==="
