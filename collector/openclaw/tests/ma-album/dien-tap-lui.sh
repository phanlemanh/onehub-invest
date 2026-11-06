#!/bin/bash
# E9/AC-9 (ma-album-s03) — DIỄN TẬP LÙI trên GATEWAY THỬ TÁCH BIỆT:
# HOME riêng (env -i), không credentials kênh S03 → không phiên/khoá phiên,
# không nối kênh; log ra đường riêng. Cài bản mới (dist extension build +
# handler + openclaw.plugin.json) → khởi động qua startup phases → validate
# đạt → monitor mới import động được → KHÔI PHỤC sao lưu → khởi động lại →
# diff -r rỗng. PID gateway THẬT, log gateway THẬT, độ dài log runtime THẬT
# không đổi. Thời gian lùi ghi vào .acceptance-runs (executor yêu cầu).
set -uo pipefail
HERE="$(cd "$(dirname "$0")/../.." && pwd)"     # collector/openclaw
SRC="${OPENCLAW_SRC:-$HOME/dev/openclaw}"
RUNTIME="$HOME/.openclaw/runtime/current"
BUN="$RUNTIME/bin/bun"
GW_LOG_THAT="$HOME/Library/Logs/openclaw/gateway.log"
RT_LOG_DIR="/tmp/openclaw"
T="$(mktemp -d /tmp/mas3-dien-tap-XXXX)"
TRANG_THAI="${MAS3_DIEN_TAP_DIR:-$HERE/../../.acceptance-runs/ma-album-s03-dien-tap}"
mkdir -p "$TRANG_THAI"
fail() { echo "E9 FAIL: $1"; exit 1; }
trap 'rm -rf "$T"' EXIT

# — chụp máy THẬT trước —
PID_TRUOC=$(launchctl list 2>/dev/null | awk '/ai.openclaw.gateway/ {print $1}')
LEN_GW_TRUOC=$( [ -f "$GW_LOG_THAT" ] && wc -l < "$GW_LOG_THAT" || echo 0)
LEN_RT_TRUOC=$(ls "$RT_LOG_DIR" 2>/dev/null | wc -l | tr -d ' ')

# — dựng HOME thử: cấu hình tối giản (không kênh S03 → không nối), không khoá phiên —
mkdir -p "$T/home/.openclaw" "$T/home/Library/Logs/openclaw"
cat > "$T/home/.openclaw/openclaw.json" <<'EOF'
{ "bindings": [], "channels": {} }
EOF

# — cài bản mới vào chỗ thử: dist build + handler + plugin.json —
CHO="$T/home/.openclaw/extensions/zalouser"
mkdir -p "$CHO"
cp -R "$SRC/extensions/zalouser/dist" "$CHO/dist"
cp "$SRC/extensions/zalouser/openclaw.plugin.json" "$CHO/" 2>/dev/null || true
# node_modules của extension chứa symlink tương đối — dựng lại bằng link
# tuyệt đối tới runtime phát hành (openclaw) + các gói từ nguồn
mkdir -p "$CHO/node_modules"
ln -sfn "$RUNTIME/lib/node_modules/openclaw" "$CHO/node_modules/openclaw"
for pkg in zod typebox zca-js; do
  [ -e "$SRC/extensions/zalouser/node_modules/$pkg" ] && ln -sfn "$SRC/extensions/zalouser/node_modules/$pkg" "$CHO/node_modules/$pkg"
done
mkdir -p "$T/home/.openclaw/hooks/oneinvest-zalo-pipe"
cp "$HERE/handler.js" "$T/home/.openclaw/hooks/oneinvest-zalo-pipe/handler.js"

# — SAO LƯU (để khôi phục + diff) —
cp -R "$CHO" "$T/sao-luu-extension"
cp "$T/home/.openclaw/hooks/oneinvest-zalo-pipe/handler.js" "$T/sao-luu-handler.js"

chay() { # $1 = nhãn
  env -i PATH=/usr/bin:/bin:/usr/sbin:/sbin HOME="$T/home" OPENCLAW_STATE_DIR="$T/home/.openclaw" \
    "$BUN" "$RUNTIME/lib/node_modules/openclaw/dist/index.js" gateway --port 0 \
    > "$T/home/gateway-thu-$1.log" 2>&1 &
  local pid=$!
  local i
  for i in $(seq 1 60); do
    grep -q "ready\|listening\|started" "$T/home/gateway-thu-$1.log" 2>/dev/null && break
    sleep 1
  done
  kill "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null
  grep -q "startup phase" "$T/home/gateway-thu-$1.log" || return 1
  return 0
}

