/**
 * freshness.ts — định nghĩa độ tươi từng nguồn mà /ops, /ops/collections và /api/v1/ops/coverage dùng chung
 * (AU6 `slo-mot-nguon`). Là bản TypeScript của `scripts/lib/freshness.mjs` (AU4, CLI check-freshness):
 * hai bản giữ khớp từng hằng, từng câu SQL và từng hàng đầu ra bằng `scripts/freshness-parity.test.mjs` —
 * sửa một bên thì sửa cả bên kia. Tệp thuần: không import lúc chạy, nhận client đã kết nối.
 *
 * Mỗi mã đọc bảng NẠP THẬT của nó, lọc bằng `source_ids` đọc từ `source_registry` (SPL: không literal nguồn,
 * không đọc `real_name`), tuổi tính theo GIỜ THU — không theo giờ nạp. Chỉ đo dòng `active`. Mã không có câu đo riêng
 * đo qua `stg_tables` của chính nó (S09, S16); thành phố lọc theo `measured_markets` khi sổ khai.
 *
 * Nhịp (SLO) đọc từ `source_registry.cadence_hours` (migration 122, NK1 so-nguon-kho-khai-bao) — không còn hằng trong mã;
 * NULL = «chưa khai SLO». Sổ chưa có cột (chưa áp 122) → ném lỗi gọi tên migration, không rơi về số cũ.
 */

export type FreshnessStatus = "fresh" | "stale" | "none" | "no-slo"

export type FreshnessRow = {
  code: string
  city: string | null
  last: string | null
  ageHours: number | null
  sloHours: number | null
  status: FreshnessStatus
  /** Chỉ có ở hàng `none` khi câu đo qua bảng nạp không chạy được (tên sai khuôn, bảng không có). */
  reason?: string
}

/** Client tối thiểu (pg.Pool hay pg.Client đều khớp). */
export type QueryClient = {
  query: (sql: string, args?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
}

/** Cột thời gian (giờ thu) mà probe của từng mã lấy max. */
export const TIME_SOURCE: Record<string, string> = {
  S01: "airbnb_snapshots.collected_at",
  S02: "airdna_markets.captured_at",
  S03: "airbnb_snapshots.collected_at",
  S05: "airbnb_snapshots.collected_at",
  S06: "airbnb_snapshots.collected_at",
  S08: "airbnb_snapshots.collected_at",
  S10: "airbnb_snapshots.collected_at",
  S11: "airbnb_snapshots.collected_at",
}

/** Cột thời gian của câu đo chung qua bảng nạp (mã không có câu riêng, đo theo `stg_tables`). */
export const STG_TIME_SOURCE = "airbnb_snapshots.collected_at"

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
  S08: {
    sql: `SELECT s.city, max(s.collected_at) AS last
          FROM stg_s08_inventory i JOIN airbnb_snapshots s USING (snapshot_id)
          WHERE s.source = ANY($1) GROUP BY s.city`,
    args: (ids) => [ids],
  },
  // S10, S11 chưa có bảng stg (bộ nạp làn ZCode chưa có): đo ở mức bản thu, như S01 — bản thu nào của nguồn
  // cũng là một lần thu. Có bảng stg thì siết về join như S06, S08.
  S10: {
    sql: `SELECT city, max(collected_at) AS last FROM airbnb_snapshots
          WHERE source = ANY($1) GROUP BY city`,
    args: (ids) => [ids],
  },
  S11: {
    sql: `SELECT city, max(collected_at) AS last FROM airbnb_snapshots
          WHERE source = ANY($1) GROUP BY city`,
    args: (ids) => [ids],
  },
}

/**
 * Gộp nhãn thành phố của bản thu: `vn-<tp>` (dạng mã thị trường, 064) và `<tp>` là cùng một nơi — lấy lần thu mới nhất.
 * Không gộp thì một bản thu lẻ cũ dán `vn-hcmc` thành một ô «quá hạn» riêng, dù vùng thật dán `hcmc` vẫn thu đều
 * (báo nhầm S06/vn-hcmc 07/11, ON17). Nhãn cấp quốc gia (`vn`) giữ nguyên. Bản chép của scripts/lib/freshness.mjs.
 */
