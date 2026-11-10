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

let soBanDot = 0
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
  const f = join(APP, "tests", `.gcn-dot-${process.pid}-${++soBanDot}-${tep.split("/").pop()}`)
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
  dom.window.Element.prototype.scrollIntoView = () => {}
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
      const proto = o.tagName === "INPUT" ? dom.window.HTMLInputElement.prototype : dom.window.HTMLTextAreaElement.prototype
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(o, giaTri)
        o.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
      })
    },
    nhan: async (el: Element | null | undefined, ten: string) => {
      assert.ok(el, `không thấy ${ten}`)
      await React.act(async () => { (el as HTMLElement).click(); await new Promise((r) => setTimeout(r, 10)) })
    },
    /** Chọn trên Select của màn: mở từ ô `id`, bấm dòng đúng nhãn, không đặt giá trị hộ. */
    chon: async (id: string, nhan: string) => {
      // Click không kèm con trỏ là lối bấm bằng bàn phím: ô chọn mở ngay, không chờ khung vẽ của lối chuột.
      const chuot = async (el: Element) => React.act(async () => {
        (el as HTMLElement).click()
        await new Promise((r) => setTimeout(r, 30))
      })
      const o = document.getElementById(id)
      assert.ok(o, `không thấy ô ${id}`)
      await chuot(o)
      const dong = [...document.querySelectorAll('[role="option"]')].find((x) => x.textContent?.trim() === nhan)
      assert.ok(dong, `ô ${id} không có dòng ${nhan}`)
      await chuot(dong)
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
  // Base UI chốt layout effect lúc nạp theo có `document` hay không; nạp không có thì ô chọn không gắn được trình bấm.
  const dauDocument = Object.getOwnPropertyDescriptor(globalThis, "document")
  Object.defineProperty(globalThis, "document", { value: new JSDOM("").window.document, configurable: true })
  await import("../src/components/ui/select")
  if (dauDocument) Object.defineProperty(globalThis, "document", dauDocument)
  else delete (globalThis as Record<string, unknown>).document
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".sale_offers (LIKE public.sale_offer_records INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".silver_labels (LIKE public.silver_labels INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".collection_units (LIKE public.collection_units INCLUDING DEFAULTS)`)
  await sc.connect()
  for (const m of ["054_labels.sql", "072_labels_nhom.sql", "073_labels_nhom_sua.sql", "075_labels_can_cu_anh.sql", "076_labels_ghep.sql", "081_labels_truong_moi.sql"]) await sc.query(readFileSync(join(APP, "../db/migrations", m), "utf8"))
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
  // truong-nhan-s03-081: bảy ô mới bắt buộc (Hỏi-4), bài mẫu không nói nên «Không suy ra được».
  unit_number: { not_stated: true },
  furnished: { not_stated: true },
  direction_faces: { not_stated: true },
  view: { not_stated: true },
  availability_date: { not_stated: true },
  price_basis: { not_stated: true },
  rent_includes: { not_stated: true },
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
        assert.equal(kq.rows.length, 24, c.ten)
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
  assert.equal(LABEL_FIELDS_NHOM.length, 24) // 17 trường GC0 + bảy trường truong-nhan-s03-081
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
  assert.equal(rows.length, 24)
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
  assert.deepEqual([await dem("eval_labels", 2), await dem("eval_label_reasons", 2)], [24, 1])
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
  assert.equal(da.cuaToi.length, 24)
  assert.equal(da.lyDo, "LYDO-A-CHU")
  // Người hai của bài trùng: chưa lưu 403; lưu rồi vẫn chỉ thấy phần của mình.
  assert.equal((await goi(b.cookie)).status, 403)
  assert.equal((await nhan.POST(postNhan(b.cookie, 4, DU))).status, 200)
  const resB = await goi(b.cookie)
  assert.equal(resB.status, 200, "người hai đã lưu phải đọc được phần của mình")
  const cuaB = await resB.text()
  const jB = JSON.parse(cuaB) as { cuaToi: { field: string; value: string }[]; lyDo: string | null; soTin: number }
  assert.equal(jB.cuaToi.length, 24, "đối chứng dương: có đủ nhãn của chính B")
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
  const tin = { itemId: 7, lat: "x", doubleLabel: false, soNguoi: 0, text: "chữ bài RB", anh: [], soLinkKhac: 0, ghep: null, groupName: "Nhóm A", postedAt: null }
  const mau = renderToStaticMarkup(<LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={tin} {...nhom(0)} />)
  assert.match(mau, /data-labels-form="7"/)
  assert.equal((mau.match(/data-o="/g) ?? []).length, 25, "24 ô và ô Lý do")
  for (const c of ["Khu đô thị", "Phân khu", "Trục", "Tầng", "WC", "Nhiều căn", "SĐT", "không suy ra được"]) assert.ok(mau.includes(c), c)
  assert.doesNotMatch(mau, /Ghi theo đúng chữ của tin/)
  assert.match(mau, /Ghi điều người trong nhóm hiểu/)
  const d = { itemId: 7, lat: "x", text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "Nhóm A", postedAt: null, cuaToi: [], lyDo: null, truongHop: [] }
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
    itemId: 1, lat: "x", text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null, lyDo: null, truongHop: [], soTin: 1, the: "THE",
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
    const tin = (itemId: number) => ({ itemId, lat: LAT, doubleLabel: false, soNguoi: 0, text: CHU, anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null })
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
  const d = { itemId: 7, lat: "x", text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null, cuaToi: [], lyDo: null, truongHop: [], soTin: 0, boDoc: null, aiDoc: null, the: null }
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
  await sc.query(`INSERT INTO sale_offers (offer_id, kind, first_seen, last_seen, post_ids, property_type, block_raw) VALUES ('o-u', 'sale', now(), now(), ARRAY['zalo-gcn-1'], 'unknown', 'S1')`)
  await sc.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', 'zalo-gcn-1', 'h', 'm', 'v', 'unknown', 'sale', true, 'r')`)
  // Người gắn không suy ra được toà, lưu qua route thật; máy đọc ra toà từ bản ghi thật.
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  assert.equal((await POST(postNhan(a.cookie, 1, { ...DU, building: { not_stated: true } }))).status, 200)
  const { doiChieu } = await import("../src/lib/labels-luot-hai")
  const d = await doiChieu(a.id, 1, sc)
  assert.ok(d)
  assert.equal(d.boDoc!.property_type, undefined, "unknown của máy là ô trống")
  assert.equal(d.aiDoc!.listing_intent, undefined)
  assert.equal(d.boDoc!.building, "s1")
  assert.deepEqual(d.cuaToi.filter((r) => r.field === "building").map((r) => [r.value, r.notStated]), [[null, true]])
  type Mod = { BangSo: (p: { d: typeof d }) => React.ReactElement }
  const { BangSo } = await import("../src/components/ops/labels/bang-so") as unknown as Mod
  const kiem = (M: Mod) => {
    const html = renderToStaticMarkup(<M.BangSo d={d} />)
    const o = (f: string) => (html.match(new RegExp(`<tr[^>]*data-field="${f}"[^>]*>(.*?)</tr>`))?.[1] ?? "").split("<td").slice(1).map((c) => c.slice(c.indexOf(">") + 1))
    return {
      tangTo: o("floor")[2]?.includes("<span"), wcTo: o("bathrooms")[2]?.includes("<span"), loaiHinhTo: o("property_type")[2]?.includes("<span"),
      yDinhAiTo: o("listing_intent")[3]?.includes("<span"), toaNguoi: o("building")[1]?.replace(/<[^>]+>/g, ""), toaTo: o("building")[2]?.includes("<span"), khongUnknown: !html.includes("unknown"), so: html.match(/(\d+) trường khác máy/)?.[1],
    }
  }
  const kq = kiem({ BangSo } as Mod)
  assert.deepEqual(kq, { tangTo: false, wcTo: false, loaiHinhTo: false, yDinhAiTo: false, toaNguoi: "Không suy ra được", toaTo: true, khongUnknown: true, so: "1" }, JSON.stringify(kq))
  const dot = await banDot<Mod>("src/components/ops/labels/bang-so.tsx", "khacBo: bo !== null && bo !== toi,", "khacBo: !!d.boDoc && bo !== toi,")
  assert.notEqual(kiem(dot).so, "1", "đối chứng không đỏ: bản coi ô trống là khác vẫn xanh")
  const boQuaNhanh = await banDot<Mod>("src/components/ops/labels/bang-so.tsx", "khacBo: bo !== null && bo !== toi,", "khacBo: toi !== null && bo !== null && bo !== toi,")
  assert.equal(kiem(boQuaNhanh).toaTo, false, "đối chứng không đỏ: bản bỏ nhánh không suy ra được vẫn tô")
})

type ManLuotHai = { LuotHai: (p: { d: never; hrefTinKe: string; diToi: (h: string) => void }) => React.ReactElement }
const dLuotHai = (the: string | null) => ({ itemId: 1, lat: LAT, text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null, cuaToi: [], lyDo: null, truongHop: [], soTin: 0, boDoc: null, aiDoc: null, the }) as never

/** Kịch bản Thử lại trên màn thật: chọn loại, gõ diễn giải, mất phản hồi sau khi đã ghi, Thử lại; rồi lần khác đổi nội dung sau lỗi. */
async function kichBanThuLai(M: ManLuotHai, ghi: (body: Record<string, unknown>) => Promise<Response>) {
  const { bangTruongHop } = await import("../src/lib/labels-luot-hai")
  const so = async () => ({
    dong: (await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases WHERE item_id = 1`)).rows[0].n as number,
    biDanh: (await bangTruongHop(LAT, sc)).find((x) => x.unitCode === "U-A")?.theoLoai["bi-danh"] ?? 0,
  })
  const gocFetch = globalThis.fetch
  let matPhanHoi = false
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    const res = await ghi(JSON.parse(String(init.body)))
    if (matPhanHoi) { matPhanHoi = false; throw new Error("mất mạng sau khi đã ghi") }
    return res
  }) as unknown as typeof fetch
  const di: string[] = []
  const chay = async (lam: (dom: Awaited<ReturnType<typeof dungDom>>) => Promise<void>) => {
    const dom = await dungDom()
    try {
      await dom.render(<M.LuotHai d={dLuotHai(null)} hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} />)
      await dom.chon("th-kind", "Bí danh viết tắt")
      await lam(dom)
    } finally {
      await dom.xong()
    }
  }
  const coLoi = () => !!document.querySelector("[data-labels-loi-truong-hop]")
  const kq: Record<string, unknown> = {}
  try {
    await chay(async (dom) => {
      matPhanHoi = true
      await dom.go("th-note", "RB viết tắt")
      await dom.bam("Ghi và sang tin kế")
      await dom.cho(coLoi)
      kq.lanDau = await so()
      kq.diSauLanDau = di.length
      await dom.bam("Thử lại")
      await dom.cho(() => di.length === 1 || coLoi())
      kq.thuLai = await so()
      kq.diSauThuLai = di.length
    })
    await chay(async (dom) => {
      matPhanHoi = true
      await dom.go("th-note", "nội dung A")
      await dom.bam("Ghi và sang tin kế")
      await dom.cho(coLoi)
      await dom.go("th-note", "nội dung B")
      await dom.bam("Ghi và sang tin kế")
      await dom.cho(() => !coLoi() && di.length > 1 || coLoi())
      kq.doiNoiDung = await so()
    })
  } finally {
    globalThis.fetch = gocFetch
  }
  return kq
}

test("GCN-AC-14 thu lai khong ghi trung: chọn loại trên màn, mất phản hồi, Thử lại ra một dòng và số bảng không đổi; đổi nội dung trên màn ra dòng mới; đột biến bị bắt", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const { LuotHai } = await import("../src/components/ops/labels/luot-hai")
  const quaRoute = (body: Record<string, unknown>) => hai.POST(postTruongHop(a.cookie, 1, body), reviewCtx(1))
  const KY = { lanDau: { dong: 1, biDanh: 1 }, diSauLanDau: 0, thuLai: { dong: 1, biDanh: 1 }, diSauThuLai: 1, doiNoiDung: { dong: 3, biDanh: 3 } }
  const kq = await kichBanThuLai({ LuotHai } as unknown as ManLuotHai, quaRoute)
  assert.deepEqual(kq, KY, "GHI TRUNG KHI THU LAI")
  const { rows } = await sc.query(`SELECT note FROM eval_label_cases WHERE item_id = 1 ORDER BY id`)
  assert.deepEqual(rows.map((r) => r.note), ["RB viết tắt", "nội dung A", "nội dung B"])

  // Route: không khoá vẫn thêm được dòng, cùng khoá không thêm.
  await datLat()
  const b = await nguoiDaLuu(1)
  const dem = async () => (await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases WHERE item_id = 1`)).rows[0].n
  for (const body of [{ note: "khoá", request_id: "k2" }, { note: "khoá", request_id: "k2" }]) assert.equal((await hai.POST(postTruongHop(b.cookie, 1, body), reviewCtx(1))).status, 200)
  assert.equal(await dem(), 1)
  assert.equal((await hai.POST(postTruongHop(b.cookie, 1, { note: "không khoá" }), reviewCtx(1))).status, 200)
  assert.equal(await dem(), 2)

  // Đột biến chạy qua đúng kịch bản trên: mỗi bản phải làm kết quả khác KY.
  type Ghi = { ghiTruongHop: (c: unknown, u: string, i: number, g: Record<string, unknown>) => Promise<unknown> }
  const quaBan = (m: Ghi, u: string) => async (body: Record<string, unknown>) => { await m.ghiTruongHop(sc, u, 1, body); return new Response("{}") }
  const boConflict = await banDot<Ghi>("src/lib/labels-luot-hai.ts", "ON CONFLICT (item_id, labeler_id, request_id) DO NOTHING", "")
  const boKhoa = await banDot<Ghi>("src/lib/labels-luot-hai.ts", "const khoa = typeof g.request_id === \"string\" && g.request_id ? g.request_id : null", "const khoa = null")
  for (const [ten, m] of [["bỏ ON CONFLICT", boConflict], ["bỏ khoá", boKhoa]] as const) {
    await datLat()
    const u = await nguoiDaLuu(1)
    assert.notDeepEqual(await kichBanThuLai({ LuotHai } as unknown as ManLuotHai, quaBan(m, u.id)), KY, `đối chứng không đỏ: bản ${ten} vẫn xanh`)
  }
  const giuKhoa = await banDot<ManLuotHai>("src/components/ops/labels/luot-hai.tsx", "setKhoa(moiKhoa())", "void 0")
  await datLat()
  const c = await nguoiDaLuu(1)
  const kqGiuKhoa = await kichBanThuLai(giuKhoa, (body) => hai.POST(postTruongHop(c.cookie, 1, body), reviewCtx(1)))
  assert.deepEqual(kqGiuKhoa.doiNoiDung, { dong: 2, biDanh: 2 }, "đối chứng không đỏ: bản không đổi khoá khi đổi nội dung vẫn ra dòng mới")
})

test("GCN-AC-6 tra loi the tren man: chọn ở ô Thẻ nhóm, Loại trường hợp của màn tới route thật, đọc lại đúng; đột biến bị bắt", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const hai = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  const { LuotHai } = await import("../src/components/ops/labels/luot-hai")
  const { CASE_KINDS } = await import("../src/lib/labels-normalize")
  const truoc = await banhNhan(1)
  const gocFetch = globalThis.fetch
  globalThis.fetch = (async (_url: string, init: RequestInit) => hai.POST(postTruongHop(a.cookie, 1, JSON.parse(String(init.body))), reviewCtx(1))) as unknown as typeof fetch
  const lanGhi = async (M: ManLuotHai, the: string | null, loai: string | null) => {
    const dom = await dungDom()
    const di: string[] = []
    try {
      await dom.render(<M.LuotHai d={dLuotHai("THE")} hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} />)
      if (the) await dom.chon("th-the", the)
      if (loai) await dom.chon("th-kind", loai)
      await dom.bam("Ghi và sang tin kế")
      await dom.cho(() => di.length === 1 || !!document.querySelector("[data-labels-loi-truong-hop]"))
      return di.length === 1
    } finally {
      await dom.xong()
    }
  }
  try {
    for (const nhan of ["Đúng", "Sai", "Chưa xét được"]) assert.ok(await lanGhi({ LuotHai } as unknown as ManLuotHai, nhan, null), `ô Thẻ nhóm «${nhan}» không ghi được`)
    for (const k of CASE_KINDS) assert.ok(await lanGhi({ LuotHai } as unknown as ManLuotHai, null, k.label), `loại «${k.label}» không ghi được`)
    const res = await hai.GET(new Request("http://localhost/x", { headers: { cookie: a.cookie } }), reviewCtx(1))
    const j = (await res.json()) as { truongHop: { groupCardVerdict: string | null; caseKind: string | null }[] }
    assert.deepEqual(j.truongHop.slice(0, 3).map((t) => t.groupCardVerdict), ["correct", "wrong", "unsure"])
    assert.deepEqual(j.truongHop.slice(3).map((t) => t.caseKind), CASE_KINDS.map((k) => k.value))
    assert.equal(await banhNhan(1), truoc)
    const dot = await banDot<ManLuotHai>("src/components/ops/labels/luot-hai.tsx", "{ value: \"correct\", label: \"Đúng\" }", "{ value: \"dung\", label: \"Đúng\" }")
    const con = j.truongHop.length
    assert.equal(await lanGhi(dot, "Đúng", null), false, "đối chứng không đỏ: bản đổi mã trả lời thẻ vẫn ghi được")
    assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases WHERE item_id = 1`)).rows[0].n, con)
  } finally {
    globalThis.fetch = gocFetch
  }
})

test("GCN-AC-3 bieu mau that gui gia tri qua route: điền đủ 24 ô trên màn, lý do trống bị chặn dưới ô, lưu ra đúng giá trị, căn cứ, đơn vị; đột biến bị bắt", async () => {
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const { selectOptions } = await import("../src/lib/labels-normalize")
  type ManForm = { LabelFormNhom: typeof LabelFormNhom }
  const nhanTheoMa = (axis: "listing_intent" | "kind" | "property_type", ma: string) => selectOptions(axis).find((o) => o.value === ma)!.label
  const gocFetch = globalThis.fetch
  const chay = async (M: ManForm) => {
    await datLat()
    const a = await taoNguoi(sc, "ops")
    globalThis.fetch = (async (url: string, init: RequestInit) => POST(new Request(`http://localhost${url}`, {
      method: "POST", headers: { "content-type": "application/json", cookie: a.cookie }, body: String(init.body),
    }))) as unknown as typeof fetch
    const dom = await dungDom()
    const di: string[] = []
    const tin = { itemId: 1, lat: LAT, doubleLabel: false, soNguoi: 0, text: `${CHU} tin 1`, anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null }
    const nut = (f: string, chu: string) => [...document.querySelectorAll(`[data-o="${f}"] button`)].find((b) => b.textContent?.trim() === chu || b.getAttribute("aria-label") === chu)
    const hop = (f: string) => document.querySelector(`[data-o="${f}"] [role="checkbox"]`)
    try {
      await dom.render(<M.LabelFormNhom lat={LAT} tin={tin} hrefXem="/xem-1" hrefTinKe="/tin-ke" diToi={(h) => di.push(h)} baoTin={() => {}} />)
      await dom.nhan(nut("listing_intent", nhanTheoMa("listing_intent", "offer")), "Ý định")
      await dom.nhan(nut("kind", nhanTheoMa("kind", "sale")), "Loại tin")
      await dom.nhan(nut("property_type", nhanTheoMa("property_type", "apartment")), "Loại hình")
      await dom.nhan(nut("multi_unit", "Không"), "Nhiều căn")
      await dom.go("nhan-project", "Vinhomes Grand Park")
      await dom.go("nhan-subzone", "Sapphire")
      await dom.nhan(nut("subzone", "Ngữ cảnh nhóm"), "căn cứ phân khu")
      await dom.go("nhan-building", "S5.03")
      await dom.go("nhan-stack", "12")
      await dom.nhan(hop("floor"), "ô không suy ra được của tầng")
      await dom.go("nhan-bedrooms", "2")
      await dom.nhan(nut("bedrooms_plus", "Không"), "phòng cộng")
      await dom.go("nhan-bathrooms", "1")
      await dom.nhan(nut("bathrooms", "Kiến thức nghề"), "căn cứ WC")
      await dom.go("nhan-area_m2", "64,5")
      await dom.nhan([...document.querySelectorAll('[aria-label="Đơn vị giá"] button')].find((b) => b.textContent?.trim() === "triệu"), "đơn vị triệu")
      await dom.go("nhan-price_min_vnd", "4350")
      await dom.go("nhan-price_max_vnd", "4350")
      await dom.nhan(hop("seller_name"), "ô không suy ra được của tên")
      await dom.go("nhan-seller_phone", "0912 345 678")
      // truong-nhan-s03-081: bảy ô mới bắt buộc; View chọn hai giá trị, sáu ô còn lại không suy ra được.
      await dom.nhan(nut("view", "Hồ"), "view hồ")
      await dom.nhan(nut("view", "Thành phố"), "view thành phố")
      for (const f of ["unit_number", "furnished", "direction_faces", "availability_date", "price_basis", "rent_includes"]) await dom.nhan(hop(f), `ô không suy ra được của ${f}`)
      await dom.bam("Lưu và xem máy đọc")
      await dom.cho(() => !!document.querySelector('[data-o="reason"] [data-slot="field-error"]') || !!document.querySelector("[data-o] [data-loi]") || !!document.querySelector("[data-loi]"))
      const loiLyDo = document.querySelector('[data-o="reason"]')?.textContent ?? ""
      const dongSauLoi = (await sc.query(`SELECT count(*)::int AS n FROM eval_labels`)).rows[0].n as number
      await dom.go("nhan-reason", "Nhóm này gọi khu đó là Sapphire")
      await dom.bam("Lưu và xem máy đọc")
      await dom.cho(() => di.length === 1)
      const { rows } = await sc.query(`SELECT field, value, not_stated, basis FROM eval_labels WHERE item_id = 1 AND labeler_id = $1`, [a.id])
      const { rows: ly } = await sc.query(`SELECT reason FROM eval_label_reasons WHERE item_id = 1 AND labeler_id = $1`, [a.id])
      return { loiLyDo, dongSauLoi, di, ly: ly.map((r) => r.reason), nhan: Object.fromEntries(rows.map((r) => [r.field, [r.value, r.not_stated, r.basis]])) }
    } finally {
      await dom.xong()
    }
  }
  try {
    const kq = await chay({ LabelFormNhom })
    assert.match(kq.loiLyDo, new RegExp(MSG_THIEU_LY_DO), "lý do trống phải báo dưới ô Lý do")
    assert.equal(kq.dongSauLoi, 0, "lý do trống không ghi dòng nào")
    assert.deepEqual(kq.di, ["/xem-1"])
    assert.deepEqual(kq.ly, ["Nhóm này gọi khu đó là Sapphire"])
    const KY_NHAN = {
      listing_intent: ["offer", false, "chu_bai"], kind: ["sale", false, "chu_bai"], property_type: ["apartment", false, "chu_bai"], multi_unit: ["no", false, null],
      project: ["vinhomes grand park", false, "chu_bai"], subzone: ["sapphire", false, "ngu_canh_nhom"], building: ["s5.03", false, "chu_bai"], stack: ["12", false, "chu_bai"], floor: [null, true, null],
      bedrooms: ["2", false, "chu_bai"], bedrooms_plus: ["no", false, "chu_bai"], bathrooms: ["1", false, "kien_thuc_nghe"], area_m2: ["64.5", false, "chu_bai"],
      price_min_vnd: ["4350000000", false, "chu_bai"], price_max_vnd: ["4350000000", false, "chu_bai"], seller_name: [null, true, null], seller_phone: ["+84912345678", false, "chu_bai"],
      view: ["city,lake", false, "chu_bai"], unit_number: [null, true, null], furnished: [null, true, null], direction_faces: [null, true, null],
      availability_date: [null, true, null], price_basis: [null, true, null], rent_includes: [null, true, null],
    }
    assert.deepEqual(kq.nhan, KY_NHAN)
    assert.equal(Object.keys(kq.nhan).length, 24)
    // Đột biến khâu dựng thân gửi: mỗi bản phải làm kết quả khác.
    const boDonVi = await banDot<ManForm>("src/components/ops/labels/label-form-nhom.tsx", "...(d.kind === \"gia\" ? { unit: donVi } : {})", "...(d.kind === \"gia\" ? { unit: \"ty\" } : {})")
    assert.notDeepEqual((await chay(boDonVi)).nhan, KY_NHAN, "đối chứng không đỏ: bản bỏ đơn vị đã chọn vẫn xanh")
    const boKhongSuyRa = await banDot<ManForm>("src/components/ops/labels/label-form-nhom.tsx", "if (c.unknown) values[d.id] = { not_stated: true }\n      else ", "")
    assert.notDeepEqual((await chay(boKhongSuyRa)).nhan, KY_NHAN, "đối chứng không đỏ: bản bỏ ô không suy ra được vẫn xanh")
  } finally {
    globalThis.fetch = gocFetch
  }
})

