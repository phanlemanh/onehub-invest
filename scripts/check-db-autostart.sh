#!/bin/bash
# check-db-autostart.sh — kiểm DB local tự chạy lại sau khi Docker hoặc máy khởi động lại (audit L7).
# Hồ sơ: _acceptance/db-tu-khoi-dong/.
#
#   static         cấu hình gộp (`docker compose config`) của db/docker-compose.yml có
#                  services.db.restart ∈ {unless-stopped, always}. Không cần daemon.
#   diff           cấu hình gộp của cây bỏ khoá restart == của commit trước vòng (AU7_BASE, mặc định
#                  f3cff1f) — thêm restart không được kéo theo đổi cổng, ảnh, volume, biến, healthcheck.
#   mutation       bốn bản compose hỏng (bỏ restart, "no", on-failure, đổi cổng) phải đỏ với thông điệp
#                  ghim; bản lành cùng thư mục phải xanh.
#   restart        daemon Docker CÁCH LY (container docker:28-dind tạm): dựng service db từ compose của
#                  cây (override chỉ thay ảnh thành alpine, bỏ cổng/volume/healthcheck — thứ được đo là
#                  restart policy của file), khởi động lại dockerd bên trong, đòi container tự về running;
#                  cùng daemon, bản bỏ restart phải ra exited. Không chạm one-invest-db: StartedAt của nó
#                  phải không đổi. Tự dọn container dind (trap EXIT/INT/TERM).
#   cleanup        lượt `restart` thoát lỗi giữa chừng (exit trong hàm, và return rồi mới exit) và lượt bị
#                  SIGTERM vẫn không để sót au7-dind-*.
#   live           CHỈ ĐỌC máy này: one-invest-db đang chạy với policy unless-stopped|always; LaunchAgent
#                  homebrew.mxcl.colima có RunAtLoad=true và đang nạp trong launchctl.
#   live-selftest  bộ đọc của live chạy trên bản chép plist + JSON inspect thật đã làm hỏng phải đỏ.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SELF="$ROOT/scripts/$(basename "$0")"
MODE="${1:-}"
COMPOSE="$ROOT/db/docker-compose.yml"
BASE="${AU7_BASE:-f3cff1f}"
DB=one-invest-db
PLIST="$HOME/Library/LaunchAgents/homebrew.mxcl.colima.plist"
DIND_IMG=docker:28-dind
APP_IMG=alpine:3.20
FAIL=0
pass() { echo "PASS $*"; }
fail() { echo "FAIL $*"; FAIL=1; }

# Giá trị restart của service db trong cấu hình gộp; "(vắng)" khi không khai, "(lỗi)" khi compose hỏng.
restart_of() {
  local js
  js=$(docker compose -p au7cmp -f "$1" config --format json 2>/dev/null) || { echo "(lỗi)"; return; }
  jq -r '.services.db.restart // "(vắng)"' <<<"$js"
}

check_static() { # $1 = tệp compose
  local v; v=$(restart_of "$1")
  case "$v" in
    unless-stopped|always) pass "compose db.restart=$v" ;;
    *) fail "compose db.restart=$v (cần unless-stopped|always)" ;;
  esac
}

check_diff() { # $1 = tệp compose
  local t a b; t=$(mktemp -d)
  if ! git -C "$ROOT" show "$BASE:db/docker-compose.yml" > "$t/base.yml" 2>/dev/null; then
    fail "không đọc được db/docker-compose.yml ở $BASE"; rm -rf "$t"; return
  fi
  a=$(docker compose -p au7cmp -f "$1" config --format json 2>/dev/null | jq -S 'del(.services.db.restart)')
  b=$(docker compose -p au7cmp -f "$t/base.yml" config --format json 2>/dev/null | jq -S 'del(.services.db.restart)')
  if [ -z "$a" ] || [ -z "$b" ]; then
    fail "không gộp được cấu hình để so (cây hoặc $BASE)"
  elif [ "$a" = "$b" ]; then
    pass "compose khớp commit trước vòng ($BASE) ngoài khoá restart"
  else
    fail "compose lệch commit trước vòng ($BASE) ngoài khoá restart"
    diff <(echo "$b") <(echo "$a") | head -20
  fi
  rm -rf "$t"
}

