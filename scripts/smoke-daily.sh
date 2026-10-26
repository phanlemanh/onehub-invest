#!/usr/bin/env bash
# smoke-daily.sh — smoke test hằng ngày (CCP ADR-0007): discovery 1 trang,
# verify selector + số card > 0. Phát hiện Airbnb đổi markup trong 24h thay
# vì tuần sau. KHÔNG fail khi thiếu card (có thể là block/ Captcha — chỉ warn
# + webhook để người quyết); fail (exit 1) khi collector crash kỹ thuật.
#
# Env: WEBHOOK_URL (tùy chọn — POST JSON {text} khi có dấu hiệu bất thường).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$(mktemp -t smoke-daily)"

# 2610-13 (TV2b): cổng vòng đời S01 — DUY NHẤT qua pipeline/lib/vong-doi.mjs.
# Từ chối (exit 3) → 0 lời gọi, thoát 0, một dòng mã + lý do; lỗi (exit 2) → dừng.
VD_KQ="$(node "$ROOT"/pipeline/lib/vong-doi.mjs S01)"; VD_RC=$?
if [ "$VD_RC" -eq 3 ]; then echo "$VD_KQ — bỏ qua lượt thu S01"; exit 0; fi
if [ "$VD_RC" -ne 0 ]; then echo "❌ vong-doi S01 lỗi — dừng (fail-closed)"; exit 1; fi


# Smoke chạy ngoài cửa sổ hoạt động → tắt window + jitter để nhanh
if ! (cd "$ROOT/collector" && \
  CONDUCT_WINDOW=off CONDUCT_JITTER=0 AIRBNB_DISCOVERY_MAX_PAGES=1 \
  npm run collect -- collect --city hanoi --source airbnb-discovery >"$LOG" 2>&1); then
  echo "smoke: collector CRASH (exit != 0)" >&2
  tail -20 "$LOG" >&2
  [ -n "${WEBHOOK_URL:-}" ] && curl -sf -X POST -H 'content-type: application/json' \
    -d '{"text":"One Invest smoke-daily: collector crash — xem log"}' "$WEBHOOK_URL" || true
  exit 1
fi

CARDS=$(grep -oE "page 1: [0-9]+ cards" "$LOG" | grep -oE "[0-9]+" | head -1)
if [ -n "${CARDS:-}" ] && [ "$CARDS" -gt 0 ]; then
  echo "smoke: OK ($CARDS cards trang 1)"
else
  # Selector đổi hoặc bị chặn — không crash nhưng cần người nhìn
  echo "smoke: WARN — 0 card/selector không khớp (đổi markup hoặc block?)" >&2
  tail -5 "$LOG" >&2
  [ -n "${WEBHOOK_URL:-}" ] && curl -sf -X POST -H 'content-type: application/json' \
    -d '{"text":"One Invest smoke-daily WARN: 0 card — kiểm tra selector/block"}' "$WEBHOOK_URL" || true
fi
