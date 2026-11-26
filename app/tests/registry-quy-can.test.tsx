// registry-quy-can.test.tsx — hồ sơ _acceptance/nap-s09-quy-can-va-can-cao-tang, ca «AC-7», «AC-8», «AC-9». Lược đồ tạm qc_<pid> trên
// DB của lượt (db/db-thu.sh): bảng và view của danh bạ chép khuôn public như registry-chi-doc.test.tsx; stg_s09_danh_ba và ba view
// quỹ căn dựng bằng CHÍNH tệp migration 115, 130 của kho chạy trong lược đồ tạm. Route thật: RegistryContent, DuAnContent.
// Fixture viết trước: bốn mã dự án S09 có quỹ căn — qa, qb nối cùng nút D1 (một căn có ở cả hai mã), qd còn thẻ (chua_noi),
// qe không có dòng nối; qc nối nút D2 mà không có quỹ căn. Payload stg mang chuỗi cấy (tên miền, toạ độ giả lập) để soát rò.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S = `qc_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = resolve(APP, "..")
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

// Cùng danh sách bảng, view của registry-chi-doc.test.tsx (lớp đọc danh bạ đọc chừng ấy) + airbnb_snapshots cho FK của 115.
const BANG = [
  "asset_nodes", "buildings", "stacks", "units", "registry_aliases", "project_links", "s08_project_links", "s10_project_links",
  "stg_s08_project", "stg_s09_item", "areas", "sale_offer_records", "field_assertions", "stg_chotot_ads", "source_registry",
  "stg_s16_toa", "stg_s16_khu",
]
const VIEW = ["sale_offers", "s06_offer_project", "offer_project", "v_s09_du_an_moi", "v_s09_toa", "v_toa_nut_vung"]
const N = { D1: 9101, D2: 9102 } as const
const CAY = ["cdn.gia-lap.test", "21.0001", "105.0001"]
const SNAP = "q56__s09-danh-ba__qc"

