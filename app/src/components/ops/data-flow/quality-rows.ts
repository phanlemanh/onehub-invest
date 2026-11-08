import type { DataFlow } from "@/lib/data-flow-queries"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

/**
 * Hàng của lưới «Chất lượng từng chặng» và luật chấm nút thắt. Ngưỡng tạm (Mạnh duyệt dùng tới khi PL9 có số đo, 26/10):
 * đọc được < 30% hay trường lõi/phường < 50% là «Kẹt»; dưới 60% / 80% là «Theo dõi»; im quá 48 giờ là «Im».
 * Kiểm «gắn căn» bỏ từ 08/11 (gan-can-dinh-danh-duy-nhat, Hỏi-1): gắn căn nay là khớp danh bạ, bằng 0 ở mọi nguồn tới khi có
 * bộ gắn — giữ kiểm thì mọi nguồn «Kẹt» và che nút thắt thật. Ba cột mức nhận diện vẫn hiện số.
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
  /** Mức nhận diện (Levels của data-flow-queries) — null = không áp dụng (nhóm thu, S01) hoặc khối cũ chưa có số. */
  clustered: number | null
  located: number | null
  unitLinked: number | null
  locatedPending: number | null
  uniqueIdPending: number | null
  /** Khối tính sẵn đời trước: nguồn tin rao mà chưa có số mức nhận diện. */
  levelsPending: boolean
  latestAt: string | null
  approx: boolean
  health: Health
}

const HOUR = 3600000

type Check = { name: string; num: (r: Omit<QualityRow, "health">) => number | null; den: (r: Omit<QualityRow, "health">) => number; stuck: number; watch: number }

/** Luật nút thắt, theo thứ tự đường ống: chặng đầu tiên chạm ngưỡng là nút thắt (xuất cho phép đo). */
export const NUT_THAT_CHECKS: readonly Check[] = [
  { name: "đọc", num: (r) => r.readable, den: (r) => r.received, stuck: 0.3, watch: 0.6 },
  { name: "trường lõi", num: (r) => r.complete, den: (r) => r.offers, stuck: 0.5, watch: 0.8 },
  { name: "phường", num: (r) => r.withWard, den: (r) => r.offers, stuck: 0.5, watch: 0.8 },
]

export function healthOf(r: Omit<QualityRow, "health">, nowMs: number, rules: readonly Check[] = NUT_THAT_CHECKS): Health {
  const rate = (a: number | null, b: number) => (a === null || b === 0 ? null : a / b)
  const checks = rules.map((c) => ({ ...c, value: rate(c.num(r), c.den(r)) }))
  const stuck = checks.find((c) => c.value !== null && c.value < c.stuck)
  if (stuck) return { tone: "destructive", label: `Kẹt · ${stuck.name}` }
  const ageH = r.latestAt ? (nowMs - Date.parse(r.latestAt.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"))) / HOUR : null
  if (ageH !== null && ageH > 48) return { tone: "warning", label: `Im ${Math.floor(ageH / 24)} ngày` }
  const watch = checks.find((c) => c.value !== null && c.value < c.watch)
  if (watch) return { tone: "warning", label: `Theo dõi · ${watch.name}` }
  return { tone: "success", label: "Khoẻ" }
}

const NO_LEVELS = { clustered: null, located: null, unitLinked: null, locatedPending: null, uniqueIdPending: null, levelsPending: false }

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
      clustered: s.clustered,
      located: s.located,
      unitLinked: s.unitLinked,
      locatedPending: s.locatedPending,
      uniqueIdPending: s.uniqueIdPending,
      levelsPending: s.clustered === null,
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
      ...NO_LEVELS,
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
      ...NO_LEVELS,
      latestAt: g.latestAt,
      approx: false,
    }
    return { ...r, health: healthOf(r, nowMs) }
  })
}
