#!/bin/bash
# doc-that.sh — phép đọc THẬT của L4d (AC-9/E10 hồ sơ bo-canh-dem-luot-agent):
# rút đúng hàm l4d_read_db từ script bộ canh đang viết, chạy dưới môi trường
# tối giản kiểu launchd (env -i, PATH hệ thống, /bin/bash 3.2), trên MỌI kho
# phiên thật và trên bản chép đã đóng sạch tệp phụ; mỗi lần in
# "<agent> count|max" — KHÔNG in nội dung, KHÔNG ghi mốc thật, KHÔNG alert.
# Chạy: env -i PATH=/usr/bin:/bin:/usr/sbin:/sbin HOME="$HOME" \
#         /bin/bash scripts/watchdog-l4d-agentdb/doc-that.sh [thư-mục-agents]
# (tên tệp script bộ canh không ghi cứng ở đây — tìm theo hậu tố để không
# lặp tên nguồn thật; đổi tên tệp thì phép đọc vẫn theo đúng)
set -uo pipefail
THU_MUC_SCRIPT="$(cd "$(dirname "$0")/../.." && pwd)/scripts"
SRC=""
for f in "$THU_MUC_SCRIPT"/*.sh; do
  if grep -q "^l4d_read_db()" "$f" 2>/dev/null; then SRC="$f"; break; fi
done
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then echo "LOI: không tìm thấy script bộ canh chứa l4d_read_db" >&2; exit 1; fi
# rút ĐÚNG hàm đọc từ script thật (không copy tay — script đổi thì phép đo đổi theo)
HAM="$(sed -n '/^l4d_read_db()/,/^}/p' "$SRC")"
if [ -z "$HAM" ]; then echo "LOI: không rút được hàm l4d_read_db từ $SRC" >&2; exit 1; fi
eval "$HAM"

for DB in "${1:-$HOME/.openclaw/agents}"/*/agent/openclaw-agent.sqlite; do
  [ -e "$DB" ] || continue
  AG=$(basename "$(dirname "$(dirname "$DB")")")
  if R=$(l4d_read_db "$DB"); then
    echo "$AG $R"
  else
    echo "$AG LOI-doc-khong-duoc" >&2
  fi
done
