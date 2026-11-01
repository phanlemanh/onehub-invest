// chuyen-huong-ma-thi-truong.itest.tsx — hồ sơ _acceptance/chuyen-huong-ma-thi-truong. KHÔNG chạy trong `npm test`
// (đuôi .itest): scripts/chuyen-huong-ma-thi-truong/acceptance.mjs dựng DB thử (trước/sau migration 064) rồi chạy tệp này
// với DATABASE_URL trỏ DB thử. CHM_PHAN=app → trang Invest + API /api/v1 (AC-2..AC-6, AC-8 phần app);
// CHM_PHAN=api → data-api (AC-7, AC-8). Gọi thẳng hàm trang và handler route; chuyển hướng/404 đọc từ digest lỗi của Next.
// Đột biến và mốc gốc hàng là bản chép cạnh tệp thật (tên __chm-*), xoá ở after().
import nodeModule, { createRequire } from "node:module"
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// maplibre-gl chỉ xuất ESM trình duyệt và component bản đồ import CSS — Node không nạp được: thay bằng stub/rỗng
// (cùng cách tests/listings-browse.test.tsx). Không vẽ bản đồ nào ở đây.
const MAPLIBRE_STUB = `class X {}; module.exports = { LngLatBounds: X, AttributionControl: X, Map: X, setWorkerUrl() {}, getWorkerUrl() { return "" }, getVersion() { return "stub" } };`
type Hooked = { url?: string; format?: string; source?: string; shortCircuit?: boolean }
const { registerHooks } = nodeModule as unknown as {
  registerHooks: (h: {
    resolve: (s: string, c: unknown, n: (s: string, c: unknown) => Hooked) => Hooked
    load: (u: string, c: unknown, n: (u: string, c: unknown) => Hooked) => Hooked
  }) => void
}
registerHooks({
  resolve(s, c, n) {
    if (s === "maplibre-gl") return { url: "stub:maplibre-gl", format: "commonjs", shortCircuit: true }
    return n(s, c)
  },
  load(u, c, n) {
    if (u === "stub:maplibre-gl") return { format: "commonjs", source: MAPLIBRE_STUB, shortCircuit: true }
    if (u.endsWith(".css")) return { format: "commonjs", source: "", shortCircuit: true }
    return n(u, c)
  },
})

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = path.resolve(APP, "..")
const E = process.env
const PHAN = E.CHM_PHAN ?? ""
const TT = E.CHM_TRANG_THAI as "truoc" | "sau"
if (!E.DATABASE_URL || !/oneinvest_n1_chm_/.test(E.DATABASE_URL)) throw new Error("chm: DATABASE_URL phải là DB thử oneinvest_n1_chm_* — không chạy trên DB dùng chung")
if (TT !== "truoc" && TT !== "sau") throw new Error("chm: thiếu CHM_TRANG_THAI")
const MA_DAI: string[] = JSON.parse(E.CHM_MA_DAI ?? "[]")
const PHUONG = E.CHM_PHUONG!
const GOC = E.CHM_GOC!
const DAI = "vn-thanh-pho-da-nang"
const NGAN = "vn-da-nang"
const M = TT === "sau" ? NGAN : DAI // mã Đà Nẵng đang có trong DB thử
const doan = (id: string) => id.slice(3) // "vn-da-nang" → "da-nang"
const ngan = (id: string) => id.replace(/^vn-(thanh-pho|tinh)-/, "vn-")
process.env.OPS_API_TOKEN = "chm-thu"
const BEARER = { authorization: "Bearer chm-thu" }

// ── Bản chép cạnh tệp thật (đột biến / mốc gốc hàng) ───────────────────────────────────────────────
const banChep: string[] = []
function chep(rel: string, ten: string, noiDung: string): string {
  const p = path.join(ROOT, path.dirname(rel), `__chm-${PHAN}-${TT}-${ten}${path.extname(rel)}`)
  writeFileSync(p, noiDung)
  banChep.push(p)
  return p
}
const docTep = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8")
const docGoc = (rel: string) => execFileSync("git", ["-C", ROOT, "show", `${GOC}:${rel}`], { encoding: "utf8" })
function doi(s: string, a: string, b: string): string {
  if (!s.includes(a)) throw new Error(`chm: không thấy chuỗi đột biến «${a}»`)
  return s.split(a).join(b)
}
after(() => { for (const p of banChep) rmSync(p, { force: true }) })

// Thư viện «luôn tra»: bỏ đường tắt mã-không-dài — mọi mã đều phát sinh truy vấn tra thêm.
const LIB = "app/src/lib/ma-thi-truong.ts"
let libLuonTra = ""
before(() => {
  let s = docTep(LIB)
  s = doi(s, "if (ngan === id) return id;", 'if (ngan === id && id === "__khong__") return id;')
  s = doi(s, "if (ngan === id) return null;", 'if (ngan === id && id === "__khong__") return null;')
  libLuonTra = chep(LIB, "luon-tra", s)
})
const voiLibLuonTra = (s: string) => doi(s, '"@/lib/ma-thi-truong"', `"@/lib/${path.basename(libLuonTra, ".ts")}"`)

