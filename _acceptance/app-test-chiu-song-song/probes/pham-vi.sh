#!/bin/bash
# E5 (app-test-chiu-song-song): tệp đổi so merge-base chỉ trong vùng của hàng; probe không gọi Supabase.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
cho_phep() {
  case "$1" in
    app/tests/deals-phi-ly.test.tsx|app/tests/dq-moi-nhat.test.tsx|pipeline/scripts/deals-phi-ly.test.mjs|\
    pipeline/lib/luoc-do-rieng.mjs|pipeline/scripts/luoc-do-rieng.test.mjs|\
    _acceptance/app-test-chiu-song-song/*|_acceptance/config.yaml|\
    _acceptance/deals-loai-tin-phi-ly/run-log.jsonl|_acceptance/deals-loai-tin-phi-ly/evidence-report.md|\
    _acceptance/deals-phi-ly-test-theo-view/run-log.jsonl|_acceptance/deals-phi-ly-test-theo-view/evidence-report.md|\
    _acceptance/dq-moi-nhat-moi-kiem/run-log.jsonl|_acceptance/dq-moi-nhat-moi-kiem/evidence-report.md|\
    _acceptance/sdt-luu-goc-e164/run-log.jsonl|_acceptance/sdt-luu-goc-e164/evidence-report.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
ds=$(git diff --name-only "$base" HEAD) || { echo "KHONG LIET KE DUOC TEP DOI"; exit 2; }
[ -n "$ds" ] || { echo "KHONG CO TEP DOI — phép đo mù"; exit 2; }
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$ds"
for f in _acceptance/app-test-chiu-song-song/probes/song-song.mjs; do
  grep -nE "supabase|SUPABASE_|mgmtExec" "$f" && { echo "CHAM CLOUD $f"; bad=1; }
done
if ! cho_phep "app/tests/sellers-chip.test.tsx"; then echo "doi chung: sellers-chip.test.tsx → NGOAI PHAM VI"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
