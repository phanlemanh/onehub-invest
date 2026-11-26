// nap-136.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (YC0 bang-yeu-cau-noi-lai): nạp migration 136 (lớp bài Yêu cầu)
// trong giao dịch, để transform ghi được Yêu cầu bất kể DB thử đã áp 136 hay chưa.
// KHÔNG dùng ngoài giao dịch sẽ ROLLBACK: áp 136 lên DB máy thu là bước triển khai sau gộp (chữ ký Cổng Bằng chứng kèm lời áp).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIG_136 = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/136_inquiry_post_records.sql");
const SQL_136 = readFileSync(MIG_136, "utf8");

/** Phần vá bộ phân xử tin của 136 (§5): áp lại sau khi bộ nạp 045/059/061 đè resolve_offer_fields bằng bản cũ (napPhatBieu). */
export const VA_136 = SQL_136.slice(SQL_136.indexOf("-- 5. Bộ phân xử tin"), SQL_136.indexOf("-- 6. Sổ từ vựng"));

/** Dấu của phần vá trong thân resolve_offer_fields. */
export const DAU_VA_136 = "yeu_cau_136";

/**
 * Nạp 136 (gọi lại được — migration idempotent). Giữ pg_advisory_xact_lock(33033) như mọi bộ nạp migration. Không nạp 045 —
 * người gọi gọi napPhatBieu trước.
 * @param {import("pg").Client} client đang ở trong giao dịch
 * @param {{ sql?: string }} [opts] sql: văn bản migration thay thế (ca đỏ trên bản sao đột biến)
 */
export async function napYeuCau(client, { sql = SQL_136 } = {}) {
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(sql);
}

/** DB đã có bảng bài Yêu cầu (đã áp 136) chưa. */
export async function co136(client) {
  const { rows } = await client.query("SELECT to_regclass('inquiry_post_records') IS NOT NULL AS co");
  return rows[0].co;
}
