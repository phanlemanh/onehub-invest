#!/bin/bash
# pham-vi.sh — AC-4 của do1-ac9-xanh-lai-sau-so-nguon-122: nhánh so với merge-base origin/main chỉ đổi tệp test, hồ sơ, config,
# bản đồ máy sinh; trong tệp test chỉ đúng MỘT dòng mã đổi (câu INSERT source_registry của ca DO1-AC-9), còn lại là chú thích.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
BASE=$(git merge-base HEAD origin/main)
T=pipeline/scripts/do-hang-ngay.test.mjs
git diff --quiet -- "$T" || { echo "TEP TEST CO THAY DOI CHUA COMMIT"; exit 2; }
NGOAI=$(git diff --name-only "$BASE" HEAD | grep -vE "^(_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/|_acceptance/config\.yaml$|$T$|PRODUCT-MAP\.md$|LO-TRINH\.html$)" || true)
[ -z "$NGOAI" ] || { echo "NGOAI PHAM VI: $NGOAI"; exit 1; }
BOT=$(git diff -U0 "$BASE" HEAD -- "$T" | grep -E '^-[^-]' || true)
THEM=$(git diff -U0 "$BASE" HEAD -- "$T" | grep -E '^\+[^+]' | grep -vE '^\+\s*//' || true)
[ "$(printf '%s\n' "$BOT" | grep -c .)" = 1 ] || { echo "SO DONG BOT KHAC 1"; exit 1; }
[ "$(printf '%s\n' "$THEM" | grep -c .)" = 1 ] || { echo "SO DONG MA THEM KHAC 1"; exit 1; }
printf '%s\n' "$BOT" | grep -q "INSERT INTO source_registry.*'S09', 'TEN_THAT_V'.*ON CONFLICT DO NOTHING" || { echo "DONG BOT KHONG PHAI CAU INSERT S09"; exit 1; }
printf '%s\n' "$THEM" | grep -q "INSERT INTO source_registry.*'S09', 'TEN_THAT_V'.*ON CONFLICT (code) DO UPDATE SET real_name = EXCLUDED.real_name\")" || { echo "DONG THEM KHONG PHAI CAU GHI DE"; exit 1; }
echo "tep doi: $(git diff --name-only "$BASE" HEAD | tr '\n' ' ')"
echo "PHAM-VI OK"
