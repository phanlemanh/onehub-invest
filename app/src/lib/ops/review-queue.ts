/**
 * Hàng duyệt /ops/review (UI1): kiểu dữ liệu, nhãn và bộ lọc dùng chung server ↔ client.
 * Module thường (không "use client") — trang server import hàm/hằng ở đây (bẫy `"use client"`, copy-vi.md).
 *
 * Q9 (classification-enrich-review §7, Mạnh duyệt 26/10): thẻ duyệt không hiện độ tự tin. `ai_confidence`
 * vẫn nằm trong DB để hiệu chỉnh nhưng KHÔNG đi vào `ReviewItem` — số không tới được trình duyệt.
 */

/** Dòng `review_queue` như truy vấn của trang đọc ra. */
export type ReviewQueueRow = {
  id: number;
  item_type: string;
  /** Mã thẻ (`nguoi:<S0x>:<băm>` ở thẻ Người HD17); truy vấn cũ không chọn thì vắng. */
  item_id?: string | null;
  title: string;
  evidence: Record<string, unknown>;
  ai_suggestion: string | null;
  ai_reasoning: string | null;
  status: string;
  decision_note?: string | null;
  created_at: Date | string | null;
};

/** Thẻ gửi xuống client — không có `ai_confidence` (Q9). */
export type ReviewItem = {
  id: number;
  item_type: string;
  /** Có khi dòng nguồn mang mã thẻ; thẻ Người rẽ nhánh theo tiền tố `nguoi:` (HD17). */
  item_id?: string;
  title: string;
  evidence: Record<string, unknown>;
  ai_suggestion: string | null;
  ai_reasoning: string | null;
  status: string;
  /** Lý do người duyệt ghi khi quyết (PL3); null/vắng khi chưa quyết hay quyết trước PL3. */
  decision_note?: string | null;
  created_at: string | null;
};

/** Vế độ tự tin trong căn cứ LLM: basisOf (agent/src/enrich/run.ts) ghi «LLM <model> · tự tin NN% · trace …». */
const BASIS_CONFIDENCE = /\s*·\s*tự tin\s*\d+(?:[.,]\d+)?\s*%/gu;

/** Căn cứ hiện cho người duyệt, bỏ vế độ tự tin (Q9); phần còn lại (model, trace, luật) giữ nguyên văn. */
export function basisWithoutConfidence(basis: string): string {
  return basis.replace(BASIS_CONFIDENCE, "");
}

/**
 * Bỏ độ tự tin khỏi `evidence` (Q9): thẻ bổ sung tin mang `fields[].confidence` — `review_queue.ai_confidence` chính là
 * số lớn nhất trong đó (agent/src/enrich/run.ts) — và chép chính số đó vào `fields[].basis` («tự tin NN%»). Bỏ cột
 * thôi thì số vẫn tới trình duyệt, nên gọt cả hai kênh ở đây (lớp dữ liệu của /ops/review; thẻ không đổi).
 */
export function stripEvidenceConfidence(evidence: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(evidence.fields)) return evidence;
  return {
    ...evidence,
    fields: evidence.fields.map((f) => {
      if (!f || typeof f !== "object" || Array.isArray(f)) return f;
      const { confidence: _c, ...rest } = f as Record<string, unknown>;
      void _c;
      return typeof rest.basis === "string" ? { ...rest, basis: basisWithoutConfidence(rest.basis) } : rest;
    }),
  };
}

/** Dòng DB → thẻ cho client. `evidence` truyền vào đã gọt ảnh (`stripEvidenceImages`); ở đây gọt thêm độ tự tin. */
export function toReviewItem(row: ReviewQueueRow, evidence: Record<string, unknown>): ReviewItem {
  return {
    // review_queue.id là bigint — pg trả chuỗi; ép về số cho đúng kiểu (khoá media, so sánh thẻ đang mở).
    id: Number(row.id),
    item_type: row.item_type,
    ...(row.item_id ? { item_id: row.item_id } : {}),
    title: row.title,
    evidence: stripEvidenceConfidence(evidence),
    ai_suggestion: row.ai_suggestion,
    ai_reasoning: row.ai_reasoning,
    status: row.status,
    decision_note: row.decision_note ?? null,
    created_at: row.created_at === null ? null : new Date(row.created_at).toISOString(),
  };
}

/** Loại thẻ đã có giao diện duyệt; loại khác hiện mã nguyên văn. */
export const REVIEW_TYPE_LABEL: Record<string, string> = {
  entity_match: "Ghép căn",
  agent_output: "Bổ sung tin",
};

export const reviewTypeLabel = (t: string) => REVIEW_TYPE_LABEL[t] ?? t;

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  deferred: "Hoãn",
};

export const reviewStatusLabel = (s: string) => REVIEW_STATUS_LABEL[s] ?? s;

export type TypeFilter = "all" | "entity_match" | "agent_output" | "other";
export type StatusFilter = "pending" | "decided" | "all";

export const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Mọi loại" },
  { value: "entity_match", label: "Ghép căn" },
  { value: "agent_output", label: "Bổ sung tin" },
  { value: "other", label: "Loại khác" },
];

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "decided", label: "Đã quyết" },
  { value: "all", label: "Tất cả" },
];

export const DEFAULT_TYPE_FILTER: TypeFilter = "all";
export const DEFAULT_STATUS_FILTER: StatusFilter = "pending";

function matchesType(item: ReviewItem, f: TypeFilter): boolean {
  if (f === "all") return true;
  if (f === "other") return !(item.item_type in REVIEW_TYPE_LABEL);
  return item.item_type === f;
}

function matchesStatus(item: ReviewItem, f: StatusFilter): boolean {
  if (f === "all") return true;
  return f === "pending" ? item.status === "pending" : item.status !== "pending";
}

/** Thẻ khớp cả hai bộ lọc, mới nhất trước (created_at giảm dần, rồi id giảm dần). */
export function filterReviewItems(items: ReviewItem[], type: TypeFilter, status: StatusFilter): ReviewItem[] {
  return items
    .filter((i) => matchesType(i, type) && matchesStatus(i, status))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "") || b.id - a.id);
}
