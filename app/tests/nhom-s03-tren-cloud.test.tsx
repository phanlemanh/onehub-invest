// nhom-s03-tren-cloud.test.tsx — ON4 (ADR-0014): bảng nhóm S03 ghi đúng N nhóm bật và «Vào bảng thô» theo nhóm — máy thu đo
// trực tiếp, máy chủ đọc khối `s03` máy thu đẩy lên. Ma trận viết trước của hợp đồng (nhật ký cổng + cấu hình OpenClaw) nằm
// ở HOME tạm: bản tin do push-ops-facts THẬT dựng (pipeline/scripts/capture-ops-facts.mjs), đi qua handler POST
// /api/v1/ops/ingest THẬT; trang /ops/collections THẬT dựng ở chế độ máy chủ (VERCEL=1). Không chạm ~/.openclaw, không
// lệnh ghi OpenClaw nào. Tên ca mở đầu bằng mã AC.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import pg from "pg"

import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

// HOME giả cho CẢ tiến trình, đặt TRƯỚC mọi import động: zalo-admin.ts tính đường binary OpenClaw và tệp cấu hình theo HOME
// lúc import — trang máy thu gọi làm mới danh bạ nhóm ở nền, nên HOME thật sẽ chạy binary OpenClaw thật. Ở đây binary
// không tồn tại → lệnh nền thất bại im lặng, không gì chạm ~/.openclaw.
const BASE_HOME = mkdtempSync(join(tmpdir(), "on4-base-home-"))
const REAL_HOME = process.env.HOME
process.env.HOME = BASE_HOME
const S_CLOUD = `on4_cloud_${process.pid}`
const S_LOCAL = `on4_local_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "on4-thu"
const RAW_LOCAL = ["source_registry", "review_queue", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "airdna_listings", "listings", "stg_abnb_listings", "sale_offers"]
const CLOUD_SYNCED = ["listings"]

// ---- ma trận viết trước (hợp đồng, mục Criteria) ----
const id = (n: number) => `group:10000000000000000${String(n).padStart(2, "0")}`
const [T1, T2, T3, T4, D4, D5, D6, D7, D8, X] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id)
const on = { enabled: true }
const CFG = {
  channels: {
    zalouser: {
      groups: { [T1]: on, [T2]: on, [T3]: on, [T4]: on },
      accounts: {
        default: { groups: { [T1]: on, [T2]: on, [T3]: on, [D4]: on, [D5]: on, [D6]: on, [D7]: on, [D8]: { enabled: false } } },
        b: { profile: "b" },
        c: { profile: "c", groups: { [D4]: on, [X]: { allow: false } } },
      },
    },
  },
}
const N = 8
const UNION = [T1, T2, T3, T4, D4, D5, D6, D7]
const C_ID = "9000000000000000003"
const CONFIG_DIGITS = [T1, T2, T3, T4, D4, D5, D6, D7, D8, X].map((k) => k.replace("group:", ""))
/** Nhật ký cổng của ma trận — mốc 10 phút trước để funnel 7 ngày và «Hoạt động» (≤ 24h) đều tính. */
function gateLog(): string {
  const t = (s: number) => new Date(Date.now() - 600_000 + s * 1000).toISOString()
  return [
    `${t(1)} post 202 {"accepted":3,"duplicates":0} group=Nhóm A p=0.99 account=default by=Người bán 1`,
    `${t(2)} post 202 {"accepted":2,"duplicates":1} group=Nhóm A p=0.97 account=default by=Người bán 2`,
    `${t(3)} skip {"accepted":4} group=Nhóm A account=default`,
    `${t(4)} post 500 {"accepted":7} group=Nhóm A account=default`,
    `${t(5)} post 202 {} group=Nhóm B p=0.95 account=default`,
    `${t(6)} post 202 {"accepted":1,"duplicates":0} group=${C_ID} p=0.93 account=default`,
  ].join("\n") + "\n"
}
const HOME_FILES = (cfg: unknown = CFG, { log = true } = {}) => ({
  ...(log ? { ".openclaw/logs/oneinvest-zalo-pipe.log": gateLog() } : {}),
  ...(cfg === null ? {} : { ".openclaw/openclaw.json": typeof cfg === "string" ? cfg : JSON.stringify(cfg) }),
})

type Group = { name: string | null; seen: number; passed: number; skipped: number; accepted: number | null }
type Payload = Record<string, unknown> & {
  pushedAt: string
  zaloGroups: Group[]
  zaloAccounts: { accountId: string; enabledGroups: string[] }[]
  blocks: Record<string, Record<string, unknown> & { measured_at: string; error?: string; allowlistEnabled?: number; groups?: Group[] }>
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
    for (const t of CLOUD_SYNCED) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    await makeOpsSchema(admin, S_LOCAL)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  process.env.HOME = REAL_HOME
  rmSync(BASE_HOME, { recursive: true, force: true })
  for (const s of [S_CLOUD, S_LOCAL]) await dropOpsSchema(admin, s).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---- bên ghi thật → handler ingest thật ----
async function push({ script, cfg, log = true }: { script?: string; cfg?: unknown; log?: boolean } = {}): Promise<Payload> {
  const r = (await captureOpsFacts({
    ...(script ? { script } : {}),
    env: { DATABASE_URL: schemaUrl(S_LOCAL) },
    home: HOME_FILES(cfg, { log }),
  })) as { code: number; stderr: string; payload: Payload }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  return r.payload
}
const ingest = async (payload: Payload) => {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer on4-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}
const shift = (iso: string, min: number) => new Date(Date.parse(iso) + min * 60_000).toISOString()
/** Cả bản tin lùi 46′ (mốc đẩy + mọi khối) — cũ theo ADR-0014. */
function stalePayload(p: Payload): Payload {
  const q = structuredClone(p)
  q.pushedAt = shift(q.pushedAt, -46)
  for (const b of Object.values(q.blocks)) b.measured_at = shift(b.measured_at, -46)
  return q
}
/** HOME tạm cho hàm app đọc cấu hình / nhật ký ở máy thu (os.homedir() đọc $HOME lúc gọi). */
async function withHome<T>(fn: () => Promise<T>, { cfg = CFG as unknown, log = true } = {}): Promise<T> {
  const home = mkdtempSync(join(tmpdir(), "on4-home-"))
  for (const [rel, text] of Object.entries(HOME_FILES(cfg, { log }))) {
    mkdirSync(join(home, rel, ".."), { recursive: true })
    writeFileSync(join(home, rel), text)
  }
  const prev = process.env.HOME
  process.env.HOME = home
  try {
    return await fn()
  } finally {
    process.env.HOME = prev
    rmSync(home, { recursive: true, force: true, maxRetries: 3 })
  }
}

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
const text = (h: string) => h.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
/** Bảng nhóm S03: từ khung `#nhom-s03` tới vùng kế (Alert gom trên máy chủ, hết trang ở máy thu). */
const table = (h: string) => {
  const i = h.indexOf('id="nhom-s03"')
  assert.ok(i >= 0, "không thấy bảng nhóm S03")
  const j = h.indexOf('id="tren-may-thu"', i)
  return h.slice(i, j > i ? j : undefined)
}
/** Hàng bảng: tên nhóm → ô «Vào bảng thô» (cột thứ 5: tên, trạng thái, thấy, qua cổng, vào bảng thô). */
function acceptedByName(t: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of t.matchAll(/data-row-id="[^"]+"([\s\S]*?)<\/tr>/g)) {
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => text(c[1]).trim())
    out.set(cells[0], cells[4])
  }
  return out
}
/** Alert gom «Phần còn lại…» của máy chủ: từ `#tren-may-thu` tới lưới Máy móc (hay hết 3000 ký tự khi chưa có lưới). */
const alertText = (h: string) => {
  const i = h.indexOf('id="tren-may-thu"')
  assert.ok(i >= 0, "không thấy Alert gom")
  const j = h.indexOf(">Máy móc<", i)
  return text(h.slice(i, j > i ? j : i + 3000))
}
const description = (t: string) => text(t).match(/danh sách cho phép đang bật (\d+) nhóm/)?.[1]

