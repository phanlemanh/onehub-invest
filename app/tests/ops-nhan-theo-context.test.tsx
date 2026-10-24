// ops-nhan-theo-context.test.tsx — người vận hành đọc cổng Ops bằng nhãn theo CONTEXT.md (ON12, OPS-17).
// Hồ sơ nghiệm thu: _acceptance/ops-nhan-theo-context (AC-1…AC-7, AC-10; AC-8 ở scripts/smoke-ops-nhan.mjs).
// Tên ca mở đầu bằng mã AC (ON12-AC-n).
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import pg from "pg"

import {
  KEEP_EN,
  allowPhrases,
  avoidTerms,
  boldAsciiWords,
  englishTokens,
  findAvoid,
  htmlVisibleText,
  rawCodeHits,
  soiChu,
} from "../../scripts/lib/ops-nhan.mjs"
import { PARTIAL, SCAN_FILES, expandPatterns, visibleStrings, type VisibleString } from "./ops-nhan/visible-strings"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const REPO = resolve(APP, "..")
const CONTEXT = readFileSync(join(REPO, "CONTEXT.md"), "utf8")
const TERMS = avoidTerms(CONTEXT)
const ALLOW = allowPhrases(CONTEXT)
const KEEP = new Set([...boldAsciiWords(CONTEXT), ...KEEP_EN])

type Loi = { tep: string; dong: number; tu: string; chu: string }

function quetAvoid(tep: string, chuoi: VisibleString[]): Loi[] {
  return chuoi.flatMap((s) => findAvoid(s.text, TERMS, ALLOW).map((tu: string) => ({ tep, dong: s.line, tu, chu: s.text })))
}
function quetTiengAnh(tep: string, chuoi: VisibleString[]): Loi[] {
  return chuoi.filter((s) => !s.inCode).flatMap((s) => englishTokens(s.text, KEEP).map((tu: string) => ({ tep, dong: s.line, tu, chu: s.text })))
}
const inLoi = (l: Loi[]) => l.map((x) => `${x.tep}:${x.dong} «${x.tu}» trong «${x.chu.slice(0, 80)}»`).join("\n")

function quetCay(luat: (tep: string, c: VisibleString[]) => Loi[]): { loi: Loi[]; soChuoi: number } {
  let soChuoi = 0
  const loi: Loi[] = []
  for (const tep of SCAN_FILES) {
    const c = visibleStrings(tep, readFileSync(join(APP, tep), "utf8"))
    soChuoi += c.length
    loi.push(...luat(tep, c))
  }
  return { loi, soChuoi }
}

/** Bản sao trong bộ nhớ của một tệp thật, nối thêm một đoạn — phép đo chạy đúng hàm rút chuỗi trên cùng tên tệp. */
const banSao = (tep: string, them: string) => visibleStrings(tep, readFileSync(join(APP, tep), "utf8") + "\n" + them)

// ---------- AC-1: 0 từ _Avoid_ ----------

test("ON12-AC-1 danh sách tệp quét bằng đúng danh sách viết trước", () => {
  const thuc = expandPatterns(APP).sort()
  const viet = [...SCAN_FILES].sort()
  assert.deepEqual(thuc, viet, `tệp mới chưa kê vào SCAN_FILES: ${thuc.filter((t) => !viet.includes(t as never)).join(", ")}`)
})

test("ON12-AC-1 danh sách tệp quét thiếu một tệp → đỏ nêu tệp", () => {
  const thieu = SCAN_FILES.filter((t) => t !== "src/components/ops/review-content.tsx")
  const thuc = expandPatterns(APP)
  const lot = thuc.filter((t) => !(thieu as readonly string[]).includes(t))
  assert.deepEqual(lot, ["src/components/ops/review-content.tsx"])
})

test("ON12-AC-1 0 từ _Avoid_ trên chuỗi hiển thị của phạm vi quét", () => {
  const { loi, soChuoi } = quetCay(quetAvoid)
  console.log(`# ON12-AC-1 đã quét ${SCAN_FILES.length} tệp, ${soChuoi} chuỗi (kể cả trong <code>)`)
  assert.ok(soChuoi > 300, `quét quá ít chuỗi (${soChuoi}) — thước không chạy?`)
  assert.equal(loi.length, 0, `từ _Avoid_ còn trên cổng Ops:\n${inLoi(loi)}`)
})

