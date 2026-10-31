#!/bin/bash
# E9 (sdt-luu-goc-e164): tệp đổi so merge-base chỉ trong danh sách; không lệnh nào áp 060 lên DB oneinvest.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
cho_phep() {
  case "$1" in
    db/migrations/060_sdt_e164.sql|pipeline/mappings.yaml|pipeline/lib/vocab.generated.mjs|app/src/lib/vocab.generated.ts|agent/src/vocab.generated.ts|\
    pipeline/transform-zalo.mjs|pipeline/transform-fb.mjs|pipeline/lib/danh-ba-nguoi.mjs|pipeline/lib/nap-060.mjs|pipeline/refresh-bait-gap.mjs|\
    pipeline/sync-cloud.mjs|pipeline/do-danh-ba-sdt.mjs|pipeline/scripts/do-boc-sdt.mjs|pipeline/scripts/test-data-residue.mjs|\
    app/src/lib/ops/people.ts|app/src/components/ops/people/people-rows.ts|\
    pipeline/*.test.mjs|pipeline/scripts/*.test.mjs|app/tests/sdt-che-tren-people.test.tsx|\
    CONTEXT.md|pipeline/CLAUDE.md|_acceptance/config.yaml|_acceptance/sdt-luu-goc-e164/*|_acceptance/*/evidence-report.md|_acceptance/*/run-log.jsonl|\
    docs/superpowers/specs/2026-10-31-sdt-luu-goc-e164-design.md|docs/superpowers/plans/2026-10-31-sdt-luu-goc-e164.md|PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done < <(git diff --name-only "$base" HEAD)
ap_that() { grep -nE "(-d +|/)oneinvest([^_a-z]|$)" "$1" | grep -E "060|db/migrations" ; }
for f in $(git diff --name-only "$base" HEAD -- '_acceptance/sdt-luu-goc-e164/probes' 'pipeline/lib/nap-060.mjs'); do
  [ -f "$f" ] && ap_that "$f" && { echo "AP LEN DB THAT $f"; bad=1; }
done
tmp=$(mktemp); echo 'psql -d oneinvest < db/migrations/060_sdt_e164.sql' > "$tmp"
if ap_that "$tmp" >/dev/null && ! cho_phep "app/src/app/ops/people/page.tsx"; then echo "doi chung: page.tsx → NGOAI PHAM VI; lệnh áp 060 lên oneinvest → AP LEN DB THAT"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
rm -f "$tmp"
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
