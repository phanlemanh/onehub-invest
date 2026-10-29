#!/bin/bash
# db-sao-luu.sh — sao lưu toàn bộ cụm DB local ra đĩa máy này (hồ sơ _acceptance/db-vao-volume/).
#   bash scripts/db-sao-luu.sh [thư mục]     mặc định $HOME/onehub-backups/db/<UTC>/
# Ra: <db>.dump (pg_dump -Fc) cho mỗi DB không phải template · globals.sql (pg_dumpall --globals-only) ·
#     so-dong.tsv (số dòng mọi bảng của oneinvest, đếm TRONG CÙNG snapshot với oneinvest.dump) · thong-tin.txt ·
#     manifest.sha256.
# Dump chứa user_events/user_profile (tầng A, AGENTS.md luật 6): thư mục nằm trong cây kho → thoát 2, không ghi gì.
# pg_dump chỉ lấy khoá AccessShare — không chặn đọc/ghi của job khác. pg_dump chạy trong container phụ cùng ảnh, nối
# qua mạng của container DB và ghi thẳng ra thư mục — không ghi gì vào lớp của container DB.
# Biến: DB_CONTAINER (one-invest-db) · DB_BACKUP_ROOT ($HOME/onehub-backups/db) · DB_SAO_LUU_SAU_SNAPSHOT_HOOK (lệnh
#       bash chạy ngay sau pg_export_snapshot — chỉ phép thử) · DB_SAO_LUU_DEM_NGOAI_SNAPSHOT=1 (đếm ở phiên riêng —
#       đối chứng đỏ của phép thử, không bao giờ dùng thật).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
C="${DB_CONTAINER:-one-invest-db}"
DICH="${1:-${DB_BACKUP_ROOT:-$HOME/onehub-backups/db}/$(date -u +%Y%m%dT%H%M%SZ)}"
die() { echo "FAIL $1"; exit "${2:-1}"; }

