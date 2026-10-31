// idem-059.mjs — PL19 E10 (AC-9): 059 áp hai lần trên bản chép CÓ DỮ LIỆU (db/db-thu.sh) không nhân dòng ở
// history_transactional, ref_lookup, ref_field_lookup. Hai lần áp trong một giao dịch ROLLBACK (DDL của Postgres chạy
// được trong giao dịch). Đối chứng dương: sau lần một mỗi tin đúng một dòng new_listing (> 0 dòng). Chiều đỏ: bản 059
// bỏ khoá duy nhất + ON CONFLICT của bước điền lùi → thước đỏ với thông điệp ghim.
//   DATABASE_URL=…/oneinvest_p2_idem node scripts/idem-059.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL = readFileSync(path.join(ROOT, "db/migrations/059_thoi_gian_hieu_luc.sql"), "utf8");
const BANG = ["history_transactional", "ref_lookup", "ref_field_lookup"];
const NHAN = "history_transactional không được nhân dòng khi áp lại";

async function dem(c) {
  const o = {};
  for (const b of BANG) o[b] = Number((await c.query(`SELECT count(*) FROM ${b}`)).rows[0].count);
  const { rows: [r] } = await c.query(`SELECT (SELECT count(*) FROM sale_offer_records)::int AS tin,
    (SELECT count(*) FROM history_transactional WHERE change_type = 'new_listing')::int AS moi,
    (SELECT count(DISTINCT resource_record_key) FROM history_transactional WHERE change_type = 'new_listing')::int AS khac`);
  return { ...o, ...r };
}

/** Áp `sql` hai lần trong giao dịch ROLLBACK; ném lỗi ghim khi lần hai đổi số dòng hay lần một không điền lùi. */
async function kiem(c, sql, truoc = "") {
  await c.query("BEGIN");
  try {
    if (truoc) await c.query(truoc);
    await c.query(sql);
    const mot = await dem(c);
    if (!(mot.tin > 0 && mot.moi === mot.tin && mot.khac === mot.tin)) {
      throw new Error(`lần một phải điền lùi đúng một new_listing mỗi tin: ${JSON.stringify(mot)}`);
    }
    try {
      await c.query("SAVEPOINT lan_hai");
      await c.query(sql);
    } catch (e) {
      throw new Error(`${NHAN} — lần hai lỗi: ${e.message}`);
    }
    const hai = await dem(c);
    const lech = BANG.filter((b) => hai[b] !== mot[b]);
    if (lech.length || hai.moi !== mot.moi) {
      throw new Error(`${NHAN}: ${lech.map((b) => `${b} ${mot[b]} → ${hai[b]}`).join(", ") || `new_listing ${mot.moi} → ${hai.moi}`}`);
    }
    return { mot, hai };
  } finally {
    await c.query("ROLLBACK");
  }
}

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows: [db] } = await c.query("SELECT current_database() AS ten");
    if (db.ten === "oneinvest") throw new Error("từ chối chạy trên DB oneinvest dùng chung — dùng bản chép db/db-thu.sh");
    const { mot, hai } = await kiem(c, SQL);
    console.log(`idem-059: ${db.ten} · lần một ${BANG.map((b) => `${b} ${mot[b]}`).join(" · ")} (new_listing ${mot.moi} = ${mot.tin} tin)`);
    console.log(`idem-059: lần hai ${BANG.map((b) => `${b} ${hai[b]}`).join(" · ")} — không nhân dòng`);

    const lech = SQL
      .replace(/CREATE UNIQUE INDEX IF NOT EXISTS history_transactional_new_listing_uq\n  ON history_transactional \(resource_record_key\) WHERE change_type = 'new_listing';\n/, "")
      .replace("SELECT offer_id, 'ListPrice', NULL, price_vnd::text, 'new_listing', first_seen FROM sale_offer_records\nON CONFLICT DO NOTHING;",
        "SELECT offer_id, 'ListPrice', NULL, price_vnd::text, 'new_listing', first_seen FROM sale_offer_records;");
    if (lech.includes("history_transactional_new_listing_uq\n  ON") || lech.includes("first_seen FROM sale_offer_records\nON CONFLICT")) {
      throw new Error("chiều đỏ: 059 không còn khoá duy nhất / ON CONFLICT của bước điền lùi — sửa thước theo migration");
    }
    let do_ = null;
    try {
      // bản chép DB có thể đã áp 059 (khoá + dòng điền lùi có sẵn) — trong giao dịch ROLLBACK, đưa về trạng thái trước 059
      // (bỏ khoá, xoá dòng new_listing) để bản lệch chạy trên đúng nền mà migration gặp lần đầu
      const truoc059 = "DROP INDEX IF EXISTS history_transactional_new_listing_uq;\n" +
        "DELETE FROM history_transactional WHERE change_type = 'new_listing';\n";
      await kiem(c, lech, truoc059);
    } catch (e) {
      do_ = e.message;
    }
    if (!do_?.startsWith(NHAN)) throw new Error(`chiều đỏ không đỏ đúng thông điệp: ${do_ ?? "bản lệch qua thước"}`);
    console.log(`idem-059: chiều đỏ (bỏ khoá duy nhất + ON CONFLICT) → ${do_.slice(0, 160)}`);
    console.log("IDEMPOTENT PASS (có dữ liệu)");
    return 0;
  } finally {
    await c.end();
  }
}

main().then((ma) => { process.exitCode = ma; }, (e) => { console.error(`idem-059: ${e.message}`); process.exit(1); });