const DO_AVOID: [string, string, string, string][] = [
  ["tiêu đề review", "src/app/ops/review/page.tsx", `export const metadata2 = { title: "Review Queue" }`, "Review Queue"],
  ["mục thanh bên", "src/components/shell/nav.tsx", `export const X = () => <a title="Hàng chờ duyệt">x</a>`, "hàng chờ"],
  ["Heartbeat trong code", "src/components/ops/collections/pipe-panels.tsx", `export const Y = () => <p><code>Heartbeat 15′</code></p>`, "Heartbeat"],
]
for (const [ten, tep, them, tu] of DO_AVOID) {
  test(`ON12-AC-1 bản sao ${ten} → báo tệp:dòng và từ`, () => {
    const loi = quetAvoid(tep, banSao(tep, them))
    const trung = loi.find((l) => l.tu.toLowerCase() === tu.toLowerCase())
    assert.ok(trung, `thước không báo «${tu}» ở bản sao ${tep}:\n${inLoi(loi)}`)
    assert.equal(trung.tep, tep)
    assert.ok(trung.dong > 1)
  })
}

// ---------- AC-2: 0 từ tiếng Anh ngoài danh sách giữ ----------

const MA_TRAN_TOKEN: [string, boolean][] = [
  ["Heartbeat", true],
  ["Job", true],
  ["market", true],
  ["offline", true],
  ["Uptime", true],
  ["hanoi", true],
  ["hcmc", true],
  ["Tin", false],
  ["Xem", false],
  ["thu", false],
  ["Listing", false],
  ["Staging", false],
  ["S02", false],
  ["QR", false],
  ["L4b", false],
  ["Hà Nội", false],
  ["Hồ Chí Minh", false],
  ["24h", false],
  ["m²", false],
  ["tr/m²", false],
]
test("ON12-AC-2 ma trận phân loại token viết trước", () => {
  for (const [chu, bao] of MA_TRAN_TOKEN)
    assert.equal(englishTokens(chu, KEEP).length > 0, bao, `«${chu}» phải ${bao ? "bị báo là tiếng Anh" : "không bị báo"}`)
})

test("ON12-AC-2 0 từ tiếng Anh ngoài danh sách giữ trên chuỗi hiển thị", () => {
  const { loi } = quetCay(quetTiengAnh)
  assert.equal(loi.length, 0, `chữ tiếng Anh còn trên cổng Ops:\n${inLoi(loi)}`)
})

test("ON12-AC-2 bản sao thêm «Uptime 24h» và title=\"Toggle\" → báo cả hai", () => {
  const tep = "src/components/ops/collections/pipe-panels.tsx"
  const loi = quetTiengAnh(tep, banSao(tep, `export const Z = () => <div><p>Uptime 24h</p><button title="Toggle">x</button></div>`))
  for (const tu of ["Uptime", "Toggle"]) assert.ok(loi.some((l) => l.tu === tu), `thước không báo «${tu}»:\n${inLoi(loi)}`)
})

test("ON12-AC-1 tệp quét một phần ghim đúng hàm", () => {
  for (const [tep, ham] of Object.entries(PARTIAL)) {
    const src = readFileSync(join(APP, tep), "utf8")
    assert.doesNotThrow(() => visibleStrings(tep, src), `${tep}: thiếu hàm ghim ${ham.join(", ")}`)
    assert.throws(() => visibleStrings(tep, src.replaceAll(`function ${ham[0]}(`, `function ${ham[0]}Cu(`)), new RegExp(`không thấy hàm ghim tên ${ham[0]}`))
  }
})

// ---------- tiện ích render + soi theo luật smoke ----------

const RUNG = { terms: TERMS, allow: ALLOW, keep: KEEP }
async function render(el: unknown): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
/** Lỗi chữ hiển thị của một mảnh HTML theo đúng luật smoke AC-8 (a)–(f). */
function soiHtml(html: string) {
  const { text, code } = htmlVisibleText(html)
  return [
    ...text.flatMap((s: string) => soiChu(s, { ...RUNG }).map((l: { luat: string; tu: string }) => ({ ...l, chu: s }))),
    ...code.flatMap((s: string) => soiChu(s, { ...RUNG, inCode: true }).map((l: { luat: string; tu: string }) => ({ ...l, chu: s }))),
  ]
}
const inSoi = (l: { luat: string; tu: string; chu: string }[]) => l.map((x) => `${x.luat} «${x.tu}» trong «${x.chu.slice(0, 80)}»`).join("\n")

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
async function canDb(): Promise<pg.Client> {
  const c = new pg.Client({ connectionString: DB_URL })
  try {
    await c.connect()
  } catch (e) {
    assert.fail(`DB local :5433 không tới được — eval đòi chạy thật: ${(e as Error).message}`)
  }
  return c
}

// ---------- AC-3: chữ đọc màn hình của khung ----------

