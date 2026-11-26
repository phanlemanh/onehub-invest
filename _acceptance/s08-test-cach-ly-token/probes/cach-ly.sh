#!/bin/bash
# cach-ly.sh — ZC19 s08-test-cach-ly-token (AC-1…AC-4). Chạy test S08 ĐÃ BIÊN DỊCH (collector/dist/test, lệnh gọi build trước)
# với HOME + TMPDIR tạm; không đọc, không sửa ~/.oneinvest thật; không mạng (bộ thu S08 nhận base giả trong test).
#   (a) HOME tạm rỗng → 4/4 xanh, không ENOENT tệp token (AC-1); sau lượt 0 thư mục s08-test-* trong TMPDIR tạm (AC-4)
#   (b) HOME tạm có .oneinvest/s08-token.json quyền 000 + JSON hỏng → vẫn 4/4 (AC-2); (b') bản phá (c) dưới HOME ấy → ĐỎ
#   (c) phá trên bản chép: bỏ dòng đặt S08_TOKEN_FILE → ĐỎ, đầu ra nêu s08-token.json (AC-3)
#   (d) phá trên bản chép: dọn bằng rm bất đồng bộ trong «exit» → còn thư mục tạm → ĐỎ «còn thư mục tạm» (AC-4)
# Gốc kho suy từ vị trí tệp này. In «CACH-LY PASS» (mã 0) hoặc từng dòng FAIL (mã 1).
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"; D="$R/collector/dist/test"; G="$D/s08-danh-muc.test.js"; FAIL=0
[ -f "$G" ] || { echo "FAIL chưa có $G — chạy build collector trước"; exit 1; }
T=$(mktemp -d "${TMPDIR:-/tmp}/zc19-probe.XXXXXX"); BAN=()
trap 'chmod -R u+rwx "$T" 2>/dev/null; rm -rf "$T"; for b in "${BAN[@]:-}"; do [ -n "$b" ] && rm -f "$b"; done' EXIT
chay() { # <tệp test> <HOME> <TMPDIR> → in đầu ra; trả mã của node --test
  (cd "$R/collector" && HOME="$2" TMPDIR="$3" node --test "$1" 2>&1); }
so_tam() { find "$1" -maxdepth 1 -name 's08-test-*' | wc -l | tr -d ' '; }
dem() { echo "$1" | sed -n "s/^ℹ $2 //p" | tail -1; }

# (a)
H="$T/home-a"; X="$T/tmp-a"; mkdir -p "$H" "$X"
out=$(chay "$G" "$H" "$X"); rc=$?
if [ $rc = 0 ] && [ "$(dem "$out" pass)" = 4 ] && [ "$(dem "$out" fail)" = 0 ] && ! grep -q 'ENOENT' <<<"$out"; then echo "PASS (a) HOME tạm rỗng → 4/4, không ENOENT"; else echo "FAIL (a) HOME tạm rỗng: mã $rc, pass $(dem "$out" pass), fail $(dem "$out" fail)$(grep -q ENOENT <<<"$out" && echo ', có ENOENT')"; FAIL=1; fi
n=$(so_tam "$X"); if [ "$n" = 0 ]; then echo "PASS (a) dọn thư mục token tạm: 0 thư mục s08-test-* sau lượt"; else echo "FAIL (a) còn thư mục tạm: $n thư mục s08-test-* sau lượt"; FAIL=1; fi

# (b) token ở HOME: quyền 000 VÀ nội dung JSON hỏng — đọc nó thì đỏ (EACCES; dưới root thì lỗi phân tích JSON)
HB="$T/home-b"; X="$T/tmp-b"; mkdir -p "$HB/.oneinvest" "$X"; printf 'KHONG-DUOC-DOC{' > "$HB/.oneinvest/s08-token.json"; chmod 000 "$HB/.oneinvest/s08-token.json"
if cat "$HB/.oneinvest/s08-token.json" >/dev/null 2>&1; then echo "FAIL (b) chạy bằng quyền đọc được tệp 000 (root?) — quyền 000 không chặn; chỉ còn chốt JSON hỏng"; FAIL=1; fi
out=$(chay "$G" "$HB" "$X"); rc=$?
if [ $rc = 0 ] && [ "$(dem "$out" pass)" = 4 ] && ! grep -qE 'EACCES|KHONG-DUOC-DOC|Unexpected token|JSON' <<<"$out"; then echo "PASS (b) token ở HOME quyền 000 + JSON hỏng → vẫn 4/4, không chạm tệp"; else echo "FAIL (b) token ở HOME bị đọc: mã $rc, pass $(dem "$out" pass)$(grep -q EACCES <<<"$out" && echo ', có EACCES')"; FAIL=1; fi

