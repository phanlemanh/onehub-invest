// slo-mot-nguon.test.tsx — AU6: /ops, /ops/collections và /api/v1/ops/coverage cùng một con số SLO.
// Chạy hàm truy vấn THẬT trên một lược đồ tạm trong DB local (CREATE TABLE … (LIKE public.<bảng> INCLUDING ALL),
// search_path qua DATABASE_URL của pool app), so với readFreshness của scripts/lib/freshness.mjs (CLI, AU4) trên
// cùng lược đồ, rồi render TRỌN trang /ops và TRỌN CollectionsView. Chỉ ghi vào lược đồ tạm của chính tệp, xoá ở cuối.
// Tên ca mở đầu bằng mã AC để evals bám (SL-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import type { FreshnessRow } from "../src/lib/freshness"
import type { CoverageRow } from "../src/lib/ops-queries"

const SCHEMA = `slo_test_${process.pid}`
const BASE_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
// Pool của app (src/lib/db.ts) đọc DATABASE_URL lúc import — đặt TRƯỚC mọi import động bên dưới.
{
  const u = new URL(BASE_URL)
  u.searchParams.set("options", `-c search_path=${SCHEMA}`)
  process.env.DATABASE_URL = u.toString()
}
const TABLES = ["source_registry", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "stg_abnb_listings", "sale_offers"]
const CANARY_CITY = "canh-thu" // chỉ có trong lược đồ tạm: thấy nó = phép đo đọc đúng lược đồ (đối chứng dương)

