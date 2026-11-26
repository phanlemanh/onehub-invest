// kev2-thu-thap.test.tsx — hồ sơ bo-lop-kev-o-ops-va-audit (KEV2): trang Thu thập không còn lớp, hàng, chữ Kev; máy chủ
// đọc bản tin CŨ (sinh bằng push-ops-facts ở commit 04b9ddc3b, trước KEV2) vẫn không hiện Kev; phễu hook không đếm dòng
// «kev null». Chạy qua db/db-thu.sh (executors.test.kev2_app). Tên ca mở đầu bằng mã AC.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import pg from "pg"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const ROOT = join(import.meta.dirname, "../..")
const SHA_CU = "04b9ddc3b" // main trước KEV2 — bên ghi bản tin còn hàng kev và lớp Kev
const S_CLOUD = `kev2_cloud_${process.pid}`
const S_LOCAL = `kev2_local_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S_CLOUD)
process.env.OPS_API_TOKEN = "kev2-thu"
const CLOUD_SYNCED = ["listings"]
const BAY = ["L1", "L2", "L3", "L4", "L4b", "OpenClaw đang chạy", "Cổng nhận tin :9210"]

type Layer = { layer: string; desc: string; ok: boolean | null }
type Payload = Record<string, unknown> & { jobs: { id: string; alive: string }[]; blocks: Record<string, Record<string, unknown> & { layers?: Layer[] }> }
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const cayCu = mkdtempSync(join(tmpdir(), "kev2-cu-")) + "/cay"
before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S_CLOUD}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S_CLOUD}"`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
    for (const t of CLOUD_SYNCED) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    await makeOpsSchema(admin, S_LOCAL)
    // Cây cũ của bên ghi (push-ops-facts + scripts/lib/ops-local.mjs ở SHA_CU): bản tin cũ do chính bên ghi cũ dựng.
    const w = spawnSync("git", ["-C", ROOT, "worktree", "add", "-q", "--detach", cayCu, SHA_CU], { encoding: "utf8" })
    if (w.status !== 0) throw new Error(`không dựng được cây ${SHA_CU}: ${w.stderr}`)
    symlinkSync(join(ROOT, "pipeline/node_modules"), join(cayCu, "pipeline/node_modules"))
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  for (const s of [S_CLOUD, S_LOCAL]) await dropOpsSchema(admin, s).catch(() => {})
  await admin.end().catch(() => {})
  spawnSync("git", ["-C", ROOT, "worktree", "remove", "--force", cayCu])
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng môi trường không được — eval đòi chạy thật: ${setupErr}`)

const watchdogOk = () => {
  const t = new Date(Date.now() - 2 * 60_000 + 7 * 3600_000).toISOString().slice(0, 19)
  return { "zalo-watchdog.log": `${t}+07:00 ok — 7 lớp\n` }
}
async function push(script?: string): Promise<Payload> {
  const r = (await captureOpsFacts({ ...(script ? { script } : {}), env: { DATABASE_URL: schemaUrl(S_LOCAL) }, logs: watchdogOk() })) as { code: number; stderr: string; payload: Payload }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  return r.payload
}
const ingest = async (payload: Payload) => {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer kev2-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}
async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
async function renderCloud() {
  const prev = process.env.VERCEL
  process.env.VERCEL = "1"
  const { resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
  try {
    return await html(await (await import("../src/app/ops/collections/page")).default())
  } finally {
    if (prev === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prev
    resetFactsCache()
  }
}
const text = (h: string) => h.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
function rows(r: string) {
  return [...r.matchAll(/data-row-id="([^"]+)"([\s\S]*?)<\/tr>/g)].map((m) => {
    const b = m[2].match(/<span[^>]*data-slot="badge"[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/span>/) ?? m[2].match(/class="([^"]*)"[^>]*data-slot="badge"[^>]*>([\s\S]*?)<\/span>/)
    return [m[1], b ? text(b[2]).trim() : ""] as const
  })
}

/** fetch giả ghi mọi URL; trả 200. */
function fetchGia() {
  const goi: string[] = []
  const cu = globalThis.fetch
  globalThis.fetch = (async (u: RequestInfo | URL) => { goi.push(String(u)); return new Response("{}", { status: 200 }) }) as typeof fetch
  return { goi, tra: () => { globalThis.fetch = cu } }
}

test("KEV2-AC-1 khối khoá an toàn bảy dòng, dò :9210, không dò 8009", async () => {
  const { getLockdownStatus, LOCKDOWN_LAYERS } = await import("../src/lib/ops-queries")
  assert.deepEqual(LOCKDOWN_LAYERS.map((l) => (l.layer === "Hạ tầng" ? l.desc : l.layer)), BAY)
  const f = fetchGia()
  try {
    const r = await getLockdownStatus({ root: mkdtempSync(join(tmpdir(), "kev2-ld-")), agentLogDir: mkdtempSync(join(tmpdir(), "kev2-ag-")) })
    assert.deepEqual(r.layers.map((l) => (l.layer === "Hạ tầng" ? l.desc : l.layer)), BAY)
    assert.ok(!("kevUp" in r), "trường kevUp còn")
    assert.ok(f.goi.some((u) => u.includes("127.0.0.1:9210")), `đối chứng dương: phải thấy lời dò :9210 — ${f.goi}`)
    assert.ok(!f.goi.some((u) => u.includes("8009")), `không được dò 8009: ${f.goi}`)
  } finally { f.tra() }
  // Chiều đỏ trên chính danh sách: thêm lại dòng Kev → ghim.
  const ghim = (ds: readonly { desc: string }[]) => { if (ds.some((l) => /Kev|8009/.test(l.desc))) throw new Error("khối khoá an toàn còn dòng Kev") }
  ghim(LOCKDOWN_LAYERS)
  assert.throws(() => ghim([...LOCKDOWN_LAYERS, { layer: "Hạ tầng", desc: "Cổng " + "Kev :8009" }]), /khối khoá an toàn còn dòng Kev/)
})

test("KEV2-AC-2 lưới Máy móc máy thu không hàng kev; dò :9210, không dò 8009", async () => {
  const { readSchedulerStatus, resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
  const f = fetchGia()
  try {
    const jobs = await readSchedulerStatus()
    assert.deepEqual(jobs.map((j) => j.id), ["s02-daily", "s01-weekly", "s01-smoke", "collector-api"])
    assert.doesNotMatch(JSON.stringify(jobs), /Kev|8009/)
    assert.ok(f.goi.some((u) => u.includes("127.0.0.1:9210")), `đối chứng dương :9210 — ${f.goi}`)
    assert.ok(!f.goi.some((u) => u.includes("8009")))
  } finally { f.tra() }
})

test("KEV2-AC-3 bản tin thật (push-ops-facts qua --kho) toàn văn không «Kev» hay «8009»", async () => {
  ready()
  const p = await push()
  assert.ok(!p.jobs.some((j) => j.id === "kev"))
  assert.equal((p.blocks.lockdown.layers ?? []).length, 7)
  assert.doesNotMatch(JSON.stringify(p), /Kev|8009/)
})

test("KEV2-AC-4 máy chủ đọc bản tin CŨ (bên ghi ở 04b9ddc3b) không hiện Kev; hàng cổng nhận tin theo lớp :9210", async () => {
  ready()
  const cu = await push(join(cayCu, "pipeline/push-ops-facts.mjs"))
  assert.ok(cu.jobs.some((j) => j.id === "kev"), "bản tin cũ phải còn hàng kev — fixture không đúng thứ đang cần lọc")
  assert.ok((cu.blocks.lockdown.layers ?? []).some((l) => /8009/.test(l.desc)), "bản tin cũ phải còn lớp :8009")
  const MA_TRAN: [boolean | null, string][] = [[true, "Sống"], [false, "Không phản hồi"], [null, "Chưa kiểm được"]]
  for (const [ok, nhan] of MA_TRAN) {
    const q = structuredClone(cu)
    q.blocks.lockdown.layers = (q.blocks.lockdown.layers ?? []).map((l) => (l.desc === "Cổng nhận tin :9210" ? { ...l, ok } : l))
    await admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)
    await ingest(q)
    const h = await renderCloud()
    assert.doesNotMatch(text(h), /Kev|8009/, "máy chủ hiện Kev từ bản tin cũ")
    assert.equal(rows(h).find(([id]) => id === "kev"), undefined, "máy chủ hiện Kev từ bản tin cũ")
    assert.equal(rows(h).find(([id]) => id === "collector-api")?.[1], nhan, `cổng nhận tin ok=${ok}`)
  }
  // Đối chứng dương: bản tin mới cho cùng khối Máy móc (không hàng kev).
  await admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)
  await ingest(await push())
  assert.equal(rows(await renderCloud()).find(([id]) => id === "kev"), undefined)
})

test("KEV2-AC-5 khung đường ống «Hook Zalo … đẩy vào cổng nhận tin», chú thích bảng nhóm không Kev", async () => {
  const ZERO = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
  const { ZaloPipePanel } = await import("../src/components/ops/collections/pipe-panels")
  const zalo = { silentAlert24h: false, driftAlert24h: false, connected: true, uptime24h: 1, heartbeatAgeMin: 1, lastHeartbeatAt: null, lastPostAt: null } as never
  const h = text(await html(ZaloPipePanel({ zalo, funnel: { lastEventAt: null, today: ZERO, last7: { ...ZERO, messages: 5, passed: 4, accepted: 3 } } } as never)))
  assert.match(h, /Hook Zalo: sự kiện cuối .*? 7 ngày qua: 5 tin thấy → 4 đẩy vào cổng nhận tin → 3 nhận vào bảng thô/)
  assert.doesNotMatch(h, /Kev/)
  const bang = readFileSync(join(ROOT, "app/src/components/ops/collections-tables.tsx"), "utf8")
  assert.doesNotMatch(bang, /cổng Kev/)
})

test("KEV2-AC-6 phễu máy thu không đếm dòng kev null (nhật ký từ khuôn log của handler.js); tệp vắng → 0", async () => {
  const h = readFileSync(join(ROOT, "collector/openclaw/handler.js"), "utf8")
  const khuon = (re: RegExp, ten: string) => { const m = h.match(re); assert.ok(m, `handler.js không còn dòng log «${ten}»`); return m![1] }
  const kevNull = khuon(/log\(`(kev null \(timeout\/gate\)) group=/, "kev null")
  const post = khuon(/log\(`(post) \$\{r\.status\}/, "post")
  const skip = khuon(/log\(`(skip \(rỗng\)) group=/, "skip (rỗng)")
  const t = (phut: number) => new Date(Date.now() - phut * 60_000).toISOString()
  const dong: string[] = []
  for (let i = 0; i < 3; i++) {
    dong.push(`${t(30 - i)} ${kevNull} group=Nhóm A account=acc-1`)
    dong.push(`${t(30 - i)} ${post} 202 {"accepted":1} group=Nhóm A p=null account=acc-1 by=x`)
  }
  dong.push(`${t(10)} ${skip} group=Nhóm A account=acc-1`, `${t(5)} heartbeat up`)
  const home = mkdtempSync(join(tmpdir(), "kev2-home-"))
  mkdirSync(join(home, ".openclaw/logs"), { recursive: true })
  const prevHome = process.env.HOME
  const { readGateFunnel, gateByGroup, resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
  try {
    process.env.HOME = home
    const vang = await readGateFunnel()
    assert.equal(vang.lastEventAt, null)
    assert.equal(vang.last7.messages, 0)
    writeFileSync(join(home, ".openclaw/logs/oneinvest-zalo-pipe.log"), dong.join("\n") + "\n")
    const f = await readGateFunnel()
    const lay = (b: typeof f.last7) => ({ messages: b.messages, passed: b.passed, skipped: b.skipped, accepted: b.accepted })
    const ghim = (b: typeof f.last7) => { if (b.messages !== 4) throw new Error(`tin thấy đếm đôi: ${b.messages}`) }
    ghim(f.last7)
    assert.deepEqual(lay(f.last7), { messages: 4, passed: 3, skipped: 1, accepted: 3 })
    assert.equal(gateByGroup(dong.join("\n")).get("Nhóm A")?.seen, 4, "tin thấy theo nhóm đếm đôi")
    // Chiều đỏ: cùng nhật ký mà không bỏ dòng kev null → 7 tin thấy.
    assert.throws(() => ghim({ ...f.last7, messages: dong.filter((l) => !/ heartbeat /.test(l)).length }), /tin thấy đếm đôi/)
  } finally {
    if (prevHome === undefined) delete process.env.HOME
    else process.env.HOME = prevHome
    rmSync(home, { recursive: true, force: true })
  }
})
