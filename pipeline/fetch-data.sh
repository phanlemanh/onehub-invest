#!/usr/bin/env bash
# Tải snapshot Inside Airbnb Bangkok vào pipeline/data/
# Dùng: ./fetch-data.sh [snapshot-date]
set -euo pipefail
SNAPSHOT="${1:-2026-09-22}"
BASE="https://data.insideairbnb.com/thailand/central-thailand/bangkok/$SNAPSHOT"
DIR="$(cd "$(dirname "$0")" && pwd)/data"
mkdir -p "$DIR"
cd "$DIR"
for f in "data/listings.csv.gz" "data/calendar.csv.gz" \
         "visualisations/neighbourhoods.csv" "visualisations/neighbourhoods.geojson"; do
  out=$(basename "$f")
  echo "==> $out"
  curl -sf --retry 3 --max-time 580 -o "$out" "$BASE/$f"
done
ls -la
