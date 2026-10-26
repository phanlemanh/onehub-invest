// write-offers.mjs — bước ghi canonical dùng chung của transform S03 (Zalo) / S05 (Facebook).
// Spec: docs/superpowers/specs/2026-10-23-enrich-hau-ky-design.md §2.1 (_acceptance/enrich-hau-ky).
//
// Thay cho «DELETE toàn nguồn + INSERT»: upsert theo offer_id (băm nội dung — ổn định giữa các
// lượt) rồi đối soát offer không còn trong lượt bằng hàm SQL reconcile_stale_offers (039).
// Cột đã enrich KHÔNG bị lượt nạp ghi đè; đề xuất + thẻ duyệt sống qua lần nạp lại.
// Người gọi giữ transaction (BEGIN…COMMIT) — hàm này không tự mở/đóng.

import { ENRICH_FIELD, VOCAB } from "./vocab.generated.mjs";

/** Cột do enrich điền (033) — lượt nạp không ghi đè khi offer đã tồn tại. Từ sổ (trục enrich_field), trừ bedrooms:
 *  parser vẫn ghi bedrooms ở mỗi lượt nạp. */
export const ENRICH_COLS = VOCAB.enrich_field.filter((c) => c !== ENRICH_FIELD.bedrooms);

const COLUMN = /^[a-z_][a-z0-9_]*$/;

/**
 * Upsert `offers` của một nguồn rồi đối soát offer cũ cùng nguồn.
 * @param {import("pg").Client} client
 * @param {string} source mã nguồn (S03, S05)
 * @param {Record<string, unknown>[]} offers mỗi phần tử: khoá = tên cột sale_offers, có offer_id
 * @param {{ actor?: string }} [opts]
 * @returns {Promise<{ upserted: number, reconcile: Record<string, unknown> }>}
 */
export async function writeOffers(client, source, offers, { actor = `transform:${source}` } = {}) {
  // Lượt rỗng mà vẫn đối soát = xoá mọi offer của nguồn (stg lỗi lọc, query trả 0 tin).
  if (!Array.isArray(offers) || offers.length === 0) {
    throw new Error("writeOffers: lượt nạp rỗng — không đối soát");
  }
  const { rows: fn } = await client.query(
    `SELECT to_regprocedure('reconcile_stale_offers(text,text[],text)') IS NOT NULL AS ok`,
  );
  if (!fn[0].ok) {
    throw new Error("writeOffers: chưa áp migration 039 (thiếu hàm reconcile_stale_offers)");
  }

  for (const offer of offers) {
    const row = { ...offer, source };
    const cols = Object.keys(row);
    for (const c of cols) if (!COLUMN.test(c)) throw new Error(`writeOffers: tên cột lạ «${c}»`);
    if (typeof row.offer_id !== "string") throw new Error("writeOffers: thiếu offer_id");
    const set = cols
      .filter((c) => c !== "offer_id" && c !== "source" && !ENRICH_COLS.includes(c))
      // bedrooms nằm trong băm offer_id; parse ra null thì giữ giá trị enrich đã điền.
      .map((c) => (c === "bedrooms" ? "bedrooms = COALESCE(EXCLUDED.bedrooms, sale_offers.bedrooms)" : `${c} = EXCLUDED.${c}`));
    await client.query(
      `INSERT INTO sale_offers (${cols.join(", ")})
       VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})
       ON CONFLICT (offer_id) DO UPDATE SET ${set.join(", ")}`,
      cols.map((c) => row[c]),
    );
  }

  const { rows } = await client.query(`SELECT reconcile_stale_offers($1, $2::text[], $3) AS s`, [
    source, offers.map((o) => o.offer_id), actor,
  ]);
  return { upserted: offers.length, reconcile: rows[0].s };
}

/** '<tệp>:<dòng>' cho mỗi câu DELETE FROM sale_offers — thước AC-5 trên mã transform. */
export function scanDeleteAll(files) {
  const hits = [];
  for (const f of files) {
    f.text.split("\n").forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      if (/DELETE\s+FROM\s+sale_offers\b/i.test(line)) hits.push(`${f.path}:${i + 1}`);
    });
  }
  return hits;
}