const q = (sql: string, args: unknown[] = []) => sc.query(sql, args)
const canQc = (id: string, ma: string, gia: number | null) => ({
  id, property_code: ma, property_type: ["Chung cư"], number_of_bedrooms: 2, number_of_bathrooms: [1], min_area: 72.5, max_area: 72.5,
  min_selling_price: gia ?? 0, max_selling_price: gia ?? 0, min_unit_price: gia ? 69_000_000 : 0, max_unit_price: gia ? 69_000_000 : 0,
  status: "ON_STOCK", available_for_sale_status: "AVAILABLE", block_id: "q-toa",
  // chuỗi cấy: stg thật đã bỏ hai khoá này ở bộ nạp; ở đây cố ý để lại để soát lớp đọc và màn không lộ chúng
  galleries: [{ urls: [`https://${CAY[0]}/anh-${id}.jpg`] }], geolocation: { lat_cdnt: 21.0001, long_cdnt: 105.0001 },
})
let dong = 0
const trang = (duAn: string, cans: ReturnType<typeof canQc>[]) =>
  q(`INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at) VALUES ($1,$2,'quy-can',$3,$4,$5,now())`,
    [SNAP, ++dong, duAn, { data: cans, meta: { code: "200", page: 0, size: 200, total: cans.length } }, { duAnId: duAn, trang: 0, tongNguon: cans.length }])

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  for (const b of BANG) await admin.query(`CREATE TABLE "${S}".${b} (LIKE public.${b} INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING GENERATED)`)
  await admin.query(`CREATE TABLE "${S}".airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)`)
  await sc.connect()
  for (const v of VIEW) {
    const { rows } = await admin.query<{ d: string }>(`SELECT pg_get_viewdef($1::regclass, true) AS d`, [`public.${v}`])
    await sc.query(`CREATE VIEW ${v} AS ${rows[0].d}`)
  }
  for (const f of ["115_stg_s09_danh_ba.sql", "130_v_s09_db_quy_can.sql"]) await sc.query(readFileSync(join(ROOT, "db/migrations", f), "utf8"))
  await q(`INSERT INTO asset_nodes (id, node_type, name, slug, parent_id, catalog_tier, aliases, area_ids) VALUES
    ($1, 'project', 'Du An Qc Mot', 'qc-1', NULL, 'mot_loi_khai', '{}', '{}'), ($2, 'project', 'Du An Qc Hai', 'qc-2', NULL, 'xac_minh', '{}', '{}')`, [N.D1, N.D2])
  await q(`INSERT INTO project_links (source, source_project_id, asset_node_id, status, ly_do) VALUES
    ('S09', 'qa', $1, 'noi', NULL), ('S09', 'qb', $1, 'noi', NULL), ('S09', 'qc', $2, 'noi', NULL), ('S09', 'qd', NULL, 'chua_noi', 'cho-the-luat')`, [N.D1, N.D2])
  await q(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 's09-danh-ba', '{}')`, [SNAP])
  await trang("qa", [canQc("c-a1", "A1.05.01", 5_000_000_000), canQc("c-a2", "A1.05.02", null), canQc("c-dup", "A1.06.01", 4_250_000_000)])
  await trang("qb", [canQc("c-dup", "A1.06.01", 4_250_000_000), canQc("c-b1", "B2.10.03", 6_100_000_000)])
  await trang("qd", [canQc("c-d1", "D.01", 3_000_000_000)])
  await trang("qe", [canQc("c-e1", "E.01", 2_000_000_000)])
})

after(async () => {
  await sc.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

async function htmlDanhBa(): Promise<string> {
  const { RegistryContent } = await import("../src/components/ops/registry/registry-content")
  return renderToStaticMarkup(await RegistryContent())
}
async function htmlDuAn(id: number): Promise<string> {
  const { DuAnContent } = await import("../src/components/ops/registry/du-an-content")
  return renderToStaticMarkup(await DuAnContent({ id }))
}
/** Ô «Căn CĐT đang bán S09» trong HTML: số chính và dòng phụ. */
function oQuyCan(html: string): string {
  const i = html.indexOf("Căn CĐT đang bán S09")
  assert.ok(i >= 0, "AC-7 quỹ căn: trang không có ô «Căn CĐT đang bán S09»")
  return html.slice(i, i + 1200).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
}
const ma = (html: string) => [...html.matchAll(/translate="no">([A-Z][A-Z0-9.]*)</g)].map((m) => m[1]).filter((x) => /\./.test(x))

test("AC-7 ô «Căn CĐT đang bán S09» bằng SELECT trên view của cùng DB; dòng phụ ba số cộng bằng số dự án; cấy thêm một căn thì tăng đúng một", async () => {
  const [v] = (await q(`SELECT count(*)::int AS can, count(DISTINCT du_an_id)::int AS du_an,
    count(*) FILTER (WHERE gia_ban_min IS NOT NULL OR gia_ban_max IS NOT NULL)::int AS co_gia FROM v_s09_db_quy_can`)).rows
  assert.deepEqual(v, { can: 7, du_an: 4, co_gia: 6 }, "fixture: tiền đề số của view")
  const o = oQuyCan(await htmlDanhBa())
  assert.match(o, new RegExp(`Căn CĐT đang bán S09 ${v.can} `), "AC-7 quỹ căn: số căn lệch view")
  assert.match(o, new RegExp(`${v.co_gia} có giá · ${v.du_an} dự án: 2 nối nút · 1 còn thẻ · 1 chưa có trong danh mục`), "AC-7 quỹ căn: dòng phụ lệch")
  assert.equal(2 + 1 + 1, v.du_an)
  await trang("qe", [canQc("c-e1", "E.01", 2_000_000_000), canQc("c-e2", "E.02", 2_000_000_000)])
  try {
    assert.match(oQuyCan(await htmlDanhBa()), /Căn CĐT đang bán S09 8 /, "AC-7 quỹ căn: cấy thêm một căn mà số không tăng đúng một")
  } finally {
    await q(`DELETE FROM stg_s09_danh_ba WHERE dong = $1`, [dong])
  }
})

test("AC-8 trang dự án: nút có quỹ căn ra đúng số dòng và giá; hai mã một nút không lặp căn; nút không quỹ căn có chữ trống", async () => {
  const html = await htmlDuAn(N.D1)
  assert.match(html, /Căn CĐT đang bán/)
  assert.deepEqual(ma(html).filter((m) => /^[AB]\d/.test(m)).sort(), ["A1.05.01", "A1.05.02", "A1.06.01", "B2.10.03"], "AC-8 số dòng quỹ căn lệch view")
  assert.match(html, /4 căn\./, "AC-8 số dòng quỹ căn lệch view")
  assert.match(html, /5 tỷ/)
  assert.match(html, /4,25 tỷ/)
  assert.match(html, /69 tr\/m²/)
  assert.match(html, /AVAILABLE/)
  const hai = await htmlDuAn(N.D2)
  assert.match(hai, /Chưa có căn CĐT đang bán của nguồn S09 cho dự án này/)
  assert.match(hai, /Về danh bạ/)
})

test("AC-8 truy vấn quỹ căn lỗi → khối lỗi có Thử lại; trang vẫn hiện toà; đang tải có khối Skeleton quỹ căn", async () => {
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool)
  ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
    const s = typeof sql === "string" ? sql : String((sql as { text?: string }).text ?? "")
    if (s.includes("JOIN (SELECT DISTINCT source_project_id")) return Promise.reject(new Error("lỗi giả lập"))
    return (goc as (...a: unknown[]) => unknown)(sql, ...rest)
  }
  try {
    const html = await htmlDuAn(N.D1)
    assert.match(html, /Không tải được căn CĐT đang bán/)
    assert.match(html, /Thử lại/)
    assert.match(html, /Toà và căn/)
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
  }
  const { RegistrySkeleton } = await import("../src/components/ops/registry/registry-skeleton")
  assert.match(renderToStaticMarkup(<RegistrySkeleton nhan="Đang tải dự án" oPhu quyCan />), /data-quy-can-tai/)
})

test("AC-9 HTML hai trang không chứa chuỗi cấy (tên miền, toạ độ giả lập) hay chữ «galleries»; chỉ mã S09", async () => {
  const stg = (await q(`SELECT payload::text AS p FROM stg_s09_danh_ba`)).rows.map((r) => r.p).join("")
  for (const s of CAY) assert.ok(stg.includes(s), `tiền đề: stg phải mang chuỗi cấy ${s}`)
  for (const html of [await htmlDanhBa(), await htmlDuAn(N.D1)]) {
    for (const s of [...CAY, "galleries", "geolocation"]) assert.equal(html.includes(s), false, `AC-9 HTML còn chuỗi cấy ${s}`)
    assert.match(html, /S09/)
  }
})
