// reassign-areas.mjs — G0-b: chuẩn hoá gán khu vực bằng point-in-polygon.
// Mọi listing Hà Nội được gán vào phường OSM (126 phường 2025) theo tọa độ
// THẬT (ST_Contains) thay vì tin theo title. Đồng thời:
//  - upsert đủ 126 phường làm areas (mẹ vn-hanoi) kèm polygon
//  - listings ngoài mọi phường (ngoài tỉnh...) → area 'vn-hanoi-ngoai-vung'
//  - xoá area submarket rỗng không polygon (title-area bị thay thế)
// Chạy xong cần rerun 300_metrics + 400_breakdowns.
import pg from "pg";
import { slugify, stripPrefix, toMultiPolygon } from "./lib/osm.mjs";

const CITY = process.argv[2] ?? 'hanoi';
const MARKET_ID = CITY === 'hcmc' ? 'vn-hcmc' : MARKET_ID;
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    // ---- 1. Upsert 126 phường (từ staging OSM mới nhất) làm areas ----
    const { rows: bounds } = await client.query(
      `SELECT DISTINCT ON (osm_id) osm_id, name, payload
       FROM stg_osm_boundaries ORDER BY osm_id, snapshot_id DESC`,
    );
    let upserted = 0;
    for (const r of bounds) {
      const base = stripPrefix(r.name ?? "");
      if (!base) continue;
      const id = `vn-hanoi-${slugify(base)}`;
      if (id === "vn-hanoi" || id === "vn-hanoi-ha-noi") continue; // tự tham chiếu — bỏ
      const mp = toMultiPolygon(r.payload);
      if (!mp) continue;
      await client.query(
        `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
         VALUES ($1, ${MARKET_ID}', 'submarket', $2, 'vn', ST_GeomFromGeoJSON($3),
                 '{"source":"osm-phuong"}'::jsonb)
         ON CONFLICT (id) DO UPDATE SET geom = ST_GeomFromGeoJSON($3),
           meta = areas.meta || '{"source":"osm-phuong"}'::jsonb`,
        [id, base, JSON.stringify(mp)],
      );
      upserted++;
    }
    console.log(`phường upsert: ${upserted}/${bounds.length}`);

    // ---- 2. Point-in-polygon reassign listings Hà Nội ----
    const { rowCount: reassigned } = await client.query(
      `UPDATE listings l SET area_id = a.id
       FROM areas a
       WHERE a.parent_id = '${MARKET_ID}' AND a.geom IS NOT NULL
         AND l.latitude IS NOT NULL
         AND l.area_id LIKE 'vn-hanoi-%'
         AND ST_Contains(a.geom::geometry,
             ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326))`,
    );
    console.log(`listings gán lại theo tọa độ: ${reassigned}`);

    // ---- 3. Listings còn sót (ngoài mọi phường) → area ngoai_vung ----
    await client.query(
      `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
       VALUES ('vn-hanoi-ngoai-vung', ${MARKET_ID}', 'submarket', 'Ngoài vùng測绘',
               'vn', '{"note":"listings ngoài 126 phường OSM — thường ngoài tỉnh"}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
    );
    const { rowCount: outside } = await client.query(
      `UPDATE listings SET area_id = 'vn-hanoi-ngoai-vung'
       WHERE area_id LIKE 'vn-hanoi-%'
         AND area_id <> 'vn-hanoi-ngoai-vung'
         AND id NOT IN (
           SELECT l.id FROM listings l JOIN areas a ON a.id = l.area_id
           WHERE a.parent_id = '${MARKET_ID}' AND a.geom IS NOT NULL
             AND l.latitude IS NOT NULL
             AND ST_Contains(a.geom::geometry,
                 ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)))`,
    );
    console.log(`listings ngoài vùng測绘: ${outside}`);

    // ---- 4. Xoá submarket rỗng & không polygon (title-area đã thay thế) ----
    // metrics cũ tham chiếu các area này — xoá trước (300 truncate rebuild sau)
    const doomed = `SELECT a.id FROM areas a
       WHERE a.parent_id = '${MARKET_ID}' AND a.region_type = 'submarket'
         AND a.geom IS NULL
         AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.area_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM saved_markets s WHERE s.area_id = a.id)`;
    await client.query(`DELETE FROM market_metrics WHERE area_id IN (${doomed})`);
    await client.query(`DELETE FROM area_breakdowns WHERE area_id IN (${doomed})`);
    const { rowCount: removed } = await client.query(`DELETE FROM areas a WHERE a.id IN (${doomed})`);
    console.log(`area rỗng đã xoá: ${removed}`);

    const { rows: final } = await client.query(
      `SELECT count(*) FILTER (WHERE geom IS NOT NULL) co_geom, count(*) total
       FROM areas WHERE parent_id = '${MARKET_ID}'`,
    );
    console.log(`areas Hà Nội sau dọn: ${final[0].co_geom} có polygon / ${final[0].total}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
