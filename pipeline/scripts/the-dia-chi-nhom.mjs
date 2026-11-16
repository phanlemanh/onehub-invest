// the-dia-chi-nhom.mjs — TG1 the-dia-chi-nhom-s03: dựng NHÁP thẻ địa chỉ cho mọi nhóm S03 có bài (_acceptance/the-dia-chi-nhom-s03).
// Không gọi model: đọc sổ (collection_units), bài (stg_zalo_posts), nhãn đã có (silver_labels), danh bạ (asset_nodes), phường
// của tin. Ghi group_address_cards + group_address_card_history trong MỘT giao dịch; không đụng collection_units,
// field_assertions hay tin. Thẻ đã duyệt hay đã bác giữ nguyên; nháp chỉ dựng lại khi băm căn cứ đổi.
//   node scripts/the-dia-chi-nhom.mjs            # chạy thử: in số, không ghi
//   node scripts/the-dia-chi-nhom.mjs --ghi      # ghi (từ chối DB oneinvest của máy thu trừ khi kèm --may-thu, sau lời áp 108)
//   node scripts/the-dia-chi-nhom.mjs --json     # số dạng máy đọc
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { khoaNhomThat, donViTheoNhomThat } from "../lib/eval-labels.mjs";
import { dungNhap } from "../lib/the-dia-chi-nhom.mjs";

export const NGUON = "S03";
export const ACTOR_MAY = "may:the-dia-chi-nhom";

/** Đọc mọi thứ lệnh cần (chỉ đọc). */
export async function docDuLieu(client) {
  const q = async (sql, p = []) => (await client.query(sql, p)).rows;
  const so = await q(`SELECT unit_code, group_key, project_node_ids::bigint[] AS project_node_ids FROM collection_units
                       WHERE source_code = $1 ORDER BY unit_code`, [NGUON]);
  const bai = await q(`SELECT DISTINCT ON (post_id) post_id, conversation_id FROM stg_zalo_posts
                        WHERE conversation_id IS NOT NULL ORDER BY post_id, captured_at DESC NULLS LAST`);
  const nhan = await q(`SELECT DISTINCT ON (post_id) post_id, kind,
                               btrim(probabilities->'o'->'project'->>'v') AS project, probabilities->'o'->'project'->>'cc' AS project_cc,
                               btrim(probabilities->'o'->'subzone'->>'v') AS subzone, probabilities->'o'->'subzone'->>'cc' AS subzone_cc
                          FROM silver_labels WHERE source_code = $1
                         ORDER BY post_id, labeled_at DESC, label_id DESC`, [NGUON]);
  const tin = await q(`SELECT o.post_ids, o.area_id FROM sale_offer_records o JOIN areas a ON a.id = o.area_id AND a.region_type = 'submarket'
                        WHERE o.source = $1 AND cardinality(o.post_ids) > 0`, [NGUON]);
  const duAn = await q(`SELECT n.id::int AS id, n.name, n.aliases, n.area_ids FROM asset_nodes n
                         WHERE n.node_type = 'project' AND (to_jsonb(n) ->> 'catalog_tier') IS DISTINCT FROM 'mot_loi_khai'`);
  const phanKhu = await q(`SELECT id::int AS id, name, aliases, parent_id::int AS parent_id FROM asset_nodes
                            WHERE node_type IN ('subzone', 'building')`);
  const phuong = await q(`SELECT id, parent_id FROM areas WHERE region_type = 'submarket'`);
  return { so, bai, nhan, tin, duAn, phanKhu, phuong };
}

/** Gom theo nhóm thật và dựng nháp cho từng nhóm có bài. Hàm thuần trên dữ liệu đã đọc. */
export function dungTheoNhom(d, { boSo = false } = {}) {
  const nhomCuaBai = new Map(d.bai.map((b) => [b.post_id, khoaNhomThat(b.conversation_id)]));
  const { donVi } = donViTheoNhomThat(d.so);
  const soCua = new Map();
  for (const r of d.so) {
    const k = khoaNhomThat(r.group_key);
    if (!soCua.has(k)) soCua.set(k, []);
    soCua.get(k).push(...(r.project_node_ids ?? []).map(Number));
  }
  const nhom = new Map();
  const lay = (k) => {
    if (!nhom.has(k)) nhom.set(k, { so_bai: 0, nhan: [], tinPhuong: [] });
    return nhom.get(k);
  };
  for (const [, k] of nhomCuaBai) lay(k).so_bai++;
  for (const n of d.nhan) {
    const k = nhomCuaBai.get(n.post_id);
    if (k === undefined) continue;
    lay(k).nhan.push({ project: n.project || undefined, projectCc: n.project_cc, subzone: n.subzone || undefined, subzoneCc: n.subzone_cc, kind: n.kind });
  }
  for (const t of d.tin) {
    const k = nhomCuaBai.get(t.post_ids[0]);
    if (k !== undefined) lay(k).tinPhuong.push(t.area_id);
  }
  const tinhCua = Object.fromEntries(d.phuong.map((p) => [p.id, p.parent_id]));
  const laPhuong = d.phuong.map((p) => p.id);
  const ket = [];
  for (const [k, g] of [...nhom].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (!g.so_bai) continue;
    const nhap = dungNhap({ soDuAn: soCua.get(k) ?? [], nhan: g.nhan, tinPhuong: g.tinPhuong, duAn: d.duAn, phanKhu: d.phanKhu, tinhCua, laPhuong, boSo });
    nhap.evidence.so_bai = g.so_bai;
    const soDuAn = [...new Set(soCua.get(k) ?? [])];
    const lop = !donVi.has(k) ? "ngoai_so" : soDuAn.length === 1 ? "so_mot_du_an" : soDuAn.length > 1 ? "so_nhieu_du_an" : "so_chua_ghi";
    ket.push({ group_key: k, unit_code: donVi.get(k) ?? null, lop, so_du_an: soDuAn, ...nhap });
  }
  return ket;
}

