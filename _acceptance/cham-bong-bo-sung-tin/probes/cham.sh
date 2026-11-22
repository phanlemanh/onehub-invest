#!/usr/bin/env bash
# cham.sh AC-n — NB1 cham-bong-bo-sung-tin: ca của AC-n xanh trên mã thật VÀ mọi đột biến của AC-n đỏ với thông điệp ghim, trên DB
# của riêng lượt (db/db-thu.sh --chay: chép từ bản mẫu, xoá khi xong; không chạm DB oneinvest dùng chung).
set -euo pipefail
AC="${1:?thiếu mã AC (vd AC-1)}"
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC/agent"
exec bash ../db/db-thu.sh oneinvest_suite_agent --chay node "$GOC/_acceptance/cham-bong-bo-sung-tin/probes/dot-bien.mjs" "$AC"