// ---- đột biến cho chiều đỏ ----
let mutantSeq = 0
/** Bản sao một tệp .mjs ngay cạnh bản thật (import tương đối giữ nguyên) — tệp ẩn, tên riêng mỗi lần (ESM giữ module). */
function mutantMjs(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  const dst = p.replace(/\/([^/]+)\.mjs$/, `/.on4-mut-${process.pid}-${++mutantSeq}-$1.mjs`)
  writeFileSync(dst, out)
  return { path: dst, done: () => rmSync(dst, { force: true }) }
}
function mutantApp(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  const dst = p.replace(/\/([^/]+)\.tsx?$/, `/.on4-mut-${process.pid}-${++mutantSeq}-$1.tsx`)
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
const COL_VIEW_TABLES = { rel: "src/components/ops/collections/collections-view.tsx", spec: "@/components/ops/collections-tables" }
const PAGE_CLOUD = { rel: "src/app/ops/collections/page.tsx", spec: "@/lib/ops-cloud" }

describe("ON4-AC-1 «Vào bảng thô» theo nhóm", () => {
  const byName = (groups: { name: string; accepted: number | null }[]) => Object.fromEntries(groups.map((g) => [g.name, g.accepted]))
  const WANT = { "Nhóm A": 5, "Nhóm B": null, [C_ID]: 1 }
  test("ON4-AC-1 ma trận nhật ký viết trước: parseLog bên ghi cho A = 5, B = null, C = 1, funnel accepted = 6; gateByGroup trang máy thu ra cùng giá trị theo nhóm", async () => {
    const { parseLog } = await import("../../pipeline/lib/ops-flow.mjs")
    const { gateByGroup } = await import("../src/lib/collections-queries")
    const log = gateLog()
    const w = parseLog(log)
    assert.deepEqual(byName(w.groups), WANT, "bên ghi theo nhóm")
    assert.equal(w.funnel.last7.accepted, 6, "funnel tổng")
    const local = [...gateByGroup(log).values()]
    assert.deepEqual(byName(local), WANT, "trang máy thu theo nhóm")
  })
  const reds: [string, (s: string) => string, Record<string, number | null>][] = [
    [
      "ON4-AC-1 bản sao parseLog không cộng accepted vào hàng nhóm → bắt (A = 0)",
      (s) => s.replace("if (n != null) { r.accepted += Number(n); r.acceptedSeen = true; }", "if (n != null) { r.acceptedSeen = true; }"),
      { "Nhóm A": 0 },
    ],
    [
      "ON4-AC-1 bản sao cộng accepted của dòng skip → bắt (A = 9)",
      (s) => s.replace("} else if (/ skip /.test(line)) r.skipped++;\n      r.lastEventAt", '} else if (/ skip /.test(line)) { r.skipped++; r.accepted += Number(line.match(/"accepted":(\\d+)/)?.[1] ?? 0); }\n      r.lastEventAt'),
      { "Nhóm A": 9 },
    ],
    [
      "ON4-AC-1 bản sao cộng accepted của mọi dòng post → bắt (A = 12)",
      (s) => s.replace('      if (line.includes(" post 202")) {\n        r.passed++;', '      if (/ post \\d+/.test(line)) {\n        r.passed++;'),
      { "Nhóm A": 12 },
    ],
    [
      "ON4-AC-1 bản sao ghi 0 cho post 202 thiếu accepted → bắt (B = 0)",
      (s) => s.replace("accepted: r.passed > 0 && !acceptedSeen ? null : r.accepted", "accepted: r.accepted"),
      { "Nhóm B": 0 },
    ],
  ]
  for (const [name, fn, wrong] of reds) {
    test(name, async () => {
      const m = mutantMjs("pipeline/lib/ops-flow.mjs", fn)
      try {
        const got = byName((await import(m.path)).parseLog(gateLog()).groups)
        for (const [g, v] of Object.entries(wrong)) assert.equal(got[g], v, `bản sao phải cho ${g} = ${v}`)
        assert.notDeepEqual(got, WANT, "phép đo phải bắt bản sao")
      } finally {
        m.done()
      }
    })
  }
})

describe("ON4-AC-2 một định nghĩa «nhóm bật»", () => {
  test("ON4-AC-2 cấu hình tạm ở HOME giả theo ma trận hợp đồng: khối s03 do push-ops-facts THẬT dựng và readZaloAllowlist trang máy thu cùng ra N = 8", async () => {
    ready()
    const p = await push()
    assert.equal(p.blocks.s03.error, undefined, String(p.blocks.s03.error))
    assert.equal(p.blocks.s03.allowlistEnabled, N, "khối s03")
    const { readZaloAllowlist } = await import("../src/lib/collections-queries")
    const local = await withHome(() => readZaloAllowlist())
    assert.ok(local, "cấu hình tạm đọc được")
    assert.deepEqual(local.filter((a) => a.enabled).map((a) => a.groupId).sort(), [...UNION].sort(), "trang máy thu")
    assert.equal(local.filter((a) => a.enabled).length, N)
  })
  test("ON4-AC-2 zaloAccounts[].enabledGroups của cùng bản tin: default 7, b {T1…T4}, c {D4}, hợp lại = 8 nhóm", async () => {
    ready()
    const p = await push()
    const acc = Object.fromEntries(p.zaloAccounts.map((a) => [a.accountId, [...a.enabledGroups].sort()]))
    assert.deepEqual(acc, { default: [T1, T2, T3, D4, D5, D6, D7].sort(), b: [T1, T2, T3, T4].sort(), c: [D4] })
    assert.deepEqual([...new Set(p.zaloAccounts.flatMap((a) => a.enabledGroups))].sort(), [...UNION].sort())
  })
  const z = CFG.channels.zalouser
  const reds: [string, (s: string) => string, number][] = [
    ["ON4-AC-2 bản sao chỉ đọc groups cấp ngoài → bắt (4)", (s) => s.replace("const byAccount = new Map(ids.map((id) => [id, enabled(groupsOf(id))]));", "const byAccount = new Map([[\"default\", enabled(z?.groups ?? {})]]);"), 4],
    ["ON4-AC-2 bản sao không kế thừa → bắt (7)", (s) => s.replace("return z.accounts?.[id]?.groups ?? z.groups ?? {};", "return z.accounts?.[id]?.groups ?? {};"), 7],
    ["ON4-AC-2 bản sao không khử trùng mã → bắt (12)", (s) => s.replace("union: [...new Set([...byAccount.values()].flat())]", "union: [...byAccount.values()].flat()"), 12],
    ["ON4-AC-2 bản sao bỏ qua allow:false → bắt (9)", (s) => s.replace("v?.allow !== false && v?.enabled !== false", "v?.enabled !== false"), 9],
    ["ON4-AC-2 bản sao bỏ qua enabled:false → bắt (9)", (s) => s.replace("v?.allow !== false && v?.enabled !== false", "v?.allow !== false"), 9],
  ]
  for (const [name, fn, wrong] of reds) {
    test(name, async () => {
      const m = mutantMjs("scripts/lib/ops-local.mjs", fn)
      try {
        const got = (await import(m.path)).readS03Allowlist(z).union.length
        assert.equal(got, wrong, `bản sao phải cho ${wrong}`)
        assert.notEqual(got, N, "phép đo phải bắt bản sao")
      } finally {
        m.done()
      }
    })
  }
})

describe("ON4-AC-3 bảng nhóm S03 trên máy chủ", () => {
  test("ON4-AC-3 bản tin push-ops-facts THẬT qua handler ingest thật, trang /ops/collections THẬT chế độ máy chủ: bảng nhóm S03, «đang bật 8 nhóm», A = 5, B = «—», C = 1 «Nhóm chưa có tên», chân bảng «mã nhóm chỉ xem ở máy thu», Alert không còn «nhóm S03»", async () => {
    ready()
    await ingest(await push())
    const h = await renderCollections()
    const t = table(h)
    assert.equal(description(t), String(N), "mô tả bảng")
    const acc = acceptedByName(t)
    assert.equal(acc.get("Nhóm A"), "5")
    assert.equal(acc.get("Nhóm B"), "—")
    assert.equal(acc.get("Nhóm chưa có tên"), "1")
    assert.ok(text(t).includes("mã nhóm chỉ xem ở máy thu"), "chân bảng máy chủ")
    const alert = alertText(h)
    assert.ok(!alert.includes("nhóm S03"), `Alert gom không còn «nhóm S03»: ${alert}`)
    assert.ok(h.includes('href="#nhom-s03"'), "nút ô nhóm S03 trỏ bảng")
  })
  test("ON4-AC-3 khối s03 của bản tin THẬT và HTML trang không chứa mã 9000000000000000003 hay mã nhóm nào của cấu hình tạm", async () => {
    ready()
    const p = await push()
    // đối chứng dương: nhật ký tạm thật có mã ấy, và khoá zaloGroups cũ vẫn mang nó
    assert.ok(gateLog().includes(C_ID) && p.zaloGroups.some((g) => g.name === C_ID), "đối chứng: mã có trong nhật ký và zaloGroups")
    const s03 = JSON.stringify(p.blocks.s03)
    await ingest(p)
    const h = await renderCollections()
    for (const d of [C_ID, ...CONFIG_DIGITS]) {
      assert.ok(!s03.includes(d), `khối s03 chứa mã ${d}`)
      assert.ok(!h.includes(d), `trang chứa mã ${d}`)
    }
  })
  test("ON4-AC-3 bản sao bên ghi để mã làm tên nhóm → bắt", async () => {
    ready()
    const script = mutantPush("push-ops-facts.mjs", (s: string) => s.replace("name: g.name && !isId(g.name) ? g.name : null,", "name: g.name,"))
    const p = await push({ script })
    assert.ok(JSON.stringify(p.blocks.s03).includes(C_ID), "bản sao phải để mã vào khối s03")
    await ingest(p)
    assert.ok((await renderCollections()).includes(C_ID), "phép đo phải bắt mã trên trang")
  })
  test("ON4-AC-3 bản sao bảng máy chủ in mã nhóm ở chân bảng → bắt", async () => {
    ready()
    await ingest(await push())
    const m = mutantChain({ rel: "src/components/ops/collections-tables.tsx", fn: (s) => s.replace("{cloud ? (\n            <>Danh sách cho phép: mã nhóm chỉ xem ở máy thu.</>", "{false ? (\n            <>Danh sách cho phép: mã nhóm chỉ xem ở máy thu.</>") }, [COL_VIEW_TABLES, COL_PAGE])
    try {
      const t = text(table(await renderCollections(m.path)))
      assert.ok(t.includes("Danh sách cho phép (mã nhóm, chưa ghép tên)"), "bản sao in nhánh liệt mã")
      assert.ok(!t.includes("mã nhóm chỉ xem ở máy thu"), "phép đo phải bắt bản sao")
    } finally {
      m.done()
    }
  })
})

describe("ON4-AC-4 chưa có khối s03", () => {
  test("ON4-AC-4 lược đồ như máy chủ không bản tin: không bảng nhóm S03, Alert liệt «nhóm S03», 0 chữ «0 nhóm»", async () => {
    ready()
    await admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)
    const h = await renderCollections()
    assert.ok(!h.includes('id="nhom-s03"'), "không bảng nhóm")
    assert.ok(alertText(h).includes("nhóm S03"), "Alert gom liệt «nhóm S03»")
    assert.ok(!/\b0 nhóm\b/.test(text(h)), "không chữ «0 nhóm»")
  })
  test("ON4-AC-4 khối s03 lỗi ở bên ghi thật (cấu hình tạm không đọc được): như không bản tin, các ô khác vẫn có số", async () => {
    ready()
    const p = await push({ cfg: "{ hỏng" })
    assert.ok(typeof p.blocks.s03.error === "string", "bên ghi thật phải báo lỗi khối s03")
    assert.equal(p.blocks.records24h.error, undefined)
    await ingest(p)
    const h = await renderCollections()
    assert.ok(!h.includes('id="nhom-s03"'), "không bảng nhóm")
    assert.ok(alertText(h).includes("nhóm S03"))
    assert.ok(!/\b0 nhóm\b/.test(text(h)), "không chữ «0 nhóm»")
    assert.ok(h.includes('id="luong"'), "vùng đọc khối khác vẫn dựng")
  })
  test("ON4-AC-4 nhật ký cổng không đọc được ở bên ghi thật → khối s03 lỗi, không bảng số 0", async () => {
    ready()
    const p = await push({ log: false })
    assert.match(String(p.blocks.s03.error), /nhật ký cổng không đọc được/, "bên ghi thật phải báo lỗi khối s03")
    assert.equal(p.blocks.s03.groups, undefined, "khối lỗi không mang hàng nhóm")
    await ingest(p)
    const h = await renderCollections()
    assert.ok(!h.includes('id="nhom-s03"'), "không bảng nhóm")
    assert.ok(alertText(h).includes("nhóm S03"), "Alert gom liệt «nhóm S03»")
  })
  test("ON4-AC-4 bản sao bên ghi nuốt lỗi đọc nhật ký → bắt (khối báo đo được)", async () => {
    ready()
    const script = mutantPush("push-ops-facts.mjs", (s: string) => s.replace("    if (logErr) throw new Error(", "    if (false) throw new Error("))
    const p = await push({ script, log: false })
    assert.equal(p.blocks.s03.error, undefined, "bản sao phải báo đo được — phép đo phải bắt")
  })
  test("ON4-AC-4 bản sao đọc khối lỗi như danh sách rỗng → bắt («0 nhóm»)", async () => {
    ready()
    await ingest(await push({ cfg: "{ hỏng" }))
    const m = mutantChain({ rel: "src/lib/ops-cloud.ts", fn: (s) => s.replace('function toCloudS03(b: Awaited<ReturnType<typeof readOpsFacts>>["blocks"]["s03"]): CloudS03 | null {\n  if (!b || b.state === "error" || !b.data) return null', 'function toCloudS03(b: Awaited<ReturnType<typeof readOpsFacts>>["blocks"]["s03"]): CloudS03 | null {\n  if (b?.state === "error") return { allowlistEnabled: 0, groups: [], stale: false }\n  if (!b || !b.data) return null') }, [PAGE_CLOUD])
    try {
      const h = await renderCollections(m.path)
      assert.ok(/\b0 nhóm\b/.test(text(h)), "bản sao hiện «0 nhóm» — phép đo phải bắt")
    } finally {
      m.done()
    }
  })
})

