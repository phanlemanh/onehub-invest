/**
 * Listing (tin rao: bán, thuê dài hạn, thuê ngắn hạn) — danh sách khoá DUY NHẤT của phần tử `/v1/listings` (PB2,
 * `_acceptance/data-api-hop-dong-reso-dd-2-1`). Route dựng phần tử từ đây, `/openapi.json` sinh schema từ đây, test so mọi
 * khoá trả về với đây.
 *
 * Một Listing của OneHub = một bản ghi của resource `Property` trong RESO Data Dictionary 2.1 (RESO gọi tin rao là
 * Property; danh bạ nhà của OneHub là `/v1/properties`, khác nghĩa). Thêm khoá: tra DD 2.1 trước; không có tương đương mới
 * là extension, và extension phải có mục `api_extensions.listing` trong `pipeline/mappings.yaml`.
 */

export type KhoaListing = {
  key: string;
  resource: "Property" | "extension";
  ddField?: string;
  type: "string" | "integer" | "number" | "object" | "array";
  /** Lookup DD mà giá trị là StandardName. */
  lookup?: string;
  why: string;
};

export const LISTING_KEYS: readonly KhoaListing[] = [
  { key: "listingKey", resource: "Property", ddField: "ListingKey", type: "string", why: "khoá mờ: offer_id (băm sẵn) hoặc HMAC có khoá trên S01|id" },
  { key: "kind", resource: "extension", type: "string", why: "loại tin sale · rent_lt · rent_st — bộ lọc chính" },
  { key: "originatingSystemName", resource: "Property", ddField: "OriginatingSystemName", type: "string", why: "mã nguồn S0x; giá trị khác mẫu S + hai chữ số trả null" },
  { key: "propertyType", resource: "Property", ddField: "PropertyType", type: "string", lookup: "PropertyType", why: "bảng loại hình design §3" },
  { key: "propertySubType", resource: "Property", ddField: "PropertySubType", type: "string", lookup: "PropertySubType", why: "bảng loại hình design §3; Room là giá trị local (migration 025)" },
  { key: "listPrice", resource: "Property", ddField: "ListPrice", type: "number", why: "giá bán (VND)" },
  { key: "leaseAmount", resource: "Property", ddField: "LeaseAmount", type: "number", why: "giá thuê (VND) theo leaseAmountFrequency" },
  { key: "leaseAmountFrequency", resource: "Property", ddField: "LeaseAmountFrequency", type: "string", lookup: "FeeFrequency", why: "Monthly cho thuê dài hạn, Daily cho thuê ngắn hạn" },
  { key: "livingArea", resource: "Property", ddField: "LivingArea", type: "number", why: "diện tích sử dụng" },
  { key: "livingAreaUnits", resource: "Property", ddField: "LivingAreaUnits", type: "string", lookup: "AreaUnits", why: "Square Meters khi có diện tích" },
  { key: "salePricePerArea", resource: "Property", ddField: "SalePricePerArea", type: "number", why: "giá/m² tin bán" },
  { key: "leasePricePerArea", resource: "Property", ddField: "LeasePricePerArea", type: "number", why: "giá/m² tin thuê dài hạn" },
  { key: "pricePerAreaUnit", resource: "Property", ddField: "PricePerAreaUnit", type: "string", lookup: "AreaUnits", why: "Square Meters khi có giá/m²" },
  { key: "bedroomsTotal", resource: "Property", ddField: "BedroomsTotal", type: "integer", why: "số phòng ngủ" },
  { key: "bathroomsTotalInteger", resource: "Property", ddField: "BathroomsTotalInteger", type: "integer", why: "số WC (ngắn hạn: làm tròn lên)" },
  { key: "city", resource: "Property", ddField: "City", type: "string", why: "tên phường/xã (ADR-0013 §4)" },
  { key: "mlsAreaMinor", resource: "Property", ddField: "MLSAreaMinor", type: "string", why: "mã phường của cây khu vực" },
  { key: "mlsAreaMajor", resource: "Property", ddField: "MLSAreaMajor", type: "string", why: "mã thị trường của cây khu vực" },
  { key: "latitude", resource: "Property", ddField: "Latitude", type: "number", why: "vĩ độ" },
  { key: "longitude", resource: "Property", ddField: "Longitude", type: "number", why: "kinh độ" },
  { key: "onMarketTimestamp", resource: "Property", ddField: "OnMarketTimestamp", type: "string", why: "lần đầu thấy tin (first_seen → OnMarketTimestamp, ADR-0013)" },
  { key: "media", resource: "Property", ddField: "Media", type: "array", why: "luôn null: ảnh tin bán/thuê mang tên nguồn, URL ảnh ngắn hạn có thể mang số phòng nguồn (PB4)" },
  { key: "lastSeenTimestamp", resource: "extension", type: "string", why: "lần cuối thấy tin — không cùng nghĩa ModificationTimestamp" },
  { key: "confidence", resource: "extension", type: "string", why: "độ tin của tin (high · medium · low)" },
  { key: "repostCount", resource: "extension", type: "integer", why: "số lần đăng lại" },
  { key: "listingTitle", resource: "extension", type: "string", why: "tên listing thuê ngắn hạn" },
  { key: "spaceType", resource: "extension", type: "string", why: "nguyên căn / phòng riêng / phòng chung — không dùng roomType (trùng RoomType của DD)" },
  { key: "accommodates", resource: "extension", type: "integer", why: "số khách tối đa" },
  { key: "minimumNights", resource: "extension", type: "integer", why: "số đêm tối thiểu" },
  { key: "reviewCount", resource: "extension", type: "integer", why: "số đánh giá" },
  { key: "occupancyRate", resource: "extension", type: "number", why: "tỉ lệ đêm không trống (%) trên lịch" },
  { key: "averageDailyRevenue", resource: "extension", type: "number", why: "giá trung bình mỗi đêm đã đặt" },
  { key: "belowMedianPct", resource: "extension", type: "number", why: "% thấp hơn trung vị nhóm so sánh (căn giá tốt)" },
  { key: "comparableMedianPricePerArea", resource: "extension", type: "number", why: "trung vị giá/m² của nhóm so sánh" },
  { key: "priceRank", resource: "extension", type: "object", why: "khối hạng giá (cấp, nút, n, trung vị, p20, hạng %, nhãn…) khi có bảng hạng" },
];

