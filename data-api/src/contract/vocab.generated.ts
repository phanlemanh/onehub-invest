// MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write
// Sổ từ vựng một nguồn (PL6) — hằng cho data-api/ (đi kho công khai một mình nên tự mang tệp sinh).

/** Nguồn không bao giờ hiển thị công khai (nguon_khong_hien_thi của mappings.yaml). */
export const SOURCE_HIDDEN = ["S02", "S08"] as const;
