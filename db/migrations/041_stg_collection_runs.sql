-- 041_stg_collection_runs.sql — ZC7 tin-hieu-lan-thu (YC8a): staging cho item `run_heartbeat` —
-- mỗi lần thu của nguồn để lại một dấu, kể cả lần 0 bài mới, để đo «nguồn còn sống» không dựa vào
-- số bài (DATA-CONTRACT schemaVersion 5 — ZCode, vòng claudedp-2410-18; chốt thiết kế ở zcode-2510-4).
-- ADR-0011/0013: bảng vận hành, không chứa field dữ liệu tin/căn → không có field RESO tương ứng,
-- không khai mappings.yaml. ADR-0007 (SPL): `source` là source_id nội bộ (như source_registry.source_ids),
-- không phải real_name.
-- KHÔNG sync cloud: bảng stg_* chỉ ở local — sync-cloud.mjs chỉ đẩy bảng trong FILL, leak gate đòi
-- stg_* vắng/0 dòng ở cloud. Cloud chỉ nhận số tổng hợp qua ops_heartbeat.
--
-- Một dòng = một nguồn trong MỘT snapshot (khoá source + snapshot_id): S03 gộp mọi push của lượt
-- flush (events_seen, items_new; run_at = event cuối), S05 mỗi lượt chạy một dòng (lượt bỏ qua vì
-- paused ghi status 'paused'). Nạp lại cùng snapshot không nhân dòng.
CREATE TABLE IF NOT EXISTS stg_collection_runs (
  source       text NOT NULL,          -- source_id như source_registry.source_ids (freshness/ON17 lọc theo registry)
  snapshot_id  text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  city         text,                   -- city của snapshot (freshness đo theo mã × thành phố)
  run_at       timestamptz NOT NULL,   -- giờ của lần thu (S03: event cuối của lượt; S05: giờ chạy) — giờ thu, không phải giờ nạp
  status       text NOT NULL,          -- active | empty (thu được 0 bài mới) | paused | error
  items_new    int NOT NULL DEFAULT 0, -- số bài mới vào snapshot ở lượt này
  events_seen  int,                    -- S03: số event qua admission tới hook trong lượt (kể cả dedup/rejected); S05: null
  payload      jsonb,                  -- nguyên vẹn RawItem.payload của heartbeat
  captured_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, snapshot_id),
  CONSTRAINT stg_collection_runs_status_chk CHECK (status IN ('active', 'empty', 'paused', 'error')),
  CONSTRAINT stg_collection_runs_counts_chk CHECK (items_new >= 0 AND (events_seen IS NULL OR events_seen >= 0))
);
CREATE INDEX IF NOT EXISTS stg_collection_runs_snap_idx ON stg_collection_runs(snapshot_id);
CREATE INDEX IF NOT EXISTS stg_collection_runs_run_idx ON stg_collection_runs(source, run_at DESC);
