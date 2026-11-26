#!/usr/bin/env bash
# pham-vi.sh — E8 (AC-8) của so-nguon-kho-khai-bao: mọi tệp đổi của nhánh (so với merge-base origin/main) nằm trong vùng của hàng.
# Danh sách cho phép viết TRƯỚC theo hợp đồng: migration 122, hai bản độ tươi và CLI, bộ đọc 122 của test, các test độ tươi đã khai
# ở vùng (hang vung), hồ sơ này, _acceptance/config.yaml, thiết kế, kế hoạch, tệp máy sinh.
# 22/11: thêm scripts/ci-bo-qua.json — bốn ca NK-AC-1 bỏ qua có tên trên CI (giám sát 07:52Z, ci-scripts.md; đã khai hang vung).
#   bash _acceptance/so-nguon-kho-khai-bao/probes/pham-vi.sh
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CHO_PHEP='^(db/migrations/122_source_registry_family_cadence\.sql'\
'|scripts/lib/freshness\.mjs|app/src/lib/freshness\.ts|scripts/check-freshness\.mjs|app/src/lib/ops-queries\.ts'\
'|scripts/lib/so-nguon-122\.mjs'\
'|scripts/so-nguon-kho\.test\.mjs|scripts/check-freshness\.test\.mjs|scripts/freshness-parity\.test\.mjs|scripts/s05-slo\.test\.mjs'\
'|scripts/bao-cao-ngay\.test\.mjs|scripts/ci-bo-qua\.json|app/tests/slo-mot-nguon\.test\.tsx|app/tests/o-kpi-chi-do-local\.test\.tsx'\
'|pipeline/scripts/ops-facts-so-tong-hop\.test\.mjs|pipeline/scripts/ops-facts-fixture\.mjs|app/tests/ops-nhan-theo-context\.test\.tsx|app/tests/ops-cloud-khong-bang-nap\.test\.tsx|app/tests/quyen-bon-vai\.test\.tsx'\
'|_acceptance/so-nguon-kho-khai-bao/.*|_acceptance/config\.yaml'\
'|docs/superpowers/specs/2026-11-21-so-nguon-kho-khai-bao-design\.md|docs/superpowers/plans/2026-11-21-so-nguon-kho-khai-bao\.md'\
'|PRODUCT-MAP\.md|LO-TRINH\.html)$'

kiem() { if printf '%s\n' "$1" | grep -Eq "$CHO_PHEP"; then echo "ok $1"; else echo "NGOAI PHAM VI $1"; return 1; fi; }

# Tự kiểm: một tệp chắc chắn ngoài vùng phải bị gọi tên.
if kiem app/src/app/page.tsx >/dev/null; then echo "TU KIEM HONG: app/src/app/page.tsx lọt danh sách cho phép"; exit 1; fi
echo "tự kiểm: app/src/app/page.tsx → NGOAI PHAM VI"

BASE=$(git -C "$ROOT" merge-base HEAD origin/main) || { echo "TU KIEM HONG: không có merge-base với origin/main"; exit 1; }
TEP=$(git -C "$ROOT" diff --name-only "$BASE" HEAD)
[ -n "$TEP" ] || { echo "TU KIEM HONG: nhánh không có tệp đổi — phép đo không có gì để đo"; exit 1; }
sai=0
while IFS= read -r f; do kiem "$f" || sai=$((sai + 1)); done <<< "$TEP"
[ "$sai" -eq 0 ] || exit 1
echo "PHAM-VI OK"
