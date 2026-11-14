#!/bin/bash
# zalo-heartbeat.sh — tầng Ống V2 (/ops/collections): launchd chạy mỗi 15′,
# probe channel zalouser qua openclaw CLI rồi ghi 1 dòng vào CÙNG log của hook
# (đơn nguồn cho parser). Phát hiện 2 kiểu chết:
#   - chết thật: channel mất connected → "heartbeat zalouser DOWN"
#   - chết im lặng: connected nhưng >24h không tin qua cổng khi vẫn có nhịp
#     heartbeat → "alert silent-gate"
set -uo pipefail

LOG="$HOME/.openclaw/logs/oneinvest-zalo-pipe.log"
OPENCLAW="${ZALO_OPENCLAW_CLI:-$HOME/.openclaw/bin/openclaw}"
TS="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
# 1411-30 D3: state + đường ghi đè được để test bơm (mặc định đúng máy thật).
HEARTBEAT_STATE="${ZALO_HEARTBEAT_STATE:-$HOME/.openclaw/logs/.zalo-heartbeat-down}"
ROOT_ZCODE="${ZALO_HEARTBEAT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
HEARTBEAT_ALERTS="${ZALO_HEARTBEAT_ALERTS:-$ROOT_ZCODE/pipeline/logs/zalo-watchdog-alerts.log}"
HEARTBEAT_LINH_MUC="${ZALO_HEARTBEAT_LINH_MUC:-$HOME/.openclaw/logs/.zalo-heartbeat-nhom-moc}"
mkdir -p "$(dirname "$LOG")"
touch "$LOG"

STATUS="$("$OPENCLAW" channels status 2>/dev/null || true)"
# Đa tài khoản: ĐÚNG khi MỌI dòng "Zalo Personal ... connected" đều connected
TOTAL=$(echo "$STATUS" | grep -c "Zalo Personal" || true)
# 1411-30: grep -w — «disconnected» chứa chuỗi «connected» nên grep thường đếm cả
# tài khoản RỚT là connected (stub test làm lộ); -w khớp nguyên từ.
UP=$(echo "$STATUS" | grep "Zalo Personal" | grep -cw connected || true)
if [ "$TOTAL" -gt 0 ] && [ "$TOTAL" = "$UP" ]; then
  echo "$TS heartbeat zalouser up accs=${UP}/${TOTAL}" >> "$LOG"
  # 1411-30 D3: up — tự đóng cảnh báo DOWN kéo dài (xoá cờ d) + xoá đếm nhịp.
  if [ -f "$HEARTBEAT_STATE" ]; then rm -f "$HEARTBEAT_STATE"; fi
  exit 0
fi
# 1411-30 D3 — DOWN: đếm nhịp liền, cảnh báo L6(d) khi ≥2 nhịp (≥30′), rồi
# phân biệt lý do bằng lệnh liệt kê nhóm CHỈ-ĐỌC tối đa 1 lần/giờ.
NHIP_DOWN=1
CO_CANH_BAO_D=0
if [ -f "$HEARTBEAT_STATE" ]; then
  NHIP_CU=$(grep -oE "^nhip=[0-9]+" "$HEARTBEAT_STATE" 2>/dev/null | cut -d= -f2)
  [ -n "$NHIP_CU" ] && NHIP_DOWN=$(( NHIP_CU + 1 ))
  grep -qx d "$HEARTBEAT_STATE" 2>/dev/null && CO_CANH_BAO_D=1
fi
LY_DO="$(grep -oE "^reason=[a-z]+" "$HEARTBEAT_STATE" 2>/dev/null | cut -d= -f2 | tail -1)"
# lệnh nhóm: chỉ khi DOWN, trần 1/giờ (mốc lưu riêng); KHÔNG in danh sách nhóm
# hay định danh — chỉ lấy reason.
GIOI_NHOM=1
if [ -f "$HEARTBEAT_LINH_MUC" ]; then
  MOC=$(cat "$HEARTBEAT_LINH_MUC" 2>/dev/null || echo 0)
  [ $(( $(date -u +%s) - ${MOC:-0} )) -lt 3600 ] && GIOI_NHOM=0
fi
if [ "$GIOI_NHOM" = "1" ]; then
  date -u +%s > "$HEARTBEAT_LINH_MUC"
  NHOM_OUT="$("$OPENCLAW" directory groups list --channel zalouser 2>&1 || true)"
  if printf '%s' "$NHOM_OUT" | grep -q "Đăng nhập thất bại"; then
    LY_DO="session"
  elif [ -n "$NHOM_OUT" ]; then
    LY_DO="stopped"
  fi
fi
# viết lại state GIỮ cờ d (cảnh báo một lần mỗi sự cố — heartbeat không được ghi đè mất cờ)
{
  echo "nhip=$NHIP_DOWN"
  [ -n "$LY_DO" ] && echo "reason=$LY_DO"
  [ "$CO_CANH_BAO_D" = "1" ] && echo "d"
} > "$HEARTBEAT_STATE"
if [ -n "$LY_DO" ]; then
  echo "$TS heartbeat zalouser DOWN accs=${UP:-0}/${TOTAL:-0} reason=$LY_DO" >> "$LOG"
else
  echo "$TS heartbeat zalouser DOWN accs=${UP:-0}/${TOTAL:-0}" >> "$LOG"
fi
# cảnh báo L6(d): source lib dùng chung khuôn L6 a/b (canh_bao một lần mỗi sự cố,
# tự đóng khi up); env override cho test.
S03_SONG_STATE="$HEARTBEAT_STATE"
S03_SONG_OSASCRIPT="${S03_SONG_OSASCRIPT:-osascript}"
source "$(cd "$(dirname "$0")/../.." && pwd)/scripts/lib/s03-song.sh"
song_d_down_kdai "$NHIP_DOWN" "$HEARTBEAT_STATE" "$HEARTBEAT_ALERTS"
exit 0

# Drift-check (Phase 2): 1 giờ/lần — so allowlist với membership thật
LAST_DRIFT="$(grep ' alert drift' "$LOG" 2>/dev/null | tail -1 | cut -c1-19)"
RUN_DRIFT=1
if [ -n "$LAST_DRIFT" ]; then
  LD_EPOCH="$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "$LAST_DRIFT" +%s 2>/dev/null || echo 0)"
  [ $(( ($(date -u +%s) - LD_EPOCH) / 3600 )) -lt 1 ] && RUN_DRIFT=0
fi
[ "$RUN_DRIFT" = "1" ] && bash "$(dirname "$0")/zalo-drift.sh" || true

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
