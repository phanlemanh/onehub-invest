// gan-sdt-qua-nguoi.mjs — enrich-nguoi-s03: tin S03 không có số riêng nhận số liên lạc của người đăng (party_contacts, 079).
//
// Dùng lại cơ chế số ghép S06 (gan-sdt-s06): ghi seller_phone kèm dấu field_provenance.seller_phone =
// {tier: inferred, method: e1_rule, rule_id: s03-qua-nguoi-dang, party_key, contact_id}; view sale_offers (079) tính nhãn
// «Chưa xác minh»; app, API, cloud không đổi. Nguồn sự thật là liên lạc của Người — tin chỉ mang giá trị suy, tự rút khi Người
// hết số hoặc tin có số riêng. Design docs/superpowers/specs/2026-11-06-enrich-nguoi-s03-design.md §5.
// Hai điểm gọi: cuối runTransformZalo sau writeOffers (cùng giao dịch, giữ số đêm trước — writeOffers vừa upsert cột về số riêng)
// và buocDem sau dungNguoi + dungLienLac (nhận liên lạc mới). Chạy lại không đổi gì.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { ganSdtQuaNguoi } from "./lib/gan-sdt-qua-nguoi.mjs";

export { bamSo, dongGan, ganSdtQuaNguoi, quyetGan } from "./lib/gan-sdt-qua-nguoi.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Chạy tay: ghi thật (`--thu` ROLLBACK). */
async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    try {
      await ganSdtQuaNguoi(c);
      await c.query(process.argv.includes("--thu") ? "ROLLBACK" : "COMMIT");
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    }
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message); process.exit(1); });
