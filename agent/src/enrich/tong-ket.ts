// tong-ket.ts — bộ đếm một lượt enrich, luật mã thoát và dòng tổng kết của CLI (hồ sơ enrich-chay-sau-nap).
// Tách khỏi scripts/enrich-run.ts để test đơn vị gọi được mà không chạy CLI.

export type DemLuot = {
  /** Số tin lượt đã bốc. */
  tin: number;
  /** Đề xuất thật sự chèn (RETURNING id — đề xuất trùng ON CONFLICT không tính). */
  deXuatMoi: number;
  /** Đề xuất apply_enrichment thật sự áp (kết quả hàm SQL). */
  daAp: number;
  /** Đề xuất mới vào hàng duyệt (route review, status queued). */
  choDuyet: number;
  /** Số thẻ /ops/review đang chờ mà lượt chạm. */
  the: number;
  llmGoi: number;
  /** Lời gọi LLM ném lỗi (hết giờ, 500, không nối được). */
  llmLoi: number;
  /** Câu trả lời LLM không parse được. */
  llmKhongDoc: number;
  /** Tin ghi hỏng — giao dịch của tin đã lui lại. */
  loiGhi: { offer_id: string; loi: string }[];
};

export function demRong(): DemLuot {
  return { tin: 0, deXuatMoi: 0, daAp: 0, choDuyet: 0, the: 0, llmGoi: 0, llmLoi: 0, llmKhongDoc: 0, loiGhi: [] };
}

const hong = (d: DemLuot) => d.llmLoi + d.llmKhongDoc;

/**
 * Mã thoát (Hỏi-1, Mạnh duyệt 30/10): có tin ghi hỏng → 2, luôn thắng 3 (lỗi ghi không bị LLM che);
 * LLM hỏng (lỗi + không đọc được) từ một nửa số lời gọi, số gọi ≥ 1 → 3; còn lại 0.
 * Mã 1 (hỏng ngoài vòng tin) do CLI đặt.
 */
export function maThoat(d: DemLuot): 0 | 2 | 3 {
  if (d.loiGhi.length > 0) return 2;
  if (d.llmGoi > 0 && 2 * hong(d) >= d.llmGoi) return 3;
  return 0;
}

export function dongTongKet(d: DemLuot): string[] {
  const h = hong(d);
  const dong = [
    `tin: ${d.tin} | đề xuất mới: ${d.deXuatMoi} | đã áp: ${d.daAp} | chờ duyệt: ${d.choDuyet} | thẻ đang chờ: ${d.the}`,
    `LLM hỏng ${h}/${d.llmGoi} (lỗi ${d.llmLoi} · không đọc được ${d.llmKhongDoc})`,
  ];
  if (h > 0 && 2 * h < d.llmGoi) dong.push(`⚠ LLM hỏng ${h}/${d.llmGoi}`);
  if (d.loiGhi.length > 0) {
    dong.push(`✗ ghi lỗi ${d.loiGhi.length} tin: ${d.loiGhi.map((l) => `${l.offer_id}(${l.loi})`).join(", ")}`);
  }
  return dong;
}
