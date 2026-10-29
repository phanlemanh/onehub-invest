#!/bin/bash
# db-chuyen-volume.sh — chuyển DB local từ lớp ghi của container vào volume có tên, và lùi (hồ sơ db-vao-volume).
#   bash scripts/db-chuyen-volume.sh                      CHỈ KIỂM: hiện trạng + tiền điều kiện + kế hoạch, không đổi gì
#   bash scripts/db-chuyen-volume.sh --lam [--sao-luu <bản>]
#   bash scripts/db-chuyen-volume.sh --lui [--tu-tar <bản>]
# Sổ tay: docs/ops/db-volume.md. Thiết kế: docs/superpowers/specs/2026-10-29-db-vao-volume-design.md §3.3–3.5.
# --lam: tắt nhanh-sạch cụm cũ → giữ container cũ làm bản lùi (<tên>-cu-<YYYYMMDD>, restart no, KHÔNG xoá) → chép
#   thư mục dữ liệu vào volume (cùng luồng ghi tar lạnh datadir-<major>.tar vào thư mục bản sao lưu) → so từng byte →
#   compose up → so số dòng bảng chính → tạo lại (--force-recreate) → so lại. Lỗi sau bước tắt: in lệnh lùi, thoát 1,
#   không xoá gì.
# Biến (mặc định là máy thật; tập dượt trỏ sang onehub-tapduot-*): DB_CONTAINER DB_PORT DB_VOLUME DB_COMPOSE
#   DB_BACKUP_ROOT DB_LAUNCH_DIR. Chỉ cho phép thử: DB_CHUYEN_GIO_GIA (HH:MM) DB_CHUYEN_THU_GIA (0–6, 0 = CN)
#   DB_CHUYEN_DIA_GIA (KB trống của máy ảo) DB_CHUYEN_TIEN_TRINH_MAU DB_CHUYEN_LOI_GIA=sau-chep
#   DB_CHUYEN_SAU_DEM_HOOK DB_CHUYEN_LOAI_TRU_THEM ("<schema.bảng>|<lý do>").
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
C="${DB_CONTAINER:-one-invest-db}"
PORT="${DB_PORT:-5433}"
VOL="${DB_VOLUME:-onehub_pgdata}"
COMPOSE="${DB_COMPOSE:-$ROOT/db/docker-compose.yml}"
BR="${DB_BACKUP_ROOT:-$HOME/onehub-backups/db}"
LD="${DB_LAUNCH_DIR:-$HOME/Library/LaunchAgents}"
TT_MAU="${DB_CHUYEN_TIEN_TRINH_MAU:-daily\.sh|weekly-collect\.sh|finalize-hanoi\.sh}"
CUA_SO_PHUT=20

# Bảng loại khỏi phép so «bảng chính» lúc chuyển thật: bảng mà job 5/15 phút ghi trong lúc DB ngừng — lệch số dòng ở
# đây không phải mất dữ liệu (tar --diff là lưới từng byte). Mỗi dòng "<schema.bảng>|<lý do>". Không bao giờ chứa bảng
# canonical (db-volume-check.sh static canh). Danh sách thật lập ở việc 7 của kế hoạch, đo từ pg_stat_user_tables.
BANG_LOAI_TRU=(
)

MODE=kiem; BAN=""
while [ $# -gt 0 ]; do
  case "$1" in
    --lam) MODE=lam ;;
    --lui) MODE=lui ;;
    --chi-so-byte) MODE=so-byte ;;
    --chi-so-dong) MODE=so-dong; SO_A="${2:-}"; SO_B="${3:-}"; shift 2 ;;
    --sao-luu|--tu-tar) BAN="${2:-}"; [ "$1" = --tu-tar ] && TU_TAR=1; shift ;;
    *) echo "dùng: $0 [--lam [--sao-luu <bản>] | --lui [--tu-tar <bản>]]" >&2; exit 2 ;;
  esac
  shift
