// lib/osm.mjs — dùng chung cho các script pipeline xử lý ranh giới OSM.
export const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Điều kiện SQL «phường OSM hợp lệ» dùng chung cho mọi bước gán khu vực theo toạ độ (reassign-areas, transform-airbnb).
 * Khu vực lạc mà lượt theo lịch chưa xoá (AU9 AC-10) mang meta.lac — không bước nào được gán listing vào đó.
 * @param {string} [p] tiền tố bảng, vd "a."
 */
export const phuongHopLe = (p = "") => `${p}meta->>'source' = 'osm-phuong' AND NOT (${p}meta ? 'lac')`;

/** Nhãn nguồn của phường OSM trong areas.meta.source — bên ghi (reassign-areas) đọc từ đây, không viết lại chuỗi. */
export const NGUON_PHUONG = "osm-phuong";

/**
 * Phường hợp lệ của các thị trường — danh sách khớp tên dùng chung của transform tin rao (S03/S05/S06).
 * @param {import("pg").Client} client
 * @param {string[]} markets id thị trường, vd ["vn-hanoi"]
 * @returns {Promise<{ id: string, name: string, parent_id: string }[]>}
 */
export async function docPhuongHopLe(client, markets) {
  const { rows } = await client.query(
    `SELECT id, name, parent_id FROM areas
     WHERE region_type = 'submarket' AND parent_id = ANY($1::text[]) AND ${phuongHopLe()}
     ORDER BY id`,
    [markets],
  );
  return rows;
}

/**
 * Gán listing đang đứng ở cấp thị trường vào phường hợp lệ chứa toạ độ (point-in-polygon).
 * @param {import("pg").Client} client
 * @param {string} marketId vd "vn-hcmc"
 * @returns {Promise<number>} số listing được gán
 */
export async function ganPhuongTheoToaDo(client, marketId) {
  const { rowCount } = await client.query(
    `UPDATE listings l SET area_id = a.id
     FROM areas a
     WHERE a.parent_id = $1 AND a.geom IS NOT NULL AND ${phuongHopLe("a.")}
       AND l.latitude IS NOT NULL AND l.area_id = $1
       AND ST_Contains(a.geom::geometry, ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326))`,
    [marketId],
  );
  return rowCount;
}

export const stripPrefix = (s) =>
  s.replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/, "");

/** Gộp ways outer thành các ring đóng (mỗi connected-component một ring). */
export function assembleRings(ways) {
  const unused = ways.map((w) => w);
  const rings = [];
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  while (unused.length > 0) {
    const ring = [...unused.shift()];
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < unused.length; i++) {
        const w = unused[i];
        const head = ring[0];
        const tail = ring[ring.length - 1];
        if (same(tail, w[0])) ring.push(...w.slice(1));
        else if (same(head, w[w.length - 1])) ring.unshift(...w.slice(0, -1));
        else if (same(head, w[0])) ring.unshift(...w.slice(1).reverse());
        else if (same(tail, w[w.length - 1])) ring.push(...w.slice(0, -1).reverse());
        else continue;
        unused.splice(i, 1);
        progress = true;
      }
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
export function toMultiPolygon(el) {
  const members = el.members ?? [];
  const outerWays = members
    .filter((m) => m.role === "outer" && Array.isArray(m.geometry))
    .map((m) => m.geometry.map((g) => [Number(g.lon), Number(g.lat)]));
  if (outerWays.length === 0) return null;
  const rings = assembleRings(outerWays);
  if (rings.length === 0) return null;
  return { type: "MultiPolygon", coordinates: rings.map((r) => [r]) };
}
