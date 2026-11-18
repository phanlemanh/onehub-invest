// so-moc-s03.test.tsx — hồ sơ _acceptance/so-so-tren-man-theo-ngay (SM1, AC-6…AC-8): số mốc S03 từ khối cloud tới màn. Tên ca mở đầu bằng mã AC.
// AC-6 dùng lược đồ tạm `sm_*_<pid>`, 600 thật, push-ops-facts thật, handler ingest thật. AC-7 và AC-8 là ma trận viết trước trên hàm và
// component thật. Đột biến áp lên chính văn bản mã nguồn (chép ra thư mục tạm), rồi đi qua cùng hàm kiểm với bản thật.
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ComponentType, ReactNode } from "react"
import ts from "typescript"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { DataFlow, FlowFacts, Milestone } from "../src/lib/data-flow-queries"
import { NOW, ROOT, makeFlowSchema, refreshFlow } from "./ops-dong-chay-fixture"

const P = process.pid
const S_LOCAL = `sm_local_${P}`
const S_CLOUD = `sm_cloud_${P}`
const S_CHAN = `sm_chan_${P}`
const SCHEMAS = [S_LOCAL, S_CLOUD, S_CHAN]
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app = máy chủ, đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "sm-thu"
delete process.env.VERCEL

const APP = join(ROOT, "app")
const WINDOWS = ["7d", "30d", "all"] as const

