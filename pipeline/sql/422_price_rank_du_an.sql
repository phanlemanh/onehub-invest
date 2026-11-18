-- 422_price_rank_du_an.sql — CG10 gia-tot-cap-du-an: chấm hạng giá mọi tin đang rao vào offer_price_rank, có CẤP DỰ ÁN.
-- Chạy bởi pipeline/xep-hang-gia.mjs thay cho 420 KHI DB có view offer_project (migration 105, hàng DV7); không có view thì
-- xep-hang-gia chạy 420 (chỉ phường, CG9). Cùng tham số với 420: $1 = run_id · $2 = jsonb mảng {offer_id, ly_do} tin phi lý ON11.
-- Phần chung (tin, loại ra, phiếu, nhóm phường) chép NGUYÊN từ 420 — sửa luật phường thì sửa cả hai tệp (ca CG10-AC-4 so kết
-- quả hai câu trên tin không dự án). Luật cấp dự án (docs/superpowers/specs/2026-11-15-gia-tot-cap-du-an-design.md §2.1):
--   · dự án của tin = offer_project.project_node_id khi status = 'mot_du_an' (xung_dot không lên cấp dự án)
--   · phiếu dự án lấy theo (phiếu, dự án, loại, bán/thuê) — dự án trải nhiều phường gom qua phường; căn ở hai dự án góp một
--     phiếu cho mỗi dự án
--   · nhóm dự án: dall (dự án × loại × bán/thuê), dpn (× PN khi nhóm PN từ 10 phiếu, không thì lùi dall + pn-duoi-10),
--     dth (thuê thiếu m², giá tháng × PN)
--   · chọn cấp: dự án ≥ 10 → du_an; dự án 5–9 mà nhóm phường < 10 → du_an (số, không nhãn); còn lại → chuỗi phường của 420
--   · nhãn: gia-tot ở cấp dự án, re-trong-phuong ở cấp phường; cùng điều kiện ≤ p20 và dưới trung vị từ 5%, nhóm từ 10
INSERT INTO offer_price_rank (offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, pn_nhom, n, trung_vi, p20,
                              hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
WITH phi_ly AS (
  SELECT x ->> 'offer_id' AS offer_id, min(x ->> 'ly_do') AS ly_do
    FROM jsonb_array_elements(coalesce($2::jsonb, '[]'::jsonb)) x
   GROUP BY 1
), tin AS (
  SELECT o.offer_id, o.kind, o.property_type, o.bedrooms, o.area_id, o.last_seen, o.price_vnd, o.area_m2, o.price_perm2,
         pl.ly_do AS phi_ly,
         CASE WHEN op.status = 'mot_du_an' THEN op.project_node_id END AS pj,
         CASE WHEN o.area_m2 > 0 AND o.price_perm2 > 0 THEN 'gia-m2'
              WHEN o.kind = 'rent_lt' AND o.bedrooms IS NOT NULL AND o.price_vnd > 0 THEN 'gia-thang-pn' END AS thuoc
    FROM sale_offers o
    LEFT JOIN phi_ly pl ON pl.offer_id = o.offer_id
    LEFT JOIN offer_project op ON op.offer_id = o.offer_id
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
), v AS (            -- phiếu thước gia-m2 cấp phường (như 420)
  SELECT DISTINCT ON (l.phieu, l.area_id, l.property_type, l.kind) l.phieu, l.area_id, l.property_type, l.kind, l.bedrooms, l.gia_tri
    FROM loc l
   WHERE l.loai_ra IS NULL AND l.thuoc = 'gia-m2'
   ORDER BY l.phieu, l.area_id, l.property_type, l.kind, l.last_seen DESC NULLS LAST, l.offer_id
), vm AS (           -- phiếu nhóm giá tháng cấp phường (như 420)
  SELECT DISTINCT ON (l.phieu, l.area_id, l.property_type, l.bedrooms) l.phieu, l.area_id, l.property_type, l.bedrooms,
         l.price_vnd::numeric AS gia_tri
    FROM loc l
   WHERE l.kind = 'rent_lt' AND l.bedrooms IS NOT NULL AND l.price_vnd BETWEEN 1000000 AND 500000000
     AND l.loai_ra IS NULL
   ORDER BY l.phieu, l.area_id, l.property_type, l.bedrooms, l.last_seen DESC NULLS LAST, l.offer_id
), vd AS (           -- phiếu thước gia-m2 cấp dự án: tin thấy sau cùng của phiếu trong từng dự án × loại × bán/thuê
  SELECT DISTINCT ON (l.phieu, l.pj, l.property_type, l.kind) l.phieu, l.pj, l.property_type, l.kind, l.bedrooms, l.gia_tri
    FROM loc l
   WHERE l.loai_ra IS NULL AND l.thuoc = 'gia-m2' AND l.pj IS NOT NULL
   ORDER BY l.phieu, l.pj, l.property_type, l.kind, l.last_seen DESC NULLS LAST, l.offer_id
), vmd AS (          -- phiếu nhóm giá tháng cấp dự án
  SELECT DISTINCT ON (l.phieu, l.pj, l.property_type, l.bedrooms) l.phieu, l.pj, l.property_type, l.bedrooms,
         l.price_vnd::numeric AS gia_tri
    FROM loc l
   WHERE l.kind = 'rent_lt' AND l.bedrooms IS NOT NULL AND l.price_vnd BETWEEN 1000000 AND 500000000
     AND l.loai_ra IS NULL AND l.pj IS NOT NULL
   ORDER BY l.phieu, l.pj, l.property_type, l.bedrooms, l.last_seen DESC NULLS LAST, l.offer_id
), mem AS (
  SELECT 'all|' || area_id || '|' || property_type || '|' || kind AS g, phieu, gia_tri FROM v
  UNION ALL
  SELECT 'pn|' || area_id || '|' || property_type || '|' || kind || '|' || bedrooms, phieu, gia_tri FROM v WHERE bedrooms IS NOT NULL
  UNION ALL
  SELECT 'th|' || area_id || '|' || property_type || '|' || bedrooms, phieu, gia_tri FROM vm
  UNION ALL
  SELECT 'dall|' || l.pj || '|' || l.property_type || '|' || l.kind, l.phieu, l.gia_tri FROM vd l
  UNION ALL
  SELECT 'dpn|' || l.pj || '|' || l.property_type || '|' || l.kind || '|' || l.bedrooms, l.phieu, l.gia_tri FROM vd l WHERE l.bedrooms IS NOT NULL
  UNION ALL
  SELECT 'dth|' || l.pj || '|' || l.property_type || '|' || l.bedrooms, l.phieu, l.gia_tri FROM vmd l
), st AS (
  SELECT g, count(*)::int AS n,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gia_tri) AS trung_vi,
         percentile_cont(0.2) WITHIN GROUP (ORDER BY gia_tri) AS p20
    FROM mem GROUP BY g
), rk AS (
  SELECT g, phieu, gia_tri, percent_rank() OVER (PARTITION BY g ORDER BY gia_tri) AS pr FROM mem
), chon_p AS (       -- nhóm cấp phường của từng tin hợp lệ (như CTE «chon» của 420)
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
), chon_d AS (       -- nhóm cấp dự án của từng tin hợp lệ có dự án (theo thuộc tính của phiếu đại diện trong dự án)
  SELECT l.offer_id,
         CASE
           WHEN l.thuoc = 'gia-thang-pn' THEN 'dth|' || l.pj || '|' || l.property_type || '|' || l.bedrooms
           WHEN dd.bedrooms IS NOT NULL AND sd.n >= 10 THEN 'dpn|' || dd.pj || '|' || dd.property_type || '|' || dd.kind || '|' || dd.bedrooms
           ELSE 'dall|' || l.pj || '|' || l.property_type || '|' || l.kind
         END AS g,
         CASE WHEN l.thuoc = 'gia-thang-pn' THEN l.bedrooms
              WHEN dd.bedrooms IS NOT NULL AND sd.n >= 10 THEN dd.bedrooms END AS pn_nhom,
         (l.thuoc = 'gia-m2' AND dd.bedrooms IS NOT NULL AND coalesce(sd.n, 0) < 10) AS lui_pn,
         l.pj::text AS nut
    FROM loc l
    LEFT JOIN vd dd ON l.thuoc = 'gia-m2' AND dd.phieu = l.phieu AND dd.pj = l.pj
                   AND dd.property_type = l.property_type AND dd.kind = l.kind
    LEFT JOIN st sd ON sd.g = 'dpn|' || dd.pj || '|' || dd.property_type || '|' || dd.kind || '|' || dd.bedrooms
   WHERE l.loai_ra IS NULL AND l.pj IS NOT NULL
), chon AS (         -- chọn cấp: dự án ≥ 10; dự án 5–9 khi nhóm phường < 10; còn lại phường
  SELECT p.offer_id,
         (sdg.n >= 10 OR (sdg.n >= 5 AND coalesce(spg.n, 0) < 10)) AS du_an,
         CASE WHEN sdg.n >= 10 OR (sdg.n >= 5 AND coalesce(spg.n, 0) < 10) THEN d.g ELSE p.g END AS g,
         CASE WHEN sdg.n >= 10 OR (sdg.n >= 5 AND coalesce(spg.n, 0) < 10) THEN d.pn_nhom ELSE p.pn_nhom END AS pn_nhom,
         CASE WHEN sdg.n >= 10 OR (sdg.n >= 5 AND coalesce(spg.n, 0) < 10) THEN d.lui_pn ELSE p.lui_pn END AS lui_pn,
         CASE WHEN sdg.n >= 10 OR (sdg.n >= 5 AND coalesce(spg.n, 0) < 10) THEN d.nut ELSE p.nut END AS nut
    FROM chon_p p
    LEFT JOIN chon_d d ON d.offer_id = p.offer_id
    LEFT JOIN st sdg ON sdg.g = d.g
    LEFT JOIN st spg ON spg.g = p.g
), so AS (
  SELECT ch.offer_id, coalesce(ch.du_an, false) AS du_an, ch.pn_nhom, ch.lui_pn, ch.nut, s.n, s.trung_vi, s.p20, r.gia_tri, r.pr
    FROM chon ch
    JOIN loc l ON l.offer_id = ch.offer_id
    JOIN st s ON s.g = ch.g
    JOIN rk r ON r.g = ch.g AND r.phieu = l.phieu
)
SELECT l.offer_id, l.kind, l.property_type, l.bedrooms, l.thuoc,
       coalesce(so.gia_tri, l.gia_tri),
       CASE WHEN so.offer_id IS NULL THEN NULL WHEN so.du_an THEN 'du_an' ELSE 'phuong' END,
       so.nut,
       so.pn_nhom,
       so.n,
       CASE WHEN so.n >= 5 THEN so.trung_vi END,
       CASE WHEN so.n >= 5 THEN so.p20 END,
       CASE WHEN so.n >= 5 THEN round((so.pr * 100)::numeric, 1) END,
       CASE WHEN so.n >= 5 AND so.trung_vi > 0 THEN round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) END,
       CASE WHEN so.n >= 10 AND so.gia_tri <= so.p20 AND so.trung_vi > 0
             AND round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) >= 5
            THEN CASE WHEN so.du_an THEN 'gia-tot' ELSE 're-trong-phuong' END END,
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
