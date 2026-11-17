// registry-chi-doc.test.tsx — hồ sơ _acceptance/trang-danh-ba-chi-doc, ca «TDB-AC-n». Lược đồ tạm tdb_<pid> trên DB của
// lượt (db/db-thu.sh): bảng danh bạ chép khuôn public (LIKE … INCLUDING DEFAULTS, CONSTRAINTS, GENERATED), bốn view thật
// (sale_offers, s06_offer_project, offer_project, v_s09_du_an_moi) dựng lại từ định nghĩa public trong lược đồ tạm — tin
// đi qua đúng bộ quy về dự án gốc của kho, không tự dựng khuôn bên đọc. Ma trận sáu nút viết trước; mỗi phép đo mới có
// chiều đỏ trên cùng fixture (bản chép mã sang app/tests/.tdb-cu-<pid>/, đổi đúng một chỗ), thông điệp ghim.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { isValidElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { DanhBa, NutDanhBa } from "../src/lib/ops/registry/doc"

const S = `tdb_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = resolve(APP, "..")
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

const BANG = [
  "asset_nodes", "buildings", "stacks", "units", "registry_aliases", "project_links", "s08_project_links", "s10_project_links",
  "stg_s08_project", "stg_s09_item", "areas", "sale_offer_records", "field_assertions", "stg_chotot_ads", "source_registry",
]
const VIEW = ["sale_offers", "s06_offer_project", "offer_project", "v_s09_du_an_moi"]
/** Mười bảng danh bạ đếm trước/sau ở TDB-AC-6. */
const BANG_DEM = ["asset_nodes", "buildings", "stacks", "units", "registry_aliases", "project_links", "s08_project_links", "s10_project_links", "stg_s08_project", "stg_s09_item"]

const N = { D1: 9001, K2: 9002, K1: 9003, B1: 9004, D2: 9005, D3: 9006 } as const
const K = (p: string, n: number) => `${p}_${String(n).padStart(26, "0")}`
const T = { T1: K("bld", 1), T2: K("bld", 2), T3: K("bld", 3), T4: K("bld", 4) }
const TRUC = K("stk", 1)
const TEN_THAT = "Nguon That Tdb"

/** Bảng kỳ vọng viết trước: sáu nút × năm trường. */
const KY_VONG: Record<number, { soPhanKhu: number; soToa: number; toaChuaCan: number; soCan: number; tin: Record<string, number> }> = {
  [N.D1]: { soPhanKhu: 3, soToa: 3, toaChuaCan: 1, soCan: 5, tin: { S03: 1 } },
  [N.K1]: { soPhanKhu: 1, soToa: 2, toaChuaCan: 1, soCan: 3, tin: {} },
  [N.K2]: { soPhanKhu: 0, soToa: 1, toaChuaCan: 0, soCan: 3, tin: {} },
  [N.B1]: { soPhanKhu: 0, soToa: 1, toaChuaCan: 0, soCan: 2, tin: {} },
  [N.D2]: { soPhanKhu: 0, soToa: 0, toaChuaCan: 0, soCan: 0, tin: { S06: 2 } },
  [N.D3]: { soPhanKhu: 0, soToa: 0, toaChuaCan: 0, soCan: 0, tin: {} },
}

const q = (sql: string, args: unknown[] = []) => sc.query(sql, args)
const nut = (id: number, type: string, name: string, parent: number | null, tier: string, aliases: string[], areas: string[]) =>
  q(`INSERT INTO asset_nodes (id, node_type, name, slug, parent_id, catalog_tier, aliases, area_ids) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, type, name, `tdb-${id}`, parent, tier, aliases, areas])
const toa = (key: string, node: number, status = "active", mergedInto: string | null = null) =>
  q(`INSERT INTO buildings (building_key, status, merged_into, region_node_id, upi, iso_region, catalog_tier) VALUES ($1,$2,$3,$4,$5,'VN-HN','xac_minh')`, [key, status, mergedInto, node, `urn:onehub:upi:1:VN:VN-HN:${key}`])
const can = (n: number, building: string, floor: string, stack: string | null, status = "active") => {
  const key = K("unt", n)
  return q(`INSERT INTO units (unit_key, status, building_key, stack_key, floor, sub_id, catalog_tier) VALUES ($1,$2,$3,$4,$5,$6,'xac_minh')`, [key, status, building, stack, floor, stack ? `${stack}:${floor}` : key]).then(() => key)
}
const biDanh = (key: string, kind: string, value: string, source: string, nghi = false) =>
  q(`INSERT INTO registry_aliases (object_key, kind, value, source, retired_at) VALUES ($1,$2,$3,$4,$5)`, [key, kind, value, source, nghi ? new Date() : null])
const tin = (id: string, source: string, posts: string[], extra: { originating?: string; type?: string } = {}) =>
  q(`INSERT INTO sale_offer_records (offer_id, source, kind, first_seen, last_seen, post_ids, originating_system_key, property_type) VALUES ($1,$2,'sale',now(),now(),$3,$4,$5)`, [id, source, posts, extra.originating ?? null, extra.type ?? null])
