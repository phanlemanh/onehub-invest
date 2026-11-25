#!/usr/bin/env bash
# E7 (AC-7): đầu ra các bên đọc bằng nhau trước áp, sau áp, sau đảo; chiều đỏ: cấy bí danh S09 dạng toà thì s09-dung đỏ.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e7 pipeline node scripts/noi-du-an-nguon-that.mjs ben-doc
LOG="$(mktemp -t da3-e7)"; trap 'rm -f "$LOG"' EXIT
if chay_db e7do pipeline node scripts/noi-du-an-nguon-that.mjs ben-doc --cay-do >"$LOG" 2>&1; then
  cat "$LOG"; echo "ĐỎ: cấy bí danh S09 dạng toà mà phép so bên đọc không đỏ"; exit 1
fi
grep -q 'LỆCH bên đọc s09-dung' "$LOG" || { tail -20 "$LOG"; echo "ĐỎ: chiều đỏ không gọi tên s09-dung"; exit 1; }
echo "chiều đỏ: cấy bí danh S09 dạng toà → phép so s09-dung đỏ"
