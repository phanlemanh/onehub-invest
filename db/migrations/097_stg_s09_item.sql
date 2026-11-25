-- 097_stg_s09_item.sql — DA31 toa-s09-hai-khu-vao-danh-ba: staging item S09 khuôn API + view toà, phân khu, nút vùng hiệu lực.
-- Thiết kế: docs/superpowers/specs/2026-11-13-toa-s09-hai-khu-vao-danh-ba-design.md §4.1 · ADR-0011/0013 (stg giữ hình dạng nguồn).
-- KHÔNG sync cloud: payload.url mang tên miền thật (tầng A) — sync-cloud.mjs, app/, data-api/ không nhắc bảng này; đường lên
-- cloud là danh bạ. Không lưu item.meta (bản 13/11 có meta/notes bị sửa): mọi trường đọc từ payload.
-- Bộ nạp (làn thu) chỉ ghi năm cột thô bằng dongItemS09 + CAU_CHEN_S09_ITEM của pipeline/lib/s09-du-an.mjs.
-- Số 097 do giám sát cấp. Áp lên DB máy thu là bước sau gộp, cần lời Mạnh. Idempotent: chạy lại không lỗi, lược đồ không đổi.

CREATE TABLE IF NOT EXISTS stg_s09_item (
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  source_id   text NOT NULL CHECK (btrim(source_id) <> ''),
  kind        text NOT NULL CHECK (kind IN ('danh-muc', 'du-an')),
  payload     jsonb NOT NULL,           -- nguyên văn item.payload
  fetched_at  timestamptz,
  project_id  text GENERATED ALWAYS AS (payload -> 'chiTiet' -> 'data' ->> 'id') STORED,         -- khoá dự án phía nguồn
  detail_ok   boolean GENERATED ALWAYS AS (COALESCE(payload -> 'chiTiet' -> 'meta' ->> 'code', '') = '200') STORED,
  PRIMARY KEY (snapshot_id, source_id)
);
CREATE INDEX IF NOT EXISTS stg_s09_item_pid_idx ON stg_s09_item(project_id);

-- Item du-an đọc được mới nhất của mỗi dự án.
CREATE OR REPLACE VIEW v_s09_du_an_moi AS
SELECT DISTINCT ON (project_id) snapshot_id, source_id, project_id, payload -> 'chiTiet' -> 'data' AS data, fetched_at
  FROM stg_s09_item
 WHERE kind = 'du-an' AND detail_ok AND project_id IS NOT NULL
 ORDER BY project_id, fetched_at DESC NULLS LAST, snapshot_id DESC;

-- Mỗi bản ghi toà (insight_by_block); toà không phân khu có sector_id NULL, không rơi.
CREATE OR REPLACE VIEW v_s09_toa AS
SELECT d.project_id,
       b ->> 'id'                                   AS block_id,
       b ->> 'block_code'                           AS block_code,
       b ->> 'block_name'                           AS block_name,
       NULLIF(btrim(b ->> 'sector_uuid'), '')       AS sector_id,
       NULLIF(btrim(b ->> 'handover_date_from'), '') AS handover_date_from
  FROM v_s09_du_an_moi d
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(d.data -> 'insight_by_block') = 'array' THEN d.data -> 'insight_by_block' ELSE '[]'::jsonb END) b;

-- Mỗi phân khu (insight_by_sector).
CREATE OR REPLACE VIEW v_s09_phan_khu AS
SELECT d.project_id,
       s ->> 'sector_id'                              AS sector_id,
       s ->> 'sector_name'                            AS sector_name,
       s ->> 'type'                                   AS sector_type,
       NULLIF(btrim(s ->> 'handover_date_from'), '')  AS handover_date_from,
       NULLIF(btrim(s ->> 'handover_date_to'), '')    AS handover_date_to
  FROM v_s09_du_an_moi d
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(d.data -> 'insight_by_sector') = 'array' THEN d.data -> 'insight_by_sector' ELSE '[]'::jsonb END) s;

-- Nút vùng hiệu lực của mọi toà (Mạnh chọn lối A ở Cổng Phạm vi 13/11): toà nối S09 qua bí danh ma_nguon S09
-- «<project_id>/<block_id>» → cụm (asset_nodes.meta s09_cum + s09_sector_id) hay phân khu (meta s09_sector_ids) của nó;
-- toà không nối S09, hay phân khu chưa có nút, → region_node_id gốc. Toà S08 giữ nguyên region_node_id (082 chỉ thêm).
-- Mỗi toà đúng một dòng: nhiều bí danh S09 (một tên hai block_id) thì bản có phân khu thắng.
CREATE OR REPLACE VIEW v_toa_nut_vung AS
WITH s09 AS (
  SELECT a.object_key AS building_key, t.sector_id,
         upper((regexp_match(btrim(COALESCE(NULLIF(t.block_code, ''), t.block_name)), '^([A-Za-z]+[0-9]+)\.[0-9]+$'))[1]) AS tien_to
    FROM registry_aliases a
    JOIN v_s09_toa t ON a.value = t.project_id || '/' || t.block_id
   WHERE a.kind = 'ma_nguon' AND a.source = 'S09' AND a.retired_at IS NULL
), chon AS (
  SELECT DISTINCT ON (building_key) building_key, sector_id, tien_to
    FROM s09 ORDER BY building_key, (sector_id IS NULL), sector_id
)
SELECT b.building_key,
       COALESCE(cum.id, pk.id, b.region_node_id) AS region_node_id,
       b.region_node_id                          AS region_node_id_goc,
       CASE WHEN cum.id IS NOT NULL THEN 's09_cum' WHEN pk.id IS NOT NULL THEN 's09_phan_khu' ELSE 'goc' END AS nguon
  FROM buildings b
  LEFT JOIN chon c ON c.building_key = b.building_key
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE c.sector_id IS NOT NULL AND n.meta -> 's09_sector_ids' ? c.sector_id
                      ORDER BY n.id LIMIT 1) pk ON true
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE c.tien_to IS NOT NULL AND n.meta ->> 's09_cum' = c.tien_to
                        AND n.meta ->> 's09_sector_id' = c.sector_id
                      ORDER BY n.id LIMIT 1) cum ON true;
