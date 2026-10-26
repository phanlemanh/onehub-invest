#!/bin/bash
# AC-2: date nhảy phút chèn vào PATH của hộp ngay sau thư mục bản giả — bản tệp test của main 53e2b83b đỏ ở hai ca
# ON16-AC-2 (đầu ra nêu dòng «AUDIT TOÀN DIỆN»), bản sửa xanh và không gọi tới date nhảy phút lần nào.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; P="$ROOT/_acceptance/audit-all-test-moc-phut/probes"
echo "root $ROOT sha $(git -C "$ROOT" rev-parse HEAD)"
TAM=$(mktemp -d); trap 'rm -rf "$TAM"' EXIT
mkdir -p "$TAM/nhay"; cp "$P/date-nhay/date" "$TAM/nhay/date"; chmod +x "$TAM/nhay/date"
# Bản sao nằm ngoài kho: REPO trỏ tuyệt đối về gốc kho; PATH của hộp chèn thư mục date nhảy phút.
ban_sao() { sed -e "s#^const REPO = .*#const REPO = \"$ROOT\";#" -e "s#:/usr/bin:/bin\`, HOME#:$TAM/nhay:/usr/bin:/bin\`, HOME#"; }
git -C "$ROOT" show 53e2b83b:scripts/audit-all.test.mjs | ban_sao > "$TAM/cu.test.mjs" || { echo "KHONG LAY DUOC BAN CU"; exit 2; }
ban_sao < "$ROOT/scripts/audit-all.test.mjs" > "$TAM/sua.test.mjs"
for f in cu sua; do
  grep -q "$TAM/nhay:/usr/bin:/bin" "$TAM/$f.test.mjs" && grep -q "^const REPO = \"$ROOT\";" "$TAM/$f.test.mjs" \
    || { echo "KHONG CHEN DUOC DATE NHAY ($f)"; exit 2; }
done
# Kiểm kê nguồn giờ của audit-all.sh: mọi chỗ đọc đồng hồ phải nằm trong tập đã khai — dòng tiêu đề (ghim bằng date giả)
# và find -mtime ở mục backup (ca dùng tuổi tệp 2/10 ngày, xa ngưỡng 8). Nguồn mới ngoài tập → đỏ, gọi tên dòng.
nguon=$(grep -nE '(^|[^:])\bdate\b|\bstat\b|-mmin|-mtime|-newer|SECONDS|%\(' "$ROOT/scripts/audit-all.sh")
so_nguon=0; chua_khai=0
while IFS= read -r d; do
  [ -z "$d" ] && continue; so_nguon=$((so_nguon+1))
  case "$d" in
    *"\$(date '+%Y-%m-%d %H:%M')"*|*"-mtime -8"*) echo "nguon gio da khai: ${d%%:*}" ;;
    *) echo "NGUON GIO CHUA KHAI $d"; chua_khai=1 ;;
  esac
done <<< "$nguon"
[ $so_nguon = 2 ] && [ $chua_khai = 0 ] || { echo "KIEM KE NGUON GIO LECH ($so_nguon nguon)"; exit 1; }
# Ghi trọn đầu ra rồi mới tìm (tránh SIGPIPE oan khi grep thoát sớm).
OUT=""
chay() { rm -f "$TAM/nhay/dem"; OUT=$(env -u NODE_TEST_CONTEXT node --test --test-name-pattern="ON16-AC-2" "$1" 2>&1); }
so() { printf '%s\n' "$OUT" | sed -n "s/^ℹ $1 \([0-9]*\)$/\1/p" | tail -1; }
chay "$TAM/cu.test.mjs"; cu_fail=$(so fail); cu_dem=$(cat "$TAM/nhay/dem" 2>/dev/null || echo 0)
printf '%s\n' "$OUT" | grep -q "AUDIT TOÀN DIỆN" && cu_tieu_de=1 || cu_tieu_de=0
chay "$TAM/sua.test.mjs"; sua_pass=$(so pass); sua_fail=$(so fail); sua_dem=$(cat "$TAM/nhay/dem" 2>/dev/null || echo 0)
echo "ban cu 53e2b83b: do ${cu_fail:-?}/2 ca ON16-AC-2, dau ra $([ $cu_tieu_de = 1 ] && echo co || echo KHONG CO) dong AUDIT TOAN DIEN"
echo "date nhay phut duoc goi (ban cu): $cu_dem"
echo "ban sua: xanh ${sua_pass:-?}/2 ca ON16-AC-2 (fail ${sua_fail:-?})"
echo "date nhay phut duoc goi (ban sua): $sua_dem"
bad=0
[ "$cu_dem" -ge 4 ] || { echo "DATE NHAY KHONG DUOC GOI (ban cu)"; bad=1; }
[ "${cu_fail:-0}" = 2 ] && [ $cu_tieu_de = 1 ] || { echo "DOI CHUNG KHONG DO"; bad=1; }
[ "${sua_pass:-0}" = 2 ] && [ "${sua_fail:-1}" = 0 ] || { echo "BAN SUA KHONG XANH"; printf '%s\n' "$OUT" | tail -40; bad=1; }
[ "$sua_dem" = 0 ] || { echo "BAN SUA VAN DOC DONG HO (date nhay duoc goi)"; bad=1; }
[ $bad = 0 ] && echo "QUA PHUT OK"
exit $bad
