// cong-tac-nhom-go.test.tsx — hồ sơ _acceptance/cong-tac-khong-ha-nhom-go, ca «CT-AC-n». Một lược đồ tạm ở khuôn sau
// 047 + 048 (pool của app gắn search_path lúc import), mỗi ô ma trận dựng lại dòng nhóm từ đầu; gọi POST thật của route
// route nhóm thu bằng Bearer. Đối chứng chạy bản chép route trên origin/main (trước sửa). public không được chạm.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { DAU_SN, dungSauGop } from "../../pipeline/scripts/so-nhom-fixture.mjs"
import { chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
const ROUTE_DIR = join(APP, "src/app/api/v1/ops/source-groups")
const S = `ct_${process.pid}`
const S_CU = `ct_cu_${process.pid}`
const TOKEN = "ct-thu-token"
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = TOKEN

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/ops/sources" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  NodeFilter: dom.window.NodeFilter,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
Object.defineProperty(dom.window, "matchMedia", {
  value: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
const scCu = new pg.Client({ connectionString: schemaUrl(S_CU) })
let publicTruoc: unknown
const KHOA = `${DAU_SN}-ct`

before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  for (const s of [S, S_CU]) {
    await dungSauGop(admin, s)
    for (const t of ["ops_audit", "stg_zalo_posts"]) await admin.query(`CREATE TABLE "${s}".${t} (LIKE public.${t} INCLUDING ALL)`)
  }
  await sc.connect()
  await scCu.connect()
})
after(async () => {
  await sc.end().catch(() => {})
  await scCu.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200)) // auditOpsWrite ghi nền
  await pool.end().catch(() => {})
  for (const s of [S, S_CU]) await xoaLuocDo(admin, s).catch(() => {})
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm")
})

type Trang = "active" | "paused" | "draft" | "retired" | "completed"
type Route = { POST: (req: Request) => Promise<Response> }

/** Dựng lại đúng một nhóm S05 ở trạng thái `st` (paused có lý do 'x', resume_when 'y'); xoá nhật ký. */
async function dungNhom(c: pg.Client, st: Trang) {
  await c.query("TRUNCATE collection_units, ops_audit")
  await c.query(
    `INSERT INTO collection_units (source_code, group_key, name, status, reason, resume_when) VALUES ('S05', $1, 'nhóm', $2, $3, $4)`,
    [KHOA, st, st === "paused" ? "x" : null, st === "paused" ? "y" : null],
  )
}
const nhom = async (c: pg.Client = sc) =>
  (await c.query(`SELECT status, reason, resume_when, enabled, updated_at::text FROM collection_units WHERE group_key = $1`, [KHOA])).rows[0]
const nAudit = async () =>
  (await sc.query(`SELECT count(*)::int AS n FROM ops_audit WHERE action = 'source-group:toggle'`)).rows[0].n as number

async function goi(route: Route, enabled: boolean) {
  const res = await route.POST(
    new Request("http://localhost/api/v1/ops/source-groups", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ action: "toggle", sourceCode: "S05", groupKey: KHOA, enabled }),
    }),
  )
  await new Promise((r) => setTimeout(r, 120)) // auditOpsWrite ghi nền sau khi trả
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}
const routeMoi = () => import("../src/app/api/v1/ops/source-groups/route") as Promise<Route>

/** Bản chép route trên origin/main (trước sửa) — đối chứng; xoá trong finally của bên gọi. */
function chepRouteCu(): { path: string; done: () => void } {
  const p = join(ROUTE_DIR, `.route-cu-${process.pid}.ts`)
  writeFileSync(p, execFileSync("git", ["show", "origin/main:app/src/app/api/v1/ops/source-groups/route.ts"], { cwd: APP, encoding: "utf8" }))
  return { path: p, done: () => rmSync(p, { force: true }) }
}

