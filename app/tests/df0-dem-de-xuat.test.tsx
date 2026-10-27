// df0-dem-de-xuat.test.tsx — hồ sơ _acceptance/df0-dem-de-xuat-lam-giau: đầu trang /ops/data-flow đếm «đề xuất làm giàu»
// theo trạng thái chờ thật (queued). Tên ca mở đầu bằng mã AC (DD-AC-n). Lược đồ tạm `dem_<pid>` (enrichment_proposals +
// review_queue LIKE public kèm CHECK), xoá cuối lượt. Trạng thái/tuyến rút từ ràng buộc CHECK của bảng thật (bên ghi),
// bảng phân loại ghim trước. Mỗi phép đo có chiều đỏ trên CÙNG fixture, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S = `dem_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

// ---------- jsdom (cùng khuôn ops-dong-chay.test.tsx) ----------
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

// ---------- bảng phân loại ghim trước: trạng thái nào là «đang chờ» ----------
const PHAN_LOAI: Record<string, boolean> = { queued: true, applied: false, rejected: false, superseded: false, skipped: false, reverted: false }
const NOW = Date.parse("2026-10-26T05:00:00Z")

const admin = new pg.Client({ connectionString: localDbUrl() })
const inSchema = new pg.Client({ connectionString: schemaUrl(S) })
let setupErr: string | null = null
let STATUSES: string[] = []
let ROUTES: string[] = []
let REVIEW_STATUSES: string[] = []

/** Giá trị của một ràng buộc CHECK `col = ANY (ARRAY['a'::text, …])` trên bảng public (bên ghi thật). */
async function checkValues(table: string, conname: string): Promise<string[]> {
  const { rows } = await admin.query(
    `SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conrelid = $1::regclass AND conname = $2`,
    [`public.${table}`, conname],
  )
  assert.equal(rows.length, 1, `thiếu ràng buộc ${conname} trên public.${table}`)
  return [...String(rows[0].d).matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1])
}