describe("ON4-AC-5 khối cũ", () => {
  test("ON4-AC-5 bản tin THẬT của AC-3, khối s03 lùi 46′: Alert vàng «Máy thu không đẩy số từ» có mặt, bảng giữ N = 8 và A = 5, 0 badge success-light trong bảng nhóm", async () => {
    ready()
    await ingest(stalePayload(await push()))
    const h = await renderCollections()
    assert.ok(text(h).includes("Máy thu không đẩy số từ"), "Alert vàng số cũ")
    const t = table(h)
    assert.equal(description(t), String(N))
    assert.equal(acceptedByName(t).get("Nhóm A"), "5")
    assert.ok(text(t).includes("Hoạt động"), "đối chứng: có nhóm «Hoạt động»")
    assert.equal((t.match(/bg-success\/10/g) ?? []).length, 0, "0 badge success-light trong bảng nhóm")
  })
  test("ON4-AC-5 bản sao bảng không nhận cờ số cũ → bắt", async () => {
    ready()
    await ingest(stalePayload(await push()))
    const m = mutantChain({ rel: "src/components/ops/collections-tables.tsx", fn: (s) => s.replace("groupStatusBadge(row.original.lastSeenAt, stale)", "groupStatusBadge(row.original.lastSeenAt)") }, [COL_VIEW_TABLES, COL_PAGE])
    try {
      const t = table(await renderCollections(m.path))
      assert.ok((t.match(/bg-success\/10/g) ?? []).length > 0, "bản sao còn badge xanh — phép đo phải bắt")
    } finally {
      m.done()
    }
  })
})

