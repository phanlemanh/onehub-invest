#!/bin/bash
# db-volume-check.sh — kiểm dữ liệu DB local nằm trong volume có tên (hồ sơ _acceptance/db-vao-volume/).
# Gốc lỗi (đo 29/10): ảnh kartoza để dữ liệu ở /var/lib/postgresql/<major>/main, compose cũ gắn volume ở
# /var/lib/postgresql/data → volume rỗng, 3,7 GB nằm trong lớp ghi của container.
#
#   static         cấu hình gộp của db/docker-compose.yml (`docker compose config`): đúng một volume có
#                  tên tường minh (khoá name:) gắn ở thư mục chứa DEFAULT_DATADIR của chính ảnh khai trong compose;
#                  không bind, không volume vô danh; project ≠ db; restart unless-stopped|always; danh sách bảng loại
#                  khỏi phép so của db-chuyen-volume.sh không chứa bảng canonical.
#   mutation       các bản compose/script hỏng chép từ bản lành phải đỏ với thông điệp ghim; bản lành xanh.
#   tap-duot       sao lưu → khôi phục → chuyển → tạo lại → lùi trên cụm giả onehub-tapduot-* cùng daemon;
#                  không chạm one-invest-db (Id + StartedAt không đổi); tự dọn kể cả khi lỗi/SIGTERM.
#   live           CHỈ ĐỌC máy này: data_directory của one-invest-db nằm dưới mount volume onehub_pgdata (bất biến); còn
#                  bản lùi one-invest-db-cu-* thì MỌI bản đang dừng, restart no; vắng bản lùi trước hạn giữ là đỏ, sau
#                  hạn là xanh (hồ sơ db-volume-live-ban-lui). Chạy live-selftest trước: đường gom + ma trận 16 ô.
#   live-selftest  bộ đọc của live chạy trên JSON inspect thật đã làm hỏng phải đỏ.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SELF="$ROOT/scripts/$(basename "$0")"
MODE="${1:-}"
COMPOSE="${DB_COMPOSE:-$ROOT/db/docker-compose.yml}"
CHUYEN="${DB_CHUYEN_SCRIPT:-$ROOT/scripts/db-chuyen-volume.sh}"
VOL_TEN=onehub_pgdata
BANG_CANONICAL=(public.sale_offers public.sale_offer_records public.listings public.properties)
FAIL=0
pass() { echo "PASS $*"; }
fail() { echo "FAIL $*"; FAIL=1; }

# DEFAULT_DATADIR đọc từ chính ảnh (env-data.sh của kartoza), không gõ cứng major.
img_datadir() { # $1 = ảnh
  docker run --rm --entrypoint bash "$1" -c 'source /scripts/env-data.sh >/dev/null 2>&1; echo "$DEFAULT_DATADIR"' 2>/dev/null
}

check_compose() { # $1 = tệp compose
  local js raw img dd n hit typ src vname proj rs
  # Bản chuẩn hoá cho mount + project; bản thô (--no-normalize) cho khoá name của volume — bản chuẩn hoá tự điền
  # «<project>_<khoá>» nên không phân biệt được compose có khai name: hay không.
  js=$(docker compose -f "$1" config --format json 2>/dev/null) || { fail "compose không gộp được ($1)"; return; }
  raw=$(docker compose -f "$1" config --no-normalize --format json 2>/dev/null) || { fail "compose không gộp được ($1)"; return; }
  img=$(jq -r '.services.db.image // ""' <<<"$js")
  dd=${DB_IMG_DATADIR:-$(img_datadir "$img")}
  [ -n "$dd" ] || { fail "không đọc được DEFAULT_DATADIR của ảnh $img"; return; }
  # Mount phủ thư mục dữ liệu: đích == dd hoặc dd nằm dưới đích.
  n=$(jq --arg d "$dd" '[.services.db.volumes[]? | select(. as $v | $v.target == $d or ($d | startswith($v.target + "/")))] | length' <<<"$js")
  if [ "$n" != 1 ]; then
    fail "volume không chứa thư mục dữ liệu $dd ($n mount phủ nó)"
  else
    hit=$(jq -c --arg d "$dd" '[.services.db.volumes[] | select(. as $v | $v.target == $d or ($d | startswith($v.target + "/")))][0]' <<<"$js")
    typ=$(jq -r '.type' <<<"$hit"); src=$(jq -r '.source // ""' <<<"$hit")
    if [ "$typ" = bind ]; then fail "bind mount $src → $(jq -r .target <<<"$hit")"
    elif [ "$typ" != volume ]; then fail "mount kiểu $typ"
    elif [ -z "$src" ]; then fail "volume vô danh → $(jq -r .target <<<"$hit")"
    else
      vname=$(jq -r --arg s "$src" '.volumes[$s].name // ""' <<<"$raw")
      if [ -z "$vname" ]; then fail "volume thiếu name (khoá volumes.$src.name)"
      elif [ "$vname" != "$VOL_TEN" ]; then fail "volume tên $vname (cần $VOL_TEN)"
      else pass "compose volume $vname gắn $(jq -r .target <<<"$hit") chứa DEFAULT_DATADIR=$dd (đọc từ ảnh)"
      fi
    fi
  fi
  proj=$(jq -r '.name // ""' <<<"$js")
  if [ "$proj" = db ] || [ -z "$proj" ]; then fail "project=${proj:-(vắng)} (cần tên tường minh ≠ db — container cũ mang nhãn project db)"
  else pass "compose project=$proj"; fi
  rs=$(jq -r '.services.db.restart // "(vắng)"' <<<"$js")
  case "$rs" in unless-stopped|always) pass "compose db.restart=$rs" ;; *) fail "compose db.restart=$rs (cần unless-stopped|always)" ;; esac
}

check_loai_tru() { # $1 = db-chuyen-volume.sh
  [ -f "$1" ] || { echo "SKIP chưa có $(basename "$1") — chưa kiểm danh sách loại trừ"; return; }
  local ds c n
  ds=$(bash -c 'eval "$(sed -n "/^BANG_LOAI_TRU=(/,/^)/p" "$1")"; for x in "${BANG_LOAI_TRU[@]}"; do echo "${x%%|*}"; done' _ "$1" 2>/dev/null)
  for c in "${BANG_CANONICAL[@]}"; do
    grep -qxF "$c" <<<"$ds" && { fail "danh sách loại trừ chứa bảng canonical $c"; return; }
  done
  n=$(grep -c . <<<"$ds")
  pass "danh sách loại trừ của $(basename "$1") không chứa bảng canonical ($n bảng loại, mỗi bảng một lý do)"
  while IFS= read -r x; do [ -n "$x" ] || continue
    [[ "$x" == *"|"?* ]] || fail "bảng loại trừ thiếu lý do: $x"
  done < <(bash -c 'eval "$(sed -n "/^BANG_LOAI_TRU=(/,/^)/p" "$1")"; printf "%s\n" "${BANG_LOAI_TRU[@]}"' _ "$1" 2>/dev/null)
}

