#!/bin/bash
# kiem.sh — eval của AC-9 (KEV1). Ba phần:
#  (a) README đủ năm mục áp, mỗi mục có nội dung thật (lệnh hay số), dòng lời riêng Mạnh, lệnh khởi động lại gateway, khung giờ.
#  (b) kiem-sau.sh chấm đúng tám bộ log mẫu viết tay theo khuôn dòng của handler.js (log()) và zalo-watchdog.sh (nhịp «ok — …»).
#  (c) round-trip từ WRITER THẬT: log hook sinh bằng chính handler.js của cây (sinh-log-that.mjs, hộp cát) + dòng nhịp dựng
#      từ chính chuỗi echo của scripts/zalo-watchdog.sh → ĐẠT; cùng đường với handler.js và watchdog của main be765e6a5 (còn Kev)
#      → KHÔNG ĐẠT đúng lý do.
set -uo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$D/../../.." && pwd)"; FAIL=0
R_MD="$D/README.md"
for m in "1. \*\*Lệnh áp" "2. \*\*Số chạy thử" "3. \*\*Sao lưu trước" "4. \*\*Cách lùi" "5. \*\*Lệnh kiểm sau"; do
  grep -q "^$m" "$R_MD" || { echo "FAIL README thiếu mục: ${m//\\/}"; FAIL=1; }
done
muc() { awk -v n="$1" '$0 ~ "^"n"\\. \\*\\*" {on=1; print; next} on && /^[0-9]\. \*\*/ {exit} on {print}' "$R_MD"; }
for n in 1 2 3 4 5; do
  muc $n | grep -qE '`[^`]+`|[0-9]+\.[0-9]{3}' || { echo "FAIL README mục $n không có lệnh hay con số"; FAIL=1; }
done
muc 2 | grep -q '4\.954' && muc 2 | grep -q '5\.103' || { echo "FAIL README mục 2 thiếu số «trước» 4.954 / 5.103"; FAIL=1; }
muc 3 | grep -q 'handler.js.bak-' || { echo "FAIL README mục 3 thiếu lệnh sao lưu hook"; FAIL=1; }
muc 4 | grep -q 'handler.js.bak-' && muc 4 | grep -q 'kickstart' || { echo "FAIL README mục 4 thiếu lệnh chép lại bản sao lưu + khởi động lại"; FAIL=1; }
muc 5 | grep -q 'kiem-sau.sh' || { echo "FAIL README mục 5 thiếu lệnh kiem-sau.sh"; FAIL=1; }
grep -q 'lời riêng của Mạnh' "$R_MD" || { echo "FAIL README thiếu dòng lời riêng của Mạnh cho khởi động lại gateway"; FAIL=1; }
grep -q 'launchctl kickstart -k gui/\$(id -u)/ai.openclaw.gateway' "$R_MD" || { echo "FAIL README thiếu lệnh khởi động lại gateway"; FAIL=1; }
grep -qE '05:30–06:30.*14:00–14:45|05:30-06:30.*14:00-14:45' "$R_MD" || { echo "FAIL README thiếu khung giờ cấm áp"; FAIL=1; }

ca_tep() { local ten="$1" h="$2" w="$3" a="$4" ma="$5" chu="$6" out rc
  out=$(bash "$D/kiem-sau.sh" "$h" "$w" "$a"); rc=$?
  if [ "$rc" = "$ma" ] && grep -q "^$chu" <<<"$out"; then echo "PASS $ten → $out"; else echo "FAIL $ten: mong mã $ma «$chu», được mã $rc «$out»"; FAIL=1; fi; }
ca() { ca_tep "$1" "$D/mau/$1/hook.log" "$D/mau/$1/watchdog.log" "$D/mau/$1/alerts.log" "$2" "$3"; }
ca dat 0 "ĐẠT — 3 dòng post 202 kev=off"
ca con-kev-null 1 "KHÔNG ĐẠT — còn 1 dòng «kev null» mới"
ca hook-cu 1 "KHÔNG ĐẠT — còn 1 dòng post khuôn cũ"
ca khong-tin 1 "KHÔNG ĐẠT — chưa có dòng «post 202 … kev=off» mới"
ca watchdog-cu 1 "KHÔNG ĐẠT — nhịp watchdog cuối không ghi «kev:off (K1)»"
ca watchdog-khong-ok 1 "KHÔNG ĐẠT — nhịp watchdog cuối không «ok»"
ca lockdown-vo 1 "KHÔNG ĐẠT — tệp cảnh báo watchdog có 1 dòng KILL mới"
ca canh-bao-kev 1 "KHÔNG ĐẠT — tệp cảnh báo watchdog có 1 dòng Kev mới"

# (c) round-trip từ writer thật
T=$(mktemp -d "${TMPDIR:-/tmp}/kev1-kiem.XXXXXX"); trap 'rm -rf "$T"' EXIT
nhip() { # <zalo-watchdog.sh> → một dòng nhịp dựng từ chính chuỗi echo «ok — …» và giá trị KEV_NOTE= đầu tiên của script
  local kn tpl; kn=$(sed -n 's/^KEV_NOTE="\(.*\)"$/\1/p' "$1" | head -1)
  tpl=$(grep -E '^echo "\$\(date -Iseconds\) ok — ' "$1" | head -1 | sed -E 's/^echo "\$\(date -Iseconds\) //; s/"[[:space:]]*\\?$//')
  [ -n "$tpl" ] || { echo "KHÔNG-DỰNG-ĐƯỢC"; return; }
  tpl=${tpl//\$KEV_NOTE/$kn}; echo "$(date -Iseconds) ${tpl//\$DB_NOTE/db:ok}"; }
: > "$T/alerts.log"
node "$D/sinh-log-that.mjs" "$R/collector/openclaw/handler.js" "$T/hook-nhanh.log" || { echo "FAIL sinh log thật từ handler.js của cây"; FAIL=1; }
nhip "$R/scripts/zalo-watchdog.sh" > "$T/wd-nhanh.log"
ca_tep "that-nhanh (handler.js + watchdog của cây)" "$T/hook-nhanh.log" "$T/wd-nhanh.log" "$T/alerts.log" 0 "ĐẠT — 3 dòng post 202 kev=off"
if git -C "$R" show be765e6a5:collector/openclaw/handler.js > "$T/handler-main.js" 2>/dev/null \
   && git -C "$R" show be765e6a5:scripts/zalo-watchdog.sh > "$T/wd-main.sh" 2>/dev/null; then
  node "$D/sinh-log-that.mjs" "$T/handler-main.js" "$T/hook-main.log" || { echo "FAIL sinh log thật từ handler.js của main"; FAIL=1; }
  ca_tep "that-main (handler.js của be765e6a5, còn gọi Kev)" "$T/hook-main.log" "$T/wd-nhanh.log" "$T/alerts.log" 1 "KHÔNG ĐẠT — còn 3 dòng «kev null» mới"
  nhip "$T/wd-main.sh" > "$T/wd-main.log"
  ca_tep "that-main-watchdog (zalo-watchdog.sh của be765e6a5)" "$T/hook-nhanh.log" "$T/wd-main.log" "$T/alerts.log" 1 "KHÔNG ĐẠT — nhịp watchdog cuối không ghi «kev:off (K1)»"
else
  echo "FAIL không lấy được handler.js / zalo-watchdog.sh của be765e6a5 (clone nông?) — chiều đỏ round-trip không chạy"; FAIL=1
fi
[ $FAIL = 0 ] && echo "AP-MAY-THU PASS"
exit $FAIL
