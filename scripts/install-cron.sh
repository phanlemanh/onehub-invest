#!/usr/bin/env bash
# install-cron.sh — cài 3 launchd job (collector tuần + smoke ngày + backup
# tuần). Chạy MỘT LẦN bởi người dùng (đụng ~/Library/LaunchAgents — không tự
# chạy trong build/plan):
#   bash scripts/install-cron.sh                # đủ 3 job (hành vi cũ)
#   bash scripts/install-cron.sh --chi backup   # CHỈ job backup — không chạm
#                                               # collector/smoke đang chạy
# Env tùy chọn khi gọi: BACKUP_DIR (đĩa ngoài), BACKUP_PASS (passphrase raw).
# BACKUP_PASS lưu vào macOS Keychain (ADR-0007 DR) — KHÔNG ghi vào plist.
set -euo pipefail

# --chi <job...> (061-37): chỉ cài các job nêu tên (collector|smoke|backup);
# vắng cờ thì cài đủ 3 như cũ. Nhiều tên cách nhau bởi khoảng trắng.
# 0711-27: --chi mà KHÔNG kèm tên job nào → lỗi thoát 2, không ghi plist
# (trước rơi về cài cả ba — vô tình khởi động lại collector).
JOBS=()
CO_CHI=0
while [ $# -gt 0 ]; do
  case "$1" in
    --chi)
      CO_CHI=1
      shift
      while [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; do
        case "$1" in
          collector|smoke|backup) JOBS+=("$1") ;;
          *) echo "lỗi: job không biết '$1' (collector|smoke|backup)" >&2; exit 2 ;;
        esac
        shift
      done
      ;;
    *) echo "lỗi: cờ không biết '$1'" >&2; exit 2 ;;
  esac
done
if [ "$CO_CHI" -eq 1 ] && [ "${#JOBS[@]}" -eq 0 ]; then
  echo "lỗi: --chi cần ít nhất một tên job (collector|smoke|backup) — không ghi plist nào" >&2
  exit 2
fi
if [ "${#JOBS[@]}" -eq 0 ]; then
  JOBS=(collector smoke backup)
fi

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

for f in "${JOBS[@]}"; do
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
