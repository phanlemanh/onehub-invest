import { KIND, PROPERTY_TYPE } from "./vocab.generated";

/**
 * Tin rao trên cổng Invest — phần thuần (không "use client", không chạm DB): hằng số, kiểu, đọc bộ lọc từ query string.
 * Component client và trang server đều import được; truy vấn nằm ở `offers-public.ts`.
 */

/** Nguồn không bao giờ hiển thị (AGENTS.md luật 5). */
export const OFFER_HIDDEN_SOURCES = ["S02", "S08"] as const;
/** Trần hiển thị: đo 02/11 có 8 tin trên 30 tầng và 3 tin mặt tiền trên 100 m, nghi bóc sai nên thẻ không hiện. */
export const OFFER_MAX_STORIES = 30;
export const OFFER_MAX_FRONTAGE_M = 100;
/** Chia hết cho 2, 3, 4 cột nên hàng cuối của lưới thẻ không lẻ. */
export const OFFERS_PAGE_SIZE = 24;
export const OFFERS_MAX_LIMIT = 50;
/** Chặn phân trang sâu: quá mốc này người dùng thu hẹp bộ lọc, không cào hết kho bằng offset. */
export const OFFERS_MAX_OFFSET = 960;
/** Một tài khoản đứng từ ngần này tên trở lên thì tên trên tin không chỉ một người — không hiện như tên người. */
export const OFFER_MANY_NAMES = 3;
/** Tin cập nhật trong cửa sổ này mới hiện. */
export const OFFER_RECENT_DAYS = 30;
/** Giá dưới sàn hoặc từ trần là gõ nhầm đơn vị hay giá theo m²: ẩn, không sửa gốc (đo 02/11: 137 tin). */
export const OFFER_SALE_MIN_VND = 500_000_000;
export const OFFER_RENT_MIN_VND = 500_000;
export const OFFER_RENT_MAX_VND = 500_000_000;

/** Ba loại của Listing (ROADMAP §3 mục 21); dữ liệu còn ở hai bảng, `rent_st` chưa có trong bộ mã của `sale_offers`. */
export const LISTING_KIND = { sale: KIND.sale, rent_lt: KIND.rent_lt, rent_st: "rent_st" } as const;
export type ListingKind = (typeof LISTING_KIND)[keyof typeof LISTING_KIND];
export const isListingKind = (v: string | null | undefined): v is ListingKind =>
  v === LISTING_KIND.sale || v === LISTING_KIND.rent_lt || v === LISTING_KIND.rent_st;

export type OfferSort = "newest" | "price-asc" | "price-desc" | "perm2-asc";
export const OFFER_SORTS: readonly OfferSort[] = ["newest", "price-asc", "price-desc", "perm2-asc"];

export type OfferFilters = {
  kind: typeof KIND.sale | typeof KIND.rent_lt;
  wards: string[];
  types: string[];
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  bedroomsMin: number | null;
  hasPhone: boolean;
  sort: OfferSort;
  limit: number;
  offset: number;
};

export type PublicOffer = {
  offerId: string;
  kind: string;
  propertyType: string;
  priceVnd: number;
  areaM2: number;
  pricePerm2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** Số tầng; giá trị phi lý về null. */
  stories: number | null;
  /** Mặt tiền, mét; giá trị phi lý về null. */
  frontageLength: number | null;
  ward: { id: string; name: string };
  street: string | null;
  sellerName: string | null;
  sellerManyNames: boolean;
  hasPhone: boolean;
  updatedAt: string;
  /** Số ngày từ lần đầu hệ thống thấy tin, theo ngày VN. Không phải ngày đăng gốc. */
  firstSeenDays: number;
};

export type OfferWard = { id: string; name: string; n: number };

// Số quá cỡ (kể cả gõ nhầm thêm số 0) bỏ qua như chữ: Postgres báo lỗi nếu vượt kiểu cột, cả trang đổ theo.
const positive = (v: string | null, max = Number.MAX_SAFE_INTEGER): number | null => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) && n > 0 && n <= max ? n : null;
};
/** Số nguyên từ 1 trở lên, số lẻ làm tròn xuống; dưới 1 bỏ qua, nên `page=0.5` không thành OFFSET âm. */
const whole = (v: string | null, max?: number): number | null => {
  const n = positive(v, max);
  return n !== null && n >= 1 ? Math.floor(n) : null;
};
const INT4_MAX = 2_147_483_647;
const list = (v: string | null): string[] => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []);

/** Đọc bộ lọc từ query string. Giá trị sai bỏ qua; `limit`, `offset` luôn nằm trong trần. */
export function parseOfferFilters(q: URLSearchParams): OfferFilters {
  const sort = q.get("sort") as OfferSort | null;
  const limit = whole(q.get("limit")) ?? OFFERS_PAGE_SIZE;
  const page = whole(q.get("page")) ?? 1;
  const offset = q.has("offset") ? (whole(q.get("offset")) ?? 0) : (page - 1) * OFFERS_PAGE_SIZE;
  const types = new Set<string>(Object.values(PROPERTY_TYPE).filter((t) => t !== PROPERTY_TYPE.unknown));
  return {
    kind: q.get("kind") === KIND.rent_lt ? KIND.rent_lt : KIND.sale,
    wards: list(q.get("ward") ?? q.get("area")),
    types: list(q.get("type")).filter((t) => types.has(t)),
    priceMin: whole(q.get("price_min")),
    priceMax: whole(q.get("price_max")),
    areaMin: positive(q.get("area_min")),
    areaMax: positive(q.get("area_max")),
    bedroomsMin: whole(q.get("bedrooms"), INT4_MAX),
    hasPhone: q.get("has_phone") === "1",
    sort: sort && OFFER_SORTS.includes(sort) ? sort : "newest",
    limit: Math.min(OFFERS_MAX_LIMIT, limit),
    offset: Math.min(OFFERS_MAX_OFFSET, offset),
  };
}
