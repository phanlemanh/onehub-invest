// labels-nhom.test.tsx — hồ sơ _acceptance/gan-nhan-theo-nhom-s03 (GC0), ca «GCN-AC-n». Ma trận viết trước, số assert bằng số
// phần tử. Phần chuẩn hoá không DB; phần route dùng lược đồ tạm, migration 054 + 072 thật, handler thật.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"
import type { ReactNode } from "react"
import { JSDOM } from "jsdom"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"
import {
  chuanHoaLuot,
  coTrongChu,
  LABEL_FIELDS,
  LABEL_FIELDS_NHOM,
  MSG_CAN_CU,
  MSG_SDT,
  veE164,
  type LabelField,
  type RawCell,
  type RawLabels,
} from "../src/lib/labels-normalize"

/** Bản chép một tệp nguồn của app sang thư mục tạm, đổi đúng một chỗ: chiều đỏ của phép đo. Import trỏ về tệp thật. */
async function banDot<T>(tep: string, tu: string, thanh: string): Promise<T> {
  const goc = readFileSync(join(APP, tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const giai = (ten: string) => {
    if (!ten.startsWith(".") && !ten.startsWith("@/")) return ten
    const g = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
    const f = [".ts", ".tsx", "/index.ts", "/index.tsx", ""].map((d) => g + d).find((x) => existsSync(x) && !statSync(x).isDirectory())
    return pathToFileURL(f ?? g).href
  }
  const dot = goc.replace(tu, thanh).replace(/from "([^"]+)"/g, (_m, ten: string) => `from "${giai(ten)}"`)
  const f = join(APP, "tests", `.gcn-dot-${process.pid}-${tep.split("/").pop()}`)
  writeFileSync(f, dot)
  try {
    return (await import(pathToFileURL(f).href)) as T
  } finally {
    rmSync(f, { force: true })
  }
}

/** jsdom cho các ca bấm trên màn thật, gỡ khỏi global sau mỗi ca để các ca render tĩnh giữ nguyên. */
async function dungDom() {
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/ops/labels", pretendToBeVisual: true })
  const them: Record<string, unknown> = {
    window: dom.window, self: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0), cancelAnimationFrame: (id: number) => clearTimeout(id),
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window), MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  }
  const cu = Object.fromEntries(Object.keys(them).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]))
  const cuNav = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  Object.assign(globalThis, them)
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  let root: { unmount: () => void; render: (n: ReactNode) => void } | null = null
  return {
    render: async (node: ReactNode) => {
      root = createRoot(document.getElementById("root")!, { onCaughtError() {}, onUncaughtError() {} })
      await React.act(async () => root!.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>))
      return document.getElementById("root")!
    },
    bam: async (chu: string) => {
      const nut = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === chu)
      assert.ok(nut, `không thấy nút ${chu}`)
      await React.act(async () => { nut.click(); await new Promise((r) => setTimeout(r, 20)) })
    },
    cho: async (dk: () => boolean) => {
      for (let i = 0; i < 100 && !dk(); i++) await React.act(async () => { await new Promise((r) => setTimeout(r, 30)) })
    },
    go: async (id: string, giaTri: string) => {
      const o = document.getElementById(id) as HTMLTextAreaElement
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!.call(o, giaTri)
        o.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
      })
    },
    xong: async () => {
      if (root) await React.act(async () => root!.unmount())
      for (const [k, d] of Object.entries(cu)) {
        if (d) Object.defineProperty(globalThis, k, d)
        else delete (globalThis as Record<string, unknown>)[k]
      }
      if (cuNav) Object.defineProperty(globalThis, "navigator", cuNav)
    },
  }
}

const S = `gcn_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const LAT = "gcn-thu"
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".sale_offers (LIKE public.sale_offer_records INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".silver_labels (LIKE public.silver_labels INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".collection_units (LIKE public.collection_units INCLUDING DEFAULTS)`)
  await sc.connect()
  for (const m of ["054_labels.sql", "072_labels_nhom.sql", "073_labels_nhom_sua.sql"]) await sc.query(readFileSync(join(APP, "../db/migrations", m), "utf8"))
})

after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

/** Hai nhóm: U-A bốn bài (i4 gắn trùng), U-B hai bài. Mỗi bài chứa đủ giá trị «chữ bài» của DU. */
async function datLat() {
  await sc.query(`TRUNCATE eval_labels, eval_label_reasons, eval_label_cases, eval_label_items RESTART IDENTITY CASCADE`)
  await sc.query(`TRUNCATE stg_zalo_posts, sale_offers, silver_labels, collection_units`)
  const BAI: [number, string, boolean][] = [[1, "U-A", false], [2, "U-A", false], [3, "U-A", false], [4, "U-A", true], [5, "U-B", false], [6, "U-B", false]]
  for (const [i, nhom, trung] of BAI) {
    await sc.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, $2, $3, $4, now())`,
      [`zalo-gcn-${i}`, `hcm__zalo__gcn${i}`, `Nhóm ${nhom}`, `${CHU} tin ${i}`])
    await sc.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'dev', $4, 'thu', $5)`,
      [LAT, `zalo-gcn-${i}`, `h${i}`, trung, nhom])
  }
}
const postNhan = (cookie: string, item: number, values: unknown, reason?: string) =>
  new Request("http://localhost/api/v1/ops/labels", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ lat: LAT, item_id: item, values, reason }),
  })

// Câu hợp đồng, ghim nguyên văn ở đây: không nhập hằng từ chính code đang kiểm.
const MSG_THIEU_LY_DO = "Có trường không từ chữ bài — ghi lý do"
const MSG_KHONG_TRONG_CHU = "Chữ bài không có giá trị này — chọn căn cứ khác"
const CHU = "Bán căn 2PN S5.03 trục 12 phân khu Rainbow, Vinhomes Grand Park, 64,5m2, giá 4,35 tỷ"
const chu = (value: string): RawCell => ({ value, basis: "chu_bai" })
const DU: RawLabels = {
  listing_intent: chu("offer"),
  kind: chu("sale"),
  property_type: chu("apartment"),
  multi_unit: { value: "no" },
  project: chu("Vinhomes Grand Park"),
  subzone: chu("Rainbow"),
  building: chu("S5.03"),
  stack: chu("12"),
  floor: { not_stated: true },
  bedrooms: chu("2"),
  bedrooms_plus: chu("no"),
  bathrooms: { not_stated: true },
  area_m2: chu("64,5"),
  price_min_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" },
  price_max_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" },
  seller_name: { not_stated: true },
  seller_phone: chu("0912 345 678"),
}

