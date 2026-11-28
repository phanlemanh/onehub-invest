#!/usr/bin/env bash
# chay-kho.sh — E9 (AC-9): chạy khô trên bản chép DB máy thu (DB của riêng lượt, không ghi): số theo khu, lý do, từng tin mức căn;
# thoát 1 khi OP1 tin mức trục + căn dưới 350.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/pipeline"
bash ../db/db-thu.sh oneinvest_suite_pl36_e9 --chay node scripts/ghep-tin-truc-can-kho.mjs --nguong 350
