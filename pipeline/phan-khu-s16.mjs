// phan-khu-s16.mjs — DA37 danh-ba-s16-thang-cau-truc: nút phân khu S16 từ danh sách khu chủ đầu tư công bố, qua một thẻ luật
// theo nguồn mà người xem mẫu trước khi áp (ROADMAP §3 mục 54 Q-C; khuôn thẻ luật DA32 pipeline/noi-du-an-s06.mjs).
//   node phan-khu-s16.mjs --the <tệp>                         dựng thẻ luật (chỉ đọc), dòng cuối «băm: <hex>»
//   node phan-khu-s16.mjs --ap --bam <hex> --nguoi <tên>      áp đúng thẻ đã xem (băm lệch → không ghi gì)
//   node phan-khu-s16.mjs --dao <rule_id> --nguoi <tên>       đảo cả loạt: khu S16 rời nút, nút luật đúc mang meta.nghi
//   node phan-khu-s16.mjs --the-noi <tệp>                     DA46: thẻ nối nút luật đúc trùng về nút đã có (chỉ đọc)
//   node phan-khu-s16.mjs --noi --bam <hex> --nguoi <tên>     áp đúng thẻ nối đã xem
//   node phan-khu-s16.mjs --dao-noi <rule_id> --nguoi <tên>   đảo một lượt nối · --kiem-noi <rule_id>: kiểm sau áp (thoát 1 khi lệch)
// Áp lên DB máy thu là lời riêng của Mạnh («Áp thẻ luật S16 <băm>»). Toà vào phân khu qua view v_toa_nut_vung (111).
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { NOI_DU_AN_S16, duoiDuAn } from "./lib/s16-danh-muc.mjs";
import { chuanHoaTenToa } from "./lib/danh-ba-vat-the.mjs";
import { dungThe, dungTheNoi, keHoachNoi, keHoachPhanKhu, khoaKhu } from "./lib/s16-phan-khu.mjs";

export const NGUON = "S16";
export const CAN_CU = "S16-danh-sach-khu";
export const CAN_CU_NOI = "S16-noi-nut-san";
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Khu S16 của các dự án đã nối, kèm số toà mang bí danh S16 có đúng khu ấy (cùng luật view 111). */
// `noi` khoá theo ĐUÔI mã dự án (duoiDuAn, như NOI_DU_AN_S16 của bước dựng); stg mang mã đầy đủ — lọc ở JS, không ở SQL.
async function docKhu(client, noi) {
  if (!Object.keys(noi).length) return [];
  const { rows } = await client.query(`
    WITH toa AS (
      SELECT a.object_key, min(t.du_an || '/' || t.khu_id) AS khu
        FROM registry_aliases a
        JOIN stg_s16_toa t ON t.du_an = split_part(a.value, '/', 1) AND t.toa_id = split_part(a.value, '/', 2)
        JOIN stg_s16_khu k ON k.snapshot_id = t.snapshot_id AND k.du_an = t.du_an AND k.khu_id = t.khu_id
       WHERE a.kind = 'ma_nguon' AND a.source = 'S16' AND a.retired_at IS NULL AND a.object_key LIKE 'bld\\_%'
       GROUP BY a.object_key HAVING count(DISTINCT t.du_an || '/' || t.khu_id) = 1)
    SELECT k.du_an, k.khu_id, (array_agg(k.khu_ten ORDER BY k.snapshot_id DESC) FILTER (WHERE k.khu_ten IS NOT NULL))[1] AS khu_ten,
           (SELECT count(*)::int FROM toa WHERE toa.khu = k.du_an || '/' || k.khu_id) AS so_toa
      FROM stg_s16_khu k GROUP BY k.du_an, k.khu_id`);
  return rows.filter((r) => noi[duoiDuAn(r.du_an)]);
}

async function docNutDuAn(client, noi) {
  const { rows } = await client.query("SELECT id::int AS id, slug, name FROM asset_nodes WHERE slug = ANY($1)", [Object.values(noi)]);
  return new Map(rows.map((r) => [r.slug, r]));
}

