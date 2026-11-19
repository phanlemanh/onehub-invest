// registry-toa-hieu-luc.test.tsx — hồ sơ _acceptance/danh-ba-toa-theo-phan-khu-hieu-luc (DA36), ca «TTH-AC-n». Lược đồ tạm
// tth_<pid> trên DB của lượt (db/db-thu.sh): bảng danh bạ chép khuôn public, bốn view thật (v_s09_du_an_moi, v_s09_toa,
// v_toa_nut_vung, offer_project và phụ thuộc) dựng lại từ định nghĩa public — nút hiệu lực của toà đi qua đúng view 097 của
// kho. Bảng kỳ vọng viết trước; mỗi phép đo có chiều đỏ trên cùng fixture (bản chép mã đổi đúng một chỗ), thông điệp ghim.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"
import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S = `tth_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

const BANG = [
  "asset_nodes", "buildings", "stacks", "units", "registry_aliases", "project_links", "s08_project_links", "s10_project_links",
  "stg_s08_project", "stg_s09_item", "areas", "sale_offer_records", "field_assertions", "stg_chotot_ads", "source_registry",
  // v_toa_nut_vung từ 111/114 đọc khu S16 từ hai bảng này (DA37); để trống vì ca ở đây không có toà S16.
  "stg_s16_toa", "stg_s16_khu",
]
const VIEW = ["sale_offers", "s06_offer_project", "offer_project", "v_s09_du_an_moi", "v_s09_toa", "v_toa_nut_vung"]

const N = { D: 9101, K: 9102, C: 9103, B: 9104 } as const
const K = (p: string, n: number) => `${p}_${String(n).padStart(26, "0")}`
const T = { T1: K("bld", 101), T2: K("bld", 102), T3: K("bld", 103), T4: K("bld", 104), T5: K("bld", 105), T6: K("bld", 106) }
const TEN_THAT = "Nguon That Tth"
const TEN_D = `${TEN_THAT} Park`

/** Bảng kỳ vọng viết trước: bốn nút × (soToa, toaChuaCan, soCan). */
const KY_VONG: Record<number, [number, number, number]> = {
  [N.D]: [5, 1, 5],
  [N.K]: [3, 0, 4],
  [N.C]: [1, 0, 1],
  [N.B]: [1, 0, 1],
}

const q = (sql: string, args: unknown[] = []) => sc.query(sql, args)
const nut = (id: number, type: string, name: string, parent: number | null, meta: object = {}) =>
  q(`INSERT INTO asset_nodes (id, node_type, name, slug, parent_id, catalog_tier, aliases, area_ids, meta) VALUES ($1,$2,$3,$4,$5,'xac_minh','{}','{}',$6)`,
    [id, type, name, `tth-${id}`, parent, meta])
const toa = (key: string, node: number, status = "active", mergedInto: string | null = null) =>
  q(`INSERT INTO buildings (building_key, status, merged_into, region_node_id, upi, iso_region, catalog_tier) VALUES ($1,$2,$3,$4,$5,'VN-HN','xac_minh')`,
    [key, status, mergedInto, node, `urn:onehub:upi:1:VN:VN-HN:${key}`])
let soCan = 0
const can = (building: string, floor: string) =>
  q(`INSERT INTO units (unit_key, status, building_key, stack_key, floor, sub_id, catalog_tier) VALUES ($1,'active',$2,NULL,$3,$1,'xac_minh')`,
    [K("unt", 100 + ++soCan), building, floor])
const biDanh = (key: string, kind: string, value: string, source: string) =>
  q(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1,$2,$3,$4)`, [key, kind, value, source])

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  for (const b of BANG) await admin.query(`CREATE TABLE "${S}".${b} (LIKE public.${b} INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING GENERATED)`)
  await sc.connect()
  for (const v of VIEW) {
    const { rows } = await admin.query<{ d: string }>(`SELECT pg_get_viewdef($1::regclass, true) AS d`, [`public.${v}`])
    await sc.query(`CREATE VIEW ${v} AS ${rows[0].d}`)
  }
  await q(`INSERT INTO source_registry (code, real_name, label_vi) VALUES ('S07', $1, 'Nguồn thử')`, [TEN_THAT])
  // Cây: D (dự án) > K (phân khu S09 sec-k) > C (cụm C1 của sec-k); B (nút building) dưới D.
  await nut(N.D, "project", TEN_D, null)
  await nut(N.K, "subzone", "Phan khu Ka", N.D, { s09_sector_ids: ["sec-k"] })
  await nut(N.C, "subzone", "Cum Ce", N.K, { s09_cum: "C1", s09_sector_id: "sec-k" })
  await nut(N.B, "building", "Nut Be", N.D)
  // Dự án S09 p9: năm block. b1 → sec-k (mã không dạng cụm) · b2 «C1.02» → cụm C · b5a sec-k + b5b không phân khu · b6 sec-k.
  const block = (id: string, code: string, sector: string | null) => ({ id, block_code: code, block_name: code, sector_uuid: sector })
  await q(`INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ('s9', 'p9', 'du-an', $1)`, [{
    chiTiet: { meta: { code: "200" }, data: { id: "p9", name: "Du an chin", insight_by_block: [
      block("b1", "T1", "sec-k"), block("b2", "C1.02", "sec-k"), block("b5a", "T5", "sec-k"), block("b5b", "T5", null), block("b6", "T6", "sec-k"),
    ] } },
  }])
  // Toà: gốc mọi toà là D, trừ T4 gốc B. T6 đã gộp vào T1.
  for (const t of [T.T1, T.T2, T.T3, T.T5]) await toa(t, N.D)
  await toa(T.T4, N.B)
  await toa(T.T6, N.D, "merged", T.T1)
  await biDanh(T.T1, "ma_nguon", "p9/b1", "S09")
  await biDanh(T.T2, "ma_nguon", "p9/b2", "S09")
  await biDanh(T.T5, "ma_nguon", "p9/b5a", "S09")
  await biDanh(T.T5, "ma_nguon", "p9/b5b", "S09")
  await biDanh(T.T6, "ma_nguon", "p9/b6", "S09")
  for (const [t, ten] of [[T.T1, "Toa Mot"], [T.T2, "Toa Hai"], [T.T3, "Toa Ba"], [T.T4, "Toa Bon"], [T.T5, "Toa Nam"]] as const) await biDanh(t, "ten", ten, "S08")
  await can(T.T1, "1"); await can(T.T1, "2"); await can(T.T2, "1"); await can(T.T4, "1"); await can(T.T5, "1")
})

