/**
 * Mã thị trường cũ → mã mới (hàng chuyen-huong-ma-thi-truong). Migration 064 đổi 32 thị trường cấp tỉnh từ mã dài
 * `vn-(thanh-pho|tinh)-<x>` sang `vn-<x>`; link và lời gọi API mang mã dài vẫn phải chạy.
 *
 * Luật đổi giống hệt 064: `regexp_replace(id, '^vn-(thanh-pho|tinh)-', 'vn-')`. data-api giữ bản chép riêng
 * (`data-api/src/lib/ma-thi-truong.ts`, gói đẩy sang repo public) — phép đo E1 khoá hai bản cùng đầu ra với 064.
 */
import { pool } from "@/lib/db";

const MA_DAI = /^vn-(thanh-pho|tinh)-/;

/** Mã dài → mã ngắn; mã khác trả nguyên. Thuần. */
export function maNgan(id: string): string {
  return id.replace(MA_DAI, "vn-");
}

/** Mã khu vực dùng để truy vấn: mã nguyên văn nếu còn trong `areas` (DB chưa áp 064), không thì mã ngắn nếu có, không
 *  có cả hai thì mã nguyên văn (route trả 404/rỗng như cũ). Mã không mang tiền tố dài trả ngay, không truy vấn. */
export async function giaiMaKhuVuc(id: string): Promise<string> {
  const ngan = maNgan(id);
  if (ngan === id) return id;
  const { rows } = await pool.query<{ id: string }>(`SELECT id FROM areas WHERE id = ANY($1::text[])`, [[id, ngan]]);
  const co = new Set(rows.map((r) => r.id));
  return co.has(id) ? id : co.has(ngan) ? ngan : id;
}

/** Đoạn URL thị trường mới (sau `/<country>/`) khi `market` là mã dài mà DB đã đổi sang mã ngắn (064 đã áp); `null`
 *  khi mã không mang tiền tố dài, mã dài còn trong `areas` (064 chưa áp), hay không có thị trường mã ngắn nào. */
export async function thiTruongDaDoi(country: string, market: string): Promise<string | null> {
  const id = `${country}-${market}`;
  const ngan = maNgan(id);
  if (ngan === id) return null;
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM areas WHERE id = ANY($1::text[]) AND region_type = 'market'`,
    [[id, ngan]],
  );
  const co = new Set(rows.map((r) => r.id));
  return !co.has(id) && co.has(ngan) ? ngan.slice(country.length + 1) : null;
}

/** Ghép query của trang vào đích chuyển hướng (giữ nguyên tham số người gửi). */
export function noiQuery(path: string, sp: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    for (const x of Array.isArray(v) ? v : v === undefined ? [] : [v]) q.append(k, x);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
