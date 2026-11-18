import { maskSourceNames, type SourceNameEntry } from "../../mask-source-names"
import type { MotDuAn } from "./du-an"

/**
 * Hàng bảng toà → căn của /ops/registry/[nodeId], dựng ở máy chủ: mọi chữ lấy từ nguồn (tên toà, mã toà, trục, mã căn)
 * qua bộ che tên nguồn trước khi rời máy chủ — căn nằm trong `subRows`, trình duyệt nhận đủ dù chưa bấm mở.
 */
export type HangToa = {
  key: string
  laCan: boolean
  ten: string
  phu: string
  bac: string
  nguon: string[]
  soTruc: number | null
  soCan: number | null
  subRows?: HangToa[]
}

/** Tên khác nhau chỉ ở hoa/thường là một tên; giữ bản gặp trước. */
function motTen(ds: string[]): string[] {
  const m = new Map<string, string>()
  for (const t of ds) if (!m.has(t.toLowerCase())) m.set(t.toLowerCase(), t)
  return [...m.values()]
}

/** Mã dạng UUID (S09) không đọc được bằng mắt nên không hiện ở dòng mã. */
const maDoc = (ds: string[]) => ds.filter((m) => !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(m))

export function dungHangToa(duAn: MotDuAn, id: number, entries: SourceNameEntry[]): HangToa[] {
  const che = (s: string) => maskSourceNames(s, entries) ?? "—"
  const tenNut = new Map(duAn.nut.map((n) => [n.id, che(n.ten)]))
  const canTheoToa = new Map<string, HangToa[]>()
  for (const c of duAn.can) {
    const phu = [c.tang ? `Tầng ${c.tang}` : null, c.truc ? `Trục ${che(c.truc)}` : null].filter(Boolean).join(" · ")
    const hang: HangToa = { key: c.key, laCan: true, ten: c.ma ? che(c.ma) : c.key, phu, bac: c.bac, nguon: c.nguon, soTruc: null, soCan: null }
    canTheoToa.set(c.toaKey, [...(canTheoToa.get(c.toaKey) ?? []), hang])
  }
  return duAn.toa.map((t) => {
    const can = canTheoToa.get(t.key)
    const ma = maDoc(t.maNguon)
    return {
      key: t.key,
      laCan: false,
      ten: motTen(t.ten.map(che)).join(" · ") || (ma[0] ? che(ma[0]) : t.key),
      // Nút hiệu lực đứng đầu; khi S09 xếp toà khác cột gốc thì nói ra nút gốc để người vận hành thấy nguồn của phân khu.
      phu: [
        t.nutId === id ? null : tenNut.get(t.nutId),
        t.nutIdGoc != null && t.nutIdGoc !== t.nutId ? `S09 xếp lại, gốc: ${che(t.tenNutGoc ?? String(t.nutIdGoc))}` : null,
        ma.length > 0 ? `Mã ${ma.map(che).join(", ")}` : null,
      ].filter(Boolean).join(" · "),
      bac: t.bac,
      nguon: t.nguon,
      soTruc: t.soTruc,
      soCan: t.soCan,
      ...(can ? { subRows: can } : {}),
    }
  })
}