# Chạy một bộ kiểm trên một fixture, đòi đúng chiều + thông điệp ghim. $1 nhãn, $2 0|do, $3 thông điệp ghim
# (rỗng khi chờ xanh), còn lại: lệnh kiểm. Cùng khuôn check-db-autostart.sh.
expect() {
  local label="$1" want="$2" msg="$3" out rc; shift 3
  # Lệnh ngoài (script) trả mã thoát của nó; hàm kiểm trong tệp này báo qua biến FAIL — nhận cả hai.
  out=$( FAIL=0; "$@"; r=$?; [ $FAIL != 0 ] && exit 1; exit $r ); rc=$?
  if [ "$want" = 0 ]; then
    if [ $rc = 0 ] && { [ -z "$msg" ] || grep -qF "$msg" <<<"$out"; }; then pass "$label xanh${msg:+ — $msg}"
    else fail "$label lẽ ra xanh${msg:+ với «$msg»} (rc=$rc)"; echo "$out"; fi
  elif [ $rc != 0 ] && grep -qF "$msg" <<<"$out"; then
    pass "$label đỏ — $msg"
  else
    fail "$label lẽ ra đỏ với «$msg» (rc=$rc)"; echo "$out"
  fi
}

# Đột biến từ bản lành; đột biến không đổi byte nào là lỗi của thước, không phải đỏ hợp lệ.
mutate() { # $1 nguồn $2 đích $3 biểu thức sed
  sed -E "$3" "$1" > "$2"
  cmp -s "$1" "$2" && { fail "đột biến $(basename "$2") không đổi gì — sed không khớp bản lành"; return 1; }
  return 0
}

# MUT_TMP toàn cục, không `local`: trap EXIT chạy sau khi hàm đã return (cùng bẫy ghi ở check-db-autostart.sh).
MUT_TMP=""
run_mutation() {
  MUT_TMP=$(mktemp -d); trap 'rm -rf "$MUT_TMP"' EXIT
  local T="$MUT_TMP"
  cp "$COMPOSE" "$T/lanh.yml"
  mutate "$T/lanh.yml" "$T/gan-data.yml" 's#(- [a-z_]+):/var/lib/postgresql$#\1:/var/lib/postgresql/data#' &&
    expect "đột biến gan-data" do "FAIL volume không chứa thư mục dữ liệu" check_compose "$T/gan-data.yml"
  mutate "$T/lanh.yml" "$T/vo-danh.yml" 's#- [a-z_]+:/var/lib/postgresql$#- /var/lib/postgresql#' &&
    expect "đột biến vo-danh" do "FAIL volume vô danh" check_compose "$T/vo-danh.yml"
  mutate "$T/lanh.yml" "$T/bind.yml" 's#- [a-z_]+:/var/lib/postgresql$#- ./pgdata-may:/var/lib/postgresql#' &&
    expect "đột biến bind" do "FAIL bind mount" check_compose "$T/bind.yml"
  mutate "$T/lanh.yml" "$T/project-db.yml" 's#^name: .*#name: db#' &&
    expect "đột biến project-db" do "FAIL project=db" check_compose "$T/project-db.yml"
  mutate "$T/lanh.yml" "$T/mat-name.yml" "/^    name: $VOL_TEN/d" &&
    expect "đột biến mat-name" do "FAIL volume thiếu name" check_compose "$T/mat-name.yml"
  expect "bản lành compose" 0 "" check_compose "$T/lanh.yml"
  if [ -f "$CHUYEN" ]; then
    cp "$CHUYEN" "$T/chuyen-lanh.sh"
    awk '{ print } /^BANG_LOAI_TRU=\(/ { print "  \"public.sale_offers|đột biến thử\"" }' "$T/chuyen-lanh.sh" > "$T/loai-canonical.sh"
    cmp -s "$T/chuyen-lanh.sh" "$T/loai-canonical.sh" && fail "đột biến loai-canonical không đổi gì — không thấy BANG_LOAI_TRU=("
    grep -q '^  "public.sale_offers|đột biến thử"$' "$T/loai-canonical.sh" &&
      expect "đột biến loai-canonical" do "FAIL danh sách loại trừ chứa bảng canonical public.sale_offers" check_loai_tru "$T/loai-canonical.sh"
    expect "bản lành danh sách loại trừ" 0 "" check_loai_tru "$T/chuyen-lanh.sh"
  else
    echo "SKIP chưa có $(basename "$CHUYEN") — chưa thử đột biến loai-canonical"
  fi
}

# ─── tap-duot ───────────────────────────────────────────────────────────────────────────────────────────────
# Cụm giả cùng daemon, mọi tài nguyên tên onehub-tapduot-* / onehub_tapduot_* (cổng 55433). Kiểu cũ dựng bằng compose
# CŨ THẬT ở commit trước vòng (TD_CU_REF) nên mang nhãn compose thật. Không bao giờ chạm one-invest-db / onehub_pgdata.
DB_THAT=one-invest-db
TD_CU_REF="${TD_CU_REF:-89730e6b}"       # main trước vòng db-vao-volume: volume gắn /var/lib/postgresql/data
TD_DB=onehub-tapduot-db
TD_PORT=55433
TD_TMP=""; TD_BAN=""
td_psql() { docker exec -i -e PGPASSWORD=oneinvest "$TD_DB" psql -U oneinvest -h localhost -At -q -v ON_ERROR_STOP=1 "$@"; }
td_dem() { td_psql -d "${2:-oneinvest}" -c "select count(*) from $1" 2>/dev/null; }

