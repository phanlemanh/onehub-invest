#!/usr/bin/env bash
# _chung.sh — hàm dùng chung cho probe DA3 bang-noi-ma-du-an. Mọi phép đo DB chạy trên DB của riêng lượt (db/db-thu.sh --chay:
# bản chép DB máy thu, xoá khi lệnh dừng); không ghi vào oneinvest. Tên DB mang PID để các probe chạy song song được.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DB_THU="$ROOT/db/db-thu.sh"
dbt() { echo "oneinvest_suite_da3_$1_$$"; }
# chay_db <nhãn> <thư mục> <lệnh…> — chạy lệnh trên DB của riêng lượt, in đuôi log; thoát theo mã của lệnh.
chay_db() {
  local nhan="$1" thu="$2"; shift 2
  (cd "$ROOT/$thu" && bash "$DB_THU" "$(dbt "$nhan")" --chay "$@")
}
