#!/usr/bin/env bash
# Setup launchd cho weekly collector (chạy 1 lần):
#   bash pipeline/scripts/setup-cron.sh
set -euo pipefail
PLIST="$HOME/Library/LaunchAgents/com.oneinvest.collector.plist"
mkdir -p "$(dirname "$PLIST")"
cp "$(dirname "$0")/com.oneinvest.collector.plist" "$PLIST"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Đã cài: chạy thứ 7 hàng tuần lúc 06:00. Xem log: pipeline/logs/"
echo "Gỡ: launchctl bootout gui/$(id -u) $PLIST && rm $PLIST"
