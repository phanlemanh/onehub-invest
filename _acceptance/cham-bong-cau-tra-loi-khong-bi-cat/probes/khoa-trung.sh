#!/usr/bin/env bash
# khoa-trung.sh — cham-bong-cau-tra-loi-khong-bi-cat E8 (AC-6): cặp thẻ × model đọc thành công ở lượt thử 1 có khoá dùng lại tính bằng mã
# của nhánh trùng khoá đã lưu và có trong kho thật (state/cham-bong-bo-sung-tin/kho.jsonl của checkout chính). DB chỉ đọc.
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
CHUNG="$(cd "$(git -C "$GOC" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
cd "$GOC/agent"
exec node --import tsx "$GOC/_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/khoa-trung.mjs" "${CB_STATE:-$CHUNG/state/cham-bong-bo-sung-tin}" "${CB_LUOT:-cb-2026-11-22T052458782Z}"
