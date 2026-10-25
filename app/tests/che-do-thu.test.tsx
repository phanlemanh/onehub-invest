// che-do-thu.test.tsx — hồ sơ _acceptance/che-do-thu-tren-ops (C7 vết dầu loang), ca «CD-AC-n».
// Lược đồ tạm trên DB local: source_groups + ops_audit chép khuôn LIKE từ public, dòng viết trước id tường minh. Gọi
// datCheDo (app/src/lib/che-do-thu.ts) với người giả, haBungHetHan/haVeDuyTri (pipeline/ha-bung-het-han.mjs) thật, POST thật
// của route source-groups bằng Bearer, và vẽ SourceGroups trong jsdom. Tiến trình chạy TZ=UTC; now cố định 23:30Z ngày H−1
// (06:30 ngày H giờ VN) — ngày UTC và ngày VN của now khác nhau, nên bản tính ngày theo UTC đỏ.
process.env.TZ = "UTC"

import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = join(APP, "..")
const S = `cd_che_do_${process.pid}`
const TOKEN = "cd-thu"
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
  // nút Lưu là submit: React dựng FormData từ form jsdom — FormData của Node không nhận phần tử jsdom.
  FormData: dom.window.FormData,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

// ---- mốc thời gian viết trước ----
const NOW = new Date("2026-10-25T23:30:00Z")
const H = "2026-10-26" // hôm nay giờ VN của NOW
const H_1 = "2026-10-25" // H−1 = ngày UTC của NOW
const ngay = (n: number) => new Date(Date.UTC(2026, 9, 26 + n)).toISOString().slice(0, 10)
const ADMIN = { id: "42", email: "admin@local.test", plan: "free" as const, role: "admin" as const }
const OPS = { id: "43", email: "ops@local.test", plan: "free" as const, role: "ops" as const }
const asAdmin = async () => ADMIN

type Row = { id: number; source_code: string; group_key: string; name: string; enabled?: boolean; params: Record<string, unknown> }
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  for (const t of ["source_groups", "ops_audit"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
  await sc.connect()
})
after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200)) // auditOpsWrite của action cũ ghi nền — chờ xong rồi mới đóng pool
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

