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
#   L4a: "drop no mention" tăng bất thường trong gateway.log (spam/lỗ gate)
#   L4b: log runtime KHÔNG được có agent-turn mới (auto-reply/agent-turn-timing)
#   L1: hook oneinvest-zalo-pipe không chứa API gửi tin
#   L5b: Postgres :5433 phải nghe (DB chết 22/10 không ai biết 7 tiếng)
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
        # Bài học 22/10 tối: hai lỗ trước (nhóm requireMention=false có key
        # enabled; nhóm false thiếu key enabled) đều lọt. Giờ yêu cầu
        # requireMention=true TƯỜNG MINH cho mọi nhóm chưa tắt — không tin
        # default runtime của phiên bản (fail closed), nhóm thiếu key = lỗi.
        if cfg.get("enabled", True) is not False and cfg.get("requireMention") is not True:
            print(f"L3b: {g} requireMention phải true"); sys.exit(1)
EOF
) && CONFIG_OK=1 || CONFIG_OK=0
[ "$CONFIG_OK" = "0" ] && alert "$MSG (config bị drill)"

# L1 — handler phải read-only (không API gửi tin)
if grep -qiE "send-?message|sendMessage|reply\(" "$HANDLER" 2>/dev/null; then
  alert "handler oneinvest-zalo-pipe chứa API gửi tin (L1 bị drill)"
fi

