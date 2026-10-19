import { pool } from "./db";

/**
 * Queries vận hành dùng chung bởi /ops (GUI) và /api/v1/ops/* (máy) —
 * cùng một nguồn dữ liệu, hai bề mặt (ADR-0007 DCA).
 * Danh tính nguồn trả về MÃ tầng B (S01…), không bao giờ tên thật.
 */

export type CoverageRow = {
  code: string; // SPL tầng B
  city: string;
  lastSnapshotAt: string | null;
  ageDays: number | null;
  sloDays: number;
  status: "fresh" | "stale" | "none";
};

/** Freshness SLO theo mã nguồn (ngày) — ADR-0007 DQO (chính sách, không phải bí mật). */
export const SLO_DAYS: Record<string, number> = {
  S01: 8,
  S02: 35,
  S03: 3,
  S04: 90,
};

/**
 * Map source_id collector (raw zone) → mã B, đọc từ source_registry —
 * mapping không hardcode trong code serving (ADR-0007 SPL).
 */
async function codeBySourceId(): Promise<Map<string, string>> {
  const { rows } = await pool.query<{ source_ids: string[]; code: string }>(
    `SELECT source_ids, code FROM source_registry WHERE status = 'active'`,
  );
  const m = new Map<string, string>();
  for (const r of rows) for (const id of r.source_ids) m.set(id, r.code);
  return m;
}

export async function getCoverageOverview(): Promise<CoverageRow[]> {
  const [snapRows, codeMap] = await Promise.all([
    pool.query<{ source: string; city: string; last: string | null }>(
      `SELECT source, city, max(collected_at)::text AS last
       FROM airbnb_snapshots GROUP BY source, city`,
    ),
    codeBySourceId(),
  ]);
  const rows = snapRows.rows;
  // Nhiều source thật map về cùng mã (discovery+listing→S01): gộp lấy snapshot
  // mới nhất. collected_at NULL = "không có ý kiến" — không đè lên ngày thật.
  const byKey = new Map<string, CoverageRow>();
  const cities = new Set<string>();
  for (const r of rows) {
    cities.add(r.city);
    const code = codeMap.get(r.source);
    if (!code) continue; // nguồn lạ (vd example) — không báo cáo
    const key = `${code}/${r.city}`;
    const prev = byKey.get(key);
    const newer =
      r.last !== null &&
      (!prev || prev.lastSnapshotAt === null || r.last > prev.lastSnapshotAt);
    if (newer) {
      const sloDays = SLO_DAYS[code];
      const ageDays = r.last
        ? Math.floor((Date.now() - new Date(r.last).getTime()) / 864e5)
        : null;
      byKey.set(key, {
        code,
        city: r.city,
        lastSnapshotAt: r.last,
        ageDays,
        sloDays,
        status: ageDays === null ? "none" : ageDays <= sloDays ? "fresh" : "stale",
      });
    }
  }
  // Nguồn–city chưa từng có snapshot → status none để SLO thấy được khoảng trống
  for (const code of Object.keys(SLO_DAYS)) {
    for (const city of cities) {
      const key = `${code}/${city}`;
      if (!byKey.has(key)) {
        byKey.set(key, {
          code,
          city,
          lastSnapshotAt: null,
          ageDays: null,
          sloDays: SLO_DAYS[code],
          status: "none",
        });
      }
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.code.localeCompare(b.code) || a.city.localeCompare(b.city),
  );
}