type Ca = { ten: string; doi: RawLabels; text?: string; reason?: unknown; loi?: [LabelField | "reason", string]; ky?: [LabelField, string | null, string | null] }
const MA_TRAN: Ca[] = [
  { ten: "toan chu bai khong ly do", doi: {}, ky: ["project", "vinhomes grand park", "chu_bai"] },
  { ten: "ngu canh nhom ly do trong", doi: { project: { value: "Ocean Park", basis: "ngu_canh_nhom" } }, loi: ["reason", MSG_THIEU_LY_DO] },
  { ten: "kien thuc nghe ly do chi khoang trang", doi: { area_m2: { value: "59", basis: "kien_thuc_nghe" } }, reason: "   ", loi: ["reason", MSG_THIEU_LY_DO] },
  { ten: "khong suy ra duoc basis rong", doi: { project: { not_stated: true, basis: "chu_bai" } }, ky: ["project", null, null] },
  { ten: "can cu la", doi: { kind: { value: "sale", basis: "doan" } }, loi: ["kind", MSG_CAN_CU] },
  { ten: "thieu can cu", doi: { kind: { value: "sale" } }, loi: ["kind", MSG_CAN_CU] },
  { ten: "sdt sai khuon", doi: { seller_phone: chu("0123 456") }, loi: ["seller_phone", MSG_SDT] },
  { ten: "sdt dau 02", doi: { seller_phone: chu("0212345678") }, loi: ["seller_phone", MSG_SDT] },
  { ten: "wc chu", doi: { bathrooms: chu("hai") }, loi: ["bathrooms", "WC phải là số nguyên không âm"] },
  { ten: "sdt ve e164", doi: {}, ky: ["seller_phone", "+84912345678", "chu_bai"] },
  { ten: "rainbow ngu canh nhom co ly do", doi: { subzone: { value: "Rainbow", basis: "ngu_canh_nhom" } }, text: "Bán RB 2PN S5.03 trục 12 Vinhomes Grand Park 64,5m2", reason: "RB = Rainbow", ky: ["subzone", "rainbow", "ngu_canh_nhom"] },
  { ten: "du an chu bai khong co", doi: { project: chu("Ocean Park") }, loi: ["project", MSG_KHONG_TRONG_CHU] },
  { ten: "phan khu chu bai khong co", doi: { subzone: chu("Sapphire") }, loi: ["subzone", MSG_KHONG_TRONG_CHU] },
  { ten: "toa chu bai khong co", doi: { building: chu("S10.05") }, loi: ["building", MSG_KHONG_TRONG_CHU] },
  { ten: "truc chu bai khong co", doi: { stack: chu("99") }, loi: ["stack", MSG_KHONG_TRONG_CHU] },
  { ten: "dien tich chu bai khong co", doi: { area_m2: chu("59") }, loi: ["area_m2", MSG_KHONG_TRONG_CHU] },
  { ten: "bai chu rong chu bai bi tu choi", doi: {}, text: "", loi: ["project", MSG_KHONG_TRONG_CHU] },
  { ten: "bai chu rong khong suy ra va ngu canh", text: "", reason: "chỉ có ảnh", doi: { project: { value: "Ocean Park", basis: "ngu_canh_nhom" }, subzone: { not_stated: true }, building: { not_stated: true }, stack: { not_stated: true }, area_m2: { not_stated: true } }, ky: ["project", "ocean park", "ngu_canh_nhom"] },
  { ten: "unicode va chu hoa", doi: { subzone: chu("RAINBOW"), area_m2: chu("34") }, text: "𝟑𝟒𝐦² S5.03 trục 12 rainbow Vinhomes Grand Park", ky: ["subzone", "rainbow", "chu_bai"] },
  { ten: "nhieu can khong nhan khong suy ra", doi: { multi_unit: { not_stated: true } }, loi: ["multi_unit", "Chọn Không hoặc Có"] },
  { ten: "nhieu can luon basis rong", doi: { multi_unit: { value: "yes", basis: "chu_bai" } }, ky: ["multi_unit", "yes", null] },
]

test("GCN-AC-4 ma trận chuẩn hoá: mỗi ca đúng ô, đúng thông điệp, đọc ra đúng giá trị và căn cứ", () => {
  let so = 0
  for (const c of MA_TRAN) {
    const kq = chuanHoaLuot({ ...DU, ...c.doi }, { text: c.text ?? CHU, reason: c.reason })
    if (c.loi) {
      assert.equal(kq.ok, false, c.ten)
      if (!kq.ok) assert.equal(kq.loi[c.loi[0]], c.loi[1], `${c.ten}: ${JSON.stringify(kq.loi)}`)
    } else {
      assert.ok(kq.ok, `${c.ten}: ${JSON.stringify(kq)}`)
      if (kq.ok) {
        assert.equal(kq.rows.length, 17, c.ten)
        const r = kq.rows.find((x) => x.field === c.ky![0])!
        assert.deepEqual([r.value, r.basis], [c.ky![1], c.ky![2]], c.ten)
      }
    }
    so++
  }
  assert.equal(so, MA_TRAN.length)
  assert.equal(MA_TRAN.length, 21)
})

test("GCN-AC-4 lý do: khoảng trắng về null khi toàn chữ bài, cắt khoảng trắng khi có chữ", () => {
  const trong = chuanHoaLuot(DU, { text: CHU, reason: "  " })
  assert.ok(trong.ok && trong.reason === null)
  const co = chuanHoaLuot(DU, { text: CHU, reason: " RB = Rainbow " })
  assert.ok(co.ok && co.reason === "RB = Rainbow")
})

test("GCN-AC-4 lỗi không ghi nửa chừng: có lỗi thì không trả dòng nào", () => {
  const kq = chuanHoaLuot({ ...DU, project: chu("Ocean Park"), bathrooms: chu("hai") }, { text: CHU })
  assert.equal(kq.ok, false)
  if (!kq.ok) assert.deepEqual(Object.keys(kq.loi).sort(), ["bathrooms", "project"])
  assert.equal("rows" in kq, false)
})

test("GCN-AC-4 coTrongChu: ranh giới số và chữ, dấu, thập phân", () => {
  const CA: [string, string, boolean][] = [
    ["12", "trục 12 đẹp", true],
    ["12", "giá 120 triệu", false],
    ["12", "S5.12", true],
    ["03", "toà S5.03", true],
    ["15", "Bán 2 căn trục 12,15", true],
    ["12", "Bán 2 căn trục 12,15", true],
    ["59", "DT 59,64,70m2", true],
    ["64", "DT 59,64,70m2", true],
    ["70", "DT 59,64,70m2", true],
    ["5", "64,5 m2", false],
    ["13", "trục 12,15", false],
    ["59", "59m2", true],
    ["59", "590 triệu", false],
    ["64.5", "64,50 m2", true],
    ["64", "64,5 m2", false],
    ["park", "có parking", false],
    ["grand park", "Vinhomes GRAND  PARK", true],
    ["thành đô", "Thanh Do", true],
    ["s5.03", "toà S5.03-12", true],
    ["rainbow", "", false],
  ]
  for (const [v, t, ky] of CA) assert.equal(coTrongChu(v, t), ky, `${v} trong «${t}»`)
})

test("GCN-AC-4 veE164: cùng luật extractPhones", () => {
  const CA: [string, string | null][] = [
    ["0912 345 678", "+84912345678"],
    ["091.234.5678", "+84912345678"],
    ["+84 912 345 678", "+84912345678"],
    ["84912345678", "+84912345678"],
    ["(091) 234-5678", "+84912345678"],
    ["0212345678", null],
    ["091234567", null],
    ["09123456789", null],
    ["gọi 0912345678", null],
  ]
  for (const [s, ky] of CA) assert.equal(veE164(s), ky, s)
})

test("GCN-AC-9 lát đời trước: chín trường, không căn cứ, không lý do, câu cũ", () => {
  assert.equal(LABEL_FIELDS.length, 9)
  assert.equal(LABEL_FIELDS_NHOM.length, 17)
  for (const f of LABEL_FIELDS) assert.ok((LABEL_FIELDS_NHOM as readonly string[]).includes(f), f)
  const cu: RawLabels = Object.fromEntries(LABEL_FIELDS.map((f) => [f, { not_stated: true }]))
  const kq = chuanHoaLuot(cu)
  assert.ok(kq.ok && kq.rows.length === 9 && kq.reason === null && kq.rows.every((r) => r.basis === null))
  const thieu = chuanHoaLuot({ ...cu, kind: {} })
  assert.ok(!thieu.ok && /Tin không nêu/.test(thieu.loi.kind!))
})

