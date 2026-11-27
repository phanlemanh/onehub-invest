#!/usr/bin/env bash
# check-db-noi-bo.sh — HT8 db-chi-nghe-noi-bo-va-chinh-postgres: DB máy thu chỉ nghe 127.0.0.1 và chạy bộ tham số khai trong compose.
# Khuôn check-db-autostart.sh (AU7). Mọi container/volume tạm mang tiền tố ht8-/onehub_ht8_, không chạm one-invest-db
# ngoài đọc (phiên read-only, pg_dump chỉ đọc). Chế độ:
#   static        cấu hình gộp của db/docker-compose.yml: cổng chỉ 127.0.0.1, bốn tham số, shm_size, không command:, và ngoài
#                 các khoá ấy bằng compose ở HT8_BASE (mặc định 5a418983c, main trước vòng).
#   mutation      sáu bản compose hỏng mỗi bản đỏ với thông điệp ghim; bản lành xanh.
#   cong          hai container tạm (nc): khai 127.0.0.1 → Mac chỉ nghe 127.0.0.1, IP LAN từ chối; khai trần (đối chứng) → LAN nối được.
#   soat          bên nối DB ngoài loopback trong kho + plist launchd → 0; liệt tệp docker run/exec chạm DB thật; ba đối chứng cấy.
#   tham-so       container tạm từ compose cây và compose base → SHOW đúng giá trị; đường áp bốn bước trên cùng volume.
#   do            đo trước/sau trên bản chép hai bảng lớn; đối chứng shm 64 MB.        (nặng — giữ s4 hoặc tải 1′ < 12)
#   cu-khong-gay  hai bộ kiểm compose cũ vẫn xanh; compose tập dượt của db-volume-check không còn cổng 5433.
#   live          CHỈ ĐỌC one-invest-db: Mac chỉ nghe 127.0.0.1:5433, IP LAN từ chối, SHOW bằng compose. Lệnh kiểm sau áp.
#   live-ba       bộ đọc live chạy ba lần: one-invest-db (trước áp: đỏ), container tạm cây (xanh), container tạm base (đỏ).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
MODE="${1:-}"
COMPOSE="$ROOT/db/docker-compose.yml"
BASE="${HT8_BASE:-5a418983c}"
DB=one-invest-db
IMG=kartoza/postgis:17-3.5
# Giá trị khai của HT8 — một chỗ; static so compose với bảng này, live so SHOW với compose (không với bảng).
want() { case "$1" in SHARED_BUFFERS) echo 8GB ;; WORK_MEM) echo 64MB ;; MAINTENANCE_WORK_MEM) echo 1GB ;; esac; }
WANT_ECS="20GB"; WANT_SHM=1073741824
FAIL=0
pass() { echo "PASS $*"; }
fail() { echo "FAIL $*"; FAIL=1; }
expect() { # nhãn · 0|do · thông điệp ghim · lệnh…
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

cau_hinh() { docker compose -p ht8cmp -f "$1" config --format json 2>/dev/null; }

check_static() { # $1 = tệp compose
  local js; js=$(cau_hinh "$1") || { fail "compose không gộp được"; return; }
  local n; n=$(jq '.services.db.ports // [] | length' <<<"$js")
  [ "$n" -gt 0 ] || fail "compose db không xuất bản cổng nào"
  while IFS=$'\t' read -r pub ip; do
    [ "$ip" = 127.0.0.1 ] && pass "cổng db $ip:$pub" || fail "cổng db $pub host_ip=${ip:-(trống)}"
  done < <(jq -r '.services.db.ports[]? | [.published, (.host_ip // "")] | @tsv' <<<"$js")
  jq -e '.services.db.ports[]? | select(.published == "5433")' <<<"$js" >/dev/null || fail "compose db không còn cổng 5433"
  local k v
  for k in SHARED_BUFFERS WORK_MEM MAINTENANCE_WORK_MEM; do
    v=$(jq -r --arg k "$k" '.services.db.environment[$k] // "(vắng)"' <<<"$js")
    [ "$v" = "$(want $k)" ] && pass "$k=$v" || fail "$k=$v (cần $(want $k))"
  done
  v=$(jq -r '.services.db.environment.EXTRA_CONF // ""' <<<"$js")
  grep -qE "effective_cache_size *= *$WANT_ECS" <<<"$v" && pass "EXTRA_CONF effective_cache_size = $WANT_ECS" \
    || fail "EXTRA_CONF thiếu effective_cache_size = $WANT_ECS (đang «${v:-(vắng)}»)"
  v=$(jq -r '.services.db.shm_size // "(vắng)"' <<<"$js")
  [ "$v" = "$WANT_SHM" ] && pass "shm_size=$v" || fail "shm_size=$v (cần $WANT_SHM)"
  jq -e '.services.db.command' <<<"$js" >/dev/null && fail "compose có command: — ảnh kartoza không nhận -c"
  # Ngoài các khoá HT8 đổi có chủ đích, cấu hình gộp phải bằng của base.
  local t b bo; t=$(mktemp -d)
  git -C "$ROOT" show "$BASE:db/docker-compose.yml" > "$t/base.yml" 2>/dev/null || { fail "không đọc được compose ở $BASE"; rm -rf "$t"; return; }
  bo='del(.services.db.ports[]?.host_ip, .services.db.environment.SHARED_BUFFERS, .services.db.environment.WORK_MEM,
          .services.db.environment.MAINTENANCE_WORK_MEM, .services.db.environment.EXTRA_CONF, .services.db.shm_size)'
  if [ "$(jq -S "$bo" <<<"$js")" = "$(cau_hinh "$t/base.yml" | jq -S "$bo")" ]; then
    pass "compose khớp $BASE ngoài cổng, tham số, shm"
  else
    fail "compose lệch $BASE ngoài cổng, tham số, shm"; diff <(cau_hinh "$t/base.yml" | jq -S "$bo") <(jq -S "$bo" <<<"$js") | head -20
  fi
  rm -rf "$t"
}

