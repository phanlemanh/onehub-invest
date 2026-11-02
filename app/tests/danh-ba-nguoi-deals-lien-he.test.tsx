// danh-ba-nguoi-deals-lien-he.test.tsx — hồ sơ _acceptance/people-hien-so-goc, ca «SHS-AC-6»: /ops/deals qua page thật (bản
// chép thay getSessionUser và getDeals), ma trận ba vai và bản cloud. Vai Vận hành thấy liên hệ, không ảnh và chữ bài; vai
// Người xem không nhận trường liên hệ nào, cả trong cây phần tử. Số, tên, nhóm trong ca đều bịa.
import { after, test, type TestContext } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import type { User } from "../src/lib/auth"
import type { DealRow } from "../src/lib/deals"
import { fmtPhone } from "../src/lib/ops/people"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PAGE = "src/app/ops/deals/page.tsx"
const QUET_SO = /(?<![\da-zA-Z])(?:\+?84[35789]\d{8}|0[35789]\d{8}|0[35789]\d{2}[ .-]?\d{3}[ .-]?\d{3})(?![\da-zA-Z])/g
const demSo = (s: string) => s.match(QUET_SO)?.length ?? 0

const TEN = "Người Bán Shs"
const NHOM = "Nhóm Bán Nhà Shs"
const BAI = "Chữ bài của tin thử shs"
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
  mediaPath: "/thu/anh-shs.jpg",
  mediaUrl: null,
  postText: BAI,
  brokerNAds: 3,
  brokerMedianGap: 10,
}
const CLOUD: DealRow = { ...DEAL, sellerName: null, sellerPhone: null, groupName: null, mediaPath: null, mediaUrl: null, postText: null, brokerNAds: null, brokerMedianGap: null }

const g = globalThis as unknown as { __SHS_NGUOI: User | null; __SHS_DEALS: DealRow[] }
const user = (role: string) => ({ id: `usr_${role}`, email: `${role}@local.test`, plan: "free", role }) as User
const thuMuc = join(APP, "tests", `.shs-deals-${process.pid}`)
after(() => rmSync(thuMuc, { recursive: true, force: true }))

const STUB: [string, string][] = [
  [`import { getSessionUser } from "@/lib/auth";`, `const getSessionUser = async () => (globalThis as unknown as { __SHS_NGUOI: unknown }).__SHS_NGUOI as never;`],
  [`import { dealTheoVai, getDeals } from "@/lib/deals";`, `import { dealTheoVai } from "@/lib/deals";\nconst getDeals = async (..._a: unknown[]) => (globalThis as unknown as { __SHS_DEALS: never[] }).__SHS_DEALS;`],
]
type PageMod = { default: () => Promise<ReactElement> }
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
async function qua(mod: PageMod, role: string, deals: DealRow[] = [DEAL]) {
  g.__SHS_NGUOI = user(role)
  g.__SHS_DEALS = deals
  const cay = await mod.default()
  return { html: renderToStaticMarkup(cay), json: JSON.stringify(cay) }
}

test("SHS-AC-6 ma trận ba vai và bản cloud qua page thật", async () => {
  const mod = await banChep()
  const ops = await qua(mod, "ops")
  assert.ok(ops.html.includes(TEN) && ops.html.includes(NHOM), "SHS-AC-6 ops không thấy liên hệ")
  assert.ok(ops.html.includes('href="tel:+84912345678"') && ops.html.includes("0912 345 678"), "SHS-AC-6 ops không thấy liên hệ")
  for (const s of [ops.html, ops.json]) assert.ok(!s.includes("<img") && !s.includes(BAI) && !s.includes("anh-shs"), "SHS-AC-6 ops thấy ảnh hay chữ bài")

  const admin = await qua(mod, "admin")
  assert.ok(admin.html.includes(TEN) && admin.html.includes("tel:+84912345678"), "SHS-AC-6 admin mất liên hệ")
  assert.ok(admin.html.includes("<img") && admin.html.includes(BAI), "SHS-AC-6 admin mất ảnh hay chữ bài")

  const viewer = await qua(mod, "viewer")
  for (const s of [viewer.html, viewer.json]) {
    assert.equal(demSo(s), 0, "SHS-AC-6 viewer nhận số")
    assert.ok(!s.includes(TEN) && !s.includes(NHOM) && !s.includes("tel:") && !s.includes(BAI), "SHS-AC-6 viewer nhận trường liên hệ")
  }
  assert.ok(viewer.html.includes("Phường Thử"), "SHS-AC-6 viewer mất thẻ tin")

  for (const role of ["ops", "admin"]) {
    const cloud = await qua(mod, role, [CLOUD])
    assert.ok(!cloud.html.includes("tel:") && demSo(cloud.html) === 0, "SHS-AC-6 cloud có liên hệ")
    assert.match(cloud.html, /chỉ có ở máy thu/, "SHS-AC-6 chú thích cloud")
  }
  assert.match((await qua(mod, "viewer")).html, /chỉ có ở máy thu/, "SHS-AC-6 chú thích viewer")
  // Đối chứng dương: chú thích máy thu đổi khi vai Vận hành có số thật.
  assert.doesNotMatch(ops.html, /chỉ có ở máy thu/)
})

test("SHS-AC-6 đối chứng đỏ: lọc theo isAdmin; bỏ lọc viewer", async () => {
  const theoAdmin = await banChep([["const showContact = xemNoiDungTin(user);", "const showContact = isAdmin(user);"]])
  const ops = await qua(theoAdmin, "ops")
  assert.throws(() => assert.ok(ops.html.includes("tel:+84912345678"), "SHS-AC-6 ops không thấy liên hệ"), /SHS-AC-6 ops không thấy liên hệ/)
  const boLoc = await banChep([["const rows = tho.map((d) => dealTheoVai(d, { lienHe: showContact, noiDung: isAdmin(user) }));", "const rows = tho;"]])
  const viewer = await qua(boLoc, "viewer")
  assert.equal(viewer.html.includes("tel:"), false, "bỏ lọc: thẻ vẫn không vẽ khối liên hệ, chỉ cây phần tử mang số")
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
async function goiDeals(mod: { getDeals: () => Promise<unknown[]> }, code: string, t: TestContext) {
  const { pool } = await import("../src/lib/db")
  const cauLenh: string[] = []
  const q = t.mock.method(pool, "query", (async (sql: string) => {
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
  const tu = `    if (!THIEU_LUOC_DO_MAY_THU.has((e as { code?: string }).code ?? "")) throw e;\n`
  assert.ok(goc.includes(tu), "đột biến không áp được")
  mkdirSync(thuMuc, { recursive: true })
  const f = join(thuMuc, "deals-cu.ts")
  writeFileSync(f, goc.replace(tu, "").replace(`from "./db"`, `from "${pathToFileURL(join(APP, "src/lib/db.ts")).href}"`))
  const cu = (await import(pathToFileURL(f).href)) as typeof that
  const { kq } = await goiDeals(cu, "40P01", t)
  assert.throws(() => assert.equal(kq, "ném", "SHS-AC-6 40P01 bị nuốt thành bản cloud"), /SHS-AC-6 40P01 bị nuốt/)
})
