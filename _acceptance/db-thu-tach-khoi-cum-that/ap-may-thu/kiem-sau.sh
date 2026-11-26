#!/usr/bin/env bash
# kiem-sau.sh — lệnh kiểm sau áp của hồ sơ db-thu-tach-khoi-cum-that (AC-10): in trung vị khoảng cấp s4 (cận trên phút giữ
# khoá) của các lượt SAU mốc áp, cạnh số nền 99′ (n=15, 23/11 12Z → 25/11 03:11:41Z) đo bằng cùng lệnh trên cùng tệp.
#   bash kiem-sau.sh <mốc áp ISO> [su-kien.jsonl]
set -euo pipefail
GOC="$(cd "$(dirname "$0")/../../.." && pwd)"
MOC="${1:?thiếu mốc áp (ISO, giờ PR gộp)}"
TEP="${2:-/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/su-kien.jsonl}"
do_() { node "$GOC/scripts/do-phut-s4.mjs" --tep "$TEP" --json "$@"; }
nen=$(do_ --tu 2026-11-23T12:00:00Z --den 2026-11-25T03:11:41.999Z)
sau=$(do_ --tu "$MOC")
in_() { node -e 'const k=JSON.parse(process.argv[1]); console.log(k.n ? `${process.argv[2]} ${Math.round(k.trung_vi)}′ (n=${k.n}, p75 ${Math.round(k.p75)}′)` : process.argv[3])' "$@"; }
in_ "$nen" "nền" "nền: không đọc được (tệp thiếu dòng 23–25/11)"
in_ "$sau" "sau áp" "chưa có lượt nào sau áp"
