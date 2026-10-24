// o-kpi-chi-do-local.test.tsx — ON3 (ADR-0014): ô KPI ba trang Ops trên cloud đọc số máy local đẩy lên. Lược đồ «như cloud»
// (không source_registry, không review_queue) chỉ có ops_heartbeat; bản tin do push-ops-facts THẬT dựng trên lược đồ local
// tạm (pipeline/scripts/ops-facts-fixture.mjs) rồi đi qua handler POST /api/v1/ops/ingest THẬT. Dựng trang thật, đọc HTML.
// Tên ca mở đầu bằng mã AC (ON3-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

import type { User } from "../src/lib/auth"
import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { shiftPayload } from "../../scripts/ops-cloud-proto.mjs"

const S_CLOUD = `on3_cloud_${process.pid}`
const S_LOCAL = `on3_local_${process.pid}`
const LOCAL_ERR: Record<string, string> = {
  freshness: `on3_err_fr_${process.pid}`,
  records24h: `on3_err_rec_${process.pid}`,
  reviewQueue: `on3_err_rq_${process.pid}`,
}
const OMIT: Record<string, string[]> = { freshness: ["stg_chotot_ads"], records24h: ["airbnb_snapshots"], reviewQueue: ["review_queue"] }
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "on3-thu"
const ADMIN: User = { id: "1", email: "ops-test@local.test", plan: "free", role: "admin" }
const RAW_LOCAL = ["source_registry", "review_queue", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "stg_abnb_listings", "sale_offers"]

type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
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
    for (const [k, s] of Object.entries(LOCAL_ERR)) await makeOpsSchema(admin, s, { omit: OMIT[k] })
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  for (const s of [S_CLOUD, S_LOCAL, ...Object.values(LOCAL_ERR)]) await dropOpsSchema(admin, s).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---- bên ghi thật → handler ingest thật ----
const push = async (schema = S_LOCAL, script?: string) => {
  const r = (await captureOpsFacts({ ...(script ? { script } : {}), env: { DATABASE_URL: schemaUrl(schema) } })) as { code: number; stderr: string; payload: Payload }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  return r.payload
}
const ingest = async (payload: Payload) => {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer on3-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}
const clear = () => admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)

// ---- dựng trang ----
async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
const renderOps = async (file = "../src/app/ops/page") => html(await (await import(file)).default())
async function renderCollections(viewFile = "../src/components/ops/collections/collections-view") {
  const React = await import("react")
  const { CollectionsView } = await import(viewFile)
  const { getCloudOpsView } = await import("../src/lib/ops-cloud")
  const { freshnessLocalOnly, getSourceFeedHealth } = await import("../src/lib/ops-queries")
  const cloud = (await freshnessLocalOnly()) ? await getCloudOpsView() : null
  const zero = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
  return html(
    React.createElement(CollectionsView, {
      days: [],
      funnel: { lastEventAt: null, today: zero, last7: zero },
      jobs: [],
      rotation: { updatedAt: null, cursor: 0, total: 0, next: [] },
      zaloGroups: [],
      zaloAllowlist: [],
      zaloHealth: { connected: null, uptime24h: null, heartbeatAgeMin: null, lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false },
      factsPushedAt: null,
      feedHealth: cloud ? (cloud.feeds ?? []) : await getSourceFeedHealth(),
      lockdown: { layers: [], lastWatchdogAt: null, agentTurnsToday: 0, openClawUp: false, kevUp: false, collectorUp: false },
      nowMs: Date.now(),
      cloud,
    }),
  )
}
const renderReview = async () => html(await (await import("../src/components/ops/review-content")).ReviewContent({ user: ADMIN }))

