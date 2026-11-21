#!/usr/bin/env bash
# do-gio.sh <trần giây> <lệnh…> — chạy lệnh, in thời gian tường; đỏ khi lệnh đỏ hoặc quá trần. Hồ sơ slt-dc-cham-va-giu-khoa-33033.
# Tự kiểm trước mỗi lượt (đối chứng hai chiều trên cùng thước): `sleep 2` với trần 1 phải ra «QUA TRAN», `true` với trần 5 phải «GIO OK».
set -uo pipefail
do_gio() {
  local tran=$1; shift
  local t0=$SECONDS rc=0
  "$@" || rc=$?
  local wall=$((SECONDS - t0))
  echo "WALL ${wall} s (trần ${tran} s) · mã ${rc}"
  if [ "$rc" -ne 0 ]; then echo "LENH DO: mã ${rc}"; return "$rc"; fi
  if [ "$wall" -gt "$tran" ]; then echo "QUA TRAN: ${wall} s > ${tran} s"; return 1; fi
  echo "GIO OK"
}
if [ "${DO_GIO_TU_KIEM:-}" != "0" ]; then
  out=$(DO_GIO_TU_KIEM=0 bash "$0" 1 sleep 2) && { echo "TU KIEM HONG: sleep 2 trần 1 không đỏ"; exit 2; }
  grep -q "QUA TRAN" <<<"$out" || { echo "TU KIEM HONG: thiếu «QUA TRAN»"; exit 2; }
  out=$(DO_GIO_TU_KIEM=0 bash "$0" 5 true) || { echo "TU KIEM HONG: true trần 5 đỏ"; exit 2; }
  grep -q "GIO OK" <<<"$out" || { echo "TU KIEM HONG: thiếu «GIO OK»"; exit 2; }
  echo "tự kiểm thước giờ: hai chiều đúng"
fi
[ "$#" -ge 2 ] || { echo "do-gio: cần <trần giây> <lệnh…>"; exit 2; }
do_gio "$@"
