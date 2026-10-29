// dong-chay-so-cu.test.tsx — hồ sơ _acceptance/dong-chay-so-cu-may-thu: /ops/data-flow ở máy thu báo số cũ khi
// `computed_at` cũ nhất của data_flow_snapshot quá FACTS_STALE_MS (45′, ADR-0014). Tên ca mở đầu bằng mã AC (SC-AC-n).
// Lược đồ tạm DB local `sc_*_<pid>`: fixture DF0 dùng chung (tests/ops-dong-chay-fixture.ts) + migration 051 THẬT +
// pipeline/sql/600 THẬT, rồi đặt computed_at theo ca quanh mốc NOW. Mỗi phép đo là một hàm «vấn đề» chạy trên vật thật
// (rỗng) và trên một bản đột biến cạnh tệp thật (thông điệp ghim) — chiều đỏ trên CÙNG fixture.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ReactElement, ReactNode } from "react"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { NOW, makeFlowSchema, refreshFlow } from "./ops-dong-chay-fixture"

const P = process.pid
const S_LOCAL = `sc_local_${P}` // máy thu: đủ bảng nạp + 051, làm tươi bằng 600
const S_NOTAB = `sc_notab_${P}` // máy thu chưa áp 051
const S_EMPTY = `sc_empty_${P}` // máy thu có 051, chưa làm tươi lần nào
const SCHEMAS = [S_LOCAL, S_NOTAB, S_EMPTY]
process.env.DATABASE_URL = schemaUrl(S_LOCAL) // pool của app = máy thu — đặt TRƯỚC mọi import động
delete process.env.VERCEL // máy thu
const WINDOWS = ["7d", "30d", "all"] as const
type W = (typeof WINDOWS)[number]

