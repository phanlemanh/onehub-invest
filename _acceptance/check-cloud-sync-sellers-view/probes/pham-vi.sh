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
# Kiểm một danh sách tệp (mỗi dòng một tệp); in và trả 1 nếu có tệp ngoài vùng.
kiem_danh_sach() {
  local loi=0
  while IFS= read -r f; do [ -z "$f" ] && continue
    if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; loi=1; fi
  done <<< "$1"
  return $loi
}
# Gọi cloud thật: mã 0 = có khớp, 1 = sạch, 2 = grep lỗi (tính là đỏ, không coi là sạch).
cham_cloud() { grep -nE "SUPABASE_|mgmtExec\(" "$1"; }
bad=0
kiem_danh_sach "$doi" || bad=1
cham_cloud pipeline/scripts/check-cloud-sync.mjs; m=$?
if [ $m -eq 0 ]; then echo "CHAM CLOUD pipeline/scripts/check-cloud-sync.mjs"; bad=1; elif [ $m -ne 1 ]; then echo "GREP LOI ($m)"; bad=1; fi
# Đối chứng: vòng lặp thật trên danh sách có tệp lạ phải đỏ; mẫu «chạm cloud» phải khớp tệp có gọi cloud thật.
if kiem_danh_sach "$(printf '%s\n' pipeline/scripts/check-cloud-sync.mjs pipeline/sync-cloud.mjs)" >/dev/null; then echo "DOI CHUNG KHONG BAT (danh sách)"; bad=1; else echo "doi chung: danh sách có pipeline/sync-cloud.mjs → NGOAI PHAM VI"; fi
if cham_cloud pipeline/sync-cloud.mjs >/dev/null; then echo "doi chung: mẫu chạm cloud khớp pipeline/sync-cloud.mjs"; else echo "DOI CHUNG KHONG BAT (mẫu chạm cloud)"; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM VI OK"
exit $bad
