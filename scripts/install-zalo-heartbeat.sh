#!/usr/bin/env bash
# install-zalo-heartbeat.sh — cài launchd heartbeat 15′ cho ống Zalo (V2).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
mkdir -p "$DEST" "$ROOT/pipeline/logs"

command -v bash >/dev/null || { echo "lỗi: bash?" >&2; exit 1; }

SRC="$ROOT/pipeline/cron/com.oneinvest.zalo-heartbeat.plist"
OUT="$DEST/com.oneinvest.zalo-heartbeat.plist"
sed "s|__ROOT__|$ROOT|g" "$SRC" > "$OUT"
chmod 600 "$OUT"
plutil -lint "$OUT" >/dev/null
launchctl bootout "gui/$UID_N" "$OUT" 2>/dev/null || true
launchctl bootstrap "gui/$UID_N" "$OUT"
echo "installed: $OUT — mỗi 15 phút (RunAtLoad nên chạy ngay lần đầu)"
