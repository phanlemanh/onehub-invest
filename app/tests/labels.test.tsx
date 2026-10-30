// labels.test.tsx — hồ sơ _acceptance/man-gan-nhan-mu (PL7), ca «MGN-AC-n». Một lược đồ tạm có bảng phiên (helper phien-thu),
// stg_zalo_posts (khuôn public) và migration 054 áp vào chính lược đồ; route /api/v1/ops/labels gọi bằng Request thật
// (Cookie phiên). public không được chạm. Ma trận viết trước; mỗi phép đo có đối chứng.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { RawLabels } from "../src/lib/labels-normalize"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const S = `mgn_${process.pid}`
const TOKEN = "mgn-thu-token"
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = TOKEN

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MIG = join(APP, "../db/migrations/054_labels.sql")
const LAT = "mgn-thu"
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

/** Lát thử: 3 tin đơn (i1–i3) + 2 tin gắn trùng (i4, i5), mỗi tin một post stg mang chữ gốc riêng. */
async function datLat() {
  await sc.query(`TRUNCATE eval_labels, eval_label_items RESTART IDENTITY CASCADE`)
  await sc.query(`TRUNCATE stg_zalo_posts`)
  for (let i = 1; i <= 5; i++) {
    await sc.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, $2, 'MGN-THU nhóm', $3, now())`,
      [`zalo-mgn-${i}`, `hanoi__zalo__mgn${i}`, `CHUGOC-MGN tin ${i}`])
    await sc.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ($1, 'S03', $2, $3, $4, $5, 'thu')`,
      [LAT, `zalo-mgn-${i}`, `h${i}`, i % 2 ? "dev" : "test", i >= 4])
  }
}

const DU: RawLabels = {
  listing_intent: { value: "offer" },
  kind: { value: "sale" },
  property_type: { value: "apartment" },
  project: { value: "  Vinhomes   Ocean Park " },
  building: { value: "LD2" },
  price_min_vnd: { value: "4,35", unit: "ty" },
  price_max_vnd: { value: "4350", unit: "trieu" },
  area_m2: { value: "64,50" },
  bedrooms: { not_stated: true },
}

const post = (cookie: string | null, body: unknown, auth?: string) =>
  new Request("http://localhost/api/v1/ops/labels", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  })

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await sc.connect()
  await sc.query(readFileSync(MIG, "utf8"))
})

after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

test("MGN-AC-3 lưu chín trường: 9 dòng mang labeler_id người gọi, giá trị đã chuẩn hoá; tin không nêu → not_stated", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const res = await POST(post(a.cookie, { lat: LAT, item_id: 1, values: DU }))
  assert.equal(res.status, 200, await res.clone().text())
  const { rows } = await sc.query(`SELECT field, value, not_stated, labeler_id FROM eval_labels WHERE item_id = 1 ORDER BY field`)
  assert.equal(rows.length, 9)
  assert.ok(rows.every((r) => r.labeler_id === a.id), "NHAN KHONG CO NGUOI GAN")
  const v = Object.fromEntries(rows.map((r) => [r.field, r.not_stated ? "∅" : r.value]))
  assert.deepEqual(v, {
    area_m2: "64.5", bedrooms: "∅", building: "ld2", kind: "sale", listing_intent: "offer",
    price_max_vnd: "4350000000", price_min_vnd: "4350000000", project: "vinhomes ocean park", property_type: "apartment",
  })
})

test("MGN-AC-3 lựa chọn ba ô chọn = code của trục cùng tên trong sổ từ vựng, cùng thứ tự, nhãn của sổ", async () => {
  const { selectOptions, SELECT_AXES } = await import("../src/lib/labels-normalize")
  const { VOCAB, LABELS_VI } = await import("../src/lib/vocab.generated")
  assert.deepEqual([...SELECT_AXES], ["listing_intent", "kind", "property_type"])
  for (const ax of SELECT_AXES) {
    assert.deepEqual(selectOptions(ax).map((o) => o.value), [...VOCAB[ax]])
    for (const o of selectOptions(ax)) assert.equal(o.label, (LABELS_VI[ax] as Record<string, string>)[o.value])
  }
})

