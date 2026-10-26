import type { DataFlow } from "@/lib/data-flow-queries"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

/**
 * Hàng của lưới «Chất lượng từng chặng» và luật chấm nút thắt. Ngưỡng tạm (Mạnh duyệt dùng tới khi PL9 có số đo, 26/10):
 * đọc được < 30% hay trường lõi/phường/gắn căn < 50% là «Kẹt»; dưới 60% / 80% là «Theo dõi»; im quá 48 giờ là «Im».
 */

export type Health = { tone: "success" | "warning" | "destructive"; label: string }

export type QualityRow = {
  id: string
  name: string
  meta: string
  received: number
  readable: number
  offers: number
  /** null = không áp dụng cho hàng này (nhóm thu, listing ngắn hạn). */
  complete: number | null
  withWard: number | null
  linked: number | null
  latestAt: string | null
  approx: boolean
  health: Health
}

const HOUR = 3600000

function healthOf(r: Omit<QualityRow, "health">, nowMs: number): Health {
  const rate = (a: number | null, b: number) => (a === null || b === 0 ? null : a / b)
  const checks: { name: string; value: number | null; stuck: number; watch: number }[] = [
    { name: "đọc", value: rate(r.readable, r.received), stuck: 0.3, watch: 0.6 },
    { name: "trường lõi", value: rate(r.complete, r.offers), stuck: 0.5, watch: 0.8 },
    { name: "phường", value: rate(r.withWard, r.offers), stuck: 0.5, watch: 0.8 },
    { name: "gắn căn", value: rate(r.linked, r.offers), stuck: 0.5, watch: 0.8 },
  ]
  const stuck = checks.find((c) => c.value !== null && c.value < c.stuck)
  if (stuck) return { tone: "destructive", label: `Kẹt · ${stuck.name}` }
  const ageH = r.latestAt ? (nowMs - Date.parse(r.latestAt.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"))) / HOUR : null
  if (ageH !== null && ageH > 48) return { tone: "warning", label: `Im ${Math.floor(ageH / 24)} ngày` }
  const watch = checks.find((c) => c.value !== null && c.value < c.watch)
  if (watch) return { tone: "warning", label: `Theo dõi · ${watch.name}` }
  return { tone: "success", label: "Khoẻ" }
}

export function sourceRows(flow: DataFlow, roles: SourceRoles, nowMs: number): QualityRow[] {
  const rows: Omit<QualityRow, "health">[] = flow.sources
    .filter((s) => s.received > 0 || s.offers > 0)
    .map((s) => ({
      id: s.source,
      name: sourceLabel(s.source, roles),
      meta: s.approx ? "Tin rao · đọc được ước lượng" : `Tin rao · ${s.testRejected > 0 ? `gạt ${s.testRejected} bài thử` : "không có bài thử"}`,
      received: s.received,
      readable: s.readable,
      offers: s.offers,
      complete: s.complete,
      withWard: s.withWard,
      linked: s.linked,
      latestAt: s.latestAt,
      approx: s.approx,
    }))
  const ss = flow.shortStay
  if (ss.received > 0 || ss.stored > 0) {
    rows.push({
      id: "S01",
      name: sourceLabel("S01", roles),
      meta: "Listing ngắn hạn · không ghép căn",
      received: ss.received,
      readable: ss.stored,
      offers: ss.stored,
      complete: null,
      withWard: ss.withWard,
      linked: null,
      latestAt: ss.latestAt ? `${ss.latestAt}T00:00:00+07:00` : null,
      approx: false,
    })
  }
  return rows.map((r) => ({ ...r, health: healthOf(r, nowMs) }))
}

export function groupRows(flow: DataFlow, roles: SourceRoles, nowMs: number): QualityRow[] {
  return flow.groups.map((g) => {
    const r = {
      id: `${g.source}|${g.group}`,
      name: g.group,
      meta: `Nhóm thu ${sourceLabel(g.source, roles)}`,
      received: g.received,
      readable: g.readable,
      offers: g.offers,
      complete: null,
      withWard: null,
      linked: null,
      latestAt: g.latestAt,
      approx: false,
    }
    return { ...r, health: healthOf(r, nowMs) }
  })
}