// ---- ma trận viết trước: [trạng thái cũ, bật?, http, trạng thái sau, đổi?] — design doc §Quyết định ----
const LY_DO = "tắt bằng công tắc /ops/sources"
const CHU: Record<string, string> = {
  "retired+bat": "nhóm đã gỡ — không bật lại",
  "retired+tat": "nhóm đã gỡ — công tắc không đổi trạng thái",
  "completed+bat": "nhóm đã xong — không bật lại",
  "completed+tat": "nhóm đã xong — công tắc không đổi trạng thái",
}
const BANG: [Trang, boolean, number, Trang, boolean][] = [
  ["active", false, 200, "paused", true],
  ["active", true, 200, "active", false],
  ["paused", true, 200, "active", true],
  ["paused", false, 200, "paused", false],
  ["draft", true, 200, "active", true],
  ["draft", false, 200, "draft", false],
  ["retired", true, 409, "retired", false],
  ["retired", false, 409, "retired", false],
  ["completed", true, 409, "completed", false],
  ["completed", false, 409, "completed", false],
]

async function chayO(route: Route, [cu, bat, http, sau, doi]: (typeof BANG)[number]) {
  await dungNhom(sc, cu)
  const truoc = await nhom()
  const r = await goi(route, bat)
  const ten = `${cu}+${bat ? "bat" : "tat"}`
  assert.equal(r.status, http, `${ten}: http`)
  const d = await nhom()
  assert.equal(d.status, sau, `${ten}: trạng thái sau`)
  if (!doi) {
    assert.deepEqual(d, truoc, `${ten}: dòng phải giữ nguyên (kể cả updated_at)`)
    assert.equal(await nAudit(), 0, `${ten}: không được ghi nhật ký`)
    if (http === 200) assert.deepEqual(r.body, { ok: true, unchanged: true }, `${ten}: thân unchanged`)
  } else {
    assert.equal(await nAudit(), 1, `${ten}: một dòng nhật ký`)
    assert.equal(d.enabled, sau === "active", `${ten}: enabled khớp`)
    if (sau === "paused") assert.deepEqual([d.reason, d.resume_when], [LY_DO, null], `${ten}: lý do mặc định`)
    if (sau === "active") assert.deepEqual([d.reason, d.resume_when], [null, null], `${ten}: xoá lý do`)
  }
  return { r, ten }
}

test("CT-AC-1 ma trận 10 ô của công tắc theo design (5 trạng thái × bật/tắt); đối chứng route cũ đỏ ở retired+tắt", async () => {
  assert.equal(BANG.length, 10)
  const route = await routeMoi()
  for (const o of BANG) await chayO(route, o)
  // Ngoài bảng: nhóm không có → { ok: false } như trước.
  await sc.query("TRUNCATE collection_units, ops_audit")
  assert.deepEqual(await goi(route, false), { status: 200, body: { ok: false } })

  // Đối chứng: route trên origin/main (trước sửa) phải đỏ ở ô retired+tắt.
  const cu = chepRouteCu()
  try {
    const routeCu = (await import(cu.path)) as Route
    await assert.rejects(chayO(routeCu, ["retired", false, 409, "retired", false]), /retired\+tat/)
  } finally {
    cu.done()
  }
})

test("CT-AC-2 tắt rồi bật, và tắt + bật đồng thời, không hồi sinh nhóm đã gỡ / đã xong; đối chứng route cũ hồi sinh", async () => {
  const route = await routeMoi()
  for (const st of ["retired", "completed"] as const) {
    await dungNhom(sc, st)
    const truoc = await nhom()
    assert.equal((await goi(route, false)).status, 409)
    assert.equal((await goi(route, true)).status, 409)
    assert.deepEqual(await nhom(), truoc, `${st}: nối tiếp phải giữ nguyên`)
    // Đồng thời: hai lệnh trên hai kết nối của pool (khoá dòng FOR UPDATE xếp hàng chúng).
    const rs = await Promise.all([goi(route, false), goi(route, true)])
    assert.deepEqual(rs.map((r) => r.status), [409, 409])
    const d = await nhom()
    assert.deepEqual([d.status, d.enabled], [st, false], `${st}: đồng thời phải giữ nguyên`)
    assert.equal(await nAudit(), 0, `${st}: không nhật ký`)
  }
  // Đối chứng (chỉ nhánh nối tiếp — thứ tự tất định): route cũ cho tắt rồi bật hồi sinh nhóm đã gỡ.
  const cu = chepRouteCu()
  try {
    const routeCu = (await import(cu.path)) as Route
    await dungNhom(sc, "retired")
    await goi(routeCu, false)
    await goi(routeCu, true)
    assert.equal((await nhom()).status, "active", "đối chứng: route cũ phải hồi sinh nhóm đã gỡ — nếu không, phép đo không phân biệt")
  } finally {
    cu.done()
  }
})

