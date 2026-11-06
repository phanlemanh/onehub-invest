// enrich-nguoi-s03.test.tsx — hồ sơ enrich-nguoi-s03 E7: tin S03 nhận số qua người đăng hiện qua hai route thật kèm nhãn chưa xác minh,
// trên lược đồ tạm của Postgres local :5433 (hoặc DB service của CI) có bảng bản ghi + view sale_offers dựng từ migration 079.
// Không chạm dữ liệu dùng chung, xoá cuối lượt. Số, tên trong tệp đều giả.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"

import { OFFER_LABEL_HELP } from "../src/components/listing/offer-label-help"
import { OFFER_LABELS } from "../src/components/marketing/methodology-definitions"
import { KIND, PROPERTY_TYPE } from "../src/lib/vocab.generated"

const GOC = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const S = `en_api_${process.pid}`
const urlOf = (sc: string) => {
  const u = new URL(GOC)
  u.searchParams.set("options", `-c search_path=${sc}`)
  return u.toString()
}
// db.ts đọc biến này lúc nạp, nên mọi module chạm DB nạp động trong before().
process.env.DATABASE_URL = urlOf(S)

const MIG = (so: string) => readFileSync(join(import.meta.dirname, `../../db/migrations/${so}`), "utf8")
const VIEW = (sql: string) => sql.match(/CREATE OR REPLACE VIEW sale_offers AS[\s\S]*?;/)![0]
const VIEW_079 = VIEW(MIG("079_lien_lac_nguoi.sql"))
const VIEW_070 = VIEW(MIG("070_nhan_so_ghep.sql"))

const admin = new pg.Client({ connectionString: GOC })
let listingsRoute: typeof import("../src/app/api/v1/listings/route")
let contactRoute: typeof import("../src/app/api/v1/listings/[id]/contact/route")
let pool: typeof import("../src/lib/db").pool

const TT = "vn-enx"
const P1 = `${TT}-p1`
const SO = "+84912000971"
const SUY = { rule_id: "s03-qua-nguoi-dang", tier: "inferred", method: "e1_rule", party_key: "pty_THU", measured: false }

before(async () => {
  await admin.connect()
  await admin.query(`CREATE SCHEMA "${S}"`)
  await admin.query(`CREATE TABLE "${S}".areas (LIKE public.areas INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".sale_offer_records (LIKE public.sale_offer_records INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".listings (LIKE public.listings INCLUDING DEFAULTS)`)
  await admin.query(`INSERT INTO "${S}".areas (id, region_type, name, country_code, parent_id) VALUES ($1,'market','Thành phố X','vn',NULL), ($2,'ward','Phường Một','vn',$1)`, [TT, P1])
  await dungView(VIEW_079)
  listingsRoute = await import("../src/app/api/v1/listings/route")
  contactRoute = await import("../src/app/api/v1/listings/[id]/contact/route")
  pool = (await import("../src/lib/db")).pool
})

after(async () => {
  await pool?.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.end()
})

/** View sale_offers trong lược đồ tạm, trỏ bảng bản ghi của lược đồ tạm. */
async function dungView(sql: string) {
  await admin.query(`SET search_path = "${S}"`)
  await admin.query(`DROP VIEW IF EXISTS "${S}".sale_offers`)
  await admin.query(sql.replace("CREATE OR REPLACE VIEW sale_offers", `CREATE VIEW "${S}".sale_offers`))
  await admin.query("SET search_path = public")
}

const HOM_QUA = () => new Date(Date.now() - 86_400_000).toISOString()
const tin = (offer_id: string, over: Record<string, unknown> = {}): Record<string, unknown> => ({
  offer_id, kind: KIND.sale, property_type: PROPERTY_TYPE.apartment, price_vnd: 2_000_000_000, area_m2: 50, price_perm2: 40_000_000,
  bedrooms: 2, area_id: P1, source: "S03", first_seen: HOM_QUA(), last_seen: HOM_QUA(), seller_name: "Chị Thử", ...over,
})
async function nap(rows: Record<string, unknown>[]) {
  await admin.query(`TRUNCATE "${S}".sale_offer_records`)
  for (const r of rows) {
    const k = Object.keys(r)
    await admin.query(
      `INSERT INTO "${S}".sale_offer_records (${k.map((c) => `"${c}"`).join(",")}) VALUES (${k.map((_, i) => `$${i + 1}`).join(",")})`,
      k.map((c) => r[c]),
    )
  }
}
const goiDanh = async () => {
  const res = await listingsRoute.GET(new Request(`http://local.test/api/v1/listings?market=${TT}&kind=sale`))
  return { status: res.status, text: await res.text() }
}
const goiSo = (id: string) => contactRoute.GET(new Request(`http://local.test/api/v1/listings/${id}/contact`), { params: Promise.resolve({ id }) })

const HAI_O = [
  { o: "s03-suy", dong: { seller_phone: SO, field_provenance: JSON.stringify({ seller_phone: SUY }) }, inferred: true },
  { o: "s03-truc-tiep", dong: { seller_phone: SO, field_provenance: "{}" }, inferred: false },
]

/** Tên ô sai trên view đang dựng; dùng chung cho view 079 và view 070 (đối chứng). */
async function oSai() {
  const sai: string[] = []
  for (const m of HAI_O) {
    await nap([tin(m.o, m.dong)])
    const danh = await goiDanh()
    const dong = JSON.parse(danh.text).data.find((d: { offerId: string }) => d.offerId === m.o)
    if (dong?.hasPhone !== true) sai.push(`hasPhone ${m.o}`)
    if (dong?.phoneInferred !== m.inferred) sai.push(`phoneInferred ${m.o}`)
    if (/\+84\d{9}|\b0\d{9}\b/.test(danh.text)) sai.push(`lộ số ${m.o}`)
    const so = await goiSo(m.o)
    const than = so.status === 200 ? await so.json() : null
    if (JSON.stringify(than) !== JSON.stringify({ phone: SO, inferred: m.inferred })) sai.push(`inferred ${m.o}`)
  }
  return sai
}

test("EN-AC-7 hai route thật: tin S03 số qua người đăng mang nhãn, số trực tiếp không", async () => {
  assert.equal(HAI_O.length, 2)
  assert.deepEqual(await oSai(), [])
})

test("EN-AC-7 chiều đỏ: view 070 (chưa nhận dấu S03) thì ca nêu phoneInferred của s03-suy", async () => {
  await dungView(VIEW_070)
  try {
    const sai = await oSai()
    assert.ok(sai.includes("phoneInferred s03-suy"), `đối chứng phải nêu phoneInferred s03-suy: ${sai.join(", ")}`)
  } finally {
    await dungView(VIEW_079)
  }
})

test("EN-AC-7 lời giải thích nhãn số nói số có thể suy từ tin hoặc bài khác của cùng tài khoản", () => {
  assert.match(OFFER_LABEL_HELP.phone.body, /tin hoặc bài khác của cùng tài khoản/)
  const muc = OFFER_LABELS.find((d) => d.id === "so-chua-xac-minh")
  assert.ok(muc, "thiếu mục so-chua-xac-minh")
  assert.match(String(muc.answer), /tin hoặc bài khác của cùng tài khoản/)
})
