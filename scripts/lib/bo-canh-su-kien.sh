#!/bin/bash
# bo-canh-su-kien.sh — S4 lượt 3 (3) MỞ LẠI 0611-6: bộ canh (watchdog) ghi sự
# kiện 'bo-canh' vào TỆP SỰ KIỆN CHUNG của bộ tra (sukien-listener.jsonl trong
# S03_LOOKUP_DIR) khi cảnh báo — bộ tra thấy trong 30′ sau lời gọi → điểm dừng
# an toàn listener-dong-sau-goi.
# Thư mục việc đọc THEO ENV GATEWAY (một nguồn): biến S03_LOOKUP_DIR của chính
# tiến trình watchdog nếu có, không thì dòng S03_LOOKUP_DIR=... trong tệp env
# của gateway (ai.openclaw.gateway.env — cùng giá trị gateway đang dùng).
# Tách hàm riêng để kiểm chứng được mà không phải chạy alert (alert kill gateway).

GATEWAY_ENV_FILE="${GATEWAY_ENV_FILE:-$HOME/.openclaw/service-env/ai.openclaw.gateway.env}"

doc_s03_lookup_dir() {
  local dir="${S03_LOOKUP_DIR:-}"
  if [ -z "$dir" ] && [ -f "$GATEWAY_ENV_FILE" ]; then
    dir=$(grep -E '^[A-Za-z_]*S03_LOOKUP_DIR=' "$GATEWAY_ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  fi
  printf '%s' "$dir"
}

ghi_bo_canh() {
  local dir="$1"
  [ -z "$dir" ] && return 0
  [ -d "$dir" ] || return 0
  printf '{"atMs":%s,"loai":"bo-canh"}\n' "$(( $(date +%s) * 1000 ))" \
    >> "$dir/sukien-listener.jsonl" 2>/dev/null || true
}
