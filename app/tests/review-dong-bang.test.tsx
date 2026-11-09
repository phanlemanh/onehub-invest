// review-dong-bang.test.tsx — hồ sơ _acceptance/dong-bang-stage-b-resolve E3, E4, E5: thẻ Ghép căn đang chờ đóng băng (V7).
// Ca DB dựng lược đồ tạm `dbs_<pid>` (review_queue LIKE public, dữ liệu viết trước), xoá cuối lượt; bộ nạp, câu đếm và
// ReviewContent là bản thật. Chiều đỏ: câu tương ứng của origin/main (git show) chạy trên CÙNG mồi, thông điệp ghim.
// Chạy: cd app && bash ../db/db-thu.sh oneinvest_suite_dbs --chay node --import tsx --test tests/review-dong-bang.test.tsx
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import type { User } from "@/lib/auth"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const URL_GOC = localDbUrl()
const S = `dbs_${process.pid}`
const urlS = (() => {
  const u = new URL(URL_GOC)
  u.searchParams.set("options", `-c search_path=${S},public`)
  return u.toString()
})()
process.env.DATABASE_URL = urlS // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const OPS = { id: "3", email: "dbs-ops@local.test", plan: "free", role: "ops" } as unknown as User
const VIEWER = { id: "2", email: "dbs-viewer@local.test", plan: "free", role: "viewer" } as unknown as User

let admin: pg.Client
let c: pg.Client
const ID: Record<string, number> = {}

/** Câu `<ten> = \`…\`` trong tệp của origin/main. */
function cauNhanhChinh(tep: string, ten: string): string {
  const src = execFileSync("git", ["show", `origin/main:${tep}`], { cwd: APP, encoding: "utf8" })
  const m = new RegExp(`${ten}\\s*=\\s*\`([\\s\\S]*?)\``).exec(src)
  assert.ok(m, `không rút được ${ten} từ origin/main:${tep}`)
  return m[1]
}

before(async () => {
  admin = new pg.Client({ connectionString: URL_GOC })
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await admin.query(`CREATE TABLE "${S}".review_queue (LIKE public.review_queue INCLUDING DEFAULTS INCLUDING CONSTRAINTS)`)
  c = new pg.Client({ connectionString: urlS })
  await c.connect()
  const ev = (a: string, b: string) => JSON.stringify({ offer_a: { offer_id: a }, offer_b: { offer_id: b } })
  const MOI: [string, string, string, string, string, string | null][] = [
    // khoá, item_type, item_id, status, created_at, decided_at
    ["G1", "entity_match", "pair:oA|oB", "pending", "now() - interval '1 hour'", null],
    ["G4", "entity_match", "pair:oC|oD", "pending", "now() - interval '100 hours'", null],
    ["G2", "entity_match", "pair:oE|oF", "approved", "now() - interval '2 hours'", "now()"],
    ["G3", "entity_match", "pair:oG|oH", "rejected", "now() - interval '3 hours'", "now() - interval '3 days'"],
    ["G5", "entity_match", "pair:oI|oJ", "deferred", "now() - interval '4 hours'", "now() - interval '3 days'"],
    ["K1", "agent_output", "enrich:offer_dbs_k1", "pending", "now() - interval '1 hour'", null],
    ["K2", "data_quality", "dq:dbs_k2", "pending", "now() - interval '1 hour'", null],
  ]
  for (const [k, t, item, st, tao, quyet] of MOI) {
    const a = item.startsWith("pair:") ? item.slice(5).split("|") : ["x", "y"]
    const { rows: [r] } = await c.query(
      `INSERT INTO review_queue (item_type, item_id, title, evidence, status, created_at, decided_at, decided_by)
       VALUES ($1, $2, $3, $4::jsonb, $5, ${tao}, ${quyet ?? "NULL"}, ${quyet ? "'hitl:dbs'" : "NULL"}) RETURNING id`,
      [t, item, `thẻ ${k}`, ev(a[0], a[1]), st])
    ID[k] = Number(r.id)
  }
})

after(async () => {
  await c?.end()
  await admin?.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin?.end()
  const { pool } = await import("@/lib/db")
  await pool.end().catch(() => {})
})

const tapId = (rows: { id: string | number }[]) => new Set(rows.map((r) => Number(r.id)))

