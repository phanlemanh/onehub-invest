// viewer-the-duyet.test.tsx — hồ sơ _acceptance/viewer-khong-thay-the-duyet: vai viewer vào được Ops nhưng không nhận nội
// dung thẻ duyệt hay bài gốc (AGENTS.md luật 6: nội dung tin cho vai ops trở lên). Tên ca mở đầu bằng mã AC (VT-AC-n).
// Ca DB dựng lược đồ tạm `vt_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt. Mỗi phép đo có chiều đỏ: một
// bản chép tạm của tệp nguồn (tests/.vt-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"
import type { ReactNode } from "react"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S = `vt_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_EMAILS = "vt-ops@local.test"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
type User = import("../src/lib/auth").User
const NGUOI = {
  user: { id: "1", email: "vt-user@local.test", plan: "free", role: "user" },
  viewer: { id: "2", email: "vt-viewer@local.test", plan: "free", role: "viewer" },
  ops: { id: "3", email: "vt-o@local.test", plan: "free", role: "ops" },
  admin: { id: "4", email: "vt-admin@local.test", plan: "free", role: "admin" },
  owner: { id: "5", email: "vt-owner@local.test", plan: "free", role: "owner" },
  opsEmail: { id: "6", email: "vt-ops@local.test", plan: "free", role: "user" },
} satisfies Record<string, User>
type Kieu = keyof typeof NGUOI

// ---------- jsdom (cùng khuôn ops-dong-chay.test.tsx) — chỉ cho ca sheet ----------
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
    observe() {}
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
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(node))
  return document.getElementById("root")!
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react")
  await React.act(async () => {
    await fn()
    await new Promise((r) => setTimeout(r, 20))
  })
}
const click = async (el: Element | null | undefined, what: string) => {
  assert.ok(el, `không tìm thấy ${what} để bấm`)
  await act(() => (el as HTMLElement).click())
}
const dialogs = () => document.querySelectorAll("[role=dialog]")
async function closeSheets() {
  for (const d of dialogs()) {
    await act(() => {
      d.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })
  }
  await act(() => new Promise((r) => setTimeout(r, 30)))
}

// ---------- bản chép tạm (đối chứng dương) ----------
const CHEP: string[] = []
/** Chép một tệp nguồn của app thành tests/.vt-cu-<pid>-<n>.<ext>, đổi đúng một chỗ, đổi mọi import tương đối sang tuyệt đối. */
async function banChepTam<T>(rel: string, doi: (s: string) => string): Promise<T> {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.vt-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  // tsx dịch JSX ở tests/ theo runtime cổ điển (tsconfig không phủ bản chép) → cần React trong phạm vi.
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return (await import(f)) as T
}

// ---------- lược đồ tạm ----------
const TABLES = ["review_queue", "stg_zalo_posts", "sale_offers", "property_offers", "stg_chotot_ads", "stg_abnb_listings", "listings", "areas", "enrichment_proposals", "source_registry"]
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const vn = (s: string) => new Date(`${s}+07:00`).toISOString()

// Thẻ thứ n mang chuỗi nhận diện riêng trong cả bốn cột nội dung.
// [id, item_type, status]
const THE: [number, string, string][] = [
  [1, "entity_match", "pending"],
  [2, "entity_match", "pending"],
  [3, "data_quality", "pending"],
  [4, "entity_match", "approved"],
]
async function napThe(schema: string) {
  for (const [id, type, status] of THE)
    await admin.query(
      `INSERT INTO "${schema}".review_queue (id, item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now() - make_interval(mins => $9))`,
      [id, type, `vt:${id}`, `vt-mat-${id}-title`, JSON.stringify({ note: `vt-mat-${id}-evidence` }), `vt-mat-${id}-ai_suggestion`, `vt-mat-${id}-ai_reasoning`, status, id],
    )
}

// Bài gốc S05 (agent apify-facebook) gộp vào tin; S06 không có bài.
const IN = "2026-10-24T09:00:00"
async function napDongChay(schema: string) {
  for (const [id, n] of [["vb1", 1], ["vb2", 2]] as const)
    await admin.query(
      `INSERT INTO "${schema}".stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, captured_at)
       VALUES ($1,'hanoi__apify-facebook__x','apify-facebook','nhóm vt',$2,$3,$3)`,
      [id, `vt-bai-${n}`, vn(IN)],
    )
  for (const [id, source, posts] of [["vo1", "S05", ["vb1"]], ["vo2", "S05", ["vb2"]], ["vc1", "S06", []]] as const)
    await admin.query(
      `INSERT INTO "${schema}".sale_offers (offer_id, source, kind, property_type, price_vnd, area_m2, first_seen, last_seen, post_ids, confidence, n_reposts)
       VALUES ($1,$2,'rent_lt','apartment',9000000,40,$3,$3,$4,'medium',1)`,
      [id, source, vn(IN), posts],
    )
}

async function dungLuocDo(schema: string, tables: string[]) {
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${schema}"`)
  for (const t of tables) await admin.query(`CREATE TABLE "${schema}".${t} (LIKE public.${t} INCLUDING DEFAULTS)`)
}

