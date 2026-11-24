#!/bin/bash
# kiem.sh — eval E9 (AC-9) của HT13: README đủ năm mục; kiem-sau.sh chấm đúng bảy log mẫu. Log mẫu rút từ đầu ra THẬT của
# bản sao scripts/zalo-import-daily.sh (fixture như zalo-import-tran.test.mjs; đường tạm thay bằng <ROOT>); hai chỗ chỉnh
# tay có tên: số giây của luot-vuot-cho-enrich.log, và dòng TIMEOUT 2400s nối sau lượt nhanh (khuôn của dòng TIMEOUT thật).
set -uo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; FAIL=0
for m in "1. \*\*Lệnh áp" "2. \*\*Số chạy thử" "3. \*\*Sao lưu trước" "4. \*\*Cách lùi" "5. \*\*Lệnh kiểm sau"; do
  grep -q "^$m" "$D/README.md" || { echo "FAIL README thiếu mục: ${m//\\/}"; FAIL=1; }
done
ca() { local log="$1" ma="$2" chu="$3" out rc; shift 3; out=$(bash "$D/kiem-sau.sh" "$D/mau/$log" "$@"); rc=$?
  if [ "$rc" = "$ma" ] && grep -q "^$chu" <<<"$out"; then echo "PASS $log $* → $out"; else echo "FAIL $log $*: mong mã $ma «$chu», được mã $rc «$out»"; FAIL=1; fi; }
ca luot-moi-dat.log 0 "ĐẠT"
ca luot-moi-dat.log 0 "ĐẠT" --tran 21600
ca luot-32400-dat.log 0 "ĐẠT"
ca luot-32400-dat.log 1 "KHÔNG ĐẠT — lượt mới nhất không chạy trần 21600s" --tran 21600
ca luot-cu-khong-khai.log 1 "KHÔNG ĐẠT — chưa có lượt 00:00 nào chạy mã mới"
ca luot-moi-cat-tran.log 1 "KHÔNG ĐẠT — lượt bị trần tổng cắt"
ca nhieu-luot-dat-roi-nhanh-cat.log 0 "ĐẠT"
ca nhieu-luot-cu-dat-moi-cat.log 1 "KHÔNG ĐẠT — lượt bị trần tổng cắt"
ca luot-vuot-cho-enrich.log 1 "KHÔNG ĐẠT — các bước sau đọc gộp tới enrich mất 3100s > chừa 3000s"
exit $FAIL
