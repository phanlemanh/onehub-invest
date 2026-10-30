// labels-gia.test.tsx — hồ sơ _acceptance/nhan-gia-va-luu-loi-mang, ca «NGL-AC-n». Ma trận viết trước cho đơn vị giá và
// dấu ngăn nghìn (bộ chuẩn hoá thật), năm kết cục của lượt lưu trên phản hồi của route thật (lược đồ tạm có migration
// 054). Mỗi phép đo có chiều đỏ: bản chép đột biến (thư mục tạm, đổi đúng một chỗ) phải bị chính phép đo bắt.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { RawLabels } from "../src/lib/labels-normalize"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const S = `ngl_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const tuApp = createRequire(join(APP, "package.json"))
const LAT = "ngl-thu"
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

/** Chép một tệp nguồn của app sang thư mục tạm, đổi đúng một chỗ, viết lại mọi import thành đường tuyệt đối. */
async function banDot<T>(tep: string, tu: string, thanh: string): Promise<T> {
  const goc = readFileSync(join(APP, tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const tuyetDoi = (ten: string) => {
    if (ten.startsWith(".") || ten.startsWith("@/")) {
      const goc2 = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
      const f = [".ts", ".tsx", "/index.ts", "/index.tsx", ""].map((d) => goc2 + d).find((x) => existsSync(x) && !x.endsWith("/"))
      return pathToFileURL(f ?? goc2).href
    }
    return pathToFileURL(tuApp.resolve(ten)).href
  }
  const dot = goc.replace(tu, thanh).replace(/from "([^"]+)"/g, (_m, ten: string) => `from "${tuyetDoi(ten)}"`)
  const f = join(mkdtempSync(join(tmpdir(), "ngl-dot-")), tep.split("/").pop()!)
  writeFileSync(f, dot)
  return import(pathToFileURL(f).href) as Promise<T>
}

type Norm = typeof import("../src/lib/labels-normalize")
const DU: RawLabels = {
  listing_intent: { value: "offer" },
  kind: { value: "sale" },
  property_type: { value: "apartment" },
  project: { value: "Ocean Park" },
  building: { value: "S1" },
  price_min_vnd: { value: "4,35", unit: "ty" },
  price_max_vnd: { value: "4350", unit: "trieu" },
  area_m2: { value: "64,5" },
  bedrooms: { value: "2" },
}
const voiGia = (lo: string, hi: string, unit: string) =>
  ({ ...DU, price_min_vnd: { value: lo, unit }, price_max_vnd: { value: hi, unit } }) as unknown as RawLabels

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await sc.connect()
  await sc.query(readFileSync(join(APP, "../db/migrations/054_labels.sql"), "utf8"))
  for (let i = 1; i <= 2; i++) {
    await sc.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text) VALUES ($1, 'hanoi__zalo__ngl', 'NGL', $2)`, [`zalo-ngl-${i}`, `tin ${i}`])
    await sc.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ($1, 'S03', $2, $3, 'dev', false, 'ngl')`,
      [LAT, `zalo-ngl-${i}`, `h${i}`])
  }
})

after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

// ---- AC-1: đơn vị giá đóng ----
const DON_VI: [unknown, boolean][] = [["ty", true], ["trieu", true], ["tỷ", false], ["TY", false], ["billion", false], ["", false], [undefined, false]]
function kiemDonVi(n: Norm): string[] {
  const sai: string[] = []
  for (const [u, qua] of DON_VI) {
    const kq = n.chuanHoaLuot(voiGia("4", "5", u as string))
    const coLoi = !kq.ok && kq.loi.price_min_vnd === n.MSG_DON_VI
    if (qua ? !kq.ok : !coLoi) sai.push(`unit ${JSON.stringify(u)}: ${JSON.stringify(kq)}`)
  }
  return sai
}

