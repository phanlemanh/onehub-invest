#!/usr/bin/env bash
# migrate-export.sh — đóng gói toàn bộ state để chuyển máy
# Chạy: bash scripts/migrate-export.sh
set -euo pipefail

BACKUP_DIR="$HOME/one-invest-backup-$(date +%Y%m%d-%H%M)"
mkdir -p "$BACKUP_DIR"

echo "=== 1. Dump PostgreSQL ==="
cd "$(dirname "$0")/../db"
docker compose exec -T -e PGPASSWORD=oneinvest db pg_dump \
  -h localhost -U oneinvest -d oneinvest \
  --no-owner --no-privileges > "$BACKUP_DIR/database.sql"
echo "  → $BACKUP_DIR/database.sql ($(du -h "$BACKUP_DIR/database.sql" | cut -f1))"

echo "=== 2. Copy environment files ==="
cp ../src/.env.local "$BACKUP_DIR/env.local" 2>/dev/null || echo "  (không có .env.local)"

echo "=== 3. Copy snapshots (raw data) ==="
cp -r "$HOME/dev/one-invest-collector/snapshots" "$BACKUP_DIR/snapshots"
echo "  → $BACKUP_DIR/snapshots ($(du -sh "$BACKUP_DIR/snapshots" | cut -f1))"

echo "=== 4. Copy AirDNA Chrome profile (login cookies) ==="
cp -r "$HOME/dev/one-invest-collector/.airdna-profile" "$BACKUP_DIR/airdna-profile"
echo "  → $BACKUP_DIR/airdna-profile ($(du -sh "$BACKUP_DIR/airdna-profile" | cut -f1))"

echo "=== 5. Copy collector state (checkpoints) ==="
cp -r "$HOME/dev/one-invest-collector/state" "$BACKUP_DIR/collector-state" 2>/dev/null || true

echo "=== 6. Tạo README hướng dẫn restore ==="
cat > "$BACKUP_DIR/README-RESTORE.md" <<'EOF'
# One Invest — Restore trên máy mới

## Yêu cầu
- Docker Desktop
- Node.js 24+ (nvm use)
- Chrome

## Bước 1: Clone repos
```bash
git clone git@github.com:YOUR_USERNAME/one-invest.git ~/dev/one-invest
git clone git@github.com:YOUR_USERNAME/one-invest-collector.git ~/dev/one-invest-collector
```

## Bước 2: Khôi phục database
```bash
cd ~/dev/one-invest/db
docker compose up -d
sleep 10
# Restore từ dump
cat database.sql | docker compose exec -T -e PGPASSWORD=oneinvest db \
  psql -h localhost -U oneinvest -d oneinvest
```

## Bước 3: Khôi phục env
```bash
cp env.local ~/dev/one-invest/src/.env.local
```

## Bước 4: Khôi phục snapshots + profile
```bash
cp -r snapshots ~/dev/one-invest-collector/snapshots
cp -r airdna-profile ~/dev/one-invest-collector/.airdna-profile
cp -r collector-state ~/dev/one-invest-collector/state 2>/dev/null || true
```

## Bước 5: Cài dependencies + chạy
```bash
# one-invest (Dashboard)
cd ~/dev/one-invest/src
npm ci
npm run build
npm run start -- -p 3456

# collector
cd ~/dev/one-invest-collector
npm ci
npm run build
```

## Bước 6: Verify
```bash
curl http://localhost:3456/vn/hanoi  # Dashboard
npm run collect -- list-sources       # Collector
```
EOF

echo ""
echo "=== Hoàn tất! ==="
echo "Backup: $BACKUP_DIR"
du -sh "$BACKUP_DIR"
echo ""
echo "→ Copy thư mục này sang máy mới (AirDrop, USB, rsync, hoặc cloud drive)"
echo "→ Sau đó làm theo README-RESTORE.md trong thư mục backup"
