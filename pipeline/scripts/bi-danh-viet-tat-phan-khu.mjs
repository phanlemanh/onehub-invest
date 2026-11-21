#!/usr/bin/env node
// bi-danh-viet-tat-phan-khu.mjs — DA51: tên viết tắt phân khu vào danh bạ qua một thẻ luật có băm (khuôn DA32/DA46).
//   node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --the <tệp>                      dựng thẻ (chỉ đọc), dòng cuối «băm: <hex>»
//   node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --ap --bam <hex> --nguoi <tên>   áp đúng thẻ đã xem (băm lệch → không ghi gì)
//   node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --dao <rule_id> --nguoi <tên>    đảo một lượt: gỡ đúng tên lượt đó thêm
//   node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --kiem <rule_id>                 kiểm sau áp (thoát 1 khi lệch, nêu id nút)
//   node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --do [--rule <rule_id>]          số tin S03 đọc được phân khu, trước/sau tên tắt
// Áp lên DB máy thu là lời riêng của Mạnh (chữ ký Cổng Bằng chứng kèm băm), sau DA46. Không migration: chỉ asset_nodes + project_link_rules.
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  BANG_VIET_TAT, CAN_CU_BI_DANH, KHOA_META, NGUON_BI_DANH, bamThe, chonDich, coToken, demDoc, docTenPhanKhu, vietThe,
} from "../lib/phan-khu-s16-bi-danh.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Nút `subzone` con trực tiếp của nút dự án mang slug trong bảng. */
async function docUngVien(client, bang) {
  const { rows } = await client.query(`
    SELECT n.id::int AS id, n.name, p.slug AS du_an_slug,
           COALESCE((n.meta ->> 'nghi')::boolean, false) AS nghi, (n.meta ->> 's16_rule_id') IS NOT NULL AS luat_duc
      FROM asset_nodes n JOIN asset_nodes p ON p.id = n.parent_id AND p.node_type = 'project'
     WHERE n.node_type = 'subzone' AND p.slug = ANY($1)`, [[...new Set(bang.map((b) => b.du_an))]]);
  return rows;
}

/** Tin S03 đang sống có một dự án, chữ = mọi bài của tin (bản mới nhất mỗi post_id). */
export async function docTinS03(client, duAnIds = null) {
  const { rows } = await client.query(`
    SELECT r.offer_id, op.project_node_id::text AS du_an,
           string_agg(p.text, E'\\n' ORDER BY p.post_id) AS text
      FROM sale_offer_records r
      JOIN offer_project op ON op.offer_id = r.offer_id AND op.status = 'mot_du_an'
      JOIN LATERAL (SELECT DISTINCT ON (z.post_id) z.post_id, z.text FROM stg_zalo_posts z
                     WHERE z.post_id = ANY(r.post_ids) ORDER BY z.post_id, z.captured_at DESC) p ON true
     WHERE r.source = 'S03' AND r.retired_at IS NULL AND cardinality(r.post_ids) > 0
       AND ($1::bigint[] IS NULL OR op.project_node_id = ANY($1))
     GROUP BY r.offer_id, op.project_node_id`, [duAnIds]);
  return rows;
}

/** Dựng thẻ, chỉ đọc. `dem` = đếm số tin chứa từng tên tắt (không vào băm). */
export async function dungThe(client, { bang = BANG_VIET_TAT, dem = true } = {}) {
  const dong = chonDich(bang, await docUngVien(client, bang));
  const bam = bamThe(dong);
  const soTin = new Map();
  if (dem) {
    const { rows: duAn } = await client.query("SELECT id::int AS id, slug FROM asset_nodes WHERE node_type = 'project' AND slug = ANY($1)",
      [[...new Set(bang.map((b) => b.du_an))]]);
    const idCua = new Map(duAn.map((r) => [r.slug, String(r.id)]));
    const tin = await docTinS03(client, duAn.map((r) => r.id));
    for (const d of dong) soTin.set(d.vt, tin.filter((t) => t.du_an === idCua.get(d.du_an) && coToken(t.text, d.vt)).length);
  }
  return { dong, bam, soTin, markdown: vietThe(dong, bam, soTin) };
}

