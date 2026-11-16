-- 423_project_source_baseline.sql — CG15 do-lech-s03-s06-canh-hang: mặt bằng S03 so S06 mỗi nhóm cấp dự án.
-- Chạy bởi pipeline/xep-hang-gia.mjs SAU 422, cùng giao dịch, khi DB có bảng project_source_baseline (migration 107) và view
-- offer_project. $1 = run_id. Đọc offer_price_rank vừa ghi (khoá nhóm = nut, kind, property_type, thuoc, pn_nhom của dòng
-- cap = 'du_an'); luật (thiết kế §2.1):
--   · tin vào mẫu = dòng cap du_an có gia_tri và không bị loại (ly_do rỗng, hay nhom-5-9 / pn-duoi-10 — vẫn có số)
--   · nhóm giá tháng (thuoc gia-thang-pn) gom như nhóm dth của 422: mọi tin thuê cùng dự án, cùng loại, PN = pn_nhom, giá tháng
--     trong khoảng — kể cả tin có m² (hạng của chúng theo giá/m²) — giá trị là giá tháng
--   · chỉ nguồn S03, S06; phiếu như 422 (căn nhỏ nhất trong property_offers, không thì chính tin); phiếu × nguồn lấy tin thấy
--     sau cùng — căn S06 có tin S03 ghép vào góp một phiếu cho mỗi nguồn
--   · một bên đủ khi từ 5 phiếu (Hỏi-1); lech_pct chỉ khi hai bên đủ
INSERT INTO project_source_baseline (nut, kind, property_type, thuoc, pn_nhom, n_s03, trung_vi_s03, n_s06, trung_vi_s06,
                                     lech_pct, trang_thai, run_id)
WITH m AS (
  SELECT h.nut, h.kind, h.property_type, h.thuoc, h.pn_nhom, o.source, h.gia_tri, o.last_seen, o.offer_id,
         coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id),
                  'o:' || o.offer_id) AS phieu
    FROM offer_price_rank h
    JOIN sale_offers o ON o.offer_id = h.offer_id
   WHERE h.cap = 'du_an' AND h.gia_tri IS NOT NULL
     AND (h.ly_do IS NULL OR h.ly_do IN ('nhom-5-9', 'pn-duoi-10'))
     AND o.source IN ('S03', 'S06')
  UNION ALL
  SELECT k.nut, k.kind, k.property_type, k.thuoc, k.pn_nhom, o.source, o.price_vnd::numeric, o.last_seen, o.offer_id,
         coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id),
                  'o:' || o.offer_id) AS phieu
    FROM (SELECT DISTINCT nut, kind, property_type, thuoc, pn_nhom FROM offer_price_rank
           WHERE cap = 'du_an' AND thuoc = 'gia-thang-pn') k
    JOIN offer_price_rank h ON h.cap = 'du_an' AND h.nut = k.nut AND h.kind = 'rent_lt' AND h.property_type = k.property_type
                           AND h.thuoc = 'gia-m2' AND (h.ly_do IS NULL OR h.ly_do IN ('nhom-5-9', 'pn-duoi-10'))
    JOIN sale_offers o ON o.offer_id = h.offer_id AND o.bedrooms = k.pn_nhom
                      AND o.price_vnd BETWEEN 1000000 AND 500000000 AND o.source IN ('S03', 'S06')
), p AS (
  SELECT DISTINCT ON (nut, kind, property_type, thuoc, coalesce(pn_nhom, -1), source, phieu)
         nut, kind, property_type, thuoc, pn_nhom, source, gia_tri
    FROM m
   ORDER BY nut, kind, property_type, thuoc, coalesce(pn_nhom, -1), source, phieu, last_seen DESC NULLS LAST, offer_id
), g AS (
  SELECT nut, kind, property_type, thuoc, pn_nhom,
         count(*) FILTER (WHERE source = 'S03')::int AS n_s03,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gia_tri) FILTER (WHERE source = 'S03') AS tv3,
         count(*) FILTER (WHERE source = 'S06')::int AS n_s06,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gia_tri) FILTER (WHERE source = 'S06') AS tv6
    FROM p
   GROUP BY nut, kind, property_type, thuoc, pn_nhom
)
SELECT nut, kind, property_type, thuoc, pn_nhom, n_s03, tv3, n_s06, tv6,
       CASE WHEN n_s03 >= 5 AND n_s06 >= 5 THEN round(((tv3 / NULLIF(tv6, 0) - 1) * 100)::numeric, 1) END,
       CASE WHEN n_s03 >= 5 AND n_s06 >= 5 THEN 'du'
            WHEN n_s06 >= 5 THEN 'thieu-s03'
            WHEN n_s03 >= 5 THEN 'thieu-s06'
            ELSE 'thieu-hai' END,
       $1
  FROM g;