test("GCN-AC-3 luu 17 truong va ly do: 17 dòng mang căn cứ, một dòng lý do, tiến độ của nhóm tăng", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const { nhomCuaLat, tienDo } = await import("../src/lib/labels-queries")
  assert.equal((await tienDo(a.id, LAT, sc, "U-A")).cuaToi, 0)
  const res = await POST(postNhan(a.cookie, 1, { ...DU, project: { value: "Ocean Park", basis: "ngu_canh_nhom" } }, "nhóm mặc định"))
  assert.equal(res.status, 200, await res.clone().text())
  const { rows } = await sc.query(`SELECT field, value, not_stated, basis, labeler_id FROM eval_labels WHERE item_id = 1`)
  assert.equal(rows.length, 17)
  assert.ok(rows.every((r) => r.labeler_id === a.id))
  const theo = Object.fromEntries(rows.map((r) => [r.field, r]))
  assert.deepEqual([theo.project.value, theo.project.basis], ["ocean park", "ngu_canh_nhom"])
  assert.deepEqual([theo.seller_phone.value, theo.seller_phone.basis], ["+84912345678", "chu_bai"])
  assert.deepEqual([theo.floor.not_stated, theo.floor.basis], [true, null])
  assert.equal(theo.multi_unit.basis, null)
  const { rows: ld } = await sc.query(`SELECT reason, labeler_id FROM eval_label_reasons WHERE item_id = 1`)
  assert.deepEqual(ld, [{ reason: "nhóm mặc định", labeler_id: a.id }])
  assert.equal((await tienDo(a.id, LAT, sc, "U-A")).cuaToi, 1)
  assert.equal((await tienDo(a.id, LAT, sc, "U-B")).cuaToi, 0)
  const nhom = await nhomCuaLat(a.id, LAT, sc)
  assert.deepEqual(nhom.map((n) => [n.unitCode, n.ten, n.tong, n.cuaToi]), [["U-A", "Nhóm U-A", 4, 1], ["U-B", "Nhóm U-B", 2, 0]])
})

test("GCN-AC-4 route: lỗi trả 400 đúng ô và 0 dòng; toàn chữ bài không lý do 200; Rainbow kèm lý do đọc lại đúng", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const dem = async () => (await sc.query(`SELECT (SELECT count(*) FROM eval_labels)::int + (SELECT count(*) FROM eval_label_reasons)::int AS n`)).rows[0].n
  const SAI: [string, RawLabels, string, string][] = [
    ["thiếu lý do", { project: { value: "Ocean Park", basis: "ngu_canh_nhom" } }, "reason", MSG_THIEU_LY_DO],
    ["căn cứ lạ", { kind: { value: "sale", basis: "doan" } }, "kind", MSG_CAN_CU],
    ["SĐT sai", { seller_phone: chu("123") }, "seller_phone", MSG_SDT],
    ["không có trong chữ", { project: chu("Ocean Park") }, "project", MSG_KHONG_TRONG_CHU],
  ]
  for (const [ten, doi, o, msg] of SAI) {
    const res = await POST(postNhan(a.cookie, 1, { ...DU, ...doi }))
    assert.equal(res.status, 400, ten)
    assert.equal(((await res.json()) as { loi: Record<string, string> }).loi[o], msg, ten)
    assert.equal(await dem(), 0, `${ten}: không được ghi dòng nào`)
  }
  assert.equal((await POST(postNhan(a.cookie, 1, DU))).status, 200)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_reasons`)).rows[0].n, 0, "toàn chữ bài không có dòng lý do")
  const res = await POST(postNhan(a.cookie, 2, { ...DU, subzone: { value: "Rainbow", basis: "ngu_canh_nhom" } }, "RB = Rainbow"))
  assert.equal(res.status, 200)
  const { rows } = await sc.query(`SELECT value, basis FROM eval_labels WHERE item_id = 2 AND field = 'subzone'`)
  assert.deepEqual(rows, [{ value: "rainbow", basis: "ngu_canh_nhom" }])
  // Đối chứng: POST thứ hai cùng người trên cùng bài vẫn 409.
  assert.equal((await POST(postNhan(a.cookie, 2, DU))).status, 409)
})

test("GCN-AC-3 loi giua giao dich: một dòng hỏng thì cả lượt không ghi gì, cả nhãn lẫn lý do", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { ghiNhan } = await import("../src/lib/labels-queries")
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  const hong = [...ch.rows, { field: "khong_co" as LabelField, value: "x", not_stated: false, basis: null }]
  const c = new pg.Client({ connectionString: schemaUrl(S) })
  await c.connect()
  try {
    await assert.rejects(ghiNhan(c, a.id, LAT, 1, hong, "lý do"))
    // Đối chứng cùng client: bản không hỏng ghi được.
    assert.deepEqual(await ghiNhan(c, a.id, LAT, 2, ch.rows, "lý do"), { ok: true })
  } finally {
    await c.end()
  }
  const dem = async (b: string, i: number) => (await sc.query(`SELECT count(*)::int AS n FROM ${b} WHERE item_id = $1`, [i])).rows[0].n
  assert.deepEqual([await dem("eval_labels", 1), await dem("eval_label_reasons", 1)], [0, 0])
  assert.deepEqual([await dem("eval_labels", 2), await dem("eval_label_reasons", 2)], [17, 1])
})

test("GCN-AC-3 tin ke cung nhom: chỉ trả bài của nhóm chọn; nhóm hết thì null; không nhóm thì như cũ", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { ghiNhan, tinKe } = await import("../src/lib/labels-queries")
  assert.equal((await tinKe(a.id, LAT, sc, "U-B"))?.itemId, 5)
  assert.equal((await tinKe(a.id, LAT, sc, "U-A"))?.itemId, 1)
  assert.equal((await tinKe(a.id, LAT, sc))?.itemId, 1)
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  await ghiNhan(sc, a.id, LAT, 5, ch.rows)
  assert.equal((await tinKe(a.id, LAT, sc, "U-B"))?.itemId, 6)
  await ghiNhan(sc, a.id, LAT, 6, ch.rows)
  assert.equal(await tinKe(a.id, LAT, sc, "U-B"), null)
  assert.equal(await tinKe(a.id, LAT, sc, "U-KHAC"), null)
})

test("GCN-AC-10 nhomCuaLat: bài trùng đã gắn còn thiếu người hai tính vào chờ; lát cũ trả rỗng", async () => {
  await datLat()
  const [a, b] = [await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops")]
  const { ghiNhan, nhomCuaLat } = await import("../src/lib/labels-queries")
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  await ghiNhan(sc, a.id, LAT, 4, ch.rows)
  await ghiNhan(sc, b.id, LAT, 1, ch.rows)
  const uA = (await nhomCuaLat(a.id, LAT, sc)).find((n) => n.unitCode === "U-A")!
  // Tin 1 đã do B gắn, tin đơn nên hết chỗ: không còn cho A, cũng không phải bài của A.
  assert.deepEqual([uA.tong, uA.cuaToi, uA.conChoToi, uA.choNguoiHai], [4, 1, 2, 1])
  await sc.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ('lat-cu', 'S03', 'zalo-gcn-1', 'hc', 'dev', false, 'thu')`)
  assert.deepEqual(await nhomCuaLat(a.id, "lat-cu", sc), [])
})

