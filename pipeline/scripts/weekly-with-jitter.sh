#!/usr/bin/env bash
# weekly-with-jitter.sh — CCP (ADR-0007): randomized delay ≤30 phút trước
# weekly-collect để cron không rơi đúng giờ tròn (tương đương systemd
# RandomizedDelaySec). launchd gọi file này, KHÔNG gọi weekly-collect trực tiếp.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# 2610-13 (TV2b): cổng vòng đời S01 — DUY NHẤT qua pipeline/lib/vong-doi.mjs.
# Từ chối (exit 3) → 0 lời gọi, thoát 0, một dòng mã + lý do; lỗi (exit 2) → dừng.
VD_KQ="$(node "$ROOT"/pipeline/lib/vong-doi.mjs S01)"; VD_RC=$?
if [ "$VD_RC" -eq 3 ]; then echo "$VD_KQ — bỏ qua lượt thu S01"; exit 0; fi
if [ "$VD_RC" -ne 0 ]; then echo "❌ vong-doi S01 lỗi — dừng (fail-closed)"; exit 1; fi

sleep $((RANDOM % 1800))
exec bash "$(cd "$(dirname "$0")" && pwd)/weekly-collect.sh" "$@"
