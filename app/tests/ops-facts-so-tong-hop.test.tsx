// ops-facts-so-tong-hop.test.tsx — ON22 `ops-facts-so-tong-hop` (ADR-0014), phía app: bên ghi THẬT (push-ops-facts qua
// capture-ops-facts) đối chiếu với hàm app trên CÙNG lược đồ tạm / cây log — AC-3 bản ghi 24h ↔ getSourceFeedHealth,
// AC-5 lockdown ↔ getLockdownStatus — và AC-9 vòng trọn: bản tin thật → handler POST /api/v1/ops/ingest thật →
// ops_heartbeat → readOpsFacts. Tên ca mở đầu bằng mã AC.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import pg from "pg"

import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { runCheck } from "../../scripts/check-freshness.mjs"

const S = `on22_app_${process.pid}`
const S_ERR = `on22_app_err_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "on22-thu"

type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await makeOpsSchema(admin, S)
    await makeOpsSchema(admin, S_ERR, { omit: ["review_queue"] })
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await dropOpsSchema(admin, S).catch(() => {})
  await dropOpsSchema(admin, S_ERR).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)
const push = (opts: Record<string, unknown> = {}, schema = S) =>
  captureOpsFacts({ ...opts, env: { DATABASE_URL: schemaUrl(schema), ...((opts.env as object) ?? {}) } }) as Promise<{
    code: number
    stderr: string
    payload: Payload
  }>

describe("ON22-AC-3 bản ghi 24h một định nghĩa", () => {
  const diff = async (payload: Payload) => {
    const { getSourceFeedHealth } = await import("../src/lib/ops-queries")
    const want = (await getSourceFeedHealth()).map((f) => ({ code: f.code, n: f.items24h }))
    assert.ok(want.some((w) => w.n > 0), "lược đồ tạm phải có snapshot trong 24 giờ")
    const got = payload.blocks.records24h.bySource as { code: string; n: number }[]
    return want.filter((w) => got.find((g) => g.code === w.code)?.n !== w.n).map((w) => w.code)
  }
  test("ON22-AC-3 khối records24h bằng items24h của getSourceFeedHealth trên cùng lược đồ", async () => {
    ready()
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    assert.deepEqual(await diff(r.payload), [])
  })
  test("ON22-AC-3 bản sao đếm cả ngoài 24 giờ → bắt", async () => {
    ready()
    // S01 có một snapshot 30 giờ trước — đếm cả nó là lệch định nghĩa
    const f = mutantPush("ngoai-24h.mjs", (s: string) =>
      s.replace("bySource: await readRecords24h(client)", 'bySource: (await readRecords24h(client)).map((x) => (x.code === "S01" ? { ...x, n: x.n + 1 } : x))'))
    assert.deepEqual(await diff((await push({ script: f })).payload), ["S01"])
  })
})

describe("ON22-AC-5 lockdown một định nghĩa", () => {
  const NOW = new Date()
  const p2 = (n: number) => String(n).padStart(2, "0")
  const DAY = `${NOW.getFullYear()}-${p2(NOW.getMonth() + 1)}-${p2(NOW.getDate())}`
  // đúng khuôn log watchdog thật: «2026-10-24T18:31:17+07:00 ok — …» (25 ký tự đầu là mốc giờ VN)
  const ago = (min: number) => new Date(NOW.getTime() - min * 60_000 + 7 * 3_600_000).toISOString().slice(0, 19) + "+07:00"
  // ma trận viết trước: [tên, log watchdog | null, log gateway trong ngày | null, đáp án L4, đáp án L4b]
  const MATRIX: [string, string | null, string | null, boolean, boolean | null][] = [
    ["wd ok mới", `${ago(5)} ok — 7 lớp\n`, null, true, null],
    ["wd ok cũ quá 15′", `${ago(20)} ok — 7 lớp\n`, null, false, null],
    ["wd báo sự cố mới", `${ago(10)} ok — 7 lớp\n${ago(2)} ALERT bindings khác rỗng\n`, null, false, null],
    ["không có log wd", null, null, false, null],
    ["gateway 0 lượt agent", `${ago(5)} ok — 7 lớp\n`, "dòng khởi động\n", true, true],
    ["gateway có lượt agent", `${ago(5)} ok — 7 lớp\n`, "x auto-reply/agent-turn-timing 1\ny auto-reply/agent-turn-timing 2\n", true, false],
    ["không có log gateway", `${ago(5)} ok — 7 lớp\n`, null, true, null],
  ]
  const appSide = async (wd: string | null, gw: string | null) => {
    const root = mkdtempSync(join(tmpdir(), "on22-ld-"))
    const agentLogDir = join(root, "gw")
    mkdirSync(join(root, "pipeline/logs"), { recursive: true })
    mkdirSync(agentLogDir)
    if (wd !== null) writeFileSync(join(root, "pipeline/logs/zalo-watchdog.log"), wd)
    if (gw !== null) writeFileSync(join(agentLogDir, `openclaw-${DAY}.log`), gw)
    const { getLockdownStatus } = await import("../src/lib/ops-queries")
    try {
      return await getLockdownStatus({ root, agentLogDir, now: NOW })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }
  const writerSide = (wd: string | null, gw: string | null, script?: string) =>
    push({
      ...(script ? { script } : {}),
      logs: wd === null ? {} : { "zalo-watchdog.log": wd },
      agentLogs: gw === null ? {} : { [`openclaw-${DAY}.log`]: gw },
      env: { OPS_FACTS_NOW: NOW.toISOString() },
    })
  type Layer = { layer: string; desc: string; ok: boolean | null }
  const layerDiff = (got: Layer[], want: Layer[]) =>
    want.filter((w, i) => got[i]?.ok !== w.ok || got[i]?.layer !== w.layer).map((w) => w.layer)

  test("ON22-AC-5 ma trận cây log: khối lockdown bằng getLockdownStatus từng lớp", async () => {
    ready()
    for (const [label, wd, gw] of MATRIX) {
      const app = await appSide(wd, gw)
      const r = await writerSide(wd, gw)
      const b = r.payload.blocks.lockdown as { layers: Layer[]; lastWatchdogAt: string | null; agentTurnsToday: number | null }
      assert.deepEqual(layerDiff(b.layers, app.layers), [], `${label}: lớp lệch`)
      assert.equal(b.lastWatchdogAt, app.lastWatchdogAt, `${label}: lastWatchdogAt`)
      assert.equal(b.agentTurnsToday, app.agentTurnsToday, `${label}: agentTurnsToday`)
    }
  })
  test("ON22-AC-5 lớp không kiểm được là null, lớp thấy sự cố là false", async () => {
    ready()
    for (const [label, wd, gw, l4, l4b] of MATRIX) {
      const layers = ((await writerSide(wd, gw)).payload.blocks.lockdown as { layers: Layer[] }).layers
      const by = (n: string) => layers.find((l) => l.layer === n)!.ok
      assert.equal(by("L4"), l4, `${label}: L4`)
      assert.equal(by("L4b"), l4b, `${label}: L4b`)
      if (!l4) for (const n of ["L1", "L2", "L3"]) assert.equal(by(n), null, `${label}: ${n} không kiểm được phải là null, không true`)
    }
  })
  // bản sao bên ghi: đổi `ok` từng lớp của khối lockdown trước khi đóng gói bản tin
  const mutLockdown = (map: string) =>
    mutantPush("ld-mut.mjs", (s: string) =>
      s.replace("const [lockdownBlock, jobsBlock] = await Promise.all([", "const [_ld, jobsBlock] = await Promise.all([").replace(
        "  // Đọc danh sách tài khoản zalo",
        `  const lockdownBlock = { ..._ld, layers: _ld.layers?.map((l) => ({ ...l, ok: ${map} })) };\n  // Đọc danh sách tài khoản zalo`,
      ))
  test("ON22-AC-5 bản sao biến false thành null → bắt, nêu tên lớp", async () => {
    ready()
    const [, wd, gw] = MATRIX[2]
    const app = await appSide(wd, gw)
    const r = await writerSide(wd, gw, mutLockdown("l.ok === false ? null : l.ok"))
    assert.ok(layerDiff((r.payload.blocks.lockdown as { layers: Layer[] }).layers, app.layers).includes("L4"))
  })
  test("ON22-AC-5 bản sao mặc định ok=true khi thiếu log → bắt", async () => {
    ready()
    const [, wd, gw] = MATRIX[3]
    const app = await appSide(wd, gw)
    const r = await writerSide(wd, gw, mutLockdown("l.ok === null ? true : l.ok"))
    assert.ok(layerDiff((r.payload.blocks.lockdown as { layers: Layer[] }).layers, app.layers).includes("L1"))
  })
})

