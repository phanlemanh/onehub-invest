// ket-cuc.ts — NB1 cham-bong-bo-sung-tin: luật XÁC ĐỊNH tính kết cục của một đề xuất từ hai lần đọc mù (design §1, AC-4).
// Không model nào quyết kết cục (luật 7). So giá trị theo khoá giống hệt assertion_value_key của migration 045.

/** Năm ô của hàng «Bổ sung tin», theo thứ tự ưu tiên chấm (AC-8: ô số trước, rồi toà, đường, loại hình). */
export const THU_TU_O = ["bathrooms", "bedrooms", "block_raw", "street_raw", "property_type"] as const;
export type OCham = (typeof THU_TU_O)[number];
export const laOCham = (x: string): x is OCham => (THU_TU_O as readonly string[]).includes(x);

/** Lý do một lần đọc thành rỗng (AC-3). */
export type LyDoRong = "khong-suy-ra" | "trich-gia" | "ngoai-tu-vung" | "khong-phai-so";
export type Doc = { v: string | null; ly_do: LyDoRong | null };

export type KetCuc = "khop" | "bo_trong" | "lech_hai_lan" | "bac_dong_thuan";
export const KET_CUC: readonly KetCuc[] = ["khop", "bo_trong", "lech_hai_lan", "bac_dong_thuan"];

/** Bản TS của assertion_value_key (045): btrim; toàn chữ số → bỏ số 0 đầu (giữ «0»); còn lại chữ thường. */
export function khoaGiaTri(v: string): string {
  const t = v.trim();
  if (/^[0-9]+$/.test(t)) return t.replace(/^0+(?=\d)/, "");
  return t.toLowerCase();
}

/** Kết cục của đề xuất `deXuat` theo hai lần đọc (AC-4). Có rỗng → bo_trong; hai giá trị khác nhau → lech_hai_lan (kể cả khi cả
 * hai cùng khác đề xuất); bằng nhau và bằng đề xuất → khop; bằng nhau, khác đề xuất → bac_dong_thuan. */
export function ketCuc(deXuat: string, d1: Doc, d2: Doc): KetCuc {
  if (d1.v === null || d2.v === null) return "bo_trong";
  const a = khoaGiaTri(d1.v), b = khoaGiaTri(d2.v);
  if (a !== b) return "lech_hai_lan";
  return a === khoaGiaTri(deXuat) ? "khop" : "bac_dong_thuan";
}

/** Ca biên: mọi kết cục khác khop, cộng mọi đề xuất mang cờ lech_tren_the (thẻ có ≥ 2 đề xuất giá trị khác nhau cho cùng ô). */
export function laCaBien(k: KetCuc, lechTrenThe: boolean): boolean {
  return k !== "khop" || lechTrenThe;
}