done
TU_TAR="${TU_TAR:-0}"

NFAIL=0
pass() { echo "PASS $*"; }
fail() { echo "FAIL $*"; NFAIL=$((NFAIL + 1)); }
info() { echo "  · $*"; }
die() { echo "FAIL $1"; exit "${2:-1}"; }

psql_c() { docker exec -i -e PGPASSWORD=oneinvest "$1" psql -U oneinvest -h localhost -At -q -v ON_ERROR_STOP=1 "${@:2}"; }
DEM_SQL="select format('select %L||chr(9)||count(*) from %I.%I', n.nspname||'.'||c.relname, n.nspname, c.relname)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema','cron')
    and n.nspname not like 'pg_toast%' and n.nspname not like 'pg_temp%' order by 1"
dem_bang() { printf '%s \\gexec\n' "$DEM_SQL" | psql_c "$1" -d oneinvest; } # $1 container → tsv

loai_tru() { # in tên các bảng loại trừ
  local x
  for x in ${BANG_LOAI_TRU[@]+"${BANG_LOAI_TRU[@]}"} ${DB_CHUYEN_LOAI_TRU_THEM:+"$DB_CHUYEN_LOAI_TRU_THEM"}; do echo "${x%%|*}"; done
}
# So hai bảng số dòng trên bảng chính (mọi bảng của tệp đầu trừ danh sách loại trừ). Bảng loại trừ lệch thì in, không chặn.
so_dong() { # $1 trước $2 sau $3 nhãn
  local lt bang so co n=0 lech=0
  lt=$(loai_tru)
  while IFS=$'\t' read -r bang so; do
    [ -n "$bang" ] || continue
    co=$(awk -F'\t' -v b="$bang" '$1 == b { print $2 }' "$2")
    if grep -qxF "$bang" <<<"$lt"; then
      [ "$co" = "$so" ] || info "bảng loại trừ $bang $so→${co:-(vắng)} (không chặn)"
      continue
    fi
    n=$((n + 1))
    [ "$co" = "$so" ] || { fail "lệch bảng $bang $so≠${co:-(vắng)} ($3)"; lech=$((lech + 1)); }
  done < "$1"
  [ $n -gt 0 ] || { fail "không có bảng chính nào để so ($3)"; return 1; }
  [ $lech = 0 ] && pass "số dòng bảng chính $3 ($n bảng)"
  [ $lech = 0 ]
}

trang_thai() { docker inspect -f '{{.State.Status}}' "$1" 2>/dev/null; }
cho_healthy() { # $1 container — tối đa 240 giây
  local i s; for i in $(seq 1 240); do
    s=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$1" 2>/dev/null)
    [ "$s" = healthy ] && return 0; sleep 1
  done
  docker logs --tail 15 "$1" 2>&1; return 1
}
ban_lui() { docker ps -a --format '{{.Names}}' | grep -E "^${C}-cu-[0-9]{8}$" | sort | tail -1; }
vol_co() { docker volume inspect "$1" >/dev/null 2>&1; }
vol_rong() { # $1 volume, $2 ảnh → 0 khi rỗng
  [ "$(docker run --rm -v "$1":/v --entrypoint sh "$2" -c 'ls -A /v | wc -l' 2>/dev/null | tr -d ' ')" = 0 ]
}
du_lieu_trong_volume() { # $1 container, $2 data_directory → in tên volume phủ nó, rỗng khi không có
  docker inspect "$1" 2>/dev/null | jq -r --arg d "$2" '.[0].Mounts[]? | select(.Type == "volume")
    | select(. as $m | $m.Destination == $d or ($d | startswith($m.Destination + "/"))) | .Name' | head -1
}

