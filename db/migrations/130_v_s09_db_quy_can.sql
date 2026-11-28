-- 130_v_s09_db_quy_can.sql — DA56 nap-s09-quy-can-va-can-cao-tang: ba view đọc hai kind DATA-CONTRACT v16 của nguồn s09-danh-ba
-- trong stg_s09_danh_ba (115): quỹ căn (`quy-can`, giá chủ đầu tư công khai theo ROADMAP §3 mục 38) và căn cao tầng theo tầng
-- (`can-cao-tang`, gói 2). Không bảng mới: bộ nạp pipeline/import-s09-danh-ba.mjs đã ghi mọi kind; căn quỹ căn vào stg đã bỏ
-- `galleries`, `geolocation` (tầng A) bằng pipeline/lib/s09-danh-ba-v16.mjs.
--   v_s09_db_quy_can_doi_soat — mỗi (snapshot, dự án): số trang, số id căn hợp, tổng nguồn khai ở trang 0, du = đủ hay không.
--     Thiếu trang 0 (lượt hỏng gọi trang từ 1, bản 2026-11-24T024022939) → tong_nguon NULL, du = false, KHÔNG để du rỗng.
--   v_s09_db_quy_can — mỗi dự án lấy snapshot MỚI NHẤT CÓ du = true (chọn theo đối soát, không theo thời điểm thôi: bản hỏng chạy
--     sau bản đủ không che bản đủ); một dòng mỗi id căn (căn ở hai trang đếm một lần).
--   v_s09_db_can_cao_tang — mỗi tầng (source_id) lấy item code 200 mới nhất có data KHÔNG rỗng; item rỗng chỉ thắng khi tầng không
--     có item nào khác đọc được; item lỗi không che. Một dòng mỗi căn kèm uuid và tên nguyên văn của dự án, toà, tầng.
-- DA43 đọc v_s09_db_can_cao_tang (căn vào danh bạ); /ops/registry đọc hai view quỹ căn.
-- Thiết kế: docs/superpowers/specs/2026-11-25-nap-s09-quy-can-va-can-cao-tang-design.md · kế hoạch 2026-11-25.
-- KHÔNG sync cloud: view trên bảng stg, không vào FILL của pipeline/sync-cloud.mjs.
-- Số 130 do giám sát giữ cho DA56 (xếp sau DA42: cần 115, 125). Chỉ view, idempotent: chạy lại không lỗi, lược đồ không đổi.

CREATE OR REPLACE VIEW v_s09_db_quy_can_doi_soat AS
WITH trang AS (
  SELECT snapshot_id, dong, meta ->> 'duAnId' AS du_an_id, (meta ->> 'trang')::int AS so_trang_nguon,
         COALESCE(payload -> 'meta' ->> 'code', payload ->> 'code', '') = '200' AND jsonb_typeof(payload -> 'data') = 'array' AS doc_duoc,
         payload, meta, fetched_at
    FROM stg_s09_danh_ba
   WHERE kind = 'quy-can' AND NULLIF(btrim(meta ->> 'duAnId'), '') IS NOT NULL
),
tong AS (
  SELECT DISTINCT ON (snapshot_id, du_an_id) snapshot_id, du_an_id,
         COALESCE((meta ->> 'tongNguon')::int, (payload -> 'meta' ->> 'total')::int) AS tong_nguon
    FROM trang
   WHERE doc_duoc AND so_trang_nguon = 0
   ORDER BY snapshot_id, du_an_id, dong DESC
),
id_can AS (
  SELECT t.snapshot_id, t.du_an_id, count(DISTINCT c ->> 'id') AS so_id
    FROM trang t CROSS JOIN LATERAL jsonb_array_elements(t.payload -> 'data') c
   WHERE t.doc_duoc AND NULLIF(btrim(c ->> 'id'), '') IS NOT NULL
   GROUP BY t.snapshot_id, t.du_an_id
)
SELECT t.snapshot_id,
       t.du_an_id,
       count(*)::int                                   AS so_trang,
       COALESCE(max(i.so_id), 0)::int                  AS so_id,
       max(g.tong_nguon)                               AS tong_nguon,
       COALESCE(max(g.tong_nguon) = COALESCE(max(i.so_id), 0), false) AS du,
       max(t.fetched_at)                               AS fetched_at
  FROM trang t
  LEFT JOIN tong g   ON g.snapshot_id = t.snapshot_id AND g.du_an_id = t.du_an_id
  LEFT JOIN id_can i ON i.snapshot_id = t.snapshot_id AND i.du_an_id = t.du_an_id
 GROUP BY t.snapshot_id, t.du_an_id;

