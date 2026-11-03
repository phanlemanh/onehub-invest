// nap-068.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (sdt-s06-ghep-tai-khoan): nạp migration 068 trong giao dịch khi
// hàm phân xử chưa giữ khoá seller_phone. daCoPhanGiu068 thì dùng cả ở đường ghi thật: bộ gán đọc nó trước khi ghi.
// KHÔNG dùng nap068 ngoài giao dịch sẽ ROLLBACK: áp 068 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_068 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/068_giu_nguon_goc_sdt.sql"), "utf8");

/** Định nghĩa hàm phân xử đang chạy (theo search_path) có phần giữ khoá seller_phone không — đọc lại mỗi lượt, vì một
 * migration sau có thể ghi đè hàm. @param {import("pg").Client} client */
export async function daCoPhanGiu068(client) {
  const { rows } = await client.query(`SELECT pg_get_functiondef(to_regprocedure('resolve_offer_fields(text[])')) AS d`);
  return rows[0].d?.includes("fp_sdt") ?? false;
}

/** @param {import("pg").Client} client đang ở trong giao dịch @returns {Promise<boolean>} true khi vừa áp */
export async function nap068(client) {
  if (await daCoPhanGiu068(client)) return false;
  await client.query(MIG_068);
  return true;
}
