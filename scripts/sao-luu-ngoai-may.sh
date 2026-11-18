#!/bin/bash
# sao-luu-ngoai-may.sh — lối vào sao lưu ngoài máy (restic mã hoá trên máy, đích B2) cho launchd và người.
#   bash scripts/sao-luu-ngoai-may.sh chay | kiem | kiem-db | khoi-tao | soat-khoa [đường…] | trang-thai
# Toàn bộ logic ở scripts/lib/sao-luu-ngoai-may.mjs (đọc đầu tệp đó: mã thoát, biến SAO_LUU_*, nơi đặt khoá).
# Hồ sơ _acceptance/sao-luu-ma-hoa-b2/. Lượt gửi thật và lịch chạy chờ lời riêng của Mạnh.
set -uo pipefail
exec node "$(cd "$(dirname "$0")" && pwd)/lib/sao-luu-ngoai-may.mjs" "$@"