// ---- đọc HTML ----
const localCount = (h: string) => (h.match(/chỉ (đo|có) ở (máy )?local/gi) ?? []).length
const successBadges = (h: string) => (h.match(/bg-success\/10/g) ?? []).length
const zeroValues = (h: string) => (h.match(/text-2xl[^>]*>0</g) ?? []).length
const alertTitles = (h: string) => [...h.matchAll(/data-slot="alert-title"[^>]*>([^<]*(?:<!-- -->[^<]*)*)</g)].map((m) => m[1].replace(/<!-- -->/g, ""))
const tileValue = (h: string, title: string) => h.match(new RegExp(`${title}<[\\s\\S]*?text-2xl[^>]*>([^<]*)<`))?.[1]
const PART = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const vnTime = (iso: string) => {
  const p = Object.fromEntries(PART.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} (GMT+7)`
}
const text = (h: string) => h.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")

/** Chép một tệp nguồn của app cạnh bản thật qua `fn` (đột biến cho chiều đỏ), trả đường để import; xoá sau ca. */
function mutantApp(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  const dst = p.replace(/\/([^/]+)\.tsx?$/, `/.on3-mut-${process.pid}-$1.tsx`)
  writeFileSync(dst, out)
  return { path: dst.replace(/\.tsx$/, ""), done: () => rmSync(dst, { force: true }) }
}

describe("ON3-AC-1 chưa có bản tin", () => {
  test("ON3-AC-1 không facts: mỗi trang đúng một chữ chỉ-local, 0 ô KPI số 0, 0 badge success, ô không số là «—»", async () => {
    ready()
    await clear()
    const PAGES: [string, () => Promise<string>, string][] = [
      ["/ops", () => renderOps(), "Chỉ đo ở máy local"],
      ["/ops/collections", () => renderCollections(), "Chỉ đo ở máy local"],
      ["/ops/review", renderReview, "Hàng chờ duyệt chỉ có ở máy local"],
    ]
    for (const [name, render, pinned] of PAGES) {
      const h = await render()
      assert.equal(localCount(h), 1, `${name}: chữ chỉ-local phải đúng một lần`)
      assert.ok(alertTitles(h).includes(pinned), `${name}: nguyên văn «${pinned}»`)
      assert.equal(zeroValues(h), 0, `${name}: không ô nào hiện số 0`)
      assert.equal(successBadges(h), 0, `${name}: không badge xanh`)
    }
    const ops = await renderOps()
    assert.ok(ops.includes("data-kpi-unmeasured"), "/ops: bốn ô «—»")
    assert.equal(tileValue(await renderCollections(), "Bản ghi 24h"), "—")
    assert.match(text(await renderReview()), /— thẻ đang chờ/)
  })
  test("ON3-AC-1 bản sao còn «chỉ đo ở local» trong stats PageHeader và ô Quá hạn 0 kèm badge xanh → bắt", async () => {
    ready()
    await clear()
    const m = mutantApp("src/app/ops/page.tsx", (s) =>
      s.replace("unmeasured ? [] : [sloSummaryText(slo),", "[sloSummaryText(slo, true),").replace("unmeasured={unmeasured}", "unmeasured={false}"))
    try {
      const h = await renderOps(m.path)
      assert.equal(localCount(h), 2, "phép đếm phải thấy câu chỉ-local lặp ở đầu trang")
      assert.ok(zeroValues(h) > 0 && successBadges(h) > 0, "phép đo phải thấy ô 0 kèm badge xanh")
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-2/AC-3 bản tin tươi", () => {
  test("ON3-AC-2 /ops facts tươi: bốn ô bằng số tính từ khối freshness, dòng «Số đo lúc … từ máy local» đúng mốc đo theo giờ VN", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const { toCoverageRows } = await import("../src/lib/ops-queries")
    const { summarizeFreshness, sloSummaryKey } = await import("../src/lib/freshness")
    const rows = toCoverageRows(p.blocks.freshness.rows as never)
    const h = await renderOps()
    assert.ok(h.includes(`data-slo-summary="${sloSummaryKey(summarizeFreshness(rows))}"`), "ô Đạt SLO phải bằng khối freshness")
    assert.equal(tileValue(h, "Quá hạn"), String(rows.filter((r) => r.status === "stale").length))
    assert.equal(tileValue(h, "Chưa có snapshot"), String(rows.filter((r) => r.status === "none").length))
    assert.match(text(h), new RegExp(`Số đo lúc ${vnTime(p.pushedAt).replace(/[()+]/g, "\\$&")} từ máy local`))
    assert.equal(localCount(h), 0, "có số thì không còn chữ chỉ-local")
  })
  test("ON3-AC-2 bản sao lệch giờ VN → bắt", async () => {
    ready()
    const m = mutantApp("src/components/ops/facts-status.tsx", (s) => s.replaceAll("fmtVnDateTime(measuredAt)", 'String(measuredAt).slice(0, 16).replace("T", " ") + " (GMT+7)"'))
    try {
      const { FactsStamp } = await import(m.path)
      const at = "2026-10-24T12:13:00.000Z"
      const h = await html(FactsStamp({ state: "fresh", measuredAt: at }))
      assert.ok(!text(h).includes(vnTime(at)), "phép đo phải thấy mốc giờ không theo giờ VN")
    } finally {
      m.done()
    }
  })
  test("ON3-AC-3 /ops/collections facts tươi: Bản ghi 24h = tổng records24h, Sức khoẻ nguồn = x/y freshness, dòng mốc đo, ô Lockdown «—»", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const want = (p.blocks.records24h.bySource as { n: number }[]).reduce((a, r) => a + r.n, 0)
    assert.ok(want > 0, "fixture phải có bản ghi trong 24 giờ")
    const { summarizeFreshness, sloSummaryKey } = await import("../src/lib/freshness")
    const h = await renderCollections()
    assert.equal(tileValue(h, "Bản ghi 24h"), String(want))
    assert.ok(h.includes(`data-slo-summary="${sloSummaryKey(summarizeFreshness(p.blocks.freshness.rows as never))}"`))
    assert.ok(h.includes("data-facts-stamp"), "dòng mốc đo")
    assert.equal(tileValue(h, "Lockdown"), "—")
    assert.match(text(h), /Chưa kiểm được trên cloud/)
  })
  test("ON3-AC-3 bản sao Bản ghi 24h đọc 0 → bắt", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const m = mutantApp("src/components/ops/collections/collections-view.tsx", (s) => s.replace("cloud.records24h.reduce((a, r) => a + r.n, 0)", "0"))
    try {
      const want = (p.blocks.records24h.bySource as { n: number }[]).reduce((a, r) => a + r.n, 0)
      assert.notEqual(tileValue(await renderCollections(m.path), "Bản ghi 24h"), String(want))
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-4 bản tin cũ", () => {
  const staleTitles = (h: string) => alertTitles(h).filter((t) => t.startsWith("Máy local không đẩy số từ"))
  test("ON3-AC-4 bản tin thật qua handler ingest thật, mốc lùi 46′: mỗi trang đúng một Alert, số mờ, 0 badge success, không còn Alert 30′ cũ", async () => {
    ready()
    const p = shiftPayload(await push(), -46) as Payload
    await ingest(p)
    for (const [name, h] of [["/ops", await renderOps()], ["/ops/collections", await renderCollections()]] as const) {
      assert.deepEqual(staleTitles(h), [`Máy local không đẩy số từ ${vnTime(p.pushedAt)}`], `${name}: một Alert số cũ`)
      assert.equal(successBadges(h), 0, `${name}: không badge xanh`)
      assert.ok(/text-2xl[^"]*text-muted-foreground/.test(h), `${name}: số mờ`)
      assert.ok(!h.includes("Máy thu có thể offline"), `${name}: Alert 30′ cũ phải bỏ`)
    }
  })
  test("ON3-AC-4 bản tin 44′ → không Alert", async () => {
    ready()
    await ingest(shiftPayload(await push(), -44) as Payload)
    for (const h of [await renderOps(), await renderCollections()]) assert.deepEqual(staleTitles(h), [])
  })
})

describe("ON3-AC-5 thẻ chờ duyệt", () => {
  const counts = async () => {
    const { rows } = await admin.query(`SELECT item_type AS type, count(*)::int AS n FROM "${S_LOCAL}".review_queue WHERE status = 'pending' GROUP BY 1 ORDER BY 1`)
    return { total: rows.reduce((a: number, r: { n: number }) => a + r.n, 0), byType: rows as { type: string; n: number }[] }
  }
  const shown = (h: string) => ({
    total: h.match(/data-pending-total="(\d*)"/)?.[1],
    byType: [...h.matchAll(/data-pending-type="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => [m[1], text(m[2]).trim()]),
  })
  test("ON3-AC-5 /ops/review cloud: «N thẻ đang chờ» = phép đếm SQL pending, từng loại = đếm theo item_type, một chỗ chữ chỉ-local", async () => {
    ready()
    const want = await counts()
    assert.ok(want.byType.length >= 2, "fixture phải có ≥ 2 loại thẻ")
    await ingest(await push())
    const h = await renderReview()
    const got = shown(h)
    assert.equal(got.total, String(want.total))
    assert.deepEqual(got.byType, want.byType.map((t) => [t.type, `${t.type}: ${t.n}`]))
    assert.equal(localCount(h), 1)
  })
  test("ON3-AC-5 bản sao bên ghi đổi khuôn byType → bắt", async () => {
    ready()
    const f = mutantPush("rq-khuon.mjs", (s: string) =>
      s.replace("measure(() => readReviewQueue(client))", "measure(async () => { const r = await readReviewQueue(client); return { ...r, byType: r.byType.map((x) => ({ type: x.type, count: x.n })) }; })"))
    await ingest(await push(S_LOCAL, f))
    const want = await counts()
    assert.notDeepEqual(shown(await renderReview()).byType, want.byType.map((t) => [t.type, `${t.type}: ${t.n}`]))
  })
})

describe("ON3-AC-6 khối lỗi do bên ghi thật", () => {
  test("ON3-AC-6 ma trận khối lỗi (freshness, records24h, reviewQueue) → ô «—» + «Chưa có số», 0 số 0, 0 badge success", async () => {
    ready()
    // [khối, trang, vùng HTML của ô khối ấy, kiểm «—»] — chỉ xét ô đọc khối lỗi; ô khác của trang đọc khối khác
    const CASES: [string, () => Promise<string>, (h: string) => string, (h: string) => boolean][] = [
      ["freshness", () => renderOps(), (h) => h.slice(h.indexOf("data-kpi-unmeasured")), (h) => h.includes("data-kpi-unmeasured") && text(h).includes("Chưa có số")],
      ["records24h", () => renderCollections(), (h) => `text-2xl>${tileValue(h, "Bản ghi 24h")}<`, (h) => tileValue(h, "Bản ghi 24h") === "—" && /Bản ghi 24h[\s\S]*?Chưa có số/.test(text(h))],
      ["reviewQueue", renderReview, (h) => h, (h) => /— thẻ đang chờ/.test(text(h))],
    ]
    for (const [block, render, region, ok] of CASES) {
      const p = await push(LOCAL_ERR[block])
      assert.match(String(p.blocks[block].error ?? ""), /^không đo được/, `${block}: bên ghi phải ghi lỗi`)
      await ingest(p)
      const h = await render()
      assert.ok(ok(h), `${block}: ô của khối lỗi phải «—» + «Chưa có số»`)
      assert.equal(zeroValues(region(h)), 0, `${block}: ô của khối lỗi không số 0`)
      assert.equal(successBadges(region(h)), 0, `${block}: ô của khối lỗi không badge xanh`)
    }
  })
})

describe("ON3-AC-7 máy local", () => {
  test("ON3-AC-7 DB local đủ bảng: ba trang không dòng mốc đo, không Alert số cũ, không truy vấn ops_heartbeat", async () => {
    ready()
    for (const t of RAW_LOCAL) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    const { pool } = await import("../src/lib/db")
    const seen: string[] = []
    const orig = pool.query.bind(pool)
    ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
      seen.push(String(typeof sql === "string" ? sql : (sql as { text?: string })?.text ?? ""))
      return (orig as (...a: unknown[]) => unknown)(sql, ...rest)
    }
    try {
      for (const h of [await renderOps(), await renderCollections(), await renderReview()]) {
        assert.ok(!h.includes("data-facts-stamp"), "ở local không có dòng mốc đo")
        assert.ok(!h.includes("data-facts-stale"), "ở local không có Alert số cũ")
      }
      assert.deepEqual(seen.filter((q) => q.includes("ops_heartbeat")), [], "ở local không đọc ops_heartbeat")
    } finally {
      ;(pool as unknown as { query: unknown }).query = orig
      for (const t of RAW_LOCAL) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
})
