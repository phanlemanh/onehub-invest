// dong-chay-cloud.test.tsx — hồ sơ _acceptance/dong-chay-len-cloud (DF1): /ops/data-flow trên cloud đọc số tính sẵn ở máy
// thu. Tên ca mở đầu bằng mã AC (DC-AC-n). Lược đồ tạm DB local `dc_*_<pid>` (không đụng public trừ ca «thời gian thật»
// chạy trong giao dịch ROLLBACK với bảng tạm): fixture DF0 dùng chung (tests/ops-dong-chay-fixture.ts) + migration 051 THẬT
// + pipeline/sql/600 THẬT; bản tin do push-ops-facts THẬT dựng (pipeline/scripts/capture-ops-facts.mjs) đi qua handler
// POST /api/v1/ops/ingest THẬT vào lược đồ «máy chủ» không có bảng stg_*. Mỗi phép đo có chiều đỏ: một bản đột biến trên
// CÙNG fixture, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ReactElement, ReactNode } from "react"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { IN, NOW, OFFERS, ROOT, flowSql, inSchema, makeFlowSchema, migration051, refreshFlow, vn } from "./ops-dong-chay-fixture"

const P = process.pid
const S_LOCAL = `dc_local_${P}` // máy thu: đủ bảng nạp + 051, làm tươi bằng 600
const S_CLOUD = `dc_cloud_${P}` // máy chủ: KHÔNG stg_*, chỉ bảng đã sync + ops_heartbeat
const S_NOFLOW = `dc_noflow_${P}` // máy thu chưa áp 051
const S_TA = `dc_ta_${P}` // máy thu có tên nhóm mang tên nguồn thật
const S_MUT = `dc_mut_${P}` // làm tươi bằng 600 đột biến
const S_MIG = `dc_mig_${P}` // áp 051 hai lần
const SCHEMAS = [S_LOCAL, S_CLOUD, S_NOFLOW, S_TA, S_MUT, S_MIG]
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app = máy chủ — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "dc-thu"
delete process.env.VERCEL // máy thu là mặc định; ca cloud bật VERCEL=1 qua asCloud (cùng quy ước collections-queries)
const WINDOWS = ["7d", "30d", "all"] as const
type W = (typeof WINDOWS)[number]

