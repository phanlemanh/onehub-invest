#!/bin/bash
# db-sao-luu-xoay.sh — xoay bản sao lưu tuần DB (1711-15 MỞ LẠI 1711-17): giữ N bản
# mới nhất, XOÁ phần thừa — CHỈ xoá thư mục CON THỎA cả hai điều kiện:
#   (1) tên khớp khuôn mốc UTC ^[0-9]{8}T[0-9]{6}Z$; (2) CÓ tệp dấu
#   '.tao-boi-job-tuan' do job tuần tạo. Chạy db-sao-luu.sh BẰNG TAY cũng sinh
#   khuôn UTC nhưng KHÔNG có tệp dấu → không bao giờ bị đụng (24 thư mục tay trên
#   máy thu, GS đo 17/11; ca đỏ SLLT-2 chứng: gỡ kiểm dấu thì ca đỏ).
#   Env SAO_LUU_XOAY_THU=1: chỉ IN danh sách sẽ xoá, không xoá — lượt đầu trên máy
#   thu chạy chế độ này, giám sát đọc danh sách rồi mới cho chạy thật.
#   bash scripts/lib/db-sao-luu-xoay.sh <gốc> [số-giữ — mặc định 8]
# POSIX thuần (ls/sort/grep/rm) — chạy được cả linux CI.
set -uo pipefail
GOC="${1:?thiếu gốc sao lưu}"
SO_GIU="${2:-8}"
if [ ! -d "$GOC" ]; then echo "db-sao-luu-xoay: không có gốc $GOC — không xoay" >&2; exit 0; fi
for d in "$GOC"/*; do
  [ -d "$d" ] || continue
  t=${d##*/}
  echo "$t" | grep -qE '^[0-9]{8}T[0-9]{6}Z$' || continue
  [ -f "$d/.tao-boi-job-tuan" ] || continue # dấu job — bản tay/chạy tay không có
  echo "$t"
done | LC_ALL=C sort -r | tail -n +$((SO_GIU + 1)) | while read -r t; do
  if [ "${SAO_LUU_XOAY_THU:-0}" = "1" ]; then
    echo "SẼ XOÁ (chạy thử, chưa xoá): $t"
  else
    echo "xoay: bỏ $t (>$SO_GIU bản)"
    rm -rf "${GOC:?}/$t"
  fi
done