async function seed(rows: Row[]) {
  await sc.query("TRUNCATE source_groups, ops_audit")
  for (const r of rows) {
    await sc.query(
      `INSERT INTO source_groups (id, source_code, group_key, name, enabled, params) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [r.id, r.source_code, r.group_key, r.name, r.enabled ?? true, JSON.stringify(r.params)],
    )
  }
}
const params = async (id: number) => (await sc.query("SELECT params FROM source_groups WHERE id = $1", [id])).rows[0]?.params
const allParams = async () => (await sc.query("SELECT id, params FROM source_groups ORDER BY id")).rows
const audits = async () => (await sc.query("SELECT actor, action, detail FROM ops_audit ORDER BY id")).rows
const nAudit = async () => (await sc.query("SELECT count(*)::int n FROM ops_audit")).rows[0].n as number

const lib = () => import("../src/lib/che-do-thu")
const may = () => import("../../pipeline/ha-bung-het-han.mjs")

const S06_HCM: Row = { id: 7, source_code: "S06", group_key: "khoa-cd-hcm", name: "Tên CD HCM", params: { region_v2: 13000, cityCode: "hcmc" } }

// ---------------------------------------------------------------- AC-1 --
test("CD-AC-1 admin bật Bùng hạn H+13 → params + đúng một dòng audit, không tầng A", async () => {
  const { datCheDo } = await lib()
  await seed([S06_HCM])
  const r = await datCheDo({ action: "set-mode", id: 7, mode: "bung", burstUntil: ngay(13) }, asAdmin, { now: NOW })
  assert.equal(r.status, 200, JSON.stringify(r.body))
  assert.deepEqual(await params(7), { region_v2: 13000, cityCode: "hcmc", mode: "bung", burst_until: ngay(13), mode_since: H })
  const a = await audits()
  assert.equal(a.length, 1, "phải đúng một dòng audit")
  assert.equal(a[0].actor, "user:42")
  assert.equal(a[0].action, "source-group:mode")
  assert.deepEqual(a[0].detail, { id: 7, source_code: "S06", from: null, to: "bung", burst_until: ngay(13), burst_until_cu: null })
  const d = JSON.stringify(a[0].detail)
  assert.ok(!d.includes(S06_HCM.group_key) && !d.includes(S06_HCM.name), "detail audit lộ group_key/name")
})

test("CD-AC-1b INSERT audit hỏng → 500, params giữ nguyên; gỡ CHECK thì ghi được", async () => {
  const { datCheDo } = await lib()
  await seed([S06_HCM])
  await sc.query(`ALTER TABLE ops_audit ADD CONSTRAINT cd_chan CHECK (action <> 'source-group:mode')`)
  try {
    const truoc = await allParams()
    const r = await datCheDo({ action: "set-mode", id: 7, mode: "bung", burstUntil: ngay(3) }, asAdmin, { now: NOW })
    assert.equal(r.status, 500, JSON.stringify(r.body))
    assert.deepEqual(await allParams(), truoc, "audit hỏng mà params vẫn đổi — không cùng giao dịch")
    assert.equal(await nAudit(), 0)
  } finally {
    await sc.query(`ALTER TABLE ops_audit DROP CONSTRAINT cd_chan`)
  }
  const ok = await datCheDo({ action: "set-mode", id: 7, mode: "bung", burstUntil: ngay(3) }, asAdmin, { now: NOW })
  assert.equal(ok.status, 200, "đối chứng: gỡ CHECK phải ghi được")
  assert.equal(await nAudit(), 1)
})

// ---------------------------------------------------------------- AC-2 --
test("CD-AC-2 ma trận 7 đầu vào hỏng → 400/404, không đổi params, không audit", async () => {
  const { datCheDo } = await lib()
  await seed([S06_HCM, { id: 8, source_code: "S05", group_key: "khoa-cd-8", name: "Tên CD 8", params: { mode: "duy_tri", mode_since: "2026-10-01" } }])
  const truoc = await allParams()
  const MA_TRAN: [Record<string, unknown>, number, RegExp | null][] = [
    [{ id: 7, mode: "bung" }, 400, /hạn/],
    [{ id: 7, mode: "bung", burstUntil: "2026/11/07" }, 400, /hạn/],
    [{ id: 7, mode: "bung", burstUntil: "2026-02-30" }, 400, /hạn/],
    [{ id: 7, mode: "bung", burstUntil: H_1 }, 400, /^hạn bùng đã qua$/],
    [{ id: 7, mode: "bung", burstUntil: ngay(14) }, 400, new RegExp(ngay(13))],
    [{ id: 7, mode: "turbo" }, 400, /chế độ/],
    [{ id: 999999, mode: "cho" }, 404, null],
  ]
  for (const [b, st, msg] of MA_TRAN) {
    const r = await datCheDo({ action: "set-mode", ...b }, asAdmin, { now: NOW })
    assert.equal(r.status, st, `CD-AC-2 ${JSON.stringify(b)} → ${r.status} ${JSON.stringify(r.body)}`)
    if (msg) assert.match(String(r.body.error), msg, `CD-AC-2 thông điệp ${JSON.stringify(b)}`)
  }
  assert.equal(MA_TRAN.length, 7)
  assert.deepEqual(await allParams(), truoc)
  assert.equal(await nAudit(), 0)
})

// ---------------------------------------------------------------- AC-3 --
test("CD-AC-3 không phải admin → 403; route trao set-mode cho datCheDo(…, getSessionUser)", async () => {
  const { datCheDo } = await lib()
  await seed([S06_HCM])
  const truoc = await allParams()
  const than = { action: "set-mode", id: 7, mode: "bung", burstUntil: ngay(3) }
  for (const [ten, u] of [["không phiên (Bearer máy)", null], ["phiên ops", OPS]] as const) {
    const r = await datCheDo(than, async () => u, { now: NOW })
    assert.equal(r.status, 403, `CD-AC-3 ${ten}`)
  }
  assert.deepEqual(await allParams(), truoc)
  assert.equal(await nAudit(), 0)
  const route = readFileSync(join(APP, "src/app/api/v1/ops/source-groups/route.ts"), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")
  assert.match(route, /action\s*===\s*["']set-mode["'][\s\S]{0,200}datCheDo\(\s*b\s*,\s*getSessionUser\s*\)/, "route không trao set-mode cho datCheDo(b, getSessionUser)")
  assert.equal((await datCheDo(than, asAdmin, { now: NOW })).status, 200, "đối chứng admin")
})

test("CD-AC-3b action cũ qua Bearer không ghi được khoá chế độ", async () => {
  const { POST } = await import("../src/app/api/v1/ops/source-groups/route")
  await seed([S06_HCM])
  const goi = (body: Record<string, unknown>) =>
    POST(new Request("http://localhost/api/v1/ops/source-groups", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }))
  const lau = { mode: "bung", burstUntil: "2027-12-31", burst_until: "2027-12-31", params: { mode: "bung", burst_until: "2027-12-31" } }
  const add = await goi({ action: "add", sourceCode: "S06", groupKey: "khoa-cd-3b", name: "Tên CD 3B", regionV2: 5, cityCode: "dn", ...lau })
  assert.equal(add.status, 200)
  const moi = (await sc.query("SELECT params FROM source_groups WHERE group_key = 'khoa-cd-3b'")).rows[0].params
  assert.deepEqual(moi, { region_v2: 5, cityCode: "dn" })
  const tg = await goi({ action: "toggle", sourceCode: "S06", groupKey: S06_HCM.group_key, enabled: false, ...lau })
  assert.equal(tg.status, 200)
  assert.deepEqual(await params(7), S06_HCM.params)
  await new Promise((r) => setTimeout(r, 100))
  assert.equal((await audits()).filter((a) => a.action === "source-group:mode").length, 0)
})

// ---------------------------------------------------------------- AC-4 --
test("CD-AC-4 gia hạn giữ mode_since; rời Bùng gỡ hạn; đặt trùng không ghi", async () => {
  const { datCheDo } = await lib()
  await seed([{ id: 8, source_code: "S06", group_key: "khoa-cd-8", name: "Tên CD 8", params: { region_v2: 12000, mode: "bung", burst_until: ngay(5), mode_since: ngay(-3) } }])
  const set = (b: Record<string, unknown>) => datCheDo({ action: "set-mode", id: 8, ...b }, asAdmin, { now: NOW })

  assert.equal((await set({ mode: "bung", burstUntil: ngay(10) })).status, 200)
  assert.deepEqual(await params(8), { region_v2: 12000, mode: "bung", burst_until: ngay(10), mode_since: ngay(-3) })
  const a1 = (await audits()).at(-1)
  assert.equal(a1.detail.burst_until, ngay(10))
  assert.equal(a1.detail.burst_until_cu, ngay(5))

  assert.equal((await set({ mode: "duy_tri" })).status, 200)
  assert.deepEqual(await params(8), { region_v2: 12000, mode: "duy_tri", mode_since: H })
  assert.equal((await set({ mode: "cho", burstUntil: ngay(2) })).status, 200, "hạn gửi kèm chế độ khác Bùng bị bỏ qua")
  assert.deepEqual(await params(8), { region_v2: 12000, mode: "cho", mode_since: H })

  const n = await nAudit()
  assert.equal(n, 3)
  const lai = await set({ mode: "cho" })
  assert.equal(lai.status, 200)
  assert.equal(lai.body.unchanged, true)
  assert.equal(await nAudit(), n, "đặt trùng không được ghi audit")
})

// ---------------------------------------------------------------- AC-5 --
test("CD-AC-5 máy hạ bùng quá hạn / thiếu hạn; giữ hạn H; chạy lại không đổi; haVeDuyTri", async () => {
  const { haBungHetHan, haVeDuyTri } = await may()
  const bung = (id: number, until?: string): Row => ({ id, source_code: "S06", group_key: `khoa-cd-${id}`, name: `Tên CD ${id}`, params: { mode: "bung", mode_since: ngay(-5), ...(until === undefined ? {} : { burst_until: until }) } })
  await seed([bung(21, H_1), bung(22, H), bung(23), bung(24, "abc"), { id: 25, source_code: "S05", group_key: "khoa-cd-25", name: "Tên CD 25", params: { mode: "duy_tri", mode_since: "2026-10-01" } }])
  const p22 = await params(22)
  const p25 = await params(25)
  const ha = await haBungHetHan(sc, { now: NOW })
  assert.deepEqual(
    ha.map((x: { id: number; ly_do: string }) => [x.id, x.ly_do]).sort(),
    [[21, "het-han"], [23, "thieu-han"], [24, "thieu-han"]],
  )
  for (const id of [21, 23, 24]) assert.deepEqual(await params(id), { mode: "duy_tri", mode_since: H }, `điểm ${id}`)
  assert.deepEqual(await params(22), p22, "hạn H còn hiệu lực hết ngày H")
  assert.deepEqual(await params(25), p25)
  const a = await audits()
  assert.equal(a.length, 3)
  for (const x of a) {
    assert.equal(x.actor, "machine:ha-bung-het-han")
    assert.equal(x.action, "source-group:mode-auto")
    assert.deepEqual(Object.keys(x.detail).sort(), ["burst_until", "from", "id", "ly_do", "source_code", "to"])
    assert.equal(x.detail.from, "bung")
    assert.equal(x.detail.to, "duy_tri")
  }
  assert.equal(a.find((x) => x.detail.id === 21).detail.burst_until, H_1)

  assert.deepEqual(await haBungHetHan(sc, { now: NOW }), [], "chạy lần hai phải không đổi gì")
  assert.equal(await nAudit(), 3)

  assert.equal(await haVeDuyTri(sc, 22, "bao-hoa", { now: NOW }), true)
  assert.deepEqual(await params(22), { mode: "duy_tri", mode_since: H })
  assert.equal((await audits()).at(-1).detail.ly_do, "bao-hoa")
  assert.equal(await haVeDuyTri(sc, 25, "bao-hoa", { now: NOW }), false)
  assert.equal(await nAudit(), 4)
})

test("CD-AC-5b audit máy hạ hỏng → ném lỗi, không điểm nào đổi; gỡ CHECK thì hạ được", async () => {
  const { haBungHetHan } = await may()
  await seed([{ id: 26, source_code: "S06", group_key: "khoa-cd-26", name: "Tên CD 26", params: { mode: "bung", burst_until: ngay(-3), mode_since: ngay(-9) } }])
  const truoc = await allParams()
  await sc.query(`ALTER TABLE ops_audit ADD CONSTRAINT cd_chan_may CHECK (action <> 'source-group:mode-auto')`)
  try {
    await assert.rejects(() => haBungHetHan(sc, { now: NOW }))
    assert.deepEqual(await allParams(), truoc)
  } finally {
    await sc.query(`ALTER TABLE ops_audit DROP CONSTRAINT cd_chan_may`)
  }
  assert.equal((await haBungHetHan(sc, { now: NOW })).length, 1, "đối chứng: gỡ CHECK phải hạ được")
})

test("CD-AC-5c CLI in đúng một dòng mỗi điểm hạ, chỉ mã nguồn + id", async () => {
  await seed([{ id: 31, source_code: "S06", group_key: "https://vi-du.invalid/nhom-cd5c", name: "Nhóm CD5C", params: { mode: "bung", burst_until: ngay(-2), mode_since: ngay(-10) } }])
  const out = execFileSync(process.execPath, [join(ROOT, "pipeline/ha-bung-het-han.mjs")], {
    env: { ...process.env, DATABASE_URL: schemaUrl(S), TZ: "UTC", NODE_TEST_CONTEXT: "" },
    encoding: "utf8",
  })
  const dong = out.split("\n").filter(Boolean)
  assert.equal(dong.length, 1, `CLI phải in đúng 1 dòng: ${JSON.stringify(dong)}`)
  assert.match(dong[0], /^hạ S0\d#\d+ bung→duy_tri \(het-han, hạn \d{4}-\d{2}-\d{2}\)$/)
  assert.ok(!dong[0].includes("vi-du.invalid") && !dong[0].includes("Nhóm CD5C"))
  assert.equal((await params(31)).mode, "duy_tri")
})

// ------------------------------------------------------------ AC-7 (jsdom) --
type Grp = { id: number; source_code: string; group_key: string; name: string; enabled: boolean; note: null; fb_posts: number; mode: string | null; burst_until: string | null; mode_since: string | null }
const grp = (id: number, mode: string | null, burst_until: string | null = null): Grp => ({
  id, source_code: "S06", group_key: `khoa-ui-${id}`, name: `Tên UI ${id}`, enabled: true, note: null, fb_posts: 0, mode, burst_until, mode_since: mode ? "2026-10-20" : null,
})

async function render(rows: Grp[], fetchImpl: (body: Record<string, unknown>) => Promise<{ status: number; body: unknown }>) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { act } = React
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const { SourceGroups } = await import("../src/components/ops/sources/source-groups")
  const sent: Record<string, unknown>[] = []
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "null"))
    sent.push(body)
    const r = await fetchImpl(body)
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json" } })
  }) as unknown as typeof fetch
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <SourceGroups initial={rows as never} homNay={H} />
      </AppRouterContext.Provider>,
    )
  })
  const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 20)) })
  const row = (id: number) => document.querySelector(`[data-row-id="${id}"]`) as HTMLElement | null
  const dialog = () => document.querySelector("[role=dialog]") as HTMLElement | null
  const press = async (el: Element | null | undefined, what: string) => {
    assert.ok(el, `không thấy ${what}`)
    await act(async () => { (el as HTMLElement).click() })
    await tick()
  }
  const openFor = (id: number) => press(row(id)?.querySelector('[aria-label="Đổi chế độ thu"]'), `nút Đổi chế độ thu hàng ${id}`)
  const choose = (label: string) => press([...(dialog()?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.trim() === label), `nút «${label}» trong hộp`)
  const dateInput = () => dialog()?.querySelector('input[type="date"]') as HTMLInputElement | null
  const typeDate = async (v: string) => {
    const el = dateInput()
    assert.ok(el, "không thấy ô Hạn bùng")
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!
    await act(async () => {
      setter.call(el, v)
      el.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
    })
    await tick()
  }
  const save = () => [...(dialog()?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.trim() === "Lưu") as HTMLButtonElement | undefined
  return { sent, row, dialog, openFor, choose, dateInput, typeDate, save, press, unmount: () => act(async () => root.unmount()) }
}

test("CD-AC-7 cột Chế độ bốn trạng thái; hộp thoại Bùng: ô hạn H…H+13, Lưu khoá khi thiếu hạn, lỗi máy chủ hiện trong hộp", async () => {
  const u = await render([grp(1, "cho"), grp(2, "bung", "2026-11-07"), grp(3, "duy_tri"), grp(4, null)], async () => ({ status: 400, body: { error: "hạn bùng đã qua" } }))
  const MONG: [number, string][] = [[1, "Chờ"], [2, "Bùng · đến 07/11"], [3, "Duy trì"], [4, "Chưa đặt"]]
  for (const [id, nhan] of MONG) assert.ok(u.row(id)?.textContent?.includes(nhan), `hàng ${id} thiếu «${nhan}»: ${u.row(id)?.textContent}`)
  await u.openFor(4)
  const dlg = u.dialog()
  assert.ok(dlg, "hộp thoại không mở")
  assert.ok(dlg.textContent?.includes("S06 · điểm #4"), `tiêu đề hộp thiếu mã điểm: ${dlg.textContent}`)
  assert.ok(!dlg.textContent?.includes("Tên UI 4") && !dlg.textContent?.includes("khoa-ui-4"), "hộp thoại lộ tên/khoá nhóm")
  await u.choose("Bùng")
  const inp = u.dateInput()
  assert.ok(inp, "chọn Bùng mà không có ô ngày")
  assert.equal(inp.min, H)
  assert.equal(inp.max, "2026-11-08")
  const lbl = u.dialog()?.querySelector(`label[for="${inp.id}"]`)
  assert.equal(lbl?.textContent?.trim(), "Hạn bùng")
  assert.equal(u.save()?.disabled, true, "Lưu phải khoá khi chưa có hạn")
  await u.typeDate("2026-10-30")
  assert.equal(u.save()?.disabled, false, "có hạn rồi mà Lưu vẫn khoá")
  await u.press(u.save(), "nút Lưu")
  assert.ok(u.dialog()?.textContent?.includes("hạn bùng đã qua"), "lỗi máy chủ không hiện trong hộp")
  await u.unmount()
  const sql = readFileSync(join(APP, "src/components/ops/sources/sources-content.tsx"), "utf8")
  for (const k of ["mode", "burst_until", "mode_since"]) assert.match(sql, new RegExp(`params->>'${k}'`), `sources-content thiếu params->>'${k}'`)
})

test("CD-AC-7b hộp thoại → datCheDo thật: thân request, params, Badge (cross-layer)", async () => {
  const { datCheDo } = await lib()
  await seed([{ id: 9, source_code: "S06", group_key: "khoa-ui-9", name: "Tên UI 9", params: { region_v2: 13000 } }])
  const u = await render([grp(9, null)], async (b) => datCheDo(b, asAdmin, { now: NOW }))
  await u.openFor(9)
  await u.choose("Bùng")
  await u.typeDate(ngay(5))
  await u.press(u.save(), "nút Lưu")
  assert.deepEqual(u.sent.at(-1), { action: "set-mode", id: 9, mode: "bung", burstUntil: ngay(5) })
  assert.deepEqual(await params(9), { region_v2: 13000, mode: "bung", burst_until: ngay(5), mode_since: H })
  assert.equal(u.dialog(), null, "lưu xong hộp phải đóng")
  assert.ok(u.row(9)?.textContent?.includes("Bùng · đến 31/10"), `Badge chưa đổi: ${u.row(9)?.textContent}`)

  await u.openFor(9)
  await u.choose("Duy trì")
  assert.equal(u.dateInput(), null, "rời Bùng thì ô hạn phải ẩn")
  await u.press(u.save(), "nút Lưu")
  assert.deepEqual(u.sent.at(-1), { action: "set-mode", id: 9, mode: "duy_tri" })
  assert.deepEqual(await params(9), { region_v2: 13000, mode: "duy_tri", mode_since: H })
  assert.ok(u.row(9)?.textContent?.includes("Duy trì"))
  await u.unmount()
})

// ---------------------------------------------------------------- AC-8 --
test("CD-AC-8 CONTEXT.md có «Chế độ thu» và «Hạn bùng»; nhãn UI khớp", async () => {
  const { NHAN_CHE_DO } = await lib()
  assert.deepEqual(NHAN_CHE_DO, { cho: "Chờ", bung: "Bùng", duy_tri: "Duy trì" })
  const ctx = readFileSync(join(ROOT, "CONTEXT.md"), "utf8")
  const muc = ctx.split(/\n(?=\*\*)/).find((m) => m.startsWith("**Chế độ thu**"))
  assert.ok(muc, "CONTEXT.md thiếu mục **Chế độ thu**")
  const code = muc.split("\n").find((l) => l.startsWith("- Code:")) ?? ""
  for (const v of ["cho", "bung", "duy_tri"]) assert.ok(code.includes(v), `dòng Code thiếu ${v}`)
  for (const n of Object.values(NHAN_CHE_DO)) assert.ok(muc.split("\n")[0].includes(`«${n}»`), `định nghĩa thiếu nhãn «${n}»`)
  const han = ctx.split(/\n(?=\*\*)/).find((m) => m.startsWith("**Hạn bùng**"))
  assert.ok(han?.includes("burst_until"), "CONTEXT.md thiếu mục **Hạn bùng** với burst_until")
})