test("TND-AC-6 lỗi theo ô: sửa ô thì lỗi ô đó mất, giá xoá cả hai đầu, ô khác giữ lỗi", async () => {
  const LOI = { area_m2: "Diện tích phải là số", price_min_vnd: "Giá thấp nhất sai", price_max_vnd: "Giá cao nhất sai", building: "Toà sai", kind: "Loại tin sai" }
  const gocFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: "Có trường sai", loi: LOI }), { status: 400 })) as unknown as typeof fetch
  type Mod = typeof import("../src/components/ops/labels/label-form-nhom")
  // Bảng kỳ vọng viết trước: sau mỗi bước, các ô còn mang lỗi.
  // Bốn cách sửa của trục Coverage: gõ giá (cả hai đầu), tick, chọn, đổi đơn vị giá (lưu lại để có lỗi giá mới trước khi đổi).
  const KY_VONG = [
    ["area_m2", "building", "kind", "price_max_vnd", "price_min_vnd"],
    ["area_m2", "building", "kind"],
    ["building", "kind"],
    ["building"],
    ["area_m2", "building", "kind", "price_max_vnd", "price_min_vnd"],
    ["area_m2", "building", "kind"],
  ]
  const chay = async (mod: Mod) => {
    const dom = await dungDom()
    try {
      const tin = { itemId: 1, lat: "x", doubleLabel: false, soNguoi: 0, text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null }
      await dom.render(<mod.LabelFormNhom lat="x" tin={tin} hrefXem="/xem" hrefTinKe="/ke" diToi={() => {}} baoTin={() => {}} />)
      const coLoi = () => [...document.querySelectorAll("[data-o][data-loi]")].map((e) => e.getAttribute("data-o")!).filter((o) => o !== "reason").sort()
      const thay: string[][] = []
      await dom.bam("Lưu và xem máy đọc")
      await dom.cho(() => coLoi().length > 0)
      thay.push(coLoi())
      await dom.go("nhan-price_min_vnd", "4,35")
      thay.push(coLoi())
      await dom.nhan(document.querySelector('[aria-label="Diện tích: không suy ra được"]'), "ô Không suy ra được của Diện tích")
      thay.push(coLoi())
      await dom.nhan(document.querySelector('[data-o="kind"] button'), "lựa chọn đầu của Loại tin")
      thay.push(coLoi())
      await dom.bam("Lưu và xem máy đọc")
      await dom.cho(() => coLoi().length > 1)
      thay.push(coLoi())
      await dom.nhan([...document.querySelectorAll('[aria-label="Đơn vị giá"] button')].find((b) => b.textContent?.trim() === "triệu"), "đơn vị triệu")
      thay.push(coLoi())
      return thay
    } finally {
      await dom.xong()
    }
  }
  try {
    assert.deepEqual(await chay(await import("../src/components/ops/labels/label-form-nhom")), KY_VONG, "LOI CU CON SAU KHI SUA O")
    // Chiều đỏ: bản không bỏ lỗi khi sửa ô giữ nguyên lỗi cũ.
    const dot = await banDot<Mod>("src/components/ops/labels/label-form-nhom.tsx", "    boLoi(O_GIA.includes(f) ? O_GIA : [f])\n", "")
    assert.notDeepEqual(await chay(dot), KY_VONG, "đối chứng không đỏ: LOI CU CON SAU KHI SUA O")
    // Chiều đỏ riêng của nút đơn vị giá: bản đổi đơn vị mà không bỏ lỗi giá.
    const dotDonVi = await banDot<Mod>("src/components/ops/labels/label-form-nhom.tsx", "setDonVi(v[0] as PriceUnit)\n                                boLoi(O_GIA)", "setDonVi(v[0] as PriceUnit)")
    assert.notDeepEqual(await chay(dotDonVi), KY_VONG, "đối chứng không đỏ: LOI GIA CON SAU KHI DOI DON VI")
  } finally {
    globalThis.fetch = gocFetch
  }
})