const phatBieu = (subject: string, nodeId: number) =>
  q(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) VALUES ($1,'project_node_id',$2,'observed','parser',now())`, [subject, String(nodeId)])

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
  // Hai cây khu vực ở hai tỉnh; D3 không có khu vực.
  await q(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES
    ('vn-tinh-a', NULL, 'market', 'Tỉnh Alpha', 'VN'), ('vn-tinh-a-xa', 'vn-tinh-a', 'submarket', 'Xã A', 'VN'),
    ('vn-tinh-b', NULL, 'market', 'Thành phố Beta', 'VN')`)
  // Sáu nút: K2 mang id nhỏ hơn cha K1 (cây dựng qua nhiều đợt).
  await nut(N.D1, "project", "Vinhomes Ocean Tdb", null, "xac_minh", ["ocp1"], ["vn-tinh-a-xa"])
  await nut(N.K1, "subzone", "Phân khu Một", N.D1, "xac_minh", [], [])
  await nut(N.K2, "subzone", "Sapphire 2", N.K1, "xac_minh", [], [])
  await nut(N.B1, "building", "Lumiere Tdb", N.D1, "xac_minh", [], [])
  await nut(N.D2, "project", `${TEN_THAT} Residence`, null, "mot_loi_khai", ["nguon that tdb"], ["vn-tinh-b"])
  await nut(N.D3, "project", "Du An Rong", null, "xac_minh", [], [])
  // Toà: T1 dưới K2 (3 căn đang dùng + 1 nghỉ), T2 dưới K1 (0 căn), T3 dưới K1 đã gộp vào T2, T4 dưới nút building B1 (2 căn).
  await toa(T.T2, N.K1)
  await toa(T.T1, N.K2)
  await toa(T.T3, N.K1, "merged", T.T2)
  await toa(T.T4, N.B1)
  await q(`INSERT INTO stacks (stack_key, building_key, catalog_tier) VALUES ($1, $2, 'xac_minh')`, [TRUC, T.T1])
  const c1 = await can(1, T.T1, "2", TRUC)
  await can(2, T.T1, "3", TRUC)
  await can(3, T.T1, "10", TRUC)
  await can(4, T.T1, "11", TRUC, "retired")
  await can(5, T.T4, "1", null)
  await can(6, T.T4, "2", null)
  // Bí danh: T1 tên S09 đang dùng (đếm), T2 tên S09 đã nghỉ (không đếm); mã chứa tên nguồn viết liền ở toà, trục, căn.
  await biDanh(T.T1, "ten", `Toa ${TEN_THAT}`, "S09")
  await biDanh(T.T1, "ma_nguon", "102/T1", "S08")
  await biDanh(T.T2, "ten", "T2 cũ", "S09", true)
  await biDanh(T.T2, "ma_nguon", "102/T2", "S08")
  await biDanh(T.T4, "ten", "L4", "S08")
  await biDanh(TRUC, "ma_nguon", "102/nguonthattdb-truc", "S08")
  await biDanh(c1, "ma_nguon", "102/nguonthattdb-01", "S08")
  // Nối nguồn: S06 hai mã nối D1, một chưa nối; S08 bốn dự án × hai snapshot — 1 nối D1, 1 chưa nối có lý do, 2 chưa qua bước nối.
  await q(`INSERT INTO project_links (source, source_project_id, asset_node_id, status, ly_do) VALUES
    ('S06', 'du_an/1', $1, 'noi', NULL), ('S06', 'nguon-that-tdb/1', $1, 'noi', NULL), ('S06', '3', NULL, 'chua_noi', 'khong-ten')`, [N.D1])
  for (const snap of ["snap-a", "snap-b"])
    for (const [pid, ten] of [["801", "Du an Tam"], ["802", "Du an Hai"], ["803", "Du an Ba"], ["804", `Du an ${TEN_THAT}`]])
      await q(`INSERT INTO stg_s08_project (snapshot_id, project_id, catalog_payload) VALUES ($1, $2, $3)`, [snap, pid, { project_name: ten }])
  await q(`INSERT INTO s08_project_links (project_id, asset_node_id, status, ly_do) VALUES ('801', $1, 'noi', NULL), ('802', NULL, 'chua_noi', 'ngoai-lat')`, [N.D1])
  for (const id of ["a1", "a2"])
    await q(`INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ('s9', $1, 'du-an', $2)`, [id, { chiTiet: { meta: { code: "200" }, data: { id: `s9-${id}`, name: `Dự án chín ${id}` } } }])
  // Tin: o1 (S03) một bài nói K2 → view quy về D1; o3 (S03) hai bài nói hai dự án gốc → xung_dot; D2 hai tin S06 qua mã nguồn.
  await tin("o1", "S03", ["p1"])
  await phatBieu("S03:p1", N.K2)
  await tin("o3", "S03", ["p3a", "p3b"])
  await phatBieu("S03:p3a", N.K2)
  await phatBieu("S03:p3b", N.D2)
  await biDanh(`node:${N.D2}`, "ma_nguon", "du_an/77", "S06")
  for (const [id, list] of [["o6a", 6001], ["o6b", 6002]] as const) {
    await tin(id, "S06", [], { originating: String(list), type: "apartment" })
    await q(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id) VALUES ($1, 1, 'x', 1010, 's', $2, 'snap-c')`, [list, { projectid: "77" }])
  }
})

after(async () => {
  await sc.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

/** Bản chép một tệp của app vào app/tests/.tdb-cu-<pid>/ (để «@/» còn giải), đổi các chỗ trong `doi`; import tương đối
 *  trỏ về tệp gốc. */
const CU = join(APP, "tests", `.tdb-cu-${process.pid}`)
let soBan = 0
async function banChep<T>(rel: string, doi: [string, string][]): Promise<T> {
  let src = readFileSync(join(APP, rel), "utf8")
  for (const [tu, thanh] of doi) {
    assert.ok(src.includes(tu), `bản chép không áp được: ${tu}`)
    src = src.replace(tu, thanh)
  }
  src = src.replace(/from "(\.{1,2}\/[^"]+)"/g, (_m, spec: string) => {
    const goc = join(APP, dirname(rel), spec)
    const f = [".ts", ".tsx", "/index.ts"].map((e) => goc + e).find((p) => existsSync(p)) ?? goc
    return `from "${pathToFileURL(f).href}"`
  })
  mkdirSync(CU, { recursive: true })
  const f = join(CU, `ban-${++soBan}${rel.endsWith(".tsx") ? ".tsx" : ".ts"}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${src}` : src)
  return import(pathToFileURL(f).href) as Promise<T>
}
after(() => rmSync(CU, { recursive: true, force: true }))

type DocMod = typeof import("../src/lib/ops/registry/doc")
const docGoc = () => import("../src/lib/ops/registry/doc")
const theoId = (d: DanhBa) => new Map<number, NutDanhBa>(d.nut.map((n) => [n.id, n]))
const nam = (n: NutDanhBa | undefined) => n && { soPhanKhu: n.soPhanKhu, soToa: n.soToa, toaChuaCan: n.toaChuaCan, soCan: n.soCan, tin: n.tin }

/** Bốn ô số của StatTiles theo thứ tự: [tiêu đề, giá trị] — giá trị là span số lớn ĐẦU TIÊN sau đúng tiêu đề ô ấy và
 *  trước tiêu đề ô kế (không trôi sang ô hay bảng phía sau). */
function oSo(html: string): [string, string][] {
  const out: [string, string][] = []
  const re = /<h3[^>]*>([^<]+)<\/h3>((?:(?!<h3)[\s\S])*?)<span class="[^"]*text-2xl[^"]*">([^<]+)<\/span>/g
  for (const m of html.matchAll(re)) out.push([m[1], m[3]])
  return out
}
/** Số trên huy hiệu của đúng một tab: «<nhãn> <span …>n</span>» ngay sau nhãn, không trôi xa hơn một thẻ. */
function soTab(html: string, nhan: string): string | null {
  const m = html.match(new RegExp(`${nhan}\\s*(?:<!-- -->)?\\s*<span[^>]*>(\\d+)</span>`))
  return m ? m[1] : null
}
/** Bản chép một tệp và các tệp con nó import tương đối (khoá = chuỗi import, giá trị = tệp gốc), đổi `doi` ở bất kỳ tệp
 *  nào trong bộ — để đột biến một tệp con được tệp cha dùng. Khai con theo thứ tự lá trước: con chép sau trỏ được tới con
 *  chép trước. */
async function banChepCay(rel: string, con: Record<string, string>, doi: [string, string][]): Promise<typeof import("../src/components/ops/registry/du-an-content")> {
  mkdirSync(CU, { recursive: true })
  const daAp = new Set<string>()
  const ap = (src: string) => doi.reduce((a, [tu, thanh]) => (a.includes(tu) ? (daAp.add(tu), a.split(tu).join(thanh)) : a), src)
  const daChep: Record<string, string> = {}
  for (const [spec, tep] of Object.entries(con)) {
    const f = join(CU, `con-${++soBan}.tsx`)
    let src = ap(readFileSync(join(APP, tep), "utf8"))
    src = src.replace(/from "(\.{1,2}\/[^"]+)"/g, (_m, sp: string) => {
      if (daChep[sp]) return `from "${daChep[sp]}"`
      const g = join(APP, dirname(tep), sp)
      const p = [".ts", ".tsx"].map((e) => g + e).find((x) => existsSync(x)) ?? g
      return `from "${pathToFileURL(p).href}"`
    })
    writeFileSync(f, `import React from "react"\n${src}`)
    daChep[spec] = pathToFileURL(f).href
  }
  let src = ap(readFileSync(join(APP, rel), "utf8"))
  src = src.replace(/from "(\.{1,2}\/[^"]+)"/g, (_m, sp: string) => {
    if (daChep[sp]) return `from "${daChep[sp]}"`
    const g = join(APP, dirname(rel), sp)
    const p = [".ts", ".tsx"].map((e) => g + e).find((x) => existsSync(x)) ?? g
    return `from "${pathToFileURL(p).href}"`
  })
  for (const [tu] of doi) assert.ok(daAp.has(tu), `bản chép không áp được: ${tu}`)
  const f = join(CU, `ban-${++soBan}.tsx`)
  writeFileSync(f, `import React from "react"\n${src}`)
  return import(pathToFileURL(f).href)
}

async function htmlDanhBa(): Promise<string> {
  const { RegistryContent } = await import("../src/components/ops/registry/registry-content")
  return renderToStaticMarkup(await RegistryContent())
}
async function htmlDuAn(id: number): Promise<string> {
  const { DuAnContent } = await import("../src/components/ops/registry/du-an-content")
  return renderToStaticMarkup(await DuAnContent({ id }))
}

test("TDB-AC-1 cloud hay thiếu bảng buildings: «Chỉ ở máy thu», không truy vấn bảng danh bạ", async () => {
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool)
  const da: string[] = []
  ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
    da.push(typeof sql === "string" ? sql : String((sql as { text?: string }).text ?? ""))
    return (goc as (...a: unknown[]) => unknown)(sql, ...rest)
  }
  const chamDanhBa = () => da.filter((s) => /asset_nodes|buildings|units|stacks|registry_aliases|project_links|offer_project/.test(s)).length
  try {
    process.env.VERCEL = "1"
    for (const html of [await htmlDanhBa(), await htmlDuAn(N.D1)]) assert.match(html, /Chỉ ở máy thu/)
    assert.equal(chamDanhBa(), 0, "TDB-AC-1 cloud vẫn truy vấn")
    // Chiều đỏ: bỏ nhánh cloud → bản chép truy vấn danh bạ.
    const dot = await banChep<typeof import("../src/components/ops/registry/registry-content")>("src/components/ops/registry/registry-content.tsx", [['process.env.VERCEL === "1" || ', ""]])
    renderToStaticMarkup(await dot.RegistryContent())
    assert.throws(() => assert.equal(chamDanhBa(), 0, "TDB-AC-1 cloud vẫn truy vấn"), /TDB-AC-1 cloud vẫn truy vấn/)
    delete process.env.VERCEL
    da.length = 0
    await q(`ALTER TABLE buildings RENAME TO buildings_tam`)
    try {
      assert.match(await htmlDanhBa(), /Chỉ ở máy thu/)
      assert.equal(chamDanhBa(), 0, "TDB-AC-1 thiếu bảng vẫn truy vấn")
    } finally {
      await q(`ALTER TABLE buildings_tam RENAME TO buildings`)
    }
    // Đối chứng dương: có bảng → có tên dự án, không có cảnh báo.
    const co = await htmlDanhBa()
    assert.doesNotMatch(co, /Chỉ ở máy thu/)
    assert.match(co, /Vinhomes Ocean Tdb/)
  } finally {
    delete process.env.VERCEL
    ;(pool as unknown as { query: unknown }).query = goc
  }
})

test("TDB-AC-2 ma trận sáu nút: số phân khu, toà, toà chưa có căn, căn, tin của cả cây con", async () => {
  const d = theoId(await (await docGoc()).docDanhBa(sc))
  let soAssert = 0
  for (const [id, kv] of Object.entries(KY_VONG)) {
    const n = d.get(Number(id))
    for (const k of ["soPhanKhu", "soToa", "toaChuaCan", "soCan", "tin"] as const) {
      assert.deepEqual(nam(n)?.[k], kv[k], `TDB-AC-2 nút ${id} ${k}`)
      soAssert++
    }
  }
  assert.equal(soAssert, 30)
  const dotDoc = (doi: [string, string][]) => banChep<DocMod>("src/lib/ops/registry/doc.ts", doi)
  // Chiều đỏ 1: bỏ lọc toà đang dùng → T3 đã gộp được đếm.
  const d1 = theoId(await (await dotDoc([["FROM buildings b LEFT JOIN can_toa c USING (building_key) WHERE b.status = 'active'", "FROM buildings b LEFT JOIN can_toa c USING (building_key)"]])).docDanhBa(sc))
  assert.throws(() => assert.equal(d1.get(N.D1)?.soToa, 3, "TDB-AC-2 toà không active được đếm"), /TDB-AC-2 toà không active được đếm/)
  // Chiều đỏ 2: bỏ lọc căn đang dùng → căn nghỉ của T1 được đếm.
  const d2 = theoId(await (await dotDoc([["FROM units WHERE status = 'active' GROUP BY 1", "FROM units GROUP BY 1"]])).docDanhBa(sc))
  assert.throws(() => assert.equal(d2.get(N.D1)?.soCan, 5, "TDB-AC-2 căn không active được đếm"), /TDB-AC-2 căn không active được đếm/)
  // Chiều đỏ 3: đếm nút building vào toà.
  const d3 = theoId(await (await dotDoc([["SELECT t.anc AS node_id, count(*)::int AS so_phan_khu", "SELECT t.anc AS node_id, (count(*) FILTER (WHERE n.node_type = 'subzone'))::int AS so_phan_khu"]])).docDanhBa(sc))
  assert.throws(() => assert.equal(d3.get(N.D1)?.soPhanKhu, 3, "TDB-AC-2 nút building thành toà"), /TDB-AC-2 nút building thành toà/)
  // Chiều đỏ 4 (tin xung_dot): view thật trả project_node_id NULL cho tin xung đột, nên phép thử thay view bằng bản trả
  // dự án gốc nhỏ nhất kể cả khi xung đột — mã đúng vẫn lọc mot_du_an (đối chứng dương), bản bỏ lọc thì đếm o3.
  const { rows } = await admin.query<{ d: string }>(`SELECT pg_get_viewdef('public.offer_project'::regclass, true) AS d`)
  const lech = rows[0].d.replace(/CASE\s+WHEN x\.n_roots = 1 THEN x\.root_id\s+ELSE NULL::bigint\s+END AS project_node_id/, "x.root_id AS project_node_id")
  assert.notEqual(lech, rows[0].d, "không thay được định nghĩa view")
  await q(`CREATE OR REPLACE VIEW offer_project AS ${lech}`)
  try {
    const dung = theoId(await (await docGoc()).docDanhBa(sc))
    assert.deepEqual(dung.get(N.D1)?.tin, { S03: 1 }, "TDB-AC-2 đối chứng: lọc mot_du_an giữ tin xung_dot ngoài")
    const d4 = theoId(await (await dotDoc([["FROM offer_project WHERE status = 'mot_du_an' GROUP BY 1, 2", "FROM offer_project GROUP BY 1, 2"]])).docDanhBa(sc))
    assert.throws(() => assert.deepEqual(d4.get(N.D1)?.tin, { S03: 1 }, "TDB-AC-2 tin xung_dot được đếm"), /TDB-AC-2 tin xung_dot được đếm/)
  } finally {
    await q(`CREATE OR REPLACE VIEW offer_project AS ${rows[0].d}`)
  }
})

test("TDB-AC-3 dải số đầu trang và danh mục đã nạp chưa nối theo nguồn", async () => {
  const { tong } = await (await docGoc()).docDanhBa(sc)
  assert.deepEqual(
    { duAn: tong.duAn, duAnXacMinh: tong.duAnXacMinh, phanKhu: tong.phanKhu, toa: tong.toa, toaCoCan: tong.toaCoCan, truc: tong.truc, can: tong.can, toaBiDanhS09: tong.toaBiDanhS09 },
    { duAn: 3, duAnXacMinh: 2, phanKhu: 3, toa: 3, toaCoCan: 2, truc: 1, can: 5, toaBiDanhS09: 1 },
  )
  assert.deepEqual(tong.danhMuc, [
    { source: "S06", daNap: 3, daNoi: 2, chuaNoi: 1 },
    { source: "S08", daNap: 4, daNoi: 1, chuaNoi: 3 },
    { source: "S09", daNap: 2, daNoi: 0, chuaNoi: 2 },
  ])
  const html = await htmlDanhBa()
  assert.match(html, /S08 3\/4/)
  assert.match(html, /S09 đã cấp tên 1 toà/)
  const dot = await banChep<DocMod>("src/lib/ops/registry/doc.ts", [["FROM (SELECT DISTINCT project_id FROM stg_s08_project) p", "FROM (SELECT project_id FROM stg_s08_project) p"]])
  const s08 = (await dot.docDanhBa(sc)).tong.danhMuc.find((x) => x.source === "S08")
  assert.throws(() => assert.equal(s08?.daNap, 4, "TDB-AC-3 S08 đếm trùng snapshot"), /TDB-AC-3 S08 đếm trùng snapshot/)
})

test("TDB-AC-4 tìm gấp dấu qua con, chỗ thiếu, tỉnh leo gốc, lọc tỉnh · nguồn · bậc · chỗ thiếu", async () => {
  const { dungCay, khopTim } = await import("../src/lib/ops/registry/cay")
  const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query")
  const { RegistryGrid } = await import("../src/components/ops/registry/registry-grid")
  const { getSourceNameEntries } = await import("../src/lib/source-roles")
  const d = await (await docGoc()).docDanhBa(sc)
  const cay = dungCay(d.nut, d.tinh, await getSourceNameEntries())
  const ids = (chu: string) => cay.filter((h) => khopTim(h, chu)).map((h) => h.id)
  for (const chu of ["ocean", "OCEAN", "ôcêan", "ocp1", "sapphire"]) assert.deepEqual(ids(chu), [N.D1], `TDB-AC-4 tìm «${chu}»`)
  assert.deepEqual(ids("khongco"), [])
  const thieu = Object.fromEntries(cay.map((h) => [h.id, h.thieu]))
  assert.deepEqual(thieu, { [N.D1]: ["toa-chua-can"], [N.D2]: ["chua-toa", "chua-nguon"], [N.D3]: ["chua-toa", "chua-tin", "chua-nguon"] })
  const tinh = Object.fromEntries(cay.map((h) => [h.id, h.tinh]))
  assert.deepEqual(tinh, { [N.D1]: "Alpha", [N.D2]: "Beta", [N.D3]: null }, "TDB-AC-4 tỉnh không leo gốc")
  // Bảng thật với bộ lọc mở sẵn: nhãn đếm «k/n dự án» theo bảng kỳ vọng viết trước.
  const loc = (field: string, value: string) => createFilterQuery([createFilterRule({ id: "r", path: [field], operator: "is_any_of", value: [value] })])
  const KV: [string, string, string][] = [["thieu", "chua-toa", "2/3"], ["tinh", "Alpha", "1/3"], ["nguon", "S06", "1/3"], ["bac", "mot_loi_khai", "1/3"]]
  for (const [f, v, nhan] of KV) assert.match(renderToStaticMarkup(<RegistryGrid rows={cay} locBanDau={loc(f, v)} />), new RegExp(`${nhan} dự án`), `TDB-AC-4 lọc ${f}=${v}`)
  assert.match(renderToStaticMarkup(<RegistryGrid rows={cay} />), /3\/3 dự án/)
  // Chiều đỏ: tìm không duyệt phân khu con; tỉnh lấy khu vực không leo gốc.
  const dotCay = await banChep<typeof import("../src/lib/ops/registry/cay")>("src/lib/ops/registry/cay.ts", [["(x.subRows ?? []).some(sau)", "false"]])
  assert.throws(() => assert.deepEqual(cay.filter((h) => dotCay.khopTim(h, "sapphire")).map((h) => h.id), [N.D1], "TDB-AC-4 tìm qua phân khu con"), /TDB-AC-4 tìm qua phân khu con/)
  const dotDoc = await banChep<DocMod>("src/lib/ops/registry/doc.ts", [["LEFT JOIN tinh tn ON tn.id = n.area_ids[1]", "LEFT JOIN tinh tn ON tn.tinh_id = n.area_ids[1]"]])
  const d2 = await dotDoc.docDanhBa(sc)
  const tinh2 = Object.fromEntries(dungCay(d2.nut, d2.tinh, []).map((h) => [h.id, h.tinh]))
  assert.throws(() => assert.deepEqual(tinh2, { [N.D1]: "Alpha", [N.D2]: "Beta", [N.D3]: null }, "TDB-AC-4 tỉnh không leo gốc"), /TDB-AC-4 tỉnh không leo gốc/)
})

test("TDB-AC-5 trang một dự án: đầu trang, bốn ô bằng số danh sách, toà của cây con, tab chưa có căn, 404", async () => {
  const { docDuAn, parseNodeId } = await import("../src/lib/ops/registry/du-an")
  const html = await htmlDuAn(N.D1)
  for (const s of ["Xác minh", "Alpha", "Nguồn S06, S08", "ocp1", "S06 du_an/1"]) assert.ok(html.includes(s), `TDB-AC-5 đầu trang thiếu «${s}»`)
  const d1 = theoId(await (await docGoc()).docDanhBa(sc)).get(N.D1)!
  const tongTin = Object.values(d1.tin).reduce((a, b) => a + b, 0)
  const KV_O: [string, number][] = [["Phân khu", d1.soPhanKhu], ["Toà", d1.soToa], ["Căn", d1.soCan], ["Tin đang rao", tongTin]]
  assert.deepEqual(oSo(html), KV_O.map(([t, v]) => [t, String(v)]), "TDB-AC-5 bốn ô số")
  const mot = await docDuAn(N.D1, sc)
  assert.deepEqual(mot?.toa.map((t) => t.key).sort(), [T.T1, T.T2, T.T4].sort(), "TDB-AC-5 toà của cây con")
  assert.match(html, /Sapphire 2 · Mã 102\/T1/)
  assert.equal(soTab(html, "Chưa có căn"), "1", "TDB-AC-5 tab chưa có căn đếm 1")
  assert.equal(soTab(html, "Mọi toà"), "3")
  for (const v of ["abc", "0", "-1", "1e3", undefined]) assert.equal(parseNodeId(v), null)
  assert.equal(parseNodeId("9001"), 9001)
  for (const id of [N.K1, 123456789]) await assert.rejects(htmlDuAn(id), /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/)
  // Chiều đỏ ô số: ô Căn đọc nhầm số toà; tab đếm toà có căn thay vì toà chưa có căn.
  const dotContent = await banChepCay("src/components/ops/registry/du-an-content.tsx", { "./du-an-view": "src/components/ops/registry/du-an-view.tsx" }, [["value: fmtInt(p.soCan)", "value: fmtInt(p.soToa)"]])
  const htmlDot = renderToStaticMarkup(await dotContent.DuAnContent({ id: N.D1 }))
  assert.throws(() => assert.deepEqual(oSo(htmlDot), KV_O.map(([t, v]) => [t, String(v)]), "TDB-AC-5 bốn ô số"), /TDB-AC-5 bốn ô số/)
  const tabDot = await banChepCay("src/components/ops/registry/du-an-content.tsx", { "./du-an-toa-grid": "src/components/ops/registry/du-an-toa-grid.tsx", "./du-an-view": "src/components/ops/registry/du-an-view.tsx" }, [["rows.filter((r) => r.soCan === 0)", "rows.filter((r) => r.soCan !== 0)"]])
  const htmlTab = renderToStaticMarkup(await tabDot.DuAnContent({ id: N.D1 }))
  assert.throws(() => assert.equal(soTab(htmlTab, "Chưa có căn"), "1", "TDB-AC-5 tab chưa có căn đếm 1"), /TDB-AC-5 tab chưa có căn đếm 1/)
  const dot = await banChep<typeof import("../src/lib/ops/registry/du-an")>("src/lib/ops/registry/du-an.ts", [['if (goc.rows[0]?.node_type !== "project") return null', "if (!goc.rows[0]) return null"]])
  const k1 = await dot.docDuAn(N.K1, sc)
  assert.throws(() => assert.equal(k1, null, "TDB-AC-5 phân khu mở như dự án"), /TDB-AC-5 phân khu mở như dự án/)
})

/** Quét câu ghi trong lớp đọc: chữ HOA ở đầu từ (câu SQL), không bắt tên hàm JS. */
const CAU_GHI = /\b(INSERT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER|DROP)\b/
const quetGhi = (files: Record<string, string>) => Object.entries(files).filter(([, s]) => CAU_GHI.test(s)).map(([f]) => f)

// Vế «không migration mới» (git diff origin/main...HEAD -- db/migrations rỗng) là phép kiểm MỘT LẦN của riêng hàng trang-danh-ba-chi-doc,
// đã đạt ở S4 của nó (#472). Để trong bộ hồi quy của main thì nó chặn mọi nhánh mang migration — GS phán gỡ 17/11 (sổ DA33 và sổ
// trang-danh-ba-chi-doc). Ý chỉ-đọc về sau giữ bằng quetGhi kèm chiều đỏ dưới đây.
test("TDB-AC-6 chỉ đọc: số dòng mười bảng không đổi, lớp đọc không có câu ghi", async () => {
  const dem = async () => Object.fromEntries(await Promise.all(BANG_DEM.map(async (b) => [b, (await q(`SELECT count(*)::int AS n FROM ${b}`)).rows[0].n])))
  const truoc = await dem()
  await htmlDanhBa()
  await htmlDuAn(N.D1)
  assert.deepEqual(await dem(), truoc)
  const thu = join(APP, "src/lib/ops/registry")
  const tep = Object.fromEntries(readdirSync(thu).map((f) => [f, readFileSync(join(thu, f), "utf8")]))
  assert.deepEqual(quetGhi(tep), [])
  assert.throws(() => assert.deepEqual(quetGhi({ ...tep, "doc.ts": `${tep["doc.ts"]}\nconst x = "DELETE FROM units"` }), [], "TDB-AC-6 câu ghi trong lớp đọc"), /TDB-AC-6 câu ghi trong lớp đọc/)
})

test("TDB-AC-7 tên nguồn thật bị che ở hai trang, mọi mã nguồn đúng khuôn S0x, lớp đọc không đọc bảng cấm", async () => {
  const { fold } = await import("../src/lib/mask-source-names")
  const loi = (html: string) => fold(html).includes(fold(TEN_THAT)) || fold(html).includes("nguonthattdb")
  const ds = await htmlDanhBa()
  const da = await htmlDuAn(N.D1)
  for (const [ten, html] of [["danh sách", ds], ["dự án", da]] as const) {
    assert.equal(loi(html), false, `TDB-AC-7 ${ten} lộ tên nguồn`)
    for (const m of html.match(/\bS\d\d\b/g) ?? []) assert.match(m, /^S0\d$/)
  }
  assert.match(ds, /S07 Residence/)
  // Khung «Mã dự án nguồn chưa nối» chỉ dựng tab đầu trong HTML tĩnh: đo bộ che trên đúng dữ liệu máy chủ gửi cho khung.
  const { cheChuaNoi } = await import("../src/lib/ops/registry/cay")
  const { getSourceNameEntries: ten } = await import("../src/lib/source-roles")
  const chuaNoi = cheChuaNoi((await (await docGoc()).docDanhBa(sc)).chuaNoi, await ten())
  assert.ok(chuaNoi.some((r) => r.ten === "Du an S07"), "TDB-AC-7 tên dự án nguồn chưa nối không che")
  assert.equal(loi(JSON.stringify(chuaNoi)), false)
  assert.match(da, /Toa S07/)
  const thu = join(APP, "src/lib/ops/registry")
  // Quét mã đã bỏ chú thích (chú thích được nói «không đọc source_registry»).
  const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  const CAM = /source_registry|real_name|\busers\b|\bsessions\b|user_events|user_profile/
  for (const f of readdirSync(thu)) assert.doesNotMatch(boChuThich(readFileSync(join(thu, f), "utf8")), CAM, f)
  assert.match(boChuThich("const x = `SELECT 1 FROM source_registry`"), CAM, "TDB-AC-7 bộ quét bảng cấm")
  // Chiều đỏ 1: bỏ che ở dungCay → tên dự án lộ.
  const { getSourceNameEntries } = await import("../src/lib/source-roles")
  const dotCay = await banChep<typeof import("../src/lib/ops/registry/cay")>("src/lib/ops/registry/cay.ts", [['const che = (s: string, entries: SourceNameEntry[]) => maskSourceNames(s, entries) ?? "—"', "const che = (s: string, _e: SourceNameEntry[]) => s"]])
  const d = await (await docGoc()).docDanhBa(sc)
  const tenDot = dotCay.dungCay(d.nut, d.tinh, await getSourceNameEntries()).map((h) => h.ten).join(" ")
  assert.throws(() => assert.equal(loi(tenDot), false, "TDB-AC-7 tên dự án lộ tên nguồn"), /TDB-AC-7 tên dự án lộ tên nguồn/)
  // Mã căn, trục nằm trong hàng con (chỉ vẽ khi bấm mở) nên đo trên đúng dữ liệu máy chủ gửi cho bảng.
  const { docDuAn } = await import("../src/lib/ops/registry/du-an")
  const { dungHangToa } = await import("../src/lib/ops/registry/hang-toa")
  const mot = (await docDuAn(N.D1, sc))!
  const hang = dungHangToa(mot, N.D1, await getSourceNameEntries())
  assert.equal(loi(JSON.stringify(hang)), false, "TDB-AC-7 toà lộ tên nguồn")
  assert.match(JSON.stringify(hang), /102\/S07-01/, "TDB-AC-7 mã căn đã che")
  // Chiều đỏ 2: bỏ che mã căn ở hàng toà → mã chứa tên nguồn lộ.
  const dotHang = await banChep<typeof import("../src/lib/ops/registry/hang-toa")>("src/lib/ops/registry/hang-toa.ts", [["ten: c.ma ? che(c.ma) : c.key", "ten: c.ma ?? c.key"]])
  const hangDot = dotHang.dungHangToa(mot, N.D1, await getSourceNameEntries())
  assert.throws(() => assert.equal(loi(JSON.stringify(hangDot)), false, "TDB-AC-7 toà lộ tên nguồn"), /TDB-AC-7 toà lộ tên nguồn/)
})

test("TDB-AC-8 trạng thái: danh bạ rỗng, lọc không khớp, khung chờ, lỗi, dự án không toà, mọi mã đã nối", async () => {
  const { RegistryView, LENH_DUNG } = await import("../src/components/ops/registry/registry-view")
  const { RegistryGrid } = await import("../src/components/ops/registry/registry-grid")
  const { RegistrySkeleton } = await import("../src/components/ops/registry/registry-skeleton")
  const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query")
  const { dungCay } = await import("../src/lib/ops/registry/cay")
  const tong0 = { duAn: 0, duAnXacMinh: 0, phanKhu: 0, toa: 0, toaCoCan: 0, truc: 0, can: 0, toaBiDanhS09: 0, danhMuc: [] }
  const rong = renderToStaticMarkup(<RegistryView mode="local" tong={tong0} rows={[]} chuaNoi={[]} />)
  assert.match(rong, /Danh bạ chưa có dự án/)
  assert.ok(rong.includes(LENH_DUNG) && LENH_DUNG === "node pipeline/noi-du-an-s06.mjs")
  assert.match(rong, /Mọi mã dự án đã nạp đều đã nối\./)
  const d = await (await docGoc()).docDanhBa(sc)
  const cay = dungCay(d.nut, d.tinh, [])
  const khongKhop = createFilterQuery([createFilterRule({ id: "r", path: ["tinh"], operator: "is_any_of", value: ["Không có"] })])
  assert.match(renderToStaticMarkup(<RegistryGrid rows={cay} locBanDau={khongKhop} />), /Không có dự án nào khớp bộ lọc\.[\s\S]*Xoá lọc/)
  const cho = renderToStaticMarkup(<RegistrySkeleton />)
  assert.match(cho, /aria-busy="true"/)
  assert.match(cho, /data-slot="skeleton"/)
  // Page thật (bản chép thay getSessionUser bằng phiên giả): cây trả về là RegionError bọc Suspense có khung chờ.
  const { RegionError } = await import("../src/components/states/region-error")
  const boc = async (rel: string, props: unknown, them: [string, string][] = []) => {
    const mod = await banChep<{ default: (p: unknown) => Promise<ReactNode> }>(rel, [STUB_PHIEN, ...them])
    ;(globalThis as unknown as { __TDB_NGUOI: unknown }).__TDB_NGUOI = { id: "usr_admin", email: "admin@local.test", plan: "free", role: "admin" }
    return mod.default(props)
  }
  for (const [rel, props] of [["src/app/ops/registry/page.tsx", {}], ["src/app/ops/registry/[nodeId]/page.tsx", { params: Promise.resolve({ nodeId: String(N.D1) }) }]] as const) {
    const cay = await boc(rel, props)
    assert.ok(isValidElement(cay) && cay.type === RegionError, `TDB-AC-8 ${rel} không bọc RegionError`)
    const susp = (cay.props as { children: ReactNode }).children
    assert.ok(isValidElement(susp) && isValidElement((susp.props as { fallback: ReactNode }).fallback) && ((susp.props as { fallback: { type: unknown } }).fallback.type === RegistrySkeleton), `TDB-AC-8 ${rel} khung chờ`)
  }
  // Chiều đỏ: bản page bỏ RegionError → cây không còn bọc.
  const khongBoc = await boc("src/app/ops/registry/page.tsx", {}, [['<RegionError what="danh bạ">', "<>"], ["</RegionError>", "</>"]])
  assert.throws(() => assert.ok(isValidElement(khongBoc) && khongBoc.type === RegionError, "TDB-AC-8 không bọc RegionError"), /TDB-AC-8 không bọc RegionError/)
  const d3 = await htmlDuAn(N.D3)
  assert.match(d3, /Dự án chưa có toà nào trong danh bạ\./)
  assert.match(d3, /href="\/ops\/registry"/)
  // Đối chứng dương: ma trận đủ → không có các câu trống.
  const du = await htmlDanhBa()
  assert.doesNotMatch(du, /Danh bạ chưa có dự án|Mọi mã dự án đã nạp đều đã nối/)
})

const STUB_PHIEN: [string, string] = [
  `import { getSessionUser } from "@/lib/auth"`,
  `const getSessionUser = async () => (globalThis as unknown as { __TDB_NGUOI: unknown }).__TDB_NGUOI as never`,
]

test("TDB-AC-9 thanh bên Ops có mục Danh bạ, sổ cổng có dòng trang", async () => {
  const { NAV_SECTIONS } = await import("../src/components/shell/nav")
  const coDanhBa = (sections: typeof NAV_SECTIONS.ops) => sections.some((s) => s.href === "/ops/registry" && s.label === "Danh bạ")
  assert.ok(coDanhBa(NAV_SECTIONS.ops))
  assert.match(readFileSync(join(ROOT, "docs/architecture/portals.md"), "utf8"), /^\| `\/ops\/registry` \| Danh bạ \|/m)
  assert.throws(() => assert.ok(coDanhBa(NAV_SECTIONS.ops.filter((s) => s.href !== "/ops/registry")), "TDB-AC-9 nav thiếu Danh bạ"), /TDB-AC-9 nav thiếu Danh bạ/)
})

// Cuối tệp: dựng RegionError của trang trong jsdom với nội dung ném lỗi → «Không tải được danh bạ» + «Thử lại» (ranh giới
// lỗi chỉ chạy khi dựng phía khách). Đặt cuối vì ca gán window/document toàn cục.
test("TDB-AC-8 RegionError của trang hiện «Thử lại» khi nội dung ném lỗi", async () => {
  const { JSDOM } = await import("jsdom")
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3461/ops/registry" })
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
  const React = await import("react")
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const { RegionError } = await import("../src/components/states/region-error")
  const Nem = () => {
    throw new Error("tdb-thu")
  }
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  const loi = console.error
  console.error = () => {}
  try {
    const root = createRoot(document.getElementById("root")!)
    await React.act(async () => {
      root.render(
        <AppRouterContext.Provider value={router as never}>
          <RegionError what="danh bạ">
            <Nem />
          </RegionError>
        </AppRouterContext.Provider>,
      )
    })
    const text = document.body.textContent ?? ""
    assert.match(text, /Không tải được danh bạ/)
    assert.match(text, /Thử lại/)
    await React.act(async () => root.unmount())
  } finally {
    console.error = loi
  }
})
