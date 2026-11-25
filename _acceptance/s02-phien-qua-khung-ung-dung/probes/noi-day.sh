#!/usr/bin/env bash
# Phép đo AC-3 (hồ sơ s02-phien-qua-khung-ung-dung), đo TĨNH trên thân mã của bộ thu S02 (tệp duy nhất trong
# collector/src/collectors/ xuất docExpAppToken — không ghi tên tệp vào phép đo):
#  (i)  mọi câu `return token;` của hàm nạp một đường dẫn (moMotDuong) nằm trên dòng có điều kiện duDungKhong(
#       — không token nào rời hàm nếu không còn hạn quá lề (và nếu là đúng token vừa bị từ chối);
#  (ii) không còn lời chờ cứng `waitForTimeout(`;
#  (iii) mọi lời `page.goto(` chỉ trỏ về APP_ORIGIN + duong (duong đi từ danh sách ứng viên) hoặc about:blank.
# Chiều đỏ trên bản chép của CHÍNH tệp: (a) đổi điều kiện thành `if (token)` · (b) cấy một câu `return token;`
# trước khi kiểm · (c) cấy lại lời chờ cứng · (d) cấy một lời page.goto trỏ chỗ khác — mỗi bản phải ĐỎ với đúng
# thông điệp ghim.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
F="$(grep -l "export function docExpAppToken" "$ROOT"/collector/src/collectors/*.ts)"
[ "$(printf "%s\n" "$F" | grep -c .)" = 1 ] || { echo "ĐỎ: cần đúng một tệp bộ thu S02 xuất docExpAppToken"; exit 2; }
M_KIEM="ĐỎ: hàm nạp có câu return token không đi qua kiểm lề"
M_CHO="ĐỎ: bộ thu còn lời chờ cứng waitForTimeout"
M_GOTO="ĐỎ: có lời page.goto trỏ ngoài APP_ORIGIN + duong hoặc about:blank"

do_tep() {
  local f="$1" loi=0
  # thân hàm nạp một đường dẫn: từ dòng khai báo tới dòng đóng `  };` đầu tiên
  local than
  than="$(awk '/const moMotDuong/{on=1} on{print} on&&/^  \};/{exit}' "$f")"
  [ -n "$than" ] || { echo "ĐỎ: không thấy hàm nạp một đường dẫn (moMotDuong)"; return 1; }
  local n_tra=0 n_dung=0
  while IFS= read -r d; do
    n_tra=$((n_tra+1))
    printf '%s' "$d" | grep -q 'duDungKhong(' && n_dung=$((n_dung+1))
  done <<<"$(grep -E '(^|[^a-zA-Z])return token;' <<<"$than")"
  if [ "$n_tra" -ge 1 ] && [ "$n_tra" = "$n_dung" ]; then
    echo "đạt: $n_tra câu return token của hàm nạp đều đi qua kiểm lề"
  else echo "$M_KIEM ($n_dung/$n_tra câu đi qua kiểm lề)"; loi=1; fi
  if grep -q 'waitForTimeout(' "$f"; then echo "$M_CHO"; loi=1
  else echo "đạt: không còn lời chờ cứng"; fi
  local n_goto n_goto_dung
  n_goto="$(grep -o 'page\.goto(' "$f" | wc -l | tr -d ' ')"
  n_goto_dung="$(grep -oE 'page\.goto\((APP_ORIGIN \+ duong,|"about:blank")' "$f" | wc -l | tr -d ' ')"
  if [ "$n_goto" -ge 2 ] && [ "$n_goto" = "$n_goto_dung" ]; then
    echo "đạt: $n_goto lời page.goto đều trỏ APP_ORIGIN + duong hoặc about:blank"
  else echo "$M_GOTO ($n_goto_dung/$n_goto lời đúng chỗ)"; loi=1; fi
  return $loi
}

echo "== bản thật"; do_tep "$F"; RC=$?
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
pha() { # $1 tên bản đột biến, $2 tệp chép, $3 thông điệp phải có
  if do_tep "$2" >"$T/out" 2>&1; then cat "$T/out"; echo "ĐỎ: thước mù — bản $1 vẫn xanh"; RC=1; return; fi
  grep -qF "$3" "$T/out" && echo "đạt: chiều đỏ ($1) bắt đúng: $3" || { cat "$T/out"; echo "ĐỎ: chiều đỏ ($1) sai thông điệp"; RC=1; }
}
sed 's/if (duDungKhong(token) \&\& token !== loaiBo) return token;/if (token) return token;/' "$F" > "$T/a.ts"; pha "điều kiện bò" "$T/a.ts" "$M_KIEM"
awk '{print} /const token = await docToken\(\);/{print "        return token;"}' "$F" > "$T/b.ts"; pha "trả sớm" "$T/b.ts" "$M_KIEM"
awk '{print} /const token = await docToken\(\);/{print "        await page.waitForTimeout(6_000);"}' "$F" > "$T/c.ts"; pha "chờ cứng" "$T/c.ts" "$M_CHO"
awk '{print} /const token = await docToken\(\);/{print "        await page.goto(\"https://vi-du.invalid/\");"}' "$F" > "$T/d.ts"; pha "goto chỗ khác" "$T/d.ts" "$M_GOTO"
[ $RC -eq 0 ] && echo "XANH" || echo "ĐỎ"
exit $RC
