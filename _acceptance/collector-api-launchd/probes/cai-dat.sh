#!/bin/bash
# ZC4 2510-33: chạy scripts/install-collector-api.sh trên BẢN CHÉP gốc kho tạm + HOME giả; launchctl/plutil đầu PATH
# là bản ghi lời gọi (plutil thật được gọi qua đường tuyệt đối để lint). Không launchctl thật, không đụng :9210.
set -uo pipefail
R="${1:?gốc kho}"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
bad=0; ok(){ echo "ok   $*"; }; no(){ echo "FAIL $*"; bad=1; }
mk() { # dựng cây tạm: $1 = tên
  local W="$T/$1"; mkdir -p "$W/scripts" "$W/pipeline/cron" "$W/collector/scripts" "$W/collector/src/api" "$W/collector/src/core" "$W/collector/dist/api" "$W/home/.openclaw/credentials" "$W/bin"
  cp "$R/scripts/install-collector-api.sh" "$W/scripts/"; cp "$R/pipeline/cron/com.oneinvest.collector-api.plist" "$W/pipeline/cron/"
  sed "s|/Users/manhphan/.local/bin/node|$W/bin/node-that|" "$R/collector/scripts/api-launchd.sh" > "$W/collector/scripts/api-launchd.sh"
  printf '#!/bin/bash\nexit 0\n' > "$W/bin/node-that"; chmod +x "$W/bin/node-that"
  echo "src" > "$W/collector/src/api/main.ts"; echo "core" > "$W/collector/src/core/x.ts"; sleep 1
  echo "dist" > "$W/collector/dist/api/main.js"; echo "acc-key" > "$W/home/.openclaw/credentials/oneinvest-agent.key"
  printf '#!/bin/bash\necho "launchctl $*" >> "%s/calls"\nexit 0\n' "$W" > "$W/bin/launchctl"; chmod +x "$W/bin/launchctl"
  echo "$W"
}
run() { local W="$1"; shift; (cd "$W" && HOME="$W/home" PATH="$W/bin:/usr/bin:/bin" bash scripts/install-collector-api.sh "$@" 2>&1); }
# (1) --dry: không ghi gì, in plist đã thế + cặp lệnh
W=$(mk dry); o=$(run "$W" --dry); c=$?
[ $c = 0 ] && ok "(1) --dry thoát 0" || no "(1) --dry thoát $c: $o"
[ ! -e "$W/home/Library/LaunchAgents/com.oneinvest.collector-api.plist" ] && ok "(1) should-NOT-fire: --dry không ghi plist" || no "(1) --dry đã ghi plist"
echo "$o" | grep -q "$W/collector/scripts/api-launchd.sh" && ! echo "$o" | grep -q "__ROOT__" && ok "(1) plist in ra đã thế __ROOT__ bằng gốc kho" || no "(1) plist in ra chưa thế __ROOT__"
[ ! -s "$W/calls" ] && ok "(1) should-NOT-fire: 0 lời gọi launchctl" || no "(1) có lời gọi launchctl: $(cat $W/calls)"
# (2) cài: ghi plist 600, lint sạch, không launchctl, in cặp lệnh
W=$(mk cai); o=$(run "$W"); c=$?; P="$W/home/Library/LaunchAgents/com.oneinvest.collector-api.plist"
[ $c = 0 ] && [ -f "$P" ] && ok "(2) cài thoát 0, plist có" || no "(2) cài thoát $c: $o"
[ "$(stat -f %Lp "$P" 2>/dev/null)" = 600 ] && ok "(2) plist quyền 600" || no "(2) quyền plist $(stat -f %Lp "$P" 2>/dev/null)"
/usr/bin/plutil -lint "$P" >/dev/null 2>&1 && ok "(2) plutil -lint sạch" || no "(2) plutil -lint lỗi"
grep -q "__ROOT__" "$P" && no "(2) còn __ROOT__ trong plist" || ok "(2) không còn __ROOT__"
[ ! -s "$W/calls" ] && ok "(2) should-NOT-fire: script KHÔNG tự bootout/bootstrap" || no "(2) script gọi launchctl: $(cat $W/calls)"
echo "$o" | grep -q "launchctl bootstrap gui/" && ok "(2) in lệnh bootstrap cho bước triển khai" || no "(2) không in lệnh bootstrap"
# (3) chặn trước khi ghi
W=$(mk cu); sleep 1; echo "src2" > "$W/collector/src/api/main.ts"; o=$(run "$W"); c=$?
[ $c != 0 ] && [ ! -e "$W/home/Library/LaunchAgents/com.oneinvest.collector-api.plist" ] && ok "(3a) dist cũ hơn main.ts → chặn, không ghi" || no "(3a) dist cũ không bị chặn (thoát $c)"
W=$(mk khoa); rm "$W/home/.openclaw/credentials/oneinvest-agent.key"; o=$(run "$W"); c=$?
[ $c != 0 ] && ok "(3b) thiếu tệp khoá → chặn" || no "(3b) thiếu khoá không bị chặn"
W=$(mk node); rm "$W/bin/node-that"; o=$(run "$W"); c=$?
[ $c != 0 ] && ok "(3c) node tuyệt đối không có → chặn" || no "(3c) thiếu node không bị chặn"
W=$(mk nodist); rm "$W/collector/dist/api/main.js"; o=$(run "$W"); c=$?
[ $c != 0 ] && ok "(3d) thiếu dist → chặn" || no "(3d) thiếu dist không bị chặn"
# (4) ghi nhận (không chấm đỏ): tệp nguồn KHÁC main.ts mới hơn dist
W=$(mk khac); sleep 1; echo "core2" > "$W/collector/src/core/x.ts"; o=$(run "$W"); c=$?
[ $c != 0 ] && echo "ghi nhận: src/core mới hơn dist → BỊ chặn" || echo "ghi nhận: src/core mới hơn dist → KHÔNG bị chặn (chỉ so main.ts)"
[ "$bad" = 0 ] && echo "CAI-DAT PASS" || echo "CAI-DAT FAIL"; exit "$bad"