run_mutation() {
  local T; T=$(mktemp -d); trap 'rm -rf "$T"' RETURN
  cp "$COMPOSE" "$T/ok.yml"
  sed 's/"127.0.0.1:5433:5432"/"5433:5432"/' "$COMPOSE" > "$T/cong-tran.yml"
  sed 's/"127.0.0.1:5433:5432"/"0.0.0.0:5433:5432"/' "$COMPOSE" > "$T/cong-0000.yml"
  sed 's/^      - "127.0.0.1:5433:5432"/      - "127.0.0.1:5433:5432"\n      - "5434:5432"/' "$COMPOSE" > "$T/cong-thu-hai.yml"
  grep -v '^      SHARED_BUFFERS:' "$COMPOSE" > "$T/bo-shared-buffers.yml"
  grep -v -E '^      (SHARED_BUFFERS|WORK_MEM|MAINTENANCE_WORK_MEM|EXTRA_CONF):' "$COMPOSE" \
    | sed 's/^    shm_size: 1gb/    shm_size: 1gb\n    command: ["-c", "shared_buffers=8GB"]/' > "$T/command-c.yml"
  grep -v '^    shm_size:' "$COMPOSE" > "$T/bo-shm.yml"
  local m
  for m in cong-tran cong-0000 cong-thu-hai bo-shared-buffers command-c bo-shm; do
    cmp -s "$T/ok.yml" "$T/$m.yml" && fail "đột biến $m không đổi tệp — khuôn sửa không khớp compose"
  done
  expect "bản lành" 0 "" check_static "$T/ok.yml"
  expect "đột biến cong-tran" do "FAIL cổng db 5433 host_ip=(trống)" check_static "$T/cong-tran.yml"
  expect "đột biến cong-0000" do "FAIL cổng db 5433 host_ip=0.0.0.0" check_static "$T/cong-0000.yml"
  expect "đột biến cong-thu-hai" do "FAIL cổng db 5434 host_ip=(trống)" check_static "$T/cong-thu-hai.yml"
  expect "đột biến bo-shared-buffers" do "FAIL SHARED_BUFFERS=(vắng)" check_static "$T/bo-shared-buffers.yml"
  expect "đột biến command-c (biến)" do "FAIL SHARED_BUFFERS=(vắng)" check_static "$T/command-c.yml"
  expect "đột biến command-c (lệnh)" do "FAIL compose có command: — ảnh kartoza không nhận -c" check_static "$T/command-c.yml"
  expect "đột biến bo-shm" do "FAIL shm_size=(vắng)" check_static "$T/bo-shm.yml"
}

ip_lan() { ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null; }
nghe() { lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $9}' | sort -u | tr '\n' ' '; }
noi() { nc -z -G 2 -w 2 "$1" "$2" >/dev/null 2>&1; }          # $1 host · $2 cổng
noi6() { nc -6 -z -G 2 -w 2 ::1 "$1" >/dev/null 2>&1; }
noi_ten_localhost() { # client Node của máy (cùng bản launchd dùng) nối bằng tên localhost
  (cd "$ROOT/pipeline" && node -e 'const s=require("net").connect({host:"localhost",port:+process.argv[1]});s.on("connect",()=>{s.end();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),3000)' "$1")
}

