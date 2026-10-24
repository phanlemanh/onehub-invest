// ops-nhan.mjs — bộ thước chữ hiển thị của cổng Ops (ON12 `ops-nhan-theo-context`). Thuần JS, không phụ thuộc, dùng chung
// cho thước tĩnh (app/tests/ops-nhan) và smoke trang chạy thật (scripts/smoke-ops-nhan.mjs). Luật: design doc §2.2, §3.

/** Mục `_Avoid_` mô tả (có `…`, ngoặc, hay dài quá 4 từ) là lời dặn, không phải một từ để quét. */
const laTu = (s) => s && !/[`(«»]/.test(s) && s.split(/\s+/).length <= 4

/** Mọi từ bị loại trong CONTEXT.md: `term` để quét, `label` là nhãn chuẩn của khối chứa nó. */
export function avoidTerms(contextMd) {
  const out = []
  let label = ""
  for (const line of contextMd.split("\n")) {
    const nhan = line.match(/^\*\*(.+?)\*\*:/)
    if (nhan) label = nhan[1]
    const m = line.match(/^_Avoid_:\s*(.+)$/)
    if (!m) continue
    for (const t of m[1].split(",").map((s) => s.trim())) if (laTu(t)) out.push({ term: t, label })
  }
  return out
}

/** Cụm được phép dù chứa từ bị loại (dòng `_Allow_` đầu tệp). */
export function allowPhrases(contextMd) {
  const m = contextMd.match(/^_Allow_:\s*(.+)$/m)
  return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : []
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
/** Khớp theo ranh giới chữ Unicode; từ ASCII nhận thêm số nhiều tiếng Anh («offers»). */
const tuRe = (t) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(t)}${/^[\x00-\x7f]+$/.test(t) ? "s?" : ""}(?![\\p{L}\\p{N}])`, "iu")

export function findAvoid(text, terms, allow = []) {
  let t = text
  for (const a of allow) t = t.replace(new RegExp(esc(a), "giu"), " ")
  return terms.filter(({ term }) => tuRe(term).test(t)).map(({ term }) => term)
}

/** Từ ASCII trong nhãn in đậm của CONTEXT.md (Listing, Snapshot, Staging, ADR, RevPAR…) — được giữ tiếng Anh. */
export function boldAsciiWords(contextMd) {
  const out = new Set()
  for (const m of contextMd.matchAll(/^\*\*(.+?)\*\*:/gm))
    for (const w of m[1].match(/[\p{L}\p{N}]+/gu) ?? []) if (/^[A-Za-z]+$/.test(w)) out.add(w.toLowerCase())
  return out
}

/** Danh sách giữ viết trước (design doc §2.2c): viết tắt và tên riêng. */
export const KEEP_EN = new Set(["slo", "kpi", "qr", "pn", "wc", "vn", "ai", "tr", "url", "api", "gmt", "zalo", "facebook", "openclaw", "kev", "ops"])

const DAU = "(?:b|c|ch|d|g|gh|gi|h|k|kh|l|m|n|ng|ngh|nh|p|ph|qu|r|s|t|th|tr|v|x)"
const VAN =
  "(?:a|ai|ao|au|ay|an|ang|anh|ac|ach|am|ap|at|e|em|en|eo|ep|et|ec|eng|i|ia|im|in|inh|ip|it|ich|iu|iec|iem|ien|iep|iet|ieu|" +
  "o|oa|oai|oan|oang|oanh|oat|oac|oach|oay|oe|oen|oet|oeo|oi|om|on|ong|oong|op|ot|oc|ooc|" +
  "u|ua|ui|um|un|ung|up|ut|uc|uan|uat|uay|uong|uoc|uoi|uom|uon|uot|uu|uy|uya|uyen|uyet|uynh|uyt|uych|uyu|ue|uen|uenh|uet|ueu|" +
  "y|yen|yet|yeu)"
/** Âm tiết tiếng Việt viết không dấu (phụ âm đầu + vần) — «Tin», «Xem», «thu» không phải tiếng Anh. */
export const VN_SYLLABLE = new RegExp(`^${DAU}?${VAN}$`, "i")

