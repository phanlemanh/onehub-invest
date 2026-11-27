#!/usr/bin/env bash
# may-thu.sh — hồ sơ ops-hien-dung-chang-s03, E3: chạy may-thu.mjs trên bản chép dữ liệu thật của riêng lượt (db/db-thu.sh
# oneinvest_suite_on25_that --chay — chép từ DB máy thu, xoá khi xong). Trên Mac mini cần khoá s4 của đợt. Chiều đỏ: ON25_SQL_DO=1.
set -euo pipefail
GOC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$GOC/pipeline"
exec bash ../db/db-thu.sh oneinvest_suite_on25_that --chay node "$GOC/_acceptance/ops-hien-dung-chang-s03/probes/may-thu.mjs"
