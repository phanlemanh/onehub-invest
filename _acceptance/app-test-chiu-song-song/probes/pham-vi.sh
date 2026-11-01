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
[ "$base" != "$(git rev-parse HEAD)" ] || { echo "DIEM RE BANG HEAD — phép đo mù"; exit 2; }
# Bốn hồ sơ đã ký chỉ được nhận dòng ghim lại của làn máy: run-log chỉ THÊM dòng kind repin; evidence-report chỉ đổi
# verified_commit và thêm mục «### Re-pin» (run_id, sha, dòng trống). Đọc diff -U0 từ stdin, in dòng lạ.
kiem_ghim() {  # $1 = run-log|evidence
  awk -v loai="$1" '
    /^(\+\+\+|---) / || /^@@/ || /^diff / || /^index / { next }
    /^-/ { if (loai == "evidence" && $0 ~ /^-verified_commit: /) next; print "SUA HO SO DA KY: " $0; next }
    /^\+/ { if (loai == "run-log" && $0 ~ /"kind":"repin"/) next
            if (loai == "evidence" && ($0 ~ /^\+verified_commit: / || $0 ~ /^\+### Re-pin / || $0 ~ /^\+run_id: / || $0 ~ /^\+sha: / || $0 ~ /^\+$/)) next
            print "SUA HO SO DA KY: " $0 }'
}
ds=$(git diff --name-only "$base" HEAD) || { echo "KHONG LIET KE DUOC TEP DOI"; exit 2; }
[ -n "$ds" ] || { echo "KHONG CO TEP DOI — phép đo mù"; exit 2; }
bad=0
while IFS= read -r f; do [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$ds"
for h in deals-loai-tin-phi-ly deals-phi-ly-test-theo-view dq-moi-nhat-moi-kiem sdt-luu-goc-e164; do
  for t in run-log evidence; do
    tep="_acceptance/$h/$([ "$t" = run-log ] && echo run-log.jsonl || echo evidence-report.md)"
    la=$(git diff -U0 "$base" HEAD -- "$tep" | kiem_ghim "$t")
    [ -z "$la" ] || { echo "$la"; bad=1; }
  done
done
# Đối chứng: một dòng verdict bị đổi trong evidence-report đã ký → bắt.
gia=$(printf '%s\n' '--- a/x' '+++ b/x' '@@ -3 +3 @@' '-verdict: PASS' '+verdict: REJECT' | kiem_ghim evidence)
if echo "$gia" | grep -q "SUA HO SO DA KY"; then echo "doi chung: đổi verdict → SUA HO SO DA KY"; else echo "DOI CHUNG KHONG BAT (ghim)"; bad=1; fi
for f in _acceptance/app-test-chiu-song-song/probes/song-song.mjs; do
  grep -nE "supabase|SUPABASE_|mgmtExec" "$f" && { echo "CHAM CLOUD $f"; bad=1; }
done
if ! cho_phep "app/tests/sellers-chip.test.tsx"; then echo "doi chung: sellers-chip.test.tsx → NGOAI PHAM VI"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
