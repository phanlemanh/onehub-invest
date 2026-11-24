/** Hàm thuần của bộ thu S17: dựng item thô và đọc các trường cần cho việc điều khiển (không chuẩn hoá payload). */
import { RunStopped } from "./client.js";
import { S17_SOURCE } from "./store.js";
import type { RawItem } from "../../core/types.js";

/** Một bản ghi thô: payload NGUYÊN VĂN; meta chỉ mang điều khiển và số đếm đối soát. */
export function makeItem(kind: string, sourceId: string, payload: unknown, meta: Record<string, unknown>, fetchedAt: string): RawItem {
  return { source: S17_SOURCE, kind, sourceId, fetchedAt, payload, meta };
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
