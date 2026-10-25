// lockdown-cloud-theo-facts.test.tsx — ON23 (ADR-0014): ô và lưới Khoá an toàn trên máy chủ đọc khối `lockdown` máy thu đẩy
// lên; Kev gate / collector API ở Máy móc cùng trạng thái với khối ấy. Lược đồ «như máy chủ» chỉ có ops_heartbeat; bản tin do
// push-ops-facts THẬT dựng (pipeline/scripts/capture-ops-facts.mjs) rồi đi qua handler POST /api/v1/ops/ingest THẬT; trang
// /ops/collections THẬT dựng ở chế độ máy chủ (VERCEL=1). Cổng Kev / collector dò cổng thật của máy chạy test nên giá trị
// `ok` của các lớp được ĐẶT trên bản tin thật (chỉ đổi `ok`, giữ lớp + mô tả của bên ghi). Tên ca mở đầu bằng mã AC.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S_CLOUD = `on23_cloud_${process.pid}`
const S_LOCAL = `on23_local_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "on23-thu"
const RAW_LOCAL = ["source_registry", "review_queue", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "airdna_listings", "listings", "stg_abnb_listings", "sale_offers"]

type Layer = { layer: string; desc: string; ok: boolean | null }
type Payload = Record<string, unknown> & {
  pushedAt: string
  jobs: { id: string; alive: string }[]
  blocks: Record<string, Record<string, unknown> & { measured_at: string; layers?: Layer[]; agentTurnsToday?: number | null }>
}
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S_CLOUD}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S_CLOUD}"`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
    await makeOpsSchema(admin, S_LOCAL)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  for (const s of [S_CLOUD, S_LOCAL]) await dropOpsSchema(admin, s).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---- bên ghi thật → handler ingest thật ----
const p2 = (n: number) => String(n).padStart(2, "0")
/** Nhật ký máy tự trả lời hôm nay (tên tệp theo ngày giờ máy, như gateway) với `n` dấu agent-turn. */
const agentLog = (n: number) => {
  const d = new Date()
  return { [`openclaw-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}.log`]: Array.from({ length: n }, () => "x auto-reply/agent-turn-timing 12ms").join("\n") + "\n" }
}
/** Dòng watchdog `ok` 2 phút trước, dạng `YYYY-MM-DDTHH:MM:SS+07:00` như zalo-watchdog.sh. */
const watchdogOk = () => {
  const t = new Date(Date.now() - 2 * 60_000 + 7 * 3600_000).toISOString().slice(0, 19)
  return { "zalo-watchdog.log": `${t}+07:00 ok — 7 lớp\n` }
}
async function push(script?: string): Promise<Payload> {
  const r = (await captureOpsFacts({
    ...(script ? { script } : {}),
    env: { DATABASE_URL: schemaUrl(S_LOCAL) },
    logs: watchdogOk(),
    agentLogs: agentLog(2),
  })) as { code: number; stderr: string; payload: Payload }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  return r.payload
}
const ingest = async (payload: Payload) => {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer on23-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}
const clear = () => admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)
/** Đặt `ok` của tám lớp trên bản tin thật (giữ lớp + mô tả của bên ghi). */
function withOks(p: Payload, oks: (boolean | null)[]): Payload {
  const q = structuredClone(p)
  const layers = q.blocks.lockdown.layers as Layer[]
  assert.equal(layers.length, oks.length, "bên ghi phải đẩy đủ 8 lớp")
  q.blocks.lockdown.layers = layers.map((l, i) => ({ ...l, ok: oks[i] }))
  return q
}
const shift = (iso: string, min: number) => new Date(Date.parse(iso) + min * 60_000).toISOString()