after(async () => {
  await sc.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

/** Bản chép một tệp của app vào app/tests/.tth-cu-<pid>/, đổi các chỗ trong `doi`; import tương đối trỏ về tệp gốc. */
const CU = join(APP, "tests", `.tth-cu-${process.pid}`)
let soBan = 0
async function banChep<M>(rel: string, doi: [string, string][]): Promise<M> {
  let src = readFileSync(join(APP, rel), "utf8")
  for (const [tu, thanh] of doi) {
    assert.ok(src.includes(tu), `bản chép không áp được: ${tu}`)
    src = src.split(tu).join(thanh)
  }
  src = src.replace(/from "(\.{1,2}\/[^"]+)"/g, (_m, spec: string) => {
    const goc = join(APP, dirname(rel), spec)
    const f = [".ts", ".tsx", "/index.ts"].map((e) => goc + e).find((p) => existsSync(p)) ?? goc
    return `from "${pathToFileURL(f).href}"`
  })
  mkdirSync(CU, { recursive: true })
  const f = join(CU, `ban-${++soBan}.ts`)
  writeFileSync(f, src)
  return import(pathToFileURL(f).href) as Promise<M>
}
after(() => rmSync(CU, { recursive: true, force: true }))

type DocMod = typeof import("../src/lib/ops/registry/doc")
type DuAnMod = typeof import("../src/lib/ops/registry/du-an")
type HangMod = typeof import("../src/lib/ops/registry/hang-toa")

