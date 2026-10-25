// coverage-cloud-got-tang-a.test.tsx — AU12 (ADR-0014): GET /api/v1/ops/coverage trên máy chủ đọc khối `freshness` máy thu
// đẩy lên, có cờ tươi / cũ / không số, không trường nào chứa tên nguồn thật. Lược đồ «như máy chủ» chỉ có ops_heartbeat;
// bản tin do push-ops-facts THẬT dựng (pipeline/scripts/capture-ops-facts.mjs) rồi đi qua handler POST
// /api/v1/ops/ingest THẬT; route GET THẬT được gọi bằng Request mang header token. Chế độ máy chủ / máy thu suy từ lược đồ
// (freshnessLocalOnly), không giả lập. Tên ca mở đầu bằng mã AC.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { AsyncLocalStorage } from "node:async_hooks"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { findSourceNames } from "../../pipeline/lib/mask-source-names.mjs"

const S_CLOUD = `au12_cloud_${process.pid}`
const S_LOCAL = `au12_local_${process.pid}`
const S_ERR = `au12_err_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "au12-thu"
// Next tạo kho request bằng globalThis.AsyncLocalStorage lúc nạp mô-đun — đặt TRƯỚC mọi import động (runtime Next tự đặt).
Object.assign(globalThis, { AsyncLocalStorage })
const RAW_LOCAL = ["source_registry", "review_queue", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "airdna_listings", "listings", "stg_abnb_listings", "sale_offers"]

type Block = Record<string, unknown> & { measured_at: string; error?: string; rows?: unknown }
type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Block> }
type Body = { generatedAt: string; source: string; state: string; measuredAt: string | null; rows: Record<string, unknown>[] | null; note?: string }
type Entry = { code: string; realName: string }

const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
let NAMES: Entry[] = []
before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S_CLOUD}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S_CLOUD}"`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
    await makeOpsSchema(admin, S_LOCAL)
    // Khối freshness lỗi ở bên ghi THẬT: thiếu bảng nạp mà độ tươi đọc (cùng cách ca ON22-AC-7).
    await makeOpsSchema(admin, S_ERR, { omit: ["stg_chotot_ads"] })
    // Danh sách tên của bộ dò = real_name của registry local + registry mà bên ghi đọc khi dựng bản tin.
    const seen = new Map<string, Entry>()
    for (const s of ["public", S_LOCAL]) {
      const { rows } = await admin.query(`SELECT code, real_name FROM "${s}".source_registry WHERE real_name IS NOT NULL`)
      for (const r of rows) seen.set(`${r.code}|${r.real_name}`, { code: r.code, realName: r.real_name })
    }
    NAMES = [...seen.values()]
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  for (const s of [S_CLOUD, S_LOCAL, S_ERR]) await dropOpsSchema(admin, s).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---- bên ghi thật → handler ingest thật ----
async function push(schema = S_LOCAL): Promise<Payload> {
  const r = (await captureOpsFacts({ env: { DATABASE_URL: schemaUrl(schema) } })) as { code: number; stderr: string; payload: Payload }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  return r.payload
}
const ingest = async (payload: Payload) => {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer au12-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}
const clear = () => admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)
const shift = (iso: string, min: number) => new Date(Date.parse(iso) + min * 60_000).toISOString()
const withBlock = (p: Payload, fn: (b: Block) => void): Payload => {
  const q = structuredClone(p)
  fn(q.blocks.freshness)
  return q
}

// ---- gọi route thật ----
// Không token thì route đọc phiên qua cookies() của Next — hàm này ném ngoài phạm vi request. Chạy trong một kho request
// tối thiểu (forceStatic → hũ cookie rỗng), đúng như một request thật không có cookie phiên.
async function inRequestScope<T>(fn: () => Promise<T>): Promise<T> {
  const { workAsyncStorage } = await import("next/dist/server/app-render/work-async-storage.external.js")
  return workAsyncStorage.run({ route: "/api/v1/ops/coverage", forceStatic: true } as never, fn)
}
async function call(routeFile = "../src/app/api/v1/ops/coverage/route", auth: string | null = "Bearer au12-thu"): Promise<{ status: number; body: Body }> {
  const { GET } = await import(routeFile)
  const req = () => GET(new Request("http://x/api/v1/ops/coverage", { headers: auth ? { authorization: auth } : {} }))
  const res: Response = auth === "Bearer au12-thu" ? await req() : await inRequestScope(req)
  return { status: res.status, body: (await res.json()) as Body }
}
/** Chế độ thật của lược đồ đang nối (in ra theo hợp đồng E1/E6). */
async function mode(): Promise<string> {
  const { freshnessLocalOnly } = await import("../src/lib/ops-queries")
  return (await freshnessLocalOnly()) ? "máy chủ" : "máy thu"
}
/** Quét MỌI khoá và giá trị chuỗi của JSON bằng bộ dò tầng A: ["<đường> <mã>"]. */
function leaks(v: unknown, entries: Entry[], p = ""): string[] {
  if (typeof v === "string") return findSourceNames(v, entries).map((h: { code: string }) => `${p} ${h.code}`)
  if (Array.isArray(v)) return v.flatMap((x, i) => leaks(x, entries, `${p}[${i}]`))
  if (v && typeof v === "object")
    return Object.entries(v).flatMap(([k, x]) => [
      ...findSourceNames(k, entries).map((h: { code: string }) => `${p}.<khoá ${k}> ${h.code}`),
      ...leaks(x, entries, p ? `${p}.${k}` : k),
    ])
  return []
}
const pairs = (rows: Record<string, unknown>[]) => rows.map((r) => `${r.code}|${r.city}|${r.status}`).sort()

