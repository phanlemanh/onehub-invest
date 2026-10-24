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
import_one() {
  local snap="$1" try
  TMPLOG=$(mktemp)
  for try in 1 2 3 4 5; do
    if node "$ROOT/pipeline/import-airbnb.mjs" "$snap" >"$TMPLOG" 2>&1; then
      cat "$TMPLOG"; return 0
    fi
    if ! grep -q "ECONNREFUSED" "$TMPLOG"; then
      cat "$TMPLOG"; return 1 # lỗi khác DB — retry vô ích
    fi
    if [ "$try" -lt 5 ]; then
      echo "ECONNREFUSED (lần $try/5) — DB chưa lên? chờ 20s rồi nạp lại $snap"
      sleep 20 # bỏ sleep sau lần cuối (mở lại 2310-8 b)
    fi
  done
  cat "$TMPLOG"; return 1
}
# Sort theo MỐC THỜI GIAN ở basename (mở lại 2310-8 R1): sort đường dẫn xếp
# THEO CITY trước — hanoi T13 nạp xong, hcmc T07 lỗi ⇒ state=T13, lượt sau
# BỎ QUA hcmc T07 vĩnh viễn. Sort TS toàn cục để nạp đúng thứ tự thời gian.
# Khoá quanh đọc-nạp-ghi state (mở lại 2310-8 a): zalo-import-daily.sh chạy
# 00:00 trên CHUNG state này — hai job đụng state là mất/sót snapshot.
LOCK_DIR="$STATE.lock"
i=0; until mkdir "$LOCK_DIR" 2>/dev/null; do
  i=$((i+1)); [ "$i" -ge 60 ] && { echo "❌ khoá $LOCK_DIR bận >5′ — job khác đang nạp?"; exit 1; }
  sleep 5
done
trap 'rmdir "$LOCK_DIR" 2>/dev/null; [ -n "${TMPLOG:-}" ] && rm -f "$TMPLOG"' EXIT
# đọc state SAU khi có khoá — hai job 00:00 không đọc-ghi chéo nhau
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
NAP_FAILED=0
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | while read -r d; do echo "$(basename "$d" | sed 's/.*__//') $d"; done | sort | while read -r _ d; do echo "$d"; done); do
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
