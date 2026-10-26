// db.ts — tiện ích test DB: mọi ca chạy trong BEGIN…ROLLBACK trên Postgres local,
// nạp lại migration 033 (+ 036, 039 của vòng enrich-hau-ky, 044 của nap-lai-khong-xoa, 045 của phat-bieu-va-phan-xu)
// trong transaction (idempotent) để test không phụ thuộc DB đã áp hay chưa. Không để lại dữ liệu.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIGRATIONS_DIR = join(import.meta.dirname, "../../../db/migrations");
/** Đường dẫn migration nạp vào mỗi transaction test — theo thứ tự số. */
export const MIGRATIONS: string[] = [
  "033_enrichment_proposals.sql",
  "036_revert_enrichment.sql",
  "039_enrichment_proposals_retain.sql",
  "044_nap_lai_khong_xoa.sql",
  "045_phat_bieu_va_phan_xu.sql",
]
  .map((f) => join(MIGRATIONS_DIR, f))
  .filter((p) => existsSync(p));
// DB đã áp 044 (sale_offers là VIEW): bỏ cả 039 (khoá ngoại của nó trỏ BẢNG sale_offers) lẫn 044 (đã có; áp lại là DDL
// khoá độc quyền trên bảng dùng chung, dễ deadlock với phiên khác đang đọc). DB chưa áp: nạp đủ 033+036+039+044.
// Cùng lẽ với 045: đã áp thì bỏ; nhưng 033/036 nạp lại sẽ đè apply/revert bản 045 → khi có 045, nạp 045 sau cùng là
// CREATE OR REPLACE hàm (không DDL bảng nào khoá độc quyền nhờ IF NOT EXISTS đã có).
const sql = (da044: boolean, da045: boolean) =>
  MIGRATIONS.filter((p) => !(da044 && /\/(039|044)_/.test(p)))
    .map((p) => {
      const t = readFileSync(p, "utf8");
      // 045 đã áp: chỉ nạp lại phần hàm (mục 6–8), không ALTER bảng / tạo lại view
      return da045 && /\/045_/.test(p) ? t.slice(t.indexOf("-- 6. Bộ phân xử")) : t;
    }).join("\n");

/** Mở cổng «chưa cắt chuyển» của 045 trong giao dịch test — giá trị gieo được ghi kèm phát biểu legacy (insertOffer). */
const MO_CONG = `INSERT INTO ops_audit (actor, action, detail) VALUES ('test:agent', 'phat-bieu:cat-chuyen', '{}'::jsonb)`;

export async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // node --test chạy các tệp song song; nạp migration (CREATE OR REPLACE FUNCTION) trong
    // hai transaction cùng lúc là deadlock → mọi ca DB xếp hàng sau một advisory lock.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const { rows } = await c.query(
      `SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok, to_regclass('field_assertions') IS NOT NULL AS pb`);
    await c.query(sql(rows[0].ok, rows[0].pb));
    await c.query(MO_CONG);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

export type OfferFixture = {
  offer_id: string;
  source?: string;
  property_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  street_raw?: string | null;
  block_raw?: string | null;
  post_ids?: string[];
};

/** Gieo một tin như DB sau cắt chuyển (PL15): giá trị gieo thẳng có phát biểu legacy đỡ, nên phân xử giữ nguyên chúng. */
export async function insertOffer(c: pg.Client, o: OfferFixture): Promise<void> {
  const source = o.source ?? "S03";
  const osk = o.post_ids?.[0] ?? o.offer_id;
  await c.query(
    `INSERT INTO sale_offers (offer_id, kind, confidence, first_seen, last_seen, source,
       property_type, bedrooms, bathrooms, street_raw, block_raw, post_ids, originating_system_key)
     VALUES ($1, 'sale', 'high', now(), now(), $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      o.offer_id, source, o.property_type ?? null, o.bedrooms ?? null,
      o.bathrooms ?? null, o.street_raw ?? null, o.block_raw ?? null, o.post_ids ?? [], osk,
    ],
  );
  const legacy = Object.entries({
    property_type: o.property_type && o.property_type !== "unknown" ? o.property_type : null,
    bedrooms: o.bedrooms, bathrooms: o.bathrooms, street_raw: o.street_raw, block_raw: o.block_raw,
  }).filter(([, v]) => v !== null && v !== undefined);
  for (const [field, value] of legacy) {
    await c.query(
      `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, evidence)
       VALUES ($1, $2, $3, 'observed', 'legacy', '045', '{"note":"gieo test"}'::jsonb)`,
      [`${source}:${osk}`, field, String(value)],
    );
  }
  await c.query(`SELECT resolve_offer_fields(ARRAY[$1])`, [o.offer_id]);
}

/** Tạo một căn (properties) gắn với offer; trả id căn. */
export async function insertProperty(c: pg.Client, offerId: string): Promise<string> {
  const { rows } = await c.query(`INSERT INTO properties DEFAULT VALUES RETURNING id::text AS id`);
  await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [
    rows[0].id, offerId,
  ]);
  return rows[0].id;
}

/** Chèn một đề xuất thẳng (dùng cho test hàm SQL); trả id. */
export async function insertProposal(
  c: pg.Client,
  p: { offer_id: string; field: string; value: string; source?: string; route?: string; review_id?: number | null },
): Promise<number> {
  const { rows } = await c.query(
    `INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, review_id)
     VALUES ('test', $1, $2, $3, lower($3), $4, $5, $6) RETURNING id`,
    [p.offer_id, p.field, p.value, p.source ?? "e2_llm", p.route ?? "review", p.review_id ?? null],
  );
  return Number(rows[0].id);
}