run_cong() {
  local lan; lan=$(ip_lan); [ -n "$lan" ] || { echo "check-db-noi-bo cong: máy không có IP LAN (en0/en1) — không đo được, không xanh giả"; exit 2; }
  local a=ht8-cong-a b=ht8-cong-b
  trap 'docker rm -f ht8-cong-a ht8-cong-b >/dev/null 2>&1' RETURN
  docker rm -f $a $b >/dev/null 2>&1
  docker run -d --rm --name $a -p 127.0.0.1:55498:5432 --entrypoint sh $IMG -c 'while true; do echo ok | nc -l -p 5432; done' >/dev/null || { fail "không dựng được $a"; return; }
  docker run -d --rm --name $b -p 55499:5432 --entrypoint sh $IMG -c 'while true; do echo ok | nc -l -p 5432; done' >/dev/null || { fail "không dựng được $b"; return; }
  local i; for i in $(seq 1 20); do [ -n "$(nghe 55498)" ] && [ -n "$(nghe 55499)" ] && break; sleep 1; done
  local la lb; la=$(nghe 55498); lb=$(nghe 55499)
  [ "$la" = "127.0.0.1:55498 " ] && pass "Mac nghe 127.0.0.1:55498 (bản 127.0.0.1)" || fail "bản 127.0.0.1: Mac nghe «$la»"
  noi 127.0.0.1 55498 && pass "nối 127.0.0.1:55498 được" || fail "nối 127.0.0.1:55498 không được"
  noi_ten_localhost 55498 && pass "client Node nối localhost:55498 được" || fail "client Node nối localhost:55498 không được"
  noi "$lan" 55498 && fail "nối $lan:55498 ĐƯỢC — LAN vẫn mở" || pass "nối $lan:55498 bị từ chối"
  noi6 55498 && echo "GHI ::1:55498 được" || echo "GHI ::1:55498 từ chối"
  [ "$lb" = "*:55499 " ] && pass "Mac nghe *:55499 (đối chứng trần)" || fail "đối chứng trần: Mac nghe «$lb»"
  if noi "$lan" 55499; then pass "nối $lan:55499 được (đối chứng trần)"; else fail "thước không phân biệt — đối chứng trần cũng bị từ chối (đối chứng chết)"; fi
  noi_ten_localhost 55499 && pass "client Node nối localhost:55499 được (đối chứng trần)" || fail "đối chứng trần: localhost:55499 không được"
  noi6 55499 && echo "GHI ::1:55499 được" || echo "GHI ::1:55499 từ chối"
  docker rm -f $a $b >/dev/null 2>&1
  [ "$(docker ps -aq --filter name=ht8-cong- | wc -l | tr -d ' ')" = 0 ] && pass "không sót container ht8-cong-*" || fail "sót container ht8-cong-*"
}

# Bên nối DB ngoài loopback. $1 = gốc cây cần soát (mặc định kho); $2 = 1 khi cũng soát plist launchd của máy.
KHUON_NGOAI='(host\.docker\.internal|0\.0\.0\.0|192\.168\.[0-9.]+|10\.[0-9]+\.[0-9.]+|172\.(1[6-9]|2[0-9]|3[01])\.[0-9.]+):5433|--network[= ]host'
check_soat() {
  local goc="${1:-$ROOT}" plist="${2:-1}" hit
  # Dạng `:(exclude)…`, không `:!_…` — git đọc `_` sau `:!` là phép thuật pathspec và thoát 128 (kết quả rỗng = xanh giả).
  local rc
  hit=$(git -C "$goc" grep -n -I -E "$KHUON_NGOAI" -- . ':(exclude,glob)_acceptance/**/*.md' ':(exclude,glob)_acceptance/**/*.jsonl' \
        ':(exclude,glob)_acceptance/**/*.html' ':(exclude,glob)_acceptance/**/evals.yaml' ':(exclude,glob)docs/research/**' ':(exclude,glob)docs/superpowers/**' \
        ':(exclude)scripts/check-db-noi-bo.sh' ':(exclude,glob)**/*.test.*' 2>"${TMPDIR:-/tmp}/ht8-soat.err"); rc=$?
  if [ $rc -gt 1 ]; then fail "git grep lỗi (mã $rc): $(head -1 "${TMPDIR:-/tmp}/ht8-soat.err")"; return; fi
  if [ -n "$hit" ]; then
    while IFS= read -r l; do fail "bên nối ngoài loopback: ${l%%:*}"; done <<<"$hit"
  else pass "0 chỗ trong kho nối 5433 ngoài loopback, 0 --network host"; fi
  if [ "$plist" = 1 ]; then
    hit=$(grep -l -E "$KHUON_NGOAI" "$HOME"/Library/LaunchAgents/*.plist 2>/dev/null)
    [ -z "$hit" ] && pass "0 plist launchd nối 5433 ngoài loopback" || fail "plist nối ngoài loopback: $hit"
  fi
}
run_soat() {
  check_soat "$ROOT" 1
  # Đầu ra ghi NGOÀI cây hồ sơ (_acceptance/ là sử liệu chỉ đọc sau Cổng Bằng chứng; làn ghim 26/11 bắt executor ghi đè
  # evidence/soat-ben-noi.txt). SOAT_RA đổi đường ghi; làm mới tệp bằng chứng đã commit là việc có chủ ý, chép tay.
  local ra="${SOAT_RA:-$ROOT/.acceptance-runs/db-chi-nghe-noi-bo-va-chinh-postgres/soat-ben-noi.txt}"
  mkdir -p "$(dirname "$ra")"
  { echo "# Tệp có docker run / docker exec chạm one-invest-db hay mạng container: — sinh bởi check-db-noi-bo.sh soat $(git -C "$ROOT" rev-parse --short HEAD)"
    git -C "$ROOT" grep -l -E 'docker (run|exec)|docker compose .*(up|exec)' -- 'scripts/*' 'db/*' 'pipeline/*.sh' 'pipeline/*.mjs' 'app/scripts/*' \
      | grep -v -x 'db/docker-compose.yml' | while read -r f; do
          # Biến container của tệp: chỉ tính là DB thật khi tệp gán nó bằng one-invest-db (tránh $DB của container tạm).
          local vs; vs=$(grep -o -E '^[[:space:]]*(local )?[A-Z_]+=["'"'"']?one-invest-db' "$f" | sed -E 's/^[[:space:]]*(local )?//; s/=.*//' | paste -sd'|' -)
          if grep -q -E 'docker run[^#]*--netw[o]rk[= ]"?container:' "$f"; then c="docker run --network=container (mạng của one-invest-db)"
          elif grep -q -E "docker exec[^|]*(one-invest-db|\\\$C\\b|DB_CONTAINER${vs:+|\\\$\\{?($vs)\\b})" "$f"; then c="docker exec vào one-invest-db"
          elif grep -q -E 'docker run' "$f"; then c="docker run container riêng"
          else c="docker compose / khác"; fi
          printf '%s\t%s\n' "$f" "$c"
        done; } > "$ra"
  pass "danh sách bên nối docker: $(grep -vc '^#' "$ra") tệp → ${ra#$ROOT/}"
  # Đối chứng: cây tạm chép scripts/, cấy từng dạng.
  local T; T=$(mktemp -d); trap 'rm -rf "$T"' RETURN
  local d dang
  for dang in 'PGHOSTADDR=host.docker.internal:5433' 'PGHOSTADDR=172.21.0.1:5433' 'docker run --network host pg'; do
    d="$T/$(echo "$dang" | tr -c 'a-z0-9' '_' | cut -c1-30)"; mkdir -p "$d/scripts"
    git -C "$d" init -q && cp "$ROOT/scripts/db-sao-luu.sh" "$d/scripts/" && echo "$dang" >> "$d/scripts/db-sao-luu.sh" \
      && git -C "$d" add -A >/dev/null
    expect "đối chứng cấy «${dang:0:40}»" do "FAIL bên nối ngoài loopback: scripts/db-sao-luu.sh" check_soat "$d" 0
  done
}

