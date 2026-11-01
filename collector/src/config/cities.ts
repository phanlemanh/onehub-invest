import type { CityRef } from "../core/types.js";

/** Scope Việt Nam (ADR-0003) — center là [lng, lat].
 * "vn" = pseudo-city cho quét toàn quốc theo rotation (airdna-daily). */
export const CITIES: CityRef[] = [
  { id: "hanoi", name: "Hà Nội", country: "vn", center: [105.8342, 21.0278] },
  { id: "hcmc", name: "Hồ Chí Minh", country: "vn", center: [106.6297, 10.8231] },
  { id: "danang", name: "Đà Nẵng", country: "vn", center: [108.2208, 16.0544] },
  { id: "haiphong", name: "Hải Phòng", country: "vn", center: [106.6802, 20.8651] }, // 3110-17: thêm cho OSM admin_level 6
  { id: "nhatrang", name: "Nha Trang", country: "vn", center: [109.1932, 12.2388] },
  { id: "dalat", name: "Đà Lạt", country: "vn", center: [108.4419, 11.9408] },
  { id: "phuquoc", name: "Phú Quốc", country: "vn", center: [103.9839, 10.2899] },
  { id: "vn", name: "Việt Nam (quét toàn quốc)", country: "vn", center: [106.0, 16.0] },
];

export function cityById(id: string): CityRef | undefined {
  return CITIES.find((c) => c.id === id);
}
