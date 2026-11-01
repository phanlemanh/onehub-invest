#!/bin/bash
# E4 (sd3-test-chiu-song-song): tệp đổi so merge-base chỉ trong vùng của hàng; probe không gọi Supabase.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
cho_phep() {
  case "$1" in
    pipeline/scripts/bait-gap-sellers.test.mjs|_acceptance/sd3-test-chiu-song-song/*|_acceptance/config.yaml|\
    _acceptance/sdt-luu-goc-e164/run-log.jsonl|_acceptance/sdt-luu-goc-e164/evidence-report.md|\
    _acceptance/sellers-them-dong-lai/run-log.jsonl|_acceptance/sellers-them-dong-lai/evidence-report.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done < <(git diff --name-only "$base" HEAD)
for f in _acceptance/sd3-test-chiu-song-song/probes/song-song.mjs; do
  grep -nE "supabase|SUPABASE_|mgmtExec" "$f" && { echo "CHAM CLOUD $f"; bad=1; }
done
if ! cho_phep "pipeline/scripts/boc-sdt.test.mjs"; then echo "doi chung: boc-sdt.test.mjs → NGOAI PHAM VI"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
