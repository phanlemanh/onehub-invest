/**
 * Bộ nạp của /ops/review (tách khỏi review-content.tsx ở OD1 để test chạy được trên lược đồ tạm): đọc MỌI thẻ của
 * `review_queue` (kể cả đã quyết, không LIMIT) — liên kết sâu `?card=<id>` phải mở được cả thẻ cũ đã quyết.
 * review_queue là tầng A, chỉ local; nhánh cloud và viewer dừng trước khi tới đây.
 */
import type { User } from "@/lib/auth";
import { pool } from "@/lib/db";
import { loadReviewContext } from "./review-context";
import { loadReviewMedia, stripEvidenceImages } from "./review-media";
import { toReviewItem, type ReviewQueueRow } from "./review-queue";

/** Câu đọc hàng duyệt. Không chọn ai_confidence — Q9: số không tới trình duyệt. */
export const REVIEW_QUEUE_SQL = `SELECT id, item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, status, decision_note, created_at
     FROM review_queue ORDER BY created_at DESC, id DESC`;

export async function loadReviewQueue(user: User) {
  const { rows } = await pool.query<ReviewQueueRow>(REVIEW_QUEUE_SQL);
  // URL ảnh không đi trong evidence — ảnh tới thẻ chỉ qua loadReviewMedia (admin).
  const items = rows.map((r) => toReviewItem(r, stripEvidenceImages(r.evidence)));
  // Ảnh tin: ảnh đã tải cho vai Vận hành, URL gốc chỉ admin (PL3); một truy vấn cho cả hàng duyệt.
  // Toàn văn + căn cứ từng trường (PL3): một truy vấn.
  const [media, context] = await Promise.all([loadReviewMedia(rows, user), loadReviewContext(rows)]);
  return { items, media, context };
}