// ── Đếm truy vấn trên pool của app (một module cho mọi trang/route) ───────────────────────────────
type Pool = { query: (...a: unknown[]) => Promise<unknown>; end: () => Promise<void> }
let appPool: Pool
let demApp = 0
async function demTruyVan<T>(fn: () => Promise<T>): Promise<{ n: number; kq: T | unknown }> {
  demApp = 0
  let kq: T | unknown
  try { kq = await fn() } catch (e) { kq = e }
  return { n: demApp, kq }
}

// ── Kết quả hàm trang: phần tử, chuyển hướng (đích + mã), hay 404 ──────────────────────────────────
type KQ = { loai: "el"; el: { type: unknown; props: Record<string, unknown> } } | { loai: "chuyen"; dich: string; ma: number } | { loai: "404" }
async function trang(fn: () => Promise<unknown>): Promise<KQ> {
  try {
    return { loai: "el", el: (await fn()) as { type: unknown; props: Record<string, unknown> } }
  } catch (e) {
    const d = String((e as { digest?: string })?.digest ?? "")
    const m = d.match(/^NEXT_REDIRECT;[a-z]+;(.+);(\d{3});?$/)
    if (m) return { loai: "chuyen", dich: m[1], ma: Number(m[2]) }
    if (d.includes("NEXT_HTTP_ERROR_FALLBACK;404")) return { loai: "404" }
    throw e
  }
}
const P = (o: Record<string, string>) => Promise.resolve(o)
/** Luật slug của queries.ts (hàm nội bộ); nơi dùng chứng lại bằng bộ giải thật resolveSubmarketId. */
const slugPhuong = (ten: string) => ten.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
type PageFn = (a: { params: Promise<Record<string, string>>; searchParams: Promise<Record<string, string>> }) => Promise<unknown>
const nap = async (p: string): Promise<PageFn> => (await import(p)).default as PageFn
const PG = {
  market: "app/src/app/(app)/[country]/[market]/page.tsx",
  listings: "app/src/app/(app)/[country]/[market]/listings/page.tsx",
  submarket: "app/src/app/(app)/[country]/[market]/[submarket]/page.tsx",
  country: "app/src/app/(app)/[country]/page.tsx",
  yield: "app/src/app/(app)/yield/page.tsx",
  compare: "app/src/app/(app)/compare/page.tsx",
}
const abs = (rel: string) => path.join(ROOT, rel)

/** Ném AssertionError gọi tên đường khi trang không chuyển sang đúng đích 308. */
async function kiemChuyen(page: PageFn, params: Record<string, string>, sp: Record<string, string>, dich: string) {
  const kq = await trang(() => page({ params: P(params), searchParams: P(sp) }))
  const tu = `/${params.country}/${params.market}${params.submarket ? `/${params.submarket}` : ""}`
  assert.ok(kq.loai === "chuyen", `không chuyển hướng: ${tu} (${kq.loai})`)
  assert.equal(kq.dich, dich, `${tu} chuyển sai đích`)
  assert.equal(kq.ma, 308, `${tu} chuyển bằng mã ${kq.ma}, chờ 308`)
}

/** Tìm phần tử con đầu tiên có đủ các prop đã nêu (duyệt cây phần tử React chưa render). */
function timProps(node: unknown, keys: string[]): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null
  if (Array.isArray(node)) { for (const x of node) { const r = timProps(x, keys); if (r) return r } return null }
  const props = (node as { props?: Record<string, unknown> }).props
  if (!props) return null
  if (keys.every((k) => k in props)) return props
  return timProps(props.children, keys)
}
/** Cây phần tử → JSON so sánh được (bỏ hàm, giữ type tên component). */
function tuanTu(node: unknown): string {
  return JSON.stringify(node, (k, v) => {
    if (k === "_owner" || k === "_store" || k === "_debugInfo" || k === "_debugStack" || k === "_debugTask") return undefined
    if (typeof v === "function") return `ƒ${v.name}`
    if (typeof v === "symbol") return String(v)
    return v
  })
}

