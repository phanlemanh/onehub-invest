/**
 * SPL tầng C (ADR-0007): mã nguồn → nhãn tiếng Việt hiển thị ở Invest Portal.
 * Tên nguồn thật KHÔNG bao giờ xuất hiện ở tầng serving/UI — chỉ mã + nhãn.
 */
const LABELS: Record<string, { vi: string; hint: string }> = {
  S01: { vi: "Tự thu", hint: "Thu thập trực tiếp từ nguồn công khai, tính metric riêng" },
  S02: { vi: "Hiệu chuẩn", hint: "Nguồn tham chiếu trả phí để đối chiếu, không trộn số" },
  S03: { vi: "Cộng đồng", hint: "Tin rao từ nhóm môi giới — parser tự trích xuất" },
  S04: { vi: "Địa giới mở", hint: "Dữ liệu ranh giới hành chính mở" },
};

export function sourceTierLabel(code: string): { vi: string; hint?: string } {
  return LABELS[code] ?? { vi: code };
}

// ---- Nhãn nguồn ở Ops (ON7 `ops-nhan-ma-nguon`, CONTEXT.md «Nhãn nguồn») ----
// Ngoài /ops/sources, Ops gọi nguồn bằng mã S0x kèm vai trò, không bao giờ bằng tên thật (tầng A, AGENTS.md luật 6).
// Thuần — dùng được ở server lẫn client component; vai trò đọc ở server qua `getSourceRoles()` (lib/source-roles.ts,
// từ source_registry ở local, facts.sourceRuns ở cloud) rồi truyền xuống bằng props.

/** Vai trò theo mã: { S02: "Hiệu chuẩn", … }. */
export type SourceRoles = Record<string, string>;

/** «S02 · Hiệu chuẩn»; vắng vai trò → mã trần «S02». */
export function sourceLabel(code: string, roles: SourceRoles = {}): string {
  const role = roles[code];
  return role ? `${code} · ${role}` : code;
}