test("THN-AC-1 tin hai người chưa ai gắn xếp cuối nhóm: tin đơn ra trước, người hai vẫn nhận tin trùng trước, tiến độ không đổi", async () => {
  // Hai tin trùng đứng đầu và giữa nhóm U-A (i1, i3), tin đơn i2, i4; U-B hai tin đơn (i5, i6).
  const datTrung = async () => {
    await datLat()
    await sc.query(`UPDATE eval_label_items SET double_label = (item_id IN (1, 3)) WHERE lat = $1`, [LAT])
  }
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  type Mod = typeof import("../src/lib/labels-queries")
  const chay = async (m: Mod, u: string, nhom: string | null) => {
    const thay: (number | null)[] = []
    for (let k = 0; k < 8; k++) {
      const id = (await m.tinKe(u, LAT, sc, nhom))?.itemId ?? null
      thay.push(id)
      if (id === null) break
      assert.deepEqual(await m.ghiNhan(sc, u, LAT, id, ch.rows, "lý do"), { ok: true })
    }
    return thay
  }
  const q = await import("../src/lib/labels-queries")
  const soNhom = async (u: string) => (await q.nhomCuaLat(u, LAT, sc)).filter((n) => n.unitCode === "U-A").map((n) => [n.tong, n.conChoToi, n.choNguoiHai])
  // Bảng kỳ vọng viết trước. Theo nhóm: tin đơn tăng dần rồi tin trùng tăng dần. Không nhóm: cả lát, tin trùng cuối.
  const KY_NHOM = [2, 4, 1, 3, null]
  const KY_CA_LAT = [2, 4, 5, 6, 1, 3, null]
  await datTrung()
  const a = await taoNguoi(sc, "ops")
  const truoc = await q.tienDo(a.id, LAT, sc, "U-A")
  assert.deepEqual([truoc.tong, truoc.conChoToi, truoc.trungTong], [4, 4, 2], "tiến độ đếm đủ tin trùng")
  assert.deepEqual(await soNhom(a.id), [[4, 4, 0]])
  assert.deepEqual(await chay(q, a.id, "U-A"), KY_NHOM, "THE HAI NGUOI CHAN NHOM")
  const sau = await q.tienDo(a.id, LAT, sc, "U-A")
  assert.deepEqual([sau.tong, sau.cuaToi, sau.conChoToi, sau.trungTong], [4, 4, 0, 2])
  assert.deepEqual(await soNhom(a.id), [[4, 0, 2]], "hai tin trùng chờ người thứ hai")
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_items WHERE lat = $1 AND double_label`, [LAT])).rows[0].n, 2, "không xoá, không đổi cờ tin trùng")
  // Không chọn nhóm: cùng luật trên cả lát.
  await datTrung()
  const a2 = await taoNguoi(sc, "ops")
  assert.deepEqual(await chay(q, a2.id, null), KY_CA_LAT, "THE HAI NGUOI CHAN LAT KHI KHONG CHON NHOM")
  // Người hai nhận tin trùng đã một người gắn trước tin đơn còn trống của nhóm.
  await datTrung()
  const a3 = await taoNguoi(sc, "ops")
  const b = await taoNguoi(sc, "ops")
  assert.deepEqual(await q.ghiNhan(sc, a3.id, LAT, 3, ch.rows, "lý do"), { ok: true })
  assert.equal((await q.tinKe(b.id, LAT, sc, "U-A"))?.itemId, 3, "CAP TRUNG KHONG DUNG TRUOC")
  // Chiều đỏ: bản xếp cũ (chỉ theo item_id) và bản bỏ khoá cặp-trước, mỗi bản ra kết quả khác.
  await datTrung()
  const cu = await banDot<Mod>("src/lib/labels-queries.ts", "= 1) DESC, i.double_label, i.item_id", "= 1) DESC, i.item_id")
  assert.notDeepEqual(await chay(cu, (await taoNguoi(sc, "ops")).id, "U-A"), KY_NHOM, "đối chứng không đỏ: THE HAI NGUOI CHAN NHOM")
  await datTrung()
  const boCap = await banDot<Mod>("src/lib/labels-queries.ts", "ORDER BY (i.double_label AND coalesce(n.so, 0) = 1) DESC, i.double_label, i.item_id", "ORDER BY i.double_label, i.item_id")
  const a4 = await taoNguoi(sc, "ops")
  const b4 = await taoNguoi(sc, "ops")
  assert.deepEqual(await q.ghiNhan(sc, a4.id, LAT, 3, ch.rows, "lý do"), { ok: true })
  assert.notEqual((await boCap.tinKe(b4.id, LAT, sc, "U-A"))?.itemId, 3, "đối chứng không đỏ: CAP TRUNG KHONG DUNG TRUOC")
})

// ---------- don-vi-gia-theo-loai-tin ----------
const TIN_DVG = { itemId: 4321, lat: "x", doubleLabel: false, soNguoi: 0, text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null }
type ManNhom = typeof import("../src/components/ops/labels/label-form-nhom")
const NHOM_FORM = "src/components/ops/labels/label-form-nhom.tsx"
const tenLoai = async (ma: string) => (await import("../src/lib/labels-normalize")).selectOptions("kind").find((o) => o.value === ma)!.label
const nutLoai = (ten: string) => [...document.querySelectorAll('[data-o="kind"] button')].find((b) => b.textContent?.trim() === ten)
const nutDonVi = (chu: string) => [...document.querySelectorAll('[aria-label="Đơn vị giá"] button')].find((b) => b.textContent?.trim() === chu)
const donViSang = () => [...document.querySelectorAll('[aria-label="Đơn vị giá"] button')].find((b) => b.getAttribute("aria-pressed") === "true")?.textContent?.trim()

test("DVG-AC-1 đơn vị giá theo Loại tin: Cho thuê là triệu, Bán là tỷ, bỏ chọn giữ nguyên; người tự bấm đơn vị (kể cả nút đang sáng) thì Loại tin không ghi đè", async () => {
  const [THUE, BAN] = [await tenLoai("rent_lt"), await tenLoai("sale")]
  // Bảng kỳ vọng viết trước. Lượt A: khởi đầu, Cho thuê, bỏ chọn, Bán, bấm tay triệu, Bán (bỏ rồi chọn lại), Cho thuê.
  // Lượt B (biểu mẫu mới): bấm lại «tỷ» đang sáng, rồi Cho thuê.
  const KY = { a: ["tỷ", "triệu", "triệu", "tỷ", "triệu", "triệu", "triệu"], b: ["tỷ", "tỷ"] }
  const chay = async (mod: ManNhom) => {
    const kq: { a: (string | undefined)[]; b: (string | undefined)[] } = { a: [], b: [] }
    for (const luot of ["a", "b"] as const) {
      const dom = await dungDom()
      try {
        await dom.render(<mod.LabelFormNhom lat="x" tin={TIN_DVG} hrefXem="/xem" hrefTinKe="/ke" diToi={() => {}} baoTin={() => {}} />)
        const t = kq[luot]
        if (luot === "a") {
          t.push(donViSang())
          await dom.nhan(nutLoai(THUE), "Cho thuê")
          t.push(donViSang())
          await dom.nhan(nutLoai(THUE), "bỏ chọn Cho thuê")
          t.push(donViSang())
          await dom.nhan(nutLoai(BAN), "Bán")
          t.push(donViSang())
          await dom.nhan(nutDonVi("triệu"), "đơn vị triệu bấm tay")
          t.push(donViSang())
          await dom.nhan(nutLoai(BAN), "bỏ chọn Bán")
          await dom.nhan(nutLoai(BAN), "Bán")
          t.push(donViSang())
          await dom.nhan(nutLoai(THUE), "Cho thuê")
          t.push(donViSang())
        } else {
          await dom.nhan(nutDonVi("tỷ"), "bấm lại tỷ đang sáng")
          t.push(donViSang())
          await dom.nhan(nutLoai(THUE), "Cho thuê")
          t.push(donViSang())
        }
      } finally {
        await dom.xong()
      }
    }
    return kq
  }
  assert.deepEqual(await chay(await import("../src/components/ops/labels/label-form-nhom")), KY, "DON VI KHONG THEO LOAI TIN")
  const khongTheo = await banDot<ManNhom>(NHOM_FORM, "const theoLoai = f === \"kind\"", "const theoLoai = false && f === \"kind\"")
  assert.notDeepEqual((await chay(khongTheo)).a, KY.a, "đối chứng không đỏ: DON VI KHONG THEO LOAI TIN")
  const deTay = await banDot<ManNhom>(NHOM_FORM, "patch.value !== undefined && !donViTay ?", "patch.value !== undefined ?")
  assert.notDeepEqual((await chay(deTay)).a, KY.a, "đối chứng không đỏ: LOAI TIN DE LUA CHON TAY")
  const sangKhongTinh = await banDot<ManNhom>(NHOM_FORM, "                              setDonViTay(true)\n                              if (v[0]) {", "                              if (v[0]) {\n                                setDonViTay(true)")
  assert.notDeepEqual((await chay(sangKhongTinh)).b, KY.b, "đối chứng không đỏ: BAM LAI NUT SANG KHONG TINH LA TAY")
})

test("DVG-AC-2 giá lạ so với Loại tin: hỏi lại một lần nêu giá và đơn vị, Sửa lại không gửi, Vẫn lưu gửi đúng; đổi giá thì hỏi lại; giá thường và ô không suy ra được không hỏi", async () => {
  type ManGia = typeof import("../src/components/ops/labels/gia-la")
  // Biên viết trước của cauGiaLa: [loại, [thấp, cao], đơn vị] → có hỏi.
  const BIEN: [string | undefined, string[], "ty" | "trieu", boolean][] = [
    ["rent_lt", ["999", ""], "trieu", false], ["rent_lt", ["1000", ""], "trieu", true], ["rent_lt", ["0,999", ""], "ty", false], ["rent_lt", ["1", ""], "ty", true],
    ["rent_lt", ["15", "15000"], "trieu", true], ["sale", ["99", ""], "trieu", true], ["sale", ["100", ""], "trieu", false], ["sale", ["5", "5"], "ty", false],
    ["sale", ["0", ""], "ty", true], ["sale", ["5", "50"], "trieu", true], [undefined, ["11000", ""], "ty", false], ["rent_lt", ["11.000", ""], "ty", false],
  ]
  const bien = (m: ManGia) => BIEN.map(([k, g, u]) => m.cauGiaLa(k, g, u) !== null)
  const goc = await import("../src/components/ops/labels/gia-la")
  assert.deepEqual(bien(goc), BIEN.map((b) => b[3]), "NGUONG GIA LA SAI")
  assert.match(goc.cauGiaLa("rent_lt", ["11000", ""], "ty")!, /11000 tỷ một tháng/)
  assert.match(goc.cauGiaLa("sale", ["50", ""], "trieu")!, /50 triệu/)
  for (const [tu, thanh, ten] of [
    ["v >= MOT_TY", "v > MOT_TY", ">= thanh >"], ["BigInt(1_000_000_000)", "BigInt(10_000_000_000)", "nguong thue 10 ty"],
    ["BigInt(100_000_000)", "BigInt(60_000_000)", "nguong ban 60 trieu"], ["for (const s of gia)", "for (const s of gia.slice(0, 1))", "chi xet gia thap nhat"],
    ["${TEN[unit]} một tháng", "${TEN.ty} một tháng", "sai ten don vi"],
  ] as const) {
    const dot = await banDot<ManGia>("src/components/ops/labels/gia-la.ts", tu, thanh)
    const khac = JSON.stringify(bien(dot)) !== JSON.stringify(BIEN.map((b) => b[3])) || !/1500 triệu một tháng/.test(dot.cauGiaLa("rent_lt", ["1500", ""], "trieu") ?? "")
    assert.ok(khac, `đối chứng không đỏ: ${ten}`)
  }
  const [THUE, BAN] = [await tenLoai("rent_lt"), await tenLoai("sale")]
  const gocFetch = globalThis.fetch
  const gui: { min?: { value?: string; unit?: string; not_stated?: boolean } }[] = []
  globalThis.fetch = (async (_u: string, init: RequestInit) => {
    gui.push({ min: JSON.parse(String(init.body)).values.price_min_vnd })
    return new Response("{}", { status: 200 })
  }) as unknown as typeof fetch
  // Bảng kỳ vọng viết trước: sau mỗi bước [hộp mở, chữ hộp có giá và đơn vị, số lần gửi].
  const KY = [
    [true, "11000 tỷ", 0], // thuê, tỷ bấm tay, 11000: hỏi
    [false, "", 0], // Sửa lại
    [true, "11000 tỷ", 0], // lưu lại: vẫn hỏi
    [false, "", 1], // Vẫn lưu
    [false, "", 2], // lưu lại đúng bộ đã xác nhận: không hỏi
    [true, "12000 tỷ", 2], // đổi giá sau khi xác nhận: hỏi lại
    [false, "", 2], // Sửa lại
    [false, "", 3], // tick giá không suy ra được: không hỏi, gửi not_stated
    [false, "", 4], // bỏ tick, thuê 15 triệu: không hỏi
    [false, "", 5], // Bán, 5 tỷ: không hỏi
    [true, "50 triệu", 5], // Bán 50 triệu: hỏi
  ]
  const chay = async (mod: ManNhom) => {
    gui.length = 0
    const dom = await dungDom()
    try {
      await dom.render(<mod.LabelFormNhom lat="x" tin={TIN_DVG} hrefXem="/xem" hrefTinKe="/ke" diToi={() => {}} baoTin={() => {}} />)
      const hop = () => document.querySelector("[data-labels-hoi-gia]")
      const buoc: [boolean, string, number][] = []
      const ghi = (canChu = "") => buoc.push([!!hop(), hop() && canChu && hop()!.textContent?.includes(canChu) ? canChu : "", gui.length])
      const luu = async (n: number) => { await dom.bam("Lưu và xem máy đọc"); await dom.cho(() => !!hop() || gui.length >= n) }
      await dom.nhan(nutLoai(THUE), "Cho thuê")
      await dom.nhan(nutDonVi("tỷ"), "tỷ bấm tay")
      await dom.go("nhan-price_min_vnd", "11000")
      await luu(1); ghi("11000 tỷ")
      if (hop()) await dom.bam("Sửa lại")
      ghi()
      await luu(1); ghi("11000 tỷ")
      if (hop()) await dom.bam("Vẫn lưu")
      await dom.cho(() => gui.length >= 1); ghi()
      await luu(2); ghi()
      await dom.go("nhan-price_min_vnd", "12000")
      await luu(3); ghi("12000 tỷ")
      if (hop()) await dom.bam("Sửa lại")
      ghi()
      const tickGia = () => document.querySelector('[data-o="price_min_vnd"] [role="checkbox"]')
      await dom.nhan(tickGia(), "giá không suy ra được")
      await luu(3); ghi()
      await dom.nhan(tickGia(), "bỏ tick giá")
      await dom.go("nhan-price_min_vnd", "15")
      await dom.nhan(nutDonVi("triệu"), "triệu")
      await luu(4); ghi()
      await dom.nhan(nutLoai(BAN), "Bán")
      await dom.nhan(nutDonVi("tỷ"), "tỷ")
      await dom.go("nhan-price_min_vnd", "5")
      await luu(5); ghi()
      await dom.go("nhan-price_min_vnd", "50")
      await dom.nhan(nutDonVi("triệu"), "triệu")
      await luu(6); ghi("50 triệu")
      return { buoc, gui: [...gui] }
    } finally {
      await dom.xong()
    }
  }
  try {
    const kq = await chay(await import("../src/components/ops/labels/label-form-nhom"))
    assert.deepEqual(kq.buoc, KY, "GIA LA KHONG HOI LAI")
    assert.deepEqual(kq.gui[0].min, { value: "11000", unit: "ty", basis: "chu_bai" }, "Vẫn lưu gửi đúng giá và đơn vị người chọn")
    assert.deepEqual(kq.gui[2].min, { not_stated: true }, "ô không suy ra được gửi not_stated, không hỏi giá cũ")
    for (const [tu, thanh, ten] of [
      ["if (cau && !xacNhan && daXacNhan !== khoa) {", "if (false) {", "GIA LA KHONG HOI LAI"],
      ["if (cau && !xacNhan && daXacNhan !== khoa) {", "if (cau && !xacNhan) {", "HOI LAI SAU KHI DA XAC NHAN"],
      ["const khoa = JSON.stringify([tin.itemId, kind, gia, donVi])", "const khoa = JSON.stringify([kind])", "KHOA XAC NHAN THO"],
      ["const gia = O_GIA.map((f) => (cell(f).unknown ? \"\" : cell(f).value))", "const gia = O_GIA.map((f) => cell(f).value)", "HOI GIA DA TICK KHONG SUY RA"],
    ] as const) {
      const dot = await banDot<ManNhom>(NHOM_FORM, tu, thanh)
      assert.notDeepEqual((await chay(dot)).buoc, KY, `đối chứng không đỏ: ${ten}`)
    }
  } finally {
    globalThis.fetch = gocFetch
  }
})

test("DVG-AC-3 mã thẻ «#<item_id>» mở đầu dòng mô tả ở lượt một (hai lát) và lượt hai, bấm thì chép đúng mã, bảng tạm bị chặn thì báo", async () => {
  type ManView = typeof import("../src/components/ops/labels/labels-view")
  type ManHai = typeof import("../src/components/ops/labels/luot-hai")
  const T = { tong: 4, cuaToi: 0, conChoToi: 4, trungDu: 0, trungTong: 0 }
  const d = { itemId: 4321, lat: "x", text: "chữ", anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null, lyDo: null, truongHop: [], soTin: 0, the: null, cuaToi: [], boDoc: null, aiDoc: null }
  // Mã là con đầu của đúng dòng mô tả chứa «S03 · », trong khối có lớp text-xs.
  const dauDong = (html: string) => {
    const m = /<(div|p)\b([^>]*)><button\b([^>]*)>#4321(?:(?!<\/button>)[\s\S])*<\/button> · S03 · /.exec(html)
    return !!m && /class="[^"]*\btext-xs\b/.test(m[2]) && /data-labels-ma-the="4321"/.test(m[3])
  }
  const ba = async (v: ManView, n: ManNhom, h: ManHai) => [
    dauDong(renderToStaticMarkup(<v.LabelsView mode="local" lat="x" coGhi tienDo={T} dongThuan={[]} tin={TIN_DVG} />)),
    dauDong(renderToStaticMarkup(<n.LabelFormNhom lat="x" tin={TIN_DVG} hrefXem="/xem" hrefTinKe="/ke" />)),
    dauDong(renderToStaticMarkup(<h.LuotHai d={d} hrefTinKe="/x" />)),
  ]
  const [v, n, h] = [await import("../src/components/ops/labels/labels-view"), await import("../src/components/ops/labels/label-form-nhom"), await import("../src/components/ops/labels/luot-hai")]
  assert.deepEqual(await ba(v, n, h), [true, true, true], "THIEU MA THE DAU DONG")
  // Bản chép đột biến biên dịch JSX theo kiểu cũ: cần React ở global khi ca chạy riêng.
  Object.assign(globalThis, { React: await import("react") })
  const vDot = await banDot<ManView>("src/components/ops/labels/labels-view.tsx", "<MaThe itemId={tin.itemId} /> · S03 ·", "S03 ·")
  const nDot = await banDot<ManNhom>(NHOM_FORM, "<MaThe itemId={tin.itemId} /> · S03 ·", "S03 ·")
  const hDot = await banDot<ManHai>("src/components/ops/labels/luot-hai.tsx", "<MaThe itemId={d.itemId} /> · S03 ·", "S03 ·")
  assert.deepEqual(await ba(vDot, nDot, hDot), [false, false, false], "đối chứng không đỏ: THIEU MA THE DAU DONG")
  // sonner có hai bản (ESM và CJS) tuỳ đường nạp: thay toast.error ở cả hai để bắt lời báo của MaThe.
  const { createRequire } = await import("node:module")
  const hai = [(await import("sonner")).toast, createRequire(import.meta.url)("sonner").toast] as { error: (m: string) => unknown }[]
  const goc = hai.map((t) => t.error)
  const bao: string[] = []
  for (const t of hai) t.error = (m: string) => { bao.push(m) }
  try {
    for (const kieu of ["chep", "tu-choi", "khong-co"] as const) {
      const dom = await dungDom()
      try {
        const chep: string[] = []
        const clip = kieu === "khong-co" ? undefined : { writeText: async (t: string) => { if (kieu === "tu-choi") throw new Error("chặn"); chep.push(t) } }
        Object.defineProperty(globalThis.navigator, "clipboard", { value: clip, configurable: true })
        const { MaThe } = await import("../src/components/ops/labels/ma-the")
        await dom.render(<MaThe itemId={4321} />)
        const nut = () => document.querySelector('[data-labels-ma-the="4321"]')
        assert.equal(nut()?.getAttribute("aria-label"), "Chép mã thẻ 4321")
        const truoc = bao.length
        await dom.nhan(nut(), "mã thẻ")
        await dom.cho(() => chep.length > 0 || bao.length > truoc)
        if (kieu === "chep") {
          assert.deepEqual(chep, ["4321"], "CHEP SAI MA THE")
          assert.equal(nut()?.getAttribute("aria-label"), "Đã chép mã thẻ 4321")
        } else {
          assert.deepEqual([chep.length, bao.slice(truoc)], [0, ["Không chép được mã thẻ"]], `BANG TAM BI CHAN KHONG BAO (${kieu})`)
          assert.equal(nut()?.getAttribute("aria-label"), "Chép mã thẻ 4321", "không báo đã chép khi không chép được")
        }
      } finally {
        await dom.xong()
      }
    }
  } finally {
    hai.forEach((t, i) => { t.error = goc[i] })
  }
})

// ---- truong-nhan-s03-081 E2 (AC-2): khối, thứ tự hàng, căn cứ CĐT, lựa chọn theo sổ, View chọn nhiều ----
const THU_TU_KHOI: Record<string, string[]> = {
  "mo-ta": ["furnished", "direction_faces", "view", "availability_date"],
  "vi-tri": ["project", "subzone", "unit_number", "building", "stack", "floor"],
  gia: ["price_min_vnd", "price_max_vnd", "price_basis", "rent_includes"],
}
const CAN_CU_5 = ["Chữ bài", "Ảnh trong bài", "Ngữ cảnh nhóm", "Kiến thức nghề", "Danh mục CĐT"]
const MOI_7 = ["unit_number", "furnished", "direction_faces", "view", "availability_date", "price_basis", "rent_includes"]

/** Lỗi cấu trúc của biểu mẫu đang hiện (thông điệp ghim); rỗng là đạt. */
function kiemMan(VOCAB: Record<string, readonly string[]>): string[] {
  const loi: string[] = []
  for (const [k, ds] of Object.entries(THU_TU_KHOI)) {
    const khoi = document.querySelector(`[data-khoi="${k}"]`)
    if (!khoi) { loi.push(k === "mo-ta" ? "THIEU KHOI MO TA CAN" : `THIEU KHOI ${k}`); continue }
    const hang = [...khoi.querySelectorAll("[data-o]")].map((x) => x.getAttribute("data-o"))
    if (JSON.stringify(hang) !== JSON.stringify(ds)) loi.push(`THU TU HANG ${k}: ${hang.join(",")}`)
  }
  for (const f of MOI_7) {
    const h = document.querySelector(`[data-o="${f}"]`)
    if (!h) { loi.push(`THIEU HANG ${f}`); continue }
    const canCu = [...h.querySelectorAll('[aria-label$=": căn cứ"] button')].map((b) => b.getAttribute("aria-label"))
    if (JSON.stringify(canCu) !== JSON.stringify(CAN_CU_5)) loi.push(canCu.includes("Danh mục CĐT") ? `CAN CU ${f}` : "THIEU CAN CU CDT")
    if (!h.querySelector('[role="checkbox"]')) loi.push(`THIEU KHONG SUY RA ${f}`)
    if (f in VOCAB) {
      const lc = [...h.querySelectorAll('[role="group"]:not([aria-label$=": căn cứ"]) button')].length
      if (lc !== VOCAB[f].length) loi.push(`LUA CHON ${f}: ${lc}/${VOCAB[f].length}`)
    }
  }
  return loi
}

test("TN081-AC-2 biểu mẫu theo nhóm: khối Mô tả căn, mã căn, cơ sở giá, phí đã gồm, căn cứ CĐT, View chọn nhiều", async () => {
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const { VOCAB } = await import("../src/lib/vocab.generated")
  const SO = { furnished: VOCAB.furnished, direction_faces: VOCAB.direction_faces, view: VOCAB.view, price_basis: VOCAB.price_basis, rent_includes: VOCAB.rent_includes }
  type ManForm = { LabelFormNhom: typeof LabelFormNhom }
  const tin = { itemId: 1, lat: LAT, doubleLabel: false, soNguoi: 0, text: `${CHU} tin 1`, anh: [], soLinkKhac: 0, ghep: null, groupName: "N", postedAt: null }
  const moVaKiem = async (M: ManForm) => {
    const dom = await dungDom()
    try {
      await dom.render(<M.LabelFormNhom lat={LAT} tin={tin} hrefXem="/xem-1" hrefTinKe="/tin-ke" diToi={() => {}} baoTin={() => {}} />)
      const loi = kiemMan(SO)
      const nutView = (chu: string) => [...document.querySelectorAll('[data-o="view"] [role="group"]:not([aria-label$=": căn cứ"]) button')].find((b) => b.textContent?.trim() === chu)
      if (!nutView("Hồ")) return loi // bản thiếu khối: lỗi đã ghi ở kiemMan
      await dom.nhan(nutView("Hồ"), "view hồ")
      await dom.nhan(nutView("Thành phố"), "view thành phố")
      const sang = ["Hồ", "Thành phố"].filter((c) => nutView(c)?.hasAttribute("data-pressed")).length
      if (sang !== 2) loi.push("VIEW KHONG CHON NHIEU")
      return loi
    } finally {
      await dom.xong()
    }
  }
  assert.deepEqual(await moVaKiem({ LabelFormNhom }), [])
  // Chiều đỏ trên cùng thẻ.
  const thieuKhoi = await banDot<ManForm>("src/components/ops/labels/label-form-nhom.tsx", "{cot.map((id) => {", "{cot.filter((id) => id !== \"mo-ta\").map((id) => {")
  assert.ok((await moVaKiem(thieuKhoi)).includes("THIEU KHOI MO TA CAN"), "THIEU KHOI MO TA CAN")
  const motLuaChon = await banDot<ManForm>("src/components/ops/labels/label-form-nhom.tsx", "<NhomRow key={d.id} d={d}", "<NhomRow key={d.id} d={d.kind === \"chon-nhieu\" ? { ...d, kind: \"chon\" } : d}")
  assert.ok((await moVaKiem(motLuaChon)).includes("VIEW KHONG CHON NHIEU"), "VIEW KHONG CHON NHIEU")
  // CĐT: một hàng của bản NhomRow bỏ nút CĐT.
  const { KHOI } = await import("../src/components/ops/labels/nhom-fields")
  type ManRow = { NhomRow: (p: { d: (typeof KHOI)[number]["fields"][number]; o: { value: string; basis: "chu_bai"; unknown: boolean }; onChange: () => void }) => ReactNode }
  const boCdt = await banDot<ManRow>("src/components/ops/labels/nhom-row.tsx", "{BASIS_NGAN.map((b) => (", "{BASIS_NGAN.filter((b) => b.value !== \"danh_muc_cdt\").map((b) => (")
  const dom = await dungDom()
  try {
    const d = KHOI.flatMap((k) => k.fields).find((x) => x.id === "furnished")!
    await dom.render(<boCdt.NhomRow d={d} o={{ value: "", basis: "chu_bai", unknown: false }} onChange={() => {}} />)
    const canCu = [...document.querySelectorAll('[aria-label$=": căn cứ"] button')].map((b) => b.getAttribute("aria-label"))
    assert.ok(!canCu.includes("Danh mục CĐT") && canCu.length === 4, "THIEU CAN CU CDT")
  } finally {
    await dom.xong()
  }
})

// ---- truong-nhan-s03-081 E5 (AC-5), E11 (AC-9): thẻ gắn trước vòng, lượt hai, đồng thuận ----
const MOI_BAY = ["unit_number", "furnished", "direction_faces", "view", "availability_date", "price_basis", "rent_includes"]
type ModBang = { BangSo: (p: { d: never }) => React.ReactElement }
const oBang = (html: string, f: string) =>
  (html.match(new RegExp(`<tr[^>]*data-field="${f}"[^>]*>(.*?)</tr>`))?.[1] ?? "").split("<td").slice(1).map((c) => c.slice(c.indexOf(">") + 1).replace(/<[^>]+>/g, ""))

test("TN081-AC-5 thẻ gắn trước vòng (17 trường): vẫn tính đã gắn, lượt hai hiện «—» ở bảy ô mới, dòng cũ không đổi", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { ghiNhan, tienDo } = await import("../src/lib/labels-queries")
  // Thẻ 1: dòng trước vòng — đúng 17 trường, rút từ bên ghi thật rồi bỏ bảy trường mới.
  const ch = chuanHoaLuot(DU, { text: CHU })
  assert.ok(ch.ok)
  const cu = ch.rows.filter((r) => !MOI_BAY.includes(r.field))
  assert.equal(cu.length, 17)
  const c = new pg.Client({ connectionString: schemaUrl(S) })
  await c.connect()
  try { assert.deepEqual(await ghiNhan(c, a.id, LAT, 1, cu, null), { ok: true }) } finally { await c.end() }
  const bam = async () => (await sc.query(`SELECT md5(string_agg(concat_ws(',', field, value, not_stated, basis), '|' ORDER BY field)) AS b, count(*)::int AS n FROM eval_labels WHERE item_id = 1`)).rows[0]
  const truoc = await bam()
  // Thẻ 2: đủ 24 trường qua route thật.
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  assert.equal((await POST(postNhan(a.cookie, 2, DU))).status, 200)
  const t = await tienDo(a.id, LAT, sc)
  const { doiChieu } = await import("../src/lib/labels-luot-hai")
  const d = await doiChieu(a.id, 1, sc)
  assert.ok(d)
  const { BangSo } = (await import("../src/components/ops/labels/bang-so")) as unknown as ModBang
  const html = renderToStaticMarkup(<BangSo d={d as never} />)
  assert.equal(t.cuaToi, 2, "THE CU BI TINH CHUA GAN")
  for (const f of MOI_BAY) assert.equal(oBang(html, f)[1], "—", `THIEU O MOI THE CU ${f}`)
  assert.equal(oBang(html, "kind")[1], "Bán", "trường cũ hiện như trước")
  assert.deepEqual(await bam(), truoc, "dòng cũ không đổi")
  // Chiều đỏ: tiến độ đòi đủ 24 trường mới tính đã gắn.
  const doiDu = await banDot<{ tienDo: typeof tienDo }>("src/lib/labels-queries.ts", "count(DISTINCT l.labeler_id) AS so, coalesce(bool_or(l.labeler_id = $1), false) AS cua_toi",
    "count(DISTINCT l.labeler_id) AS so, (count(l.field) FILTER (WHERE l.labeler_id = $1) >= 24) AS cua_toi")
  assert.equal((await doiDu.tienDo(a.id, LAT, sc)).cuaToi, 1, "THE CU BI TINH CHUA GAN")
  // Chiều đỏ: bảng so chỉ hiện trường đã gắn — bảy ô mới biến mất thay vì «—».
  // Bản chép đột biến dịch JSX kiểu cổ điển (tệp .tsx ngoài tsconfig của app) → cần React toàn cục.
  ;(globalThis as Record<string, unknown>).React = (await import("react")).default
  const anO = await banDot<ModBang>("src/components/ops/labels/bang-so.tsx", "return LABEL_FIELDS_NHOM.map((f) => {", "return LABEL_FIELDS_NHOM.filter((f) => cua.has(f)).map((f) => {")
  assert.equal(oBang(renderToStaticMarkup(<anO.BangSo d={d as never} />), "view").length, 0, "THIEU O MOI THE CU")
})

test("TN081-AC-9 lượt hai và đồng thuận hiện bảy trường mới bằng nhãn sổ, căn cứ Danh mục CĐT đúng nhãn", async () => {
  await datLat()
  await admin.query(`DROP TABLE IF EXISTS "${S}".stg_s08_inventory`)
  await admin.query(`CREATE TABLE "${S}".stg_s08_inventory (LIKE public.stg_s08_inventory INCLUDING DEFAULTS)`)
  await sc.query(`INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, state, product_code, payload, captured_at) VALUES ('s1','snap','du-an-a','notSold','ZZ9-01','{}',now())`)
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const day = { ...DU, unit_number: { value: "ZZ9-01", basis: "danh_muc_cdt" }, furnished: chu("furnished"), view: chu("lake,city"),
    rent_includes: chu("water,management"), price_basis: chu("net"), direction_faces: chu("southeast"), availability_date: chu("2026-12") }
  const res = await POST(postNhan(a.cookie, 1, day))
  assert.equal(res.status, 200, await res.clone().text())
  const { doiChieu } = await import("../src/lib/labels-luot-hai")
  const d = await doiChieu(a.id, 1, sc)
  assert.ok(d)
  const { BangSo } = (await import("../src/components/ops/labels/bang-so")) as unknown as ModBang
  const ky = (M: ModBang) => {
    const html = renderToStaticMarkup(<M.BangSo d={d as never} />)
    return Object.fromEntries(MOI_BAY.map((f) => [f, oBang(html, f).slice(0, 2)]))
  }
  assert.deepEqual(ky({ BangSo }), {
    unit_number: ["Mã căn", "ZZ9-01 · Danh mục CĐT"], furnished: ["Nội thất", "Đủ nội thất"], direction_faces: ["Hướng", "Đông Nam"],
    view: ["View", "Thành phố, Hồ"], availability_date: ["Ngày vào ở", "2026-12"], price_basis: ["Cơ sở giá", "Thu về (NET)"],
    rent_includes: ["Phí đã gồm", "Phí quản lý, Nước"],
  })
  const { AgreementTable } = await import("../src/components/ops/labels/agreement-table")
  const { LABEL_FIELDS_NHOM: TRUONG, FIELD_LABEL } = await import("../src/lib/labels-normalize")
  const bang = renderToStaticMarkup(<AgreementTable rows={[]} fields={TRUONG} />)
  for (const f of MOI_BAY) assert.ok(bang.includes(`>${FIELD_LABEL[f as keyof typeof FIELD_LABEL]}<`), `đồng thuận thiếu hàng ${f}`)
  // Chiều đỏ: bỏ dịch chọn nhiều → hiện mã thô.
  type ModO = { hienGiaTri: (f: string, v: string) => string }
  const ma = await banDot<ModO>("src/components/ops/labels/nhom-fields.ts",
    'if (def?.kind === "chon-nhieu") return v.split(",").map((m) => def.options?.find((o) => o.value === m)?.label ?? m).join(", ")', "")
  assert.equal(ma.hienGiaTri("view", "city,lake"), "city,lake", "HIEN MA THO THAY NHAN")
})
