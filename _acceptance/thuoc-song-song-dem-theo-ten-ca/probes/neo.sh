#!/bin/bash
# E6 (thuoc-song-song-dem-theo-ten-ca, AC-5): pham-vi.sh của app-test-chiu-song-song neo đúng khoảng commit nhánh gốc.
#  1. tập dòng «ok …» của pham-vi.sh bằng đúng git diff --name-only a86804f7 2070958c;
#  2. bản chép tạm đổi commit neo thành sha không có → thoát 2 «KHONG CO COMMIT NEO»;
#  3. hai commit neo là tổ tiên của origin/main (còn sau khi nhánh gốc bị xoá), đối chứng bằng một commit lơ lửng.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
PV=_acceptance/app-test-chiu-song-song/probes/pham-vi.sh
BASE=a86804f700bbad07462d47a2b0d6500a3ecfa37e
HEAD_NEO=2070958c64212cdc401550b74b2558efed78efcf
grep -q "^base=$BASE$" "$PV" && grep -q "^head=$HEAD_NEO$" "$PV" || { echo "PHAM-VI KHONG NEO $BASE..$HEAD_NEO"; exit 1; }
bad=0

out=$(bash "$PV"); ma=$?
[ "$ma" -eq 0 ] || { echo "$out"; echo "PHAM-VI THOAT $ma"; exit 1; }
co=$(printf '%s\n' "$out" | sed -n 's/^ok //p' | sort)
can=$(git diff --name-only "$BASE" "$HEAD_NEO" | sort)
if [ "$co" = "$can" ]; then echo "# danh sách ok bằng git diff $BASE..$HEAD_NEO ($(printf '%s\n' "$can" | grep -c .) tệp)"
else echo "DANH SACH LECH"; diff <(printf '%s\n' "$can") <(printf '%s\n' "$co"); bad=1; fi

# Bản chép tạm ở .acceptance-runs (ba cấp dưới gốc kho → ROOT của bản chép vẫn là gốc kho), không chạm hồ sơ đã ký.
TAM_DIR=".acceptance-runs/thuoc-song-song-dem-theo-ten-ca/neo-$$"
mkdir -p "$TAM_DIR"; trap 'rm -rf "$TAM_DIR"' EXIT
sed "s/^head=$HEAD_NEO$/head=00000000000000000000000000000000deadbeef/" "$PV" > "$TAM_DIR/pham-vi.sh"
out2=$(bash "$TAM_DIR/pham-vi.sh"); ma2=$?
if [ "$ma2" -eq 2 ] && printf '%s' "$out2" | grep -q "KHONG CO COMMIT NEO 00000000000000000000000000000000deadbeef"; then
  echo "# đối chứng neo vắng: thoát 2, KHONG CO COMMIT NEO"
else echo "DOI CHUNG KHONG BAT (neo vắng): thoát $ma2 — $out2" | head -3; bad=1; fi

for c in "$BASE" "$HEAD_NEO"; do
  if git merge-base --is-ancestor "$c" origin/main; then echo "# $c là tổ tiên của origin/main"
  else echo "NEO KHONG BEN $c"; bad=1; fi
done
long=$(git commit-tree "HEAD^{tree}" -m "neo.sh đối chứng lơ lửng" 2>/dev/null)
if [ -n "$long" ] && ! git merge-base --is-ancestor "$long" origin/main; then echo "# đối chứng commit lơ lửng: không phải tổ tiên"
else echo "DOI CHUNG KHONG BAT (is-ancestor)"; bad=1; fi

[ "$bad" -eq 0 ] && echo "NEO OK"
exit $bad