# Dựng một DB tạm từ một compose (đường tệp) — đổi tên, cổng, volume; giữ nguyên ảnh, biến, shm, healthcheck.
# $1 compose · $2 tên (ht8-…) · $3 cổng Mac · $4 host_ip ("" = trần) · $5 volume · $6 shm ghi đè (tuỳ chọn)
dung_tam() {
  local js out="$TMPD/$2.json"
  js=$(cau_hinh "$1") || { fail "không gộp được $1"; return 1; }
  jq --arg n "$2" --arg p "$3" --arg ip "$4" --arg v "$5" --arg shm "${6:-}" '
      .name = $n | .services.db.container_name = $n | del(.services.db.restart)
    | .services.db.ports = [{target: 5432, published: $p, protocol: "tcp"} + (if $ip == "" then {} else {host_ip: $ip} end)]
    | .volumes = {pgdata: {name: $v}}
    | if $shm != "" then .services.db.shm_size = $shm else . end' <<<"$js" > "$out"
  docker compose -p "$2" -f "$out" up -d --force-recreate --wait --wait-timeout 240 >/dev/null 2>"$TMPD/$2.err" \
    || { fail "không dựng được $2: $(tail -2 "$TMPD/$2.err")"; return 1; }
  # compose base không có healthcheck → --wait trả về lúc ảnh kartoza còn khởi tạo rồi khởi động lại Postgres (đo 25/11:
  # «the database system is starting up»). Chờ ba lần select 1 liên tiếp, cách 2 giây, tối đa 240 giây.
  local i ok=0
  for i in $(seq 1 120); do
    if [ "$(psql_c "$2" 'select 1')" = 1 ]; then ok=$((ok + 1)); [ $ok -ge 3 ] && return 0; else ok=0; fi
    sleep 2
  done
  fail "không dựng được $2: Postgres chưa sẵn sàng sau 240 giây"; return 1
}
bo_tam() { docker compose -p "$1" -f "$TMPD/$1.json" down >/dev/null 2>&1; docker rm -f "$1" >/dev/null 2>&1; }
psql_c() { docker exec -e PGPASSWORD=oneinvest -e "PGOPTIONS=-c default_transaction_read_only=${3:-on}" "$1" psql -h localhost -U oneinvest -d oneinvest -Atc "$2" 2>&1; }
show_ts() { local c=$1; echo "shared_buffers=$(psql_c $c 'show shared_buffers') work_mem=$(psql_c $c 'show work_mem') maintenance_work_mem=$(psql_c $c 'show maintenance_work_mem') effective_cache_size=$(psql_c $c 'show effective_cache_size') shm=$(docker exec $c df -h /dev/shm | awk 'NR==2{print $2}')"; }
base_compose() { git -C "$ROOT" show "$BASE:db/docker-compose.yml" > "$TMPD/base.yml" && echo "$TMPD/base.yml"; }
# $1 tiền tố của chế độ (ts | live | do): chỉ dọn container/volume của chính chế độ ấy — ba chế độ chạy song song được
# (lượt chấm chạy E4, E5, E8 cùng lúc; bản cũ dọn mọi ht8-* và giết container của chế độ khác).
don_tam() { local k=$1 p; for p in $(docker ps -a --format '{{.Names}}' | grep -E "^ht8-$k(-|\$)"); do docker rm -f "$p" >/dev/null 2>&1; done
            docker volume ls -q | grep -E "^onehub_ht8_$k(_|\$)" | xargs -r docker volume rm -f >/dev/null 2>&1; rm -rf "$TMPD"; }

