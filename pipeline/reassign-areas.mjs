// reassign-areas.mjs — G0-b: chuẩn hoá gán khu vực bằng point-in-polygon.
// Nguồn sự thật về vị trí là TỌA ĐỘ listing, không phải title discovery.
//  1. Upsert phường OSM 2025 của từng tỉnh (stg_osm_boundaries, lọc theo city)
//     làm submarket — tên/polygon lấy từ OSM, id = <market>-<slug>. Chỉ nhận ranh giới
//     cấp phường/xã (admin_level 6) có điểm-trên-bề-mặt nằm trong polygon market: tiền tố
//     snapshot là nhãn của bên thu, từng gắn cả 34 tỉnh vào Hà Nội (AU9).
//  2. Mọi listing VN được gán vào phường chứa tọa độ (ST_Covers), xét toàn bộ
//     phường VN — listing trong snapshot Hà Nội nhưng nằm ở TP.HCM sang TP.HCM.
//  3. Listing ngoài mọi phường đã có polygon (ngoài tỉnh: Hưng Yên, Vĩnh Phúc…)
//     hoặc thiếu tọa độ → bỏ khỏi canonical (staging giữ nguyên, nights cascade).
//  4. Xoá submarket không phải phường OSM (title-area: "Quận Tây Hồ", "Hà Nội",
//     "Văn Giang"…) khi không còn gì tham chiếu.
//  5. Dọn «khu vực lạc» — con osm-phuong của market mà osm_id không thuộc tập phường hợp lệ
//     của lượt này: tin bán về area_id NULL, xoá metrics/breakdowns rồi xoá khu vực; khu vực
//     còn saved_markets (xoá ở local là sync-cloud xoá ở cloud, FK cascade xoá thị trường người
//     dùng đã lưu — AU9 Hỏi-3) hoặc properties trỏ vào thì GIỮ.
// Tập phường hợp lệ rỗng hoặc dưới một nửa số con hiện có → dừng, không xoá gì (snapshot hỏng).
// Idempotent. Chạy xong cần rerun 300_metrics + 400_breakdowns.
//   node reassign-areas.mjs            # mọi city có OSM staging
//   node reassign-areas.mjs hanoi      # một city
//   node reassign-areas.mjs hanoi --xoa-khu-vuc-lac   # kèm xoá khu vực lạc (chỉ gọi tay, sau khi đếm
//                                                      saved_markets trên cloud — lượt theo lịch KHÔNG mang cờ)
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { slugify, stripPrefix, toMultiPolygon } from "./lib/osm.mjs";

export const MARKETS = {
  hanoi: { id: "vn-hanoi", name: "Hà Nội" },
  hcmc: { id: "vn-hcmc", name: "TP. Hồ Chí Minh" },
};
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Cấp hành chính của phường/xã sau sáp nhập 2025 (tỉnh = 4)
export const WARD_LEVEL = "6";
// Dung sai (độ) khi xét phường nằm trong polygon market / con nằm trong cha
export const DUNG_SAI = 0.01;
// Tập phường hợp lệ dưới tỉ lệ này so với số con hiện có → snapshot hỏng, dừng
export const TI_LE_TOI_THIEU = 0.5;

// Điểm của listing — dùng chung cho mọi câu PIP
const PT = "ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)";

