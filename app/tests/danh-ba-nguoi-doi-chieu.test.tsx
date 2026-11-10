// danh-ba-nguoi-doi-chieu.test.tsx — hồ sơ _acceptance/danh-ba-nguoi-tren-ops E15, ca «DBN-DC». Đối chiếu trang
// /ops/people với danh bạ THẬT do bộ dựng của DB2b ghi ở DB máy thu :5433 (round-trip qua bên ghi thật). Mọi phiên mở
// READ ONLY (default_transaction_read_only), chỉ SELECT; ca chỉ in số đếm, không in tên hay bí danh.
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
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
const LUONG_TIM = 8

after(async () => {
  await db.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

let daNoi = false
const ketNoi = async () => {
  if (!daNoi) await db.connect()
  daNoi = true
}

const dem = async () =>
  (await db.query(`SELECT (SELECT count(*) FROM parties)::int a, (SELECT count(*) FROM registry_aliases)::int b,
                          (SELECT count(*) FROM registry_events)::int c, (SELECT count(*) FROM party_roles)::int d`)).rows[0]

test("DBN-DC trang khớp danh bạ thật ở máy thu; không lộ tên nguồn; không ghi", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có danh bạ thật do bộ dựng DB2b ghi — CI chỉ có lược đồ")
  await ketNoi()
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

// people-hien-so-goc AC-7: số đếm viết thẳng bằng SQL, không qua people.ts; đầu ra chỉ có số đếm, không có số điện thoại.
test("SHS-DC mọi người có số hiện số ở vai xem được, tìm theo số ra đúng người, vai Người xem 0 số; không ghi", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có danh bạ thật do bộ dựng DB2b ghi — CI chỉ có lược đồ")
  await ketNoi()
  const truoc = await dem()
  const { danhSachNguoi, fmtPhone } = await import("../src/lib/ops/people")
  const { hangNguoi } = await import("../src/components/ops/people/people-rows")
  const { rows: so } = await db.query<{ object_key: string; value: string }>(
    `SELECT a.object_key, a.value FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key
     WHERE a.kind = 'sdt' AND a.retired_at IS NULL AND p.status = 'active' ORDER BY a.object_key, a.id`,
  )
  const nguoiCoSo = new Set(so.map((a) => a.object_key))
  const n = nguoiCoSo.size
  assert.ok(n > 0, "SHS-DC máy thu không có người mang bí danh sdt")
  const giu = new Map<string, Set<string>>()
  for (const a of so) giu.set(a.value, (giu.get(a.value) ?? new Set()).add(a.object_key))
  const nhieuSo = so.length - n // mỗi số thứ hai trở lên của một người; hôm nay 0

  let hienXem = 0
  let hienViewer = 0
  const dau = await danhSachNguoi({ source: null, q: "", page: 1, uuTienSo: true })
  for (let page = 1; page <= dau.pages; page++) {
    const trang = page === 1 ? dau : await danhSachNguoi({ source: null, q: "", page, uuTienSo: true })
    for (const r of trang.rows) {
      if (r.sdtKind === "sdt" && hangNguoi(r, [], true).sdt) hienXem++
      if (hangNguoi(r, [], false).sdt || hangNguoi(r, [], false).tel) hienViewer++
    }
  }
  assert.equal(hienXem, n, "SHS-DC số hàng hiện số ở vai xem được")
  assert.equal(hienViewer, 0, "SHS-DC vai Người xem nhận số")

  type Mod = typeof import("../src/lib/ops/people")
  // Tìm từng số vẫn qua danhSachNguoi thật, đủ mọi số; chỉ đổi cách gọi: tám lượt song song trên pool riêng
  // (pool của app chỉ 5 kết nối). Gọi tuần tự 11.595 số mất 23,6 phút, lớn dần theo danh bạ (giám sát quyết 06/11).
  const poolTim = new pg.Pool({ connectionString: docThoi, max: LUONG_TIM })
  t.after(() => poolTim.end().catch(() => {}))
  const kiemTim = async (mod: Mod, value: string) => {
    const r = await mod.danhSachNguoi({ source: null, q: value, page: 1 }, poolTim)
    const khoa = giu.get(value) ?? new Set<string>()
    assert.deepEqual(r.rows.map((x) => x.partyKey).sort(), [...khoa].sort(), "SHS-DC tìm sai người")
    for (const x of r.rows) assert.equal(hangNguoi(x, [], true).sdt, fmtPhone(value), "SHS-DC tìm sai người")
  }
  const people = await import("../src/lib/ops/people")
  const conLai = [...giu.keys()]
  let daTim = 0
  await Promise.all(
    Array.from({ length: LUONG_TIM }, async () => {
      for (let value = conLai.pop(); value !== undefined; value = conLai.pop()) {
        await kiemTim(people, value)
        daTim++
      }
    }),
  )
  assert.equal(daTim, giu.size, "SHS-DC chưa tìm đủ mọi số")
  console.log(`SHS-DC người-có-số=${n} số-khác-nhau=${giu.size} người-từ-hai-số=${nhieuSo} hàng-hiện-số=${hienXem} vai-người-xem=${hienViewer}`)

  // Chiều đỏ: bản tìm bỏ lọc sdt trên cùng DB → ra người mang số khác.
  const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const goc = readFileSync(join(APP, "src/lib/ops/people.ts"), "utf8")
  const tu = "a.value = $3)))"
  assert.ok(goc.includes(tu), "đột biến không áp được")
  const dot = goc
    .replace(tu, "$3::text IS NOT NULL)))")
    .replace(/from "\.\.\/([\w.-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(APP, `src/lib/${ten}.ts`)).href}"`)
  const f = join(mkdtempSync(join(tmpdir(), "shs-dc-")), "people.ts")
  writeFileSync(f, dot)
  const mau = [...giu.keys()][0]
  await assert.rejects(kiemTim((await import(pathToFileURL(f).href)) as Mod, mau), /SHS-DC tìm sai người/)
  assert.deepEqual(await dem(), truoc, "SHS-DC ca đối chiếu đã ghi vào danh bạ")
})
