#!/usr/bin/env bash
# PL41: phép đo trần trên bản chép DB máy thu (DB của riêng lượt, xoá khi xong). Không in giá trị ô nào.
set -euo pipefail
cd "$(dirname "$0")/../../.."
exec bash db/db-thu.sh oneinvest_suite_pl41 --chay node _acceptance/street-raw-tran-dem-tren-phat-bieu-song/probes/tran.mjs
