import { fmtInt, fmtPct } from "@/lib/format"
import type { SourceFlow } from "@/lib/data-flow-queries"
import { hasBranches, toReadOf } from "./flow-branches"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

/**
 * Dữ liệu Sankey của «Đường ống» — chuyển thể `data.ts` của @reui/chart-49: thay JOURNEYS mẫu bằng số chặng của các
 * nguồn đang chọn; mỗi chặng tách người ở lại và nhánh rơi. Hai đơn vị nối nhau ở chặng «Tin rao mới»: mỗi tin tính
 * bằng bài đầu tiên của nó, phần bài còn lại đi nhánh «Gộp vào tin đã có» — nên dòng chảy vẫn bảo toàn.
 * DF6 (`bai-nhan-tru-bai-chi-anh`): khối có nhánh bài thì «Bài nhận» tách «Ảnh đã ghép vào tin» (không cần đọc) và cột
 * «Bài cần đọc» — mẫu số của «Đọc được»; «Bài cần đọc» chảy vào hai đầu ra NGANG HÀNG «Đọc thành tin rao» và «Đọc thành
 * Yêu cầu» (Mạnh chốt ở Cổng Phạm vi 09/11: Yêu cầu là đầu ra ngang tin rao, «Đọc được» = tin rao + Yêu cầu), cùng hai
 * nhánh rơi «Ảnh chưa ghép» · «Không đọc được». Khối chưa tách nhánh (null) → cây như trước DF6.
 */

/** channel = nguồn · journey = đang chảy · linked = Gắn căn (đích) · located = Định vị · clustered = Gom cụm ·
 * dropped = rơi · merged = gộp trùng hay chờ số (không phải mất) · inquiry = đọc thành Yêu cầu (đầu ra ngang tin rao). */
export type Stage = "channel" | "journey" | "linked" | "located" | "clustered" | "dropped" | "merged" | "inquiry"

/** `labeled` = nút giữa vẫn ghi tên cạnh thanh (mặc định chỉ nút đầu và nút cuối có nhãn). */
export type FlowNode = { id: string; name: string; stage: Stage; amount: number; hint?: string; labeled?: boolean }
export type FlowLink = { source: number; target: number; value: number }
/** `focal` = số đích của cả ống; `weak` = đích dưới 80% (tô đỏ thay vì xanh). */
export type ColumnHeader = { title: string; value: string; note?: string; focal?: boolean; weak?: boolean }

type Draft = Omit<FlowNode, "amount"> & { amount: number }

