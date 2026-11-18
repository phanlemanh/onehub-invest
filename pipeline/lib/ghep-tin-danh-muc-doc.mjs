// ghep-tin-danh-muc-doc.mjs — PL20 ghep-tin-vao-danh-muc: đọc đầu vào của luật gắn từ DB (chỉ đọc) và chạy luật trên toàn bộ tin.
// Dùng chung cho chạy khô, rút mẫu nhãn, danh sách đọc bù và bước ghi, để mọi phép đo nói về đúng một luật.
import { KHU_SLUG } from "./mau-hai-khu.mjs";
import { NGUON_BAT, dungDanhBa, xetTin } from "./ghep-tin-danh-muc.mjs";
import { testMarker } from "./test-posts.mjs";

/** Bản đọc được nhận: đúng phiên bản đọc gộp hiện hành. */
export const PROMPT_VERSION_DOC = "dg3-s03-v3";
/** Thứ tự nguồn từ chắc tới kém chắc, để gọi tên nguồn của một tin có nhiều bài. */
export const THU_TU_NGUON = Object.freeze(["A", "B", "C", "F", "D", "G"]);
/** Lý do của tin chưa gắn, lấy lý do đứng trước khi các bài khác nhau. */
const THU_TU_LY_DO = Object.freeze(["mo-ho", "ngoai-danh-ba", "chu-model-khac", "bai-nhieu-can", "chu-nhieu-toa", "chu-nhieu-vung", "model-nhieu-toa",
  "model-nhieu-vung", "trich-khong-co-ten", "chi-luat", "nguon-tat", "khong-neu"]);

/** Danh bạ của các dự án trong phạm vi, khoá là id nút dự án dạng chuỗi. */
async function docDanhBa(c) {
  const { rows: duAn } = await c.query(`SELECT id::text AS id FROM asset_nodes WHERE node_type = 'project' AND slug = ANY ($1)`, [Object.values(KHU_SLUG)]);
  const ra = new Map();
  for (const { id } of duAn) {
    const { rows: nut } = await c.query(
      `WITH RECURSIVE con AS (
         SELECT n.id, n.parent_id, n.name, n.aliases, 1 AS sau FROM asset_nodes n WHERE n.parent_id = $1::bigint
         UNION ALL
         SELECT n.id, n.parent_id, n.name, n.aliases, con.sau + 1 FROM asset_nodes n JOIN con ON n.parent_id = con.id WHERE con.sau < 16)
       SELECT id::text, parent_id::text, name, aliases FROM con`, [id]);
    const { rows: toa } = await c.query(
      `SELECT b.building_key AS key, b.upi, b.region_node_id::text AS vung,
              array_agg(DISTINCT a.value) FILTER (WHERE a.kind = 'ten' AND a.retired_at IS NULL) AS ten
         FROM buildings b LEFT JOIN registry_aliases a ON a.object_key = b.building_key
        WHERE b.status = 'active' AND b.region_node_id = ANY ($1::bigint[])
        GROUP BY 1, 2, 3`, [[id, ...nut.map((n) => n.id)]]);
    ra.set(id, dungDanhBa({
      toa: toa.map((b) => ({ key: b.key, upi: b.upi, vung_id: b.vung === id ? null : b.vung, ten: b.ten ?? [] })),
      vung: nut.map((n) => ({ id: n.id, cha_id: n.parent_id === id ? null : n.parent_id, ten: [n.name, ...(n.aliases ?? [])].filter(Boolean) })),
    }));
  }
  return ra;
}

/**
 * Đầu vào của luật. `offerIds` giới hạn tin được đọc; mẫu số luôn là tin căn hộ S03 đang sống.
 * @param {import("pg").Client} c
 * @returns {Promise<{ tin: object[], bai: Map<string, {cot: string[], chu: string|null, banDoc: object|null}>, danhBa: Map<string, object> }>}
 */