td_cleanup() {
  local x
  for x in $(docker ps -a --format '{{.Names}}' | grep -E '^onehub-tapduot-'); do
    case "$x" in onehub-tapduot-*) docker rm -fv "$x" >/dev/null 2>&1 ;; esac
  done
  for x in $(docker volume ls --format '{{.Name}}' | grep -E '^onehub[-_]tapduot'); do
    case "$x" in onehub-tapduot*|onehub_tapduot*) docker volume rm -f "$x" >/dev/null 2>&1 ;; esac
  done
  [ -n "$TD_TMP" ] && rm -rf "$TD_TMP"
  [ -n "$TD_BAN" ] && rm -rf "$TD_BAN"
}
td_con_sot() { # số tài nguyên tập dượt còn lại
  echo $(( $(docker ps -a --format '{{.Names}}' | grep -cE '^onehub-tapduot-') + $(docker volume ls --format '{{.Name}}' | grep -cE '^onehub[-_]tapduot') ))
}
td_cho_healthy() { # $1 container — chờ tối đa 300 giây (lượt chấm chạy 6 suite song song, kartoza khởi tạo chậm hơn)
  local i s; for i in $(seq 1 300); do
    s=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$1" 2>/dev/null)
    [ "$s" = healthy ] && return 0; sleep 1
  done
  echo "--- đuôi log $1:"; docker logs --tail 15 "$1" 2>&1; return 1
}
# compose up có thử lại một lần; thất bại thì in đuôi đầu ra compose + log container (không nuốt lỗi).
td_compose_up() { # $1 project, $2 tệp compose, $3 container
  local k log="$TD_TMP/compose-$1.log"
  for k in 1 2; do
    docker compose -p "$1" -f "$2" up -d >"$log" 2>&1 && td_cho_healthy "$3" && return 0
    echo "--- compose up $1 lượt $k lỗi:"; tail -8 "$log"; docker logs --tail 8 "$3" 2>&1 | sed 's/^/    /'
    docker compose -p "$1" -f "$2" down -v >/dev/null 2>&1
  done
  return 1
}
td_dung_cu() { # cụm kiểu cũ + dữ liệu mồi
  mkdir -p "$TD_TMP/cu"
  git -C "$ROOT" show "$TD_CU_REF:db/docker-compose.yml" \
    | sed -e "s/container_name: one-invest-db/container_name: $TD_DB/" -e "s/\"5433:5432\"/\"$TD_PORT:5432\"/" > "$TD_TMP/cu/docker-compose.yml" \
    || { fail "không đọc được compose cũ ở $TD_CU_REF"; return 1; }
  grep -q '/var/lib/postgresql/data' "$TD_TMP/cu/docker-compose.yml" || { fail "compose ở $TD_CU_REF không phải kiểu cũ"; return 1; }
  td_compose_up onehub-tapduot-cu "$TD_TMP/cu/docker-compose.yml" "$TD_DB" || { fail "không dựng được $TD_DB"; return 1; }
  td_psql -d oneinvest -c "create table mau_a(id serial primary key, v int); insert into mau_a(v) select g from generate_series(1,1000) g;
    create extension if not exists postgis; create table mau_geo(id int, g geometry(Point,4326));
    insert into mau_geo select g, st_setsrid(st_makepoint(105.8+g/100.0, 21.0), 4326) from generate_series(1,10) g;
    create table mau_ghi(id serial primary key, luc timestamptz default now()); insert into mau_ghi default values;" \
    && td_psql -d postgres -c "create database zcode_tapduot" && td_psql -d zcode_tapduot -c "create table z(i int); insert into z values (1),(2),(3)" \
    && td_psql -d postgres -c "alter system set max_connections = 200" || { fail "không nạp được dữ liệu mồi"; return 1; }
  docker restart "$TD_DB" >/dev/null && td_cho_healthy "$TD_DB" || { fail "$TD_DB không lên lại sau ALTER SYSTEM"; return 1; }
  [ "$(td_psql -d postgres -c 'show max_connections')" = 200 ] || { fail "mồi ALTER SYSTEM không ăn"; return 1; }
  pass "cụm kiểu cũ $TD_DB dựng bằng compose $TD_CU_REF (project onehub-tapduot-cu), mồi mau_a=1000 mau_geo=10 zcode_tapduot max_connections=200"
}

ca_sao_luu() {
  local hook="docker exec -i -e PGPASSWORD=oneinvest $TD_DB psql -U oneinvest -h localhost -d oneinvest -qc 'insert into mau_a(v) values (-1)'"
  local out rc a so
  out=$(DB_CONTAINER="$TD_DB" DB_SAO_LUU_SAU_SNAPSHOT_HOOK="$hook" bash "$ROOT/scripts/db-sao-luu.sh" "$TD_BAN/b1" 2>&1); rc=$?
  [ $rc = 0 ] || { fail "db-sao-luu lẽ ra xanh (rc=$rc)"; echo "$out"; return 1; }
  for f in oneinvest.dump postgres.dump zcode_tapduot.dump globals.sql so-dong.tsv thong-tin.txt manifest.sha256; do
    [ -s "$TD_BAN/b1/$f" ] || fail "bản sao lưu thiếu $f"
  done
  ( cd "$TD_BAN/b1" && shasum -a 256 -c manifest.sha256 >/dev/null 2>&1 ) && pass "manifest.sha256 khớp mọi tệp" || fail "manifest.sha256 không khớp"
  pass "bản có <db>.dump mỗi DB không template + globals.sql + so-dong.tsv + manifest.sha256"
  so=$(awk -F'\t' '$1 == "public.mau_a" { print $2 }' "$TD_BAN/b1/so-dong.tsv"); a=$(td_dem mau_a)
  if [ "$so" = 1000 ] && [ "$a" = 1001 ]; then
    pass "so-dong.tsv đếm cùng snapshot — dòng chen sau pg_export_snapshot không vào số (mau_a 1000, cụm sống 1001)"
  else fail "so-dong.tsv không cùng snapshot (so-dong mau_a=$so, cụm sống $a — chờ 1000/1001)"; fi
  local trong="$ROOT/_acceptance/db-vao-volume/.thu-sao-luu-$$"
  expect "đích trong cây kho" do "FAIL đích nằm trong kho" bash "$ROOT/scripts/db-sao-luu.sh" "$trong"
  [ ! -e "$trong" ] && pass "đích trong kho: không ghi byte nào" || { fail "đích trong kho đã bị tạo $trong"; rm -rf "$trong"; }
}

ca_khoi_phuc() {
  local ds0 ds1
  DB_CONTAINER="$TD_DB" expect "khôi phục bản b1" 0 "" bash "$ROOT/scripts/db-khoi-phuc.sh" "$TD_BAN/b1" oneinvest_tapduot_kp
  [ -f "$TD_BAN/b1/khoi-phuc-ok" ] && pass "dấu khoi-phuc-ok có" || fail "không có dấu khoi-phuc-ok"
  [ "$(td_dem mau_a oneinvest_tapduot_kp)" = 1000 ] && [ "$(td_dem mau_geo oneinvest_tapduot_kp)" = 10 ] \
    && pass "bản khôi phục mau_a=1000 (không có dòng chen) mau_geo=10" || fail "bản khôi phục sai số dòng"
  cp -R "$TD_BAN/b1" "$TD_BAN/b1-lech"; rm -f "$TD_BAN/b1-lech/khoi-phuc-ok"
  awk 'BEGIN { FS = OFS = "\t" } $1 == "public.mau_a" { $2 = 999 } 1' "$TD_BAN/b1/so-dong.tsv" > "$TD_BAN/b1-lech/so-dong.tsv"
  ( cd "$TD_BAN/b1-lech" && shasum -a 256 $(ls | grep -v '^manifest.sha256$') > manifest.sha256 )
  DB_CONTAINER="$TD_DB" expect "so-dong.tsv sửa một dòng" do "FAIL lệch bảng public.mau_a 999≠1000" bash "$ROOT/scripts/db-khoi-phuc.sh" "$TD_BAN/b1-lech" oneinvest_tapduot_kp
  cp -R "$TD_BAN/b1" "$TD_BAN/b1-sha"; printf 'x' >> "$TD_BAN/b1-sha/oneinvest.dump"
  DB_CONTAINER="$TD_DB" expect "dump đổi một byte" do "FAIL sha256 oneinvest.dump" bash "$ROOT/scripts/db-khoi-phuc.sh" "$TD_BAN/b1-sha" oneinvest_tapduot_kp
  ds0=$(td_psql -d postgres -c "select string_agg(datname, ',' order by datname) from pg_database")
  DB_CONTAINER="$TD_DB" expect "đích oneinvest" do "FAIL đích phải dạng oneinvest_" bash "$ROOT/scripts/db-khoi-phuc.sh" "$TD_BAN/b1" oneinvest
  ds1=$(td_psql -d postgres -c "select string_agg(datname, ',' order by datname) from pg_database")
  [ "$ds0" = "$ds1" ] && pass "đích oneinvest: danh sách DB không đổi" || fail "đích oneinvest: danh sách DB đổi ($ds0 → $ds1)"
  # Đối chứng: đếm ngoài snapshot (phiên riêng, sau dòng chen) → so-dong.tsv thấy dòng mà dump không thấy.
  local hook="docker exec -i -e PGPASSWORD=oneinvest $TD_DB psql -U oneinvest -h localhost -d oneinvest -qc 'insert into mau_a(v) values (-2)'"
  DB_CONTAINER="$TD_DB" DB_SAO_LUU_SAU_SNAPSHOT_HOOK="$hook" DB_SAO_LUU_DEM_NGOAI_SNAPSHOT=1 bash "$ROOT/scripts/db-sao-luu.sh" "$TD_BAN/b2" >/dev/null 2>&1 \
    || fail "db-sao-luu (đếm ngoài snapshot) không chạy"
  DB_CONTAINER="$TD_DB" expect "đếm lệch snapshot (đối chứng đếm ngoài snapshot)" do "FAIL lệch bảng public.mau_a 1002≠1001" bash "$ROOT/scripts/db-khoi-phuc.sh" "$TD_BAN/b2" oneinvest_tapduot_kp
}

