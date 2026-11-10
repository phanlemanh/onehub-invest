import { DATA_LEVEL, LABELS_VI, type DataLevel } from "./vocab.generated";

/**
 * Bậc dữ liệu của một tin theo thang FRAMING §3.4 viết lại 08/11 (thang-bac-moi-b0-b5, 087). Thuần: dùng được ở server
 * lẫn client; cùng luật với `offer_data_level` của 087.
 *
 * - B0 «Có lời khai»: tin có trong kho nhưng chưa đủ năm trường lõi.
 * - B1 «Tin»: đủ năm trường lõi — loại tin, loại hình, giá, diện tích, vị trí (phường). Tin nằm trong cụm vẫn ở đây:
 *   gom cụm không phải một bậc.
 * - B2 «Định vị»: B1 và tin gắn vào dự án, toà hoặc trục của danh bạ. Chưa có bảng nối tin → nút danh bạ (GC) nên hôm nay
 *   không tin nào tới.
 * B3 «Gắn căn» trở lên đếm theo căn của danh bạ, không theo tin.
 *
 * SQL đếm «đủ trường lõi» ở lib/data-flow-queries.ts (`complete`) phải giữ cùng năm điều kiện.
 */

export type CoreField = "kind" | "propertyType" | "price" | "area" | "ward";

export type LevelInput = {
  kind: string | null;
  propertyType: string | null;
  priceVnd: number | null;
  areaM2: number | null;
  ward: string | null;
  /** Tin đã định vị vào dự án, toà hoặc trục của danh bạ (vị từ offer_located của 087). */
  located: boolean;
};

export const CORE_FIELDS: readonly { key: CoreField; label: string }[] = [
  { key: "kind", label: "Loại tin" },
  { key: "propertyType", label: "Loại hình" },
  { key: "price", label: "Giá" },
  { key: "area", label: "Diện tích" },
  { key: "ward", label: "Phường" },
];

const HAS: Record<CoreField, (r: LevelInput) => boolean> = {
  kind: (r) => r.kind != null && r.kind !== "",
  propertyType: (r) => r.propertyType != null && r.propertyType !== "unknown",
  price: (r) => r.priceVnd != null && r.priceVnd > 0,
  area: (r) => r.areaM2 != null && r.areaM2 > 0,
  ward: (r) => r.ward != null && r.ward !== "",
};

/** Năm trường lõi của tin, mỗi trường có hay chưa. */
export function coreFields(r: LevelInput): { key: CoreField; label: string; ok: boolean }[] {
  return CORE_FIELDS.map((f) => ({ ...f, ok: HAS[f.key](r) }));
}

/** Ba bậc một tin đạt được hôm nay (B3+ cần số đo). */
export type TinLevel = typeof DATA_LEVEL.B0 | typeof DATA_LEVEL.B1 | typeof DATA_LEVEL.B2;

/** Bậc nghiêm: mỗi bậc gồm mọi điều kiện của bậc dưới. */
export function levelOf(r: LevelInput): TinLevel {
  const complete = CORE_FIELDS.every((f) => HAS[f.key](r));
  if (!complete) return DATA_LEVEL.B0;
  return r.located ? DATA_LEVEL.B2 : DATA_LEVEL.B1;
}

export const levelLabel = (level: DataLevel) => `${level} · ${LABELS_VI.data_level[level]}`;
