#!/usr/bin/env bash
# install-cron.sh — cài 3 launchd job (collector tuần + smoke ngày + backup
# tuần). Chạy MỘT LẦN bởi người dùng (đụng ~/Library/LaunchAgents — không tự
# chạy trong build/plan):
#   bash scripts/install-cron.sh
# Env tùy chọn khi gọi: BACKUP_DIR (đĩa ngoài), BACKUP_PASS (passphrase raw).
# BACKUP_PASS lưu vào macOS Keychain (ADR-0007 DR) — KHÔNG ghi vào plist.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
mkdir -p "$DEST" "$ROOT/pipeline/logs"

# launchd PATH mặc định (/usr/bin:...) không có npm/docker — build PATH đầy đủ
# từ shell người dùng (homebrew, ~/.local/bin) và ghi vào mọi plist.
LAUNCH_PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
command -v npm   >/dev/null || { echo "lỗi: npm không tìm thấy trong PATH" >&2; exit 1; }
command -v docker >/dev/null || { echo "lỗi: docker không tìm thấy trong PATH" >&2; exit 1; }

# Passphrase backup → Keychain (service oneinvest-backup); script đọc lại lúc chạy
if [ -n "${BACKUP_PASS:-}" ]; then
  printf '%s' "$BACKUP_PASS" | security add-generic-password -U -s oneinvest-backup -a oneinvest -w
  echo "BACKUP_PASS → Keychain (oneinvest-backup)"
fi

for f in collector smoke backup; do
  SRC="$ROOT/pipeline/cron/com.oneinvest.$f.plist"
  OUT="$DEST/com.oneinvest.$f.plist"
  sed "s|__ROOT__|$ROOT|g" "$SRC" > "$OUT"
  /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables dict" "$OUT" >/dev/null 2>&1 || true
  /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:PATH string $LAUNCH_PATH" "$OUT" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:PATH $LAUNCH_PATH" "$OUT"
  if [ "$f" = "backup" ] && [ -n "${BACKUP_DIR:-}" ]; then
    /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:BACKUP_DIR string $BACKUP_DIR" "$OUT" >/dev/null 2>&1 \
      || /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:BACKUP_DIR $BACKUP_DIR" "$OUT"
  fi
  chmod 600 "$OUT"
  plutil -lint "$OUT" >/dev/null
  launchctl bootout "gui/$UID_N" "$OUT" 2>/dev/null || true
  launchctl bootstrap "gui/$UID_N" "$OUT"
  echo "installed: $OUT"
done
echo "xong — kiểm tra: launchctl list | grep oneinvest"
