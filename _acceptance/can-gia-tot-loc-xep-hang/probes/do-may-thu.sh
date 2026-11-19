#!/usr/bin/env bash
# Đo trên DB máy thu, phiên chỉ đọc. Cờ --doi-chung-thu-tu: đo bằng thứ tự cũ, phải ra 0/15 và thoát khác 0.
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc/app"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
export PGOPTIONS="-c default_transaction_read_only=on"
exec node --import tsx --conditions=react-server "$goc/_acceptance/can-gia-tot-loc-xep-hang/probes/do-may-thu.mts" "$@"
