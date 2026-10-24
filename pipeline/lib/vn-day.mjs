// vn-day.mjs — ngày theo giờ Việt Nam cho số đẩy lên cloud (ON8 `gio-ops-gio-vn`). Bản chép của
// app/src/lib/format.ts (vnDayKey/vnDayStart): hai runtime (Node .mjs và Next TS) không chung module được;
// pipeline/scripts/vn-day.test.mjs đo cả hai trên cùng ma trận.
export const VN_TZ = "Asia/Ho_Chi_Minh";

const PARTS = new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Khoá ngày VN "YYYY-MM-DD" của một thời điểm. */
export function vnDayKey(t) {
  const p = Object.fromEntries(PARTS.formatToParts(typeof t === "number" ? new Date(t) : t).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** 00:00 giờ VN của ngày `key` (VN không có giờ mùa hè). */
export function vnDayStart(key) {
  return new Date(`${key}T00:00:00+07:00`);
}

/** Biểu thức SQL gom cột timestamptz theo ngày VN (DB chạy UTC). */
export const VN_DAY_SQL = (col) => `(${col} AT TIME ZONE '${VN_TZ}')::date::text`;
