#!/usr/bin/env bash
# kiem.sh <e1|e2|e3> — lệnh kiểm của hồ sơ gs-ac-6-the-khong-tin-a; chạy từ gốc kho. Chỉ SELECT trên DB máy thu (E1).
set -uo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$GOC"
case "${1:-}" in
  e1) cd app && exec node --import tsx --test tests/the-so-gia-tri-song.test.tsx ;;
  e2) cd app && exec node --import tsx --test --test-name-pattern 'GS-AC-6 tập rời kho' tests/the-so-gia-tri-song.test.tsx ;;
  e3)
    ngoai=$(git diff --name-only origin/main...HEAD | grep -v '^_acceptance/gs-ac-6-the-khong-tin-a/' \
      | grep -vx -e app/tests/the-so-gia-tri-song.test.tsx -e PRODUCT-MAP.md -e LO-TRINH.html)
    if [ -n "$ngoai" ]; then echo "NGOÀI PHẠM VI:"; echo "$ngoai"; exit 1; fi
    git diff --name-only origin/main...HEAD; echo "PHAM-VI OK"; exit 0 ;;
  *) echo "dùng: kiem.sh e1|e2|e3" >&2; exit 2 ;;
esac
