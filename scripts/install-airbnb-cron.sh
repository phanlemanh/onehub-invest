#!/usr/bin/env bash
# install-airbnb-cron.sh — cài 2 launchd job cho nguồn Airbnb tự thu (C1):
#   collector: Chủ nhật 19:30 (+jitter ≤30 phút) — discovery + listing + finalize
#   smoke:     hằng ngày 20:00 — 1 trang discovery phát hiện Airbnb đổi markup
# (Backup tuần là job thứ 3 của install-cron.sh — cài riêng khi có BACKUP_DIR.)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
mkdir -p "$DEST" "$ROOT/pipeline/logs"

command -v npm    >/dev/null || { echo "lỗi: npm không tìm thấy trong PATH" >&2; exit 1; }
command -v docker >/dev/null || { echo "lỗi: docker không tìm thấy trong PATH" >&2; exit 1; }
command -v node   >/dev/null || { echo "lỗi: node không tìm thấy trong PATH" >&2; exit 1; }

LAUNCH_PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
for f in collector smoke; do
  SRC="$ROOT/pipeline/cron/com.oneinvest.$f.plist"
  OUT="$DEST/com.oneinvest.$f.plist"
  sed "s|__ROOT__|$ROOT|g" "$SRC" > "$OUT"
  /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables dict" "$OUT" >/dev/null 2>&1 || true
  /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:PATH string $LAUNCH_PATH" "$OUT" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:PATH $LAUNCH_PATH" "$OUT"
  chmod 600 "$OUT"
  plutil -lint "$OUT" >/dev/null
  launchctl bootout "gui/$UID_N" "$OUT" 2>/dev/null || true
  launchctl bootstrap "gui/$UID_N" "$OUT"
  echo "installed: $OUT"
done
echo "xong — kiểm tra: launchctl list | grep oneinvest"