check_live() { # $1 = JSON docker inspect, $2 = plist, $3 = 1 khi đọc máy thật (thêm launchctl)
  local pol st ral
  pol=$(jq -r '.[0].HostConfig.RestartPolicy.Name // "(vắng)"' "$1" 2>/dev/null || echo "(lỗi)")
  st=$(jq -r '.[0].State.Status // "(vắng)"' "$1" 2>/dev/null || echo "(lỗi)")
  case "$pol" in
    unless-stopped|always) pass "$DB policy=$pol" ;;
    *) fail "$DB policy=$pol (cần unless-stopped|always)" ;;
  esac
  [ "$st" = running ] && pass "$DB status=running" || fail "$DB status=$st"
  ral=$(plutil -extract RunAtLoad raw -o - "$2" 2>/dev/null || echo "(vắng)")
  [ "$ral" = true ] && pass "colima RunAtLoad=true" || fail "colima RunAtLoad=$ral"
  if [ "${3:-0}" = 1 ]; then
    if launchctl list homebrew.mxcl.colima >/dev/null 2>&1; then
      pass "homebrew.mxcl.colima đang nạp trong launchctl"
    else
      fail "homebrew.mxcl.colima không nạp trong launchctl"
    fi
  fi
}

# Chạy một bộ kiểm trên một fixture, đòi đúng chiều + thông điệp ghim. $1 nhãn, $2 0|đỏ, $3 thông điệp ghim
# (rỗng khi chờ xanh), còn lại: lệnh kiểm.
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

started_at() { docker inspect -f '{{.State.StartedAt}}' "$1" 2>/dev/null; }
valid_ts() { [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2} ]]; }
# Đếm container dind theo tiền tố tên — mỗi lượt có nhãn riêng (AU7_TAG) để hai lượt chạy song song không đếm lẫn nhau.
leftovers() { docker ps -aq --filter "name=au7-dind-$1" | wc -l | tr -d ' '; }

ensure_img() { docker image inspect "$1" >/dev/null 2>&1 || docker pull -q "$1" >/dev/null; }

wait_dockerd() { # $1 = container dind
  local i; for i in $(seq 1 60); do docker exec "$1" docker info >/dev/null 2>&1 && return 0; sleep 1; done
  return 1
}

# DIND_NAME/DIND_TMP là biến toàn cục, không `local`: trap EXIT chạy SAU khi run_restart đã return, lúc
# biến cục bộ đã mất — với `local` mọi đường lỗi dùng `return` sẽ để sót container dind privileged.
DIND_NAME=""; DIND_TMP=""
dind_cleanup() {
  [ -n "$DIND_NAME" ] && docker rm -fv "$DIND_NAME" >/dev/null 2>&1
  [ -n "$DIND_TMP" ] && rm -rf "$DIND_TMP"
  DIND_NAME=""; DIND_TMP=""
}