TD_IMG=kartoza/postgis:17-3.5
td_trang() { # dấu trạng thái để so «không đổi gì»
  docker inspect -f '{{.Id}} {{.State.StartedAt}}' "$TD_DB" 2>/dev/null
  docker ps -a --format '{{.Names}}' | grep -E '^onehub-tapduot-' | sort | tr '\n' ' '
  docker volume ls --format '{{.Name}}' | grep -E '^onehub[-_]tapduot' | sort | tr '\n' ' '
}
td_id() { docker inspect -f '{{.Id}}' "$1" 2>/dev/null; }
td_chuan_bi_moi() { # compose mới (bản của cây) đổi sang tên tập dượt + bản chép plist launchd
  mkdir -p "$TD_TMP/moi" "$TD_TMP/plist"
  sed -e 's/^name: onehub-db$/name: onehub-tapduot-moi/' -e "s/container_name: one-invest-db/container_name: $TD_DB/" \
      -e "s/\"5433:5432\"/\"$TD_PORT:5432\"/" -e 's/name: onehub_pgdata$/name: onehub_tapduot_moi/' "$COMPOSE" > "$TD_TMP/moi/docker-compose.yml"
  for x in 'name: onehub-tapduot-moi' "container_name: $TD_DB" "$TD_PORT:5432" 'name: onehub_tapduot_moi'; do
    grep -qF "$x" "$TD_TMP/moi/docker-compose.yml" || { fail "compose tập dượt thiếu «$x» — sed không khớp compose của cây"; return 1; }
  done
  cp "$HOME"/Library/LaunchAgents/com.oneinvest.*.plist "$TD_TMP/plist/" 2>/dev/null
  if [ ! -f "$TD_TMP/plist/com.oneinvest.chotot.plist" ]; then
    plutil -create xml1 "$TD_TMP/plist/com.oneinvest.chotot.plist"
    plutil -insert StartCalendarInterval -json '{"Hour":5,"Minute":30}' "$TD_TMP/plist/com.oneinvest.chotot.plist"
  fi
  export DB_PORT=$TD_PORT DB_VOLUME=onehub_tapduot_moi DB_COMPOSE="$TD_TMP/moi/docker-compose.yml" DB_BACKUP_ROOT="$TD_BAN" \
    DB_LAUNCH_DIR="$TD_TMP/plist" DB_CHUYEN_TIEN_TRINH_MAU='onehub-tapduot-gia-daily' DB_CHUYEN_GIO_GIA=15:00 DB_CHUYEN_THU_GIA=3
  pass "compose tập dượt từ compose của cây (project onehub-tapduot-moi, volume onehub_tapduot_moi), $(ls "$TD_TMP/plist" | wc -l | tr -d ' ') plist chép"
}

ca_tien_dieu_kien() {
  local s0 out vol pid
  s0=$(td_trang)
  out=$(bash "$CHUYEN" --sao-luu "$TD_BAN/b1" 2>&1); [ $? = 0 ] && pass "chỉ kiểm: đủ tiền điều kiện, thoát 0" || { fail "chỉ kiểm lẽ ra thoát 0"; echo "$out"; }
  grep -q '^PASS cửa sổ' <<<"$out" && pass "đối chứng dương: giờ 15:00 với plist chép thật → PASS cửa sổ" || fail "giờ ngoài cửa sổ lẽ ra PASS cửa sổ"
  [ "$(td_trang)" = "$s0" ] && pass "chỉ kiểm không đổi gì (Id, StartedAt, container, volume)" || fail "chỉ kiểm đã đổi trạng thái"
  expect "thiếu khoi-phuc-ok" do "FAIL chưa có bản sao lưu đã khôi phục thử" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b2"
  cp -R "$TD_BAN/b1" "$TD_BAN/b1-cu"; touch -t "$(date -v-25H +%Y%m%d%H%M)" "$TD_BAN/b1-cu/khoi-phuc-ok"
  expect "khoi-phuc-ok 25 giờ" do "FAIL bản sao lưu quá 24 giờ" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1-cu"
  rm -rf "$TD_BAN/b1-cu"
  expect "giờ trùng job launchd" do "FAIL trùng cửa sổ com.oneinvest.chotot" env DB_CHUYEN_GIO_GIA=05:25 bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  expect "đĩa giả" do "FAIL đĩa không đủ vm" env DB_CHUYEN_DIA_GIA=1 bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  bash -c 'exec -a onehub-tapduot-gia-daily.sh sleep 120' & pid=$!; sleep 1
  expect "tiến trình job đang chạy" do "FAIL đang chạy" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
  docker exec -i -e PGPASSWORD=oneinvest "$TD_DB" psql -U oneinvest -h localhost -d zcode_tapduot -qc 'select pg_sleep(30)' >/dev/null 2>&1 & pid=$!; sleep 2
  expect "phiên đang chạy ở DB phụ" do "FAIL đang có phiên zcode_tapduot:oneinvest" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null
  td_psql -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = 'zcode_tapduot' and pid <> pg_backend_pid()" >/dev/null
  [ "$(td_trang)" = "$s0" ] && pass "sáu ca đỏ không đổi gì" || fail "ca tiền điều kiện đã đổi trạng thái"
  docker create --name "$TD_DB-cu-20000101" --entrypoint true "$TD_IMG" >/dev/null
  expect "đã có bản lùi" do "FAIL đã có $TD_DB-cu" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  docker rm -f "$TD_DB-cu-20000101" >/dev/null
  docker volume create onehub_tapduot_moi >/dev/null
  docker run --rm -v onehub_tapduot_moi:/v --entrypoint sh "$TD_IMG" -c 'echo x > /v/co-tep'
  expect "volume đích có tệp" do "FAIL volume đích không rỗng" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  docker volume rm onehub_tapduot_moi >/dev/null
  [ "$(td_trang)" = "$s0" ] && pass "tiền điều kiện: mọi ca đỏ thoát 2, không đổi gì" || fail "ca tiền điều kiện để lại thay đổi"
}

