// bi-danh.mts — DA67 E11 (AC-9) trên DB máy thu CHỈ ĐỌC: dựng cây bằng docDanhBa + dungCay thật, đếm dự án gốc có bí danh trùng
// tên sau gấp dấu (đếm độc lập trong probe) và số dòng phụ của biDanhKhacTen còn chứa bí danh ấy. Chỉ in số, không in tên.
// Chạy: bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh bidanh
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type PgT from "pg"

const APP = join(resolve(dirname(fileURLToPath(import.meta.url)), "../../.."), "app")
const pg: typeof PgT = createRequire(join(APP, "package.json"))("pg")
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4, options: "-c default_transaction_read_only=on" })
const nap = (t: string) => import(pathToFileURL(join(APP, t)).href)
const { docDanhBa } = await nap("src/lib/ops/registry/doc.ts")
const { dungCay, biDanhKhacTen } = await nap("src/lib/ops/registry/cay.ts")
const { getSourceNameEntries } = await nap("src/lib/source-roles.ts")

// Gấp dấu viết riêng ở đây (không import fold của app) — đếm độc lập.
const gap = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase()
const danhBa = await docDanhBa(pool)
const cay = dungCay(danhBa.nut, danhBa.tinh ?? {}, await getSourceNameEntries())
let coTrung = 0, conTrung = 0
for (const h of cay) {
  const trung = h.biDanh.filter((b: string) => gap(b) === gap(h.ten))
  if (trung.length === 0) continue
  coTrung++
  const phu: string[] = biDanhKhacTen(h.ten, h.biDanh)
  if (phu.some((b) => gap(b) === gap(h.ten))) conTrung++
}
console.log(`AC-9 dự án gốc: ${cay.length} · có bí danh trùng tên sau gấp dấu: ${coTrung} · dòng phụ còn nhắc lại tên: ${conTrung}`)
assert.ok(coTrung > 0, "AC-9 đối chứng: không dự án nào có bí danh trùng tên — phép đếm không phân biệt")
assert.equal(conTrung, 0, `AC-9 còn ${conTrung} dòng phụ nhắc lại tên`)
await pool.end()
await (await nap("src/lib/db.ts")).pool.end().catch(() => {})
console.log("bi-danh: ĐẠT")
