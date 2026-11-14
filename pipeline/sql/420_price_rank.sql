-- 420_price_rank.sql — CG9 bang-hang-gia-m2: chấm hạng giá mọi tin đang rao vào offer_price_rank (migration 104).
-- Chạy bởi pipeline/xep-hang-gia.mjs trong một giao dịch có khoá advisory, SAU khi bảng đã được xoá trọn.
-- $1 = run_id (text) · $2 = jsonb mảng {offer_id, ly_do} của tin phi lý theo ON11 (lib/deal-plausibility.mjs, tính ở JS).
-- Luật (docs/superpowers/specs/2026-11-14-bang-hang-gia-m2-design.md §2.2; ROADMAP §3 mục 42 Q1–Q4; mỏ neo 14/11 QĐ3, QĐ4):
--   · thước gia-m2: giá/m² (bán; thuê có m²) · thước gia-thang-pn: giá thuê/tháng của tin thuê thiếu m², nhóm cùng số phòng ngủ
--   · mỗi căn một phiếu: căn S06 trong property_offers (căn nhỏ nhất) hoặc chính tin; giá trị phiếu = tin thấy sau cùng
--   · nhóm luôn cùng phường × loại × bán/thuê; gia-m2 chia thêm PN khi nhóm cùng PN từ 10 phiếu, không thì lùi (pn-duoi-10)
--   · từ 10 phiếu: số + nhãn re-trong-phuong khi ≤ p20 và dưới trung vị từ 5%; 5–9: số, không nhãn; dưới 5: không chấm
--   · dưới trung vị quá 35% → can_xac_minh, vẫn giữ nhãn (QĐ3: không giấu)
-- Hàng này chỉ sinh cap = 'phuong' (nut = area_id); CG10 thêm cấp dự án vào đầu chuỗi chọn nhóm ở CTE «chon».
INSERT INTO offer_price_rank (offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, pn_nhom, n, trung_vi, p20,
                              hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
WITH phi_ly AS (
  SELECT x ->> 'offer_id' AS offer_id, min(x ->> 'ly_do') AS ly_do
    FROM jsonb_array_elements(coalesce($2::jsonb, '[]'::jsonb)) x
   GROUP BY 1
), tin AS (
  SELECT o.offer_id, o.kind, o.property_type, o.bedrooms, o.area_id, o.last_seen, o.price_vnd, o.area_m2, o.price_perm2,
         pl.ly_do AS phi_ly,
         CASE WHEN o.area_m2 > 0 AND o.price_perm2 > 0 THEN 'gia-m2'
              WHEN o.kind = 'rent_lt' AND o.bedrooms IS NOT NULL AND o.price_vnd > 0 THEN 'gia-thang-pn' END AS thuoc
    FROM sale_offers o
    LEFT JOIN phi_ly pl ON pl.offer_id = o.offer_id
), tin2 AS (
  SELECT t.*,
         CASE t.thuoc WHEN 'gia-m2' THEN t.price_perm2::numeric WHEN 'gia-thang-pn' THEN t.price_vnd::numeric END AS gia_tri,
         coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = t.offer_id),
                  'o:' || t.offer_id) AS phieu
    FROM tin t
), loc AS (
  SELECT t.*,
         CASE
           WHEN t.property_type IS NULL OR t.property_type = 'unknown' THEN 'chua-ro-loai'
           WHEN t.area_id IS NULL THEN 'thieu-phuong'
           WHEN t.phi_ly IS NOT NULL THEN 'phi-ly:' || t.phi_ly
           WHEN t.thuoc IS NULL AND t.kind = 'rent_lt' THEN 'thieu-dt-va-pn'
           WHEN t.thuoc IS NULL THEN 'thieu-gia'
           WHEN t.thuoc = 'gia-m2' AND t.kind = 'sale' AND NOT t.gia_tri BETWEEN 5000000 AND 500000000 THEN 'ngoai-khoang'
           WHEN t.thuoc = 'gia-m2' AND t.kind = 'rent_lt' AND NOT t.gia_tri BETWEEN 20000 AND 2000000 THEN 'ngoai-khoang'
           WHEN t.thuoc = 'gia-thang-pn' AND NOT t.gia_tri BETWEEN 1000000 AND 500000000 THEN 'ngoai-khoang'
         END AS loai_ra
    FROM tin2 t
), v AS (            -- phiếu thước gia-m2: tin thấy sau cùng của phiếu trong từng phường × loại × bán/thuê (căn S06 có tin ở
                     -- hai phường hay hai loại góp một phiếu cho mỗi nhóm, không mất phiếu ở nhóm kia)
  SELECT DISTINCT ON (l.phieu, l.area_id, l.property_type, l.kind) l.phieu, l.area_id, l.property_type, l.kind, l.bedrooms, l.gia_tri
    FROM loc l
   WHERE l.loai_ra IS NULL AND l.thuoc = 'gia-m2'
   ORDER BY l.phieu, l.area_id, l.property_type, l.kind, l.last_seen DESC NULLS LAST, l.offer_id
), vm AS (           -- phiếu nhóm giá tháng: mọi tin thuê hợp lệ cùng PN có giá tháng trong khoảng (có và không m²)
  SELECT DISTINCT ON (l.phieu, l.area_id, l.property_type, l.bedrooms) l.phieu, l.area_id, l.property_type, l.bedrooms,
         l.price_vnd::numeric AS gia_tri
    FROM loc l
   WHERE l.kind = 'rent_lt' AND l.bedrooms IS NOT NULL AND l.price_vnd BETWEEN 1000000 AND 500000000
     AND l.loai_ra IS NULL
   ORDER BY l.phieu, l.area_id, l.property_type, l.bedrooms, l.last_seen DESC NULLS LAST, l.offer_id
), mem AS (
  SELECT 'all|' || area_id || '|' || property_type || '|' || kind AS g, phieu, gia_tri FROM v
  UNION ALL
  SELECT 'pn|' || area_id || '|' || property_type || '|' || kind || '|' || bedrooms, phieu, gia_tri FROM v WHERE bedrooms IS NOT NULL
  UNION ALL
  SELECT 'th|' || area_id || '|' || property_type || '|' || bedrooms, phieu, gia_tri FROM vm
), st AS (
  SELECT g, count(*)::int AS n,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gia_tri) AS trung_vi,
         percentile_cont(0.2) WITHIN GROUP (ORDER BY gia_tri) AS p20
    FROM mem GROUP BY g
), rk AS (
  SELECT g, phieu, gia_tri, percent_rank() OVER (PARTITION BY g ORDER BY gia_tri) AS pr FROM mem
), chon AS (         -- nhóm của từng tin hợp lệ (theo thuộc tính của phiếu đại diện)
  SELECT l.offer_id,
         CASE
           WHEN l.thuoc = 'gia-thang-pn' THEN 'th|' || vt.area_id || '|' || vt.property_type || '|' || vt.bedrooms
           WHEN vv.bedrooms IS NOT NULL AND sp.n >= 10 THEN 'pn|' || vv.area_id || '|' || vv.property_type || '|' || vv.kind || '|' || vv.bedrooms
           ELSE 'all|' || vv.area_id || '|' || vv.property_type || '|' || vv.kind
         END AS g,
         CASE WHEN l.thuoc = 'gia-thang-pn' THEN vt.bedrooms
              WHEN vv.bedrooms IS NOT NULL AND sp.n >= 10 THEN vv.bedrooms END AS pn_nhom,
         (l.thuoc = 'gia-m2' AND vv.bedrooms IS NOT NULL AND coalesce(sp.n, 0) < 10) AS lui_pn,
         coalesce(vv.area_id, vt.area_id) AS nut
    FROM loc l
    LEFT JOIN v vv ON l.thuoc = 'gia-m2' AND vv.phieu = l.phieu AND vv.area_id = l.area_id
                  AND vv.property_type = l.property_type AND vv.kind = l.kind
    LEFT JOIN vm vt ON l.thuoc = 'gia-thang-pn' AND vt.phieu = l.phieu AND vt.area_id = l.area_id
                   AND vt.property_type = l.property_type AND vt.bedrooms = l.bedrooms
    LEFT JOIN st sp ON sp.g = 'pn|' || vv.area_id || '|' || vv.property_type || '|' || vv.kind || '|' || vv.bedrooms
   WHERE l.loai_ra IS NULL
), so AS (
  SELECT ch.offer_id, ch.pn_nhom, ch.lui_pn, ch.nut, s.n, s.trung_vi, s.p20, r.gia_tri, r.pr
    FROM chon ch
    JOIN loc l ON l.offer_id = ch.offer_id
    JOIN st s ON s.g = ch.g
    JOIN rk r ON r.g = ch.g AND r.phieu = l.phieu
)
SELECT l.offer_id, l.kind, l.property_type, l.bedrooms, l.thuoc,
       coalesce(so.gia_tri, l.gia_tri),
       CASE WHEN so.offer_id IS NOT NULL THEN 'phuong' END,
       so.nut,
       so.pn_nhom,
       so.n,
       CASE WHEN so.n >= 5 THEN so.trung_vi END,
       CASE WHEN so.n >= 5 THEN so.p20 END,
       CASE WHEN so.n >= 5 THEN round((so.pr * 100)::numeric, 1) END,
       CASE WHEN so.n >= 5 AND so.trung_vi > 0 THEN round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) END,
       CASE WHEN so.n >= 10 AND so.gia_tri <= so.p20 AND so.trung_vi > 0
             AND round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) >= 5 THEN 're-trong-phuong' END,
       coalesce(so.n >= 5 AND so.trung_vi > 0 AND round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) > 35, false),
       CASE
         WHEN l.loai_ra IS NOT NULL THEN l.loai_ra
         WHEN so.n < 5 THEN 'nhom-duoi-5'
         WHEN so.n < 10 THEN 'nhom-5-9'
         WHEN so.lui_pn THEN 'pn-duoi-10'
       END,
       $1
  FROM loc l
  LEFT JOIN so ON so.offer_id = l.offer_id;
