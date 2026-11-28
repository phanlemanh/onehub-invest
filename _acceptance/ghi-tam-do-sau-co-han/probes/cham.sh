#!/usr/bin/env bash
# cham.sh AC-n — ghi-tam-do-sau-co-han: ca của AC-n xanh trên mã thật (tests N, skipped 0) VÀ mọi đột biến của AC-n đỏ với
# thông điệp ghim. Ca DB chạy trên DB của riêng lượt (db/db-thu.sh --chay, chép từ bản mẫu; helper test nạp migration 129 trong
# giao dịch). E9 thuần, vẫn chạy qua cùng đường.
set -euo pipefail
AC="${1:?thiếu mã AC (vd AC-1)}"
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC"
exec bash db/db-thu.sh oneinvest_suite_nb10 --chay node "$GOC/_acceptance/ghi-tam-do-sau-co-han/probes/dot-bien.mjs" "$AC"
