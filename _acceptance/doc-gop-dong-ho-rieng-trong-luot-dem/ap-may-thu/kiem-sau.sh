#!/bin/bash
# kiem-sau.sh <log> [--tran <giây>] — lệnh kiểm sau áp của HT12 (doc-gop-dong-ho-rieng-trong-luot-dem). Chỉ đọc.
# Bước 1: chạy nguyên bộ kiểm của HT13 (lượt 00:00 mới nhất chạy mã mới: không TIMEOUT lượt, có enrich-run, hai khoản
# chừa). Bước 2, trong ĐÚNG đoạn lượt ấy (từ dòng khai trần có «đọc gộp ≤» tới dòng khai kế), đòi phần của nhánh B:
#   (B1) không có «JOB FAIL [zalo-import-daily] bước doc-gop-hang-ngay mã 75» — 75 là dừng sạch, đi tiếp;
#   (B2) bước đọc gộp mã 75 thì phải có dòng «JOB WARN [zalo-import-daily] bước doc-gop-hang-ngay: hết giờ dừng sạch».
# In ĐẠT kèm kết cục bước đọc gộp (xong trọn · dừng sạch 75 · đồng hồ bước cắt), hoặc KHÔNG ĐẠT kèm lý do (mã 1).
set -uo pipefail
D="$(cd "$(dirname "$0")" && pwd)"
f="${1:?dùng: kiem-sau.sh <log> [--tran <giây>]}"
HT13="$D/../../tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem-sau.sh"
[ -r "$HT13" ] || { echo "KHÔNG ĐẠT — thiếu bộ kiểm HT13 ($HT13)"; exit 1; }
nen=$(bash "$HT13" "$@"); rc=$?
[ "$rc" -eq 0 ] || { echo "$nen"; exit 1; }
n=$(grep -n '^\[zalo-import-daily\] trần: .*đọc gộp ≤' "$f" | tail -1 | cut -d: -f1)
ke=$(tail -n +"$((n + 1))" "$f" | grep -n '^\[zalo-import-daily\] trần:' | head -1 | cut -d: -f1)
if [ -n "$ke" ]; then doan=$(tail -n +"$n" "$f" | head -n "$ke"); else doan=$(tail -n +"$n" "$f"); fi
if grep -q '^JOB FAIL \[zalo-import-daily\] bước doc-gop-hang-ngay mã 75$' <<<"$doan"; then
  echo "KHÔNG ĐẠT — bước đọc gộp dừng sạch (mã 75) vẫn bị tính lỗi: lượt chưa chạy nhánh B"; exit 1; fi
dg=$(grep '^JOB STEP \[zalo-import-daily\] bước doc-gop-hang-ngay ' <<<"$doan" | tail -1)
ma=$(sed -E 's/^.* mã ([0-9]+) .*$/\1/' <<<"$dg")
if [ "$ma" = "75" ]; then
  grep -q '^JOB WARN \[zalo-import-daily\] bước doc-gop-hang-ngay: hết giờ dừng sạch' <<<"$doan" ||
    { echo "KHÔNG ĐẠT — bước đọc gộp mã 75 mà không có dòng JOB WARN dừng sạch"; exit 1; }
  kc="đọc gộp dừng sạch (75), đi tiếp"
elif grep -q 'TIMEOUT: bước đọc gộp vượt trần' <<<"$doan"; then kc="đọc gộp bị đồng hồ bước cắt (mã $ma), đi tiếp"
elif [ "$ma" = "0" ]; then kc="đọc gộp xong trọn"
else kc="đọc gộp lỗi mã $ma (không do trần)"; fi
echo "$nen · $kc"
