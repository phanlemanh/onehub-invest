// danh-ba-nguoi-deals-lien-he.test.tsx — hồ sơ _acceptance/people-hien-so-goc, ca «SHS-AC-6»: /ops/deals qua page thật (bản
// chép thay getSessionUser và getDeals), ma trận ba vai và bản cloud. Lời mới của hồ sơ can-gia-tot-biet-can: vai Vận hành có
// liên hệ, ảnh, chữ bài; cloud có liên hệ, không ảnh, chữ; vai Người xem không nhận trường nào, cả trong cây phần tử. Số, tên,
// nhóm trong ca đều bịa.
import { after, test, type TestContext } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { isValidElement, cloneElement, Suspense, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import type { User } from "../src/lib/auth"
import type { DealRow } from "../src/lib/deals"
import { fmtPhone } from "../src/lib/ops/people"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PAGE = "src/app/ops/deals/page.tsx"
const RegionErrorP = import("../src/components/states/region-error")
let RegionError: unknown
const QUET_SO = /(?<![\da-zA-Z])(?:\+?84[35789]\d{8}|0[35789]\d{8}|0[35789]\d{2}[ .-]?\d{3}[ .-]?\d{3})(?![\da-zA-Z])/g
const demSo = (s: string) => s.match(QUET_SO)?.length ?? 0

const TEN = "Người Bán Shs"
const NHOM = "Nhóm Bán Nhà Shs"
const BAI = "Chữ bài của tin thử shs"
const ANH = "/api/zalo-media?media=" + "a".repeat(32)
const DEAL: DealRow = {
  offerId: "S03:shs-1",
  source: "S03",
  priceVnd: 2_000_000_000,
  areaM2: 50,
  pricePerm2: 40_000_000,
  bedrooms: 2,
  phuong: "Phường Thử",
  areaPath: "/vn/hanoi/phuong-thu",
  medianPerm2: 50_000_000,
  rulerN: 12,
  discountPct: 20,
  suspect: false,
  confidence: "high",
  firstSeen: "2026-10-30T00:00:00.000Z",
  lastSeen: "2026-11-01T00:00:00.000Z",
  nReposts: 1,
  sellerName: TEN,
  sellerPhone: "+84912345678",
  groupName: NHOM,
  brokerNAds: 3,
  brokerMedianGap: 10,
  propertyType: "apartment",
  block: "Toà Shs",
  floor: null,
  unit: null,
  streetNumber: null,
  street: null,
  district: null,
  images: [{ src: ANH, origin: "proxy", expiring: false }],
  postTextFull: BAI,
  roiDanhSach: null,
}
// Cloud: tên, SĐT có (cột trong CLOUD_ALLOW); nhóm, ảnh, chữ bài ở lại máy thu.
const CLOUD: DealRow = { ...DEAL, groupName: null, images: [], postTextFull: null }

const g = globalThis as unknown as { __SHS_NGUOI: User | null; __SHS_DEALS: DealRow[]; __SHS_MAY_THU: boolean }
const user = (role: string) => ({ id: `usr_${role}`, email: `${role}@local.test`, plan: "free", role }) as User
const thuMuc = join(APP, "tests", `.shs-deals-${process.pid}`)
after(() => rmSync(thuMuc, { recursive: true, force: true }))

const STUB: [string, string][] = [
  [`import { getSessionUser } from "@/lib/auth";`, `const getSessionUser = async () => (globalThis as unknown as { __SHS_NGUOI: unknown }).__SHS_NGUOI as never;`],
  [`import { dealHang, dealTheoVai, getDeals } from "@/lib/deals";`, `import { dealHang, dealTheoVai } from "@/lib/deals";\nconst getDeals = async (..._a: unknown[]) => { const t = globalThis as unknown as { __SHS_DEALS: never[]; __SHS_MAY_THU: boolean }; return { rows: t.__SHS_DEALS, mayThu: t.__SHS_MAY_THU } };`],
]
type PageMod = { default: (p: unknown) => Promise<ReactElement> }
let soBan = 0
async function banChep(doi: [string, string][] = []): Promise<PageMod> {
  let src = readFileSync(join(APP, PAGE), "utf8")
  for (const [tu, thanh] of [...STUB, ...doi]) {
    assert.ok(src.includes(tu), `bản chép không áp được: ${tu}`)
    src = src.replace(tu, thanh)
  }
  mkdirSync(thuMuc, { recursive: true })
  const f = join(thuMuc, `ban-${++soBan}.tsx`)
  // Thư mục test dựng JSX kiểu cũ (React.createElement) — bản chép cần React trong phạm vi.
  writeFileSync(f, `import React from "react"\n${src}`)
  return import(pathToFileURL(f).href) as Promise<PageMod>
}
/** Chạy phần máy chủ: DealsContent async được gọi; Suspense và ranh giới lỗi bóc đi vì renderToStaticMarkup dựng đồng bộ. */
async function moRong(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(moRong))
  if (!isValidElement(node)) return node
  const props = node.props as { children?: ReactNode }
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") return moRong(await (node.type as (p: unknown) => Promise<ReactNode>)(props))
  if (node.type === Suspense || node.type === RegionError) return moRong(props.children)
  if (props.children === undefined) return node
  return cloneElement(node as ReactElement<{ children?: ReactNode }>, undefined, await moRong(props.children))
}
const json = (x: unknown) => JSON.stringify(x, (k, v) => (k.startsWith("_") || typeof v === "function" || (k === "type" && typeof v !== "string") ? undefined : v))
async function qua(mod: PageMod, role: string, deals: DealRow[] = [DEAL], mayThu = true) {
  RegionError ??= (await RegionErrorP).RegionError
  g.__SHS_NGUOI = user(role)
  g.__SHS_DEALS = deals
  g.__SHS_MAY_THU = mayThu
  const cay = await moRong(await mod.default({ searchParams: Promise.resolve({}) }))
  return { html: renderToStaticMarkup(cay as ReactElement), json: json(cay) }
}

