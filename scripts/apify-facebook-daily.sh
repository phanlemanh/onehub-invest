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
THU_RC=0
node "$ROOT/pipeline/apify-facebook-collector.mjs" || THU_RC=$?
# 2510-4: KHÔNG nuốt mã thoát của bước thu — S05 active mà thu hỏng (vd 402)
# thì vẫn nạp snapshot sẵn có + transform, nhưng trả mã ≠0 ở CUỐI lượt.
if [ "$THU_RC" != 0 ]; then
  echo "⚠️ bước thu thoát mã $THU_RC — vẫn nạp snapshot sẵn có + transform; mã giữ lại trả cuối lượt"
fi

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
    echo "ECONNREFUSED (lần $try/5) — DB chưa lên? chờ 20s rồi nạp lại $snap"
    sleep 20
  done
  cat "$TMPLOG"; return 1
}
# Sort theo MỐC THỜI GIAN ở basename (mở lại 2310-8 R1): sort đường dẫn xếp
# THEO CITY trước — hanoi T13 nạp xong, hcmc T07 lỗi ⇒ state=T13, lượt sau
# BỎ QUA hcmc T07 vĩnh viễn. Sort TS toàn cục để nạp đúng thứ tự thời gian.
# Khoá quanh đọc-nạp-ghi state (mở lại 2310-8 a): zalo-import-daily.sh chạy
# 00:00 trên CHUNG state này — hai job đụng state là mất/sót snapshot.
LOCK_DIR="$STATE.lock"
# 2510-9: khoá nằm trong pipeline/logs sống qua kill -9/mất điện — ghi PID +
# giờ lấy khoá; PID chết hoặc khoá >2h thì gỡ lấy lại, đỡ kẹt tới khi gỡ tay.
go_khoa_cu() {
  local pid="" luc=""
  [ -f "$LOCK_DIR/pid" ] && read -r pid < "$LOCK_DIR/pid"
  [ -f "$LOCK_DIR/luc" ] && read -r luc < "$LOCK_DIR/luc"
  if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
    echo "gỡ khoá cũ của PID $pid (tiến trình đã chết)"; rm -rf "$LOCK_DIR"; return 0
  fi
  if [ -n "$luc" ] && [ $(( $(date +%s) - luc )) -gt 7200 ]; then
    echo "gỡ khoá cũ hơn 2h (PID ${pid:-?}, lấy lúc $luc)"; rm -rf "$LOCK_DIR"; return 0
  fi
  return 1
}
i=0; until mkdir "$LOCK_DIR" 2>/dev/null; do
  go_khoa_cu && continue
  i=$((i+1)); [ "$i" -ge 60 ] && { echo "❌ khoá $LOCK_DIR bận >5′ — job khác đang nạp?"; exit 1; }
  sleep 5
done
echo $$ > "$LOCK_DIR/pid"; date +%s > "$LOCK_DIR/luc"
trap 'rm -rf "$LOCK_DIR" 2>/dev/null; [ -n "${TMPLOG:-}" ] && rm -f "$TMPLOG"' EXIT
# đọc state SAU khi có khoá — hai job 00:00 không đọc-ghi chéo nhau
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
NAP_FAILED=0
# Chỉ nhận TS đúng dạng mốc thời gian (BÁO 2410-2, mở lại 2310-8 vòng 3):
# thư mục '…__zalo-agent__TEST' cho TS=TEST > mọi mốc 2026… → state nhảy,
# mọi snapshot thật sau đó bị bỏ. Không khớp → bỏ thư mục + log.
# Khuôn: giây (6 số, bản cũ) HOẶC mili-giây (9 số, storage.ts b0898fe trở đi)
# HOẶC kèm hậu tố '-n' khi trùng mili-giây. Sort chuỗi vẫn đúng thứ tự vì
# các khuôn chia sẻ tiền tố tới giây (state 6 số cũ giữ nguyên).
# GIỐNG HỆT zalo-import-daily.sh — hai bản phải không lệch nhau (BÁO 2510-5).
TS_RE='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$'
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | while read -r d; do
    b=${d##*/}; [ "${b#.}" != "$b" ] && continue # 2510-8: dir '.<id>.partial' đang ghi — bỏ
    ts=$(basename "$d" | sed 's/.*__//')
    if ! echo "$ts" | grep -qE "$TS_RE"; then
      echo "bỏ qua thư mục TS không phải mốc thời gian: $d" >&2; continue
    fi
    echo "$ts $d"
  done | sort | while read -r _ d; do echo "$d"; done); do
  TS=$(basename "$SNAP" | sed 's/.*__//')  # yyyymmddThhmmss — sort chuỗi = thời gian
  if [[ "$TS" > "$LAST" ]]; then
    # 2510-8: thiếu manifest = snapshot CHƯA xong (bản mới ghi '.partial' rồi
    # rename; bản cũ crash giữa chừng) — KHÔNG được coi là đã nạp.
    if [ ! -f "$SNAP/manifest.json" ]; then
      if [ -n "$(find "$SNAP" -maxdepth 0 -mmin -30 2>/dev/null)" ]; then
        echo "⏸ snapshot chưa xong (thiếu manifest, <30′): $SNAP — giữ state, dừng chuỗi, lượt sau thử lại"
        NAP_FAILED=1
        break
      fi
      echo "⚠️ snapshot mồ côi (thiếu manifest, ≥30′) — bỏ qua, đi tiếp: $SNAP"
      [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS"
      continue
    fi
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
# 2510-4: bước thu hỏng (đã log ở đầu) — nạp + transform vẫn chạy xong ở trên,
# giờ trả mã thu giữ lại để launchd thấy lượt có lỗi thu.
if [ "$THU_RC" != 0 ]; then exit "$THU_RC"; fi
exit "$JOB_RC"
