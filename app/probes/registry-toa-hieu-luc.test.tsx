// registry-toa-hieu-luc.test.tsx — hồ sơ _acceptance/danh-ba-toa-theo-phan-khu-hieu-luc (DA36), ca «TTH-DC» (E3). Probe dữ liệu
// thật, NGOÀI suite chung app. Chỉ đọc DB máy thu trong MỘT giao dịch READ ONLY: số cây của lớp đọc /ops/registry so với đếm
// trực tiếp trên v_toa_nut_vung (097), và so với đếm theo cột gốc buildings.region_node_id. Chỉ in số, không in tên.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"

const URL_MAY_THU = process.env.TTH_DC_URL ?? localDbUrl()
process.env.DATABASE_URL = URL_MAY_THU

const c = new pg.Client({ connectionString: URL_MAY_THU })
const so = async (sql: string) => Number((await c.query<{ n: string }>(sql)).rows[0].n)

before(async () => {
  if (process.env.CI) return
  await c.connect()
  await c.query("BEGIN READ ONLY")
})
after(async () => {
  if (process.env.CI) return
  await c.query("ROLLBACK").catch(() => {})
  await c.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

/** Cây tổ tiên (kể cả chính nó) và dự án gốc của mỗi nút. */
const CAY = `WITH RECURSIVE up AS (
    SELECT id AS nid, id AS cur, parent_id FROM asset_nodes
    UNION ALL SELECT u.nid, a.id, a.parent_id FROM up u JOIN asset_nodes a ON a.id = u.parent_id),
  goc AS (SELECT up.nid, up.cur AS goc FROM up JOIN asset_nodes r ON r.id = up.cur WHERE r.parent_id IS NULL)`

test("TTH-DC lớp đọc /ops/registry theo nút hiệu lực khớp đếm trên view; treo và phân khu rỗng giảm so với cột gốc", { skip: process.env.CI ? "cần DB máy thu có danh bạ thật — CI chỉ có lược đồ" : false }, async () => {
  const { docDanhBa } = await import("../src/lib/ops/registry/doc")
  const d = await docDanhBa(c)

  // View một dòng mỗi toà.
  assert.equal(await so(`SELECT count(*) - count(DISTINCT building_key) AS n FROM v_toa_nut_vung`), 0, "TTH-DC view trùng dòng")

  // Mỗi nút: soToa = toà đang dùng có tổ tiên là nút ấy theo nút hiệu lực.
  const { rows } = await c.query<{ nid: string; n: string }>(`${CAY}
    SELECT up.cur AS nid, count(*) AS n FROM buildings b JOIN v_toa_nut_vung v USING (building_key) JOIN up ON up.nid = v.region_node_id
    WHERE b.status = 'active' GROUP BY up.cur`)
  const kv = new Map(rows.map((r) => [Number(r.nid), Number(r.n)]))
  const lech = d.nut.filter((n) => n.soToa !== (kv.get(n.id) ?? 0)).map((n) => n.id)
  assert.deepEqual(lech, [], "TTH-DC soToa của nút lệch đếm trên view")

  // Tổng trên dự án gốc = toà đang dùng có dự án tổ tiên theo nút hiệu lực; tổng dải số = count buildings active.
  const goc = d.nut.filter((n) => n.loai === "project" && n.parentId == null)
  const toaCoGoc = await so(`${CAY} SELECT count(*) AS n FROM buildings b JOIN v_toa_nut_vung v USING (building_key) JOIN goc g ON g.nid = v.region_node_id
    JOIN asset_nodes r ON r.id = g.goc WHERE b.status = 'active' AND r.node_type = 'project'`)
  assert.equal(goc.reduce((a, n) => a + n.soToa, 0), toaCoGoc, "TTH-DC tổng toà trên dự án gốc")
  const tong = await so(`SELECT count(*) AS n FROM buildings WHERE status = 'active'`)
  assert.equal(d.tong.toa, tong, "TTH-DC tổng toà dải số")

  // Treo thẳng dưới dự án: theo lớp đọc (toà mà nút hiệu lực là dự án) = đếm trên view, nhỏ hơn đếm theo cột gốc.
  const treoView = await so(`SELECT count(*) AS n FROM buildings b JOIN v_toa_nut_vung v USING (building_key) JOIN asset_nodes n ON n.id = v.region_node_id
    WHERE b.status = 'active' AND n.node_type = 'project'`)
  const treoGoc = await so(`SELECT count(*) AS n FROM buildings b JOIN asset_nodes n ON n.id = b.region_node_id WHERE b.status = 'active' AND n.node_type = 'project'`)
  const conCua = new Map<number, number>()
  for (const n of d.nut) if (n.parentId != null) conCua.set(n.parentId, (conCua.get(n.parentId) ?? 0) + 1)
  const toaConPK = (id: number) => d.nut.filter((x) => x.parentId === id).reduce((a, x) => a + x.soToa, 0)
  const treoLopDoc = d.nut.filter((n) => n.loai === "project").reduce((a, n) => a + n.soToa - toaConPK(n.id), 0)
  assert.equal(treoLopDoc, treoView, "TTH-DC toà treo dưới dự án theo lớp đọc khác view")
  assert.ok(treoView < treoGoc, `TTH-DC toà treo không giảm: view ${treoView} · cột gốc ${treoGoc}`)

  // Phân khu không toà, không con: theo lớp đọc = đếm trên view, nhỏ hơn đếm theo cột gốc.
  const pkRongLopDoc = d.nut.filter((n) => n.loai !== "project" && !conCua.has(n.id) && n.soToa === 0).length
  const pkRong = (cot: string, tu: string) => so(`SELECT count(*) AS n FROM asset_nodes n WHERE n.node_type IN ('subzone', 'building')
    AND NOT EXISTS (SELECT 1 FROM asset_nodes x WHERE x.parent_id = n.id)
    AND NOT EXISTS (SELECT 1 FROM ${tu} WHERE b.status = 'active' AND ${cot} = n.id)`)
  const pkRongView = await pkRong("v.region_node_id", "buildings b JOIN v_toa_nut_vung v USING (building_key)")
  const pkRongGoc = await pkRong("b.region_node_id", "buildings b")
  assert.equal(pkRongLopDoc, pkRongView, "TTH-DC phân khu rỗng theo lớp đọc khác view")
  assert.ok(pkRongView < pkRongGoc, `TTH-DC phân khu rỗng không giảm: view ${pkRongView} · cột gốc ${pkRongGoc}`)

  // Không toà nào đổi dự án gốc giữa cột gốc và nút hiệu lực.
  const khacDuAn = await so(`${CAY} SELECT count(*) AS n FROM v_toa_nut_vung v JOIN buildings b USING (building_key)
    JOIN goc a ON a.nid = v.region_node_id JOIN goc g ON g.nid = v.region_node_id_goc WHERE b.status = 'active' AND a.goc <> g.goc`)
  assert.equal(khacDuAn, 0, "TTH-DC toà đổi dự án gốc")

  console.log(`# TTH-DC treo ${treoGoc} → ${treoView} · phân khu rỗng ${pkRongGoc} → ${pkRongView} · tổng ${tong} · khác dự án ${khacDuAn}`)
})