const admin = new pg.Client({ connectionString: BASE_URL })
let dbErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await admin.query(`CREATE SCHEMA "${SCHEMA}"`)
    for (const t of TABLES) await admin.query(`CREATE TABLE "${SCHEMA}".${t} (LIKE public.${t} INCLUDING ALL)`)
  } catch (e) {
    dbErr = (e as Error).message
  }
})
after(async () => {
  await admin.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const needDb = () => assert.equal(dbErr, null, `DB local :5433 không tới được — eval đòi chạy thật: ${dbErr}`)

// ---------------------------------------------------------------- fixture --
const ago = (h: number) => new Date(Date.now() - h * 3.6e6).toISOString()
type Fixture = {
  registry: { code: string; status: string; ids: string[] }[]
  snapshots: { id: string; city: string; source: string; at: string }[]
  airdna: { id: string; country: string; at: string }[]
  posts: { id: string; snap: string; agent: string | null; at: string }[]
  ads: { id: number; snap: string; at: string }[]
}
/** Mọi tuổi lệch nửa giờ khỏi mốc giờ để hai lần đọc cách nhau vài mili-giây vẫn cùng floor. */
function base(): Fixture {
  return {
    registry: [
      { code: "S01", status: "active", ids: ["s01a", "s01b"] },
      { code: "S02", status: "active", ids: ["s02"] },
      { code: "S03", status: "active", ids: ["s03agent", "s03mock"] },
      { code: "S04", status: "completed", ids: ["s04"] },
      { code: "S05", status: "active", ids: ["s05hook"] },
      { code: "S06", status: "active", ids: ["s06"] },
      { code: "S07", status: "active", ids: ["s07"] }, // active, chưa khai SLO
    ],
    snapshots: [
      { id: "hanoi__s01a__1", city: "hanoi", source: "s01a", at: ago(10.5) },
      { id: "canh__s01b__1", city: CANARY_CITY, source: "s01b", at: ago(20.5) },
      { id: "hcmc__s01b__1", city: "hcmc", source: "s01b", at: ago(200.5) }, // S01/hcmc quá 192 giờ
      { id: "hanoi__s03__1", city: "hanoi", source: "s03agent", at: ago(1.5) },
      { id: "hanoi__s05__1", city: "hanoi", source: "s03agent", at: ago(2.5) }, // S05 đi chung ống với S03
      { id: "hanoi__s06__1", city: "hanoi", source: "s06", at: ago(30.5) },
      { id: "hanoi__s04__1", city: "hanoi", source: "s04", at: ago(24 * 200) },
    ],
    airdna: [{ id: "m1", country: "vn", at: ago(100.5) }],
    posts: [
      { id: "p-s03", snap: "hanoi__s03__1", agent: "hook-khac", at: ago(1.5) },
      { id: "p-s05", snap: "hanoi__s05__1", agent: "s05hook", at: ago(2.5) },
    ],
    ads: [{ id: 1, snap: "hanoi__s06__1", at: ago(30.5) }],
  }
}
/** Bảng mong đợi viết TRƯỚC cho base(): mã · thành phố · tuổi (giờ) · SLO (giờ) · trạng thái. */
const EXPECTED_BASE = [
  ["S01", CANARY_CITY, 20, 192, "fresh"],
  ["S01", "hanoi", 10, 192, "fresh"],
  ["S01", "hcmc", 200, 192, "stale"],
  ["S02", "vn", 100, 840, "fresh"],
  ["S03", "hanoi", 1, 72, "fresh"],
  ["S05", "hanoi", 2, 96, "fresh"],
  ["S06", "hanoi", 30, 36, "fresh"],
]

async function seed(f: Fixture) {
  needDb()
  for (const t of TABLES) await admin.query(`TRUNCATE "${SCHEMA}".${t}`)
  const q = (sql: string, v: unknown[]) => admin.query(sql.replaceAll("§", `"${SCHEMA}"`), v)
  for (const r of f.registry)
    await q(`INSERT INTO §.source_registry (code, real_name, label_vi, status, source_ids) VALUES ($1,$2,'x',$3,$4)`, [r.code, `REALNAME-CANARY-${r.code}`, r.status, r.ids])
  for (const s of f.snapshots)
    await q(`INSERT INTO §.airbnb_snapshots (snapshot_id, city, source, manifest, collected_at) VALUES ($1,$2,$3,'{}',$4)`, [s.id, s.city, s.source, s.at])
  for (const a of f.airdna) await q(`INSERT INTO §.airdna_markets (airdna_id, country_code, captured_at) VALUES ($1,$2,$3)`, [a.id, a.country, a.at])
  for (const p of f.posts)
    await q(`INSERT INTO §.stg_zalo_posts (post_id, snapshot_id, text, agent_id, captured_at) VALUES ($1,$2,'x',$3,$4)`, [p.id, p.snap, p.agent, p.at])
  for (const a of f.ads)
    await q(`INSERT INTO §.stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, captured_at) VALUES ($1, 0, 'x', 0, 's', '{}', $2, $3)`, [a.id, a.snap, a.at])
}

/** readFreshness của CLI (scripts/lib/freshness.mjs, AU4) trên cùng lược đồ — thước đối chiếu. */
async function cliFreshness(): Promise<FreshnessRow[]> {
  const cli = await import("../../scripts/lib/freshness.mjs")
  await admin.query(`SET search_path TO "${SCHEMA}"`)
  try {
    return await cli.readFreshness(admin)
  } finally {
    await admin.query("RESET search_path")
  }
}

// ----------------------------------------------------------------- render --
async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
async function renderOps(): Promise<string> {
  const { default: OpsOverviewPage } = await import("../src/app/ops/page")
  return html(await OpsOverviewPage())
}
async function renderCollections(): Promise<string> {
  const React = await import("react")
  const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
  const { getSourceFeedHealth } = await import("../src/lib/ops-queries")
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
      feedHealth: await getSourceFeedHealth(),
      lockdown: { layers: [], lastWatchdogAt: null, agentTurnsToday: 0, openClawUp: false, kevUp: false, collectorUp: false },
      nowMs: Date.now(),
    }),
  )
}
const summaries = (h: string) => [...h.matchAll(/data-slo-summary="([^"]*)"/g)].map((m) => m[1])

const rowKey = (r: { code: string; city: string | null; ageHours: number | null; sloHours: number | null; status: string }) =>
  [r.code, r.city, r.ageHours, r.sloHours, r.status]