// ---------- jsdom (cùng khuôn ops-dong-chay.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3461/ops/data-flow" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  // Báo kích thước thật khi quan sát: biểu đồ ngày (Recharts) dựng điểm và tooltip được trong jsdom (AC-6 đọc điểm ngày).
  ResizeObserver: class {
    cb: ResizeObserverCallback
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      this.cb([{ target: el, contentRect: { width: 800, height: 248 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(<AppRouterContext.Provider value={router as never}>{node}</AppRouterContext.Provider>))
  return document.getElementById("root")!
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react")
  await React.act(async () => {
    await fn()
    await new Promise((r) => setTimeout(r, 20))
  })
}
const dialogs = () => document.querySelectorAll("[role=dialog]")
const txt = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ")

// ---------- dựng lược đồ, bản tin thật ----------
type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
let PAYLOAD: Payload
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

/** Máy thu: lược đồ bản tin (source_registry thật, bảng LIKE) + bảng dòng chảy + 051, làm tươi bằng 600. */
async function makeLocal(schema: string, extra: (s: string) => Promise<void> = async () => {}) {
  await makeOpsSchema(admin, schema)
  await makeFlowSchema(admin, schema, { fresh: false })
  // Đề xuất làm giàu: 2 đang chờ + 1 đã áp (enrichPending = 2).
  for (const [id, status] of [[1, "queued"], [2, "queued"], [3, "applied"]] as const)
    await admin.query(
      `INSERT INTO "${schema}".enrichment_proposals (id, run_id, offer_id, field, value, value_key, source, route, status)
       VALUES ($1, 'r', 'o1', 'bedrooms', '2', '2', 'e1_rule', 'direct', $2)`,
      [id, status],
    )
  await extra(schema)
  await refreshFlow(schema)
}
const push = async (schema: string, args: string[] = []) =>
  (await captureOpsFacts({ env: { DATABASE_URL: schemaUrl(schema) }, args: args as never[] })) as { code: number; stdout: string; stderr: string; payload: Payload | null }
async function ingest(payload: Payload) {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer dc-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}

before(async () => {
  try {
    await admin.connect()
    await makeLocal(S_LOCAL)
    // Một cửa sổ tính lâu hơn hai cửa sổ kia → measured_at của khối phải là computed_at CŨ NHẤT (AC-4).
    await admin.query(`UPDATE "${S_LOCAL}".data_flow_snapshot SET computed_at = computed_at - interval '2 hours' WHERE time_window = '30d'`)
    const r = await push(S_LOCAL)
    assert.equal(r.code, 0, r.stderr.slice(0, 600))
    assert.ok(r.payload, "push-ops-facts không gửi bản tin")
    PAYLOAD = r.payload
    // Máy chủ: bảng đã sync (tin rao, căn, khu vực) + ops_heartbeat/ops_audit — không bảng stg_* nào.
    await makeFlowSchema(admin, S_CLOUD, { tables: ["sale_offers", "property_offers", "areas", "listings"], migrate: false })
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
    // Phường của tin rao (bảng công khai đã sync) — có tên thì tin đủ năm trường lên B1/B2 (AC-8 không chỉ toàn B0).
    for (const [id, name] of [["vn-hanoi-a", "Phường A"], ["vn-hcmc-x", "Phường X"], ["vn-hcmc-y", "Phường Y"]])
      await admin.query(`INSERT INTO "${S_CLOUD}".areas (id, region_type, name, country_code) VALUES ($1, 'ward', $2, 'VN')`, [id, name])
    await ingest(PAYLOAD)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  // Không act/unmount React ở đây: act trong hook after của node:test treo (lời hứa không bao giờ xong) — dọn DOM thẳng.
  currentRoot = null
  document.body.innerHTML = ""
  for (const s of SCHEMAS) await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

type DF = import("../src/lib/data-flow-queries").DataFlow
type FF = import("../src/lib/data-flow-queries").FlowFacts
const snapshotRows = async (schema: string) =>
  (await admin.query(`SELECT time_window, computed_at, facts FROM "${schema}".data_flow_snapshot ORDER BY time_window`)).rows as {
    time_window: W
    computed_at: Date
    facts: FF
  }[]
const factsOf = async (schema: string, w: W) => (await snapshotRows(schema)).find((r) => r.time_window === w)!.facts
/** Client gắn lược đồ dùng làm `query` của getDataFlow; `seen` ghi mọi câu gửi đi. */
async function schemaQuery(schema: string, seen?: string[]) {
  const c = new pg.Client({ connectionString: schemaUrl(schema) })
  await c.connect()
  return {
    query: (text: string, values?: unknown[]) => {
      seen?.push(text)
      return c.query(text, values)
    },
    end: () => c.end(),
  }
}
/** Chạy `fn` như trên Vercel (VERCEL=1 — đường nhận nơi chạy của getDataFlow), trả env về như cũ. */
async function asCloud<T>(fn: () => Promise<T>, cloud = true): Promise<T> {
  const prev = process.env.VERCEL
  if (cloud) process.env.VERCEL = "1"
  else delete process.env.VERCEL
  try {
    return await fn()
  } finally {
    if (prev === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prev
  }
}
async function content(window: W, nowMs: number, { cloud = true } = {}) {
  const { DataFlowContent } = await import("../src/components/ops/data-flow/data-flow-content")
  return asCloud(async () => (await DataFlowContent({ window, nowMs, getUser: async () => null })) as ReactElement<{ flow: DF }>, cloud)
}

// ---------- AC-1: bảng tính sẵn ----------
/** Cột + ràng buộc của data_flow_snapshot trong lược đồ — so trước/sau khi áp lại 051. */
async function shape(schema: string) {
  const cols = (
    await admin.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'data_flow_snapshot' ORDER BY ordinal_position`,
      [schema],
    )
  ).rows
  const cons = (
    await admin.query(
      `SELECT c.conname, pg_get_constraintdef(c.oid) AS def FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname = $1 AND t.relname = 'data_flow_snapshot' ORDER BY 1`,
      [schema],
    )
  ).rows
  return { cols, cons }
}
/** Chạy làm tươi hai lần trên lược đồ — rỗng = idempotent (ba dòng, facts bằng nhau, computed_at không lùi). */
async function idemProblems(schema: string, sql: string): Promise<string[]> {
  const out: string[] = []
  const runs: Awaited<ReturnType<typeof snapshotRows>>[] = []
  for (let i = 0; i < 2; i++) {
    try {
      await refreshFlow(schema, { sql })
    } catch (e) {
      out.push(`làm tươi không idempotent: lần ${i + 1} lỗi «${(e as Error).message}»`)
      return out
    }
    runs.push(await snapshotRows(schema))
  }
  for (const [i, rows] of runs.entries()) {
    const ws = rows.map((r) => r.time_window).sort()
    if (JSON.stringify(ws) !== JSON.stringify(["30d", "7d", "all"])) out.push(`làm tươi không idempotent: lần ${i + 1} có ${rows.length} dòng (${ws.join(", ")})`)
  }
  if (!out.length) {
    for (const w of WINDOWS) {
      const [a, b] = runs.map((rows) => rows.find((r) => r.time_window === w)!)
      try {
        assert.deepStrictEqual(b.facts, a.facts)
      } catch {
        out.push(`làm tươi không idempotent: facts ${w} lần hai ≠ lần một`)
      }
      if (b.computed_at.getTime() < a.computed_at.getTime()) out.push(`computed_at ${w} lùi`)
    }
  }
  return out
}
/** Bảng đích của mọi câu ghi trong tệp SQL (bỏ chú thích). */
function writeTargets(sql: string): string[] {
  const body = sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "")
  return [...body.matchAll(/\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE(?:\s+TABLE)?)\s+("?[\w.]+"?)/gi)].map((m) => m[1].replace(/"/g, ""))
}

describe("DC-AC-1 bảng tính sẵn", () => {
  test("DC-AC-1 bảng tính sẵn — 051 hai lần, 600 hai lần, chỉ ghi data_flow_snapshot", async () => {
    ready()
    await admin.query(`DROP SCHEMA IF EXISTS "${S_MIG}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S_MIG}"`)
    await inSchema(S_MIG, (c) => c.query(migration051()))
    const one = await shape(S_MIG)
    await inSchema(S_MIG, (c) => c.query(migration051()))
    const two = await shape(S_MIG)
    console.log(`# DC-AC-1 cột: ${one.cols.map((c) => `${c.column_name} ${c.data_type}`).join(" · ")} · ràng buộc ${one.cons.length}`)
    assert.deepEqual(two, one, "áp 051 lần hai đổi khuôn bảng")
    assert.deepEqual(
      one.cols.map((c) => [c.column_name, c.data_type, c.is_nullable]),
      [["time_window", "text", "NO"], ["computed_at", "timestamp with time zone", "NO"], ["facts", "jsonb", "NO"]],
    )
    assert.ok(one.cons.some((c) => /CHECK .*'7d'.*'30d'.*'all'/.test(c.def)), "thiếu CHECK ba cửa sổ")

    await makeFlowSchema(admin, S_MIG)
    assert.deepEqual(await idemProblems(S_MIG, flowSql()), [])
    const targets = writeTargets(flowSql())
    console.log(`# DC-AC-1 câu ghi của 600: ${targets.join(", ")}`)
    assert.deepEqual([...new Set(targets)], ["data_flow_snapshot"], `600 ghi ngoài data_flow_snapshot: ${targets.join(", ")}`)
    // Chiều đỏ cùng ca: bỏ DELETE → lần làm tươi thứ hai không còn ra đúng ba dòng; câu ghi lạ → bộ quét bắt.
    const noDelete = flowSql().replace("DELETE FROM data_flow_snapshot;", "")
    assert.notEqual(noDelete, flowSql(), "khuôn đột biến lệch 600: không thấy DELETE")
    const p = await idemProblems(S_MIG, noDelete)
    console.log(`# DC-AC-1 chiều đỏ bỏ DELETE: ${p.join(" | ")}`)
    assert.ok(p.some((m) => m.startsWith("làm tươi không idempotent")), `đột biến bỏ DELETE phải đỏ: ${p.join(" | ")}`)
    assert.ok(writeTargets(flowSql().replace("BEGIN;", "BEGIN;\nDELETE FROM sale_offers;")).includes("sale_offers"), "bộ quét câu ghi không bắt câu ghi bảng tin")
  })

  test("DC-AC-1 thời gian thật — 600 trên DB local thật trong giao dịch ROLLBACK", async () => {
    const c = new pg.Client({ connectionString: localDbUrl() })
    await c.connect()
    try {
      // Bảng 051 chưa áp lên public trước merge (lời dặn giám sát) → bảng TẠM cùng khuôn trong giao dịch, rồi ROLLBACK.
      const ddl = migration051().replace("CREATE TABLE IF NOT EXISTS data_flow_snapshot", "CREATE TEMP TABLE data_flow_snapshot")
      assert.notEqual(ddl, migration051(), "khuôn bảng tạm lệch 051")
      const body = flowSql().replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "")
      assert.ok(!/^\s*(BEGIN|COMMIT);/m.test(body), "600 còn BEGIN/COMMIT — không chạy được trong giao dịch ROLLBACK")
      await c.query("BEGIN")
      await c.query(ddl)
      const t0 = performance.now()
      await c.query(body)
      const giay = (performance.now() - t0) / 1000
      const { rows } = await c.query(`SELECT time_window, jsonb_array_length(facts->'sources') AS n FROM data_flow_snapshot ORDER BY 1`)
      const locks = (
        await c.query(
          `SELECT DISTINCT c.relname, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
           WHERE l.pid = pg_backend_pid() AND c.relnamespace = 'public'::regnamespace ORDER BY 1`,
        )
      ).rows as { relname: string; mode: string }[]
      await c.query("ROLLBACK")
      console.log(`# DC-AC-1 thời gian thật: ${giay.toFixed(3)} giây · ${rows.length} dòng · khoá trên ${locks.length} quan hệ public: ${[...new Set(locks.map((l) => l.mode))].join(", ")}`)
      assert.ok(locks.some((l) => l.relname === "stg_zalo_posts"), "đối chứng: phép đo khoá phải thấy bảng nạp 600 đọc")
      assert.deepEqual(rows.map((r) => r.time_window), ["30d", "7d", "all"])
      assert.ok(giay <= 30, `600 chạy ${giay.toFixed(1)} giây > 30`)
      const ghi = locks.filter((l) => l.mode !== "AccessShareLock")
      assert.deepEqual(ghi, [], `600 giữ khoá ghi trên bảng thật: ${JSON.stringify(ghi)}`)
    } finally {
      await c.query("ROLLBACK").catch(() => {})
      await c.end()
    }
  })
})

// ---------- AC-2: số khớp DF0 ----------
const SRC = (o: Partial<import("../src/lib/data-flow-queries").SourceFlow> & { source: string }) => ({
  received: 0, readable: 0, offers: 0, linked: 0, testRejected: 0, withWard: 0, withType: 0, withPriceArea: 0, complete: 0,
  highConfidence: 0, latestAt: null as string | null, approx: o.source === "S06", ...o,
})
const LATEST_S03 = vn("2026-10-25T09:00:00")
const S05 = SRC({ source: "S05", received: 2, readable: 1, offers: 1, latestAt: LATEST_S03 })
const S06 = SRC({ source: "S06", received: 4, readable: 3, offers: 3, linked: 1, withWard: 3, withType: 3, withPriceArea: 3, complete: 3, latestAt: vn(IN) })
const S03_ALL = SRC({ source: "S03", received: 6, readable: 4, offers: 2, linked: 1, testRejected: 3, withWard: 1, withType: 1, withPriceArea: 1, complete: 1, latestAt: LATEST_S03 })
const DAYS = (
  [
    ["2026-10-10", "S03", 1, 1, 1, 0],
    ["2026-10-11", "S03", 1, 0, 0, 0],
    ["2026-10-24", "S03", 3, 3, 1, 1],
    ["2026-10-24", "S05", 1, 1, 1, 0],
    ["2026-10-24", "S06", 4, 3, 3, 1],
    ["2026-10-25", "S03", 1, 0, 0, 0],
    ["2026-10-25", "S05", 1, 0, 0, 0],
  ] as const
).map(([day, source, received, readable, offers, linked]) => ({ day, source, received, readable, offers, linked }))
const G = (group: string, source: string, received: number, readable: number, offers: number, latestAt: string) => ({ group, source, received, readable, offers, latestAt })
const GROUPS_ALL = [G("Nhóm A", "S03", 4, 3, 2, vn("2026-10-24T10:00:00")), G("Nhóm B", "S03", 2, 1, 1, LATEST_S03), G("Nhóm FB", "S05", 2, 1, 1, LATEST_S03)]
/** Bảng mong đợi viết trước cho fixture DF0 (cùng đáp án DF-AC-2), mốc NOW = 26/10 12:00 VN. */
const WANT: Record<W, FF> = {
  all: {
    sources: [S03_ALL, S05, S06],
    days: DAYS,
    groups: GROUPS_ALL,
    shortStay: { received: 2, stored: 3, withWard: 3, latestAt: "2026-10-25" },
    mix: { sale: 3, rentLt: 3, shortStay: 3 },
    enrichPending: 2,
  } as FF,
  "30d": {
    sources: [S03_ALL, S05, S06],
    days: DAYS,
    groups: GROUPS_ALL,
    shortStay: { received: 2, stored: 3, withWard: 3, latestAt: "2026-10-25" },
    mix: { sale: 3, rentLt: 3, shortStay: 3 },
    enrichPending: 2,
  } as FF,
  "7d": {
    sources: [{ ...S03_ALL, received: 4, readable: 3, offers: 1 }, S05, S06],
    days: DAYS,
    groups: [G("Nhóm A", "S03", 2, 2, 1, vn("2026-10-24T10:00:00")), G("Nhóm B", "S03", 2, 1, 1, LATEST_S03), G("Nhóm FB", "S05", 2, 1, 1, LATEST_S03)],
    shortStay: { received: 2, stored: 2, withWard: 2, latestAt: "2026-10-25" },
    mix: { sale: 2, rentLt: 3, shortStay: 2 },
    enrichPending: 2,
  } as FF,
}
/** So `got` với bảng mong đợi — mỗi lệch một dòng «<chỗ> <được> ≠ <mong>»; mốc giờ so theo thời điểm. */
function diffFacts(got: FF, want: FF): string[] {
  const out: string[] = []
  const same = (a: unknown, b: unknown, k: string) =>
    k === "latestAt" && typeof a === "string" && typeof b === "string" && b.includes("T") ? Date.parse(a) === Date.parse(b) : a === b
  const row = (where: string, g: Record<string, unknown> | undefined, w: Record<string, unknown>) => {
    if (!g) return void out.push(`${where} thiếu`)
    for (const k of new Set([...Object.keys(w), ...Object.keys(g)])) if (!same(g[k], w[k], k)) out.push(`${where} ${k} ${g[k]} ≠ ${w[k]}`)
  }
  for (const w of want.sources) row(w.source, got.sources.find((s) => s.source === w.source), w)
  if (got.sources.length !== want.sources.length) out.push(`sources ${got.sources.length} nguồn ≠ ${want.sources.length}`)
  want.days.forEach((w, i) => row(`days[${i}]`, got.days[i], w))
  if (got.days.length !== want.days.length) out.push(`days ${got.days.length} điểm ≠ ${want.days.length}`)
  want.groups.forEach((w, i) => row(`groups[${i}]`, got.groups[i], w))
  if (got.groups.length !== want.groups.length) out.push(`groups ${got.groups.length} nhóm ≠ ${want.groups.length}`)
  row("shortStay", got.shortStay, want.shortStay)
  row("mix", got.mix, want.mix)
  if (got.enrichPending !== want.enrichPending) out.push(`enrichPending ${got.enrichPending} ≠ ${want.enrichPending}`)
  return out
}

describe("DC-AC-2 số khớp DF0", () => {
  test("DC-AC-2 số khớp DF0 — facts mọi cửa sổ = bảng mong đợi viết trước", async () => {
    ready()
    for (const w of WINDOWS) assert.deepEqual(diffFacts(await factsOf(S_LOCAL, w), WANT[w]), [], `cửa sổ ${w}`)
    // Chiều đỏ cùng fixture: 600 đột biến bỏ vế «không phải bài thử» ở số bài nhận.
    const goc = "count(*) FILTER (WHERE NOT t.is_test) AS received"
    assert.ok(flowSql().includes(goc), "khuôn đột biến lệch 600: không thấy số bài nhận lọc bài thử")
    await makeFlowSchema(admin, S_MUT)
    await admin.query(`CREATE TABLE IF NOT EXISTS "${S_MUT}".enrichment_proposals (LIKE public.enrichment_proposals INCLUDING DEFAULTS)`)
    await refreshFlow(S_MUT, { sql: flowSql().replace(goc, "count(*) AS received") })
    const sai = diffFacts(await factsOf(S_MUT, "all"), WANT.all)
    console.log(`# DC-AC-2 chiều đỏ bỏ NOT is_test: ${sai.slice(0, 3).join(" | ")}`)
    assert.ok(sai.includes("S03 received 9 ≠ 6"), `đột biến phải đỏ «S03 received 9 ≠ 6»: ${sai.join(" | ")}`)
  })
})

// ---------- AC-3: máy thu chỉ đọc bảng ----------
/** Ma trận viết trước: MỌI câu getDataFlow gửi ở máy thu phải thuộc đúng một lớp cho phép (nơi chạy nhận theo VERCEL,
 * không còn câu dò bảng). Phần tổng hợp chỉ có lớp
 * «bảng tính sẵn»; hai lớp còn lại ngoài phần tổng hợp theo kế hoạch Task 3 (thẻ chờ duyệt, «Tin mới nhất»). */
const ALLOWED_QUERIES: [string, RegExp][] = [
  ["bảng tính sẵn", /^SELECT to_char\(computed_at AT TIME ZONE 'UTC', '[^']+'\) AS computed_at, facts\s+FROM data_flow_snapshot WHERE time_window = \$1$/],
  ["thẻ chờ duyệt", /^SELECT count\(\*\) AS review FROM review_queue WHERE status = 'pending'$/],
  ["Tin mới nhất", /row_number\(\) OVER \(PARTITION BY source ORDER BY first_seen DESC\) AS rn\s+FROM sale_offers WHERE first_seen >= \$1/],
]
/** Câu nằm ngoài ma trận (rỗng = mọi câu thuộc một lớp cho phép, không lớp nào lặp). */
function queryProblems(seen: string[]): string[] {
  const out: string[] = []
  const hit = new Map<string, number>()
  for (const q of seen.map((x) => x.trim())) {
    const cls = ALLOWED_QUERIES.filter(([, re]) => re.test(q)).map(([n]) => n)
    if (cls.length !== 1) out.push(`câu ngoài danh sách cho phép: ${q.replace(/\s+/g, " ").slice(0, 80)}`)
    else hit.set(cls[0], (hit.get(cls[0]) ?? 0) + 1)
  }
  for (const [n] of ALLOWED_QUERIES) if (hit.get(n) !== 1) out.push(`lớp «${n}»: ${hit.get(n) ?? 0} câu ≠ 1`)
  return out
}

describe("DC-AC-3 chỉ đọc bảng", () => {
  test("DC-AC-3 chỉ đọc bảng — câu tổng hợp chạm data_flow_snapshot, đầu trang «Số tính lúc»", async () => {
    ready()
    const { getDataFlow } = await import("../src/lib/data-flow-queries")
    const seen: string[] = []
    const q = await schemaQuery(S_LOCAL, seen)
    let flow: DF
    try {
      flow = await getDataFlow("7d", { now: NOW, query: q.query })
    } finally {
      await q.end()
    }
    const docStg = seen.filter((s) => /\b(FROM|JOIN)\s+stg_\w+/i.test(s))
    console.log(`# DC-AC-3 ${seen.length} câu · đọc stg_*: ${docStg.length} · đọc data_flow_snapshot: ${seen.filter((s) => /FROM data_flow_snapshot/.test(s)).length}`)
    assert.equal(flow.mode, "local")
    assert.equal(docStg.length, 1, `câu đọc stg_*: ${docStg.length} (chỉ được câu bài gốc của «Tin mới nhất»)`)
    assert.match(docStg[0], /row_number\(\) OVER/, "câu duy nhất đọc stg_* phải là câu «Tin mới nhất»")
    assert.deepEqual(queryProblems(seen), [], "mọi câu của getDataFlow phải thuộc ma trận cho phép")
    // Chiều đỏ cùng ca: thêm lại một câu tổng hợp ngoài bảng tính sẵn (kể cả dạng không GROUP BY) → bị gọi tên.
    for (const extra of ["SELECT count(*) FROM sale_offers WHERE source = 'S03'", "SELECT count(*) FILTER (WHERE kind = 'sale') FROM sale_offers"]) {
      const p = queryProblems([...seen, extra])
      assert.ok(p.some((m) => m.startsWith("câu ngoài danh sách cho phép: SELECT count(*)")), `câu tổng hợp lạ phải bị bắt: ${p.join(" | ")}`)
    }
    assert.ok(queryProblems(seen.filter((q) => !/data_flow_snapshot/.test(q))).includes("lớp «bảng tính sẵn»: 0 câu ≠ 1"), "thiếu câu đọc bảng tính sẵn phải bị bắt")
    assert.deepEqual(diffFacts(flow, WANT["7d"]), [])
    const hhmm = (
      await admin.query(`SELECT to_char(computed_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') AS t FROM "${S_LOCAL}".data_flow_snapshot WHERE time_window = '7d'`)
    ).rows[0].t
    const { DataFlowView } = await import("../src/components/ops/data-flow/data-flow-view")
    const root = await render(<DataFlowView flow={flow} roles={{}} nowMs={NOW} xemBaiGoc />)
    const stamp = txt(root.querySelector("[data-flow-stamp]"))
    console.log(`# DC-AC-3 dấu: «${stamp}» · giờ VN của computed_at ${hhmm}`)
    assert.match(stamp, new RegExp(`^Số tính lúc \\d{4}-\\d{2}-\\d{2} ${hhmm} \\(GMT\\+7\\)$`))
    assert.equal(root.querySelector("[data-facts-stamp]"), null, "máy thu không ghi «từ máy thu» như máy chủ")
  })
})

// ---------- AC-4: khối dataFlow ----------
const KEYS: Record<string, string[]> = {
  "": ["sources", "days", "groups", "shortStay", "mix", "enrichPending"],
  "sources[]": ["source", "received", "readable", "offers", "linked", "testRejected", "withWard", "withType", "withPriceArea", "complete", "highConfidence", "latestAt", "approx"],
  "days[]": ["day", "source", "received", "readable", "offers", "linked"],
  "groups[]": ["group", "source", "received", "readable", "offers", "latestAt"],
  shortStay: ["received", "stored", "withWard", "latestAt"],
  mix: ["sale", "rentLt", "shortStay"],
}
/** Mọi đường khoá ngoài ma trận của khối (đệ quy mọi tầng); rỗng = sạch. */
function blockKeyProblems(block: Record<string, unknown>): string[] {
  const out: string[] = []
  const top = Object.keys(block).sort()
  if (JSON.stringify(top) !== JSON.stringify(["measured_at", "windows"])) out.push(`khối cấp một ${top.join(",")}`)
  const windows = (block.windows ?? {}) as Record<string, unknown>
  if (JSON.stringify(Object.keys(windows).sort()) !== JSON.stringify(["30d", "7d", "all"])) out.push(`cửa sổ ${Object.keys(windows).join(",")}`)
  const walk = (v: unknown, at: string) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, `${at}[]`))
    if (!v || typeof v !== "object") return
    const allow = KEYS[at]
    for (const [k, x] of Object.entries(v)) {
      const p = at ? `${at}.${k}` : k
      if (!allow?.includes(k)) out.push(`khối mang trường ngoài danh sách: ${p}`)
      else if (x && typeof x === "object") walk(x, at ? p : k)
    }
  }
  for (const f of Object.values(windows)) walk(f, "")
  return [...new Set(out)]
}

describe("DC-AC-4 khối dataFlow", () => {
  test("DC-AC-4 khối dataFlow — ba cửa sổ, measured_at = computed_at cũ nhất, ma trận khoá", async () => {
    ready()
    const b = PAYLOAD.blocks.dataFlow as { measured_at: string; windows: Record<W, FF>; error?: string }
    assert.ok(b && !b.error, `khối dataFlow lỗi: ${b?.error}`)
    const min = (await admin.query(`SELECT (extract(epoch FROM min(computed_at)) * 1000)::float8 AS ms, (extract(epoch FROM max(computed_at)) * 1000)::float8 AS mx FROM "${S_LOCAL}".data_flow_snapshot`)).rows[0]
    console.log(`# DC-AC-4 measured_at ${b.measured_at} · computed_at cũ nhất ${new Date(min.ms).toISOString()} · mới nhất ${new Date(min.mx).toISOString()} · pushedAt ${PAYLOAD.pushedAt}`)
    assert.ok(Math.abs(Date.parse(b.measured_at) - min.ms) < 1, "measured_at phải bằng computed_at cũ nhất của bảng")
    assert.ok(min.mx - min.ms > 3_600_000, "đối chứng: ba dòng phải có computed_at khác nhau")
    for (const w of WINDOWS) assert.deepStrictEqual(b.windows[w], await factsOf(S_LOCAL, w), `cửa sổ ${w} ≠ bảng`)
    assert.deepEqual(blockKeyProblems(b), [], "bản tin thật phải sạch ma trận khoá")
    // Chiều đỏ cùng ca: chèn mã nhóm / mã tin vào khối thật.
    const m1 = structuredClone(b) as unknown as { windows: Record<W, { groups: Record<string, unknown>[]; sources: Record<string, unknown>[] }> }
    m1.windows.all.groups[0].groupId = "group:1000000000000000001"
    assert.ok(blockKeyProblems(m1 as never).includes("khối mang trường ngoài danh sách: groups[].groupId"), blockKeyProblems(m1 as never).join(" | "))
    const m2 = structuredClone(b) as unknown as typeof m1
    m2.windows["7d"].sources[0].offerId = "o1"
    assert.ok(blockKeyProblems(m2 as never).includes("khối mang trường ngoài danh sách: sources[].offerId"), blockKeyProblems(m2 as never).join(" | "))
  })
  test("DC-AC-4 bảng vắng — khối chỉ có measured_at và error", async () => {
    ready()
    await makeOpsSchema(admin, S_NOFLOW)
    const r = await push(S_NOFLOW)
    assert.equal(r.code, 0, r.stderr.slice(0, 600))
    const b = r.payload!.blocks.dataFlow
    console.log(`# DC-AC-4 bảng vắng: ${JSON.stringify(Object.keys(b))} · ${String(b.error).slice(0, 80)}`)
    assert.deepEqual(Object.keys(b).sort(), ["error", "measured_at"])
    assert.match(String(b.error), /^không đo được/)
  })
})

// ---------- AC-5: soát tầng A ----------
describe("DC-AC-5 soát tầng A", () => {
  test("DC-AC-5 soát tầng A — tên nhóm thường qua, tên nhóm mang tên nguồn thật bị chặn", async () => {
    ready()
    const chan = (stderr: string) => stderr.split("\n").filter((l) => l.startsWith("FACTS CHẶN [tầng A]"))
    const sach = await push(S_LOCAL, ["--kho"])
    console.log(`# DC-AC-5 bản tin thường: mã ${sach.code} · ${sach.stdout.trim().split("\n").pop()}`)
    assert.equal(sach.code, 0, sach.stderr.slice(0, 400))
    assert.deepEqual(chan(sach.stderr), [])
    assert.match(sach.stdout, /dataFlow đo được/)
    // Một bài cũ hơn 30 ngày (chỉ vào cửa sổ «all») trong nhóm mang tên nguồn thật lấy từ source_registry của lược đồ.
    await makeLocal(S_TA, async (s) => {
      const { rows } = await admin.query(`SELECT real_name FROM "${s}".source_registry WHERE real_name IS NOT NULL ORDER BY code LIMIT 1`)
      assert.equal(rows.length, 1, "source_registry không có tên thật để thử")
      await admin.query(
        `INSERT INTO "${s}".stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, captured_at)
         VALUES ('ta1', 'hanoi__zalo-agent__2026-09-01T090000', 'openclaw-hook', $1, 'bài', $2, $2)`,
        [`Nhóm ${rows[0].real_name}`, vn("2026-09-01T09:00:00")],
      )
    })
    const ban = await push(S_TA, ["--kho"])
    const lines = chan(ban.stderr)
    console.log(`# DC-AC-5 tên nhóm mang tên nguồn: mã ${ban.code} · ${lines.join(" | ")}`)
    assert.equal(ban.code, 1)
    const df = lines.filter((l) => l.startsWith("FACTS CHẶN [tầng A] blocks.dataFlow"))
    assert.equal(df.length, 1, `cần đúng một dòng chặn ở khối dataFlow: ${lines.join(" | ")}`)
    assert.match(df[0], /^FACTS CHẶN \[tầng A\] blocks\.dataFlow\.windows\.all\.groups\[\d+\]\.group S0\d$/)
  })
})

// ---------- AC-6: route trên cloud ----------
/** Vấn đề của trang cloud dựng xong; rỗng = đúng. */
function cloudPageProblems(root: Element, flow: DF, block: FF): string[] {
  const out: string[] = []
  const t = txt(root)
  if (t.includes("Chỉ xem ở máy thu")) out.push("trang cloud vẫn vẽ khung chỉ-máy-thu")
  if (flow.mode !== "cloud") out.push(`nhánh ${flow.mode}, không phải cloud`)
  const dong = [...root.querySelectorAll("ul.sr-only li")].map((li) => txt(li))
  for (const s of block.sources.filter((x) => x.received > 0)) {
    if (!dong.some((l) => l.includes(s.source) && l.endsWith(`tới Bài nhận: ${s.received}`))) out.push(`đường ống thiếu «${s.source} tới Bài nhận: ${s.received}»`)
    // Lưới «Chất lượng từng chặng» = bảng có cột «Nút thắt» (`health`); ô chặng (StageCell) ghi số ở span đậm đầu.
    const table = root.querySelector("th[data-col-id='health']")?.closest("table")
    const cols = [...(table?.querySelectorAll("thead th") ?? [])].map((th) => th.getAttribute("data-col-id"))
    const tr = [...(table?.querySelectorAll("tbody tr") ?? [])].find((r) => txt(r.querySelector("td")).includes(s.source))
    const cell = (col: string) => txt(tr?.querySelectorAll("td")[cols.indexOf(col)]?.querySelector("span.font-medium"))
    for (const [k, col, v] of [["Bài nhận", "received", s.received], ["Đọc được", "readable", s.readable], ["Tin rao", "offers", s.offers], ["Đủ trường lõi", "complete", s.complete], ["Gắn căn", "linked", s.linked]] as const)
      if (cell(col) !== String(v)) out.push(`hàng ${s.source} ô ${k} «${cell(col)}» ≠ ${v}`)
  }
  const tiles = new Map<string, string>()
  for (const el of root.querySelectorAll(".text-muted-foreground.text-xs.font-medium")) tiles.set(txt(el).trim(), txt(el.nextElementSibling?.querySelector("span")))
  for (const [label, key] of [["Bài nhận", "received"], ["Đọc được", "readable"], ["Tin rao mới", "offers"], ["Gắn căn", "linked"]] as const) {
    const sum = block.sources.reduce((a, s) => a + s[key], 0)
    if (tiles.get(label) !== String(sum)) out.push(`ô «${label}» ${tiles.get(label)} ≠ ${sum}`)
  }
  for (const k of ["days", "groups", "sources"] as const)
    try {
      assert.deepStrictEqual(flow[k], block[k])
    } catch {
      out.push(`route không chở ${k} của khối`)
    }
  return out
}
let mutSeq = 0
/** Bản sao một tệp của app ngay cạnh bản thật (import tương đối giữ nguyên), trả đường import. */
function mutantApp(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  const dst = p.replace(/\/([^/]+)\.(tsx?)$/, `/.dc-mut-${P}-${++mutSeq}-$1.$2`)
  assert.notEqual(dst, p, `bản đột biến không được ghi đè tệp thật ${rel}`)
  writeFileSync(dst, out)
  return { path: dst.replace(/\.tsx?$/, ""), done: () => rmSync(dst, { force: true }) }
}

/** Điểm ngày trên DOM: đi biểu đồ «Chặng theo ngày» bằng bàn phím (accessibilityLayer), đọc tooltip từng ngày. */
async function trendPoints(root: Element, n: number) {
  const svg = [...root.querySelectorAll("svg.recharts-surface")].find((x) => x.closest("[data-slot=frame]")?.textContent?.includes("Chặng theo ngày")) as HTMLElement | undefined
  assert.ok(svg, "không thấy biểu đồ «Chặng theo ngày»")
  const read = () => {
    const t = txt(svg.closest(".recharts-wrapper")?.querySelector(".recharts-tooltip-wrapper")).replace(/\s/g, "")
    const m = t.match(/^(\d+\/\d+)/)
    const v = (label: string) => Number(t.match(new RegExp(`${label}([\\d.]+)`))?.[1]?.replace(/\./g, "") ?? NaN)
    return { day: m?.[1] ?? "", received: v("Bàinhận"), readable: v("Đọcđược"), offers: v("Tinraomới"), linked: v("Gắncăn") }
  }
  await act(() => svg.focus())
  const out = [read()]
  for (let i = 1; i < n; i++) {
    await act(() => void svg.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })))
    out.push(read())
  }
  return out
}
/** Điểm ngày mong đợi tính độc lập từ khối: n ngày VN kết thúc ở ngày VN của NOW, cộng mọi nguồn, ngày không số = 0. */
function wantPoints(days: FF["days"], n: number) {
  const end = Date.parse(`${new Date(NOW + 7 * 3_600_000).toISOString().slice(0, 10)}T00:00:00Z`)
  return Array.from({ length: n }, (_, i) => {
    const iso = new Date(end - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10)
    const on = days.filter((d) => d.day === iso)
    const sum = (k: "received" | "readable" | "offers" | "linked") => on.reduce((a, d) => a + d[k], 0)
    return { day: `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`, received: sum("received"), readable: sum("readable"), offers: sum("offers"), linked: sum("linked") }
  })
}
/** Lưới «Theo nhóm thu»: số từng nhóm (Bài nhận · Đọc được · Tin rao) trên DOM so với khối. */
async function groupProblems(root: Element, groups: FF["groups"]): Promise<string[]> {
  const trigger = root.querySelector("[aria-label='Phân đoạn']") as HTMLElement | null
  assert.ok(trigger, "không thấy chọn phân đoạn")
  await act(() => trigger.click())
  const opt = [...document.querySelectorAll("[role=option]")].find((o) => txt(o).includes("Theo nhóm thu")) as HTMLElement | undefined
  assert.ok(opt, "không thấy lựa chọn «Theo nhóm thu»")
  await act(() => opt.click())
  const table = root.querySelector("th[data-col-id='health']")?.closest("table")
  const cols = [...(table?.querySelectorAll("thead th") ?? [])].map((th) => th.getAttribute("data-col-id"))
  const rows = [...(table?.querySelectorAll("tbody tr") ?? [])]
  const out: string[] = []
  if (rows.length !== groups.length) out.push(`lưới nhóm ${rows.length} hàng ≠ ${groups.length}`)
  for (const g of groups) {
    const tr = rows.find((r) => txt(r.querySelector("td")).startsWith(g.group) && txt(r.querySelector("td")).includes(g.source))
    if (!tr) {
      out.push(`lưới nhóm thiếu «${g.group}» (${g.source})`)
      continue
    }
    const cell = (col: string) => txt(tr.querySelectorAll("td")[cols.indexOf(col)]?.querySelector("span.font-medium"))
    for (const k of ["received", "readable", "offers"] as const) if (cell(k) !== String(g[k])) out.push(`nhóm «${g.group}» ${k} «${cell(k)}» ≠ ${g[k]}`)
  }
  return out
}