test("ON12-AC-3 OpsHeader và PageHeader không còn sr-only tiếng Anh", async () => {
  const { SidebarProvider } = await import("../src/components/ui/sidebar")
  const { OpsHeader } = await import("../src/components/shell/ops-shell/ops-header")
  const { PageHeader } = await import("../src/components/page/page-header")
  const header = await render(<SidebarProvider><OpsHeader /></SidebarProvider>)
  assert.match(header, /<span class="sr-only">Mở hoặc gập thanh bên<\/span>/)
  assert.doesNotMatch(header, /Toggle Sidebar/)
  const ph = await render(<PageHeader crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Thu thập" }]} title="Thu thập" stats={[]} description="Mô tả" />)
  assert.match(ph, /aria-label="Đường dẫn trang"/)
  assert.doesNotMatch(ph, /aria-label="breadcrumb"/)
  assert.deepEqual(soiHtml(header + ph).filter((l) => l.luat === "toggle-sidebar"), [])
})

test("ON12-AC-3 SidebarTrigger của component đã cài → phép đo thấy Toggle Sidebar", async () => {
  const { SidebarProvider, SidebarTrigger } = await import("../src/components/ui/sidebar")
  const html = await render(<SidebarProvider><SidebarTrigger /></SidebarProvider>)
  assert.ok(soiHtml(html).some((l) => l.luat === "toggle-sidebar"), "đối chứng: thước phải thấy «Toggle Sidebar» trong component gốc")
})

// ---------- AC-4: diễn giải kiểm chất lượng ----------

const TEN_KHU = new Map([
  ["vn", "Việt Nam"],
  ["vn-hanoi", "Hà Nội"],
  ["vn-hcmc", "Hồ Chí Minh"],
  ["vn-tinh-an-giang", "An Giang"],
])

const MA_TRAN_CHI_TIET: [string, string, string, string?][] = [
  ["occupancy-domain", "vi phạm: 3", "3 vi phạm"],
  ["not-null", "dòng toàn NULL: 0", "0 dòng rỗng toàn bộ"],
  ["area-slug-valid", "slug rỗng/lệch: 2", "2 mã khu vực rỗng hoặc lệch"],
  ["listing-volume", "7 ngày gần: 1200 vs 7 ngày trước: 980", "7 ngày gần: 1.200 · 7 ngày trước: 980"],
  ["listing-volume", "snapshot mới 17 vs trước 25 (-8)", "Snapshot mới 17 · trước 25 (-8)"],
  ["adr-drift", "median ADR 3865 vs 3679", "ADR trung vị 3.865 · kỳ trước 3.679"],
  ["freshness", "snapshot cuối 2026-10-19 (3 ngày, SLO 90)", "Snapshot cuối 2026-10-19 (3 ngày, SLO 90 ngày)"],
  ["freshness", "chưa có snapshot", "Chưa có snapshot"],
  [
    "truthful-coverage",
    "our=265 s02_active=13052(2026-09) universe=15000 history=36m coverage=2.03% captured_age=4d",
    "Tự thu 265 · S02 đang hoạt động 13.052 (09/2026) · đã mua 15.000 · lịch sử 36 tháng · độ phủ 2,03% · số tham chiếu 4 ngày tuổi",
  ],
  [
    "truthful-coverage",
    "our=0 S02_active=null(null) universe=null history=0m coverage=n/a captured_age=n/ad",
    "Tự thu 0 · S02 đang hoạt động chưa có (chưa có) · đã mua chưa có · lịch sử 0 tháng · độ phủ chưa có · số tham chiếu chưa có",
  ],
  ["truthful-coverage", "chưa có crosswalk S02 nào", "Chưa nối thị trường S02 nào"],
  ["enum-vocab:price_tier", "0 giá trị ngoài vocabulary (P0|P1|P2)", "0 giá trị ngoài danh sách cho phép (P0, P1, P2)"],
  [
    "enum-vocab:property_type",
    "0 giá trị ngoài vocabulary (apartment|house|land|room|commercial|unknown)",
    "0 giá trị ngoài danh sách cho phép (Căn hộ, Nhà riêng, Đất, Phòng, Mặt bằng, Chưa rõ)",
  ],
  ["enum-vocab:kind", "4 giá trị ngoài vocabulary, ví dụ: rent_st", "4 giá trị ngoài danh sách cho phép, ví dụ:", "rent_st"],
  ["enum-vocab:property_type-coverage", "8647/8647 offers có loại hình", "8.647/8.647 tin rao có loại hình"],
  [
    "extraction-quality",
    "samples=420 avgF1=0.966 kind=1.00 priceVnd=0.99 pricePerm2Vnd=1.00 areaM2=0.98 bedrooms=1.00 phuong=0.82",
    "420 mẫu · F1 trung bình 0,966 · loại tin 1,00 · giá 0,99 · giá/m² 1,00 · diện tích 0,98 · phòng ngủ 1,00 · phường 0,82",
  ],
  ["extraction-quality", "samples=0", "Chưa có mẫu"],
]

test("ON12-AC-4 dqDetail ma trận khuôn bên ghi", async () => {
  const { dqDetail } = await import("../src/lib/dq-labels")
  for (const [check, detail, text, code] of MA_TRAN_CHI_TIET) {
    const r = dqDetail(check, detail)
    assert.equal(r.text, text, `${check}: «${detail}»`)
    assert.equal(r.code, code, `${check}: mã kèm`)
    assert.equal(r.known, true)
    assert.deepEqual(rawCodeHits(r.text), [], `câu diễn giải còn mã thô: «${r.text}»`)
  }
})

test("ON12-AC-4 dqCheckName và dqEntityLabel ma trận", async () => {
  const { dqCheckName, dqEntityLabel } = await import("../src/lib/dq-labels")
  const KIEM: [string, string][] = [
    ["occupancy-domain", "Công suất trong khoảng 0–1"],
    ["not-null", "Không có dòng rỗng"],
    ["area-slug-valid", "Mã khu vực hợp lệ"],
    ["listing-volume", "Khối lượng listing"],
    ["adr-drift", "ADR không trôi"],
    ["freshness", "Độ tươi"],
    ["truthful-coverage", "Độ phủ tham chiếu"],
    ["extraction-quality", "Chất lượng trích xuất"],
    ["enum-vocab:kind", "Từ vựng loại tin"],
    ["enum-vocab:confidence", "Từ vựng độ tin trích xuất"],
    ["enum-vocab:price_tier", "Từ vựng bậc giá"],
    ["enum-vocab:property_type", "Từ vựng loại hình"],
    ["enum-vocab:property_type-coverage", "Độ phủ loại hình"],
  ]
  for (const [k, v] of KIEM) assert.deepEqual(dqCheckName(k), { text: v, known: true }, k)
  const DOI_TUONG: [string, string][] = [
    ["market_metrics", "Chỉ số thị trường"],
    ["listing_stats", "Số liệu listing"],
    ["areas", "Khu vực"],
    ["sale_offers", "Tin rao"],
    ["sale_offers:S06", "Tin rao · S06"],
    ["S01/hanoi", "S01 · Hà Nội"],
    ["S04/hcmc", "S04 · Hồ Chí Minh"],
    ["vn-tinh-an-giang", "An Giang"],
    ["hanoi", "Hà Nội"],
    ["all", "Mọi thị trường"],
    ["regex", "Bộ đọc theo luật"],
    ["llm", "Bộ đọc AI"],
  ]
  for (const [k, v] of DOI_TUONG) assert.deepEqual(dqEntityLabel(k, TEN_KHU), { text: v, known: true }, k)
})

test("ON12-AC-4 khuôn lạ → (chưa diễn giải)", async () => {
  const { dqCheckName, dqDetail, dqEntityLabel } = await import("../src/lib/dq-labels")
  assert.deepEqual(dqDetail("x", "foo=1 bar"), { text: "(chưa diễn giải)", code: "foo=1 bar", known: false })
  assert.deepEqual(dqCheckName("new-check"), { text: "Kiểm khác (chưa diễn giải)", code: "new-check", known: false })
  assert.deepEqual(dqEntityLabel("vn-tinh-moi", TEN_KHU), { text: "Đối tượng khác (chưa diễn giải)", code: "vn-tinh-moi", known: false })
})

/** Khuôn chi tiết của ma trận phải còn trong ĐÚNG tệp bên ghi — đổi khuôn ở pipeline thì ca này đỏ, nêu tệp. */
const KHUON_BEN_GHI: [string, string[]][] = [
  ["pipeline/sql/450_dq_checks.sql", ["'vi phạm: '", "'dòng toàn NULL: '", "'slug rỗng/lệch: '", "'7 ngày gần: '", "' vs 7 ngày trước: '", "'median ADR '", "'snapshot cuối '", "'chưa có snapshot'", "'occupancy-domain'", "'not-null'", "'area-slug-valid'", "'listing-volume'", "'adr-drift'", "'freshness'"]],
  ["pipeline/dq-truthful-coverage.mjs", ["`our=${", "s02_active=${", "universe=${", "history=${", "coverage=${", "captured_age=${", "'chưa có crosswalk S02 nào'", "'truthful-coverage'"]],
  ["pipeline/dq-enum-vocab.mjs", ["giá trị ngoài vocabulary (", "giá trị ngoài vocabulary, ví dụ: ", "offers có loại hình`", "`enum-vocab:${col}`", "'enum-vocab:property_type-coverage'"]],
  ["pipeline/scripts/bench-extraction.mjs", ['"samples=0"', "`samples=${", "avgF1=${", "'extraction-quality'"]],
]
const khuonThieu = (tep: string, src: string, khuon: string[]) => khuon.filter((k) => !src.includes(k)).map((k) => `${tep}: thiếu ${k}`)

test("ON12-AC-4 khuôn ma trận còn trong tệp bên ghi", () => {
  const thieu = KHUON_BEN_GHI.flatMap(([tep, khuon]) => khuonThieu(tep, readFileSync(join(REPO, tep), "utf8"), khuon))
  assert.deepEqual(thieu, [], `bên ghi đã đổi khuôn — sửa lib/dq-labels.ts:\n${thieu.join("\n")}`)
})

test("ON12-AC-4 bản sao 450_dq_checks.sql đổi 'vi phạm: ' → ca đỏ nêu tệp", () => {
  const [tep, khuon] = KHUON_BEN_GHI[0]
  const sao = readFileSync(join(REPO, tep), "utf8").replaceAll("'vi phạm: '", "'violations: '")
  assert.deepEqual(khuonThieu(tep, sao, khuon), ["pipeline/sql/450_dq_checks.sql: thiếu 'vi phạm: '"])
})

// ---------- AC-5: bảng kiểm chất lượng trên DB local, qua trang thật ----------

/** Cắt mảng thành từng khúc — bảng phân trang chỉ dựng trang đầu, nên phép đo dựng TỪNG khúc để mọi dòng đều được soi. */
const khuc = <T,>(a: T[], n: number): T[][] => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))
const soDongThan = (html: string) => (html.slice(html.indexOf("<tbody"), html.indexOf("</tbody>")).match(/<tr[\s>]/g) ?? []).length

