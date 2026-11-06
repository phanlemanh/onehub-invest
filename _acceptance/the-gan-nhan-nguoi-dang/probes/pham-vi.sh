#!/bin/bash
# AC-5 của the-gan-nhan-nguoi-dang: tệp đổi so với merge-base của origin/main chỉ thuộc danh sách ở AC-5; tệp đổi không ghim
# lược đồ public; test mới đặt DATABASE_URL về lược đồ tạm trước mọi import.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
duoc() {
  case "$1" in
    app/src/lib/labels-queries.ts|app/src/lib/labels-cum.ts|app/src/components/ops/labels/labels-view.tsx|\
    app/src/components/ops/labels/label-form-nhom.tsx|app/src/components/ops/labels/nguoi-dang.tsx|\
    app/tests/labels-nguoi-dang.test.tsx|app/tests/labels-nhom.test.tsx|app/tests/ops-nhan/visible-strings.ts|CONTEXT.md|\
    _acceptance/config.yaml|_acceptance/the-gan-nhan-nguoi-dang/*|docs/*|PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
tep=$( { git diff --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u) || { echo "GIT DIFF LOI"; exit 2; }
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if duoc "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$tep"
printf '%s\n' "$tep" | grep -qx "app/src/lib/labels-queries.ts" || { echo "THIEU TEP labels-queries.ts"; bad=1; }
duoc "app/src/app/api/v1/ops/labels/route.ts" && { echo "LOI DOI CHUNG: route lot danh sach"; bad=1; } || echo "ok doi chung: tep ngoai danh sach bi bat"
# Mã nguồn (không phải test: test dựng bảng bằng LIKE public.<bảng>) không được ghim lược đồ public.
if printf '%s\n' "$tep" | grep -E '^app/src/.*\.(ts|tsx)$' | xargs grep -l 'public\.' 2>/dev/null | grep -q .; then
  echo "TEP DOI GHIM LUOC DO public"; bad=1
else echo "ok khong ghim public"; fi
head -25 app/tests/labels-nguoi-dang.test.tsx | grep -n 'process.env.DATABASE_URL = schemaUrl(S)' | head -1 | grep -q . \
  && [ "$(grep -n 'process.env.DATABASE_URL = schemaUrl(S)' app/tests/labels-nguoi-dang.test.tsx | cut -d: -f1)" -lt "$(grep -n 'await import(' app/tests/labels-nguoi-dang.test.tsx | head -1 | cut -d: -f1)" ] \
  && echo "ok luoc do tam" || { echo "TEST KHONG DAT LUOC DO TAM TRUOC IMPORT"; bad=1; }
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
