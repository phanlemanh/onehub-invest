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
#   live           CHỈ ĐỌC máy này: data_directory của one-invest-db nằm dưới mount volume onehub_pgdata; bản lùi
#                  one-invest-db-cu-* tồn tại, đang dừng, restart no.
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
    [ $rc = 0 ] && pass "$label xanh" || { fail "$label lẽ ra xanh"; echo "$out"; }
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
    mutate "$T/chuyen-lanh.sh" "$T/loai-canonical.sh" 's#^BANG_LOAI_TRU=\(#BANG_LOAI_TRU=(\n  "public.sale_offers|đột biến thử"#' &&
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
td_cho_healthy() { # $1 container — chờ tối đa 180 giây
  local i s; for i in $(seq 1 180); do
    s=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$1" 2>/dev/null)
    [ "$s" = healthy ] && return 0; sleep 1
  done
  echo "--- đuôi log $1:"; docker logs --tail 15 "$1" 2>&1; return 1
}
td_dung_cu() { # cụm kiểu cũ + dữ liệu mồi
  mkdir -p "$TD_TMP/cu"
  git -C "$ROOT" show "$TD_CU_REF:db/docker-compose.yml" \
    | sed -e "s/container_name: one-invest-db/container_name: $TD_DB/" -e "s/\"5433:5432\"/\"$TD_PORT:5432\"/" > "$TD_TMP/cu/docker-compose.yml" \
    || { fail "không đọc được compose cũ ở $TD_CU_REF"; return 1; }
  grep -q '/var/lib/postgresql/data' "$TD_TMP/cu/docker-compose.yml" || { fail "compose ở $TD_CU_REF không phải kiểu cũ"; return 1; }
  docker compose -p onehub-tapduot-cu -f "$TD_TMP/cu/docker-compose.yml" up -d >/dev/null 2>&1 || { fail "không dựng được $TD_DB"; return 1; }
  td_cho_healthy "$TD_DB" || { fail "$TD_DB không healthy"; return 1; }
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

run_tap_duot() {
  local id0 st0 id1 st1
  export DB_CONTAINER="$TD_DB"
  TD_TMP=$(mktemp -d)
  mkdir -p "$HOME/onehub-backups" && TD_BAN=$(mktemp -d "$HOME/onehub-backups/.tapduot-XXXXXX")
  trap td_cleanup EXIT; trap 'exit 143' TERM; trap 'exit 130' INT
  id0=$(docker inspect -f '{{.Id}}' "$DB_THAT" 2>/dev/null); st0=$(docker inspect -f '{{.State.StartedAt}}' "$DB_THAT" 2>/dev/null)
  [ "$(td_con_sot)" = 0 ] || { echo "dọn tài nguyên tập dượt còn sót từ lượt trước"; td_cleanup; TD_TMP=$(mktemp -d); TD_BAN=$(mktemp -d "$HOME/onehub-backups/.tapduot-XXXXXX"); }
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

case "$MODE" in
  static) check_compose "$COMPOSE"; check_loai_tru "$CHUYEN" ;;
  mutation) run_mutation ;;
  tap-duot) run_tap_duot ;;
  *) echo "dùng: $0 static|mutation|tap-duot|live|live-selftest" >&2; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "db-volume-check $MODE: ĐẠT" || echo "db-volume-check $MODE: KHÔNG ĐẠT"
exit $FAIL