async function upsertPhuong(client, city, log) {
  const market = MARKETS[city];
  const { rows: bounds } = await client.query(
    `SELECT DISTINCT ON (osm_id) osm_id, name, payload, payload->'tags'->>'admin_level' AS lvl
     FROM stg_osm_boundaries WHERE snapshot_id LIKE $1
     ORDER BY osm_id, snapshot_id DESC`,
    [`${city}__%`],
  );
  const out = { upserted: 0, ids: [], skippedLevel: 0, skippedOutside: [], bounds: bounds.length };
  if (bounds.length === 0) return out;
  await client.query(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
     VALUES ($1, NULL, 'market', $2, 'vn', '{}'::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [market.id, market.name],
  );
  const { rows: [mk] } = await client.query(`SELECT geom IS NOT NULL AS co FROM areas WHERE id = $1`, [market.id]);
  if (!mk.co) log.warn(`  ! ${city}: ${market.id} chưa có polygon — không chốt vị trí phường`);
  const marketSlug = slugify(market.name.replace(/^TP\.\s*/, ""));
  const seen = new Map();
  for (const r of bounds) {
    if (r.lvl !== WARD_LEVEL) {
      out.skippedLevel++;
      continue;
    }
    let base = stripPrefix(r.name ?? "").trim();
    const slug = slugify(base);
    // Tên trùng tỉnh = tự tham chiếu market — bỏ
    if (!slug || slug === marketSlug) continue;
    let id = `${market.id}-${slug}`;
    if (seen.has(id)) {
      // Hai phường khác nhau chỉ khác dấu (Thạnh An ≠ Thanh An) — giữ cả hai polygon,
      // tách id + tên (app dựng URL từ slug tên) bằng mã bưu chính / osm_id.
      const tag = r.payload?.tags?.postal_code ?? r.osm_id;
      log.warn(`  ! ${city}: trùng slug ${id} (osm ${seen.get(id)} vs ${r.osm_id}) — tách thành "${base} (${tag})"`);
      id = `${id}-${slugify(String(tag))}`;
      base = `${base} (${tag})`;
    }
    const mp = toMultiPolygon(r.payload);
    if (!mp) {
      log.warn(`  ! ${city}: không dựng được polygon cho ${r.name} (osm ${r.osm_id})`);
      continue;
    }
    // Chốt vị trí: phường phải nằm trong polygon market (khi market có polygon)
    const { rows: [vt] } = await client.query(
      `WITH g AS (SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) AS g)
       SELECT m.geom IS NULL OR ST_DWithin(m.geom, ST_PointOnSurface(g.g), $3) AS trong
       FROM g, areas m WHERE m.id = $2`,
      [JSON.stringify(mp), market.id, DUNG_SAI],
    );
    if (!vt.trong) {
      out.skippedOutside.push(r.name);
      log.warn(`  ! ${city}: bỏ «${r.name}» (osm ${r.osm_id}) — nằm ngoài polygon ${market.id}`);
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
    out.ids.push(id);
    out.upserted++;
  }
  log.log(
    `${city}: phường upsert ${out.upserted}/${bounds.length} · bỏ ${out.skippedLevel} dòng khác cấp ${WARD_LEVEL}` +
      ` · bỏ ${out.skippedOutside.length} ngoài polygon`,
  );
  return out;
}

/**
 * Thân reassign — người gọi giữ transaction (main bọc BEGIN…COMMIT; test và thước bọc
 * BEGIN…ROLLBACK). Ném lỗi khi snapshot hỏng (tập phường hợp lệ teo) TRƯỚC khi xoá gì.
 * @param {import("pg").Client} client
 * @param {string[]} [cities]
 * @param {{ log?: { log: (...a: unknown[]) => void, warn: (...a: unknown[]) => void }, xoaKhuVucLac?: boolean }} [opts]
 *   xoaKhuVucLac — chỉ khi true mới xoá khu vực lạc (bước 5). Mặc định false: lượt theo lịch hằng tuần
 *   (weekly-collect → finalize-hanoi) không xoá gì, vì rào saved_markets chỉ thấy DB local còn thị trường
 *   người dùng lưu nằm trên cloud (AU9 AC-10).
 */
export async function runReassign(client, cities = Object.keys(MARKETS), { log = console, xoaKhuVucLac = false } = {}) {
  for (const c of cities) if (!MARKETS[c]) throw new Error(`city không hỗ trợ: ${c}`);

  // ---- 1. Phường OSM ----
  const active = [];
  const valid = [];
  const stale = [];
  const out = { skippedLevel: 0, skippedOutside: [] };
  for (const c of cities) {
    const u = await upsertPhuong(client, c, log);
    out.skippedLevel += u.skippedLevel;
    out.skippedOutside.push(...u.skippedOutside);
    if (u.bounds === 0) continue;
    const mid = MARKETS[c].id;
    // Chốt an toàn: snapshot hỏng (mất tag cấp, gom nhầm) thì không được xoá trọn thành phố
    const { rows: con } = await client.query(
      `SELECT id FROM areas WHERE parent_id = $1 AND meta->>'source' = 'osm-phuong'`,
      [mid],
    );
    const ids = new Set(u.ids);
    if (ids.size === 0 || ids.size < TI_LE_TOI_THIEU * con.length) {
      throw new Error(
        `${mid}: chỉ ${ids.size} phường hợp lệ / ${con.length} con osm-phuong hiện có — snapshot hỏng, dừng, không xoá gì`,
      );
    }
    active.push(mid);
    valid.push(...ids);
    stale.push(...con.map((a) => a.id).filter((id) => !ids.has(id)));
  }
  if (active.length === 0) throw new Error("không có OSM staging cho city nào");

  // Listings thuộc phạm vi: đang nằm trong các market này (market hoặc con)
  const scope = `(l.area_id = ANY($1) OR l.area_id IN
                   (SELECT id FROM areas WHERE parent_id = ANY($1)))`;
  // Phường hợp lệ cho PIP: phường OSM VN trừ khu vực lạc của lượt này
  const phuong = `a.region_type = 'submarket' AND a.country_code = 'vn'
                  AND a.meta->>'source' = 'osm-phuong' AND a.id <> ALL($2::text[])`;

  // ---- 2. Point-in-polygon — mọi phường VN, không chỉ tỉnh của snapshot ----
  // ST_Covers để điểm nằm đúng trên ranh vẫn được gán; DISTINCT ON chốt 1 phường.
  const { rows: moves } = await client.query(
    `WITH pip AS (
       SELECT DISTINCT ON (l.id) l.id, l.area_id AS old_id, a.id AS new_id
       FROM listings l
       JOIN areas a ON ${phuong} AND ST_Covers(a.geom, ${PT})
       WHERE ${scope} AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
       ORDER BY l.id, ST_Area(a.geom), a.id
     ), upd AS (
       UPDATE listings l SET area_id = pip.new_id,
              geom = ${PT}::geography
       FROM pip WHERE l.id = pip.id
       RETURNING l.id
     )
     SELECT old_id, new_id, count(*)::int AS n FROM pip GROUP BY 1, 2 ORDER BY 3 DESC`,
    [active, stale],
  );
  const changed = moves.filter((m) => m.old_id !== m.new_id);
  const nChanged = changed.reduce((s, m) => s + m.n, 0);
  const nAssigned = moves.reduce((s, m) => s + m.n, 0);
  log.log(`listings gán theo tọa độ: ${nAssigned} (đổi area: ${nChanged})`);

  // ---- 3. Ngoài mọi phường hợp lệ (hoặc thiếu tọa độ) → bỏ khỏi canonical ----
  const { rows: dropped } = await client.query(
    `DELETE FROM listings l
     WHERE ${scope}
       AND NOT EXISTS (
         SELECT 1 FROM areas a
         WHERE ${phuong} AND l.latitude IS NOT NULL AND ST_Covers(a.geom, ${PT}))
     RETURNING l.id, l.area_id, l.latitude, l.longitude`,
    [active, stale],
  );
  log.log(`listings ngoài mọi phường — bỏ: ${dropped.length}`);
  for (const d of dropped) log.log(`  - ${d.id} (${d.area_id}) @ ${d.latitude},${d.longitude}`);

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
  const { rows: removedOld } = await client.query(
    `DELETE FROM areas WHERE id IN (${doomed}) RETURNING id, name`,
    [active],
  );
  log.log(`area không phải phường OSM — xoá: ${removedOld.length}`);

  const { rows: keptOld } = await client.query(
    `SELECT id, name FROM areas
     WHERE parent_id = ANY($1) AND meta->>'source' IS DISTINCT FROM 'osm-phuong'`,
    [active],
  );
  for (const k of keptOld) log.warn(`  ! còn area ngoài OSM (đang bị tham chiếu): ${k.id} ${k.name}`);

  // ---- 5. Khu vực lạc: con osm-phuong không thuộc tập phường hợp lệ của lượt này ----
  // Giữ khu vực lạc còn dữ liệu không phải cache trỏ vào: saved_markets (thị trường người dùng lưu —
  // xoá ở local là cloud cascade xoá theo) và properties (căn nhà đã dựng, FK không cascade).
  const { rows: giu } = await client.query(
    `SELECT a.id,
            (SELECT count(*)::int FROM saved_markets s WHERE s.area_id = a.id) AS saved,
            (SELECT count(*)::int FROM properties p WHERE p.area_id = a.id) AS properties
     FROM unnest($1::text[]) AS a(id)`,
    [stale],
  );
  if (!xoaKhuVucLac) {
    if (stale.length) {
      log.warn(`  ! ${stale.length} khu vực lạc — KHÔNG xoá ở lượt này (không có cờ --xoa-khu-vuc-lac):`);
      for (const g of giu) log.warn(`    · ${g.id} — ${g.saved} saved_markets, ${g.properties} properties`);
      log.warn(`    dọn sau khi đếm saved_markets trên cloud: node reassign-areas.mjs <city> --xoa-khu-vuc-lac`);
    }
    return { moves, dropped, removed: removedOld, kept: [], stale, valid, ...out };
  }
  const kept = giu.filter((r) => r.saved > 0 || r.properties > 0);
  for (const k of kept)
    log.warn(`  ! giữ khu vực lạc ${k.id} — ${k.saved} saved_markets, ${k.properties} properties trỏ vào`);
  const xoa = stale.filter((id) => !kept.some((k) => k.id === id));
  // listing/nights đã được bước 2–3 dời hoặc bỏ; tin bán chỉ khớp chữ nên mất nhãn phường;
  // metrics/breakdowns/asset_stats là cache — 300/400/500 dựng lại
  await client.query(`UPDATE sale_offers SET area_id = NULL WHERE area_id = ANY($1)`, [xoa]);
  await client.query(`DELETE FROM market_metrics WHERE area_id = ANY($1)`, [xoa]);
  await client.query(`DELETE FROM area_breakdowns WHERE area_id = ANY($1)`, [xoa]);
  await client.query(`DELETE FROM market_asset_stats WHERE area_id = ANY($1)`, [xoa]);
  const { rows: removed } = await client.query(
    `DELETE FROM areas WHERE id = ANY($1) RETURNING id, name`,
    [xoa],
  );
  log.log(`khu vực lạc — xoá: ${removed.length} · giữ (có saved_markets/properties): ${kept.length}`);
  for (const r of removed) log.log(`  - ${r.id} ${r.name}`);

  return { moves, dropped, removed: [...removedOld, ...removed], kept, stale, valid, ...out };
}

async function main() {
  const args = process.argv.slice(2);
  const xoaKhuVucLac = args.includes("--xoa-khu-vuc-lac");
  const arg = args.find((a) => !a.startsWith("--"));
  const cities = arg ? [arg] : Object.keys(MARKETS);

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const r = await runReassign(client, cities, { xoaKhuVucLac });
    await client.query("COMMIT");

    const active = cities.map((c) => MARKETS[c].id);
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
        JSON.stringify({ moves: r.moves, dropped: r.dropped, removed: r.removed, kept: r.kept, final }, null, 2),
      );
    }
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
