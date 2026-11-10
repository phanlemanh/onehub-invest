/**
 * ĐÓNG BĂNG (V7, `review-dong-bang.ts`): thẻ Ghép căn đang chờ không còn hiện ở hàng duyệt, nên không căn nào được báo «đang
 * chờ ghép» — `loadPendingUnitMatches` trả rỗng, không truy vấn. Câu `CHO_GHEP_SQL` giữ lại cho lúc gỡ đóng băng.
 *
 * Căn đang chờ ghép (OD1 · ĐC7, P1-11): căn ở Căn giá tốt là Tin A hay Tin B của một thẻ Ghép căn còn chờ ở hàng duyệt —
 * người gọi điện phải biết căn có thể là một căn trùng. Chỉ máy thu có `review_queue`; vắng bảng (cloud) → không căn nào.
 */
import { pool } from "@/lib/db";

/** Ghép căn đóng băng (V7): thẻ chờ không hiện ở hàng duyệt, nên không báo căn nào. */
export const GHEP_CAN_DONG_BANG = true;

/** offerId → mã thẻ Ghép căn còn chờ (cũ nhất trước). Căn không có thẻ chờ thì vắng khoá. */
export type ChoGhep = Record<string, number[]>;

export const CHO_GHEP_SQL = `
  SELECT id::bigint AS id, split_part(substr(item_id, 6), '|', 1) AS a, split_part(item_id, '|', 2) AS b
    FROM review_queue
   WHERE item_type = 'entity_match' AND status = 'pending'
     AND item_id ~ '^pair:[^|[:space:]]+\\|[^|[:space:]]+$'
     AND (split_part(substr(item_id, 6), '|', 1) = ANY($1) OR split_part(item_id, '|', 2) = ANY($1))
   ORDER BY created_at, id`;

export async function loadPendingUnitMatches(offerIds: string[], q: Pick<typeof pool, "query"> = pool): Promise<ChoGhep> {
  if (offerIds.length === 0 || GHEP_CAN_DONG_BANG) return {};
  const { rows: [bang] } = await q.query<{ r: string | null }>(`SELECT to_regclass('review_queue')::text AS r`);
  if (!bang?.r) return {};
  const { rows } = await q.query<{ id: string | number; a: string; b: string }>(CHO_GHEP_SQL, [offerIds]);
  const can = new Set(offerIds);
  const out: ChoGhep = {};
  for (const r of rows) {
    for (const o of new Set([r.a, r.b])) {
      if (can.has(o)) (out[o] ??= []).push(Number(r.id));
    }
  }
  return out;
}