/** Mọi nút chưa nghỉ trên cây của các dự án (không gồm nút dự án), kèm dự án gốc. */
async function docCayDuAn(client, duAnIds) {
  const { rows } = await client.query(`
    WITH RECURSIVE cay AS (
      SELECT n.id, n.parent_id AS du_an FROM asset_nodes n WHERE n.parent_id = ANY($1)
      UNION ALL SELECT n.id, c.du_an FROM asset_nodes n JOIN cay c ON n.parent_id = c.id)
    SELECT n.id::int AS id, n.parent_id::int AS parent_id, c.du_an::int AS du_an_node_id, n.node_type, n.name, n.meta,
           COALESCE(ARRAY(SELECT jsonb_array_elements_text(n.meta -> 's16_khu_ids')), '{}') AS s16_khu_ids
      FROM cay c JOIN asset_nodes n ON n.id = c.id
     WHERE COALESCE((n.meta ->> 'nghi')::boolean, false) = false`, [duAnIds]);
  return rows;
}

/**
 * Bằng chứng S09 theo khoá khu: số toà của khu, số toà có S09 trỏ về một nút chưa nghỉ, và các nút đó (cụm thắng phân khu).
 * Cùng luật khớp với view v_toa_nut_vung; nút do luật S16 đúc không làm bằng chứng.
 * @returns {Promise<Map<string, {tong_toa:number, co_s09:number, nut:number[]}>>}
 */
export async function docBangChung(client) {
  const { rows } = await client.query(`
    WITH toa AS (
      SELECT a.object_key, min(t.du_an) AS du_an, min(t.khu_id) AS khu_id
        FROM registry_aliases a
        JOIN stg_s16_toa t ON t.du_an = split_part(a.value, '/', 1) AND t.toa_id = split_part(a.value, '/', 2)
        JOIN stg_s16_khu k ON k.snapshot_id = t.snapshot_id AND k.du_an = t.du_an AND k.khu_id = t.khu_id
       WHERE a.kind = 'ma_nguon' AND a.source = 'S16' AND a.retired_at IS NULL AND a.object_key LIKE 'bld\\_%'
       GROUP BY a.object_key HAVING count(DISTINCT t.du_an || '/' || t.khu_id) = 1
    ), s09 AS (
      SELECT DISTINCT ON (a.object_key) a.object_key, x.sector_id,
             upper((regexp_match(btrim(COALESCE(NULLIF(x.block_code, ''), x.block_name)), '^([A-Za-z]+[0-9]+)\\.[0-9]+$'))[1]) AS tien_to
        FROM registry_aliases a JOIN v_s09_toa x ON a.value = x.project_id || '/' || x.block_id
       WHERE a.kind = 'ma_nguon' AND a.source = 'S09' AND a.retired_at IS NULL
       ORDER BY a.object_key, (x.sector_id IS NULL), x.sector_id
    ), nut AS (
      SELECT n.id, n.meta FROM asset_nodes n
       WHERE COALESCE((n.meta ->> 'nghi')::boolean, false) = false AND n.meta ->> 's16_rule_id' IS NULL
    ), chung AS (
      SELECT s.object_key, COALESCE(
        (SELECT min(c.id) FROM nut c WHERE s.tien_to IS NOT NULL AND c.meta ->> 's09_cum' = s.tien_to AND c.meta ->> 's09_sector_id' = s.sector_id),
        (SELECT min(p.id) FROM nut p WHERE p.meta -> 's09_sector_ids' ? s.sector_id)) AS node_id
        FROM s09 s WHERE s.sector_id IS NOT NULL
    )
    SELECT t.du_an, t.khu_id, count(*)::int AS tong_toa, count(c.node_id)::int AS co_s09,
           COALESCE(array_agg(DISTINCT c.node_id::int) FILTER (WHERE c.node_id IS NOT NULL), '{}') AS nut
      FROM toa t LEFT JOIN chung c USING (object_key) GROUP BY 1, 2`);
  return new Map(rows.map((r) => [khoaKhu(r.du_an, r.khu_id), { tong_toa: r.tong_toa, co_s09: r.co_s09, nut: r.nut }]));
}

