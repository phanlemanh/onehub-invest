// registry-doi-chieu.test.tsx — hồ sơ _acceptance/trang-danh-ba-chi-doc, ca «TDB-DC» (E14). Probe dữ liệu thật, NGOÀI suite chung
// app (lưới DT-AC-7 của scripts/db-thu.test.mjs; tiền lệ IT7). Chạy ở: executors.test.tdb_doi_chieu. Chỉ đọc DB máy thu
// trong MỘT giao dịch READ ONLY: số của lớp đọc trang /ops/registry so với count(*) độc lập từng bảng; HTML hai trang quét
// tên nguồn thật. Chỉ in số, không in tên. Đối chứng dương: bộ quét bắt được tên cài vào chuỗi thử.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"


// Lớp đọc của trang lấy pool từ DATABASE_URL; trỏ đúng DB máy thu (không phải DB của lượt) trước mọi import động.
const URL_MAY_THU = process.env.TDB_DC_URL ?? localDbUrl()
process.env.DATABASE_URL = URL_MAY_THU

const c = new pg.Client({ connectionString: URL_MAY_THU })
const BANG = ["asset_nodes", "buildings", "stacks", "units", "registry_aliases", "project_links", "s08_project_links", "s10_project_links", "stg_s08_project", "stg_s09_item"]
const so = async (sql: string) => Number((await c.query<{ n: string }>(sql)).rows[0].n)
const demBang = async () => Object.fromEntries(await Promise.all(BANG.map(async (b) => [b, await so(`SELECT count(*) AS n FROM ${b}`)])))

