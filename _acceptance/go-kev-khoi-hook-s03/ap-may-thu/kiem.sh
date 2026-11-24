#!/bin/bash
# kiem.sh — eval của AC-9 (KEV1): README đủ năm mục áp (có dòng lời riêng Mạnh cho khởi động lại gateway) và kiem-sau.sh
# chấm đúng bảy bộ log mẫu. Log mẫu là chữ viết theo đúng khuôn dòng của collector/openclaw/handler.js (log()) và
# scripts/zalo-watchdog.sh (dòng nhịp «ok — …»), tên nhóm/tài khoản/người là giá trị giả.
set -uo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; FAIL=0
for m in "1. \*\*Lệnh áp" "2. \*\*Số chạy thử" "3. \*\*Sao lưu trước" "4. \*\*Cách lùi" "5. \*\*Lệnh kiểm sau"; do
  grep -q "^$m" "$D/README.md" || { echo "FAIL README thiếu mục: ${m//\\/}"; FAIL=1; }
done
grep -q 'lời riêng của Mạnh' "$D/README.md" || { echo "FAIL README thiếu dòng lời riêng của Mạnh cho khởi động lại gateway"; FAIL=1; }
grep -q 'launchctl kickstart -k gui/\$(id -u)/ai.openclaw.gateway' "$D/README.md" || { echo "FAIL README thiếu lệnh khởi động lại gateway"; FAIL=1; }
grep -qE '05:30–06:30.*14:00–14:45|05:30-06:30.*14:00-14:45' "$D/README.md" || { echo "FAIL README thiếu khung giờ cấm áp"; FAIL=1; }
ca() { local b="$1" ma="$2" chu="$3" out rc
  out=$(bash "$D/kiem-sau.sh" "$D/mau/$b/hook.log" "$D/mau/$b/watchdog.log" "$D/mau/$b/alerts.log"); rc=$?
  if [ "$rc" = "$ma" ] && grep -q "^$chu" <<<"$out"; then echo "PASS $b → $out"; else echo "FAIL $b: mong mã $ma «$chu», được mã $rc «$out»"; FAIL=1; fi; }
ca dat 0 "ĐẠT — 3 dòng post 202 kev=off"
ca con-kev-null 1 "KHÔNG ĐẠT — còn 1 dòng «kev null» mới"
ca hook-cu 1 "KHÔNG ĐẠT — còn 1 dòng post khuôn cũ"
ca khong-tin 1 "KHÔNG ĐẠT — chưa có dòng «post 202 … kev=off» mới"
ca watchdog-cu 1 "KHÔNG ĐẠT — nhịp watchdog cuối không ghi «kev:off (K1)»"
ca watchdog-khong-ok 1 "KHÔNG ĐẠT — nhịp watchdog cuối không «ok»"
ca canh-bao-kev 1 "KHÔNG ĐẠT — tệp cảnh báo watchdog có 1 dòng Kev mới"
[ $FAIL = 0 ] && echo "AP-MAY-THU PASS"
exit $FAIL
