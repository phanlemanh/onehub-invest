// reassign-areas.mjs — G0-b: chuẩn hoá gán khu vực bằng point-in-polygon.
// Nguồn sự thật về vị trí là TỌA ĐỘ listing, không phải title discovery.
//  1. Upsert phường OSM 2025 của từng tỉnh (stg_osm_boundaries, lọc theo city)
//     làm submarket — tên/polygon lấy từ OSM, id = <market>-<slug>.
//  2. Mọi listing VN được gán vào phường chứa tọa độ (ST_Covers), xét toàn bộ
//     phường VN — listing trong snapshot Hà Nội nhưng nằm ở TP.HCM sang TP.HCM.
//  3. Listing ngoài mọi phường đã có polygon (ngoài tỉnh: Hưng Yên, Vĩnh Phúc…)
//     hoặc thiếu tọa độ → bỏ khỏi canonical (staging giữ nguyên, nights cascade).
//  4. Xoá submarket không phải phường OSM (title-area: "Quận Tây Hồ", "Hà Nội",
//     "Văn Giang"…) khi không còn gì tham chiếu.
// Idempotent. Chạy xong cần rerun 300_metrics + 400_breakdowns.
//   node reassign-areas.mjs            # mọi city có OSM staging
//   node reassign-areas.mjs hanoi      # một city
import pg from "pg";
import { slugify, stripPrefix, toMultiPolygon } from "./lib/osm.mjs";

const MARKETS = {
  hanoi: { id: "vn-hanoi", name: "Hà Nội" },
  hcmc: { id: "vn-hcmc", name: "TP. Hồ Chí Minh" },
};
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Điểm của listing — dùng chung cho mọi câu PIP
const PT = "ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)";

async function upsertPhuong(client, city) {
  const market = MARKETS[city];
  const { rows: bounds } = await client.query(
    `SELECT DISTINCT ON (osm_id) osm_id, name, payload
     FROM stg_osm_boundaries WHERE snapshot_id LIKE $1
     ORDER BY osm_id, snapshot_id DESC`,
    [`${city}__%`],
  );
  if (bounds.length === 0) return 0;
  await client.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
     VALUES ($1, NULL, 'market', $2, 'vn', '{}'::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [market.id, market.name],
  );
  const marketSlug = slugify(market.name.replace(/^TP\.\s*/, ""));
  const seen = new Map();
  let upserted = 0;
  for (const r of bounds) {
    let base = stripPrefix(r.name ?? "").trim();
    const slug = slugify(base);
    // Tên trùng tỉnh = tự tham chiếu market — bỏ
    if (!slug || slug === marketSlug) continue;
    let id = `${market.id}-${slug}`;
    if (seen.has(id)) {
      // Hai phường khác nhau chỉ khác dấu (Thạnh An ≠ Thanh An) — giữ cả hai polygon,
      // tách id + tên (app dựng URL từ slug tên) bằng mã bưu chính / osm_id.
      const tag = r.payload?.tags?.postal_code ?? r.osm_id;
      console.warn(`  ! ${city}: trùng slug ${id} (osm ${seen.get(id)} vs ${r.osm_id}) — tách thành "${base} (${tag})"`);
      id = `${id}-${slugify(String(tag))}`;
      base = `${base} (${tag})`;
    }
    const mp = toMultiPolygon(r.payload);
    if (!mp) {
      console.warn(`  ! ${city}: không dựng được polygon cho ${r.name} (osm ${r.osm_id})`);
      continue;
    }
    seen.set(id, r.osm_id);
    await client.query(
      `WITH g AS (SELECT ST_Multi(ST_CollectionExtract(
                    ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)), 3)) AS g)
       INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, geom_pt, meta)
       SELECT $1, $2, 'submarket', $3, 'vn', g, ST_PointOnSurface(g)::geography,
              jsonb_build_object('source', 'osm-phuong', 'osm_id', $5::text)
       FROM g
       ON CONFLICT (id) DO UPDATE SET
         parent_id = EXCLUDED.parent_id, region_type = 'submarket',
         name = EXCLUDED.name, geom = EXCLUDED.geom, geom_pt = EXCLUDED.geom_pt,
         meta = (areas.meta - 'note') || EXCLUDED.meta`,
      [id, market.id, base, JSON.stringify(mp), String(r.osm_id)],
    );
    upserted++;
  }
  console.log(`${city}: phường upsert ${upserted}/${bounds.length}`);
  return upserted;
}

