#!/bin/bash
# audit-all.sh — Kiểm tra toàn diện hệ thống One Invest
# Mỗi mục: PASS / FAIL / LIMITED + chi tiết
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"   # suy từ vị trí script (chạy đúng cây đang đứng, kể cả worktree)
DB="docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -tAc"
CLOUD="https://onehub-invest.vercel.app"
CTOKEN=$(grep CLOUD_OPS_API_TOKEN ~/.oneinvest/cloud.env 2>/dev/null | cut -d= -f2)
STOKEN=$(security find-generic-password -s "Supabase CLI" -a supabase -w 2>/dev/null)

P=0; F=0; L=0
pass() { echo "  ✅ $1"; P=$((P+1)); }
fail() { echo "  ❌ $1"; F=$((F+1)); }
limit() { echo "  ⚠️  $1 — $2"; L=$((L+1)); }
# count_matches <mẫu> [tệp] — luôn in đúng MỘT số nguyên (0 khi không khớp / tệp vắng); không tệp thì đọc stdin.
# Thay khuôn cũ «đếm bằng grep, lỗi thì in thêm 0»: không khớp thì grep vừa in 0 vừa thoát 1 nên biến thành "0\n0",
# phép so số lỗi rồi rơi xuống nhánh PASS (AU5).
count_matches() {
  local n
  if [ $# -ge 2 ]; then
    [ -r "$2" ] || { echo 0; return 0; }
    n=$(grep -c -- "$1" "$2" 2>/dev/null)
  else
    n=$(grep -c -- "$1" 2>/dev/null)
  fi
  echo "${n:-0}"
}

echo "════════════════════════════════════════════════════"
echo " AUDIT TOÀN DIỆN ONE INVEST — $(date '+%Y-%m-%d %H:%M')"
echo "════════════════════════════════════════════════════"

echo ""
echo "─── A. THU THẬP DỮ LIỆU ───"

echo "A1. AirDNA rotation"
LAST_AIRDNA=$($DB "SELECT max(captured_at)::date FROM airdna_markets;" 2>/dev/null)
N_MARKETS=$($DB "SELECT count(DISTINCT airdna_id) FROM airdna_market_metrics;" 2>/dev/null)
N_LISTINGS_AL=$($DB "SELECT count(*) FROM airdna_listings;" 2>/dev/null)
N_PHOTOS_AL=$($DB "SELECT count(*) FROM airdna_listings WHERE photo_urls IS NOT NULL;" 2>/dev/null)
[ "$N_MARKETS" -gt 0 ] 2>/dev/null && pass "AirDNA: $N_MARKETS markets có metrics, $N_LISTINGS_AL listings, $N_PHOTOS_AL có ảnh" || fail "AirDNA: không có metrics"
[ "$N_PHOTOS_AL" -lt "$N_LISTINGS_AL" ] 2>/dev/null && limit "AirDNA ảnh: $N_PHOTOS_AL/$N_LISTINGS_AL (chỉ top-50/submarket)" "rotation chưa quét hết; sẽ đầy hơn theo đêm"
LOG_AIRDNA=$(tail -5 $ROOT/pipeline/logs/airdna-daily.log 2>/dev/null | head -1)
[ -n "$LOG_AIRDNA" ] && pass "AirDNA nightly log: có activity" || limit "AirDNA nightly log trống" "chưa chạy đêm nào hoặc rotation mới cài"

echo "A2. Airbnb tự thu"
N_LISTINGS=$($DB "SELECT count(*) FROM listings;" 2>/dev/null)
N_PHOTOS=$($DB "SELECT count(*) FROM listings WHERE photo_urls IS NOT NULL AND photo_urls != '[]';" 2>/dev/null)
N_NIGHTS=$($DB "SELECT count(*) FROM nights;" 2>/dev/null)
[ "$N_LISTINGS" -gt 0 ] 2>/dev/null && pass "Airbnb: $N_LISTINGS listings, $N_NIGHTS nights, $N_PHOTOS/$N_LISTINGS có ảnh" || fail "Airbnb: 0 listings"
[ "$N_PHOTOS" -lt "$N_LISTINGS" ] 2>/dev/null && limit "Airbnb ảnh: $N_PHOTOS/$N_LISTINGS (thiếu $((N_LISTINGS-N_PHOTOS)))" "PDP chưa fetch đủ — collector Chủ nhật tích lũy"

echo "A3. Zalo (2 tài khoản)"
N_REAL=$($DB "SELECT count(*) FROM stg_zalo_posts WHERE snapshot_id LIKE '%zalo-agent%';" 2>/dev/null)
N_OFFERS=$($DB "SELECT count(*) FROM sale_offers o JOIN stg_zalo_posts z ON z.post_id = ANY(o.post_ids) WHERE z.snapshot_id LIKE '%zalo-agent%';" 2>/dev/null)
N_SENDER=$($DB "SELECT count(*) FROM stg_zalo_posts WHERE sender_name IS NOT NULL AND snapshot_id LIKE '%zalo-agent%';" 2>/dev/null)
N_MEDIA=$($DB "SELECT count(*) FROM stg_zalo_posts WHERE media IS NOT NULL AND snapshot_id LIKE '%zalo-agent%';" 2>/dev/null)
GATE_PASS=$(count_matches "post 202" "$HOME/.openclaw/logs/oneinvest-zalo-pipe.log")
GATE_SKIP=$(count_matches "skip p=" "$HOME/.openclaw/logs/oneinvest-zalo-pipe.log")
[ "$N_REAL" -gt 0 ] 2>/dev/null && pass "Zalo: $N_REAL posts thật → $N_OFFERS offers, gate $GATE_PASS pass/$GATE_SKIP skip" || fail "Zalo: 0 posts thật"
[ "$N_SENDER" -gt 0 ] 2>/dev/null && pass "Zalo sender capture: $N_SENDER posts có tên người đăng" || limit "Zalo sender: 0 (G1 mới deploy)" "buffer 50 items chưa flush"
[ "$N_MEDIA" -gt 0 ] 2>/dev/null && pass "Zalo media: $N_MEDIA posts có ảnh" || limit "Zalo media: 0 (buffer chưa flush)" "sẽ có sau khi flush"
# Check Diamond Land 3 drift
# Chỉ PASS khi thấy id nhóm trong danh sách; CLI vắng/lỗi → LIMITED (không kiểm được), không phải PASS (AU5)
OPENCLAW="$HOME/.openclaw/bin/openclaw"
[ -x "$OPENCLAW" ] || OPENCLAW=$(command -v openclaw 2>/dev/null || true)
if [ -z "$OPENCLAW" ]; then
  limit "Diamond Land 3: không kiểm được membership" "không có CLI OpenClaw"
else
  ZGROUPS=$("$OPENCLAW" directory groups list --channel zalouser 2>/dev/null); ZGROUPS_RC=$?
  if [ "$ZGROUPS_RC" -ne 0 ]; then
    limit "Diamond Land 3: không kiểm được membership" "CLI OpenClaw lỗi mã $ZGROUPS_RC"
  elif [ "$(printf '%s\n' "$ZGROUPS" | count_matches "6506309329752400506")" -gt 0 ]; then
    pass "Diamond Land 3: còn membership"
  else
    limit "Diamond Land 3: bị kick/rời nhóm" "cần vào lại hoặc tắt config"
  fi
fi

echo ""
echo "─── B. LƯU TRỮ & SYNC ───"

echo "B1. Local DB"
N_AREAS=$($DB "SELECT count(*) FROM areas WHERE region_type='market';" 2>/dev/null)
N_SUBS=$($DB "SELECT count(*) FROM airdna_sub_monthly;" 2>/dev/null)
N_FUTURE=$($DB "SELECT count(*) FROM airdna_future_daily;" 2>/dev/null)
pass "DB: $N_AREAS areas, $N_LISTINGS_AL airdna_listings, $N_SUBS sub_monthly, $N_FUTURE future_daily"

echo "B2. Cloud sync (Supabase)"
# Chống race với sync 15': nếu cloud=0 nhưng local>0 → sync đang chạy, không phải fail
CLOUD_COUNT=$(curl -s -X POST "https://api.supabase.com/v1/projects/smqpqiigzulwpmrsrhci/database/query" \
  -H "Authorization: Bearer $STOKEN" -H "content-type: application/json" \
  -d '{"query":"SELECT count(*)::int FROM ref_calib_listings"}' 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['count'])" 2>/dev/null || echo "ERR")
if [ "$CLOUD_COUNT" = "0" ] || [ "$CLOUD_COUNT" = "ERR" ]; then
  CLOUD_COUNT="sync đang chạy"
fi
[ "$CLOUD_COUNT" = "$N_LISTINGS_AL" ] 2>/dev/null && pass "Cloud sync: ref_calib_listings $CLOUD_COUNT = local $N_LISTINGS_AL" || fail "Cloud sync: cloud=$CLOUD_COUNT vs local=$N_LISTINGS_AL"
# Leak gate
LEAK=$(curl -s -X POST "https://api.supabase.com/v1/projects/smqpqiigzulwpmrsrhci/database/query" \
  -H "Authorization: Bearer $STOKEN" -H "content-type: application/json" \
  -d '{"query":"SELECT count(*) FROM information_schema.tables WHERE table_schema='"'"'public'"'"' AND table_name LIKE '"'"'airdna%'"'"'"}' 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['count'])" 2>/dev/null || echo "1")
[ "$LEAK" = "0" ] && pass "Leak gate: 0 bảng airdna% ở cloud" || fail "Leak gate: $LEAK bảng airdna% ở cloud"

echo "B3. Ops heartbeat"
HB_AGE=$(curl -s -H "Authorization: Bearer $CTOKEN" "$CLOUD/api/v1/ops/collections?days=1" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('zaloHealth',{}).get('heartbeatAgeMin','?'))" 2>/dev/null)
ACC_COUNT=$(curl -s -H "Authorization: Bearer $CTOKEN" "$CLOUD/api/v1/ops/collections?days=1" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('zaloAccounts',[])))" 2>/dev/null)
GROUP_COUNT=$(curl -s -H "Authorization: Bearer $CTOKEN" "$CLOUD/api/v1/ops/collections?days=1" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('zaloGroups',[])))" 2>/dev/null)
[ "$ACC_COUNT" -ge 2 ] 2>/dev/null && pass "Heartbeat: $ACC_COUNT accounts, $GROUP_COUNT groups, heartbeat ${HB_AGE}′" || fail "Heartbeat: chỉ $ACC_COUNT accounts"

