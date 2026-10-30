// dq-enum-vocab.mjs — G-1 Lô 2: kiểm enum sale_offers đúng controlled
// vocabulary khai trong mappings.yaml (ADR-0011 Qđ 3.6 — field không có
// DQ check coi như chưa hoàn thành). Đổ kết quả vào dq_check_results,
// /ops/quality hiển thị cùng các trụ DQ khác.
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { VOCAB } from "./lib/vocab.generated.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Cột enum kiểm theo sổ từ vựng (PL6 — pipeline/mappings.yaml `enums:` → vocab.generated.mjs): bảng · cột · trục.
export const KIEM_ENUM = Object.freeze([
  { bang: "sale_offers", cot: "kind", truc: "kind" },
  { bang: "sale_offers", cot: "confidence", truc: "confidence" },
  { bang: "sale_offers", cot: "price_tier", truc: "price_tier" },
  { bang: "sale_offers", cot: "property_type", truc: "property_type" },
  // Danh bạ Người (DB2b, 055): check_name trùng `enum-vocab:kind` của sale_offers — /ops/quality phân biệt theo entity.
  { bang: "parties", cot: "status", truc: "registry_status" },
  { bang: "registry_aliases", cot: "kind", truc: "alias_kind" },
  { bang: "registry_events", cot: "kind", truc: "registry_event_kind" },
  { bang: "party_roles", cot: "role", truc: "party_role" },
  { bang: "inquiries", cot: "kind", truc: "kind" },
  { bang: "inquiries", cot: "property_type", truc: "property_type" },
]);

/**
 * Kiểm một cột enum đúng sổ từ vựng, ghi một dòng dq_check_results (check_name `enum-vocab:<cột>`, entity `<bảng>`).
 * @param {import("pg").Client} c
 * @param {{ bang: string, cot: string, truc: string }} muc một phần tử của KIEM_ENUM
 * @returns {Promise<{ status: "pass" | "fail", bad: number }>}
 */
export async function kiemEnum(c, { bang, cot: col, truc }) {
  const allowed = [...VOCAB[truc]];
  const { rows } = await c.query(
    `SELECT count(*)::int AS bad, min(${col}) AS sample_bad FROM ${bang}
     WHERE ${col} IS NOT NULL AND ${col} <> ALL($1::text[])`,
    [allowed],
  );
  const bad = rows[0].bad;
  const status = bad === 0 ? "pass" : "fail";
  await c.query(
    `INSERT INTO dq_check_results (check_name, entity, status, detail)
     VALUES ($1, $2, $3, $4)`,
    [
      `enum-vocab:${col}`,
      bang,
      status,
      bad === 0
        ? `0 giá trị ngoài vocabulary (${allowed.join("|")})`
        : `${bad} giá trị ngoài vocabulary, ví dụ: ${rows[0].sample_bad}`,
    ],
  );
  return { status, bad };
}

/** Bảng (hay view) có ở DB này chưa — bảng chỉ-local (055, 058) vắng ở máy chưa áp thì mục kiểm bỏ qua, không văng. */
export async function coBang(c, bang) {
  return Boolean((await c.query("SELECT to_regclass($1) AS t", [`public.${bang}`])).rows[0].t);
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    let allPass = true;
    for (const muc of KIEM_ENUM) {
      if (!(await coBang(c, muc.bang))) {
        console.log(`${muc.bang}.${muc.cot}: bỏ qua — chưa có bảng`);
        continue;
      }
      const { status, bad } = await kiemEnum(c, muc);
      if (bad > 0) allPass = false;
      console.log(`${muc.bang}.${muc.cot}: ${status}${bad ? ` (${bad} lệch)` : ""}`);
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
