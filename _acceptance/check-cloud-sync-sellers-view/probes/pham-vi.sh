#!/bin/bash
# E3 (check-cloud-sync-sellers-view): tệp đổi so merge-base chỉ trong vùng của hàng; thước không gọi cloud thật.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
doi=$(git diff --name-only "$base" HEAD) || { echo "GIT DIFF LOI"; exit 2; }
[ -n "$doi" ] || { echo "KHONG CO TEP DOI — sai điểm rẽ?"; exit 2; }
cho_phep() {
  case "$1" in
    pipeline/scripts/check-cloud-sync.mjs|_acceptance/check-cloud-sync-sellers-view/*|_acceptance/config.yaml|\
    _acceptance/cloud-sync-atomic/run-log.jsonl|_acceptance/cloud-sync-atomic/evidence-report.md|\
    _acceptance/leak-gate-kiem-anon/run-log.jsonl|_acceptance/leak-gate-kiem-anon/evidence-report.md|\
    _acceptance/soat-tang-a-moi-duong-len-cloud/run-log.jsonl|_acceptance/soat-tang-a-moi-duong-len-cloud/evidence-report.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$doi"
grep -nE "SUPABASE_|mgmtExec\(" pipeline/scripts/check-cloud-sync.mjs && { echo "CHAM CLOUD pipeline/scripts/check-cloud-sync.mjs"; bad=1; }
if ! cho_phep "pipeline/sync-cloud.mjs"; then echo "doi chung: pipeline/sync-cloud.mjs → NGOAI PHAM VI"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