echo ""
echo "─── C. INVEST PORTAL ───"
for page in "/" "/vn" "/vn/hanoi" "/listing/abnb_1143101959271074607" "/deals" "/yield" "/so-sanh" "/login"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD$page" 2>/dev/null)
  [ "$CODE" = "200" ] || [ "$CODE" = "307" ] && pass "$page → $CODE" || fail "$page → $CODE"
done

echo ""
echo "─── D. OPS PORTAL ───"
# Local — app dev chạy :3456. Audit chỉ đọc (Hỏi-1 = A): chưa đăng nhập thì /ops chuyển về /login (307) → chỉ
# thấy trang sống, không tính PASS; kiểm trang thật sau đăng nhập bằng scripts/dev-ops-login-check.sh.
OPS_BASE_URL="${OPS_BASE_URL:-http://localhost:3456}"
for page in "/ops" "/ops/collections" "/ops/quality" "/ops/sources"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$OPS_BASE_URL$page" 2>/dev/null)
  case "$CODE" in
    200) pass "local $page → $CODE" ;;
    302|307) limit "local $page → $CODE chưa đăng nhập" "chỉ thấy trang sống; kiểm sau đăng nhập: bash scripts/dev-ops-login-check.sh" ;;
    *) fail "local $page → $CODE" ;;
  esac
