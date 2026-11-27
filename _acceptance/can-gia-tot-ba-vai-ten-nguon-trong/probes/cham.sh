#!/usr/bin/env bash
# cham.sh AC-n — can-gia-tot-ba-vai-ten-nguon-trong: ca AC-n xanh trên mã thật VÀ mọi đột biến của AC-n đỏ với thông điệp ghim.
set -euo pipefail
AC="${1:?thiếu mã AC (vd AC-1)}"
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
exec node "$GOC/_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/dot-bien.mjs" "$AC"
