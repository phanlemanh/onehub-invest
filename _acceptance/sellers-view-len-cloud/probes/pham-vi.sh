#!/bin/bash
# E6 (sellers-view-len-cloud): tệp đổi so merge-base chỉ trong vùng của hàng; probe không gọi Supabase, không nối DB oneinvest.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
cho_phep() {
  case "$1" in
    pipeline/sync-cloud.mjs|pipeline/sync-cloud.test.mjs|docs/ops/cloud-schema-catchup-2026-10-31-060.sql|\
    _acceptance/config.yaml|_acceptance/sellers-view-len-cloud/*|\
    docs/superpowers/specs/2026-10-31-sellers-view-len-cloud-design.md|docs/superpowers/plans/2026-10-31-sellers-view-len-cloud.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done < <(git diff --name-only "$base" HEAD)
# Chạm cloud: gọi Supabase / Management API, hay nối DB oneinvest dùng chung (tên đứng sau «/» hay «-d», không phải oneinvest_<…>).
cham() { grep -nE "supabase|SUPABASE_|mgmtExec|(5433/|-d +)oneinvest([^_a-z0-9]|$)" "$1"; }
for f in _acceptance/sellers-view-len-cloud/probes/cloud-gia.mjs _acceptance/sellers-view-len-cloud/probes/cloud-gia.sh \
  _acceptance/sellers-view-len-cloud/probes/catchup.mjs _acceptance/sellers-view-len-cloud/probes/catchup.sh; do
  [ -f "$f" ] && cham "$f" && { echo "CHAM CLOUD $f"; bad=1; }
done
tmp=$(mktemp); echo 'supabase db push' > "$tmp"
if cham "$tmp" >/dev/null && ! cho_phep "app/src/app/page.tsx"; then echo "doi chung: page.tsx → NGOAI PHAM VI; 'supabase db push' → CHAM CLOUD"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
rm -f "$tmp"
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