const bam = (n) => createHash("sha1").update(JSON.stringify([n.unit_code, n.du_an, n.phuong, n.tinh, n.phan_khu, n.muc_dich, n.evidence])).digest("hex");
const banThe = (r) => ({ unit_code: r.unit_code, status: r.status, du_an: (r.project_node_ids ?? []).map(Number), phuong: r.area_id,
  tinh: r.province_area_id, phan_khu: r.subzone_node_id == null ? null : Number(r.subzone_node_id), muc_dich: r.purpose, evidence: r.evidence });

/** Ghi nháp trong giao dịch của người gọi. Trả số đếm. */
export async function ghiNhap(client, nhap) {
  const dem = { tao: 0, cap_nhat: 0, giu_da_quyet: 0, khong_doi: 0 };
  const { rows: cu } = await client.query(`SELECT * FROM group_address_cards`);
  const theoKhoa = new Map(cu.map((r) => [r.group_key, r]));
  for (const n of nhap) {
    const h = bam(n);
    const r = theoKhoa.get(n.group_key);
    if (r && r.status !== "nhap") { dem.giu_da_quyet++; continue; }
    if (r && r.evidence_hash === h) { dem.khong_doi++; continue; }
    const vals = [n.group_key, n.unit_code, n.du_an, n.phuong, n.tinh, n.phan_khu, n.muc_dich, n.evidence, h];
    const { rows: [moi] } = r
      ? await client.query(`UPDATE group_address_cards SET unit_code = $2, project_node_ids = $3, area_id = $4, province_area_id = $5,
                              subzone_node_id = $6, purpose = $7, evidence = $8, evidence_hash = $9, version = version + 1, drafted_at = now()
                            WHERE group_key = $1 AND status = 'nhap' RETURNING *`, vals)
      : await client.query(`INSERT INTO group_address_cards (group_key, unit_code, project_node_ids, area_id, province_area_id,
                              subzone_node_id, purpose, evidence, evidence_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, vals);
    await client.query(`INSERT INTO group_address_card_history (card_code, version, action, actor, before, after)
                        VALUES ($1, $2, 'dung_nhap', $3, $4, $5)`, [moi.card_code, moi.version, ACTOR_MAY, r ? banThe(r) : null, banThe(moi)]);
    if (r) dem.cap_nhat++; else dem.tao++;
  }
  return dem;
}

/** Đếm theo lớp nhóm. */
export function demLop(nhap) {
  const lop = {};
  for (const n of nhap) lop[n.lop] = (lop[n.lop] ?? 0) + 1;
  return lop;
}

async function main(argv) {
  const ghi = argv.includes("--ghi");
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  if (ghi && /\/oneinvest(\?|$)/.test(url) && !argv.includes("--may-thu")) {
    console.error("the-dia-chi-nhom: từ chối ghi DB oneinvest của máy thu — cần lời áp 108 (chữ ký Cổng Bằng chứng) và cờ --may-thu");
    process.exit(2);
  }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const { rows: [k] } = await c.query(`SELECT to_regclass('group_address_cards') IS NOT NULL AS co`);
    if (!k.co) throw Object.assign(new Error("the-dia-chi-nhom: chưa có group_address_cards — DB chưa áp 108"), { code: "THIEU_DB" });
    const t0 = performance.now();
    const nhap = dungTheoNhom(await docDuLieu(c));
    let dem = null;
    if (ghi) {
      await c.query("BEGIN");
      try { dem = await ghiNhap(c, nhap); await c.query("COMMIT"); } catch (e) { await c.query("ROLLBACK"); throw e; }
    }
    const ra = { nhom_co_bai: nhap.length, lop: demLop(nhap), ghi: dem, giay: +((performance.now() - t0) / 1000).toFixed(2) };
    console.log(argv.includes("--json") ? JSON.stringify(ra) : `the-dia-chi-nhom: ${nhap.length} nhóm có bài · lớp ${JSON.stringify(ra.lop)}${dem ? ` · ghi ${JSON.stringify(dem)}` : " · chạy thử, không ghi"} · ${ra.giay} giây`);
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).catch((e) => { console.error(String(e?.message ?? e)); process.exit(e?.code === "THIEU_DB" ? 2 : 1); });
