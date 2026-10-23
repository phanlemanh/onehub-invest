/**
 * Bảng màu chuỗi dữ liệu dùng chung cho mọi biểu đồ (B3, luật ở onehub-ui/data-color.md).
 *
 * - Mỗi NGHĨA một sắc, giữ ở mọi biểu đồ: Doanh thu luôn là chàm, cơ cấu doanh thu là thang chàm.
 * - Biến palette cố định (`var(--color-<sắc>-<bậc>)`), không dùng `--chart-1..5`: theme hiện
 *   tại đổi sắc của chúng giữa sáng và tối.
 * - Bậc: nền sáng lấy bậc gần 500 nhất đạt ≥ 3:1 trên `--card`, nền tối bậc 400.
 * - `exempt`: chuỗi trung tính/bậc nhạt được miễn 3:1 (danh tính đi bằng vị trí + chú giải có
 *   số). Danh sách đóng, Mạnh chốt ở Cổng Phạm vi B3; thêm khoá miễn phải qua người.
 * - `swatch`: lớp chấm chú giải/tooltip, viết đủ cả chuỗi để Tailwind sinh lớp (không ghép chuỗi).
 */
export type SeriesColor = {
  /** Biến palette ở nền sáng, viết nguyên văn để Tailwind giữ biến đó trong CSS. */
  light: string
  /** Biến palette ở nền tối. */
  dark: string
  swatch?: string
  exempt?: true
}

// prettier-ignore
export const SERIES = {
  revenue:   { light: "var(--color-indigo-500)",  dark: "var(--color-indigo-400)",  swatch: "bg-indigo-500 dark:bg-indigo-400" },
  occupancy: { light: "var(--color-amber-600)",   dark: "var(--color-amber-400)",   swatch: "bg-amber-600 dark:bg-amber-400" },
  adr:       { light: "var(--color-sky-600)",     dark: "var(--color-sky-400)",     swatch: "bg-sky-600 dark:bg-sky-400" },
  revpar:    { light: "var(--color-teal-600)",    dark: "var(--color-teal-400)",    swatch: "bg-teal-600 dark:bg-teal-400" },
  expenses:  { light: "var(--color-slate-300)",   dark: "var(--color-slate-600)",   swatch: "bg-slate-300 dark:bg-slate-600", exempt: true },
  margin:    { light: "var(--color-emerald-600)", dark: "var(--color-emerald-400)", swatch: "bg-emerald-600 dark:bg-emerald-400" },
  share1:    { light: "var(--color-indigo-700)",  dark: "var(--color-indigo-500)",  swatch: "bg-indigo-700 dark:bg-indigo-500" },
  share2:    { light: "var(--color-indigo-500)",  dark: "var(--color-indigo-400)",  swatch: "bg-indigo-500 dark:bg-indigo-400" },
  share3:    { light: "var(--color-indigo-300)",  dark: "var(--color-indigo-300)",  swatch: "bg-indigo-300 dark:bg-indigo-300", exempt: true },
  rest:      { light: "var(--color-zinc-100)",    dark: "var(--color-zinc-800)",    exempt: true },
  hatch:     { light: "var(--color-zinc-300)",    dark: "var(--color-zinc-600)",    swatch: "bg-zinc-300 dark:bg-zinc-600", exempt: true },
  // Ops (B1): chuỗi chỉ có nghĩa ở cổng vận hành — khối lượng bản ghi thu theo ngày.
  // opsVolume giữ sắc "volume" (--info) của solution-dev-ops-6; opsVolumeRaw là chuỗi thứ hai (bản ghi thô).
  opsVolume:    { light: "var(--color-blue-600)",   dark: "var(--color-blue-400)",   swatch: "bg-blue-600 dark:bg-blue-400" },
  opsVolumeRaw: { light: "var(--color-violet-600)", dark: "var(--color-violet-400)", swatch: "bg-violet-600 dark:bg-violet-400" },
} as const satisfies Record<string, SeriesColor>

export type SeriesKey = keyof typeof SERIES

/** Cặp màu cho `theme` của một mục ChartConfig. */
export const themeOf = (key: SeriesKey) => ({
  light: SERIES[key].light,
  dark: SERIES[key].dark,
})

/** Lớp chấm của chuỗi; "Khác" (rest) không có chấm riêng, dùng màu hatch như block gốc chart-13. */
export const swatchOf = (key: Exclude<SeriesKey, "rest">) => SERIES[key].swatch