function kiemBang(d: Awaited<ReturnType<DocMod["docDanhBa"]>>) {
  const theoId = new Map(d.nut.map((n) => [n.id, n]))
  // K kiểm trước: hai chiều đỏ (cột gốc, bỏ lọc trạng thái) đều lệch đúng ở phân khu nhận toà của S09.
  for (const id of [N.K, N.C, N.B, N.D]) {
    const [soToa, toaChuaCan, soCanKv] = KY_VONG[id]
    const n = theoId.get(id)
    const ten = Object.entries(N).find(([, v]) => v === Number(id))?.[0]
    assert.deepEqual([n?.soToa, n?.toaChuaCan, n?.soCan], [soToa, toaChuaCan, soCanKv], `TTH-AC-1 nút ${ten} lệch bảng`)
  }
  const goc = d.nut.filter((n) => n.loai === "project" && n.parentId == null)
  assert.equal(goc.reduce((a, n) => a + n.soToa, 0), d.tong.toa, "TTH-AC-1 tổng soToa trên dự án gốc khác tổng toà dải số")
}

test("TTH-AC-1 số cây theo nút hiệu lực: bảng kỳ vọng viết trước; hai chiều đỏ (đọc cột gốc · bỏ lọc trạng thái)", async () => {
  const doc = await import("../src/lib/ops/registry/doc")
  const d = await doc.docDanhBa(sc)
  assert.equal(d.tong.toa, 5)
  kiemBang(d)
  const cotGoc = await banChep<DocMod>("src/lib/ops/registry/doc.ts", [["SELECT b.building_key, v.region_node_id, coalesce(c.so_can, 0) AS so_can", "SELECT b.building_key, b.region_node_id, coalesce(c.so_can, 0) AS so_can"]])
  const dCot = await cotGoc.docDanhBa(sc)
  assert.throws(() => kiemBang(dCot), /TTH-AC-1 nút K lệch bảng/)
  const boLoc = await banChep<DocMod>("src/lib/ops/registry/doc.ts", [["LEFT JOIN can_toa c USING (building_key) WHERE b.status = 'active'", "LEFT JOIN can_toa c USING (building_key)"]])
  const dLoc = await boLoc.docDanhBa(sc)
  assert.throws(() => kiemBang(dLoc), /TTH-AC-1 nút K lệch bảng/)
})