// ------------------------------------------------------------------ ca đo --
describe("AU6 slo-mot-nguon", () => {
  test("SL-AC-2 getCoverageOverview khớp readFreshness trên lược đồ tạm — bảng mong đợi từng hàng viết trước, thấy thành phố canh, S05 96 giờ, không S04, không mã chưa khai SLO", async () => {
    await seed(base())
    const { getCoverageOverview } = await import("../src/lib/ops-queries")
    const rows = await getCoverageOverview()
    assert.deepEqual(rows.map(rowKey), EXPECTED_BASE)
    assert.ok(rows.some((r) => r.city === CANARY_CITY), "phải thấy thành phố canh — pool đọc đúng lược đồ tạm")
    const cli = (await cliFreshness()).filter((r) => r.status !== "no-slo")
    assert.deepEqual(rows.map(rowKey), cli.map(rowKey), "trang /ops và CLI phải ra cùng hàng")
    assert.ok(!rows.some((r) => r.code === "S04" || r.code === "S07"))
  })

  test("SL-AC-2 bản nạp lại collected_at cũ vẫn quá hạn", async () => {
    const f = base()
    f.snapshots.find((s) => s.id === "hanoi__s03__1")!.at = ago(80.5) // giờ thu cũ hơn SLO 72 giờ
    f.posts.find((p) => p.id === "p-s03")!.at = ago(0.1) // importer ghi now() khi nạp lại
    await seed(f)
    const { getCoverageOverview } = await import("../src/lib/ops-queries")
    const s03 = (await getCoverageOverview()).filter((r) => r.code === "S03")
    assert.deepEqual(s03.map(rowKey), [["S03", "hanoi", 80, 72, "stale"]])
  })

  test("SL-AC-3 getSourceFeedHealth: tuổi lớn nhất theo thành phố, Trễ SLO, Chưa có dữ liệu thay Ổn, Chưa khai SLO ngoài y, S04 Ngừng, thấy thành phố canh", async () => {
    const { getSourceFeedHealth } = await import("../src/lib/ops-queries")
    const { feedState, feedSloSummary, FEED_STATE } = await import("../src/components/ops/collections/feed-status")
    const f = base()
    f.ads = [] // S06 không còn tin → chưa có dữ liệu
    await seed(f)
    const feeds = await getSourceFeedHealth()
    const got = feeds.map((x) => [x.code, x.freshnessHrs, x.sloHours, FEED_STATE[feedState(x)].label])
    assert.deepEqual(got, [
      ["S01", 200, 192, "Trễ SLO"],
      ["S02", 100, 840, "Đạt"],
      ["S03", 1, 72, "Đạt"],
      ["S04", null, null, "Ngừng"],
      ["S05", 2, 96, "Đạt"],
      ["S06", null, 36, "Chưa có dữ liệu"],
      ["S07", null, null, "Chưa khai SLO"],
    ])
    assert.deepEqual(feedSloSummary(feeds), { ok: 3, total: 5 }, "y = 5 nguồn active có SLO (không S04, không S07)")
    // đối chứng dương: tuổi 20 giờ của thành phố canh có mặt trong nguồn S01 (max = 200 vì hcmc)
    await seed(base())
    const { getCoverageOverview } = await import("../src/lib/ops-queries")
    assert.ok((await getCoverageOverview()).some((r) => r.city === CANARY_CITY && r.ageHours === 20))
    const s01 = (await getSourceFeedHealth()).find((x) => x.code === "S01")!
    assert.equal(s01.freshnessHrs, 200)
    // lastRunAt/items24h giữ đường cũ (ghép nguồn thu SNAP_OF, tách khỏi độ tươi): id giả của fixture không khớp
    // nguồn thu nào nên lần chạy rỗng trong khi độ tươi vẫn đo được — hai đại lượng không còn dính nhau.
    assert.deepEqual([s01.lastRunAt, s01.items24h], [null, 0])
  })

  test("SL-AC-4 summarizeFreshness ma trận 5 ca, hai trang cùng {x,y}", async () => {
    const { summarizeFreshness, bySource } = await import("../src/lib/freshness")
    const { feedSloSummary } = await import("../src/components/ops/collections/feed-status")
    const row = (code: string, city: string | null, status: FreshnessRow["status"], slo: number | null = 24): FreshnessRow =>
      ({ code, city, last: null, ageHours: status === "none" || status === "no-slo" ? null : 1, sloHours: status === "no-slo" ? null : slo, status })
    const all = ["S01", "S02", "S03", "S05", "S06"].map((c) => row(c, "hanoi", "fresh"))
    const MATRIX: [string, FreshnessRow[], { ok: number; total: number }][] = [
      ["mọi nguồn tươi", all, { ok: 5, total: 5 }],
      ["S01 quá hạn ở một trong hai thành phố", [...all, row("S01", "hcmc", "stale")], { ok: 4, total: 5 }],
      ["S06 chưa có dữ liệu", [...all.filter((r) => r.code !== "S06"), row("S06", null, "none")], { ok: 4, total: 5 }],
      ["thêm mã active không SLO", [...all, row("S07", null, "no-slo")], { ok: 5, total: 5 }],
      ["S04 completed không vào readFreshness", all, { ok: 5, total: 5 }],
    ]
    for (const [name, rows, want] of MATRIX) {
      // bộ chuyển /ops: ô CoverageRow (bỏ no-slo) → summarizeFreshness
      const ops = summarizeFreshness(rows.filter((r) => r.status !== "no-slo"))
      // bộ chuyển /ops/collections: nguồn gộp → feed → feedSloSummary (S04 completed thêm như feed «ngừng»)
      const feeds = [
        ...bySource(rows).map((s) => ({ code: s.code, labelVi: "x", status: "active", note: null, lastRunAt: null, lastRunSource: null, items24h: 0, stgRows: 0, offers: null, freshnessHrs: s.ageHours, sloHours: s.sloHours, freshness: s.status })),
        { code: "S04", labelVi: "x", status: "completed", note: null, lastRunAt: null, lastRunSource: null, items24h: 0, stgRows: 0, offers: null, freshnessHrs: null, sloHours: null, freshness: null },
      ]
      const col = feedSloSummary(feeds)
      assert.deepEqual(ops, want, `/ops — ${name}`)
      assert.deepEqual(col, want, `/ops/collections — ${name}`)
    }
  })

  test("SL-AC-5 trọn trang /ops và trọn CollectionsView mang cùng data-slo-summary ở ô và đầu trang", async () => {
    await seed(base())
    const [ops, col] = [await renderOps(), await renderCollections()]
    assert.deepEqual(summaries(ops), ["4/5", "4/5"], "trang /ops: gốc trang + ô «Đạt SLO»")
    assert.deepEqual(summaries(col), ["4/5", "4/5"], "trang Thu thập: gốc trang + ô «Sức khoẻ nguồn»")
    for (const h of [ops, col]) assert.ok(h.includes("4/5 nguồn đạt SLO"), "đầu trang in cùng chuỗi")
  })

  test("SL-AC-5 S01 quá hạn một thành phố → hai ô cùng giảm 1", async () => {
    const f = base()
    f.snapshots.find((s) => s.id === "hcmc__s01b__1")!.at = ago(5.5) // mọi nguồn tươi
    await seed(f)
    const before = [summaries(await renderOps()), summaries(await renderCollections())]
    assert.deepEqual(before, [["5/5", "5/5"], ["5/5", "5/5"]])
    f.snapshots.find((s) => s.id === "hcmc__s01b__1")!.at = ago(200.5)
    await seed(f)
    const afterStale = [summaries(await renderOps()), summaries(await renderCollections())]
    assert.deepEqual(afterStale, [["4/5", "4/5"], ["4/5", "4/5"]])
  })

  test("SL-AC-6 fmtAge 12/72/840 giờ → 12 giờ/3 ngày/35 ngày, hai trang cùng chữ", async () => {
    const { fmtAge } = await import("../src/lib/freshness")
    assert.deepEqual([fmtAge(12), fmtAge(47), fmtAge(48), fmtAge(72), fmtAge(840), fmtAge(null)], ["12 giờ", "47 giờ", "2 ngày", "3 ngày", "35 ngày", "—"])
    await seed(base())
    const [ops, col] = [await renderOps(), await renderCollections()]
    for (const [name, h] of [["/ops", ops], ["/ops/collections", col]] as const) {
      for (const want of ["4 ngày", "3 ngày", "35 ngày", "8 ngày"]) assert.ok(h.includes(want), `${name} thiếu «${want}»`)
      assert.ok(!h.includes("(ngày)") && !h.includes("(giờ)"), `${name} còn tiêu đề cột theo đơn vị cũ`)
    }
    assert.ok(col.includes("Độ tươi 8 ngày / SLO 8 ngày"), "mục «Cần chú ý» của S01 dùng cùng cách viết")
    // SLO của CHÍNH hàng S05 (s05-slo-theo-lich): 96 giờ → «4 ngày», không còn «12 giờ».
    const hang = (h: string, id: string) => {
      const m = h.match(new RegExp(`data-row-id="${id}"[\\s\\S]*?</tr>`))
      assert.ok(m, `không thấy hàng ${id}`)
      return m[0].replace(/<[^>]+>/g, "|")
    }
    for (const [name, r] of [["/ops", hang(ops, "S05-hanoi")], ["/ops/collections", hang(col, "S05")]] as const) {
      assert.ok(r.includes("4 ngày"), `${name}: hàng S05 phải ghi SLO «4 ngày» — ${r}`)
      assert.ok(!r.includes("12 giờ"), `${name}: hàng S05 còn SLO «12 giờ» — ${r}`)
    }
  })

  test("SL-AC-7 /api/v1/ops/coverage trả hàng /ops kèm ageHours/sloHours, giữ ageDays/sloDays", async () => {
    await seed(base())
    process.env.OPS_API_TOKEN = "test-token-slo"
    const { GET } = await import("../src/app/api/v1/ops/coverage/route")
    const res = await GET(new Request("http://localhost:3456/api/v1/ops/coverage", { headers: { authorization: "Bearer test-token-slo" } }))
    assert.equal(res.status, 200)
    const body = (await res.json()) as { rows: CoverageRow[] }
    assert.deepEqual(body.rows.map(rowKey), EXPECTED_BASE)
    for (const r of body.rows) {
      assert.equal(r.ageDays, r.ageHours === null ? null : Math.floor(r.ageHours / 24))
      assert.equal(r.sloDays, r.sloHours / 24)
    }
    delete process.env.OPS_API_TOKEN
  })

  test("SL-AC-9 lược đồ bảng thô 0 dòng như cloud → không lỗi, mảng rỗng, 0/0 Chưa có nguồn nào", async () => {
    await seed({ registry: [], snapshots: [], airdna: [], posts: [], ads: [] })
    const { getCoverageOverview, getSourceFeedHealth } = await import("../src/lib/ops-queries")
    assert.deepEqual(await getCoverageOverview(), [])
    assert.deepEqual(await getSourceFeedHealth(), [])
    process.env.OPS_API_TOKEN = "test-token-slo"
    const { GET } = await import("../src/app/api/v1/ops/coverage/route")
    const res = await GET(new Request("http://localhost:3456/api/v1/ops/coverage", { headers: { authorization: "Bearer test-token-slo" } }))
    assert.deepEqual(((await res.json()) as { rows: unknown[] }).rows, [])
    delete process.env.OPS_API_TOKEN
    const [ops, col] = [await renderOps(), await renderCollections()]
    assert.deepEqual([summaries(ops), summaries(col)], [["0/0", "0/0"], ["0/0", "0/0"]])
    for (const h of [ops, col]) assert.ok(h.includes("Chưa có nguồn nào"))
  })

  test("SL-AC-9 một mã active, bảng nạp rỗng → Chưa có dữ liệu, không lỗi", async () => {
    await seed({ registry: [{ code: "S06", status: "active", ids: ["s06"] }], snapshots: [], airdna: [], posts: [], ads: [] })
    const { getCoverageOverview, getSourceFeedHealth } = await import("../src/lib/ops-queries")
    const { feedState, FEED_STATE } = await import("../src/components/ops/collections/feed-status")
    assert.deepEqual((await getCoverageOverview()).map(rowKey), [["S06", null, null, 36, "none"]])
    assert.deepEqual((await getSourceFeedHealth()).map((f) => FEED_STATE[feedState(f)].label), ["Chưa có dữ liệu"])
    const [ops, col] = [await renderOps(), await renderCollections()]
    assert.deepEqual([summaries(ops), summaries(col)], [["0/1", "0/1"], ["0/1", "0/1"]])
  })
})
