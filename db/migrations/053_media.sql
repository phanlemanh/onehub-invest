-- 053_media.sql — NH1 `media-canonical-reso`: ảnh tin canonical theo resource Media của RESO DD 2.1, nối với tin.
-- Nguồn: design docs/superpowers/specs/2026-10-30-media-canonical-reso-design.md §2.1 · hồ sơ _acceptance/media-canonical-reso
-- (Mạnh duyệt 30/10) · ADR-0011 (RESO-first) · ADR-0013 (tin = Property, ảnh = Media). Số 053 do phiên liên làn cấp.
--
-- Mỗi dòng là một ảnh khác nhau của một tin (sale_offer_records). Bên ghi: pipeline/transform-media.mjs, dựng lại theo
-- nguồn sau transform mỗi đêm. Bên đọc: app/src/lib/ops/review-media.ts (Hàng duyệt + hồ sơ tin của Dòng chảy).
-- Cột theo DD 2.1 (snake_case): MediaKey · ResourceRecordKey (offer_id; ResourceName = Property ngầm hiểu) ·
-- OriginatingSystemName (mã S0x) · OriginatingSystemResourceRecordKey (post_id S03/S05, list_id S06) · MediaURL · Order ·
-- MediaModificationTimestamp. MediaCategory = Photo ngầm hiểu. `local_file` ngoài DD: ảnh đã tải vào raw snapshot của
-- máy thu, dạng <snapshotId>/media/<tên> — đúng khuôn route /api/zalo-media nhận (app/src/lib/ops/zalo-media.ts).
--
-- KHÔNG sync cloud (tầng A): media_url của S06 mang tên miền nguồn thật, local_file trỏ kho thô của máy thu. Bảng không
-- vào FILL của pipeline/sync-cloud.mjs, leak gate đếm nó như stg_*; không áp tệp này lên Supabase.

CREATE TABLE IF NOT EXISTS media (
  media_key                              text PRIMARY KEY,
  resource_record_key                    text NOT NULL
    CONSTRAINT media_offer_fk REFERENCES sale_offer_records (offer_id),
  originating_system_name                text NOT NULL
    CONSTRAINT media_source_code CHECK (originating_system_name ~ '^S0[0-9]$'),
  originating_system_resource_record_key text NOT NULL,
  media_url                              text
    CONSTRAINT media_url_http CHECK (media_url IS NULL OR media_url ~ '^https?://'),
  media_order                            integer NOT NULL
    CONSTRAINT media_order_nonneg CHECK (media_order >= 0),
  local_file                             text
    CONSTRAINT media_local_file_shape CHECK (
      local_file IS NULL OR (
        local_file ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]*/media/[A-Za-z0-9][A-Za-z0-9_.-]*$'
        AND position('..' IN local_file) = 0
      )
    ),
  media_modification_timestamp           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_has_source CHECK (media_url IS NOT NULL OR local_file IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS media_resource_record_key_idx ON media (resource_record_key, media_order);
CREATE INDEX IF NOT EXISTS media_originating_system_name_idx ON media (originating_system_name);

COMMENT ON TABLE media IS 'RESO Media (DD 2.1): ảnh tin, một dòng mỗi ảnh khác nhau của một tin. Chỉ máy thu — KHÔNG sync cloud.';
COMMENT ON COLUMN media.local_file IS 'Ngoài DD: <snapshotId>/media/<tên> trong raw snapshot của máy thu; NULL khi chưa tải.';