// ---- đột biến cho chiều đỏ: bản sao route cạnh bản thật (tệp ẩn, tên riêng mỗi lần — ESM giữ module theo đường dẫn) ----
let mutantSeq = 0
function mutantRoute(fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", "src/app/api/v1/ops/coverage/route.ts")
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, "khuôn đột biến route không khớp mã nguồn")
  const dst = p.replace(/route\.ts$/, `.au12-mut-${process.pid}-${++mutantSeq}-route.ts`)
  writeFileSync(dst, out)
  return { path: dst.replace(/\.ts$/, ""), done: () => rmSync(dst, { force: true }) }
}
async function withMutant<T>(fn: (s: string) => string, run: (path: string) => Promise<T>): Promise<T> {
  const m = mutantRoute(fn)
  try {
    return await run(m.path)
  } finally {
    m.done()
  }
}

describe("AU12-AC-1 máy chủ có số tươi", () => {
  test("AU12-AC-1 bản tin push-ops-facts THẬT qua ingest thật, GET route THẬT bằng token: 200, source facts, state fresh, measuredAt = measured_at khối freshness, rows = toCoverageRows(khối.rows) cùng tập (mã, thành phố) và trạng thái, không rỗng", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const m = await mode()
    console.log(`# AU12-AC-1 chế độ suy từ lược đồ: ${m}`)
    assert.equal(m, "máy chủ")
    const { toCoverageRows } = await import("../src/lib/ops-queries")
    const want = toCoverageRows(p.blocks.freshness.rows as never)
    assert.ok(want.length > 0, "đối chứng: khối freshness của bên ghi có hàng")
    const { status, body } = await call()
    assert.equal(status, 200)
    assert.deepEqual([body.source, body.state, body.measuredAt], ["facts", "fresh", p.blocks.freshness.measured_at])
    assert.ok(body.rows && body.rows.length > 0, "rows không rỗng")
    assert.deepEqual(pairs(body.rows), pairs(want as never), "cùng tập (mã, thành phố, trạng thái) như bên ghi đo")
    assert.deepEqual(body.rows, JSON.parse(JSON.stringify(want)), "đúng toCoverageRows của khối")
  })
  test("AU12-AC-1 bản sao route trả getCoverageOverview như cũ → bắt (rows rỗng)", async () => {
    ready()
    await ingest(await push())
    const got = await withMutant((s) => s.replace("if (!(await freshnessLocalOnly())) {", "if (true) {"), (path) => call(path))
    assert.deepEqual(got.body.rows, [], "bản sao trả danh sách rỗng như cũ")
    assert.notEqual(got.body.state, "fresh", "phép đo phải bắt")
  })
  test("AU12-AC-1 bản sao lấy measuredAt của cả bản tin thay vì khối → bắt", async () => {
    ready()
    const p = withBlock(await push(), (b) => (b.measured_at = shift(b.measured_at, -5)))
    await ingest(p)
    const real = await call()
    assert.equal(real.body.measuredAt, p.blocks.freshness.measured_at, "đối chứng: bản thật lấy mốc của khối")
    const got = await withMutant((s) => s.replace("measuredAt: b.measuredAt,", "measuredAt: facts.measuredAt,"), (path) => call(path))
    assert.notEqual(got.body.measuredAt, p.blocks.freshness.measured_at, "phép đo phải bắt mốc sai")
  })
})

