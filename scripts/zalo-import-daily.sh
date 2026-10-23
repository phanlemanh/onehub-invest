#!/bin/bash
# zalo-import-daily.sh — nạp snapshot zalo-agent mới (Zalo + FB nếu bật)
# vào stg + refresh bait-gap. Tách khỏi apify-facebook-daily.sh 2026-10-21
# (user pause Facebook — nhưng Zalo pipe vẫn cần nạp hằng đêm 00:00).
#
# Bài học 22/10 (DB chết 22:49, nạp 00:00 fail): `|| true` + state vẫn nhảy
# qua snapshot fail → snapshot đó KHÔNG BAO GIỜ được nạp lại. Giờ: mỗi
# snapshot fail sau khi retry được giữ nguyên con trỏ state, chuỗi DỪNG tại
# đó (các snapshot sau chờ lần chạy kế tiếp khi DB đã lên), và script thoát
# ≠0 để log/monitor thấy nạp đêm có lỗi — transform không chạy trên dữ liệu
# thiếu.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

STATE="$ROOT/pipeline/logs/apify-daily.state"  # dùng chung state — không nạp lại
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"

# Nạp 1 snapshot; ECONNREFUSED (DB container đang lên lại) thì retry
# tối đa 5 lần cách 20s. Trả 0 khi đã vào stg.
import_one() {
  local snap="$1" log try
  log=$(mktemp)
  for try in 1 2 3 4 5; do
    if node "$ROOT/pipeline/import-airbnb.mjs" "$snap" >"$log" 2>&1; then
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

FAILED=0
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | sort); do
  TS=$(basename "$SNAP" | sed 's/.*__//')
  if [[ "$TS" > "$LAST" ]]; then
    if ! import_one "$SNAP"; then
      echo "❌ nạp fail tại $SNAP — giữ state ở $MAXTS, dừng chuỗi (lần chạy sau nạp tiếp)"
      FAILED=1
      break
    fi
    [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS"
  fi
done
echo "$MAXTS" > "$STATE"

if [ "$FAILED" != "0" ]; then
  exit 1 # có lỗi — bỏ qua transform/refresh, để nguyên cho lần sau
fi
node "$ROOT/pipeline/transform-zalo.mjs"
node "$ROOT/pipeline/refresh-bait-gap.mjs"
