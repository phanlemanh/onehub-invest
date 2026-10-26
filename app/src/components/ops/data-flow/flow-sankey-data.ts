import { fmtInt, fmtPct } from "@/lib/format"
import type { SourceFlow } from "@/lib/data-flow-queries"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

/**
 * Dữ liệu Sankey của «Đường ống» — chuyển thể `data.ts` của @reui/chart-49: thay JOURNEYS mẫu bằng số chặng của các
 * nguồn đang chọn; mỗi chặng tách người ở lại và nhánh rơi. Hai đơn vị nối nhau ở chặng «Tin rao mới»: mỗi tin tính
 * bằng bài đầu tiên của nó, phần bài còn lại đi nhánh «Gộp vào tin đã có» — nên dòng chảy vẫn bảo toàn.
 */

/** channel = nguồn · journey = đang chảy · linked = tới đích · dropped = rơi · merged = gộp trùng (không phải mất). */
export type Stage = "channel" | "journey" | "linked" | "dropped" | "merged"

export type FlowNode = { id: string; name: string; stage: Stage; amount: number; hint?: string }
export type FlowLink = { source: number; target: number; value: number }
/** `focal` = số đích của cả ống; `weak` = đích dưới 80% (tô đỏ thay vì xanh). */
export type ColumnHeader = { title: string; value: string; note?: string; focal?: boolean; weak?: boolean }

type Draft = Omit<FlowNode, "amount"> & { amount: number }

export function buildFlow(sources: SourceFlow[], roles: SourceRoles) {
  const sum = (pick: (s: SourceFlow) => number) => sources.reduce((acc, s) => acc + pick(s), 0)
  const received = sum((s) => s.received)
  const readable = sum((s) => s.readable)
  const offers = sum((s) => s.offers)
  const linked = sum((s) => s.linked)

  // Thứ tự mảng = thứ tự dọc trong từng cột: nhánh ở lại nằm trên.
  const drafts: Draft[] = [
    ...sources.map((s) => ({ id: s.source, name: sourceLabel(s.source, roles), stage: "channel" as const, amount: s.received })),
    { id: "received", name: "Bài nhận", stage: "journey", amount: received },
    { id: "readable", name: "Đọc được", stage: "journey", amount: readable },
    {
      id: "unreadable",
      name: "Không đọc được",
      stage: "dropped",
      amount: received - readable,
      hint: "Không ra loại tin hoặc giá — bài chat, hỏi mua, tin thiếu giá",
    },
    { id: "offers", name: "Tin rao mới", stage: "journey", amount: offers },
    {
      id: "merged",
      name: "Gộp vào tin đã có",
      stage: "merged",
      amount: readable - offers,
      hint: "Bài đăng lại hoặc trùng nội dung với một tin đã có",
    },
    { id: "linked", name: "Gắn căn", stage: "linked", amount: linked },
    { id: "unlinked", name: "Chưa gắn căn", stage: "dropped", amount: offers - linked, hint: "Thiếu phường hoặc toạ độ để ghép căn" },
  ]
  const edges: [string, string][] = [
    ...sources.map((s): [string, string] => [s.source, "received"]),
    ["received", "readable"],
    ["received", "unreadable"],
    ["readable", "offers"],
    ["readable", "merged"],
    ["offers", "linked"],
    ["offers", "unlinked"],
  ]

  // Sankey không vẽ được nút 0: bỏ nút rỗng và cạnh dẫn tới nó.
  const nodes: FlowNode[] = drafts.filter((d) => d.amount > 0).map((d) => ({ ...d, amount: Math.max(0, d.amount) }))
  const index = new Map(nodes.map((n, i) => [n.id, i]))
  const links: FlowLink[] = edges
    .filter(([a, b]) => index.has(a) && index.has(b))
    .map(([a, b]) => ({ source: index.get(a)!, target: index.get(b)!, value: nodes[index.get(b === "received" ? a : b)!].amount }))

  const rate = (a: number, b: number) => (b > 0 ? fmtPct(a / b) : "—")
  const headers: Record<string, ColumnHeader> = {
    [sources.find((s) => s.received > 0)?.source ?? ""]: { title: "Nguồn", value: `${sources.filter((s) => s.received > 0).length} nguồn` },
    received: { title: "Bài nhận", value: fmtInt(received) },
    readable: { title: "Đọc được", value: fmtInt(readable), note: rate(readable, received) },
    offers: { title: "Tin rao mới", value: fmtInt(offers), note: offers > 0 ? `${(readable / offers).toFixed(1)} bài/tin` : undefined },
  }
  // Không tin nào gắn căn thì nút «Gắn căn» bị bỏ — chú thích cột đứng trên nhánh «Chưa gắn căn».
  headers[linked > 0 ? "linked" : "unlinked"] = {
    title: "Gắn căn",
    value: rate(linked, offers),
    focal: true,
    weak: offers > 0 && linked / offers < 0.8,
  }
  return { nodes, links, headers, totals: { received, readable, offers, linked } }
}

/** Chặng mà một nút được đo so với — cho tỉ lệ bước. */
export const PREVIOUS_STAGE: Record<string, string> = {
  readable: "received",
  unreadable: "received",
  offers: "readable",
  merged: "readable",
  linked: "offers",
  unlinked: "offers",
}

/** Nút phía trên `upFrom` và phía dưới `downFrom`, gồm cả hai. */
export function lineageOf(links: FlowLink[], upFrom: number, downFrom: number) {
  const up = new Set<number>([upFrom])
  const down = new Set<number>([downFrom])
  const walk = (set: Set<number>, from: "source" | "target") => {
    const to = from === "source" ? "target" : "source"
    let grew = true
    while (grew) {
      grew = false
      for (const link of links) {
        if (set.has(link[from]) && !set.has(link[to])) {
          set.add(link[to])
          grew = true
        }
      }
    }
  }
  walk(down, "source")
  walk(up, "target")
  return { up, down }
}