/** Kế hoạch + thẻ. `noi` mặc định NOI_DU_AN_S16 (dự án S16 → slug nút dự án). */
export async function dungTheLuat(client, { noi = NOI_DU_AN_S16 } = {}) {
  const duAn = await docNutDuAn(client, noi);
  const khu = (await docKhu(client, noi))
    .filter((k) => duAn.has(noi[duoiDuAn(k.du_an)]))
    .map((k) => ({ ...k, du_an_node_id: duAn.get(noi[duoiDuAn(k.du_an)]).id }));
  const nut = await docCayDuAn(client, [...duAn.values()].map((d) => d.id));
  const { dong, bam } = keHoachPhanKhu(khu, nut, await docBangChung(client));
  const tenNut = new Map(nut.map((n) => [n.id, n.name]));
  const tenDuAn = new Map([...duAn.values()].map((d) => [d.id, d.name]));
  return { dong, bam, markdown: dungThe(dong, bam, tenNut, tenDuAn) };
}

const slugNut = async (client, duAnSlug, ten) => {
  const goc = `${duAnSlug}-pk-${chuanHoaTenToa(ten).toLowerCase().replace(/[^a-z0-9]+/g, "") || "khu"}`;
  const { rows } = await client.query(`SELECT slug FROM asset_nodes WHERE slug = $1 OR slug ~ ('^' || $1 || '-[0-9]+$')`, [goc]);
  const co = new Set(rows.map((r) => r.slug));
  if (!co.has(goc)) return goc;
  for (let i = 2; ; i++) if (!co.has(`${goc}-${i}`)) return `${goc}-${i}`;
};

