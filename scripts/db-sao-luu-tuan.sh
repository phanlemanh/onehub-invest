#!/bin/bash
# db-sao-luu-tuan.sh — job sao lưu tuần DB trên máy (1711-15 MỞ LẠI 1711-16/17,
# lời Mạnh «Không cần mật khẩu» + «Đúng, lưu trên máy»):
#   1. Tự sinh thư mục bản khuôn UTC trong gốc (mặc định $HOME/onehub-backups/db,
#      env DB_BACKUP_ROOT ghi đè) rồi GỌI scripts/db-sao-luu.sh với thư mục đó làm
#      đối số (dump pg_dump -Fc KHÔNG mã hoá — KHÔNG gửi ra ngoài máy, KHÔNG đụng
#      raw snapshot). Dump lỗi → thoát khác 0.
#   2. GHI TỆP DẤU '.tao-boi-job-tuan' vào thư mục bản vừa tạo — xoay CHỈ xoá thư
#      mục có dấu này; bản chạy tay (khuôn UTC không dấu) không bao giờ bị đụng.
#   3. DB_SAO_LUU_CHI mặc định 'oneinvest' (chỉ DB chính + globals; ~20 DB thử sót
#      không bị kéo) — env ghi đè được.
#   4. Xoay qua scripts/lib/db-sao-luu-xoay.sh; env SAO_LUU_XOAY_THU=1 chỉ in danh
#      sách sẽ xoá (lượt đầu trên máy thu chạy chế độ này, giám sát duyệt danh sách).
# KHÔNG tự cài launchd — cài qua scripts/install-cron.sh --chi backup là bước
# triển khai riêng. Env test: SAO_LUU_LENH là ĐƯỜNG TỆP script dump-giả.
set -uo pipefail
DAY_DU="$(cd "$(dirname "$0")" && pwd)"
GOC="${DB_BACKUP_ROOT:-$HOME/onehub-backups/db}"
export DB_SAO_LUU_CHI="${DB_SAO_LUU_CHI:-oneinvest}"
mkdir -p "$GOC"
DICH="$GOC/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$DICH" # db-sao-luu.sh đòi đích chưa có tệp; dump-giả trong test cũng ghi vào đây
if [ -n "${SAO_LUU_LENH:-}" ]; then
  # env test: SAO_LUU_LENH là ĐƯỜNG TỆP script dump-giả (nhận thư mục bản làm $1)
  bash "$SAO_LUU_LENH" "$DICH" || exit $?
else
  bash "$DAY_DU/db-sao-luu.sh" "$DICH" || exit $?
fi
: > "$DICH/.tao-boi-job-tuan" # tệp dấu job — xoay chỉ đếm thư mục có dấu này
bash "$DAY_DU/lib/db-sao-luu-xoay.sh" "$GOC" 8