test("GCN-AC-3 hai nguoi cung luc: một 200, một 409; lý do của người sau không ghi", async () => {
  await datLat()
  const [a, b] = [await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops")]
  const { ghiNhan } = await import("../src/lib/labels-queries")
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  const c1 = new pg.Client({ connectionString: schemaUrl(S) })
  const c2 = new pg.Client({ connectionString: schemaUrl(S) })
  await c1.connect()
  await c2.connect()
  try {
    const kq = await Promise.all([ghiNhan(c1, a.id, LAT, 2, ch.rows, "lý do A"), ghiNhan(c2, b.id, LAT, 2, ch.rows, "lý do B")])
    assert.deepEqual(kq.map((k) => (k.ok ? 200 : k.status)).sort(), [200, 409])
    const { rows } = await sc.query(`SELECT labeler_id, reason FROM eval_label_reasons WHERE item_id = 2`)
    assert.equal(rows.length, 1, "chỉ người thắng có lý do")
    const thang = kq[0].ok ? a : b
    assert.equal(rows[0].labeler_id, thang.id)
  } finally {
    await c1.end()
    await c2.end()
  }
})

test("GCN-AC-9 lát đời trước qua route: bài không stratum nhận chín trường, 9 dòng, basis NULL, không lý do", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  await sc.query(`UPDATE eval_label_items SET stratum = NULL WHERE item_id = 3`)
  const cu: RawLabels = Object.fromEntries(LABEL_FIELDS.map((f) => [f, { not_stated: true }]))
  const res = await POST(postNhan(a.cookie, 3, cu, "không dùng"))
  assert.equal(res.status, 200, await res.clone().text())
  const { rows } = await sc.query(`SELECT basis FROM eval_labels WHERE item_id = 3`)
  assert.equal(rows.length, 9)
  assert.ok(rows.every((r) => r.basis === null))
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_reasons`)).rows[0].n, 0)
})

const reviewCtx = (id: number) => ({ params: Promise.resolve({ itemId: String(id) }) })
const banhNhan = async (item: number) =>
  (await sc.query(`SELECT md5(string_agg(labeler_id || field || coalesce(value, '') || not_stated::text || coalesce(basis, ''), '|' ORDER BY labeler_id, field)) AS h FROM eval_labels WHERE item_id = $1`, [item])).rows[0].h
const postTruongHop = (cookie: string, item: number, body: unknown) =>
  new Request(`http://localhost/api/v1/ops/labels/${item}/review`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(body) })

async function nguoiDaLuu(item: number) {
  const a = await taoNguoi(sc, "ops")
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  const { ghiNhan } = await import("../src/lib/labels-queries")
  assert.deepEqual(await ghiNhan(sc, a.id, LAT, item, ch.rows, "lý do A"), { ok: true })
  return a
}

test("GCN-AC-6 truong hop khong doi nhan: băm nhãn trước sau bằng nhau, thêm đúng một dòng", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const { POST } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const truoc = await banhNhan(1)
  const res = await POST(postTruongHop(a.cookie, 1, { case_kind: "bi-danh", note: "RB", group_card_verdict: "correct" }), reviewCtx(1))
  assert.equal(res.status, 200, await res.clone().text())
  assert.equal(await banhNhan(1), truoc)
  const { rows } = await sc.query(`SELECT case_kind, note, group_card_verdict, labeler_id FROM eval_label_cases WHERE item_id = 1`)
  assert.deepEqual(rows, [{ case_kind: "bi-danh", note: "RB", group_card_verdict: "correct", labeler_id: a.id }])
})

test("GCN-AC-6 tra loi the: đúng, sai, chưa xét lưu và đọc lại; giá trị lạ 400", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const { GET, POST } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  for (const v of ["correct", "wrong", "unsure"]) assert.equal((await POST(postTruongHop(a.cookie, 1, { group_card_verdict: v }), reviewCtx(1))).status, 200, v)
  assert.equal((await POST(postTruongHop(a.cookie, 1, { group_card_verdict: "co" }), reviewCtx(1))).status, 400)
  assert.equal((await POST(postTruongHop(a.cookie, 1, { case_kind: "la" }), reviewCtx(1))).status, 400)
  const res = await GET(new Request("http://localhost/x", { headers: { cookie: a.cookie } }), reviewCtx(1))
  const j = (await res.json()) as { truongHop: { groupCardVerdict: string }[] }
  assert.deepEqual(j.truongHop.map((t) => t.groupCardVerdict), ["correct", "wrong", "unsure"])
})

test("GCN-AC-6 thân rỗng gửi thẳng route: 400, không thêm dòng", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const { POST } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  assert.equal((await POST(postTruongHop(a.cookie, 1, {}), reviewCtx(1))).status, 400)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases`)).rows[0].n, 0)
})

test("GCN-AC-6 luu lai nhan 409: có trường hợp rồi vẫn 409, nhãn không đổi", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const nhan = await import("../src/app/api/v1/ops/labels/route")
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  await hai.POST(postTruongHop(a.cookie, 1, { case_kind: "khac" }), reviewCtx(1))
  const truoc = await banhNhan(1)
  assert.equal((await nhan.POST(postNhan(a.cookie, 1, { ...DU, bedrooms: chu("3") }))).status, 409)
  assert.equal(await banhNhan(1), truoc)
})

test("GCN-AC-6 chua luu khong ghi duoc truong hop: 403, 0 dòng", async () => {
  await datLat()
  const b = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const res = await POST(postTruongHop(b.cookie, 1, { case_kind: "khac" }), reviewCtx(1))
  assert.equal(res.status, 403)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases`)).rows[0].n, 0)
})

test("GCN-AC-6 loi truong hop nhan con nguyen: chèn hỏng ném lỗi, băm nhãn không đổi", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const truoc = await banhNhan(1)
  const { ghiTruongHop } = await import("../src/lib/labels-luot-hai")
  const hong = { query: async (sql: string, v?: unknown[]) => {
    if (sql.startsWith("INSERT")) throw new Error("mất kết nối")
    return sc.query(sql, v as unknown[])
  } } as unknown as Parameters<typeof ghiTruongHop>[0]
  await assert.rejects(ghiTruongHop(hong, a.id, 1, { case_kind: "khac" }), /mất kết nối/)
  assert.equal(await banhNhan(1), truoc)
})

test("GCN-AC-5 lượt hai: chưa lưu 403; đã lưu thấy ba cột, tin đầu, tổng số tin, thẻ; người hai không thấy nhãn người trước", async () => {
  await datLat()
  await sc.query(`INSERT INTO collection_units (source_code, group_key, name, unit_code, unit_type, note) VALUES ('S03', 'g-a', 'Nhóm U-A', 'U-A', 'thu', 'THE-NHOM-DAU')`)
  for (const [ma, gia] of [["o-b", 7000000000], ["o-a", 6000000000], ["o-c", 8000000000]] as const) {
    await sc.query(`INSERT INTO sale_offers (offer_id, kind, first_seen, last_seen, post_ids, price_vnd, bedrooms, block_raw, area_m2) VALUES ($1, 'sale', now(), now(), ARRAY['zalo-gcn-4'], $2, 3, 'S1.01', 64.50)`, [ma, gia])
  }
  await sc.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', 'zalo-gcn-4', 'h', 'm', 'v', 'offer', 'sale', true, 'r')`)
  const a = await taoNguoi(sc, "ops")
  const b = await taoNguoi(sc, "ops")
  const { GET } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const goi = (cookie: string) => GET(new Request("http://localhost/x", { headers: { cookie } }), reviewCtx(4))
  const chua = await goi(a.cookie)
  assert.equal(chua.status, 403)
  assert.ok(!(await chua.text()).includes("THE-NHOM-DAU"))
  const nhan = await import("../src/app/api/v1/ops/labels/route")
  assert.equal((await nhan.POST(postNhan(a.cookie, 4, { ...DU, project: { value: "LYDO-A-DAU", basis: "ngu_canh_nhom" } }, "LYDO-A-CHU"))).status, 200)
  const da = (await (await goi(a.cookie)).json()) as { soTin: number; the: string; boDoc: Record<string, string>; aiDoc: Record<string, string>; cuaToi: unknown[]; lyDo: string }
  assert.equal(da.soTin, 3)
  assert.equal(da.boDoc.price_min_vnd, "6000000000", "so với tin có offer_id nhỏ nhất")
  assert.deepEqual([da.boDoc.building, da.boDoc.area_m2, da.boDoc.bedrooms], ["s1.01", "64.5", "3"])
  assert.equal(da.aiDoc.kind, "sale")
  assert.equal(da.the, "THE-NHOM-DAU")
  assert.equal(da.cuaToi.length, 17)
  assert.equal(da.lyDo, "LYDO-A-CHU")
  // Người hai của bài trùng: chưa lưu 403; lưu rồi vẫn chỉ thấy phần của mình.
  assert.equal((await goi(b.cookie)).status, 403)
  assert.equal((await nhan.POST(postNhan(b.cookie, 4, DU))).status, 200)
  const resB = await goi(b.cookie)
  assert.equal(resB.status, 200, "người hai đã lưu phải đọc được phần của mình")
  const cuaB = await resB.text()
  const jB = JSON.parse(cuaB) as { cuaToi: { field: string; value: string }[]; lyDo: string | null; soTin: number }
  assert.equal(jB.cuaToi.length, 17, "đối chứng dương: có đủ nhãn của chính B")
  assert.equal(jB.cuaToi.find((r) => r.field === "project")?.value, "vinhomes grand park", "giá trị của B, không phải của A")
  assert.equal(jB.lyDo, null)
  assert.equal(jB.soTin, 3)
  assert.ok(!cuaB.includes("LYDO-A-CHU") && !cuaB.toLowerCase().includes("lydo-a-dau"), "NGUOI HAI THAY NHAN NGUOI TRUOC")
})

