/**
 * Ảnh và link của bài trên thẻ gắn nhãn (`anh-tren-the-gan-nhan`). Hàm thuần, không đọc DB, không đọc đĩa.
 * URL gốc mang tên miền nguồn (tầng A, ADR-0007): chỉ dùng ở máy chủ, trình duyệt chỉ nhận đường `/api/zalo-media?nhan=&anh=`.
 */

/** `url` của tệp chỉ để nhận ra link ảnh trong chữ bài, `sha256` chỉ để khử trùng; cả hai không rời máy chủ. */
export type NguonAnh = { kind: "tep"; snapshot: string; file: string; url?: string; sha256?: string } | { kind: "url"; url: string }

const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const banGhi = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const urlHopLe = (v: unknown): string | null => (typeof v === "string" && /^https?:\/\//i.test(v) ? v : null)

const SHA256 = /^[0-9a-f]{64}$/i

/** Băm nội dung của entry đã tải, viết thường; thiếu hay sai khuôn → null. Cùng luật với shaTep ở pipeline/media-rows.mjs. */
export const shaTep = (entry: Record<string, unknown>): string | null =>
  typeof entry.sha256 === "string" && SHA256.test(entry.sha256) ? entry.sha256.toLowerCase() : null

/** Ảnh của một bài theo thứ tự cố định: tệp đã lưu trước, rồi URL chưa có tệp. Thứ tự này là số `anh` trên đường ảnh. */
export function danhSachAnh(media: unknown, mediaFiles: unknown, snapshotBai: string | null): NguonAnh[] {
  const tep: NguonAnh[] = []
  const daCoTep = new Set<string>()
  const urlCho: string[] = []
  for (const e of mang(mediaFiles).map(banGhi)) {
    const url = urlHopLe(e.url)
    const snapshot = typeof e.snapshotId === "string" ? e.snapshotId : snapshotBai
    if (!e.error && typeof e.file === "string" && snapshot) {
      if (url) daCoTep.add(url)
      const sha = shaTep(e)
      if (tep.some((t) => t.kind === "tep" && ((t.snapshot === snapshot && t.file === e.file) || (sha && t.sha256 === sha)))) continue
      tep.push({ kind: "tep", snapshot, file: e.file, ...(url ? { url } : {}), ...(sha ? { sha256: sha } : {}) })
    } else if (url) urlCho.push(url)
  }
  for (const m of mang(media).map(banGhi)) {
    const url = urlHopLe(m.url)
    if (url) urlCho.push(url)
  }
  const con = [...new Set(urlCho)].filter((u) => !daCoTep.has(u))
  return [...tep, ...con.map((url): NguonAnh => ({ kind: "url", url }))]
}

/** Một dòng của cột `eval_label_items.ghep`, do pipeline/label-ghep.mjs ghi bằng luật PL28. App không tính ghép, chỉ đọc. */
export type Ghep = { chu_ref: string | null; anh_refs: string[]; so_chu_gan: number; trung_voi: string | null }

/** Thông tin ghép xuống trình duyệt: không có mã bài. */
export type GhepHien = { suyRa: boolean; soChuGan: number; khongChu: boolean }

export function docGhep(v: unknown): Ghep | null {
  const g = banGhi(v)
  if (!Array.isArray(g.anh_refs)) return null
  return {
    chu_ref: typeof g.chu_ref === "string" ? g.chu_ref : null,
    anh_refs: g.anh_refs.filter((x): x is string => typeof x === "string"),
    so_chu_gan: typeof g.so_chu_gan === "number" ? g.so_chu_gan : 0,
    trung_voi: typeof g.trung_voi === "string" ? g.trung_voi : null,
  }
}

export const ghepHien = (g: Ghep | null): GhepHien | null =>
  g ? { suyRa: Boolean(g.chu_ref) && g.anh_refs.length > 0, soChuGan: g.so_chu_gan, khongChu: !g.chu_ref } : null

/** Các bài của một dòng mẫu theo thứ tự hiện: tin chữ trước, rồi ảnh của cụm. */
export const refsCuaDong = (refId: string, g: Ghep | null): string[] =>
  g ? [...new Set([...(g.chu_ref ? [g.chu_ref] : []), ...g.anh_refs])] : [refId]

type BaiCoAnh = { media: unknown; media_files: unknown; snapshot_id: string | null }

/** Ảnh của nhiều bài nối theo thứ tự bài; thứ tự này là số `anh` trên đường ảnh. Cùng một ảnh ở hai bài chỉ tính một lần. */
export function danhSachAnhCum(bai: BaiCoAnh[]): NguonAnh[] {
  const da = new Set<string>()
  return bai.flatMap((b) => danhSachAnh(b.media, b.media_files, b.snapshot_id)).filter((n) => {
    const k = n.kind === "tep" ? `${n.snapshot}|${n.file}` : n.url
    if (da.has(k)) return false
    da.add(k)
    return true
  })
}

/** Đường ảnh cho trình duyệt: chỉ mã bài và thứ tự, không URL gốc. */
export const duongAnh = (itemId: number, thuTu: number) => `/api/zalo-media?nhan=${itemId}&anh=${thuTu}`

/** `http(s)://…`, `www.…`, và dạng tên miền trần. Trừ địa chỉ thư (đứng sau @) và mã toà kiểu S2.17. */
const LINK = /(?:https?:\/\/|www\.)\S+|(?<![\p{L}\p{N}@.\/-])(?:[a-z0-9-]+\.)+(?:vn|com|net|org|me|link|ly|io|info|biz)(?:\/\S*)?(?![\p{L}\p{N}])/giu
const DAU_CUOI = /[.,;:!?)\]»"']+$/

