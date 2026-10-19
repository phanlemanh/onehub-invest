#!/usr/bin/env bash
# install-cron.sh — cài 3 launchd job (collector tuần + smoke ngày + backup
# tuần). Chạy MỘT LẦN bởi người dùng (đụng ~/Library/LaunchAgents — không tự
# chạy trong build/plan):
#   bash scripts/install-cron.sh
# Env tùy chọn khi gọi: BACKUP_DIR (đĩa ngoài), BACKUP_PASS (passphrase raw),
# WEBHOOK_URL — được ghi vào plist backup nếu đặt.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
mkdir -p "$DEST" "$ROOT/pipeline/logs"

for f in collector smoke backup; do
  SRC="$ROOT/pipeline/cron/com.oneinvest.$f.plist"
  OUT="$DEST/com.oneinvest.$f.plist"
  sed "s|__ROOT__|$ROOT|g" "$SRC" > "$OUT"
  # backup job cần env nếu người dùng có
  if [ "$f" = "backup" ] && [ -n "${BACKUP_DIR:-}" ]; then
    /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables dict" "$OUT" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:BACKUP_DIR $BACKUP_DIR" "$OUT"
    [ -n "${BACKUP_PASS:-}" ] && \
      /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:BACKUP_PASS $BACKUP_PASS" "$OUT"
  fi
  plutil -lint "$OUT" >/dev/null
  launchctl bootout "gui/$UID_N" "$OUT" 2>/dev/null || true
  launchctl bootstrap "gui/$UID_N" "$OUT"
  echo "installed: $OUT"
done
echo "xong — kiểm tra: launchctl list | grep oneinvest"
