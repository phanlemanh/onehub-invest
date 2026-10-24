// Định dạng số theo vi-VN (dấu chấm ngăn nghìn, phẩy thập phân).
const LOCALE = "vi-VN";

export function fmtMoney(v: number | null, currency: string, compact = false): string {
  if (v === null || Number.isNaN(v)) return "—";
  if (compact) return fmtMoneyCompact(v, currency);
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}

/**
 * Rút gọn tiền theo "tỷ / tr / k" cho MỌI loại tiền: compact của vi-VN in "T"
 * cho tỷ, dễ đọc nhầm thành triệu.
 */
export function fmtMoneyCompact(v: number, currency: string): string {
  const symbol =
    new Intl.NumberFormat(LOCALE, { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  const abs = Math.abs(v);
  const num = (x: number) =>
    new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(x);
  if (abs >= 1e9) return `${num(v / 1e9)} tỷ ${symbol}`;
  if (abs >= 1e6) return `${num(v / 1e6)} tr ${symbol}`;
  if (abs >= 1e3) return `${num(v / 1e3)}k ${symbol}`;
  return `${num(v)} ${symbol}`;
}

/** Rút gọn số không kèm đơn vị tiền ("1,5 tỷ", "500 tr") — cho nhãn trục. */
export function fmtCompact(v: number): string {
  const abs = Math.abs(v);
  const num = (x: number) =>
    new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(x);
  if (abs >= 1e9) return `${num(v / 1e9)} tỷ`;
  if (abs >= 1e6) return `${num(v / 1e6)} tr`;
  if (abs >= 1e3) return `${num(v / 1e3)}k`;
  return num(v);
}

export function fmtPct(v: number | null, digits = 1): string {
  if (v === null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

export function fmtInt(v: number | null): string {
  if (v === null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat(LOCALE).format(Math.round(v));
}

// ---------- Mốc thời gian theo giờ Việt Nam (ON8) ----------
// Múi ghi tường minh: máy local, Vercel (UTC) và trình duyệt cho cùng một chuỗi, không phụ thuộc múi máy.

export const VN_TZ = "Asia/Ho_Chi_Minh";

const VN_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Chuỗi phải mang múi (Z hoặc ±HH[:MM]) sau phần giờ; chuỗi không ghi múi không đoán theo múi máy. */
const CO_MUI = /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}(:?\d{2})?)$/i;

function toInstant(v: string | Date | number | null | undefined): Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") return Number.isFinite(v) ? new Date(v) : null;
  // `::text` của Postgres: "2026-10-23 12:13:45.123+00" → "2026-10-23T12:13:45.123+00:00"
  const s = String(v).trim().replace(" ", "T");
  if (!CO_MUI.test(s)) return null;
  const t = Date.parse(s.replace(/([+-]\d{2})$/, "$1:00"));
  return Number.isNaN(t) ? null : new Date(t);
}

function vnParts(d: Date): Record<string, string> {
  return Object.fromEntries(VN_PARTS.formatToParts(d).map((p) => [p.type, p.value]));
}

/** Mốc giờ theo giờ VN: "2026-10-23 19:13 (GMT+7)"; không đọc được hoặc không ghi múi → "—". */
export function fmtVnDateTime(v: string | Date | number | null | undefined): string {
  const d = toInstant(v);
  if (!d) return "—";
  const p = vnParts(d);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} (GMT+7)`;
}

/** Mốc chỉ có ngày, theo ngày VN: "2026-10-24"; không đọc được → "—". */
export function fmtVnDate(v: string | Date | number | null | undefined): string {
  const d = toInstant(v);
  return d ? vnDayKey(d) : "—";
}

/** Khoá ngày VN "YYYY-MM-DD" của một thời điểm — dùng gom số theo ngày. */
export function vnDayKey(v: Date | number): string {
  const p = vnParts(typeof v === "number" ? new Date(v) : v);
  return `${p.year}-${p.month}-${p.day}`;
}

/** 00:00 giờ VN của ngày `key` (VN không có giờ mùa hè). */
export function vnDayStart(key: string): Date {
  return new Date(`${key}T00:00:00+07:00`);
}

/** "2026-10-01" → "T10/2026". */
export function fmtMonth(iso: string): string {
  const [y, m] = iso.slice(0, 10).split("-");
  return `T${Number(m)}/${y}`;
}