describe("ON4-AC-5 số cũ mờ (đổi khuôn sau lượt 2)", () => {
  /** Ô «Vào bảng thô» của một nhóm (HTML thô của ô). */
  const cellHtml = (t: string, name: string, col = 4) => {
    for (const m of t.matchAll(/data-row-id="[^"]+"([\s\S]*?)<\/tr>/g)) {
      const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1])
      if (text(cells[0]).trim() === name) return cells[col]
    }
    return ""
  }
  test("ON4-AC-5 khối s03 cũ: mọi ô số của bảng nhóm mờ (text-muted-foreground), bản tin tươi thì không", async () => {
    ready()
    const p = await push()
    await ingest(p)
    assert.ok(!cellHtml(table(await renderCollections()), "Nhóm A").includes("text-muted-foreground"), "đối chứng: số tươi không mờ")
    await ingest(stalePayload(p))
    const t = table(await renderCollections())
    for (const col of [2, 3, 4]) assert.ok(cellHtml(t, "Nhóm A", col).includes("text-muted-foreground"), `cột ${col} của Nhóm A phải mờ khi số cũ`)
  })
  test("ON4-AC-5 bản sao bảng không làm mờ số cũ → bắt", async () => {
    ready()
    await ingest(stalePayload(await push()))
    const m = mutantChain({ rel: "src/components/ops/collections-tables.tsx", fn: (s) => s.replace("cloudCount(row.original.accepted, stale)", "cloudCount(row.original.accepted, false)") }, [COL_VIEW_TABLES, COL_PAGE])
    try {
      assert.ok(!cellHtml(table(await renderCollections(m.path)), "Nhóm A").includes("text-muted-foreground"), "bản sao không mờ — phép đo phải bắt")
    } finally {
      m.done()
    }
  })
  test("ON4-AC-5 bên ghi đo «Bài thử» 7 ngày thật: khối s03 mang số bài thử của DB, không gán 0", async () => {
    ready()
    const ins = (snap: string, i: number) =>
      admin.query(`INSERT INTO "${S_LOCAL}".stg_zalo_posts (post_id, snapshot_id, text, group_name, captured_at) VALUES ($1, $2, 'x', 'Nhóm A', now() - interval '1 hour')`, [`on4-${snap}-${i}`, snap])
    await ins("zalo-mock-on4", 1)
    await ins("zalo-mock-on4", 2)
    await ins("zalo-agent-on4", 3)
    try {
      const a = (await push()).blocks.s03.groups!.find((g) => g.name === "Nhóm A") as Group & { realPosts7d: number; mockPosts7d: number }
      assert.deepEqual([a.realPosts7d, a.mockPosts7d], [1, 2], "bài thật / bài thử 7 ngày")
    } finally {
      await admin.query(`DELETE FROM "${S_LOCAL}".stg_zalo_posts WHERE post_id LIKE 'on4-%'`)
    }
  })
})

