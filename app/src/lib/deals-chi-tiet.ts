import type { DealRow } from "./deals";
import { LABELS_VI } from "./vocab.generated";
import type { ReviewImage } from "./ops/review-media";

/** Ba ngưỡng của Căn giá tốt: vào danh sách, cần xác minh, bị loại vì thước mỏng (ON11). */
export const NGUONG_VAO_PCT = 5;
export const NGUONG_LOAI_PCT = 50;

/** Căn trên trang một căn: tin + các cột «ở đâu» của sale_offers + ảnh đã áp vai. */
export type DealChiTiet = DealRow & {
  propertyType: string | null;
  block: string | null;
  floor: string | null;
  unit: string | null;
  streetNumber: string | null;
  street: string | null;
  district: string | null;
  images: ReviewImage[];
  postTextFull: string | null;
  /** Lý do căn không còn trong danh sách; null khi còn trong danh sách. */
  roiDanhSach: string | null;
};

export function loaiHinh(t: string | null): string | null {
  if (!t || t === "unknown") return null;
  return (LABELS_VI.property_type as Record<string, string>)[t] ?? null;
}

/** Tên căn: loại hình · m² · phòng ngủ · phường; thiếu mục nào bỏ mục đó. */
export function tenCan(d: DealChiTiet): string {
  return [
    loaiHinh(d.propertyType) ?? "Chưa rõ loại hình",
    d.areaM2 ? `${Math.round(d.areaM2)} m²` : null,
    d.bedrooms ? `${d.bedrooms}PN` : null,
    d.phuong,
  ].filter(Boolean).join(" · ");
}

/**
 * Căn còn thiếu gì. Chỉ nói ảnh, chữ bài khi vai được xem và đang ở máy thu, SĐT khi vai được xem: dữ liệu vắng vì
 * vai hay vì cloud không có nghĩa căn thiếu.
 */
export function thieuGi(d: DealChiTiet, vai: { xemNoiDung: boolean; mayThu: boolean }): string[] {
  const out: string[] = [];
  if (!loaiHinh(d.propertyType)) out.push("Chưa rõ loại hình");
  if (!d.areaM2) out.push("Chưa có diện tích");
  if (!d.block && !d.street) out.push("Chỉ biết phường, chưa có toà hay đường");
  if (!d.medianPerm2) out.push("Chưa có thước phường");
  if (vai.xemNoiDung && vai.mayThu) {
    if (d.images.length === 0) out.push("Chưa có ảnh");
    if (!d.postTextFull) out.push("Chưa có chữ bài");
  }
  if (vai.xemNoiDung && !d.sellerPhone) out.push("Chưa có SĐT");
  return out;
}

/** Biên diện tích của «căn cùng tiêu chí»: ±25% quanh căn đang xem. */
export const BIEN_DIEN_TICH = 0.25;

/**
 * Căn cùng tiêu chí với căn đang xem, cùng thứ tự danh sách: căn cần xác minh đứng cuối, còn lại giảm nhiều trước. Mặc định cùng phường, cùng loại hình, diện tích ±25%;
 * `chiPhuong` nới về cùng phường. Không biết loại hình hay diện tích thì bỏ tiêu chí đó, và nói rõ trong `moTa`.
 */
export function canCungTieuChi<T extends DealChiTiet>(d: T, rows: T[], chiPhuong = false): { moTa: string[]; can: T[] } {
  if (!d.phuong) return { moTa: ["Chưa gắn phường"], can: [] };
  const loai = !chiPhuong ? loaiHinh(d.propertyType) : null;
  const dt = !chiPhuong && d.areaM2 ? ([d.areaM2 * (1 - BIEN_DIEN_TICH), d.areaM2 * (1 + BIEN_DIEN_TICH)] as const) : null;
  const can = rows
    .filter((r) => r.offerId !== d.offerId && r.phuong === d.phuong)
    .filter((r) => !loai || loaiHinh(r.propertyType) === loai)
    .filter((r) => !dt || (r.areaM2 !== null && r.areaM2 >= dt[0] && r.areaM2 <= dt[1]))
    .sort((a, b) => Number(a.suspect) - Number(b.suspect) || (b.discountPct ?? 0) - (a.discountPct ?? 0));
  const moTa = [d.phuong, loai, dt ? `${Math.round(dt[0])}–${Math.round(dt[1])} m²` : null].filter((x): x is string => Boolean(x));
  return { moTa, can };
}
