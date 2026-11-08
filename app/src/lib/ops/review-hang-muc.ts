/**
 * Hạng mục duyệt (OD1 · ĐC6, báo cáo soát Ops 07/11 §e1): câu hỏi người duyệt thật sự trả lời ở một thẻ — khác `item_type`.
 * Hàm thuần, dùng chung route decide (ghi `ops_audit.detail.category`) và trang /ops/review (đếm thẻ chờ, bảng nhịp).
 * Module thường (không "use client"), không import alias «@/» ngoài kiểu — test và route gọi thẳng.
 */

/** Mã hạng mục, theo thứ tự hiện trên bảng nhịp. */
export const REVIEW_CATEGORIES = [
  "unit_match",
  "party_merge",
  "rule_vs_ai",
  "fill",
  "intent_check",
  "price_check",
  "area_check",
  "other",
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export const REVIEW_CATEGORY_LABEL: Record<ReviewCategory, string> = {
  unit_match: "Ghép căn",
  party_merge: "Gộp Người",
  rule_vs_ai: "Luật và AI khác nhau",
  fill: "Bổ sung tin",
  intent_check: "Đối chiếu ý định",
  price_check: "Đối chiếu giá",
  area_check: "Đối chiếu diện tích",
  other: "Loại khác",
};

/** Phần của thẻ mà phép phân hạng mục cần — `ReviewItem` hay dòng `review_queue` đều khớp. */
export type CategoryInput = { item_type: string; item_id?: string | null; evidence?: unknown };

/** Loại đối chiếu theo thứ tự cố định — thẻ có hai khối lấy loại đầu theo thứ tự này, không theo thứ tự trong JSON. */
const DOI_CHIEU_THU_TU = [
  ["y_dinh", "intent_check"],
  ["gia", "price_check"],
  ["dien_tich", "area_check"],
] as const;

/** Thẻ Người (HD17): loại `data_quality` mang mã dòng nguồn tiền tố `nguoi:`. */
export const laTheNguoi = (t: CategoryInput) => t.item_type === "data_quality" && Boolean(t.item_id?.startsWith("nguoi:"));

/** Một hạng mục cho một thẻ — điều kiện đầu khớp thắng (bảng §3.1 của thiết kế OD1). */
export function reviewCategory(t: CategoryInput): ReviewCategory {
  if (t.item_type === "entity_match") return "unit_match";
  if (laTheNguoi(t)) return "party_merge";
  if (t.item_type !== "agent_output") return "other";
  const ev = (t.evidence && typeof t.evidence === "object" ? t.evidence : {}) as { fields?: unknown; doi_chieu?: unknown };
  const fields = Array.isArray(ev.fields) ? (ev.fields as { conflict?: unknown }[]) : [];
  if (fields.some((f) => f && f.conflict === true)) return "rule_vs_ai";
  if (fields.length > 0) return "fill";
  const loai = new Set(Array.isArray(ev.doi_chieu) ? (ev.doi_chieu as { loai?: unknown }[]).map((d) => d?.loai) : []);
  for (const [l, c] of DOI_CHIEU_THU_TU) if (loai.has(l)) return c;
  return "other";
}

/** Loại thẻ để hiện nhãn và lọc: như `item_type` nhưng thẻ Người tách riêng. */
export type ReviewKind = "entity_match" | "agent_output" | "nguoi" | "other";

export function reviewKind(t: CategoryInput): ReviewKind {
  if (t.item_type === "entity_match" || t.item_type === "agent_output") return t.item_type;
  return laTheNguoi(t) ? "nguoi" : "other";
}

/** Thẻ Bổ sung tin chỉ có khối đối chiếu (không trường đề xuất): nút «Ghi phán quyết». */
function chiDoiChieu(t: CategoryInput): boolean {
  const ev = (t.evidence && typeof t.evidence === "object" ? t.evidence : {}) as { fields?: unknown; doi_chieu?: unknown };
  return !(Array.isArray(ev.fields) && ev.fields.length > 0) && Array.isArray(ev.doi_chieu) && ev.doi_chieu.length > 0;
}

/**
 * Nhãn trạng thái sau khi quyết = nhãn đáp án đã bấm (ĐC1, P2-3): một bảng cho badge danh sách, đầu sheet, chân sheet và
 * thông báo sau khi bấm. Chờ duyệt giữ một nhãn chung.
 */
const NHAN_DAP_AN: Record<ReviewKind | "doi_chieu", Record<string, string>> = {
  entity_match: { approved: "Cùng căn", rejected: "Khác căn", deferred: "Không chắc" },
  agent_output: { approved: "Đã áp", rejected: "Đã bỏ", deferred: "Để sau" },
  doi_chieu: { approved: "Đã ghi", rejected: "Đã bỏ", deferred: "Để sau" },
  nguoi: { approved: "Đã gộp", rejected: "Giữ tách", deferred: "Hoãn" },
  other: { approved: "Đã duyệt", rejected: "Từ chối", deferred: "Hoãn" },
};

/**
 * Đáp án nào còn bắt gõ lý do (OD2 · Q4): đáp án đã chọn tính là lý do, trừ «Bỏ» ở thẻ Bổ sung tin — Q4 giữ lý do gõ tay
 * cho việc bác một đề xuất ghi đè, mà thẻ chưa phân được ghi đè với điền ô trống (OD4) nên giữ cho mọi «Bỏ».
 */
export function batGoLyDo(t: CategoryInput, status: string): boolean {
  return reviewKind(t) === "agent_output" && status === "rejected";
}

export function answerLabel(t: CategoryInput, status: string): string {
  if (status === "pending") return "Chờ duyệt";
  const k = reviewKind(t);
  const bang = k === "agent_output" && chiDoiChieu(t) ? NHAN_DAP_AN.doi_chieu : NHAN_DAP_AN[k];
  return bang[status] ?? status;
}
