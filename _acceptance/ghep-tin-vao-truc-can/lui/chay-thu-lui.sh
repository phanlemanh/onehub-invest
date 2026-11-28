#!/usr/bin/env bash
# chay-thu-lui.sh — PL36: chạy thử đường lùi (hồ sơ áp mục 4) trên DB THỬ chép từ DB máy thu, KHÔNG chạm DB `oneinvest`.
# Dựng DB thử bằng db/db-thu.sh → chụp trạng thái trước → áp 131 + 138 → lượt gắn đầu thật (buocGhepCan) → lui-131.sql →
# ba lệnh kiểm mục 4 + so trạng thái trước/sau → xoá DB thử. Thoát 1 ở kiểm đầu tiên sai.
# Chạy từ gốc worktree, trong lượt khoá s4: bash _acceptance/ghep-tin-vao-truc-can/lui/chay-thu-lui.sh
set -euo pipefail
T=oneinvest_p4_lui131
R="'ghep-can-truc','ghep-can-ma','ghep-can-truc-tang','ghep-can-tang-tu-ma'"
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$T" -Atc "$1"; }
P(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d "$T" -v ON_ERROR_STOP=1 -q; }
[ "$T" != oneinvest ] || exit 2
trap 'bash db/db-thu.sh "$T" --xoa >/dev/null 2>&1 || true' EXIT
hong(){ echo "LUI DO: $*"; exit 1; }
# Trạng thái so sánh: đầu ra offer_building (băm theo thứ tự), số dòng sống, thân view offer_building.
trang_thai(){ Q "SELECT md5(string_agg(t::text, '|' ORDER BY t::text)) FROM offer_building t" ; \
  Q "SELECT count(*) FILTER (WHERE retracted_at IS NULL) FROM field_assertions"; \
  Q "SELECT md5(pg_get_viewdef('offer_building'::regclass))"; }

echo "== dựng $T ($(date -u +%H:%M:%SZ))"; bash db/db-thu.sh "$T"
echo "== điều kiện"; Q "SELECT to_regclass('public.offer_building') IS NOT NULL, to_regclass('public.offer_unit') IS NOT NULL, (SELECT count(*) FROM field_assertions WHERE rule_id IN ($R))"
TRUOC=$(trang_thai); echo "trước: $(echo $TRUOC)"
echo "== áp 131 + 138 ($(date -u +%H:%M:%SZ))"
P < db/migrations/131_ghep_truc_can_tren_tin.sql; P < db/migrations/138_offer_unit_can_tu_phat_bieu.sql
Q "SELECT pg_get_viewdef('offer_unit'::regclass) LIKE '%can_pb%'"
echo "== lượt gắn đầu ($(date -u +%H:%M:%SZ))"
(cd pipeline && DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$T" node -e 'import("./lib/ghep-tin-truc-can-ghi.mjs").then(async ({ buocGhepCan }) => {
  const pg = (await import("pg")).default; const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect(); await buocGhepCan(c, { log: (m) => { console.log(m); process.exitCode = 3; } }); await c.end(); })')
Q "SELECT status, muc, count(*) FROM offer_unit GROUP BY 1, 2 ORDER BY 1, 2"
SONG=$(Q "SELECT count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R)"); echo "dòng sống bốn rule_id: $SONG"
[ "$SONG" -gt 0 ] || hong "lượt gắn đầu không ghi dòng nào"
echo "== lui-131 ($(date -u +%H:%M:%SZ))"; P < _acceptance/ghep-tin-vao-truc-can/lui/lui-131.sql
echo "== kiểm mục 4"
K1=$(Q "SELECT count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R)"); echo "dòng sống bốn rule_id: $K1 (phải 0)"; [ "$K1" = 0 ] || hong K1
K2=$(Q "SELECT to_regclass('public.offer_unit') IS NOT NULL"); echo "offer_unit còn: $K2 (phải f)"; [ "$K2" = f ] || hong K2
K3=$(Q "SELECT count(*) FROM field_assertions WHERE retract_reason = 'lui-pl36'"); echo "dòng rút lui-pl36: $K3 (phải = $SONG)"; [ "$K3" = "$SONG" ] || hong K3
Q "SELECT status, muc, count(*) FROM offer_building GROUP BY 1, 2 ORDER BY 1, 2"
SAU=$(trang_thai); echo "sau: $(echo $SAU)"
B1=$(echo "$TRUOC" | sed -n 1p); B2=$(echo "$SAU" | sed -n 1p)
[ "$B1" = "$B2" ] || hong "đầu ra offer_building khác trước áp"
V1=$(echo "$TRUOC" | sed -n 3p); V2=$(echo "$SAU" | sed -n 3p)
echo "thân offer_building như trước áp: $([ "$V1" = "$V2" ] && echo có || echo không — 117 khác 131 về chữ, đầu ra đã so ở trên)"
N1=$(echo "$TRUOC" | sed -n 2p); N2=$(echo "$SAU" | sed -n 2p); echo "dòng sống field_assertions: trước $N1 · sau $N2 (phải bằng)"
[ "$N1" = "$N2" ] || hong "số dòng sống khác trước áp"
echo "== phần dư có chủ đích (không lùi): CHECK có universal_property_sub_id = $(Q "SELECT pg_get_constraintdef(oid) LIKE '%universal_property_sub_id%' FROM pg_constraint WHERE conname = 'field_assertions_field_chk' AND conrelid = 'public.field_assertions'::regclass")"
echo "LUI XANH ($(date -u +%H:%M:%SZ))"
