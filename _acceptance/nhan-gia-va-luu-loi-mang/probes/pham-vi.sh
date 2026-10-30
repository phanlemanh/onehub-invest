#!/bin/bash
# AC-5 (nhan-gia-va-luu-loi-mang, E6): tệp đổi so merge-base origin/main chỉ trong danh sách của hợp đồng (+ tệp tách
# luu-nhan.tsx, test PL7 và danh sách quét chữ hiển thị của kho — dòng sổ S3). Đối chứng: cùng hàm phân loại trên tệp giả.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
files=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
cho_phep() {
  case "$1" in
    app/src/lib/labels-normalize.ts|app/src/lib/labels-queries.ts|app/src/components/ops/labels/label-form.tsx|\
    app/src/components/ops/labels/luu-nhan.tsx|app/tests/labels*.test.tsx|app/tests/ops-nhan/visible-strings.ts|\
    _acceptance/config.yaml|_acceptance/nhan-gia-va-luu-loi-mang/*|\
    docs/superpowers/specs/2026-10-30-nhan-gia-va-luu-loi-mang-design.md|docs/superpowers/plans/2026-10-30-nhan-gia-va-luu-loi-mang.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$files"
if cho_phep "app/tests/labels-gia.test.tsx" && ! cho_phep "app/src/lib/khac.ts" && ! cho_phep "collector/x"; then
  echo "doi chung: app/src/lib/khac.ts → NGOAI PHAM VI; collector/x → NGOAI PHAM VI"
else echo "DOI CHUNG PHAM VI KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