/** Áp thẻ luật đúng băm. Băm lệch → ném «bam-lech», không ghi gì. Mọi khu đã gán → không đổi, không ghi dòng luật. */
export async function apTheLuat(client, { bam, nguoi, noi = NOI_DU_AN_S16 }) {
  if (!/^[0-9a-f]{64}$/.test(String(bam ?? ""))) throw new Error("bam-sai-khuon: cần --bam <64 hex>");
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await client.query("BEGIN");
  let ok = false;
  try {
    await client.query("LOCK TABLE project_link_rules IN SHARE ROW EXCLUSIVE MODE");
    const the = await dungTheLuat(client, { noi });
    if (the.bam !== bam) throw new Error(`bam-lech: thẻ hiện tại ${the.bam}, băm khai ${bam} — dựng thẻ mới rồi xem lại`);
    const lam = the.dong.filter((d) => d.nut === "san" || d.nut === "moi");
    if (!lam.length) { ok = true; return { rule_id: null, khongDoi: true }; }
    const { rows: [luat] } = await client.query(
      `INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by) VALUES ($1, $2, $3, $4, $5) RETURNING id::int`,
      [NGUON, CAN_CU, bam, lam.length, String(nguoi).trim()]);
    const slugDuAn = new Map(Object.values(noi).map((s) => [s, s]));
    const { rows: duAn } = await client.query("SELECT id::int AS id, slug FROM asset_nodes WHERE slug = ANY($1)", [[...slugDuAn.keys()]]);
    const slugCua = new Map(duAn.map((r) => [r.id, r.slug]));
    for (const d of lam) {
      const khoa = khoaKhu(d.du_an, d.khu_id);
      if (d.nut === "san") {
        await client.query(`UPDATE asset_nodes SET meta = jsonb_set(jsonb_set(meta, '{s16_khu_ids}',
              COALESCE(meta -> 's16_khu_ids', '[]'::jsonb) || to_jsonb($2::text)), '{s16_khu_rule}',
              COALESCE(meta -> 's16_khu_rule', '{}'::jsonb) || jsonb_build_object($2::text, $3::int)) WHERE id = $1`,
        [d.node_id, khoa, luat.id]);
      } else {
        await client.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, catalog_tier, meta)
              VALUES ('subzone', $1, $2, $3, ARRAY[lower($1)], '{}', 'xac_minh', $4)`,
        [d.khu_ten, await slugNut(client, slugCua.get(d.du_an_node_id), d.khu_ten), d.du_an_node_id,
          { nguon: NGUON, s16_rule_id: luat.id, s16_khu_ids: [khoa], s16_khu_rule: { [khoa]: luat.id } }]);
      }
    }
    ok = true;
    return { rule_id: luat.id, khongDoi: false, so: lam.length };
  } finally {
    await client.query(ok ? "COMMIT" : "ROLLBACK");
  }
}

/**
 * Mã căn và tên toà S16 theo khoá khu, lấy bản snapshot mới nhất của từng khu (DA53). Chỉ trong bộ nhớ: không in, không ghi —
 * mã căn S16 lấy bằng đăng nhập. Tên toà để xét tiền tố mã căn.
 * @returns {Promise<Map<string, {ma:Set<string>, toa:Set<string>}>>}
 */
export async function docMaCan(client) {
  const { rows } = await client.query(`
    WITH moi AS (SELECT du_an, khu_id, max(snapshot_id) AS s FROM stg_s16_khu GROUP BY 1, 2)
    SELECT t.du_an, t.khu_id, t.toa_ten, c.ma_can
      FROM moi JOIN stg_s16_toa t ON t.snapshot_id = moi.s AND t.du_an = moi.du_an AND t.khu_id = moi.khu_id
      JOIN stg_s16_can c ON c.snapshot_id = t.snapshot_id AND c.du_an = t.du_an AND c.toa_id = t.toa_id`);
  const ra = new Map();
  for (const r of rows) {
    const k = khoaKhu(r.du_an, r.khu_id);
    const x = ra.get(k) ?? { ma: new Set(), toa: new Set() };
    x.ma.add(r.ma_can);
    if (r.toa_ten) x.toa.add(r.toa_ten);
    ra.set(k, x);
  }
  return ra;
}

/** Kế hoạch + thẻ nối nút do luật S16 đúc về nút đã có. Chỉ đọc. Căn cứ: toà S09 (DA46), rồi mã căn S16 (DA53). */
// `chiS09`: bỏ căn cứ mã căn — chỉ để phép đo DA46 (phan-khu-s16-noi-that.mjs) đo đúng luật nó đã ký.
export async function dungKeHoachNoi(client, { noi = NOI_DU_AN_S16, chiS09 = false } = {}) {
  const duAn = await docNutDuAn(client, noi);
  const cay = await docCayDuAn(client, [...duAn.values()].map((d) => d.id));
  const laLuat = (n) => n.meta?.nguon === NGUON && n.meta?.s16_rule_id != null;
  const nutLuat = cay.filter(laLuat).map((n) => ({ id: n.id, du_an_node_id: n.du_an_node_id, name: n.name, khoa: n.s16_khu_ids }));
  const nutKhac = cay.filter((n) => !laLuat(n)).map((n) => ({ id: n.id, du_an_node_id: n.du_an_node_id, name: n.name, node_type: n.node_type, khoa: n.s16_khu_ids }));
  const keHoach = keHoachNoi(nutLuat, await docBangChung(client), nutKhac, chiS09 ? new Map() : await docMaCan(client));
  return { ...keHoach, markdown: dungTheNoi(keHoach, new Map(cay.map((n) => [n.id, n.name]))) };
}

/** Áp thẻ nối đúng băm. Băm đã áp rồi → không đổi. Băm lệch → ném «bam-lech», không ghi gì. */
export async function apNoi(client, { bam, nguoi, noi = NOI_DU_AN_S16, chiS09 = false }) {
  if (!/^[0-9a-f]{64}$/.test(String(bam ?? ""))) throw new Error("bam-sai-khuon: cần --bam <64 hex>");
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await client.query("BEGIN");
  let ok = false;
  try {
    await client.query("LOCK TABLE project_link_rules IN SHARE ROW EXCLUSIVE MODE");
    const { rows: daAp } = await client.query(
      "SELECT id::int AS id FROM project_link_rules WHERE source = $1 AND can_cu = $2 AND mau_bam = $3 AND dao_at IS NULL", [NGUON, CAN_CU_NOI, bam]);
    if (daAp.length) { ok = true; return { rule_id: daAp[0].id, khongDoi: true, so: 0 }; }
    const kh = await dungKeHoachNoi(client, { noi, chiS09 });
    if (kh.bam !== bam) throw new Error(`bam-lech: thẻ hiện tại ${kh.bam}, băm khai ${bam} — dựng thẻ mới rồi xem lại`);
    if (!kh.cap.length) { ok = true; return { rule_id: null, khongDoi: true, so: 0 }; }
    const { rows: [luat] } = await client.query(
      "INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by) VALUES ($1, $2, $3, $4, $5) RETURNING id::int",
      [NGUON, CAN_CU_NOI, bam, kh.cap.length, String(nguoi).trim()]);
    for (const c of kh.cap) {
      const { rows: [moi] } = await client.query("SELECT parent_id::int AS parent_id, aliases, meta FROM asset_nodes WHERE id = $1 FOR UPDATE", [c.moi_id]);
      const { rows: [cu] } = await client.query("SELECT aliases, meta FROM asset_nodes WHERE id = $1 FOR UPDATE", [c.cu_id]);
      const them = (moi.aliases ?? []).filter((x) => !(cu.aliases ?? []).includes(x));
      const dau = cu.meta?.noi_goc?.[luat.id] ?? { co_ids: cu.meta?.s16_khu_ids != null, co_rule: cu.meta?.s16_khu_rule != null, bi_danh: [] };
      const metaCu = { ...cu.meta,
        s16_khu_ids: [...(cu.meta?.s16_khu_ids ?? []), ...c.khoa],
        s16_khu_rule: { ...(cu.meta?.s16_khu_rule ?? {}), ...Object.fromEntries(c.khoa.map((k) => [k, luat.id])) },
        noi_goc: { ...(cu.meta?.noi_goc ?? {}), [luat.id]: { ...dau, bi_danh: [...dau.bi_danh, ...them] } } };
      await client.query("UPDATE asset_nodes SET aliases = $2, meta = $3 WHERE id = $1", [c.cu_id, [...(cu.aliases ?? []), ...them], metaCu]);
      const metaMoi = { ...moi.meta, nghi: true, s16_khu_ids: [], s16_khu_rule: {},
        noi: { rule_id: luat.id, ve_nut: c.cu_id, cha_cu: moi.parent_id, khu_ids: moi.meta?.s16_khu_ids ?? [], khu_rule: moi.meta?.s16_khu_rule ?? {} } };
      await client.query("UPDATE asset_nodes SET parent_id = $2, meta = $3 WHERE id = $1", [c.moi_id, c.cu_id, metaMoi]);
    }
    ok = true;
    return { rule_id: luat.id, khongDoi: false, so: kh.cap.length };
  } finally {
    await client.query(ok ? "COMMIT" : "ROLLBACK");
  }
}

/** Đảo một lượt nối: nút cha, meta, bí danh của mọi nút trong cặp về đúng trước khi áp; dòng luật ghi người đảo. */
export async function daoNoi(client, { ruleId, nguoi }) {
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await client.query("BEGIN");
  let ok = false;
  try {
    const { rows: [luat] } = await client.query(
      "SELECT id, dao_at FROM project_link_rules WHERE id = $1 AND source = $2 AND can_cu = $3 FOR UPDATE", [ruleId, NGUON, CAN_CU_NOI]);
    if (!luat) throw new Error(`luat-khong-co: ${ruleId}`);
    if (luat.dao_at) throw new Error(`da-dao: lượt nối ${ruleId} đã đảo`);
    const { rows: moi } = await client.query(
      "SELECT id::int AS id, meta FROM asset_nodes WHERE (meta -> 'noi' ->> 'rule_id')::bigint = $1 ORDER BY id FOR UPDATE", [ruleId]);
    for (const n of moi) {
      const { rows: [cu] } = await client.query("SELECT aliases, meta FROM asset_nodes WHERE id = $1 FOR UPDATE", [n.meta.noi.ve_nut]);
      const goc = cu.meta.noi_goc[ruleId];
      const ids = cu.meta.s16_khu_ids.filter((k) => !n.meta.noi.khu_ids.includes(k));
      const quyTac = Object.fromEntries(Object.entries(cu.meta.s16_khu_rule).filter(([k]) => !n.meta.noi.khu_ids.includes(k)));
      const { noi_goc: noiGoc, s16_khu_ids: _i, s16_khu_rule: _r, ...con } = cu.meta;
      const { [ruleId]: _g, ...noiGocCon } = noiGoc;
      const metaCu = { ...con,
        ...(goc.co_ids || ids.length ? { s16_khu_ids: ids } : {}),
        ...(goc.co_rule || Object.keys(quyTac).length ? { s16_khu_rule: quyTac } : {}),
        ...(Object.keys(noiGocCon).length ? { noi_goc: noiGocCon } : {}) };
      // Hai nút mới có thể về cùng một nút cũ: giữ dấu gốc tới khi nút mới cuối cùng được trả.
      const conNut = moi.some((x) => x.id > n.id && x.meta.noi.ve_nut === n.meta.noi.ve_nut);
      if (conNut) metaCu.noi_goc = noiGoc;
      const biDanh = conNut ? cu.aliases : (cu.aliases ?? []).filter((x) => !goc.bi_danh.includes(x));
      await client.query("UPDATE asset_nodes SET aliases = $2, meta = $3 WHERE id = $1", [n.meta.noi.ve_nut, biDanh, metaCu]);
      const { noi, nghi: _n, ...metaMoi } = n.meta;
      await client.query("UPDATE asset_nodes SET parent_id = $2, meta = $3 WHERE id = $1",
        [n.id, noi.cha_cu, { ...metaMoi, s16_khu_ids: noi.khu_ids, s16_khu_rule: noi.khu_rule }]);
    }
    await client.query("UPDATE project_link_rules SET dao_by = $2, dao_at = now() WHERE id = $1", [ruleId, String(nguoi).trim()]);
    ok = true;
    return { soNut: moi.length };
  } finally {
    await client.query(ok ? "COMMIT" : "ROLLBACK");
  }
}

/** Kiểm sau áp một lượt nối. Chỉ đọc. `ok` sai khi nút giữ lại rỗng, còn toà ở nút nghỉ, toà S16 treo dưới dự án, hay nút khác mang khoá đã nối. */
export async function kiemNoi(client, { ruleId }) {
  const { rows: moi } = await client.query(
    "SELECT id::int AS id, meta FROM asset_nodes WHERE (meta -> 'noi' ->> 'rule_id')::bigint = $1 ORDER BY id", [ruleId]);
  if (!moi.length) throw new Error(`luot-noi-khong-co: ${ruleId}`);
  const loi = [];
  const dem = async (id) => (await client.query("SELECT count(*)::int AS n FROM v_toa_nut_vung WHERE region_node_id = $1", [id])).rows[0].n;
  for (const n of moi) {
    if ((await dem(n.meta.noi.ve_nut)) === 0) loi.push({ loai: "giu-rong", node_id: n.meta.noi.ve_nut });
    if ((await dem(n.id)) > 0) loi.push({ loai: "toa-o-nut-nghi", node_id: n.id });
    const { rows: khac } = await client.query(`
      SELECT id::int AS id FROM asset_nodes WHERE id <> $1 AND COALESCE((meta ->> 'nghi')::boolean, false) = false AND meta -> 's16_khu_ids' ?| $2::text[]`,
    [n.meta.noi.ve_nut, n.meta.noi.khu_ids]);
    for (const k of khac) loi.push({ loai: "nut-khac-mang-khoa", node_id: k.id });
  }
  const { rows: treo } = await client.query(`
    SELECT DISTINCT v.region_node_id::int AS id FROM v_toa_nut_vung v JOIN asset_nodes n ON n.id = v.region_node_id
     WHERE n.node_type = 'project' AND n.id = ANY($1) AND v.building_key IN (
       SELECT object_key FROM registry_aliases WHERE source = 'S16' AND kind = 'ma_nguon' AND retired_at IS NULL AND object_key LIKE 'bld\\_%')`,
  [[...new Set(moi.map((n) => n.meta.noi.cha_cu))]]);
  for (const t of treo) loi.push({ loai: "toa-treo", node_id: t.id });
  return { ok: loi.length === 0, loi };
}

/** Đảo một luật: khu của luật rời mọi nút; nút do luật đúc mang meta.nghi = true; luật ghi người đảo. */
export async function daoTheLuat(client, { ruleId, nguoi }) {
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await client.query("BEGIN");
  let ok = false;
  try {
    const { rows: [luat] } = await client.query("SELECT id, dao_at FROM project_link_rules WHERE id = $1 AND source = $2 FOR UPDATE", [ruleId, NGUON]);
    if (!luat) throw new Error(`luat-khong-co: ${ruleId}`);
    if (luat.dao_at) throw new Error(`da-dao: luật ${ruleId} đã đảo`);
    const { rowCount: soNut } = await client.query(`
      UPDATE asset_nodes n SET meta = jsonb_set(jsonb_set(n.meta, '{s16_khu_ids}', COALESCE((
               SELECT jsonb_agg(x) FROM jsonb_array_elements_text(n.meta -> 's16_khu_ids') x
                WHERE COALESCE((n.meta -> 's16_khu_rule' ->> x)::int, -1) <> $1), '[]'::jsonb)),
             '{s16_khu_rule}', COALESCE((SELECT jsonb_object_agg(k, v) FROM jsonb_each(n.meta -> 's16_khu_rule') e(k, v)
                WHERE v::text::int <> $1), '{}'::jsonb))
             || CASE WHEN (n.meta ->> 's16_rule_id')::int = $1 THEN '{"nghi": true}'::jsonb ELSE '{}'::jsonb END
       WHERE n.meta -> 's16_khu_rule' IS NOT NULL
         AND EXISTS (SELECT 1 FROM jsonb_each(n.meta -> 's16_khu_rule') e(k, v) WHERE v::text::int = $1)`, [ruleId]);
    await client.query("UPDATE project_link_rules SET dao_by = $2, dao_at = now() WHERE id = $1", [ruleId, String(nguoi).trim()]);
    ok = true;
    return { soNut };
  } finally {
    await client.query(ok ? "COMMIT" : "ROLLBACK");
  }
}

function thamSo(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--ap") a.ap = true;
    else if (k === "--noi") a.noi = true;
    else if (["--the", "--bam", "--nguoi", "--dao", "--the-noi", "--dao-noi", "--kiem-noi"].includes(k)) a[k.slice(2)] = argv[++i];
    else a._.push(k);
  }
  return a;
}

async function main(argv) {
  const a = thamSo(argv);
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (a.the) {
      const the = await dungTheLuat(client);
      writeFileSync(a.the, the.markdown);
      console.log(`thẻ: ${the.dong.length} khu, băm ${the.bam} → ${a.the}`);
    } else if (a.ap) {
      const kq = await apTheLuat(client, { bam: a.bam, nguoi: a.nguoi });
      console.log(kq.khongDoi ? "đã áp, không đổi" : `đã áp luật ${kq.rule_id}: ${kq.so} khu`);
    } else if (a.dao) {
      const kq = await daoTheLuat(client, { ruleId: Number(a.dao), nguoi: a.nguoi });
      console.log(`đã đảo luật ${a.dao}: ${kq.soNut} nút`);
    } else if (a["the-noi"]) {
      const kh = await dungKeHoachNoi(client);
      writeFileSync(a["the-noi"], kh.markdown);
      console.log(`thẻ nối: ${kh.cap.length} cặp, ${kh.can_nguoi.length} ca cần người chọn, ${kh.khong_noi.length} ca không nối, băm ${kh.bam} → ${a["the-noi"]}`);
    } else if (a.noi) {
      const kq = await apNoi(client, { bam: a.bam, nguoi: a.nguoi });
      console.log(kq.khongDoi ? "đã nối, không đổi" : `đã nối lượt ${kq.rule_id}: ${kq.so} cặp`);
    } else if (a["dao-noi"]) {
      const kq = await daoNoi(client, { ruleId: Number(a["dao-noi"]), nguoi: a.nguoi });
      console.log(`đã đảo lượt nối ${a["dao-noi"]}: ${kq.soNut} nút`);
    } else if (a["kiem-noi"]) {
      const kq = await kiemNoi(client, { ruleId: Number(a["kiem-noi"]) });
      for (const l of kq.loi) console.error(`lỗi ${l.loai}: nút ${l.node_id}`);
      console.log(kq.ok ? "kiểm nối: đạt" : `kiểm nối: ${kq.loi.length} lỗi`);
      if (!kq.ok) process.exitCode = 1;
    } else {
      console.error("dùng: --the <tệp> | --ap --bam <hex> --nguoi <tên> | --dao <rule_id> --nguoi <tên> | --the-noi <tệp> | --noi --bam <hex> --nguoi <tên> | --dao-noi <rule_id> --nguoi <tên> | --kiem-noi <rule_id>");
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