CREATE OR REPLACE VIEW v_s09_db_quy_can AS
WITH ban AS (
  SELECT DISTINCT ON (du_an_id) du_an_id, snapshot_id
    FROM v_s09_db_quy_can_doi_soat
   WHERE du
   ORDER BY du_an_id, fetched_at DESC NULLS LAST, snapshot_id DESC
),
can AS (
  SELECT DISTINCT ON (b.du_an_id, c ->> 'id') b.du_an_id, c, b.snapshot_id
    FROM ban b
    JOIN stg_s09_danh_ba s ON s.snapshot_id = b.snapshot_id AND s.kind = 'quy-can' AND s.meta ->> 'duAnId' = b.du_an_id
   CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(s.payload -> 'data') = 'array' THEN s.payload -> 'data' ELSE '[]'::jsonb END) c
   WHERE COALESCE(s.payload -> 'meta' ->> 'code', s.payload ->> 'code', '') = '200' AND NULLIF(btrim(c ->> 'id'), '') IS NOT NULL
   ORDER BY b.du_an_id, c ->> 'id', s.dong DESC
)
SELECT du_an_id,
       c ->> 'id'                                         AS can_id,
       c ->> 'property_code'                              AS ma_can,
       c -> 'property_type' ->> 0                         AS loai_hinh,
       CASE WHEN jsonb_typeof(c -> 'number_of_bedrooms') = 'number' THEN (c ->> 'number_of_bedrooms')::numeric END AS phong_ngu,
       CASE WHEN jsonb_typeof(c -> 'number_of_bathrooms' -> 0) = 'number' THEN (c -> 'number_of_bathrooms' ->> 0)::numeric
            WHEN jsonb_typeof(c -> 'number_of_bathrooms') = 'number' THEN (c ->> 'number_of_bathrooms')::numeric END AS phong_tam,
       NULLIF((c ->> 'min_area')::numeric, 0)            AS dien_tich_min,
       NULLIF((c ->> 'max_area')::numeric, 0)            AS dien_tich_max,
       NULLIF((c ->> 'min_selling_price')::numeric, 0)   AS gia_ban_min,
       NULLIF((c ->> 'max_selling_price')::numeric, 0)   AS gia_ban_max,
       NULLIF((c ->> 'min_unit_price')::numeric, 0)      AS don_gia_min,
       NULLIF((c ->> 'max_unit_price')::numeric, 0)      AS don_gia_max,
       c ->> 'status'                                     AS trang_thai,
       c ->> 'available_for_sale_status'                  AS trang_thai_ban,
       c ->> 'block_id'                                   AS block_id,
       snapshot_id
  FROM can;

CREATE OR REPLACE VIEW v_s09_db_can_cao_tang AS
WITH tang AS (
  SELECT DISTINCT ON (source_id) snapshot_id, source_id, payload, meta
    FROM stg_s09_danh_ba
   WHERE kind = 'can-cao-tang'
     AND COALESCE(payload ->> 'code', payload -> 'meta' ->> 'code', '') = '200'
     AND jsonb_typeof(payload -> 'data') = 'array'
   ORDER BY source_id, (jsonb_array_length(payload -> 'data') > 0) DESC, fetched_at DESC NULLS LAST, snapshot_id DESC, dong DESC
)
SELECT DISTINCT ON (c ->> 'id')
       t.meta ->> 'duAnId'   AS du_an_id,
       t.meta ->> 'toaId'    AS toa_id,
       t.meta ->> 'toaTen'   AS toa_ten,
       t.source_id           AS tang_id,
       t.meta ->> 'tangTen'  AS tang_ten,
       c ->> 'id'            AS can_id,
       c ->> 'code'          AS ma,
       c ->> 'name'          AS ten,
       t.snapshot_id
  FROM tang t
 CROSS JOIN LATERAL jsonb_array_elements(t.payload -> 'data') c
 WHERE NULLIF(btrim(c ->> 'id'), '') IS NOT NULL
 ORDER BY c ->> 'id', t.snapshot_id DESC;
