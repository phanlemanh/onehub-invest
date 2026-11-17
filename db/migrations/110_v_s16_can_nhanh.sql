-- 110_v_s16_can_nhanh.sql — DA33 nap-s16-vao-danh-ba: view khoá căn S16 tính toa_id, tang một lượt thay cho subquery mỗi dòng.
-- Thiết kế: docs/superpowers/specs/2026-11-14-nap-s16-vao-danh-ba-design.md §4 · sửa view của 103 (103 không sửa — hook chặn).
-- Vì sao: ở 103 hai cột toa_id, tang tính bằng subquery tương quan quét lại TOÀN BỘ CTE d (stg_s16_can, ~186 nghìn dòng, không
-- chỉ mục vì d dùng hai lần nên bị vật chất hoá) cho từng dòng ra (~147 nghìn). Đo trên dữ liệu thật: chi phí kế hoạch 33,9 triệu,
-- một lượt quét view treo hàng chục phút; bước dựng danh bạ (pipeline/lib/s16-dung.mjs) đọc view này nên áp máy thu cũng treo.
-- Bản này: CTE t gom min(toa_id), max(tang) theo (du_an, ma, toa_ten) một lượt rồi LEFT JOIN — quét trọn 0,4 giây, cùng kết quả
-- (đối chiếu EXCEPT ALL hai chiều = 0 dòng, ghi ở _acceptance/nap-s16-vao-danh-ba/). Cùng tên, kiểu, thứ tự cột nên CREATE OR
-- REPLACE nhận; mo_ho, toa_ds, so_dong, luật chọn toà giữ nguyên chữ của 103. Không thêm chỉ mục.
-- Dòng toa_ten NULL: 103 so d.toa_ten = c.toa_ten nên không bao giờ khớp → NULL; ở đây t lọc toa_ten IS NOT NULL và LEFT JOIN
-- không khớp → NULL. Mỗi (du_an, ma) có đúng một toa_ten nên JOIN không nhân dòng.
-- KHÔNG sync cloud: view trên stg_s16_* (xem 103). Số 110 do giám sát cấp. Áp lên DB máy thu sau 103, là bước sau gộp, cần lời Mạnh.
-- Idempotent: chạy lại không lỗi, lược đồ không đổi. Cần 103 đã áp (view đọc stg_s16_can và hàm s16_chuan_toa).

CREATE OR REPLACE VIEW v_s16_can AS
WITH d AS (
  SELECT du_an, upper(btrim(ma_can)) AS ma, NULLIF(btrim(toa_ten), '') AS toa_ten, toa_id, tang FROM stg_s16_can
), g AS (
  SELECT du_an, ma, array_agg(DISTINCT toa_ten ORDER BY toa_ten) FILTER (WHERE toa_ten IS NOT NULL) AS toa_ds,
         count(*)::int AS so_dong
    FROM d GROUP BY du_an, ma
), c AS (
  SELECT g.*,
         CASE WHEN cardinality(g.toa_ds) = 1 THEN g.toa_ds[1]
              ELSE (SELECT min(x) FROM unnest(g.toa_ds) x
                     WHERE s16_chuan_toa(x) <> '' AND s16_chuan_toa(g.ma) LIKE s16_chuan_toa(x) || '%'
                    HAVING count(*) = 1) END AS toa_ten
    FROM g
), t AS (
  SELECT du_an, ma, toa_ten, min(toa_id) AS toa_id, max(tang) AS tang
    FROM d WHERE toa_ten IS NOT NULL GROUP BY du_an, ma, toa_ten
)
SELECT c.du_an, c.ma AS ma_can, c.toa_ten, (c.toa_ten IS NULL) AS mo_ho, c.toa_ds, c.so_dong, t.toa_id, t.tang
  FROM c LEFT JOIN t ON t.du_an = c.du_an AND t.ma = c.ma AND t.toa_ten = c.toa_ten;