# Ban sao lưu: --sao-luu/--tu-tar, hoặc bản mới nhất có khoi-phuc-ok trong DB_BACKUP_ROOT.
chon_ban() {
  [ -n "$BAN" ] && { echo "$BAN"; return; }
  ls -t "$BR"/*/khoi-phuc-ok 2>/dev/null | head -1 | xargs -I{} dirname {} 2>/dev/null
}

# Cửa sổ job launchd theo giờ: mỗi plist có StartCalendarInterval → mốc HH:MM (Weekday thì chỉ ngày ấy); ghi bảng
# cửa sổ (job, mốc, phút tới giờ chuyển) ra $1 khi có.
kiem_cua_so() { # $1 tệp bảng (tuỳ chọn)
  local gio thu bay f job js m h mi wd d trung=0
  gio="${DB_CHUYEN_GIO_GIA:-$(date +%H:%M)}"; thu="${DB_CHUYEN_THU_GIA:-$(date +%w)}"
  bay=$((10#${gio%%:*} * 60 + 10#${gio##*:}))
  [ -n "${1:-}" ] && printf 'job\tmoc\tphut_toi_gio_chuyen\n' > "$1"
  for f in "$LD"/com.oneinvest.*.plist; do
    [ -f "$f" ] || continue
    job=$(basename "$f" .plist)
    js=$(plutil -extract StartCalendarInterval json -o - "$f" 2>/dev/null) || continue
    while IFS=$'\t' read -r h mi wd; do
      [ -n "$wd" ] && [ "$wd" != "$thu" ] && [ "$wd" != "$((thu == 0 ? 7 : thu))" ] && continue
      for hh in $( [ -n "$h" ] && echo "$h" || seq 0 23 ); do
        m=$((hh * 60 + ${mi:-0}))
        d=$(( (m - bay + 1440) % 1440 )); [ $d -gt 720 ] && d=$((1440 - d))
        [ -n "${1:-}" ] && printf '%s\t%02d:%02d\t%s\n' "$job" "$hh" "${mi:-0}" "$d" >> "$1"
        [ $d -le $CUA_SO_PHUT ] && { fail "trùng cửa sổ $job $(printf '%02d:%02d' "$hh" "${mi:-0}") (giờ chuyển $gio, cách $d phút ≤ $CUA_SO_PHUT)"; trung=1; }
      done
    done < <(jq -r 'if type == "array" then .[] else . end | [(.Hour // "" | tostring), (.Minute // 0 | tostring), (.Weekday // "" | tostring)] | @tsv' <<<"$js")
  done
  [ $trung = 0 ] && pass "cửa sổ — giờ chuyển $gio cách mọi job launchd theo giờ > $CUA_SO_PHUT phút"
}

tien_dieu_kien() { # in PASS/FAIL từng điều kiện; trả số FAIL
  local before=$NFAIL st dd v img b okf tuoi tt size vm host
  st=$(trang_thai "$C")
  if [ "$st" != running ]; then fail "$C không chạy (trạng thái ${st:-vắng})"; return $((NFAIL - before)); fi
  img=$(docker inspect -f '{{.Config.Image}}' "$C")
  dd=$(psql_c "$C" -d postgres -c 'show data_directory' 2>/dev/null)
  [ -n "$dd" ] || { fail "không đọc được data_directory của $C"; return $((NFAIL - before)); }
  v=$(du_lieu_trong_volume "$C" "$dd")
  if [ -n "$v" ]; then fail "đã chuyển — $dd của $C đã nằm trong volume $v"; else pass "$C chưa chuyển — $dd nằm trong lớp ghi container"; fi
  if vol_co "$VOL"; then
    vol_rong "$VOL" "$img" && pass "volume đích $VOL có sẵn và rỗng" || fail "volume đích không rỗng — $VOL"
  else pass "volume đích $VOL chưa có (sẽ tạo)"; fi
  b=$(ban_lui); [ -z "$b" ] && pass "chưa có bản lùi ${C}-cu-*" || fail "đã có ${C}-cu ($b)"
  b=$(chon_ban); okf="$b/khoi-phuc-ok"
  if [ -z "$b" ] || [ ! -f "$okf" ]; then fail "chưa có bản sao lưu đã khôi phục thử (${b:-$BR/*}/khoi-phuc-ok)"
  else
    tuoi=$(( ($(date +%s) - $(stat -f %m "$okf")) / 3600 ))
    [ $tuoi -le 24 ] && pass "bản sao lưu $b đã khôi phục thử $tuoi giờ trước" || fail "bản sao lưu quá 24 giờ ($b, $tuoi giờ)"
  fi
  kiem_cua_so "${1:-}"
  tt=$(pgrep -fl "$TT_MAU" 2>/dev/null | awk -v p="$$" '$1 != p' | head -3)
  [ -z "$tt" ] && pass "không tiến trình job nào đang chạy" || fail "đang chạy $(tr '\n' ';' <<<"$tt")"
  # Phiên đang chạy truy vấn, hay nối DB khác oneinvest/postgres (vd zcode_* của ZCode — lời khuyên liên làn 29/10):
  # fast shutdown sẽ cắt ngang chúng → dời giờ. Phiên rảnh của app/job thì cắt được.
  tt=$(psql_c "$C" -d postgres -c "select datname||':'||usename||':'||coalesce(application_name,'')||':'||state from pg_stat_activity
    where backend_type = 'client backend' and pid <> pg_backend_pid()
      and (state not in ('idle') or datname not in ('oneinvest','postgres'))" 2>/dev/null | head -5)
  [ -z "$tt" ] && pass "không phiên nào đang chạy truy vấn hay nối DB phụ" || fail "đang có phiên $(tr '\n' ';' <<<"$tt")"
  size=$(docker exec "$C" du -sk "$(dirname "$dd")" 2>/dev/null | awk '{print $1}')
  vm="${DB_CHUYEN_DIA_GIA:-$(docker run --rm --entrypoint df "$img" -Pk / 2>/dev/null | awk 'NR == 2 {print $4}')}"
  mkdir -p "$BR" 2>/dev/null; host=$(df -Pk "$BR" | awk 'NR == 2 {print $4}')
  if [ -z "$size" ] || [ -z "$vm" ] || [ -z "$host" ]; then fail "đĩa không đủ — không đo được (dữ liệu ${size:-?} KB, máy ảo ${vm:-?} KB, máy chủ ${host:-?} KB)"
  elif [ "$vm" -lt $((2 * size)) ]; then fail "đĩa không đủ vm — còn $vm KB, cần ≥ $((2 * size)) KB"
  elif [ "$host" -lt $((2 * size)) ]; then fail "đĩa không đủ máy chủ — còn $host KB ở $BR, cần ≥ $((2 * size)) KB"
  else pass "đĩa — dữ liệu $size KB, máy ảo còn $vm KB, máy chủ còn $host KB"; fi
  return $((NFAIL - before))
}

# So từng byte luồng thư mục dữ liệu của bản lùi với volume, và cụm trong volume đã tắt sạch.
so_byte() { # $1 bản lùi, $2 volume, $3 thư mục major (vd /var/lib/postgresql/17), $4 ảnh
  local out lech ctl
  out=$(docker cp "$1:$3" - | docker run --rm -i -v "$2":/var/lib/postgresql --entrypoint tar "$4" -d -C "$(dirname "$3")" 2>&1
    echo "__rc ${PIPESTATUS[0]} ${PIPESTATUS[1]}")
  if [ "$(tail -1 <<<"$out")" = "__rc 0 0" ] && [ "$(grep -vc '^__rc ' <<<"$out")" = 0 ]; then pass "tar --diff 0 tệp lệch"
  else lech=$(grep -v '^__rc ' <<<"$out" | grep -oE '^[^:]+' | sort -u | head -3 | tr '\n' ' '); fail "tar --diff lệch $lech"; grep -v '^__rc ' <<<"$out" | head -5; fi
  ctl=$(docker run --rm -v "$2":/var/lib/postgresql --entrypoint pg_controldata "$4" "$3/main" 2>&1 | grep 'Database cluster state')
  if grep -q 'shut down$' <<<"$ctl"; then pass "pg_controldata shut down"; else fail "cụm không tắt sạch (${ctl:-không đọc được pg_control})"; fi
}

loi_sau_dung() { # lỗi sau khi cụm cũ đã tắt: không xoá gì, chỉ chỉ đường lùi
  echo "FAIL $1"
  echo "DỪNG — không xoá gì. Bản lùi: $(ban_lui || true). Lùi: bash scripts/db-chuyen-volume.sh --lui${2:+ --tu-tar $2}"
  exit 1
}

compose_info() { # in "<project> <khoá volume>" của compose cho volume $VOL
  docker compose -f "$COMPOSE" config --format json 2>/dev/null \
    | jq -r --arg v "$VOL" '.name + " " + ((.volumes // {}) | to_entries | map(select(.value.name == $v)) | .[0].key // "")'
}

chuyen() {
  local dd major img ngay cu b log mc0 mc1 proj vkey
  b=$(chon_ban)
  echo "── tiền điều kiện"
  tien_dieu_kien "${b:+$b/cua-so.tsv}" || { echo "DỪNG — thiếu tiền điều kiện, không đổi gì."; exit 2; }
  [ -n "$b" ] && [ -d "$b" ] || die "không có thư mục bản sao lưu" 2
  read -r proj vkey <<<"$(compose_info)"
  [ -n "$proj" ] && [ -n "$vkey" ] || die "compose $COMPOSE không khai volume tên $VOL" 2
  log="$b/chuyen.log"; exec > >(tee -a "$log") 2>&1
  echo "── chuyển $C → volume $VOL lúc $(date '+%Y-%m-%d %H:%M:%S %Z') (bản $b)"
  img=$(docker inspect -f '{{.Config.Image}}' "$C")
  dd=$(psql_c "$C" -d postgres -c 'show data_directory'); major=$(dirname "$dd")
  mc0=$(psql_c "$C" -d postgres -c 'show max_connections')
  dem_bang "$C" > "$b/truoc.tsv" || die "không đếm được số dòng trước chuyển"
  info "đếm trước: $(grep -c . "$b/truoc.tsv") bảng"
  [ -n "${DB_CHUYEN_SAU_DEM_HOOK:-}" ] && bash -c "$DB_CHUYEN_SAU_DEM_HOOK"

  echo "── tắt nhanh-sạch"
  docker update --restart=no "$C" >/dev/null || die "không hạ được restart policy của $C — chưa đổi gì khác"
  docker exec -u postgres "$C" pg_ctl -D "$dd" stop -m fast -w -t 120 >/dev/null 2>&1
  docker stop -t 60 "$C" >/dev/null 2>&1
  [ "$(trang_thai "$C")" = exited ] || loi_sau_dung "$C chưa dừng hẳn (trạng thái $(trang_thai "$C"))"
  ngay=$(date +%Y%m%d); cu="${C}-cu-${ngay}"
  docker rename "$C" "$cu" || loi_sau_dung "không đổi tên được $C → $cu"
  pass "bản lùi $cu $(trang_thai "$cu") restart=$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$cu")"

  echo "── chép vật lý + tar lạnh"
  vol_co "$VOL" || docker volume create --label "com.docker.compose.project=$proj" --label "com.docker.compose.volume=$vkey" "$VOL" >/dev/null \
    || loi_sau_dung "không tạo được volume $VOL"
  docker cp "$cu:$major" - | tee "$b/datadir-$(basename "$major").tar" \
    | docker run --rm -i -v "$VOL":/var/lib/postgresql --entrypoint tar "$img" -x -C "$(dirname "$major")"
  [ "${PIPESTATUS[*]}" = "0 0 0" ] || loi_sau_dung "chép thư mục dữ liệu lỗi (${PIPESTATUS[*]})"
  ( cd "$b" && shasum -a 256 "datadir-$(basename "$major").tar" > "datadir-$(basename "$major").tar.sha256" ) \
    || loi_sau_dung "không ghi được sha256 tar lạnh"
  pass "tar lạnh $b/datadir-$(basename "$major").tar + sha256"
  [ "${DB_CHUYEN_LOI_GIA:-}" = sau-chep ] && loi_sau_dung "lỗi giả sau bước chép (DB_CHUYEN_LOI_GIA)" "$b"
  so_byte "$cu" "$VOL" "$major" "$img"
  [ $NFAIL = 0 ] || loi_sau_dung "bản chép không khớp bản lùi" "$b"

  echo "── bật container mới trên volume"
  docker compose -f "$COMPOSE" up -d >/dev/null 2>&1 || loi_sau_dung "compose up lỗi"
  cho_healthy "$C" || loi_sau_dung "$C mới không healthy"
  [ "$(psql_c "$C" -d postgres -c 'show data_directory')" = "$dd" ] || loi_sau_dung "data_directory mới khác $dd"
  [ "$(du_lieu_trong_volume "$C" "$dd")" = "$VOL" ] && pass "data_directory $dd dưới mount volume $VOL" \
    || loi_sau_dung "data_directory mới không nằm trong volume $VOL"
  mc1=$(psql_c "$C" -d postgres -c 'show max_connections')
  [ "$mc0" = "$mc1" ] && pass "ALTER SYSTEM giữ nguyên (max_connections=$mc1)" || fail "max_connections $mc0→$mc1"
  dem_bang "$C" > "$b/sau.tsv" || loi_sau_dung "không đếm được số dòng sau chuyển"
  so_dong "$b/truoc.tsv" "$b/sau.tsv" "trước=sau" || loi_sau_dung "số dòng lệch sau chuyển"

  echo "── tạo lại container (--force-recreate)"
  docker compose -f "$COMPOSE" up -d --force-recreate >/dev/null 2>&1 && cho_healthy "$C" || loi_sau_dung "tạo lại lỗi"
  dem_bang "$C" > "$b/sau-tao-lai.tsv" || loi_sau_dung "không đếm được sau tạo lại"
  so_dong "$b/sau.tsv" "$b/sau-tao-lai.tsv" "sau chuyển=sau tạo lại" || loi_sau_dung "số dòng lệch sau tạo lại"
  [ $NFAIL = 0 ] || loi_sau_dung "còn $NFAIL kiểm đỏ"
  echo "── xong. Bản lùi $cu giữ nguyên (đang dừng, restart no)."
  echo "lùi: bash scripts/db-chuyen-volume.sh --lui   (hoặc --lui --tu-tar $b nếu bản lùi mất)"
  echo "sớm nhất hỏi xoá bản lùi: $(date -v+7d '+%Y-%m-%d %H:%M %Z')"
}

dat_container_moi_sang_ben() { # container hiện tên $C (nếu có) → dừng, restart no, đổi tên <C>-moi-<giờ>
  local moi
  docker inspect "$C" >/dev/null 2>&1 || return 0
  moi="${C}-moi-$(date +%Y%m%d%H%M)"
  docker update --restart=no "$C" >/dev/null 2>&1
  docker stop -t 60 "$C" >/dev/null 2>&1
  docker rename "$C" "$moi" || die "không đổi tên được $C → $moi"
  pass "container mới cất sang $moi ($(trang_thai "$moi")) — volume giữ nguyên"
}

lui() {
  local cu tar sha img env_args vl
  if [ "$TU_TAR" = 1 ]; then
    [ -n "$BAN" ] && [ -d "$BAN" ] || die "--tu-tar cần thư mục bản sao lưu" 2
    tar=$(ls "$BAN"/datadir-*.tar 2>/dev/null | head -1); sha="$tar.sha256"
    [ -f "$tar" ] && [ -f "$sha" ] || die "không có tar lạnh + sha256 trong $BAN" 2
    ( cd "$BAN" && shasum -a 256 -c "$(basename "$sha")" >/dev/null 2>&1 ) || die "sha256 $(basename "$tar") — không dựng gì"
    img=$(docker compose -f "$COMPOSE" config --format json | jq -r '.services.db.image')
    env_args=$(docker compose -f "$COMPOSE" config --format json | jq -r '.services.db.environment | to_entries[] | "-e \(.key)=\(.value)"')
    dat_container_moi_sang_ben
    vl="${VOL}_lui_$(date +%Y%m%d%H%M)"
    docker volume create "$vl" >/dev/null || die "không tạo được volume $vl"
    docker run --rm -i -v "$vl":/var/lib/postgresql --entrypoint tar "$img" -x -C /var/lib/postgresql < "$tar" || die "giải tar lạnh lỗi"
    # shellcheck disable=SC2086
    docker run -d --name "$C" --restart unless-stopped -p "$PORT:5432" $env_args -v "$vl":/var/lib/postgresql \
      --health-cmd "pg_isready -U oneinvest -d oneinvest" --health-interval 3s --health-timeout 3s --health-retries 20 \
      "$img" >/dev/null || die "không dựng được $C từ tar lạnh"
    cho_healthy "$C" || die "$C (từ tar lạnh) không healthy"
    pass "lùi từ tar lạnh — $C chạy trên volume $vl, cổng $PORT"
  else
    cu=$(ban_lui); [ -n "$cu" ] || die "không có bản lùi ${C}-cu-* — dùng --lui --tu-tar <bản>" 2
    dat_container_moi_sang_ben
    docker rename "$cu" "$C" || die "không đổi tên được $cu → $C"
    docker update --restart=unless-stopped "$C" >/dev/null && docker start "$C" >/dev/null || die "không bật được $C"
    cho_healthy "$C" || die "$C (bản lùi) không healthy"
    pass "lùi về bản lùi — $C chạy lại trên cổng $PORT (dữ liệu ghi sau giờ chuyển không theo về)"
  fi
  info "số dòng: $(dem_bang "$C" | awk -F'\t' '{s += $2} END {print NR " bảng, " s " dòng"}')"
}

case "$MODE" in
  kiem)
    echo "── hiện trạng"
    info "container $C: $(trang_thai "$C" || echo vắng), ảnh $(docker inspect -f '{{.Config.Image}}' "$C" 2>/dev/null)"
    info "mount: $(docker inspect "$C" 2>/dev/null | jq -c '[.[0].Mounts[]? | {Type, Name, Destination}]')"
    info "compose: $COMPOSE (project/volume: $(compose_info))"
    echo "── tiền điều kiện"
    tien_dieu_kien; n=$?
    echo "── kế hoạch (--lam): tắt nhanh-sạch → giữ bản lùi ${C}-cu-$(date +%Y%m%d) → chép vào $VOL + tar lạnh → so byte → compose up → so số dòng → tạo lại → so lại"
    [ $n = 0 ] && echo "ĐỦ tiền điều kiện — chưa đổi gì." || echo "THIẾU $n tiền điều kiện — chưa đổi gì."
    [ $n = 0 ] || exit 2 ;;
  lam) chuyen ;;
  lui) lui ;;
  so-byte) # chỉ đọc: so bản lùi mới nhất với $VOL (phép thử của db-volume-check.sh)
    cu=$(ban_lui); [ -n "$cu" ] || die "không có bản lùi" 2
    so_byte "$cu" "$VOL" "${DB_CHUYEN_MAJOR_DIR:-/var/lib/postgresql/17}" "$(docker inspect -f '{{.Config.Image}}' "$cu")"
    [ $NFAIL = 0 ] || exit 1 ;;
  so-dong) so_dong "$SO_A" "$SO_B" "so tệp" || exit 1 ;;
esac
