// phan-khu-s16.mjs — DA37 danh-ba-s16-thang-cau-truc: nút phân khu S16 từ danh sách khu chủ đầu tư công bố, qua một thẻ luật
// theo nguồn mà người xem mẫu trước khi áp (ROADMAP §3 mục 54 Q-C; khuôn thẻ luật DA32 pipeline/noi-du-an-s06.mjs).
//   node phan-khu-s16.mjs --the <tệp>                         dựng thẻ luật (chỉ đọc), dòng cuối «băm: <hex>»
//   node phan-khu-s16.mjs --ap --bam <hex> --nguoi <tên>      áp đúng thẻ đã xem (băm lệch → không ghi gì)
//   node phan-khu-s16.mjs --dao <rule_id> --nguoi <tên>       đảo cả loạt: khu S16 rời nút, nút luật đúc mang meta.nghi
// Áp lên DB máy thu là lời riêng của Mạnh («Áp thẻ luật S16 <băm>»). Toà vào phân khu qua view v_toa_nut_vung (111).
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { NOI_DU_AN_S16 } from "./lib/s16-danh-muc.mjs";
import { chuanHoaTenToa } from "./lib/danh-ba-vat-the.mjs";
import { dungThe, keHoachPhanKhu, khoaKhu } from "./lib/s16-phan-khu.mjs";

export const NGUON = "S16";
export const CAN_CU = "S16-danh-sach-khu";
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Khu S16 của các dự án đã nối, kèm số toà mang bí danh S16 có đúng khu ấy (cùng luật view 111). */
async function docKhu(client, noi) {
  const duAn = Object.keys(noi);
  if (!duAn.length) return [];
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
      FROM stg_s16_khu k WHERE k.du_an = ANY($1) GROUP BY k.du_an, k.khu_id`, [duAn]);
  return rows;
}

async function docNutDuAn(client, noi) {
  const { rows } = await client.query("SELECT id::int AS id, slug, name FROM asset_nodes WHERE slug = ANY($1)", [Object.values(noi)]);
  return new Map(rows.map((r) => [r.slug, r]));
}

/** Kế hoạch + thẻ. `noi` mặc định NOI_DU_AN_S16 (dự án S16 → slug nút dự án). */
export async function dungTheLuat(client, { noi = NOI_DU_AN_S16 } = {}) {
  const duAn = await docNutDuAn(client, noi);
  const khu = (await docKhu(client, noi))
    .filter((k) => duAn.has(noi[k.du_an]))
    .map((k) => ({ ...k, du_an_node_id: duAn.get(noi[k.du_an]).id }));
  const { rows: nut } = await client.query(`
    SELECT id::int AS id, parent_id::int AS parent_id, name,
           COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta -> 's16_khu_ids')), '{}') AS s16_khu_ids
      FROM asset_nodes WHERE node_type = 'subzone' AND parent_id = ANY($1) AND COALESCE((meta ->> 'nghi')::boolean, false) = false`,
  [[...duAn.values()].map((d) => d.id)]);
  const { dong, bam } = keHoachPhanKhu(khu, nut);
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
    else if (["--the", "--bam", "--nguoi", "--dao"].includes(k)) a[k.slice(2)] = argv[++i];
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
    } else {
      console.error("dùng: --the <tệp> | --ap --bam <hex> --nguoi <tên> | --dao <rule_id> --nguoi <tên>");
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
