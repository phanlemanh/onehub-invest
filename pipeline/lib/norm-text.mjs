// norm-text.mjs — chuẩn hoá chữ bài, không phụ thuộc gói ngoài: eval-labels.mjs (textHash) dùng được ở job CI không cài `pg` của pipeline.

/** Chữ bài đã chuẩn hoá để so trùng: NFC, chữ thường, mọi dãy không phải chữ/số thành một dấu cách. */
export const normText = (text) => (text ?? "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
