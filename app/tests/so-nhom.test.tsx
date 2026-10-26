// so-nhom.test.tsx — hồ sơ _acceptance/so-nhom-mot-noi (PL12), ca «SN-*» phía app trên MỘT lược đồ tạm ở khuôn sau gộp
// (khuôn trước 047 + 047 + 048, pool của app gắn search_path lúc import). Gọi hàm và route thật; public không được chạm
// (chụp trước/sau).
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { JSDOM } from "jsdom"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { DAU_SN, THAM_CHIEU, dungSauGop } from "../../pipeline/scripts/so-nhom-fixture.mjs"
import { chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"

// HOME giả cho CẢ tiến trình, đặt TRƯỚC mọi import động: zalo-admin.ts tính đường tệp cấu hình gateway theo HOME lúc
// import — ca SN-AC-5b gọi hàm ghi thật của app trên tệp tạm, không bao giờ trên ~/.openclaw (luật 8, zalo-safety).
const HOME_GIA = mkdtempSync(join(tmpdir(), "sn-home-"))
process.env.HOME = HOME_GIA
const S = `sn_app_${process.pid}`
const TOKEN = "sn-thu-token"
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
  HTMLInputElement: dom.window.HTMLInputElement,
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

const ADMIN = { id: "42", email: "admin@local.test", plan: "free" as const, role: "admin" as const }
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
let publicTruoc: unknown

const K = (code: string) => `${DAU_SN}-${code}`
before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungSauGop(admin, S, { thamChieu: true })
  for (const t of ["ops_audit", "stg_zalo_posts"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
  await sc.connect()
  // Một đơn vị mỗi nguồn; S03 ở mode bùng để set-mode có việc để từ chối.
  for (const [code, params] of [["S02", {}], ["S03", { mode: "bung", burst_until: "2026-10-30" }], ["S05", {}], ["S06", {}]] as const) {
    await sc.query(`INSERT INTO source_groups (source_code, group_key, name, params) VALUES ($1, $2, $3, $4::jsonb)`,
      [code, K(code), `${DAU_SN} đơn vị ${code}`, JSON.stringify(params)])
  }
})
after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200)) // auditOpsWrite ghi nền
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
  rmSync(HOME_GIA, { recursive: true, force: true })
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm")
})