test("ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ", async () => {
  const c = await canDb()
  let rows: { check_name: string; entity: string; status: string; detail: string | null; checked_at: string }[]
  try {
    // Cùng cột, cùng cửa sổ 7 ngày với trang /ops/quality — nhưng KHÔNG LIMIT: lời hứa là MỌI dòng kiểm được diễn giải.
    rows = (
      await c.query(
        `SELECT check_name, entity, status, detail, checked_at::text FROM dq_check_results
         WHERE checked_at > now() - interval '7 days' ORDER BY checked_at DESC`,
      )
    ).rows
  } finally {
    await c.end()
  }
  const { getAreaNames } = await import("../src/lib/ops-queries")
  const { getSourceNameEntries } = await import("../src/lib/source-roles")
  const { maskSourceNames } = await import("../src/lib/mask-source-names")
  const { DqChecksTable } = await import("../src/components/ops/quality/dq-checks-table")
  const { dqCheckName, dqDetail, dqEntityLabel } = await import("../src/lib/dq-labels")
  const [areaNames, names] = await Promise.all([getAreaNames(), getSourceNameEntries()])
  const shown = rows.map((r) => ({ ...r, detail: r.detail === null ? null : maskSourceNames(r.detail, names) }))
  const loai = new Set(shown.map((r) => r.check_name))
  console.log(`# ON12-AC-5 DB local: ${shown.length} dòng, ${loai.size} loại kiểm trong 7 ngày — soi trọn từng dòng`)
  assert.ok(loai.size >= 2, "DB local cần ≥ 2 loại kiểm trong 7 ngày để phép đo có nghĩa")
  const map = new Map(Object.entries(areaNames))
  const chuaDien = shown.flatMap((r) => [dqCheckName(r.check_name), dqEntityLabel(r.entity, map), dqDetail(r.check_name, r.detail)].filter((t) => !t.known).map((t) => `${r.check_name} · ${t.code}`))
  assert.deepEqual([...new Set(chuaDien)], [], "dòng kiểm chưa diễn giải")
  let daDung = 0
  const loi = []
  for (const k of khuc(shown, 10)) {
    const html = await render(<DqChecksTable rows={k} areaNames={areaNames} />)
    daDung += soDongThan(html)
    loi.push(...soiHtml(html))
  }
  assert.equal(daDung, shown.length, "phải dựng đủ mọi dòng kiểm")
  assert.deepEqual(loi, [], `bảng kiểm chất lượng còn chữ chưa diễn giải:\n${inSoi(loi)}`)
  // Trang thật (đúng hàm nạp của /ops/quality) cũng sạch.
  const { default: QualityPage } = await import("../src/app/ops/quality/page")
  const page = await render(await QualityPage())
  assert.ok(page.includes("Kiểm chất lượng (7 ngày)"), "trang không có bảng kiểm chất lượng")
  assert.deepEqual(soiHtml(page), [], `trang /ops/quality còn chữ chưa diễn giải:\n${inSoi(soiHtml(page))}`)
})

