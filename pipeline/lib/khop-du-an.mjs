// khop-du-an.mjs — DA3 bang-noi-ma-du-an AC-2, AC-6: bộ khớp chạy bóng xếp mỗi bản ghi chuẩn (ban-ghi-nguon.mjs) vào đúng một ngả
// căn cứ (mo-hinh-danh-ba-du-an.md §1.2). Hàm thuần; docNut, docNoiSan đọc DB chỉ đọc. Thiết kế §3.2.
//   Thứ tự: đã nối (giu) → tên rỗng giả → không tỉnh → K1 → K2 → K3 → T → còn lại khong-khop; căn cứ trúng ≥ 2 nút → nhieu-nut.
//   Không bao giờ: nút khác tỉnh làm ứng viên; nối chỉ theo điểm; nối khi ≥ 2 nút. K4 ngoài phạm vi (0/344 nút có điểm).
import { createHash } from "node:crypto";

import { chuanKhop, DO_DAI_BI_DANH } from "./noi-du-an-s06-lop.mjs";
import { NOI_KHU_S09 } from "./s09-du-an.mjs";
import { duoiDuAn, NOI_DU_AN_S16 } from "./s16-danh-muc.mjs";

export const CAN_CU = Object.freeze(["K1", "K2", "K3", "T"]);
export const LY_DO = Object.freeze({
  khongTen: "khong-ten", khongTinh: "khong-tinh", khongViTri: "khong-vi-tri", nhieuNut: "nhieu-nut", khongKhop: "khong-khop",
  daoLuat: "dao-luat",
});
const K2_M = 300;

/** Khoá tên của một nút: tên đủ, cộng bí danh từ DO_DAI_BI_DANH ký tự (bí danh ngắn chạm bừa — khuôn DA32). */
export function khoaNut(ten, biDanh = []) {
  const k = new Set();
  if (chuanKhop(ten)) k.add(chuanKhop(ten));
  for (const b of biDanh) if (String(b ?? "").trim().length >= DO_DAI_BI_DANH && chuanKhop(b)) k.add(chuanKhop(b));
  return k;
}