/** Áp thẻ đúng băm. Băm lệch → ném «bam-lech», không ghi gì. Mọi tên đã có trên nút đích → không đổi, không ghi dòng luật. */
export async function apBiDanh(client, { bam, nguoi, bang = BANG_VIET_TAT }) {
  if (!/^[0-9a-f]{64}$/.test(String(bam ?? ""))) throw new Error("bam-sai-khuon: cần --bam <64 hex>");
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await client.query("BEGIN");
  let ok = false;
  try {
    await client.query("LOCK TABLE project_link_rules IN SHARE ROW EXCLUSIVE MODE");
    const the = await dungThe(client, { bang, dem: false });
    if (the.bam !== bam) throw new Error(`bam-lech: thẻ hiện tại ${the.bam}, băm khai ${bam} — dựng thẻ mới rồi xem lại`);
    const theoNut = new Map();
    for (const d of the.dong.filter((x) => x.node_id != null)) theoNut.set(d.node_id, [...(theoNut.get(d.node_id) ?? []), d.vt]);
    const lam = [];
    for (const [id, vts] of theoNut) {
      const { rows: [n] } = await client.query("SELECT aliases, meta FROM asset_nodes WHERE id = $1 FOR UPDATE", [id]);
      const them = vts.filter((v) => !(n.aliases ?? []).includes(v));
      if (them.length) lam.push({ id, n, them });
    }
    if (!lam.length) { ok = true; return { rule_id: null, khongDoi: true, so: 0 }; }
    const { rows: [luat] } = await client.query(
      "INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by) VALUES ($1, $2, $3, $4, $5) RETURNING id::int",
      [NGUON_BI_DANH, CAN_CU_BI_DANH, bam, lam.reduce((s, x) => s + x.them.length, 0), String(nguoi).trim()]);
    for (const { id, n, them } of lam) {
      const meta = { ...(n.meta ?? {}), [KHOA_META]: { ...(n.meta?.[KHOA_META] ?? {}), [luat.id]: them } };
      await client.query("UPDATE asset_nodes SET aliases = $2, meta = $3 WHERE id = $1", [id, [...(n.aliases ?? []), ...them], meta]);
    }
    ok = true;
    return { rule_id: luat.id, khongDoi: false, so: lam.reduce((s, x) => s + x.them.length, 0) };
  } finally {
    await client.query(ok ? "COMMIT" : "ROLLBACK");
  }
}

/** Đảo một lượt bí danh: gỡ đúng các tên lượt đó thêm, bỏ dấu meta; mã luật không phải lượt bí danh → từ chối. */
export async function daoBiDanh(client, { ruleId, nguoi }) {
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await client.query("BEGIN");
  let ok = false;
  try {
    const { rows: [luat] } = await client.query("SELECT id, source, can_cu, dao_at FROM project_link_rules WHERE id = $1 FOR UPDATE", [ruleId]);
    if (!luat) throw new Error(`luat-khong-co: ${ruleId}`);
    if (luat.source !== NGUON_BI_DANH || luat.can_cu !== CAN_CU_BI_DANH) throw new Error(`khong-phai-luot-bi-danh: luật ${ruleId} là «${luat.can_cu}»`);
    if (luat.dao_at) throw new Error(`da-dao: lượt ${ruleId} đã đảo`);
    const { rows } = await client.query(
      "SELECT id::int AS id, aliases, meta FROM asset_nodes WHERE meta -> $2 ? $1::text ORDER BY id FOR UPDATE", [String(ruleId), KHOA_META]);
    for (const n of rows) {
      const them = n.meta[KHOA_META][String(ruleId)];
      const { [String(ruleId)]: _bo, ...conLai } = n.meta[KHOA_META];
      const { [KHOA_META]: _k, ...meta } = n.meta;
      if (Object.keys(conLai).length) meta[KHOA_META] = conLai;
      await client.query("UPDATE asset_nodes SET aliases = $2, meta = $3 WHERE id = $1", [n.id, (n.aliases ?? []).filter((x) => !them.includes(x)), meta]);
    }
    await client.query("UPDATE project_link_rules SET dao_by = $2, dao_at = now() WHERE id = $1", [ruleId, String(nguoi).trim()]);
    ok = true;
    return { soNut: rows.length };
  } finally {
    await client.query(ok ? "COMMIT" : "ROLLBACK");
  }
}

