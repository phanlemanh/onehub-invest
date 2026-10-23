#!/usr/bin/env bash
# install-airbnb-cron.sh — cài launchd job nguồn Airbnb tự thu:
#   airbnb-nightly: hằng ngày 19:35 (+jitter ≤20′) — PDP theo worklist AirDNA
#                   (Task 5 plan 2026-10-21-coverage-worklist) thay cron Chủ nhật
#   smoke:          hằng ngày 20:00 — 1 trang discovery phát hiện Airbnb đổi markup
# Job com.oneinvest.collector (Chủ nhật discovery-only) bị bootout — nightly thay thế.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/LaunchAgents"
UID_N="$(id -u)"
mkdir -p "$DEST" "$ROOT/pipeline/logs"

command -v npm    >/dev/null || { echo "lỗi: npm không tìm thấy trong PATH" >&2; exit 1; }
command -v docker >/dev/null || { echo "lỗi: docker không tìm thấy trong PATH" >&2; exit 1; }
command -v node   >/dev/null || { echo "lỗi: node không tìm thấy trong PATH" >&2; exit 1; }

LAUNCH_PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
# job Chủ nhật discovery-only cũ bị thay bởi nightly — gỡ hẳn: bootout + xoá
# bản đã cài + xoá khỏi repo (ZC5/B1: install-cron.sh của làn Claude không còn
# nguồn để cài lại nó nữa — chạy lại installer đó sẽ KHÔNG hồi sinh job cũ)
launchctl bootout "gui/$UID_N" "$DEST/com.oneinvest.collector.plist" 2>/dev/null || true
rm -f "$DEST/com.oneinvest.collector.plist"

for f in airbnb-nightly smoke; do
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
