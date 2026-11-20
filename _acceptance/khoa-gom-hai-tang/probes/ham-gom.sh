#!/usr/bin/env bash
# GT5 E2, E3, E4, E6, E8: chạy test hàm thuần (bộ tìm mã, tập phân khu, gom hai tầng) rồi BẢY bản đột biến của gom-tin-hai-tang.mjs —
# mỗi bản phải làm đỏ đúng ô của nó (thông điệp ghim tên ô); bản nào lọt → «thước mù», thoát 1. Tệp gốc được chép lại và băm kiểm
# sau mỗi đột biến (trap EXIT), không để lại thay đổi trong cây.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT/pipeline"
F=lib/gom-tin-hai-tang.mjs; BAK="$(mktemp)"; cp "$F" "$BAK"; H0="$(shasum -a 256 "$F" | cut -d' ' -f1)"
tra_lai() { cp "$BAK" "$F"; [ "$(shasum -a 256 "$F" | cut -d' ' -f1)" = "$H0" ] || { echo "ĐỎ: không trả lại được $F"; exit 3; }; }
trap 'tra_lai; rm -f "$BAK"' EXIT
RC=0
echo "== test hàm thuần"
if node --test scripts/gom-tin-ma.test.mjs scripts/gom-tin-phan-khu.test.mjs scripts/gom-tin-hai-tang.test.mjs > /tmp/gt5-ham.$$ 2>&1; then
  grep -E "^ℹ (tests|pass|fail)" /tmp/gt5-ham.$$; echo "đạt: test hàm thuần"
else grep -E "^✖ |^ℹ (pass|fail)" /tmp/gt5-ham.$$; echo "ĐỎ: test hàm thuần"; RC=1; fi
dot_bien() { # $1 tên, $2 chuỗi gốc, $3 chuỗi thay, $4 tên ô phải đỏ
  tra_lai
  grep -qF -- "$2" "$F" || { echo "ĐỎ: không tìm thấy chỗ đột biến «$1» — thước lệch mã"; RC=1; return; }
  python3 - "$F" "$2" "$3" <<'PY'
import sys; p,a,b=sys.argv[1:4]; t=open(p).read(); open(p,"w").write(t.replace(a,b,1))
PY
  node --test scripts/gom-tin-hai-tang.test.mjs > /tmp/gt5-dot.$$ 2>&1
  if grep -E "^✖ " /tmp/gt5-dot.$$ | grep -qF -- "$4"; then echo "đạt: đột biến «$1» bị bắt ở ô «$4»"
  else echo "ĐỎ: thước mù — đột biến «$1» không làm đỏ ô «$4»"; grep -E "^✖ " /tmp/gt5-dot.$$ | head -3; RC=1; fi
}
dot_bien "gộp khác người cùng chữ" 'const k1 = nguoi ? `${nguoi}|${chu}` : `bai:${it.post.post_id}`;' 'const k1 = chu;' "GT5-AC-2 ô 4"
dot_bien "bỏ người khỏi khoá tầng hai" '? [b.nguoi, gt(b.f.loai)' '? ["*", gt(b.f.loai)' "GT5-AC-3 khác đúng trường người"
dot_bien "ô trống bằng ô trống ở tầng hai (lỗi mẫu một)" 'const k2 = du(b.f) ? [' 'const k2 = true ? [' "GT5-AC-4 hai bản chữ cùng thiếu trường"
dot_bien "cho bắc cầu (nhập khi có từ một ứng viên)" 'if (ung.length === 1) t.vao = ung[0];' 'if (ung.length >= 1) t.vao = ung[0];' "GT5-AC-4 hai ứng viên"
dot_bien "lối B: mẫu bỏ tập trường thiếu" '...TRUONG.map((k) => gt(t.f[k]))].join("|");' '].join("|");' "GT5-AC-4 B tập trường thiếu khác nhau"
dot_bien "lối B: bỏ cửa sổ 7 ngày" 'if (ganNhau(nhom[i], nhom[j]) && giongCap' 'if (giongCap' "GT5-AC-4 B ngoài cửa sổ"
dot_bien "bỏ chặn dạng bài" 'if (it.dangBai != null && it.dangBai !== "mot_can")' 'if (false)' "GT5-AC-8 bài rổ hàng"
rm -f /tmp/gt5-ham.$$ /tmp/gt5-dot.$$
[ $RC = 0 ] && echo "XANH: ham-gom" || echo "ĐỎ: ham-gom"
exit $RC
