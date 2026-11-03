// nap-069.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (so-ghep-s06-nhan-danh-ba): nạp migration 069 trong giao dịch khi
// view sale_offers chưa có cột nhãn. daCoNhan069 thì dùng cả ở đường ghi thật: bộ gán đọc nó trước khi ghi số ghép.
// KHÔNG dùng nap069 ngoài giao dịch sẽ ROLLBACK: áp 069 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_069 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/069_nhan_so_ghep.sql"), "utf8");

/** View đang chạy (theo search_path) có cột nhãn không — đọc lại mỗi lượt, vì một migration sau có thể ghi đè view.
 * @param {import("pg").Client} client */
export async function daCoNhan069(client) {
  const { rows } = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('sale_offers')
                       AND attname = 'seller_phone_inferred' AND attnum > 0 AND NOT attisdropped) AS co`);
  return rows[0].co;
}

/** @param {import("pg").Client} client đang ở trong giao dịch @returns {Promise<boolean>} true khi vừa áp */
export async function nap069(client) {
  if (await daCoNhan069(client)) return false;
  await client.query(MIG_069);
  return true;
}
