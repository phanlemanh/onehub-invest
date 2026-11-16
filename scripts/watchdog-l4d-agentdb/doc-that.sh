#!/bin/bash
# doc-that.sh — phép đọc THẬT của L4d (AC-9/E10 hồ sơ bo-canh-dem-luot-agent):
# rút đúng hàm l4d_read_db từ script bộ canh đang viết, chạy dưới môi trường
# tối giản kiểu launchd (env -i, PATH hệ thống, /bin/bash 3.2), trên MỌI kho
# phiên thật VÀ trên bản chép của từng kho đã đóng sạch -wal/-shm (trạng thái
# đọc bằng immutable=1 — lỗi rc 14 ngày 06/11); mỗi lần in
# "<agent> <that|ban-chep> count|max" — KHÔNG in nội dung, KHÔNG ghi mốc thật,
# KHÔNG alert. Kho thật chỉ được ĐỌC (cp đọc tệp; mọi ghi chỉ trên bản chép
# trong thư mục tạm).
# Mã thoát: 0 khi đọc được ít nhất một kho và MỌI lần đọc đúng khuôn số|số;
# 1 khi có lần đọc lỗi/lệch khuôn, khi không gặp kho nào, hay khi không dựng
# được bản chép đóng sạch — đọc lỗi thì không được gộp.
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

TAM=$(mktemp -d "${TMPDIR:-/tmp}/l4d-doc-that.XXXXXX") || { echo "LOI: không tạo được thư mục tạm" >&2; exit 1; }
trap 'rm -rf "$TAM"' EXIT

SO_KHO=0
SO_LOI=0
doc_mot() { # $1=agent $2=nhãn $3=DB → in một dòng hoặc đếm lỗi
  local R
  if R=$(l4d_read_db "$3") && [[ "$R" =~ ^[0-9]+\|[0-9]+$ ]]; then
    echo "$1 $2 $R"
  else
    echo "$1 $2 LOI-doc-khong-duoc" >&2
    SO_LOI=$((SO_LOI + 1))
  fi
}

for DB in "${1:-$HOME/.openclaw/agents}"/*/agent/openclaw-agent.sqlite; do
  [ -e "$DB" ] || continue
  SO_KHO=$((SO_KHO + 1))
  AG=$(basename "$(dirname "$(dirname "$DB")")")
  doc_mot "$AG" that "$DB"

  # bản chép đóng sạch: chép tệp chính (+ -wal nếu có, để không mất dòng chưa
  # checkpoint), checkpoint TRUNCATE TRÊN BẢN CHÉP. sqlite3 của macOS giữ -wal
  # rỗng sau khi đóng (WAL bền), nên khi -wal đã về 0 byte thì xoá -wal/-shm
  # của BẢN CHÉP — đúng trạng thái SQLite để lại khi kết nối cuối đóng sạch
  # trên bản không giữ WAL. Kho thật chỉ bị đọc.
  D="$TAM/$AG"
  mkdir -p "$D"
  C="$D/openclaw-agent.sqlite"
  if ! cp "$DB" "$C" 2>/dev/null; then
    echo "$AG ban-chep LOI-khong-chep-duoc" >&2; SO_LOI=$((SO_LOI + 1)); continue
  fi
  if [ -e "$DB-wal" ]; then cp "$DB-wal" "$C-wal" 2>/dev/null || true; fi
  sqlite3 "$C" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null 2>&1
  if [ -e "$C-wal" ] && [ ! -s "$C-wal" ]; then rm -f "$C-wal" "$C-shm"; fi
  if [ -e "$C-wal" ] || [ -e "$C-shm" ] || [ -e "$C-journal" ]; then
    echo "$AG ban-chep LOI-chua-dong-sach" >&2; SO_LOI=$((SO_LOI + 1)); continue
  fi
  doc_mot "$AG" ban-chep "$C"
done

if [ "$SO_KHO" -eq 0 ]; then echo "LOI: không gặp kho phiên nào" >&2; exit 1; fi
if [ "$SO_LOI" -gt 0 ]; then echo "LOI: $SO_LOI lần đọc lỗi trên $SO_KHO kho" >&2; exit 1; fi
exit 0
