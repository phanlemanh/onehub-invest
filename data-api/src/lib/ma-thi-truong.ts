import { pool } from "../db/client.js";

/**
 * Mã thị trường cũ → mã mới. Migration 064 của onehub-invest đổi 32 thị trường cấp tỉnh từ mã dài
 * `vn-(thanh-pho|tinh)-<x>` sang `vn-<x>`; lời gọi mang mã dài vẫn trả như gọi bằng mã mới.
 * Bản chép của `app/src/lib/ma-thi-truong.ts` — gói này đứng riêng nên không import chéo.
 */
const MA_DAI = /^vn-(thanh-pho|tinh)-/;

/** Mã dài → mã ngắn; mã khác trả nguyên. */
export function maNgan(id: string): string {
  return id.replace(MA_DAI, "vn-");
}

/** Mã nguyên văn nếu còn trong `areas`, không thì mã ngắn nếu có, không có cả hai thì mã nguyên văn.
 *  Mã không mang tiền tố dài trả ngay, không truy vấn. */
export async function giaiMaKhuVuc(id: string): Promise<string> {
  const ngan = maNgan(id);
  if (ngan === id) return id;
  const { rows } = await pool.query<{ id: string }>(`SELECT id FROM areas WHERE id = ANY($1::text[])`, [[id, ngan]]);
  const co = new Set(rows.map((r) => r.id));
  return co.has(id) ? id : co.has(ngan) ? ngan : id;
}