test("DBS-AC-3 hàng duyệt bỏ thẻ Ghép căn đang chờ; thẻ đã quyết, hoãn và loại khác còn; ?card thẻ chờ ra «Không tìm thấy thẻ»", async () => {
  const { REVIEW_QUEUE_SQL } = await import("@/lib/ops/review-nap")
  const co = tapId((await c.query(REVIEW_QUEUE_SQL)).rows)
  const MONG: Record<string, boolean> = { G1: false, G4: false, G2: true, G3: true, G5: true, K1: true, K2: true }
  for (const [k, mong] of Object.entries(MONG)) assert.equal(co.has(ID[k]), mong, `DBS-AC-3 thẻ ${k}`)

  const { ReviewContent } = await import("@/components/ops/review-content")
  const htmlChờ = renderToStaticMarkup(await ReviewContent({ user: OPS, card: String(ID.G1) }))
  assert.match(htmlChờ, new RegExp(`Không tìm thấy thẻ #(<!-- -->)?${ID.G1}`), "DBS-AC-3 ?card thẻ chờ đóng băng phải báo không tìm thấy")
  const htmlQuyet = renderToStaticMarkup(await ReviewContent({ user: OPS, card: String(ID.G2) }))
  assert.doesNotMatch(htmlQuyet, /Không tìm thấy thẻ/, "DBS-AC-3 ?card thẻ Ghép căn đã quyết phải mở được")

  // Chiều đỏ: câu của origin/main trên cùng mồi còn G1.
  const cu = tapId((await c.query(cauNhanhChinh("app/src/lib/ops/review-nap.ts", "REVIEW_QUEUE_SQL"))).rows)
  const kiem = (tap: Set<number>) => { if (tap.has(ID.G1)) throw new Error("DBS-AC-3 thẻ Ghép căn đang chờ vẫn hiện") }
  assert.doesNotThrow(() => kiem(co))
  assert.throws(() => kiem(cu), /^Error: DBS-AC-3 thẻ Ghép căn đang chờ vẫn hiện$/)
})

test("DBS-AC-4 số chờ (đầu trang, viewer, dòng chảy) không tính thẻ Ghép căn đang chờ; hoãn không là chờ; hôm nay còn tính", async () => {
  const { loadDauTrang } = await import("@/lib/ops/review-dau-trang")
  const d = await loadDauTrang(c)
  assert.deepEqual({ cho: d?.cho, quaHan: d?.quaHan }, { cho: 2, quaHan: 0 }, "DBS-AC-4 ba số đầu trang")
  assert.ok((d?.homNay ?? 0) >= 1, "DBS-AC-4 «Đã quyết hôm nay» phải tính thẻ Ghép căn G2")

  const { PENDING_COUNTS_SQL, ReviewContent } = await import("@/components/ops/review-content")
  const theoLoai = Object.fromEntries((await c.query(PENDING_COUNTS_SQL)).rows.map((r) => [r.type, r.n]))
  assert.deepEqual(theoLoai, { agent_output: 1, data_quality: 1 }, "DBS-AC-4 đếm theo loại")
  const htmlViewer = renderToStaticMarkup(await ReviewContent({ user: VIEWER }))
  assert.match(htmlViewer, /data-pending-total="2"/, "DBS-AC-4 viewer: tổng chờ")
  assert.doesNotMatch(htmlViewer, /data-pending-type="entity_match"/, "DBS-AC-4 viewer: còn dòng Ghép căn")

  const { REVIEW_PENDING_SQL } = await import("@/lib/data-flow-queries")
  assert.equal(Number((await c.query(REVIEW_PENDING_SQL)).rows[0].review), 2, "DBS-AC-4 dòng chảy «Hàng duyệt»")

  // Chiều đỏ: câu ba số của origin/main trên cùng mồi đếm cả G1, G4.
  const { rows: [cu] } = await c.query(cauNhanhChinh("app/src/lib/ops/review-dau-trang.ts", "DAU_TRANG_SQL"), [72])
  const kiem = (cho: number) => { if (cho !== 2) throw new Error("DBS-AC-4 số chờ còn tính Ghép căn") }
  assert.doesNotThrow(() => kiem(d?.cho ?? -1))
  assert.equal(cu.cho, 4)
  assert.throws(() => kiem(cu.cho), /^Error: DBS-AC-4 số chờ còn tính Ghép căn$/)
})

test("DBS-AC-5 Căn giá tốt không báo «đang chờ ghép», không truy vấn review_queue", async () => {
  const { loadPendingUnitMatches, CHO_GHEP_SQL } = await import("@/lib/ops/review-cho-ghep")
  const cau: string[] = []
  const spy = { query: (sql: string, p?: unknown[]) => { cau.push(String(sql)); return c.query(sql, p) } } as never
  assert.deepEqual(await loadPendingUnitMatches(["oA"], spy), {}, "DBS-AC-5 kết quả")
  assert.equal(cau.filter((s) => s.includes("review_queue")).length, 0, "DBS-AC-5 còn truy vấn review_queue")

  // Chiều đỏ: câu của origin/main chạy thẳng trên cùng mồi trả G1 cho oA.
  const cu = await c.query(cauNhanhChinh("app/src/lib/ops/review-cho-ghep.ts", "CHO_GHEP_SQL"), [["oA"]])
  const kiem = (rows: { id: string | number }[]) => { if (rows.some((r) => Number(r.id) === ID.G1)) throw new Error("DBS-AC-5 Căn giá tốt còn báo chờ ghép") }
  assert.throws(() => kiem(cu.rows), /^Error: DBS-AC-5 Căn giá tốt còn báo chờ ghép$/)
  assert.equal(CHO_GHEP_SQL.includes("entity_match"), true)
})
