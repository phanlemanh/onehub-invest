#!/bin/bash
# kiem-sau.sh <log> [--tran <giây>] — lệnh kiểm sau áp của HT13 (tran-tong-luot-dem-va-tran-doc-gop). Chỉ đọc.
# Log launchd là tệp NỐI nhiều lượt (00:00 và lượt nhanh 15′). Lấy lượt 00:00 MỚI NHẤT chạy mã mới — từ dòng khai trần có
# «đọc gộp ≤» tới trước dòng khai trần kế tiếp (bất kỳ lượt nào) — rồi đòi, TRONG đúng đoạn ấy:
#   (1) không «TIMEOUT: lượt vượt trần»; (2) có «JOB STEP [zalo-import-daily] bước enrich-run»;
#   (3) tổng giây các JOB STEP trước bước đọc gộp ≤ trần nạp + 600 (khoản chừa phía trước của mã);
#   (4) tổng giây các JOB STEP SAU bước đọc gộp, tới hết enrich-run, ≤ 3000 (khoản chừa cho enrich của mã);
#   (5) với --tran N: dòng khai nêu «lượt ≤Ns» (đêm biến 32400 không được tính thay cho trần mặc định 21600).
# In ĐẠT (mã 0) hoặc KHÔNG ĐẠT kèm lý do (mã 1).
set -uo pipefail
f="${1:?dùng: kiem-sau.sh <log> [--tran <giây>]}"; shift
TRAN=""; [ "${1:-}" = "--tran" ] && TRAN="${2:?--tran cần số giây}"
CHUA_ENRICH=3000
[ -r "$f" ] || { echo "KHÔNG ĐẠT — không đọc được $f"; exit 1; }
n=$(grep -n '^\[zalo-import-daily\] trần: .*đọc gộp ≤' "$f" | tail -1 | cut -d: -f1)
[ -n "$n" ] || { echo "KHÔNG ĐẠT — chưa có lượt 00:00 nào chạy mã mới (không thấy dòng khai trần có «đọc gộp»)"; exit 1; }
khai=$(sed -n "${n}p" "$f")
ke=$(tail -n +"$((n + 1))" "$f" | grep -n '^\[zalo-import-daily\] trần:' | head -1 | cut -d: -f1)
if [ -n "$ke" ]; then doan=$(tail -n +"$n" "$f" | head -n "$ke"); else doan=$(tail -n +"$n" "$f"); fi
if [ -n "$TRAN" ] && ! grep -q "· lượt ≤${TRAN}s\$" <<<"$khai"; then echo "KHÔNG ĐẠT — lượt mới nhất không chạy trần ${TRAN}s: $khai"; exit 1; fi
if grep -q 'TIMEOUT: lượt vượt trần' <<<"$doan"; then echo "KHÔNG ĐẠT — lượt bị trần tổng cắt: $khai"; exit 1; fi
en=$(grep '^JOB STEP \[zalo-import-daily\] bước enrich-run ' <<<"$doan" | tail -1)
[ -n "$en" ] || { echo "KHÔNG ĐẠT — enrich-run chưa chạy trong lượt: $khai"; exit 1; }
nap=$(sed -E 's/^.*nạp ≤([0-9]+)s.*$/\1/' <<<"$khai")
read -r truoc sau < <(awk '/^JOB STEP \[zalo-import-daily\] bước /{ g=$0; sub(/^.* giây /,"",g); sub(/ .*/,"",g);
  if ($0 ~ / bước doc-gop-hang-ngay /) { da=1; next } if (da) s+=g; else t+=g } END { print t+0, s+0 }' <<<"$doan")
if [ "$truoc" -gt $((nap + 600)) ]; then echo "KHÔNG ĐẠT — các bước trước đọc gộp mất ${truoc}s > chừa $((nap + 600))s: $khai"; exit 1; fi
if [ "$sau" -gt "$CHUA_ENRICH" ]; then echo "KHÔNG ĐẠT — các bước sau đọc gộp tới enrich mất ${sau}s > chừa ${CHUA_ENRICH}s: $khai"; exit 1; fi
echo "ĐẠT — $khai · trước đọc gộp ${truoc}s/$((nap + 600))s · sau đọc gộp ${sau}s/${CHUA_ENRICH}s · $en"