/** Token chữ ASCII ≥ 2 ký tự, không chứa số (mã S02/L4b, đơn vị 24h/m² không xét), không phải âm tiết Việt, không giữ. */
export function englishTokens(text, keep) {
  const out = []
  for (const w of text.replace(/https?:\/\/\S+/g, " ").match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (w.length < 2 || /\p{N}/u.test(w) || !/^[A-Za-z]+$/.test(w)) continue
    if (VN_SYLLABLE.test(w) || keep.has(w.toLowerCase())) continue
    out.push(w)
  }
  return out
}

/** Tên kiểm chất lượng của bên ghi (pipeline/sql/450_dq_checks.sql, dq-truthful-coverage.mjs, dq-enum-vocab.mjs,
 *  scripts/bench-extraction.mjs). */
export const DQ_CHECK_NAMES = [
  "occupancy-domain",
  "not-null",
  "area-slug-valid",
  "listing-volume",
  "adr-drift",
  "freshness",
  "truthful-coverage",
  "enum-vocab",
  "extraction-quality",
]

/** Mã thô: tên kiểm, khuôn khoá=giá trị (soi cả trong `<code>`); ngoài `<code>` thêm mã khu vực `vn-…`, `vn` thường
 *  đứng riêng, token snake_case (luật e). */
export function rawCodeHits(text, { inCode = false } = {}) {
  const out = []
  for (const n of DQ_CHECK_NAMES) if (new RegExp(`(?<![\\w-])${esc(n)}(?![\\w-])`).test(text)) out.push(n)
  for (const m of text.matchAll(/(?<![\p{L}\p{N}_])[A-Za-z][\w]*=\S/gu)) out.push(m[0])
  if (inCode) return out
  for (const m of text.matchAll(/(?<![\w/-])vn(?:-[a-z0-9]+)+/g)) out.push(m[0])
  if (/(?<![\p{L}\p{N}_-])vn(?![\p{L}\p{N}_-])/u.test(text)) out.push("vn")
  for (const m of text.matchAll(/(?<![\p{L}\p{N}_])[a-z]+_[a-z0-9_]+(?![\p{L}\p{N}])/gu)) out.push(m[0])
  return out
}

/** Dấu dự phòng của các bảng nhãn — trên trang thật phải là 0. */
export const FALLBACK_MARKS = ["(chưa diễn giải)", "(chưa có tên Việt)", "Loại thẻ khác", "Trường khác", "Giá trị khác"]

const giai = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))

/** Chữ người đọc được của một trang HTML: text node (kể cả sr-only) + title/aria-label/alt/placeholder; chữ trong
 *  `<code>`/`<kbd>` tách riêng. Bỏ `<script>`, `<style>`, `<template>`. */
export function htmlVisibleText(html) {
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
  const code = []
  body = body.replace(/<(code|kbd)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    const t = giai(inner.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim()
    if (t) code.push(t)
    return " "
  })
  const attrs = [...body.matchAll(/\s(?:title|aria-label|alt|placeholder)="([^"]*)"/g)].map((m) => giai(m[1]))
  const text = giai(body.replace(/<[^>]*>/g, "\n"))
    .split("\n")
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  return { text: [...text, ...attrs], code }
}

/** Một lượt soi một đoạn chữ theo bốn luật (a)–(f) của smoke; `inCode` chỉ miễn luật tiếng Anh. */
export function soiChu(s, { terms, allow, keep, inCode = false }) {
  const loi = []
  for (const t of findAvoid(s, terms, allow)) loi.push({ luat: "avoid", tu: t })
  if (!inCode) for (const t of englishTokens(s, keep)) loi.push({ luat: "tieng-anh", tu: t })
  for (const t of rawCodeHits(s, { inCode })) loi.push({ luat: "ma-tho", tu: t })
  if (/Toggle Sidebar/i.test(s)) loi.push({ luat: "toggle-sidebar", tu: "Toggle Sidebar" })
  for (const t of FALLBACK_MARKS) if (s.includes(t)) loi.push({ luat: "du-phong", tu: t })
  return loi
}