test("NGL-AC-1 đơn vị giá: ty/trieu qua; tỷ, TY, billion, rỗng, vắng → lỗi ô giá; route 400, 0 dòng; bản bỏ kiểm đơn vị bị bắt", async () => {
  const n = await import("../src/lib/labels-normalize")
  assert.deepEqual(kiemDonVi(n), [], "DON VI LA LOT QUA")
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const res = await POST(new Request("http://localhost/api/v1/ops/labels", {
    method: "POST", headers: { "content-type": "application/json", cookie: a.cookie },
    body: JSON.stringify({ lat: LAT, item_id: 1, values: voiGia("4", "5", "tỷ") }),
  }))
  assert.equal(res.status, 400)
  assert.equal(((await res.json()) as { loi: Record<string, string> }).loi.price_min_vnd, n.MSG_DON_VI)
  assert.equal((await sc.query(`SELECT count(*)::int AS n FROM eval_labels`)).rows[0].n, 0)
  const dot = await banDot<Norm>("src/lib/labels-normalize.ts",
    "const donVi = (c: RawCell) => ((PRICE_UNITS as readonly string[]).includes(String(c.unit)) ? (c.unit as PriceUnit) : null)",
    'const donVi = (c: RawCell) => (c.unit === "ty" || c.unit === undefined ? "ty" : "trieu") as PriceUnit | null')
  assert.notDeepEqual(kiemDonVi(dot), [], "đối chứng không đỏ: DON VI LA LOT QUA không bắt bản bỏ kiểm đơn vị")
})

// ---- AC-2: dấu ngăn nghìn ----
type Ca = { o: "price" | "area"; v: string; unit?: "ty" | "trieu"; ky: string }
const NGHIN = "nghin", KHUON = "khuon"
const MA_TRAN: Ca[] = [
  { o: "price", v: "4.350", unit: "ty", ky: NGHIN }, { o: "price", v: "4.350", unit: "trieu", ky: NGHIN },
  { o: "price", v: "4,350", unit: "ty", ky: NGHIN }, { o: "price", v: "4,350", unit: "trieu", ky: NGHIN },
  { o: "price", v: "12.500", unit: "trieu", ky: NGHIN }, { o: "area", v: "1.200", ky: NGHIN }, { o: "area", v: "4,350", ky: NGHIN },
  { o: "price", v: "4.350.000", unit: "trieu", ky: KHUON }, { o: "area", v: "1.200,5", ky: KHUON }, { o: "price", v: "4.350,5", unit: "ty", ky: KHUON },
  { o: "price", v: "3.5", unit: "ty", ky: "3500000000" }, { o: "price", v: "3.85", unit: "ty", ky: "3850000000" },
  { o: "price", v: "4,35", unit: "ty", ky: "4350000000" }, { o: "price", v: "4350", unit: "trieu", ky: "4350000000" },
  { o: "price", v: "4.3500", unit: "ty", ky: "4350000000" }, { o: "area", v: "64.5", ky: "64.5" }, { o: "area", v: "64,5", ky: "64.5" },
]
function kiemNghin(n: Norm): string[] {
  const sai: string[] = []
  for (const c of MA_TRAN) {
    const raw = c.o === "price" ? voiGia(c.v, c.v, c.unit!) : ({ ...DU, area_m2: { value: c.v } } as RawLabels)
    const kq = n.chuanHoaLuot(raw)
    const truong = c.o === "price" ? "price_min_vnd" : "area_m2"
    let dung: boolean
    if (c.ky === NGHIN) dung = !kq.ok && kq.loi[truong] === n.MSG_NGAN_NGHIN
    else if (c.ky === KHUON) dung = !kq.ok && /phải là số/.test(kq.loi[truong] ?? "")
    else dung = kq.ok && kq.rows.find((r) => r.field === truong)?.value === c.ky
    if (!dung) sai.push(`${c.o} ${c.v} ${c.unit ?? ""} → ${JSON.stringify(kq.ok ? kq.rows.find((r) => r.field === truong) : kq.loi)}`)
  }
  return sai
}

