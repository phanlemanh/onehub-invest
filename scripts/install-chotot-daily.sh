#!/usr/bin/env bash
# install-chotot.sh — cài launchd job vải công khai Chợ Tốt S06 05:30
# hằng ngày. Theo pattern install-cron.sh: PATH đầy đủ ghi vào plist.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
mkdir -p "$DEST" "$ROOT/pipeline/logs"

command -v node >/dev/null || { echo "lỗi: node không tìm thấy trong PATH" >&2; exit 1; }
command -v npm  >/dev/null || { echo "lỗi: npm không tìm thấy trong PATH" >&2; exit 1; }

SRC="$ROOT/pipeline/cron/com.oneinvest.chotot.plist"
OUT="$DEST/com.oneinvest.chotot.plist"
sed "s|__ROOT__|$ROOT|g" "$SRC" > "$OUT"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables dict" "$OUT" >/dev/null 2>&1 || true
LAUNCH_PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:PATH string $LAUNCH_PATH" "$OUT" >/dev/null 2>&1 \
  || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:PATH $LAUNCH_PATH" "$OUT"
chmod 600 "$OUT"
plutil -lint "$OUT" >/dev/null

launchctl bootout "gui/$UID_N" "$OUT" 2>/dev/null || true
launchctl bootstrap "gui/$UID_N" "$OUT"
echo "installed: $OUT — chạy 05:30 hằng ngày (launchctl list | grep airdna)"
