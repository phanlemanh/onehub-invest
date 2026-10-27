// viewer-the-duyet.test.tsx — hồ sơ _acceptance/viewer-khong-thay-the-duyet: vai viewer vào được Ops nhưng không nhận nội
// dung thẻ duyệt hay bài gốc (AGENTS.md luật 6: nội dung tin cho vai ops trở lên). Tên ca mở đầu bằng mã AC (VT-AC-n).
// Ca DB dựng lược đồ tạm `vt_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt. Mỗi phép đo có chiều đỏ: một
// bản chép tạm của tệp nguồn (tests/.vt-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
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
type DfMod = { DataFlowContent: (p: { window: "all"; user: User | null }) => Promise<DfEl> }
const CHU_BAI = "Bài gốc chỉ hiện cho vai Vận hành trở lên."

describe("VT-AC-4 data-flow: props đã che", () => {
  test("VT-AC-4 bài gốc không xuống trình duyệt", async () => {
    ready()
    const { DataFlowContent } = (await import("../src/components/ops/data-flow/data-flow-content")) as DfMod
    const { DataFlowView } = await import("../src/components/ops/data-flow/data-flow-view")
    for (const [nhan, u] of [["viewer", NGUOI.viewer], ["null", null]] as const) {
      const el = await DataFlowContent({ window: "all", user: u })
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
    const ops = await DataFlowContent({ window: "all", user: NGUOI.ops })
    const bai = ops.props.flow.records.filter((r) => r.source === "S05").map((r) => r.postText).sort()
    assert.deepEqual(bai, ["vt-bai-1", "vt-bai-2"], "ops nhận bài gốc như đã chèn")
    assert.equal(ops.props.xemBaiGoc, true)
    const page = readFileSync(path.join(APP, "src/app/ops/data-flow/page.tsx"), "utf8")
    assert.doesNotMatch(page, /DataFlowView/, "page.tsx không tự dựng DataFlowView")
    assert.match(page, /<DataFlowContent[^>]*user=/, "page.tsx trao user cho DataFlowContent")
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
          const el = await dfMod.DataFlowContent({ window: "all", user: u })
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

// ---------- AC-6: máy chủ (cloud) — nhánh «bảng tầng A vắng» chạy trước nhánh vai ----------
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
        JSON.stringify({ pushedAt: at, blocks: { reviewQueue: { measured_at: at, byType: [{ type: "entity_match", n: 2 }], total: 2 } } }),
      ])
      const review = (await import("../src/components/ops/review-content")) as ReviewMod
      const { DataFlowContent } = (await import("../src/components/ops/data-flow/data-flow-content")) as DfMod
      const { LocalOnlyAlert } = await import("../src/components/ops/local-only-alert")
      const hv = renderToStaticMarkup(await review.ReviewContent({ user: NGUOI.viewer }))
      const ho = renderToStaticMarkup(await review.ReviewContent({ user: NGUOI.ops }))
      assert.equal(hv, ho, "trên máy chủ HTML của viewer bằng HTML của ops")
      assert.match(hv, /data-pending-total="2"/)
      assert.ok(hv.includes("thẻ đang chờ"))
      assert.ok(hv.includes("Hàng duyệt chỉ có ở máy thu"))
      assert.ok(!hv.includes(CHU_THE), "máy chủ không hiện câu chú thích vai")
      for (const u of [NGUOI.viewer, NGUOI.ops]) {
        const el = (await DataFlowContent({ window: "all", user: u })) as unknown as ReactElement<{ title: string }>
        assert.equal(el.type, LocalOnlyAlert, `${u.role}: data-flow dừng ở LocalOnlyAlert`)
        assert.equal(el.props.title, "Chỉ xem ở máy thu")
      }
    } finally {
      await admin.query(`DROP TABLE IF EXISTS "${S}".ops_heartbeat`)
      await admin.query(`ALTER TABLE "${S}".vt_rq_tam RENAME TO review_queue`)
      await admin.query(`ALTER TABLE "${S}".vt_zp_tam RENAME TO stg_zalo_posts`)
    }
  })
})
