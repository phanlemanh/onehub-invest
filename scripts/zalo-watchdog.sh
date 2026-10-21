#!/bin/bash
# zalo-watchdog.sh — Lớp 4+5 của Phương án B lockdown Zalo (5 lớp).
#
# Bài học sự cố 2026-10-20: agent LLM bị kích từ kênh xã hội và cố REPLY.
# Bài học 2026-10-21: bindings=[] KHÔNG đủ — channel auto-reply kích agent
# trên MỌI tin khi requireMention=false (127 turns/ngày). Watchdog giám sát
# CẢ HÀNH VI RUNTIME, không chỉ config:
#   L2: openclaw.json bindings = [] (rỗng tuyệt đối)
#   L3: channels.zalo (bot OA) phải vắng mặt
#   L3b: mọi nhóm zalouser phải requireMention=true
#   L4b: log runtime KHÔNG được có agent-turn mới (auto-reply/agent-turn-timing)
#   L1: hook oneinvest-zalo-pipe không chứa API gửi tin
# Khi vi phạm → kill OpenClaw + bootout launchd (chống respawn) + alert.
# Fail closed: config đúng nhưng hành vi sai vẫn bị bắt bởi L4b.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$HOME/.openclaw/openclaw.json"
HANDLER="$ROOT/collector/openclaw/handler.js"
ALERT_LOG="$ROOT/pipeline/logs/zalo-watchdog-alerts.log"
MARKER="$ROOT/pipeline/logs/zalo-watchdog-turn-marker"
OC_LOG_GLOB="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
mkdir -p "$ROOT/pipeline/logs"

alert() {
  local reason="$1"
  echo "$(date -Iseconds) KILL: $reason" >> "$ALERT_LOG"
  # tắt hẳn service để launchd không hồi sinh
  launchctl bootout "gui/$(id -u)/ai.openclaw.gateway" 2>/dev/null || true
  pkill -9 -f openclaw 2>/dev/null || true
  osascript -e "display notification \"OpenClaw ĐÃ TẮT: $reason\" with title \"Zalo Watchdog\"" 2>/dev/null || true
  exit 1
}

# OpenClaw không chạy → không có gì để giám sát (bình thường khi user tắt tay)
pgrep -f openclaw >/dev/null || exit 0

# L2 — bindings phải rỗng
N_BIND=$(python3 -c "import json; print(len(json.load(open('$CFG')).get('bindings', [])))" 2>/dev/null || echo "err")
[ "$N_BIND" = "err" ] && alert "không đọc được openclaw.json (config hỏng?)"
[ "$N_BIND" != "0" ] && alert "bindings có $N_BIND entry (phải rỗng — L2 bị drill)"

# L3 — kênh bot phải vắng + L3b mọi nhóm requireMention=true
MSG=$(python3 - "$CFG" << 'EOF' 2>&1
import json, sys
d = json.load(open(sys.argv[1]))
if "zalo" in d.get("channels", {}):
    print("L3: channels.zalo (bot) vẫn bật"); sys.exit(1)
zs = d.get("channels", {}).get("zalouser", {})
for scope in [zs.get("groups")] + [a.get("groups") for a in (zs.get("accounts") or {}).values()]:
    for g, cfg in (scope or {}).items():
        if cfg.get("enabled") and not cfg.get("requireMention"):
            print(f"L3b: {g} bật nhưng requireMention != true"); sys.exit(1)
EOF
) && CONFIG_OK=1 || CONFIG_OK=0
[ "$CONFIG_OK" = "0" ] && alert "$MSG (config bị drill)"

# L1 — handler phải read-only (không API gửi tin)
if grep -qiE "send-?message|sendMessage|reply\(" "$HANDLER" 2>/dev/null; then
  alert "handler oneinvest-zalo-pipe chứa API gửi tin (L1 bị drill)"
fi

# L4b — RUNTIME GUARD: agent-turn mới trong log hôm nay = hành vi nguy hiểm
# bất kể config nói gì. Marker ghi số dòng đã quét; chỉ quét phần mới.
if [ -f "$OC_LOG_GLOB" ]; then
  LAST_N=$(cat "$MARKER" 2>/dev/null || echo 0)
  CUR_N=$(wc -l < "$OC_LOG_GLOB" | tr -d ' ')
  if [ "$CUR_N" -gt "$LAST_N" ]; then
    if tail -n +"$((LAST_N + 1))" "$OC_LOG_GLOB" | grep -q "auto-reply/agent-turn-timing"; then
      alert "agent-turn MỚI từ kênh xã hội (auto-reply chạy dù config an toàn) — hành vi sự cố 2026-10-20"
    fi
    echo "$CUR_N" > "$MARKER"
  fi
fi

# L5 — ghi nhịp kiểm tra (im lặng = mọi lớp còn nguyên)
# Kev gate :8009 chết = mất dữ liệu im lặng (đã xảy ra 2026-10-21) → cảnh
# báo (KHÔNG kill OpenClaw — handler giờ fail-open, thu vẫn chạy).
KEV_OK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:8009/v1/models 2>/dev/null)
KEV_NOTE="kev:ok"
[ "$KEV_OK" = "200" ] || {
  KEV_NOTE="kev:DOWN($(date +%H:%M))"
  echo "$(date -Iseconds) WARN: Kev gate :8009 không đáp ứng (HTTP $KEV_OK) — handler đang fail-open" >> "$ALERT_LOG"
  osascript -e "display notification \"Kev gate :8009 DOWN — tin Zalo chưa phân loại vẫn được thu\" with title \"Zalo Watchdog\"" 2>/dev/null || true
}
echo "$(date -Iseconds) ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, $KEV_NOTE" \
  >> "$ROOT/pipeline/logs/zalo-watchdog.log"
tail -500 "$ROOT/pipeline/logs/zalo-watchdog.log" > "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" \
  && mv "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" "$ROOT/pipeline/logs/zalo-watchdog.log"
