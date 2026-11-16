// the-dia-chi-nhom-app.itest.tsx — hồ sơ the-dia-chi-nhom-s03 (TG1) E4 · AC-4, E6 · AC-6 và dòng căn cứ của hộp duyệt (AC-10). Chạy trên DB của riêng lượt
// (config:executors.test.tg1_app — db-thu --chay chép bản mẫu rồi xoá khi xong), nên áp 108 và fixture được commit: route
// dùng pool riêng của app, không thấy giao dịch chưa commit của ca thử.
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import type { MucDich, TheDiaChi } from "../src/lib/the-dia-chi-nhom"

import { taoNguoi } from "./helpers/phien-thu"

const GOC = join(import.meta.dirname, "../..")
const DB_URL = process.env.DATABASE_URL ?? ""
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) throw new Error("the-dia-chi-nhom-app.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*")

const T = `tg1app${process.pid}`
const KHOA_MOI = [`${T}-khoa-moi-mot`, `${T}-khoa-moi-hai`, `${T}-khoa-moi-ba`] // khoá nhóm mồi (tầng A) — không được lộ
let c: pg.Client
const nguoi: Record<string, { id: string; cookie: string }> = {}
let A = 0, PK = 0
let the: string[] = []
// Nhóm có tên trùng khoá thật (hình của S03-N014 trên DB máy thu): name và original_name đều bằng khoá.
const KHOA_SO = `${process.pid}0000000000000`.slice(0, 19)
let theTenKhoa = ""

