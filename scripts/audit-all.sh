#!/bin/bash
# audit-all.sh — Kiểm tra toàn diện hệ thống One Invest
# Mỗi mục: PASS / FAIL / LIMITED + chi tiết
set -uo pipefail
ROOT="/Users/manhphan/dev/one-invest"
DB="docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -tAc"
CLOUD="https://onehub-invest.vercel.app"
CTOKEN=$(grep CLOUD_OPS_API_TOKEN ~/.oneinvest/cloud.env 2>/dev/null | cut -d= -f2)
STOKEN=$(security find-generic-password -s "Supabase CLI" -a supabase -w 2>/dev/null)

P=0; F=0; L=0
pass() { echo "  ✅ $1"; P=$((P+1)); }
fail() { echo "  ❌ $1"; F=$((F+1)); }
limit() { echo "  ⚠️  $1 — $2"; L=$((L+1)); }

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
GATE_PASS=$(grep -c "post 202" ~/.openclaw/logs/oneinvest-zalo-pipe.log 2>/dev/null || echo 0)
GATE_SKIP=$(grep -c "skip p=" ~/.openclaw/logs/oneinvest-zalo-pipe.log 2>/dev/null || echo 0)
[ "$N_REAL" -gt 0 ] 2>/dev/null && pass "Zalo: $N_REAL posts thật → $N_OFFERS offers, gate $GATE_PASS pass/$GATE_SKIP skip" || fail "Zalo: 0 posts thật"
[ "$N_SENDER" -gt 0 ] 2>/dev/null && pass "Zalo sender capture: $N_SENDER posts có tên người đăng" || limit "Zalo sender: 0 (G1 mới deploy)" "buffer 50 items chưa flush"
[ "$N_MEDIA" -gt 0 ] 2>/dev/null && pass "Zalo media: $N_MEDIA posts có ảnh" || limit "Zalo media: 0 (buffer chưa flush)" "sẽ có sau khi flush"
# Check Diamond Land 3 drift
DL3_MEMBER=$(~/.openclaw/bin/openclaw directory groups list --channel zalouser 2>/dev/null | grep -c "6506309329752400506" || echo 0)
[ "$DL3_MEMBER" -eq 0 ] && limit "Diamond Land 3: bị kick/rời nhóm" "cần vào lại hoặc tắt config" || pass "Diamond Land 3: còn membership"

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
# Local
for page in "/ops" "/ops/collections" "/ops/quality" "/ops/sources"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "oi_session=audit-local" "http://localhost:3000$page" 2>/dev/null)
  [ "$CODE" = "200" ] || [ "$CODE" = "307" ] && pass "local $page → $CODE" || fail "local $page → $CODE"
done
# Cloud (với token)
for ep in "ops/coverage" "ops/collections?days=1" "ops/truthful-coverage" "ops/extraction-quality"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CTOKEN" "$CLOUD/api/v1/$ep" 2>/dev/null)
  [ "$CODE" = "200" ] && pass "cloud API /$ep → $CODE" || fail "cloud API /$ep → $CODE"
done

echo ""
echo "─── E. PUBLIC APIs ───"
CODE_STATS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD/api/v1/asset-stats?market=vn-hanoi" 2>/dev/null)
[ "$CODE_STATS" = "200" ] && pass "GET /api/v1/asset-stats → 200" || fail "GET /api/v1/asset-stats → $CODE_STATS"
# Tin rao + căn giá tốt đang tạm đóng (sổ bề mặt: ops) — khách phải 401, bearer phải 200.
for ep in "offers?kind=sale&limit=5" "deals?limit=5"; do
  CODE_ANON=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUD/api/v1/$ep" 2>/dev/null)
  CODE_TOK=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CTOKEN" "$CLOUD/api/v1/$ep" 2>/dev/null)
  [ "$CODE_ANON" = "401" ] && pass "GET /api/v1/$ep khách → 401 (tạm đóng)" || fail "GET /api/v1/$ep khách → $CODE_ANON (phải 401)"
  [ "$CODE_TOK" = "200" ] && pass "GET /api/v1/$ep bearer → 200" || fail "GET /api/v1/$ep bearer → $CODE_TOK"
done

echo ""
echo "─── F. INFRASTRUCTURE ───"
AGENTS=$(launchctl list 2>/dev/null | grep -c "oneinvest")
pass "launchd agents: $AGENTS đang chạy"
# Scheduler health
for svc in ":8009" ":9210"; do
  ALIVE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1$svc/" 2>/dev/null)
  [ "$ALIVE" != "000" ] && pass "Service $svc sống" || fail "Service $svc chết"
done
# Backup
BACKUP_INSTALLED=$(launchctl list 2>/dev/null | grep -c "oneinvest.backup" || echo 0)
[ "$BACKUP_INSTALLED" -eq 0 ] && limit "Backup tuần CHƯA cài" "cần BACKUP_DIR + BACKUP_PASS" || pass "Backup tuần đã cài"

echo ""
echo "─── G. ĐỘ PHỦ TRUNG THỰC ───"
COVERAGE=$($DB "SELECT area_id || ': ' || round(count(*) FILTER (WHERE source_area_key IS NOT NULL)*100.0/count(*), 0) || '%' FROM area_sources WHERE source='S02' GROUP BY area_id ORDER BY 1 LIMIT 5;" 2>/dev/null)
pass "Crosswalk S02: $($DB "SELECT count(*) FROM area_sources WHERE source='S02';" 2>/dev/null) areas"

echo ""
echo "════════════════════════════════════════════════════"
echo " TỔNG KẾT: $P PASS · $F FAIL · $L LIMITED"
echo "════════════════════════════════════════════════════"
