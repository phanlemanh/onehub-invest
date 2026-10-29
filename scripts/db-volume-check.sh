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
  out=$( FAIL=0; "$@"; exit $FAIL ); rc=$?
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

case "$MODE" in
  static) check_compose "$COMPOSE"; check_loai_tru "$CHUYEN" ;;
  mutation) run_mutation ;;
  *) echo "dùng: $0 static|mutation|tap-duot|live|live-selftest" >&2; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "db-volume-check $MODE: ĐẠT" || echo "db-volume-check $MODE: KHÔNG ĐẠT"
exit $FAIL