// ── Gọi route app ──────────────────────────────────────────────────────────────────────────────
type GetFn = (req: Request) => Promise<Response>
const ROUTE = {
  listings: "app/src/app/api/v1/listings/route.ts",
  assetStats: "app/src/app/api/v1/asset-stats/route.ts",
  deals: "app/src/app/api/v1/deals/route.ts",
  offers: "app/src/app/api/v1/offers/route.ts",
}
async function goiApp(get: GetFn, url: string) {
  const res = await get(new Request(`http://chm.local${url}`, { headers: BEARER }))
  const body = (await res.json()) as Record<string, unknown>
  delete body.generatedAt // đồng hồ của route, không thuộc kết quả
  return { status: res.status, body, json: JSON.stringify(body) }
}
const soPhanTu = (b: Record<string, unknown>) => {
  const d = (b.data ?? b.stats ?? b.rows) as unknown
  return Array.isArray(d) ? d.length : 0
}
/** Ma trận 5 ô app: mỗi ô (route, tham số) với mã Đà Nẵng. */
// mangMa: kết quả của ô có mang mã thị trường (deals trả mã phường nên không).
const O_APP: { ten: string; route: keyof typeof ROUTE; url: (m: string) => string; mangMa: boolean }[] = [
  { ten: "/api/v1/listings?market", route: "listings", url: (m) => `/api/v1/listings?market=${m}&limit=200`, mangMa: true },
  { ten: "/api/v1/asset-stats?market", route: "assetStats", url: (m) => `/api/v1/asset-stats?market=${m}`, mangMa: true },
  { ten: "/api/v1/asset-stats?area", route: "assetStats", url: (m) => `/api/v1/asset-stats?area=${m}`, mangMa: true },
  { ten: "/api/v1/deals?market", route: "deals", url: (m) => `/api/v1/deals?market=${m}&limit=100&min_discount=0`, mangMa: false },
  { ten: "/api/v1/offers?area", route: "offers", url: (m) => `/api/v1/offers?area=${m}&limit=200&since_days=365`, mangMa: true },
]
/** Đột biến route: bỏ đổi mã (giữ lời gọi để import vẫn dùng — đầu ra là mã nguyên văn). */
const boDoiMa = (s: string) => s.replace(/await giaiMaKhuVuc\((raw\w+)\)/g, "await giaiMaKhuVuc($1).then(() => $1)")

before(async () => {
  appPool = (await import(abs("app/src/lib/db.ts"))).pool as Pool
  const goc = appPool.query.bind(appPool)
  appPool.query = (...a: unknown[]) => { demApp++; return goc(...a) }
})
after(async () => { await appPool?.end() })

