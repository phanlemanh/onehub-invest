// dinh-danh-thu.test.tsx — hồ sơ _acceptance/dinh-danh-tai-khoan-thu-theo-vai: Người xem và bearer chung không nhận mã tài
// khoản thu, hồ sơ, mã nhóm Zalo hay tài khoản giữ nhóm ở bề mặt Thu thập (AGENTS.md luật 6; Hỏi-1 = A, Hỏi-2 = A).
// Tên ca mở đầu bằng mã AC (DD-AC-n). Mã cấy dạng dd-acc-<n>, dd-prof-<n>, dd-grp-<n>-<k>. Mỗi phép đo có chiều đỏ: bản chép
// tạm của tệp nguồn (tests/.dd-cu-*) đổi đúng một chỗ, thông điệp ghim. Ca DB dựng lược đồ tạm `dd_<pid>`, xoá cuối lượt.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import type { ReactNode } from "react"
import { JSDOM } from "jsdom"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

// HOME giả cho CẢ tiến trình, đặt TRƯỚC mọi import động: bộ đọc cấu hình máy thu tính đường theo homedir() — ca thử không
// bao giờ đọc hay ghi ~/.openclaw thật (luật 8, zalo-safety).
const HOME_GIA = mkdtempSync(path.join(tmpdir(), "dd-home-"))
process.env.HOME = HOME_GIA
const S = `dd_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_EMAILS = "dd-ops@local.test"
const TOKEN = "dd-token-thu"
process.env.OPS_API_TOKEN = TOKEN

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
type User = import("../src/lib/auth").User
const NGUOI = {
  user: { id: "1", email: "dd-user@local.test", plan: "free", role: "user" },
  viewer: { id: "2", email: "dd-viewer@local.test", plan: "free", role: "viewer" },
  ops: { id: "3", email: "dd-o@local.test", plan: "free", role: "ops" },
  admin: { id: "4", email: "dd-admin@local.test", plan: "free", role: "admin" },
  owner: { id: "5", email: "dd-owner@local.test", plan: "free", role: "owner" },
  opsEmail: { id: "6", email: "dd-ops@local.test", plan: "free", role: "user" },
} satisfies Record<string, User>
type Kieu = keyof typeof NGUOI

// ---------- jsdom (cùng khuôn viewer-the-duyet.test.tsx) — cho ca bảng và trang Nguồn ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/ops/collections" })
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
  await React.act(() => new Promise((r) => setTimeout(r, 30)))
  return document.getElementById("root")!
}

// ---------- bản chép tạm (đối chứng dương) ----------
const CHEP: string[] = []
/** Chép một tệp nguồn của app thành tests/.dd-cu-<pid>-<n>.<ext>, đổi đúng một chỗ, đổi mọi import tương đối sang tuyệt đối. */
async function banChepTam<T>(rel: string, doi: (s: string) => string): Promise<T> {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.dd-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  // tsx dịch JSX ở tests/ theo runtime cổ điển (tsconfig không phủ bản chép) → cần React trong phạm vi.
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return (await import(f)) as T
}

// ---------- lược đồ tạm: users, sessions (phiên thật cho kiemQuyen), ops_heartbeat (bản tin cloud) ----------
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const COOKIE: Partial<Record<Kieu, string>> = {}

before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S}"`)
    await dungBangPhien(admin, S)
    await admin.query(`CREATE TABLE "${S}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`SET search_path TO "${S}"`)
    try {
      for (const k of Object.keys(NGUOI) as Kieu[]) {
        const n = NGUOI[k]
        COOKIE[k] = (await taoNguoi(admin, n.role, { email: n.email })).cookie
      }
    } finally {
      await admin.query(`RESET search_path`)
    }
  } catch (e) {
    setupErr = (e as Error).message
  }
})

after(async () => {
  if (currentRoot) {
    const React = await import("react")
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  for (const f of CHEP) rmSync(f, { force: true })
  rmSync(HOME_GIA, { recursive: true, force: true })
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---------- bộ dữ liệu viết trước ----------
type ZaloGroupRow = import("../src/lib/collections-queries").ZaloGroupRow
const nhom = (name: string, ownerAccount: string | null): ZaloGroupRow => ({
  name, isMockOnly: false, realPosts7d: 3, mockPosts7d: 0, lastSeenAt: null, seen: 5, passed: 4, skipped: 1, accepted: 4,
  lastEventAt: null, ownerAccount,
})
const BO_DU_LIEU = () => ({
  zaloAccounts: [
    { accountId: "dd-acc-1", name: null, profile: "dd-prof-1", enabledGroups: ["dd-grp-1-1", "dd-grp-1-2"] },
    { accountId: "dd-acc-2", name: null, profile: "dd-prof-2", enabledGroups: ["dd-grp-2-1"] },
  ],
  zaloAllowlist: [
    { groupId: "dd-grp-1-1", enabled: true },
    { groupId: "dd-grp-1-2", enabled: true },
    { groupId: "dd-grp-2-1", enabled: true },
  ],
  zaloGroups: [nhom("Nhóm DD một", "dd-acc-1"), nhom("Nhóm DD hai", "dd-acc-1"), nhom("Nhóm DD ba", null)],
})
const MA_CAY = /dd-(acc|prof|grp)-/

// ---------- AC-1: luật thấy định danh tài khoản thu ----------
describe("DD-AC-1 luật thấy định danh", () => {
  const BANG: [string, User | null, boolean][] = [
    ["user", NGUOI.user, false],
    ["viewer", NGUOI.viewer, false],
    ["ops", NGUOI.ops, true],
    ["admin", NGUOI.admin, true],
    ["owner", NGUOI.owner, true],
    ["opsEmail", NGUOI.opsEmail, true],
    ["bearer", null, false],
  ]
  type Luat = { xemDinhDanhThu: (u: User | null | undefined) => boolean }
  const doBang = (l: Luat) => {
    for (const [ten, u, mong] of BANG) assert.equal(l.xemDinhDanhThu(u), mong, `dòng '${ten}'`)
  }
  test("DD-AC-1 bảng bảy kiểu người gọi", async () => {
    assert.equal(BANG.length, 7)
    const luat = (await import("../src/lib/ops-access")) as Luat
    doBang(luat)
    const sai = await banChepTam<Luat>("src/lib/ops-access.ts", (s) => s.replace(/(xemDinhDanhThu[\s\S]*?)BAC_VAI\.ops/, "$1BAC_VAI.viewer"))
    assert.throws(() => doBang(sai), /dòng 'viewer'/, "đối chứng ngưỡng hạ về viewer phải đỏ ở dòng viewer")
  })
})

// ---------- AC-2: hàm che ----------
type CheMod = { cheDinhDanhThu: <T>(p: T) => T }
const kiemDaChe = (kq: ReturnType<typeof BO_DU_LIEU>) => {
  assert.equal(kq.zaloAccounts.length, 2, "zaloAccounts giữ số phần tử")
  const goc = BO_DU_LIEU().zaloAccounts
  kq.zaloAccounts.forEach((a, i) => {
    assert.equal(a.accountId, null, `zaloAccounts[${i}].accountId`)
    assert.equal(a.name, null, `zaloAccounts[${i}].name`)
    assert.equal(a.profile, null, `zaloAccounts[${i}].profile`)
    assert.equal(a.enabledGroups.length, 0, `zaloAccounts[${i}].enabledGroups`)
    assert.equal((a as { soNhomBat?: number }).soNhomBat, goc[i].enabledGroups.length, `zaloAccounts[${i}].soNhomBat`)
  })
  assert.equal(kq.zaloAllowlist.length, 3, "zaloAllowlist giữ số phần tử")
  kq.zaloAllowlist.forEach((g, i) => assert.equal(g.groupId, null, `zaloAllowlist[${i}].groupId`))
  kq.zaloGroups.forEach((g, i) => assert.equal(g.ownerAccount, null, `zaloGroups[${i}].ownerAccount`))
  assert.doesNotMatch(JSON.stringify(kq), MA_CAY, "kết quả còn mã cấy")
}

describe("DD-AC-2 hàm che", () => {
  test("DD-AC-2 giữ số dòng, mã về null", async () => {
    const m = (await import("../src/lib/collections-queries")) as unknown as CheMod
    const vao = BO_DU_LIEU()
    const kq = m.cheDinhDanhThu(vao)
    kiemDaChe(kq)
    assert.deepEqual(vao, BO_DU_LIEU(), "hàm che không được sửa đầu vào")
    const rong = m.cheDinhDanhThu({ ...BO_DU_LIEU(), zaloAllowlist: null })
    assert.equal(rong.zaloAllowlist, null, "danh sách cho phép null (cấu hình không đọc được) giữ null")
    const sai = await banChepTam<CheMod>("src/lib/collections-queries.ts", (s) => s.replace("ownerAccount: null }))", "ownerAccount: g.ownerAccount }))"))
    assert.throws(() => kiemDaChe(sai.cheDinhDanhThu(BO_DU_LIEU())), /ownerAccount/, "đối chứng bỏ che ownerAccount phải đỏ")
  })
})

// ---------- AC-3: API ở máy thu — ma trận bảy kiểu người gọi ----------
type ApiMod = { xuLyThuThap: (req: Request, doc?: (days: number) => Promise<Record<string, unknown>>) => Promise<Response> }
const URL_API = "http://localhost:3462/api/v1/ops/collections?days=7"
const docGia = async () => ({ generatedAt: "x", flow: [], funnel: null, jobs: [], rotation: null, zaloHealth: null, ...BO_DU_LIEU() })
type O3 = { o: string; headers: Record<string, string>; thay: boolean | "403" }
const MA_TRAN_3 = (): O3[] => [
  { o: "user", headers: { cookie: COOKIE.user! }, thay: "403" },
  { o: "viewer", headers: { cookie: COOKIE.viewer! }, thay: false },
  { o: "ops", headers: { cookie: COOKIE.ops! }, thay: true },
  { o: "admin", headers: { cookie: COOKIE.admin! }, thay: true },
  { o: "owner", headers: { cookie: COOKIE.owner! }, thay: true },
  { o: "opsEmail", headers: { cookie: COOKIE.opsEmail! }, thay: true },
  { o: "bearer", headers: { authorization: `Bearer ${TOKEN}` }, thay: false },
]
async function goi(api: ApiMod, headers: Record<string, string>, doc: () => Promise<Record<string, unknown>> = docGia) {
  const res = await api.xuLyThuThap(new Request(URL_API, { headers }), doc)
  return { status: res.status, text: await res.text() }
}
async function doMaTran3(api: ApiMod) {
  const dem: Record<string, { acc: number; allow: number }> = {}
  for (const c of MA_TRAN_3()) {
    const r = await goi(api, c.headers)
    if (c.thay === "403") {
      assert.equal(r.status, 403, `ô '${c.o}': phải 403`)
      continue
    }
    assert.equal(r.status, 200, `ô '${c.o}': status`)
    const j = JSON.parse(r.text) as ReturnType<typeof BO_DU_LIEU>
    if (c.thay) {
      assert.match(r.text, /dd-acc-1/, `ô '${c.o}': phải thấy mã tài khoản`)
      assert.match(r.text, /dd-grp-1-1/, `ô '${c.o}': phải thấy mã nhóm`)
    } else assert.doesNotMatch(r.text, MA_CAY, `ô '${c.o}': còn mã cấy`)
    dem[c.o] = { acc: j.zaloAccounts.length, allow: j.zaloAllowlist.length }
  }
  assert.deepEqual(dem.viewer, dem.ops, "số dòng viewer phải bằng ops")
  assert.deepEqual(dem.bearer, dem.ops, "số dòng bearer phải bằng ops")
}

describe("DD-AC-3 API máy thu theo người gọi", () => {
  test("DD-AC-3 ma trận bảy kiểu người gọi", async () => {
    ready()
    assert.equal(MA_TRAN_3().length, 7)
    const api = (await import("../src/lib/collections-api")) as ApiMod
    await doMaTran3(api)
    // Review Focus 1: bearer kèm cookie phiên ops — nhánh bearer thắng (kiemQuyen), nên vẫn bị che.
    const kem = await goi(api, { authorization: `Bearer ${TOKEN}`, cookie: COOKIE.ops! })
    assert.doesNotMatch(kem.text, MA_CAY, "bearer kèm cookie ops vẫn phải bị che")
    const boChe = await banChepTam<ApiMod>("src/lib/collections-api.ts", (s) => s.replace("xemDinhDanhThu(q.nguoi) ? payload : cheDinhDanhThu(payload)", "payload"))
    await assert.rejects(doMaTran3(boChe), /ô '(viewer|bearer)'/, "đối chứng bỏ nhánh che phải đỏ ở ô viewer/bearer")
    const theoActor = await banChepTam<ApiMod>("src/lib/collections-api.ts", (s) => s.replace("xemDinhDanhThu(q.nguoi) ? payload", "(q.nguoi === null || xemDinhDanhThu(q.nguoi)) ? payload"))
    await assert.rejects(doMaTran3(theoActor), /ô 'bearer'/, "đối chứng coi bearer như vai ops phải đỏ ở ô bearer")
  })
  test("DD-AC-3b route.ts gọi xuLyThuThap", () => {
    const loiRoute = (src: string) => {
      const loi: string[] = []
      if (!/xuLyThuThap\(req/.test(src)) loi.push("route.ts không gọi xuLyThuThap(req")
      if (/Promise\.all|NextResponse\.json/.test(src)) loi.push("route.ts tự dựng payload")
      return loi
    }
    const src = readFileSync(path.join(APP, "src/app/api/v1/ops/collections/route.ts"), "utf8")
    assert.deepEqual(loiRoute(src), [])
    assert.deepEqual(loiRoute(`export async function GET(req: Request) { return NextResponse.json(await Promise.all([])) }`), [
      "route.ts không gọi xuLyThuThap(req",
      "route.ts tự dựng payload",
    ])
  })
})

// ---------- AC-4: API trên cloud (bản tin) ----------
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
const BAN_TIN = () => ({
  pushedAt: new Date().toISOString(),
  zaloAccounts: [
    { accountId: "dd-acc-1", name: null, profile: "dd-prof-1", enabledGroups: ["dd-grp-1-1", "dd-grp-1-2"] },
    { accountId: "dd-acc-2", name: null, profile: "dd-prof-2", enabledGroups: ["dd-grp-2-1"] },
  ],
})
async function doCloud(api: ApiMod) {
  const { getZaloAccountsFromFacts, resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
  const doc = async () => ({ generatedAt: "x", zaloAccounts: await getZaloAccountsFromFacts(), zaloAllowlist: null, zaloGroups: [] })
  return asCloud(async () => {
    const out: Record<string, { text: string; j: { zaloAccounts: { profile: string | null; soNhomBat?: number }[] } }> = {}
    for (const [o, headers] of [["viewer", { cookie: COOKIE.viewer! }], ["bearer", { authorization: `Bearer ${TOKEN}` }], ["ops", { cookie: COOKIE.ops! }]] as const) {
      const r = await goi(api, headers, doc)
      out[o] = { text: r.text, j: JSON.parse(r.text) }
    }
    for (const o of ["viewer", "bearer"]) {
      assert.equal(out[o].j.zaloAccounts.length, 2, `cloud ô '${o}': số tài khoản`)
      out[o].j.zaloAccounts.forEach((a, i) => assert.equal(a.profile, null, `cloud ô '${o}': zaloAccounts[${i}].profile`))
      assert.doesNotMatch(out[o].text, MA_CAY, `cloud ô '${o}': còn mã cấy`)
      assert.deepEqual(out[o].j.zaloAccounts.map((a) => a.soNhomBat), [2, 1], `cloud ô '${o}': soNhomBat từ bản tin cũ`)
    }
    assert.match(out.ops.text, /dd-acc-1/, "cloud ô 'ops': phải thấy mã tài khoản")
  })
}

describe("DD-AC-4 API trên cloud", () => {
  test("DD-AC-4 bản tin che theo người gọi", async () => {
    ready()
    await admin.query(`INSERT INTO "${S}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, now())
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`, [JSON.stringify(BAN_TIN())])
    const vercelTruoc = process.env.VERCEL
    const api = (await import("../src/lib/collections-api")) as ApiMod
    await doCloud(api)
    assert.equal(process.env.VERCEL, vercelTruoc, "VERCEL phải trả về như cũ")
    const sai = await banChepTam<ApiMod>("src/lib/collections-api.ts", (s) =>
      s.replace("cheDinhDanhThu(payload)", "{ ...cheDinhDanhThu(payload), zaloAccounts: (payload.zaloAccounts ?? []).map((a) => ({ ...a, accountId: null, enabledGroups: [], soNhomBat: a.enabledGroups.length })) }"),
    )
    await assert.rejects(doCloud(sai), /profile/, "đối chứng bỏ che profile phải đỏ")
  })
})

// ---------- AC-5: trang Thu thập che ở máy chủ ----------
type CollectionsData = import("../src/components/ops/collections/collections-view").CollectionsData
type ContentMod = { CollectionsContent: (p: { nowMs: number; getUser?: () => Promise<User | null>; doc?: () => Promise<CollectionsData> }) => Promise<import("react").ReactElement<CollectionsData>> }
const DU_LIEU_TRANG = (cloud: boolean) => ({ ...BO_DU_LIEU(), nowMs: 0, ...(cloud ? { cloud: { state: "fresh" } } : {}) }) as unknown as CollectionsData
async function dungTrang(mod: ContentMod, u: User, cloud = false) {
  const el = await mod.CollectionsContent({ nowMs: 0, getUser: async () => u, doc: async () => DU_LIEU_TRANG(cloud) })
  return el.props
}
async function bangNhom(props: CollectionsData) {
  const { ZaloGroupsTable } = await import("../src/components/ops/collections-tables")
  return render(<ZaloGroupsTable rows={props.zaloGroups} allowlist={props.zaloAllowlist} roles={{}} />)
}
async function doTrang(mod: ContentMod) {
  for (const cloud of [false, true]) {
    const noi = cloud ? "cloud" : "máy thu"
    const pv = await dungTrang(mod, NGUOI.viewer, cloud)
    assert.doesNotMatch(JSON.stringify(pv), MA_CAY, `${noi} ô 'viewer': props trao client còn mã cấy`)
    const po = await dungTrang(mod, NGUOI.ops, cloud)
    assert.match(JSON.stringify(po), /dd-acc-1/, `${noi} ô 'ops': props phải còn mã tài khoản`)
  }
}

describe("DD-AC-5 trang Thu thập", () => {
  test("DD-AC-5 che trước khi trao client, chú thích theo vai", async () => {
    const mod = (await import("../src/components/ops/collections/collections-content")) as unknown as ContentMod
    await doTrang(mod)
    const rv = await bangNhom(await dungTrang(mod, NGUOI.viewer))
    const tv = rv.textContent ?? ""
    assert.ok(tv.includes("mã nhóm chỉ hiện cho vai Vận hành trở lên."), "viewer: câu chú thích mã nhóm")
    assert.ok(tv.includes("đang bật 3 nhóm"), "viewer: số nhóm bật")
    assert.ok(!tv.includes("1-1"), "viewer: không đuôi mã nhóm")
    // Cột «Tài khoản» (tài khoản giữ nhóm) tìm theo tiêu đề, không theo vị trí.
    const cotTaiKhoan = (root: HTMLElement) => {
      const idx = [...root.querySelectorAll("thead th")].findIndex((th) => (th.textContent ?? "").trim() === "Tài khoản")
      assert.ok(idx >= 0, "bảng nhóm phải có cột «Tài khoản»")
      return [...root.querySelectorAll("tbody tr")].map((tr) => (tr.querySelectorAll("td")[idx]?.textContent ?? "").trim())
    }
    const oViewer = cotTaiKhoan(rv)
    assert.deepEqual([...new Set(oViewer)], ["—"], `viewer: mọi ô cột tài khoản giữ nhóm phải là «—»: ${JSON.stringify(oViewer)}`)
    assert.ok(!tv.includes("dd-acc-1"), "viewer: không tài khoản giữ nhóm")
    const ro = await bangNhom(await dungTrang(mod, NGUOI.ops))
    const to = ro.textContent ?? ""
    assert.ok(to.includes("grp-1-1".slice(-6)), "ops: đuôi mã nhóm")
    assert.ok(cotTaiKhoan(ro).includes("dd-acc-1"), "ops: cột tài khoản giữ nhóm có dd-acc-1")
    assert.ok(!to.includes("mã nhóm chỉ hiện cho vai Vận hành trở lên."), "ops: không câu chú thích vai")
    assert.ok(oViewer.length > 0, "viewer: bảng có hàng")
    const sai = await banChepTam<ContentMod>("src/components/ops/collections/collections-content.tsx", (s) =>
      s.replace("xemDinhDanhThu(user) ? data : cheDinhDanhThu(data)", "data"),
    )
    await assert.rejects(doTrang(sai), /ô 'viewer'/, "đối chứng bỏ dòng che phải đỏ ở ô viewer")
  })
})

// ---------- AC-7: /ops/sources trên cloud đọc số nhóm bật ----------
type AccMod = { ZaloAccounts: (p: { isCloud?: boolean }) => import("react").ReactElement }
async function dungNguon(mod: AccMod, zaloAccounts: unknown[]) {
  const fetchGoc = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify({ zaloAccounts }), { headers: { "content-type": "application/json" } })) as typeof fetch
  try {
    const React = await import("react")
    const root = await render(React.createElement(mod.ZaloAccounts, { isCloud: true }))
    const React2 = await import("react")
    await React2.act(() => new Promise((r) => setTimeout(r, 50)))
    return root.textContent ?? ""
  } finally {
    globalThis.fetch = fetchGoc
  }
}
async function doNguon(mod: AccMod) {
  const moi = await dungNguon(mod, [{ accountId: "acc-a", name: null, profile: "acc-a", enabledGroups: [], soNhomBat: 4 }])
  assert.ok(moi.includes("4 nhóm bật"), `bản tin mới: phải '4 nhóm bật' — ${moi.slice(0, 200)}`)
  assert.ok(!moi.includes("0 nhóm bật"), "bản tin mới: không được '0 nhóm bật'")
  // Review Focus 3: bản tin cũ (chưa có soNhomBat) vẫn đếm theo enabledGroups.
  const cu = await dungNguon(mod, [{ accountId: "acc-b", name: null, profile: "acc-b", enabledGroups: ["g1", "g2", "g3"] }])
  assert.ok(cu.includes("3 nhóm bật"), "bản tin cũ: phải '3 nhóm bật'")
}

describe("DD-AC-7 trang Nguồn trên cloud", () => {
  test("DD-AC-7 nhãn số nhóm bật từ soNhomBat", async () => {
    const mod = (await import("../src/components/ops/sources/zalo-accounts")) as unknown as AccMod
    await doNguon(mod)
    const sai = await banChepTam<AccMod>("src/components/ops/sources/zalo-accounts.tsx", (s) => s.replace("a.soNhomBat ?? a.enabledGroups.length", "a.enabledGroups.length"))
    await assert.rejects(doNguon(sai), /'4 nhóm bật'/, "đối chứng đọc enabledGroups.length phải đỏ (hiện '0 nhóm bật')")
  })
})
