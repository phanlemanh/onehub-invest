#!/usr/bin/env node
// nap-lai-ba-luot.mjs — thước PL14 (nap-lai-khong-xoa AC-7): ba lượt nạp lại liên tiếp trên DB local, 0 quyết định người
// mất, 0 liên kết mất. Toàn bộ trong MỘT giao dịch ROLLBACK — DB thật không đổi.
//
// Mỗi lượt chạy chuỗi thật S03 (transform-zalo) → S05 (transform-fb) → S06 (transform-chotot) → airbnb (reassign-areas),
// và đổi đúng một biến trước khi chạy:
//   lượt 1 — giá một post S03 (nhóm theo nội dung đổi);
//   lượt 2 — cách đọc số phòng của một post S03 (giả lập đổi rule parser: nhóm theo nội dung đổi);
//   lượt 3 — một listing có đêm ra ngoài mọi phường.
// Trước lượt 1 gieo quyết định thử (đề xuất đã quyết, thẻ đã duyệt, ứng viên merged + thẻ pair, căn chỉ liên kết với tin)
// lên tin S03/S05 thật, và một tin khoá cũ cố định mỗi nguồn (lượt 1 luôn phải đổi khoá nó, kể cả khi DB đã đổi khoá).
// Điều kiện dương: gieo được, mỗi lượt đổi được đúng biến của nó, ma trận trước có quyết định — thiếu thì exit 2, không
// bao giờ báo «mất 0» trên một lượt không đo gì. Ma trận 7 hàng × 2 cột: lib/nap-lai-matrix.mjs.
//
// Lệnh mặc định chạy ba lượt đo: bản thật, rồi hai đối chứng (hàm đối soát thay thế, cùng fixture):
//   039          DELETE tin vắng lượt, khoá ngoại CASCADE
//   khong-chuyen chỉ cho nghỉ (đặt retired_at + superseded_by), không chuyển dòng con
// Exit 0 = bản thật mất 0 VÀ mỗi đối chứng thấy mất ≥ 1 hàng; exit 1 = bản thật mất, hoặc một đối chứng không thấy mất;
// exit 2 = lỗi / điều kiện dương không đạt. `--doi-chung=<tên>` chạy riêng một đối chứng (exit 1 khi thấy mất).
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { chupMaTran, gieoQuyetDinh, gieoTinKhoaCu, HANG, inMaTran, soMaTran } from "../lib/nap-lai-matrix.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import { MARKETS, runReassign } from "../reassign-areas.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG_044 = readFileSync(join(ROOT, "db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");

export const QUYET_DINH = ["de_xuat_da_quyet", "the_review_da_quyet", "ung_vien_merged_rejected", "the_pair"];
export const LIEN_KET = HANG.filter((h) => !QUYET_DINH.includes(h));

// Hai hàm đối soát đối chứng — cùng chữ ký với bản 044, chỉ sống trong giao dịch ROLLBACK của thước.
const FK = [
  ["nights", "nights_listing_id_fkey", "listing_id", "listing_records(id)"],
  ["listing_stats", "listing_stats_listing_id_fkey", "listing_id", "listing_records(id)"],
  ["property_offers", "property_offers_offer_id_fkey", "offer_id", "sale_offer_records(offer_id)"],
  ["property_candidates", "property_candidates_offer_a_fkey", "offer_a", "sale_offer_records(offer_id)"],
  ["property_candidates", "property_candidates_offer_b_fkey", "offer_b", "sale_offer_records(offer_id)"],
  ["enrichment_proposals", "enrichment_proposals_offer_id_fkey", "offer_id", "sale_offer_records(offer_id)"],
];
const DOI_CHUNG = {
  "039": FK.map(([t, con, col, ref]) =>
    `ALTER TABLE ${t} DROP CONSTRAINT ${con}; ALTER TABLE ${t} ADD CONSTRAINT ${con} FOREIGN KEY (${col}) REFERENCES ${ref} ON DELETE CASCADE;`,
  ).join("\n") + `
CREATE OR REPLACE FUNCTION reconcile_stale_offers(p_source text, p_live text[], p_actor text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  WITH d AS (DELETE FROM sale_offer_records WHERE source = p_source AND NOT (offer_id = ANY (p_live)) RETURNING 1) -- quet-xoa:bo-qua
  SELECT count(*) INTO n FROM d;
  RETURN jsonb_build_object('source', p_source, 'stale', n, 'doi_chung', '039');
END $$;`,
  "khong-chuyen": `
CREATE OR REPLACE FUNCTION reconcile_stale_offers(p_source text, p_live text[], p_actor text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE x record; y text; n integer := 0;
BEGIN
  FOR x IN SELECT * FROM sale_offer_records WHERE source = p_source AND retired_at IS NULL AND NOT (offer_id = ANY (p_live)) LOOP
    n := n + 1;
    SELECT l.offer_id INTO y FROM sale_offer_records l
     WHERE l.source = p_source AND l.offer_id = ANY (p_live) AND l.post_ids && x.post_ids ORDER BY l.offer_id LIMIT 1;
    UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot', superseded_by = y WHERE offer_id = x.offer_id;
  END LOOP;
  RETURN jsonb_build_object('source', p_source, 'stale', n, 'doi_chung', 'khong-chuyen');
END $$;`,
};

/** Đổi một post S03 sống trước lượt — trả post_id đã đổi (hoặc null khi không có post hợp). */
async function doiPost(client, kieu) {
  const { rows } = await client.query(
    `SELECT p.post_id, p.text FROM stg_zalo_posts p
       JOIN sale_offers o ON o.source = 'S03' AND p.post_id = ANY (o.post_ids)
      WHERE p.agent_id IS DISTINCT FROM 'apify-facebook' ORDER BY p.post_id`,
  );
  for (const r of rows) {
    let moi = null;
    if (kieu === "gia") {
      const m = r.text.match(/(\d+(?:[.,]\d+)*)\s*t(?:ỷ|y|\b)(?![a-zA-Zà-ỹÀ-Ỹ])/i);
      if (m) moi = r.text.replace(m[1], String(Number(m[1].split(/[.,]/)[0]) + 1));
    } else {
      const m = r.text.match(/(\d+)\s*(?:PN|phòng ngủ|BR)/i);
      moi = m ? r.text.replace(m[0], `${Number(m[1]) + 1}PN`) : `${r.text}\n3PN`;
    }
    if (moi && moi !== r.text) {
      await client.query(`UPDATE stg_zalo_posts SET text = $2 WHERE post_id = $1`, [r.post_id, moi]);
      return r.post_id;
    }
  }
  return null;
}

/** Cho một listing có đêm ra ngoài mọi phường trước lượt — trả id. */
async function doiListing(client) {
  const { rows } = await client.query(
    `SELECT l.id FROM listings l JOIN areas a ON a.id = l.area_id
      WHERE a.parent_id = ANY ($1) AND EXISTS (SELECT 1 FROM nights n WHERE n.listing_id = l.id) ORDER BY l.id LIMIT 1`,
    [Object.values(MARKETS).map((m) => m.id)],
  );
  if (!rows[0]) return null;
  await client.query(`UPDATE listing_records SET latitude = 0, longitude = 0 WHERE id = $1`, [rows[0].id]);
  return rows[0].id;
}

/** Một lượt nạp: chuỗi thật bốn nguồn; im log của transform. */
async function motLuot(client) {
  const log = console.log;
  console.log = () => {};
  try {
    const s03 = await runTransformZalo(client);
    const s05 = await runTransformFb(client);
    await runTransformChotot(client);
    const ab = await runReassign(client, Object.keys(MARKETS), { log: { log() {}, warn() {} } });
    return { S03: s03.reconcile?.stale ?? 0, S05: s05.reconcile?.stale ?? 0, airbnb_nghi: ab.dropped.length };
  } finally {
    console.log = log;
  }
}

/**
 * Chạy thước trên một client (người gọi giữ kết nối; thước tự BEGIN … ROLLBACK).
 * @returns {Promise<{ mat: ReturnType<typeof soMaTran>, matQuyetDinh: number, matLienKet: number, bang: string, luot: string[] }>}
 */
export async function chayBaLuot(client, { doiChung = null, out = console.log } = {}) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(33033)");
    await client.query(MIG_044);
    if (doiChung) await client.query(DOI_CHUNG[doiChung]);
    const can = (dk, loi) => { if (!dk) throw new Error(`nap-lai-ba-luot: điều kiện dương không đạt — ${loi}`); };
    const tinCu = [];
    for (const s of ["S03", "S05"]) {
      can((await gieoQuyetDinh(client, s)) === 2, `không gieo được quyết định lên tin ${s}`);
      const t = await gieoTinKhoaCu(client, s, "nap-lai-ba-luot");
      can(t, `không dựng được tin khoá cũ ${s}`);
      tinCu.push(t.id);
    }
    const truoc = await chupMaTran(client);
    can(truoc.de_xuat_da_quyet.co_mat.size >= 4 && truoc.property_offers.co_mat.size > 0, "ma trận trước không có quyết định/liên kết đã gieo");
    const luot = [];
    const daDoi = (x, loi) => { can(x, loi); return x; };
    const bien = [
      async () => `giá post ${daDoi(await doiPost(client, "gia"), "không tìm được post S03 để đổi giá")}`,
      async () => `cách đọc số phòng post ${daDoi(await doiPost(client, "phong"), "không tìm được post S03 để đổi số phòng")} (giả lập đổi rule parser)`,
      async () => `listing ${daDoi(await doiListing(client), "không tìm được listing có đêm")} ra ngoài phường`,
    ];
    for (const [i, doi] of bien.entries()) {
      const mo = await doi();
      const r = await motLuot(client);
      luot.push(`lượt ${i + 1} (${mo}): nghỉ S03 ${r.S03} · S05 ${r.S05} · listing ngoài phường ${r.airbnb_nghi}`);
      out(luot.at(-1));
      if (i === 0 && !doiChung) {
        // Lượt 1 phải đổi khoá tin khoá cũ cố định (bản thật: nghỉ 'doi_khoa', có tin kế).
        const { rows } = await client.query(`SELECT count(*)::int AS n FROM sale_offer_records
          WHERE offer_id = ANY ($1) AND retired_reason = 'doi_khoa' AND superseded_by IS NOT NULL`, [tinCu]);
        can(rows[0].n === tinCu.length, `lượt 1 không đổi khoá ${tinCu.length - rows[0].n} tin khoá cũ cố định`);
      }
    }
    const sau = await chupMaTran(client);
    const mat = soMaTran(truoc, sau);
    const tong = (ds) => mat.filter((m) => ds.includes(m.hang)).reduce((a, m) => a + m.mat, 0);
    return { mat, matQuyetDinh: tong(QUYET_DINH), matLienKet: tong(LIEN_KET), bang: inMaTran(truoc, sau), luot };
  } finally {
    await client.query("ROLLBACK").catch(() => {});
  }
}

