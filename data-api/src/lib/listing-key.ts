/**
 * Khoá bí mật của `listingKey` tin thuê ngắn hạn (PB2 AC-2): listingKey = 16 hex đầu HMAC-SHA256(khoá, "S01|<id>"), tính
 * trong SQL bằng pgcrypto. Khoá đọc từ biến LISTING_KEY_SECRET. Chỉ NODE_ENV development|test (không Vercel) mới được chạy
 * bằng khoá thử — chữ lộ rõ là giả; môi trường đóng thiếu khoá thì index.ts không khởi động và route tin trả 503 (cùng khuôn
 * PB3). Mã tin là khoá mờ: ổn định chừng nào khoá không đổi — không xoay khoá khi chưa có lời gs.
 */
export const KHOA_THU = "khoa-thu-dev-KHONG-DUNG-THAT";
export const MISSING_LISTING_KEY_MESSAGE =
  "PB2 thiếu khoá bí mật của listingKey: đặt LISTING_KEY_SECRET (chỉ NODE_ENV=development|test mới dùng khoá thử).";

export function listingKeySecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const v = env.LISTING_KEY_SECRET?.trim();
  if (v) return v;
  const mo = (env.NODE_ENV === "development" || env.NODE_ENV === "test") && !env.VERCEL;
  return mo ? KHOA_THU : null;
}
