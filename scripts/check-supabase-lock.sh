#!/bin/bash
# check-supabase-lock.sh — kiểm migration 037 (khoá anon/authenticated + bật RLS trên
# Supabase). Hồ sơ: _acceptance/supabase-lock-anon-rls/.
#
#   static  037 chỉ REVOKE/ENABLE RLS/ALTER DEFAULT PRIVILEGES: không ghi dữ liệu, không
#           GRANT, không đụng service_role, no-op khi không có role anon
#   local   áp 037 hai lần vào DB local :5433 → exit 0, quyền/RLS/option local không đổi (no-op)
#   sim     container Supabase Postgres + PostgREST tạm (cùng image Supabase, role và default
#           privileges y cloud) dựng từ db/migrations → trước: anon đọc được (lỗ tái hiện);
#           sau 037 (áp 2 lần): anon/authenticated hết quyền, RLS bật, service_role + postgres
#           vẫn đọc/ghi/TRUNCATE, bảng/hàm tạo sau không cấp lại cho anon. Tự dọn container.
#   cloud   ĐO CHỈ ĐỌC Supabase prod: bảng quyền (không dữ liệu) qua Management API
#           read_only + thăm PostgREST bằng HEAD (chỉ mã trạng thái + số dòng). Cần
#           ~/.oneinvest/cloud.env. Không nằm trong eval CI (cần khoá).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-}"
MIG="$ROOT/db/migrations/037_lock_anon_enable_rls.sql"
ROLLBACK="$ROOT/docs/ops/supabase-lock-anon-rls.rollback.sql"
FAIL=0
pass() { echo "PASS $*"; }
fail() { echo "FAIL $*"; FAIL=1; }

# Bảng quyền: mỗi quan hệ public một dòng — tên|loại|chủ|rls|anon|authenticated|service_role.
# Chữ quyền: r SELECT · a INSERT · w UPDATE · d DELETE · D TRUNCATE; sequence: U USAGE r w.
privs() { # $1 = tên role
  echo "concat(CASE WHEN has_table_privilege('$1',c.oid,'SELECT') THEN 'r' END, CASE WHEN has_table_privilege('$1',c.oid,'INSERT') THEN 'a' END, CASE WHEN has_table_privilege('$1',c.oid,'UPDATE') THEN 'w' END, CASE WHEN has_table_privilege('$1',c.oid,'DELETE') THEN 'd' END, CASE WHEN has_table_privilege('$1',c.oid,'TRUNCATE') THEN 'D' END)"
}
seqp() { echo "concat(CASE WHEN has_sequence_privilege('$1',c.oid,'USAGE') THEN 'U' END, CASE WHEN has_sequence_privilege('$1',c.oid,'SELECT') THEN 'r' END, CASE WHEN has_sequence_privilege('$1',c.oid,'UPDATE') THEN 'w' END)"; }
fnp() { echo "count(*) FILTER (WHERE has_function_privilege('$1',p.oid,'EXECUTE'))||'/'||count(*)"; }
MATRIX_SQL="SELECT relname, kind, owner, rls, anon, authn, svc FROM (
 SELECT c.relname::text AS relname, c.relkind::text AS kind, pg_get_userbyid(c.relowner)::text AS owner,
   CASE WHEN c.relkind IN ('r','p') THEN CASE WHEN c.relrowsecurity THEN 'on' ELSE 'OFF' END
        WHEN c.relkind = 'v' THEN CASE WHEN c.reloptions::text ~ 'security_invoker=(true|on)' THEN 'invoker' ELSE 'definer' END
        ELSE '-' END AS rls,
   $(privs anon) AS anon, $(privs authenticated) AS authn, $(privs service_role) AS svc
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
 UNION ALL
 SELECT c.relname, 'S', pg_get_userbyid(c.relowner), '-', $(seqp anon), $(seqp authenticated), $(seqp service_role)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='S'
 UNION ALL
 SELECT '(hàm public)', 'F', pg_get_userbyid(p.proowner), '-', 'X ' || $(fnp anon), 'X ' || $(fnp authenticated), 'X ' || $(fnp service_role)
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' GROUP BY p.proowner
) m ORDER BY kind, relname, owner"
# Default privileges của các role tạo đối tượng (không có dữ liệu, chỉ ACL).
DEFACL_SQL="SELECT pg_get_userbyid(d.defaclrole)::text AS role, coalesce(n.nspname,'*')::text AS schema, d.defaclobjtype::text AS obj, d.defaclacl::text AS acl
 FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
 WHERE coalesce(n.nspname,'*') IN ('public','*') ORDER BY 1,2,3"