run_restart() {
  local name="au7-dind-${AU7_TAG:-r$$}-$$" t keep ctrl h0 h1 d0 d1 i
  t=$(mktemp -d); DIND_TMP="$t"
  trap dind_cleanup EXIT
  trap 'exit 143' TERM
  trap 'exit 130' INT
  h0=$(started_at "$DB")
  if valid_ts "$h0"; then pass "$DB StartedAt đọc được trước lượt: $h0"; else fail "$DB StartedAt không đọc được (\"$h0\")"; fi
  ensure_img "$DIND_IMG" || { fail "không có ảnh $DIND_IMG"; return; }
  ensure_img "$APP_IMG" || { fail "không có ảnh $APP_IMG"; return; }
  DIND_NAME="$name"
  docker run -d --privileged --name "$name" -e DOCKER_TLS_CERTDIR= "$DIND_IMG" >/dev/null || { fail "không dựng được $name"; return; }
  wait_dockerd "$name" || { fail "dockerd trong $name không lên"; return; }
  # Móc phá-thử cho chế độ cleanup — lượt thật không đặt hai biến này.
  [ "${AU7_FAIL_AFTER:-}" = dind ] && { echo "ép thoát lỗi sau khi dựng $name"; exit 3; }
  [ "${AU7_SLEEP_AFTER:-}" = dind ] && { echo "chờ tín hiệu sau khi dựng $name"; sleep 300 & wait $!; }
  docker save "$APP_IMG" | docker exec -i "$name" docker load -q >/dev/null
  # Bản đối chứng: chính compose của cây, bỏ dòng restart.
  grep -v '^    restart:' "$COMPOSE" > "$t/ctrl.yml"
  cp "$COMPOSE" "$t/keep.yml"
  for p in keep ctrl; do
    cat > "$t/ov-$p.yml" <<EOF
services:
  db:
    container_name: au7-$p
    image: $APP_IMG
    command: ["sleep", "infinity"]
    healthcheck: !reset {}
    ports: !reset []
    volumes: !reset []
EOF
  done
  docker exec "$name" mkdir -p /w
  # Móc phá-thử: đường lỗi dùng `return` (như compose up hỏng) — phải dọn bằng trap EXIT sau khi hàm đã thoát.
  [ "${AU7_FAIL_AFTER:-}" = compose ] && { fail "ép lỗi compose up sau khi dựng $name"; return; }
  for f in keep.yml ctrl.yml ov-keep.yml ov-ctrl.yml; do docker cp "$t/$f" "$name:/w/$f" >/dev/null; done
  for p in keep ctrl; do
    docker exec "$name" docker compose -p "$p" -f "/w/$p.yml" -f "/w/ov-$p.yml" up -d >/dev/null 2>&1 \
      || { fail "compose up ($p) trong daemon cách ly lỗi"; return; }
  done
  keep=$(docker exec "$name" docker inspect -f '{{.HostConfig.RestartPolicy.Name}} {{.State.Status}}' au7-keep)
  ctrl=$(docker exec "$name" docker inspect -f '{{.HostConfig.RestartPolicy.Name}} {{.State.Status}}' au7-ctrl)
  [ "$keep" = "unless-stopped running" ] || [ "$keep" = "always running" ] \
    && pass "trước khởi động lại (compose của cây): policy=${keep% *}, ${keep#* }" \
    || fail "trước khởi động lại (compose của cây): $keep"
  [ "$ctrl" = "no running" ] && pass "trước khởi động lại (đối chứng bỏ restart): policy=no, running" \
    || fail "trước khởi động lại (đối chứng): $ctrl"
  d0=$(started_at "$name")
  docker restart "$name" >/dev/null || { fail "không khởi động lại được $name"; return; }
  wait_dockerd "$name" || { fail "dockerd trong $name không lên lại"; return; }
  d1=$(started_at "$name")
  if valid_ts "$d0" && valid_ts "$d1" && [ "$d0" != "$d1" ]; then
    pass "đối chứng dương: StartedAt của daemon cách ly đổi ($d0 → $d1) — thước StartedAt phân biệt được"
  else
    fail "đối chứng dương: StartedAt daemon cách ly không đổi hoặc không đọc được ($d0 → $d1)"
  fi
  for i in $(seq 1 20); do
    keep=$(docker exec "$name" docker inspect -f '{{.State.Status}}' au7-keep 2>/dev/null)
    [ "$keep" = running ] && break; sleep 1
  done
  ctrl=$(docker exec "$name" docker inspect -f '{{.State.Status}}' au7-ctrl 2>/dev/null)
  [ "$keep" = running ] && pass "sau khi dockerd cách ly khởi động lại: compose của cây → running, không lệnh tay" \
    || fail "sau khi dockerd cách ly khởi động lại: compose của cây → $keep"
  [ "$ctrl" = exited ] && pass "đối chứng: bỏ restart → exited sau khởi động lại" \
    || fail "đối chứng: bỏ restart → $ctrl — thước không phân biệt được"
  dind_cleanup; trap - EXIT
  [ "$(leftovers "${name#au7-dind-}")" = 0 ] && pass "không còn container $name sau khi dọn" || fail "còn container $name sau khi dọn"
  h1=$(started_at "$DB")
  if valid_ts "$h0" && [ "$h0" = "$h1" ]; then pass "$DB StartedAt không đổi ($h1)"; else fail "$DB StartedAt đổi hoặc không đọc được ($h0 → $h1)"; fi
}

run_cleanup() {
  local h0 h1 out rc pid i n tag="c$$"
  h0=$(started_at "$DB")
  valid_ts "$h0" && pass "$DB StartedAt đọc được trước lượt: $h0" || fail "$DB StartedAt không đọc được (\"$h0\")"
  [ "$(leftovers "$tag-")" = 0 ] || { fail "đã có container au7-dind-$tag-* từ trước — dọn tay rồi chạy lại"; return; }
  out=$(AU7_TAG=$tag AU7_FAIL_AFTER=dind bash "$SELF" restart 2>&1); rc=$?
  if [ $rc != 0 ] && grep -qF "ép thoát lỗi sau khi dựng" <<<"$out"; then
    [ "$(leftovers "$tag-")" = 0 ] && pass "lượt ép thoát lỗi (rc=$rc) — không còn container au7-dind-*" \
      || { fail "lượt ép thoát lỗi để sót container au7-dind-*"; docker ps -aq --filter "name=au7-dind-$tag-" | xargs -r docker rm -fv >/dev/null; }
  else
    fail "lượt ép thoát lỗi không tới điểm ép (rc=$rc)"; echo "$out" | tail -5
  fi
  out=$(AU7_TAG=$tag AU7_FAIL_AFTER=compose bash "$SELF" restart 2>&1); rc=$?
  if [ $rc != 0 ] && grep -qF "ép lỗi compose up sau khi dựng" <<<"$out"; then
    [ "$(leftovers "$tag-")" = 0 ] && pass "lượt lỗi thoát bằng return (rc=$rc) — không còn container au7-dind-*" \
      || { fail "lượt lỗi thoát bằng return để sót container au7-dind-*"; docker ps -aq --filter "name=au7-dind-$tag-" | xargs -r docker rm -fv >/dev/null; }
  else
    fail "lượt lỗi return không tới điểm ép (rc=$rc)"; echo "$out" | tail -5
  fi
  AU7_TAG=$tag AU7_SLEEP_AFTER=dind bash "$SELF" restart >/dev/null 2>&1 & pid=$!
  n=0; for i in $(seq 1 90); do n=$(leftovers "$tag-"); [ "$n" -ge 1 ] && break; sleep 1; done
  if [ "$n" -ge 1 ]; then
    pass "đối chứng dương: thấy $n container au7-dind-* khi lượt đang chạy"
    sleep 2; kill -TERM "$pid"; wait "$pid"; rc=$?
    [ "$(leftovers "$tag-")" = 0 ] && pass "lượt bị SIGTERM (rc=$rc) — không còn container au7-dind-*" \
      || { fail "lượt bị SIGTERM để sót container au7-dind-*"; docker ps -aq --filter "name=au7-dind-$tag-" | xargs -r docker rm -fv >/dev/null; }
  else
    fail "lượt SIGTERM không dựng được daemon cách ly"; kill -TERM "$pid" 2>/dev/null; wait "$pid"
  fi
  h1=$(started_at "$DB")
  if valid_ts "$h0" && [ "$h0" = "$h1" ]; then pass "$DB StartedAt không đổi qua ba lượt ($h1)"; else fail "$DB StartedAt đổi ($h0 → $h1)"; fi
}

case "$MODE" in
  static) check_static "$COMPOSE" ;;
  diff) check_diff "$COMPOSE" ;;
  mutation)
    T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
    cp "$COMPOSE" "$T/ok.yml"
    grep -v '^    restart:' "$COMPOSE" > "$T/bo-dong.yml"
    sed 's/^    restart: .*/    restart: "no"/' "$COMPOSE" > "$T/no.yml"
    sed 's/^    restart: .*/    restart: on-failure/' "$COMPOSE" > "$T/on-failure.yml"
    sed 's/"5433:5432"/"5434:5432"/' "$COMPOSE" > "$T/cong-5434.yml"
    for m in bo-dong no on-failure cong-5434; do
      cmp -s "$T/ok.yml" "$T/$m.yml" && fail "đột biến $m không đổi tệp — sed không khớp compose"
    done
    expect "bản lành (static)" 0 "" check_static "$T/ok.yml"
    expect "bản lành (diff)" 0 "" check_diff "$T/ok.yml"
    expect "đột biến bo-dong" do "FAIL compose db.restart=(vắng)" check_static "$T/bo-dong.yml"
    expect "đột biến no" do "FAIL compose db.restart=no" check_static "$T/no.yml"
    expect "đột biến on-failure" do "FAIL compose db.restart=on-failure" check_static "$T/on-failure.yml"
    expect "đột biến cong-5434" do "FAIL compose lệch commit trước vòng" check_diff "$T/cong-5434.yml"
    ;;
  restart) run_restart ;;
  cleanup) run_cleanup ;;
  live)
    T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
    docker inspect "$DB" > "$T/inspect.json" 2>/dev/null || echo '[]' > "$T/inspect.json"
    check_live "$T/inspect.json" "$PLIST" 1
    ;;
  live-selftest)
    T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
    docker inspect "$DB" > "$T/inspect.json" 2>/dev/null || { fail "không đọc được docker inspect $DB để dựng fixture"; exit 1; }
    cp "$PLIST" "$T/colima.plist" 2>/dev/null || { fail "không chép được $PLIST để dựng fixture"; exit 1; }
    jq '.[0].HostConfig.RestartPolicy.Name="no"' "$T/inspect.json" > "$T/inspect-no.json"
    cp "$T/colima.plist" "$T/colima-off.plist" && plutil -replace RunAtLoad -bool false "$T/colima-off.plist"
    expect "bản chép nguyên vẹn" 0 "" check_live "$T/inspect.json" "$T/colima.plist" 0
    expect "plist RunAtLoad=false" do "FAIL colima RunAtLoad=false" check_live "$T/inspect.json" "$T/colima-off.plist" 0
    expect "inspect RestartPolicy=no" do "FAIL $DB policy=no" check_live "$T/inspect-no.json" "$T/colima.plist" 0
    ;;
  *) echo "dùng: $0 static|diff|mutation|restart|cleanup|live|live-selftest" >&2; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "check-db-autostart $MODE: ĐẠT" || echo "check-db-autostart $MODE: KHÔNG ĐẠT"
exit $FAIL
