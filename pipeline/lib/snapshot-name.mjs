// Luật tên thư mục snapshot DÙNG CHUNG cho cả hai importer (PL1 mở lại vòng 4,
// claudedp-2310-4 + BÁO claudedp-2510-5): tên phải đúng khuôn
//   '<city>__<nguồn>__<mốc thời gian>'
// với mốc khớp TS_RE dưới đây. Chuỗi TS_RE GIỐNG HỆT literal TS_RE trong
// scripts/apify-facebook-daily.sh và scripts/zalo-import-daily.sh (AU3,
// claudedp-2310-8 vòng 3) — hai bên phải không lệch nhau.
//
// Mốc nhận cả ba dạng storage.ts từng dùng: giây (6 số, bản cũ chạy trên
// :9210), mili-giây (9 số, storage.ts b0898fe trở đi) và hậu tố '-n' khi
// trùng mili-giây. '__TEST', '__e2e'… không phải mốc → toàn thư mục bị bỏ.

export const TS_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$/;

/** Tách '<city>__<nguồn>__<mốc>' — trả null nếu sai khuôn hoặc mốc không
 *  phải thời gian (segment thử như TEST/e2e). Đúng khuôn trả đủ 3 phần. */
export function parseSnapshotDirName(name) {
  const parts = String(name).split("__");
  if (parts.length !== 3) return null;
  const [city, source, ts] = parts;
  if (!city || !source || !TS_RE.test(ts)) return null;
  return { city, source, ts };
}
