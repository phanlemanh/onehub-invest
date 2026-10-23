#!/bin/bash
# apify-facebook-daily.sh — Thu thập tin BĐS từ Facebook Groups qua Apify
# (KHÔNG dùng account Facebook cá nhân — Apify dùng proxy infrastructure riêng)
#
# Chạy 4 lần/ngày (6h/lần) qua launchd, rồi nạp snapshot mới + transform S05.
# Chi phí: ~100 posts/run × 4 runs/ngày = 400 posts/ngày = ~$2/ngày trên free tier
#
# Env: ~/.oneinvest/cloud.env cần có APIFY_TOKEN
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
# Collector API cần key để accept requests
AGENT_KEY=$(cat $HOME/.openclaw/credentials/oneinvest-agent.key 2>/dev/null | tr -d '
')
export AGENT_API_KEYS="$AGENT_KEY"
node "$ROOT/pipeline/apify-facebook-collector.mjs"

# Posts FB/Zalo flush vào snapshot zalo-agent khi buffer đủ 50 — nạp MỌI
# snapshot mới hơn lần chạy trước (state-file; idempotent nhờ ON CONFLICT
# post_id; buffer chưa flush sẽ được nạp ở chuỗi sau) rồi transform.
# AU3 phần nạp (claudedp-2310-8): BỎ `|| true` + state nhảy qua snapshot hỏng
# (bài học 22/10 — snapshot fail không bao giờ được nạp lại). Retry
# ECONNREFUSED 5×20s; còn lỗi thì dừng chuỗi TẠI ĐÓ, state giữ ở snapshot
# thành công cuối, exit ≠0 và KHÔNG transform trên dữ liệu thiếu.
STATE="$ROOT/pipeline/logs/apify-daily.state"
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
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
NAP_FAILED=0
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | sort); do
  TS=$(basename "$SNAP" | sed 's/.*__//')  # yyyymmddThhmmss — sort chuỗi = thời gian
  if [[ "$TS" > "$LAST" ]]; then
    if ! import_one "$SNAP"; then
      echo "❌ nạp fail tại $SNAP — giữ state ở $MAXTS, dừng chuỗi (lần chạy sau nạp tiếp)"
      NAP_FAILED=1
      break
    fi
    [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS"
  fi
done
echo "$MAXTS" > "$STATE"
if [ "$NAP_FAILED" != "0" ]; then
  # thoát NGAY — không chạy transform/refresh trên dữ liệu thiếu
  exit 1
fi
# Từ đây trở xuống là làn Claude (AU3): chạy đủ các bước như cũ nhưng thoát bằng mã của bước
# hỏng ĐẦU TIÊN để launchd thấy lỗi.
. "$ROOT/scripts/lib/job-step.sh"
job_run apify-facebook-daily transform-fb node "$ROOT/pipeline/transform-fb.mjs"
job_run apify-facebook-daily refresh-bait-gap node "$ROOT/pipeline/refresh-bait-gap.mjs"
exit "$JOB_RC"
