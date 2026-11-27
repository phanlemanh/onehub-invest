#!/bin/bash
# kiem.sh — eval của AC-9 (KEV1). Ba phần:
#  (a) README đủ năm mục áp, mỗi mục có nội dung thật (lệnh hay số), dòng lời riêng Mạnh, lệnh khởi động lại gateway, khung giờ.
#  (b) kiem-sau.sh chấm đúng tám bộ log mẫu viết tay theo khuôn dòng của handler.js (log()) và zalo-watchdog.sh (nhịp «ok — …»).
#  (c) round-trip từ WRITER THẬT: log hook sinh bằng chính handler.js của cây (sinh-log-that.mjs, hộp cát) + dòng nhịp do
#      CHẠY THẬT đoạn L5 của scripts/zalo-watchdog.sh (từ «# L5 — ghi nhịp» tới hết tệp: không có đường KILL/launchctl;
#      ROOT, tệp cảnh báo, HOME trong thư mục tạm; osascript/curl/launchctl/pkill/pgrep là bản giả qua PATH, có ghi sổ
#      gọi) → ĐẠT; cùng đường với handler.js và watchdog của main be765e6a5 (còn Kev) → KHÔNG ĐẠT đúng lý do; hai bản phá
#      watchdog (gán lại KEV_NOTE sau dòng gán; bỏ dòng ghi nhịp) → KHÔNG ĐẠT đúng lý do. Luật 8: KHÔNG chạy trọn watchdog.
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
nhip() { # <zalo-watchdog.sh> → dòng nhịp do CHẠY THẬT đoạn L5 của script trong hộp cát (xem đầu tệp, phần c)
  local wd="$1" hc; hc=$(mktemp -d "$T/l5.XXXXXX")
  mkdir -p "$hc/root/pipeline/logs" "$hc/bin"
  for c in osascript curl launchctl pkill pgrep; do
    { printf '#!/bin/sh\necho "%s $*" >> "%s/goi.log"\n' "$c" "$hc"; [ "$c" = curl ] && printf 'echo 000\n'; } > "$hc/bin/$c"
    chmod +x "$hc/bin/$c"
  done
  awk '/^# L5 — ghi nhịp/{on=1} on' "$wd" > "$hc/l5.sh"
  [ -s "$hc/l5.sh" ] || { echo "KHÔNG-TÁCH-ĐƯỢC-L5"; return; }
  (cd "$hc" && PATH="$hc/bin:$PATH" HOME="$hc" ROOT="$hc/root" ALERT_LOG="$hc/alerts.log" bash "$hc/l5.sh") >/dev/null 2>&1
  if grep -qE '^(launchctl|pkill|pgrep) ' "$hc/goi.log" 2>/dev/null; then echo "FAIL đoạn L5 gọi lệnh tắt/dò gateway: $(head -1 "$hc/goi.log")" >&2; FAIL=1; fi
  cat "$hc/root/pipeline/logs/zalo-watchdog.log" 2>/dev/null || true; }
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
  # Phá trên bản chép watchdog của cây: hai lỗi mà dựng nhịp từ chữ không bắt được (review S4 r1).
  awk '{print} /^KEV_NOTE="kev:off \(K1\)"$/{print "KEV_NOTE=\"kev:ok\""}' "$R/scripts/zalo-watchdog.sh" > "$T/wd-gan-lai.sh"
  nhip "$T/wd-gan-lai.sh" > "$T/wd-gan-lai.log"
  ca_tep "pha-gan-lai-kev-note (KEV_NOTE gán lại sau dòng gán)" "$T/hook-nhanh.log" "$T/wd-gan-lai.log" "$T/alerts.log" 1 "KHÔNG ĐẠT — nhịp watchdog cuối không ghi «kev:off (K1)»"
  awk '/^echo "\$\(date -Iseconds\) ok — /{bo=1} bo && /zalo-watchdog\.log"$/{bo=0; next} !bo' "$R/scripts/zalo-watchdog.sh" > "$T/wd-khong-ghi.sh"
  nhip "$T/wd-khong-ghi.sh" > "$T/wd-khong-ghi.log"
  ca_tep "pha-bo-dong-ghi-nhip (không ghi nhịp «ok —»)" "$T/hook-nhanh.log" "$T/wd-khong-ghi.log" "$T/alerts.log" 1 "KHÔNG ĐẠT — chưa có nhịp watchdog mới sau mốc áp"
else
  echo "FAIL không lấy được handler.js / zalo-watchdog.sh của be765e6a5 (clone nông?) — chiều đỏ round-trip không chạy"; FAIL=1
fi
[ $FAIL = 0 ] && echo "AP-MAY-THU PASS"
exit $FAIL