// ---------- AC-6: tên thị trường S02 ----------

test("ON12-AC-6 s02MarketName ma trận viết trước", async () => {
  const { s02MarketName } = await import("../src/lib/market-names")
  const MT: [string, string, string][] = [
    ["95574", "Quang Tr", "Quảng Trị"],
    ["95555", "Binh Thu", "Bình Thuận"],
    ["82014767", "Phan RangaThap Cham", "Phan Rang – Tháp Chàm"],
    ["47", "Hanoi", "Hà Nội"],
    ["48", "Ho Chi Minh City", "Hồ Chí Minh"],
    ["102183", "Vung Tau City", "Vũng Tàu"],
  ]
  for (const [id, goc, vi] of MT) assert.deepEqual(s02MarketName(id, goc), { name: vi, known: true }, goc)
  assert.deepEqual(s02MarketName("999", "New Place"), { name: "New Place (chưa có tên Việt)", known: false })
})

test("ON12-AC-6 mọi thị trường S02 trên DB local có tên Việt", async () => {
  const { getAirdnaMarkets } = await import("../src/lib/queries")
  const { s02MarketName } = await import("../src/lib/market-names")
  const rows = await getAirdnaMarkets()
  console.log(`# ON12-AC-6 DB local: ${rows.length} thị trường S02`)
  assert.ok(rows.length > 0, "DB local không có thị trường S02 nào")
  const thieu = rows.filter((r) => !s02MarketName(r.airdnaId, r.name).known).map((r) => `${r.airdnaId} ${r.name}`)
  assert.deepEqual(thieu, [], `thị trường S02 chưa có tên Việt: ${thieu.join(", ")}`)
})

