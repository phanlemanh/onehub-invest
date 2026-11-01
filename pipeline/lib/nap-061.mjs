// nap-061.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (HD5): nạp migration 061 (đặc trưng nhà S06) trong giao
// dịch, giữ khoá 33033 như mọi bộ nạp migration (tránh deadlock với test nạp song song).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_061 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/061_dac_trung_nha.sql"), "utf8");
/** Phần hàm của 061 (§3 trigger kiểu/miền → §5 sổ): nạp lại sau khi bộ nạp 045 đè resolve_offer_fields bằng bản cũ. */
const HAM_061 = MIG_061.slice(MIG_061.indexOf("-- 3. Kiểu và miền"));

/** Nạp 061 trong giao dịch đang mở (áp lại an toàn — 061 idempotent). */
export async function napDacTrung(client, { sql = MIG_061 } = {}) {
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(sql);
}

/** Gọi ngay sau mọi lần nạp lại 045/059 trong giao dịch: DB đã có cột 061 → nạp lại phần hàm 061 mà 045/059 vừa đè. */
export async function napLai061(client) {
  const { rows } = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'sale_offer_records' AND column_name = 'street_number') AS co`);
  if (rows[0].co) await client.query(HAM_061);
}