/** Kiểm sau áp. Chỉ đọc. Lỗi: tên của lượt không còn trên nút («thieu-ten»), nút đích đã nghỉ («nut-nghi»), lượt không có nút nào. */
export async function kiemBiDanh(client, { ruleId }) {
  const { rows: [luat] } = await client.query("SELECT source, can_cu, dao_at FROM project_link_rules WHERE id = $1", [ruleId]);
  if (!luat || luat.can_cu !== CAN_CU_BI_DANH) throw new Error(`luot-bi-danh-khong-co: ${ruleId}`);
  const { rows } = await client.query(
    "SELECT id::int AS id, aliases, meta, COALESCE((meta ->> 'nghi')::boolean, false) AS nghi FROM asset_nodes WHERE meta -> $2 ? $1::text ORDER BY id",
    [String(ruleId), KHOA_META]);
  const loi = [];
  if (!rows.length) loi.push({ loai: "khong-nut", node_id: null });
  for (const n of rows) {
    if (n.nghi) loi.push({ loai: "nut-nghi", node_id: n.id });
    for (const v of n.meta[KHOA_META][String(ruleId)]) if (!(n.aliases ?? []).includes(v)) loi.push({ loai: "thieu-ten", node_id: n.id, vt: v });
  }
  return { ok: loi.length === 0, loi, da_dao: Boolean(luat.dao_at) };
}

/** Số tin S03 đọc được phân khu qua danh bạ, có và không có tên tắt (`ruleId` → chỉ tên của lượt đó). */
export async function doBiDanh(client, { ruleId = null, bang = BANG_VIET_TAT } = {}) {
  let b = bang;
  if (ruleId != null) {
    const { rows } = await client.query("SELECT meta -> $2 -> $1::text AS them FROM asset_nodes WHERE meta -> $2 ? $1::text", [String(ruleId), KHOA_META]);
    const vts = new Set(rows.flatMap((r) => r.them));
    b = bang.filter((x) => vts.has(x.vt));
  }
  return demDoc(await docTinS03(client), await docTenPhanKhu(client), b);
}

function thamSo(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--ap" || k === "--do") a[k.slice(2)] = true;
    else if (["--the", "--bam", "--nguoi", "--dao", "--kiem", "--rule"].includes(k)) a[k.slice(2)] = argv[++i];
    else a.la = k;
  }
  return a;
}

async function main(argv) {
  const a = thamSo(argv);
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (a.the) {
      const the = await dungThe(client);
      writeFileSync(a.the, the.markdown);
      console.log(`thẻ: ${the.dong.filter((d) => d.node_id != null).length} tên gán, ${the.dong.filter((d) => d.node_id == null).length} không gán, băm ${the.bam} → ${a.the}`);
    } else if (a.ap) {
      const kq = await apBiDanh(client, { bam: a.bam, nguoi: a.nguoi });
      console.log(kq.khongDoi ? "đã áp, không đổi" : `đã áp lượt ${kq.rule_id}: ${kq.so} tên`);
    } else if (a.dao) {
      const kq = await daoBiDanh(client, { ruleId: Number(a.dao), nguoi: a.nguoi });
      console.log(`đã đảo lượt ${a.dao}: ${kq.soNut} nút`);
    } else if (a.kiem) {
      const kq = await kiemBiDanh(client, { ruleId: Number(a.kiem) });
      for (const l of kq.loi) console.error(`lỗi ${l.loai}: nút ${l.node_id ?? "—"}${l.vt ? ` (${l.vt})` : ""}`);
      console.log(kq.ok ? `kiểm bí danh: đạt${kq.da_dao ? " (lượt đã đảo)" : ""}` : `kiểm bí danh: ${kq.loi.length} lỗi`);
      if (!kq.ok) process.exitCode = 1;
    } else if (a.do) {
      const kq = await doBiDanh(client, { ruleId: a.rule != null ? Number(a.rule) : null });
      console.log(`tin S03 một dự án: ${kq.tin} · đọc được phân khu không tên tắt ${kq.truoc} · có tên tắt ${kq.sau} · tăng ${kq.sau - kq.truoc} · mất phân khu cũ ${kq.mat}`);
      console.log(`theo tên tắt (tin chỉ đọc được nhờ tên): ${Object.entries(kq.theoTen).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
    } else {
      console.error("dùng: --the <tệp> | --ap --bam <hex> --nguoi <tên> | --dao <rule_id> --nguoi <tên> | --kiem <rule_id> | --do [--rule <rule_id>]");
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