export function gopThanhPho<T extends { city: string | null; last: unknown }>(rows: T[]): T[] {
  const m = new Map<string | null, T>()
  for (const r of rows) {
    const city = typeof r.city === "string" ? r.city.replace(/^vn-(?=.)/, "") : r.city
    const cur = m.get(city)
    if (!cur || new Date(r.last as string).getTime() > new Date(cur.last as string).getTime()) m.set(city, { ...r, city })
  }
  return [...m.values()]
}

export const LOI_122 = "source_registry chưa có cột cadence_hours — áp migration 122"
export const REGISTRY_SQL = `SELECT code, source_ids, cadence_hours, stg_tables, measured_markets
    FROM source_registry WHERE status = 'active' ORDER BY code`

type RegistryRow = {
  code: string
  source_ids: string[]
  cadence_hours: number | null
  stg_tables: string[]
  measured_markets: string[] | null
}

/** Đọc các dòng `active` của sổ kèm cột của 122. Thiếu cột → lỗi gọi tên 122 (cả với client trả dòng thiếu khoá). */
async function docSo(client: QueryClient): Promise<RegistryRow[]> {
  let rows: Record<string, unknown>[]
  try {
    ;({ rows } = await client.query(REGISTRY_SQL))
  } catch (e) {
    if ((e as { code?: string })?.code === "42703") throw new Error(LOI_122)
    throw e
  }
  for (const r of rows)
    if (!("cadence_hours" in r) || !("stg_tables" in r) || !("measured_markets" in r)) throw new Error(LOI_122)
  return rows as RegistryRow[]
}

/** Khuôn tên bảng nạp: chỉ tên này mới được ghép vào câu SQL (sau khi đã chắc bảng có thật và có cột snapshot_id). */
export const STG_TEN = /^stg_[a-z0-9_]+$/

/** Câu đo chung qua bảng nạp: snapshot có dòng ở một trong các bảng → max(collected_at) theo thành phố. Tên sai khuôn,
 *  bảng không có thật hay không có snapshot_id → không chạy SQL mang tên đó, trả lý do. */
export async function probeStg(
  client: QueryClient,
  tables: string[],
): Promise<{ rows: { city: string; last: unknown }[]; reason?: string }> {
  const sai = tables.filter((t) => typeof t !== "string" || !STG_TEN.test(t))
  if (sai.length) return { rows: [], reason: `bảng nạp sai khuôn tên: ${sai.join(", ")}` }
  if (tables.length === 0) return { rows: [], reason: "sổ không khai bảng nạp" }
  const { rows: co } = await client.query(
    `SELECT t FROM unnest($1::text[]) AS t
      WHERE EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass(t) AND attname = 'snapshot_id' AND NOT attisdropped)`,
    [tables],
  )
  const coSet = new Set(co.map((r) => r.t as string))
  const thieu = tables.filter((t) => !coSet.has(t))
  if (thieu.length) return { rows: [], reason: `bảng nạp không có (hoặc thiếu snapshot_id): ${thieu.join(", ")}` }
  const u = tables.map((t) => `SELECT snapshot_id FROM ${t}`).join(" UNION ")
  const { rows } = await client.query(
    `SELECT s.city, max(s.collected_at) AS last FROM airbnb_snapshots s JOIN (${u}) u USING (snapshot_id) GROUP BY s.city`,
  )
  return { rows: rows as { city: string; last: unknown }[] }
}

export async function readFreshness(client: QueryClient, { now = new Date() }: { now?: Date } = {}): Promise<FreshnessRow[]> {
  const registry = await docSo(client)
  const out: FreshnessRow[] = []
  for (const { code, source_ids: ids, cadence_hours: cadence, stg_tables: stg, measured_markets: markets } of registry) {
    const sloHours = cadence ?? null
    if (sloHours === null) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours: null, status: "no-slo" })
      continue
    }
    const probe = PROBES[code]
    const others = registry.filter((r) => r.code !== code).flatMap((r) => r.source_ids)
    let rows: { city: string; last: unknown }[] = []
    let reason: string | undefined
    if (probe) rows = (await client.query(probe.sql, probe.args(ids, others))).rows as { city: string; last: unknown }[]
    else if (stg?.length) ({ rows, reason } = await probeStg(client, stg))
    const seen = gopThanhPho(rows.filter((r) => r.last !== null)).filter((r) => !markets || markets.includes(r.city))
    if (seen.length === 0) {
      out.push({ code, city: null, last: null, ageHours: null, sloHours, status: "none", ...(reason ? { reason } : {}) })
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
export const LOCAL_ONLY_TEXT = "Độ tươi chỉ đo ở máy thu"
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
