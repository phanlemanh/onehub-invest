// nap-060.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (SD3 sdt-luu-goc-e164): nạp migration 060 trong giao dịch
// khi DB local chưa áp (sellers còn là bảng), để bộ ghi và test chạy trên view sellers + bí danh sdt bất kể DB đã áp hay chưa.
// KHÔNG dùng ngoài giao dịch sẽ ROLLBACK: áp 060 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_060 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/060_sdt_e164.sql"), "utf8");

/** @param {import("pg").Client} client đang ở trong giao dịch @param {string} [sql] bản 060 (đối chứng đỏ truyền bản chép) */
export async function napSdtE164(client, sql = MIG_060) {
  const { rows } = await client.query(
    `SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'sellers'`,
  );
  if (rows[0]?.relkind === "v" && sql === MIG_060) return false;
  await client.query(sql);
  return true;
}