test("MGN-AC-5 phân tin hai người: không trả lại tin đã gắn; tin trùng đã một người đứng trước; đủ chỗ thì thôi", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const b = await taoNguoi(sc, "ops")
  const c = await taoNguoi(sc, "ops")
  const { tinKe, ghiNhan } = await import("../src/lib/labels-queries")
  const { chuanHoaLuot } = await import("../src/lib/labels-normalize")
  const ch = chuanHoaLuot(DU)
  assert.ok(ch.ok)
  const gan = async (u: string, id: number) => assert.deepEqual(await ghiNhan(sc, u, LAT, id, ch.rows), { ok: true })
  const ke = async (u: string) => (await tinKe(u, LAT, sc))?.itemId ?? null
  // Bảng kỳ vọng viết trước (A gắn 1, 4; B nhận tin trùng 4 trước tin mới).
  assert.equal(await ke(a.id), 1)
  await gan(a.id, 1)
  assert.equal(await ke(a.id), 2, "TRA LAI TIN DA GAN")
  await gan(a.id, 4)
  assert.equal(await ke(b.id), 4, "tin trùng đã một người phải đứng trước tin mới")
  await gan(b.id, 4)
  assert.equal(await ke(c.id), 2, "tin trùng đủ hai người và tin đơn đã gắn không đưa ai nữa")
  for (const [u, id] of [[b.id, 1], [c.id, 4], [a.id, 4]] as const) {
    const kq = await ghiNhan(sc, u, LAT, id, ch.rows)
    assert.equal(kq.ok ? 200 : kq.status, 409, `ghi ${id} phải 409`)
  }
  const { rows } = await sc.query(`SELECT item_id::int, count(DISTINCT labeler_id)::int AS n FROM eval_labels GROUP BY item_id ORDER BY item_id`)
  assert.deepEqual(rows, [{ item_id: 1, n: 1 }, { item_id: 4, n: 2 }])
})

