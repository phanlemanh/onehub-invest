/**
 * Quyết định gần đây (OD2 · ĐC5): 20 lượt `review.decide` mới nhất trong 7 ngày của CHÍNH người đang duyệt (Hỏi-3),
 * đọc `ops_audit` mà route decide ghi cùng giao dịch, nối `review_queue` lấy tiêu đề. Chỉ ở máy thu.
 */
import { pool } from "@/lib/db";
import { answerLabel } from "./review-hang-muc";
import { reviewTitle } from "./review-queue";

export const GAN_DAY_TOI_DA = 20;
export const GAN_DAY_SO_NGAY = 7;

export type QuyetGanDay = {
  /** Mã thẻ (review_queue.id). */
  id: number;
  title: string;
  /** Nhãn đáp án đã bấm (cùng bảng với badge hàng duyệt). */
  nhan: string;
  /** Lý do đã ghi; dòng audit đời trước có thể vắng. */
  lyDo: string | null;
  at: string;
};

/** Actor của dòng audit route decide ghi cho một người dùng — cùng chuỗi `kiemQuyen` trả (`user:<id>`). */
export const actorCua = (userId: number | string) => `user:${userId}`;

export const GAN_DAY_SQL = `
  SELECT a.detail->>'reviewId' AS id, a.detail->>'to' AS status, a.detail->>'ly_do' AS ly_do, a.at,
         q.item_type, q.item_id, q.title, q.evidence
    FROM ops_audit a
    JOIN review_queue q ON q.id = (a.detail->>'reviewId')::bigint
   WHERE a.action = 'review.decide' AND a.actor = $1
     AND a.at > now() - make_interval(days => $2)
     AND jsonb_typeof(a.detail->'reviewId') = 'number'
   ORDER BY a.at DESC, a.id DESC
   LIMIT $3`;

type Dong = {
  id: string; status: string; ly_do: string | null; at: Date | string;
  item_type: string; item_id: string | null; title: string; evidence: Record<string, unknown> | null;
};

export async function loadRecentDecisions(actor: string, q: Pick<typeof pool, "query"> = pool): Promise<QuyetGanDay[]> {
  // Lược đồ thiếu một trong hai bảng (cloud, lược đồ thử) → không có lượt nào, không làm sập vùng hàng duyệt.
  const { rows: [bang] } = await q.query<{ a: string | null; r: string | null }>(
    `SELECT to_regclass('ops_audit')::text AS a, to_regclass('review_queue')::text AS r`,
  );
  if (!bang?.a || !bang?.r) return [];
  const { rows } = await q.query<Dong>(GAN_DAY_SQL, [actor, GAN_DAY_SO_NGAY, GAN_DAY_TOI_DA]);
  return rows.map((r) => {
    const the = { item_type: r.item_type, ...(r.item_id ? { item_id: r.item_id } : {}), evidence: r.evidence ?? {} };
    return {
      id: Number(r.id),
      title: reviewTitle({ item_type: r.item_type, title: r.title, evidence: r.evidence ?? {} }),
      nhan: answerLabel(the, r.status),
      lyDo: r.ly_do,
      at: (r.at instanceof Date ? r.at : new Date(r.at)).toISOString(),
    };
  });
}
