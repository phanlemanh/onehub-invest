// nap-058.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (bang-yeu-cau): nạp migration 058 (bảng Yêu cầu) trong
// giao dịch, để transform ghi được Yêu cầu bất kể DB local đã áp 058 hay chưa.
// KHÔNG dùng ngoài giao dịch sẽ ROLLBACK: áp 058 lên DB máy thu là bước triển khai sau gộp.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_058 = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/058_inquiry_records.sql");

/**
 * Nạp 058 (gọi lại được — migration idempotent). Giữ pg_advisory_xact_lock(33033) như mọi test nạp migration. Không nạp
 * 045 / 057 — người gọi nạp trước (napPhatBieu, napKev).
 * @param {import("pg").Client} client đang ở trong giao dịch
 * @param {{ sql?: string }} [opts] sql: văn bản migration thay thế (ca đỏ trên bản sao đột biến)
 */
export async function napYeuCau(client, { sql = readFileSync(MIG_058, "utf8") } = {}) {
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(sql);
}