run_tham_so() {
  TMPD=$(mktemp -d); trap "don_tam ts" RETURN
  local b; b=$(base_compose) || { fail "không đọc được compose ở $BASE"; return; }
  dung_tam "$COMPOSE" ht8-ts-cay 55434 127.0.0.1 onehub_ht8_ts_cay || return
  local s; s=$(show_ts ht8-ts-cay); echo "cây: $s"
  [ "$s" = "shared_buffers=8GB work_mem=64MB maintenance_work_mem=1GB effective_cache_size=20GB shm=1.0G" ] \
    && pass "compose cây: shared_buffers=8GB, work_mem=64MB, maintenance_work_mem=1GB, effective_cache_size=20GB, /dev/shm 1.0G" \
    || fail "compose cây ra «$s»"
  bo_tam ht8-ts-cay
  dung_tam "$b" ht8-ts-base 55434 127.0.0.1 onehub_ht8_ts_base || return
  local s2; s2=$(show_ts ht8-ts-base); echo "base: $s2"
  grep -q 'shared_buffers=256MB work_mem=16MB maintenance_work_mem=128MB .* shm=64M' <<<"$s2" \
    && pass "compose base $BASE: shared_buffers=256MB, work_mem=16MB, maintenance_work_mem=128MB, /dev/shm 64M" || fail "compose base ra «$s2»"
  [ "$s" != "$s2" ] || fail "tham số không đến từ compose — cây và base ra giống nhau"
  bo_tam ht8-ts-base
  # Đường áp trên CÙNG volume: base → cây → restart → base (lùi).
  local V=onehub_ht8_ts_apdung vid
  dung_tam "$b" ht8-ts-ap 55434 127.0.0.1 $V || return
  psql_c ht8-ts-ap "create table ht8_moc(x int); insert into ht8_moc values (1)" off >/dev/null
  vid=$(docker inspect -f '{{range .Mounts}}{{.Name}}{{end}}' ht8-ts-ap)
  dung_tam "$COMPOSE" ht8-ts-ap 55434 127.0.0.1 $V || return
  [ "$(docker inspect -f '{{range .Mounts}}{{.Name}}{{end}}' ht8-ts-ap)" = "$vid" ] || fail "đường áp: volume đổi giữa các bước"
  s=$(psql_c ht8-ts-ap 'show shared_buffers'); local m; m=$(psql_c ht8-ts-ap 'select count(*) from ht8_moc')
  [ "$s" = 8GB ] && [ "$m" = 1 ] && pass "đường áp base→cây: shared_buffers=8GB, dòng mốc còn 1" || fail "đường áp base→cây: shared_buffers=$s, dòng mốc=$m"
  docker restart ht8-ts-ap >/dev/null; local i; for i in $(seq 1 60); do psql_c ht8-ts-ap 'select 1' >/dev/null 2>&1 && [ "$(psql_c ht8-ts-ap 'select 1')" = 1 ] && break; sleep 2; done
  s=$(psql_c ht8-ts-ap 'show shared_buffers'); [ "$s" = 8GB ] && pass "docker restart giữ shared_buffers=8GB" || fail "docker restart ra shared_buffers=$s"
  dung_tam "$b" ht8-ts-ap 55434 127.0.0.1 $V || return
  s=$(psql_c ht8-ts-ap 'show shared_buffers'); m=$(psql_c ht8-ts-ap 'select count(*) from ht8_moc')
  [ "$s" = 256MB ] && [ "$m" = 1 ] && pass "đường lùi cây→base: shared_buffers=256MB, dòng mốc còn 1" || fail "đường lùi: shared_buffers=$s, dòng mốc=$m"
  bo_tam ht8-ts-ap; don_tam ts; TMPD=$(mktemp -d)
  [ "$(docker ps -aq --filter name=ht8-ts- | wc -l | tr -d ' ')" = 0 ] && pass "không sót container ht8-ts-*" || fail "sót container ht8-ts-*"
}

