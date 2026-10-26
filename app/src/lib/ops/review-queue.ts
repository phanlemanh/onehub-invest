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
  title: string;
  evidence: Record<string, unknown>;
  ai_suggestion: string | null;
  ai_reasoning: string | null;
  status: string;
  created_at: Date | string | null;
};

/** Thẻ gửi xuống client — không có `ai_confidence` (Q9). */
export type ReviewItem = {
  id: number;
  item_type: string;
  title: string;
  evidence: Record<string, unknown>;
  ai_suggestion: string | null;
  ai_reasoning: string | null;
  status: string;
  created_at: string | null;
};

/** Dòng DB → thẻ cho client. `evidence` truyền vào đã gọt ảnh (`stripEvidenceImages`). */
export function toReviewItem(row: ReviewQueueRow, evidence: Record<string, unknown>): ReviewItem {
  return {
    id: row.id,
    item_type: row.item_type,
    title: row.title,
    evidence,
    ai_suggestion: row.ai_suggestion,
    ai_reasoning: row.ai_reasoning,
    status: row.status,
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
