/** Hàm thuần của bộ thu S17: dựng item thô và đọc các trường cần cho việc điều khiển (không chuẩn hoá payload). */
import { RunStopped } from "./client.js";
import { S17_SOURCE } from "./store.js";
import type { RawItem } from "../../core/types.js";

/** Một bản ghi thô: payload NGUYÊN VĂN; meta chỉ mang điều khiển và số đếm đối soát. */
export function makeItem(kind: string, sourceId: string, payload: unknown, meta: Record<string, unknown>, fetchedAt: string): RawItem {
  return { source: S17_SOURCE, kind, sourceId, fetchedAt, payload, meta };
}

/**
 * Chữ dùng trong sourceId: ASCII, chữ thường, khoảng trắng và dấu câu thành gạch nối; tiếng Việt bỏ dấu
 * («Hàng Đào» → hang-dao, «3312A Tòa Park 12» → 3312a-toa-park-12).
 */
export function sourceIdSlug(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[Đđ]/g, "d")
    .normalize("NFD")
    .replace(/[\p{M}]+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** «2,432» → 2432; không đọc được → null. */
export function parseCount(text: unknown): number | null {
  if (typeof text === "number" && Number.isFinite(text)) return text;
  if (typeof text !== "string") return null;
  const t = text.replace(/[\s.,]/g, "");
  return /^\d+$/.test(t) ? Number(t) : null;
}

/**
 * `status: false` trong envelope là nguồn BÁO LỖI dù HTTP 200 — KHÔNG được đọc là «không có bản ghi» hay «không có
 * thửa» (lượt soát 24/11: một lỗi mềm như vậy sẽ đánh dấu cả dải id là rỗng mà lượt vẫn báo thành công). Bản ghi rỗng
 * thật có `status: true` (đo 24/11: 71 byte). Dừng cả lượt, không đoán tiếp.
 */
export function assertNoSoftError(body: unknown, noi: string): void {
  if (body && typeof body === "object" && (body as { status?: unknown }).status === false) {
    throw new RunStopped("source-error", `nguồn trả status false ở ${noi}: ${String((body as { message?: unknown }).message ?? "").slice(0, 160)}`);
  }
}

/**
 * Cơ sở URL của các lớp tile, lấy từ cấu hình đầy đủ của chính nguồn (khoá `boundaries_conf`).
 * Tên lớp = đoạn cuối của đường (ranh_thua, ranh_thua_i, heatmap, du_an, qhxd, qhsdd). Không đoán cứng.
 */
export function tileBases(fullConfigBody: unknown): Record<string, string> {
  const conf = (fullConfigBody as { data?: { boundaries_conf?: unknown } } | null)?.data?.boundaries_conf;
  const out: Record<string, string> = {};
  if (!conf || typeof conf !== "object") return out;
  for (const v of Object.values(conf as Record<string, unknown>)) {
    if (typeof v !== "string" || !/^https?:\/\//.test(v)) continue;
    const layer = v.replace(/\/+$/, "").split("/").pop() ?? "";
    if (layer) out[layer] = v.replace(/\/+$/, "");
  }
  return out;
}

/** Cờ «dự án có bảng căn» trong chi tiết dự án. Thiếu cờ → null: không suy ra false. */
export function hasApartmentTable(detailBody: unknown): boolean | null {
  const v = (detailBody as { data?: { properties?: { is_exists_apartment_info?: unknown } } } | null)?.data?.properties?.is_exists_apartment_info;
  return typeof v === "boolean" ? v : null;
}

/** Id của một mục trong trang danh sách dự án; không có id → null (để đếm, không bỏ im lặng). */
export function projectIdOf(entry: unknown): string | null {
  const e = entry as { id?: unknown; project_id?: unknown; ma_du_an?: unknown } | null;
  const v = e?.id ?? e?.project_id ?? e?.ma_du_an;
  return v === undefined || v === null || v === "" ? null : String(v);
}

/**
 * Số dư điểm trước và sau một lượt phải bằng nhau — bằng chứng lượt đó không tiêu điểm nào trên tài
 * khoản. Giảm là dừng cả lượt ngay; số dư không bao giờ vào snapshot hay kênh.
 */
export function assertBalanceUnchanged(before: number, after: number): void {
  if (after < before) throw new RunStopped("balance-spent", `số dư giảm từ ${before} xuống ${after} trong lượt này`);
}

/**
 * Số lượt quét tối đa cho một toà khi thứ tự trang không ổn định. Đo 24/11: toà P11 cần ba lượt, toà P9 còn
 * thiếu 18 mã sau ba lượt mà mỗi lượt vẫn thêm được mã — trần nâng lên tám; lượt không thêm mã thì dừng ngay.
 */
export const MAX_APARTMENT_LOT = 8;
