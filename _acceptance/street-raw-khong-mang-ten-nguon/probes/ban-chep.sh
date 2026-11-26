#!/usr/bin/env bash
# PL39: phép đo trên bản chép DB máy thu (DB của riêng lượt, xoá khi xong). Không in giá trị ô nào.
set -euo pipefail
cd "$(dirname "$0")/../../.."
exec bash db/db-thu.sh oneinvest_suite_pl39 --chay node _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs
