#!/usr/bin/env bash
# AC-5 — răng có thật: trên bản chép tạm (clone kho tiêu thụ + clone kho riêng cạnh nhau), năm đột biến phải đỏ;
# và khi máy không có kho riêng (như CI) răng phủ KHÔNG đỏ mà cảnh báo «không đọc được ở đây».
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
git clone -q "$ROOT" "$T/onehub-invest" && git clone -q "$GOC" "$T/onehub-invest-tri-thuc" || { echo "DOT-BIEN FAIL clone"; exit 1; }
C="$T/onehub-invest"; K="$T/onehub-invest-tri-thuc"; PV=docs/plan/pham-vi-cam-mau-2310.md
phu() { (cd "$C" && node "$AG/scripts/cat-luot.mjs" --root . --pham-vi "$PV" --lo-trinh "$LT" 2>&1); }
kiem() { (cd "$C" && node "$AG/scripts/tri-thuc.mjs" --root . --kiem 2>&1); }
cam() { git -C "$C" -c user.email=t@t -c user.name=t commit -qam t; }
r="$(phu)"; rc=$?; [ $rc -eq 0 ] && ! echo "$r" | grep -q '^lỗi' && ok "đối chứng: răng phủ bản nguyên vẹn xanh" || { bad "đối chứng đỏ: $r"; echo "DOT-BIEN FAIL"; exit 1; }
r="$(kiem)"; [ $? -eq 0 ] && ok "đối chứng: lint bản nguyên vẹn xanh" || { bad "đối chứng lint đỏ: $r"; echo "DOT-BIEN FAIL"; exit 1; }
cp "$C/$PV" "$T/pv.bak"
# M1 băm lệch
sed -i '' -E 's/^(nguon: .*#)[0-9a-f]{40}$/\10000000000000000000000000000000000000000/' "$C/$PV"; cam
r="$(phu)"; [ $? -ne 0 ] && echo "$r" | grep -q 'nguon-lech' && ok "M1 băm lệch → đỏ [nguon-lech]" || bad "M1 không đỏ"
# M2 chữ tự do
cp "$T/pv.bak" "$C/$PV"; sed -i '' 's/^nguon: .*/nguon: audit hiện trạng 23\/10, Mạnh đồng ý/' "$C/$PV"; cam
r="$(phu)"; [ $? -ne 0 ] && echo "$r" | grep -q 'nguon-khong-phai-trang' && ok "M2 nguồn chữ tự do → đỏ [nguon-khong-phai-trang]" || bad "M2 không đỏ"
# M3 trỏ raw thay vì trang wiki
cp "$T/pv.bak" "$C/$PV"; h="$(git -C "$K" hash-object raw/2026-10-26-audit-hien-trang/nguon.md)"
sed -i '' "s#^nguon: .*#nguon: onehub-invest-tri-thuc:raw/2026-10-26-audit-hien-trang/nguon.md\#$h#" "$C/$PV"; cam
r="$(phu)"; [ $? -ne 0 ] && echo "$r" | grep -q 'không phải trang wiki' && ok "M3 trỏ raw → đỏ (không phải trang wiki)" || bad "M3 không đỏ"
cp "$T/pv.bak" "$C/$PV"; cam
# M4 raw bị sửa một byte
f="$K/raw/2026-10-26-audit-hien-trang/2026-10-23-hien-trang-va-lo-trinh.md"; cp "$f" "$T/raw.bak"; printf 'x' >> "$f"
r="$(kiem)"; [ $? -eq 1 ] && echo "$r" | grep -q '\[raw-bi-sua\]' && ok "M4 raw sửa một byte → lint đỏ [raw-bi-sua]" || bad "M4 không đỏ"
cp "$T/raw.bak" "$f"
# M5 trang đợt mất một mã
p="$K/wiki/dot/cam-mau-2310.md"; cp "$p" "$T/trang.bak"; sed -i '' 's/^ma: \[A0.2, /ma: [/' "$p"
r="$(kiem)"; [ $? -eq 1 ] && echo "$r" | grep -q '\[ma-khong-co-trang\].*A0.2' && ok "M5 trang đợt bỏ mã A0.2 → lint đỏ [ma-khong-co-trang]" || bad "M5 không đỏ"
cp "$T/trang.bak" "$p"
# N1 máy không có kho riêng (như CI): răng phủ không đỏ, chỉ cảnh báo; lint thoát 3
mv "$K" "$T/vang"
r="$(phu)"; rc=$?; [ $rc -eq 0 ] && echo "$r" | grep -q 'không đọc được ở đây' && ok "N1 không có kho riêng → răng phủ rc 0, cảnh báo «không đọc được ở đây»" || bad "N1 rc=$rc"
r="$(kiem)"; [ $? -eq 3 ] && ok "N1 lint thoát 3 (không đọc được ở đây), kèm lệnh clone" || bad "N1 lint không thoát 3"
[ $fail -eq 0 ] && echo "DOT-BIEN OK" || { echo "DOT-BIEN FAIL"; exit 1; }