/** Dựng lại lược đồ tạm: đề xuất theo bảng {trạng thái → số dòng mỗi tuyến}, thẻ duyệt theo {trạng thái → số dòng}. */
async function makeSchema(perRoute: Record<string, number>, review: Record<string, number>) {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  for (const t of ["enrichment_proposals", "review_queue"])
    await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING DEFAULTS INCLUDING CONSTRAINTS)`)
  let id = 0
  for (const [status, n] of Object.entries(perRoute))
    for (const route of ROUTES)
      for (let i = 0; i < n; i++) {
        id++
        await admin.query(
          `INSERT INTO "${S}".enrichment_proposals (id, run_id, offer_id, field, value, value_key, source, route, status)
           VALUES ($1, 'r', $2, 'bedrooms', '2', '2', 'e1_rule', $3, $4)`,
          [id, `o${id}`, route, status],
        )
      }
  for (const [status, n] of Object.entries(review))
    for (let i = 0; i < n; i++) {
      id++
      await admin.query(`INSERT INTO "${S}".review_queue (id, item_type, item_id, title, status) VALUES ($1, 'agent_output', $2, 'thẻ thử', $3)`, [
        id,
        `i${id}`,
        status,
      ])
    }
}

type Rewrite = (sql: string) => string
/** Hàm query tiêm cho getDataFlow: câu chạm hai bảng của hồ sơ chạy trên lược đồ tạm, câu khác trả rỗng. */
const viaSchema = (rewrite: Rewrite = (s) => s, seen?: string[]) => async (text: string, values?: unknown[]) => {
  if (!/enrichment_proposals|review_queue/.test(text)) return { rows: [] }
  const sql = rewrite(text)
  seen?.push(sql)
  return inSchema.query(sql, values)
}
const flowWith = async (rewrite?: Rewrite, seen?: string[]) =>
  (await import("../src/lib/data-flow-queries")).getDataFlow("all", { now: NOW, query: viaSchema(rewrite, seen) })

// Bảng đầy đủ của AC-1: mỗi trạng thái một luỹ thừa 2 riêng mỗi tuyến → mọi tập con trạng thái cho tổng khác nhau.
const FULL_W: Record<string, number> = { applied: 1, rejected: 2, superseded: 4, skipped: 8, reverted: 16, queued: 32 }

before(async () => {
  try {
    await admin.connect()
    await inSchema.connect()
    STATUSES = await checkValues("enrichment_proposals", "enrichment_proposals_status_check")
    ROUTES = await checkValues("enrichment_proposals", "enrichment_proposals_route_check")
    REVIEW_STATUSES = await checkValues("review_queue", "review_queue_status_check")
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await inSchema.end().catch(() => {})
  await admin.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `không dựng được lược đồ tạm (cần DB local :5433): ${setupErr}`)
const reviewOf = (pending: number) => Object.fromEntries(REVIEW_STATUSES.map((s) => [s, s === "pending" ? pending : 1]))

describe("DD-AC-1 đếm queued", () => {
  test("DD-AC-1 đếm queued — mọi cặp trạng thái × tuyến, tập trạng thái khớp bảng phân loại ghim", async () => {
    ready()
    console.log(`# DD-AC-1 trạng thái (CHECK): ${STATUSES.join(", ")} · tuyến (CHECK): ${ROUTES.join(", ")}`)
    assert.deepEqual([...STATUSES].sort(), Object.keys(PHAN_LOAI).sort(), "trạng thái mới chưa phân loại: tập trạng thái của CHECK lệch bảng phân loại ghim")
    assert.equal(STATUSES.length, 6)
    assert.ok(ROUTES.length >= 3 && ROUTES.includes("review"), `tuyến rút từ CHECK: ${ROUTES.join(", ")}`)
    await makeSchema(FULL_W, reviewOf(2))
    const queued = STATUSES.filter((s) => PHAN_LOAI[s]).reduce((a, s) => a + FULL_W[s] * ROUTES.length, 0)
    const total = Object.values(FULL_W).reduce((a, w) => a + w * ROUTES.length, 0)
    console.log(`# DD-AC-1 bảng: ${STATUSES.map((s) => `${s}=${FULL_W[s] * ROUTES.length}`).join(" · ")} · queued ${queued} · tổng ${total}`)
    const flow = await flowWith()
    assert.equal(flow.enrichPending, queued, `enrichPending ${flow.enrichPending} ≠ tổng queued ${queued}`)
    assert.notEqual(flow.enrichPending, 0)
    assert.notEqual(flow.enrichPending, total)
    // Chiều đỏ cùng fixture: lọc thêm bỏ tuyến review (lối khác của Hỏi-1) ra số khác.
    const route = await flowWith((s) => s.replace("status = 'queued'", "status = 'queued' AND route <> 'review'"))
    console.log(`# DD-AC-1 chiều đỏ bỏ tuyến review: ${route.enrichPending}`)
    assert.notEqual(route.enrichPending, flow.enrichPending, "đột biến bỏ tuyến review phải ra số khác")
  })
})

describe("DD-AC-2 đột biến pending", () => {
  test("DD-AC-2 đột biến pending — câu cũ lọc pending đếm 0", async () => {
    ready()
    await makeSchema(FULL_W, reviewOf(2))
    const { ENRICH_PENDING_SQL } = await import("../src/lib/data-flow-queries")
    const cu = (s: string) => s.replace("status = 'queued'", "status = 'pending'")
    assert.notEqual(cu(ENRICH_PENDING_SQL), ENRICH_PENDING_SQL, "đối chứng: chuỗi đột biến phải khác câu gốc")
    const goc = (await flowWith()).enrichPending
    const sai = (await flowWith(cu)).enrichPending
    console.log(`# DD-AC-2 gốc ${goc} · câu cũ ${sai}`)
    assert.equal(sai, 0, "câu cũ lọc pending đếm 0")
    assert.notEqual(sai, goc, "câu cũ lọc pending đếm 0 — phép đo phải phân biệt được bản cũ")
  })
})

