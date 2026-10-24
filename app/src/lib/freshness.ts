/**
 * freshness.ts — định nghĩa độ tươi từng nguồn mà /ops, /ops/collections và /api/v1/ops/coverage dùng chung
 * (AU6 `slo-mot-nguon`). Là bản TypeScript của `scripts/lib/freshness.mjs` (AU4, CLI check-freshness):
 * hai bản giữ khớp từng hằng, từng câu SQL và từng hàng đầu ra bằng `scripts/freshness-parity.test.mjs` —
 * sửa một bên thì sửa cả bên kia. Tệp thuần: không import lúc chạy, nhận client đã kết nối.
 *
 * Mỗi mã đọc bảng NẠP THẬT của nó, lọc bằng `source_ids` đọc từ `source_registry` (SPL: không literal nguồn,
 * không đọc `real_name`), tuổi tính theo GIỜ THU — không theo giờ nạp. Mã `completed` (S04) không đo.
 */

export type FreshnessStatus = "fresh" | "stale" | "none" | "no-slo"

export type FreshnessRow = {
  code: string
  city: string | null
  last: string | null
  ageHours: number | null
  sloHours: number | null
  status: FreshnessStatus
}

/** Client tối thiểu (pg.Pool hay pg.Client đều khớp). */
export type QueryClient = {
  query: (sql: string, args?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
}

/** SLO theo giờ. S01/S02/S03 = 8/35/3 ngày (ADR-0007; Mạnh chốt Hỏi-1 AU4 23/10); S05/S06 theo nhịp thu. */
export const SLO_HOURS: Record<string, number> = { S01: 192, S02: 840, S03: 72, S05: 12, S06: 36 }

/** Cột thời gian (giờ thu) mà probe của từng mã lấy max. */
export const TIME_SOURCE: Record<string, string> = {
  S01: "airbnb_snapshots.collected_at",
  S02: "airdna_markets.captured_at",
  S03: "airbnb_snapshots.collected_at",
  S05: "airbnb_snapshots.collected_at",
  S06: "airbnb_snapshots.collected_at",
}

const ZALO_POSTS = `
  SELECT s.city, max(s.collected_at) AS last
  FROM stg_zalo_posts p JOIN airbnb_snapshots s USING (snapshot_id)
  WHERE p.agent_id = ANY($1)
     OR (s.source = ANY($1) AND (p.agent_id IS NULL OR NOT p.agent_id = ANY($2)))
  GROUP BY s.city`

/** Truy vấn bảng thật theo mã; `args(ids, others)` = source_ids của mã và của mọi mã active khác. */
export const PROBES: Record<string, { sql: string; args: (ids: string[], others: string[]) => unknown[] }> = {
  S01: {
    sql: `SELECT city, max(collected_at) AS last FROM airbnb_snapshots
          WHERE source = ANY($1) GROUP BY city`,
    args: (ids) => [ids],
  },
  S02: {
    sql: `SELECT country_code AS city, max(captured_at) AS last FROM airdna_markets
          GROUP BY country_code`,
    args: () => [],
  },
  S03: { sql: ZALO_POSTS, args: (ids, others) => [ids, others] },
  S05: { sql: ZALO_POSTS, args: (ids, others) => [ids, others] },
  S06: {
    sql: `SELECT s.city, max(s.collected_at) AS last
          FROM stg_chotot_ads c JOIN airbnb_snapshots s USING (snapshot_id)
          WHERE s.source = ANY($1) GROUP BY s.city`,
    args: (ids) => [ids],
  },
}

export async function readFreshness(client: QueryClient, { now = new Date() }: { now?: Date } = {}): Promise<FreshnessRow[]> {
  const { rows: reg } = await client.query(
    `SELECT code, source_ids FROM source_registry WHERE status = 'active' ORDER BY code`,
  )
  const registry = reg as { code: string; source_ids: string[] }[]
  const out: FreshnessRow[] = []
  for (const { code, source_ids: ids } of registry) {
    const sloHours = SLO_HOURS[code] ?? null
    if (sloHours === null) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours: null, status: "no-slo" })
      continue
    }
    const probe = PROBES[code]
    const others = registry.filter((r) => r.code !== code).flatMap((r) => r.source_ids)
    const rows = probe ? ((await client.query(probe.sql, probe.args(ids, others))).rows as { city: string; last: unknown }[]) : []
    const seen = rows.filter((r) => r.last !== null)
    if (seen.length === 0) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours, status: "none" })
      continue
    }
    for (const r of seen) {
      const last = new Date(r.last as string)
      const ageHours = Math.floor((now.getTime() - last.getTime()) / 3.6e6)
      out.push({
        code,
        city: r.city,
        last: last.toISOString(),
        ageHours,
        sloHours,
        status: ageHours <= sloHours ? "fresh" : "stale",
      })
    }
  }
  return out.sort((a, b) => a.code.localeCompare(b.code) || String(a.city).localeCompare(String(b.city)))
}