const reEsc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

test("ON12-AC-6 render bảng thị trường S02 và vòng thu từ hàm nạp thật", async () => {
  const { getAirdnaMarkets } = await import("../src/lib/queries")
  const { getAreaNames } = await import("../src/lib/ops-queries")
  const { readRotationPreview } = await import("../src/lib/collections-queries")
  const { s02MarketName } = await import("../src/lib/market-names")
  const { AirdnaMarketsTable } = await import("../src/components/ops/quality-tables")
  const { RotationPanel } = await import("../src/components/ops/collections/pipe-panels")
  const [rows, areaNames, rotation] = await Promise.all([getAirdnaMarkets(), getAreaNames(), readRotationPreview()])
  let duong = 0
  let noi = 0
  for (const k of khuc(rows, 25)) {
    const html = await render(<AirdnaMarketsTable rows={k} areaNames={areaNames} />)
    assert.equal(soDongThan(html), k.length, "phải dựng đủ mọi thị trường S02 của khúc")
    for (const r of k) {
      const vi = s02MarketName(r.airdnaId, r.name).name
      // Chiều dương: tên Việt của ĐÚNG thị trường có mặt; chiều âm: tên gốc khác tên Việt thì không còn.
      assert.ok(html.includes(`>${vi}<`), `thiếu tên Việt «${vi}» của ${r.airdnaId}`)
      if (r.name !== vi) assert.ok(!html.includes(`>${r.name}<`), `còn tên gốc «${r.name}» của ${r.airdnaId}`)
      duong++
      if (r.ourAreaId) {
        // Quan hệ mã khu vực → tên: chữ link là tên của CHÍNH ourAreaId, href trỏ đúng mã đó.
        const [cc, ...rest] = r.ourAreaId.split("-")
        const ten = areaNames[r.ourAreaId]
        assert.ok(ten, `bảng tên khu vực thiếu ${r.ourAreaId}`)
        assert.match(html, new RegExp(`href="/${cc}/${reEsc(rest.join("-"))}"[^>]*>${reEsc(ten)}</a>`), `link ${r.ourAreaId} phải mang chữ «${ten}»`)
        noi++
      }
    }
    assert.doesNotMatch(html, />vn-[a-z0-9-]+</, "cột «Khu vực của ta» còn mã vn-… làm chữ link")
    assert.deepEqual(soiHtml(html), [], inSoi(soiHtml(html)))
  }
  console.log(`# ON12-AC-6 render: ${duong} thị trường S02 có tên Việt, ${noi} link khu vực đúng tên`)
  assert.equal(duong, rows.length)
  // Vòng thu: dùng vòng thật; vòng thật rỗng (mọi thị trường đã tươi) thì dựng vòng từ 6 thị trường S02 thật để vẫn có chiều dương.
  const vongThat = rotation.next.length > 0
  const next = vongThat ? rotation.next : rows.slice(0, 6).map((r) => ({ id: r.airdnaId, name: r.name, lastCapturedAt: null }))
  console.log(`# ON12-AC-6 vòng thu: ${vongThat ? "vòng thật" : "vòng thật rỗng — dựng từ 6 thị trường S02"} (${next.length} thị trường)`)
  const vong = await render(<RotationPanel rotation={{ ...rotation, next }} />)
  for (const m of next) assert.ok(vong.includes(s02MarketName(m.id, m.name).name), `vòng thu thiếu tên Việt của ${m.id}`)
  assert.doesNotMatch(vong, /#\d+/, "vòng thu còn in #<mã S02>")
  assert.deepEqual(soiHtml(vong), [], inSoi(soiHtml(vong)))
})

// ---------- AC-7: giá trị thô khác ----------

test("ON12-AC-7 bảng nhãn giá trị thô ma trận viết trước", async () => {
  const L = await import("../src/lib/ops-labels")
  const { marketNameOf } = await import("../src/lib/market-names")
  const MT: [(v: string) => { label: string; known: boolean }, string, string][] = [
    [L.sourceStatusLabel, "active", "Đang dùng"],
    [L.sourceStatusLabel, "paused", "Tạm dừng"],
    [L.sourceStatusLabel, "completed", "Đã xong"],
    [L.sourceStatusLabel, "retired", "Đã ngừng"],
    [L.propertyTypeLabel, "apartment", "Căn hộ"],
    [L.propertyTypeLabel, "house", "Nhà riêng"],
    [L.propertyTypeLabel, "land", "Đất"],
    [L.propertyTypeLabel, "room", "Phòng"],
    [L.propertyTypeLabel, "commercial", "Mặt bằng"],
    [L.propertyTypeLabel, "unknown", "Chưa rõ"],
    [L.offerKindLabel, "sale", "Bán"],
    [L.offerKindLabel, "rent_lt", "Cho thuê"],
    [L.confidenceLabel, "high", "cao"],
    [L.confidenceLabel, "medium", "trung bình"],
    [L.confidenceLabel, "low", "thấp"],
    [L.aiSuggestionLabel, "yes", "cùng căn"],
    [L.aiSuggestionLabel, "no", "khác căn"],
    [L.priceTierLabel, "P1", "giá nội bộ (P1)"],
  ]
  for (const [f, v, nhan] of MT) assert.deepEqual(f(v), { label: nhan, known: true }, v)
  for (const f of [L.sourceStatusLabel, L.propertyTypeLabel, L.offerKindLabel, L.confidenceLabel, L.aiSuggestionLabel])
    assert.deepEqual(f("la-vai"), { label: "Giá trị khác", known: false })
  assert.deepEqual(marketNameOf("hanoi", TEN_KHU), { name: "Hà Nội", known: true })
  assert.deepEqual(marketNameOf("hcmc", TEN_KHU), { name: "Hồ Chí Minh", known: true })
  assert.deepEqual(marketNameOf("vn", TEN_KHU), { name: "Toàn quốc", known: true })
  assert.deepEqual(marketNameOf("danang", TEN_KHU), { name: "danang (chưa có tên Việt)", known: false })
})

test("ON12-AC-7 render danh mục nguồn, thẻ duyệt, cột thị trường tổng quan", async () => {
  const { RegistryTable } = await import("../src/components/ops/sources/registry-table")
  const { ReviewCard } = await import("../src/components/ops/review-card")
  const reg = await render(
    <RegistryTable rows={[{ code: "S01", real_name: "x", label_vi: "Tự thu", status: "active", since: "2026-01-01", retired_at: null }, { code: "S04", real_name: "y", label_vi: "Ranh giới", status: "paused", since: "2026-01-01", retired_at: null }]} />,
  )
  assert.match(reg, />Đang dùng</)
  assert.match(reg, />Tạm dừng</)
  assert.doesNotMatch(reg, />(active|paused)</)
  const offer = { source: "S03", price_vnd: 3e9, area_m2: 70, price_perm2: 4e7, phuong: "Tây Hồ", bedrooms: 2, property_type: "apartment", text: null, subject: null }
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  const the = await render(
    <AppRouterContext.Provider value={router as never}><ReviewCard item={{ id: 1, item_type: "entity_match", title: "Hai tin cùng căn?", evidence: { offer_a: offer, offer_b: { ...offer, property_type: "house" }, stage_b_score: 0.8 }, ai_suggestion: "yes", ai_reasoning: null, ai_confidence: 0.9, status: "pending" } as never} /></AppRouterContext.Provider>,
  )
  assert.match(the, /Căn hộ/)
  assert.match(the, /Nhà riêng/)
  assert.match(the, /AI: cùng căn/)
  assert.doesNotMatch(the, />(apartment|house)</)
  assert.doesNotMatch(the, /AI: yes/)
  // Giá trị chưa có nhãn: nhãn chung KÈM mã gốc trong <code> (người duyệt vẫn thấy giá trị thật).
  const regLa = await render(<RegistryTable rows={[{ code: "S09", real_name: "z", label_vi: "Mới", status: "deprecated", since: "2026-01-01", retired_at: null }]} />)
  assert.match(regLa, /Giá trị khác <code[^>]*>deprecated<\/code>/)
  const theLa = await render(
    <AppRouterContext.Provider value={router as never}><ReviewCard item={{ id: 2, item_type: "entity_match", title: "x", evidence: { offer_a: { ...offer, property_type: "villa" }, offer_b: offer, stage_b_score: 0.5 }, ai_suggestion: "maybe", ai_reasoning: null, ai_confidence: null, status: "pending" } as never} /></AppRouterContext.Provider>,
  )
  assert.match(theLa, /Giá trị khác <code[^>]*>villa<\/code>/)
  assert.match(theLa, /AI: Giá trị khác <code[^>]*>maybe<\/code>/)
})

test("ON12-AC-7 mọi giá trị đang có trên DB local có nhãn", async () => {
  const L = await import("../src/lib/ops-labels")
  const c = await canDb()
  try {
    const st = (await c.query<{ v: string }>(`SELECT DISTINCT status v FROM source_registry`)).rows.map((r) => r.v)
    const pt = (await c.query<{ v: string }>(`SELECT DISTINCT property_type v FROM sale_offers WHERE property_type IS NOT NULL`)).rows.map((r) => r.v)
    console.log(`# ON12-AC-7 DB local: trạng thái nguồn ${st.join(",")} · loại hình ${pt.join(",")}`)
    assert.deepEqual(st.filter((v) => !L.sourceStatusLabel(v).known), [])
    assert.deepEqual(pt.filter((v) => !L.propertyTypeLabel(v).known), [])
  } finally {
    await c.end()
  }
  const { getAirdnaComparison } = await import("../src/lib/queries")
  const cmp = await getAirdnaComparison("vn-hanoi")
  if (cmp) for (const m of cmp.metrics) assert.ok(["ADR", "Công suất", "Listing"].includes(m.metric), `tên chỉ số thô: ${m.metric}`)
  const { default: OpsOverviewPage } = await import("../src/app/ops/page")
  const html = await render(await OpsOverviewPage())
  const loi = soiHtml(html)
  assert.deepEqual(loi, [], `trang /ops còn chữ thô:\n${inSoi(loi)}`)
})

// ---------- AC-10: ô tên thị trường và chi tiết kiểm xuống dòng ----------

/** Ô thứ `cot` của mọi hàng thân bảng (tách theo <td>), kèm cả cây con của nó. */
function oCot(html: string, cot: number): string[] {
  const body = html.slice(html.indexOf("<tbody"), html.indexOf("</tbody>"))
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[\s\S]*?<\/td>/g)][cot]?.[0] ?? "")
}
const catChu = (o: string) => /class="[^"]*\b(truncate|whitespace-nowrap|text-ellipsis)\b/.test(o)