test("SHS-AC-6 ma trận ba vai và bản cloud qua page thật", async () => {
  const mod = await banChep()
  for (const role of ["ops", "admin"]) {
    const v = await qua(mod, role)
    assert.ok(v.html.includes(TEN) && v.html.includes('href="tel:+84912345678"') && v.html.includes("0912 345 678"), `SHS-AC-6 ${role} không thấy liên hệ`)
    assert.ok(v.html.includes("<img") && v.json.includes(BAI) && v.json.includes(NHOM), `SHS-AC-6 ${role} mất ảnh, chữ bài hay nhóm`)
    assert.doesNotMatch(v.html, /chỉ có ở máy thu/)
  }
  const viewer = await qua(mod, "viewer")
  for (const s of [viewer.html, viewer.json]) {
    assert.equal(demSo(s), 0, "SHS-AC-6 viewer nhận số")
    assert.ok(!s.includes(TEN) && !s.includes(NHOM) && !s.includes("tel:") && !s.includes(BAI) && !s.includes("zalo-media"), "SHS-AC-6 viewer nhận trường liên hệ")
  }
  assert.ok(viewer.html.includes("Phường Thử"), "SHS-AC-6 viewer mất thẻ tin")

  for (const role of ["ops", "admin"]) {
    const cloud = await qua(mod, role, [CLOUD], false)
    assert.ok(cloud.html.includes("tel:+84912345678") && cloud.html.includes(TEN), "SHS-AC-6 cloud mất liên hệ")
    assert.ok(!cloud.html.includes("<img") && !cloud.json.includes(BAI), "SHS-AC-6 cloud có ảnh hay chữ bài")
    assert.match(cloud.html, /chỉ có ở máy thu/, "SHS-AC-6 chú thích cloud")
  }
  const viewerCloud = await qua(mod, "viewer", [CLOUD], false)
  assert.equal(demSo(viewerCloud.json), 0, "SHS-AC-6 viewer cloud nhận số")
})

