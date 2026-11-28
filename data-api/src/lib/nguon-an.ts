/**
 * Bộ kiểm sổ nguồn ẩn (PB10). Danh sách nguồn không hiển thị công khai đến từ hằng MÁY SINH `SOURCE_HIDDEN`
 * (`src/contract/vocab.generated.ts`, sinh từ `nguon_khong_hien_thi` của `pipeline/mappings.yaml`). Sổ hỏng — không phải
 * mảng, rỗng, phần tử sai khuôn mã nguồn, trùng — thì trả `null`: route đọc tin phải ĐÓNG, không được hiểu «không ẩn gì».
 * Không viết tay mã nguồn nào ở đây (PB7 AC-2).
 */
const KHUON_MA = /^S\d{2}$/;

export function kiemNguonAn(ds: unknown): string[] | null {
  if (!Array.isArray(ds) || ds.length === 0) return null;
  const ra: string[] = [];
  for (const x of ds) {
    if (typeof x !== "string" || !KHUON_MA.test(x) || ra.includes(x)) return null;
    ra.push(x);
  }
  return ra;
}

/** Thân lỗi khi sổ hỏng — mã riêng, cùng lệ AUTH_NOT_CONFIGURED (Mạnh chọn ở Cổng Phạm vi PB10, Hỏi-1). */
export const LOI_NGUON_AN = {
  code: "HIDDEN_SOURCES_NOT_CONFIGURED",
  message: "Danh sách nguồn không hiển thị công khai chưa cấu hình được — /v1/listings tạm đóng",
} as const;
