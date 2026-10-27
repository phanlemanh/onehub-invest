// write-offers.mjs — bước ghi canonical dùng chung của transform S03 (Zalo) / S05 (Facebook).
// Spec: docs/superpowers/specs/2026-10-23-enrich-hau-ky-design.md §2.1 (_acceptance/enrich-hau-ky);
// PL15: docs/superpowers/specs/2026-10-26-phat-bieu-va-phan-xu-design.md §3.4.
//
// Thay cho «DELETE toàn nguồn + INSERT»: upsert theo offer_id (khoá dính PL14, lib/offer-key.mjs) vào bảng bản ghi
// sale_offer_records (044), rồi đối soát offer không còn trong lượt bằng hàm SQL reconcile_stale_offers (bản 044:
// cho nghỉ, không xoá). Tin quay lại thì gỡ retired_at.
// PL15 (045): năm cột phân loại (trục enrich_field) KHÔNG còn ghi thẳng — bộ đọc ghi phát biểu (`assertions`), rồi bộ
// phân xử dựng năm cột cho các tin của lượt. Cột trùng trục trong hàng bị bỏ qua.
// Người gọi giữ transaction (BEGIN…COMMIT) — hàm này không tự mở/đóng.

import { VOCAB } from "./vocab.generated.mjs";
import { kiemCatChuyen, resolveOffers, writeAssertions } from "./assert.mjs";

/** Năm cột chỉ bộ phân xử được ghi (trục enrich_field của sổ). */
const NAM_COT = new Set(VOCAB.enrich_field);
const COLUMN = /^[a-z_][a-z0-9_]*$/;

/**
 * Upsert `offers` của một nguồn, ghi phát biểu của lượt, đối soát offer cũ cùng nguồn, rồi phân xử năm cột.
 * @param {import("pg").Client} client
 * @param {string} source mã nguồn (S03, S05)
 * @param {Record<string, unknown>[]} offers mỗi phần tử: khoá = tên cột sale_offers, có offer_id
 * @param {{ actor?: string, assertions?: Parameters<typeof writeAssertions>[1] }} [opts] `assertions`: phát biểu của
 *   bộ đọc cho lượt này (ghi với replaceOwn — lượt sau ra giá trị khác thì thay phát biểu cũ cùng phương pháp)
 * @returns {Promise<{ upserted: number, reconcile: Record<string, unknown>, assertions: {inserted: number, retracted: number},
 *   resolve: {offers: number, offers_changed: number} }>}
 */
export async function writeOffers(client, source, offers, { actor = `transform:${source}`, assertions = [] } = {}) {
  // Lượt rỗng mà vẫn đối soát = xoá mọi offer của nguồn (stg lỗi lọc, query trả 0 tin).
  if (!Array.isArray(offers) || offers.length === 0) {
    throw new Error("writeOffers: lượt nạp rỗng — không đối soát");
  }
  const { rows: fn } = await client.query(
    `SELECT to_regprocedure('reconcile_stale_offers(text,text[],text)') IS NOT NULL
        AND to_regclass('sale_offer_records') IS NOT NULL AS ok,
            to_regprocedure('resolve_offer_fields(text[])') IS NOT NULL AS pb`,
  );
  if (!fn[0].ok) {
    throw new Error("writeOffers: chưa áp migration 044 (thiếu sale_offer_records hoặc hàm reconcile_stale_offers)");
  }
  if (!fn[0].pb) {
    throw new Error("writeOffers: chưa áp migration 045 (thiếu bảng phát biểu / hàm resolve_offer_fields)");
  }
  await kiemCatChuyen(client);

  for (const offer of offers) {
    const row = Object.fromEntries(Object.entries({ ...offer, source }).filter(([c]) => !NAM_COT.has(c)));
    const cols = Object.keys(row);
    for (const c of cols) if (!COLUMN.test(c)) throw new Error(`writeOffers: tên cột lạ «${c}»`);
    if (typeof row.offer_id !== "string") throw new Error("writeOffers: thiếu offer_id");
    const set = cols
      .filter((c) => c !== "offer_id" && c !== "source")
      .map((c) => `${c} = EXCLUDED.${c}`)
      // Tin quay lại sau khi nghỉ: sống lại, bỏ con trỏ tin kế.
      .concat(["retired_at = NULL", "retired_reason = NULL", "superseded_by = NULL"]);
    await client.query(
      `INSERT INTO sale_offer_records (${cols.join(", ")})
       VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})
       ON CONFLICT (offer_id) DO UPDATE SET ${set.join(", ")}`,
      cols.map((c) => row[c]),
    );
  }

  const ghi = await writeAssertions(client, assertions, { replaceOwn: true });
  const { rows } = await client.query(`SELECT reconcile_stale_offers($1, $2::text[], $3) AS s`, [
    source, offers.map((o) => o.offer_id), actor,
  ]);
  const resolve = await resolveOffers(client, offers.map((o) => o.offer_id));
  return { upserted: offers.length, reconcile: rows[0].s, assertions: ghi, resolve };
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
