-- supabase-lock-anon-rls.rollback.sql — HOÀN TÁC migration 037 trên Supabase.
-- CẢNH BÁO: chạy file này MỞ LẠI lỗ (anon/authenticated đọc-ghi mọi bảng public qua
-- PostgREST). Chỉ dùng khi 037 làm gãy một đường sống mà không sửa nhanh được; sau
-- đó áp lại 037 càng sớm càng tốt. Runbook: docs/ops/supabase-lock-anon-rls.md.
--
-- Đưa về đúng trạng thái đo 2026-10-23 trước 037 (scripts/check-supabase-lock.sh sim
-- so bảng quyền + default privileges sau hoàn tác với trước 037):
--   - anon/authenticated: ALL trên bảng/view/sequence của postgres trong public,
--     EXECUTE trên hàm của postgres (PUBLIC cũng EXECUTE như mặc định Postgres)
--   - RLS tắt, view không security_invoker
--   - default privileges của postgres cấp lại cho anon/authenticated
-- Chỉ chạm quyền + cờ RLS; không đụng dữ liệu. Chạy lại không lỗi.

DO $$
DECLARE
  roles text;
  r record;
BEGIN
  SELECT string_agg(quote_ident(rolname), ', ' ORDER BY rolname) INTO roles
  FROM pg_roles WHERE rolname IN ('anon', 'authenticated');
  IF roles IS NULL OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'rollback 037: không có role anon — bỏ qua';
    RETURN;
  END IF;

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
      EXECUTE format('GRANT ALL ON SEQUENCE %s TO %s', r.rel, roles);
    ELSE
      EXECUTE format('GRANT ALL ON TABLE %s TO %s', r.rel, roles);
    END IF;
    IF r.relkind IN ('r', 'p') THEN
      EXECUTE format('ALTER TABLE %s DISABLE ROW LEVEL SECURITY', r.rel);
    END IF;
    IF r.relkind = 'v' AND current_setting('server_version_num')::int >= 150000 THEN
      EXECUTE format('ALTER VIEW %s RESET (security_invoker)', r.rel);
    END IF;
  END LOOP;

  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
      AND pg_has_role(current_user, p.proowner, 'USAGE')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d
                      WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('GRANT EXECUTE ON ROUTINE %s TO PUBLIC, %s', r.fn, roles);
  END LOOP;

  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %s', roles);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %s', roles);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO %s', roles);
  ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
END
$$;
