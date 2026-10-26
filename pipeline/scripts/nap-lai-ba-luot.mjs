#!/usr/bin/env node
// nap-lai-ba-luot.mjs — thước PL14 (nap-lai-khong-xoa AC-7): ba lượt nạp lại liên tiếp trên DB local, 0 quyết định người
// mất, 0 liên kết mất. Toàn bộ trong MỘT giao dịch ROLLBACK — DB thật không đổi.
//
// Mỗi lượt chạy chuỗi thật S03 (transform-zalo) → S05 (transform-fb) → S06 (transform-chotot) → airbnb (reassign-areas),
// và đổi đúng một biến trước khi chạy:
//   lượt 1 — giá một post S03 (nhóm theo nội dung đổi);
//   lượt 2 — cách đọc số phòng của một post S03 (giả lập đổi rule parser: nhóm theo nội dung đổi);
//   lượt 3 — một listing có đêm ra ngoài mọi phường.
// Trước lượt 1 gieo quyết định thử (đề xuất đã quyết, thẻ đã duyệt, ứng viên merged + thẻ pair) lên tin S03/S05 thật.
// Ma trận 7 hàng × 2 cột: lib/nap-lai-matrix.mjs. Exit 0 = không mất; exit 1 = có mất (in hàng); exit 2 = lỗi.
//
// Đối chứng (phải exit 1 và nêu hàng mất):
//   --doi-chung=039          hàm đối soát kiểu 039: DELETE tin vắng lượt, khoá ngoại CASCADE
//   --doi-chung=khong-chuyen hàm đối soát chỉ cho nghỉ (đặt retired_at + superseded_by), không chuyển dòng con
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { chupMaTran, gieoQuyetDinh, HANG, inMaTran, soMaTran } from "../lib/nap-lai-matrix.mjs";
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
    for (const s of ["S03", "S05"]) await gieoQuyetDinh(client, s);
    const truoc = await chupMaTran(client);
    const luot = [];
    const bien = [
      async () => `giá post ${await doiPost(client, "gia")}`,
      async () => `cách đọc số phòng post ${await doiPost(client, "phong")} (giả lập đổi rule parser)`,
      async () => `listing ${await doiListing(client)} ra ngoài phường`,
    ];
    for (const [i, doi] of bien.entries()) {
      const mo = await doi();
      const r = await motLuot(client);
      luot.push(`lượt ${i + 1} (${mo}): nghỉ S03 ${r.S03} · S05 ${r.S05} · listing ngoài phường ${r.airbnb_nghi}`);
      out(luot.at(-1));
    }
    const sau = await chupMaTran(client);
    const mat = soMaTran(truoc, sau);
    const tong = (ds) => mat.filter((m) => ds.includes(m.hang)).reduce((a, m) => a + m.mat, 0);
    return { mat, matQuyetDinh: tong(QUYET_DINH), matLienKet: tong(LIEN_KET), bang: inMaTran(truoc, sau), luot };
  } finally {
    await client.query("ROLLBACK").catch(() => {});
  }
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--doi-chung="));
  const doiChung = arg ? arg.split("=")[1] : null;
  if (doiChung && !DOI_CHUNG[doiChung]) {
    console.error(`--doi-chung không hợp lệ: ${doiChung} (039 | khong-chuyen)`);
    process.exit(2);
  }
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (doiChung) console.log(`đối chứng: ${doiChung}`);
    const r = await chayBaLuot(client, { doiChung });
    console.log(r.bang);
    console.log(`nap-lai-ba-luot: 3 lượt · mất ${r.matQuyetDinh} quyết định · mất ${r.matLienKet} liên kết`);
    for (const m of r.mat) console.log(`mất: ${m.hang} (${m.cot}) ${m.truoc}→${m.sau}`);
    process.exitCode = r.mat.length ? 1 : 0;
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
