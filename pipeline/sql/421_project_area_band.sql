-- 421_project_area_band.sql — CG10 gia-tot-cap-du-an: dải m² căn hộ theo dự án × số phòng ngủ vào project_area_band (106).
-- Chạy bởi pipeline/xep-hang-gia.mjs cùng giao dịch với 422, SAU khi bảng đã xoá trọn, chỉ khi DB có cả view offer_project
-- (105) lẫn bảng project_area_band (106). $1 = run_id · $2 = jsonb mảng {offer_id, ly_do} tin phi lý ON11 (cùng mảng của 422).
-- Luật (thiết kế §2.3; ROADMAP §3 mục 50 «Có, cấp dự án»): mẫu = căn hộ có một dự án (mot_du_an), có PN, area_m2 trong
-- 15–300 m², không phi lý; mỗi căn một mẫu (căn S06 nhỏ nhất trong property_offers, hoặc chính tin; tin thấy sau cùng),
-- bán và thuê chung một mẫu vì diện tích là của căn; nhóm từ 10 mẫu. Phát biểu «suy ra» riêng: không ghi area_m2, không vào giá.
INSERT INTO project_area_band (project_node_id, bedrooms, p10, p50, p90, n, run_id)
WITH phi_ly AS (
  SELECT DISTINCT x ->> 'offer_id' AS offer_id FROM jsonb_array_elements(coalesce($2::jsonb, '[]'::jsonb)) x
), tin AS (
  SELECT o.offer_id, op.project_node_id AS pj, o.bedrooms, o.area_m2, o.last_seen,
         coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id),
                  'o:' || o.offer_id) AS phieu
    FROM sale_offers o
    JOIN offer_project op ON op.offer_id = o.offer_id AND op.status = 'mot_du_an'
   WHERE o.property_type = 'apartment' AND o.bedrooms IS NOT NULL AND o.area_m2 BETWEEN 15 AND 300
     AND NOT EXISTS (SELECT 1 FROM phi_ly pl WHERE pl.offer_id = o.offer_id)
), mau AS (
  SELECT DISTINCT ON (t.phieu, t.pj, t.bedrooms) t.pj, t.bedrooms, t.area_m2::numeric AS m2
    FROM tin t
   ORDER BY t.phieu, t.pj, t.bedrooms, t.last_seen DESC NULLS LAST, t.offer_id
)
SELECT pj, bedrooms,
       percentile_cont(0.1) WITHIN GROUP (ORDER BY m2),
       percentile_cont(0.5) WITHIN GROUP (ORDER BY m2),
       percentile_cont(0.9) WITHIN GROUP (ORDER BY m2),
       count(*)::int,
       $1
  FROM mau
 GROUP BY pj, bedrooms
HAVING count(*) >= 10;