test("GCN-AC-5 lượt hai thiếu máy và thẻ: boDoc, aiDoc, the đều null", async () => {
  await datLat()
  const a = await nguoiDaLuu(2)
  const { doiChieu } = await import("../src/lib/labels-luot-hai")
  const kq = await doiChieu(a.id, 2, sc)
  assert.deepEqual([kq?.boDoc, kq?.aiDoc, kq?.the, kq?.soTin], [null, null, null, 0])
})

test("GCN-AC-7 bang truong hop khop sql doc lap: ba nhóm, nhóm chưa gắn, 0 chuỗi lý do", async () => {
  await datLat()
  await sc.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ('zalo-gcn-7', 'hcm__zalo__gcn7', 'Nhóm U-C', 'bài', now())`)
  await sc.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', 'zalo-gcn-7', 'h7', 'dev', false, 'thu', 'U-C')`, [LAT])
  const nhan = await import("../src/app/api/v1/ops/labels/route")
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const [a, b] = [await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops")]
  const ngu = { ...DU, project: { value: "Ocean Park", basis: "ngu_canh_nhom" } }
  assert.equal((await nhan.POST(postNhan(a.cookie, 1, ngu, "LYDO-BANG"))).status, 200)
  assert.equal((await nhan.POST(postNhan(a.cookie, 2, DU))).status, 200)
  assert.equal((await nhan.POST(postNhan(a.cookie, 5, ngu, "LYDO-BANG"))).status, 200)
  assert.equal((await nhan.POST(postNhan(b.cookie, 6, DU))).status, 200)
  const ghi = (u: { cookie: string }, i: number, k: string, note?: string) => hai.POST(postTruongHop(u.cookie, i, { case_kind: k, note }), reviewCtx(i))
  await ghi(a, 1, "bi-danh", "GHICHEP-BANG")
  await ghi(a, 1, "mac-dinh-nhom")
  await ghi(a, 2, "bi-danh")
  await ghi(b, 6, "khac")
  const { bangTruongHop } = await import("../src/lib/labels-luot-hai")
  const bang = await bangTruongHop(LAT, sc)
  // Đếm độc lập theo từng nhóm, câu riêng, không dùng CTE của hàm.
  for (const d of bang) {
    const dem = async (sql: string) => (await sc.query(sql, [LAT, d.unitCode])).rows[0].n
    assert.equal(d.tong, await dem(`SELECT count(*)::int AS n FROM eval_label_items WHERE lat = $1 AND stratum = $2`))
    assert.equal(d.daGan, await dem(`SELECT count(DISTINCT l.item_id)::int AS n FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1 AND i.stratum = $2`))
    assert.equal(d.canNguCanh, await dem(`SELECT count(DISTINCT l.item_id)::int AS n FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1 AND i.stratum = $2 AND l.basis <> 'chu_bai'`))
    const tong = Object.values(d.theoLoai).reduce((x, y) => x + y!, 0)
    assert.equal(tong, await dem(`SELECT count(*)::int AS n FROM eval_label_cases c JOIN eval_label_items i USING (item_id) WHERE i.lat = $1 AND i.stratum = $2 AND c.case_kind IS NOT NULL`))
  }
  assert.deepEqual(bang.map((d) => [d.unitCode, d.ten, d.tong, d.daGan, d.canNguCanh, d.theoLoai]), [
    ["U-A", "Nhóm U-A", 4, 2, 1, { "bi-danh": 2, "mac-dinh-nhom": 1 }],
    ["U-B", "Nhóm U-B", 2, 2, 1, { khac: 1 }],
    ["U-C", "Nhóm U-C", 1, 0, 0, {}],
  ])
  const chuoi = JSON.stringify(bang)
  assert.ok(!chuoi.includes("LYDO-BANG") && !chuoi.includes("GHICHEP-BANG"), "BANG LO CHU LY DO")
})