# Bộ đọc live: $1 container · $2 cổng Mac. So với compose của CÂY (giá trị đích), không với compose của container.
live_doc() {
  local c=$1 p=$2 lan l s; lan=$(ip_lan)
  l=$(nghe "$p")
  if [ "$l" = "127.0.0.1:$p " ]; then pass "Mac chỉ nghe 127.0.0.1:$p"; elif grep -q '\*:' <<<"$l"; then fail "$p nghe *"; else fail "$p nghe «${l:-(không)}»"; fi
  if [ -n "$lan" ]; then noi "$lan" "$p" && fail "nối $lan:$p ĐƯỢC — LAN vẫn mở" || pass "nối $lan:$p bị từ chối"; else fail "không có IP LAN để thử"; fi
  # pg đọc PGUSER/PGPASSWORD/PGDATABASE từ môi trường — không viết URL có mật khẩu (git-secrets chặn dạng user:pass@).
  if (cd "$ROOT/pipeline" && PGUSER=oneinvest PGPASSWORD=oneinvest PGDATABASE=oneinvest node -e 'const {Client}=require("pg");const c=new Client({host:"localhost",port:+process.argv[1],connectionTimeoutMillis:5000});c.connect().then(()=>c.query("select 1")).then(()=>c.end()).then(()=>process.exit(0),()=>process.exit(1))' "$p"); then
    pass "client pg của pipeline nối localhost:$p được"; else fail "client pg của pipeline nối localhost:$p không được"; fi
  local js; js=$(cau_hinh "$COMPOSE")
  local k v w
  for k in shared_buffers work_mem maintenance_work_mem; do
    w=$(jq -r --arg k "$(tr a-z A-Z <<<"$k")" '.services.db.environment[$k] // "?"' <<<"$js")
    v=$(psql_c "$c" "show $k")
    [ "$v" = "$w" ] && pass "$k=$v" || fail "$k=$v (compose $w)"
  done
  w=$(jq -r '.services.db.environment.EXTRA_CONF // ""' <<<"$js" | sed -nE 's/.*effective_cache_size *= *([0-9A-Za-z]+).*/\1/p')
  v=$(psql_c "$c" "show effective_cache_size"); [ "$v" = "$w" ] && pass "effective_cache_size=$v" || fail "effective_cache_size=$v (compose $w)"
  v=$(docker exec "$c" df -h /dev/shm 2>/dev/null | awk 'NR==2{print $2}'); [ "$v" = 1.0G ] && pass "/dev/shm $v" || fail "/dev/shm ${v:-?} (compose 1gb)"
}
run_live_ba() {
  TMPD=$(mktemp -d); trap "don_tam live" RETURN
  expect "live one-invest-db (trước áp)" do "FAIL 5433 nghe *" live_doc $DB 5433
  expect "live one-invest-db (trước áp) tham số" do "FAIL shared_buffers=256MB (compose 8GB)" live_doc $DB 5433
  dung_tam "$COMPOSE" ht8-live-cay 55435 127.0.0.1 onehub_ht8_live_cay || return
  expect "live cây" 0 "" live_doc ht8-live-cay 55435
  local b; b=$(base_compose)
  dung_tam "$b" ht8-live-base 55436 "" onehub_ht8_live_base || return
  expect "live base — cổng" do "FAIL 55436 nghe *" live_doc ht8-live-base 55436
  expect "live base — tham số" do "FAIL shared_buffers=256MB (compose 8GB)" live_doc ht8-live-base 55436
}

