// nap-079.mjs — enrich-nguoi-s03: dò và nạp migration 079 (sổ liên lạc party_contacts + nhãn số qua người đăng).
// daCoBang079 / daCoNhan079 dùng cả ở đường ghi thật: bộ dựng liên lạc và bộ gán đọc chúng trước khi chạm bảng hay ghi số suy.
// KHÔNG dùng nap079 ngoài giao dịch sẽ ROLLBACK: áp 079 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_079 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/079_lien_lac_nguoi.sql"), "utf8");

/** Dấu xuất xứ của số suy qua người đăng trên field_provenance.seller_phone. */
export const RULE_QUA_NGUOI = "s03-qua-nguoi-dang";

/** Bảng party_contacts có chưa (theo search_path). Dò bằng to_regclass, không bắt lỗi: lỗi SELECT làm hỏng giao dịch của người gọi.
 * @param {import("pg").Client} client */
export async function daCoBang079(client) {
  const { rows } = await client.query("SELECT to_regclass('party_contacts') IS NOT NULL AS co");
  return rows[0].co;
}

/** View sale_offers đang chạy có nhận dấu số qua người đăng không — đọc lại mỗi lượt, vì một migration sau có thể ghi đè view.
 * @param {import("pg").Client} client */
export async function daCoNhan079(client) {
  const { rows } = await client.query(
    `SELECT to_regclass('sale_offers') IS NOT NULL AND position($1 IN pg_get_viewdef(to_regclass('sale_offers'))) > 0 AS co`,
    [RULE_QUA_NGUOI]);
  return rows[0].co;
}

/** @param {import("pg").Client} client đang ở trong giao dịch @returns {Promise<boolean>} true khi vừa áp */
export async function nap079(client) {
  if ((await daCoBang079(client)) && (await daCoNhan079(client))) return false;
  await client.query(MIG_079);
  return true;
}
