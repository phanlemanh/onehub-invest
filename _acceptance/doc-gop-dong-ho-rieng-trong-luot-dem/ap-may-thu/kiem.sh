#!/bin/bash
# kiem.sh — eval E9 (AC-9) của HT12: README đủ năm mục; kiem-sau.sh chấm đúng mười hai ca trên tám log mẫu. Log mẫu rút từ
# đầu ra THẬT của bản sao scripts/zalo-import-daily.sh @nhánh B (fixture như zalo-import-chia-tran-zcode.test.mjs, đường
# tạm thay <ROOT>); hai bản sao đột biến: luot-75-con-fail coi 75 là lỗi (đầu ra của mã chỉ có A), luot-75-khong-warn bỏ dòng WARN dừng sạch. Không chỉnh tay.
set -uo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; FAIL=0
for m in "1. \*\*Lệnh áp" "2. \*\*Số chạy thử" "3. \*\*Sao lưu trước" "4. \*\*Cách lùi" "5. \*\*Lệnh kiểm sau"; do
  grep -q "^$m" "$D/README.md" || { echo "FAIL README thiếu mục: ${m//\\/}"; FAIL=1; }
done
ca() { local log="$1" ma="$2" chu="$3" out rc; shift 3; out=$(bash "$D/kiem-sau.sh" "$D/mau/$log" "$@"); rc=$?
  if [ "$rc" = "$ma" ] && grep -q -- "$chu" <<<"$out"; then echo "PASS $log $* → $out"; else echo "FAIL $log $*: mong mã $ma «$chu», được mã $rc «$out»"; FAIL=1; fi; }
ca luot-75-dat.log 0 "^ĐẠT.* · đọc gộp dừng sạch (75), đi tiếp$"
ca luot-75-dat.log 0 "^ĐẠT" --tran 21600
ca luot-32400-75-dat.log 0 "^ĐẠT.* · lượt ≤32400s · .* · đọc gộp dừng sạch (75), đi tiếp$"
ca luot-32400-75-dat.log 0 "^ĐẠT" --tran 32400
ca luot-32400-75-dat.log 1 "^KHÔNG ĐẠT — lượt mới nhất không chạy trần 21600s" --tran 21600
ca luot-lanh.log 0 "^ĐẠT.* · đọc gộp xong trọn$"
ca luot-dong-ho-buoc-cat.log 0 "^ĐẠT.* · đọc gộp bị đồng hồ bước cắt (mã 143), đi tiếp$"
ca luot-75-khong-warn.log 1 "^KHÔNG ĐẠT — bước đọc gộp mã 75 mà không có dòng JOB WARN dừng sạch"
ca luot-75-con-fail.log 1 "^KHÔNG ĐẠT — bước đọc gộp dừng sạch (mã 75) vẫn bị tính lỗi"
ca nhieu-luot-cu-fail-moi-dat.log 0 "^ĐẠT.* · đọc gộp dừng sạch (75), đi tiếp$"
ca nhieu-luot-dat-roi-moi-fail.log 1 "^KHÔNG ĐẠT — bước đọc gộp dừng sạch (mã 75) vẫn bị tính lỗi"
ca luot-dong-ho-buoc-cat.log 1 "^KHÔNG ĐẠT — lượt mới nhất không chạy trần 21600s" --tran 21600
exit $FAIL
