#!/usr/bin/env bash
# data-api-ten-nguon-db.sh — hồ sơ data-api-don-ten-nguon (PB5) AC-4 ở máy dev: dựng PostGIS DÙNG MỘT LẦN rồi chạy các ca
# PB5-AC-4 của scripts/data-api-ten-nguon.test.mjs trong container node cùng mạng với nó — không cần chuyển cổng ra máy
# (colima của M5 không chuyển cổng), không đụng DB :5433 thật. Trên CI các ca này chạy với service của job.
# Thoát: mã của node --test (0 xanh).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
N="pb5-pg-$$"
CONG=5432   # cổng của PostGIS trong mạng container (không chuyển ra máy)
trap 'docker rm -f "$N" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$N" -e POSTGRES_USER=oneinvest -e POSTGRES_PASS=oneinvest -e POSTGRES_DB=oneinvest kartoza/postgis:17-3.5 >/dev/null
# ảnh kartoza khởi động lại một lần sau khởi tạo: chờ «ready» lần hai rồi pg_isready
for _ in $(seq 1 180); do
  if [ "$(docker logs "$N" 2>&1 | grep -c 'ready to accept connections')" -ge 2 ] && docker exec "$N" pg_isready -h localhost -U oneinvest -d oneinvest >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$N" pg_isready -h localhost -U oneinvest -d oneinvest >/dev/null || { echo "data-api-ten-nguon-db: PostGIS tạm không sẵn sàng sau 180 giây" >&2; exit 2; }
docker run --rm --network "container:$N" -v "$ROOT:$ROOT" -w "$ROOT" \
  -e DATABASE_URL="postgres://oneinvest:oneinvest@localhost:${CONG}/oneinvest" -e NODE_PATH=/tmp/x/node_modules node:24 \
  sh -c 'mkdir -p /tmp/x && cd /tmp/x && npm i --silent --no-save pg@8 >/dev/null 2>&1 && cd "$0" && node --test --test-name-pattern="PB5-AC-4" scripts/data-api-ten-nguon.test.mjs' "$ROOT"