describe("DD-AC-3 không có queued", () => {
  test("DD-AC-3 không có queued — chỉ trạng thái đã xử lý ra 0; thêm một queued ra 1", async () => {
    ready()
    const done = Object.fromEntries(STATUSES.filter((s) => !PHAN_LOAI[s]).map((s) => [s, 1]))
    assert.equal(Object.keys(done).length, 5)
    await makeSchema(done, reviewOf(2))
    const zero = (await flowWith()).enrichPending
    await admin.query(
      `INSERT INTO "${S}".enrichment_proposals (id, run_id, offer_id, field, value, value_key, source, route, status)
       VALUES (9999, 'r', 'oq', 'bedrooms', '2', '2', 'e1_rule', 'direct', 'queued')`,
    )
    const one = (await flowWith()).enrichPending
    console.log(`# DD-AC-3 chỉ đã xử lý ${zero} · thêm một queued ${one}`)
    assert.equal(zero, 0)
    assert.equal(one, 1, "đối chứng dương: một đề xuất queued phải được đếm")
  })
})

describe("DD-AC-4 đầu trang", () => {
  test("DD-AC-4 đầu trang — DataFlowView ghi «N đề xuất làm giàu»", async () => {
    ready()
    await makeSchema(FULL_W, reviewOf(2))
    const flow = await flowWith()
    const React = await import("react")
    Object.assign(globalThis, { React })
    const { createRoot } = await import("react-dom/client")
    const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
    const { DataFlowView } = await import("../src/components/ops/data-flow/data-flow-view")
    const { fmtInt } = await import("../src/lib/format")
    const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
    const draw = async (f: typeof flow) => {
      document.body.innerHTML = "<div id=root></div>"
      const root = createRoot(document.getElementById("root")!)
      await React.act(async () =>
        root.render(
          <AppRouterContext.Provider value={router as never}>
            <DataFlowView flow={f} roles={{}} nowMs={NOW} xemBaiGoc />
          </AppRouterContext.Provider>,
        ),
      )
      const text = document.body.textContent ?? ""
      await React.act(async () => root.unmount())
      return text
    }
    const want = `${fmtInt(flow.enrichPending)} đề xuất làm giàu`
    const text = await draw(flow)
    console.log(`# DD-AC-4 đầu trang có «${want}»: ${text.includes(want)}`)
    assert.ok(text.includes(want), `đầu trang thiếu «${want}»`)
    // Chiều đỏ cùng ca: flow đột biến enrichPending = 0.
    const sai = await draw({ ...flow, enrichPending: 0 })
    assert.ok(!sai.includes(want), "flow đột biến 0 mà đầu trang vẫn ghi số cũ")
    assert.ok(sai.includes("0 đề xuất làm giàu"), "flow đột biến 0 phải ghi «0 đề xuất làm giàu»")
  })
})

describe("DD-AC-5 thẻ chờ duyệt giữ nguyên", () => {
  test("DD-AC-5 thẻ chờ duyệt giữ nguyên — câu review_queue lọc pending", async () => {
    ready()
    console.log(`# DD-AC-5 trạng thái thẻ (CHECK): ${REVIEW_STATUSES.join(", ")}`)
    assert.ok(REVIEW_STATUSES.includes("pending") && REVIEW_STATUSES.length >= 2)
    await makeSchema(FULL_W, reviewOf(2))
    const seen: string[] = []
    const flow = await flowWith(undefined, seen)
    assert.ok(seen.some((s) => /FROM review_queue WHERE status = 'pending'/.test(s)), "câu đếm review_queue phải giữ status = 'pending'")
    assert.equal(flow.reviewPending, 2)
    const sai = await flowWith((s) => s.replace("FROM review_queue WHERE status = 'pending'", "FROM review_queue WHERE status = 'approved'"))
    console.log(`# DD-AC-5 thẻ chờ ${flow.reviewPending} · đột biến approved ${sai.reviewPending}`)
    assert.equal(sai.reviewPending, 1)
    assert.notEqual(sai.reviewPending, flow.reviewPending, "đột biến câu đếm thẻ phải ra số khác")
  })
})
