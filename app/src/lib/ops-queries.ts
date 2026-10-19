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

/** Map source thật (tầng A, trong airbnb_snapshots) → mã B. Cục bộ, không lưu DB serving. */
const CODE_BY_SOURCE: Record<string, string> = {
  "airbnb-discovery": "S01",
  "airbnb-listing": "S01",
  "airdna-research": "S02",
  "zalo-mock": "S03",
  "osm-boundaries": "S04",
};

/** Freshness SLO theo mã nguồn (ngày) — ADR-0007 DQO. */
export const SLO_DAYS: Record<string, number> = {
  S01: 8,
  S02: 35,
  S03: 3,
  S04: 90,
};

export async function getCoverageOverview(): Promise<CoverageRow[]> {
  const { rows } = await pool.query<{ source: string; city: string; last: string | null }>(
    `SELECT source, city, max(collected_at)::text AS last
     FROM airbnb_snapshots GROUP BY source, city`,
  );
  const seen = new Set<string>();
  const out: CoverageRow[] = [];
  for (const r of rows) {
    const code = CODE_BY_SOURCE[r.source];
    if (!code) continue; // nguồn lạ (vd example) — không báo cáo
    const key = `${code}/${r.city}`;
    seen.add(key);
    const sloDays = SLO_DAYS[code];
    const ageDays = r.last
      ? Math.floor((Date.now() - new Date(r.last).getTime()) / 864e5)
      : null;
    out.push({
      code,
      city: r.city,
      lastSnapshotAt: r.last,
      ageDays,
      sloDays,
      status: ageDays === null ? "none" : ageDays <= sloDays ? "fresh" : "stale",
    });
  }
  // Nguồn–city chưa từng có snapshot → status none để SLO thấy được khoảng trống
  const cities = [...new Set(rows.map((r) => r.city))];
  for (const code of Object.keys(SLO_DAYS)) {
    for (const city of cities) {
      const key = `${code}/${city}`;
      if (!seen.has(key)) {
        out.push({ code, city, lastSnapshotAt: null, ageDays: null, sloDays: SLO_DAYS[code], status: "none" });
      }
    }
  }
  return out.sort((a, b) => a.code.localeCompare(b.code) || a.city.localeCompare(b.city));
}
