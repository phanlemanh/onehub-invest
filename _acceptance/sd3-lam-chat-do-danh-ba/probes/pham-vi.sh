#!/bin/bash
# E8 (sd3-lam-chat-do-danh-ba): tệp đổi so merge-base chỉ trong vùng của hàng; probe và test mới không áp 060 hay nối DB oneinvest.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
cho_phep() {
  case "$1" in
    pipeline/do-danh-ba-sdt.mjs|pipeline/do-danh-ba-sdt.test.mjs|app/src/lib/dq-labels.ts|app/tests/dq-danh-ba-sdt-label.test.tsx|\
    app/tests/people-che-so-loader.test.tsx|_acceptance/config.yaml|_acceptance/sd3-lam-chat-do-danh-ba/*|\
    docs/superpowers/specs/2026-10-31-sd3-lam-chat-do-danh-ba-design.md|docs/superpowers/plans/2026-10-31-sd3-lam-chat-do-danh-ba.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done < <(git diff --name-only "$base" HEAD)
# Nối/áp lên DB oneinvest dùng chung: tên DB đứng sau «/» hay «-d», không phải oneinvest_<…> thử. Bỏ dòng ca chặn của chính test (chonDb).
ap_that() { grep -nE "(5433/|-d +)oneinvest([^_a-z0-9]|$)" "$1" | grep -v "chonDb(" ; }
for f in _acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs _acceptance/sd3-lam-chat-do-danh-ba/probes/people.sh app/tests/people-che-so-loader.test.tsx; do
  [ -f "$f" ] && ap_that "$f" && { echo "AP LEN DB THAT $f"; bad=1; }
done
tmp=$(mktemp); echo 'psql -d oneinvest < db/migrations/060_sdt_e164.sql' > "$tmp"
if ap_that "$tmp" >/dev/null && ! cho_phep "app/src/app/ops/people/page.tsx"; then echo "doi chung: page.tsx → NGOAI PHAM VI; lệnh áp 060 lên oneinvest → AP LEN DB THAT"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
rm -f "$tmp"
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
