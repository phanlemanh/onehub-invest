#!/usr/bin/env bash
# check-idempotent.sh — áp một migration vào DB local HAI lần và đòi: cả hai lần
# exit 0, schema (cột public) sau lần 1 == sau lần 2, và mỗi bảng chỉ định: số dòng
# không giảm (không xoá dữ liệu) + không có dòng trùng toàn phần (không nhân đôi).
# "Không giảm" thay vì "bằng": bảng staging có thể đang được ống thu ghi thêm lúc
# chạy (stg_zalo_posts nhận tin Zalo liên tục) — so bằng sẽ đỏ chập chờn.
#
# Dùng: bash db/check-idempotent.sh db/migrations/NNN_x.sql [bảng-đếm-dòng ...]
set -euo pipefail
MIG="$1"; shift
PSQL=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -qAt)

schema() { "${PSQL[@]}" -c "select md5(string_agg(table_name||'.'||column_name||':'||data_type, ',' order by table_name, column_name)) from information_schema.columns where table_schema='public'"; }
counts() { local out=""; for t in "$@"; do out+="$("${PSQL[@]}" -c "select count(*) from $t") "; done; echo "$out"; }
dups() { local n=0; for t in "$@"; do n=$((n + $("${PSQL[@]}" -c "select count(*) - count(distinct x) from $t x"))); done; echo "$n"; }
nondecreasing() { local a=($1) b=($2); for i in "${!a[@]}"; do [ "${b[$i]}" -ge "${a[$i]}" ] || return 1; done; }

c0=$(counts "$@")
"${PSQL[@]}" < "$MIG" >/dev/null 2>&1 || { echo "lần 1: áp $MIG lỗi"; exit 1; }
s1=$(schema); c1=$(counts "$@")
"${PSQL[@]}" < "$MIG" >/dev/null 2>&1 || { echo "lần 2: áp $MIG lỗi (không idempotent)"; exit 1; }
s2=$(schema); c2=$(counts "$@")

d2=$(dups "$@")
echo "áp 2 lần: ok · schema lần1=$s1 lần2=$s2 · bảng: $* · dòng trước: ${c0}· sau lần1: ${c1}· sau lần2: ${c2}· dòng trùng: $d2"
[ "$s1" = "$s2" ] || { echo "schema đổi ở lần 2 — không idempotent"; exit 1; }
nondecreasing "$c0" "$c1" && nondecreasing "$c1" "$c2" || { echo "số dòng giảm — migration xoá dữ liệu"; exit 1; }
[ "$d2" = "0" ] || { echo "có $d2 dòng trùng — migration nhân đôi dữ liệu"; exit 1; }
echo "IDEMPOTENT PASS"
