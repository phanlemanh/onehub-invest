/**
 * Màu vẽ bản đồ MapLibre. MapLibre không đọc được biến CSS hay oklch, nên lớp vẽ cần hex — gom hết về đây (ngoài vùng
 * giao diện của design-floor) để tệp giao diện chỉ import tên. Giá trị là màu Tailwind v4 tương ứng, giữ đúng từng mã
 * (hồ sơ don-hex-tho, bảng AC-2). Chỉ dùng cho lớp vẽ bản đồ; chú giải và thanh dùng class.
 */

/** Bốn bậc choropleth p30/p60/p90: blue-200/400/700/900 (cùng thang với BIN_SWATCH của finder/bins.ts). */
export const BIN_COLORS = ["#bedbff", "#51a2ff", "#1447e6", "#1c398e"] as const
/** Vùng chưa có số trên nền sáng (slate-200). */
export const NO_DATA_COLOR = "#e2e8f0"
/** Vùng chưa có số trên nền bản đồ tối (zinc-700). */
export const NO_DATA_COLOR_DARK = "#3f3f46"

/** Viền khu vực của choropleth: trắng trên nền sáng, neutral-950 trên nền tối. */
export const AREA_LINE = { light: "#ffffff", dark: "#0a0a0a" } as const

/** Nhãn giá kiểu Airbnb của bản đồ Duyệt listing: mực zinc-900, nền trắng, viền zinc-300. */
export const LISTING_PIN = { ink: "#18181b", paper: "#ffffff", edge: "#d4d4d8" } as const

/** Mini-map phường: đang xem blue-600, phường khác blue-300, viền blue-900. */
export const MINI_MAP = { active: "#2563eb", idle: "#93c5fd", line: "#1e3a8a" } as const
