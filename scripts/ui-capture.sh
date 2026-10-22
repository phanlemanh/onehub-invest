#!/bin/bash
# ui-capture.sh <url> <out.png> — capture.ui của _acceptance/config.yaml.
# Chụp một trang ra FILE (khung bằng chứng cho slideshow Cổng 2). Dùng
# playwright-cli đã cài trên máy (npm i -g @playwright/cli); session riêng
# theo PID để không đụng phiên trình duyệt khác.
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <url> <out.png>" >&2
  exit 2
fi
url="$1"
out="$2"
command -v playwright-cli >/dev/null || { echo "thiếu playwright-cli: npm i -g @playwright/cli" >&2; exit 3; }

mkdir -p "$(dirname "$out")"
session="ui-capture-$$"
trap 'playwright-cli -s="$session" close >/dev/null 2>&1 || true' EXIT

playwright-cli -s="$session" open "$url" >/dev/null
playwright-cli -s="$session" screenshot --full-page --filename "$out" >/dev/null
[ -s "$out" ] || { echo "không tạo được ảnh: $out" >&2; exit 1; }
echo "$out"
