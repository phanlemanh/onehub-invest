// nap-080.mjs — link-nguoi-ban-s03: dò và nạp migration 080 (bảng stg hồ sơ S03 + luật liên lạc s03_ho_so_theo_tai_khoan).
// daCo080 dùng ở đường ghi thật: bộ ghi liên lạc hồ sơ đọc nó trước khi chạm bảng. KHÔNG dùng nap080 ngoài giao dịch sẽ ROLLBACK:
// áp 080 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_080 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/080_ho_so_s03.sql"), "utf8");

/** Bảng stg kết quả tra hồ sơ S03 (080). */
export const STG_HO_SO = "stg_s03_ho_so";
/** Luật liên lạc của bộ ghi hồ sơ (080). */
export const RULE_HO_SO = "s03_ho_so_theo_tai_khoan";

/** 080 đã áp chưa: có bảng stg hồ sơ và CHECK rule_id của party_contacts nhận luật hồ sơ. Dò bằng to_regclass, không bắt lỗi —
 * lỗi SELECT làm hỏng giao dịch của người gọi.
 * @param {import("pg").Client} client */
export async function daCo080(client) {
  const { rows } = await client.query(
    `SELECT to_regclass($1) IS NOT NULL AND to_regclass('stg_s03_ho_so_moi_nhat') IS NOT NULL
        AND EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conrelid = to_regclass('party_contacts') AND conname = 'party_contacts_rule_id_check'
                       AND position($2 IN pg_get_constraintdef(oid)) > 0) AS co`,
    [STG_HO_SO, RULE_HO_SO]);
  return rows[0].co;
}

/** @param {import("pg").Client} client đang ở trong giao dịch @returns {Promise<boolean>} true khi vừa áp */
export async function nap080(client) {
  if (await daCo080(client)) return false;
  await client.query(MIG_080);
  return true;
}
