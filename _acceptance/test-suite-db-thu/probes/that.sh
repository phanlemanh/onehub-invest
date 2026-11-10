#!/usr/bin/env bash
# that.sh — hồ sơ test-suite-db-thu E2, trên Postgres thật :5433. Không nối vào oneinvest ngoài câu đọc dấu lược đồ của chính db-thu.
#   hai lượt --chay song song: mỗi lượt một DB khác nhau, cùng tồn tại trong lúc chạy, xoá sạch khi xong;
#   bản mẫu không nhận kết nối, COMMENT mang dấu + giờ;
#   lượt bị SIGKILL để lại DB, lượt kế dọn;
#   lệnh đỏ, SIGTERM không để sót DB; ba lượt cùng thấy mẫu cũ thì dựng đúng một lần.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SH="$ROOT/db/db-thu.sh"
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db)
hoi() { "${DX[@]}" psql -U oneinvest -h localhost -d postgres -Atc "$1"; }
co_db() { hoi "SELECT count(*) FROM pg_database WHERE datname = '$1'"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
unset DATABASE_URL TEST_DATABASE_URL_ADMIN CI

lenh='echo "${DATABASE_URL##*/}" > "$RA"; for i in $(seq 1 100); do [ -e "$DI" ] && break; sleep 0.1; done'
RA="$T/a" DI="$T/di" bash "$SH" oneinvest_suite_thua --chay bash -c "$lenh" & A=$!
RA="$T/b" DI="$T/di" bash "$SH" oneinvest_suite_thub --chay bash -c "$lenh" & B=$!
for i in $(seq 1 3000); do [ -s "$T/a" ] && [ -s "$T/b" ] && break; sleep 0.1; done
[ -s "$T/a" ] && [ -s "$T/b" ] || { echo "E2 hai lượt không chạy tới lệnh"; exit 1; }
DA=$(cat "$T/a"); DB=$(cat "$T/b")
[ "$DA" != "$DB" ] || { echo "E2 hai lượt chung một DB: $DA"; exit 1; }
[[ "$DA" =~ ^oneinvest_suite_thua_[0-9]+$ && "$DB" =~ ^oneinvest_suite_thub_[0-9]+$ ]] || { echo "E2 tên DB lạ: $DA $DB"; exit 1; }
[ "$(co_db "$DA")$(co_db "$DB")" = "11" ] || { echo "E2 DB của lượt không tồn tại trong lúc chạy"; exit 1; }
[ "$(hoi "SELECT datname FROM pg_database WHERE datname = 'oneinvest'")" = "oneinvest" ]
"${DX[@]}" psql -U oneinvest -h localhost -d "$DA" -Atc "SELECT count(*) > 0 FROM sale_offer_records" | /usr/bin/grep -q t || { echo "E2 bản chép không có dữ liệu"; exit 1; }
touch "$T/di"; wait "$A"; wait "$B"
[ "$(co_db "$DA")$(co_db "$DB")" = "00" ] || { echo "E2 DB của lượt còn sót sau khi xong"; exit 1; }

[ "$(hoi "SELECT datallowconn FROM pg_database WHERE datname = 'oneinvest_suite_mau'")" = "f" ] || { echo "E2 bản mẫu còn nhận kết nối"; exit 1; }
hoi "SELECT shobj_description(oid, 'pg_database') FROM pg_database WHERE datname = 'oneinvest_suite_mau'" | /usr/bin/grep -Eq '^[0-9a-f]{32} [0-9]+$' || { echo "E2 COMMENT bản mẫu sai khuôn"; exit 1; }

RA="$T/c" DI="$T/khong-bao-gio" bash "$SH" oneinvest_suite_thuc --chay bash -c "$lenh" & C=$!
for i in $(seq 1 3000); do [ -s "$T/c" ] && break; sleep 0.1; done
DC=$(cat "$T/c")
kill -9 "$C"; wait "$C" 2>/dev/null || true
[ "$(co_db "$DC")" = "1" ] || { echo "E2 đối chứng hỏng: SIGKILL mà DB đã mất"; exit 1; }
bash "$SH" oneinvest_suite_thud --chay true
[ "$(co_db "$DC")" = "0" ] || { echo "E2 DB mồ côi $DC không được dọn"; exit 1; }
# Lệnh đỏ và SIGTERM khi lệnh còn giữ kết nối: đo bằng pg_database, không tin lệnh đã gọi.
set +e
RA="$T/e" bash "$SH" oneinvest_suite_thue --chay bash -c 'echo "${DATABASE_URL##*/}" > "$RA"; exit 9'
[ "$?" = "9" ] || { echo "E2 mã thoát của lệnh đỏ bị đổi"; exit 1; }
set -e
[ "$(co_db "$(cat "$T/e")")" = "0" ] || { echo "E2 lệnh đỏ để sót DB"; exit 1; }
giu='const pg = require("pg"); (async () => { const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
  await c.query("BEGIN"); require("fs").writeFileSync(process.env.RA, process.env.DATABASE_URL.split("/").pop()); await new Promise((r) => setTimeout(r, 60000)); })()'
( cd "$ROOT/pipeline" && RA="$T/f" exec bash "$SH" oneinvest_suite_thuf --chay node -e "$giu" ) & F=$!
for i in $(seq 1 3000); do [ -s "$T/f" ] && break; sleep 0.1; done
DF=$(cat "$T/f")
[ "$(co_db "$DF")" = "1" ] || { echo "E2 đối chứng hỏng: lệnh giữ kết nối mà DB không có"; exit 1; }
kill -TERM "$F"; wait "$F" 2>/dev/null || true
[ "$(co_db "$DF")" = "0" ] || { echo "E2 SIGTERM để sót DB $DF"; exit 1; }

# Ba lượt cùng thấy mẫu lệch dấu: không quá một lần dựng, cả ba xanh, không sót bản dựng dở. Lần này dump thật, tốn khoảng ba phút.
"${DX[@]}" psql -U oneinvest -h localhost -d postgres -qc "COMMENT ON DATABASE oneinvest_suite_mau IS 'lech 0'"
for x in g h i; do ( bash "$SH" "oneinvest_suite_thu$x" --chay true > "$T/ra-$x" 2>&1 ) & eval "P$x=\$!"; done
wait "$Pg"; wait "$Ph"; wait "$Pi"
so_dung=$(cat "$T"/ra-[ghi] | /usr/bin/grep -c "dựng xong" || true)
# 0 lần: lượt của bộ khác đang chạy cùng lúc đã dựng trước, ba lượt này chỉ chờ rồi dùng. Dấu trên mẫu chứng mẫu đã được thay.
[ "$so_dung" -le 1 ] || { echo "E2 ba lượt dựng mẫu $so_dung lần, nhiều nhất một"; exit 1; }
[ "$(hoi "SELECT count(*) FROM pg_database WHERE datname ~ '^oneinvest_suite_mau_moi_'")" = "0" ] || { echo "E2 còn bản dựng dở"; exit 1; }
hoi "SELECT shobj_description(oid, 'pg_database') FROM pg_database WHERE datname = 'oneinvest_suite_mau'" | /usr/bin/grep -Eq '^[0-9a-f]{32} [0-9]+$' || { echo "E2 mẫu chưa mang dấu mới"; exit 1; }

echo "E2 đạt: $DA ≠ $DB; xoá sạch; mẫu khoá kết nối; mồ côi được dọn"
