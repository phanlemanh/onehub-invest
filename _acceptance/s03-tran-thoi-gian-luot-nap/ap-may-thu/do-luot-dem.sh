#!/bin/bash
# do-luot-dem.sh <log> [trần-giây] — đo lượt 00:00 GẦN NHẤT của zalo-import-daily trong log launchd
# (pipeline/logs/zalo-import.log). Lượt bắt đầu ở dòng JOB STEP bước truoc-lan-claude có `nhanh 0`; thời lượng = tổng
# giây các dòng `JOB STEP [zalo-import-daily] … nhanh 0` từ đó tới cuối (dòng của job con như doc-gop-hang-ngay không cộng).
# Lượt bị cắt ở phần nạp in dòng TIMEOUT phần nạp TRƯỚC dòng truoc-lan-claude (thứ tự của scripts/zalo-import-daily.sh):
# «… tại snapshot» thì lượt thoát luôn, không có dòng truoc-lan-claude — dòng ấy MỞ một lượt mới (0 bước, cắt trần), để
# lượt đã cắt không bị bỏ qua mà chấm nhầm sang lượt cũ; «… tại hồ sơ» thì lượt đi tiếp — dòng ấy được giữ và gán cho
# dòng truoc-lan-claude kế. Log zalo-import.log chỉ có lượt 00:00 (lượt nhanh ghi s03-nap-15phut.log).
# ĐẠT khi tổng ≤ trần (mặc định 14400) hoặc lượt có dòng TIMEOUT của lượt hay của phần nạp. KHÔNG ĐẠT khi lượt có
# dòng «TRẦN THỜI GIAN TẮT» (in trước dòng truoc-lan-claude của chính lượt ấy): trần không bật thì thời lượng ngắn không
# chứng được gì. Chỉ đọc.
set -uo pipefail
LOG="${1:?dùng: do-luot-dem.sh <log> [trần-giây]}"; TRAN="${2:-14400}"
[ -r "$LOG" ] || { echo "không đọc được $LOG"; exit 2; }
awk -v tran="$TRAN" '
  /TRẦN THỜI GIAN TẮT/ { cho_tat=1 }
  /TIMEOUT: phần nạp vượt trần .* tại snapshot/ { bat=1; tong=0; buoc=0; cat=$0; cho_cat=""; tat=cho_tat; cho_tat=0; next }
  /TIMEOUT: phần nạp vượt trần .* tại hồ sơ/ { cho_cat=$0; next }
  /^JOB STEP \[zalo-import-daily\] bước truoc-lan-claude .* nhanh 0$/ { bat=1; tong=0; cat=cho_cat; cho_cat=""; buoc=0; tat=cho_tat; cho_tat=0 }
  bat && /^JOB STEP \[zalo-import-daily\] bước .* nhanh 0$/ { for (i=1;i<=NF;i++) if ($i=="giây") tong+=$(i+1); buoc++ }
  bat && /TIMEOUT: lượt vượt trần/ { cat=$0 }
  END {
    if (!bat) { print "CHƯA CÓ lượt 00:00 nào mang dòng JOB STEP trong log"; exit 2 }
    printf "lượt 00:00 gần nhất: %d bước, %d giây (%dh%02dm)", buoc, tong, tong/3600, (tong%3600)/60
    if (tat) { print " — KHÔNG ĐẠT (trần thời gian TẮT ở lượt này)"; exit 1 }
    if (cat != "") { print " — ĐẠT (cắt trần)"; exit 0 }
    if (tong <= tran) { print " — ĐẠT"; exit 0 }
    print " — KHÔNG ĐẠT (vượt " tran " giây, không có dòng cắt trần)"; exit 1
  }' "$LOG"