before(async () => {
  c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  await c.query(readFileSync(join(GOC, "db/migrations/108_the_dia_chi_nhom.sql"), "utf8"))
  const phuong = (await c.query(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1`)).rows[0].id
  A = Number((await c.query(`INSERT INTO asset_nodes (node_type, name, slug, area_ids) VALUES ('project', $1, $1, $2) RETURNING id`, [`${T}-a`, [phuong]])).rows[0].id)
  PK = Number((await c.query(`SELECT id FROM asset_nodes WHERE node_type = 'subzone' ORDER BY id LIMIT 1`)).rows[0].id)
  the = []
  for (const k of KHOA_MOI) {
    const r = await c.query(`INSERT INTO group_address_cards (group_key, unit_code, project_node_ids, area_id, purpose, evidence)
                             VALUES ($1, NULL, $2, $3, 'ban', $4) RETURNING card_code`, [k, [A], phuong, { so_bai: 9, so_bai_doc: 5, du_an: { nguon: "nhan", so_bai: 4 } }])
    the.push(r.rows[0].card_code)
  }
  const unit = (await c.query(`INSERT INTO collection_units (source_code, group_key, name, original_name, status, enabled)
                                VALUES ('S03', $1, $2, $2, 'active', true) RETURNING unit_code`, [`zalo:group:${KHOA_SO}`, KHOA_SO])).rows[0].unit_code
  theTenKhoa = (await c.query(`INSERT INTO group_address_cards (group_key, unit_code, purpose, evidence) VALUES ($1, $2, 'ban', '{}') RETURNING card_code`,
    [KHOA_SO, unit])).rows[0].card_code
  for (const v of ["ops", "viewer"]) nguoi[v] = await taoNguoi(c, v)
})
after(async () => { await c?.end() })

async function goi(cookie: string, body: Record<string, unknown>) {
  const { POST } = await import("../src/app/api/v1/ops/group-cards/route")
  const res = await POST(new Request("http://localhost/api/v1/ops/group-cards", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) }))
  return { status: res.status, json: (await res.json()) as Record<string, unknown>, raw: "" }
}
const dem = async () => {
  const r = (await c.query(`SELECT (SELECT count(*) FROM group_address_card_history)::int h, (SELECT count(*) FROM ops_audit WHERE action = 'unit.card_decide')::int a,
                                   (SELECT md5(string_agg(t::text, '|' ORDER BY t::text)) FROM group_address_cards t) th`)).rows[0]
  return r as { h: number; a: number; th: string }
}
const theCua = async (code: string) => (await c.query(`SELECT * FROM group_address_cards WHERE card_code = $1`, [code])).rows[0]

test("TG1-AC-4 card-decide: nhận, sửa, bác ghi version, lịch sử, audit; 400/409/403 không ghi gì", async () => {
  const ops = nguoi.ops.cookie
  // nhận
  let n0 = await dem()
  // Trường `action` là action của route; hành động trên thẻ đi ở `card` — thiếu `card` → 400.
  let r = await goi(ops, { action: "card-decide", cardCode: the[0], version: 1 })
  assert.equal(r.status, 400, "thiếu card phải 400")
  r = await goi(ops, { action: "card-decide", card: "nhan", cardCode: the[0], version: 1 })
  assert.equal(r.status, 200, `nhận: ${JSON.stringify(r.json)}`)
  let t = await theCua(the[0])
  assert.deepEqual([t.status, t.version], ["da_duyet", 2], "TG1-AC-4: nhận")
  let n1 = await dem()
  assert.deepEqual([n1.h - n0.h, n1.a - n0.a], [1, 1], "TG1-AC-4: nhận ghi một lịch sử, một audit")
  const ls = (await c.query(`SELECT * FROM group_address_card_history WHERE card_code = $1 ORDER BY id DESC LIMIT 1`, [the[0]])).rows[0]
  assert.equal(ls.action, "nhan"); assert.equal(ls.actor, `user:${nguoi.ops.id}`); assert.ok(ls.before && ls.after)
  // sửa
  n0 = n1
  r = await goi(ops, { action: "card-decide", card: "sua", cardCode: the[1], version: 1, values: { projectNodeIds: [A], areaId: null, subzoneNodeId: null, purpose: "thue" } })
  assert.equal(r.status, 200, `sửa: ${JSON.stringify(r.json)}`)
  t = await theCua(the[1])
  assert.deepEqual([t.status, t.version, t.purpose, t.area_id], ["da_duyet", 2, "thue", null], "TG1-AC-4: sửa")
  const lsSua = (await c.query(`SELECT before, after FROM group_address_card_history WHERE card_code = $1 ORDER BY id DESC LIMIT 1`, [the[1]])).rows[0]
  assert.deepEqual([lsSua.before.muc_dich, lsSua.after.muc_dich], ["ban", "thue"], "TG1-AC-4: lịch sử sửa giữ bản trước, bản sau")
  n1 = await dem(); assert.deepEqual([n1.h - n0.h, n1.a - n0.a], [1, 1])
  // bác không lý do → 400, không ghi
  n0 = n1
  r = await goi(ops, { action: "card-decide", card: "bac", cardCode: the[2], version: 1, note: "" })
  assert.equal(r.status, 400, "TG1-AC-4: bác không lý do")
  assert.deepEqual(await dem(), n0, "TG1-AC-4: bác lỗi vẫn ghi")
  // version cũ → 409, không ghi
  r = await goi(ops, { action: "card-decide", card: "nhan", cardCode: the[0], version: 1 })
  assert.equal(r.status, 409, "TG1-AC-4: version cũ")
  assert.deepEqual(await dem(), n0, "TG1-AC-4: 409 vẫn ghi")
  // viewer → 403
  r = await goi(nguoi.viewer.cookie, { action: "card-decide", card: "nhan", cardCode: the[2], version: 1 })
  assert.equal(r.status, 403, "TG1-AC-4: viewer")
  assert.deepEqual(await dem(), n0)
  // tham chiếu sai → 400 nêu ô
  r = await goi(ops, { action: "card-decide", card: "sua", cardCode: the[2], version: 1, values: { projectNodeIds: [PK], purpose: "ban" } })
  assert.equal(r.status, 400, "TG1-AC-4: dự án là phân khu")
  assert.equal(r.json.o, "du_an", "TG1-AC-4: 400 phải nêu ô du_an")
  assert.deepEqual(await dem(), n0)
  // bác có lý do
  r = await goi(ops, { action: "card-decide", card: "bac", cardCode: the[2], version: 1, note: "nhóm rao nhiều khu" })
  assert.equal(r.status, 200)
  t = await theCua(the[2]); assert.deepEqual([t.status, t.decision_note], ["bac", "nhóm rao nhiều khu"])
})

test("TG1-AC-4 đối chứng đỏ: bản sao bỏ kiểm version thì version cũ không còn 409", async () => {
  const goc = readFileSync(join(GOC, "app/src/lib/the-dia-chi-nhom.ts"), "utf8")
  const pha = goc.replace("if (cu.version !== version) {", "if (false) {")
  assert.notEqual(pha, goc, "version-409: không phá được hàm")
  const tep = join(GOC, "app/src/lib", `.tg1-pha-${process.pid}.ts`)
  writeFileSync(tep, pha)
  try {
    const { quyetThe } = (await import(tep)) as typeof import("../src/lib/the-dia-chi-nhom")
    const ops = { id: nguoi.ops.id, email: "ops@local.test", plan: "free" as const, role: "ops" as const }
    const r = await quyetThe({ cardCode: the[0], version: 1, card: "nhan" }, ops)
    assert.notEqual(r.status, 409, "version-409: bản bỏ kiểm version vẫn 409 — ca không phân biệt được")
  } finally { rmSync(tep, { force: true }) }
})

test("TG1-AC-6 khoá nhóm không lộ ra hàm đọc và phản hồi; lược đồ không bảng thẻ thì hàm đọc trả null", async () => {
  const { docTheDiaChi } = await import("../src/lib/the-dia-chi-nhom")
  const { GroupCardsTable } = await import("../src/components/ops/group-cards/group-cards-table")
  const ds = await docTheDiaChi()
  const docRa = JSON.stringify(ds)
  // HTML bảng thẻ của /ops/group-cards dựng phía máy chủ từ đúng dữ liệu hàm đọc trả (dữ liệu này cũng là thứ đi vào RSC).
  const html = renderToStaticMarkup(createElement(GroupCardsTable, { rows: ds ?? [], coQuyet: true, onOpen: () => {} }))
  assert.ok(html.includes(the[0]), "TG1-AC-6: HTML bảng phải có mã thẻ")
  const r = await goi(nguoi.ops.cookie, { action: "card-decide", card: "nhan", cardCode: the[1], version: 99 })
  const chuoi = docRa + html + JSON.stringify(r.json)
  const demMoi = (s: string) => [...KHOA_MOI, KHOA_SO].reduce((n, k) => n + s.split(k).length - 1, 0)
  assert.ok(docRa.includes(theTenKhoa), "TG1-AC-6: hàm đọc phải có thẻ của nhóm tên trùng khoá")
  assert.ok(html.includes("Chưa có tên"), "TG1-AC-6: nhóm tên trùng khoá phải hiện «Chưa có tên»")
  assert.equal(demMoi(chuoi), 0, "TG1-AC-6: khoá nhóm lộ ra hàm đọc hay phản hồi")
  assert.ok(demMoi(chuoi + KHOA_MOI[0]) >= 1, "TG1-AC-6: đối chứng dương — bộ đếm không bắt được khoá chèn vào")
  assert.ok(docRa.includes(the[0]), "TG1-AC-6: hàm đọc phải có mã thẻ")
  // Lược đồ tạm không có bảng thẻ (như cloud): hàm đọc trả null, không lỗi.
  const s = `${T}_khong_the`
  await c.query(`CREATE SCHEMA "${s}"`)
  try {
    await c.query(`SET search_path TO "${s}"`)
    assert.equal(await docTheDiaChi(c as never), null, "TG1-AC-6: lược đồ không bảng thẻ phải trả null")
  } finally {
    await c.query(`RESET search_path`)
    await c.query(`DROP SCHEMA "${s}" CASCADE`)
  }
})

test("TG1-AC-6 đối chứng đỏ: bản sao bỏ lọc tên trùng khoá thì khoá lộ ra hàm đọc", async () => {
  const goc = readFileSync(join(GOC, "app/src/lib/the-dia-chi-nhom.ts"), "utf8")
  const pha = goc.replace(/SELECT CASE WHEN n\.x IS NULL[\s\S]*?ELSE n\.x END/, "SELECT n.x")
  assert.notEqual(pha, goc, "ten-trung-khoa: không phá được hàm")
  const tep = join(GOC, "app/src/lib", `.tg1-pha-ten-${process.pid}.ts`)
  writeFileSync(tep, pha)
  try {
    const { docTheDiaChi } = (await import(tep)) as typeof import("../src/lib/the-dia-chi-nhom")
    assert.ok(JSON.stringify(await docTheDiaChi()).includes(KHOA_SO), "ten-trung-khoa: bản bỏ lọc vẫn không lộ khoá — ca không phân biệt được")
  } finally { rmSync(tep, { force: true }) }
})

// Dòng căn cứ của hộp duyệt (AC-10): mỗi ô phải nói đúng giá trị lấy từ đâu. Ô bán/thuê luôn có căn cứ trong
// evidence, kể cả khi máy để trống (nguon null) — lúc đó giá trị trên thẻ là của người vận hành.
const theCanCu = (muc_dich: MucDich | null, nguon: string | null): TheDiaChi => ({
  card_code: `${T}-canh`, unit_code: null, ten_nhom: null, status: "nhap", du_an: [], phuong: null, tinh: null, phan_khu: null,
  muc_dich, evidence: { so_bai: 20, so_bai_doc: 7, muc_dich: { nguon, so_bai: nguon ? 20 : 0, ban: 18, thue: 2 } },
  version: 1, decided_at: null, decision_note: null,
})

test("TG1-AC-10 dòng căn cứ ô bán/thuê: của máy thì nêu nguồn và số bài, của người thì nói là người điền", async () => {
  const { dongCanCuMucDich } = await import("../src/components/ops/group-cards/group-cards-text")
  // máy đọc được từ nhãn → nguồn và số bài mỗi phía
  assert.equal(dongCanCuMucDich(theCanCu("ban", "nhan")), "từ bài đã đọc: 18 bán, 2 thuê", "TG1-AC-10: ô máy điền phải nêu nguồn và số bài")
  // máy để trống, người vận hành tự chọn qua «sửa» → không được gán giá trị của người cho máy
  assert.equal(dongCanCuMucDich(theCanCu("thue", null)), "Người vận hành điền", "TG1-AC-10: ô người điền bị ghi là từ bài đã đọc")
  // chưa ai điền → nói vì sao trống, kèm số bài đã đọc
  assert.equal(dongCanCuMucDich(theCanCu(null, null)), "Chưa đủ căn cứ (7 bài đã đọc)", "TG1-AC-10: ô trống phải nói vì sao")
})

test("TG1-AC-10 đối chứng đỏ: bản sao bỏ kiểm nguồn thì ô người điền lại ghi «từ bài đã đọc»", async () => {
  const goc = readFileSync(join(GOC, "app/src/components/ops/group-cards/group-cards-text.ts"), "utf8")
  // chỉ phá nhánh của ô bán/thuê (hàm dongCanCu bên trên có dòng y hệt)
  const pha = goc.replace(/(if \(!t\.muc_dich\)[\s\S]*?\n\s*if \(!o) \|\| !o\.nguon(\) return "Người vận hành điền")/, "$1$2")
  assert.notEqual(pha, goc, "can-cu-muc-dich: không phá được hàm")
  const tep = join(GOC, "app/src/components/ops/group-cards", `.tg1-pha-can-cu-${process.pid}.ts`)
  writeFileSync(tep, pha)
  try {
    const { dongCanCuMucDich } = (await import(tep)) as typeof import("../src/components/ops/group-cards/group-cards-text")
    assert.equal(dongCanCuMucDich(theCanCu("thue", null)), "từ bài đã đọc: 18 bán, 2 thuê",
      "can-cu-muc-dich: bản bỏ kiểm nguồn vẫn nói người vận hành điền — ca không phân biệt được")
  } finally { rmSync(tep, { force: true }) }
})