const met = (a, b) => {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

/**
 * Xếp ngả không xét nối có sẵn.
 * @param {{ten_chuan: string|null, tinh: string|null, xa: string|null, diem: {lat,lng}|null, mst: string|null, ly_do_trong?: string|null}} b
 * @param {{id: number, tinh: string|null, xa: Set<string>|string[], khoa: Set<string>, diem: {lat,lng}|null, mst: string|null}[]} nut
 */
export function xepBong(b, nut) {
  if (!b.ten_chuan) return { nga: "chua_noi", ly_do: LY_DO.khongTen };
  if (!b.tinh) return { nga: "chua_noi", ly_do: b.ly_do_trong === LY_DO.khongViTri ? LY_DO.khongViTri : LY_DO.khongTinh };
  const trung = nut.filter((n) => n.tinh === b.tinh && n.khoa.has(b.ten_chuan)); // cung-tinh: chặn trước mọi căn cứ
  const ket = (can, ds) => (ds.length === 1 ? { nga: "noi", can_cu: can, node_id: ds[0].id } : { nga: "chua_noi", ly_do: LY_DO.nhieuNut, tai: can, ung_vien: ds.map((n) => n.id) });
  if (b.mst) { const ds = trung.filter((n) => n.mst && n.mst === b.mst); if (ds.length) return ket("K1", ds); }
  if (b.diem) { const ds = trung.filter((n) => n.diem && met(b.diem, n.diem) <= K2_M); if (ds.length) return ket("K2", ds); }
  if (b.xa) { const ds = trung.filter((n) => (n.xa instanceof Set ? n.xa.has(b.xa) : n.xa.includes(b.xa))); if (ds.length) return ket("K3", ds); }
  if (trung.length) return ket("T", trung);
  return { nga: "chua_noi", ly_do: LY_DO.khongKhop };
}

/**
 * Xếp ngả: nối có sẵn luôn thắng (giu); bóng ra nút khác thì ghi khac_noi_san, không ghi đè.
 * @param {Map<string, number>} noiSan mã nguồn → id nút đã nối
 */
export function xepNga(b, nut, noiSan = new Map()) {
  const bong = xepBong(b, nut);
  const san = noiSan.get(String(b.ma));
  if (san == null) return bong;
  const kq = { nga: "giu", node_id: san, bong };
  if (bong.nga === "noi" && bong.node_id !== san) kq.khac_noi_san = bong.node_id;
  return kq;
}

/** Nút dự án: tỉnh từ area_ids[1] (market, hoặc parent của submarket), xã là mọi submarket trong area_ids. */
export async function docNut(client) {
  const { rows } = await client.query(`
    SELECT n.id::int AS id, n.name, n.slug, n.aliases, n.catalog_tier AS tier, n.meta,
           CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS tinh,
           coalesce((SELECT array_agg(s.id) FROM areas s WHERE s.id = ANY (n.area_ids) AND s.region_type = 'submarket'), '{}') AS xa
      FROM asset_nodes n LEFT JOIN areas a ON a.id = n.area_ids[1]
     WHERE n.node_type = 'project' ORDER BY n.id`);
  return rows.map((r) => ({ id: r.id, ten: r.name, slug: r.slug, tier: r.tier, tinh: r.tinh, xa: new Set(r.xa),
    khoa: khoaNut(r.name, r.aliases ?? []), diem: r.meta?.diem ?? null, mst: r.meta?.mst ?? null }));
}

/** Nối có sẵn của nguồn: chép cứng (S09, S16), bảng tay và thẻ DA55 (S08), dòng project_links nối không do DA3 ghi. */
export async function docNoiSan(client, nguon, { maDa3 = [] } = {}) {
  const ra = new Map();
  const slugNut = async (slug) => (await client.query("SELECT id::int FROM asset_nodes WHERE slug = $1", [slug])).rows[0]?.id ?? null;
  if (nguon === "S09") for (const [ma, slug] of Object.entries(NOI_KHU_S09)) { const id = await slugNut(slug); if (id) ra.set(ma, id); }
  if (nguon === "S16") {
    const { rows } = await client.query(
      `SELECT DISTINCT payload -> 'html' ->> 'slug' AS ma FROM stg_s16_item WHERE kind = 'du-an' AND payload -> 'html' ->> 'slug' IS NOT NULL
       UNION SELECT du_an FROM stg_s16_khu`);
    for (const { ma } of rows) { const slug = NOI_DU_AN_S16[duoiDuAn(ma)]; if (slug) { const id = await slugNut(slug); if (id) ra.set(ma, id); } }
  }
  if (nguon === "S08") {
    const { rows } = await client.query("SELECT project_id AS ma, asset_node_id::int AS id FROM s08_project_links WHERE status = 'noi'");
    for (const r of rows) ra.set(r.ma, r.id);
  }
  const { rows } = await client.query(
    `SELECT pl.source_project_id AS ma, pl.asset_node_id::int AS id FROM project_links pl
       LEFT JOIN project_link_rules r ON r.id = pl.rule_id
      WHERE pl.source = $1 AND pl.status = 'noi' AND (r.id IS NULL OR NOT (r.can_cu = ANY ($2::text[])))`, [nguon, maDa3]);
  for (const r of rows) if (!ra.has(r.ma)) ra.set(r.ma, r.id);
  return ra;
}

/** Kết cục chuẩn hoá để băm: chỉ trường quyết định (ngả, căn cứ, nút, lý do). */
export const ketCucChuan = (kq) => ({ nga: kq.nga, can_cu: kq.can_cu ?? null, node_id: kq.node_id ?? null, ly_do: kq.ly_do ?? null,
  khac_noi_san: kq.khac_noi_san ?? null });

/** sha256 của danh sách {ma, kq} sắp theo mã. */
export function bamKetCuc(ds) {
  const sap = [...ds].sort((a, b) => (String(a.ma) < String(b.ma) ? -1 : String(a.ma) > String(b.ma) ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(sap.map((d) => [String(d.ma), ketCucChuan(d.kq)]))).digest("hex");
}
