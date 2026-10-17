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
