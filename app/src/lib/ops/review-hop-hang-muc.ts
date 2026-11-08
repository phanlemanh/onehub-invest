/**
 * Hộp hạng mục (OD2 · ĐC3) và thứ tự thẻ của chế độ duyệt (ĐC4). Hàm thuần — trang và test dùng chung.
 */
import { REVIEW_CATEGORIES, REVIEW_CATEGORY_LABEL, reviewCategory, type ReviewCategory } from "./review-hang-muc";
import type { NhipHangMuc } from "./review-nhip";
import type { ReviewItem } from "./review-queue";

/** Mục «Tất cả» của hộp; không phải mã Hạng mục duyệt. */
export const TAT_CA = "all" as const;
export type HopChon = ReviewCategory | typeof TAT_CA;

export type MucHop = {
  ma: ReviewCategory;
  nhan: string;
  /** Số thẻ chờ của hạng mục. */
  cho: number;
  /** Tuổi thẻ chờ cũ nhất, ngày tròn xuống; null khi thẻ không có giờ tạo. */
  cuNhatNgay: number | null;
  /** Trung vị giây ở thẻ 7 ngày (OD1); null khi chưa có lượt đo. */
  trungViGiay: number | null;
};

const NGAY_MS = 24 * 60 * 60 * 1000;

/** `?category=` → mã hạng mục; vắng hay lạ → «Tất cả». */
export function docCategory(raw: string | null | undefined): HopChon {
  return (REVIEW_CATEGORIES as readonly string[]).includes(raw ?? "") ? (raw as ReviewCategory) : TAT_CA;
}

/** Mỗi hạng mục đang có thẻ chờ một mục, theo thứ tự `REVIEW_CATEGORIES` (không theo số chờ). */
export function hopHangMuc(items: ReviewItem[], pace: NhipHangMuc[], now = Date.now()): MucHop[] {
  const cho = new Map<ReviewCategory, ReviewItem[]>();
  for (const i of items) {
    if (i.status !== "pending") continue;
    const c = reviewCategory(i);
    cho.set(c, [...(cho.get(c) ?? []), i]);
  }
  const trungVi = new Map(pace.map((p) => [p.category, p.medianSeconds]));
  return REVIEW_CATEGORIES.filter((c) => cho.has(c)).map((c) => {
    const ds = cho.get(c)!;
    const moc = ds.map((i) => (i.created_at ? Date.parse(i.created_at) : NaN)).filter(Number.isFinite);
    return {
      ma: c,
      nhan: REVIEW_CATEGORY_LABEL[c],
      cho: ds.length,
      cuNhatNgay: moc.length > 0 ? Math.floor((now - Math.min(...moc)) / NGAY_MS) : null,
      trungViGiay: trungVi.get(c) ?? null,
    };
  });
}

/** Thẻ khớp mục đang chọn (mọi trạng thái); «Tất cả» → mọi thẻ. */
export function locTheoHop(items: ReviewItem[], chon: HopChon): ReviewItem[] {
  return chon === TAT_CA ? items : items.filter((i) => reviewCategory(i) === chon);
}

/**
 * Hàng thẻ của chế độ duyệt: thẻ chờ của mục đang chọn, cũ nhất trước (Hỏi-1), trừ thẻ đang nằm trong hàng chờ gửi
 * (đã bấm, chưa hết 5 giây). Thẻ không có giờ tạo xếp cuối, rồi theo id.
 */
export function hangDuyet(items: ReviewItem[], chon: HopChon, dangGui: ReadonlySet<number> = new Set()): ReviewItem[] {
  const t = (i: ReviewItem) => (i.created_at ? Date.parse(i.created_at) : Number.POSITIVE_INFINITY);
  return locTheoHop(items, chon)
    .filter((i) => i.status === "pending" && !dangGui.has(i.id))
    .sort((a, b) => t(a) - t(b) || a.id - b.id);
}

/** Mục kế còn thẻ chờ sau `chon` theo thứ tự hộp; không còn → null. «Tất cả» không có mục kế. */
export function mucKe(hop: MucHop[], chon: HopChon, conCho: (c: ReviewCategory) => boolean): MucHop | null {
  if (chon === TAT_CA) return null;
  const i = hop.findIndex((m) => m.ma === chon);
  return [...hop.slice(i + 1), ...hop.slice(0, Math.max(i, 0))].find((m) => m.ma !== chon && conCho(m.ma)) ?? null;
}
