// o.ts — 17 ô của biểu mẫu nhãn lát s03-theo-nhom (app/src/lib/labels-normalize.ts LABEL_FIELDS_NHOM), thứ tự của
// lượt đo 07/11. Bộ đọc gộp ra đúng 17 ô này; bảng chọn giao từng ô cho một model hay cho người.
export const FIELDS = [
  "listing_intent", "kind", "property_type", "multi_unit", "project", "subzone", "building", "stack", "floor",
  "bedrooms", "bedrooms_plus", "bathrooms", "area_m2", "price_min_vnd", "price_max_vnd", "seller_name", "seller_phone",
] as const;
export type Field = (typeof FIELDS)[number];
export const laField = (x: string): x is Field => (FIELDS as readonly string[]).includes(x);
