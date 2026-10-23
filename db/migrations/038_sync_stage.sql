-- 038_sync_stage.sql — cloud-sync-atomic: bảng tạm cho pipeline/sync-cloud.mjs nạp
-- dữ liệu rồi tráo vào bảng thật trong MỘT giao dịch (prod không còn cửa sổ trống).
-- docs/superpowers/specs/2026-10-23-cloud-sync-atomic-design.md · docs/ops/cloud-sync-atomic.md
-- · ADR-0007 (SPL). Áp lên Supabase prod do Mạnh chạy (luật 2) — agent không tự đẩy.
--
-- Chỉ chạm schema sync_stage. Schema riêng (không phải public) vì PostgREST chỉ phơi public
-- và Supabase cấp anon/authenticated toàn quyền cho bảng mới ở public (pg_default_acl, đo
-- 2026-10-23). Payload là dòng đã lọc cột theo sync-cloud (CLOUD_ALLOW / PII_EXCLUDE), sống
-- tới lúc tráo xong rồi bị xoá; lượt chết giữa chừng được lượt sau dọn khi quá 2 giờ.
-- Ở DB local schema này rỗng và không dùng (sync chỉ ghi cloud).
CREATE SCHEMA IF NOT EXISTS sync_stage;

CREATE TABLE IF NOT EXISTS sync_stage.rows (
  run_id    text        NOT NULL,
  tbl       text        NOT NULL,
  payload   jsonb       NOT NULL,
  staged_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rows_run_tbl_idx ON sync_stage.rows (run_id, tbl);

-- Một dòng mỗi lượt đã tráo: read_at = lúc lượt đó mở snapshot đọc local. Lượt đọc sớm hơn
-- lượt đã tráo bị từ chối (hai lượt chồng nhau không để bản cũ đè bản mới).
CREATE TABLE IF NOT EXISTS sync_stage.swaps (
  run_id     text        PRIMARY KEY,
  read_at    timestamptz NOT NULL,
  swapped_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON SCHEMA sync_stage FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA sync_stage FROM PUBLIC;
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA sync_stage FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA sync_stage FROM %I', r);
    END IF;
  END LOOP;
END $$;
