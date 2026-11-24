-- Lưới tile thưa cho mặt nạ vùng có ranh thửa của S17 (mốc ngày 1, claudedp-2411-20).
--
-- Sinh DANH SÁCH ĐIỂM QUÉT (chỉ đọc DB máy thu, không ghi gì): rải lưới trong không gian tile Web
-- Mercator mức z17, bước 34 tile (khoảng 10 km), trên khung cả nước; mỗi điểm gán vào tỉnh
-- (areas.region_type = 'market', 34 tỉnh hiện hành có đa giác) nếu tâm tile nằm trong đa giác tỉnh.
-- Điểm ngoài đất (biển, nước láng giềng) không vào lưới. Kết quả là tệp JSON dùng cho `--grid` của pha
-- `tile-mask`; bộ thu không tự phụ thuộc DB.
--
-- Chạy (từ gốc kho; hạn thời gian đặt qua biến môi trường để stdout chỉ còn JSON):
--   export DATABASE_URL=<URL DB máy thu, xem phần Lệnh của AGENTS.md>
--   docker exec -i -e PGOPTIONS='-c statement_timeout=120s' -e DATABASE_URL one-invest-db \
--     psql "$DATABASE_URL" -tA \
--     < collector/src/collectors/s17-thua-dinh-gia/luoi-tile.sql \
--     > collector/state/s17-thua-dinh-gia/luoi-tile-z17.json
WITH
const AS (
  SELECT 17::int AS z, 34::int AS buoc, 20037508.342789244::float8 AS nua, 40075016.68557848::float8 AS rong
),
tong AS (
  SELECT ST_Transform(ST_SetSRID(ST_Extent(a.geom), 4326), 3857) AS hoc
  FROM areas a
  WHERE a.region_type = 'market' AND a.country_code = 'vn' AND a.geom IS NOT NULL
),
oc AS (
  SELECT c.z, c.buoc, c.nua, c.rong, c.rong / power(2, c.z) AS canh_tile,
         floor((ST_XMin(t.hoc) + c.nua) / c.rong * power(2, c.z))::int AS x0,
         floor((ST_XMax(t.hoc) + c.nua) / c.rong * power(2, c.z))::int AS x1,
         floor((c.nua - ST_YMax(t.hoc)) / c.rong * power(2, c.z))::int AS y0,
         floor((c.nua - ST_YMin(t.hoc)) / c.rong * power(2, c.z))::int AS y1
  FROM tong t, const c
),
diem AS (
  SELECT oc.x0 + oc.buoc / 2 + gx.i * oc.buoc AS tx,
         oc.y0 + oc.buoc / 2 + gy.i * oc.buoc AS ty,
         oc.z AS z,
         ST_Transform(
           ST_SetSRID(
             ST_MakePoint(
               (oc.x0 + oc.buoc / 2 + gx.i * oc.buoc) * oc.canh_tile - oc.nua + oc.canh_tile / 2,
               oc.nua - (oc.y0 + oc.buoc / 2 + gy.i * oc.buoc) * oc.canh_tile - oc.canh_tile / 2
             ), 3857), 4326) AS p
  FROM oc
  CROSS JOIN LATERAL generate_series(0, (oc.x1 - oc.x0) / oc.buoc) AS gx(i)
  CROSS JOIN LATERAL generate_series(0, (oc.y1 - oc.y0) / oc.buoc) AS gy(i)
),
gan AS (
  SELECT a.id AS market_id, a.name, d.tx, d.ty, d.z
  FROM diem d
  JOIN areas a
    ON a.region_type = 'market' AND a.country_code = 'vn' AND ST_Contains(a.geom, d.p)
)
SELECT json_agg(
         json_build_object(
           'marketId', g.market_id, 'name', g.name,
           'tiles', (SELECT json_agg(t.z || '/' || t.tx || '/' || t.ty ORDER BY t.ty, t.tx)
                     FROM gan t WHERE t.market_id = g.market_id)
         ) ORDER BY g.market_id
       )
FROM (SELECT DISTINCT market_id, name FROM gan) g;