test("CT-AC-3 chữ 409 nêu đúng trạng thái: đã gỡ / đã xong × bật / tắt", async () => {
  const route = await routeMoi()
  for (const [khoa, chu] of Object.entries(CHU)) {
    const [st, hd] = khoa.split("+") as [Trang, string]
    await dungNhom(sc, st)
    assert.deepEqual(await goi(route, hd === "bat"), { status: 409, body: { error: chu } }, khoa)
  }
})

test("CT-AC-4 đường ghi cũ (UPDATE enabled) và công tắc cho cùng trạng thái cuối; hai ô tắt retired/completed: đường cũ im, công tắc 409", async () => {
  const route = await routeMoi()
  for (const [cu, bat, http, sau] of BANG) {
    await dungNhom(sc, cu)
    await dungNhom(scCu, cu)
    const ten = `${cu}+${bat ? "bat" : "tat"}`
    let loiCu: string | null = null
    try {
      await scCu.query(`UPDATE collection_units SET enabled = $1 WHERE group_key = $2`, [bat, KHOA]) // đường cũ: view tên cũ ghi xuyên vào bảng này
    } catch (e) {
      loiCu = (e as Error).message
    }
    const r = await goi(route, bat)
    assert.equal((await nhom(scCu)).status, (await nhom()).status, `${ten}: trạng thái cuối lệch giữa hai đường`)
    assert.equal((await nhom()).status, sau, ten)
    const batGo = bat && (cu === "retired" || cu === "completed")
    assert.equal(loiCu !== null, batGo, `${ten}: đường cũ ${batGo ? "phải" : "không được"} ném lỗi (${loiCu})`)
    if (batGo) assert.match(loiCu!, /không bật được đơn vị/)
    if (!bat && (cu === "retired" || cu === "completed")) assert.equal(r.status, 409, `${ten}: công tắc phải 409 (Hỏi-1)`)
    assert.equal(r.status, http, ten)
  }
})

// ---- AC-5: lưới nhóm thu hoàn công tắc và hiện chữ lỗi ----
async function veLuoi(phanHoi: { status: number; body: unknown }) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { act } = React
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const { Toaster } = await import("../src/components/ui/sonner") // cùng đường nạp với component (tránh hai bản sonner)
  const { SourceGroups } = await import("../src/components/ops/sources/source-groups")
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(phanHoi.body), { status: phanHoi.status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  const row = { id: 1, source_code: "S05", group_key: KHOA, name: "nhóm thử", enabled: true, note: null, fb_posts: 0, mode: null, burst_until: null, mode_since: null }
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <SourceGroups initial={[row]} homNay="2026-10-26" />
        <Toaster />
      </AppRouterContext.Provider>,
    )
  })
  const sw = () => document.querySelector('[aria-label="Bật/tắt thu nhóm"]') as HTMLElement | null
  assert.ok(sw(), "không thấy công tắc")
  await act(async () => {
    sw()!.click()
  })
  await act(async () => {
    await new Promise((r) => setTimeout(r, 300))
  })
  const ket = { checked: sw()!.getAttribute("aria-checked"), text: document.body.textContent ?? "" }
  await act(async () => root.unmount())
  return ket
}

test("CT-AC-5 route trả 409 → lưới hoàn công tắc về như trước và hiện chữ lỗi máy chủ; đối chứng 200 → công tắc tắt", async () => {
  const chu = CHU["retired+tat"]
  const loi = await veLuoi({ status: 409, body: { error: chu } })
  assert.equal(loi.checked, "true", "công tắc phải về giá trị trước khi bấm")
  assert.ok(loi.text.includes(chu), `chữ lỗi máy chủ phải hiện: ${loi.text.slice(0, 300)}`)
  const ok = await veLuoi({ status: 200, body: { ok: true } })
  assert.equal(ok.checked, "false", "đối chứng: phản hồi 200 thì công tắc ở trạng thái tắt")
})
