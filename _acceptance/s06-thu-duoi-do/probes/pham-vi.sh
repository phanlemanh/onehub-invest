#!/usr/bin/env bash
# s06-thu-duoi-do E8 — nhánh chỉ đổi ba tệp của làn thu (bộ thu đuôi, test, một dòng test-nua.json) ngoài vật hồ sơ.
# Được phép thêm: _acceptance/** (hồ sơ + config executors), docs/** và PRODUCT-MAP.md, LO-TRINH.html (t1_skip).
# Tự kiểm: một danh sách giả có app/src/app/page.tsx → NGOAI PHAM VI.
set -u
cd "$(dirname "$0")/../../.." || exit 2
CHO_PHEP='^(pipeline/collect-s06-duoi\.mjs|pipeline/scripts/collect-s06-duoi\.test\.mjs|pipeline/test-nua\.json|_acceptance/.*|docs/.*|PRODUCT-MAP\.md|LO-TRINH\.html)$'
xet() { local n=0; while IFS= read -r f; do [ -z "$f" ] && continue
  if [[ "$f" =~ $CHO_PHEP ]]; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; n=$((n+1)); fi; done; return $n; }
if printf 'pipeline/collect-s06-duoi.mjs\napp/src/app/page.tsx\n' | xet | grep -q '^NGOAI PHAM VI app/src/app/page.tsx$'; then
  echo "tự kiểm: app/src/app/page.tsx → NGOAI PHAM VI"; else echo "TU KIEM HONG"; exit 1; fi
BASE=$(git merge-base origin/main HEAD) || exit 2
git diff --name-only "$BASE"..HEAD | xet; n=$?
# test-nua.json: đúng một dòng thêm, là tệp test mới
them=$(git diff "$BASE"..HEAD -- pipeline/test-nua.json | grep -c '^+[^+]'); bot=$(git diff "$BASE"..HEAD -- pipeline/test-nua.json | grep -c '^-[^-]')
echo "pipeline/test-nua.json: +$them −$bot"
[ "$them" -eq 1 ] && [ "$bot" -eq 0 ] && git diff "$BASE"..HEAD -- pipeline/test-nua.json | grep -q '^+.*"scripts/collect-s06-duoi.test.mjs"' || { echo "TEST-NUA LECH"; n=$((n+1)); }
[ "$n" -eq 0 ] && echo "PHAM-VI OK" || { echo "PHAM-VI DO ($n)"; exit 1; }
