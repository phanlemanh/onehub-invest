// import-provinces.mjs — nạp ranh giới cấp tỉnh (OSM admin_level=4) lên areas
// làm market toàn quốc (parent NULL, country vn) cho bản đồ quốc gia (G2).
// Nguồn: snapshot osm-boundaries chạy với OSM_MODE=provinces → stg_osm_boundaries.
import pg from "pg";
import { slugify, stripPrefix, toMultiPolygon } from "./lib/osm.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
try {
  // Snapshot mới nhất có admin_level=4 (chế độ provinces ghi kind khác phường)
  const { rows: snaps } = await client.query(
    `SELECT DISTINCT snapshot_id FROM stg_osm_boundaries
     WHERE payload->'tags'->>'admin_level' = '4'
     ORDER BY snapshot_id DESC LIMIT 1`,
  );
  if (!snaps.length) {
    console.error("không có snapshot provinces (chạy: OSM_MODE=provinces npm run collect -- ... --source osm-boundaries)");
    process.exit(1);
  }
  const snap = snaps[0].snapshot_id;
  const { rows } = await client.query(
    `SELECT DISTINCT ON (osm_id) osm_id, name, payload
     FROM stg_osm_boundaries WHERE snapshot_id = $1
     ORDER BY osm_id, snapshot_id DESC`,
    [snap],
  );
  console.log(`snapshot ${snap}: ${rows.length} tỉnh`);

  let up = 0, noGeom = 0, skipMarket = 0;
  const seen = new Map();
  // "Thành phố Hà Nội"→"Hà Nội"; slug OSM khác slug market sẵn có → alias
  const STRIP = /^(Thành phố|Tỉnh|Quốc gia)\s+/;
  const ALIAS = { "ha-noi": "hanoi", "ho-chi-minh": "hcmc" };
  for (const r of rows) {
    const base = (r.name ?? "").replace(STRIP, "").trim();
    const slug = ALIAS[slugify(base)] ?? slugify(base);
    if (!slug) continue;
    // 2 thị trường tự thu: cập nhật geometry cùng id sẵn có (không tạo mới)
    if (["vn-hanoi", "vn-hcmc"].includes(`vn-${slug}`)) { skipMarket++; continue; }
    let id = `vn-${slug}`;
    if (seen.has(id)) {
      const tag = r.payload?.tags?.ref ?? r.osm_id;
      id = `${id}-${slugify(String(tag))}`;
    }
    seen.set(id, r.osm_id);
    const mp = toMultiPolygon(r.payload);
    if (!mp) { noGeom++; console.warn(`  ! không dựng polygon: ${r.name}`); continue; }
    await client.query(
      `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
       VALUES ($1, NULL, 'market', $2, 'vn', ST_GeomFromGeoJSON($3), '{}'::jsonb)
       ON CONFLICT (id) DO UPDATE SET geom = EXCLUDED.geom, name = EXCLUDED.name`,
      [id, base, JSON.stringify(mp)],
    );
    up++;
  }
  console.log(`tỉnh upsert: ${up} · giữ nguyên hanoi/hcmc: ${skipMarket} · lỗi polygon: ${noGeom}`);
} finally {
  await client.end();
}
