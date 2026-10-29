#!/bin/bash
# AC-5 (rao-db-local-do-nen): tệp đổi so merge-base origin/main chỉ nằm trong danh sách cho phép; dev-ops-account.mjs không đổi;
# lưới trước-gộp của hồ sơ đã ký do-nen-hieu-nang xanh tại đầu nhánh (đổi do.mjs làm nó hoá cũ — phải đã ghim lại).
# Đối chứng: cùng hàm phân loại chạy trên một tệp giả ngoài danh sách phải ra NGOAI PHAM VI.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
echo "root $ROOT sha $(git rev-parse HEAD)"
base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
cho_phep() {
  case "$1" in
    scripts/do-nen-hieu-nang/do.mjs|_acceptance/rao-db-local-do-nen/*|_acceptance/config.yaml|PRODUCT-MAP.md|LO-TRINH.html|\
    docs/superpowers/specs/2026-10-29-rao-db-local-do-nen-design.md|docs/superpowers/plans/2026-10-29-rao-db-local-do-nen.md|\
    _acceptance/do-nen-hieu-nang/run-log.jsonl|_acceptance/do-nen-hieu-nang/evidence-report.md) return 0 ;;
    *) return 1 ;;
  esac
}
bad=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if cho_phep "$f"; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; bad=1; fi
done <<< "$(git diff --name-only "$base" HEAD)"
if cho_phep "scripts/dev-ops-account.mjs" || cho_phep "app/src/x.ts" || cho_phep "_acceptance/do-nen-hieu-nang/contract.md" \
  || ! cho_phep "scripts/do-nen-hieu-nang/do.mjs"; then
  echo "DOI CHUNG PHAM VI KHONG BAT"; bad=1
else echo "doi chung: tep gia ngoai danh sach (dev-ops-account.mjs, app/src/x.ts, contract do-nen-hieu-nang) → NGOAI PHAM VI; do.mjs → ok"; fi
if [ -z "$(git diff --name-only "$base" HEAD -- scripts/dev-ops-account.mjs)" ]; then echo "ok dev-ops-account.mjs khong doi"; else echo "DEV-OPS-ACCOUNT BI DOI"; bad=1; fi
out=$(bash scripts/pre-merge-check.sh . --slug do-nen-hieu-nang --base origin/main 2>&1); rc=$?
if [ $rc -eq 0 ] && printf '%s\n' "$out" | grep -q 'pre-merge-check: clean'; then echo "ok luoi truoc gop do-nen-hieu-nang: clean"
else echo "DO-NEN-HIEU-NANG HOA CU (rc $rc)"; printf '%s\n' "$out" | grep -E 'VIOLATION' | head -3; bad=1; fi
[ "$bad" -eq 0 ] && echo "PHAM-VI OK"
exit $bad