test("MGN-AC-5 ghi đồng thời: hai giao dịch song song vào cùng tin đơn, rồi tin trùng còn một chỗ → một thành công, một 409", async () => {
  await datLat()
  const [a, b, c] = [await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops")]
  const { ghiNhan } = await import("../src/lib/labels-queries")
  const { chuanHoaLuot } = await import("../src/lib/labels-normalize")
  const ch = chuanHoaLuot(DU)
  assert.ok(ch.ok)
  const c1 = new pg.Client({ connectionString: schemaUrl(S) })
  const c2 = new pg.Client({ connectionString: schemaUrl(S) })
  await c1.connect()
  await c2.connect()
  try {
    const don = await Promise.all([ghiNhan(c1, a.id, LAT, 2, ch.rows), ghiNhan(c2, b.id, LAT, 2, ch.rows)])
    assert.deepEqual(don.map((k) => (k.ok ? 200 : k.status)).sort(), [200, 409], "GHI DOI KHI DONG THOI")
    assert.deepEqual(await ghiNhan(sc, a.id, LAT, 5, ch.rows), { ok: true })
    const trung = await Promise.all([ghiNhan(c1, b.id, LAT, 5, ch.rows), ghiNhan(c2, c.id, LAT, 5, ch.rows)])
    assert.deepEqual(trung.map((k) => (k.ok ? 200 : k.status)).sort(), [200, 409], "GHI DOI KHI DONG THOI")
    const { rows } = await sc.query(`SELECT item_id::int, count(DISTINCT labeler_id)::int AS n FROM eval_labels GROUP BY item_id ORDER BY item_id`)
    assert.deepEqual(rows, [{ item_id: 2, n: 1 }, { item_id: 5, n: 2 }])
  } finally {
    await c1.end()
    await c2.end()
  }
})

test("MGN-AC-7 bảy ca sai → 400 nêu đúng trường, 0 dòng; viewer 403, bearer 403, không phiên 401; lượt đúng → 200", async () => {
  await datLat()
  const a = await taoNguoi(sc, "ops")
  const v = await taoNguoi(sc, "viewer")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const thieu = { ...DU } as Record<string, unknown>
  delete thieu.kind
  const CA: [string, unknown, number, string][] = [
    ["thiếu trường", thieu, 1, "kind"],
    ["ngoài sổ", { ...DU, property_type: { value: "villa" } }, 1, "property_type"],
    ["giá ngược", { ...DU, price_min_vnd: { value: "5", unit: "ty" }, price_max_vnd: { value: "4", unit: "ty" } }, 1, "price_max_vnd"],
    ["số âm", { ...DU, price_min_vnd: { value: "-1", unit: "ty" } }, 1, "price_min_vnd"],
    ["diện tích 0", { ...DU, area_m2: { value: "0" } }, 1, "area_m2"],
    ["phòng ngủ lẻ", { ...DU, bedrooms: { value: "2.5" } }, 1, "bedrooms"],
  ]
  for (const [ten, values, item, truong] of CA) {
    const res = await POST(post(a.cookie, { lat: LAT, item_id: item, values }))
    assert.equal(res.status, 400, ten)
    const body = (await res.json()) as { loi: Record<string, string> }
    assert.ok(body.loi[truong], `${ten}: phải nêu trường ${truong}, có ${JSON.stringify(body.loi)}`)
  }
  const ngoai = await POST(post(a.cookie, { lat: "lat-khac", item_id: 1, values: DU }))
  assert.equal(ngoai.status, 400, "tin ngoài lát")
  assert.equal((await POST(post(v.cookie, { lat: LAT, item_id: 1, values: DU }))).status, 403, "viewer")
  assert.equal((await POST(post(null, { lat: LAT, item_id: 1, values: DU }, `Bearer ${TOKEN}`))).status, 403, "bearer")
  assert.equal((await POST(post(null, { lat: LAT, item_id: 1, values: DU }))).status, 401, "không phiên")
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_labels`)).rows[0].n, 0, "ca sai đã ghi dòng")
  assert.equal((await POST(post(a.cookie, { lat: LAT, item_id: 1, values: DU }))).status, 200, "đối chứng dương")
})

test("MGN-AC-6 bảng đồng thuận: dưới 0,9 có Badge cảnh báo, trên ngưỡng không, chưa có cặp ghi «chưa đủ cặp» không «0»", async () => {
  const { AgreementTable } = await import("../src/components/ops/labels/agreement-table")
  const html = renderToStaticMarkup(
    <AgreementTable rows={[
      { field: "kind", capDu: 20, khop: 19, tiLe: 0.95 },
      { field: "area_m2", capDu: 20, khop: 16, tiLe: 0.8 },
      { field: "project", capDu: 0, khop: 0, tiLe: null },
    ]} />,
  )
  const dong = (f: string) => html.split(`data-field="${f}"`)[1].split("</tr>")[0]
  assert.match(dong("area_m2"), /data-duoi-nguong/)
  assert.doesNotMatch(dong("kind"), /data-duoi-nguong/)
  assert.match(dong("project"), /chưa đủ cặp/)
  assert.doesNotMatch(dong("project").replace(/<[^>]+>/g, " "), /\b0[,.]?\d*\s*$/)
})

test("MGN-AC-8 trạng thái: trống · đã gắn hết · viewer · cloud không gọi truy vấn nhãn · khung tải · trang bọc RegionError", async () => {
  const { LabelsView } = await import("../src/components/ops/labels/labels-view")
  const { LabelsSkeleton } = await import("../src/components/ops/labels/labels-skeleton")
  const T0 = { tong: 0, cuaToi: 0, conChoToi: 0, trungDu: 0, trungTong: 0 }
  const T = { tong: 10, cuaToi: 10, conChoToi: 0, trungDu: 1, trungTong: 2 }
  const trong = renderToStaticMarkup(<LabelsView mode="local" lat="ocp1" coGhi tienDo={T0} dongThuan={[]} tin={null} />)
  assert.match(trong, /Chưa có tin nào của lát để gắn/)
  assert.match(trong, /label-sample\.mjs --lat ocp1/)
  const xong = renderToStaticMarkup(<LabelsView mode="local" lat="ocp1" coGhi tienDo={T} dongThuan={[]} tin={null} />)
  assert.match(xong, /Anh đã gắn hết tin của lát/)
  assert.match(xong, /data-labels-agreement/)
  assert.doesNotMatch(xong, /Chưa có tin nào/)
  const viewer = renderToStaticMarkup(<LabelsView mode="local" lat="ocp1" coGhi={false} tienDo={T} dongThuan={[]} tin={null} />)
  assert.match(viewer, /Cần vai ops để gắn nhãn/)
  assert.doesNotMatch(viewer, /data-labels-form/)
  assert.match(renderToStaticMarkup(<LabelsSkeleton />), /aria-busy="true"/)
  // cloud: không gọi pool
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool)
  let goi = 0
  ;(pool as unknown as { query: unknown }).query = (...a: unknown[]) => { goi++; return (goc as (...x: unknown[]) => unknown)(...a) }
  process.env.VERCEL = "1"
  try {
    const { LabelsContent } = await import("../src/components/ops/labels/labels-content")
    const el = await LabelsContent({ user: { id: "usr_x", email: "x@local.test", plan: "free", role: "ops" }, lat: "ocp1" })
    const html = renderToStaticMarkup(el)
    assert.match(html, /Chỉ ở máy thu/)
    assert.equal(goi, 0, "trên cloud không được truy vấn bảng nhãn")
  } finally {
    delete process.env.VERCEL
    ;(pool as unknown as { query: unknown }).query = goc
  }
  const page = readFileSync(join(APP, "src/app/ops/labels/page.tsx"), "utf8")
  assert.match(page, /<RegionError what="tin để gắn nhãn">/)
  assert.match(page, /<Suspense fallback={<LabelsSkeleton \/>}>/)
})
