// audit-loc.test.tsx — hồ sơ _acceptance/loc-enrich-thu-ops-audit, ca «LA-AC-n». Lược đồ tạm `la_<pid>` có ops_audit +
// users/sessions (luocDoPhienAdmin); route GET /api/v1/ops/audit gọi bằng Request thật (Cookie phiên). public không bị chạm.
// Đối chứng: «route trước vòng» = fixture tests/fixtures/audit-route-truoc-loc/route.ts.txt (chép từ 4cfd7cd1 — không gọi
// git lúc chạy). Bản đột biến chép sang thư mục tạm, import `@/` viết lại thành file:// tới src/ thật (cùng module db, quyền).
import { after, before, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { luocDoPhienAdmin, taoNguoi } from "./helpers/phien-thu"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROUTE = join(APP, "src/app/api/v1/ops/audit/route.ts")
const FIXTURE = join(APP, "tests/fixtures/audit-route-truoc-loc/route.ts.txt")
const RUN_TS = join(APP, "../agent/src/enrich/run.ts")
const TOKEN = "la-thu-token"
process.env.OPS_API_TOKEN = TOKEN

type Dong = { at: string; actor: string; action: string; env: string; detail: { seq?: number } }
type GetFn = (req: Request) => Promise<Response>

let lt: Awaited<ReturnType<typeof luocDoPhienAdmin>>
let sc: pg.Client
let GET_MOI: GetFn
let GET_CU: GetFn

/** Viết lại import `@/x` thành file:// tới src/x thật, để bản chép ở thư mục tạm dùng chung module với route thật. */
function noiAlias(src: string): string {
  return src.replace(/from "@\/([\w/.-]+)"/g, (_m, p: string) => `from "${pathToFileURL(join(APP, "src", `${p}.ts`)).href}"`)
}
// Bản chép nằm dưới app/node_modules/.cache (git bỏ qua) để `next/server` giải được lên node_modules của app.
const TAM = join(APP, "node_modules/.cache/audit-loc-test")
/** Nạp một bản route (nội dung cho trước) từ thư mục tạm. */
async function napRoute(noiDung: string): Promise<GetFn> {
  mkdirSync(TAM, { recursive: true })
  const f = join(mkdtempSync(join(TAM, "route-")), "route.ts")
  writeFileSync(f, noiAlias(noiDung))
  return (await import(pathToFileURL(f).href)).GET
}
/** Bản đột biến của route hiện tại: thay đúng một chuỗi (phải có mặt). */
async function routeDot(tu: string, thanh: string): Promise<GetFn> {
  const goc = readFileSync(ROUTE, "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  return napRoute(goc.replace(tu, thanh))
}

before(async () => {
  lt = await luocDoPhienAdmin("la")
  process.env.DATABASE_URL = lt.url // pool của app đọc lúc import — đặt TRƯỚC mọi import route
  sc = new pg.Client({ connectionString: lt.url })
  await sc.connect()
  GET_MOI = (await import(pathToFileURL(ROUTE).href)).GET
  assert.ok(existsSync(FIXTURE), `thiếu fixture route trước vòng: ${FIXTURE} (chép từ 4cfd7cd1)`)
  GET_CU = await napRoute(readFileSync(FIXTURE, "utf8"))
})
after(async () => {
  rmSync(TAM, { recursive: true, force: true })
  await sc?.end()
  await lt?.don()
})
beforeEach(async () => {
  await sc.query("TRUNCATE ops_audit")
})

let seq = 0
/** Gieo một dòng; `phut` = số phút sau mốc gốc (lớn hơn = mới hơn). Trả seq duy nhất của dòng. */
async function gieo(action: string, actor: string, phut: number): Promise<number> {
  const s = ++seq
  await sc.query(
    `INSERT INTO ops_audit (at, actor, action, env, detail) VALUES (timestamptz '2026-10-01 00:00+00' + make_interval(mins => $1), $2, $3, 'local', $4)`,
    [phut, actor, action, { seq: s }],
  )
  return s
}
async function goi(get: GetFn, headers: Record<string, string> = { cookie: lt.cookie }) {
  const res = await get(new Request("http://localhost/api/v1/ops/audit", { headers }))
  return { status: res.status, rows: res.status === 200 ? ((await res.json()).rows as Dong[]) : [] }
}

// ── LA-AC-1 ─────────────────────────────────────────────────────────────────────────────────────────────────
const NGUOI = ["user:usr_a", "ops-user", "usr_648af420ac99a21c", "hitl", "user:usr_b"] // khuôn actor có thật (đo 30/10)

async function kiemKhongChe(get: GetFn) {
  const nguoi = []
  for (const [i, a] of NGUOI.entries()) nguoi.push(await gieo("review:decide", a, i))
  for (let i = 0; i < 150; i++) await gieo("enrich:thu", "enrich-run:la", 100 + i)
  const r = await goi(get)
  assert.equal(r.status, 200)
  const co = new Set(r.rows.map((d) => d.detail.seq))
  const thieu = nguoi.filter((s) => !co.has(s))
  assert.deepEqual(thieu, [], "LA-AC-1 thao tác người bị dấu máy đẩy ra")
  assert.equal(r.rows.filter((d) => d.action === "enrich:thu").length, 0, "LA-AC-1 nhật ký còn dòng enrich:thu")
  assert.equal(nguoi.length, 5)
}

test("LA-AC-1 dấu máy không che thao tác người", () => kiemKhongChe(GET_MOI))
test("LA-AC-1 chiều đỏ: route trước vòng → thao tác người bị dấu máy đẩy ra", async () => {
  await assert.rejects(kiemKhongChe(GET_CU), /LA-AC-1 thao tác người bị dấu máy đẩy ra/)
})

// ── LA-AC-2 ─────────────────────────────────────────────────────────────────────────────────────────────────
async function kiemDu100(get: GetFn) {
  // 190 dòng theo thời gian: cứ dòng thứ 3 (i % 19 < 6) là dấu máy — 130 dòng thường xen 60 dấu, viết trước.
  const thuong: { seq: number; phut: number }[] = []
  let dau = 0
  for (let i = 0; i < 190; i++) {
    if (i % 19 < 6) { await gieo("enrich:thu", "enrich-run:la", i); dau++ }
    else thuong.push({ seq: await gieo("bait-gap:loai-phi-ly", "refresh-bait-gap", i), phut: i })
  }
  assert.deepEqual([thuong.length, dau], [130, 60], "LA-AC-2 lát gieo sai khuôn")
  const muon = thuong.sort((a, b) => b.phut - a.phut).slice(0, 100).map((t) => t.seq)
  const r = await goi(get)
  assert.equal(r.status, 200)
  const duoc = r.rows.map((d) => d.detail.seq)
  assert.deepEqual(duoc, muon, "LA-AC-2 trả dòng dấu máy hoặc thiếu dòng thường")
  for (const d of r.rows) assert.deepEqual(Object.keys(d).sort(), ["action", "actor", "at", "detail", "env"], "LA-AC-2 khuôn dòng đổi")
}

test("LA-AC-2 đủ 100 dòng không phải dấu, đúng thứ tự, đúng khuôn", () => kiemDu100(GET_MOI))
test("LA-AC-2 chiều đỏ: route trước vòng → trả dòng dấu máy hoặc thiếu dòng thường", async () => {
  await assert.rejects(kiemDu100(GET_CU), /LA-AC-2 trả dòng dấu máy hoặc thiếu dòng thường/)
})

// ── LA-AC-3 ─────────────────────────────────────────────────────────────────────────────────────────────────
const MA_TRAN_ACTION = [
  "enrich:revert", "enrich:reconcile", "enrich:retire", "bait-gap:loai-phi-ly", "transform:reject-test",
  "phat-bieu:cat-chuyen", "review:decide", "zalo.admin", "source-group:toggle", "enrich:thu-lai",
]

async function kiemChiLocDung(get: GetFn) {
  for (const [i, a] of MA_TRAN_ACTION.entries()) await gieo(a, "may-hay-nguoi", i)
  await gieo("enrich:thu", "enrich-run:la", 50)
  const r = await goi(get)
  const co = new Set(r.rows.map((d) => d.action))
  let soAssert = 0
  for (const a of MA_TRAN_ACTION) {
    assert.ok(co.has(a), `LA-AC-3 lọc nhầm thao tác: ${a}`)
    soAssert++
  }
  assert.equal(soAssert, 10, "LA-AC-3 số assert phải bằng số phần tử ma trận")
  assert.ok(!co.has("enrich:thu"), "LA-AC-3 enrich:thu chưa bị lọc")
}

test("LA-AC-3 chỉ lọc đúng enrich:thu", () => kiemChiLocDung(GET_MOI))
test("LA-AC-3 chiều đỏ: lọc theo tiền tố enrich: → lọc nhầm enrich:revert", async () => {
  const dot = await routeDot("WHERE action <> ALL ($1::text[])", "WHERE action NOT LIKE 'enrich:%' AND $1::text[] IS NOT NULL")
  await assert.rejects(kiemChiLocDung(dot), /LA-AC-3 lọc nhầm thao tác: enrich:revert/)
})

// ── LA-AC-4 ─────────────────────────────────────────────────────────────────────────────────────────────────
async function maTranNguoiGoi(): Promise<{ ten: string; headers: Record<string, string> }[]> {
  const ops = await taoNguoi(sc, "ops")
  const viewer = await taoNguoi(sc, "viewer")
  const het = await taoNguoi(sc, "admin", { hetHan: true })
  return [
    { ten: "admin", headers: { cookie: lt.cookie } },
    { ten: "vai ops", headers: { cookie: ops.cookie } },
    { ten: "vai viewer", headers: { cookie: viewer.cookie } },
    { ten: "phiên hết hạn", headers: { cookie: het.cookie } },
    { ten: "không phiên", headers: {} },
    { ten: "bearer", headers: { authorization: `Bearer ${TOKEN}` } },
  ]
}

async function kiemQuyenKhongDoi(getMoi: GetFn) {
  const tron = await goi(getMoi) // bảng trống: 200, rows rỗng
  assert.deepEqual([tron.status, tron.rows.length], [200, 0], "LA-AC-4 bảng trống phải trả 200 rỗng")
  await gieo("review:decide", "user:usr_a", 1)
  const mt = await maTranNguoiGoi()
  let soAssert = 0
  for (const o of mt) {
    const [cu, moi] = [await goi(GET_CU, o.headers), await goi(getMoi, o.headers)]
    assert.equal(moi.status, cu.status, `LA-AC-4 quyền đổi ở ô ${o.ten}`)
    soAssert++
  }
  assert.equal(soAssert, 6, "LA-AC-4 số assert phải bằng 6 ô")
  const admin = await goi(getMoi)
  assert.deepEqual([admin.status, admin.rows.length], [200, 1], "LA-AC-4 đối chứng: ô admin phải nhận 200 kèm rows")
}

test("LA-AC-4 quyền không đổi so với route trước vòng", () => kiemQuyenKhongDoi(GET_MOI))
test("LA-AC-4 chiều đỏ: route đổi quyền sang ops.read → quyền đổi ở ô vai ops", async () => {
  const dot = await routeDot(`kiemQuyen(req, "audit.read")`, `kiemQuyen(req, "ops.read")`)
  await assert.rejects(kiemQuyenKhongDoi(dot), /LA-AC-4 quyền đổi ở ô vai ops/)
})

// ── LA-AC-5 ─────────────────────────────────────────────────────────────────────────────────────────────────
/** Chuỗi action trong câu INSERT INTO ops_audit của bên ghi (agent/src/enrich/run.ts). */
function actionBenGhi(src: string): string[] {
  return [...src.matchAll(/INSERT INTO ops_audit[^`]*?'([a-z]+:[a-z-]+)'/g)].map((m) => m[1])
}

async function kiemKhop(srcRun: string) {
  const { DAU_MAY } = await import(pathToFileURL(join(APP, "src/lib/ops/audit-loc.ts")).href)
  const ghi = actionBenGhi(srcRun)
  assert.equal(ghi.length, 1, `LA-AC-5 phải rút được đúng một chuỗi action từ bên ghi — được ${JSON.stringify(ghi)}`)
  assert.ok(ghi[0].length > 0)
  assert.ok((DAU_MAY as readonly string[]).includes(ghi[0]), `LA-AC-5 bên ghi lệch bên lọc: ${ghi[0]}`)
}

test("LA-AC-5 tên dấu bên ghi (agent) nằm trong danh sách lọc (app)", () => kiemKhop(readFileSync(RUN_TS, "utf8")))
test("LA-AC-5 chiều đỏ: bên ghi đổi tên dấu → bên ghi lệch bên lọc", async () => {
  const src = readFileSync(RUN_TS, "utf8")
  // Đổi đúng chuỗi trong câu INSERT INTO ops_audit (chuỗi 'enrich:thu' còn ở câu bốc tin selectOffers — không đụng).
  const dot = src.replace(/(INSERT INTO ops_audit[^`]*?)'enrich:thu'/, "$1'enrich:da-thu'")
  assert.notEqual(dot, src, "đột biến không áp được vào câu INSERT INTO ops_audit")
  await assert.rejects(kiemKhop(dot), /LA-AC-5 bên ghi lệch bên lọc: enrich:da-thu/)
})
