/**
 * Bảng «Kiểm chất lượng» của /ops/quality (hồ sơ dq-moi-nhat-moi-kiem, ON9 — OPS-10). Đọc `dq_check_results` (đã sync
 * lên cloud, ADR-0014): bản mới nhất theo từng (kiểm, đối tượng) trong 7 ngày — trước đây `LIMIT 20` để một kiểm chạy
 * dày chiếm hết bảng và «20 kiểm» là số dòng cắt.
 */
import type { BadgeProps } from "@/components/reui/badge";

export type DqCheckRow = {
  check_name: string;
  entity: string;
  status: string;
  detail: string | null;
  checked_at: string;
};

/** Câu SQL của bảng — test chạy ĐÚNG câu này trên fixture. */
export function dqLatestSql(): string {
  return `SELECT DISTINCT ON (check_name, entity) check_name, entity, status, detail, checked_at::text
    FROM dq_check_results
    WHERE checked_at > now() - interval '7 days'
    ORDER BY check_name, entity, checked_at DESC`;
}

export type DqStats = { checks: number; entities: number; labels: [string, string] };

/** Số ở đầu trang: số loại kiểm khác nhau và số đối tượng (= số dòng bảng). */
export function dqStats(rows: Pick<DqCheckRow, "check_name">[]): DqStats {
  const checks = new Set(rows.map((r) => r.check_name)).size;
  const entities = rows.length;
  return { checks, entities, labels: [`${checks} kiểm`, `${entities} đối tượng`] };
}

type Queryable = { query: (sql: string) => Promise<{ rows: unknown[] }> };

/** Nguồn DUY NHẤT của bảng và số đầu trang — trang truyền `pool`, test truyền client trong giao dịch. */
export async function loadDqChecks(db: Queryable): Promise<{ rows: DqCheckRow[]; stats: DqStats }> {
  const rows = (await db.query(dqLatestSql())).rows as DqCheckRow[];
  return { rows, stats: dqStats(rows) };
}

/**
 * Bảng + số đầu trang của /ops/quality từ MỘT tập dòng (AC-3): `rows` là đúng các dòng bảng hiện (chi tiết đã qua bộ che
 * tên nguồn), `stats` đếm trên CHÍNH các dòng ấy — trang dùng một biến cho cả hai nên số không lệch bảng.
 */
export function dqSection(
  rows: DqCheckRow[],
  maskDetail: (detail: string) => string | null, // null = không đọc được tên nguồn → ẩn chi tiết (ON7)
): { rows: DqCheckRow[]; stats: DqStats } {
  const shown = rows.map((r) => ({ ...r, detail: r.detail === null ? null : maskDetail(r.detail) }));
  return { rows: shown, stats: dqStats(shown) };
}

/**
 * Kiểm có số tham chiếu (truthful-coverage): «pass» nghĩa là có số tham chiếu tươi, KHÔNG phải độ phủ đạt — nhãn riêng,
 * không bao giờ «Đạt» xanh lá (Mạnh chốt Hỏi-1 ở Cổng Phạm vi ON9, 24/10).
 */
const REF_CHECK = "truthful-coverage";

type Result = { label: string; variant: NonNullable<BadgeProps["variant"]> };

const CHUNG: Record<string, Result> = {
  pass: { label: "Đạt", variant: "success-light" },
  warn: { label: "Cảnh báo", variant: "warning-light" },
  fail: { label: "Không đạt", variant: "destructive-light" },
  skip: { label: "Bỏ qua", variant: "outline" },
};

const THAM_CHIEU: Record<string, Result> = {
  pass: { label: "Có số tham chiếu", variant: "info-light" },
  fail: { label: "Thiếu số tham chiếu", variant: "warning-light" },
  warn: CHUNG.warn,
  skip: CHUNG.skip,
};

/** Nhãn + màu ô «Kết quả» theo nghĩa của từng kiểm; trạng thái lạ hiện nguyên chữ, màu đỏ nhạt. */
export function dqResult(checkName: string, status: string): Result {
  const table = checkName === REF_CHECK ? THAM_CHIEU : CHUNG;
  return table[status] ?? { label: status, variant: "destructive-light" };
}
