// do-lam-giau-db.mjs — DO3 do-lam-giau: dò và nạp migration 086 (ảnh chụp giá trị làm giàu + dòng đổi theo ngày).
// KHÔNG dùng napLamGiau ngoài giao dịch sẽ ROLLBACK: áp 086 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SO_MIG = "086";
export const MIG_086 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/086_lam_giau.sql"), "utf8");

/** Hai bảng của 086 có chưa (theo search_path). Dò bằng to_regclass, không bắt lỗi: lỗi SELECT làm hỏng giao dịch của người gọi.
 * @param {import("pg").Client} client */
export async function daCoLamGiau(client) {
  const { rows } = await client.query(
    "SELECT to_regclass('enrichment_value_state') IS NOT NULL AND to_regclass('enrichment_value_change') IS NOT NULL AS co");
  return rows[0].co;
}

/** Nạp 086 trong giao dịch đang mở khi chưa có (giữ khoá 33033 như các bộ nạp migration khác của test).
 * @param {import("pg").Client} client đang ở trong giao dịch @returns {Promise<boolean>} true khi vừa áp */
export async function napLamGiau(client) {
  if (await daCoLamGiau(client)) return false;
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(MIG_086);
  return true;
}