async function main() {
  const arg = process.argv[2];
  const cities = arg ? [arg] : Object.keys(MARKETS);
  for (const c of cities) if (!MARKETS[c]) throw new Error(`city không hỗ trợ: ${c}`);

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");

    // ---- 1. Phường OSM ----
    const active = [];
    for (const c of cities) if ((await upsertPhuong(client, c)) > 0) active.push(MARKETS[c].id);
    if (active.length === 0) throw new Error("không có OSM staging cho city nào");

    // Listings thuộc phạm vi: đang nằm trong các market này (market hoặc con)
    const scope = `(l.area_id = ANY($1) OR l.area_id IN
                     (SELECT id FROM areas WHERE parent_id = ANY($1)))`;

    // ---- 2. Point-in-polygon — mọi phường VN, không chỉ tỉnh của snapshot ----
    // ST_Covers để điểm nằm đúng trên ranh vẫn được gán; DISTINCT ON chốt 1 phường.
    const { rows: moves } = await client.query(
      `WITH pip AS (
         SELECT DISTINCT ON (l.id) l.id, l.area_id AS old_id, a.id AS new_id
         FROM listings l
         JOIN areas a ON a.region_type = 'submarket' AND a.country_code = 'vn'
                     AND a.meta->>'source' = 'osm-phuong'
                     AND ST_Covers(a.geom, ${PT})
         WHERE ${scope} AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
         ORDER BY l.id, ST_Area(a.geom), a.id
       ), upd AS (
         UPDATE listings l SET area_id = pip.new_id,
                geom = ${PT}::geography
         FROM pip WHERE l.id = pip.id
         RETURNING l.id
       )
       SELECT old_id, new_id, count(*)::int AS n FROM pip GROUP BY 1, 2 ORDER BY 3 DESC`,
      [active],
    );
    const changed = moves.filter((m) => m.old_id !== m.new_id);
    const nChanged = changed.reduce((s, m) => s + m.n, 0);
    const nAssigned = moves.reduce((s, m) => s + m.n, 0);
    console.log(`listings gán theo tọa độ: ${nAssigned} (đổi area: ${nChanged})`);

    // ---- 3. Ngoài mọi phường (hoặc thiếu tọa độ) → bỏ khỏi canonical ----
    const { rows: dropped } = await client.query(
      `DELETE FROM listings l
       WHERE ${scope}
         AND NOT EXISTS (
           SELECT 1 FROM areas a
           WHERE a.region_type = 'submarket' AND a.country_code = 'vn'
             AND a.meta->>'source' = 'osm-phuong'
             AND l.latitude IS NOT NULL AND ST_Covers(a.geom, ${PT}))
       RETURNING l.id, l.area_id, l.latitude, l.longitude`,
      [active],
    );
    console.log(`listings ngoài mọi phường — bỏ: ${dropped.length}`);
    for (const d of dropped) console.log(`  - ${d.id} (${d.area_id}) @ ${d.latitude},${d.longitude}`);

    // ---- 4. Xoá submarket không phải phường OSM, không còn tham chiếu ----
    // metrics/breakdowns là cache — 300/400 rebuild lại sau.
    const doomed = `SELECT a.id FROM areas a
       WHERE a.parent_id = ANY($1) AND a.region_type = 'submarket'
         AND a.meta->>'source' IS DISTINCT FROM 'osm-phuong'
         AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.area_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM sale_offers o WHERE o.area_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM market_asset_stats s WHERE s.area_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM saved_markets s WHERE s.area_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM areas c WHERE c.parent_id = a.id)`;
    await client.query(`DELETE FROM market_metrics WHERE area_id IN (${doomed})`, [active]);
    await client.query(`DELETE FROM area_breakdowns WHERE area_id IN (${doomed})`, [active]);
    const { rows: removed } = await client.query(
      `DELETE FROM areas WHERE id IN (${doomed}) RETURNING id, name`,
      [active],
    );
    console.log(`area không phải phường OSM — xoá: ${removed.length}`);

    const { rows: kept } = await client.query(
      `SELECT id, name FROM areas
       WHERE parent_id = ANY($1) AND meta->>'source' IS DISTINCT FROM 'osm-phuong'`,
      [active],
    );
    for (const k of kept) console.warn(`  ! còn area ngoài OSM (đang bị tham chiếu): ${k.id} ${k.name}`);

    await client.query("COMMIT");

    const { rows: final } = await client.query(
      `SELECT parent_id, count(*)::int total, count(geom)::int co_geom,
              count(*) FILTER (WHERE EXISTS (SELECT 1 FROM listings l WHERE l.area_id = a.id))::int co_listing
       FROM areas a WHERE parent_id = ANY($1) GROUP BY 1 ORDER BY 1`,
      [active],
    );
    for (const f of final)
      console.log(`${f.parent_id}: ${f.total} area (${f.co_geom} có polygon, ${f.co_listing} có listing)`);

    if (process.env.REPORT_JSON) {
      const fs = await import("node:fs");
      fs.writeFileSync(
        process.env.REPORT_JSON,
        JSON.stringify({ moves, dropped, removed, final }, null, 2),
      );
    }
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
