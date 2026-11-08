/**
 * Hàng duyệt /ops/review (UI1): kiểu dữ liệu, nhãn và bộ lọc dùng chung server ↔ client.
 * Module thường (không "use client") — trang server import hàm/hằng ở đây (bẫy `"use client"`, copy-vi.md).
 *
 * Q9 (classification-enrich-review §7, Mạnh duyệt 26/10): thẻ duyệt không hiện độ tự tin. `ai_confidence`
 * vẫn nằm trong DB để hiệu chỉnh nhưng KHÔNG đi vào `ReviewItem` — số không tới được trình duyệt.
 */
import { answerLabel, reviewKind, type CategoryInput, type ReviewKind } from "./review-hang-muc";

/** Dòng `review_queue` như truy vấn của trang đọc ra. */
export type ReviewQueueRow = {
  id: number;
  item_type: string;
  /** Khoá dòng nguồn của thẻ (`nguoi:<S0x>:<băm>` ở thẻ Người HD17, `pair:<A>|<B>` ở thẻ Ghép căn); truy vấn cũ không chọn thì vắng. */
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

/** Vế điểm trong tiêu đề («(score 0.93)», «score 0.5») — judge-run ghi vào cột title; không tới trình duyệt (Q9, RV-L04). */
const TITLE_SCORE = /\s*\(?\s*score\s*[:=]?\s*\d+(?:[.,]\d+)?\s*\)?/giu;

const soDt = (v: unknown): string | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? String(Math.round(n * 10) / 10).replace(".", ",") : null;
};
const chu = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

/**
 * Tiêu đề hiện cho người duyệt (OD1 · ĐC2, P1-1): thẻ Ghép căn dựng lại từ `evidence` — «Cùng căn? <phường> · 80 m² và 84 m²»,
 * phường lấy tên có dấu của Tin B rồi tới Tin A; thiếu dữ liệu thì giữ tiêu đề gốc. Mọi tiêu đề gọt vế «score <số>».
 * Cột `title` trong DB giữ nguyên (cùng cách Q9 giữ ai_confidence để hiệu chỉnh).
 */
export function reviewTitle(row: Pick<ReviewQueueRow, "item_type" | "title" | "evidence">): string {
  const goc = row.title.replace(TITLE_SCORE, "").trim();
  if (row.item_type !== "entity_match") return goc;
  const ev = (row.evidence ?? {}) as { offer_a?: Record<string, unknown>; offer_b?: Record<string, unknown> };
  const a = soDt(ev.offer_a?.area_m2);
  const b = soDt(ev.offer_b?.area_m2);
  const phuong = chu(ev.offer_b?.phuong) ?? chu(ev.offer_a?.phuong);
  if (!a || !b || !phuong) return goc;
  return `Cùng căn? ${phuong} · ${a} m² và ${b} m²`;
}

/** Bỏ điểm Stage B khỏi evidence (Q9, RV-L04): thẻ Ghép căn mang `stage_b_score` từ judge-run. */
export function stripEvidenceScore(evidence: Record<string, unknown>): Record<string, unknown> {
  if (!("stage_b_score" in evidence)) return evidence;
  const { stage_b_score: _s, ...rest } = evidence;
  void _s;
  return rest;
}

/** Dòng DB → thẻ cho client. `evidence` truyền vào đã gọt ảnh (`stripEvidenceImages`); ở đây gọt thêm độ tự tin và điểm. */
export function toReviewItem(row: ReviewQueueRow, evidence: Record<string, unknown>): ReviewItem {
  return {
    // review_queue.id là bigint — pg trả chuỗi; ép về số cho đúng kiểu (khoá media, so sánh thẻ đang mở).
    id: Number(row.id),
    item_type: row.item_type,
    ...(row.item_id ? { item_id: row.item_id } : {}),
    title: reviewTitle(row),
    evidence: stripEvidenceScore(stripEvidenceConfidence(evidence)),
    ai_suggestion: row.ai_suggestion,
    ai_reasoning: row.ai_reasoning,
    status: row.status,
    decision_note: row.decision_note ?? null,
    created_at: row.created_at === null ? null : new Date(row.created_at).toISOString(),
  };
}

/** Loại thẻ đã có giao diện duyệt (theo `reviewKind`: thẻ Người tách khỏi `data_quality`); loại khác hiện mã nguyên văn. */
export const REVIEW_TYPE_LABEL: Record<Exclude<ReviewKind, "other">, string> = {
  entity_match: "Ghép căn",
  agent_output: "Bổ sung tin",
  nguoi: "Người",
};

/** Nhãn loại của một thẻ; loại chưa có giao diện → null (badge hiện mã nguyên văn). */
export function reviewTypeLabel(item: CategoryInput): string | null {
  const k = reviewKind(item);
  return k === "other" ? null : REVIEW_TYPE_LABEL[k];
}

/** Nhãn trạng thái của một thẻ: chờ → «Chờ duyệt»; đã quyết → nhãn đáp án đã bấm (OD1 · ĐC1). */
export const reviewStatusLabel = (item: CategoryInput & { status: string }) => answerLabel(item, item.status);

export type TypeFilter = "all" | ReviewKind;
export type StatusFilter = "pending" | "decided" | "all";

export const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Mọi loại" },
  { value: "entity_match", label: "Ghép căn" },
  { value: "agent_output", label: "Bổ sung tin" },
  { value: "nguoi", label: "Người" },
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
  return f === "all" || reviewKind(item) === f;
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