run_do() {
  TMPD=$(mktemp -d); trap "don_tam do" RETURN
  local V=onehub_ht8_do b; b=$(base_compose)
  dung_tam "$b" ht8-do 55437 127.0.0.1 $V || return
  local t n0 n1
  # Hàm mà cột sinh / CHECK của hai bảng gọi (vd assertion_value_key của 117) phải có trước khi nạp DDL bảng.
  psql_c $DB "select string_agg(distinct pg_get_functiondef(p.oid), E';\n') || ';' from pg_depend d join pg_proc p
      on d.refclassid = 'pg_proc'::regclass and d.refobjid = p.oid
    where (d.classid = 'pg_attrdef'::regclass and d.objid in (select oid from pg_attrdef where adrelid in ('public.field_assertions'::regclass, 'public.sale_offer_records'::regclass)))
       or (d.classid = 'pg_constraint'::regclass and d.objid in (select oid from pg_constraint where conrelid in ('public.field_assertions'::regclass, 'public.sale_offer_records'::regclass)))" \
    > "$TMPD/ham.sql"
  if [ -s "$TMPD/ham.sql" ] && [ "$(cat "$TMPD/ham.sql")" != ";" ]; then
    docker exec -i -e PGPASSWORD=oneinvest ht8-do psql -h localhost -U oneinvest -d oneinvest -q -v ON_ERROR_STOP=1 \
      < "$TMPD/ham.sql" >/dev/null 2>"$TMPD/ham.err" || { fail "chép hàm phụ thuộc lỗi: $(tail -2 "$TMPD/ham.err")"; return; }
  fi
  for t in field_assertions sale_offer_records; do
    docker exec -e PGPASSWORD=oneinvest -e "PGOPTIONS=-c default_transaction_read_only=on" $DB \
      pg_dump -h localhost -U oneinvest -d oneinvest --no-owner --no-acl --section=pre-data --section=data -t "public.$t" \
      | docker exec -i -e PGPASSWORD=oneinvest ht8-do psql -h localhost -U oneinvest -d oneinvest -q -v ON_ERROR_STOP=1 >/dev/null 2>"$TMPD/nap-$t.err" \
      || { fail "chép $t lỗi: $(tail -2 "$TMPD/nap-$t.err")"; return; }
    n0=$(psql_c $DB "select count(*) from public.$t"); n1=$(psql_c ht8-do "select count(*) from public.$t")
    echo "dòng nguồn: $t $n1/$n0"
    [ $((n1 * 10)) -ge $((n0 * 9)) ] && pass "$t ≥ 90% nguồn" || fail "dữ liệu đo thiếu: $t $n1/$n0"
  done
  psql_c ht8-do "vacuum analyze field_assertions; vacuum analyze sale_offer_records" off >/dev/null
  local Q1="select field, count(*), count(distinct subject_key) from field_assertions group by field"
  local Q3="create index ht8_do_idx on field_assertions (subject_key, field, observed_at); drop index ht8_do_idx"
  local Q2="select count(*), sum(length(fa.value)) from field_assertions fa join sale_offer_records s on s.offer_id = split_part(fa.subject_key, ':', 2)"
  # Câu ghi (Q3): in tổng ms, hoặc "LOI <dòng lỗi>" khi psql thoát khác 0, có dòng ERROR, hay không ra dòng Time.
  chay_ghi() {
    local out rc; out=$(docker exec -e PGPASSWORD=oneinvest ht8-do psql -h localhost -U oneinvest -d oneinvest -At \
      -v ON_ERROR_STOP=1 -c '\timing on' -c "$1" 2>&1); rc=$?
    if [ $rc -ne 0 ] || grep -q -E '^(psql:.*)?ERROR' <<<"$out" || ! grep -q '^Time: ' <<<"$out"; then
      echo "LOI $(grep -m1 -E 'ERROR|FATAL|error' <<<"$out" | head -c 200)"; return; fi
    sed -nE 's/^Time: ([0-9.]+) ms.*/\1/p' <<<"$out" | awk '{s+=$1} END{print s}'
  }
  # Đối chứng dương: câu ghi lỗi chắc chắn phải ra LOI — không thì phép «mọi truy vấn chạy xong» không phân biệt gì với Q3.
  case "$(chay_ghi "create index ht8_do_hong on field_assertions (ht8_khong_co_cot)")" in
    LOI*) pass "đối chứng câu ghi lỗi bị bắt (LOI)";; *) fail "đối chứng câu ghi lỗi KHÔNG bị bắt — thước Q3 chết";; esac
  do_bo() { # $1 nhãn → in "<nhãn> <q> <ms> <workers>" ba lần mỗi truy vấn
    local q i ms w
    for q in Q1 Q2 Q3; do for i in 1 2 3; do
      if [ $q = Q3 ]; then
        ms=$(chay_ghi "$Q3"); case "$ms" in LOI*) echo "LOI $1 $q ${ms#LOI }"; continue;; esac
        w=0
      else
        local js; js=$(psql_c ht8-do "explain (analyze, format json) ${!q}" off)
        grep -q '^\[' <<<"$js" || { echo "LOI $1 $q $(head -c 200 <<<"$js")"; continue; }
        ms=$(jq '.[0]["Execution Time"]' <<<"$js"); w=$(jq '[.. | objects | .["Workers Launched"]? // empty] | max // 0' <<<"$js")
      fi
      echo "$1 $q $ms $w"
    done; done
  }
  do_bo truoc > "$TMPD/truoc.txt"
  dung_tam "$COMPOSE" ht8-do 55437 127.0.0.1 $V || return
  psql_c ht8-do "select 1" >/dev/null
  do_bo sau > "$TMPD/sau.txt"
  grep '^LOI' "$TMPD/truoc.txt" "$TMPD/sau.txt" | while read -r l; do echo "FAIL truy vấn lỗi: $l"; done
  grep -q '^LOI' "$TMPD/truoc.txt" "$TMPD/sau.txt" && FAIL=1 || pass "mọi truy vấn chạy xong ở cả hai bộ"
  echo "| truy vấn | trung vị trước (ms) | trung vị sau (ms) | Workers Launched (sau) |"
  echo "|---|---|---|---|"
  local q med; med() { sort -n | awk '{a[NR]=$1} END{print a[int((NR+1)/2)]}'; }
  for q in Q1 Q2 Q3; do
    echo "| $q | $(awk -v q=$q '$2==q{print $3}' "$TMPD/truoc.txt" | med) | $(awk -v q=$q '$2==q{print $3}' "$TMPD/sau.txt" | med) | $(awk -v q=$q '$2==q{print $4}' "$TMPD/sau.txt" | sort -n | tail -1) |"
  done
  awk '$4>0' "$TMPD/sau.txt" | grep -q . && pass "ít nhất một truy vấn Workers Launched > 0" || fail "không truy vấn nào chạy song song (Workers Launched = 0)"
  # Đối chứng shm: tham số cây, /dev/shm 64 MB, ép song song, chạy Q2.
  dung_tam "$COMPOSE" ht8-do 55437 127.0.0.1 $V 67108864 || return
  local e; e=$(docker exec -e PGPASSWORD=oneinvest ht8-do psql -h localhost -U oneinvest -d oneinvest -At \
    -c "set max_parallel_workers_per_gather=8; set parallel_setup_cost=0; set parallel_tuple_cost=0; set work_mem='1GB'; set hash_mem_multiplier=4" -c "$Q2" 2>&1)
  if grep -q 'could not resize shared memory segment' <<<"$e"; then pass "đối chứng shm đỏ (could not resize shared memory segment)"
  else echo "ĐỐI CHỨNG SHM CHẾT (không tái hiện được lỗi vùng nhớ chung với /dev/shm 64 MB)"; fi
  bo_tam ht8-do
}