test("ON12-AC-10 ô tên thị trường và chi tiết kiểm xuống dòng", async () => {
  const Q = await import("../src/components/ops/quality-tables")
  const { DqChecksTable } = await import("../src/components/ops/quality/dq-checks-table")
  const { ObjectivesGrid } = await import("../src/components/ops/overview/objectives-grid")
  const BANG: [string, string, number][] = [
    ["S02", await render(<Q.AirdnaMarketsTable rows={[{ airdnaId: "82014767", name: "Phan RangaThap Cham", score: 50, ourAreaId: "vn-tinh-khanh-hoa", ourListings: 3 }]} areaNames={{ "vn-tinh-khanh-hoa": "Khánh Hòa" }} />), 0],
    ["độ phủ", await render(<Q.TruthfulCoverageTable rows={[{ areaId: "vn-thanh-pho-hue", name: "Thành phố Huế", ourListings: 1, airdnaActive: 10, airdnaPeriod: "2026-09", nMarkets: 1, airdnaUniverse: 20, ratio: 0.1, historyMonths: 36, capturedAt: "2026-10-20" } as never]} />), 0],
    ["kiểm", await render(<DqChecksTable rows={[{ check_name: "truthful-coverage", entity: "vn-hanoi", status: "pass", detail: "our=1 s02_active=2(2026-09) universe=3 history=36m coverage=0.00% captured_age=1d", checked_at: "2026-10-23 12:00:00+00" }]} areaNames={{ "vn-hanoi": "Hà Nội" }} />), 3],
    ["tổng quan", await render(<ObjectivesGrid rows={[{ code: "S01", city: "hanoi", lastSnapshotAt: "2026-10-20T00:00:00Z", ageHours: 24, sloHours: 192, status: "fresh" } as never]} areaNames={{ "vn-hanoi": "Hà Nội" }} />), 2],
  ]
  for (const [ten, html, cot] of BANG) {
    const o = oCot(html, cot)
    assert.ok(o.length > 0 && o.every((x) => x.length > 0), `${ten}: không tìm thấy ô cột ${cot}`)
    assert.deepEqual(o.filter(catChu), [], `${ten}: ô bị cắt chữ`)
  }
})

test("ON12-AC-10 bản sao ô có truncate → phép đo thấy", async () => {
  const { InsightGrid } = await import("../src/components/insight/insight-grid")
  const html = await render(
    <InsightGrid title="x" data={[{ a: "Phan Rang – Tháp Chàm" }]} columns={[{ id: "a", accessorKey: "a", header: "Thị trường", cell: ({ row }: { row: { original: { a: string } } }) => <span className="truncate">{row.original.a}</span> }] as never} getRowId={(r: { a: string }) => r.a} />,
  )
  assert.ok(oCot(html, 0).some(catChu), "đối chứng: ô có truncate phải bị phép đo thấy")
})
