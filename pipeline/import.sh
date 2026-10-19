#!/usr/bin/env bash
# Import Inside Airbnb snapshot vào Postgres + compute metrics.
# Dùng: ./import.sh [snapshot-date]   (mặc định 2026-09-22 — Bangkok)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/pipeline/data"
SNAPSHOT="${1:-2026-09-22}"
export COMPOSE_FILE="$ROOT/db/docker-compose.yml"

psqlc() { docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest -v ON_ERROR_STOP=1 "$@"; }

echo "==> start db"
docker compose up -d
for _ in $(seq 1 30); do
  docker compose exec -T db pg_isready -h localhost -U oneinvest -d oneinvest >/dev/null 2>&1 && break
  sleep 1
done

echo "==> fresh schema"
psqlc -q -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psqlc -q < "$ROOT/db/migrations/001_init.sql"

# staging(): tạo bảng all-text theo đúng header CSV rồi COPY (không phụ thuộc schema file)
staging() { # $1=bảng, $2=file (.gz | .csv)
  local tbl=$1 file=$2 cat
  case "$file" in *.gz) cat="gunzip -c" ;; *) cat="cat" ;; esac
  local cols
  cols=$($cat "$DATA/$file" | head -1 | tr -d '"' | awk -F',' \
    '{for(i=1;i<=NF;i++){gsub(/[ ()\/.-]/,"_",$i); printf "%s text%s", tolower($i), (i<NF?",":"")}}' || true)
  psqlc -q -c "CREATE TABLE $tbl ($cols);"
  echo "==> copy $tbl"
  $cat "$DATA/$file" | psqlc -q -c "\copy $tbl FROM STDIN WITH (FORMAT csv, HEADER true)"
}

staging stg_listings      listings.csv.gz
staging stg_calendar      calendar.csv.gz
staging stg_neighbourhoods neighbourhoods.csv

echo "==> geojson"
psqlc -q -c "CREATE TABLE stg_geojson(data jsonb);"
python3 - "$DATA/neighbourhoods.geojson" > "$DATA/load_geojson.sql" <<'PY'
import sys
data = open(sys.argv[1]).read()
assert "$j$" not in data
print("INSERT INTO stg_geojson(data) VALUES ($j$%s$j$);" % data)
PY
psqlc -q < "$DATA/load_geojson.sql"

echo "==> transform"
psqlc -v snapshot="$SNAPSHOT" < "$ROOT/pipeline/sql/200_transform.sql"

echo "==> metrics"
psqlc < "$ROOT/pipeline/sql/300_metrics.sql"
psqlc -q < "$ROOT/pipeline/sql/410_listing_stats.sql"

psqlc -q -c "
SELECT 'areas' t, count(*) FROM areas
UNION ALL SELECT 'listings', count(*) FROM listings
UNION ALL SELECT 'nights', count(*) FROM nights
UNION ALL SELECT 'market_metrics', count(*) FROM market_metrics;"
echo "==> done (snapshot $SNAPSHOT)"
