// doc-lap.ts — NB10 AC-2: một lời gọi model chỉ là PHIẾU THỨ HAI khi lời nhắc thật sự gửi đi không mang đáp án của luật.
// Thuần (không DB, không model). ROADMAP §3 mục 63 QĐ3 điều kiện (1): hai phiếu độc lập trùng nhau.
import { createHash } from "node:crypto";

/**
 * Dấu đáp án của luật trong lời nhắc: hai dòng bối cảnh E1 cũ (loại hình, mã toà đọc từ tên nhóm) và mọi dạng danh sách toà
 * (model chọn lại từ danh sách được đưa thì không độc lập ở trường toà). So không phân biệt hoa thường, sau NFC.
 */
export const DAU_DAP_AN_LUAT: readonly string[] = [
  "loại hình từ nhóm",
  "mã tòa phát hiện",
  "mã toà phát hiện",
  "danh sách tòa",
  "danh sách toà",
  "các tòa của dự án",
  "các toà của dự án",
];

/** Lời nhắc null (bên gọi không trả lời nhắc đã gửi) → không biết model đã thấy gì → không tính là độc lập. */
export function phieuDocLap(prompt: string | null | undefined): boolean {
  if (typeof prompt !== "string" || prompt.length === 0) return false;
  const p = prompt.normalize("NFC").toLowerCase();
  return !DAU_DAP_AN_LUAT.some((d) => p.includes(d));
}

/** Băm lời nhắc để soi lại sau (evidence.loi_nhac_bam) — 16 ký tự đầu sha256. */
export function bamLoiNhac(prompt: string | null | undefined): string | null {
  if (typeof prompt !== "string") return null;
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}