test("TTH-AC-2 trang một dự án: toà dưới nút hiệu lực, dòng phụ gốc qua bộ che, căn theo toà; ba chiều đỏ", async () => {
  const { docDuAn } = await import("../src/lib/ops/registry/du-an")
  const { dungHangToa } = await import("../src/lib/ops/registry/hang-toa")
  const { getSourceNameEntries } = await import("../src/lib/source-roles")
  const { maskSourceNames } = await import("../src/lib/mask-source-names")
  const { dungCay } = await import("../src/lib/ops/registry/cay")
  const entries = await getSourceNameEntries()
  const tenDChe = maskSourceNames(TEN_D, entries) ?? "—"
  assert.ok(!tenDChe.includes(TEN_THAT), "đối chứng: bộ che phải che tên nguồn thật trong tên D")
  const duAn = await docDuAn(N.D, sc)
  assert.ok(duAn)
  const theo = Object.fromEntries(duAn!.toa.map((t) => [t.key, t]))
  assert.deepEqual(
    [T.T1, T.T2, T.T3, T.T4, T.T5].map((k) => [theo[k]?.nutId, theo[k]?.nutIdGoc, theo[k]?.nguonNut]),
    [[N.K, N.D, "s09_phan_khu"], [N.C, N.D, "s09_cum"], [N.D, N.D, "goc"], [N.B, N.B, "goc"], [N.K, N.D, "s09_phan_khu"]],
    "TTH-AC-2 nút của toà",
  )
  assert.equal(theo[T.T6], undefined, "TTH-AC-2 toà đã gộp không hiện")
  const kiemHang = (rows: { key: string; phu: string; subRows?: { key: string }[] }[], coCan = true) => {
    const h = Object.fromEntries(rows.map((r) => [r.key, r]))
    const goc = `S09 xếp lại, gốc: ${tenDChe}`
    assert.ok(h[T.T1].phu.startsWith("Phan khu Ka"), "TTH-AC-2 T1 sai nút")
    assert.ok(h[T.T1].phu.includes(goc), "TTH-AC-2 T1 thiếu dòng gốc")
    assert.ok(h[T.T2].phu.startsWith("Cum Ce") && h[T.T2].phu.includes(goc), "TTH-AC-2 T2 sai nút hay thiếu dòng gốc")
    // T3 nằm thẳng ở D, gốc = hiệu lực, không bí danh mã: dòng phụ rỗng hẳn; T4 chỉ mang tên nút B.
    assert.equal(h[T.T3].phu, "", "TTH-AC-2 T3 có dòng phụ thừa")
    assert.equal(h[T.T4].phu, "Nut Be", "TTH-AC-2 T4 sai")
    if (coCan) assert.deepEqual(h[T.T1].subRows?.map((c) => c.key).length, 2, "TTH-AC-2 căn của T1 (đối chứng dương)")
    return h
  }
  const h = kiemHang(dungHangToa(duAn!, N.D, entries))
  const { DuAnContent } = await import("../src/components/ops/registry/du-an-content")
  const html = renderToStaticMarkup(await DuAnContent({ id: N.D }))
  // Đọc dòng phụ của TỪNG toà trên HTML: span ngay sau span tên toà (du-an-toa-grid.tsx), rồi kiểm cùng bảng như dữ liệu.
  const TEN_TOA: Record<string, string> = { [T.T1]: "Toa Mot", [T.T2]: "Toa Hai", [T.T3]: "Toa Ba", [T.T4]: "Toa Bon", [T.T5]: "Toa Nam" }
  const phuDom = Object.entries(TEN_TOA).map(([key, ten]) => {
    const m = html.match(new RegExp(`>${ten}</span>(?:<span[^>]*>([^<]*)</span>)?`))
    assert.ok(m, `TTH-AC-2 DOM thiếu hàng toà ${ten}`)
    return { key, phu: m[1] ?? "" }
  })
  kiemHang(phuDom, false)
  assert.ok(h[T.T5].phu.startsWith("Phan khu Ka"), "TTH-AC-2 T5 sai nút")
  assert.ok(!html.includes(TEN_THAT), "TTH-AC-2 HTML lộ tên nguồn thật")
  // Trang danh sách: hàng K của cây (dữ liệu RegistryGrid vẽ) mang soToa theo nút hiệu lực.
  const doc = await import("../src/lib/ops/registry/doc")
  const d = await doc.docDanhBa(sc)
  const cay = dungCay(d.nut, d.tinh, entries)
  const hangK = cay.find((x) => x.id === N.D)?.subRows?.find((x) => x.id === N.K)
  assert.equal(hangK?.soToa, 3, "TTH-AC-2 ô Toà của K trên trang danh sách")
  // Chiều đỏ 1: bỏ cụm gốc.
  const boGoc = await banChep<HangMod>("src/lib/ops/registry/hang-toa.ts", [["t.nutIdGoc != null && t.nutIdGoc !== t.nutId ?", "false ?"]])
  assert.throws(() => kiemHang(boGoc.dungHangToa(duAn!, N.D, entries)), /TTH-AC-2 T1 thiếu dòng gốc/)
  // Chiều đỏ 2: tên chính lấy từ nút gốc.
  const tenGoc = await banChep<HangMod>("src/lib/ops/registry/hang-toa.ts", [["t.nutId === id ? null : tenNut.get(t.nutId),", "t.nutIdGoc === id ? null : tenNut.get(t.nutIdGoc ?? t.nutId),"]])
  assert.throws(() => kiemHang(tenGoc.dungHangToa(duAn!, N.D, entries)), /TTH-AC-2 T1 sai nút/)
  // Chiều đỏ 3: du-an.ts đọc lại cột gốc → T1 nằm ở D.
  const duCot = await banChep<DuAnMod>("src/lib/ops/registry/du-an.ts", [["SELECT b.building_key, v.region_node_id::int AS nut_id,", "SELECT b.building_key, b.region_node_id::int AS nut_id,"]])
  const duAnCot = await duCot.docDuAn(N.D, sc)
  assert.throws(() => kiemHang(dungHangToa(duAnCot!, N.D, entries)), /TTH-AC-2 T1 sai nút/)
})