export const LISTING_KEY_NAMES = LISTING_KEYS.map((k) => k.key);

/** Khoá của khối priceRank (giữ nguyên các khoá con của khối rank cũ). */
export const PRICE_RANK_KEYS = ["level", "node", "n", "median", "p20", "percentile", "label", "needsVerification", "metric", "bedroomsGroup", "reason"] as const;

type LoaiHinh = { propertyType: string | null; propertySubType: string | null };
const TRONG: LoaiHinh = { propertyType: null, propertySubType: null };

/** Bảng loại hình design §3: loại nội bộ → [PropertyType bán, PropertyType thuê dài hạn, PropertySubType bán, SubType thuê]
 *  (StandardName DD 2.1; null = ô không có loại chuẩn). unknown, null, giá trị lạ: «chưa biết» không gửi ra API. */
const BANG_LOAI_HINH: Readonly<Record<string, readonly [string | null, string | null, string | null, string | null]>> = {
  apartment: ["Residential", "Residential Lease", "Condominium", "Condominium"],
  house: ["Residential", "Residential Lease", null, null], // Townhouse / Single Family Residence chưa phân biệt (khung §7, Q7)
  land: ["Land", null, "Unimproved Land", null],
  commercial: ["Commercial Sale", "Commercial Lease", null, null],
  room: ["Residential", "Residential Lease", "Room", "Room"], // Room: giá trị local, đã khai từ migration 025; sale × room thêm sau Cổng 1 (sổ d-20261127T095403Z-30)
};

export function loaiHinh(kind: string, loai: string | null): LoaiHinh {
  if (kind === "rent_st") return { propertyType: "Residential Lease", propertySubType: null };
  const o = loai ? BANG_LOAI_HINH[loai] : undefined;
  if (!o) return TRONG;
  const thue = kind === "rent_lt";
  return { propertyType: thue ? o[1] : o[0], propertySubType: thue ? o[3] : o[2] };
}

/** Schema JSON (OpenAPI) của phần tử Listing. */
export function schemaListing() {
  return {
    type: "object",
    required: LISTING_KEY_NAMES,
    properties: Object.fromEntries(LISTING_KEYS.map((k) => [k.key, { type: [k.type, "null"], description: k.why }])),
  };
}
