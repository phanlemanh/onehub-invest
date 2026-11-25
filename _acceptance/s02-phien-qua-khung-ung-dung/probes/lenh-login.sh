#!/usr/bin/env bash
# Phép đo AC-9 (hồ sơ s02-phien-qua-khung-ung-dung): lệnh login của CLI bộ thu — đo ĐEN-TRẮNG qua chính
# tệp dist/cli.js, Chrome thay bằng /usr/bin/true để không mở cửa sổ nào, profile là thư mục tạm:
#  (i)  login đúng nguồn → thoát 0, in hướng dẫn, KHÔNG in Usage, KHÔNG rơi sang nhánh thu;
#  (ii) không mở được Chrome → thoát 1, có lý do ở stderr, không in Usage.
# Nguồn = bộ thu duy nhất khai hàm login (không ghi tên tệp vào phép đo).
# Chiều đỏ: bản chép của dist/cli.js với lệnh login RƠI SANG nhánh lệnh kế (đúng lỗi P0 review độc lập 25/11
# tìm ra) → (i) phải đỏ với thông điệp ghim. Bản chép nằm cạnh dist/cli.js (để import tương đối còn chạy),
# được xoá trước khi thoát.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/collector" || exit 2
CLI="dist/cli.js"
[ -f "$CLI" ] || { echo "ĐỎ: thiếu dist/cli.js — build collector trước"; echo "ĐỎ"; exit 2; }
[ -x /usr/bin/true ] || { echo "ĐỎ: thiếu /usr/bin/true để giả Chrome"; echo "ĐỎ"; exit 2; }
F="$(grep -lE '^ +login: ' dist/collectors/*.js | head -1)"
[ -n "$F" ] || { echo "ĐỎ: không thấy bộ thu nào khai hàm login trong dist/collectors"; echo "ĐỎ"; exit 2; }
ID="$(basename "$F" .js)"
M_ROI="ĐỎ: lệnh login không dừng sau khi mở cửa sổ (thoát khác 0, thiếu hướng dẫn, hoặc in Usage)"
M_LOI="ĐỎ: không mở được Chrome mà CLI không báo đúng (thoát 1 kèm lý do, không in Usage)"

do_tep() { # $1 = tệp CLI, $2 = mã nguồn
  local cli="$1" id="$2" loi=0 tmp out rc
  tmp="$(mktemp -d)"
  out="$(AIRDNA_CHROME_BIN=/usr/bin/true AIRDNA_PROFILE_DIR="$tmp/" node "$cli" login --source "$id" 2>/dev/null)"; rc=$?
  rm -rf "$tmp"
  if [ "$rc" -eq 0 ] && grep -q 'profile bộ thu' <<<"$out" && ! grep -qE 'one-invest-collector|Usage:' <<<"$out"; then
    echo "đạt: login mở đúng profile rồi dừng — thoát 0, in hướng dẫn, không in Usage"
  else echo "$M_ROI (mã thoát $rc)"; loi=1; fi
  out="$(AIRDNA_CHROME_BIN=/khong-ton-at/chrome AIRDNA_PROFILE_DIR=/tmp/khong-dung/ node "$cli" login --source "$id" 2>&1)"; rc=$?
  if [ "$rc" -eq 1 ] && [ -n "$out" ] && ! grep -qE 'one-invest-collector|Usage:' <<<"$out"; then
    echo "đạt: không mở được Chrome → thoát 1 có lý do, không in Usage"
  else echo "$M_LOI (mã thoát $rc)"; loi=1; fi
  return $loi
}

MUT="dist/.dot-bien-cli.js"
T="$(mktemp -d)"; trap 'rm -rf "$T" "$ROOT/collector/$MUT"' EXIT
echo "== bản thật"; do_tep "$CLI" "$ID"; RC=$?

# bản đột biến: tách `else if (command === "collect")` thành `if` đứng riêng → sau nhánh login mã đi tiếp
sed 's/^else if (command === "collect") {$/if (command === "collect") {/' "$CLI" > "$MUT"
if cmp -s "$CLI" "$MUT"; then echo "ĐỎ: không thấy điểm đột biến trong dist/cli.js — phép đo lệch cây mã"; echo "ĐỎ"; exit 1; fi
if do_tep "$MUT" "$ID" >"$T/out" 2>&1; then cat "$T/out"; echo "ĐỎ: thước mù — bản login-rơi-sang-nhánh-kế vẫn xanh"; RC=1
else grep -qF "$M_ROI" "$T/out" && echo "đạt: chiều đỏ (login rơi sang nhánh lệnh kế) bắt đúng: $M_ROI" || { cat "$T/out"; echo "ĐỎ: chiều đỏ sai thông điệp"; RC=1; }
fi
rm -f "$MUT"
[ $RC -eq 0 ] && echo "XANH" || echo "ĐỎ"
exit $RC
