#!/usr/bin/env bash
# cham.sh AC-n — cham-bong-cau-tra-loi-khong-bi-cat: ca của AC-n xanh trên mã thật VÀ mọi đột biến của AC-n đỏ với thông điệp ghim.
# Ca của hàng không đọc DB (Truy giả, model giả lập) nên không cần DB thử.
set -euo pipefail
AC="${1:?thiếu mã AC (vd AC-1)}"
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC/agent"
exec node "$GOC/_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/dot-bien.mjs" "$AC"
