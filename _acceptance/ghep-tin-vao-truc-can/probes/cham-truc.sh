#!/usr/bin/env bash
# cham-truc.sh — E10a (AC-10): lệnh chấm trên tập giả (Wilson, bảng bài sai, đổi nhãn thì băm lệch), rồi chấm thật trên tập nhãn
# trục OP1 đóng băng khi tập đã có nhãn người; ghi evidence/cham-truc.md. Băm ghim ở tệp TAP-GHIM của hồ sơ.
set -euo pipefail
HS="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$HS/../.." && pwd)"
cd "$ROOT/pipeline"
node --test scripts/ghep-tin-truc-can-cham.test.mjs
[ -f "$HS/TAP-GHIM" ] || { echo "ĐỎ: chưa có tập nhãn trục đóng băng (TAP-GHIM) — AC-10 chờ buổi gắn nhãn"; exit 4; }
read -r TEP BAM < "$HS/TAP-GHIM"
mkdir -p "$HS/evidence"
DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}" node scripts/ghep-tin-truc-can-cham.mjs --tep "$ROOT/$TEP" --bam "$BAM" --ra "$HS/evidence/cham-truc.md"
