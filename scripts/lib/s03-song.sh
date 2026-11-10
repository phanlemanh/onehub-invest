#!/bin/bash
# s03-song.sh — L6 kiểm SỐNG kênh S03 (claudedp-1011-5, LT0 canh-bao-s03-ngung-thu).
# Bối cảnh sự cố 09/11: provider S03 chết 23 giờ mà các lớp an toàn L1–L4b
# vẫn «ok» (chúng kiểm AN TOÀN, không kiểm SỐNG). Ba điều kiện dưới cảnh báo
# qua cùng khuôn L4c/L5b (WARN vào alerts log + notification) — KHÔNG kill
# gateway, không đổi cấu hình. Mỗi điều kiện báo MỘT LẦN cho mỗi sự cố
# (state ghi tên điều kiện; tick sau còn đỏ không lặp), tự xoá khi hồi —
# sự cố mới sau khi hồi sẽ báo lại.
#
# Các hàm nhận THAM SỐ (mốc/giờ/đường tệp) để test được — không đọc máy
# thật trực tiếp; watchdog gọi với giá trị thật. Notification qua biến
# S03_SONG_OSASCRIPT (mặc định osascript) để test bơm stub.
#
# Ngưỡng đã chọn + lý do:
#   (a) 30 phút không snapshot mới trong 7–22h giờ VN — nhịp đo thật trên
#       máy này: median 60s, p95 120s giữa các snapshot; ban ngày 3 ngày
#       khoẻ 44–63 snapshot/giờ → khoảng cách lớn nhất khi khoẻ ~2′, tức
#       30′ = ~15× p95: đỏ thì chắc hỏng, không bao giờ oan. Đêm chỉ
#       ~7 snapshot/giờ nên ngoài 7–22h KHÔNG xét (chạy cũng oan).
#   (b) «auto-restart attempt k/10» mà 2′ sau không có «starting … provider»
#       kế tiếp — đúng kiểu treo 09/11 (lần 2 hẹn «in 10s» không bao giờ
#       chạy). 2′ = 12× khoảng hẹn 10s, đủ vượt nhiễu tick chậm.
#   (c) status CLI có «not linked» — phiên kênh rơi hoàn toàn.

# <điều> <thông điệp> <state> <alerts_log> — ghi WARN + notification + đánh dấu
song_canh_bao() {
  local dieu="$1" thongbao="$2" state="$3" alog="$4"
  echo "$(date -Iseconds) WARN S03-SỐNG [$dieu]: $thongbao" >> "$alog"
  "${S03_SONG_OSASCRIPT:-osascript}" -e "display notification \"S03: $thongbao\" with title \"Zalo Watchdog L6\"" 2>/dev/null || true
  if [ -f "$state" ] && grep -qx "$dieu" "$state" 2>/dev/null; then return 0; fi
  echo "$dieu" >> "$state"
}

# đúng 0 khi sự cố của <điều> CHƯA được báo (cần báo tick này)
song_chua_bao() {
  local dieu="$1" state="$2"
  if [ -f "$state" ] && grep -qx "$dieu" "$state" 2>/dev/null; then return 1; fi
  return 0
}

# <điều> <state> — điều kiện hết đỏ: gỡ cờ để sự cố kế được báo lại.
# KHÔNG dùng `grep -v && mv`: grep -v trả exit 1 khi kết quả rỗng (xoá hết
# dòng — đúng ý ta) và && sẽ chặn mv, state không bao giờ xoá.
song_hoi_xoa() {
  local dieu="$1" state="$2"
  if [ -f "$state" ] && grep -qx "$dieu" "$state" 2>/dev/null; then
    grep -vx "$dieu" "$state" > "${state}.tmp" 2>/dev/null
    mv "${state}.tmp" "$state"
  fi
}

# ISO → epoch giây (in rỗng khi lỗi) — python3 có sẵn (watchdog L2 đã dùng)
song_moc_epoch() {
  python3 - "$1" <<'EOF'
import sys, datetime
try:
    print(int(datetime.datetime.fromisoformat(sys.argv[1].strip()).timestamp()))
except Exception:
    pass
EOF
}

# (a) <now_epoch> <gio_vn_0-23> <mtime_snapshot_moi_nhat> <state> <alerts_log>
song_a_snapshot() {
  local now="$1" gio="$2" mtime="$3" state="$4" alog="$5"
  if [ "$gio" -ge 7 ] 2>/dev/null && [ "$gio" -lt 22 ] 2>/dev/null; then
    local tuoi=$(( now - mtime ))
    if [ "$tuoi" -ge 1800 ]; then
      if song_chua_bao a "$state"; then
        song_canh_bao a "không snapshot S03 mới trong ${tuoi}s (≥30′) trong khung ban ngày — S03 ngừng thu?" "$state" "$alog"
      fi
      return 0
    fi
  fi
  song_hoi_xoa a "$state"
  return 1
}

# (b) <gateway_log> <now_epoch> <state> <alerts_log>
song_b_restart() {
  local gwlog="$1" now="$2" state="$3" alog="$4"
  local iso_a iso_s moc_a moc_s
  iso_a=$(grep "auto-restart attempt" "$gwlog" 2>/dev/null | tail -1 | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+[+-][0-9]{2}:[0-9]{2}')
  if [ -z "$iso_a" ]; then
    song_hoi_xoa b "$state"
    return 1
  fi
  moc_a=$(song_moc_epoch "$iso_a")
  if [ -z "$moc_a" ]; then
    song_hoi_xoa b "$state"
    return 1
  fi
  iso_s=$(grep "starting .* provider" "$gwlog" 2>/dev/null | tail -1 | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+[+-][0-9]{2}:[0-9]{2}')
  moc_s=$(song_moc_epoch "$iso_s")
  # đỏ khi đã quá 2′ kể từ attempt mà KHÔNG có starting provider nào SAU nó
  if [ $(( now - moc_a )) -ge 120 ]; then
    if [ -z "$moc_s" ] || [ "$moc_s" -le "$moc_a" ]; then
      if song_chua_bao b "$state"; then
        song_canh_bao b "auto-restart hẹn khởi động lại nhưng $(( now - moc_a ))s (≥2′) không có dòng starting provider — bộ hẹn treo (kiểu sự cố 09/11)?" "$state" "$alog"
      fi
      return 0
    fi
  fi
  song_hoi_xoa b "$state"
  return 1
}

# (c) <status_output> <state> <alerts_log>
song_c_notlinked() {
  local out="$1" state="$2" alog="$3"
  if printf '%s' "$out" | grep -qi "not linked"; then
    if song_chua_bao c "$state"; then
      song_canh_bao c "trạng thái listener kênh S03 «not linked» — phiên rơi, cần quét lại?" "$state" "$alog"
    fi
    return 0
  fi
  song_hoi_xoa c "$state"
  return 1
}