// ---------- jsdom (cùng khuôn dong-chay-cloud.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3461/ops/data-flow" })
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
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  ResizeObserver: class {
    cb: ResizeObserverCallback
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      this.cb([{ target: el, contentRect: { width: 800, height: 248 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
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
const txt = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ")

// ---------- dựng lược đồ ----------
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

before(async () => {
  try {
    await admin.connect()
    await makeOpsSchema(admin, S_LOCAL)
    await makeFlowSchema(admin, S_LOCAL, { fresh: false })
    await refreshFlow(S_LOCAL)
    await makeFlowSchema(admin, S_NOTAB, { migrate: false })
    await makeFlowSchema(admin, S_EMPTY)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  // Không act/unmount React ở đây: act trong hook after của node:test treo — dọn DOM thẳng.
  currentRoot = null
  document.body.innerHTML = ""
  for (const s of SCHEMAS) await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

type DF = import("../src/lib/data-flow-queries").DataFlow
type FF = import("../src/lib/data-flow-queries").FlowFacts
type GetDataFlow = typeof import("../src/lib/data-flow-queries").getDataFlow
type ViewMod = typeof import("../src/components/ops/data-flow/data-flow-view")

/** Mốc `min` phút trước NOW, dạng ISO UTC ms (cùng dạng localFacts đọc ra). */
const at = (min: number) => new Date(NOW - min * 60_000).toISOString()
/** Đặt computed_at từng cửa sổ của máy thu = NOW − phút. */
async function setAges(ages: Record<W, number>) {
  for (const w of WINDOWS) await admin.query(`UPDATE "${S_LOCAL}".data_flow_snapshot SET computed_at = $1 WHERE time_window = $2`, [at(ages[w]), w])
}
const allAges = (min: number): Record<W, number> => ({ "7d": min, "30d": min, all: min })
const factsOf = async (w: W) =>
  (await admin.query(`SELECT facts FROM "${S_LOCAL}".data_flow_snapshot WHERE time_window = $1`, [w])).rows[0].facts as FF

const QUERIES = "../src/lib/data-flow-queries"
const VIEW = "../src/components/ops/data-flow/data-flow-view"
/** getDataFlow (máy thu) của mô-đun `mod` với client gắn lược đồ `schema`. */
async function flowOf(window: W, { mod = QUERIES, schema = S_LOCAL }: { mod?: string; schema?: string } = {}): Promise<DF> {
  const { getDataFlow } = (await import(mod)) as { getDataFlow: GetDataFlow }
  const c = new pg.Client({ connectionString: schemaUrl(schema) })
  await c.connect()
  try {
    return await getDataFlow(window, { now: NOW, mode: "local", query: (t, v) => c.query(t, v) })
  } finally {
    await c.end()
  }
}
async function view(flow: DF, mod = VIEW) {
  const { DataFlowView } = (await import(mod)) as ViewMod
  return render(<DataFlowView flow={flow} roles={{}} nowMs={NOW} />)
}

let mutSeq = 0
/** Bản sao một tệp của app ngay cạnh bản thật (import tương đối giữ nguyên); trả đường import + tên cho import tương đối. */
function mutantApp(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  const dst = p.replace(/\/([^/]+)\.(tsx?)$/, `/.sc-mut-${P}-${++mutSeq}-$1.$2`)
  assert.notEqual(dst, p, `bản đột biến không được ghi đè tệp thật ${rel}`)
  writeFileSync(dst, out)
  return { path: dst.replace(/\.tsx?$/, ""), rel: `./${basename(dst).replace(/\.tsx?$/, "")}`, done: () => rmSync(dst, { force: true }) }
}
const STATE_LINE = "state: ageState(at, new Date(now))"
/** Bản đột biến của data-flow-queries.ts: thay dòng trạng thái của localFacts (và tuỳ chọn trỏ ops-facts khác). */
const mutantQueries = (state: string, opsFacts?: string) =>
  mutantApp("src/lib/data-flow-queries.ts", (s) => {
    assert.ok(s.includes(STATE_LINE), `localFacts không còn dòng «${STATE_LINE}»`)
    const out = s.replace(STATE_LINE, `state: ${state}`)
    return opsFacts ? out.replace(`from "./ops-facts";`, `from "${opsFacts}";`) : out
  })

// ---------- AC-1: số tươi ----------
/** Vấn đề của trang máy thu khi số 10′ tuổi; rỗng = đúng. */
async function freshProblems(root: Element, flow: DF, oldest: string): Promise<string[]> {
  const { fmtVnDateTime } = await import("../src/lib/format")
  const out: string[] = []
  if (flow.factsState !== "fresh") out.push(`số 10′ mà báo cũ (factsState ${flow.factsState})`)
  if (root.querySelector("[data-flow-stale]")) out.push("số 10′ mà báo cũ (có Alert số cũ)")
  const stamp = txt(root.querySelector("[data-flow-stamp]"))
  if (stamp !== `Số tính lúc ${fmtVnDateTime(oldest)}`) out.push(`dòng mốc «${stamp}» ≠ «Số tính lúc ${fmtVnDateTime(oldest)}»`)
  return out
}

describe("SC-AC-1 tươi", () => {
  test("SC-AC-1 tươi — computed_at 10′ → fresh, «Số tính lúc …», không Alert số cũ", async () => {
    ready()
    await setAges(allAges(10))
    const flow = await flowOf("7d")
    const root = await view(flow)
    console.log(`# SC-AC-1: factsState ${flow.factsState} · ${txt(root.querySelector("[data-flow-stamp]"))}`)
    assert.deepEqual(await freshProblems(root, flow, at(10)), [])

    // Chiều đỏ cùng ca: localFacts đột biến luôn trả stale.
    const mut = mutantQueries(`"stale" as const`)
    try {
      const bad = await flowOf("7d", { mod: mut.path })
      const p = await freshProblems(await view(bad), bad, at(10))
      assert.ok(p.some((m) => m.startsWith("số 10′ mà báo cũ")), `đột biến luôn-stale phải đỏ «số 10′ mà báo cũ»: ${p.join(" | ")}`)
    } finally {
      mut.done()
    }
  })
})

// ---------- AC-2: số cũ trên route ----------
/** Vấn đề của trang máy thu khi số cũ; rỗng = đúng. Số trên DOM so với `facts` của bảng. */
async function staleProblems(root: Element, flow: DF, oldest: string, facts: FF): Promise<string[]> {
  const { fmtVnDateTime } = await import("../src/lib/format")
  const out: string[] = []
  if (flow.mode !== "local") out.push(`nhánh ${flow.mode}, không phải máy thu`)
  if (flow.factsState !== "stale") out.push(`số 3 giờ mà không báo cũ (factsState ${flow.factsState})`)
  const alert = root.querySelector("[data-flow-stale]")
  const title = `Bước làm tươi số dòng chảy không chạy từ ${fmtVnDateTime(oldest)}`
  const desc = "Số dưới đây là lần tính cuối — kiểm tác vụ đồng bộ ở máy thu."
  if (!alert) out.push("số 3 giờ mà không báo cũ (thiếu Alert số cũ)")
  else {
    if (txt(alert.querySelector("[data-slot=alert-title]")) !== title) out.push(`tiêu đề Alert «${txt(alert.querySelector("[data-slot=alert-title]"))}» ≠ «${title}»`)
    if (txt(alert.querySelector("[data-slot=alert-description]")) !== desc) out.push(`mô tả Alert «${txt(alert.querySelector("[data-slot=alert-description]"))}» ≠ «${desc}»`)
  }
  const ul = root.querySelector("ul.sr-only")
  const pipe = ul?.closest("[data-slot=frame]") ?? ul
  if (alert && pipe) {
    if (pipe.contains(alert)) out.push("Alert số cũ lồng trong vùng đường ống")
    else if (!(alert.compareDocumentPosition(pipe) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING)) out.push("Alert số cũ không nằm trước vùng đường ống")
  }
  const dong = [...root.querySelectorAll("ul.sr-only li")].map((li) => txt(li))
  const table = root.querySelector("th[data-col-id='health']")?.closest("table")
  const cols = [...(table?.querySelectorAll("thead th") ?? [])].map((th) => th.getAttribute("data-col-id"))
  for (const s of facts.sources.filter((x) => x.received > 0)) {
    if (!dong.some((l) => l.includes(s.source) && l.endsWith(`tới Bài nhận: ${s.received}`))) out.push(`đường ống thiếu «${s.source} tới Bài nhận: ${s.received}»`)
    const tr = [...(table?.querySelectorAll("tbody tr") ?? [])].find((r) => txt(r.querySelector("td")).includes(s.source))
    const cell = (col: string) => txt(tr?.querySelectorAll("td")[cols.indexOf(col)]?.querySelector("span.font-medium"))
    for (const [k, col, v] of [["Bài nhận", "received", s.received], ["Đọc được", "readable", s.readable], ["Tin rao", "offers", s.offers], ["Đủ trường lõi", "complete", s.complete], ["Gắn căn", "linked", s.linked]] as const)
      if (cell(col) !== String(v)) out.push(`hàng ${s.source} ô ${k} «${cell(col)}» ≠ ${v}`)
  }
  return out
}
/** Route /ops/data-flow ở máy thu: DataFlowContent THẬT (pool = lược đồ máy thu, không VERCEL). */
async function route(window: W) {
  const { DataFlowContent } = await import("../src/components/ops/data-flow/data-flow-content")
  return (await DataFlowContent({ window, nowMs: NOW, getUser: async () => null })) as ReactElement<{ flow: DF }>
}

describe("SC-AC-2 cũ trên route", () => {
  test("SC-AC-2 cũ trên route — computed_at cũ nhất 3 giờ (cả ba dòng / chỉ dòng 30d) → Alert số cũ, số vẫn hiện", async () => {
    ready()
    const facts = await factsOf("7d")
    assert.ok(facts.sources.some((s) => s.received > 0), "fixture không có nguồn nào có bài — phép so số rỗng")
    for (const [ca, ages] of [
      ["cả ba dòng", allAges(180)],
      ["chỉ dòng 30d", { "7d": 10, "30d": 180, all: 10 }],
    ] as const) {
      await setAges(ages)
      const el = await route("7d")
      const root = await render(el)
      console.log(`# SC-AC-2 ${ca}: ${el.props.flow.factsState} · «${txt(root.querySelector("[data-flow-stale]"))}»`)
      assert.deepEqual(await staleProblems(root, el.props.flow, at(180), facts), [], ca)
    }

    // Chiều đỏ cùng ca (1): localFacts đột biến luôn trả fresh.
    await setAges(allAges(180))
    const mq = mutantQueries(`"fresh" as const`)
    try {
      const bad = await flowOf("7d", { mod: mq.path })
      const p = await staleProblems(await view(bad), bad, at(180), facts)
      assert.ok(p.some((m) => m.startsWith("số 3 giờ mà không báo cũ")), `đột biến luôn-fresh phải đỏ «số 3 giờ mà không báo cũ»: ${p.join(" | ")}`)
    } finally {
      mq.done()
    }
    // Chiều đỏ cùng ca (2): view đột biến bỏ vùng số khi stale.
    const mv = mutantApp("src/components/ops/data-flow/data-flow-view.tsx", (s) =>
      s.replace(`const hasFacts = flow.factsState === "fresh" || flow.factsState === "stale"`, `const hasFacts = flow.factsState === "fresh"`),
    )
    try {
      const flow = (await route("7d")).props.flow
      const p = await staleProblems(await view(flow, mv.path), flow, at(180), facts)
      assert.ok(p.some((m) => m.startsWith("đường ống thiếu «")), `view bỏ vùng số phải đỏ «đường ống thiếu …»: ${p.join(" | ")}`)
      assert.ok(p.some((m) => / ô Đủ trường lõi «» ≠ /.test(m)), `view bỏ vùng số phải đỏ nêu ô «Đủ trường lõi»: ${p.join(" | ")}`)
    } finally {
      mv.done()
    }
  })
})

// ---------- AC-3: ngưỡng là FACTS_STALE_MS ----------
/** Ma trận viết trước: tuổi (phút) → trạng thái máy thu theo ngưỡng 45′. */
const MATRIX: [number, "fresh" | "stale"][] = [
  [44, "fresh"],
  [46, "stale"],
]
async function statesOf(mod: string) {
  const out: Record<number, string> = {}
  for (const [min] of MATRIX) {
    await setAges(allAges(min))
    out[min] = (await flowOf("7d", { mod })).factsState
  }
  return out
}
/** Vấn đề khi ngưỡng chung đổi thành 60′: ca 46′ của máy thu phải đổi theo (fresh). */
const followProblems = (s: Record<number, string>) => (s[46] === "fresh" ? [] : [`máy thu không dùng FACTS_STALE_MS (46′ vẫn ${s[46]} khi hằng chung là 60′)`])

describe("SC-AC-3 ngưỡng", () => {
  test("SC-AC-3 ngưỡng — 44′ fresh, 46′ stale; đổi FACTS_STALE_MS thành 60′ thì 46′ đổi theo", async () => {
    ready()
    const { FACTS_STALE_MS } = await import("../src/lib/ops-facts")
    assert.equal(FACTS_STALE_MS, 45 * 60_000, "ngưỡng cũ ≠ 45′ ADR-0014")
    const real = await statesOf(QUERIES)
    console.log(`# SC-AC-3 thật: ${JSON.stringify(real)}`)
    assert.equal(Object.keys(real).length, MATRIX.length)
    for (const [min, want] of MATRIX) assert.equal(real[min], want, `${min}′ → ${real[min]}, mong ${want}`)

    // Hằng chung 60′: bản sao ops-facts + bản sao data-flow-queries trỏ tới nó.
    const ops60 = mutantApp("src/lib/ops-facts.ts", (s) => s.replace("export const FACTS_STALE_MS = 45 * 60_000", "export const FACTS_STALE_MS = 60 * 60_000"))
    const q60 = mutantQueries("ageState(at, new Date(now))", ops60.rel)
    // Chiều đỏ cùng ca: bản sao data-flow-queries mang hằng 45′ riêng (vẫn trỏ ops-facts 60′).
    const own = mutantQueries(`(now - Date.parse(at) <= 45 * 60_000 ? "fresh" : "stale") as "fresh" | "stale"`, ops60.rel)
    try {
      const s60 = await statesOf(q60.path)
      console.log(`# SC-AC-3 hằng chung 60′: ${JSON.stringify(s60)}`)
      assert.deepEqual(followProblems(s60), [])
      const sOwn = await statesOf(own.path)
      const p = followProblems(sOwn)
      assert.ok(p.some((m) => m.startsWith("máy thu không dùng FACTS_STALE_MS")), `bản sao mang hằng riêng phải đỏ «máy thu không dùng FACTS_STALE_MS»: ${JSON.stringify(sOwn)}`)
    } finally {
      ops60.done()
      q60.done()
      own.done()
    }
  })
})

// ---------- AC-5: bảng vắng / chưa có dòng ----------
describe("SC-AC-5 vắng", () => {
  test("SC-AC-5 vắng — không bảng → none; có bảng mà không dòng → none; có dòng → không none", async () => {
    ready()
    const noTab = await flowOf("7d", { schema: S_NOTAB })
    const empty = await flowOf("7d", { schema: S_EMPTY })
    await setAges(allAges(10))
    const has = await flowOf("7d")
    console.log(`# SC-AC-5: không bảng ${noTab.factsState} · không dòng ${empty.factsState} · có dòng ${has.factsState}`)
    assert.equal(noTab.factsState, "none", "máy thu chưa áp 051 phải none")
    assert.equal(empty.factsState, "none", "bảng chưa làm tươi phải none")
    assert.notEqual(has.factsState, "none", "đối chứng dương: có dòng mà vẫn none")
  })
})