describe("AU12-AC-2 không tên nguồn thật", () => {
  test("AU12-AC-2 phản hồi tươi / cũ / không số: 0 khoá hay giá trị chuỗi chứa tên nguồn thật (real_name của source_registry local + registry bên ghi đã đọc; in số tên ≥ 1)", async () => {
    ready()
    console.log(`# AU12-AC-2 số tên nguồn thật quét: ${NAMES.length}`)
    assert.ok(NAMES.length >= 1, "phải có ít nhất một tên thật để quét")
    const p = await push()
    const bodies: Body[] = []
    await ingest(p)
    bodies.push((await call()).body)
    await ingest(withBlock(p, (b) => (b.measured_at = shift(b.measured_at, -46))))
    bodies.push((await call()).body)
    await clear()
    bodies.push((await call()).body)
    assert.deepEqual(bodies.map((b) => b.state), ["fresh", "stale", "none"], "đủ ba trạng thái")
    for (const b of bodies) assert.deepEqual(leaks(b, NAMES), [], `phản hồi ${b.state} không chứa tên thật`)
  })
  test("AU12-AC-2 cấy lần lượt từng tên vào bản sao phản hồi → bộ dò trúng đúng chỗ mỗi lần", async () => {
    ready()
    await ingest(await push())
    const { body } = await call()
    for (const n of NAMES) {
      const q = structuredClone(body) as Body & { rows: Record<string, unknown>[] }
      q.rows[0].city = `thu ${n.realName} x`
      assert.ok(leaks(q, NAMES).some((h) => h.startsWith("rows[0].city ")), `bộ dò phải trúng tên của ${n.code} ở rows[0].city`)
      const k = structuredClone(body) as Record<string, unknown>
      k[n.realName] = 1
      assert.ok(leaks(k, NAMES).some((h) => h.includes("<khoá")), `bộ dò phải trúng tên của ${n.code} ở khoá`)
    }
  })
  test("AU12-AC-2 bản sao route chép nguyên bản tin vào phản hồi → bắt (có trường ngoài CoverageRow)", async () => {
    ready()
    await ingest(await push())
    const { body: real } = await call()
    const allowed = ["generatedAt", "source", "state", "measuredAt", "rows", "note"]
    assert.deepEqual(Object.keys(real).filter((k) => !allowed.includes(k)), [], "đối chứng: bản thật chỉ mang khoá cho phép")
    const got = await withMutant((s) => s.replace('const body: CoverageBody = { generatedAt, source: "facts", ...cloud };', 'const body = { generatedAt, source: "facts", ...cloud, facts: (await readOpsFacts()).facts } as CoverageBody;'), (path) => call(path))
    assert.ok(Object.keys(got.body).some((k) => !allowed.includes(k)), "phép đo phải bắt trường ngoài CoverageRow")
  })
})

describe("AU12-AC-3 số cũ", () => {
  test("AU12-AC-3 khối freshness lùi 46′: 200, state stale, measuredAt là mốc cũ, rows vẫn có số", async () => {
    ready()
    const p = withBlock(await push(), (b) => (b.measured_at = shift(b.measured_at, -46)))
    await ingest(p)
    const { status, body } = await call()
    assert.equal(status, 200)
    assert.deepEqual([body.state, body.measuredAt], ["stale", p.blocks.freshness.measured_at])
    assert.ok(body.rows && body.rows.length > 0, "số cũ vẫn trả")
  })
  test("AU12-AC-3 bản sao bỏ qua trạng thái khối → bắt (state fresh)", async () => {
    ready()
    await ingest(withBlock(await push(), (b) => (b.measured_at = shift(b.measured_at, -46))))
    const got = await withMutant((s) => s.replace("return { state: b.state, measuredAt", 'return { state: "fresh" as const, measuredAt'), (path) => call(path))
    assert.equal(got.body.state, "fresh", "bản sao báo tươi — phép đo phải bắt")
  })
})

