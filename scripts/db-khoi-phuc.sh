#!/bin/bash
# db-khoi-phuc.sh — khôi phục bản sao lưu của db-sao-luu.sh vào một DB THỬ rồi so số dòng (hồ sơ db-vao-volume).
#   bash scripts/db-khoi-phuc.sh <thư mục bản> <db đích>
# Đích phải khớp ^oneinvest_[a-z0-9_]+$ (khuôn db/db-thu.sh) — không bao giờ là oneinvest; sai khuôn → thoát 2
# trước mọi lệnh docker. Đích đã có thì bị xoá và dựng lại (cùng nếp db-thu.sh).
# Kiểm manifest.sha256 → globals.sql (lỗi «đã có» bỏ qua) → pg_restore oneinvest.dump bỏ pg_cron + schema cron
# (pg_cron chỉ sống ở DB chính) → đếm mọi bảng, so so-dong.tsv. Khớp hết → «khớp N/N bảng», ghi <bản>/khoi-phuc-ok.
# Biến: DB_CONTAINER (one-invest-db) — cụm nhận bản khôi phục.
set -uo pipefail
BAN="${1:-}"; DICH="${2:-}"
C="${DB_CONTAINER:-one-invest-db}"
die() { echo "FAIL $1"; exit "${2:-1}"; }

[[ "$DICH" =~ ^oneinvest_[a-z0-9_]+$ ]] || die "đích phải dạng oneinvest_<…> (không được là oneinvest): «$DICH»" 2
[ -n "$BAN" ] && [ -f "$BAN/manifest.sha256" ] || die "không có bản sao lưu ở «$BAN» (thiếu manifest.sha256)" 2
BAN=$(cd "$BAN" && pwd -P)

while IFS= read -r dong; do
  [[ "$dong" == *": OK" ]] || die "sha256 ${dong%%:*}"
done < <(cd "$BAN" && shasum -a 256 -c manifest.sha256 2>&1)
for t in oneinvest.dump so-dong.tsv globals.sql; do grep -q "  $t\$" "$BAN/manifest.sha256" || die "manifest thiếu $t"; done

docker inspect "$C" >/dev/null 2>&1 || die "không có container $C" 2
IMG=$(docker inspect -f '{{.Config.Image}}' "$C")
PSQL=(docker exec -i -e PGPASSWORD=oneinvest "$C" psql -U oneinvest -h localhost -At -q -v ON_ERROR_STOP=1)
phu() { docker run --rm -i --network "container:$C" -e PGPASSWORD=oneinvest -v "$BAN":/b:ro --entrypoint "" "$IMG" "$@"; }

"${PSQL[@]}" -d postgres -c "drop database if exists $DICH" -c "create database $DICH" || die "không dựng được $DICH"
# Vai đã có trên cụm nhận → lỗi «already exists» là bình thường; lỗi khác in ra.
phu psql -U oneinvest -h localhost -d postgres -q -f /b/globals.sql 2>&1 | grep -v 'already exists' | grep -i 'error' | head -5

# Danh sách TOC lọc ngay trong container phụ (thư mục tạm của macOS không gắn vào máy ảo Docker).
LOG=$(phu bash -c 'pg_restore -l /b/oneinvest.dump | grep -v -E "pg_cron|^[0-9]+; [0-9]+ [0-9]+ [A-Z ]+ cron " > /tmp/ds &&
  pg_restore -U oneinvest -h localhost -d "$1" --no-owner -j 4 -L /tmp/ds /b/oneinvest.dump' _ "$DICH" 2>&1)
LOI=$(grep -E '^pg_restore: error' <<<"$LOG" | grep -v 'already exists')
[ -z "$LOI" ] || { echo "$LOI" | head -10; die "pg_restore báo $(grep -c . <<<"$LOI") lỗi"; }

DEM_SQL="select format('select %L||chr(9)||count(*) from %I.%I', n.nspname||'.'||c.relname, n.nspname, c.relname)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema','cron')
    and n.nspname not like 'pg_toast%' and n.nspname not like 'pg_temp%' order by 1"
SAU=$(printf '%s \\gexec\n' "$DEM_SQL" | "${PSQL[@]}" -d "$DICH") || die "không đếm được $DICH"
N=0; LECH=0
while IFS=$'\t' read -r bang so; do
  [ -n "$bang" ] || continue
  N=$((N + 1))
  co=$(awk -F'\t' -v b="$bang" '$1 == b { print $2 }' <<<"$SAU")
  [ "$co" = "$so" ] || { echo "FAIL lệch bảng $bang $so≠${co:-(vắng)}"; LECH=$((LECH + 1)); }
done < "$BAN/so-dong.tsv"
[ $N -gt 0 ] || die "so-dong.tsv rỗng"
[ $LECH = 0 ] || die "khôi phục lệch $LECH/$N bảng"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $DICH $N" > "$BAN/khoi-phuc-ok"
echo "PASS khớp $N/$N bảng — $DICH (dấu $BAN/khoi-phuc-ok)"