# L4b — RUNTIME GUARD: agent-turn mới trong log = hành vi nguy hiểm bất kể
# config nói gì. Marker ghi số dòng đã quét; chỉ quét phần mới. Quét CẢ
# gateway.log canonical (~/Library/Logs/openclaw — runtime-map) lẫn log /tmp
# theo ngày; gateway.log chứa lịch sử sự cố cũ nên marker lần đầu khởi tạo
# bằng số dòng HIỆN TẠI (không alert giả trên quá khứ).
# In phần mới của $1 ra stdout; cập nhật marker $2. Log bị truncate/rotate
# (cur < last) → reset marker, không quét lại phần cũ.
scan_new_lines() {
  local f="$1" mk="$2" prev curInode curLines prevPath rest prevInode prevLines
  [ -f "$f" ] || return 0
  curInode=$(stat -f '%i' "$f" 2>/dev/null || echo 0)
  curLines=$(wc -l < "$f" | tr -d ' ')
  prev=$(cat "$mk" 2>/dev/null || echo "")
  if [ -z "$prev" ]; then
    # khởi tạo (lần đầu với gateway.log chứa lịch sử cũ) — không quét quá khứ
    echo "$f:$curInode:$curLines" > "$mk"
    return 0
  fi
  prevPath=${prev%%:*}
  rest=${prev#*:}
  prevInode=${rest%%:*}
  prevLines=${rest#*:}
  # Marker ghi DANH TÍNH file 'đường_dẫn:inode:số_dòng': đếm dòng không phân
  # biệt được ngày mới DÀI HƠN ngày cũ (cur > last quét từ last+1 → sót dòng
  # đầu, claudedp-2310-5 mở lại). Khác path/inode = file mới (log xoay ngày);
  # cùng file mà ít dòng hơn = truncate — cả hai quét TOÀN BỘ từ dòng 1.
  if [ "$prevPath" != "$f" ] || [ "$prevInode" != "$curInode" ]; then
    # ĐỔI FILE: đuôi file CŨ viết SAU lượt quét cuối ngày (~23:55–00:00) chưa
    # ai quét — quét NỐT từ prevLines+1 TRƯỚC khi đổi sang file mới
    # (claudedp-2310-7). File cũ bị xoá/tmp dọn thì bỏ qua im lặng; inode khác
    # (path bị tái sử dụng) cũng bỏ — không quét nhầm file lạ.
    if [ -n "$prevPath" ] && [ -f "$prevPath" ]; then
      oldInode=$(stat -f '%i' "$prevPath" 2>/dev/null || echo x)
      if [ "$oldInode" = "$prevInode" ]; then
        tail -n +"$((prevLines + 1))" "$prevPath" 2>/dev/null
      fi
    fi
    tail -n +1 "$f"
  elif [ "$curLines" -lt "$prevLines" ]; then
    tail -n +1 "$f"
  elif [ "$curLines" -gt "$prevLines" ]; then
    tail -n +"$((prevLines + 1))" "$f"
  fi
  echo "$f:$curInode:$curLines" > "$mk"
}

DROP_WARN_N=20 # "drop no mention" mới ≥ ngưỡng này trong 1 cửa sổ 5′ = bất thường
GW_LOG="$HOME/Library/Logs/openclaw/gateway.log"
GW_NEW=$(scan_new_lines "$GW_LOG" "$ROOT/pipeline/logs/zalo-watchdog-gw-marker")
if [ -n "$GW_NEW" ]; then
  # L4b trên gateway.log
  if echo "$GW_NEW" | grep -q "auto-reply/agent-turn-timing"; then
    alert "agent-turn MỚI trong gateway.log (auto-reply chạy dù config an toàn) — hành vi sự cố 2026-10-20"
  fi
  # L4a — mention-gate drop là hành vi ĐÚNG, nhưng bùng nổ đếm = bất thường
  # (spam vào nhóm, hoặc gate vô tình nhầm trên nhóm chat thật)
  DROP_N=$(echo "$GW_NEW" | grep -c "drop no mention" || true)
  if [ "${DROP_N:-0}" -ge "$DROP_WARN_N" ]; then
    echo "$(date -Iseconds) WARN: 'drop no mention' +$DROP_N trong 5′ (ngưỡng $DROP_WARN_N) — spam hay gate nhầm nhóm?" >> "$ALERT_LOG"
    osascript -e "display notification \"drop no mention +$DROP_N/5′ — kiểm tra nhóm Zalo\" with title \"Zalo Watchdog L4a\"" 2>/dev/null || true
  fi
fi
# L4b trên log /tmp theo ngày (nơi launchd ghi)
if [ -f "$OC_LOG_GLOB" ]; then
  TMP_NEW=$(scan_new_lines "$OC_LOG_GLOB" "$MARKER")
  if [ -n "$TMP_NEW" ] && echo "$TMP_NEW" | grep -q "auto-reply/agent-turn-timing"; then
    alert "agent-turn MỚI từ kênh xã hội (auto-reply chạy dù config an toàn) — hành vi sự cố 2026-10-20"
  fi
fi


# L4c — COLLECTION STARVED (bài học 22/10: "an toàn 0-turn" có thể là 0 TIN
# vì mention-gate giết thu — watchdog phải phân biệt). 24h không snapshot
# zalo-agent MỚI = cảnh báo.
LAST_SNAP=$(find "$ROOT"/collector/snapshots -name "*__zalo-agent__*" -type f -name "manifest.json" -newer /dev/null 2>/dev/null | xargs stat -f "%m %N" 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2)
if [ -n "$LAST_SNAP" ]; then
  LAST_M=$(stat -f %m "$(dirname "$LAST_SNAP")")
  AGE_H=$(( ( $(date +%s) - LAST_M ) / 3600 ))
  [ "$AGE_H" -ge 24 ] && echo "$(date -Iseconds) WARN: zalo-agent snapshot cũ ${AGE_H}h — collection starved?" >> "$ALERT_LOG"
fi
# L1b — port pluginHooks.messageReceived tiền-cổng còn nguyên (thay hot-patch
# __pregate 22/10 tối; plugin update có thể ghi đè). Marker là tên property
# sống sót qua minify, không phải tên hàm (hàm bị đổi tên khi bundle).
OCZ_MON=$(ls ~/.openclaw/extensions/zalouser/dist/.setup/monitor-*.mjs 2>/dev/null | head -1)
[ -n "$OCZ_MON" ] || alert "không thấy dist/.setup/monitor-*.mjs của zalouser (cài đặt extension hỏng?)"
grep -q "pluginHooks" "$OCZ_MON" 2>/dev/null \
  || alert "port pluginHooks zalouser BIẾN MẤT (plugin update ghi đè?) — tin thường sẽ không chảy tới hook khi requireMention=true"
grep -q "SuppressMessageReceivedHooks" "$OCZ_MON" 2>/dev/null \
  || alert "cờ chặn phát đôi SuppressMessageReceivedHooks BIẾN MẤT trong monitor zalouser — tin qua gate sẽ bị phát hook 2 lần"

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

# L5b — Postgres :5433 phải nghe (bài học 22/10: container DB chết 22:49,
# restart policy=no, không lớp giám sát nào thấy trong 7 tiếng — zalo-import
# 00:00 fail + chotot nạp fail, không một cảnh báo). Chỉ mở/kết nối TCP rồi
# đóng: đủ biết Postgres còn nghe, không cần client thật.
DB_NOTE="db:ok"
if ! (exec 3<>/dev/tcp/127.0.0.1/5433) 2>/dev/null; then
  DB_NOTE="db:DOWN($(date +%H:%M))"
  echo "$(date -Iseconds) WARN: Postgres :5433 KHÔNG NGHE — nạp/transform đêm sẽ fail (container chết? sự cố 22/10 lặp)" >> "$ALERT_LOG"
  osascript -e "display notification \"Postgres :5433 DOWN — nạp dữ liệu đêm sẽ fail\" with title \"Zalo Watchdog L5b\"" 2>/dev/null || true
else
  exec 3>&- 3<&- 2>/dev/null || true
fi
echo "$(date -Iseconds) ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, $KEV_NOTE, $DB_NOTE" \
  >> "$ROOT/pipeline/logs/zalo-watchdog.log"
tail -500 "$ROOT/pipeline/logs/zalo-watchdog.log" > "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" \
  && mv "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" "$ROOT/pipeline/logs/zalo-watchdog.log"