let truoc: Record<string, number>
before(async () => {
  if (process.env.CI) return
  await c.connect()
  await c.query("BEGIN READ ONLY")
  truoc = await demBang()
})
after(async () => {
  if (process.env.CI) return
  await c.query("ROLLBACK").catch(() => {})
  await c.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

test("TDB-DC dải số, tổng cây, tin theo nguồn, danh mục khớp đếm độc lập; HTML không lộ tên nguồn; DB không đổi", { skip: process.env.CI ? "cần DB máy thu có danh bạ thật — CI chỉ có lược đồ" : false }, async () => {
  const { docDanhBa } = await import("../src/lib/ops/registry/doc")
  const d = await docDanhBa(c)
  const kv = {
    duAn: await so(`SELECT count(*) AS n FROM asset_nodes WHERE node_type = 'project'`),
    duAnXacMinh: await so(`SELECT count(*) AS n FROM asset_nodes WHERE node_type = 'project' AND catalog_tier = 'xac_minh'`),
    // Cùng luật nghỉ với SQL_TONG của doc.ts (#498, DA46): nút phân khu, toà đã nối về nút khác (meta.nghi = true) không đếm.
    phanKhu: await so(`SELECT count(*) AS n FROM asset_nodes WHERE node_type <> 'project' AND COALESCE((meta ->> 'nghi')::boolean, false) = false`),
    toa: await so(`SELECT count(*) AS n FROM buildings WHERE status = 'active'`),
    toaCoCan: await so(`SELECT count(DISTINCT b.building_key) AS n FROM buildings b JOIN units u ON u.building_key = b.building_key AND u.status = 'active' WHERE b.status = 'active'`),
    truc: await so(`SELECT count(*) AS n FROM stacks WHERE status = 'active'`),
    can: await so(`SELECT count(*) AS n FROM units WHERE status = 'active'`),
    toaBiDanhS09: await so(`SELECT count(*) AS n FROM buildings b WHERE b.status = 'active' AND EXISTS (SELECT 1 FROM registry_aliases a WHERE a.object_key = b.building_key AND a.source = 'S09' AND a.retired_at IS NULL)`),
  }
  const { danhMuc, ...tong } = d.tong
  assert.deepEqual(tong, kv, "TDB-DC dải số")
  console.log(`# TDB-DC dải số ${JSON.stringify(kv)}`)

  // Tổng trên các dự án gốc: căn của toà có dự án tổ tiên, toà có dự án tổ tiên — theo nút hiệu lực của toà (v_toa_nut_vung, DA36).
  const goc = d.nut.filter((n) => n.loai === "project" && n.parentId == null)
  const toaCoGoc = await so(`WITH RECURSIVE up AS (
      SELECT id AS nid, id AS cur, parent_id FROM asset_nodes
      UNION ALL SELECT u.nid, a.id, a.parent_id FROM up u JOIN asset_nodes a ON a.id = u.parent_id)
    SELECT count(*) AS n FROM buildings b JOIN v_toa_nut_vung v USING (building_key) WHERE b.status = 'active' AND EXISTS (
      SELECT 1 FROM up JOIN asset_nodes r ON r.id = up.cur WHERE up.nid = v.region_node_id AND r.parent_id IS NULL AND r.node_type = 'project')`)
  assert.equal(goc.reduce((a, n) => a + n.soToa, 0), toaCoGoc, "TDB-DC tổng toà trên dự án gốc")
  assert.equal(goc.reduce((a, n) => a + n.soCan, 0), kv.can, "TDB-DC tổng căn trên dự án gốc")

  // Tin theo nguồn: tổng trên dự án gốc = count(offer_project mot_du_an); nút không phải gốc không mang tin.
  const tinSql = (await c.query<{ source: string; n: string }>(`SELECT source, count(*) AS n FROM offer_project WHERE status = 'mot_du_an' GROUP BY 1`)).rows
  const tinGoc: Record<string, number> = {}
  for (const n of goc) for (const [s, v] of Object.entries(n.tin)) tinGoc[s] = (tinGoc[s] ?? 0) + v
  assert.deepEqual(tinGoc, Object.fromEntries(tinSql.map((r) => [r.source, Number(r.n)])), "TDB-DC tin theo nguồn")
  assert.equal(d.nut.filter((n) => n.loai !== "project" && Object.keys(n.tin).length > 0).length, 0, "TDB-DC tin trên nút không gốc")
  console.log(`# TDB-DC tin ${JSON.stringify(tinGoc)}`)

  // Danh mục đã nạp theo nguồn.
  const dm = [
    { source: "S06", daNap: await so(`SELECT count(*) AS n FROM project_links WHERE source = 'S06'`), daNoi: await so(`SELECT count(*) AS n FROM project_links WHERE source = 'S06' AND status = 'noi'`),
      noiUngVien: await so(`SELECT count(*) AS n FROM project_links pl JOIN asset_nodes n ON n.id = pl.asset_node_id WHERE pl.source = 'S06' AND pl.status = 'noi' AND n.catalog_tier = 'mot_loi_khai'`) },
    // S08 (DA55): nối ở bảng tay DN1 hoặc ở project_links nguồn S08; đếm bằng tập hợp mã, độc lập với câu của doc.ts.
    { source: "S08", daNap: await so(`SELECT count(DISTINCT project_id) AS n FROM stg_s08_project`),
      daNoi: await so(`SELECT count(*) AS n FROM (SELECT project_id FROM s08_project_links WHERE status = 'noi' UNION SELECT source_project_id FROM project_links WHERE source = 'S08' AND status = 'noi') x WHERE x.project_id IN (SELECT project_id FROM stg_s08_project)`),
      noiUngVien: await so(`SELECT count(*) AS n FROM project_links pl JOIN asset_nodes n ON n.id = pl.asset_node_id WHERE pl.source = 'S08' AND pl.status = 'noi' AND n.catalog_tier = 'mot_loi_khai' AND pl.source_project_id IN (SELECT project_id FROM stg_s08_project)`) },
    { source: "S09", daNap: await so(`SELECT count(DISTINCT project_id) AS n FROM stg_s09_item WHERE kind = 'du-an' AND detail_ok AND project_id IS NOT NULL`), daNoi: 0, noiUngVien: 0 },
  ].map((x) => ({ source: x.source, daNap: x.daNap, daNoi: x.daNoi, chuaNoi: x.daNap - x.daNoi, noiUngVien: x.noiUngVien }))
  assert.deepEqual(danhMuc, dm, "TDB-DC danh mục")
  console.log(`# TDB-DC danh mục ${JSON.stringify(dm)}`)

  // HTML: trang danh sách + trang mọi dự án có toà; quét tên nguồn thật (danh sách đọc trong ca, không in).
  const { findSourceNames } = await import("../src/lib/mask-source-names")
  const { docSourceNameEntries } = await import("../src/lib/source-roles")
  const { RegistryContent } = await import("../src/components/ops/registry/registry-content")
  const { DuAnContent } = await import("../src/components/ops/registry/du-an-content")
  const { docDuAn } = await import("../src/lib/ops/registry/du-an")
  const { dungHangToa } = await import("../src/lib/ops/registry/hang-toa")
  const ten = await docSourceNameEntries()
  let trung = findSourceNames(renderToStaticMarkup(await RegistryContent()), ten).length
  const coToa = goc.filter((n) => n.soToa > 0)
  for (const n of coToa) {
    trung += findSourceNames(renderToStaticMarkup(await DuAnContent({ id: n.id })), ten).length
    // Căn nằm trong hàng con: quét cả dữ liệu bảng gửi xuống trình duyệt.
    trung += findSourceNames(JSON.stringify(dungHangToa((await docDuAn(n.id, c))!, n.id, ten)), ten).length
  }
  console.log(`# TDB-DC quét ${1 + coToa.length} trang, ${ten.length} tên nguồn, ${trung} chỗ khớp`)
  assert.equal(trung, 0, "TDB-DC tên nguồn lọt")
  // Đối chứng dương: chuỗi thử chứa một tên của danh sách → bộ quét bắt được.
  assert.ok(ten.length > 0, "TDB-DC danh sách tên nguồn rỗng — bộ quét không chứng được")
  assert.throws(() => assert.equal(findSourceNames(`toà ${ten[0].realName} số 1`, ten).length, 0, "TDB-DC tên nguồn lọt"), /TDB-DC tên nguồn lọt/)

  assert.deepEqual(await demBang(), truoc, "TDB-DC DB đổi sau ca")
})
