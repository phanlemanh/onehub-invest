#!/usr/bin/env bash
# db-thu.sh — DB thử riêng trên cùng server :5433 cho test/phép đo nạp migration CHƯA merge (luật giám sát đợt
# dot0-cam-mau, 27/10, sau sự cố khoá DB dùng chung khi đo PL15): không chạy chúng trên DB `oneinvest` dùng chung.
# Chép lược đồ + dữ liệu của oneinvest bằng pg_dump (createdb -T cần không ai nối vào oneinvest — launchd luôn nối),
# bỏ pg_cron (chỉ sống ở DB chính) và dữ liệu hai bảng staging lớn không phép đo nào dùng (stg_calendar, stg_abnb_nights).
# pg_dump chỉ lấy khoá đọc (AccessShare) trên oneinvest — không chặn đọc/ghi của job khác.
#   bash db/db-thu.sh <tên>          dựng lại từ đầu (xoá nếu có)
#   bash db/db-thu.sh <tên> --xoa    xoá DB thử
#   bash db/db-thu.sh <tên> --neu-chua-co   có sẵn thì giữ nguyên (lượt chấm chạy song song nhiều lệnh trên một DB thử: dựng trước một lần)
#   bash db/db-thu.sh oneinvest_suite_<bộ> --chay <lệnh…>   chạy lệnh trên DB của riêng lượt, chép từ bản mẫu, xoá khi lệnh dừng (hồ sơ test-suite-db-thu)
#   bash db/db-thu.sh --dau          in dấu lược đồ hiện tại của DB chung, kèm chi_doc=on|off của chính lời gọi (hồ sơ dau-luoc-do-ban-mau)
# Trỏ lệnh vào DB thử: DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/<tên>
set -euo pipefail
DX=(docker exec -i -e PGPASSWORD=oneinvest one-invest-db)
# Dấu lược đồ của DB chung, câu ở db/dau-luoc-do.sql (test đọc cùng tệp). Cờ chỉ đọc phải nằm trong đối số docker exec: biến môi trường
# của tiến trình gọi không vào container.
DOC_CHUNG=(docker exec -i -e PGPASSWORD=oneinvest -e "PGOPTIONS=-c default_transaction_read_only=on" one-invest-db
  psql -U oneinvest -h localhost -q -At -v ON_ERROR_STOP=1 -d oneinvest)
DAU_TEP="$(dirname "$0")/dau-luoc-do.sql"
dau_chung() { local q; q=$(cat "$DAU_TEP") || return 1; "${DOC_CHUNG[@]}" "$@" -c "$q"; }
if [ "${1:-}" = "--dau" ]; then
  dau_chung -c "SELECT 'chi_doc=' || current_setting('default_transaction_read_only')"
  exit
fi
TEN="${1:?thiếu tên DB thử}"
[[ "$TEN" =~ ^oneinvest_[a-z0-9_]+$ ]] || { echo "db-thu: tên phải dạng oneinvest_<dãy>_<việc> (không được là oneinvest)"; exit 2; }

