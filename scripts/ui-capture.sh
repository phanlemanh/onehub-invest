#!/bin/bash
# ui-capture.sh <url> <out.png> — capture.ui của _acceptance/config.yaml.
# Chụp một trang ra FILE (khung bằng chứng cho slideshow Cổng 2) qua playwright-cli
# (npm i -g @playwright/cli), session riêng theo PID. URL /ops/** tự đăng nhập bằng tài
# khoản ops thử và che tầng A trước khi chụp (ON10) — chi tiết ở scripts/ui-capture-login.mjs.
# Chế độ: UI_CAPTURE_SCHEME=dark · UI_CAPTURE_SIZE=390x844.
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <url> <out.png>" >&2
  exit 2
fi
mkdir -p "$(dirname "$2")"
exec node "$(dirname "$0")/ui-capture-login.mjs" "$1" "$2"
