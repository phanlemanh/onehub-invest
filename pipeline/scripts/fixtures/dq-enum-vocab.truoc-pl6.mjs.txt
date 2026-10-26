// dq-enum-vocab.mjs — G-1 Lô 2: kiểm enum sale_offers đúng controlled
// vocabulary khai trong mappings.yaml (ADR-0011 Qđ 3.6 — field không có
// DQ check coi như chưa hoàn thành). Đổ kết quả vào dq_check_results,
// /ops/quality hiển thị cùng các trụ DQ khác.
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const VOCAB = {
  kind: ["sale", "rent_lt"],
  confidence: ["high", "medium", "low"],
  price_tier: ["P0", "P1", "P2"],
  property_type: ["apartment", "house", "land", "room", "commercial", "unknown"],
};

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    let allPass = true;
    for (const [col, allowed] of Object.entries(VOCAB)) {
      const { rows } = await c.query(
        `SELECT count(*)::int AS bad, min(${col}) AS sample_bad FROM sale_offers
         WHERE ${col} IS NOT NULL AND ${col} <> ALL($1::text[])`,
        [allowed],
      );
      const bad = rows[0].bad;
      const status = bad === 0 ? "pass" : "fail";
      if (bad > 0) allPass = false;
      await c.query(
        `INSERT INTO dq_check_results (check_name, entity, status, detail)
         VALUES ($1, $2, $3, $4)`,
        [
          `enum-vocab:${col}`,
          "sale_offers",
          status,
          bad === 0
            ? `0 giá trị ngoài vocabulary (${allowed.join("|")})`
            : `${bad} giá trị ngoài vocabulary, ví dụ: ${rows[0].sample_bad}`,
        ],
      );
      console.log(`${col}: ${status}${bad ? ` (${bad} lệch)` : ""}`);
    }
    // độ phủ property_type (không bắt buộc P1, nhưng theo dõi)
    const { rows: cov } = await c.query(
      `SELECT source, count(*) FILTER (WHERE property_type IS NULL OR property_type='unknown')::int AS unknown_n,
              count(*)::int AS tong FROM sale_offers GROUP BY source`,
    );
    for (const r of cov) {
      await c.query(
        `INSERT INTO dq_check_results (check_name, entity, status, detail)
         VALUES ('enum-vocab:property_type-coverage', 'sale_offers:' || $1, $2, $3)`,
        [
          r.source,
          r.unknown_n === r.tong ? "warn" : "pass",
          `${r.tong - r.unknown_n}/${r.tong} offers có loại hình`,
        ],
      );
    }
    console.log(allPass ? "DQ enum-vocab: ALL PASS" : "DQ enum-vocab: CÓ LỆCH");
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
