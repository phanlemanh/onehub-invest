// deal-plausibility.mjs — luật loại tin phi lý khỏi «Căn giá tốt» (hồ sơ deals-loai-tin-phi-ly, ON11).
// Luật xác định (luật 7 AGENTS.md: không model): diện tích, số phòng ngủ do parser S03/S05 bắt có thể sai,
// «độ tin trích xuất» không chặn được. Ngưỡng Mạnh chốt ở Cổng Phạm vi 24/10 (Hỏi-1 = 20 m² mỗi phòng ngủ).
// Loại hình tin S03 đều «unknown» nên luật không phân biệt chung cư với nhà nhiều tầng (Giới hạn đã biết).

export const PLAUSIBILITY = Object.freeze({
  minAreaM2: 10,
  maxAreaM2: 1000,
  maxBedrooms: 10,
  minM2PerBedroom: 20,
});

/** Lý do theo thứ tự xét — cũng là khoá `by_reason` của dòng audit. */
export const REASONS = Object.freeze(["thieu-dien-tich", "dien-tich-ngoai-khoang", "phong-ngu-ngoai-khoang", "phong-qua-nho"]);

/**
 * Lý do một tin phi lý, hoặc null khi hợp lý.
 * @param {{ areaM2: number | null | undefined, bedrooms: number | null | undefined }} tin
 * @returns {string | null}
 */
export function implausibleReason({ areaM2, bedrooms }) {
  const area = areaM2 == null ? null : Number(areaM2);
  if (area === null || !Number.isFinite(area) || area <= 0) return "thieu-dien-tich";
  if (area < PLAUSIBILITY.minAreaM2 || area > PLAUSIBILITY.maxAreaM2) return "dien-tich-ngoai-khoang";
  const beds = bedrooms == null ? null : Number(bedrooms);
  if (beds === null || !Number.isFinite(beds) || beds <= 0) return null;
  if (beds > PLAUSIBILITY.maxBedrooms) return "phong-ngu-ngoai-khoang";
  if (area / beds < PLAUSIBILITY.minM2PerBedroom) return "phong-qua-nho";
  return null;
}