test("GCN-AC-10 bảng vai và nơi: cloud 503 không truy vấn; chưa đăng nhập 401; viewer ghi 403", async () => {
  await datLat()
  const nhan = await import("../src/app/api/v1/ops/labels/route")
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const v = await taoNguoi(sc, "viewer")
  const a = await nguoiDaLuu(1)
  const req = (cookie?: string) => new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ case_kind: "khac" }) })
  assert.equal((await hai.POST(req(), reviewCtx(1))).status, 401)
  assert.equal((await hai.POST(req(v.cookie), reviewCtx(1))).status, 403)
  assert.equal((await hai.GET(new Request("http://localhost/x", { headers: { cookie: v.cookie } }), reviewCtx(1))).status, 403)
  assert.equal((await nhan.POST(postNhan(v.cookie, 2, DU))).status, 403)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases`)).rows[0].n, 0)
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool)
  const cau: string[] = []
  ;(pool as unknown as { query: unknown }).query = (...x: unknown[]) => { cau.push(String(x[0])); return (goc as (...y: unknown[]) => unknown)(...x) }
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  const nguoiA = { id: a.id, email: a.email, plan: "free" as const, role: "ops" as const }
  const docBangNhan = () => cau.filter((q) => /eval_label|sale_offers|silver_labels|collection_units/.test(q))
  try {
    // Mốc dương: ngoài cloud cùng lời gọi có đọc bảng nhãn, tức bộ đếm bắt được.
    await LabelsContent({ user: nguoiA, lat: LAT, nhom: "U-A", xem: 1 })
    assert.ok(docBangNhan().length > 0, "bộ đếm không bắt được truy vấn nên số 0 bên dưới vô nghĩa")
    cau.length = 0
    process.env.VERCEL = "1"
    const html = renderToStaticMarkup(await LabelsContent({ user: nguoiA, lat: LAT, nhom: "U-A", xem: 1 }))
    assert.match(html, /Chỉ ở máy thu/)
    assert.doesNotMatch(html, /data-labels-luot-hai|data-labels-form/)
    const r1 = await hai.GET(new Request("http://localhost/x", { headers: { cookie: a.cookie } }), reviewCtx(1))
    assert.equal(r1.status, 503)
    assert.equal((await hai.POST(req(a.cookie), reviewCtx(1))).status, 503)
    assert.equal((await nhan.POST(postNhan(a.cookie, 2, DU))).status, 503)
    assert.deepEqual(docBangNhan(), [], "trên cloud không được đọc bảng nhãn, sau mọi lời gọi màn và route")
  } finally {
    delete process.env.VERCEL
    ;(pool as unknown as { query: unknown }).query = goc
  }
})

test("GCN-AC-10 trạng thái render: rỗng, nhóm hết, chờ người hai, viewer, biểu mẫu, lượt hai đúng câu", async () => {
  const { LabelsView, LAT_THEO_NHOM } = await import("../src/components/ops/labels/labels-view")
  const T0 = { tong: 0, cuaToi: 0, conChoToi: 0, trungDu: 0, trungTong: 0 }
  const T = { tong: 4, cuaToi: 4, conChoToi: 0, trungDu: 0, trungTong: 1 }
  const N = (cho: number) => [{ unitCode: "U-A", ten: "Nhóm A", tong: 4, cuaToi: 4, conChoToi: 0, choNguoiHai: cho }]
  const nhom = (cho: number) => ({ nhom: N(cho), chon: "U-A", bang: [{ unitCode: "U-A", ten: "Nhóm A", tong: 4, daGan: 0, canNguCanh: 0, theoLoai: {} }] })
  // Bảng trạng thái của E14 viết trước: cuối ca đối chiếu đủ từng phần tử.
  const TRANG_THAI = ["rỗng", "lỗi", "nhóm hết", "chờ người thứ hai", "tin vừa có người gắn", "viewer", "cloud"]
  const da = new Set<string>()
  const rong = renderToStaticMarkup(<LabelsView mode="local" lat={LAT_THEO_NHOM} coGhi tienDo={T0} dongThuan={[]} tin={null} />)
  assert.match(rong, /Chưa có tin nào của lát để gắn/)
  assert.match(rong, /--theo-nhom/)
  da.add("rỗng")
  assert.match(renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={null} {...nhom(0)} />), /Đã gắn hết nhóm này/)
  da.add("nhóm hết")
  const cho = renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={null} {...nhom(2)} />)
  assert.match(cho, /Anh đã gắn hết phần của mình; 2 bài chờ người thứ hai/)
  assert.match(cho, /chưa có/)
  da.add("chờ người thứ hai")
  const viewer = renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi={false} tienDo={T} dongThuan={[]} tin={null} {...nhom(0)} />)
  assert.match(viewer, /Cần vai ops để gắn nhãn/)
  assert.doesNotMatch(viewer, /data-labels-form/)
  assert.match(viewer, /data-labels-cases/)
  da.add("viewer")
  assert.match(renderToStaticMarkup(<LabelsView mode="cloud" lat="x" />), /Chỉ ở máy thu/)
  da.add("cloud")
  // Lỗi: vùng dữ liệu bọc RegionError có «Thử lại»; lỗi ghi trường hợp có «Thử lại» và nói nhãn an toàn; mất kết nối có «Lưu lại».
  const { LoiTruongHop } = await import("../src/components/ops/labels/luot-hai")
  const { LuuLoiAlert } = await import("../src/components/ops/labels/luu-nhan")
  const loiTh = renderToStaticMarkup(<LoiTruongHop loi="Mất kết nối tới máy thu" onRetry={() => {}} dangGhi={false} />)
  assert.match(loiTh, /Thử lại/)
  assert.match(loiTh, /Nhãn đã lưu an toàn/)
  assert.match(renderToStaticMarkup(<LuuLoiAlert onRetry={() => {}} dangLuu={false} />), /Lưu lại/)
  // Lỗi vùng dữ liệu: DB lỗi làm LabelsContent ném lên, RegionError thật vẽ «Thử lại» dưới ranh giới lỗi trong jsdom.
  const dbMod = await import("../src/lib/db")
  const gocQ = dbMod.pool.query.bind(dbMod.pool)
  ;(dbMod.pool as unknown as { query: unknown }).query = () => Promise.reject(new Error("DB lỗi"))
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  let loiDb: unknown = null
  try {
    await LabelsContent({ user: { id: "usr_x", email: "x@local.test", plan: "free", role: "ops" }, lat: LAT })
  } catch (e) {
    loiDb = e
  } finally {
    ;(dbMod.pool as unknown as { query: unknown }).query = gocQ
  }
  assert.match(String(loiDb), /DB lỗi/, "lỗi DB phải ném lên ranh giới lỗi, không nuốt")
  const dom = await dungDom()
  try {
    const { RegionError } = await import("../src/components/states/region-error")
    const Boom = (): never => { throw loiDb }
    const goc = await dom.render(<RegionError what="tin để gắn nhãn"><Boom /></RegionError>)
    assert.match(goc.textContent ?? "", /Không tải được tin để gắn nhãn/)
    assert.ok([...goc.querySelectorAll("button")].some((b) => b.textContent?.includes("Thử lại")), "có nút Thử lại")
    da.add("lỗi")
  } finally {
    await dom.xong()
  }
  da.add("tin vừa có người gắn") // đo ở ca «tin vua co nguoi gan» bên dưới, trên biểu mẫu thật
  assert.deepEqual([...da].sort(), [...TRANG_THAI].sort())
  const tin = { itemId: 7, lat: "x", doubleLabel: false, soNguoi: 0, text: "chữ bài RB", groupName: "Nhóm A", postedAt: null }
  const mau = renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={tin} {...nhom(0)} />)
  assert.match(mau, /data-labels-form="7"/)
  assert.equal((mau.match(/data-o="/g) ?? []).length, 18, "17 ô và ô Lý do")
  for (const c of ["Khu đô thị", "Phân khu", "Trục", "Tầng", "WC", "Nhiều căn", "SĐT", "không suy ra được"]) assert.ok(mau.includes(c), c)
  assert.doesNotMatch(mau, /Ghi theo đúng chữ của tin/)
  assert.match(mau, /Ghi điều người trong nhóm hiểu/)
  const d = { itemId: 7, lat: "x", text: "chữ", groupName: "Nhóm A", postedAt: null, cuaToi: [], lyDo: null, truongHop: [] }
  const khong = renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={tin} {...nhom(0)} luotHai={{ ...d, boDoc: null, aiDoc: null, soTin: 0, the: null }} />)
  assert.match(khong, /Máy chưa đọc bài này/)
  assert.match(khong, /Nhóm chưa có thẻ/)
  assert.doesNotMatch(khong, /data-labels-form/)
  const ba = renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={null} {...nhom(0)} luotHai={{ ...d, boDoc: { kind: "sale" }, aiDoc: null, soTin: 3, the: "THE" }} />)
  assert.match(ba, /Bài có 3 tin; đang so với tin đầu/)
  assert.match(ba, /Thẻ đúng với bài này không/)
})

test("GCN-AC-7 viewer đi đường thật: LabelsContent → bảng trường hợp có số, 0 chuỗi lý do; đối chứng ops cũng thấy cùng số", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  assert.equal((await hai.POST(postTruongHop(a.cookie, 1, { case_kind: "bi-danh", note: "GHICHEP-VIEWER" }), reviewCtx(1))).status, 200)
  await sc.query(`UPDATE eval_label_reasons SET reason = 'LYDO-VIEWER' WHERE item_id = 1`)
  const v = await taoNguoi(sc, "viewer")
  const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
  const html = renderToStaticMarkup(await LabelsContent({ user: { id: v.id, email: v.email, plan: "free", role: "viewer" }, lat: LAT, nhom: "U-A" }))
  const dong = html.match(/<tr[^>]*data-nhom="U-A"[^>]*>(.*?)<\/tr>/)?.[1] ?? ""
  assert.match(dong, /1\/4/, "viewer phải thấy số đã gắn")
  assert.match(dong, /Bí danh viết tắt 1/, "viewer phải thấy số theo loại")
  assert.doesNotMatch(html, /LYDO-VIEWER|GHICHEP-VIEWER/, "BANG LO CHU LY DO")
  assert.doesNotMatch(html, /data-labels-form/)
})

test("GCN-AC-5 bảng so đặt đúng cột, đúng trường; khác máy mới có Badge; trường bộ đọc chưa có cột không tính khác", async () => {
  const { LuotHai } = await import("../src/components/ops/labels/luot-hai")
  const nhan = (field: LabelField, value: string | null) => ({ field, value, notStated: value === null, basis: null })
  const d = {
    itemId: 1, lat: "x", text: "chữ", groupName: "N", postedAt: null, lyDo: null, truongHop: [], soTin: 1, the: "THE",
    cuaToi: [nhan("kind", "sale"), nhan("building", null), nhan("project", "ocean park"), nhan("bedrooms", "2")],
    boDoc: { kind: "sale", building: "s1", bedrooms: "3" },
    aiDoc: { kind: "rent_lt" },
  }
  const html = renderToStaticMarkup(<LuotHai d={d} hrefTinKe="/x" />)
  const o = (f: string) => (html.match(new RegExp(`<tr[^>]*data-field="${f}"[^>]*>(.*?)</tr>`))?.[1] ?? "").split("<td").slice(1).map((c) => c.slice(c.indexOf(">") + 1))
  const chu = (c?: string) => (c ?? "").replace(/<[^>]+>/g, "")
  assert.deepEqual(o("kind").map(chu), ["Loại tin", "Bán", "Bán", "Cho thuê"])
  assert.ok(!o("kind")[2].includes("<span") && o("kind")[3].includes("<span"), "chỉ ô khác nhãn mang Badge")
  assert.deepEqual(o("building").map(chu), ["Toà", "Không suy ra được", "s1", "—"])
  assert.ok(o("bedrooms")[2].includes("<span"), "bộ đọc 3 khác nhãn 2 phải mang Badge")
  assert.ok(!o("project")[2].includes("<span"), "bộ đọc chưa có cột dự án thì không tính khác")
  assert.match(html, /3 trường khác máy/)
})

test("GCN-AC-10 tin vua co nguoi gan: biểu mẫu thật nhận 409 của route, hiện đúng câu, sang tin kế; bài còn chỗ thì sang lượt hai", async () => {
  await datLat()
  await nguoiDaLuu(1)
  const sau = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const gocFetch = globalThis.fetch
  const dom = await dungDom()
  const cau: string[] = []
  // Fetch đi qua route thật, thân thay bằng lượt hợp lệ: ca này đo kết cục của route trên biểu mẫu, không đo khâu điền.
  globalThis.fetch = (async (url: string, init: RequestInit) =>
    POST(new Request(`http://localhost${url}`, {
      method: "POST", headers: { "content-type": "application/json", cookie: sau.cookie },
      body: JSON.stringify({ ...JSON.parse(String(init.body)), values: DU }),
    }))) as unknown as typeof fetch
  try {
    const tin = (itemId: number) => ({ itemId, lat: LAT, doubleLabel: false, soNguoi: 0, text: CHU, groupName: "N", postedAt: null })
    const di: string[] = []
    await dom.render(<LabelFormNhom lat={LAT} tin={tin(1)} hrefXem="/xem-1" hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} baoTin={(m) => cau.push(m)} />)
    await dom.bam("Lưu và xem máy đọc")
    await dom.cho(() => di.length === 1)
    assert.deepEqual(cau, ["Tin này vừa có người gắn — chuyển tin kế"])
    assert.deepEqual(di, ["/tin-ke"])
    // Đối chứng dương: bài 2 còn chỗ, cùng biểu mẫu sang lượt hai, không có câu trên.
    document.body.innerHTML = "<div id=root></div>"
    await dom.render(<LabelFormNhom lat={LAT} tin={tin(2)} hrefXem="/xem-2" hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} baoTin={(m) => cau.push(m)} />)
    await dom.bam("Lưu và xem máy đọc")
    await dom.cho(() => di.length === 2)
    assert.deepEqual(di, ["/tin-ke", "/xem-2"])
    assert.equal(cau.length, 1)
  } finally {
    globalThis.fetch = gocFetch
    await dom.xong()
  }
})

