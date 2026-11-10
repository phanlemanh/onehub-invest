#!/bin/bash
# AC-4 của don-vi-gia-theo-loai-tin: tệp đổi so với điểm rẽ nhánh chỉ thuộc danh sách ở AC-4, và luật kiểm labels-normalize.ts
# không đổi. Nhánh cắt từ đầu nhánh fix/the-hai-nguoi-xep-sau (#330, nối trên #328): điểm rẽ là mốc mới nhất trong main và
# hai nhánh nền còn chưa gộp; nhánh nền có commit chưa nằm trong HEAD thì dừng, không lặng lẽ lùi về main.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
# Tệp của vòng này = tệp do commit KHÔNG phải merge của nhánh đổi, trừ mọi commit đã có ở main và ở hai nhánh nền chưa gộp
# (#328 feat/the-gan-nhan-nguoi-dang, #330 fix/the-hai-nguoi-xep-sau). Đúng cả khi nhánh đã gộp main mới hơn nhánh nền.
loai=(origin/main)
for nen in origin/feat/the-gan-nhan-nguoi-dang origin/fix/the-hai-nguoi-xep-sau; do
  git rev-parse -q --verify "$nen" >/dev/null && loai+=("$nen")
done
echo "tru ${loai[*]}"
tep_vong() { git log --no-merges --name-only --format= HEAD "${loai[@]/#/^}" | sort -u; }
duoc() {
  case "$1" in
    app/src/components/ops/labels/label-form-nhom.tsx|app/src/components/ops/labels/labels-view.tsx|\
    app/src/components/ops/labels/luot-hai.tsx|app/src/components/ops/labels/ma-the.tsx|app/src/components/ops/labels/gia-la.ts|\
    app/tests/labels-nhom.test.tsx|app/tests/ops-nhan/visible-strings.ts|_acceptance/config.yaml|_acceptance/don-vi-gia-theo-loai-tin/*|\
    docs/*|PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
tep=$( { tep_vong; git ls-files --others --exclude-standard; } | grep . | sort -u) || { echo "GIT LOG LOI"; exit 2; }
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if duoc "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$tep"
for f in app/src/components/ops/labels/label-form-nhom.tsx app/src/components/ops/labels/ma-the.tsx app/src/components/ops/labels/gia-la.ts; do
  printf '%s\n' "$tep" | grep -qx "$f" || { echo "THIEU TEP $f"; bad=1; }
done
duoc "app/src/lib/labels-normalize.ts" && { echo "LOI DOI CHUNG: luat kiem lot danh sach"; bad=1; } || echo "ok doi chung: tep ngoai danh sach bi bat"
printf '%s\n' "$tep" | grep -qx "app/src/lib/labels-normalize.ts" && { echo "LUAT KIEM DOI: app/src/lib/labels-normalize.ts"; bad=1; } || echo "ok luat kiem khong doi"
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
