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
