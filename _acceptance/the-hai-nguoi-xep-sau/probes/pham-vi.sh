#!/bin/bash
# AC-3 của the-hai-nguoi-xep-sau: tệp đổi so với điểm rẽ nhánh chỉ thuộc danh sách ở AC-3, và mã đổi trong labels-queries.ts
# chỉ là dòng ORDER BY của tinKe (khớp nguyên dòng) cùng chú thích. Nhánh cắt từ đầu nhánh feat/the-gan-nhan-nguoi-dang (#328):
# khi #328 chưa gộp, điểm rẽ là đầu nhánh đó; đã gộp thì là merge-base với main.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
ly_do="main"
if feat=$(git rev-parse -q --verify origin/feat/the-gan-nhan-nguoi-dang) && ! git merge-base --is-ancestor "$feat" "$base"; then
  git merge-base --is-ancestor "$feat" HEAD || { echo "NHANH NEN CHUA CAP NHAT: origin/feat/the-gan-nhan-nguoi-dang có commit chưa nằm trong HEAD"; exit 2; }
  base="$feat"; ly_do="dau nhanh #328 (chua gop vao main)"
fi
echo "diem re $base ($ly_do)"
duoc() {
  case "$1" in
    app/src/lib/labels-queries.ts|app/tests/labels-nhom.test.tsx|_acceptance/config.yaml|_acceptance/the-hai-nguoi-xep-sau/*|\
    docs/*|PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
tep=$( { git diff --no-renames --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if duoc "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$tep"
printf '%s\n' "$tep" | grep -qx "app/src/lib/labels-queries.ts" || { echo "THIEU TEP labels-queries.ts"; bad=1; }
duoc "db/migrations/081_x.sql" && { echo "LOI DOI CHUNG: migration lot danh sach"; bad=1; } || echo "ok doi chung: tep ngoai danh sach bi bat"
# Dòng mã đổi (bỏ chú thích) phải là đúng hai dòng: dòng ORDER BY cũ bị xoá, dòng ORDER BY mới được thêm, khớp nguyên dòng.
CU='-     ORDER BY (i.double_label AND coalesce(n.so, 0) = 1) DESC, i.item_id'
MOI='+     ORDER BY (i.double_label AND coalesce(n.so, 0) = 1) DESC, i.double_label, i.item_id'
loc() { grep -E '^[+-][^+-]' | grep -v -E '^[+-] ?(\*|/\*\*|//)' | grep -v -x -F -e "$CU" -e "$MOI"; }
du=$(git diff "$base" -- app/src/lib/labels-queries.ts | loc || true)
if [ -n "$du" ]; then echo "DOI MA NGOAI CAU XEP:"; printf '%s\n' "$du"; bad=1; else echo "ok chi doi cau xep cua tinKe"; fi
git diff "$base" -- app/src/lib/labels-queries.ts | grep -qx -F -e "$MOI" || { echo "THIEU DONG ORDER BY MOI"; bad=1; }
# Đối chứng của bộ lọc dòng mã: một dòng WHERE giả và một dòng ORDER BY có thêm mã phải bị bắt.
gia=$(printf '%s\n' "+     WHERE i.lat = \$2 AND true" "${MOI}, random()" "$CU" | loc || true)
[ "$(printf '%s\n' "$gia" | grep -c .)" -eq 2 ] && echo "ok doi chung: bo loc bat dong ma la" || { echo "LOI DOI CHUNG: bo loc dong ma khong bat"; bad=1; }
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