describe("DC-AC-6 route trên cloud", () => {
  test("DC-AC-6 route trên cloud — DataFlowContent ba cửa sổ trên lược đồ không stg_*", async () => {
    ready()
    const regs = (await admin.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = $1 AND table_name LIKE 'stg\\_%'`, [S_CLOUD])).rows[0].n
    assert.equal(regs, 0, "lược đồ máy chủ không được có bảng stg_*")
    const blocks = (PAYLOAD.blocks.dataFlow as { windows: Record<W, FF> }).windows
    for (const w of WINDOWS) {
      const el = await content(w, NOW)
      const root = await render(el)
      const p = cloudPageProblems(root, el.props.flow, blocks[w])
      console.log(`# DC-AC-6 ${w}: ${p.length ? p.join(" | ") : "khớp khối"}`)
      assert.deepEqual(p, [], `cửa sổ ${w}`)
      assert.doesNotMatch(txt(root), /Chưa có số theo ngày trong khoảng này/, "có điểm ngày trong khối mà biểu đồ ngày trống")
      // Điểm ngày trên DOM = tổng viết tay từ khối (độc lập với dailySeries), từng ngày của cửa sổ biểu đồ.
      const { chartDaysOf } = await import("../src/components/ops/data-flow/stage-trend-data")
      const n = chartDaysOf(w)
      const got = await trendPoints(root, n)
      const want = wantPoints(blocks[w].days, n)
      console.log(`# DC-AC-6 ${w} điểm ngày: ${got.filter((p) => p.received).map((p) => `${p.day}=${p.received}/${p.readable}/${p.offers}/${p.linked}`).join(" · ")}`)
      assert.deepEqual(got, want, `cửa sổ ${w}: điểm ngày trên DOM ≠ khối`)
      assert.ok(want.some((p) => p.received > 0), "đối chứng: cửa sổ phải có ngày có số")
    }
    // Số từng nhóm trên DOM: lưới «Theo nhóm thu», hai cửa sổ có số nhóm khác nhau.
    for (const w of ["all", "7d"] as const) {
      const root = await render(await content(w, NOW))
      const p = await groupProblems(root, blocks[w].groups)
      console.log(`# DC-AC-6 nhóm ${w}: ${p.length ? p.join(" | ") : blocks[w].groups.map((g) => `${g.group}=${g.received}/${g.readable}/${g.offers}`).join(" · ")}`)
      assert.deepEqual(p, [], `cửa sổ ${w}: lưới nhóm ≠ khối`)
    }
    // Chiều đỏ của hai phép đo DOM: khối đột biến (một điểm ngày, một số nhóm) → phép đo gọi tên chỗ lệch.
    {
      const root = await render(await content("7d", NOW))
      const i24 = blocks["7d"].days.findIndex((d) => d.day === "2026-10-24")
      const sai = wantPoints(blocks["7d"].days.map((d, i) => (i === i24 ? { ...d, received: d.received + 5 } : d)), 7)
      assert.notDeepEqual(await trendPoints(root, 7), sai, "phép đo điểm ngày phải phân biệt khối lệch một ngày")
      const p = await groupProblems(root, blocks["7d"].groups.map((g, i) => (i === 0 ? { ...g, readable: g.readable + 1 } : g)))
      assert.ok(p.some((m) => m.includes("readable")), `phép đo nhóm phải bắt số lệch: ${p.join(" | ")}`)
    }

    // Hồi quy sự cố prod 27/10: cloud giữ bảng stg_zalo_posts RỖNG (leak gate chỉ đòi 0 dòng) — trên Vercel trang vẫn đi
    // nhánh cloud. Bản nhận nơi chạy cũ (dò bảng có mặt) đi nhánh máy thu và vỡ ở review_queue (42P01).
    await admin.query(`CREATE TABLE "${S_CLOUD}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
    try {
      const el = await content("7d", NOW)
      const r = await render(el)
      const p = cloudPageProblems(r, el.props.flow, blocks["7d"])
      console.log(`# DC-AC-6 cloud có stg_zalo_posts rỗng: nhánh ${el.props.flow.mode} · ${p.length ? p.join(" | ") : "khớp khối"}`)
      assert.deepEqual(p, [], "cloud có bảng stg_* rỗng mà trang không đi nhánh cloud")
      // Chiều đỏ cùng ca: bản nhận nơi chạy cũ trên cùng lược đồ → nhánh máy thu → vỡ (bảng review_queue vắng ở cloud).
      const cu = mutantApp("src/lib/data-flow-queries.ts", (src) =>
        src.replace(
          `const mode = opts.mode ?? (process.env.VERCEL === "1" ? "cloud" : "local");`,
          "const mode = opts.mode ?? ((await q(`SELECT to_regclass('stg_zalo_posts')::text AS r`)).rows[0]?.r == null ? \"cloud\" : \"local\");",
        ),
      )
      try {
        const { getDataFlow: cuGet } = await import(cu.path)
        const loi = await asCloud(() => cuGet("7d", { now: NOW }).then((f: DF) => `nhánh ${f.mode}`, (e: { code?: string }) => `lỗi ${e.code}`))
        console.log(`# DC-AC-6 chiều đỏ dò bảng: ${loi}`)
        assert.equal(loi, "lỗi 42P01", "bản dò bảng có mặt phải vỡ đúng như prod 27/10")
      } finally {
        cu.done()
      }
    } finally {
      await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".stg_zalo_posts`)
    }

    // Đối chứng dương: cùng mô-đun, không VERCEL (máy thu, bảng tính sẵn có) → nhánh máy thu.
    await admin.query(`CREATE TABLE "${S_CLOUD}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".review_queue (LIKE public.review_queue INCLUDING DEFAULTS)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".data_flow_snapshot AS SELECT * FROM "${S_LOCAL}".data_flow_snapshot`)
    try {
      const el = await content("7d", NOW, { cloud: false })
      const r = await render(el)
      assert.equal(el.props.flow.mode, "local")
      assert.match(txt(r.querySelector("[data-flow-stamp]")), /^Số tính lúc /)
    } finally {
      await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".stg_zalo_posts, "${S_CLOUD}".review_queue, "${S_CLOUD}".data_flow_snapshot`)
    }

    // Chiều đỏ cùng ca: giữ cổng cũ «không thấy stg_* thì vẽ khung chỉ-máy-thu».
    const mut = mutantApp("src/components/ops/data-flow/data-flow-content.tsx", (s) =>
      s
        .replace(`import { DataFlowView } from "./data-flow-view";`, `import { DataFlowView } from "./data-flow-view";\nimport { LocalOnlyAlert } from "@/components/ops/local-only-alert";\nimport { localOnlyTable } from "@/lib/ops-queries";`)
        .replace(
          "}) {\n  const [flow, roles, user]",
          `}) {\n  if (await localOnlyTable("stg_zalo_posts")) return <LocalOnlyAlert title="Chỉ xem ở máy thu">Dòng chảy đọc bảng nạp thô.</LocalOnlyAlert>;\n  const [flow, roles, user]`,
        ),
    )
    try {
      const { DataFlowContent } = await import(mut.path)
      const el = (await asCloud(() => DataFlowContent({ window: "7d", nowMs: NOW, getUser: async () => null }))) as ReactElement
      const r = await render(el)
      const p = cloudPageProblems(r, { mode: "cloud", days: blocks["7d"].days, groups: blocks["7d"].groups, sources: blocks["7d"].sources } as DF, blocks["7d"])
      console.log(`# DC-AC-6 chiều đỏ giữ cổng stg_*: ${p[0]}`)
      assert.ok(p.includes("trang cloud vẫn vẽ khung chỉ-máy-thu"), p.join(" | "))
    } finally {
      mut.done()
    }
  })
})

