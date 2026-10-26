// db.ts — tiện ích test DB: mọi ca chạy trong BEGIN…ROLLBACK trên Postgres local,
// nạp lại migration 033 (+ 036, 039 của vòng enrich-hau-ky, 044 của nap-lai-khong-xoa) trong transaction
// (idempotent) để test không phụ thuộc DB đã áp hay chưa. Không để lại dữ liệu.
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
]
  .map((f) => join(MIGRATIONS_DIR, f))
  .filter((p) => existsSync(p));
// 039 dựng khoá ngoại tới BẢNG sale_offers; DB đã áp 044 (sale_offers là VIEW) thì bỏ 039 — 044 dựng lại khoá ấy.
const sql = (skip039: boolean) =>
  MIGRATIONS.filter((p) => !(skip039 && p.endsWith("039_enrichment_proposals_retain.sql")))
    .map((p) => readFileSync(p, "utf8")).join("\n");

export async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // node --test chạy các tệp song song; nạp migration (CREATE OR REPLACE FUNCTION) trong
    // hai transaction cùng lúc là deadlock → mọi ca DB xếp hàng sau một advisory lock.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const { rows } = await c.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok`);
    await c.query(sql(rows[0].ok));
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

export async function insertOffer(c: pg.Client, o: OfferFixture): Promise<void> {
  await c.query(
    `INSERT INTO sale_offers (offer_id, kind, confidence, first_seen, last_seen, source,
       property_type, bedrooms, bathrooms, street_raw, block_raw, post_ids)
     VALUES ($1, 'sale', 'high', now(), now(), $2, $3, $4, $5, $6, $7, $8)`,
    [
      o.offer_id, o.source ?? "S03", o.property_type ?? null, o.bedrooms ?? null,
      o.bathrooms ?? null, o.street_raw ?? null, o.block_raw ?? null, o.post_ids ?? [],
    ],
  );
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
