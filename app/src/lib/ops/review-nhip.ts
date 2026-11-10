/**
 * Nhịp duyệt (OD1 · ĐC6): giây/thẻ theo hạng mục từ dòng `ops_audit` `review.decide` mà route decide ghi kèm đo.
 * Chỉ ở máy thu (hàng duyệt là bảng local). Một truy vấn; thẻ chờ theo hạng mục đếm ở trang từ danh sách đã tải.
 */
import { pool } from "@/lib/db";
import { REVIEW_CATEGORIES, reviewCategory, type CategoryInput, type ReviewCategory } from "./review-hang-muc";

/** Lượt mở thẻ dài hơn trần này không vào trung vị — đếm riêng (Hỏi-2: người rời máy khi thẻ còn mở). */
export const NHIP_TRAN_GIAY = 30 * 60;
/** Cửa sổ đo mặc định. */
export const NHIP_SO_NGAY = 7;

export type NhipHangMuc = {
  category: ReviewCategory;
  /** Lượt quyết có đo, trong trần. */
  n: number;
  /** Trung vị giây/thẻ của các lượt trong trần; null khi n = 0. */
  medianSeconds: number | null;
  /** Lượt có đo nhưng dài hơn trần. */
  overCap: number;
  /** Trung vị giây giữa hai lượt quyết của cùng người (≤ trần); null khi không lượt nào có số này. */
  medianSincePrev: number | null;
};

const motChuSo = (v: number | string | null) => (v === null ? null : Math.round(Number(v) * 10) / 10);

/** Mã hạng mục lạ trong dòng audit (đời sau thêm mã) gộp về «other» thay vì làm rơi số. */
const maHopLe = (c: string | null): ReviewCategory =>
  (REVIEW_CATEGORIES as readonly string[]).includes(c ?? "") ? (c as ReviewCategory) : "other";

export const NHIP_SQL = `
  SELECT detail->>'category' AS category,
         count(*) FILTER (WHERE (detail->>'seconds')::numeric <= $2)::int AS n,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY (detail->>'seconds')::numeric)
           FILTER (WHERE (detail->>'seconds')::numeric <= $2) AS median,
         count(*) FILTER (WHERE (detail->>'seconds')::numeric > $2)::int AS over_cap,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY (detail->>'since_prev_seconds')::numeric)
           FILTER (WHERE jsonb_typeof(detail->'since_prev_seconds') = 'number'
                     AND (detail->>'since_prev_seconds')::numeric <= $2) AS median_prev
    FROM ops_audit
   WHERE action = 'review.decide'
     AND at > now() - make_interval(days => $1)
     AND (jsonb_typeof(detail->'seconds') = 'number' OR jsonb_typeof(detail->'since_prev_seconds') = 'number')
   GROUP BY 1`;

/** Số nhịp theo hạng mục trong `days` ngày gần nhất; hạng mục không có lượt đo nào thì vắng. */
export async function loadReviewPace(days = NHIP_SO_NGAY, q: Pick<typeof pool, "query"> = pool): Promise<NhipHangMuc[]> {
  // Bảng nhật ký vắng (lược đồ chưa có ops_audit) → không có lượt đo, không làm sập vùng hàng duyệt.
  const { rows: [bang] } = await q.query<{ r: string | null }>(`SELECT to_regclass('ops_audit')::text AS r`);
  if (!bang?.r) return [];
  const { rows } = await q.query<{ category: string | null; n: number; median: number | string | null; over_cap: number; median_prev: number | string | null }>(
    NHIP_SQL,
    [days, NHIP_TRAN_GIAY],
  );
  const gop = new Map<ReviewCategory, NhipHangMuc>();
  for (const r of rows) {
    const c = maHopLe(r.category);
    const cu = gop.get(c);
    const median = motChuSo(r.median);
    const medianPrev = motChuSo(r.median_prev);
    // Hai mã lạ cùng gộp về other: giữ trung vị của nhóm đông hơn (hiếm; không tính lại trung vị chung).
    if (!cu || r.n > cu.n) {
      gop.set(c, { category: c, n: (cu?.n ?? 0) + r.n, medianSeconds: median, overCap: (cu?.overCap ?? 0) + r.over_cap, medianSincePrev: medianPrev ?? cu?.medianSincePrev ?? null });
    } else gop.set(c, { ...cu, n: cu.n + r.n, overCap: cu.overCap + r.over_cap });
  }
  return REVIEW_CATEGORIES.flatMap((c) => (gop.has(c) ? [gop.get(c)!] : []));
}

/** Một hàng của bảng «Nhịp duyệt 7 ngày». */
export type HangNhip = NhipHangMuc & { pending: number };

/**
 * Ghép số đo với thẻ chờ theo hạng mục: một hàng mỗi hạng mục có thẻ chờ hoặc có lượt đo (kể cả chỉ lượt vượt trần), theo
 * thứ tự bảng hạng mục.
 */
export function hangNhip(pace: NhipHangMuc[], pending: CategoryInput[]): HangNhip[] {
  const cho = new Map<ReviewCategory, number>();
  for (const t of pending) cho.set(reviewCategory(t), (cho.get(reviewCategory(t)) ?? 0) + 1);
  const theoMa = new Map(pace.map((p) => [p.category, p]));
  return REVIEW_CATEGORIES.flatMap((c) => {
    const p = theoMa.get(c);
    const n = cho.get(c) ?? 0;
    if (!p && n === 0) return [];
    return [{ category: c, n: p?.n ?? 0, medianSeconds: p?.medianSeconds ?? null, overCap: p?.overCap ?? 0, medianSincePrev: p?.medianSincePrev ?? null, pending: n }];
  });
}
