/**
 * Vùng «Hiệu chuẩn» của /ops/quality (hồ sơ hieu-chuan-mot-bo-so, ON10 — OPS-11, OPS-15). Một bộ số cho mỗi thị trường:
 * một định nghĩa «listing tự thu» dùng chung cho thẻ, bảng Độ phủ và bảng toàn quốc; market S02 đại diện chọn theo luật cố
 * định khi khu vực gộp nhiều market (sáp nhập tỉnh 2025); cờ mẫu mỏng theo cỡ mẫu sinh ADR/công suất; thị trường chưa có số
 * gộp một dòng. Mạnh chốt cả bốn ở Cổng Phạm vi ON10 (25/10).
 */
import { fmtInt } from "./format";
import { shortAreaName } from "./market-names";
import type { AirdnaComparison } from "./queries";

export type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> }; // eslint-disable-line @typescript-eslint/no-explicit-any -- dòng pg thô, hàm gọi tự ép kiểu

/** Câu định nghĩa in dưới mỗi bảng của vùng — nguyên văn chữ đã duyệt. */
export const TU_THU_DINH_NGHIA = "Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)";

/** Dưới ngưỡng này, ADR/công suất tự thu tính từ quá ít listing để so (cùng ngưỡng n ≥ 5 của thước giá). */
export const MAU_MONG_DUOI = 5;

/** `sample` = số listing đứng sau ADR/công suất của thẻ (`max(listing_count)` của market_metrics); null = chưa có số. */
export function isThin(sample: number | null): boolean {
  return sample !== null && sample < MAU_MONG_DUOI;
}

/** So mã market: cả hai là số thì so số, không thì so chuỗi. */
function compareId(a: string, b: string): number {
  const x = Number(a);
  const y = Number(b);
  if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Market S02 đại diện cho khu vực: nhiều listing nhất (chưa có số = 0), hoà thì mã nhỏ nhất. */
export function pickRepresentative(
  ms: { airdnaId: string; listingCount: number | null }[],
): { airdnaId: string; ofMarkets: number } | null {
  if (ms.length === 0) return null;
  const best = [...ms].sort((a, b) => (b.listingCount ?? 0) - (a.listingCount ?? 0) || compareId(a.airdnaId, b.airdnaId))[0];
  return { airdnaId: best.airdnaId, ofMarkets: ms.length };
}

/**
 * Mẫu số chung của dòng «Listing» (thẻ hiệu chuẩn) và bảng Độ phủ trung thực: tổng listing S02 kỳ mới nhất của mọi
 * market thành phần, bỏ market chưa có số; không market nào có số → null (ON10 Ngoài-13).
 */
export function tongListingS02(counts: (number | null)[]): number | null {
  const co = counts.filter((n): n is number => n !== null);
  return co.length === 0 ? null : co.reduce((a, n) => a + n, 0);
}

const coSo = (v: number | null | undefined) => v !== null && v !== undefined && v !== 0;

/** Chưa có số: không thẻ, hoặc mọi số hai phía và điểm S02 đều trống hay bằng 0. */
export function isEmptyComparison(c: AirdnaComparison | null): boolean {
  if (!c) return true;
  if (coSo(c.marketScore?.total)) return false;
  return !c.metrics.some((m) => coSo(m.ourValue) || coSo(m.airdnaValue));
}

/** Chia thị trường thành thẻ được vẽ và dòng «Chưa có số»; nhãn đầu trang đếm đúng số thẻ. */
export function splitCalibrated<T extends { market: { name: string }; data: AirdnaComparison | null }>(
  rows: T[],
): { calibrated: (T & { data: AirdnaComparison })[]; empty: string[]; label: string } {
  const calibrated = rows.filter((r): r is T & { data: AirdnaComparison } => !isEmptyComparison(r.data));
  const empty = rows.filter((r) => isEmptyComparison(r.data)).map((r) => shortAreaName(r.market.name));
  return { calibrated, empty, label: `${fmtInt(calibrated.length)} thị trường hiệu chuẩn` };
}

/** Số listing tự thu theo khu vực: listing của khu vực và mọi phường con (định nghĩa chung của ba bảng). */
export function ourListingsSql(): string {
  return `SELECT coalesce(sa.parent_id, sa.id) AS market, count(*)::int AS n
         FROM listings l JOIN areas sa ON sa.id = l.area_id
        WHERE sa.id LIKE 'vn-%' GROUP BY 1`;
}

export async function loadOurListings(db: Queryable): Promise<Map<string, number>> {
  const { rows } = await db.query(ourListingsSql());
  return new Map(rows.map((r) => [r.market as string, Number(r.n)]));
}