/** Thẻ xem trước link mà S03 chép vào chữ bài: một dòng JSON có URL viết `\\/\\/`. Trả tiêu đề và các URL; dòng khác trả null. */
function theLink(dong: string): { tieuDe: string; url: string[] } | null {
  if (!dong.trimStart().startsWith("{")) return null
  try {
    const o: unknown = JSON.parse(dong)
    if (!o || typeof o !== "object" || Array.isArray(o)) return null
    const url = Object.values(o).flatMap((v) => urlHopLe(v) ?? [])
    if (!url.length) return null
    const tieuDe = (o as { title?: unknown }).title
    return { tieuDe: typeof tieuDe === "string" ? tieuDe : "", url }
  } catch {
    return null
  }
}

/** Chữ hiện trên thẻ: bỏ mọi link; đếm link không phải ảnh của bài. Bài không có link trả nguyên từng byte. Chữ lưu trong DB không đổi. */
export function chuKhongLink(text: string | null | undefined, anh: NguonAnh[] = []): { chu: string; soLinkKhac: number } {
  const goc = text ?? ""
  const urlAnh = new Set(anh.flatMap((a) => a.url ?? []))
  let soLinkKhac = 0
  let co = false
  // Dòng chỉ có link thì bỏ cả dòng; dòng trống vốn có của bài giữ nguyên.
  const dong: string[] = []
  for (const dongGoc of goc.split("\n")) {
    let coLink = false
    const the = theLink(dongGoc)
    if (the) {
      coLink = true
      soLinkKhac += the.url.filter((u) => !urlAnh.has(u)).length
    }
    const d = the ? the.tieuDe : dongGoc
    const con = d.replace(LINK, (m) => {
      coLink = true
      if (!urlAnh.has(m) && !urlAnh.has(m.replace(DAU_CUOI, ""))) soLinkKhac++
      return ""
    })
    co ||= coLink
    const gon = coLink ? con.replace(/[ \t]+/g, " ").trim() : con
    if (!coLink || gon) dong.push(gon)
  }
  if (!co) return { chu: goc, soLinkKhac: 0 }
  const chu = dong.join("\n").trim()
  return { chu, soLinkKhac }
}