// ---------- jsdom (cùng khuôn dong-chay-cloud.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/ops/data-flow" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  ResizeObserver: class {
    cb: ResizeObserverCallback
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      this.cb([{ target: el, contentRect: { width: 320, height: 96 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null
// useRouter của Next trả bản chép của đối tượng này, nên bộ đếm phải nằm ngoài, không dùng `this`.
let soLanLamMoi = 0
const router = { refresh: () => void soLanLamMoi++, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>))
  return document.getElementById("root")!
}
const txt = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim()

// ---------- đột biến trên văn bản mã nguồn ----------
const tamDirs: string[] = []
function doi(src: string, tu: string | RegExp, thanh: string) {
  const moi = src.replace(tu, thanh)
  assert.notEqual(moi, src, `khuôn đột biến không khớp mã nguồn: ${tu}`)
  return moi
}
/** Thư mục tạm có node_modules của app, để bản chép dùng chung một React với test. */
function thuMucTam() {
  const dir = mkdtempSync(join(tmpdir(), "sm1-dot-bien-"))
  tamDirs.push(dir)
  symlinkSync(join(APP, "node_modules"), join(dir, "node_modules"))
  mkdirSync(join(dir, "ops"))
  return join(dir, "ops")
}
const tuyetDoi = (src: string) => src.replace(/from "@\/([^"]+)"/g, (_, p) => `from ${JSON.stringify(join(APP, "src", p))}`)
const TEP_DATA = join(APP, "src/components/ops/data-flow/milestone-trend-data.ts")
const TEP_VUNG = join(APP, "src/components/ops/data-flow/milestone-trend.tsx")
type DataMod = typeof import("../src/components/ops/data-flow/milestone-trend-data")
type VungMod = typeof import("../src/components/ops/data-flow/milestone-trend")
async function dataDotBien(pha: (src: string) => string): Promise<DataMod> {
  const tep = join(thuMucTam(), "milestone-trend-data.ts")
  writeFileSync(tep, tuyetDoi(pha(readFileSync(TEP_DATA, "utf8"))))
  return import(pathToFileURL(tep).href)
}
async function vungDotBien(pha: (src: string) => string): Promise<VungMod> {
  const dir = thuMucTam()
  writeFileSync(join(dir, "milestone-trend-data.ts"), tuyetDoi(pha(readFileSync(TEP_DATA, "utf8"))))
  writeFileSync(join(dir, "milestone-trend.tsx"), tuyetDoi(readFileSync(TEP_VUNG, "utf8")))
  return import(pathToFileURL(join(dir, "milestone-trend.tsx")).href)
}
/** normalizeFacts rút từ mã nguồn thật (trọn các hàm nó cần), đã qua `pha`, chạy độc lập với pool của app. */
async function normalizeTuNguon(pha: (src: string) => string = (s) => s) {
  const src = readFileSync(join(APP, "src/lib/data-flow-queries.ts"), "utf8")
  const dau = src.indexOf("const nOrNull")
  const ham = src.indexOf("export function normalizeFacts")
  const cuoi = src.indexOf("\n}\n", ham) + 3
  assert.ok(dau >= 0 && ham > dau && cuoi > ham, "không rút được normalizeFacts từ mã nguồn")
  const js = ts.transpileModule(pha(src.slice(dau, cuoi)), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  const tep = join(thuMucTam(), "normalize.mjs")
  writeFileSync(tep, js)
  return (await import(pathToFileURL(tep).href)).normalizeFacts as (raw: FlowFacts) => FlowFacts
}

// ---------- AC-6: khối cloud ----------
type Payload = Record<string, unknown> & { blocks: Record<string, { windows?: Record<string, FlowFacts> }> }
const NGAY = new Date(NOW + 7 * 3600000).toISOString().slice(0, 10) // ngày VN của mốc ghim
const lui = (n: number) => new Date(Date.parse(`${NGAY}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10)
const CU: Milestone[] = [
  { ngay: lui(2), offers_total: 4, project_linked: 1, building_linked: 0, project_ranked: 0, building_ranked: 0 },
  { ngay: lui(1), offers_total: 5, project_linked: 2, building_linked: 0, project_ranked: 1, building_ranked: 0 },
]
const HOM_NAY: Milestone = { ngay: NGAY, offers_total: 2, project_linked: 1, building_linked: 0, project_ranked: 1, building_ranked: 1 }
const MONG = [...CU, HOM_NAY]

const admin = new pg.Client({ connectionString: localDbUrl() })
let daNoi = false
const push = async (schema: string) =>
  (await captureOpsFacts({ env: { DATABASE_URL: schemaUrl(schema) } })) as { code: number; stdout: string; stderr: string; payload: Payload | null }
async function chenMoc(schema: string, detail: unknown) {
  await admin.query(`INSERT INTO "${schema}".dq_check_results (check_name, entity, status, detail) VALUES ('s03-moc-ngay', 'S03', 'pass', $1)`, [JSON.stringify(detail)])
}
/** Máy thu thử: hai tin S03 của fixture, o1 có dự án và hạng cấp toà; số các ngày trước chèn sẵn. */
async function dungMayThu(schema: string, extra: () => Promise<void> = async () => {}) {
  await makeOpsSchema(admin, schema)
  await makeFlowSchema(admin, schema, { fresh: false })
  await admin.query(`INSERT INTO "${schema}".offer_project (offer_id, source, project_node_id, status) VALUES ('o1', 'S03', 1, 'mot_du_an')`)
  await admin.query(`INSERT INTO "${schema}".offer_price_rank (offer_id, kind, cap, hang_pct, run_id) VALUES ('o1', 'sale', 'toa', 40, 'sm')`)
  for (const m of CU) await chenMoc(schema, m)
  await extra()
  await refreshFlow(schema)
}
let sanSang: Promise<Payload> | null = null
function chuanBi() {
  sanSang ??= (async () => {
    await admin.connect()
    daNoi = true
    await dungMayThu(S_LOCAL)
    const r = await push(S_LOCAL)
    assert.equal(r.code, 0, r.stderr.slice(0, 600))
    assert.ok(r.payload, "push-ops-facts không gửi bản tin")
    await makeFlowSchema(admin, S_CLOUD, { tables: ["sale_offers", "property_offers", "areas", "listings"], migrate: false })
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
    const { POST } = await import("../src/app/api/v1/ops/ingest/route")
    const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer sm-thu" }, body: JSON.stringify(r.payload) }))
    assert.equal(res.status, 200)
    return r.payload
  })()
  return sanSang
}
async function asCloud<T>(fn: () => Promise<T>): Promise<T> {
  process.env.VERCEL = "1"
  try {
    return await fn()
  } finally {
    delete process.env.VERCEL
  }
}
after(async () => {
  currentRoot = null
  document.body.innerHTML = ""
  for (const d of tamDirs) rmSync(d, { recursive: true, force: true })
  if (daNoi) {
    for (const s of SCHEMAS) await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
    await admin.end().catch(() => {})
  }
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

test("SM1-AC-6 khối dataFlow do push-ops-facts thật dựng mang milestones ở cả ba cửa sổ", { timeout: 180_000 }, async () => {
  const payload = await chuanBi()
  for (const w of WINDOWS) assert.deepEqual(payload.blocks.dataFlow.windows?.[w].milestones, MONG, `cửa sổ ${w}`)
})
test("SM1-AC-6 getDataFlow chế độ cloud trả nguyên giá trị milestones", { timeout: 180_000 }, async () => {
  await chuanBi()
  const { getDataFlow } = await import("../src/lib/data-flow-queries")
  for (const w of WINDOWS) {
    const flow = await asCloud(() => getDataFlow(w, { now: NOW }))
    assert.equal(flow.mode, "cloud")
    assert.deepEqual(flow.milestones, MONG, `cửa sổ ${w}`)
  }
})
test("SM1-AC-6 khối cũ không có khoá milestones đọc thành mảng rỗng, không lỗi", { timeout: 180_000 }, async () => {
  await chuanBi()
  const { getDataFlow } = await import("../src/lib/data-flow-queries")
  const { readOpsFacts } = await import("../src/lib/ops-facts")
  const flow = await asCloud(() =>
    getDataFlow("7d", {
      now: NOW,
      readFacts: async (o) => {
        const facts = await readOpsFacts(o)
        const data = facts.blocks.dataFlow?.data as { windows: Record<string, Partial<FlowFacts>> }
        for (const w of WINDOWS) delete data.windows[w].milestones
        return facts
      },
    }),
  )
  assert.equal(flow.factsState === "error", false, flow.factsError ?? "")
  assert.deepEqual(flow.milestones, [])
})
test("SM1-AC-6 bộ soát tầng A của lượt đẩy không báo chặn", { timeout: 180_000 }, async () => {
  await chuanBi()
  const r = await push(S_LOCAL)
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  assert.doesNotMatch(r.stderr, /FACTS CHẶN/)
})
test("SM1-AC-6 đối chứng: tên nguồn cấy vào số mốc thì lượt đẩy bị chặn đúng đường milestones", { timeout: 180_000 }, async () => {
  await chuanBi()
  const tenGia = "nguongiasmmot"
  await dungMayThu(S_CHAN, async () => {
    await admin.query(`INSERT INTO "${S_CHAN}".source_registry (code, real_name) VALUES ('S99', $1)`, [tenGia])
    await chenMoc(S_CHAN, { ...CU[0], ngay: `2026-01-01 ${tenGia}` })
  })
  const r = await push(S_CHAN)
  assert.notEqual(r.code, 0, "lượt đẩy phải dừng khi số mốc mang tên nguồn")
  assert.match(r.stderr, /FACTS CHẶN \[tầng A\] blocks\.dataFlow\.windows\.\w+\.milestones/)
})

function kiemKhoiCu(normalize: (raw: FlowFacts) => FlowFacts) {
  const { milestones: _bo, ...cu } = { sources: [], days: [], groups: [], shortStay: {}, mix: {}, enrichPending: 0, milestones: [] }
  void _bo
  assert.deepEqual(normalize(cu as unknown as FlowFacts).milestones, [], "milestones: khối cũ phải đọc thành mảng rỗng")
}
test("SM1-AC-6 normalizeFacts rút từ mã nguồn đọc khối cũ thành mảng rỗng", async () => {
  kiemKhoiCu(await normalizeTuNguon())
})
test("SM1-AC-6 đột biến normalizeFacts bỏ khoá milestones thì đỏ", async () => {
  const pha = await normalizeTuNguon((s) => doi(s, /^\s*milestones: raw\.milestones \?\? \[\],\n/m, ""))
  assert.throws(() => kiemKhoiCu(pha), /milestones: khối cũ/)
})

// ---------- AC-7: ma trận chuỗi ngày ----------
const moc = (ngay: string, n: number): Milestone => ({ ngay, offers_total: 7070, project_linked: n, building_linked: 0, project_ranked: 0, building_ranked: 0 })
const ngay11 = (d: number) => `2026-11-${String(d).padStart(2, "0")}`
const chuoi = (o: Record<number, number>) => Object.entries(o).map(([d, n]) => moc(ngay11(Number(d)), n))

/** [tên ca, số theo ngày tháng 11, kết cục viết trước]. */
const MA_TRAN_NGAY: [string, Record<number, number>, { delta: number | null; nhan: string; dungYen: boolean }][] = [
  ["tăng", { 17: 100, 18: 105 }, { delta: 5, nhan: "+5 so với hôm trước", dungYen: false }],
  ["giảm", { 17: 100, 18: 97 }, { delta: -3, nhan: "−3 so với hôm trước", dungYen: false }],
  ["tăng hàng nghìn có dấu chấm", { 17: 5432, 18: 6890 }, { delta: 1458, nhan: "+1.458 so với hôm trước", dungYen: false }],
  ["không đổi", { 17: 100, 18: 100 }, { delta: 0, nhan: "Không đổi so với hôm trước", dungYen: false }],
  ["mới có một ngày", { 18: 105 }, { delta: null, nhan: "Chưa có số hôm trước", dungYen: false }],
  ["thiếu đúng ngày hôm trước, không so với ngày cũ hơn", { 16: 100, 18: 105 }, { delta: null, nhan: "Chưa có số hôm trước", dungYen: false }],
  ["ba ngày đã chốt bằng nhau thì đứng yên", { 15: 100, 16: 100, 17: 100, 18: 110 }, { delta: 10, nhan: "+10 so với hôm trước", dungYen: true }],
  ["ba ngày đã chốt và hôm nay bằng nhau thì đứng yên", { 15: 100, 16: 100, 17: 100, 18: 100 }, { delta: 0, nhan: "Không đổi so với hôm trước", dungYen: true }],
  ["hai ngày đã chốt bằng nhau thì không", { 16: 100, 17: 100, 18: 110 }, { delta: 10, nhan: "+10 so với hôm trước", dungYen: false }],
  ["sáng sớm: hôm nay bằng hôm qua mà các ngày chốt có đổi thì không", { 15: 90, 16: 100, 17: 100, 18: 100 }, { delta: 0, nhan: "Không đổi so với hôm trước", dungYen: false }],
  ["ngày trống giữa chuỗi thì không", { 14: 100, 15: 100, 17: 100, 18: 100 }, { delta: 0, nhan: "Không đổi so với hôm trước", dungYen: false }],
  ["số 0 đứng yên vẫn được đánh dấu (khuyến nghị Hỏi-1)", { 15: 0, 16: 0, 17: 0, 18: 0 }, { delta: 0, nhan: "Không đổi so với hôm trước", dungYen: true }],
]
function ketCuc(mod: DataMod, o: Record<number, number>) {
  const tile = mod.milestoneTiles(chuoi(o), 30).find((t) => t.key === "project_linked")!
  return { delta: tile.delta, nhan: mod.deltaLabel(tile.delta), dungYen: tile.stalled }
}
for (const [ten, o, mong] of MA_TRAN_NGAY) {
  test(`SM1-AC-7 ${ten}`, async () => {
    assert.deepEqual(ketCuc(await import("../src/components/ops/data-flow/milestone-trend-data"), o), mong)
  })
}
test("SM1-AC-7 đột biến tính cả hôm nay vào đứng yên thì ca sáng sớm đỏ", async () => {
  const mod = await dataDotBien((s) => doi(s, "[at(1), at(2), at(3)]", "[at(0), at(1), at(2)]"))
  const ca = MA_TRAN_NGAY.find(([ten]) => ten.startsWith("sáng sớm"))!
  assert.throws(() => assert.deepEqual(ketCuc(mod, ca[1]), ca[2]), /dungYen/)
})

// ---------- AC-8: năm DataFlow viết trước ----------
const m = (ngay: string, project_linked: number, project_ranked: number): Milestone => ({ ngay, offers_total: 7070, project_linked, building_linked: 0, project_ranked, building_ranked: 0 })
const dfGoc = { sources: [], days: [], groups: [], shortStay: { received: 0, stored: 0, withWard: 0, latestAt: null }, mix: { sale: 0, rentLt: 0, shortStay: 0 }, enrichPending: 0 }
const df = (milestones?: Milestone[]) => ({ ...dfGoc, ...(milestones ? { milestones } : {}) }) as unknown as DataFlow
const DF_KHONG_DONG = df([])
const DF_THIEU_KHOA = df()
const DF_MOT_NGAY = df([m("2026-11-18", 6890, 5432)])
const DF_DU_NGAY = df([m("2026-11-16", 6800, 5400), m("2026-11-17", 6880, 5422), m("2026-11-18", 6890, 5432)])
const DF_DUNG_YEN = df([m("2026-11-15", 6800, 5432), m("2026-11-16", 6850, 5432), m("2026-11-17", 6880, 5432), m("2026-11-18", 6890, 5440)])
const NHAN_O = ["Có dự án", "Khớp toà", "Có hạng cấp dự án", "Có hạng cấp toà"]

type Vung = VungMod["MilestoneTrend"]
async function dung(flow: DataFlow, Comp?: Vung, windowDays = 7) {
  const { normalizeFacts } = await import("../src/lib/data-flow-queries")
  const C: ComponentType<{ milestones: Milestone[]; windowDays: number }> = Comp ?? (await import("../src/components/ops/data-flow/milestone-trend")).MilestoneTrend
  return render(<C milestones={normalizeFacts(flow).milestones} windowDays={windowDays} />)
}
/** Khung của một ô: hai tầng trên nhãn. */
function oCua(root: Element, nhan: string) {
  const the = [...root.querySelectorAll("span")].find((s) => txt(s) === nhan)
  assert.ok(the, `không thấy ô «${nhan}»`)
  return the.parentElement!.parentElement!
}
const dongBang = (root: Element) => [...root.querySelectorAll("table.sr-only tbody tr")].map((r) => [...r.children].map(txt))

function kiemTrong(root: Element) {
  const chu = txt(root)
  assert.match(chu, /Chưa có số mốc theo ngày/)
  assert.match(chu, /Số đầu tiên xuất hiện sau lượt làm tươi kế\./)
  assert.ok([...root.querySelectorAll("button")].some((b) => txt(b) === "Tải lại"), "trạng thái trống phải có nút Tải lại")
  assert.equal(root.querySelector("table"), null, "trạng thái trống không có bảng")
  for (const n of NHAN_O) assert.ok(![...root.querySelectorAll("span")].some((s) => txt(s) === n), `trạng thái trống không có ô «${n}»`)
}
test("SM1-AC-8 không dòng nào: chữ trạng thái trống và nút Tải lại gọi làm mới", { timeout: 60_000 }, async () => {
  const root = await dung(DF_KHONG_DONG)
  kiemTrong(root)
  const React = await import("react")
  const truoc = soLanLamMoi
  const nut = [...root.querySelectorAll("button")].find((b) => txt(b) === "Tải lại")!
  await React.act(async () => (nut as HTMLElement).click())
  assert.equal(soLanLamMoi, truoc + 1, "nút Tải lại phải làm mới trang")
})
test("SM1-AC-8 khối thiếu khoá milestones: hiện đúng trạng thái trống, không lỗi", { timeout: 60_000 }, async () => {
  kiemTrong(await dung(DF_THIEU_KHOA))
})
test("SM1-AC-8 một ngày: bốn ô có số, dòng phụ «Chưa có số hôm trước», bảng ẩn đọc ngày trống", { timeout: 60_000 }, async () => {
  const root = await dung(DF_MOT_NGAY)
  for (const n of NHAN_O) assert.match(txt(oCua(root, n)), /Chưa có số hôm trước/, `ô «${n}»`)
  assert.match(txt(oCua(root, "Có dự án")), /6\.890/)
  assert.match(txt(oCua(root, "Có dự án")), /Cả khoảng: 6\.890/)
  const bang = dongBang(root)
  assert.equal(bang.length, 7, "bảng ẩn đủ bảy ngày của cửa sổ")
  assert.deepEqual(bang[6], ["18/11", "6.890", "0", "5.432", "0"])
  assert.deepEqual(bang[0], ["12/11", "Không có số", "Không có số", "Không có số", "Không có số"])
  assert.equal(txt(root).includes("Đứng yên 2 ngày"), false, "một ngày không đánh dấu đứng yên")
})
async function kiemDu(Comp?: Vung) {
  const root = await dung(DF_DU_NGAY, Comp)
  assert.match(txt(oCua(root, "Có dự án")), /97,5%\s*tin đang rao/, "phần trăm trên tin đang rao của ô Có dự án")
  assert.match(txt(oCua(root, "Có hạng cấp dự án")), /76,8%\s*tin đang rao/, "phần trăm trên tin đang rao của ô Có hạng cấp dự án")
  assert.match(txt(oCua(root, "Khớp toà")), /0,0%\s*tin đang rao/, "phần trăm trên tin đang rao của ô Khớp toà")
  assert.match(txt(oCua(root, "Có dự án")), /\+10 so với hôm trước/)
  assert.match(txt(oCua(root, "Khớp toà")), /Không đổi so với hôm trước/)
  assert.match(txt(oCua(root, "Có dự án")), /Thấp nhất 6\.800 · cao nhất 6\.890/)
  const bang = dongBang(root)
  assert.deepEqual(bang.slice(-3), [
    ["16/11", "6.800", "0", "5.400", "0"],
    ["17/11", "6.880", "0", "5.422", "0"],
    ["18/11", "6.890", "0", "5.432", "0"],
  ])
  assert.deepEqual([...root.querySelectorAll("table.sr-only thead th")].map(txt), ["Ngày", ...NHAN_O], "bảng ẩn mang bốn nhãn")
}
test("SM1-AC-8 đủ ngày: bốn nhãn, phần trăm trên tin đang rao, mức đổi, bảng ẩn có số từng ngày", { timeout: 60_000 }, async () => {
  await kiemDu()
})
test("SM1-AC-8 đột biến đổi mẫu số phần trăm thì đỏ", { timeout: 60_000 }, async () => {
  const mod = await vungDotBien((s) => doi(s, "today[key] / today.offers_total", "today[key] / today.project_linked"))
  await assert.rejects(() => kiemDu(mod.MilestoneTrend), /phần trăm trên tin đang rao/)
})
test("SM1-AC-8 có ô đứng yên: đúng ô đó mang cờ «Đứng yên 2 ngày»", { timeout: 60_000 }, async () => {
  const root = await dung(DF_DUNG_YEN)
  assert.match(txt(oCua(root, "Có hạng cấp dự án")), /Đứng yên 2 ngày/)
  assert.doesNotMatch(txt(oCua(root, "Có dự án")), /Đứng yên 2 ngày/, "ô có số đổi không mang cờ")
})