export function buildFlow(sources: SourceFlow[], roles: SourceRoles) {
  const sum = (pick: (s: SourceFlow) => number) => sources.reduce((acc, s) => acc + pick(s), 0)
  const received = sum((s) => s.received)
  const readable = sum((s) => s.readable)
  const offers = sum((s) => s.offers)
  // Nhánh bài (DF6): chỉ khi mọi nguồn có bài đều đã tách — không cộng null thành 0.
  const branched = hasBranches(sources)
  const imageMerged = branched ? sum((s) => s.imageMerged ?? 0) : 0
  const inquiry = branched ? sum((s) => s.inquiry ?? 0) : 0
  const imageUnmerged = branched ? sum((s) => s.imageUnmerged ?? 0) : 0
  const toRead = sum((s) => toReadOf(branched ? s : { received: s.received }))
  // Mức nhận diện (gan-can-dinh-danh-duy-nhat): chia Tin rao theo mức SÂU NHẤT, loại trừ nhau, để dòng bảo toàn — ba
  // cột độc lập nằm ở lưới. Khối tính sẵn đời trước (nguồn có tin mà thiếu `deepest`) không có số: một nút chờ, không
  // đoán, không rơi về số cũ.
  const known = sources.every((s) => s.offers === 0 || s.deepest !== null)
  const deep = (pick: (d: NonNullable<SourceFlow["deepest"]>) => number) => sum((s) => (s.deepest ? pick(s.deepest) : 0))
  const unit = known ? deep((d) => d.unitLinked) : 0
  const located = known ? deep((d) => d.located) : 0
  const clustered = known ? deep((d) => d.clustered) : 0
  const locatedPending = sum((s) => s.locatedPending ?? 0)
  const uniqueIdPending = sum((s) => s.uniqueIdPending ?? 0)
  const levels: Draft[] = known
    ? [
        { id: "unit", name: "Gắn căn", stage: "linked", amount: unit },
        { id: "located", name: "Định vị", stage: "located", amount: located },
        { id: "clustered", name: "Gom cụm", stage: "clustered", amount: clustered },
        {
          id: "unlocated",
          name: "Chưa định vị",
          stage: "dropped",
          amount: offers - unit - located - clustered,
          hint: `Chưa khớp danh bạ: ${fmtInt(locatedPending)} tin ghi toà hoặc trục, ${fmtInt(uniqueIdPending)} tin đủ định danh (mã căn, số nhà) đang chờ khớp; còn lại chưa ghi toà, trục hay số nhà và chưa cùng cụm với tin khác`,
        },
      ]
    : [{ id: "levels-pending", name: "Chờ lượt làm tươi", stage: "merged", amount: offers, hint: "Số mức nhận diện có ở lượt làm tươi kế" }]

  // Thứ tự mảng = thứ tự dọc trong từng cột: nhánh ở lại nằm trên.
  const drafts: Draft[] = [
    ...sources.map((s) => ({ id: s.source, name: sourceLabel(s.source, roles), stage: "channel" as const, amount: s.received })),
    { id: "received", name: "Bài nhận", stage: "journey", amount: received },
    ...(branched
      ? ([
          {
            id: "imageMerged",
            name: "Ảnh đã ghép vào tin",
            stage: "merged",
            amount: imageMerged,
            hint: "Tin nhắn chỉ có ảnh, đã ghép vào tin của cùng người gửi — không cần đọc, không tính vào mẫu số",
          },
          { id: "toRead", name: "Bài cần đọc", stage: "journey", amount: toRead, hint: "Bài nhận trừ ảnh đã ghép vào tin — mẫu số của «Đọc được»" },
        ] satisfies Draft[])
      : []),
    branched
      ? { id: "readable", name: "Đọc thành tin rao", stage: "journey", amount: readable, labeled: true, hint: "Bài bán hay cho thuê đã thành (một phần của) tin rao" }
      : { id: "readable", name: "Đọc được", stage: "journey", amount: readable },
    ...(branched
      ? ([
          {
            id: "inquiry",
            name: "Đọc thành Yêu cầu",
            stage: "inquiry",
            amount: inquiry,
            hint: "Bài tìm mua hoặc tìm thuê của bên mua — đầu ra ngang tin rao; chưa đi tiếp vì bảng Yêu cầu chưa có ở máy thu",
          },
          {
            id: "imageUnmerged",
            name: "Ảnh chưa ghép",
            stage: "dropped",
            amount: imageUnmerged,
            hint: "Tin nhắn chỉ có ảnh chưa ghép được vào tin nào — không có bài chữ cùng người trong 2 phút, hoặc bài chữ ấy không thành tin",
          },
        ] satisfies Draft[])
      : []),
    {
      id: "unreadable",
      name: "Không đọc được",
      stage: "dropped",
      amount: toRead - readable - inquiry - imageUnmerged,
      hint: "Không ra loại tin hoặc giá — bài chat, tin thiếu giá, giá phi lý",
    },
    { id: "offers", name: "Tin rao mới", stage: "journey", amount: offers },
    {
      id: "merged",
      name: "Gộp vào tin đã có",
      stage: "merged",
      amount: readable - offers,
      hint: "Bài đăng lại hoặc trùng nội dung với một tin đã có",
    },
    ...levels,
  ]
  const edges: [string, string][] = [
    ...sources.map((s): [string, string] => [s.source, "received"]),
    ...(branched
      ? ([
          ["received", "imageMerged"],
          ["received", "toRead"],
          ["toRead", "readable"],
          ["toRead", "inquiry"],
          ["toRead", "imageUnmerged"],
          ["toRead", "unreadable"],
        ] satisfies [string, string][])
      : ([
          ["received", "readable"],
          ["received", "unreadable"],
        ] satisfies [string, string][])),
    ["readable", "offers"],
    ["readable", "merged"],
    ...levels.map((l): [string, string] => ["offers", l.id]),
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
    ...(branched ? { toRead: { title: "Bài cần đọc", value: fmtInt(toRead) } } : {}),
    // «Đọc được» = tin rao + Yêu cầu khi khối đã tách nhánh (Hỏi-2, Mạnh 09/11); chưa tách → tin rao trên bài nhận như cũ.
    readable: { title: "Đọc được", value: fmtInt(readable + inquiry), note: rate(readable + inquiry, toRead) },
    offers: { title: "Tin rao mới", value: fmtInt(offers), note: offers > 0 ? `${(readable / offers).toFixed(1)} bài/tin` : undefined },
  }
  // Nút 0 bị bỏ — chú thích cột cuối đứng trên nút có số đầu tiên của cột.
  const top = levels.find((l) => l.amount > 0)
  if (top)
    headers[top.id] = {
      title: "Gắn căn",
      value: known ? rate(unit, offers) : "—",
      // Ngắn để vừa lề phải của Sankey; câu đầy đủ nằm ở gợi ý nút «Chưa định vị».
      note: known && uniqueIdPending > 0 ? `${fmtInt(uniqueIdPending)} chờ khớp` : undefined,
      focal: true,
      weak: known && offers > 0 && unit / offers < 0.8,
    }
  return { nodes, links, headers, totals: { received, toRead, readable, inquiry, offers, unitLinked: known ? unit : null }, branched }
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
