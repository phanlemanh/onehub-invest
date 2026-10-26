#!/usr/bin/env bash
# install-collector-api.sh — ZC4 (claudedp-2510-33): cài launchd job collector
# API :9210 theo khuôn install-*.sh. KHÔNG tự bootstrap — in đúng cặp lệnh
# bootout/bootstrap cho bước TRIỂN KHAI riêng (tiến trình tay :9210 đang chạy
# phải được hạ đúng trình tự, là lời giao triển khai riêng).
# Dùng: scripts/install-collector-api.sh [--dry]   (--dry: chỉ in, không ghi)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
SRC_PLIST="$ROOT/pipeline/cron/com.oneinvest.collector-api.plist"
OUT="$DEST/com.oneinvest.collector-api.plist"
DRY=0
[ "${1:-}" = "--dry" ] && DRY=1

die() { echo "lỗi: $*" >&2; exit 1; }

# ---- kiểm TRƯỚC khi ghi/in lệnh (2510-33): mọi điều kiện chạy được ----
[ -f "$SRC_PLIST" ] || die "thiếu $SRC_PLIST"
DIST="$ROOT/collector/dist/api/main.js"
[ -f "$DIST" ] || die "thiếu $DIST — build collector trước (cd collector && npm run build)"
SRCJS="$ROOT/collector/src/api/main.ts"
[ -f "$SRCJS" ] || SRCJS="$ROOT/collector/src/api/main.js"
[ -f "$SRCJS" ] || die "thiếu nguồn $SRCJS để so tuổi build"
[ "$DIST" -nt "$SRCJS" ] || die "collector/dist/api/main.js CŨ hơn src — build lại trước khi cài (rm -rf dist && npm run build)"
NODE_BIN="$(sed -nE 's/^exec ([^ ]+) .*/\1/p' "$ROOT/collector/scripts/api-launchd.sh" | head -1)"
[ -n "$NODE_BIN" ] || die "không đọc được lệnh exec node trong collector/scripts/api-launchd.sh"
[ -x "$NODE_BIN" ] || die "node tuyệt đối '$NODE_BIN' (api-launchd.sh dùng) không tồn tại/thực thi được"
KEY="$HOME/.openclaw/credentials/oneinvest-agent.key"
[ -f "$KEY" ] || die "thiếu tệp khoá $KEY"

if [ "$DRY" = 1 ]; then
  echo "— dry: plist đã thế đường dẫn gốc (chưa ghi gì):"
  sed "s|__ROOT__|$ROOT|g" "$SRC_PLIST"
  echo "— dry: lệnh triển khai sẽ là:"
  echo "    launchctl bootout gui/$(id -u)/com.oneinvest.collector-api 2>/dev/null || true"
  echo "    launchctl bootstrap gui/$(id -u) $OUT"
  exit 0
fi

mkdir -p "$DEST"
sed "s|__ROOT__|$ROOT|g" "$SRC_PLIST" > "$OUT"
chmod 600 "$OUT"
plutil -lint "$OUT" >/dev/null
echo "đã ghi: $OUT (plutil -lint OK)"
echo "— TRIỂN KHAI (chạy tay — KHÔNG thuộc script này):"
echo "    launchctl bootout gui/$(id -u)/com.oneinvest.collector-api 2>/dev/null || true"
echo "    launchctl bootstrap gui/$(id -u) $OUT"