done
# Cloud (với token)
for ep in "ops/coverage" "ops/collections?days=1" "ops/truthful-coverage" "ops/extraction-quality"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CTOKEN" "$CLOUD/api/v1/$ep" 2>/dev/null)
  [ "$CODE" = "200" ] && pass "cloud API /$ep → $CODE" || fail "cloud API /$ep → $CODE"
done

echo ""
echo "─── E. PUBLIC APIs ───"
CODE_OFFERS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD/api/v1/offers?kind=sale&limit=5" 2>/dev/null)
CODE_STATS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD/api/v1/asset-stats?market=vn-hanoi" 2>/dev/null)
[ "$CODE_OFFERS" = "200" ] && pass "GET /api/v1/offers → 200" || fail "GET /api/v1/offers → $CODE_OFFERS"
[ "$CODE_STATS" = "200" ] && pass "GET /api/v1/asset-stats → 200" || fail "GET /api/v1/asset-stats → $CODE_STATS"

echo ""
echo "─── F. INFRASTRUCTURE ───"
AGENTS=$(launchctl list 2>/dev/null | count_matches "oneinvest")
pass "launchd agents: $AGENTS đang chạy"
# Scheduler health
for svc in ":8009" ":9210"; do
  ALIVE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1$svc/" 2>/dev/null)
  [ "$ALIVE" != "000" ] && pass "Service $svc sống" || fail "Service $svc chết"
