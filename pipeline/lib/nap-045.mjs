// nap-045.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (PL15): nạp migration 045 và mở cổng «chưa cắt chuyển»
// trong giao dịch, để transform / writeOffers / apply_enrichment chạy được bất kể DB local đã áp 045 hay đã cắt chuyển.
// KHÔNG dùng ngoài giao dịch sẽ ROLLBACK: dòng ops_audit mở cổng không được ở lại DB thật (cắt chuyển thật là lệnh
// pipeline/phat-bieu-cat-chuyen.mjs).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIG = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/045_phat_bieu_va_phan_xu.sql"), "utf8");
/** Phần hàm của 045 (mục 6–8): nạp lại khi DB đã áp, tránh ALTER bảng dùng chung (khoá độc quyền) trong test. */
const HAM = MIG.slice(MIG.indexOf("-- 6. Bộ phân xử"));

/**
 * @param {import("pg").Client} client đang ở trong giao dịch
 * @param {{ moCong?: boolean }} [opts] moCong=false: chỉ nạp 045, để cổng như DB (ca đo cổng)
 */
export async function napPhatBieu(client, { moCong = true } = {}) {
  const { rows } = await client.query("SELECT to_regclass('field_assertions') IS NOT NULL AS co");
  await client.query(rows[0].co ? HAM : MIG);
  if (moCong) {
    await client.query(`INSERT INTO ops_audit (actor, action, env, detail)
      SELECT 'test:phat-bieu', 'phat-bieu:cat-chuyen', 'local', '{"giao_dich_thu": true}'::jsonb
       WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`);
  }
}
