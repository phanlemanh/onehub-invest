-- 037_lock_anon_enable_rls.sql — khoá Data API Supabase: anon/authenticated mất quyền
-- trên schema public, bật RLS mọi bảng public (hồ sơ _acceptance/supabase-lock-anon-rls/).
--
-- Vì sao: đo Supabase prod 2026-10-23 — RLS tắt toàn bộ, anon/authenticated có
-- arwdDxt trên mọi bảng/view public (kể cả users, sessions, sale_offers, sellers)
-- và default privileges cấp lại y vậy cho bảng mới. Ai có anon key (Supabase coi là
-- khoá công khai) đọc được token phiên qua PostgREST → chiếm phiên /ops.
--
-- Ai còn vào được sau migration (không đổi gì với họ):
--   - postgres: app Vercel + data-api (pooler user postgres.<ref>), Management API
--     (sync-cloud TRUNCATE/leak gate, audit-all) — chủ bảng + BYPASSRLS.
--   - service_role: sync-cloud INSERT qua PostgREST, drill-restore đọc — giữ nguyên
--     grant, BYPASSRLS.
-- RLS bật KHÔNG policy = từ chối mọi role không bypass. Không FORCE (chủ bảng vẫn đọc).
--
-- Chỉ chạm đối tượng thuộc role đang chạy (postgres trên cloud). PostGIS nằm ở public
-- do supabase_admin làm chủ (spatial_ref_sys, geometry_columns, hàm st_*) — postgres
-- không đổi được; dữ liệu tham chiếu EPSG, ghi ở Known limits của hồ sơ.
--
-- DB không có role `anon` (local :5433, docker kartoza) → NO-OP: local không có
-- PostgREST, không cần khoá; giữ nguyên hành vi local.
--
-- Idempotent: REVOKE / ENABLE RLS / ALTER DEFAULT PRIVILEGES chạy lại không lỗi,
-- không đổi thêm. Không đụng dữ liệu (không INSERT/UPDATE/DELETE/TRUNCATE).
-- Hoàn tác (mở lại lỗ, chỉ khi sự cố): docs/ops/supabase-lock-anon-rls.rollback.sql
-- Runbook áp/kiểm: docs/ops/supabase-lock-anon-rls.md

-- ENABLE RLS cần khoá ACCESS EXCLUSIVE từng bảng: đang có lượt sync giữ khoá thì thôi
-- chờ sau 15s (cả khối DO huỷ nguyên vẹn, chạy lại được) thay vì xếp hàng chặn app đọc.
SET lock_timeout = '15s';

DO $$
DECLARE
  roles text;
  r record;
BEGIN
  SELECT string_agg(quote_ident(rolname), ', ' ORDER BY rolname) INTO roles
  FROM pg_roles WHERE rolname IN ('anon', 'authenticated');
  IF roles IS NULL OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE '037: không có role anon (không phải Supabase) — bỏ qua';
    RETURN;
  END IF;

  -- Bảng, view, matview, foreign table, sequence trong public mà role đang chạy làm chủ;
  -- bỏ đối tượng thuộc extension (PostGIS).
  FOR r IN
    SELECT c.oid::regclass AS rel, c.relkind
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
      AND pg_has_role(current_user, c.relowner, 'USAGE')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d
                      WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e')
  LOOP
    IF r.relkind = 'S' THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM %s', r.rel, roles);
    ELSE
      EXECUTE format('REVOKE ALL ON TABLE %s FROM %s', r.rel, roles);
    END IF;
    IF r.relkind IN ('r', 'p') THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', r.rel);
    END IF;
    -- View chạy bằng quyền người gọi (advisor 0010 security_definer_view); app đọc
    -- bằng postgres (chủ + BYPASSRLS) nên kết quả không đổi.
    IF r.relkind = 'v' AND current_setting('server_version_num')::int >= 150000 THEN
      EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', r.rel);
    END IF;
  END LOOP;

  -- Hàm/thủ tục của mình trong public: PUBLIC mặc định có EXECUTE, anon kế thừa từ đó.
  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
      AND pg_has_role(current_user, p.proowner, 'USAGE')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d
                      WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE ALL ON ROUTINE %s FROM PUBLIC, %s', r.fn, roles);
  END LOOP;

  -- Đối tượng role đang chạy tạo SAU này không tự cấp lại cho anon/authenticated.
  -- service_role giữ default privileges (sync-cloud cần ghi bảng mới).
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %s', roles);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %s', roles);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %s', roles);
  -- EXECUTE cho PUBLIC là mặc định toàn cục — chỉ thu được ở mức toàn cục, không theo schema.
  ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
END
$$;