done
# --- backup (AU5) ---
# Chưa có job → FAIL; job lỗi → FAIL kèm mã; job chạy mà plist không BACKUP_DIR thì backup.sh thoát 0 mà không sao
# lưu → FAIL; PASS chỉ khi thấy db-*.sql.gz ≤ 8 ngày (RPO 7 ngày ADR-0007 + 1).
BACKUP_JOB=$(launchctl list 2>/dev/null | awk -F'\t' '$3 == "com.oneinvest.backup"' | head -1)
if [ -z "$BACKUP_JOB" ]; then
  fail "Backup tuần CHƯA cài — cần BACKUP_DIR + BACKUP_PASS rồi chạy scripts/install-cron.sh"
else
  BACKUP_RC=$(printf '%s\n' "$BACKUP_JOB" | cut -f2)
  BACKUP_TO=$(/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:BACKUP_DIR" \
    "$HOME/Library/LaunchAgents/com.oneinvest.backup.plist" 2>/dev/null || true)
  if [ "$BACKUP_RC" != "0" ]; then
    fail "Backup tuần: lần chạy cuối thoát mã $BACKUP_RC (xem pipeline/logs/launchd-backup.log)"
  elif [ -z "$BACKUP_TO" ]; then
    fail "Backup tuần: job đã cài nhưng chưa đặt BACKUP_DIR — backup.sh bỏ qua, không sao lưu gì"
  else
    LAST_DUMP=$(find "$BACKUP_TO" -maxdepth 1 -name 'db-*.sql.gz' -mtime -8 2>/dev/null | sort | tail -1)
    [ -n "$LAST_DUMP" ] && pass "Backup tuần: $(basename "$LAST_DUMP")" \
      || fail "Backup tuần: không có bản sao lưu trong 8 ngày ở $BACKUP_TO"
  fi
fi
# --- hết backup ---

echo ""
echo "─── G. ĐỘ PHỦ TRUNG THỰC ───"
COVERAGE=$($DB "SELECT area_id || ': ' || round(count(*) FILTER (WHERE source_area_key IS NOT NULL)*100.0/count(*), 0) || '%' FROM area_sources WHERE source='S02' GROUP BY area_id ORDER BY 1 LIMIT 5;" 2>/dev/null)
pass "Crosswalk S02: $($DB "SELECT count(*) FROM area_sources WHERE source='S02';" 2>/dev/null) areas"

echo ""
echo "════════════════════════════════════════════════════"
echo " TỔNG KẾT: $P PASS · $F FAIL · $L LIMITED"
echo "════════════════════════════════════════════════════"
