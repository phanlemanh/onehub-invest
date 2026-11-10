#!/usr/bin/env bash
# db-dong-bang.sh — nguồn đo đóng băng cho E8 (enrich-nguoi-s03). Giám sát quyết 06/11: đo trên DB đang sống thì số trôi
# theo dữ liệu thu, nên E8 đo trên một bản dump chụp một lần, mốc MOC_0611 chốt từ chính bản dump đó.
# Bản dump nằm ở research-local/ của checkout chính (gitignored — có SĐT tầng C và nội dung bài), dùng chung mọi worktree.
#   bash _acceptance/enrich-nguoi-s03/probes/db-dong-bang.sh <tên DB thử>          dựng lại DB thử từ bản dump
#   bash _acceptance/enrich-nguoi-s03/probes/db-dong-bang.sh <tên DB thử> --chup   chụp bản dump từ oneinvest (một lần)
set -euo pipefail
TEN="${1:?thiếu tên DB thử}"
[[ "$TEN" =~ ^oneinvest_[a-z0-9_]+$ ]] || { echo "db-dong-bang: tên phải dạng oneinvest_<việc> (không được là oneinvest)"; exit 2; }
GOC="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
DUMP="$GOC/research-local/enrich-nguoi-s03/e8-0611.dump"
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db)

if [ "${2:-}" = "--chup" ]; then
  [ ! -e "$DUMP" ] || { echo "db-dong-bang: $DUMP đã có — bản dump chụp một lần, chụp lại là đổi nguồn đo (cần dòng revisit)"; exit 2; }
  mkdir -p "$(dirname "$DUMP")"
  "${DX[@]}" pg_dump -U oneinvest -h localhost -Fc --no-owner --exclude-extension=pg_cron --exclude-schema=cron \
    --exclude-table-data=stg_calendar --exclude-table-data=stg_abnb_nights oneinvest > "$DUMP.tmp"
  mv "$DUMP.tmp" "$DUMP"
  echo "db-dong-bang: đã chụp — sha256 $(shasum -a 256 "$DUMP" | cut -d' ' -f1)"
  exit 0
fi

[ -f "$DUMP" ] || { echo "db-dong-bang: thiếu bản dump $DUMP — E8 không có nguồn đo"; exit 3; }
"${DX[@]}" dropdb -U oneinvest -h localhost --force --if-exists "$TEN"
"${DX[@]}" createdb -U oneinvest -h localhost "$TEN"
"${DX[@]}" pg_restore -U oneinvest -h localhost --no-owner --exit-on-error -d "$TEN" < "$DUMP"
echo "db-dong-bang: $TEN dựng từ bản dump đóng băng"