test("GCN-AC-6 bo qua trên màn thật: nút Bỏ qua không gửi gì và sang tin kế; có diễn giải thì gửi một lần; lỗi ghi thì ở lại, có Thử lại", async () => {
  const { LuotHai } = await import("../src/components/ops/labels/luot-hai")
  const gocFetch = globalThis.fetch
  const gui: { url: string; body: unknown }[] = []
  let loi = false
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    gui.push({ url, body: JSON.parse(String(init.body)) })
    if (loi) throw new Error("mất mạng")
    return new Response("{}", { status: 200 })
  }) as unknown as typeof fetch
  const dom = await dungDom()
  const d = { itemId: 7, lat: "x", text: "chữ", groupName: "N", postedAt: null, cuaToi: [], lyDo: null, truongHop: [], soTin: 0, boDoc: null, aiDoc: null, the: null }
  const di: string[] = []
  try {
    await dom.render(<LuotHai d={d} hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} />)
    await dom.bam("Bỏ qua")
    assert.deepEqual(di, ["/tin-ke"], "Bỏ qua phải sang tin kế")
    assert.equal(gui.length, 0, "Bỏ qua không gửi gì")
    await dom.bam("Ghi và sang tin kế")
    assert.deepEqual(di, ["/tin-ke", "/tin-ke"])
    assert.equal(gui.length, 0, "chưa điền gì thì không có dòng để ghi")
    await dom.go("th-note", "RB viết tắt")
    await dom.bam("Ghi và sang tin kế")
    assert.deepEqual(gui.map((g) => g.url), ["/api/v1/ops/labels/7/review"])
    assert.equal((gui[0].body as { note: string }).note, "RB viết tắt")
    assert.equal(di.length, 3)
    // Ghi xong nút khoá tới khi trang chuyển: bấm nữa không gửi thêm.
    const nutGhi = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Đang ghi…")
    assert.ok(nutGhi?.disabled, "NUT CON BAM DUOC SAU KHI GHI")
    await dom.bam("Đang ghi…")
    assert.equal(gui.length, 1, "NUT CON BAM DUOC SAU KHI GHI")
    await dom.xong()
    const dom2 = await dungDom()
    try {
      loi = true
      await dom2.render(<LuotHai d={d} hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} />)
      await dom2.go("th-note", "lần sau")
      await dom2.bam("Ghi và sang tin kế")
      assert.equal(di.length, 3, "lỗi ghi thì ở lại")
      assert.match(document.body.textContent ?? "", /Nhãn đã lưu an toàn/)
      assert.ok([...document.querySelectorAll("button")].some((b) => b.textContent?.includes("Thử lại")))
    } finally {
      await dom2.xong()
    }
  } finally {
    globalThis.fetch = gocFetch
  }
})

const CA_SO_THANH_PHAN: [string, string, boolean][] = [
  ["03", "Bán căn S5.03", true], ["15", "trục 12,15", true], ["59", "DT 59,64,70m2", true], ["59", "giá 590 triệu", false], ["64", "DT 64,5m2", false], ["64.5", "DT 64,5m2", true],
]
function kiemSoThanhPhan(f: (v: string, t: string) => boolean): string[] {
  return CA_SO_THANH_PHAN.filter(([v, t, ky]) => f(v, t) !== ky).map(([v, t]) => `${v} trong «${t}»`)
}