# Đường tuyệt đối của một đường có thể chưa tồn tại: đi lên tới tổ tiên có thật rồi ghép phần còn lại.
abs_path() {
  local p="$1" rest=""
  [[ "$p" = /* ]] || p="$PWD/$p"
  while [ ! -d "$p" ]; do rest="/$(basename "$p")$rest"; p=$(dirname "$p"); done
  echo "$(cd "$p" && pwd -P)$rest"
}
trong_kho() { # $1 đường tuyệt đối → 0 khi nằm trong worktree này hoặc checkout chính
  local g top common
  top=$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null) || return 1
  common=$(cd "$ROOT" && cd "$(git rev-parse --git-common-dir)" && cd .. && pwd -P)
  for g in "$(cd "$top" && pwd -P)" "$common"; do
    [[ "$1" == "$g" || "$1" == "$g"/* ]] && return 0
  done
  return 1
}

DICH=$(abs_path "$DICH")
trong_kho "$DICH" && die "đích nằm trong kho $DICH — bản sao lưu chứa dữ liệu tầng A, chỉ để ngoài cây kho" 2
[ -e "$DICH" ] && [ -n "$(ls -A "$DICH" 2>/dev/null)" ] && die "đích đã có tệp $DICH" 2
docker inspect "$C" >/dev/null 2>&1 || die "không có container $C" 2
IMG=$(docker inspect -f '{{.Config.Image}}' "$C")
mkdir -p "$DICH" || die "không tạo được $DICH" 2

PSQL=(docker exec -i -e PGPASSWORD=oneinvest "$C" psql -U oneinvest -h localhost -At -q -v ON_ERROR_STOP=1)
# Container phụ: cùng ảnh, chung mạng với $C, thư mục đích gắn ở /b.
phu() { docker run --rm -i --network "container:$C" -e PGPASSWORD=oneinvest -v "$DICH":/b --entrypoint "" "$IMG" "$@"; }

{
  echo "luc_utc $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "container $C"
  echo "anh $IMG"
  "${PSQL[@]}" -d postgres -c "select 'phien_ban '||version()" -c "show data_directory" | sed '2s/^/data_directory /'
  "${PSQL[@]}" -d postgres -c "select 'co_db '||datname||' '||pg_database_size(datname) from pg_database where not datistemplate order by 1"
} > "$DICH/thong-tin.txt" || die "không đọc được thông tin cụm $C"

# oneinvest: một phiên giữ giao dịch REPEATABLE READ, xuất snapshot, đếm trong chính giao dịch ấy, pg_dump dùng
# cùng snapshot, rồi mới COMMIT — số dòng và dump là cùng một thời điểm.
# bash 3.2 của macOS không có coproc: hai FIFO, fd 3 ghi lệnh vào phiên, fd 4 đọc kết quả.
FIFO=$(mktemp -d); mkfifo "$FIFO/vao" "$FIFO/ra"
trap 'exec 3>&- 4<&- 2>/dev/null; rm -rf "$FIFO"' EXIT
( "${PSQL[@]}" -d oneinvest < "$FIFO/vao" > "$FIFO/ra" 2>&1 ) & SNAP_PID=$!
exec 3>"$FIFO/vao"; exec 4<"$FIFO/ra"
echo "BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT pg_export_snapshot();" >&3
read -r -t 60 SID <&4 || die "không xuất được snapshot"
[[ "$SID" =~ ^[0-9A-F]+-[0-9A-F]+-[0-9]+$ ]] || die "snapshot lạ: $SID"
[ -n "${DB_SAO_LUU_SAU_SNAPSHOT_HOOK:-}" ] && bash -c "$DB_SAO_LUU_SAU_SNAPSHOT_HOOK"

DEM_SQL="select format('select %L||chr(9)||count(*) from %I.%I', n.nspname||'.'||c.relname, n.nspname, c.relname)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema','cron')
    and n.nspname not like 'pg_toast%' and n.nspname not like 'pg_temp%' order by 1"
if [ "${DB_SAO_LUU_DEM_NGOAI_SNAPSHOT:-}" = 1 ]; then
  printf '%s \\gexec\n' "$DEM_SQL" | "${PSQL[@]}" -d oneinvest > "$DICH/so-dong.tsv" || die "đếm số dòng lỗi"
else
  printf '%s \\gexec\n\\echo __HET_DEM__\n' "$DEM_SQL" >&3
  : > "$DICH/so-dong.tsv"
  while IFS= read -r -t 3600 dong <&4; do
    [ "$dong" = __HET_DEM__ ] && break
    [[ "$dong" == *$'\t'* ]] || die "đếm số dòng lỗi: $dong"
    echo "$dong" >> "$DICH/so-dong.tsv"
  done
  [ "$dong" = __HET_DEM__ ] || die "đếm số dòng không xong"
fi
phu pg_dump -U oneinvest -h localhost -Fc --snapshot="$SID" -f /b/oneinvest.dump oneinvest || die "pg_dump oneinvest lỗi"
echo "COMMIT;" >&3; exec 3>&-; wait "$SNAP_PID" 2>/dev/null; exec 4<&-

for db in $("${PSQL[@]}" -d postgres -c "select datname from pg_database where not datistemplate and datname <> 'oneinvest' order by 1"); do
  phu pg_dump -U oneinvest -h localhost -Fc -f "/b/$db.dump" "$db" || die "pg_dump $db lỗi"
done
phu pg_dumpall -U oneinvest -h localhost --globals-only -f /b/globals.sql || die "pg_dumpall --globals-only lỗi"

( cd "$DICH" && shasum -a 256 $(ls | grep -v '^manifest.sha256$') > manifest.sha256 ) || die "không ghi được manifest.sha256"
echo "db-sao-luu: $(grep -c . "$DICH/so-dong.tsv") bảng oneinvest đếm cùng snapshot $SID; $(ls "$DICH"/*.dump | wc -l | tr -d ' ') bản dump"
echo "db-sao-luu: $DICH"
