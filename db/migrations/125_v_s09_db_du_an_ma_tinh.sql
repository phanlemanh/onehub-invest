-- 125_v_s09_db_du_an_ma_tinh.sql — DA42 nap-s09-toa-tang-vao-danh-ba: sửa cột ma_tinh của view v_s09_db_du_an (115).
-- 115 đọc project_locations[0].province.code, nhưng bản thu gói 1 thật ghi mã tỉnh ở project_locations[0].province_code
-- (province là chuỗi tên): đo 21/11 trên bản thu 2026-11-19, 221/221 dự án có province_code, 0/221 có province.code — view
-- của 115 trả ma_tinh rỗng ở mọi dòng. 115 đã commit nên không sửa; bản này thay view, giữ nguyên tên, thứ tự và kiểu cột.
-- Đọc province_code trước, rơi về province.code để vẫn đọc được bản thu theo khuôn cũ nếu có.
-- Lọc kind liệt kê dương (giám sát 22/11, sau khi Mạnh mở thu S09 ngoài Hà Nội và quỹ căn có giá, nạp chung bảng với kind mới):
-- gói 1 chỉ gồm ba kind `danh-muc` (source_id `danh-muc`), `toa`, `tang`. View dự án ghim CẢ kind lẫn source_id của danh mục gói
-- 1, để một danh mục khác (kể cả cùng kind) không thay danh mục mà DA42 đọc. v_s09_db_toa, v_s09_db_tang của 115 đã lọc bằng
-- đẳng thức `kind = 'toa'`, `kind = 'tang'` nên không thay; bước dựng chỉ đọc ba view này và chỉ xét toà của dự án có trong
-- danh mục gói 1 (pipeline/lib/s09-dung.mjs).
-- Kế hoạch: docs/superpowers/plans/2026-11-21-nap-s09-toa-tang-vao-danh-ba.md (T1b). Số 125 do giám sát giữ cho DA42.
-- Chỉ là view trên bảng stg (KHÔNG sync cloud, như 115). Idempotent: chạy lại không lỗi, lược đồ không đổi.

CREATE OR REPLACE VIEW v_s09_db_du_an AS
WITH dm AS (
  SELECT * FROM v_s09_db_item_moi WHERE kind = 'danh-muc' AND source_id = 'danh-muc' ORDER BY fetched_at DESC NULLS LAST, snapshot_id DESC LIMIT 1
)
SELECT d ->> 'id'                                                AS du_an_id,
       d ->> 'name'                                              AS ten,
       COALESCE(NULLIF(btrim(d -> 'project_locations' -> 0 ->> 'province_code'), ''),
                d -> 'project_locations' -> 0 -> 'province' ->> 'code')  AS ma_tinh,
       dm.snapshot_id
  FROM dm CROSS JOIN LATERAL jsonb_array_elements(dm.payload -> 'data') d
 WHERE NULLIF(btrim(d ->> 'id'), '') IS NOT NULL;
