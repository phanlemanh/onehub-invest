// apply-hcmc-polygons.mjs — đơn giản cho HCMC: upsert phường + polygon + assign listings
import pg from "pg";
import { slugify, stripPrefix, toMultiPolygon } from "./lib/osm.mjs";

const client = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await client.connect();

// 1. Upsert phường HCMC từ staging OSM
const { rows: bounds } = await client.query(
  `SELECT DISTINCT ON (osm_id) osm_id, name, payload
   FROM stg_osm_boundaries WHERE snapshot_id LIKE 'hcmc__%' ORDER BY osm_id, snapshot_id DESC`
);
let upserted = 0;
for (const r of bounds) {
  const base = stripPrefix(r.name ?? "");
  if (!base) continue;
  const id = `vn-hcmc-${slugify(base)}`;
  if (id === "vn-hcmc" || id === "vn-hcmc-ho-chi-minh") continue;
  const mp = toMultiPolygon(r.payload);
  if (!mp) continue;
  await client.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
     VALUES ($1, 'vn-hcmc', 'submarket', $2, 'vn', ST_GeomFromGeoJSON($3), '{"source":"osm-phuong"}'::jsonb)
     ON CONFLICT (id) DO UPDATE SET geom = ST_GeomFromGeoJSON($3)`,
    [id, base, JSON.stringify(mp)]
  );
  upserted++;
}
console.log(`phường HCMC upsert: ${upserted}/${bounds.length}`);

// 2. Point-in-polygon gán listings
const { rowCount: assigned } = await client.query(
  `UPDATE listings l SET area_id = a.id
   FROM areas a
   WHERE a.parent_id = 'vn-hcmc' AND a.geom IS NOT NULL
     AND l.latitude IS NOT NULL AND l.area_id LIKE 'vn-hcmc-%'
     AND ST_Contains(a.geom::geometry, ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326))`
);
console.log(`listings gán theo tọa độ: ${assigned}`);

// 3. Xoá areas rỗng không polygon
const { rowCount: removed } = await client.query(
  `DELETE FROM areas a WHERE a.parent_id = 'vn-hcmc' AND a.region_type = 'submarket'
   AND a.geom IS NULL AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.area_id = a.id)
   AND NOT EXISTS (SELECT 1 FROM saved_markets s WHERE s.area_id = a.id)
   AND NOT EXISTS (SELECT 1 FROM market_metrics mm WHERE mm.area_id = a.id)`
);
console.log(`areas rỗng xoá: ${removed}`);

const { rows: final } = await client.query(
  `SELECT count(*) FILTER (WHERE geom IS NOT NULL) with_geom, count(*) total
   FROM areas WHERE parent_id = 'vn-hcmc'`
);
console.log(`HCW areas: ${final[0].with_geom} có polygon / ${final[0].total}`);
await client.end();
