// mask-source-names.ts — che tên nguồn thật (tầng A, ADR-0007) trong chữ chạy (dòng log cuối của job) bằng mã S0x.
// ON7 `ops-nhan-ma-nguon`. Bản chép của pipeline/lib/mask-source-names.mjs (app không import pipeline); bảng ca
// pipeline/scripts/mask-source-names.cases.json giữ hai bản khớp nhau. Danh sách tên rỗng → null (đóng chặt).

export type SourceNameEntry = { code: string; realName: string; wholeOnly?: boolean }

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

/** Các biến thể đã gập của một tên: tên đủ, từ đầu (khi tên nhiều từ và từ đầu ≥ 4 ký tự), và bản viết liền.
 *  `wholeOnly` (cờ source_registry.match_whole, migration 112): chỉ tên đủ và bản viết liền — không lấy từ đầu. Vắng = false. */
export function nameVariants(realName: string, { wholeOnly = false }: { wholeOnly?: boolean } = {}): string[] {
  const full = fold(realName.trim())
  const words = full.split(/[\s.\-_/]+/).filter(Boolean)
  const out = new Set([full, words.join("")])
  if (!wholeOnly && words.length > 1 && words[0].length >= 4) out.add(words[0])
  return [...out].filter((v) => v.length >= 3)
}

/** Dòng khớp nguyên cụm, tên nhiều từ: các từ nối bằng dãy dấu phân tách bất kỳ («ten-hai», «ten_hai», «ten  hai», đường dẫn URL). */
function cumTach(realName: string, wholeOnly: boolean | undefined): RegExp | null {
  if (!wholeOnly) return null
  const words = fold(realName.trim()).split(/[\s.\-_/]+/).filter(Boolean)
  if (words.length < 2) return null
  return new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\const isWordChar = (c: string | undefined)")).join("[\\s.\\-_/]+"), "gu")
}

const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c)

/** Mọi chỗ khớp tên: biến thể ≥ 4 ký tự khớp ở mọi chỗ; biến thể ngắn hơn phải đứng riêng một từ. */
export function findSourceNames(text: string, entries: SourceNameEntry[]): { code: string; start: number; end: number }[] {
  const f = fold(text)
  const cands = entries.flatMap(({ code, realName, wholeOnly }) => nameVariants(realName, { wholeOnly }).map((v) => ({ code, v })))
  cands.sort((a, b) => b.v.length - a.v.length)
  const hits: { code: string; start: number; end: number }[] = []
  const taken = new Uint8Array(f.length)
  for (const { code, realName, wholeOnly } of entries) {
    const re = cumTach(realName, wholeOnly)
    if (!re) continue
    for (const m of f.matchAll(re)) {
      const end = m.index + m[0].length
      if (taken.subarray(m.index, end).some(Boolean)) continue
      hits.push({ code, start: m.index, end })
      taken.fill(1, m.index, end)
    }
  }
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

// ---- Hàm nạp sổ nguồn — bản chép của pipeline/lib/source-name-entries.mjs (che-ten-nguon-khong-lay-tu-dau) ----
// [{ code, realName, wholeOnly }]: mỗi token (tên thật và từng định danh) một mục, mang cờ match_whole (migration 112).
// Thiếu cột → cờ false (che thừa); không có bảng → []; lỗi khác → ném. Hỏi hình sổ trước, không bắt lỗi.
type RegRow = { code: string; real_name: string | null; ids: string[] | null; match_whole: boolean }
type Queryable = { query: (sql: string) => Promise<{ rows: unknown[] }> }
export const SQL_SO_CO_CO =
  "SELECT code, real_name, coalesce(source_ids, '{}') AS ids, match_whole FROM source_registry ORDER BY code"
export const SQL_SO_KHONG_CO =
  "SELECT code, real_name, coalesce(source_ids, '{}') AS ids, false AS match_whole FROM source_registry ORDER BY code"

export function entriesFromRows(rows: RegRow[]): SourceNameEntry[] {
  const out: SourceNameEntry[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    for (const t of [r.real_name, ...(r.ids ?? [])]) {
      if (typeof t !== "string" || t.trim() === "") continue
      const k = `${r.code}\u0000${t}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ code: r.code, realName: t, wholeOnly: r.match_whole === true })
    }
  }
  return out
}

// Hỏi trước bảng và cột — không thử câu rồi bắt lỗi (câu lỗi làm hỏng giao dịch đang mở).
export const SQL_SO_HINH = `SELECT to_regclass('source_registry') IS NOT NULL AS bang,
  EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('source_registry') AND attname = 'match_whole'
          AND NOT attisdropped) AS cot`

export async function docSourceNameEntriesVoi(q: Queryable): Promise<SourceNameEntry[]> {
  const h = (await q.query(SQL_SO_HINH)).rows[0] as { bang?: boolean; cot?: boolean } | undefined
  if (!h?.bang) return []
  const rows = (await q.query(h.cot ? SQL_SO_CO_CO : SQL_SO_KHONG_CO)).rows as RegRow[]
  return entriesFromRows(rows)
}
