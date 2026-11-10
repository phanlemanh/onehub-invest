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
 * PX1: DB đã áp 084 (areas.admin_code + area_aliases) chưa. Chưa áp → mọi bộ đọc khớp tên dùng đúng điều kiện cũ, không
 * bí danh (code gộp trước khi máy thu áp 084 vẫn chạy như trước — AC-10); in «chưa áp 084» một lần mỗi tiến trình.
 * @param {import("pg").Client} client
 */
let daBaoChuaAp = false;
export async function coDanhBa(client) {
  const { rows: [r] } = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'admin_code')
            AND to_regclass('area_aliases') IS NOT NULL AS ok`,
  );
  if (!r.ok && !daBaoChuaAp) {
    daBaoChuaAp = true;
    console.log("chưa áp 084 — khớp tên chỉ dùng phường OSM, không bí danh xã cũ");
  }
  return r.ok;
}

/**
 * Điều kiện «khu vực khớp tên được» (PX1): phường OSM hợp lệ, hoặc xã của danh bạ Cục Thống kê (có admin_code, kể cả
 * chưa có ranh giới). Point-in-polygon KHÔNG dùng điều kiện này — vẫn là `phuongHopLe`.
 * @param {string} [p] tiền tố bảng
 * @param {boolean} [coMa] DB đã áp 084
 */
export const khuVucKhopTen = (p = "", coMa = true) =>
  coMa ? `((${phuongHopLe(p)}) OR ${p}admin_code IS NOT NULL)` : phuongHopLe(p);

/**
 * Thị trường có ít nhất một khu vực khớp tên được (PX1) — S06 theo mã thị trường của tin, danh sách tên của S03.
 * @param {import("pg").Client} client
 * @returns {Promise<string[]>}
 */
export async function docThiTruongCoXa(client) {
  const coMa = await coDanhBa(client);
  const { rows } = await client.query(
    `SELECT DISTINCT parent_id FROM areas WHERE region_type = 'submarket' AND ${khuVucKhopTen("", coMa)} ORDER BY parent_id`,
  );
  return rows.map((r) => r.parent_id);
}

/**
 * Bí danh xã cũ AN TOÀN theo thị trường (PX1, lib/dvhc.mjs dungBiDanhAnToan): tên chuẩn → area_id. Chưa áp 084 → rỗng.
 * @param {import("pg").Client} client
 * @param {string[]} markets
 * @returns {Promise<Map<string, Map<string, string>>>}
 */
export async function docBiDanhAnToan(client, markets) {
  if (!(await coDanhBa(client))) return new Map();
  const { rows: cu } = await client.query(
    `SELECT old_code AS ma, province_code AS "maTinh", name AS ten, targets AS vao FROM area_aliases`,
  );
  const { rows: xa } = await client.query(
    `SELECT admin_code AS ma, id, name, parent_id AS market FROM areas
     WHERE region_type = 'submarket' AND admin_code IS NOT NULL`,
  );
  const { dungBiDanhAnToan } = await import("./dvhc.mjs");
  const { map } = dungBiDanhAnToan(cu, xa);
  const chon = new Set(markets);
  return new Map([...map].filter(([m]) => chon.has(m)));
}

/**
 * Các thị trường có ít nhất một phường hợp lệ — đối chiếu tên phường khi nhóm S03 chưa khai thị trường (N1, Hỏi-1).
 * @param {import("pg").Client} client
 * @returns {Promise<string[]>}
 */
export async function docThiTruongCoPhuong(client) {
  const { rows } = await client.query(
    `SELECT DISTINCT parent_id FROM areas WHERE region_type = 'submarket' AND ${phuongHopLe()} ORDER BY parent_id`,
  );
  return rows.map((r) => r.parent_id);
}

/**
 * Khu vực khớp tên được của các thị trường (phường OSM hợp lệ + xã danh bạ 084, PX1) — danh sách khớp tên dùng chung
 * của transform tin rao (S03/S05/S06).
 * @param {import("pg").Client} client
 * @param {string[]} markets id thị trường, vd ["vn-hanoi"]
 * @returns {Promise<{ id: string, name: string, parent_id: string }[]>}
 */
export async function docPhuongHopLe(client, markets) {
  const coMa = await coDanhBa(client);
  const { rows } = await client.query(
    `SELECT id, name, parent_id FROM areas
     WHERE region_type = 'submarket' AND parent_id = ANY($1::text[]) AND ${khuVucKhopTen("", coMa)}
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