// ---------- AC-7: bốn trạng thái ----------
async function withPayload<T>(edit: (p: Payload) => void, fn: () => Promise<T>): Promise<T> {
  const p = structuredClone(PAYLOAD)
  edit(p)
  await ingest(p)
  try {
    return await fn()
  } finally {
    await ingest(PAYLOAD)
  }
}
/** Ô số nào còn trên trang (đường ống, lưới chất lượng, ô chặng theo ngày) — vắng/lỗi phải rỗng. */
const numericRegions = (root: Element) =>
  [
    root.querySelectorAll("ul.sr-only li").length ? "đường ống" : "",
    txt(root).includes("Chất lượng từng chặng") ? "lưới chất lượng" : "",
    txt(root).includes("Chặng theo ngày") ? "chặng theo ngày" : "",
    /\b0 bài\b/.test(txt(root)) ? "«0 bài»" : "",
  ].filter(Boolean)

describe("DC-AC-7 bốn trạng thái", () => {
  test("DC-AC-7 bốn trạng thái — tươi, cũ, vắng, lỗi theo computed_at", async () => {
    ready()
    const { FACTS_STALE_MS } = await import("../src/lib/ops-facts")
    assert.equal(FACTS_STALE_MS, 45 * 60 * 1000, "ngưỡng cũ ≠ 45′ ADR-0014")
    const { fmtVnDateTime } = await import("../src/lib/format")
    const now = Date.now()
    const at = (min: number) => new Date(now - min * 60_000).toISOString()
    const setFlow = (min: number) => (p: Payload) => {
      p.pushedAt = at(0)
      p.blocks.dataFlow.measured_at = at(min)
    }

    const tuoi = await withPayload(setFlow(10), async () => render(await content("7d", now)))
    assert.equal(txt(tuoi.querySelector("[data-facts-stamp]")), `Số đo lúc ${fmtVnDateTime(at(10))} từ máy thu`)
    assert.equal(tuoi.querySelector("[data-facts-stale]"), null, "khối 10′ mà vẫn báo cũ")
    assert.ok(tuoi.querySelectorAll("ul.sr-only li").length > 0, "khối tươi phải vẽ đường ống")

    const cu = await withPayload(setFlow(180), async () => render(await content("7d", now)))
    const alert = txt(cu.querySelector("[data-facts-stale]"))
    console.log(`# DC-AC-7 cũ: «${alert}»`)
    assert.ok(alert.startsWith(`Máy thu không đẩy số từ ${fmtVnDateTime(at(180))}`), alert)
    assert.ok(cu.querySelectorAll("ul.sr-only li").length > 0, "khối cũ vẫn hiện số cũ")

    const vang = await withPayload((p) => void delete p.blocks.dataFlow, async () => render(await content("7d", now)))
    console.log(`# DC-AC-7 vắng: ${txt(vang).slice(0, 160)}`)
    assert.ok(txt(vang).includes("Chỉ đo ở máy thu"), "khối vắng phải ghi «Chỉ đo ở máy thu»")
    assert.deepEqual(numericRegions(vang), [], "khối vắng mà còn vẽ số")

    const loi = await withPayload(
      (p) => void (p.blocks.dataFlow = { measured_at: at(5), error: "không đo được: data_flow_snapshot thiếu cửa sổ 7d" }),
      async () => render(await content("7d", now)),
    )
    console.log(`# DC-AC-7 lỗi: ${txt(loi.querySelector("[data-flow-error]"))}`)
    assert.match(txt(loi.querySelector("[data-flow-error]")), /không đo được/)
    assert.deepEqual(numericRegions(loi), [], "khối lỗi mà còn vẽ số")
  })
})