test("NGL-AC-2 dấu ngăn nghìn: ma trận 17 ca viết trước; khứ hồi 4,35 tỷ = 4350 triệu; hai bản đột biến bị bắt", async () => {
  const n = await import("../src/lib/labels-normalize")
  assert.deepEqual(kiemNghin(n), [], "DAU CHAM NGHIN LOT QUA")
  const kq = n.chuanHoaLuot(DU)
  assert.ok(kq.ok)
  const gia = Object.fromEntries(kq.rows.filter((r) => r.field.startsWith("price")).map((r) => [r.field, r.value]))
  assert.deepEqual(gia, { price_min_vnd: "4350000000", price_max_vnd: "4350000000" })
  const LUAT = 'if (/^\\d+[.,]\\d{3}$/.test(t)) return "nghin"'
  const boLuat = await banDot<Norm>("src/lib/labels-normalize.ts", LUAT, "")
  assert.ok(kiemNghin(boLuat).some((x) => x.includes("4.350")), "đối chứng không đỏ: DAU CHAM NGHIN LOT QUA")
  const chiCham = await banDot<Norm>("src/lib/labels-normalize.ts", LUAT, 'if (/^\\d+\\.\\d{3}$/.test(t)) return "nghin"')
  const saiCham = kiemNghin(chiCham)
  assert.ok(saiCham.some((x) => x.includes("4,350")) && !saiCham.some((x) => x.includes("4.350 ")), "đối chứng không đỏ: DAU PHAY NGHIN LOT QUA")
})

// ---- AC-3: năm kết cục trên phản hồi của route thật ----
type Luu = typeof import("../src/components/ops/labels/luu-nhan")
test("NGL-AC-3 guiNhan: 200/400/409 lấy từ route thật, 500 và lỗi mạng giả lập; 409 của chính mình = đã lưu; Alert có «Lưu lại»", async () => {
  await sc.query(`TRUNCATE eval_labels`)
  const a = await taoNguoi(sc, "ops")
  const b = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const goi = (cookie: string, values: RawLabels) => POST(new Request("http://localhost/api/v1/ops/labels", {
    method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ lat: LAT, item_id: 1, values }),
  }))
  const PHAN_HOI: [string, Response][] = [
    ["da-luu", await goi(a.cookie, DU)],
    ["loi-truong", await goi(a.cookie, voiGia("4", "5", "tỷ"))],
    ["loi-truong", await goi(a.cookie, voiGia("4.350", "4.400", "trieu"))],
    ["da-co-nguoi", await goi(b.cookie, DU)],
    ["da-luu", await goi(a.cookie, DU)], // 409 của chính A: lượt trước đã vào
    ["loi-may-chu", Response.json({ error: "x" }, { status: 500 })],
  ]
  const luu = await import("../src/components/ops/labels/luu-nhan")
  const body = { lat: LAT, item_id: 1, values: DU }
  for (const [ky, res] of PHAN_HOI) {
    const kq = await luu.guiNhan((async () => res.clone()) as typeof fetch, body)
    assert.equal(kq.kind, ky, `phản hồi ${res.status} phải ra ${ky}`)
  }
  const mang = await luu.guiNhan((async () => { throw new TypeError("Failed to fetch") }) as typeof fetch, body)
  assert.equal(mang.kind, "mat-ket-noi", "LOI MANG BI NUOT")
  const { rows } = await sc.query(`SELECT count(*)::int AS n FROM eval_labels WHERE item_id = 1 AND labeler_id = $1`, [a.id])
  assert.equal(rows[0].n, 9, "lượt lại sau 409 của chính mình không được ghi thêm")
  const html = renderToStaticMarkup(<luu.LuuLoiAlert onRetry={() => {}} dangLuu={false} />)
  assert.match(html, /Không chắc đã lưu/)
  assert.match(html, /Lưu lại/)
  const dot = await banDot<Luu>("src/components/ops/labels/luu-nhan.tsx", 'return { kind: "mat-ket-noi" }', 'throw new Error("nuot")')
  await assert.rejects(dot.guiNhan((async () => { throw new TypeError("Failed to fetch") }) as typeof fetch, body),
    "đối chứng không đỏ: LOI MANG BI NUOT không bắt bản không bắt lỗi fetch")
})