async function goi(body: Record<string, unknown>) {
  const { POST } = await import("../src/app/api/v1/ops/source-groups/route")
  const res = await POST(
    new Request("http://localhost/api/v1/ops/source-groups", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
  await new Promise((r) => setTimeout(r, 100))
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}
const anhSo = async () => (await sc.query(`SELECT * FROM collection_units ORDER BY id`)).rows
const nAudit = async () => (await sc.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n as number

test("SN-AC-2-route trang nhóm thu cũ chỉ quản S05/S06: docNhomThu lọc, mã khác → 400 không ghi gì", async () => {
  const { docNhomThu, datCheDo, LOI_NGOAI_NHOM } = await import("../src/lib/che-do-thu")
  assert.deepEqual((await docNhomThu()).map((r) => r.source_code), ["S05", "S06"])

  const truoc = await anhSo()
  const audit = await nAudit()
  for (const code of ["S03", "S02"]) {
    for (const body of [
      { action: "toggle", sourceCode: code, groupKey: K(code), enabled: false },
      { action: "add", sourceCode: code, groupKey: `${K(code)}-moi`, name: "mới" },
      { action: "delete", sourceCode: code, groupKey: K(code) },
    ]) {
      const r = await goi(body)
      assert.deepEqual(r, { status: 400, body: { error: LOI_NGOAI_NHOM } }, `${body.action} ${code}`)
    }
  }
  const idS03 = (await sc.query(`SELECT id FROM collection_units WHERE source_code = 'S03'`)).rows[0].id
  const r = await datCheDo({ id: Number(idS03), mode: "duy_tri" }, async () => ADMIN)
  assert.deepEqual(r, { status: 400, body: { error: LOI_NGOAI_NHOM } })
  assert.deepEqual(await anhSo(), truoc)
  assert.equal(await nAudit(), audit)

  // Đối chứng: cùng thân với S05 thì route ghi được.
  const ok = await goi({ action: "toggle", sourceCode: "S05", groupKey: K("S05"), enabled: false })
  assert.equal(ok.status, 200)
})

test("SN-AC-5b bản .mjs đọc nhóm gateway (readS03Groups) khớp effectiveEnabledGroups của app trên mọi fixture", async () => {
  const { effectiveEnabledGroups, setZaloGroupEnabled } = await import("../src/lib/zalo-admin")
  const { readS03Groups } = await import("../../scripts/lib/ops-local.mjs")
  const on = { enabled: true, requireMention: true }
  const off = { enabled: false }
  const FIXTURE: Record<string, unknown> = {
    "groups cấp kênh": { groups: { "vd-a": on, "vd-b": off } },
    "groups cấp tài khoản": { accounts: { default: { groups: { "vd-a": on } }, x: { groups: { "vd-c": on, "vd-d": { allow: false, requireMention: true } } } } },
    "ghi đè theo tài khoản": { groups: { "vd-a": on, "vd-b": on }, accounts: { default: { groups: { "vd-a": on } }, y: { profile: "y" } } },
    "nhóm enabled false": { accounts: { default: { groups: { "group:vd-e": off, "vd-f": on } } } },
    "tài khoản không groups": { accounts: { z: { profile: "z" } } },
  }
  // Fixture thứ sáu sinh bằng hàm ghi THẬT của app trên tệp cấu hình tạm (HOME giả), không viết tay.
  mkdirSync(join(HOME_GIA, ".openclaw"), { recursive: true })
  const f = join(HOME_GIA, ".openclaw", "openclaw.json")
  writeFileSync(f, JSON.stringify({ channels: { zalouser: FIXTURE["groups cấp tài khoản"] } }, null, 2))
  await setZaloGroupEnabled("x", "vd-g", true)
  await setZaloGroupEnabled("default", "vd-a", false)
  FIXTURE["sinh bằng setZaloGroupEnabled"] = JSON.parse(readFileSync(f, "utf8")).channels.zalouser

  const bo = (k: string) => k.replace(/^group:/, "")
  for (const [ten, z] of Object.entries(FIXTURE)) {
    const app = [...new Set(effectiveEnabledGroups(z as never).union.map(bo))].sort()
    const mjs = (readS03Groups(z) as { key: string; enabled: boolean }[]).filter((g) => g.enabled).map((g) => g.key)
    assert.deepEqual(mjs, app, ten)
  }
  assert.deepEqual(
    (readS03Groups(FIXTURE["sinh bằng setZaloGroupEnabled"]) as { key: string; enabled: boolean }[]).map((g) => [g.key, g.enabled]),
    [["vd-a", false], ["vd-c", true], ["vd-d", false], ["vd-g", true]],
  )
})

// ------------------------------------------------------------ AC-8 --
const OPS = { ...ADMIN, id: "43", email: "ops@local.test", role: "ops" as const }
const lib = () => import("../src/lib/so-don-vi")
const donVi = async (code: string) =>
  (await sc.query(`SELECT unit_code, market_codes, project_node_ids::int[] AS project_node_ids FROM collection_units
    WHERE source_code = $1`, [code])).rows[0] as { unit_code: string; market_codes: string[]; project_node_ids: number[] }
const auditMeta = async () =>
  (await sc.query(`SELECT detail FROM ops_audit WHERE action = 'source-group:set-meta' ORDER BY id`)).rows as { detail: Record<string, unknown> }[]

async function renderSo(props: Record<string, unknown>, fetchImpl: (b: Record<string, unknown>) => Promise<{ status: number; body: unknown }>) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { act } = React
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const { SoDonVi } = await import("../src/components/ops/sources/so-don-vi")
  const sent: Record<string, unknown>[] = []
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "null"))
    sent.push(body)
    const r = await fetchImpl(body)
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json" } })
  }) as unknown as typeof fetch
  let lamMoi = 0
  const router = { refresh() { lamMoi++ }, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <SoDonVi {...(props as Parameters<typeof SoDonVi>[0])} />
      </AppRouterContext.Provider>,
    )
  })
  const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 30)) })
  const row = (code: string) => document.querySelector(`[data-row-id="${code}"]`) as HTMLElement | null
  const dialog = () => document.querySelector("[role=dialog]") as HTMLElement | null
  const press = async (el: Element | null | undefined, what: string) => {
    assert.ok(el, `không thấy ${what}`)
    await act(async () => { (el as HTMLElement).click() })
    await tick()
  }
  const openFor = (code: string) => press(row(code)?.querySelector('[aria-label="Khai thị trường, khu đô thị"]'), `nút khai hàng ${code}`)
  /** Mở ô chọn có nhãn `label` trong hộp rồi bấm mục có chữ `ten`. */
  const pick = async (label: string, ten: string) => {
    const lbl = [...(dialog()?.querySelectorAll("label") ?? [])].find((l) => l.textContent?.trim() === label)
    const inp = lbl ? (document.getElementById(lbl.getAttribute("for") ?? "") as HTMLInputElement | null) : null
    assert.ok(inp, `không thấy ô «${label}»`)
    await act(async () => {
      inp.focus()
      inp.dispatchEvent(new dom.window.MouseEvent("mousedown", { bubbles: true }))
      inp.click()
    })
    await tick()
    const opt = [...document.querySelectorAll("[role=option]")].find((o) => o.textContent?.trim() === ten)
    await press(opt, `mục «${ten}» của ô «${label}»`)
  }
  const save = () => [...(dialog()?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.trim() === "Lưu")
  return { sent, row, dialog, openFor, pick, save, press, lamMoi: () => lamMoi, unmount: () => act(async () => root.unmount()) }
}

