#!/bin/bash
# zalo-watchdog.sh — Lớp 4+5 của Phương án B lockdown Zalo (5 lớp).
#
# Bài học sự cố 2026-10-20: agent LLM bị kích từ kênh xã hội qua bindings và
# cố REPLY 154 lần. Watchdog này đảm bảo các lớp lockdown KHÔNG bị drill ngược:
#   L2: openclaw.json phải có bindings = [] (rỗng tuyệt đối)
#   L3: channels.zalo (bot OA) phải vắng mặt; zalouser phải inbound-only
#   L1: hook oneinvest-zalo-pipe không được sửa thành gửi tin (check đơn giản:
#       file handler không chứa chuỗi send-message/sendMessage)
# Khi vi phạm → kill OpenClaw ngay + ghi alert + notification. KHÔNG tự sửa
# config lại (để người xem xét) — fail closed về phía an toàn.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$HOME/.openclaw/openclaw.json"
HANDLER="$ROOT/collector/openclaw/handler.js"
ALERT_LOG="$ROOT/pipeline/logs/zalo-watchdog-alerts.log"
mkdir -p "$ROOT/pipeline/logs"

alert() {
  local reason="$1"
  echo "$(date -Iseconds) KILL: $reason" >> "$ALERT_LOG"
  pkill -f "openclaw" 2>/dev/null || true
  osascript -e "display notification \"OpenClaw ĐÃ TẮT: $reason\" with title \"Zalo Watchdog\"" 2>/dev/null || true
  exit 1
}

# OpenClaw không chạy → không có gì để giám sát (bình thường khi user tắt tay)
pgrep -f openclaw >/dev/null || exit 0

# L2 — bindings phải rỗng
N_BIND=$(python3 -c "import json; print(len(json.load(open('$CFG')).get('bindings', [])))" 2>/dev/null || echo "err")
[ "$N_BIND" = "err" ] && alert "không đọc được openclaw.json (config hỏng?)"
[ "$N_BIND" != "0" ] && alert "bindings có $N_BIND entry (phải rỗng — L2 bị drill)"

# L3 — kênh bot phải vắng mặt (bot OA = đường gửi độc lập với bindings)
python3 - "$CFG" << 'EOF' || exit 1
import json, sys
d = json.load(open(sys.argv[1]))
if "zalo" in d.get("channels", {}):
    print("L3 vi phạm: channels.zalo (bot) vẫn bật")
    sys.exit(1)
EOF
[ $? -ne 0 ] && alert "L3 bị drill (channel bot vẫn bật)"

# L1 — handler phải read-only (không API gửi tin)
if grep -qiE "send-?message|sendMessage|reply\(" "$HANDLER" 2>/dev/null; then
  alert "handler oneinvest-zalo-pipe chứa API gửi tin (L1 bị drill)"
fi

# L5 — ghi nhịp kiểm tra (im lặng = mọi lớp còn nguyên)
echo "$(date -Iseconds) ok — bindings=0, no bot channel, handler read-only" \
  >> "$ROOT/pipeline/logs/zalo-watchdog.log"
# xoá nhịp cũ giữ 500 dòng cuối
tail -500 "$ROOT/pipeline/logs/zalo-watchdog.log" > "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" \
  && mv "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" "$ROOT/pipeline/logs/zalo-watchdog.log"