ca_loi_sau_chep() {
  local id0 out rc
  id0=$(td_id "$TD_DB")
  out=$(env DB_CHUYEN_LOI_GIA=sau-chep bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1" 2>&1); rc=$?
  if [ $rc = 1 ] && grep -q 'db-chuyen-volume.sh --lui' <<<"$out" && [ "$(td_id "$TD_DB-cu-$(date +%Y%m%d)")" = "$id0" ]; then
    pass "lỗi giữa chừng sau khi tắt cụm: thoát 1, in lệnh lùi, bản lùi còn nguyên, không bật DB mới"
  else fail "lỗi giữa chừng lẽ ra thoát 1 + in lệnh lùi + còn bản lùi (rc=$rc)"; echo "$out" | tail -5; fi
  docker inspect "$TD_DB" >/dev/null 2>&1 && fail "lỗi giữa chừng mà vẫn có $TD_DB mới"
  expect "lùi sau lỗi giữa chừng" 0 "" bash "$CHUYEN" --lui
  [ "$(td_id "$TD_DB")" = "$id0" ] && [ "$(td_dem mau_a)" = "$TD_A0" ] && pass "sau lùi: $TD_DB là container cũ (cùng Id), mau_a=$TD_A0" \
    || fail "sau lùi: $TD_DB không phải container cũ hoặc sai số dòng"
  docker volume rm onehub_tapduot_moi >/dev/null 2>&1
}

TD_ID_CU=""
ca_chuyen() {
  local out rc l
  TD_ID_CU=$(td_id "$TD_DB")
  out=$(env DB_CHUYEN_SAU_DEM_HOOK="docker exec -i -e PGPASSWORD=oneinvest $TD_DB psql -U oneinvest -h localhost -d oneinvest -qc 'insert into mau_ghi default values'" \
    DB_CHUYEN_LOAI_TRU_THEM='public.mau_ghi|tập dượt: bảng job ghi giữa lúc đếm và lúc tắt' bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1" 2>&1); rc=$?
  [ $rc = 0 ] && pass "chuyển (--lam) thoát 0" || { fail "chuyển lẽ ra thoát 0 (rc=$rc)"; echo "$out" | tail -15; return 1; }
  for l in "PASS bản lùi $TD_DB-cu-$(date +%Y%m%d) exited restart=no" "PASS tar --diff 0 tệp lệch" "PASS pg_controldata shut down" \
           "PASS data_directory /var/lib/postgresql/17/main dưới mount volume onehub_tapduot_moi" "PASS số dòng bảng chính trước=sau" \
           "PASS ALTER SYSTEM giữ nguyên (max_connections=200)" "PASS số dòng bảng chính sau chuyển=sau tạo lại" \
           "bảng loại trừ public.mau_ghi 1→2 (không chặn)"; do
    grep -qF "$l" <<<"$out" && pass "chuyển: $l" || fail "chuyển thiếu dòng «$l»"
  done
  [ "$(td_id "$TD_DB-cu-$(date +%Y%m%d)")" = "$TD_ID_CU" ] && [ "$(td_id "$TD_DB")" != "$TD_ID_CU" ] \
    && pass "bản lùi là đúng container cũ (Id giữ), $TD_DB là container mới" || fail "Id bản lùi / container mới sai"
  [ "$(td_dem mau_a)" = "$TD_A0" ] && [ "$(td_dem mau_geo)" = 10 ] && [ "$(td_dem z zcode_tapduot)" = 3 ] \
    && pass "cụm mới: mau_a=$TD_A0 mau_geo=10 zcode_tapduot.z=3" || fail "cụm mới sai số dòng"
  [ -s "$TD_BAN/b1/datadir-17.tar" ] && ( cd "$TD_BAN/b1" && shasum -a 256 -c datadir-17.tar.sha256 >/dev/null 2>&1 ) \
    && pass "tar lạnh datadir-17.tar + sha256 khớp" || fail "thiếu hoặc sai tar lạnh"
}

ca_so_byte() {
  docker volume create onehub_tapduot_so >/dev/null
  docker run --rm -i -v onehub_tapduot_so:/var/lib/postgresql --entrypoint tar "$TD_IMG" -x -C /var/lib/postgresql < "$TD_BAN/b1/datadir-17.tar"
  expect "so byte bản chép lành" 0 "" env DB_VOLUME=onehub_tapduot_so bash "$CHUYEN" --chi-so-byte
  docker run --rm -v onehub_tapduot_so:/var/lib/postgresql --entrypoint sh "$TD_IMG" -c 'echo x >> /var/lib/postgresql/17/main/PG_VERSION'
  expect "bản chép sửa một tệp" do "FAIL tar --diff lệch 17/main/PG_VERSION" env DB_VOLUME=onehub_tapduot_so bash "$CHUYEN" --chi-so-byte
  docker volume create onehub_tapduot_dang >/dev/null
  docker run --rm -v onehub_tapduot_moi:/a:ro -v onehub_tapduot_dang:/b --entrypoint sh "$TD_IMG" -c 'cd /a && tar -c 17 | tar -x -C /b'
  expect "bản chép của cụm đang chạy" do "FAIL cụm không tắt sạch" env DB_VOLUME=onehub_tapduot_dang bash "$CHUYEN" --chi-so-byte
  docker volume rm onehub_tapduot_so onehub_tapduot_dang >/dev/null
  # Cặp hai chiều trên tệp bên viết thật (sau.tsv, sau-tao-lai.tsv của lượt chuyển vừa chạy).
  awk 'BEGIN { FS = OFS = "\t" } $1 == "public.mau_a" { $2 = $2 + 1 } 1' "$TD_BAN/b1/sau.tsv" > "$TD_TMP/sau-lech.tsv"
  expect "so số dòng sau chuyển với sau tạo lại" 0 "" bash "$CHUYEN" --chi-so-dong "$TD_BAN/b1/sau.tsv" "$TD_BAN/b1/sau-tao-lai.tsv"
  expect "so số dòng một bảng lệch" do "FAIL lệch bảng public.mau_a" bash "$CHUYEN" --chi-so-dong "$TD_TMP/sau-lech.tsv" "$TD_BAN/b1/sau-tao-lai.tsv"
}

ca_tao_lai() {
  local id
  docker compose -f "$DB_COMPOSE" up -d --force-recreate >/dev/null 2>&1 && td_cho_healthy "$TD_DB" || { fail "force-recreate lỗi"; return 1; }
  [ "$(td_dem mau_a)" = "$TD_A0" ] && [ "$(td_dem mau_geo)" = 10 ] && pass "tạo lại (--force-recreate): mau_a=$TD_A0 mau_geo=10" || fail "tạo lại mất dữ liệu"
  docker compose -f "$DB_COMPOSE" down >/dev/null 2>&1 && docker compose -f "$DB_COMPOSE" up -d >/dev/null 2>&1 && td_cho_healthy "$TD_DB" \
    || { fail "down rồi up lỗi"; return 1; }
  [ "$(td_dem mau_a)" = "$TD_A0" ] && [ "$(td_dem z zcode_tapduot)" = 3 ] && [ "$(td_psql -d postgres -c 'show max_connections')" = 200 ] \
    && [ "$(td_psql -d oneinvest -c "select count(*) from pg_extension where extname = 'postgis'")" = 1 ] \
    && pass "down (không -v) rồi up: mau_a=$TD_A0, DB phụ, max_connections=200, postgis còn" || fail "down rồi up mất dữ liệu hoặc cấu hình"
  mkdir -p "$TD_TMP/khac"; cp "$DB_COMPOSE" "$TD_TMP/khac/docker-compose.yml"; id=$(td_id "$TD_DB")
  docker compose -f "$TD_TMP/khac/docker-compose.yml" up -d >/dev/null 2>&1
  [ "$(td_id "$TD_DB")" = "$id" ] && pass "compose cùng cấu hình từ đường khác: up -d không tạo lại container" || fail "compose từ đường khác đã tạo lại container"
  # Đối chứng: container kiểu cũ tạo lại thì mất dữ liệu — chứng phép đo trên thấy được mất mát.
  mkdir -p "$TD_TMP/dc"
  sed -e "s/container_name: $TD_DB/container_name: onehub-tapduot-dc/" -e "s/\"$TD_PORT:5432\"/\"$((TD_PORT + 1)):5432\"/" \
    "$TD_TMP/cu/docker-compose.yml" > "$TD_TMP/dc/docker-compose.yml"
  td_compose_up onehub-tapduot-dc "$TD_TMP/dc/docker-compose.yml" onehub-tapduot-dc || { fail "không dựng được cụm đối chứng"; return 1; }
  docker exec -i -e PGPASSWORD=oneinvest onehub-tapduot-dc psql -U oneinvest -h localhost -d oneinvest -qc "create table x(i int); insert into x select generate_series(1,5)"
  docker compose -p onehub-tapduot-dc -f "$TD_TMP/dc/docker-compose.yml" up -d --force-recreate >/dev/null 2>&1 && td_cho_healthy onehub-tapduot-dc
  if docker exec -i -e PGPASSWORD=oneinvest onehub-tapduot-dc psql -U oneinvest -h localhost -d oneinvest -Atqc "select count(*) from x" >/dev/null 2>&1; then
    fail "đối chứng kiểu cũ: tạo lại mà bảng x vẫn còn — phép đo không phân biệt được"
  else pass "đối chứng kiểu cũ: tạo lại container kiểu cũ thì bảng x mất (số dòng về 0)"; fi
  docker compose -p onehub-tapduot-dc -f "$TD_TMP/dc/docker-compose.yml" down -v >/dev/null 2>&1
}

ca_lui() {
  local id_moi
  expect "chuyển lần hai trên cụm đã chuyển" do "FAIL đã chuyển" bash "$CHUYEN" --lam --sao-luu "$TD_BAN/b1"
  id_moi=$(td_id "$TD_DB")
  expect "lùi (--lui)" 0 "" bash "$CHUYEN" --lui
  [ "$(td_id "$TD_DB")" = "$TD_ID_CU" ] && [ "$(docker port "$TD_DB" 5432/tcp | head -1 | sed 's/.*://')" = "$TD_PORT" ] && [ "$(td_dem mau_a)" = "$TD_A0" ] \
    && pass "lùi: container cũ chạy lại trên cổng $TD_PORT, mau_a=$TD_A0" || fail "lùi: sai container, cổng hoặc số dòng"
  [ "$(docker ps -a --filter "id=$id_moi" --format '{{.Names}} {{.State}}' | grep -cE "^$TD_DB-moi-[0-9]+ exited$")" = 1 ] \
    && pass "lùi: container mới cất sang $TD_DB-moi-*, đang dừng" || fail "lùi: container mới không được cất"
  docker run --rm -v onehub_tapduot_moi:/v:ro --entrypoint test "$TD_IMG" -s /v/17/main/PG_VERSION \
    && pass "lùi: volume onehub_tapduot_moi còn nguyên dữ liệu" || fail "lùi: volume mới mất dữ liệu"
}

ca_lui_tu_tar() {
  local s0
  docker compose -p onehub-tapduot-cu -f "$TD_TMP/cu/docker-compose.yml" down >/dev/null 2>&1
  docker inspect "$TD_DB" >/dev/null 2>&1 && fail "compose cũ down lẽ ra xoá container mang nhãn project cũ" \
    || pass "rủi ro đo được: compose cũ (project cũ) chạy down là xoá container cũ — lý do có tar lạnh"
  cp -R "$TD_BAN/b1" "$TD_BAN/b1-tarhong"; printf 'x' >> "$TD_BAN/b1-tarhong/datadir-17.tar"
  s0=$(td_trang)
  expect "tar lạnh đổi một byte" do "FAIL sha256 datadir-17.tar" bash "$CHUYEN" --lui --tu-tar "$TD_BAN/b1-tarhong"
  [ "$(td_trang)" = "$s0" ] && pass "tar lạnh hỏng: không dựng gì" || fail "tar lạnh hỏng mà đã dựng/đổi tài nguyên"
  expect "lùi từ tar lạnh" 0 "" bash "$CHUYEN" --lui --tu-tar "$TD_BAN/b1"
  [ "$(td_dem mau_a)" = "$TD_A0" ] && [ "$(td_dem z zcode_tapduot)" = 3 ] && [ "$(docker port "$TD_DB" 5432/tcp | head -1 | sed 's/.*://')" = "$TD_PORT" ] \
    && pass "lùi từ tar lạnh: cụm cũ chạy lại trên cổng $TD_PORT, mau_a=$TD_A0 như trước chuyển" || fail "lùi từ tar lạnh sai số dòng hoặc cổng"
}

TD_A0=""
ca_chuyen_tron() {
  td_chuan_bi_moi || return
  TD_A0=$(td_dem mau_a)   # số dòng mau_a của cụm cũ ngay trước mọi ca chuyển — mọi mốc sau phải giữ đúng số này
  ca_tien_dieu_kien; ca_loi_sau_chep; ca_chuyen || return; ca_so_byte; ca_tao_lai; ca_lui; ca_lui_tu_tar
}

ca_don_khi_loi() { # lượt con bị SIGTERM sau khi dựng cụm → không sót gì
  local pid i
  TD_CON=1 TD_SLEEP_AFTER=dung bash "$SELF" tap-duot > "$TD_TMP/con.log" 2>&1 & pid=$!
  for i in $(seq 1 180); do [ "$(trang_thai_td)" = running ] && grep -q 'chờ tín hiệu' "$TD_TMP/con.log" && break; sleep 1; done
  kill -TERM "$pid"; wait "$pid" 2>/dev/null
  [ "$(td_con_sot)" = 0 ] && pass "lượt con bị SIGTERM sau khi dựng $TD_DB: không còn onehub-tapduot-*" \
    || { fail "lượt con bị SIGTERM để sót $(td_con_sot) tài nguyên"; tail -5 "$TD_TMP/con.log"; }
  docker create --name onehub-tapduot-sot --entrypoint true "$TD_IMG" >/dev/null
  td_don_dau_luot
  [ "$(td_con_sot)" = 0 ] && pass "tài nguyên sót từ lượt trước (onehub-tapduot-sot) được dọn ở đầu lượt" || fail "không dọn được tài nguyên sót"
}
trang_thai_td() { docker inspect -f '{{.State.Status}}' "$TD_DB" 2>/dev/null; }
td_don_dau_luot() {
  [ "$(td_con_sot)" = 0 ] && return
  echo "dọn tài nguyên tập dượt còn sót từ lượt trước"
  local x
  for x in $(docker ps -a --format '{{.Names}}' | grep -E '^onehub-tapduot-'); do docker rm -fv "$x" >/dev/null 2>&1; done
  for x in $(docker volume ls --format '{{.Name}}' | grep -E '^onehub[-_]tapduot'); do docker volume rm -f "$x" >/dev/null 2>&1; done
}

run_tap_duot() {
  local id0 st0 id1 st1
  export DB_CONTAINER="$TD_DB"
  TD_TMP=$(mktemp -d)
  mkdir -p "$HOME/onehub-backups" && TD_BAN=$(mktemp -d "$HOME/onehub-backups/.tapduot-XXXXXX")
  trap td_cleanup EXIT; trap 'exit 143' TERM; trap 'exit 130' INT
  id0=$(docker inspect -f '{{.Id}}' "$DB_THAT" 2>/dev/null); st0=$(docker inspect -f '{{.State.StartedAt}}' "$DB_THAT" 2>/dev/null)
  td_don_dau_luot
  [ -z "${TD_CON:-}" ] && ca_don_khi_loi
  td_dung_cu || return
  # Móc phá-thử cho ca don-khi-loi — lượt thật không đặt biến này.
  [ "${TD_SLEEP_AFTER:-}" = dung ] && { echo "chờ tín hiệu sau khi dựng $TD_DB"; sleep 300 & wait $!; }
  ca_sao_luu; ca_khoi_phuc
  declare -F ca_chuyen_tron >/dev/null && ca_chuyen_tron
  id1=$(docker inspect -f '{{.Id}}' "$DB_THAT" 2>/dev/null); st1=$(docker inspect -f '{{.State.StartedAt}}' "$DB_THAT" 2>/dev/null)
  if [ -n "$id0" ] && [ "$id0" = "$id1" ] && [ "$st0" = "$st1" ]; then pass "$DB_THAT không bị chạm (Id + StartedAt $st0 không đổi)"
  else fail "$DB_THAT bị chạm trong lượt (Id $id0→$id1, StartedAt $st0→$st1)"; fi
  td_cleanup; TD_TMP=""; TD_BAN=""
  [ "$(td_con_sot)" = 0 ] && pass "không còn onehub-tapduot-*" || fail "còn $(td_con_sot) tài nguyên onehub-tapduot-*"
}

# ─── live ───────────────────────────────────────────────────────────────────────────────────────────────────
check_du_lieu() { # $1 JSON docker inspect của DB, $2 data_directory
  local v
  [ -n "$2" ] || { fail "không đọc được data_directory của $DB_THAT"; return; }
  v=$(jq -r --arg d "$2" '.[0].Mounts[]? | select(.Type == "volume")
    | select(. as $m | $m.Destination == $d or ($d | startswith($m.Destination + "/"))) | .Name' "$1" 2>/dev/null | head -1)
  if [ "$v" = "$VOL_TEN" ]; then pass "data_directory $2 dưới mount volume $VOL_TEN"
  elif [ -n "$v" ]; then fail "data_directory $2 nằm trong volume $v (cần $VOL_TEN)"
  else fail "data_directory nằm trong lớp ghi container ($2 không dưới mount volume nào)"; fi
}
# Bản lùi là điều kiện TẠM của thời gian giữ (hồ sơ db-volume-live-ban-lui, Mạnh chọn lối b ở Cổng Phạm vi 29/10):
# còn bản lùi thì MỌI bản phải dừng + restart no; vắng bản lùi trước hạn giữ là đỏ, sau hạn là xanh.
BAN_LUI_MAU='^one-invest-db-cu-[0-9]{8}$'
BAN_LUI_GIU_DEN="2026-11-05T09:20:00Z"   # nhật ký lượt chuyển 29/10: «sớm nhất hỏi xoá bản lùi: 2026-11-05 16:20 +07»
epoch_utc() { date -j -u -f '%Y-%m-%dT%H:%M:%SZ' "$1" +%s 2>/dev/null; }
gom_ban_lui() { # $1 regex tên → in MỘT mảng JSON docker inspect (rỗng: []) — không gọi inspect với danh sách rỗng
  local ten; ten=$(docker ps -a --format '{{.Names}}' | grep -E "$1" | sort)
  if [ -z "$ten" ]; then echo '[]'; else docker inspect $ten; fi
}
check_ban_lui() { # $1 tệp JSON mảng bản lùi, $2 giờ «bây giờ» ISO UTC (vắng: giờ máy)
  local n gio han i ten st rp
  n=$(jq 'length' "$1" 2>/dev/null) || { fail "không đọc được danh sách bản lùi"; return; }
  if [ "$n" = 0 ]; then
    gio=$(epoch_utc "${2:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"); han=$(epoch_utc "$BAN_LUI_GIU_DEN")
    if [ -z "$gio" ] || [ -z "$han" ]; then fail "không đọc được giờ để so hạn giữ $BAN_LUI_GIU_DEN"
    elif [ "$gio" -ge "$han" ]; then pass "không còn bản lùi $DB_THAT-cu-* (sau hạn giữ $BAN_LUI_GIU_DEN)"
    else fail "bản lùi mất trước hạn giữ $BAN_LUI_GIU_DEN — không còn container $DB_THAT-cu-*"; fi
    return
  fi
  for i in $(seq 0 $((n - 1))); do
    ten=$(jq -r ".[$i].Name" "$1" | sed 's#^/##'); st=$(jq -r ".[$i].State.Status" "$1"); rp=$(jq -r ".[$i].HostConfig.RestartPolicy.Name" "$1")
    if [ "$st" = exited ] && [ "$rp" = no ]; then pass "bản lùi $ten exited restart=no"
    else fail "bản lùi $ten trạng thái $st restart=$rp (cần exited, no)"; fi
  done
}
live_doc() { # $1 thư mục tạm → inspect.json, ban-lui.json; in data_directory
  docker inspect "$DB_THAT" > "$1/inspect.json" 2>/dev/null || echo '[]' > "$1/inspect.json"
  gom_ban_lui "$BAN_LUI_MAU" > "$1/ban-lui.json" 2>/dev/null || echo '[]' > "$1/ban-lui.json"
  docker exec -i -e PGPASSWORD=oneinvest "$DB_THAT" psql -U oneinvest -h localhost -At -c 'show data_directory' 2>/dev/null
}
o_live() { check_du_lieu "$1" "$3"; check_ban_lui "$2" "$4"; } # $1 inspect $2 bản lùi $3 data_directory $4 giờ
LIVE_TMP=""
run_live() {
  local dd
  LIVE_TMP=$(mktemp -d); trap 'rm -rf "$LIVE_TMP"' EXIT
  dd=$(live_doc "$LIVE_TMP")
  check_du_lieu "$LIVE_TMP/inspect.json" "$dd"; check_ban_lui "$LIVE_TMP/ban-lui.json" "${DB_VOLUME_GIO_GIA:-}"
}
run_live_selftest() {
  local T dd b sau truoc n0 nk so=0 hang cot
  LIVE_TMP=$(mktemp -d); trap 'rm -rf "$LIVE_TMP"' EXIT; T="$LIVE_TMP"
  dd=$(live_doc "$T")
  [ -n "$dd" ] && [ "$(jq length "$T/inspect.json")" = 1 ] || { fail "không đọc được docker inspect / data_directory của $DB_THAT để dựng fixture"; return; }
  # Đường gom thật qua docker (chỉ đọc): không khớp → [] exit 0; khớp → đủ số container khớp.
  if b=$(gom_ban_lui '^one-invest-db-khong-co-[0-9]+$') && [ "$(jq length <<<"$b")" = 0 ]; then pass "gom bản lùi qua docker thật: mẫu không khớp → mảng rỗng exit 0"
  else fail "gom bản lùi qua docker thật: mẫu không khớp lẽ ra cho [] exit 0 (được «$b»)"; fi
  n0=$(docker ps -a --format '{{.Names}}' | grep -cE "^$DB_THAT(-cu-[0-9]{8})?$")
  nk=$(gom_ban_lui "^$DB_THAT(-cu-[0-9]{8})?$" | jq length)
  [ "$nk" = "$n0" ] && [ "$nk" -ge 1 ] && pass "gom bản lùi qua docker thật: mẫu khớp → đủ $nk container khớp" \
    || fail "gom bản lùi qua docker thật: mẫu khớp cho $nk phần tử, cần $n0"
  # Ma trận 16 ô dựng từ inspect thật: trục dữ liệu × trục bản lùi; kỳ vọng viết trước từng ô.
  jq '.[0].Mounts = [{"Type":"volume","Name":"onehub_pgdata","Destination":"/var/lib/postgresql"}]' "$T/inspect.json" > "$T/dung.json"
  jq '.[0].Mounts = [{"Type":"volume","Name":"db_oneinvest_pgdata","Destination":"/var/lib/postgresql/data"}]' "$T/inspect.json" > "$T/gan-data.json"
  bl() { jq --arg n "/$DB_THAT-cu-$1" --arg s "$2" --arg r "$3" '.[0] | .Name = $n | .State.Status = $s | .HostConfig.RestartPolicy.Name = $r' "$T/inspect.json"; }
  echo '[]' > "$T/vang.json"
  jq -s . <(bl 20261029 exited no) > "$T/mot-dung.json"
  jq -s . <(bl 20261029 running unless-stopped) > "$T/mot-chay.json"
  jq -s . <(bl 20261029 exited unless-stopped) > "$T/mot-sai-restart.json"
  jq -s . <(bl 20261020 running unless-stopped) <(bl 20261029 exited no) > "$T/hai-nho-chay.json"
  jq -s . <(bl 20261020 exited no) <(bl 20261029 running unless-stopped) > "$T/hai-lon-chay.json"
  jq -s . <(bl 20261020 exited no) <(bl 20261029 exited no) > "$T/hai-dung.json"
  truoc="2026-11-01T00:00:00Z"; sau="2026-11-06T00:00:00Z"
  for hang in dung gan-data; do
    while IFS='|' read -r cot ban gio want msg; do
      [ "$hang" = gan-data ] && { want=do; msg="FAIL data_directory nằm trong lớp ghi container"; }
      expect "ô $hang × $cot" "$want" "$msg" o_live "$T/$hang.json" "$T/$ban.json" "$dd" "$gio"; so=$((so + 1))
    done <<EOF
vang-truoc-han|vang|$truoc|do|FAIL bản lùi mất trước hạn giữ
vang-sau-han|vang|$sau|0|PASS không còn bản lùi $DB_THAT-cu-*
mot-exited-no|mot-dung|$sau|0|PASS bản lùi $DB_THAT-cu-20261029 exited restart=no
mot-running|mot-chay|$sau|do|FAIL bản lùi $DB_THAT-cu-20261029 trạng thái running restart=unless-stopped
mot-exited-sai-restart|mot-sai-restart|$sau|do|FAIL bản lùi $DB_THAT-cu-20261029 trạng thái exited restart=unless-stopped
hai-ban-nho-running|hai-nho-chay|$sau|do|FAIL bản lùi $DB_THAT-cu-20261020 trạng thái running
hai-ban-lon-running|hai-lon-chay|$sau|do|FAIL bản lùi $DB_THAT-cu-20261029 trạng thái running
hai-ban-deu-dung|hai-dung|$sau|0|PASS bản lùi $DB_THAT-cu-20261020 exited restart=no
EOF
  done
  [ "$so" = 16 ] && pass "ma trận đủ 16 ô" || fail "ma trận chạy $so ô, cần 16"
}

case "$MODE" in
  static) check_compose "$COMPOSE"; check_loai_tru "$CHUYEN" ;;
  mutation) run_mutation ;;
  tap-duot) run_tap_duot ;;
  live) echo "── tự kiểm bộ đọc (inspect thật đã làm hỏng)"; run_live_selftest; rm -rf "$LIVE_TMP"; echo "── máy này"; run_live ;;
  live-selftest) run_live_selftest ;;
  *) echo "dùng: $0 static|mutation|tap-duot|live|live-selftest" >&2; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "db-volume-check $MODE: ĐẠT" || echo "db-volume-check $MODE: KHÔNG ĐẠT"
exit $FAIL
