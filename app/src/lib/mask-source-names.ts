// mask-source-names.ts — che tên nguồn thật (tầng A, ADR-0007) trong chữ chạy (dòng log cuối của job) bằng mã S0x.
// ON7 `ops-nhan-ma-nguon`. Bản chép của pipeline/lib/mask-source-names.mjs (app không import pipeline); bảng ca
// pipeline/scripts/mask-source-names.cases.json giữ hai bản khớp nhau. Danh sách tên rỗng → null (đóng chặt).

export type SourceNameEntry = { code: string; realName: string }

/** Gập từng đơn vị mã về chữ thường không dấu, GIỮ độ dài để vị trí khớp trên bản gập trùng vị trí bản gốc. */
export function fold(s: string): string {
  let out = ""
  for (const ch of s) {
    let b = ch === "đ" || ch === "Đ" ? "d" : ch.normalize("NFD").charAt(0).toLowerCase()
    if (b.length !== ch.length) b = ch.length === 1 ? b.charAt(0) : ch
    out += b
  }
  return out
}

/** Các biến thể đã gập của một tên: tên đủ, từ đầu (khi tên nhiều từ và từ đầu ≥ 4 ký tự), và bản viết liền. */
export function nameVariants(realName: string): string[] {
  const full = fold(realName.trim())
  const words = full.split(/[\s.\-_/]+/).filter(Boolean)
  const out = new Set([full, words.join("")])
  if (words.length > 1 && words[0].length >= 4) out.add(words[0])
  return [...out].filter((v) => v.length >= 3)
}

const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c)

/** Mọi chỗ khớp tên: biến thể ≥ 4 ký tự khớp ở mọi chỗ; biến thể ngắn hơn phải đứng riêng một từ. */
export function findSourceNames(text: string, entries: SourceNameEntry[]): { code: string; start: number; end: number }[] {
  const f = fold(text)
  const cands = entries.flatMap(({ code, realName }) => nameVariants(realName).map((v) => ({ code, v })))
  cands.sort((a, b) => b.v.length - a.v.length)
  const hits: { code: string; start: number; end: number }[] = []
  const taken = new Uint8Array(f.length)
  for (const { code, v } of cands) {
    let i = f.indexOf(v)
    while (i !== -1) {
      const end = i + v.length
      const bounded = v.length >= 4 || (!isWordChar(f[i - 1]) && !isWordChar(f[end]))
      if (bounded && !taken.subarray(i, end).some(Boolean)) {
        hits.push({ code, start: i, end })
        taken.fill(1, i, end)
      }
      i = f.indexOf(v, i + 1)
    }
  }
  return hits.sort((a, b) => a.start - b.start)
}

/** Thay mỗi tên thật trong text bằng mã S0x. Danh sách tên rỗng → null (đóng chặt). text null → null. */
export function maskSourceNames(text: string | null | undefined, entries: SourceNameEntry[] | null | undefined): string | null {
  if (text == null || !entries || entries.length === 0) return null
  let out = ""
  let at = 0
  for (const h of findSourceNames(text, entries)) {
    out += text.slice(at, h.start) + h.code
    at = h.end
  }
  return out + text.slice(at)
}