if [ "${2:-}" = "--chay" ]; then
  [[ "$TEN" =~ ^oneinvest_suite_[a-z0-9_]+$ ]] || { echo "db-thu: --chay chỉ nhận tên oneinvest_suite_<bộ>"; exit 2; }
  shift 2
  [ "$#" -gt 0 ] || { echo "db-thu: --chay thiếu lệnh"; exit 2; }
  # Lệnh đã trỏ DB khác DB chung (hồ sơ tự dựng DB thử, máy khác) thì giữ nguyên.
  if [ -n "${DATABASE_URL:-}" ]; then
    u="${DATABASE_URL%%\?*}"
    noi="${u%/*}"; noi="${noi##*@}"; noi="${noi##*/}"
    if [ "${u##*/}" != "oneinvest" ] || { [ "$noi" != "localhost:5433" ] && [ "$noi" != "127.0.0.1:5433" ]; }; then
      # Cùng tên DB ở máy chủ khác (Postgres của CI cục bộ) không phải DB chung. Kết nối quản trị của test đi theo URL này.
      export TEST_DATABASE_URL_ADMIN="${TEST_DATABASE_URL_ADMIN:-$DATABASE_URL}"
      exec "$@"
    fi
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' one-invest-db 2>/dev/null || true)" != "true" ]; then
    # CI có Postgres riêng dựng từ migration. Trên máy mà thiếu container thì dừng, không được rơi về DB chung.
    [ "${CI:-}" = "true" ] && exec "$@"
    echo "db-thu: container one-invest-db không chạy — không có chỗ chép DB thử, lệnh không chạy"; exit 3
  fi
  PSQL=("${DX[@]}" psql -U oneinvest -h localhost -q -At -v ON_ERROR_STOP=1)
  MAU=oneinvest_suite_mau
  KHOA=${DB_THU_KHOA:-/tmp/onehub-db-thu-mau.lock}
  TUOI_TOI_DA=86400  # dữ liệu không cần mới từng giờ; lược đồ đổi thì dựng lại ngay
  # Mẫu còn dùng được khi cùng dấu lược đồ với DB chung và chưa quá tuổi. Dấu và giờ dựng nằm ở COMMENT, đọc không cần nối vào mẫu.
  mau_con_tot() {
    local ghi dau luc
    ghi=$("${PSQL[@]}" -d postgres -c "SELECT shobj_description(oid, 'pg_database') FROM pg_database WHERE datname = '$MAU'")
    dau=${ghi%% *}; luc=${ghi##* }
    [ -n "$ghi" ] && [ "$dau" = "$(dau_chung)" ] && [ $(( $(date +%s) - luc )) -lt "$TUOI_TOI_DA" ]
  }
  dung_mau() {
    local moi="oneinvest_suite_mau_moi_$$" dau
    dau=$(dau_chung) || return $?
    bash "$0" "$moi" || return $?
    # pg_dump không mang thống kê và visibility map, DB khoá kết nối thì autovacuum không tự làm: bản chép chọn kế hoạch tệ tới mức treo ca test.
    "${PSQL[@]}" -d "$moi" -c "VACUUM ANALYZE" || return $?
    "${PSQL[@]}" -d postgres -c "COMMENT ON DATABASE $moi IS '$dau $(date +%s)'" -c "ALTER DATABASE $moi ALLOW_CONNECTIONS false" \
      -c "DROP DATABASE IF EXISTS $MAU WITH (FORCE)" -c "ALTER DATABASE $moi RENAME TO $MAU"
  }
  # Nhiều bộ test cùng thấy mẫu cũ thì một bên dựng, bên kia chờ rồi xem lại. Bên dựng chết thì bên chờ dọn khoá.
  giu_mau_moi() {
    local cho=0 chu
    until mau_con_tot; do
      if mkdir "$KHOA" 2>/dev/null; then
        echo $$ > "$KHOA/pid"
        local r=0
        # Bên vừa dựng xong có thể nhả khoá ngay trước mkdir: xem lại rồi mới dựng.
        mau_con_tot || dung_mau || r=$?
        rm -rf "$KHOA"
        [ "$r" -eq 0 ] || { echo "db-thu: dựng bản mẫu lỗi"; return "$r"; }
        return 0
      fi
      chu=$(cat "$KHOA/pid" 2>/dev/null || true)
      if [ -n "$chu" ] && ! kill -0 "$chu" 2>/dev/null; then rm -rf "$KHOA"; continue; fi
      [ "$cho" -lt 900 ] || { echo "db-thu: chờ dựng bản mẫu quá 15 phút (khoá $KHOA, chủ $chu)"; return 1; }
      sleep 5; cho=$((cho + 5))
    done
  }
  # DB của lượt đã chết (bị SIGKILL, máy tắt) không ai dọn: đuôi là pid của chủ, pid hết sống thì xoá.
  don_mo_coi() {
    local d
    for d in $("${PSQL[@]}" -d postgres -c "SELECT datname FROM pg_database WHERE datname ~ '^oneinvest_suite_[a-z0-9_]+_[0-9]+\$'"); do
      kill -0 "${d##*_}" 2>/dev/null || "${DX[@]}" dropdb -U oneinvest -h localhost --force --if-exists "$d"
    done
  }
  don_mo_coi
  # Bản chép khoảng 1,4 GB mỗi lượt, đầy đĩa VM thì cả job thu cùng chết.
  con_gb=$("${DX[@]}" df -BG --output=avail /var/lib/postgresql | tail -1 | tr -dc '0-9')
  if [ -n "$con_gb" ] && [ "$con_gb" -lt 10 ]; then echo "db-thu: đĩa VM còn $con_gb GB, dưới 10 GB — không chép DB thử, lệnh không chạy"; exit 4; fi
  giu_mau_moi
  DB="${TEN}_$$"
  xoa_db() { "${DX[@]}" dropdb -U oneinvest -h localhost --force --if-exists "$DB" >/dev/null 2>&1 || echo "db-thu: chưa xoá được $DB"; }
  trap xoa_db EXIT
  # Mẫu vừa được bên khác thay thì chép lại một lần.
  for lan in 1 2 3; do
    "${DX[@]}" createdb -U oneinvest -h localhost -T "$MAU" "$DB" && break
    [ "$lan" -lt 3 ] || { echo "db-thu: chép $MAU sang $DB lỗi ba lần"; exit 1; }
    sleep 3
  done
  export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$DB"
  export TEST_DATABASE_URL_ADMIN="$DATABASE_URL"  # các test tự CREATE DATABASE nối vào đây, không nối vào DB chung
  "$@" &
  con=$!
  trap 'kill -TERM "$con" 2>/dev/null; exit 143' TERM
  trap 'kill -TERM "$con" 2>/dev/null; exit 130' INT
  r=0
  wait "$con" || r=$?
  exit "$r"
fi

if [ "${2:-}" = "--neu-chua-co" ] && "${DX[@]}" psql -U oneinvest -h localhost -d "$TEN" -Atc "SELECT 1 FROM sale_offer_records LIMIT 1" 2>/dev/null | /usr/bin/grep -q 1; then
  echo "db-thu: giữ $TEN có sẵn"; exit 0
fi
"${DX[@]}" dropdb -U oneinvest -h localhost --if-exists "$TEN"
if [ "${2:-}" = "--xoa" ]; then echo "db-thu: đã xoá $TEN"; exit 0; fi
# pipefail: pg_dump lỗi giữa ống (02/11, DDL song song trên oneinvest) mà sh vẫn thoát 0 thì để lại DB rỗng. Lỗi đó nhất thời nên thử lại.
for lan in 1 2 3; do
  "${DX[@]}" createdb -U oneinvest -h localhost "$TEN"
  "${DX[@]}" bash -c "set -o pipefail; pg_dump -U oneinvest -h localhost --no-owner --exclude-extension=pg_cron --exclude-schema=cron \
    --exclude-table-data=stg_calendar --exclude-table-data=stg_abnb_nights oneinvest \
    | psql -U oneinvest -h localhost -q -v ON_ERROR_STOP=1 $TEN" >/dev/null && break
  "${DX[@]}" dropdb -U oneinvest -h localhost --if-exists "$TEN"
  [ "$lan" -lt 3 ] || { echo "db-thu: chép oneinvest sang $TEN lỗi ba lần"; exit 1; }
  sleep 20
done
echo "db-thu: $TEN dựng xong — DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/$TEN"
