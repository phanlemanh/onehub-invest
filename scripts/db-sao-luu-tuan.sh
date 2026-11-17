#!/bin/bash
# db-sao-luu-tuan.sh — job sao lưu tuần DB trên máy (1711-15, lời Mạnh «Không cần
# mật khẩu» + «Đúng, lưu trên máy»): GỌI scripts/db-sao-luu.sh có sẵn (dump pg_dump
# -Fc KHÔNG mã hoá vào $HOME/onehub-backups/db/<UTC>/ — KHÔNG gửi ra ngoài máy,
# KHÔNG đụng raw snapshot), rồi XOAY giữ 8 bản tuần gần nhất qua
# scripts/lib/db-sao-luu-xoay.sh (chỉ xoá thư mục khớp khuôn UTC do job tạo).
# Dump lỗi → thoát khác 0 để launchd/audit-all thấy. KHÔNG tự cài launchd — cài qua
# scripts/install-cron.sh --chi backup là bước triển khai riêng.
# Env test: SAO_LUU_LENH thay lệnh dump (mặc định bash <tệp này>/db-sao-luu.sh).
set -uo pipefail
DAY_DU="$(cd "$(dirname "$0")" && pwd)"
if [ -n "${SAO_LUU_LENH:-}" ]; then
  # env test: SAO_LUU_LENH là ĐƯỜNG TỆP script dump-giả (không ghép chuỗi lệnh)
  bash "$SAO_LUU_LENH" || exit $?
else
  bash "$DAY_DU/db-sao-luu.sh" || exit $?
fi
bash "$DAY_DU/lib/db-sao-luu-xoay.sh" "${DB_BACKUP_ROOT:-$HOME/onehub-backups/db}" 8