// ---------- AC-8: tin mới nhất trên cloud ----------
describe("DC-AC-8 tin mới nhất trên cloud", () => {
  test("DC-AC-8 tin mới nhất trên cloud — sale_offers cloud, bậc levelOf, «Bài gốc chỉ xem ở máy thu»", async () => {
    ready()
    const { getDataFlow } = await import("../src/lib/data-flow-queries")
    const { levelLabel, levelOf } = await import("../src/lib/data-level")
    const flow = await asCloud(() => getDataFlow("all", { now: NOW }))
    assert.equal(flow.mode, "cloud")
    assert.deepEqual(flow.records.map((r) => r.offerId).sort(), OFFERS.map((o) => o[0]).sort(), "records phải là tin của sale_offers cloud")
    assert.ok(flow.records.every((r) => r.postText === null && r.postGroup === null), "cloud không có bài gốc")
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const root = await render(<RecordsGrid records={flow.records} roles={{}} cloud xemBaiGoc />)
    const rows = [...root.querySelectorAll("tbody tr[data-row-id]")]
    assert.equal(rows.length, flow.records.length)
    // Hàng không mang mã tin (lưới đánh số hàng) → so bội tập bậc trên lưới với levelOf của records.
    const labels = [...new Set(flow.records.map((r) => levelLabel(levelOf(r))))]
    const onGrid = rows.map((tr) => labels.filter((l) => txt(tr).includes(l)))
    assert.ok(onGrid.every((l) => l.length === 1), `mỗi hàng đúng một bậc: ${JSON.stringify(onGrid)}`)
    const count = (xs: string[]) => Object.fromEntries([...new Set(xs)].sort().map((x) => [x, xs.filter((y) => y === x).length]))
    console.log(`# DC-AC-8 bậc trên lưới ${JSON.stringify(count(onGrid.flat()))}`)
    assert.deepEqual(count(onGrid.flat()), count(flow.records.map((r) => levelLabel(levelOf(r)))), "bậc trên lưới ≠ levelOf")
    await act(() => (rows[0].querySelector("button") as HTMLElement).click())
    const d = dialogs()[0]
    console.log(`# DC-AC-8 hồ sơ cloud: ${/Bài gốc chỉ xem ở máy thu/.test(txt(d))}`)
    assert.match(txt(d), /Bài gốc chỉ xem ở máy thu\./)
    assert.equal(d.querySelector("blockquote"), null, "cloud không có khối bài gốc")
    // Đối chứng dương: cùng tin ở máy thu có bài gốc.
    const q = await schemaQuery(S_LOCAL)
    let local: DF
    try {
      local = await getDataFlow("all", { now: NOW, query: q.query })
    } finally {
      await q.end()
    }
    const o1 = local.records.find((r) => r.offerId === "o1")!
    assert.equal(o1.postText, "bài thử")
    const { RecordSheet } = await import("../src/components/ops/data-flow/record-sheet")
    await render(<RecordSheet record={o1} roles={{}} xemBaiGoc onOpenChange={() => {}} />)
    assert.match(txt(dialogs()[0]?.querySelector("blockquote")), /bài thử/)
    assert.doesNotMatch(txt(dialogs()[0]), /Bài gốc chỉ xem ở máy thu/)
  })
})

