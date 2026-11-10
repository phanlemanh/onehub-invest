#!/bin/bash
# E8 (thuoc-song-song-dem-theo-ten-ca, AC-7): tệp đổi so merge-base chỉ trong danh sách của hàng; hồ sơ đã ký
# app-test-chiu-song-song không đổi chữ (contract, evals, sổ quyết định), run-log/evidence-report chỉ nhận dòng ghim.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
[ "$base" != "$(git rev-parse HEAD)" ] || { echo "DIEM RE BANG HEAD — phép đo mù"; exit 2; }
H=_acceptance/app-test-chiu-song-song
cho_phep() {
  case "$1" in
    $H/probes/song-song.mjs|$H/probes/pham-vi.sh|$H/run-log.jsonl|$H/evidence-report.md|\
    _acceptance/thuoc-song-song-dem-theo-ten-ca/*|_acceptance/config.yaml|\
    docs/superpowers/specs/2026-11-09-thuoc-song-song-dem-theo-ten-ca-design.md|\
    PRODUCT-MAP.md|LO-TRINH.html) return 0 ;;
    *) return 1 ;;
  esac
}
# Khuôn dòng ghim của làn máy (cùng khuôn kiem_ghim của E5 cũ): run-log chỉ THÊM dòng kind repin; evidence-report chỉ đổi
# verified_commit và thêm mục «### Re-pin» (run_id, sha, dòng trống).
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
for f in contract.md evals.yaml decisions.jsonl; do
  [ -z "$(git diff "$base" HEAD -- "$H/$f")" ] || { echo "SUA HO SO DA KY: $H/$f"; bad=1; }
done
la=$(git diff -U0 "$base" HEAD -- "$H/run-log.jsonl" | kiem_ghim run-log; git diff -U0 "$base" HEAD -- "$H/evidence-report.md" | kiem_ghim evidence)
[ -z "$la" ] || { echo "$la"; bad=1; }
# Đối chứng: đổi verdict trong evidence-report đã ký → bắt; tệp ngoài danh sách → NGOAI PHAM VI.
gia=$(printf '%s\n' '--- a/x' '+++ b/x' '@@ -3 +3 @@' '-verdict: PASS' '+verdict: REJECT' | kiem_ghim evidence)
if echo "$gia" | grep -q "SUA HO SO DA KY"; then echo "doi chung: đổi verdict → SUA HO SO DA KY"; else echo "DOI CHUNG KHONG BAT (ghim)"; bad=1; fi
if ! cho_phep "app/tests/sellers-chip.test.tsx"; then echo "doi chung: app/tests/sellers-chip.test.tsx → NGOAI PHAM VI"; else echo "DOI CHUNG KHONG BAT"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI HANG OK"
exit $bad