// ---- dựng trang thật ----
async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
async function renderCollections(pageFile = "../src/app/ops/collections/page", { cloud = true } = {}) {
  const prev = process.env.VERCEL
  if (cloud) process.env.VERCEL = "1"
  else delete process.env.VERCEL
  const { resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
  try {
    return await html(await (await import(pageFile)).default())
  } finally {
    if (prev === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prev
    resetFactsCache()
  }
}

// ---- đọc HTML ----
const text = (h: string) => h.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
const successBadges = (h: string) => (h.match(/bg-success\/10/g) ?? []).length
const successTone = (h: string) => (h.match(/\bbg-success\b/g) ?? []).length
const kpiValue = (r: string) => r.match(/text-2xl[^>]*>([^<]*)</)?.[1]
function region(h: string, from: string, to: string) {
  const i = h.indexOf(from)
  assert.ok(i >= 0, `không thấy «${from}» trong trang`)
  const j = h.indexOf(to, i + from.length)
  assert.ok(j > i, `không thấy «${to}» sau «${from}»`)
  return h.slice(i, j)
}
/** Lưới Khoá an toàn: từ khung `#lockdown` tới Alert gom vùng của máy chủ. */
const grid = (h: string) => region(h, 'id="lockdown"', 'id="tren-may-thu"')
/** Ô Khoá an toàn: từ tiêu đề ô tới tiêu đề lưới sức khoẻ nguồn ngay dưới hàng ô. */
const tile = (h: string) => region(h, ">Khoá an toàn<", ">Sức khoẻ nguồn<")
/** Hàng lưới: [mã hàng, nhãn trạng thái, class của badge]. */
function rows(r: string) {
  return [...r.matchAll(/data-row-id="([^"]+)"([\s\S]*?)<\/tr>/g)].map((m) => {
    const b = m[2].match(/<span[^>]*data-slot="badge"[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/span>/) ?? m[2].match(/class="([^"]*)"[^>]*data-slot="badge"[^>]*>([\s\S]*?)<\/span>/)
    return [m[1], b ? text(b[2]).trim() : "", b ? b[1] : ""] as const
  })
}
const tabCount = (r: string, label: string) => Number(text(r.slice(0, r.indexOf("data-row-id"))).match(new RegExp(`${label} (\\d+)`))?.[1])
const jobRow = (h: string, id: string) => rows(h).find(([k]) => k === id)
/** Dải tab của lưới Máy móc: từ tiêu đề lưới tới hàng đầu tiên. */
const jobsTabs = (h: string) => region(h, ">Máy móc<", "data-row-id")
const PART = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const vnTime = (iso: string) => {
  const p = Object.fromEntries(PART.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} (GMT+7)`
}
const LABEL = (ok: boolean | null) => (ok === true ? "Ổn" : ok === false ? "Hỏng" : "Chưa kiểm được")
/** 8 cặp lớp + mô tả của getLockdownStatus — import động: pool của app đọc DATABASE_URL lúc import. */
const expectedIds = async () => (await import("../src/lib/ops-queries")).LOCKDOWN_LAYERS.map((l) => `${l.layer}|${l.desc}`)

// ---- đột biến cho chiều đỏ (khuôn ON3) ----
let mutantSeq = 0
function mutantApp(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  // tên riêng mỗi lần: ESM giữ module theo đường dẫn
  const dst = p.replace(/\/([^/]+)\.tsx?$/, `/.on23-mut-${process.pid}-${++mutantSeq}-$1.tsx`)
  writeFileSync(dst, out)
  return { path: dst.replace(/\.tsx$/, ""), done: () => rmSync(dst, { force: true }) }
}
function mutantChain(leaf: { rel: string; fn: (s: string) => string }, parents: { rel: string; spec: string }[]) {
  const made = [mutantApp(leaf.rel, leaf.fn)]
  for (const { rel, spec } of parents) {
    const child = made[made.length - 1].path
    made.push(mutantApp(rel, (s) => s.replace(`"${spec}"`, JSON.stringify(child))))
  }
  return { path: made[made.length - 1].path, done: () => made.forEach((m) => m.done()) }
}
const COL_PAGE = { rel: "src/app/ops/collections/page.tsx", spec: "@/components/ops/collections/collections-view" }
const COL_VIEW_GRID = { rel: "src/components/ops/collections/collections-view.tsx", spec: "@/components/ops/collections/lockdown-grid" }
const COL_VIEW_JOBS = { rel: "src/components/ops/collections/collections-view.tsx", spec: "@/components/ops/collections/jobs-grid" }
const PAGE_CLOUD = { rel: "src/app/ops/collections/page.tsx", spec: "@/lib/ops-cloud" }
/** Bên ghi: khối lockdown ném lỗi — bản tin mang `{measured_at, error}` cho khối ấy, không viết tay khối lỗi. */
const LOCKDOWN_THROWS = (s: string) => s.replace("measure(() => readLockdown(", 'measure(() => (() => { throw new Error("thử: không đọc được khoá an toàn") })() ?? readLockdown(')

/** Lưới 8 hàng «Chỉ kiểm ở máy thu» vàng, ô «—» — chung cho AC-1 và AC-2. */
async function assertMachineOnly(h: string, name: string) {
  const g = grid(h)
  const rs = rows(g)
  assert.deepEqual(rs.map(([id]) => id), await expectedIds(), `${name}: đúng 8 lớp theo thứ tự`)
  assert.deepEqual(rs.filter(([, label]) => label !== "Chỉ kiểm ở máy thu").map(([id]) => id), [], `${name}: mọi hàng «Chỉ kiểm ở máy thu»`)
  assert.deepEqual(rs.filter(([, , cls]) => !cls.includes("warning")).map(([id]) => id), [], `${name}: badge vàng (Hỏi-3 = A)`)
  assert.equal(successBadges(g) + successTone(g), 0, `${name}: lưới không màu đạt`)
  const t = tile(h)
  assert.equal(kpiValue(t), "—", `${name}: ô «—»`)
  assert.match(text(t), /Chưa kiểm được trên máy chủ/)
  assert.equal(successBadges(t) + successTone(t), 0, `${name}: ô không màu đạt`)
}

describe("ON23-AC-1 không bản tin", () => {
  test("ON23-AC-1 không bản tin: lưới khoá an toàn đúng 8 hàng = 8 cặp lớp + mô tả của getLockdownStatus, mỗi hàng «Chỉ kiểm ở máy thu», 0 badge success và 0 bg-success trong lưới + ô, ô «—» kèm «Chưa kiểm được trên máy chủ»", async () => {
    ready()
    await clear()
    await assertMachineOnly(await renderCollections(), "không bản tin")
  })
  test("ON23-AC-1 bản sao lưới mặc định lớp không khối thành «Ổn» → bắt", async () => {
    ready()
    await clear()
    const m = mutantChain(
      { rel: "src/components/ops/collections/collections-view.tsx", fn: (s) => s.replace("LOCKDOWN_LAYERS.map((l) => ({ ...l, ok: null }))", "LOCKDOWN_LAYERS.map((l) => ({ ...l, ok: true }))").replace("machineOnly={!lockdown}", "machineOnly={false}") },
      [COL_PAGE],
    )
    try {
      const g = grid(await renderCollections(m.path))
      assert.ok(successBadges(g) > 0, "phép đo phải thấy «Ổn» xanh ở lớp không có số")
    } finally {
      m.done()
    }
  })
})

describe("ON23-AC-2 khối lockdown lỗi ở bên ghi", () => {
  test("ON23-AC-2 khối lockdown lỗi ở bên ghi thật (push-ops-facts qua handler ingest thật): lưới 8/8 «Chỉ kiểm ở máy thu», ô «—», ô Bản ghi 24h vẫn = tổng khối records24h", async () => {
    ready()
    const p = await push(mutantPush("lockdown-loi.mjs", LOCKDOWN_THROWS))
    assert.match(String(p.blocks.lockdown.error ?? ""), /^không đo được/, "bên ghi phải ghi lỗi cho khối lockdown")
    await ingest(p)
    const h = await renderCollections()
    await assertMachineOnly(h, "khối lỗi")
    const want = (p.blocks.records24h.bySource as { n: number }[]).reduce((a, r) => a + r.n, 0)
    assert.equal(kpiValue(region(h, ">Bản ghi 24h<", ">Cổng S03")), String(want), "ô đọc khối khác vẫn có số")
  })
  test("ON23-AC-2 bản sao đọc khối lỗi như khối có số → bắt", async () => {
    ready()
    await ingest(await push(mutantPush("lockdown-loi.mjs", LOCKDOWN_THROWS)))
    const m = mutantChain({ rel: "src/components/ops/collections/collections-view.tsx", fn: (s) => s.replace("machineOnly={!lockdown}", "machineOnly={false}") }, [COL_PAGE])
    try {
      const rs = rows(grid(await renderCollections(m.path)))
      assert.ok(rs.some(([, label]) => label !== "Chỉ kiểm ở máy thu"), "phép đo phải thấy hàng không phải «Chỉ kiểm ở máy thu»")
    } finally {
      m.done()
    }
  })
})

// Ma trận 3 giá trị viết trước: L1…L4b, OpenClaw, Kev, collector
const MIXED: (boolean | null)[] = [true, null, true, true, false, null, true, false]

describe("ON23-AC-3 bản tin tươi", () => {
  test("ON23-AC-3 bản tin tươi có đủ true/false/null và 2 lượt tự trả lời: hàng lưới = hàng khối (lớp, mô tả, nhãn Ổn/Hỏng/Chưa kiểm được theo ok), mô tả lưới «Bộ canh chạy cuối» giờ VN của lastWatchdogAt, số trên tab = số lớp mỗi giá trị, ô = số lớp true / 8 kèm «2 lượt tự trả lời»", async () => {
    ready()
    const real = await push()
    assert.equal(real.blocks.lockdown.agentTurnsToday, 2, "tiền đề: bên ghi đếm đúng 2 lượt tự trả lời")
    const p = withOks(real, MIXED)
    await ingest(p)
    const h = await renderCollections()
    const g = grid(h)
    const layers = p.blocks.lockdown.layers as Layer[]
    assert.deepEqual(rows(g).map(([id, label]) => [id, label]), layers.map((l) => [`${l.layer}|${l.desc}`, LABEL(l.ok)]), "hàng lưới = hàng khối")
    const n = (v: boolean | null) => MIXED.filter((x) => x === v).length
    assert.deepEqual([tabCount(g, "Hỏng"), tabCount(g, "Chưa kiểm được"), tabCount(g, "Ổn")], [n(false), n(null), n(true)], "số trên tab = số lớp mỗi giá trị")
    assert.match(text(g), new RegExp(`Bộ canh chạy cuối: ${vnTime(p.blocks.lockdown.lastWatchdogAt as string).replace(/[()+]/g, "\\$&")}`))
    const t = tile(h)
    assert.equal(kpiValue(t), String(n(true)), "ô = số lớp true")
    assert.match(text(t), new RegExp(`${n(true)} ?/ ?8`))
    assert.match(text(t), /2 lượt tự trả lời/)
  })
  test("ON23-AC-3 bản sao bỏ qua ok null (coi như true) → bắt", async () => {
    ready()
    await ingest(withOks(await push(), MIXED))
    const m = mutantChain(
      { rel: "src/components/ops/collections/lockdown-grid.tsx", fn: (s) => s.replace('(l.ok === true ? "ok" : l.ok === false ? "bad" : "unknown")', '(l.ok !== false ? "ok" : "bad")') },
      [COL_VIEW_GRID, COL_PAGE],
    )
    try {
      const g = grid(await renderCollections(m.path))
      assert.notEqual(tabCount(g, "Ổn"), MIXED.filter((x) => x === true).length, "phép đếm tab phải đỏ theo")
    } finally {
      m.done()
    }
  })
})

/** Khối lockdown lùi 46′, bản tin vẫn tươi — cờ cũ theo CHÍNH khối (ADR-0014 §Ngưỡng trễ). */
const staleBlock = (p: Payload) => {
  const q = structuredClone(p)
  q.blocks.lockdown.measured_at = shift(q.blocks.lockdown.measured_at, -46)
  return q
}
const ALL_OK: (boolean | null)[] = [true, true, true, true, true, true, true, true]

describe("ON23-AC-4 khối cũ", () => {
  test("ON23-AC-4 khối lùi 46′: nhãn hàng giữ nguyên, 0 success-light trong lưới, ô số mờ, 0 bg-success trong ô; hàng kev và collector-api của Máy móc giữ nhãn đọc từ khối, 0 success-light", async () => {
    ready()
    await ingest(staleBlock(withOks(await push(), ALL_OK)))
    const h = await renderCollections()
    const g = grid(h)
    assert.deepEqual(rows(g).map(([, label]) => label), ALL_OK.map(LABEL), "nhãn hàng giữ nguyên")
    assert.equal(successBadges(g), 0, "lưới: 0 success-light")
    const t = tile(h)
    assert.match(t, /text-2xl[^"]*text-muted-foreground/, "ô số mờ")
    assert.equal(successTone(t) + successBadges(t), 0, "ô: 0 màu đạt")
    for (const id of ["kev", "collector-api"]) {
      const r = jobRow(h, id)
      assert.ok(r, `Máy móc phải có hàng ${id}`)
      assert.equal(r[1], "Sống", `${id}: nhãn đọc từ khối`)
      assert.ok(!r[2].includes("bg-success"), `${id}: không tô xanh`)
    }
    assert.equal(successTone(jobsTabs(h)), 0, "Máy móc: chấm tab «Sống» không xanh khi số cũ (E7 lượt 1)")
  })
  test("ON23-AC-4 bản sao lưới không nhận cờ số cũ → bắt", async () => {
    ready()
    await ingest(staleBlock(withOks(await push(), ALL_OK)))
    const m = mutantChain({ rel: "src/components/ops/collections/collections-view.tsx", fn: (s) => s.replace("stale={lockdown?.stale ?? false}", "stale={false}") }, [COL_PAGE])
    try {
      assert.ok(successBadges(grid(await renderCollections(m.path))) > 0, "phép đo phải thấy «Ổn» xanh trên số cũ")
    } finally {
      m.done()
    }
  })
  test("ON23-AC-4 bản sao Máy móc bỏ qua cờ cũ của khối → bắt", async () => {
    ready()
    await ingest(staleBlock(withOks(await push(), ALL_OK)))
    const m = mutantChain(
      { rel: "src/components/ops/collections/jobs-grid.tsx", fn: (s) => s.replace("(stale || row.original.stale) && row.original.alive", "stale && row.original.alive") },
      [COL_VIEW_JOBS, COL_PAGE],
    )
    try {
      const r = jobRow(await renderCollections(m.path), "kev")
      assert.ok(r && r[2].includes("bg-success"), "phép đo phải thấy «Sống» xanh trên số cũ")
    } finally {
      m.done()
    }
  })
  test("ON23-AC-4 bản sao chấm tab «Sống» bỏ qua cờ cũ → bắt", async () => {
    ready()
    await ingest(staleBlock(withOks(await push(), ALL_OK)))
    const m = mutantChain(
      { rel: "src/components/ops/collections/jobs-grid.tsx", fn: (s) => s.replace('tabs={stale || jobs.some((j) => j.stale && j.alive === "yes") ? STALE_TABS : TABS}', "tabs={TABS}") },
      [COL_VIEW_JOBS, COL_PAGE],
    )
    try {
      assert.ok(successTone(jobsTabs(await renderCollections(m.path))) > 0, "phép đo phải thấy chấm tab «Sống» xanh trên số cũ")
    } finally {
      m.done()
    }
  })
})

describe("ON23-AC-5 Máy móc cùng trạng thái với Khoá an toàn", () => {
  // [Kev ok, collector ok] — 3 × 2 ô cùng giá trị + 2 ca chéo, viết trước
  const CASES: [boolean | null, boolean | null][] = [
    [true, true],
    [false, false],
    [null, null],
    [true, false],
    [false, true],
  ]
  const ALIVE = (ok: boolean | null) => (ok === true ? "Sống" : ok === false ? "Không phản hồi" : "Chưa kiểm được")
  /** Khoá jobs cũ nói NGƯỢC giá trị khối — để thấy hàng không đọc nó. */
  const contrary = (p: Payload, kev: boolean | null, col: boolean | null) => {
    const q = structuredClone(p)
    const flip = (ok: boolean | null) => (ok === true ? "no" : "yes")
    q.jobs = q.jobs.map((j) => (j.id === "kev" ? { ...j, alive: flip(kev) } : j.id === "collector-api" ? { ...j, alive: flip(col) } : j))
    return q
  }
  test("ON23-AC-5 ma trận 3 × 2 + ca chéo trên bản tin thật: hàng kev và collector-api của Máy móc = «Sống» / «Không phản hồi» / «Chưa kiểm được» theo lớp cổng của mình, khoá jobs cũ nói ngược lại", async () => {
    ready()
    const real = await push()
    let cells = 0
    for (const [kev, col] of CASES) {
      await ingest(contrary(withOks(real, [true, true, true, true, true, true, kev, col]), kev, col))
      const h = await renderCollections()
      assert.equal(jobRow(h, "kev")?.[1], ALIVE(kev), `Kev ${kev}`)
      assert.equal(jobRow(h, "collector-api")?.[1], ALIVE(col), `collector ${col}`)
      cells += 2
    }
    assert.equal(cells, CASES.length * 2, "đếm đủ ô ma trận")
  })
  test("ON23-AC-5 không khối lockdown → hai hàng «Chưa kiểm được»", async () => {
    ready()
    const p = structuredClone(await push())
    delete p.blocks.lockdown
    await ingest(p)
    const h = await renderCollections()
    assert.equal(jobRow(h, "kev")?.[1], "Chưa kiểm được")
    assert.equal(jobRow(h, "collector-api")?.[1], "Chưa kiểm được")
  })
  test("ON23-AC-5 bản sao đọc alive của khoá jobs cũ → bắt", async () => {
    ready()
    await ingest(contrary(withOks(await push(), [true, true, true, true, true, true, true, true]), true, true))
    const m = mutantChain({ rel: "src/lib/ops-cloud.ts", fn: (s) => s.replace("    if (!desc) return j\n", "    if (desc || !desc) return j\n") }, [PAGE_CLOUD])
    try {
      assert.notEqual(jobRow(await renderCollections(m.path), "kev")?.[1], "Sống", "phép đo phải thấy trạng thái của khoá jobs cũ")
    } finally {
      m.done()
    }
  })
  test("ON23-AC-5 bản sao tráo ánh xạ kev ↔ collector-api → bắt", async () => {
    ready()
    await ingest(withOks(await push(), [true, true, true, true, true, true, true, false]))
    const m = mutantChain(
      { rel: "src/lib/ops-cloud.ts", fn: (s) => s.replace('{ kev: "Cổng Kev :8009", "collector-api": "Cổng nhận tin :9210" }', '{ kev: "Cổng nhận tin :9210", "collector-api": "Cổng Kev :8009" }') },
      [PAGE_CLOUD],
    )
    try {
      assert.notEqual(jobRow(await renderCollections(m.path), "kev")?.[1], "Sống", "phép đo phải thấy Kev mang trạng thái của collector")
    } finally {
      m.done()
    }
  })
})

describe("ON23-AC-6 máy thu", () => {
  /** Đếm truy vấn ops_heartbeat trong lúc dựng trang. */
  async function spyHeartbeat(render: () => Promise<string>) {
    const { pool } = await import("../src/lib/db")
    const seen: string[] = []
    const orig = pool.query.bind(pool)
    ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
      seen.push(String(typeof sql === "string" ? sql : (sql as { text?: string })?.text ?? ""))
      return (orig as (...a: unknown[]) => unknown)(sql, ...rest)
    }
    try {
      return { h: await render(), n: seen.filter((q) => q.includes("ops_heartbeat")).length }
    } finally {
      ;(pool as unknown as { query: unknown }).query = orig
    }
  }
  test("ON23-AC-6 bộ bắt truy vấn thấy ops_heartbeat ở chế độ máy chủ (đối chứng dương)", async () => {
    ready()
    await ingest(await push())
    const { n } = await spyHeartbeat(() => renderCollections())
    assert.ok(n > 0, "bộ bắt phải thấy truy vấn ops_heartbeat")
  })
  test("ON23-AC-6 DB máy thu đủ bảng: lưới từ getLockdownStatus, 0 chữ «Chỉ kiểm ở máy thu», 0 truy vấn ops_heartbeat", async () => {
    ready()
    for (const t of RAW_LOCAL) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    try {
      const { h, n } = await spyHeartbeat(() => renderCollections(undefined, { cloud: false }))
      assert.ok(h.includes('id="lockdown"'), "máy thu vẫn có lưới khoá an toàn")
      assert.deepEqual(rows(region(h, 'id="lockdown"', 'id="nhom-s03"')).map(([id]) => id).slice(0, 8), await expectedIds(), "lưới từ getLockdownStatus")
      assert.ok(!h.includes("Chỉ kiểm ở máy thu"), "máy thu không có chữ «Chỉ kiểm ở máy thu»")
      assert.equal(n, 0, "máy thu không đọc ops_heartbeat")
    } finally {
      for (const t of RAW_LOCAL) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
})
