-- Lưới toạ độ hai khu thí điểm của pha thửa S17 (mốc ngày 2, claudedp-2411-21).
--
-- Sinh DANH SÁCH ĐIỂM HỎI (chỉ đọc DB máy thu, không ghi gì), bước 30 m theo mét Mercator:
--  • khu 1: phường Hoàn Kiếm (quận Hoàn Kiếm cũ, Hà Nội) — trọn đa giác có trong `areas`;
--  • khu 2: một ô vuông cạnh 1,414 km quanh điểm trong đa giác phường An Phú (khu Quận 2 cũ,
--    TP.HCM) — chỉ giữ điểm nằm trong đa giác.
-- Kết quả là tệp JSON dùng cho `--parcels-grid` của pha `parcels`. `dienTichKm2` của khu 2 tính theo
-- số điểm trong đa giác nhân diện tích ô trên MẶT ĐẤT để mật độ không bị pha loãng: mét Mercator ngắn
-- hơn mét mặt đất một hệ số cos(vĩ độ) — bước 30 m của lưới tương ứng khoảng 28,0 m ở Hà Nội và
-- 29,5 m ở TP.HCM. (Bản chạy 24/11 dùng ô 0,03 × 0,03 km: diện tích khu 2 bị cao khoảng 3,4%.)
-- `dienTichKm2` của khu 1 là diện tích đất thật của đa giác (ST_Area geography).
--
-- Chạy (từ gốc kho):
--   export DATABASE_URL=<URL DB máy thu, xem phần Lệnh của AGENTS.md>
--   docker exec -i -e PGOPTIONS='-c statement_timeout=120s' -e DATABASE_URL one-invest-db \
--     psql "$DATABASE_URL" -tA \
--     < collector/src/collectors/s17-thua-dinh-gia/luoi-thua.sql \
--     > collector/state/s17-thua-dinh-gia/luoi-thua.json
WITH
const AS (SELECT 30::float8 AS buoc, 1414::float8 AS canh),
k1 AS (
  SELECT a.id, a.name, ST_Transform(a.geom, 3857) AS m, ST_Area(geography(a.geom)) / 1e6 AS km2
  FROM areas a WHERE a.id = 'vn-hanoi-hoan-kiem' AND a.geom IS NOT NULL
),
d1 AS (
  SELECT k.id, k.name, k.km2, c.buoc,
         ST_XMin(k.m) + c.buoc / 2 + gx.i * c.buoc AS x,
         ST_YMin(k.m) + c.buoc / 2 + gy.i * c.buoc AS y,
         k.m
  FROM k1 k, const c,
  LATERAL generate_series(0, floor((ST_XMax(k.m) - ST_XMin(k.m)) / c.buoc)::int) AS gx(i),
  LATERAL generate_series(0, floor((ST_YMax(k.m) - ST_YMin(k.m)) / c.buoc)::int) AS gy(i)
),
k2 AS (
  SELECT a.id, a.name, ST_Transform(ST_PointOnSurface(a.geom), 3857) AS tam, ST_Transform(a.geom, 3857) AS m,
         cos(radians(ST_Y(ST_PointOnSurface(a.geom)))) AS cosViDo
  FROM areas a WHERE a.id = 'vn-hcmc-an-phu' AND a.geom IS NOT NULL
),
d2 AS (
  SELECT k.id || '-o-thu-diem' AS id, k.name, k.m, c.buoc,
         ST_X(k.tam) - c.canh / 2 + c.buoc / 2 + gx.i * c.buoc AS x,
         ST_Y(k.tam) - c.canh / 2 + c.buoc / 2 + gy.i * c.buoc AS y
  FROM k2 k, const c,
  LATERAL generate_series(0, floor(c.canh / c.buoc)::int) AS gx(i),
  LATERAL generate_series(0, floor(c.canh / c.buoc)::int) AS gy(i)
),
diem AS (
  SELECT 'khu-1' AS khu, id, name, NULL::float8 AS km2, buoc, x, y, m FROM d1
  UNION ALL
  SELECT 'khu-2', id, name, (SELECT power(c.buoc * k.cosViDo / 1000.0, 2) FROM k2 k, const c), buoc, x, y, m FROM d2
),
trong AS (
  SELECT d.khu, d.id, d.name, d.km2, d.buoc, d.x, d.y,
         ST_Transform(ST_SetSRID(ST_MakePoint(d.x, d.y), 3857), 4326) AS p
  FROM diem d
  WHERE ST_Contains(d.m, ST_SetSRID(ST_MakePoint(d.x, d.y), 3857))
),
-- Gộp theo khu trước (không lồng hàm tổng hợp), rồi dựng JSON.
theo_khu AS (
  SELECT t.khu, t.id, min(t.name) AS name, min(t.buoc) AS buoc, min(t.km2) AS km2_o, count(*) AS so_diem,
         json_agg(json_build_array(round(ST_Y(t.p)::numeric, 7), round(ST_X(t.p)::numeric, 7)) ORDER BY ST_Y(t.p) DESC, ST_X(t.p)) AS diem
  FROM trong t
  GROUP BY t.khu, t.id
)
SELECT json_agg(json_build_object(
         'khuVucId', k.id,
         'ten', CASE k.khu WHEN 'khu-1' THEN 'Phường Hoàn Kiếm (quận Hoàn Kiếm cũ, Hà Nội)' ELSE 'Ô thí điểm trong phường An Phú (khu Quận 2 cũ, TP.HCM)' END,
         'dienTichKm2', CASE k.khu WHEN 'khu-1' THEN (SELECT km2 FROM k1) ELSE round((k.so_diem * k.km2_o)::numeric, 4) END,
         'buocM', k.buoc,
         'diem', k.diem
       ) ORDER BY k.khu)
FROM theo_khu k;
