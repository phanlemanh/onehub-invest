#!/bin/bash
# db-sao-luu-xoay.sh — xoay bản sao lưu tuần DB (1711-15): giữ N bản mới nhất,
# XOÁ phần thừa — CHỈ xoá thư mục con KHỚP KHUÔN mốc UTC mà job db-sao-luu-tuan
# tạo (^[0-9]{8}T[0-9]{6}Z$). Bản «truoc-…» hay tên khác do người/giám sát tạo
# tay trong ~/onehub-backups/db KHÔNG khớp khuôn → không bao giờ bị đụng
# (ca đỏ trong db-sao-luu-tuan.test.mjs: bỏ kiểm dấu thì ca này đỏ).
#   bash scripts/lib/db-sao-luu-xoay.sh <gốc> [số-giữ — mặc định 8]
# POSIX thuần (ls/sort/grep/rm) — chạy được cả linux CI.
set -uo pipefail
GOC="${1:?thiếu gốc sao lưu}"
SO_GIU="${2:-8}"
if [ ! -d "$GOC" ]; then echo "db-sao-luu-xoay: không có gốc $GOC — không xoay" >&2; exit 0; fi
ls -1 "$GOC" 2>/dev/null | grep -E '^[0-9]{8}T[0-9]{6}Z$' | LC_ALL=C sort -r | tail -n +$((SO_GIU + 1)) | while read -r t; do
  echo "xoay: bỏ $t (>$SO_GIU bản)"
  rm -rf "${GOC:?}/$t"
done
