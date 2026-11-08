/**
 * Ba số đầu trang /ops/review (OD2 · ĐC3): Chờ duyệt · Quá 3 ngày · Đã quyết hôm nay. Một truy vấn trên `review_queue`;
 * «hôm nay» theo giờ Việt Nam (cổng Ops ở Hà Nội), không theo giờ UTC của máy chủ. Chỉ ở máy thu.
 */
import { pool } from "@/lib/db";

export type DauTrang = { cho: number; quaHan: number; homNay: number };

/** Mốc «quá hạn» của thẻ chờ, theo giờ tạo thẻ. */
export const QUA_HAN_GIO = 72;

export const DAU_TRANG_SQL = `
  SELECT count(*) FILTER (WHERE status = 'pending')::int AS cho,
         count(*) FILTER (WHERE status = 'pending' AND created_at < now() - make_interval(hours => $1))::int AS qua_han,
         count(*) FILTER (WHERE decided_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
                                               AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int AS hom_nay
    FROM review_queue`;

/** Ba số; bảng `review_queue` vắng (lược đồ cloud) → null, trang không hiện ba số. */
export async function loadDauTrang(q: Pick<typeof pool, "query"> = pool): Promise<DauTrang | null> {
  const { rows: [bang] } = await q.query<{ r: string | null }>(`SELECT to_regclass('review_queue')::text AS r`);
  if (!bang?.r) return null;
  const { rows: [r] } = await q.query<{ cho: number; qua_han: number; hom_nay: number }>(DAU_TRANG_SQL, [QUA_HAN_GIO]);
  return { cho: r?.cho ?? 0, quaHan: r?.qua_han ?? 0, homNay: r?.hom_nay ?? 0 };
}