describe("ON4-AC-6 máy thu", () => {
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
  test("ON4-AC-6 bộ bắt truy vấn thấy ops_heartbeat ở chế độ máy chủ (đối chứng dương)", async () => {
    ready()
    await ingest(await push())
    const { n } = await spyHeartbeat(() => renderCollections())
    assert.ok(n > 0, "bộ bắt phải thấy truy vấn ops_heartbeat")
  })
  test("ON4-AC-6 DB máy thu đủ bảng: bảng nhóm đo trực tiếp, N theo readZaloAllowlist mới, B = «—», chân bảng liệt mã nhóm rút gọn, 0 truy vấn ops_heartbeat", async () => {
    ready()
    for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    try {
      const { h, n } = await withHome(() => spyHeartbeat(() => renderCollections(undefined, { cloud: false })))
      const t = table(h)
      assert.equal(description(t), String(N), "mô tả bảng máy thu")
      assert.equal(acceptedByName(t).get("Nhóm B"), "—")
      assert.equal(acceptedByName(t).get("Nhóm A"), "5")
      assert.ok(text(t).includes("Danh sách cho phép (mã nhóm, chưa ghép tên)") && text(t).includes("000005"), "chân bảng liệt mã rút gọn")
      assert.equal(n, 0, "máy thu không đọc ops_heartbeat")
    } finally {
      for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
  test("ON4-AC-6 máy thu không đọc được cấu hình OpenClaw → mô tả «—», không «0 nhóm»", async () => {
    ready()
    for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    try {
      const h = await withHome(() => renderCollections(undefined, { cloud: false }), { cfg: null })
      const t = text(table(h))
      assert.ok(t.includes("chưa đọc được cấu hình ở máy thu"), "mô tả ghi chưa đọc được")
      assert.ok(!/\b0 nhóm\b/.test(t), "không «0 nhóm»")
    } finally {
      for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
  test("ON4-AC-6 bản sao đọc cấu hình hỏng thành danh sách rỗng → bắt («0 nhóm»)", async () => {
    ready()
    for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    const m = mutantChain({ rel: "src/lib/collections-queries.ts", fn: (s) => s.replace("enabled: true }));\n  } catch {\n    return null;", "enabled: true }));\n  } catch {\n    return [];") }, [{ rel: "src/app/ops/collections/page.tsx", spec: "@/lib/collections-queries" }])
    try {
      const h = await withHome(() => renderCollections(m.path, { cloud: false }), { cfg: null })
      assert.ok(/\b0 nhóm\b/.test(text(table(h))), "bản sao hiện «0 nhóm» — phép đo phải bắt")
    } finally {
      m.done()
      for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
  test("ON4-AC-6 máy thu không đọc được nhật ký cổng → cột đọc từ nhật ký «—», cột từ DB vẫn có số", async () => {
    ready()
    for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    await admin.query(`INSERT INTO "${S_CLOUD}".stg_zalo_posts (post_id, snapshot_id, text, group_name, captured_at) VALUES ('on4-d', 'zalo-agent-on4', 'x', 'Nhóm D', now() - interval '1 hour')`)
    try {
      const h = await withHome(() => renderCollections(undefined, { cloud: false }), { log: false })
      const t = table(h)
      assert.equal(acceptedByName(t).get("Nhóm D"), "—", "«Vào bảng thô» không biết")
      for (const m of t.matchAll(/data-row-id="[^"]+"([\s\S]*?)<\/tr>/g)) {
        const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => text(c[1]).trim())
        if (cells[0] === "Nhóm D") assert.deepEqual([cells[2], cells[3], cells[6]], ["—", "—", "1"], "thấy / qua cổng «—», bài thật 7 ngày = 1 từ DB")
      }
    } finally {
      for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
  test("ON4-AC-6 bản sao đọc nhật ký hỏng thành rỗng → bắt (số 0)", async () => {
    ready()
    for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    await admin.query(`INSERT INTO "${S_CLOUD}".stg_zalo_posts (post_id, snapshot_id, text, group_name, captured_at) VALUES ('on4-d', 'zalo-agent-on4', 'x', 'Nhóm D', now() - interval '1 hour')`)
    const m = mutantChain({ rel: "src/lib/collections-queries.ts", fn: (s) => s.replace('"utf8").catch(\n      () => null,\n    ),', '"utf8").catch(\n      () => "",\n    ),') }, [{ rel: "src/app/ops/collections/page.tsx", spec: "@/lib/collections-queries" }])
    try {
      const h = await withHome(() => renderCollections(m.path, { cloud: false }), { log: false })
      assert.equal(acceptedByName(table(h)).get("Nhóm D"), "0", "bản sao ghi 0 — phép đo phải bắt")
    } finally {
      m.done()
      for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
})