test("SN-AC-8 khu sổ: mọi đơn vị bốn nguồn, không khoá nhóm, nhãn theo cổng S03; khai qua hộp → set-meta, sổ và audit cùng giao dịch (cross-layer)", async () => {
  const { docSoDonVi, docDanhMuc, khaiDonVi } = await lib()
  const rows = (await docSoDonVi())!
  const danhMuc = await docDanhMuc()
  const u = await renderSo({ rows, danhMuc, loi: false }, async (b) => khaiDonVi(b, async () => ADMIN))
  for (const code of ["S02", "S03", "S05", "S06"]) {
    const { unit_code } = await donVi(code)
    const t = u.row(unit_code)?.textContent ?? ""
    for (const can of [unit_code, `${code} · `, `${DAU_SN} đơn vị ${code}`, "—"]) assert.ok(t.includes(can), `hàng ${code} thiếu «${can}»: ${t}`)
    assert.match(t, /Đang thu|Tạm dừng/)
  }
  const html = document.body.innerHTML
  for (const code of ["S02", "S03", "S05", "S06"]) assert.ok(!html.includes(K(code)), `lộ khoá nhóm ${code}`)
  const s03 = await donVi("S03")
  const s05 = await donVi("S05")
  assert.ok(u.row(s03.unit_code)?.textContent?.includes("theo cổng S03"))
  assert.ok(!u.row(s05.unit_code)?.textContent?.includes("theo cổng S03"), "đối chứng: dòng S05 không mang nhãn gateway")

  const truoc = (await auditMeta()).length
  await u.openFor(s05.unit_code)
  assert.ok(u.dialog()?.textContent?.includes(s05.unit_code))
  await u.pick("Thị trường", "Thị trường thử")
  await u.pick("Khu đô thị", "Khu đô thị thử")
  await u.press(u.save(), "nút Lưu")
  assert.deepEqual(u.sent.at(-1), { action: "set-meta", unitCode: s05.unit_code, marketCodes: [THAM_CHIEU.market], projectNodeIds: [THAM_CHIEU.project] })
  assert.deepEqual(await donVi("S05"), { unit_code: s05.unit_code, market_codes: [THAM_CHIEU.market], project_node_ids: [THAM_CHIEU.project] })
  const audit = await auditMeta()
  assert.equal(audit.length, truoc + 1)
  assert.equal(audit.at(-1)!.detail.unit_code, s05.unit_code)
  assert.equal(u.dialog(), null, "lưu xong hộp phải đóng")
  assert.ok(u.row(s05.unit_code)?.textContent?.includes("Thị trường thử") && u.row(s05.unit_code)?.textContent?.includes("Khu đô thị thử"))
  await u.unmount()

  // Đối chứng cùng giao dịch: audit bị CHECK chặn → 500, sổ không đổi.
  await sc.query(`ALTER TABLE ops_audit ADD CONSTRAINT sn_chan CHECK (action <> 'source-group:set-meta') NOT VALID`)
  try {
    const r = await khaiDonVi({ unitCode: s03.unit_code, marketCodes: [THAM_CHIEU.market], projectNodeIds: [] }, async () => ADMIN)
    assert.equal(r.status, 500)
    assert.deepEqual((await donVi("S03")).market_codes, [])
  } finally {
    await sc.query(`ALTER TABLE ops_audit DROP CONSTRAINT sn_chan`)
  }

  // Lưu lỗi (400) → hộp còn mở, chữ lỗi hiện, dòng không đổi.
  const v = await renderSo({ rows: await docSoDonVi(), danhMuc, loi: false }, async () => ({ status: 400, body: { error: "mã thị trường sai thử" } }))
  await v.openFor(s03.unit_code)
  await v.pick("Thị trường", "Thị trường thử")
  await v.press(v.save(), "nút Lưu")
  assert.ok(v.dialog()?.textContent?.includes("mã thị trường sai thử"), "lỗi máy chủ không hiện trong hộp")
  assert.equal(v.row(s03.unit_code)?.textContent?.includes("Thị trường thử"), false)
  await v.unmount()

  // Nguồn chưa có đơn vị → trạng thái trống kèm lệnh đồng bộ.
  const { LENH_DONG_BO } = await import("../src/components/ops/sources/so-don-vi")
  const e = await renderSo({ rows: rows.filter((r) => r.source_code !== "S02"), danhMuc, loi: false }, async () => ({ status: 200, body: {} }))
  const trong = document.getElementById("so-s02")?.textContent ?? ""
  assert.ok(trong.includes("Chưa có đơn vị nào") && trong.includes(LENH_DONG_BO), `tab S02 rỗng thiếu trạng thái trống: ${trong}`)
  await e.unmount()

  // Hàm đọc ném → trang chuyển cờ lỗi; vùng lỗi có Thử lại gọi làm mới.
  await assert.rejects(docSoDonVi({ query: async () => { throw new Error("relation \"collection_units\" does not exist") } } as never))
  const trang = readFileSync(join(import.meta.dirname, "..", "src/components/ops/sources/sources-content.tsx"), "utf8")
  assert.match(trang, /soRows = await docSoDonVi\(\);\s*if \(soRows\) danhMuc = await docDanhMuc\(\);\s*\} catch \{\s*soLoi = true;/)
  assert.match(trang, /\{soRows !== null \|\| soLoi \? <SoDonVi rows=\{soRows \?\? \[\]\} danhMuc=\{danhMuc\} loi=\{soLoi\} \/> : null\}/)
  // Chưa có bảng sổ (chưa áp 048, cloud) → null: trang không vẽ khu sổ, không cảnh báo (RS-AC-3).
  assert.equal(await docSoDonVi({ query: async () => ({ rows: [{ co: false }] }) } as never), null)
  const l = await renderSo({ rows: [], danhMuc, loi: true }, async () => ({ status: 200, body: {} }))
  const thuLai = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Thử lại")
  assert.ok(document.body.textContent?.includes("Không đọc được sổ đơn vị thu"))
  await l.press(thuLai, "nút Thử lại")
  assert.equal(l.lamMoi(), 1)
  await l.unmount()
})