// ---------- AC-9: lịch, FILL, leak gate ----------
const SYNC_SH = join(ROOT, "scripts/cloud-sync.sh")
function orderProblems(sh: string): string[] {
  const lines = sh.split("\n")
  const refresh = lines.findIndex((l) => /^job_run cloud-sync \S+ .*pipeline\/sql\/600_data_flow\.sql"?$/.test(l))
  const pushAt = lines.findIndex((l) => /^job_run cloud-sync push-ops-facts /.test(l))
  if (refresh < 0) return ["không có bước job_run chạy 600_data_flow.sql"]
  if (pushAt < 0) return ["không có bước push-ops-facts"]
  return refresh < pushAt ? [] : ["làm tươi phải chạy trước push-ops-facts"]
}
/** Chạy sync-pii.test.mjs trên bản sao thư mục pipeline (symlink mọi thứ, chép test + sync-cloud qua `fn`). */
function syncPiiOn(fn: (s: string) => string) {
  const pipe = join(ROOT, "pipeline")
  const dir = mkdtempSync(join(tmpdir(), "dc-pii-"))
  try {
    for (const name of readdirSync(pipe)) if (!["sync-cloud.mjs", "sync-pii.test.mjs"].includes(name)) symlinkSync(join(pipe, name), join(dir, name))
    cpSync(join(pipe, "sync-pii.test.mjs"), join(dir, "sync-pii.test.mjs"))
    writeFileSync(join(dir, "sync-cloud.mjs"), fn(readFileSync(join(pipe, "sync-cloud.mjs"), "utf8")))
    // Bỏ NODE_TEST_CONTEXT của bộ chạy cha: thiếu bước này tiến trình con báo về cha và luôn thoát 0.
    const env = { ...process.env }
    delete env.NODE_TEST_CONTEXT
    const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "sync-pii.test.mjs"], { cwd: dir, encoding: "utf8", env })
    return { code: r.status, out: `${r.stdout}${r.stderr}` }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
/** Cloud giả cho leakGate: `n` dòng ở data_flow_snapshot (null = bảng vắng), mọi kiểm khác sạch. */
const fakeCloud = (n: number | null) => async (sql: string) => {
  if (/table_name LIKE 'stg_%'/.test(sql)) return []
  const reg = sql.match(/to_regclass\('([^']+)'\)/)
  if (reg) return [{ r: n !== null && reg[1] === "data_flow_snapshot" ? "data_flow_snapshot" : null }]
  if (/FROM public\."?data_flow_snapshot"?/.test(sql)) return [{ n }]
  if (/FROM pg_roles WHERE rolname = 'anon'/.test(sql)) return [{ n: 1 }]
  if (/^WITH rel AS|information_schema\.columns/.test(sql.trim())) return []
  return [{ n: 0, r: null }]
}

describe("DC-AC-9 lịch, FILL, leak gate", () => {
  test("DC-AC-9 lịch, FILL, leak gate — 600 trước push-ops-facts, bảng chỉ ở máy thu", async () => {
    const sh = readFileSync(SYNC_SH, "utf8")
    assert.deepEqual(orderProblems(sh), [])
    const lines = sh.split("\n")
    const i = lines.findIndex((l) => l.includes("600_data_flow.sql") && l.startsWith("job_run"))
    const j = lines.findIndex((l) => l.startsWith("job_run cloud-sync push-ops-facts"))
    const swapped = [...lines]
    ;[swapped[i], swapped[j]] = [lines[j], lines[i]]
    assert.deepEqual(orderProblems(swapped.join("\n")), ["làm tươi phải chạy trước push-ops-facts"])

    const { FILL, leakGate } = await import("../../pipeline/sync-cloud.mjs")
    assert.ok(!FILL.includes("data_flow_snapshot"), "FILL không được chứa data_flow_snapshot")
    const that = syncPiiOn((s) => s)
    assert.equal(that.code, 0, that.out.slice(-800))
    const cay = syncPiiOn((s) => s.replace("export const FILL = [", 'export const FILL = ["data_flow_snapshot", '))
    const doCa = cay.out.split("\n").filter((l) => /^not ok .*data_flow_snapshot/.test(l))
    console.log(`# DC-AC-9 sync-pii: code thật ${that.code} · cấy bảng vào FILL ${cay.code} · ${doCa.join(" | ")}`)
    assert.notEqual(cay.code, 0)
    assert.equal(doCa.length, 1, `ca data_flow_snapshot phải đỏ khi cấy vào FILL:\n${cay.out.slice(-800)}`)

    const co = await leakGate(fakeCloud(3))
    const khong = await leakGate(fakeCloud(0))
    const vang = await leakGate(fakeCloud(null))
    console.log(`# DC-AC-9 leakGate: 3 dòng → ${co.join(", ")} · 0 dòng → ${khong.length} · vắng → ${vang.length}`)
    assert.ok(co.includes("data_flow_snapshot=3"), co.join(" | "))
    assert.ok(!khong.some((l: string) => l.includes("data_flow_snapshot")), khong.join(" | "))
    assert.ok(!vang.some((l: string) => l.includes("data_flow_snapshot")), vang.join(" | "))
  })
})

// ---------- AC-10: một định nghĩa ----------
const FACT_KEYS = ["sources", "days", "groups", "shortStay", "mix", "enrichPending"] as const
function oneDefProblems(local: DF, cloud: DF): string[] {
  const out: string[] = []
  for (const k of FACT_KEYS)
    try {
      assert.deepStrictEqual(cloud[k], local[k])
    } catch {
      out.push(`cloud ≠ máy thu: ${k}`)
    }
  return out
}

describe("DC-AC-10 một định nghĩa", () => {
  test("DC-AC-10 một định nghĩa — nhánh máy thu = nhánh cloud ở ba cửa sổ", async () => {
    ready()
    const { getDataFlow } = await import("../src/lib/data-flow-queries")
    const { FLOW_FACT_KEYS } = await import("../src/lib/data-flow-queries")
    const { readOpsFacts } = await import("../src/lib/ops-facts")
    assert.deepEqual([...FLOW_FACT_KEYS], [...FACT_KEYS], "danh sách khoá tổng hợp của app lệch ma trận viết trước")
    const q = await schemaQuery(S_LOCAL)
    try {
      for (const w of WINDOWS) {
        const local = await getDataFlow(w, { now: NOW, query: q.query })
        const cloud = await asCloud(() => getDataFlow(w, { now: NOW }))
        assert.equal(local.mode, "local")
        assert.equal(cloud.mode, "cloud")
        assert.deepEqual(oneDefProblems(local, cloud), [], `cửa sổ ${w}`)
        assert.ok(local.days.length > 0 && local.sources.length === 3, "đối chứng: snapshot có số")
        if (w === "7d") {
          // Chiều đỏ cùng ca: payload đột biến dời days[0].day sang ngày kế.
          const sai = await asCloud(() => getDataFlow(w, {
            now: NOW,
            readFacts: async (o) => {
              const f = structuredClone(await readOpsFacts(o))
              const days = (f.blocks.dataFlow!.data!.windows as Record<W, FF>)[w].days
              days[0] = { ...days[0], day: new Date(Date.parse(`${days[0].day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) }
              return f
            },
          }))
          const p = oneDefProblems(local, sai)
          console.log(`# DC-AC-10 chiều đỏ dời days[0]: ${p.join(" | ")}`)
          assert.deepEqual(p, ["cloud ≠ máy thu: days"])
        }
      }
    } finally {
      await q.end()
    }
  })
})
