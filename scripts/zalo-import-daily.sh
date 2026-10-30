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

# Sort theo MỐC THỜI GIAN basename + khoá state chung với apify-facebook-daily
# (mở lại 2310-8 R1/a — hai job cùng 00:00 đụng apify-daily.state)
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
trap 'rm -rf "$LOCK_DIR" 2>/dev/null' EXIT
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
FAILED=0
# Chỉ nhận TS đúng dạng mốc thời gian (BÁO 2410-2, mở lại 2310-8 vòng 3):
# thư mục '…__zalo-agent__TEST' cho TS=TEST > mọi mốc 2026… → state nhảy,
# mọi snapshot thật sau đó bị bỏ. Không khớp → bỏ thư mục + log.
# Khuôn: giây (6 số, bản cũ) HOẶC mili-giây (9 số, storage.ts b0898fe trở đi)
# HOẶC kèm hậu tố '-n' khi trùng mili-giây. Sort chuỗi vẫn đúng thứ tự vì
# các khuôn chia sẻ tiền tố tới giây (state 6 số cũ giữ nguyên).
# GIỐNG HỆT apify-facebook-daily.sh — hai bản phải không lệch nhau (BÁO 2510-5).
TS_RE='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$'
for SNAP in $(ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* 2>/dev/null | while read -r d; do
    b=${d##*/}; [ "${b#.}" != "$b" ] && continue # 2510-8: dir '.<id>.partial' đang ghi — bỏ
    ts=$(basename "$d" | sed 's/.*__//')
    if ! echo "$ts" | grep -qE "$TS_RE"; then
      echo "bỏ qua thư mục TS không phải mốc thời gian: $d" >&2; continue
    fi
    echo "$ts $d"
  done | sort | while read -r _ d; do echo "$d"; done); do
  TS=$(basename "$SNAP" | sed 's/.*__//')
  if [[ "$TS" > "$LAST" ]]; then
    # 2510-8: thiếu manifest = snapshot CHƯA xong (bản mới ghi '.partial' rồi
    # rename; bản cũ crash giữa chừng) — KHÔNG được coi là đã nạp.
    if [ ! -f "$SNAP/manifest.json" ]; then
      if [ -n "$(find "$SNAP" -maxdepth 0 -mmin -30 2>/dev/null)" ]; then
        echo "⏸ snapshot chưa xong (thiếu manifest, <30′): $SNAP — giữ state, dừng chuỗi, lượt sau thử lại"
        FAILED=1
        break
      fi
      echo "⚠️ snapshot mồ côi (thiếu manifest, ≥30′) — bỏ qua, đi tiếp: $SNAP"
      [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS"
      continue
    fi
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
# Từ đây trở xuống là làn Claude (AU3 Ngoài-3): chạy đủ các bước như cũ nhưng thoát bằng mã của bước
# hỏng ĐẦU TIÊN để launchd thấy lỗi.
. "$ROOT/scripts/lib/job-step.sh"
job_run zalo-import-daily transform-zalo node "$ROOT/pipeline/transform-zalo.mjs"
job_run zalo-import-daily transform-media node "$ROOT/pipeline/transform-media.mjs" S03 S05
job_run zalo-import-daily refresh-bait-gap node "$ROOT/pipeline/refresh-bait-gap.mjs"
exit "$JOB_RC"
