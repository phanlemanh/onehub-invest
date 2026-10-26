#!/bin/bash
# 2610-5: install-collector-api.sh tạo pipeline/logs; sed lỗi không để plist rỗng đè bản cũ. Bản chép tạm + HOME giả, launchctl giả.
set -uo pipefail
R="${1:?gốc kho}"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT; bad=0
mk(){ local W="$1"; mkdir -p "$W/scripts" "$W/pipeline/cron" "$W/collector/scripts" "$W/collector/src/api" "$W/collector/dist/api" "$W/home/.openclaw/credentials" "$W/bin"
  cp "$R/scripts/install-collector-api.sh" "$W/scripts/"; cp "$R/pipeline/cron/com.oneinvest.collector-api.plist" "$W/pipeline/cron/"
  sed "s#/Users/manhphan/.local/bin/node#$W/bin/node-that#" "$R/collector/scripts/api-launchd.sh" > "$W/collector/scripts/api-launchd.sh"
  printf '#!/bin/bash\nexit 0\n' > "$W/bin/node-that"; chmod +x "$W/bin/node-that"
  echo src > "$W/collector/src/api/main.ts"; sleep 1; echo dist > "$W/collector/dist/api/main.js"; echo k > "$W/home/.openclaw/credentials/oneinvest-agent.key"
  printf '#!/bin/bash\necho "launchctl $*" >> "%s/calls"\n' "$W" > "$W/bin/launchctl"; chmod +x "$W/bin/launchctl"; }
run(){ (cd "$1" && HOME="$1/home" PATH="$1/bin:/usr/bin:/bin" bash scripts/install-collector-api.sh 2>&1); }
W="$T/a"; mk "$W"; [ ! -d "$W/pipeline/logs" ] || { echo "FAIL tiền đề: logs đã có"; bad=1; }
run "$W" >/dev/null; [ -d "$W/pipeline/logs" ] && echo "ok   clone mới: pipeline/logs được tạo" || { echo "FAIL không tạo pipeline/logs"; bad=1; }
W="$T/b|c"; mk "$W"; P="$W/home/Library/LaunchAgents/com.oneinvest.collector-api.plist"; mkdir -p "$(dirname "$P")"; echo "PLIST-CU" > "$P"
o=$(run "$W"); c=$?; echo "$o" | grep -q "node tuyệt đối\|thiếu" && { echo "FAIL tiền đề: script dừng sớm, chưa tới sed"; bad=1; }
[ "$(cat "$P")" = "PLIST-CU" ] && echo "ok   sed lỗi (đường có '|'): plist cũ giữ nguyên (thoát $c)" || { echo "FAIL plist cũ bị đè: $(head -c 40 "$P")"; bad=1; }
[ ! -s "$W/calls" ] && echo "ok   không gọi launchctl" || { echo "FAIL gọi launchctl"; bad=1; }
[ "$bad" = 0 ] && echo "LOGS-TMP OK"; exit "$bad"
