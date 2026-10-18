#!/usr/bin/env bash
# setup.sh — cài đặt One Invest từ scratch trên máy mới
# Chạy: bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "=== One Invest Setup ==="
echo "Root: $ROOT"

# 1. Docker PostgreSQL
echo ""
echo ">>> 1. Khởi động PostgreSQL (Docker)..."
cd "$ROOT/db"
docker compose up -d
echo "    Chờ 15 giây cho DB sẵn sàng..."
sleep 15
echo "    ✓ PostgreSQL chạy tại localhost:5433"

# 2. Restore database nếu có dump
if [ -f "$ROOT/database.sql" ]; then
  echo ""
  echo ">>> 2. Restore database từ database.sql..."
  cat "$ROOT/database.sql" | docker compose exec -T -e PGPASSWORD=oneinvest db \
    psql -h localhost -U oneinvest -d oneinvest
  echo "    ✓ Database restored"
else
  echo ""
  echo ">>> 2. Chạy migrations (không có dump)..."
  for f in "$ROOT"/db/migrations/*.sql; do
    docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest -q < "$f"
  done
  echo "    ✓ Migrations applied"
fi

# 3. App (Next.js Dashboard)
echo ""
echo ">>> 3. Cài dependencies Dashboard..."
cd "$ROOT/app"
if [ ! -f .env.local ]; then
  echo "DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest" > .env.local
  echo "    ✓ Tạo .env.local mặc định"
fi
npm install
npm run build
echo "    ✓ Dashboard build thành công"

# 4. Collector
echo ""
echo ">>> 4. Cài dependencies Collector..."
cd "$ROOT/collector"
npm install
npm run build
echo "    ✓ Collector build thành công"

# 5. Pipeline
echo ""
echo ">>> 5. Cài dependencies Pipeline..."
cd "$ROOT/pipeline"
npm install
echo "    ✓ Pipeline sẵn sàng"

# 6. Verify
echo ""
echo ">>> 6. Verify..."
cd "$ROOT/app"
npm run start -- -p 3456 &
APP_PID=$!
sleep 5

HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3456/vn/hanoi)
if [ "$HTTP" = "200" ]; then
  echo "    ✓ Dashboard: http://localhost:3456/vn/hanoi"
else
  echo "    ⚠ Dashboard HTTP $HTTP — kiểm tra log"
fi

cd "$ROOT/collector"
SOURCES=$(npm run collect -- list-sources 2>/dev/null | grep -c "^\w" || echo "0")
echo "    ✓ Collector: $SOURCES sources"

kill $APP_PID 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════"
echo "  Setup hoàn tất!"
echo ""
echo "  Dashboard:  cd app && npm run start -- -p 3456"
echo "  Collector:  cd collector && npm run collect -- collect --city hanoi --source airbnb-discovery"
echo "  Pipeline:   cd pipeline && node finalize-hanoi.sh"
echo "═══════════════════════════════════════"