describe("AU12-AC-4 máy chủ không có số", () => {
  const isNone = (body: Body, ca: string) =>
    assert.deepEqual([body.state, body.rows, body.measuredAt, body.note], ["none", null, null, "Chỉ đo ở máy thu"], `${ca}: state none, rows null`)
  test("AU12-AC-4 không bản tin: 200, state none, rows null, measuredAt null, note «Chỉ đo ở máy thu»", async () => {
    ready()
    await clear()
    const { status, body } = await call()
    assert.equal(status, 200)
    isNone(body, "không bản tin")
  })
  test("AU12-AC-4 khối freshness lỗi ở bên ghi thật: như không bản tin", async () => {
    ready()
    const p = await push(S_ERR)
    assert.match(String(p.blocks.freshness.error), /không đo được/, "bên ghi thật phải báo lỗi khối freshness")
    await ingest(p)
    const { status, body } = await call()
    assert.equal(status, 200)
    isNone(body, "khối lỗi")
  })
  test("AU12-AC-4 bản tin thật gỡ khối freshness: như không bản tin", async () => {
    ready()
    const p = structuredClone(await push())
    delete (p.blocks as Record<string, unknown>).freshness
    await ingest(p)
    const { status, body } = await call()
    assert.equal(status, 200)
    isNone(body, "khối vắng")
  })
  test("AU12-AC-4 khối sai khuôn (rows không phải mảng / hàng thiếu code): 200, như không bản tin, không 500", async () => {
    ready()
    const p = await push()
    for (const [ca, fn] of [
      ["rows không phải mảng", (b: Block) => (b.rows = { x: 1 })],
      ["hàng thiếu code", (b: Block) => (b.rows = (b.rows as Record<string, unknown>[]).map(({ code: _c, ...r }) => r))],
    ] as const) {
      await ingest(withBlock(p, fn))
      const { status, body } = await call()
      assert.equal(status, 200, `${ca}: không 500`)
      isNone(body, ca)
    }
  })
  test("AU12-AC-4 khối tươi mà rows rỗng thật: state fresh, rows []", async () => {
    ready()
    await ingest(withBlock(await push(), (b) => (b.rows = [])))
    const { body } = await call()
    assert.deepEqual([body.state, body.rows], ["fresh", []])
  })
  test("AU12-AC-4 bản sao trả rows [] khi không có số → bắt", async () => {
    ready()
    await clear()
    const got = await withMutant((s) => s.replace('const none = { state: "none" as const, measuredAt: null, rows: null };', 'const none = { state: "none" as const, measuredAt: null, rows: [] as CoverageRow[] };'), (path) => call(path))
    assert.deepEqual(got.body.rows, [], "bản sao trả [] — phép đo phải bắt")
  })
  test("AU12-AC-4 bản sao không kiểm khuôn → bắt (500 hoặc rows sai)", async () => {
    ready()
    await ingest(withBlock(await push(), (b) => (b.rows = { x: 1 })))
    const got = await withMutant(
      (s) => s.replace("  if (!Array.isArray(rows) || !rows.every((r) => typeof (r as { code?: unknown })?.code === \"string\")) return none;\n  try {\n    return", "  {\n    return").replace("  } catch {\n    return none;\n  }\n}", "  }\n}"),
      (path) => call(path).catch((e: Error) => ({ status: 500, body: { error: e.message } as unknown as Body })),
    )
    assert.ok(got.status === 500 || got.body.state !== "none", `bản sao phải lộ lỗi khuôn (status ${got.status}, state ${got.body.state})`)
  })
})

describe("AU12-AC-5 truy cập", () => {
  test("AU12-AC-5 không token, không phiên: 401, thân không có rows", async () => {
    ready()
    const { status, body } = await call(undefined, null)
    assert.equal(status, 401)
    assert.equal((body as unknown as Record<string, unknown>).rows, undefined)
  })
  test("AU12-AC-5 token sai: 401", async () => {
    ready()
    assert.equal((await call(undefined, "Bearer sai")).status, 401)
  })
  test("AU12-AC-5 token đúng: 200", async () => {
    ready()
    assert.equal((await call()).status, 200)
  })
})

describe("AU12-AC-6 máy thu", () => {
  async function spyHeartbeat<T>(run: () => Promise<T>) {
    const { pool } = await import("../src/lib/db")
    const seen: string[] = []
    const orig = pool.query.bind(pool)
    ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
      seen.push(String(typeof sql === "string" ? sql : (sql as { text?: string })?.text ?? ""))
      return (orig as (...a: unknown[]) => unknown)(sql, ...rest)
    }
    try {
      return { r: await run(), n: seen.filter((q) => q.includes("ops_heartbeat")).length }
    } finally {
      ;(pool as unknown as { query: unknown }).query = orig
    }
  }
  test("AU12-AC-6 bộ bắt truy vấn thấy ops_heartbeat ở chế độ máy chủ (đối chứng dương)", async () => {
    ready()
    await ingest(await push())
    const { n } = await spyHeartbeat(() => call())
    assert.ok(n > 0, "bộ bắt phải thấy truy vấn ops_heartbeat")
  })
  test("AU12-AC-6 DB máy thu đủ bảng: source local, state live, rows = getCoverageOverview, 0 truy vấn ops_heartbeat", async () => {
    ready()
    await admin.query(`CREATE TABLE "${S_CLOUD}".source_registry AS SELECT * FROM public.source_registry`)
    for (const t of RAW_LOCAL.filter((x) => x !== "source_registry")) await admin.query(`CREATE TABLE IF NOT EXISTS "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    try {
      const m = await mode()
      console.log(`# AU12-AC-6 chế độ suy từ lược đồ: ${m}`)
      assert.equal(m, "máy thu")
      const { r, n } = await spyHeartbeat(() => call())
      const { getCoverageOverview } = await import("../src/lib/ops-queries")
      assert.deepEqual([r.body.source, r.body.state], ["local", "live"])
      assert.deepEqual(r.body.rows, JSON.parse(JSON.stringify(await getCoverageOverview())))
      assert.equal(n, 0, "máy thu không đọc ops_heartbeat")
    } finally {
      for (const t of RAW_LOCAL) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
})
