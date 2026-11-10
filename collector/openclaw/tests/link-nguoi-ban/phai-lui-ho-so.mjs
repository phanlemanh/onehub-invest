#!/usr/bin/env node
// link-nguoi-ban-s03 (AC-9): phán lùi RIÊNG cho bộ tra hồ sơ — chạy CÙNG
// phai-lui.mjs của ma-album-s03 sau khởi động lại gateway (một lần khởi động
// chung theo «Qua gateway, gộp album»).
//
// Luật riêng theo hợp đồng: bộ nghe tin ĐÓNG trong 30 phút SAU một lời gọi
// của bộ tra → dung-goi-Manh (ưu tiên cao nhất, KHÔNG xếp dạng 26/10 — không
// tự bật lại, người quyết). Ngoài 30′ hoặc đóng trước lời gọi: luật này không
// phán, phai-lui.mjs của album xét tiếp.
//
// Mốc lời gọi = nội dung tệp mốc-60s.txt trong thư mục việc bộ tra
// (S03_LOOKUP_DIR) — bộ tra ghi NGAY TRƯỚC mỗi lời (seller-lookup.ts), mốc
// sống qua khởi động lại. Dòng đóng listener đọc từ gateway.log (+07:00).
//
// Dùng: node phai-lui-ho-so.mjs <gateway.log> <S03_LOOKUP_DIR>
// Trả: { phan: "dung-goi-Manh" | "khong-phai-luat-nay", vi }

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const CUA_SO_30P_MS = 30 * 60_000;

function docMocLoiGoi(lookupDir) {
  try {
    const t = readFileSync(join(lookupDir, "moc-60s.txt"), "utf8").trim();
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null; // chưa từng gọi → luật này không áp dụng
  }
}

// THUẦN — test gọi trực tiếp. dongListener: mảng {atMs} các lần đóng listener.
export function phanLuiHoSo(mocLoiGoi, dongListener, hienTai) {
  if (!Number.isFinite(mocLoiGoi) || mocLoiGoi <= 0) {
    return { phan: "khong-phai-luat-nay", vi: "bộ tra chưa từng gọi" };
  }
  const trong30 = dongListener.filter(
    (d) => d.atMs > mocLoiGoi && d.atMs - mocLoiGoi <= CUA_SO_30P_MS,
  );
  if (trong30.length > 0) {
    return {
      phan: "dung-goi-Manh",
      vi: `bộ nghe tin đóng ${trong30.length} lần trong 30′ sau lời gọi bộ tra (${Math.round(
        (trong30[0].atMs - mocLoiGoi) / 60_000,
      )}′ sau lời) — luật riêng AC-9, không xếp dạng 26/10`,
    };
  }
  return { phan: "khong-phai-luat-nay", vi: "không có lần đóng nào trong 30′ sau lời gọi" };
}

// Đọc dòng đóng listener từ gateway.log (+07:00, khuôn của phai-lui album).
// S4-2(B) 0911-12: gateway.log thật ghi ISO "YYYY-MM-DDTHH:MM:SS.mmm±hh:mm"
// (T, mili giây, độ lệch múi giờ) — bản khớp dấu-cách trước đây đọc ra 0 dòng.
// Date.parse giữ nguyên múi giờ trong chuỗi, KHÔNG tự cộng +7.
export function docDongDongListener(logText) {
  const out = [];
  for (const line of logText.split("\n")) {
    // ISO đầu dòng (gateway thật) hoặc khuôn dấu cách cũ (album) — cả hai đều đọc được
    const m = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/);
    if (!m) continue;
    if (!/listener (closed|error)|S03-kenh listener closed/i.test(line)) continue;
    let t = Date.parse(m[1].replace(" ", "T"));
    if (!Number.isFinite(t) && !/[Z+-]/.test(m[1])) t = Date.parse(m[1] + "+07:00"); // khuôn cũ không múi giờ → +07:00
    if (Number.isFinite(t)) out.push({ atMs: t });
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("phai-lui-ho-so.mjs") && process.argv.length >= 4) {
  const logText = readFileSync(process.argv[2], "utf8");
  const moc = docMocLoiGoi(process.argv[3]);
  const kq = phanLuiHoSo(moc, docDongDongListener(logText), Date.now());
  console.log(JSON.stringify(kq));
}