before(async () => {
  try {
    await admin.connect()
    await dungLuocDo(S, TABLES)
    await napThe(S)
    await napDongChay(S)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await closeSheets().catch(() => {})
  if (currentRoot) {
    const React = await import("react")
    const r = currentRoot
    await React.act(async () => r.unmount())
  }
  for (const f of CHEP) rmSync(f, { force: true })
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---------- AC-1: luật xem nội dung ----------
describe("VT-AC-1 luật xem nội dung", () => {
  const BANG: [Kieu, boolean][] = [
    ["user", false],
    ["viewer", false],
    ["ops", true],
    ["admin", true],
    ["owner", true],
    ["opsEmail", true],
  ]
  type Luat = { xemNoiDungTin: (u: User | null | undefined) => boolean }
  const doBang = (l: Luat) => {
    for (const [k, mong] of BANG) assert.equal(l.xemNoiDungTin(NGUOI[k]), mong, `dòng '${k}'`)
  }
  test("VT-AC-1 bảng sáu kiểu người", async () => {
    const luat = (await import("../src/lib/ops-access")) as Luat
    doBang(luat)
    assert.equal(luat.xemNoiDungTin(null), false, "khách")
    assert.equal(luat.xemNoiDungTin({ ...NGUOI.viewer, email: "vt-ops@local.test" }), true, "viewer có email OPS_EMAILS tính như ops")
    const sai = await banChepTam<Luat>("src/lib/ops-access.ts", (s) => s.replace(/(xemNoiDungTin[\s\S]*?)BAC_VAI\.ops/, "$1BAC_VAI.viewer"))
    assert.throws(() => doBang(sai), /dòng 'viewer'/, "đối chứng ngưỡng hạ về viewer phải đỏ ở dòng viewer")
  })
})


// ---------- công cụ đo ----------
/** JSON của props mọi phần tử trong cây trả về (bỏ hàm) — thứ sẽ tuần tự hoá xuống thành phần client. */
const jsonCay = (el: unknown) => JSON.stringify(el, (_k, v) => (typeof v === "function" || typeof v === "symbol" ? undefined : v))
type Ghi = { sql: string; rows: Record<string, unknown>[] }
/** Bọc pool.query của app: ghi câu SQL và mọi dòng DB trả về trong lúc chạy fn. */
async function batTruyVan<T>(fn: () => Promise<T>): Promise<{ kq: T; ghi: Ghi[] }> {
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool) as (...a: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  const ghi: Ghi[] = []
  ;(pool as unknown as { query: unknown }).query = async (...a: unknown[]) => {
    const r = await goc(...a)
    ghi.push({ sql: String(typeof a[0] === "string" ? a[0] : (a[0] as { text?: string })?.text), rows: r.rows ?? [] })
    return r
  }
  try {
    return { kq: await fn(), ghi }
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
  }
}
const COT_THE = ["title", "evidence", "ai_suggestion", "ai_reasoning"]
const CHU_THE = "Nội dung thẻ chỉ hiện cho vai Vận hành trở lên."
type ReviewMod = { ReviewContent: (p: { user: User }) => Promise<ReactElement> }

/** Phép đo AC-2 trên một bản ReviewContent: dòng DB trước, rồi props, rồi HTML. Trả HTML. */
async function doReviewViewer(mod: ReviewMod, user: User = NGUOI.viewer): Promise<string> {
  const { kq: el, ghi } = await batTruyVan(() => mod.ReviewContent({ user }))
  for (const g of ghi) {
    for (const r of g.rows) for (const k of COT_THE) assert.ok(!(k in r), `cột '${k}' trả cho viewer (${g.sql.trim().slice(0, 60)})`)
    assert.doesNotMatch(JSON.stringify(g.rows), /vt-mat-/, "dòng DB trả cho viewer mang nội dung thẻ")
  }
  assert.doesNotMatch(jsonCay(el), /vt-mat-/, "props của cây trả về mang nội dung thẻ")
  const html = renderToStaticMarkup(el)
  assert.doesNotMatch(html, /vt-mat-/, "HTML mang nội dung thẻ")
  return html
}

// ---------- AC-2: /ops/review cho viewer ----------
describe("VT-AC-2 viewer: hàng duyệt chỉ số đếm", () => {
  test("VT-AC-2 số thẻ chờ, không nội dung", async () => {
    ready()
    const mod = (await import("../src/components/ops/review-content")) as ReviewMod
    const html = await doReviewViewer(mod)
    assert.match(html, /data-pending-total="3"/, "tổng 3 thẻ chờ (thẻ approved không đếm)")
    assert.match(html, /entity_match: 2/)
    assert.match(html, /data_quality: 1/)
    assert.ok(html.includes(CHU_THE), "câu chú thích")
    // Đối chứng: nhánh viewer bị bỏ — trang đọc đủ cột như vai ops.
    const sai = await banChepTam<ReviewMod>("src/components/ops/review-content.tsx", (s) => s.replace("if (!xemNoiDungTin(user))", "if (false)"))
    await assert.rejects(doReviewViewer(sai), /cột 'title'/, "đối chứng đọc đủ cột phải đỏ ở cột title")
  })
  test("VT-AC-2b hàng rỗng", async () => {
    ready()
    await admin.query(`ALTER TABLE "${S}".review_queue RENAME TO vt_rq_day`)
    try {
      await admin.query(`CREATE TABLE "${S}".review_queue (LIKE public.review_queue INCLUDING DEFAULTS)`)
      const mod = (await import("../src/components/ops/review-content")) as ReviewMod
      const html = await doReviewViewer(mod)
      assert.match(html, /data-pending-total="0"/)
      assert.ok(html.includes(CHU_THE))
    } finally {
      await admin.query(`DROP TABLE IF EXISTS "${S}".review_queue`)
      await admin.query(`ALTER TABLE "${S}".vt_rq_day RENAME TO review_queue`)
    }
  })
})

// ---------- AC-4: /ops/data-flow — dữ liệu trao cho thành phần client đã che ----------
type FlowRecord = import("../src/lib/data-flow-queries").FlowRecord
type DfEl = ReactElement<{ flow: { records: FlowRecord[] }; xemBaiGoc: boolean }>
type DfMod = {
  DataFlowContent: (p: { window: "all"; nowMs: number; getUser: () => Promise<User | null> }) => Promise<DfEl>
}
/** Dựng thân /ops/data-flow như trang làm, với người tiêm qua getUser (DF1: thân trang tự đọc phiên). */
const dungDf = (mod: DfMod, u: User | null) => mod.DataFlowContent({ window: "all", nowMs: Date.now(), getUser: async () => u })
/** Thân trang tự đọc phiên: getUser mặc định là phiên thật và được gọi TRƯỚC khi che. Trả danh sách lỗi (rỗng = đạt). */
function loiDocPhien(content: string, page: string): string[] {
  const loi: string[] = []
  if (!/getUser = getSessionUser\b/.test(content)) loi.push("getUser không mặc định là getSessionUser")
  const goi = content.indexOf("getUser()")
  const che = content.indexOf("xemNoiDungTin(user)")
  if (goi < 0 || che < 0 || goi > che) loi.push("getUser() không được gọi trước xemNoiDungTin(user)")
  if (/DataFlowView/.test(page)) loi.push("page.tsx tự dựng DataFlowView")
  if (!/<DataFlowContent\b/.test(page)) loi.push("page.tsx không dựng DataFlowContent")
  return loi
}
const CHU_BAI = "Bài gốc chỉ hiện cho vai Vận hành trở lên."

describe("VT-AC-4 data-flow: props đã che", () => {
  test("VT-AC-4 bài gốc không xuống trình duyệt", async () => {
    ready()
    const { DataFlowContent } = (await import("../src/components/ops/data-flow/data-flow-content")) as DfMod
    const { DataFlowView } = await import("../src/components/ops/data-flow/data-flow-view")
    for (const [nhan, u] of [["viewer", NGUOI.viewer], ["null", null]] as const) {
      const el = await dungDf({ DataFlowContent }, u)
      assert.equal(el.type, DataFlowView, `${nhan}: phần tử trả về là DataFlowView`)
      assert.ok(el.props.flow.records.length >= 2, `${nhan}: có bản ghi`)
      for (const r of el.props.flow.records) {
        assert.equal(r.postText, null, `${nhan}: postText ${r.offerId}`)
        assert.equal(r.postGroup, null, `${nhan}: postGroup ${r.offerId}`)
      }
      // Tên nhóm vẫn có ở bảng chất lượng theo nhóm (tầng C, AGENTS.md luật 6) — phép đo là chữ bài gốc.
      assert.doesNotMatch(jsonCay(el.props), /vt-bai-/, `${nhan}: props mang bài gốc`)
      assert.equal(el.props.xemBaiGoc, false, `${nhan}: cờ xemBaiGoc`)
    }
    const ops = await dungDf({ DataFlowContent }, NGUOI.ops)
    const bai = ops.props.flow.records.filter((r) => r.source === "S05").map((r) => r.postText).sort()
    assert.deepEqual(bai, ["vt-bai-1", "vt-bai-2"], "ops nhận bài gốc như đã chèn")
    assert.equal(ops.props.xemBaiGoc, true)
    const page = readFileSync(path.join(APP, "src/app/ops/data-flow/page.tsx"), "utf8")
    const content = readFileSync(path.join(APP, "src/components/ops/data-flow/data-flow-content.tsx"), "utf8")
    assert.deepEqual(loiDocPhien(content, page), [], "thân trang tự đọc phiên")
    // Chiều đỏ cùng thước: mặc định không còn là phiên thật → thước gọi tên lỗi.
    const sai = content.replace("getUser = getSessionUser", "getUser = async () => null")
    assert.notEqual(sai, content, "đột biến getUser không đổi gì")
    assert.deepEqual(loiDocPhien(sai, page), ["getUser không mặc định là getSessionUser"])
  })
})

// ---------- AC-5: sheet bản ghi ----------
const rec = (p: Partial<FlowRecord>): FlowRecord => ({
  offerId: "r", source: "S05", kind: "rent_lt", propertyType: "apartment", priceVnd: 9_000_000, areaM2: 40, bedrooms: 1,
  ward: null, market: null, confidence: "medium", nPosts: 1, linked: false, firstSeen: "2026-10-25 09:00:00+00",
  lastSeen: "2026-10-25 09:00:00+00", postText: "vt-bai-x", postGroup: "nhóm vt", ...p,
})
const RECS: FlowRecord[] = [rec({ offerId: "x" }), rec({ offerId: "y", source: "S06", postText: null, postGroup: null, firstSeen: "2026-10-24 09:00:00+00" })]

describe("VT-AC-5 sheet bài gốc", () => {
  test("VT-AC-5 câu chú thích thay bài gốc", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const mo = async (xemBaiGoc: boolean, i: number) => {
      const root = await render(<RecordsGrid records={RECS} roles={{}} xemBaiGoc={xemBaiGoc} />)
      await click([...root.querySelectorAll("tbody tr")][i]?.querySelector("td:nth-child(2)"), `hàng ${i}`)
      const t = dialogs()[0]?.textContent ?? ""
      await closeSheets()
      return t
    }
    let t = await mo(false, 0)
    assert.ok(t.includes(CHU_BAI), "viewer: câu chú thích")
    assert.ok(!t.includes("vt-bai-x"), "viewer: không bài gốc")
    t = await mo(false, 1)
    assert.ok(t.includes(CHU_BAI), "viewer, bản ghi S06: vẫn câu chú thích vai")
    assert.ok(!t.includes("S06 chưa lưu khoá nối ngược tin → bài"), "viewer, S06: không câu S06")
    t = await mo(true, 0)
    assert.ok(t.includes("vt-bai-x"), "ops: bài gốc")
    assert.ok(t.includes("Nhóm nhóm vt"), "ops: tên nhóm")
    assert.ok(!t.includes(CHU_BAI), "ops: không câu chú thích")
  })
})

// ---------- AC-3: ma trận 6 kiểu người × 2 trang ----------
type O = { kieu: Kieu; trang: "review" | "data-flow"; thay: boolean }
const THAY: Record<Kieu, boolean> = { user: false, viewer: false, ops: true, admin: true, owner: true, opsEmail: true }
const MA_TRAN: O[] = [
  { kieu: "user", trang: "review", thay: false },
  { kieu: "viewer", trang: "review", thay: false },
  { kieu: "ops", trang: "review", thay: true },
  { kieu: "admin", trang: "review", thay: true },
  { kieu: "owner", trang: "review", thay: true },
  { kieu: "opsEmail", trang: "review", thay: true },
  { kieu: "user", trang: "data-flow", thay: false },
  { kieu: "viewer", trang: "data-flow", thay: false },
  { kieu: "ops", trang: "data-flow", thay: true },
  { kieu: "admin", trang: "data-flow", thay: true },
  { kieu: "owner", trang: "data-flow", thay: true },
  { kieu: "opsEmail", trang: "data-flow", thay: true },
]

describe("VT-AC-3 ma trận vai", () => {
  test("VT-AC-3 12 ô vai × trang", async () => {
    ready()
    assert.equal(MA_TRAN.length, 12)
    for (const o of MA_TRAN) assert.equal(o.thay, THAY[o.kieu], `bảng viết tay lệch ở ô '${o.kieu}/${o.trang}'`)
    const review = (await import("../src/components/ops/review-content")) as ReviewMod
    const df = (await import("../src/components/ops/data-flow/data-flow-content")) as DfMod
    const doMaTran = async (dfMod: DfMod) => {
      for (const o of MA_TRAN) {
        const u = NGUOI[o.kieu]
        const ten = `ô '${o.kieu}/${o.trang}'`
        if (o.trang === "review") {
          const html = renderToStaticMarkup(await review.ReviewContent({ user: u }))
          assert.equal(html.includes("vt-mat-1-title"), o.thay, `${ten}: tiêu đề thẻ`)
        } else {
          const el = await dungDf(dfMod, u)
          assert.equal(/vt-bai-/.test(jsonCay(el.props)), o.thay, `${ten}: bài gốc trong props`)
          assert.equal(el.props.xemBaiGoc, o.thay, `${ten}: cờ xemBaiGoc`)
        }
      }
    }
    await doMaTran(df)
    // Đối chứng: luật viết sai «chỉ đúng vai ops» lọt admin, owner và người vào bằng OPS_EMAILS.
    const sai = await banChepTam<DfMod>("src/components/ops/data-flow/data-flow-content.tsx", (s) =>
      s.replace("const xem = xemNoiDungTin(user);", 'const xem = user?.role === "ops";'),
    )
    await assert.rejects(doMaTran(sai), /ô '(admin|owner|opsEmail)\/data-flow'/, "đối chứng role === 'ops' phải đỏ ở ô admin/owner/OPS_EMAILS")
  })
})

// ---------- AC-6: máy chủ (cloud) — /ops/review giữ nhánh «bảng tầng A vắng»; /ops/data-flow theo khuôn cloud DF1 ----------
/** Chạy như máy chủ (`VERCEL=1` — getDataFlow nhận nơi chạy theo biến này, DF1), trả biến về như cũ. */
async function asCloud<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.VERCEL
  process.env.VERCEL = "1"
  try {
    return await fn()
  } finally {
    if (prev === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prev
  }
}
const FACTS_RONG = { sources: [], days: [], groups: [], shortStay: { received: 0, stored: 0, withWard: 0, latestAt: null }, mix: { sale: 0, rentLt: 0, shortStay: 0 }, enrichPending: 0 }
describe("VT-AC-6 cloud không đổi", () => {
  test("VT-AC-6 viewer và ops cùng một trang trên máy chủ", async () => {
    ready()
    // Pool của app gắn với lược đồ S lúc import → dựng «như máy chủ» trên chính S: giấu hai bảng tầng A, thêm bản tin.
    await admin.query(`ALTER TABLE "${S}".review_queue RENAME TO vt_rq_tam`)
    await admin.query(`ALTER TABLE "${S}".stg_zalo_posts RENAME TO vt_zp_tam`)
    try {
      await admin.query(`CREATE TABLE "${S}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
      const at = new Date().toISOString()
      await admin.query(`INSERT INTO "${S}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, now())`, [
        JSON.stringify({
          pushedAt: at,
          blocks: {
            reviewQueue: { measured_at: at, byType: [{ type: "entity_match", n: 2 }], total: 2 },
            dataFlow: { measured_at: at, windows: { all: FACTS_RONG } },
          },
        }),
      ])
      const review = (await import("../src/components/ops/review-content")) as ReviewMod
      const { DataFlowContent } = (await import("../src/components/ops/data-flow/data-flow-content")) as DfMod
      const { DataFlowView } = await import("../src/components/ops/data-flow/data-flow-view")
      const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
      const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
      const hv = renderToStaticMarkup(await review.ReviewContent({ user: NGUOI.viewer }))
      const ho = renderToStaticMarkup(await review.ReviewContent({ user: NGUOI.ops }))
      assert.equal(hv, ho, "trên máy chủ HTML của viewer bằng HTML của ops")
      assert.match(hv, /data-pending-total="2"/)
      assert.ok(hv.includes("thẻ đang chờ"))
      assert.ok(hv.includes("Hàng duyệt chỉ có ở máy thu"))
      assert.ok(!hv.includes(CHU_THE), "máy chủ không hiện câu chú thích vai")
      const kiemDfCloud = async (mod: DfMod) => {
        const vai: { flow: string; html: string; sheet: string }[] = []
        for (const u of [NGUOI.viewer, NGUOI.ops]) {
          const el = await asCloud(() => dungDf(mod, u))
          assert.equal(el.type, DataFlowView, `${u.role}: data-flow trên máy chủ vẽ DataFlowView`)
          const flow = el.props.flow as import("../src/lib/data-flow-queries").DataFlow
          assert.equal(flow.mode, "cloud", `${u.role}: khuôn cloud`)
          assert.ok(flow.records.length >= 2, `${u.role}: có bản ghi từ sale_offers`)
          assert.ok(flow.records.every((r) => r.postText === null && r.postGroup === null), `${u.role}: cloud không bài gốc`)
          const cay = <AppRouterContext.Provider value={router as never}>{el}</AppRouterContext.Provider>
          const html = renderToStaticMarkup(cay)
          const root = await render(cay)
          await click(root.querySelector("tbody tr td:nth-child(2)"), `${u.role}: hàng đầu của lưới`)
          const d = dialogs()[0]
          const sheet = d?.textContent ?? ""
          assert.ok(sheet.includes("Bài gốc chỉ xem ở máy thu."), `${u.role}: sheet ghi bài gốc chỉ xem ở máy thu`)
          assert.ok(!sheet.includes(CHU_BAI), `${u.role}: máy chủ không hiện câu chú thích vai`)
          assert.equal(d?.querySelector("blockquote") ?? null, null, `${u.role}: không khối trích bài`)
          await closeSheets()
          vai.push({ flow: JSON.stringify(flow), html, sheet })
        }
        assert.equal(vai[0].flow, vai[1].flow, "dữ liệu tin của viewer bằng của ops")
        assert.equal(vai[0].html, vai[1].html, "HTML data-flow của viewer bằng của ops")
        assert.equal(vai[0].sheet, vai[1].sheet, "sheet của viewer bằng của ops")
      }
      await kiemDfCloud({ DataFlowContent })
      // Chiều đỏ cùng lược đồ: đặt lại cổng cũ «máy chủ → chỉ xem ở máy thu» (DF1 đã bỏ) → thước gọi tên nó.
      const cong = await banChepTam<DfMod>("src/components/ops/data-flow/data-flow-content.tsx", (src) =>
        src.replace(
          "  const [flow, roles, user]",
          '  if (process.env.VERCEL === "1") return <LocalOnlyAlert title="Chỉ xem ở máy thu">Dòng chảy đọc bảng nạp thô.</LocalOnlyAlert>;\n  const [flow, roles, user]',
        ).replace('import { getSourceRoles }', 'import { LocalOnlyAlert } from "@/components/ops/local-only-alert";\nimport { getSourceRoles }'),
      )
      await assert.rejects(kiemDfCloud(cong), /viewer: data-flow trên máy chủ vẽ DataFlowView/, "đối chứng cổng cũ phải đỏ")
    } finally {
      await admin.query(`DROP TABLE IF EXISTS "${S}".ops_heartbeat`)
      await admin.query(`ALTER TABLE "${S}".vt_rq_tam RENAME TO review_queue`)
      await admin.query(`ALTER TABLE "${S}".vt_zp_tam RENAME TO stg_zalo_posts`)
    }
  })
})

// ---------- AC-8: kiểm kê mọi trang và route Ops ----------
type Che = "xemNoiDungTin" | "isAdmin" | "khong-doc"
// Viết tay 27/10 — mỗi trang dưới src/app/ops và mỗi route API của Ops một dòng. doc_noi_dung: đưa nội dung tin (thẻ duyệt,
// bài gốc, ảnh tin, liên hệ) xuống trình duyệt; che: hàm chặn vai ở điểm vào.
const KIEM_KE: Record<string, { doc_noi_dung: boolean; che: Che }> = {
  "src/app/ops/page.tsx": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/ops/ai-calls/page.tsx": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/ops/collections/page.tsx": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/ops/data-flow/page.tsx": { doc_noi_dung: true, che: "xemNoiDungTin" },
  "src/app/ops/deals/page.tsx": { doc_noi_dung: true, che: "isAdmin" },
  "src/app/ops/design/page.tsx": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/ops/quality/page.tsx": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/ops/review/page.tsx": { doc_noi_dung: true, che: "xemNoiDungTin" },
  // /ops/labels (PL7 man-gan-nhan-mu): tin kế mang chữ gốc của tin → chỉ vai đọc được nội dung tin.
  "src/app/ops/labels/page.tsx": { doc_noi_dung: true, che: "xemNoiDungTin" },
  "src/app/ops/sources/page.tsx": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/deals/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/offers/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/audit/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/collections/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/coverage/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/extraction-quality/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/ingest/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  // decide chỉ đọc id, item_type, item_id, status và trả { ok, status } — không nội dung thẻ.
  "src/app/api/v1/ops/review/[id]/decide/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/labels/route.ts": { doc_noi_dung: true, che: "xemNoiDungTin" },
  "src/app/api/v1/ops/source-groups/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/truthful-coverage/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/zalo/accounts/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/zalo/groups/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/v1/ops/zalo/login/route.ts": { doc_noi_dung: false, che: "khong-doc" },
  "src/app/api/zalo-media/route.ts": { doc_noi_dung: true, che: "isAdmin" },
}
/** Cột/trường nội dung tin trong mã: có trong bao đóng import của một điểm vào là điểm vào đó đọc nội dung. */
const TIN_HIEU = /\b(ai_reasoning|ai_suggestion|post_text|postText)\b/
/** Bỏ chú thích trước khi dò tín hiệu (chú thích nhắc tên cột không phải đọc cột). */
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")

function liet(dir: string, ten: string): string[] {
  const out: string[] = []
  const di = (d: string) => {
    if (!existsSync(path.join(APP, d))) return
    for (const f of readdirSync(path.join(APP, d))) {
      const r = `${d}/${f}`
      if (statSync(path.join(APP, r)).isDirectory()) di(r)
      else if (f === ten) out.push(r)
    }
  }
  di(dir)
  return out
}
const diemVao = () =>
  [
    ...liet("src/app/ops", "page.tsx"),
    ...["src/app/api/v1/ops", "src/app/api/zalo-media", "src/app/api/v1/deals", "src/app/api/v1/offers"].flatMap((d) => liet(d, "route.ts")),
  ].sort()

/** Bao đóng import (tĩnh + import() động) trong src/, giải "@/…" và đường tương đối. `ao` = tệp ảo (không ghi đĩa). */
function baoDong(vao: string, ao: Record<string, string> = {}): Map<string, string> {
  const doc = (r: string) => ao[r] ?? readFileSync(path.join(APP, r), "utf8")
  const giai = (tu: string, spec: string): string | null => {
    const goc = spec.startsWith("@/") ? `src/${spec.slice(2)}` : spec.startsWith(".") ? path.posix.join(path.posix.dirname(tu), spec) : null
    if (!goc) return null
    for (const c of [goc, `${goc}.ts`, `${goc}.tsx`, `${goc}/index.ts`, `${goc}/index.tsx`])
      if (c in ao || (existsSync(path.join(APP, c)) && statSync(path.join(APP, c)).isFile())) return c
    return null
  }
  const seen = new Map<string, string>()
  const hang = [vao]
  while (hang.length) {
    const f = hang.pop()!
    if (seen.has(f)) continue
    const src = doc(f)
    seen.set(f, src)
    for (const m of src.matchAll(/(?:from\s+|import\(\s*)["']([^"']+)["']/g)) {
      const r = giai(f, m[1])
      if (r && !seen.has(r)) hang.push(r)
    }
  }
  return seen
}

function doKiemKe(ke: typeof KIEM_KE, ao: Record<string, string> = {}) {
  const dia = [...new Set([...diemVao(), ...Object.keys(ao)])].sort()
  const chuaKhai = dia.filter((r) => !(r in ke))
  assert.deepEqual(chuaKhai, [], `route chưa khai trong bảng kiểm kê: ${chuaKhai.join(", ")}`)
  const thua = Object.keys(ke).filter((r) => !dia.includes(r))
  assert.deepEqual(thua, [], `bảng kiểm kê khai route không có trên đĩa: ${thua.join(", ")}`)
  let tep = 0
  for (const [r, { doc_noi_dung, che }] of Object.entries(ke)) {
    const bd = baoDong(r, ao)
    tep += bd.size
    if (doc_noi_dung) {
      // Tệp định nghĩa (ops-access.ts) không tính — phải có một chỗ GỌI hàm che trong bao đóng.
      const co = [...bd].some(([f, src]) => f !== "src/lib/ops-access.ts" && boChuThich(src).includes(`${che}(`))
      assert.ok(co, `${r}: khai che bằng ${che} mà bao đóng import không gọi ${che}(`)
    } else {
      const trung = [...bd].filter(([, src]) => TIN_HIEU.test(boChuThich(src))).map(([f]) => f)
      assert.deepEqual(trung, [], `${r}: khai không đọc nội dung mà bao đóng có ${trung.join(", ")}`)
    }
  }
  return { khoa: dia.length, tep }
}

describe("VT-AC-8 kiểm kê route", () => {
  test("VT-AC-8 bảng kiểm kê khớp đĩa và hàm che", (t) => {
    const { khoa, tep } = doKiemKe(KIEM_KE)
    t.diagnostic(`kiểm kê: ${khoa} điểm vào, ${tep} tệp trong các bao đóng`)
    assert.equal(khoa, 25) // +1: /ops/ai-calls (PL29 so-cuoc-goi-ai, 29/10) — chỉ số, không đọc nội dung tin; +2: /ops/labels và route nhãn (PL7, 30/10) — đọc chữ gốc tin, chặn xemNoiDungTin
    // Đối chứng: một trang Ops mới đọc thẻ duyệt mà chưa khai → ca nêu tên route.
    const gia = { "src/app/ops/vt-gia/page.tsx": 'const q = "SELECT title FROM review_queue"\nexport default function P() { return q }\n' }
    assert.throws(() => doKiemKe(KIEM_KE, gia), /src\/app\/ops\/vt-gia\/page\.tsx/, "đối chứng route giả phải đỏ và nêu tên")
    // Đối chứng: khai /ops/data-flow là không đọc nội dung → bao đóng có bài gốc, ca nêu tên.
    const khaiSai = { ...KIEM_KE, "src/app/ops/data-flow/page.tsx": { doc_noi_dung: false, che: "khong-doc" as const } }
    assert.throws(() => doKiemKe(khaiSai), /src\/app\/ops\/data-flow\/page\.tsx: khai không đọc nội dung/)
  })
})
