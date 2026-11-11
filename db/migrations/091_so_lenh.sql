-- 091_so_lenh.sql — TV4 `so-lenh-bo-ap` (mốc TVM1): sổ Lệnh có khuôn, token máy theo tên, sổ áp chống lặp ở máy thu,
-- và hai bảng đã có ở cloud mà chưa có migration (ops_heartbeat, ops_audit khuôn 018).
-- Nguồn: docs/adr/0015-duong-lenh-keo-mot-chieu.md (§2 token máy ops:pull, §4 danh sách loại lệnh, §5 máy trạng thái),
-- docs/superpowers/specs/2026-11-10-so-lenh-bo-ap-design.md, hồ sơ _acceptance/so-lenh-bo-ap/.
--
-- Chạy được trên HAI khuôn DB, không FK sang source_registry (cloud không có bảng ấy):
--   - máy thu (DB local :5433): change_request_applies là sổ áp; change_requests, machine_tokens để trống.
--   - cloud (Supabase): change_requests là nguồn, machine_tokens giữ băm token; change_request_applies để trống.
-- Không bảng nào trong CLOUD_ALLOW của sync-cloud: không dòng nào được chép giữa hai nơi.
-- Không chứa tên nguồn thật. Áp DB máy thu và Supabase: sau gộp, mỗi nơi một lời của Mạnh (Hỏi-1).
-- Idempotent: IF NOT EXISTS, DROP CONSTRAINT IF EXISTS trước ADD, khối khoá anon chạy lại không đổi thêm.

-- Bảng đã có ở cloud (ingest upsert, trang Ops đọc) — khuôn đúng như cloud đang chạy.
CREATE TABLE IF NOT EXISTS ops_heartbeat (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  pushed_at timestamptz
);

-- Khuôn 018: route lệnh ghi nhật ký cùng giao dịch ở cả hai nơi.
CREATE TABLE IF NOT EXISTS ops_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  action text NOT NULL,
  env text NOT NULL DEFAULT 'local',
  detail jsonb DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_ops_audit_at ON ops_audit (at DESC);

-- Lệnh có khuôn (ADR-0015 §1). Cloud chỉ ghi ý muốn; máy thu áp và báo kết quả.
CREATE TABLE IF NOT EXISTS change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  target text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  requested_by text NOT NULL,
  approved_by text,
  idempotency_key text NOT NULL,
  before jsonb,
  after jsonb,
  result jsonb,
  note text,
  inverse_of uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  queued_at timestamptz,
  finished_at timestamptz
);
-- Danh sách đóng 14 loại (ADR-0015 §4) — chỉ owner thêm loại; route chỉ nhận loại đã có bộ áp.
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS change_requests_type_chk;
ALTER TABLE change_requests ADD CONSTRAINT change_requests_type_chk CHECK (type IN (
  'unit.create', 'unit.update_meta', 'unit.enable', 'unit.disable', 'unit.retire',
  'source.pause', 'source.resume', 'source.set_schedule', 'source.set_slo',
  'context_rule.publish', 'context_rule.retire', 'coverage_target.set', 'job.rerun', 'review.decide'));
-- Máy trạng thái (ADR-0015 §5).
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS change_requests_status_chk;
ALTER TABLE change_requests ADD CONSTRAINT change_requests_status_chk CHECK (status IN (
  'draft', 'submitted', 'approved', 'queued', 'applying', 'applied', 'rejected', 'failed', 'reverted'));
CREATE UNIQUE INDEX IF NOT EXISTS change_requests_idempotency_key_uq ON change_requests (idempotency_key);
CREATE INDEX IF NOT EXISTS change_requests_status_created_idx ON change_requests (status, created_at);

-- Token máy theo tên (ADR-0015 §2): chỉ giữ băm sha256 hex; thu hồi bằng revoked_at; last_used_at là mốc kéo cuối.
CREATE TABLE IF NOT EXISTS machine_tokens (
  name text PRIMARY KEY,
  token_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS machine_tokens_token_hash_uq ON machine_tokens (token_hash);

-- Sổ áp ở máy thu: một dòng mỗi idempotency_key, ghi cùng giao dịch với lệnh áp — bộ áp áp một lệnh tối đa một lần.
CREATE TABLE IF NOT EXISTS change_request_applies (
  idempotency_key text PRIMARY KEY,
  change_request_id uuid NOT NULL,
  type text NOT NULL,
  target text NOT NULL,
  outcome text NOT NULL DEFAULT 'applying',
  before jsonb,
  after jsonb,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE change_request_applies DROP CONSTRAINT IF EXISTS change_request_applies_outcome_chk;
ALTER TABLE change_request_applies ADD CONSTRAINT change_request_applies_outcome_chk
  CHECK (outcome IN ('applying', 'applied', 'failed', 'reverted'));

-- Supabase (có role anon): năm bảng không cho anon/authenticated qua PostgREST, bật RLS không policy (khuôn 037).
-- DB không có role anon (máy thu) → bỏ qua.
DO $$
DECLARE
  roles text;
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE '091: không có role anon — bỏ qua khoá Data API';
    RETURN;
  END IF;
  SELECT string_agg(quote_ident(rolname), ', ' ORDER BY rolname) INTO roles
  FROM pg_roles WHERE rolname IN ('anon', 'authenticated');
  FOREACH t IN ARRAY ARRAY['ops_heartbeat', 'ops_audit', 'change_requests', 'machine_tokens', 'change_request_applies'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I FROM %s', t, roles);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
  IF to_regclass('ops_audit_id_seq') IS NOT NULL THEN
    EXECUTE format('REVOKE ALL ON SEQUENCE ops_audit_id_seq FROM %s', roles);
  END IF;
END $$;