test("GCN-AC-11 co trong chu so thanh phan: ma trận, qua route, đột biến bị bắt", async () => {
  assert.deepEqual(kiemSoThanhPhan(coTrongChu), [])
  await datLat()
  await sc.query(`UPDATE stg_zalo_posts SET text = $1 WHERE post_id = 'zalo-gcn-3'`, ["Bán 2 căn trục 12,15 S5.03 Rainbow Vinhomes Grand Park 64,5m2 giá 4,35 tỷ"])
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  assert.equal((await POST(postNhan(a.cookie, 3, { ...DU, stack: chu("15") }))).status, 200, "trục 15 của bài 12,15 có trong chữ")
  const b = await taoNguoi(sc, "ops")
  const sai = await POST(postNhan(b.cookie, 4, { ...DU, stack: chu("99") }))
  assert.equal(sai.status, 400)
  assert.equal(((await sai.json()) as { loi: { stack: string } }).loi.stack, MSG_KHONG_TRONG_CHU)
  const dot = await banDot<{ coTrongChu: (v: string, t: string) => boolean }>("src/lib/labels-normalize.ts", "return !thapPhan && phan.length > 1 && !v.includes(\".\") && phan.some((x) => nguyen(x) === nguyen(v))", "return false")
  assert.notDeepEqual(kiemSoThanhPhan(dot.coTrongChu), [], "đối chứng không đỏ: bản bỏ so số thành phần vẫn xanh")
})

test("GCN-AC-12 bang so khong bao khac khi may khong doc: ô trống, unknown không tô; không suy ra được mà máy có giá trị thì tô; đột biến bị bắt", async () => {
  await datLat()
  await sc.query(`INSERT INTO sale_offers (offer_id, kind, first_seen, last_seen, post_ids, property_type) VALUES ('o-u', 'sale', now(), now(), ARRAY['zalo-gcn-1'], 'unknown')`)
  await sc.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', 'zalo-gcn-1', 'h', 'm', 'v', 'unknown', 'sale', true, 'r')`)
  const a = await nguoiDaLuu(1)
  const { doiChieu } = await import("../src/lib/labels-luot-hai")
  const d = await doiChieu(a.id, 1, sc)
  assert.ok(d)
  assert.equal(d.boDoc!.property_type, undefined, "unknown của máy là ô trống")
  assert.equal(d.aiDoc!.listing_intent, undefined)
  // Người gắn không suy ra được toà, máy đọc ra: vẫn là chỗ khác.
  const voiCua = { ...d, boDoc: { ...d.boDoc, building: "s1" } }
  type Mod = { BangSo: (p: { d: typeof voiCua }) => React.ReactElement }
  const { BangSo } = await import("../src/components/ops/labels/bang-so") as unknown as Mod
  const kiem = (M: Mod) => {
    const html = renderToStaticMarkup(<M.BangSo d={voiCua} />)
    const o = (f: string) => (html.match(new RegExp(`<tr[^>]*data-field="${f}"[^>]*>(.*?)</tr>`))?.[1] ?? "").split("<td").slice(1).map((c) => c.slice(c.indexOf(">") + 1))
    return {
      tangTo: o("floor")[2]?.includes("<span"), wcTo: o("bathrooms")[2]?.includes("<span"), loaiHinhTo: o("property_type")[2]?.includes("<span"),
      yDinhAiTo: o("listing_intent")[3]?.includes("<span"), toaTo: o("building")[2]?.includes("<span"), khongUnknown: !html.includes("unknown"), so: html.match(/(\d+) trường khác máy/)?.[1],
    }
  }
  const kq = kiem({ BangSo } as Mod)
  assert.deepEqual(kq, { tangTo: false, wcTo: false, loaiHinhTo: false, yDinhAiTo: false, toaTo: true, khongUnknown: true, so: "1" }, JSON.stringify(kq))
  const dot = await banDot<Mod>("src/components/ops/labels/bang-so.tsx", "khacBo: bo !== null && bo !== toi,", "khacBo: !!d.boDoc && bo !== toi,")
  assert.notEqual(kiem(dot).so, "1", "đối chứng không đỏ: bản coi ô trống là khác vẫn xanh")
})

test("GCN-AC-14 thu lai khong ghi trung: máy thu đã ghi rồi mất phản hồi, Thử lại ra một dòng; đổi nội dung ra dòng mới; đột biến bị bắt", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const { LuotHai } = await import("../src/components/ops/labels/luot-hai")
  const { bangTruongHop } = await import("../src/lib/labels-luot-hai")
  const dem = async () => (await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases WHERE item_id = 1`)).rows[0].n
  const gocFetch = globalThis.fetch
  let matPhanHoi = true
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const res = await hai.POST(postTruongHop(a.cookie, 1, JSON.parse(String(init.body))), reviewCtx(1))
    if (matPhanHoi) { matPhanHoi = false; throw new Error("mất mạng sau khi đã ghi") }
    void url
    return res
  }) as unknown as typeof fetch
  const dom = await dungDom()
  const di: string[] = []
  const d = { itemId: 1, lat: LAT, text: "chữ", groupName: "N", postedAt: null, cuaToi: [], lyDo: null, truongHop: [], soTin: 0, boDoc: null, aiDoc: null, the: null }
  try {
    await dom.render(<LuotHai d={d} hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} />)
    await dom.go("th-note", "RB viết tắt")
    await dom.bam("Ghi và sang tin kế")
    await dom.cho(() => (document.body.textContent ?? "").includes("Thử lại"))
    assert.equal(await dem(), 1, "máy thu đã ghi dù mất phản hồi")
    assert.equal(di.length, 0)
    await dom.bam("Thử lại")
    await dom.cho(() => di.length === 1)
    assert.deepEqual(di, ["/tin-ke"])
    assert.equal(await dem(), 1, "GHI TRUNG KHI THU LAI")
    const bang = (await bangTruongHop(LAT, sc)).find((x) => x.unitCode === "U-A")
    assert.ok(bang)
  } finally {
    globalThis.fetch = gocFetch
    await dom.xong()
  }
  // Cùng route: khoá khác là dòng mới, không khoá vẫn thêm được.
  assert.equal((await hai.POST(postTruongHop(a.cookie, 1, { note: "khác", request_id: "k2" }), reviewCtx(1))).status, 200)
  assert.equal((await hai.POST(postTruongHop(a.cookie, 1, { note: "khác", request_id: "k2" }), reviewCtx(1))).status, 200)
  assert.equal(await dem(), 2)
  assert.equal((await hai.POST(postTruongHop(a.cookie, 1, { note: "không khoá" }), reviewCtx(1))).status, 200)
  assert.equal(await dem(), 3)
  // Đột biến: bỏ ON CONFLICT và bỏ khoá thì Thử lại ra hai dòng.
  type Mod = { ghiTruongHop: (c: unknown, u: string, i: number, g: Record<string, unknown>) => Promise<unknown> }
  const dot = await banDot<Mod>("src/lib/labels-luot-hai.ts", "const khoa = typeof g.request_id === \"string\" && g.request_id ? g.request_id : null", "const khoa = null")
  await dot.ghiTruongHop(sc, a.id, 1, { note: "đột biến", request_id: "k3" })
  await dot.ghiTruongHop(sc, a.id, 1, { note: "đột biến", request_id: "k3" })
  assert.equal(await dem(), 5, "đối chứng không đỏ: bản bỏ khoá vẫn không ghi trùng")
})