run_cu_khong_gay() {
  local m
  for m in static mutation diff; do
    bash "$ROOT/scripts/check-db-autostart.sh" $m > "$TMPD/au7-$m.txt" 2>&1 && pass "check-db-autostart.sh $m xanh" || { fail "check-db-autostart.sh $m đỏ"; tail -5 "$TMPD/au7-$m.txt"; }
  done
  grep -q 'PASS đột biến cong-5434 đỏ — FAIL compose lệch commit trước vòng' "$TMPD/au7-mutation.txt" && pass "đột biến cong-5434 vẫn đỏ" || fail "đột biến cong-5434 không còn đỏ"
  for m in static mutation; do
    bash "$ROOT/scripts/db-volume-check.sh" $m > "$TMPD/vol-$m.txt" 2>&1 && pass "db-volume-check.sh $m xanh" || { fail "db-volume-check.sh $m đỏ"; tail -5 "$TMPD/vol-$m.txt"; }
  done
  # Compose tập dượt: chép đúng khuôn sed của db-volume-check.sh (đọc từ tệp, không chép tay) rồi đọc cổng ở tệp sinh ra.
  local kh; kh=$(grep -o -E '"s/[^"]*TD_PORT:5432/"' "$ROOT/scripts/db-volume-check.sh" | head -1 | tr -d '"' | sed 's/\$TD_PORT/55433/; s/\\"/"/g')
  [ -n "$kh" ] || { fail "không tìm thấy khuôn sed cổng trong db-volume-check.sh"; return; }
  tap_duot_cong() { sed -e "$1" "$COMPOSE" > "$TMPD/td.yml"; cau_hinh "$TMPD/td.yml" | jq -r '.services.db.ports[].published' | tr '\n' ' '; }
  local c; c=$(tap_duot_cong "$kh")
  [ "$c" = "55433 " ] && pass "compose tập dượt sinh từ compose cây: published=55433, không 5433" || { echo "FAIL tập dượt còn 5433 (published=$c)"; FAIL=1; }
  chieu_do() { local c; c=$(tap_duot_cong 's/"5433:5432"/"55433:5432"/'); grep -qw 5433 <<<"$c" && { echo "FAIL tập dượt còn 5433"; FAIL=1; }; }
  expect "khuôn sed cũ trên compose cây" do "FAIL tập dượt còn 5433" chieu_do
}

case "$MODE" in
  static) check_static "$COMPOSE" ;;
  mutation) run_mutation ;;
  cong) run_cong ;;
  soat) run_soat ;;
  tham-so) run_tham_so ;;
  do) run_do ;;
  cu-khong-gay) TMPD=$(mktemp -d); run_cu_khong_gay; rm -rf "$TMPD" ;;
  live) live_doc $DB 5433 ;;
  live-ba) run_live_ba ;;
  *) echo "dùng: $0 static|mutation|cong|soat|tham-so|do|cu-khong-gay|live|live-ba" >&2; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "check-db-noi-bo $MODE: ĐẠT" || echo "check-db-noi-bo $MODE: KHÔNG ĐẠT"
exit $FAIL
