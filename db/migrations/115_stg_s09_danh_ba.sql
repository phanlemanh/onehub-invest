-- 115_stg_s09_danh_ba.sql — DA42 nap-s09-toa-tang-vao-danh-ba: staging nguồn s09-danh-ba (DATA-CONTRACT v15, mọi kind) +
-- view dự án, toà, tầng của bản thu mới nhất.
-- Bảng theo đúng định nghĩa giám sát chốt 20/11 18:38Z (đề xuất làn thu zcode-2011-10, LL soát): MỘT bảng cho mọi kind (gói 1,
-- lượt bù 20/11, gói 2), mỗi item một dòng, payload + meta nguyên văn; khoá (snapshot_id, dong) chứa được nhiều item cùng
-- (kind, source_id); kind không CHECK đóng cứng; không cột tiền tố riêng (đọc meta->>'tienTo'). Hợp căn theo data[].id làm ở
-- transform, không ở stg. Bộ nạp pipeline/import-s09-danh-ba.mjs (làn thu) ghi bảng này, ON CONFLICT DO NOTHING.
-- Khác stg_s09_item (097): 097 CHECK kind 'danh-muc','du-an' và khoá (snapshot_id, source_id) — không dùng lại được.
-- Thiết kế: docs/superpowers/specs/2026-11-18-nap-s09-toa-tang-vao-danh-ba-design.md · kế hoạch 2026-11-21 · ADR-0013.
-- KHÔNG sync cloud: bảng stg không vào FILL của pipeline/sync-cloud.mjs; đường lên cloud là danh bạ.
-- Số 115 do giám sát giữ cho DA42. Áp lên DB máy thu là bước sau gộp theo hồ sơ áp. Idempotent: chạy lại không lỗi, lược đồ
-- không đổi.

CREATE TABLE IF NOT EXISTS stg_s09_danh_ba (
  snapshot_id text   NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  dong        bigint NOT NULL CHECK (dong >= 1),  -- thứ tự item trong snapshot, từ 1: tệp items-*.json.gz theo tên rồi chỉ số mảng;
                                                  -- đếm mọi item kể cả item bộ nạp bỏ, nên có thể hở số
  kind        text   NOT NULL CHECK (btrim(kind) <> ''),
  source_id   text   NOT NULL CHECK (btrim(source_id) <> ''),
  payload     jsonb  NOT NULL,                    -- nguyên văn item.payload ({code, data[, meta]})
  meta        jsonb  NOT NULL,                    -- nguyên văn item.meta
  fetched_at  timestamptz,
  PRIMARY KEY (snapshot_id, dong)
);
CREATE INDEX IF NOT EXISTS stg_s09_danh_ba_kind_sid_idx ON stg_s09_danh_ba (snapshot_id, kind, source_id);
-- Bản mới nhất theo (kind, source_id) của ba view dưới quét theo kind trên mọi snapshot.
CREATE INDEX IF NOT EXISTS stg_s09_danh_ba_kind_idx ON stg_s09_danh_ba (kind, source_id, fetched_at DESC);

-- Item đọc được mới nhất của mỗi (kind, source_id): phản hồi code 200 và data là mảng. Item lỗi không che bản cũ đọc được.
CREATE OR REPLACE VIEW v_s09_db_item_moi AS
SELECT DISTINCT ON (kind, source_id) snapshot_id, dong, kind, source_id, payload, meta, fetched_at
  FROM stg_s09_danh_ba
 WHERE COALESCE(payload ->> 'code', '') = '200' AND jsonb_typeof(payload -> 'data') = 'array'
 ORDER BY kind, source_id, fetched_at DESC NULLS LAST, snapshot_id DESC, dong DESC;

-- Dự án trong danh mục mới nhất (một item danh-muc mỗi lượt).
CREATE OR REPLACE VIEW v_s09_db_du_an AS
WITH dm AS (
  SELECT * FROM v_s09_db_item_moi WHERE kind = 'danh-muc' ORDER BY fetched_at DESC NULLS LAST, snapshot_id DESC LIMIT 1
)
SELECT d ->> 'id'                                                AS du_an_id,
       d ->> 'name'                                              AS ten,
       d -> 'project_locations' -> 0 -> 'province' ->> 'code'    AS ma_tinh,
       dm.snapshot_id
  FROM dm CROSS JOIN LATERAL jsonb_array_elements(dm.payload -> 'data') d
 WHERE NULLIF(btrim(d ->> 'id'), '') IS NOT NULL;

-- Toà theo dự án (item toa, source_id = mã dự án). Thứ tự giữ theo phản hồi nguồn.
CREATE OR REPLACE VIEW v_s09_db_toa AS
SELECT i.source_id                AS du_an_id,
       t ->> 'id'                 AS toa_id,
       t ->> 'name'               AS toa_ten,
       o::int                     AS thu_tu,
       i.snapshot_id
  FROM v_s09_db_item_moi i
  CROSS JOIN LATERAL jsonb_array_elements(i.payload -> 'data') WITH ORDINALITY AS x(t, o)
 WHERE i.kind = 'toa' AND NULLIF(btrim(t ->> 'id'), '') IS NOT NULL;

-- Tầng theo toà (item tang, source_id = mã toà): một dòng mỗi mã tầng, tên nguyên văn («02», «12B»). DA43 đọc view này để biết
-- một toà phải thu bao nhiêu tầng.
CREATE OR REPLACE VIEW v_s09_db_tang AS
SELECT i.source_id                AS toa_id,
       i.meta ->> 'duAnId'        AS du_an_id,
       f ->> 'id'                 AS tang_id,
       f ->> 'name'               AS tang_ten,
       o::int                     AS thu_tu,
       i.snapshot_id
  FROM v_s09_db_item_moi i
  CROSS JOIN LATERAL jsonb_array_elements(i.payload -> 'data') WITH ORDINALITY AS x(f, o)
 WHERE i.kind = 'tang' AND NULLIF(btrim(f ->> 'id'), '') IS NOT NULL;