describe("ON22-AC-9 đọc trên cloud qua route ingest thật", () => {
  const ingest = async (payload: Payload) => {
    const { POST } = await import("../src/app/api/v1/ops/ingest/route")
    const res = await POST(new Request("http://x/api/v1/ops/ingest", {
      method: "POST",
      headers: { authorization: "Bearer on22-thu", "content-type": "application/json" },
      body: JSON.stringify(payload),
    }))
    assert.equal(res.status, 200, `ingest trả ${res.status}`)
  }
  const at = (iso: string, min: number) => new Date(Date.parse(iso) + min * 60_000)
  const blockStates = (o: { blocks: Record<string, { state: string }> }) =>
    Object.fromEntries(Object.entries(o.blocks).map(([k, v]) => [k, v.state]))

  test("ON22-AC-9 bản tin thật qua handler ingest thật → readOpsFacts: none · 44′ fresh · 46′ stale · khối cũ · khối lỗi", async () => {
    ready()
    const { readOpsFacts } = await import("../src/lib/ops-facts")
    await admin.query(`DELETE FROM "${S}".ops_heartbeat`)
    const none = await readOpsFacts()
    assert.deepEqual([none.state, none.facts, none.measuredAt], ["none", null, null])

    const now = new Date()
    const r = await push({ env: { OPS_FACTS_NOW: now.toISOString() } })
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    await ingest(r.payload)
    const fresh = await readOpsFacts({ now: at(r.payload.pushedAt, 44) })
    assert.equal(fresh.state, "fresh")
    // ON5 (luong-7-ngay-dung-so) thêm khối thứ sáu `luong7`; ON4 (nhom-s03-tren-cloud) thêm khối thứ bảy `s03` — HOME tạm
    // của phép đo này không có cấu hình OpenClaw nên khối ấy báo lỗi (không 0, không danh sách rỗng).
    assert.deepEqual(blockStates(fresh), { freshness: "fresh", jobs: "fresh", lockdown: "fresh", records24h: "fresh", reviewQueue: "fresh", luong7: "fresh", s03: "error" })
    for (const [k, v] of Object.entries(fresh.blocks)) assert.equal(v!.measuredAt, r.payload.blocks[k].measured_at, `${k}: measuredAt khác bên ghi`)
    const c = new pg.Client({ connectionString: schemaUrl(S) })
    await c.connect()
    const want = JSON.parse((await runCheck(c, { now, json: true })).stdout[0])
    await c.end()
    assert.deepEqual(fresh.blocks.freshness!.data!.rows, want, "độ tươi trên cloud phải bằng check-freshness ở local")

    const stale = await readOpsFacts({ now: at(r.payload.pushedAt, 46) })
    assert.deepEqual([stale.state, stale.measuredAt], ["stale", r.payload.pushedAt])

    const old = structuredClone(r.payload)
    old.blocks.jobs.measured_at = at(old.pushedAt, -40).toISOString()
    await ingest(old)
    const mixed = await readOpsFacts({ now: at(old.pushedAt, 10) })
    assert.equal(mixed.state, "fresh")
    assert.equal(mixed.blocks.jobs!.state, "stale", "khối đo 50′ trước trong bản tin 10′ phải cũ")
    assert.equal(mixed.blocks.freshness!.state, "fresh")

    const e = await push({}, S_ERR)
    await ingest(e.payload)
    const err = await readOpsFacts({ now: at(e.payload.pushedAt, 1) })
    assert.equal(err.blocks.reviewQueue!.state, "error")
    assert.match(err.blocks.reviewQueue!.error ?? "", /^không đo được/)
  })

  test("ON22-AC-9 hằng 45′ khai một chỗ", () => {
    const hits: string[] = []
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(ts|tsx)$/.test(n) && /45\s*\*\s*60_?000|2_?700_?000/.test(readFileSync(p, "utf8"))) hits.push(p.split("/src/")[1])
      }
    }
    walk(join(import.meta.dirname, "../src"))
    assert.deepEqual(hits, ["lib/ops-facts.ts"])
  })

  test("ON22-AC-9 bản sao bên ghi đổi tên measured_at → đọc trên cloud đỏ", async () => {
    ready()
    const { readOpsFacts } = await import("../src/lib/ops-facts")
    const f = mutantPush("doi-ten-moc.mjs", (s: string) =>
      s.replace("return { measured_at: new Date().toISOString(), ...data };", "return { measuredAt: new Date().toISOString(), ...data };"))
    const r = await push({ script: f })
    await ingest(r.payload)
    const got = await readOpsFacts({ now: at(r.payload.pushedAt, 1) })
    assert.notEqual(got.blocks.freshness!.state, "fresh", "khoá mốc đo lệch tên thì bên đọc không được báo tươi")
  })

  test("ON22-AC-9 bản sao ngưỡng 60′ → ca 46′ bắt", async () => {
    ready()
    const dir = join(import.meta.dirname, "../src/lib")
    const src = readFileSync(join(dir, "ops-facts.ts"), "utf8")
    assert.ok(src.includes("export const FACTS_STALE_MS = 45 * 60_000"), "khuôn đột biến không khớp ops-facts.ts")
    const file = `.on22-mut-${process.pid}.ts`
    writeFileSync(join(dir, file), src.replace("export const FACTS_STALE_MS = 45 * 60_000", "export const FACTS_STALE_MS = 60 * 60_000"))
    try {
      const { readOpsFacts } = await import(join(dir, file))
      const row = await admin.query(`SELECT payload->>'pushedAt' AS p FROM "${S}".ops_heartbeat WHERE id = 'primary'`)
      const got = await readOpsFacts({ now: at(row.rows[0].p, 46) })
      assert.throws(() => assert.equal(got.state, "stale"), /stale/, "thước 46′ phải bắt bản sao ngưỡng 60′")
    } finally {
      rmSync(join(dir, file), { force: true })
    }
  })
})