function inKetQua(r) {
  console.log(r.bang);
  console.log(`nap-lai-ba-luot: 3 lượt · mất ${r.matQuyetDinh} quyết định · mất ${r.matLienKet} liên kết`);
  for (const m of r.mat) console.log(`mất: ${m.hang} (${m.cot}) ${m.truoc}→${m.sau}`);
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--doi-chung="));
  const mot = arg ? arg.split("=")[1] : null;
  if (mot && !DOI_CHUNG[mot]) {
    console.error(`--doi-chung không hợp lệ: ${mot} (039 | khong-chuyen)`);
    process.exit(2);
  }
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (mot) {
      console.log(`đối chứng: ${mot}`);
      const r = await chayBaLuot(client, { doiChung: mot });
      inKetQua(r);
      process.exitCode = r.mat.length ? 1 : 0;
      return;
    }
    const r = await chayBaLuot(client);
    inKetQua(r);
    let ok = r.mat.length === 0;
    for (const dc of Object.keys(DOI_CHUNG)) {
      console.log(`\nđối chứng: ${dc}`);
      const d = await chayBaLuot(client, { doiChung: dc });
      inKetQua(d);
      const thay = d.mat.length > 0;
      console.log(`đối chứng ${dc}: ${thay ? `thấy mất (${[...new Set(d.mat.map((m) => m.hang))].join(", ")})` : "KHÔNG thấy mất — thước không phân biệt"}`);
      ok &&= thay;
    }
    console.log(`nap-lai-ba-luot: ${ok ? "ĐẠT" : "KHÔNG ĐẠT"} — bản thật mất ${r.mat.length} ô; đối chứng phải thấy mất`);
    process.exitCode = ok ? 0 : 1;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