if (PHAN === "app") {
  // ── AC-2 / AC-3: trang theo đường với cả 32 mã dài ───────────────────────────────────────────
  test(`CHM-AC-${TT === "sau" ? 2 : 3} trang thị trường + listing với 32 mã dài (${TT})`, async () => {
    const market = await nap(abs(PG.market))
    const listings = await nap(abs(PG.listings))
    assert.equal(MA_DAI.length, 32, "chm: cần đủ 32 mã dài")
    let chuyen = 0
    for (const id of MA_DAI) {
      const p = { country: "vn", market: doan(id) }
      if (TT === "sau") {
        await kiemChuyen(market, p, {}, `/vn/${doan(ngan(id))}`)
        await kiemChuyen(listings, p, {}, `/vn/${doan(ngan(id))}/listings`)
      } else {
        const a = await trang(() => market({ params: P(p), searchParams: P({}) }))
        const b = await trang(() => listings({ params: P(p), searchParams: P({}) }))
        if (a.loai === "chuyen" || b.loai === "chuyen") chuyen++
        assert.ok(a.loai === "el" && a.el.props.areaId === id, `trước 064: trang ${id} phải hiện với mã nhận được (${a.loai})`)
        assert.ok(b.loai === "el" && b.el.props.marketId === id, `trước 064: listing ${id} phải hiện với mã nhận được (${b.loai})`)
      }
    }
    if (TT === "truoc") assert.equal(chuyen, 0, "trước 064 không chuyển hướng nào được bắn")
    // Đối chứng dương cùng DB: /vn/hanoi hiện vn-hanoi.
    const h = await trang(() => market({ params: P({ country: "vn", market: "hanoi" }), searchParams: P({}) }))
    assert.ok(h.loai === "el" && h.el.props.areaId === "vn-hanoi", "/vn/hanoi phải hiện vn-hanoi")
    console.log(`ok   ${TT}: 32 mã × 2 trang ${TT === "sau" ? "chuyển 308 đúng đích" : "hiện như hôm nay, 0 chuyển hướng"}`)
  })

  if (TT === "sau") {
    test("CHM-AC-2 trang phường + query đi theo; chiều đỏ bỏ nhánh chuyển hướng", async () => {
      const slug = slugPhuong(E.CHM_PHUONG_TEN!)
      const { resolveSubmarketId } = await import(abs("app/src/lib/queries.ts"))
      assert.equal(await resolveSubmarketId(NGAN, slug), PHUONG, `slug ${slug} phải giải ra ${PHUONG} dưới ${NGAN}`)
      const sub = await nap(abs(PG.submarket))
      await kiemChuyen(sub, { country: "vn", market: doan(DAI), submarket: slug }, {}, `/vn/${doan(NGAN)}/${slug}`)
      const market = await nap(abs(PG.market))
      await kiemChuyen(market, { country: "vn", market: doan(DAI) }, { tab: "x" }, `/vn/${doan(NGAN)}?tab=x`)
      // Chiều đỏ: bản chép trang bỏ nhánh chuyển hướng → đúng thông điệp ghim.
      const mut = await nap(chep(PG.market, "bo-chuyen", doi(docTep(PG.market), "if (moi) permanentRedirect(", 'if (moi === "__khong__") permanentRedirect(')))
      await assert.rejects(kiemChuyen(mut, { country: "vn", market: doan(DAI) }, {}, `/vn/${doan(NGAN)}`), /không chuyển hướng: \/vn\/thanh-pho-da-nang/)
      console.log(`ok   sau: phường ${slug} và ?tab=x đi theo đích; chiều đỏ ghim 'không chuyển hướng: /vn/thanh-pho-da-nang'`)
    })
  }

  // Ma trận viết trước: 3 trang × (không query, ?tab=x) ở cả hai trạng thái DB; phường không có dưới mã mới → 404.
  test(`CHM-AC-${TT === "sau" ? 2 : 3} ma trận 3 trang × query (${TT})`, async () => {
    const slug = slugPhuong(E.CHM_PHUONG_TEN!)
    const sub = await nap(abs(PG.submarket))
    const trangs: { ten: string; page: PageFn; params: Record<string, string>; duoi: string; prop: string; cho: string }[] = [
      { ten: "thị trường", page: await nap(abs(PG.market)), params: { country: "vn", market: doan(DAI) }, duoi: "", prop: "areaId", cho: DAI },
      { ten: "listing", page: await nap(abs(PG.listings)), params: { country: "vn", market: doan(DAI) }, duoi: "/listings", prop: "marketId", cho: DAI },
      { ten: "phường", page: sub, params: { country: "vn", market: doan(DAI), submarket: slug }, duoi: `/${slug}`, prop: "areaId", cho: PHUONG },
    ]
    let soO = 0
    for (const t of trangs) {
      for (const sp of [{}, { tab: "x" }] as Record<string, string>[]) {
        if (TT === "sau") {
          await kiemChuyen(t.page, t.params, sp, `/vn/${doan(NGAN)}${t.duoi}${sp.tab ? "?tab=x" : ""}`)
        } else {
          const k = await trang(() => t.page({ params: P(t.params), searchParams: P(sp) }))
          assert.ok(k.loai === "el" && k.el.props[t.prop] === t.cho, `trước 064: trang ${t.ten} ${JSON.stringify(sp)} phải hiện với ${t.cho} (${k.loai})`)
        }
        soO++
      }
    }
    assert.equal(soO, 6, "số ô đã assert phải = 6")
    const khongCo = await trang(() => sub({ params: P({ country: "vn", market: doan(DAI), submarket: "phuong-khong-co" }), searchParams: P({}) }))
    assert.equal(khongCo.loai, "404", "phường không có dưới mã mới phải 404, không chuyển hướng")
    console.log(`ok   ${TT}: 6/6 ô trang × query; phường không có → 404`)
  })

  // ── AC-4: mã dài không đích → 404; mã thường không bị đụng, không tra thêm ──────────────────────
  test(`CHM-AC-4 mã dài không đích 404, mã thường không chuyển, không tra thêm (${TT})`, async () => {
    const market = await nap(abs(PG.market))
    const listings = await nap(abs(PG.listings))
    const p0 = { country: "vn", market: "tinh-khong-co" }
    const a = await trang(() => market({ params: P(p0), searchParams: P({}) }))
    assert.ok(a.loai === "el", `/vn/tinh-khong-co không được chuyển hướng (${a.loai})`)
    const r404 = await trang(async () => (a as { el: { type: (p: unknown) => Promise<unknown>; props: unknown } }).el.type(a.el.props))
    assert.equal(r404.loai, "404", "/vn/tinh-khong-co phải 404 (InsightPage)")
    assert.equal((await trang(() => listings({ params: P(p0), searchParams: P({}) }))).loai, "404", "/vn/tinh-khong-co/listings phải 404")
    for (const m of ["hanoi", "hcmc"]) {
      const k = await trang(() => market({ params: P({ country: "vn", market: m }), searchParams: P({}) }))
      assert.ok(k.loai === "el" && k.el.props.areaId === `vn-${m}`, `/vn/${m} không được đụng`)
    }
    assert.equal((await trang(() => listings({ params: P({ country: "vn", market: "hanoi" }), searchParams: P({}) }))).loai, "el", "/vn/hanoi/listings không được đụng")
    // Trang phường: phường Hà Nội thật hiện, không tra thêm; thị trường không đích → 404.
    const sub = await nap(abs(PG.submarket))
    const { rows: phHn } = (await appPool.query(
      "SELECT id, name FROM areas WHERE region_type = 'submarket' AND parent_id = 'vn-hanoi' AND id <> $1 ORDER BY id LIMIT 1", [PHUONG],
    )) as { rows: { id: string; name: string }[] }
    assert.equal(phHn.length, 1, "chm: DB thử phải có phường Hà Nội")
    const pHn = { country: "vn", market: "hanoi", submarket: slugPhuong(phHn[0].name) }
    const kHn = await trang(() => sub({ params: P(pHn), searchParams: P({}) }))
    assert.ok(kHn.loai === "el" && kHn.el.props.areaId === phHn[0].id, `trang phường Hà Nội ${pHn.submarket} không được đụng (${kHn.loai})`)
    assert.equal((await trang(() => sub({ params: P({ ...p0, submarket: "x" }), searchParams: P({}) }))).loai, "404", "/vn/tinh-khong-co/x phải 404")
    const gocSub = await nap(chep(PG.submarket, "goc", docGoc(PG.submarket)))
    const demSub = async (page: PageFn) => (await demTruyVan(() => page({ params: P(pHn), searchParams: P({}) }))).n
    assert.equal(await demSub(sub), await demSub(gocSub), `tra thêm khi mã không mang tiền tố dài: trang phường ${pHn.submarket}`)
    // Mốc: bản chép trang của gốc hàng, cùng DB.
    const gocMarket = await nap(chep(PG.market, "goc", docGoc(PG.market)))
    const gocListings = await nap(chep(PG.listings, "goc", docGoc(PG.listings)))
    const luonTraMarket = await nap(chep(PG.market, "luon-tra-trang", voiLibLuonTra(docTep(PG.market))))
    const dem = async (page: PageFn, market: string) => (await demTruyVan(() => page({ params: P({ country: "vn", market }), searchParams: P({}) }))).n
    for (const [ten, moi, goc] of [["market", market, gocMarket], ["listings", listings, gocListings]] as const) {
      const nMoi = await dem(moi, "hanoi")
      const nGoc = await dem(goc, "hanoi")
      assert.equal(nMoi, nGoc, `tra thêm khi mã không mang tiền tố dài: trang ${ten} /vn/hanoi ${nMoi} truy vấn, gốc ${nGoc}`)
    }
    // Đối chứng dương: mã dài phát sinh thêm truy vấn so với mốc.
    const nDai = await dem(market, doan(DAI))
    const nDaiGoc = await dem(gocMarket, doan(DAI))
    assert.ok(nDai >= nDaiGoc + 1, `mã dài phải tra thêm ≥ 1 truy vấn (${nDai} so mốc ${nDaiGoc})`)
    // Đột biến «luôn tra» → ca đếm /vn/hanoi phải đỏ.
    const nLuon = await dem(luonTraMarket, "hanoi")
    assert.ok(nLuon > (await dem(gocMarket, "hanoi")), `đột biến luôn-tra phải làm ca đếm đỏ (luôn-tra ${nLuon})`)
    console.log(`ok   ${TT}: 404 cho mã không đích, hanoi/hcmc không đụng, đếm truy vấn = mốc gốc; mã dài +${nDai - nDaiGoc}; luôn-tra bị bắt`)
  })

  // ── AC-5: Finder, Lợi suất, So sánh ─────────────────────────────────────────────────────────
  test(`CHM-AC-5 Finder / Lợi suất / So sánh nhận mã dài (${TT})`, async () => {
    const country = (await import(abs(PG.country))).default as (a: unknown) => Promise<unknown>
    const fDai = timProps(await country({ params: P({ country: "vn" }), searchParams: P({ market: doan(DAI) }) }), ["markets", "market"])
    const fM = timProps(await country({ params: P({ country: "vn" }), searchParams: P({ market: doan(M) }) }), ["markets", "market"])
    assert.ok(fDai && fM, "không thấy FinderView")
    assert.ok((fM.markets as { slug: string }[]).some((m) => m.slug === doan(M)), `Finder phải có Đà Nẵng (${doan(M)}) trong danh sách`)
    assert.equal(fDai.market, doan(M), `Finder ?market=${doan(DAI)} phải chọn ${doan(M)}`)
    assert.equal(tuanTu(fDai), tuanTu(fM), "Finder: props khi gõ mã dài khác khi gõ mã có trong DB")

    const yieldPage = (await import(abs(PG.yield))).default as (a: unknown) => Promise<unknown>
    // Thị trường Lợi suất chọn đọc từ crumb đầu của tiêu đề trang.
    const thiTruongYield = (el: unknown) => ((timProps(el, ["crumbs"])?.crumbs as { href: string }[] | undefined)?.[0]?.href) ?? null
    const elDai = await yieldPage({ searchParams: P({ area: DAI }) })
    const elM = await yieldPage({ searchParams: P({ area: M }) })
    const elDef = await yieldPage({ searchParams: P({}) })
    assert.equal(tuanTu(elDai), tuanTu(elM), "Lợi suất: ?area mã dài khác ?area mã có trong DB")
    assert.equal(thiTruongYield(elDai), `/vn/${doan(M)}`, `Lợi suất ?area=${DAI} phải chọn ${M}`)
    assert.equal(thiTruongYield(await yieldPage({ searchParams: P({ market: DAI }) })), `/vn/${doan(M)}`, `Lợi suất ?market=${DAI} phải chọn ${M}`)
    // Đối chứng dương: trang mặc định không phải Đà Nẵng, nên phép đo trên không xanh nhờ mặc định.
    assert.notEqual(thiTruongYield(elDef), `/vn/${doan(M)}`, "chm: trang mặc định trùng Đà Nẵng — phép đo không phân biệt được")
    if (TT === "sau") {
      const mut = (await import(chep(PG.yield, "bo-doi", doi(doi(docTep(PG.yield), "await giaiMaKhuVuc(sp.area)", "sp.area"), "await giaiMaKhuVuc(sp.market)", "sp.market")))).default as (a: unknown) => Promise<unknown>
      assert.notEqual(thiTruongYield(await mut({ searchParams: P({ area: DAI }) })), `/vn/${doan(M)}`, "đột biến bỏ đổi mã phải làm Lợi suất không chọn Đà Nẵng")
    }

    const compare = (await import(abs(PG.compare))).default as (a: unknown) => Promise<unknown>
    const c1 = timProps(await compare({ searchParams: P({ areas: `${DAI},vn-hanoi` }) }), ["entries", "ids"])
    assert.deepEqual(c1?.ids, [M, "vn-hanoi"], "So sánh: mã dài phải đọc thành mã có trong DB")
    const c2 = timProps(await compare({ searchParams: P({ areas: "vn-tinh-khong-co,vn-hanoi" }) }), ["entries", "ids"])
    assert.deepEqual(c2?.ids, ["vn-hanoi"], "So sánh: mã dài không đích bị bỏ")
    console.log(`ok   ${TT}: Finder chọn ${doan(M)}, Lợi suất trùng, So sánh [${M}, vn-hanoi]; mã không đích bị bỏ`)
  })

  // ── AC-6 (sau) / AC-8 (trước): API app, ma trận 5 ô ─────────────────────────────────────────
  test(`CHM-AC-${TT === "sau" ? 6 : 8} API app — ma trận 5 ô (${TT})`, async () => {
    let soO = 0
    for (const o of O_APP) {
      const get = (await import(abs(ROUTE[o.route]))).GET as GetFn
      const kM = await goiApp(get, o.url(M))
      assert.equal(kM.status, 200, `${o.ten} mã ${M}: HTTP ${kM.status} ${kM.json.slice(0, 120)}`)
      assert.ok(soPhanTu(kM.body) >= 1, `${o.ten} mã ${M} phải có ≥ 1 phần tử (${soPhanTu(kM.body)})`)
      const kD = await goiApp(get, o.url(DAI))
      assert.equal(kD.status, kM.status, `${o.ten} mã dài khác mã ngắn (HTTP)`)
      assert.equal(kD.json, kM.json, `${o.ten} mã dài khác mã ngắn`)
      if (TT === "truoc" && o.mangMa) assert.ok(kM.json.includes(DAI), `${o.ten} trước 064 phải mang mã dài trong kết quả`)
      soO++
      console.log(`     ${o.ten}: ${soPhanTu(kM.body)} phần tử, mã dài = mã ${TT === "sau" ? "ngắn" : "trong DB"}`)
      if (TT === "sau") {
        const mut = (await import(chep(ROUTE[o.route], `bo-doi-${soO}`, boDoiMa(docTep(ROUTE[o.route]))))).GET as GetFn
        const dM = await goiApp(mut, o.url(M))
        const dD = await goiApp(mut, o.url(DAI))
        assert.throws(() => assert.equal(dD.json, dM.json, `${o.ten} mã dài khác mã ngắn`), new RegExp(`${o.ten.replace(/[?/]/g, "\\$&")} mã dài khác mã ngắn`))
      }
    }
    assert.equal(soO, 5, "số ô đã assert phải = 5")
    console.log(`ok   ${TT}: 5/5 ô${TT === "sau" ? ", đột biến từng route bị bắt" : ""}`)
  })

  // Ma trận 5 ô: mã không đích trùng từng byte với route của gốc hàng; mã thường không tra thêm.
  test(`CHM-AC-8 API app mã không đích và mã thường — 5 ô (${TT})`, async () => {
    const KD = "vn-tinh-khong-co"
    let soO = 0
    for (const o of O_APP) {
      const get = (await import(abs(ROUTE[o.route]))).GET as GetFn
      const goc = (await import(chep(ROUTE[o.route], `goc-${o.route}`, docGoc(ROUTE[o.route])))).GET as GetFn
      const luon = (await import(chep(ROUTE[o.route], `luon-tra-${o.route}`, voiLibLuonTra(docTep(ROUTE[o.route]))))).GET as GetFn
      const kK = await goiApp(get, o.url(KD))
      const kG = await goiApp(goc, o.url(KD))
      assert.equal(kK.status, kG.status, `${o.ten} mã không đích khác gốc hàng (HTTP)`)
      assert.equal(kK.json, kG.json, `${o.ten} mã không đích khác gốc hàng`)
      assert.equal(soPhanTu(kK.body), 0, `${o.ten} mã không đích phải rỗng`)
      const dem = async (g: GetFn, m: string) => (await demTruyVan(() => goiApp(g, o.url(m)))).n
      assert.equal(await dem(get, "vn-hanoi"), await dem(goc, "vn-hanoi"), `tra thêm khi mã không mang tiền tố dài: ${o.ten}`)
      if (TT === "sau") assert.ok((await dem(get, DAI)) >= (await dem(goc, DAI)) + 1, `${o.ten}: mã dài phải tra thêm ≥ 1 truy vấn`)
      assert.ok((await dem(luon, "vn-hanoi")) > (await dem(goc, "vn-hanoi")), `${o.ten}: đột biến luôn-tra phải làm ca đếm đỏ`)
      soO++
    }
    assert.equal(soO, 5, "số ô đã assert phải = 5")
    console.log(`ok   ${TT}: 5/5 ô mã không đích trùng gốc, vn-hanoi đếm = mốc gốc; luôn-tra bị bắt`)
  })
}

