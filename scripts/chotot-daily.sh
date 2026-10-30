#!/bin/bash
# chotot-daily.sh — Vải công khai S06 Chợ Tốt: collect → import → transform.
# Chạy 05:30 hằng ngày qua launchd (trước AirDNA 19:05 — khác khung giờ,
# tách hoàn toàn khỏi các nguồn khác).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

node "$ROOT/pipeline/collect-chotot.mjs" || exit 1

# Import snapshot mới nhất mỗi thành phố rồi transform (AU3 phần nạp,
# claudedp-2310-8): import fail (vd DB vừa chết lại) phải THẤT BẠI RÕ RỆT —
# retry ECONNREFUSED 5×20s; còn lỗi thì exit ≠0, không chạy transform trên
# dữ liệu thiếu. Phần job-step làn Claude thấy exit này qua launchd.
import_one() {
  local snap="$1" log try
  log=$(mktemp)
  for try in 1 2 3 4 5; do
    if node "$ROOT/pipeline/import-chotot.mjs" "$snap" >"$log" 2>&1; then
      cat "$log"; rm -f "$log"; return 0
    fi
    if ! grep -q "ECONNREFUSED" "$log"; then
      cat "$log"; rm -f "$log"; return 1 # lỗi khác DB — retry vô ích
    fi
    echo "ECONNREFUSED (lần $try/5) — DB chưa lên? chờ 20s rồi nạp lại $snap"
    sleep 20
  done
  cat "$log"; rm -f "$log"; return 1
}
IMPORT_FAILED=0
for CITY in hanoi hcmc; do
  LATEST=$(ls -1d "$ROOT"/collector/snapshots/$CITY/${CITY}__chotot-ads__* 2>/dev/null | sort | tail -1)
  if [ -n "$LATEST" ]; then
    import_one "$LATEST" || IMPORT_FAILED=1
  fi
done
if [ "$IMPORT_FAILED" != "0" ]; then
  echo "❌ import chotot fail — dừng trước transform, launchd thấy exit 1"
  exit 1
fi
# Từ đây trở xuống là làn Claude (AU3): chạy đủ các bước như cũ — refresh-bait-gap và
# resolve-properties là bước liên nguồn, vẫn chạy khi transform-chotot hỏng — nhưng thoát bằng
# mã của bước hỏng ĐẦU TIÊN để launchd thấy lỗi (đêm 22/10: DB lên lại giữa chuỗi → exit 0).
. "$ROOT/scripts/lib/job-step.sh"
job_run chotot-daily transform-chotot node "$ROOT/pipeline/transform-chotot.mjs"
job_run chotot-daily transform-media node "$ROOT/pipeline/transform-media.mjs" S06
job_run chotot-daily refresh-bait-gap node "$ROOT/pipeline/refresh-bait-gap.mjs"
job_run chotot-daily resolve-properties node "$ROOT/pipeline/resolve-properties.mjs"
exit "$JOB_RC"
