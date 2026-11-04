// labels-nhom.test.tsx — hồ sơ _acceptance/gan-nhan-theo-nhom-s03 (GC0), ca «GCN-AC-n». Ma trận viết trước, số assert bằng số
// phần tử. Phần chuẩn hoá không DB; phần route dùng lược đồ tạm, migration 054 + 072 thật, handler thật.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"
import {
  chuanHoaLuot,
  coTrongChu,
  LABEL_FIELDS,
  LABEL_FIELDS_NHOM,
  MSG_CAN_CU,
  MSG_KHONG_TRONG_CHU,
  MSG_SDT,
  MSG_THIEU_LY_DO,
  veE164,
  type LabelField,
  type RawCell,
  type RawLabels,
} from "../src/lib/labels-normalize"

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
  for (const m of ["054_labels.sql", "072_labels_nhom.sql"]) await sc.query(readFileSync(join(APP, "../db/migrations", m), "utf8"))
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
    ["12", "S5.12", false],
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
  const res = await POST(postTruongHop(a.cookie, 1, { case_kind: "bi-danh", note: "RB", the_nhom_dung: "dung" }), reviewCtx(1))
  assert.equal(res.status, 200, await res.clone().text())
  assert.equal(await banhNhan(1), truoc)
  const { rows } = await sc.query(`SELECT case_kind, note, the_nhom_dung, labeler_id FROM eval_label_cases WHERE item_id = 1`)
  assert.deepEqual(rows, [{ case_kind: "bi-danh", note: "RB", the_nhom_dung: "dung", labeler_id: a.id }])
})

test("GCN-AC-6 tra loi the: đúng, sai, chưa xét lưu và đọc lại; giá trị lạ 400", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const { GET, POST } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  for (const v of ["dung", "sai", "chua"]) assert.equal((await POST(postTruongHop(a.cookie, 1, { the_nhom_dung: v }), reviewCtx(1))).status, 200, v)
  assert.equal((await POST(postTruongHop(a.cookie, 1, { the_nhom_dung: "co" }), reviewCtx(1))).status, 400)
  assert.equal((await POST(postTruongHop(a.cookie, 1, { case_kind: "la" }), reviewCtx(1))).status, 400)
  const res = await GET(new Request("http://localhost/x", { headers: { cookie: a.cookie } }), reviewCtx(1))
  const j = (await res.json()) as { truongHop: { theNhomDung: string }[] }
  assert.deepEqual(j.truongHop.map((t) => t.theNhomDung), ["dung", "sai", "chua"])
})

test("GCN-AC-6 bo qua: thân rỗng không thêm dòng; tin kế vẫn sang bài sau", async () => {
  await datLat()
  const a = await nguoiDaLuu(1)
  const { POST } = await import("../src/app/api/v1/ops/labels/[itemId]/review/route")
  assert.equal((await POST(postTruongHop(a.cookie, 1, {}), reviewCtx(1))).status, 400)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_label_cases`)).rows[0].n, 0)
  const { tinKe } = await import("../src/lib/labels-queries")
  assert.equal((await tinKe(a.id, LAT, sc, "U-A"))?.itemId, 2)
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
  const cuaB = await (await goi(b.cookie)).text()
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