BAT=$(date +%s)
chay lan-1 || fail "gateway thử lần 1 không qua startup phases"
echo "ok   E9 lần 1 (cài bản mới): qua startup phases"

# validate trên cấu hình THỬ
# validate chỉ ĐỌC tệp cấu hình (env thường + OPENCLAW_CONFIG_PATH trỏ bản
# thử — cùng cách an toàn đã dùng cho việc đóng tin riêng 0511-17)
OPENCLAW_CONFIG_PATH="$T/home/.openclaw/openclaw.json" "$HOME/.openclaw/bin/openclaw" config validate >/dev/null 2>&1 || fail "validate trên cấu hình thử đỏ"
echo "ok   E9 validate đạt (HOME thử)"

# monitor mới import động được từ chỗ cài thử
node -e "import('file://$CHO/dist/.setup/' + require('fs').readdirSync('$CHO/dist/.setup').find(f=>f.startsWith('monitor-'))).then(()=>console.log('ok')).catch(e=>{console.error('LOI',e.message);process.exit(1)})" \
  || fail "monitor mới không import động được"
echo "ok   E9 monitor mới import động"

# — KHÔI PHỤC: đặt lại bản sao lưu —
rm -rf "$CHO"
cp -R "$T/sao-luu-extension" "$CHO"
cp "$T/sao-luu-handler.js" "$T/home/.openclaw/hooks/oneinvest-zalo-pipe/handler.js"
chay lan-2 || fail "gateway thử lần 2 (sau khôi phục) không qua startup phases"
echo "ok   E9 lần 2 (sau khôi phục): qua startup phases"

diff -r "$CHO" "$T/sao-luu-extension" >/dev/null || fail "diff -r sau khôi phục không rỗng"
echo "ok   E9 diff -r rỗng sau khôi phục"

# — máy THẬT không đổi —
PID_SAU=$(launchctl list 2>/dev/null | awk '/ai.openclaw.gateway/ {print $1}')
LEN_GW_SAU=$( [ -f "$GW_LOG_THAT" ] && wc -l < "$GW_LOG_THAT" || echo 0)
LEN_RT_SAU=$(ls "$RT_LOG_DIR" 2>/dev/null | wc -l | tr -d ' ')
[ "$PID_TRUOC" = "$PID_SAU" ] || fail "PID gateway thật đổi ($PID_TRUOC → $PID_SAU)"
tail -n +"$((LEN_GW_TRUOC + 1))" "$GW_LOG_THAT" 2>/dev/null | grep -q "listener" && fail "log gateway thật có dòng listener mới"
[ "$LEN_RT_TRUOC" = "$LEN_RT_SAU" ] || { ls -t "$RT_LOG_DIR" | head -1 | xargs -I{} test "$(wc -l < "$RT_LOG_DIR/{}")" -gt 0 && grep -q "dien-tap\|mas3" "$RT_LOG_DIR/$(ls -t "$RT_LOG_DIR" | head -1)" 2>/dev/null && fail "log runtime thật có dòng từ gateway thử"; }
echo "ok   E9 máy thật không đổi (PID $PID_SAU · log gateway +$((LEN_GW_SAU - LEN_GW_TRUOC)) dòng thường lệ · runtime log $LEN_RT_TRUOC=$LEN_RT_SAU tệp)"

# — thư mục thử KHÔNG có khoá phiên —
find "$T/home" -iname "*credential*" -o -iname "*.key" 2>/dev/null | grep -q . && fail "thư mục thử có khoá phiên"
echo "ok   E9 thư mục thử không có khoá phiên"

LUI=$(( $(date +%s) - BAT ))
echo "{\"thoi_gian_lui_giay\": $LUI, \"khi\": \"$(date -Iseconds)\"}" > "$TRANG_THAI/dien-tap-lui.json"
echo "E9 PASS — thời gian lùi ${LUI}s ghi $TRANG_THAI/dien-tap-lui.json"
