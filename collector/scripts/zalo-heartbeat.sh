#!/bin/bash
# zalo-heartbeat.sh — tầng Ống V2 (/ops/collections): launchd chạy mỗi 15′,
# probe channel zalouser qua openclaw CLI rồi ghi 1 dòng vào CÙNG log của hook
# (đơn nguồn cho parser). Phát hiện 2 kiểu chết:
#   - chết thật: channel mất connected → "heartbeat zalouser DOWN"
#   - chết im lặng: connected nhưng >24h không tin qua cổng khi vẫn có nhịp
#     heartbeat → "alert silent-gate"
set -uo pipefail

LOG="$HOME/.openclaw/logs/oneinvest-zalo-pipe.log"
OPENCLAW="$HOME/.openclaw/bin/openclaw"
TS="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
mkdir -p "$(dirname "$LOG")"
touch "$LOG"

STATUS="$("$OPENCLAW" channels status 2>/dev/null || true)"
# Đa tài khoản: ĐÚNG khi MỌI dòng "Zalo Personal ... connected" đều connected
TOTAL=$(echo "$STATUS" | grep -c "Zalo Personal" || true)
UP=$(echo "$STATUS" | grep "Zalo Personal" | grep -c "connected" || true)
if [ "$TOTAL" -gt 0 ] && [ "$TOTAL" = "$UP" ]; then
  echo "$TS heartbeat zalouser up accs=${UP}/${TOTAL}" >> "$LOG"
elif [ "$TOTAL" -gt 0 ]; then
  echo "$TS heartbeat zalouser DOWN accs=${UP}/${TOTAL}" >> "$LOG"
else
  echo "$TS heartbeat zalouser DOWN" >> "$LOG"
fi
[ "$TOTAL" -gt 0 ] && [ "$TOTAL" = "$UP" ] || exit 0

# Chết im lặng: up nhưng dòng " post 202" cuối cũ hơn 24h (chỉ cảnh báo khi
# trước đó từng có tin thật — log có ít nhất 1 dòng post 202)
LAST_POST="$(grep ' post 202' "$LOG" | tail -1 | cut -c1-19)"
if [ -n "$LAST_POST" ]; then
  LAST_EPOCH="$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "$LAST_POST" +%s 2>/dev/null || echo 0)"
  NOW_EPOCH="$(date -u +%s)"
  AGE_H=$(( (NOW_EPOCH - LAST_EPOCH) / 3600 ))
  if [ "$AGE_H" -ge 24 ]; then
    # không spam: chỉ alert khi 6h qua chưa có alert nào
    LAST_ALERT="$(grep ' alert silent-gate' "$LOG" | tail -1 | cut -c1-19)"
    if [ -n "$LAST_ALERT" ]; then
      LA_EPOCH="$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "$LAST_ALERT" +%s 2>/dev/null || echo 0)"
      [ $(( (NOW_EPOCH - LA_EPOCH) / 3600 )) -lt 6 ] && exit 0
    fi
    echo "$TS alert silent-gate ${AGE_H}h connected nhưng không tin qua cổng" >> "$LOG"
  fi
fi
