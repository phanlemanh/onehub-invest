#!/usr/bin/env bash
# weekly-collect.sh — lượt thu S01: discovery (đa query khu vực, 3110-7) +
# listing batches + finalize. Gọi bằng launchd (com.oneinvest.collector.plist,
# hằng ngày 19:30 qua weekly-with-jitter.sh có cổng vòng đời S01) hoặc tay:
#   bash pipeline/scripts/weekly-collect.sh [city...]        # mặc định: hanoi hcmc
#   SKIP_COLLECT=1 bash pipeline/scripts/weekly-collect.sh   # chỉ chạy khúc pipeline
set -euo pipefail

# Mọi đường dẫn neo theo gốc monorepo — launchd chạy với cwd=/
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COLLECTOR_DIR="$ROOT/collector"
PIPELINE_DIR="$ROOT/pipeline"
DB_DIR="$(cd "$ROOT/db" && pwd)"
LOG="${LOG:-$PIPELINE_DIR/logs}"
CITIES=("${@:-hanoi}")
[ $# -gt 0 ] || CITIES=(hanoi hcmc)   # 3110-7: mặc định BOTH HN + HCM
TAG="$(IFS=-; echo "${CITIES[*]}")"

mkdir -p "$LOG"
exec >>"$LOG/weekly-$TAG-$(date +%Y%m%d).log" 2>&1
echo "=== $(date) start collect: $TAG ==="

if [ "${SKIP_COLLECT:-0}" != "1" ]; then
  for CITY in "${CITIES[@]}"; do
    echo "--- $CITY: discovery ---"
    # 3110-7: query khu vực xoay vòng theo đêm (s01-shards.mjs đọc bảng areas,
    # stateless theo chỉ số ngày); collector tự chạy query thành phố trước.
    # 3110-7 MỞ LẠI vòng 3: tách stdout/stderr — stdout là danh sách query, stderr
    # ghi tệp tạm và CHỈ in khi thoát khác 0. Thoát 0 mà có stderr (cảnh báo node)
    # không lọt vào danh sách query nữa.
    # 3110-7 vòng 4: set -euo pipefail làm gán-lệnh-thất-bại thoát cả script —
    # dùng || RC_SHARDS=$? để bắt lỗi, kèm pipefail | head -1 cũng cần || bảo vệ.
    SHARDS_ERR="$(mktemp)"
    RC_SHARDS=0
    SHARDS="$(node "$PIPELINE_DIR/s01-shards.mjs" "$CITY" 2>"$SHARDS_ERR" | head -1)" || RC_SHARDS=$?
    if [ $RC_SHARDS -ne 0 ]; then
      echo "cảnh báo: s01-shards lỗi rc=$RC_SHARDS ($(tail -1 "$SHARDS_ERR")) — chạy query thành phố như cũ"
      SHARDS=""
    fi
    rm -f "$SHARDS_ERR"
    export AIRBNB_DISCOVERY_QUERIES="$SHARDS"
    (cd "$COLLECTOR_DIR" && npm run collect -- collect --city "$CITY" --source airbnb-discovery)
    unset AIRBNB_DISCOVERY_QUERIES

    # Listing batches — lặp tới khi hết (mỗi batch 25, ~4 phút)
    echo "--- $CITY: listing batches ---"
    for i in $(seq 1 20); do
      out=$(cd "$COLLECTOR_DIR" && npm run collect -- collect --city "$CITY" --source airbnb-listing 2>&1)
      echo "$out" | grep -E "\[airbnb-listing" | tail -1
      if echo "$out" | grep -q "không còn việc"; then
        echo "hết listing cần fetch"
        break
      fi
      sleep 3
    done
  done
else
  echo "SKIP_COLLECT=1 — bỏ qua collector"
fi

# Finalize: import → reassign-areas (phường theo tọa độ, G0-b) → transform
# → 300_metrics → 400_breakdowns → 410_listing_stats. Thứ tự nằm trong finalize-hanoi.sh,
# psql đi qua docker compose ở $ROOT/db (DB_DIR).
bash "$PIPELINE_DIR/finalize-hanoi.sh"

# 3110-7: city ngoài hanoi (hcm) — nạp snapshot mới + transform + gán phường
# đúng city, rồi chạy lại rollup đúng bẫy «sau mọi transform: reassign rồi
# 300 + 400». finalize-hanoi.sh chỉ lo chuỗi hanoi.
PSQL=(docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest)
for CITY in "${CITIES[@]}"; do
  [ "$CITY" = "hanoi" ] && continue
  echo "--- $CITY: nạp + transform + gán phường ---"
  for d in "$ROOT"/collector/snapshots/"$CITY"/"${CITY}"__airbnb-*__*; do
    [ -d "$d" ] || continue
    sid=$(basename "$d")
    n=$(cd "$DB_DIR" && "${PSQL[@]}" -t -A -c "SELECT count(*) FROM airbnb_snapshots WHERE snapshot_id='$sid'")
    if [ "$n" = "0" ]; then
      (cd "$PIPELINE_DIR" && node import-airbnb.mjs "$d")
    fi
  done
  (cd "$PIPELINE_DIR" && node transform-airbnb.mjs "$CITY" && node reassign-areas.mjs "$CITY")
done
# rollup lại sau transform/gán vùng của city ngoài hanoi
if [ "${#CITIES[@]}" -gt 1 ] || [ "${CITIES[0]}" != "hanoi" ]; then
  (cd "$DB_DIR" \
    && "${PSQL[@]}" -v ON_ERROR_STOP=1 -q < ../pipeline/sql/300_metrics.sql \
    && "${PSQL[@]}" -v ON_ERROR_STOP=1 -q < ../pipeline/sql/400_breakdowns.sql \
    && "${PSQL[@]}" -v ON_ERROR_STOP=1 -q < ../pipeline/sql/410_listing_stats.sql)
  # 3110-7 MỞ LẠI (2): 410 chạy SAU khi city ngoài hanoi đã transform — số HCM
  # không còn trễ một ngày; ON_ERROR_STOP cho cả 3 khối.
fi

echo "=== $(date) done ==="