# Tóm tắt theo đối tượng của role chạy 037 (postgres trên cloud) — cái 037 sửa được. Ghi rõ
# tên role: Management API read_only chạy bằng role khác (supabase_read_only_user).
OWNROLE=postgres
OWN="FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND pg_has_role('$OWNROLE',c.relowner,'USAGE') AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e')"
ALLP="'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'"
SUMMARY_SQL="SELECT k, v FROM (VALUES
 (1,'rel_owned',          (SELECT count(*) $OWN AND c.relkind IN ('r','p','v','m','f'))::text),
 (2,'rel_api_open',       (SELECT count(*) $OWN AND c.relkind IN ('r','p','v','m','f') AND (has_table_privilege('anon',c.oid,$ALLP) OR has_table_privilege('authenticated',c.oid,$ALLP)))::text),
 (3,'tables_rls_off',     (SELECT count(*) $OWN AND c.relkind IN ('r','p') AND NOT c.relrowsecurity)::text),
 (4,'views_definer',      (SELECT count(*) $OWN AND c.relkind='v' AND coalesce(c.reloptions::text,'') !~ 'security_invoker=(true|on)')::text),
 (5,'seq_api_open',       (SELECT count(*) $OWN AND c.relkind='S' AND (has_sequence_privilege('anon',c.oid,'USAGE,SELECT,UPDATE') OR has_sequence_privilege('authenticated',c.oid,'USAGE,SELECT,UPDATE')))::text),
 (6,'svc_tables_missing', (SELECT count(*) $OWN AND c.relkind IN ('r','p') AND NOT (has_table_privilege('service_role',c.oid,'SELECT') AND has_table_privilege('service_role',c.oid,'INSERT') AND has_table_privilege('service_role',c.oid,'DELETE')))::text),
 (7,'fn_owned',           (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND pg_has_role('$OWNROLE',p.proowner,'USAGE') AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'))::text),
 (8,'fn_api_exec',        (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND pg_has_role('$OWNROLE',p.proowner,'USAGE') AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')))::text),
 (9,'defacl_api',         (SELECT count(*) FROM pg_default_acl d JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclrole=(SELECT oid FROM pg_roles WHERE rolname='$OWNROLE') AND n.nspname='public' AND d.defaclacl::text ~ '(anon|authenticated)=')::text),
 (10,'defacl_fn_public',  (NOT EXISTS (SELECT 1 FROM pg_default_acl d WHERE d.defaclrole=(SELECT oid FROM pg_roles WHERE rolname='$OWNROLE') AND d.defaclnamespace=0 AND d.defaclobjtype='f' AND d.defaclacl::text !~ '(^\{|,)=X'))::text),
 (11,'foreign_api_open',  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f') AND NOT pg_has_role('$OWNROLE',c.relowner,'USAGE') AND has_table_privilege('anon',c.oid,$ALLP))::text)
) s(i,k,v) ORDER BY i"
EXPECT_AFTER="rel_api_open=0 tables_rls_off=0 views_definer=0 seq_api_open=0 svc_tables_missing=0 fn_api_exec=0 defacl_api=0 defacl_fn_public=false"

hsh() { if command -v md5sum >/dev/null; then md5sum | cut -d' ' -f1; else md5; fi; }
check_summary() { # $1 = nhãn, stdin = dòng k=v
  local s; s=$(cat)
  for want in $EXPECT_AFTER; do
    local k=${want%%=*}; local got; got=$(echo "$s" | sed -n "s/^$k=//p")
    [ "$k=$got" = "$want" ] && pass "$1 $want" || fail "$1 $k=$got (cần ${want#*=})"
  done
}

case "$MODE" in
  static)
    grep -Eiq '^\s*(INSERT|UPDATE|DELETE|TRUNCATE|DROP|COPY)\b' "$MIG" && fail "037 có câu ghi/xoá dữ liệu" || pass "037 không INSERT/UPDATE/DELETE/TRUNCATE/DROP/COPY"
    grep -Ev '^\s*--' "$MIG" | grep -Eiq '\bGRANT\b' && fail "037 có GRANT" || pass "037 không GRANT quyền nào"
    grep -Ev '^\s*--' "$MIG" | grep -iq 'service_role' && fail "037 chạm service_role (sync-cloud cần)" || pass "037 không đụng service_role"
    grep -Eiq 'FORCE ROW LEVEL SECURITY' "$MIG" && fail "037 FORCE RLS (chặn cả chủ bảng)" || pass "037 không FORCE RLS"
    grep -Eiq 'CREATE POLICY' "$MIG" && fail "037 thêm policy (mở lối cho role API)" || pass "037 không thêm policy"
    grep -q "rolname = 'anon'" "$MIG" && grep -q 'RETURN;' "$MIG" && pass "037 dừng sớm khi không có role anon" || fail "037 thiếu chốt no-op khi không có role anon"
    ;;
  local)
    CT=one-invest-db
    q() { docker exec -i -e PGPASSWORD=oneinvest "$CT" psql -U oneinvest -h localhost -d oneinvest -X -At -v ON_ERROR_STOP=1 "$@"; }
    SNAP="SELECT md5(string_agg(c.relname||':'||coalesce(c.relacl::text,'')||':'||c.relrowsecurity||':'||coalesce(c.reloptions::text,''), ',' ORDER BY c.relname)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'"
    SNAPF="SELECT md5(coalesce(string_agg(p.oid::regprocedure::text||':'||coalesce(p.proacl::text,''), ',' ORDER BY 1),'')||(SELECT coalesce(string_agg(defaclacl::text,',' ORDER BY defaclrole, defaclnamespace, defaclobjtype),'') FROM pg_default_acl)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'"
    [ "$(q -c "SELECT count(*) FROM pg_roles WHERE rolname='anon'")" = 0 ] && pass "DB local không có role anon" || fail "DB local có role anon — 037 sẽ không no-op"
    B=$(q -c "$SNAP"); BF=$(q -c "$SNAPF")
    for i in 1 2; do
      OUT=$(q < "$MIG" 2>&1) && pass "037 lần $i exit 0 trên local" || fail "037 lần $i lỗi trên local: $OUT"
      echo "$OUT" | grep -q 'bỏ qua' && pass "037 lần $i báo bỏ qua (no-op)" || fail "037 lần $i không báo bỏ qua"
    done
    [ "$B" = "$(q -c "$SNAP")" ] && pass "quyền/RLS/option quan hệ local không đổi (md5 $B)" || fail "037 đổi quyền/RLS ở local"
    [ "$BF" = "$(q -c "$SNAPF")" ] && pass "quyền hàm + default privileges local không đổi" || fail "037 đổi quyền hàm/default privileges ở local"
    ;;
  sim)
    IMG=public.ecr.aws/supabase/postgres:17.6.1.158
    RIMG=public.ecr.aws/supabase/postgrest:v14.16
    NET=acc-sblock-net; DB=acc-sblock-db; REST=acc-sblock-rest; PORT=54397
    PW=simpass-$RANDOM$RANDOM; SECRET=$(openssl rand -hex 32)
    cleanup() { docker rm -f "$REST" "$DB" >/dev/null 2>&1; docker network rm "$NET" >/dev/null 2>&1; }
    trap cleanup EXIT; cleanup
    docker network create "$NET" >/dev/null
    docker run -d --rm --name "$DB" --network "$NET" -e POSTGRES_PASSWORD="$PW" "$IMG" >/dev/null || { echo "FAIL không chạy được container $IMG"; exit 1; }
    sq() { local u="${U:-postgres}"; docker exec -i -e PGPASSWORD="$PW" "$DB" psql -U "$u" -h localhost -d postgres -X -At -v ON_ERROR_STOP=1 "$@"; }
    for i in $(seq 1 60); do sq -c "SELECT 1 FROM pg_roles WHERE rolname='authenticator'" 2>/dev/null | grep -q 1 && break; sleep 2; done
    sq -c "SELECT 1" >/dev/null 2>&1 || { echo "FAIL Postgres giả lập không lên"; exit 1; }
    # PostGIS ở public do supabase_admin làm chủ — y cloud
    U=supabase_admin sq -q -c "CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public" -c "ALTER ROLE authenticator WITH PASSWORD '$PW'" >/dev/null
    BAD=""
    for f in "$ROOT"/db/migrations/*.sql; do
      [ "$f" = "$MIG" ] && continue
      sq -q < "$f" >/dev/null 2>&1 || BAD="$BAD $(basename "$f" .sql)"
    done
    [ -n "$BAD" ] && echo "note: lỗi trên DB trống (tồn đọng, ngoài phạm vi):$BAD"
    # Bảng cloud-only (không có trong migration) — mô phỏng để có bảng do sync/app ghi
    sq -q -c "CREATE TABLE IF NOT EXISTS ops_heartbeat (job text PRIMARY KEY, at timestamptz DEFAULT now())" >/dev/null
    for t in users sessions sale_offers sellers properties ops_audit saved_markets v_ruler_p2_area; do
      sq -c "SELECT to_regclass('public.$t') IS NOT NULL" | grep -q t || fail "giả lập thiếu $t"
    done

    # PostgREST thật trước authenticator — đo lớp HTTP mà anon key đi qua
    docker run -d --rm --name "$REST" --network "$NET" -p 127.0.0.1:$PORT:3000 \
      -e PGRST_DB_URI="postgres://authenticator:$PW@$DB:5432/postgres" -e PGRST_DB_SCHEMAS=public \
      -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET="$SECRET" "$RIMG" >/dev/null || fail "không chạy được PostgREST"
    jwt() { node -e 'const c=require("crypto"),b=o=>Buffer.from(JSON.stringify(o)).toString("base64url");const h=b({alg:"HS256",typ:"JWT"}),p=b({role:process.argv[1],iss:"supabase",exp:Math.floor(Date.now()/1e3)+3600});process.stdout.write(h+"."+p+"."+c.createHmac("sha256",process.argv[2]).update(h+"."+p).digest("base64url"))' "$1" "$SECRET"; }
    ANON=$(jwt anon); SVC=$(jwt service_role)
    code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
    for i in $(seq 1 30); do [ "$(code "http://127.0.0.1:$PORT/")" = 200 ] && break; sleep 1; done
    rest() { # $1 khoá, $2 bảng → mã HTTP của GET
      code "http://127.0.0.1:$PORT/$2?select=*&limit=1" -H "apikey: $1" -H "Authorization: Bearer $1"; }

    echo "== TRƯỚC 037"
    BEFORE=$(sq -c "$SUMMARY_SQL" -F'='); echo "$BEFORE" | sed 's/^/  /'
    MB=$( (sq -c "$MATRIX_SQL"; sq -c "$DEFACL_SQL") | hsh)
    [ "$(echo "$BEFORE" | sed -n 's/^rel_api_open=//p')" -gt 0 ] && pass "giả lập tái hiện lỗ: anon/authenticated có quyền trên bảng của postgres" || fail "giả lập không tái hiện lỗ cloud"
    [ "$(rest "$ANON" sessions)" = 200 ] && pass "trước: PostgREST anon GET /sessions = 200 (lỗ tái hiện)" || fail "trước: anon /sessions không 200 — giả lập lệch cloud"

    for i in 1 2; do
      OUT=$(sq < "$MIG" 2>&1) && pass "037 lần $i exit 0 trên Supabase giả lập" || fail "037 lần $i lỗi: $OUT"
      eval "M$i=\$(sq -c \"\$MATRIX_SQL\" | hsh)"
    done
    [ "$M1" = "$M2" ] && pass "bảng quyền sau lần 1 == sau lần 2 (idempotent)" || fail "lần 2 đổi bảng quyền"

    echo "== SAU 037"
    AFTER=$(sq -c "$SUMMARY_SQL" -F'='); echo "$AFTER" | sed 's/^/  /'
    check_summary "sau:" <<< "$AFTER"

    # Vế chặn: role API không đọc/ghi được, kể cả bảng nhạy cảm
    denied() { # $1 role, $2 câu SQL — PASS chỉ khi lỗi đúng là thiếu quyền
      local out; out=$(sq -c "SET ROLE $1; $2" 2>&1)
      echo "$out" | grep -q 'permission denied' && pass "$1: $2 → permission denied" || fail "$1: $2 không bị từ chối vì thiếu quyền: $(echo "$out" | head -1)"; }
    for t in sessions users sale_offers sellers saved_markets; do denied anon "SELECT 1 FROM $t LIMIT 1"; done
    denied authenticated "SELECT 1 FROM users LIMIT 1"
    denied anon "INSERT INTO sessions DEFAULT VALUES"
    denied anon "SELECT 1 FROM v_ruler_p2_area LIMIT 1"
    for t in sessions users sale_offers; do
      c=$(rest "$ANON" $t); [ "$c" = 401 ] || [ "$c" = 403 ] && pass "PostgREST anon GET /$t = $c" || fail "PostgREST anon GET /$t = $c (cần 401/403)"
    done

    # Đường sống: service_role (sync-cloud, drill-restore) và postgres (app, Management API)
    sq -c "SET ROLE service_role; SELECT count(*) FROM sessions; SELECT count(*) FROM areas" >/dev/null 2>&1 && pass "service_role đọc sessions/areas" || fail "service_role không đọc được"
    sq -c "BEGIN; SET LOCAL ROLE service_role; INSERT INTO ops_audit(actor, action, env) VALUES ('machine:acc','acc.sim','cloud'); ROLLBACK" >/dev/null 2>&1 && pass "service_role INSERT ops_audit (+ sequence)" || fail "service_role không INSERT được"
    c=$(rest "$SVC" sessions); [ "$c" = 200 ] && pass "PostgREST service_role GET /sessions = 200" || fail "PostgREST service_role GET /sessions = $c"
    c=$(code -X POST "http://127.0.0.1:$PORT/ops_audit" -H "apikey: $SVC" -H "Authorization: Bearer $SVC" -H 'content-type: application/json' -H 'Prefer: return=minimal' -d '[{"actor":"machine:acc","action":"acc.sim","env":"cloud"}]')
    [ "$c" = 201 ] && pass "PostgREST service_role POST /ops_audit = 201 (đường INSERT của sync-cloud)" || fail "PostgREST service_role POST /ops_audit = $c"
    sq -c "BEGIN; TRUNCATE areas, listings RESTART IDENTITY CASCADE; ROLLBACK" >/dev/null 2>&1 && pass "postgres TRUNCATE … CASCADE (đường nạp của sync-cloud)" || fail "postgres không TRUNCATE được"
    sq -c "SELECT count(*) FROM users; SELECT count(*) FROM sessions; SELECT count(*) FROM v_ruler_p2_area; SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'airdna%'" >/dev/null 2>&1 \
      && pass "postgres đọc users/sessions/view + truy vấn leak gate" || fail "postgres không đọc được"
    sq -c "BEGIN; INSERT INTO ops_audit(actor, action, env) VALUES ('api:acc','ops.ingest','cloud'); ROLLBACK" >/dev/null 2>&1 && pass "postgres INSERT ops_audit (đường ingest của push-ops-facts qua app)" || fail "postgres không INSERT được"

    # Đối tượng tạo SAU 037 (migration tương lai) không cấp lại cho anon
    NEW=$(sq -c "BEGIN;
      CREATE TABLE acc_new_t (id bigserial PRIMARY KEY, v text);
      CREATE FUNCTION acc_new_f() RETURNS int LANGUAGE sql AS 'SELECT 1';
      SELECT has_table_privilege('anon','acc_new_t','SELECT,INSERT')::text||','||has_sequence_privilege('anon','acc_new_t_id_seq','USAGE')::text||','||has_function_privilege('anon','acc_new_f()','EXECUTE')::text||','||has_table_privilege('authenticated','acc_new_t','SELECT')::text||','||(has_table_privilege('service_role','acc_new_t','SELECT') AND has_table_privilege('service_role','acc_new_t','INSERT'))::text;
      ROLLBACK" 2>&1 | grep -E '^(true|false),')
    [ "$NEW" = "false,false,false,false,true" ] && pass "bảng/sequence/hàm tạo sau: anon+authenticated không quyền, service_role vẫn có" || fail "đối tượng tạo sau sai quyền: $NEW (cần false,false,false,false,true)"
    # Hoàn tác đưa về ĐÚNG trạng thái trước 037, rồi áp lại 037 → đúng trạng thái sau
    OUT=$(sq < "$ROLLBACK" 2>&1) && pass "rollback exit 0" || fail "rollback lỗi: $OUT"
    [ "$MB" = "$( (sq -c "$MATRIX_SQL"; sq -c "$DEFACL_SQL") | hsh)" ] && pass "sau rollback: bảng quyền + default privileges == trước 037" || fail "rollback không trả đúng trạng thái trước 037"
    [ "$(rest "$ANON" sessions)" = 200 ] && pass "sau rollback: PostgREST anon /sessions = 200 (lỗ mở lại — đúng nghĩa hoàn tác)" || fail "sau rollback: anon /sessions không 200"
    sq < "$MIG" >/dev/null 2>&1 && [ "$M1" = "$(sq -c "$MATRIX_SQL" | hsh)" ] && pass "áp lại 037 sau rollback → bảng quyền == sau 037" || fail "áp lại 037 sau rollback lệch"
    # Thông tin: PostGIS do supabase_admin làm chủ — 037 không sửa được (Known limits)
    echo "note: $(echo "$AFTER" | sed -n 's/^foreign_api_open=//p') quan hệ của supabase_admin (PostGIS) anon vẫn đọc được — ngoài tầm postgres"
    ;;
  cloud)
    ENVF="$HOME/.oneinvest/cloud.env"
    TOKEN=$(sed -n 's/^SUPABASE_MGMT_TOKEN=//p' "$ENVF"); ANON=$(sed -n 's/^SUPABASE_ANON_KEY=//p' "$ENVF"); SVC=$(sed -n 's/^SUPABASE_SERVICE_KEY=//p' "$ENVF")
    URL=$(sed -n 's/^SUPABASE_URL=//p' "$ENVF"); REF=$(echo "$URL" | sed -E 's#https://([a-z0-9]+)\..*#\1#')
    [ -n "$TOKEN" ] && [ -n "$REF" ] || { echo "thiếu SUPABASE_MGMT_TOKEN/SUPABASE_URL trong $ENVF"; exit 2; }
    mq() { # chỉ đọc: Management API read_only
      python3 -c 'import json,sys; print(json.dumps({"query": sys.stdin.read(), "read_only": True}))' \
      | curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' --data-binary @- \
      | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d,list), d; [print("|".join("" if v is None else str(v) for v in r.values())) for r in d]'
    }
    echo "# Đo Supabase $REF — $(date -u +%Y-%m-%dT%H:%M:%SZ) (chỉ đọc, không dữ liệu)"
    echo; echo "## Tóm tắt (đối tượng do postgres làm chủ)"; echo
    SUM=$(echo "$SUMMARY_SQL" | mq | tr '|' '='); echo "$SUM" | sed 's/^/- /'
    echo; echo "## Bảng quyền public"; echo
    echo "Chữ quyền: r SELECT · a INSERT · w UPDATE · d DELETE · D TRUNCATE (sequence: U USAGE). RLS: on/OFF; view: definer/invoker."; echo
    echo "| quan hệ | loại | chủ | RLS | anon | authenticated | service_role |"; echo "|---|---|---|---|---|---|---|"
    echo "$MATRIX_SQL" | mq | awk -F'|' '{printf "| %s | %s | %s | %s | %s | %s | %s |\n", $1,$2,$3,$4,($5==""?"—":$5),($6==""?"—":$6),($7==""?"—":$7)}'
    echo; echo "## Default privileges (schema public + toàn cục)"; echo
    echo "| role tạo | schema | loại | ACL |"; echo "|---|---|---|---|"
    echo "$DEFACL_SQL" | mq | awk -F'|' '{printf "| %s | %s | %s | `%s` |\n", $1,$2,$3,$4}'
    echo; echo "## PostgREST (HEAD, chỉ mã trạng thái + số dòng trong Content-Range)"; echo
    echo "| bảng | anon | service_role |"; echo "|---|---|---|"
    head_probe() { curl -s -I "$URL/rest/v1/$2?select=*" -H "apikey: $1" -H "Authorization: Bearer $1" -H 'Prefer: count=exact' -H 'Range: 0-0' \
      | tr -d '\r' | awk 'tolower($1) ~ /^http/ {s=$2} tolower($1)=="content-range:" {split($2,a,"/"); c=a[2]} END {printf "%s%s", s, (c==""?"":" ("c" dòng)")}'; }
    for t in sessions users sale_offers sellers saved_markets properties ops_audit areas market_metrics v_ruler_p2; do
      echo "| $t | $(head_probe "$ANON" $t) | $(head_probe "$SVC" $t) |"
    done
    echo; echo "## Kỳ vọng sau 037"; echo
    check_summary "cloud:" <<< "$SUM"
    ;;
  *) echo "usage: $0 static|local|sim|cloud"; exit 2 ;;
esac
[ $FAIL = 0 ] && echo "check-supabase-lock $MODE: OK" || echo "check-supabase-lock $MODE: CÓ LỖI"
exit $FAIL