test("SHS-AC-6 đối chứng đỏ: lọc theo isAdmin; bỏ lọc viewer", async () => {
  const theoAdmin = await banChep([["const xemNoiDung = xemNoiDungTin(user);", `const xemNoiDung = user.role === "admin";`]])
  const ops = await qua(theoAdmin, "ops")
  assert.throws(() => assert.ok(ops.html.includes("tel:+84912345678"), "SHS-AC-6 ops không thấy liên hệ"), /SHS-AC-6 ops không thấy liên hệ/)
  const boLoc = await banChep([["dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })", "dealHang(d, { xemNoiDung, mayThu })"]])
  const viewer = await qua(boLoc, "viewer")
  assert.throws(() => assert.equal(demSo(viewer.json), 0, "SHS-AC-6 viewer nhận số"), /SHS-AC-6 viewer nhận số/)
})

test("SHS-AC-8 fmtPhone: số gốc E.164 và dạng 0… đều tách nhóm", () => {
  assert.equal(fmtPhone("+84912345678"), "0912 345 678")
  assert.equal(fmtPhone("0912345678"), "0912 345 678")
  // Đối chứng đỏ: khuôn đời trước chỉ nhận 0…, số +84… ra nguyên khối.
  const cu = (p: string) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3")
  assert.throws(() => assert.equal(cu("+84912345678"), "0912 345 678", "SHS-AC-8 fmtPhone"), /SHS-AC-8 fmtPhone/)
})

// S4 r1 E12: deadlock ở máy thu bị nuốt thành bản cloud, trang đủ thẻ mà mất liên hệ. Pool thay bằng stub, không chạm DB.
async function goiDeals(mod: { getDeals: () => Promise<unknown> }, code: string, t: TestContext) {
  const { pool } = await import("../src/lib/db")
  const cauLenh: string[] = []
  const q = t.mock.method(pool, "query", (async (sql: string) => {
    // CG9: câu hỏi «bảng hạng giá có chưa» (coBangHang) không thuộc dãy câu đọc — trả «chưa có» để đọc theo thước CG8.
    if (sql.includes("to_regclass('public.offer_price_rank')")) return { rows: [{ co: false }] }
    cauLenh.push(sql)
    if (cauLenh.length === 1) throw Object.assign(new Error("lỗi thử"), { code })
    return { rows: [] }
  }) as never)
  try {
    return { kq: await mod.getDeals().then(() => "rơi", () => "ném"), cauLenh }
  } finally {
    q.mock.restore()
  }
}

test("SHS-AC-6 getDeals chỉ rơi về bản cloud khi thiếu lược đồ máy thu; lỗi khác ném tiếp", async (t) => {
  const that = await import("../src/lib/deals")
  for (const code of ["42P01", "42703"]) {
    const { kq, cauLenh } = await goiDeals(that, code, t)
    assert.equal(kq, "rơi", `SHS-AC-6 ${code} phải rơi về bản cloud`)
    assert.deepEqual(cauLenh, [that.dealsSql(), that.dealsSql({ cloud: true })], `SHS-AC-6 ${code} sai câu truy vấn`)
  }
  for (const code of ["40P01", "55P03", "57P01"]) {
    const { kq, cauLenh } = await goiDeals(that, code, t)
    assert.equal(kq, "ném", `SHS-AC-6 ${code} bị nuốt thành bản cloud`)
    assert.equal(cauLenh.length, 1, `SHS-AC-6 ${code} vẫn gọi bản cloud`)
  }

  // Đối chứng đỏ: bản chép bỏ lọc mã (catch trần đời trước) nuốt deadlock.
  const goc = readFileSync(join(APP, "src/lib/deals.ts"), "utf8")
  const tu = `    if (!thieuLuocDo(e)) throw e;\n    const { rows } = await pool.query(sql({ cloud: true, coBang }), values);`
  assert.ok(goc.includes(tu), "đột biến không áp được")
  mkdirSync(thuMuc, { recursive: true })
  const f = join(thuMuc, "deals-cu.ts")
  writeFileSync(f, goc.replace(tu, `    const { rows } = await pool.query(sql({ cloud: true, coBang }), values);`).replace(/from "\.\/([\w./-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(APP, `src/lib/${ten}.ts`)).href}"`))
  const cu = (await import(pathToFileURL(f).href)) as typeof that
  const { kq } = await goiDeals(cu, "40P01", t)
  assert.throws(() => assert.equal(kq, "ném", "SHS-AC-6 40P01 bị nuốt thành bản cloud"), /SHS-AC-6 40P01 bị nuốt/)
})