# (c) phá: bỏ dòng đặt S08_TOKEN_FILE (token giả vẫn ghi vào thư mục tạm, nhưng mô-đun không được chỉ tới nó)
B="$D/.zc19-pha-c-$$.test.js"; BAN+=("$B")
python3 - "$G" "$B" <<'PY'
import sys; s=open(sys.argv[1]).read()
o='process.env.S08_TOKEN_FILE = join(thuTamToken, "s08-token.json");\nawait writeFile(process.env.S08_TOKEN_FILE,'
n='delete process.env.S08_TOKEN_FILE;\nawait writeFile(join(thuTamToken, "s08-token.json"),'
assert o in s, "mẫu phá (c) lệch mã"; open(sys.argv[2],'w').write(s.replace(o,n))
PY
[ -f "$B" ] || { echo "FAIL (c) không dựng được bản phá — mẫu lệch mã"; FAIL=1; }
H="$T/home-c"; X="$T/tmp-c"; mkdir -p "$H" "$X"
out=$(chay "$B" "$H" "$X"); rc=$?
if [ $rc != 0 ] && grep -q 's08-token.json' <<<"$out" && [ "$(dem "$out" fail)" -ge 1 ] 2>/dev/null; then echo "PASS (c) phá «bỏ đặt S08_TOKEN_FILE» → ĐỎ, đầu ra nêu s08-token.json"; else echo "FAIL (c) phá «bỏ đặt S08_TOKEN_FILE» không làm đỏ đúng lý do: mã $rc, fail $(dem "$out" fail)"; FAIL=1; fi

# (b') đối chứng của (b): bản phá (c) chạy dưới cùng HOME token 000 + JSON hỏng → ĐỎ (đọc tệp ở HOME bị chặn)
X="$T/tmp-b2"; mkdir -p "$X"
out=$(chay "$B" "$HB" "$X"); rc=$?
if [ $rc != 0 ] && grep -qE 'EACCES|Unexpected token|JSON' <<<"$out"; then echo "PASS (b') bản phá (c) dưới HOME token 000 + JSON hỏng → ĐỎ (EACCES hoặc lỗi JSON) — chốt (b) phân biệt được"; else echo "FAIL (b') bản phá (c) dưới HOME token 000 không đỏ đúng lý do: mã $rc"; FAIL=1; fi

# (d) phá: dọn bất đồng bộ trong «exit»
B="$D/.zc19-pha-d-$$.test.js"; BAN+=("$B")
python3 - "$G" "$B" <<'PY'
import sys; s=open(sys.argv[1]).read()
o='rmSync(thuTamToken, { recursive: true, force: true });'
n='import("node:fs/promises").then((m) => m.rm(thuTamToken, { recursive: true, force: true }));'
assert o in s, "mẫu phá (d) lệch mã"; open(sys.argv[2],'w').write(s.replace(o,n))
PY
H="$T/home-d"; X="$T/tmp-d"; mkdir -p "$H" "$X"
out=$(chay "$B" "$H" "$X"); n=$(so_tam "$X")
if [ "$n" -ge 1 ]; then echo "PASS (d) phá «dọn bất đồng bộ» → còn thư mục tạm ($n) — thước dọn đỏ đúng lý do"; else echo "FAIL (d) phá «dọn bất đồng bộ» mà không còn thư mục tạm — thước dọn không phân biệt"; FAIL=1; fi

[ $FAIL = 0 ] && echo "CACH-LY PASS"
exit $FAIL
