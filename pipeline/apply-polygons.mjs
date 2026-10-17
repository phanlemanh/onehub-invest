// apply-polygons.mjs — lắp ranh giới OSM vào areas (geom MultiPolygon 4326).
// Match theo slug tên sau khi bỏ prefix hành chính (Quận/Huyện/Phường/Thị xã…)
// — đúng thực tế 2025: OSM level-6 Hà Nội là 126 phường mới, Airbnb title dùng
// tên cũ/quận → cùng slug hoá thì khớp.
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripPrefix = (s) => s.replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/, "");

/** Gộp ways outer thành các ring đóng (mỗi connected-component một ring). */
function assembleRings(ways) {
  const unused = ways.map((w) => w);
  const rings = [];
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  while (unused.length > 0) {
    // bắt đầu component từ way đầu tiên còn lại
    const ring = [...unused.shift()];
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < unused.length; i++) {
        const w = unused[i];
        const head = ring[0];
        const tail = ring[ring.length - 1];
        if (same(tail, w[0])) {
          ring.push(...w.slice(1));
        } else if (same(head, w[w.length - 1])) {
          ring.unshift(...w.slice(0, -1));
        } else if (same(head, w[0])) {
          ring.unshift(...w.slice(1).reverse());
        } else if (same(tail, w[w.length - 1])) {
          ring.push(...w.slice(0, -1).reverse());
        } else {
          continue;
        }
        unused.splice(i, 1);
        progress = true;
      }
      // ring đã khép → dừng component này
      if (same(ring[0], ring[ring.length - 1]) && ring.length >= 4) break;
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
    if (ring.length >= 4) rings.push(ring);
  }
  return rings;
}

/** Overpass element → MultiPolygon GeoJSON (chỉ outer rings) hoặc null. */
function toMultiPolygon(el) {
  const members = el.members ?? [];
  const outerWays = members
    .filter((m) => m.role === "outer" && Array.isArray(m.geometry))
    .map((m) => m.geometry.map((g) => [Number(g.lon), Number(g.lat)]));
  if (outerWays.length === 0) return null;
  const rings = assembleRings(outerWays);
  if (rings.length === 0) return null;
  return {
    type: "MultiPolygon",
    coordinates: rings.map((r) => [r]),
  };
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT DISTINCT ON (osm_id) osm_id, name, payload
       FROM stg_osm_boundaries ORDER BY osm_id, snapshot_id DESC`,
    );
    // map slug → danh sách area ids (nhiều area Airbnb có thể trùng slug
    // — "Dong Da" và "Quận Đống Đa" — cùng nhận polygon)
    const { rows: areas } = await client.query(
      `SELECT id, name FROM areas WHERE id LIKE 'vn-%' AND region_type = 'submarket'`,
    );
    const bySlug = new Map();
    for (const a of areas) {
      const s = slugify(stripPrefix(a.name));
      if (!bySlug.has(s)) bySlug.set(s, []);
      bySlug.get(s).push(a.id);
    }

    let built = 0;
    let matched = 0;
    for (const r of rows) {
      const name = r.name ?? "";
      const slug = slugify(stripPrefix(name));
      const areaIds = bySlug.get(slug);
      if (!areaIds?.length) continue;
      const mp = toMultiPolygon(r.payload);
      if (!mp) continue;
      built++;
      for (const areaId of areaIds) {
        await client.query(`UPDATE areas SET geom = ST_GeomFromGeoJSON($1) WHERE id = $2`, [
          JSON.stringify(mp),
          areaId,
        ]);
        matched++;
      }
    }
    console.log(
      `OSM boundaries: ${rows.length} nạp, ${built} build polygon được, ${matched} area UPDATE`,
    );
    const { rows: withGeom } = await client.query(
      `SELECT count(*) n FROM areas WHERE parent_id = 'vn-hanoi' AND geom IS NOT NULL`,
    );
    console.log(`areas Hà Nội có geom: ${withGeom[0].n}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