/** Trạng thái của một NGUỒN gộp từ các hàng thành phố: quá hạn ở bất kỳ đâu thắng, rồi chưa có dữ liệu. */
export type SourceFreshness = {
  code: string
  status: FreshnessStatus
  /** Tuổi lớn nhất trong các thành phố có dữ liệu (null khi chưa có). */
  ageHours: number | null
  sloHours: number | null
}

type SourceInput = Pick<FreshnessRow, "code" | "status" | "ageHours" | "sloHours">

export function bySource(rows: SourceInput[]): SourceFreshness[] {
  const m = new Map<string, SourceInput[]>()
  for (const r of rows) m.set(r.code, [...(m.get(r.code) ?? []), r])
  return [...m.entries()]
    .map(([code, rs]) => {
      const status: FreshnessStatus = rs.some((r) => r.status === "no-slo")
        ? "no-slo"
        : rs.some((r) => r.status === "stale")
          ? "stale"
          : rs.some((r) => r.status === "none")
            ? "none"
            : "fresh"
      const ages = rs.map((r) => r.ageHours).filter((a): a is number => a !== null)
      return { code, status, ageHours: ages.length ? Math.max(...ages) : null, sloHours: rs[0].sloHours }
    })
    .sort((a, b) => a.code.localeCompare(b.code))
}

/** Con số hai trang Ops cùng hiện (Hỏi-1 A): nguồn đạt khi mọi thành phố có dữ liệu của nó đạt;
 * `total` = nguồn active có SLO (mã chưa khai SLO và mã completed không đếm). */
export type SloSummary = { ok: number; total: number }

export function summarizeSources(sources: Pick<SourceFreshness, "status">[]): SloSummary {
  const counted = sources.filter((s) => s.status !== "no-slo")
  return { ok: counted.filter((s) => s.status === "fresh").length, total: counted.length }
}

/** Dùng cho hàng của readFreshness lẫn ô /ops (CoverageRow) — cùng một luật. */
export const summarizeFreshness = (rows: SourceInput[]): SloSummary => summarizeSources(bySource(rows))

/** Giá trị thuộc tính `data-slo-summary` và chữ hiện cho người — một chỗ sinh cho cả hai trang. */
export const sloSummaryKey = (s: SloSummary) => `${s.ok}/${s.total}`
export const LOCAL_ONLY_TEXT = "Độ tươi chỉ đo ở máy local"
export const sloSummaryText = (s: SloSummary, localOnly = false) =>
  localOnly ? LOCAL_ONLY_TEXT : s.total === 0 ? "Chưa có nguồn nào" : `${s.ok}/${s.total} nguồn đạt SLO`

/**
 * Mức trễ so SLO (YC4 — «8 ngày / SLO 8 ngày» không nói nguồn trễ bao lâu). `null` khi chưa trễ, cùng vị từ với
 * `status` ("fresh" khi tuổi ≤ SLO). Dưới 1 giờ tính phút, dưới 48 giờ tính giờ, còn lại tính ngày; làm tròn xuống,
 * tối thiểu 1. Tính trên số giây nguyên để 59 phút không thành 58 vì sai số dấu phẩy động.
 */
export function fmtOverdue(ageHours: number | null, sloHours: number | null): string | null {
  if (ageHours === null || sloHours === null || !Number.isFinite(ageHours) || !Number.isFinite(sloHours)) return null
  if (ageHours <= sloHours) return null
  const giay = Math.round((ageHours - sloHours) * 3600)
  if (giay < 3600) return `trễ ${Math.max(1, Math.floor(giay / 60))} phút`
  if (giay < 48 * 3600) return `trễ ${Math.floor(giay / 3600)} giờ`
  return `trễ ${Math.floor(giay / 86400)} ngày`
}

/** Tuổi/SLO một cách viết cho mọi bề mặt: dưới 48 giờ «N giờ», từ 48 giờ «N ngày» (làm tròn xuống). */
export function fmtAge(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—"
  return hours < 48 ? `${Math.floor(hours)} giờ` : `${Math.floor(hours / 24)} ngày`
}
