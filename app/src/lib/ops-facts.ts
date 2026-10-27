/**
 * ops-facts.ts — hàm đọc chung số tổng hợp Ops mà máy local đẩy lên cloud (ON22 `ops-facts-so-tong-hop`, ADR-0014).
 * Bên ghi: `pipeline/push-ops-facts.mjs` → `/api/v1/ops/ingest` → một dòng `ops_heartbeat` (payload jsonb) mỗi lượt
 * cloud-sync 15′. Payload mang `pushedAt` và `blocks.<khối> = { measured_at, ...dữ liệu }` hoặc `{ measured_at, error }`.
 *
 * Ba trạng thái (ADR-0014 §Ngưỡng trễ): không có dòng → `none`; trong 45′ → `fresh`; quá 45′ → `stale`. Bản tin xét
 * theo `pushedAt`, từng khối theo `measured_at` của khối — một khối có thể cũ trong một bản tin còn tươi. Khối mang
 * `error` có trạng thái `error`: trang hiện «không đo được», không bao giờ vẽ 0 hay xanh. Trang hiện số là việc của
 * ON3 / ON23 / AU12 — tệp này chỉ đọc.
 */
import { pool } from "./db"

/** Ngưỡng số cũ: 3 lượt cloud-sync 15′. Hằng DUY NHẤT — đổi chu kỳ cloud-sync thì đổi ở đây (ADR-0014). */
export const FACTS_STALE_MS = 45 * 60_000

export const OPS_FACT_BLOCKS = ["freshness", "jobs", "lockdown", "records24h", "reviewQueue", "luong7", "s03", "dataFlow"] as const
export type OpsFactBlockName = (typeof OPS_FACT_BLOCKS)[number]

export type FactsState = "none" | "fresh" | "stale"

export type OpsFactBlock = {
  state: "fresh" | "stale" | "error"
  measuredAt: string | null
  data: Record<string, unknown> | null
  error: string | null
}

export type OpsFacts = {
  state: FactsState
  facts: Record<string, unknown> | null
  measuredAt: string | null
  blocks: Partial<Record<OpsFactBlockName, OpsFactBlock>>
}

const ageState = (iso: string | null, now: Date): "fresh" | "stale" => {
  const t = iso ? Date.parse(iso) : Number.NaN
  return Number.isFinite(t) && now.getTime() - t <= FACTS_STALE_MS ? "fresh" : "stale"
}

/** Đọc dòng `ops_heartbeat` 'primary' và phân trạng thái. `now` chỉ để phép đo trỏ mốc giờ. */
export async function readOpsFacts({ now = new Date() }: { now?: Date } = {}): Promise<OpsFacts> {
  const { rows } = await pool.query<{ payload: Record<string, unknown> }>(
    `SELECT payload FROM ops_heartbeat WHERE id = 'primary'`,
  )
  const facts = rows[0]?.payload ?? null
  if (!facts) return { state: "none", facts: null, measuredAt: null, blocks: {} }
  const measuredAt = typeof facts.pushedAt === "string" ? facts.pushedAt : null
  const raw = (facts.blocks ?? {}) as Record<string, Record<string, unknown> | undefined>
  const blocks: OpsFacts["blocks"] = {}
  for (const name of OPS_FACT_BLOCKS) {
    const b = raw[name]
    if (!b || typeof b !== "object") continue
    const at = typeof b.measured_at === "string" ? b.measured_at : null
    const { measured_at: _at, error, ...data } = b
    void _at
    blocks[name] =
      typeof error === "string"
        ? { state: "error", measuredAt: at, data: null, error }
        : { state: ageState(at, now), measuredAt: at, data, error: null }
  }
  return { state: ageState(measuredAt, now), facts, measuredAt, blocks }
}
