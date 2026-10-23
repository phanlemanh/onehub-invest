#!/bin/bash
# Phép thử phản biện (verify vòng 1) — CHỈ gọi hàm scan_new_lines trích nguyên văn
# từ scripts/zalo-watchdog.sh, trên tệp giả trong thư mục tạm. Không chạy watchdog,
# không launchctl/pkill, không đọc log thật.
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"
T=$(mktemp -d "${TMPDIR:-/tmp}/acc-zc3-probe-XXXXXX")
trap 'rm -rf "$T"' EXIT
awk '/^scan_new_lines\(\) \{/{p=1} p{print} p&&/^}$/{exit}' "$R/scripts/zalo-watchdog.sh" > "$T/fn.sh"
source "$T/fn.sh"
TURN="2026-10-23T00:00:01 [auto-reply/agent-turn-timing] turn=1"
B="2026-10-23T00:00:02 [zalouser] message received"
has() { grep -q "agent-turn-timing" <<<"$1" && echo "BẮT" || echo "SÓT"; }

echo "--- P1 xoay ngày: turn ghi vào log NGÀY CŨ sau lượt quét cuối (23:55→00:00), lượt kế quét log ngày mới"
d1="$T/openclaw-2026-10-22.log"; d2="$T/openclaw-2026-10-23.log"; mk="$T/m1"
printf '%s\n%s\n' "$B" "$B" > "$d1"; scan_new_lines "$d1" "$mk" >/dev/null   # khởi tạo
printf '%s\n' "$B" >> "$d1"; scan_new_lines "$d1" "$mk" >/dev/null           # lượt 23:55
printf '%s\n' "$TURN" >> "$d1"                                                 # 23:58 turn vào log cũ
printf '%s\n' "$B" > "$d2"                                                     # 00:00 log mới
out=$(scan_new_lines "$d2" "$mk"); echo "P1 kết quả: $(has "$out") (in $(grep -c . <<<"$out") dòng của ngày mới)"

echo "--- P2 truncate rồi lớn lại VƯỢT số dòng cũ trong cùng 5′ (cùng inode)"
f="$T/gw.log"; mk="$T/m2"
for i in 1 2 3; do printf '%s\n' "$B"; done > "$f"; scan_new_lines "$f" "$mk" >/dev/null
ino1=$(stat -f %i "$f")
{ printf '%s\n' "$TURN"; for i in 1 2 3 4; do printf '%s\n' "$B"; done; } > "$f"     # ghi đè giữ inode, 5 dòng > 3
out=$(scan_new_lines "$f" "$mk"); echo "P2 inode $( [ "$ino1" = "$(stat -f %i "$f")" ] && echo giữ || echo đổi) · kết quả: $(has "$out") (in $(grep -c . <<<"$out") dòng)"

echo "--- P3 marker hỏng trường số dòng (cùng đường dẫn + inode)"
f="$T/p3.log"; mk="$T/m3"
printf '%s\n' "$B" > "$f"; printf '%s\n' "$TURN" >> "$f"
echo "$f:$(stat -f %i "$f"):" > "$mk"
out=$(scan_new_lines "$f" "$mk" 2>"$T/err"); echo "P3 'đường_dẫn:inode:' → $(has "$out"); stderr: $(head -1 "$T/err" | sed 's/.*: //')"
echo "P3 marker sau lượt: $(sed "s|$T/||" "$mk")"
out=$(scan_new_lines "$f" "$mk"); echo "P3 lượt kế (marker đã lành): $( [ -z "$out" ] && echo 'không in gì — turn của lượt trước không bao giờ được quét' || echo in)"

echo "--- P4 dòng cuối chưa có newline (đang ghi dở)"
f="$T/p4.log"; mk="$T/m4"
printf '%s\n' "$B" > "$f"; scan_new_lines "$f" "$mk" >/dev/null
printf '%s' "$TURN" >> "$f"
o1=$(scan_new_lines "$f" "$mk"); printf '\n' >> "$f"; o2=$(scan_new_lines "$f" "$mk")
echo "P4 lượt dở: $(has "$o1") · lượt sau khi xong dòng: $(has "$o2")"

echo "--- P5 L4a: grep -c khi 0 dòng drop"
GW_NEW="$B"
DROP_N=$(echo "$GW_NEW" | grep -c "drop no mention" || true)
echo "P5 DROP_N='$DROP_N' · so ngưỡng: $( [ "${DROP_N:-0}" -ge 20 ] 2>/dev/null && echo WARN || echo 'không WARN, không lỗi')"