test("SN-AC-8b set-meta khử trùng phần tử, mảng rỗng xoá khai báo", async () => {
  const { khaiDonVi } = await lib()
  const { unit_code } = await donVi("S06")
  const r = await khaiDonVi({ unitCode: unit_code, marketCodes: [THAM_CHIEU.market, THAM_CHIEU.market], projectNodeIds: [THAM_CHIEU.project, THAM_CHIEU.project] }, async () => ADMIN)
  assert.equal(r.status, 200)
  assert.deepEqual(await donVi("S06"), { unit_code, market_codes: [THAM_CHIEU.market], project_node_ids: [THAM_CHIEU.project] })
  assert.equal((await khaiDonVi({ unitCode: unit_code, marketCodes: [], projectNodeIds: [] }, async () => ADMIN)).status, 200)
  assert.deepEqual(await donVi("S06"), { unit_code, market_codes: [], project_node_ids: [] })
  // Tham chiếu sai → 400 kèm chữ lỗi của DB, không 500.
  const sai = await khaiDonVi({ unitCode: unit_code, marketCodes: [THAM_CHIEU.submarket], projectNodeIds: [] }, async () => ADMIN)
  assert.equal(sai.status, 400)
  assert.match(String(sai.body.error), /collection_units_kiem_tham_chieu/)
})

// ------------------------------------------------------------ AC-9 --
test("SN-AC-9 set-meta: không phiên, phiên ops, Bearer máy → 403, sổ và audit không đổi; admin → 200", async () => {
  const { khaiDonVi } = await lib()
  const { unit_code } = await donVi("S02")
  const than = { unitCode: unit_code, marketCodes: [THAM_CHIEU.market], projectNodeIds: [] }
  const truocSo = await anhSo()
  const truocAudit = await nAudit()
  assert.equal((await khaiDonVi(than, async () => null)).status, 403)
  assert.equal((await khaiDonVi(than, async () => OPS)).status, 403)
  assert.equal((await goi({ action: "set-meta", ...than })).status, 403)
  assert.deepEqual(await anhSo(), truocSo)
  assert.equal(await nAudit(), truocAudit)
  // Route trao set-meta cho khaiDonVi với getSessionUser (không cho Bearer làm danh tính).
  const route = readFileSync(join(import.meta.dirname, "..", "src/app/api/v1/ops/source-groups/route.ts"), "utf8")
  assert.match(route, /if \(b\.action === "set-meta"\) \{\s*const r = await khaiDonVi\(b, getSessionUser\);/)
  assert.equal((await khaiDonVi(than, async () => ADMIN)).status, 200, "đối chứng: admin khai được")
})