export async function docDauVao(c, { offerIds = null } = {}) {
  const danhBa = await docDanhBa(c);
  const { rows: tin } = await c.query(
    `SELECT o.offer_id, o.kind, o.property_type, o.post_ids, p.project_node_id::text AS du_an
       FROM sale_offers o LEFT JOIN offer_project p USING (offer_id)
      WHERE o.source = 'S03' AND o.property_type = 'apartment' AND ($1::text[] IS NULL OR o.offer_id = ANY ($1))`, [offerIds]);
  const ids = [...new Set(tin.filter((t) => danhBa.has(t.du_an)).flatMap((t) => t.post_ids ?? []))];
  const bai = new Map();
  if (!ids.length) return { tin, bai, danhBa };

  const { rows: posts } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, group_name FROM stg_zalo_posts
      WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [ids]);
  for (const p of posts) if (!testMarker(p)) bai.set(p.post_id, { cot: [], chu: p.text ?? null, banDoc: null });

  const { rows: cot } = await c.query(
    `SELECT split_part(subject_key, ':', 2) AS post_id, value FROM field_assertions
      WHERE subject_key = ANY ($1) AND field = 'block_raw' AND retracted_at IS NULL`, [ids.map((i) => `S03:${i}`)]);
  for (const r of cot) bai.get(r.post_id)?.cot.push(r.value);

  const { rows: doc } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, label_id::text, model, probabilities -> 'o' AS o FROM silver_labels
      WHERE source_code = 'S03' AND post_id = ANY ($1) AND prompt_version = $2 AND probabilities ->> 'nguon' = 'doc-gop' AND json_ok
      ORDER BY post_id, labeled_at DESC, label_id DESC`, [ids, PROMPT_VERSION_DOC]);
  for (const r of doc) {
    const b = bai.get(r.post_id);
    if (b) b.banDoc = { label_id: r.label_id, model: r.model, building: r.o?.building, subzone: r.o?.subzone, multi_unit: r.o?.multi_unit };
  }
  return { tin, bai, danhBa };
}

const cong = (o, k) => { o[k] = (o[k] ?? 0) + 1; };

/**
 * Chạy luật trên mọi tin của đầu vào.
 * @returns {{ ketQuaBai: Map<string, object>, theoTin: Map<string, object>, dem: object }}
 */
export function tinhGan({ tin, bai, danhBa }, { nguonBat = NGUON_BAT } = {}) {
  const ketQuaBai = new Map();
  const theoTin = new Map();
  const dem = { tong: tin.length, ban: 0, gan: 0, gan_ban: 0, toa: 0, vung: 0, xung_dot: 0, theo_nguon: {}, theo_khu: {}, ly_do: {} };
  for (const t of tin) {
    if (t.kind === "sale") dem.ban++;
    const kq = xetTin(t, (p) => bai.get(p), danhBa, { nguonBat });
    for (const [p, x] of kq.bai) ketQuaBai.set(p, { ...x, offer_id: t.offer_id, du_an: t.du_an });
    const ds = [...kq.bai.values()];
    if (kq.gop?.status === "gan") {
      const nguon = THU_TU_NGUON.find((n) => ds.some((x) => x.nguon === n));
      theoTin.set(t.offer_id, { status: "gan", muc: kq.gop.muc, k: kq.gop.k, nguon, du_an: t.du_an, kind: t.kind });
      dem.gan++; dem[kq.gop.muc]++; cong(dem.theo_nguon, nguon); cong(dem.theo_khu, t.du_an);
      if (t.kind === "sale") dem.gan_ban++;
    } else if (kq.gop?.status === "xung_dot") {
      theoTin.set(t.offer_id, { status: "xung_dot", du_an: t.du_an, kind: t.kind });
      dem.xung_dot++;
    } else {
      const ly_do = kq.ly_do ?? THU_TU_LY_DO.find((l) => ds.some((x) => x.ly_do === l)) ?? "khong-co-bai";
      theoTin.set(t.offer_id, { status: "chua_gan", ly_do, du_an: t.du_an, kind: t.kind });
      cong(dem.ly_do, ly_do);
    }
  }
  return { ketQuaBai, theoTin, dem };
}
