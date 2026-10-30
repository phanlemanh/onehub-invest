// nap-057.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (PL5): nạp migration 057 (cột Kev ở bảng nạp, phương
// pháp kev lớp suy luận) trong giao dịch, để transform ghi được phát biểu Kev bất kể DB local đã áp 057 hay chưa.
// KHÔNG dùng ngoài giao dịch sẽ ROLLBACK: áp 057 lên DB máy thu là bước triển khai sau gộp.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { napPhatBieu } from "./nap-045.mjs";
import { KHOA_DANH_BA } from "./danh-ba-nguoi.mjs";

export const MIG_057 = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/057_kev_phat_bieu.sql");

/**
 * Nạp 057 (gọi lại được — migration idempotent). DB chưa có field_assertions thì nạp 045 trước (không mở cổng).
 * Giữ pg_advisory_xact_lock(33033) như mọi test nạp migration, rồi khoá danh bạ (057 sửa party_roles): thứ tự
 * 33033 → danh bạ ở mọi chỗ, để ca danh bạ (chỉ giữ khoá danh bạ) và ca nạp 057 chạy song song không deadlock.
 * @param {import("pg").Client} client đang ở trong giao dịch
 * @param {{ sql?: string }} [opts] sql: văn bản migration thay thế (ca đỏ trên bản sao đột biến)
 */
export async function napKev(client, { sql = readFileSync(MIG_057, "utf8") } = {}) {
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
  const { rows } = await client.query("SELECT to_regclass('field_assertions') IS NOT NULL AS co");
  if (!rows[0].co) await napPhatBieu(client, { moCong: false });
  await client.query(sql);
}
