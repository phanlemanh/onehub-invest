#!/usr/bin/env bash
# Phép đo AC-2 và AC-5 (hồ sơ s02-luot-loi-sach-va-kiem-han-token), đo TĨNH trên thân mã của bộ thu S02
# (tệp duy nhất trong collector/src/collectors/ xuất kiemAppToken — không ghi tên tệp vào phép đo):
#  AC-5: mọi câu `return` của hàm appToken (ngoài callback page.evaluate chạy trong trình duyệt) đứng SAU lời
#        gọi kiemAppToken(token); không còn dòng log «token OK (${token.length} chars)» cũ không kiểm hạn.
#  AC-2: trong khối `if (res.status === 401) {` sau refresh, dòng AUTH FAIL [S02] đứng trước throw «401 sau
#        refresh token»; đúng một tệp bộ thu có dòng AUTH FAIL [S02].
# Chiều đỏ trên bản chép của CHÍNH tệp: (a) bỏ lời gọi kiemAppToken · (b) cấy đường trả sớm trước lời gọi ·
# (c) cấy lại dòng log cũ · (d) bỏ dòng AUTH FAIL — mỗi bản phải ĐỎ với đúng thông điệp ghim.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
F="$(grep -l "export function kiemAppToken" "$ROOT"/collector/src/collectors/*.ts)"
[ "$(printf "%s\n" "$F" | grep -c .)" = 1 ] || { echo "ĐỎ: cần đúng một tệp bộ thu S02 xuất kiemAppToken"; exit 2; }
M_KIEM="ĐỎ: appToken có câu return không đi qua kiemAppToken"
M_CU="ĐỎ: appToken còn dòng log 'token OK' cũ không kiểm hạn"
M_AUTH="ĐỎ: nhánh 401 sau refresh thiếu AUTH FAIL [S02] trước throw"
do_tep() {
  local f="$1" loi=0
  local than
  # thân appToken, bỏ callback page.evaluate (chạy trong trình duyệt, return "" của nó không phải lối ra của hàm)
  than="$(awk '/^async function appToken\(/{on=1} on{print} on&&/^}/{exit}' "$f" \
        | awk '/page\.evaluate\(/{skip=1; next} skip&&/^    \}\);/{skip=0; next} !skip{print}')"
  [ -n "$than" ] || { echo "ĐỎ: không thấy hàm appToken"; return 1; }
  local dong_kiem
  dong_kiem="$(grep -n 'kiemAppToken(token)' <<<"$than" | head -1 | cut -d: -f1)"
  local tra; tra="$(grep -nE '(^|[^a-zA-Z])return( |;)' <<<"$than" | cut -d: -f1 | tr '\n' ' ')"
  local sai=0 n_tra=0
  for d in $tra; do n_tra=$((n_tra+1)); { [ -n "$dong_kiem" ] && [ "$d" -gt "$dong_kiem" ]; } || sai=1; done
  if [ -n "$dong_kiem" ] && [ $sai = 0 ] && [ $n_tra -ge 1 ]; then
    echo "đạt: $n_tra câu return của appToken đều sau kiemAppToken (dòng $dong_kiem)"
  else echo "$M_KIEM (kiem=${dong_kiem:-vắng}, return ở: ${tra:-không})"; loi=1; fi
  if grep -q 'token OK (\${token.length} chars)' "$f"; then echo "$M_CU"; loi=1
  else echo "đạt: không còn dòng 'token OK' cũ"; fi
  local khoi
  khoi="$(awk '/if \(res.status === 401\) \{/{on=1} on{print} on&&/^      \}/{exit}' "$f")"
  local la lt
  la="$(grep -n 'AUTH FAIL \[S02\]' <<<"$khoi" | head -1 | cut -d: -f1)"
  lt="$(grep -n "throw new Error(\`401 sau refresh token" <<<"$khoi" | head -1 | cut -d: -f1)"
  if [ -n "$la" ] && [ -n "$lt" ] && [ "$la" -lt "$lt" ]; then echo "đạt: nhánh 401 sau refresh ghi AUTH FAIL [S02] trước khi ném"
  else echo "$M_AUTH"; loi=1; fi
  return $loi
}
echo "== bản thật"; do_tep "$F"; RC=$?
N_AUTH="$(grep -l 'AUTH FAIL \[S02\]' "$ROOT"/collector/src/collectors/*.ts | grep -c .)"
[ "$N_AUTH" = 1 ] && echo "đạt: đúng một tệp bộ thu có dòng AUTH FAIL [S02]" || { echo "ĐỎ: $N_AUTH tệp bộ thu có dòng AUTH FAIL [S02] (cần 1)"; RC=1; }
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
pha() { # $1 tên, $2 tệp chép, $3 thông điệp phải có
  if do_tep "$2" >"$T/out" 2>&1; then cat "$T/out"; echo "ĐỎ: thước mù — bản $1 vẫn xanh"; RC=1; return; fi
  grep -qF "$3" "$T/out" && echo "đạt: chiều đỏ ($1) bắt đúng: $3" || { cat "$T/out"; echo "ĐỎ: chiều đỏ ($1) sai thông điệp"; RC=1; }
}
grep -v 'const logDong = kiemAppToken(token);' "$F" > "$T/a.ts"; pha "bỏ kiemAppToken" "$T/a.ts" "$M_KIEM"
awk '{print} /const token = await page\.evaluate/{f=1} f&&/^    \}\);/{print "    if (process.env.TOKEN_CACHE) return token;"; f=0}' "$F" > "$T/b.ts"; pha "đường trả sớm" "$T/b.ts" "$M_KIEM"
awk '{print} /const logDong = kiemAppToken\(token\);/{print "    log(`token OK (${token.length} chars)`);"}' "$F" > "$T/c.ts"; pha "dòng log cũ" "$T/c.ts" "$M_CU"
grep -v 'AUTH FAIL \[S02\]' "$F" > "$T/d.ts"; pha "bỏ AUTH FAIL" "$T/d.ts" "$M_AUTH"
[ $RC -eq 0 ] && echo "XANH" || echo "ĐỎ"
exit $RC