if (PHAN === "api") {
  const DA = "data-api/src"
  const req = createRequire(path.join(ROOT, "data-api/package.json"))
  type Hono = { route: (p: string, r: unknown) => Hono; request: (p: string) => Promise<Response> }
  let HonoCls: new () => Hono
  let apiPool: Pool
  let demApi = 0
  before(async () => {
    HonoCls = (await import(req.resolve("hono"))).Hono as new () => Hono
    apiPool = (await import(abs(`${DA}/db/client.ts`))).pool as Pool
    const goc = apiPool.query.bind(apiPool)
    apiPool.query = (...a: unknown[]) => { demApi++; return goc(...a) }
  })
  after(async () => { await apiPool?.end() })
  const R = {
    markets: { tep: `${DA}/routes/markets.ts`, ten: "marketsRoute", goc: "/v1/markets" },
    listings: { tep: `${DA}/routes/listings.ts`, ten: "listingsRoute", goc: "/v1/listings" },
    assetStats: { tep: `${DA}/routes/asset-stats.ts`, ten: "assetStatsRoute", goc: "/v1/asset-stats" },
    deals: { tep: `${DA}/routes/deals.ts`, ten: "dealsRoute", goc: "/v1/deals" },
  }
  async function appTu(tep: string, ten: string, goc: string): Promise<Hono> {
    const mod = await import(tep)
    return new HonoCls().route(goc, mod[ten])
  }
  async function goi(app: Hono, url: string) {
    const res = await app.request(url)
    const body = (await res.json()) as Record<string, unknown>
    return { status: res.status, body, json: JSON.stringify(body) }
  }
  const coDuLieu = (b: Record<string, unknown>) => {
    const d = b.data as unknown
    if (Array.isArray(d)) return d.length
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>
      if (o.timeseries) return Object.keys(o.timeseries as object).length
      return o.id ? 1 : 0
    }
    return 0
  }
  const O_API: { ten: string; r: keyof typeof R; url: (m: string) => string }[] = [
    { ten: "/v1/markets/:id", r: "markets", url: (m) => `/v1/markets/${m}` },
    { ten: "/v1/markets/:id/submarkets", r: "markets", url: (m) => `/v1/markets/${m}/submarkets` },
    { ten: "/v1/markets/:id/insights", r: "markets", url: (m) => `/v1/markets/${m}/insights` },
    { ten: "/v1/listings?market", r: "listings", url: (m) => `/v1/listings?market=${m}&limit=200` },
    { ten: "/v1/listings?area", r: "listings", url: (m) => `/v1/listings?area=${m}&limit=200` },
    { ten: "/v1/asset-stats?market", r: "assetStats", url: (m) => `/v1/asset-stats?market=${m}` },
    { ten: "/v1/asset-stats?area", r: "assetStats", url: (m) => `/v1/asset-stats?area=${m}` },
    { ten: "/v1/deals?market", r: "deals", url: (m) => `/v1/deals?market=${m}&limit=100&min_discount=0` },
    { ten: "/v1/deals?area", r: "deals", url: (m) => `/v1/deals?area=${m}&limit=100&min_discount=0` },
  ]
  const boDoiApi = (s: string) =>
    s.replace(/await giaiMaKhuVuc\(c\.req\.param\("id"\)\)/g, 'await giaiMaKhuVuc(c.req.param("id")).then(() => c.req.param("id"))')
      .replace(/await giaiMaKhuVuc\((raw\w+)\)/g, "await giaiMaKhuVuc($1).then(() => $1)")

  test(`CHM-AC-${TT === "sau" ? 7 : 8} data-api — ma trận 9 ô (${TT})`, async () => {
    let soO = 0
    const dotBien: Partial<Record<keyof typeof R, Hono>> = {}
    for (const o of O_API) {
      const app = await appTu(abs(R[o.r].tep), R[o.r].ten, R[o.r].goc)
      const kM = await goi(app, o.url(M))
      assert.equal(kM.status, 200, `${o.ten} mã ${M}: HTTP ${kM.status} ${kM.json.slice(0, 120)}`)
      assert.ok(coDuLieu(kM.body) >= 1, `${o.ten} mã ${M} phải có dữ liệu (${coDuLieu(kM.body)})`)
      const kD = await goi(app, o.url(DAI))
      assert.equal(kD.status, kM.status, `${o.ten} mã dài khác mã ngắn (HTTP)`)
      assert.equal(kD.json, kM.json, `${o.ten} mã dài khác mã ngắn`)
      soO++
      console.log(`     ${o.ten}: ${coDuLieu(kM.body)} phần tử`)
      if (TT === "sau") {
        dotBien[o.r] ??= await appTu(chep(R[o.r].tep, `bo-doi-${o.r}`, boDoiApi(docTep(R[o.r].tep))), R[o.r].ten, R[o.r].goc)
        const dM = await goi(dotBien[o.r]!, o.url(M))
        const dD = await goi(dotBien[o.r]!, o.url(DAI))
        assert.throws(() => assert.equal(dD.json, dM.json, `${o.ten} mã dài khác mã ngắn`), /mã dài khác mã ngắn/)
      }
    }
    assert.equal(soO, 9, "số ô đã assert phải = 9")
    const markets = await appTu(abs(R.markets.tep), R.markets.ten, R.markets.goc)
    const chiTiet = await goi(markets, `/v1/markets/${DAI}`)
    assert.equal((chiTiet.body.data as { id: string }).id, M, `/v1/markets/${DAI} phải trả data.id = ${M}`)
    for (const id of MA_DAI) {
      const k = await goi(markets, `/v1/markets/${id}`)
      const cho = TT === "sau" ? ngan(id) : id
      assert.ok(k.status === 200 && (k.body.data as { id: string }).id === cho, `/v1/markets/${id} phải 200 data.id = ${cho} (${k.status})`)
    }
    console.log(`ok   ${TT}: 9/9 ô, 32 mã dài → data.id = ${TT === "sau" ? "mã ngắn" : "mã dài"}${TT === "sau" ? ", đột biến từng tệp route bị bắt" : ""}`)
  })

  test(`CHM-AC-8 data-api mã không đích, mã thường không tra thêm (${TT})`, async () => {
    const markets = await appTu(abs(R.markets.tep), R.markets.ten, R.markets.goc)
    const k = await goi(markets, "/v1/markets/vn-tinh-khong-co")
    assert.equal(k.status, 404, "/v1/markets/vn-tinh-khong-co phải 404")
    assert.match(k.json, /vn-tinh-khong-co/, "thông điệp 404 phải nêu nguyên mã nhận")
    const lst = await appTu(abs(R.listings.tep), R.listings.ten, R.listings.goc)
    assert.equal(coDuLieu((await goi(lst, "/v1/listings?market=vn-tinh-khong-co")).body), 0, "/v1/listings?market=vn-tinh-khong-co phải rỗng")
    let lib = docTep(`${DA}/lib/ma-thi-truong.ts`)
    lib = doi(lib, "if (ngan === id) return id;", 'if (ngan === id && id === "__khong__") return id;')
    const libLuon = path.basename(chep(`${DA}/lib/ma-thi-truong.ts`, "luon-tra-api", lib), ".ts")
    const gocCua: Partial<Record<keyof typeof R, Hono>> = {}
    const luonCua: Partial<Record<keyof typeof R, Hono>> = {}
    const dem = async (app: Hono, url: string) => { demApi = 0; await goi(app, url); return demApi }
    const KD = "vn-tinh-khong-co"
    let soO = 0
    // Ma trận 9 ô: mã không đích trùng từng byte với route của gốc hàng; mã thường không tra thêm.
    for (const o of O_API) {
      const r = R[o.r]
      const app = await appTu(abs(r.tep), r.ten, r.goc)
      gocCua[o.r] ??= await appTu(chep(r.tep, `goc-${o.r}`, docGoc(r.tep)), r.ten, r.goc)
      luonCua[o.r] ??= await appTu(chep(r.tep, `luon-tra-${o.r}`, doi(docTep(r.tep), '"../lib/ma-thi-truong.js"', `"../lib/${libLuon}.js"`)), r.ten, r.goc)
      const goc = gocCua[o.r]!
      const kK = await goi(app, o.url(KD))
      const kG = await goi(goc, o.url(KD))
      assert.equal(kK.status, kG.status, `${o.ten} mã không đích khác gốc hàng (HTTP)`)
      assert.equal(kK.json, kG.json, `${o.ten} mã không đích khác gốc hàng`)
      assert.equal(await dem(app, o.url("vn-hanoi")), await dem(goc, o.url("vn-hanoi")), `tra thêm khi mã không mang tiền tố dài: ${o.ten}`)
      if (TT === "sau") assert.ok((await dem(app, o.url(DAI))) >= (await dem(goc, o.url(DAI))) + 1, `${o.ten}: mã dài phải tra thêm ≥ 1 truy vấn`)
      assert.ok((await dem(luonCua[o.r]!, o.url("vn-hanoi"))) > (await dem(goc, o.url("vn-hanoi"))), `${o.ten}: đột biến luôn-tra phải làm ca đếm đỏ`)
      soO++
    }
    assert.equal(soO, 9, "số ô đã assert phải = 9")
    console.log(`ok   ${TT}: 404 nêu nguyên mã, listings rỗng; 9/9 ô mã không đích trùng gốc, vn-hanoi đếm = mốc gốc; luôn-tra bị bắt`)
  })
}
