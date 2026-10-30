// danh-ba-nguoi-doi-chieu.test.tsx — hồ sơ _acceptance/danh-ba-nguoi-tren-ops E15, ca «DBN-DC». Đối chiếu trang
// /ops/people với danh bạ THẬT do bộ dựng của DB2b ghi ở DB máy thu :5433 (round-trip qua bên ghi thật). Mọi phiên mở
// READ ONLY (default_transaction_read_only), chỉ SELECT; ca chỉ in số đếm, không in tên hay bí danh.
import { after, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import type { User } from "../src/lib/auth"

const docThoi = (() => {
  const u = new URL(localDbUrl())
  u.searchParams.set("options", "-c default_transaction_read_only=on")
  return u.toString()
})()
process.env.DATABASE_URL = docThoi // pool của app đọc lúc import — đặt TRƯỚC mọi import động
const db = new pg.Client({ connectionString: docThoi })
const ADMIN = { id: "usr_dbn_dc", email: "dbn-dc@local.test", plan: "free", role: "admin" } as User

after(async () => {
  await db.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

const dem = async () =>
  (await db.query(`SELECT (SELECT count(*) FROM parties)::int a, (SELECT count(*) FROM registry_aliases)::int b,
                          (SELECT count(*) FROM registry_events)::int c, (SELECT count(*) FROM party_roles)::int d`)).rows[0]

test("DBN-DC trang khớp danh bạ thật ở máy thu; không lộ tên nguồn; không ghi", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có danh bạ thật do bộ dựng DB2b ghi — CI chỉ có lược đồ")
  await db.connect()
  const truoc = await dem()
  const { danhBaTongQuan, danhSachNguoi, PAGE_SIZE } = await import("../src/lib/ops/people")
  const { findSourceNames } = await import("../src/lib/mask-source-names")
  const { getSourceNameEntries } = await import("../src/lib/source-roles")

  // Số đếm độc lập — viết thẳng trên bảng, không qua people.ts.
  const doc = (
    await db.query(`SELECT (SELECT count(*) FROM parties WHERE status = 'active')::int AS nguoi,
      (SELECT count(*) FROM (SELECT DISTINCT r.party_key, r.subject_key FROM party_roles r JOIN parties p ON p.party_key = r.party_key
         WHERE p.status = 'active' AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL) t)::int AS tin,
      (SELECT count(DISTINCT a.kind) FROM registry_aliases a LEFT JOIN ref_lookup l ON l.lookup_name = 'alias_kind' AND l.lookup_value = a.kind
         WHERE l.label_vi IS NULL)::int AS kind_khong_nhan`)
  ).rows[0]
  assert.ok(doc.nguoi > 0, "DBN-DC danh bạ máy thu rỗng — không đối chiếu được")
  const tong = await danhBaTongQuan()
  assert.equal(tong.nguoi, doc.nguoi, "DBN-DC tổng người")

  // Mọi trang: tổng số tin cộng lại, không người đã gộp nào có hàng.
  const gop = new Set((await db.query(`SELECT party_key FROM parties WHERE status <> 'active'`)).rows.map((r) => r.party_key))
  let soTin = 0
  let soHang = 0
  let coGop = 0
  const dau = await danhSachNguoi({ source: null, q: "", page: 1 })
  for (let page = 1; page <= dau.pages; page++) {
    const t = page === 1 ? dau : await danhSachNguoi({ source: null, q: "", page })
    for (const r of t.rows) {
      soTin += r.soTin
      soHang++
      if (gop.has(r.partyKey)) coGop++
    }
  }
  assert.equal(soHang, doc.nguoi, "DBN-DC số hàng qua mọi trang")
  assert.equal(soTin, doc.tin, "DBN-DC tổng số tin")
  assert.equal(coGop, 0, "DBN-DC người đã gộp có hàng")
  assert.equal(doc.kind_khong_nhan, 0, "DBN-DC loại bí danh không nhãn")
  assert.ok(dau.rows.length <= PAGE_SIZE)

  // Tên nguồn thật: danh sách lấy trong ca test; người có bí danh khớp tên nguồn → quét HTML trang danh sách + trang người.
  const entries = await getSourceNameEntries()
  assert.ok(entries.length > 0, "DBN-DC không đọc được danh sách tên nguồn")
  const { rows: ung } = await db.query<{ object_key: string; value: string }>(
    `SELECT object_key, value FROM registry_aliases WHERE retired_at IS NULL AND kind IN ('ten', 'tai_khoan_nguon')`,
  )
  const khop = [...new Set(ung.filter((a) => findSourceNames(a.value, entries).length > 0).map((a) => a.object_key))]
  const { PeopleContent } = await import("../src/components/ops/people/people-content")
  const { PersonContent } = await import("../src/components/ops/people/person-content")
  const html = [renderToStaticMarkup(await PeopleContent({ user: ADMIN, loc: { source: null, q: "", page: 1 } }))]
  for (const key of khop) html.push(renderToStaticMarkup(await PersonContent({ user: ADMIN, partyKey: key })))
  const lot = html.reduce((s, h) => s + findSourceNames(h.replace(/<[^>]+>/g, " "), entries).length, 0)
  console.log(`DBN-DC người=${doc.nguoi} tin=${doc.tin} người-có-bí-danh-khớp-tên-nguồn=${khop.length} chỗ-lọt=${lot}`)
  assert.equal(lot, 0, "DBN-DC tên nguồn lọt")

  // Đối chứng dương: chính các bí danh ấy, chưa qua bộ che, thì bộ quét phải bắt được.
  if (khop.length > 0) {
    const tho = ung.filter((a) => khop.includes(a.object_key)).map((a) => a.value).join(" ")
    assert.throws(() => assert.equal(findSourceNames(tho, entries).length, 0, "DBN-DC tên nguồn lọt"), /DBN-DC tên nguồn lọt/)
  }
  assert.deepEqual(await dem(), truoc, "DBN-DC ca đối chiếu đã ghi vào danh bạ")
})
