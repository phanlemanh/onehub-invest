// ops-cloud-khong-bang-nap.test.tsx — sự cố prod 24/10: cloud KHÔNG có source_registry và bảng nạp (tầng A, leak gate),
// /ops và /ops/collections ném 42P01 «relation "source_registry" does not exist». Ca này dựng một lược đồ tạm trong DB local
// VẮNG HẲN các bảng đó (như cloud), chạy hàm truy vấn + route + render trang thật: không lỗi, trang nói «Độ tươi chỉ đo ở
// máy local». Đối chứng: cùng lược đồ có source_registry thì trang không hiện câu đó. Tên ca mở đầu bằng mã AC (OP-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

const SCHEMA = `ops_cloud_test_${process.pid}`
const BASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
// Pool của app (src/lib/db.ts) đọc DATABASE_URL lúc import — đặt TRƯỚC mọi import động bên dưới.
{
  const u = new URL(BASE_URL)
  u.searchParams.set("options", `-c search_path=${SCHEMA}`)
  process.env.DATABASE_URL = u.toString()
}
const RAW = ["source_registry", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "stg_abnb_listings", "sale_offers"]

const admin = new pg.Client({ connectionString: BASE_URL })
let dbErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await admin.query(`CREATE SCHEMA "${SCHEMA}"`) // rỗng: không bảng thô nào — như cloud
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

async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
async function renderBoth(): Promise<[string, string]> {
  const React = await import("react")
  const { default: OpsOverviewPage } = await import("../src/app/ops/page")
  const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
  const { getSourceFeedHealth, freshnessLocalOnly } = await import("../src/lib/ops-queries")
  const zero = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
  const col = React.createElement(CollectionsView, {
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
    localOnly: await freshnessLocalOnly(),
  })
  return [await html(await OpsOverviewPage()), await html(col)]
}
const summaries = (h: string) => [...h.matchAll(/data-slo-summary="([^"]*)"/g)].map((m) => m[1])

describe("Ops trên cloud không có bảng nạp (sự cố prod 24/10)", () => {
  test("OP-AC-1 lược đồ vắng source_registry + bảng nạp → hai hàm và route trả rỗng, không 42P01", async () => {
    needDb()
    const { rows } = await admin.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = $1`, [SCHEMA])
    assert.equal(rows[0].n, 0, "tiền đề: lược đồ không có bảng nào, như cloud")
    const { getCoverageOverview, getSourceFeedHealth, freshnessLocalOnly } = await import("../src/lib/ops-queries")
    assert.equal(await freshnessLocalOnly(), true)
    assert.deepEqual(await getCoverageOverview(), [])
    assert.deepEqual(await getSourceFeedHealth(), [])
    process.env.OPS_API_TOKEN = "test-token-cloud"
    const { GET } = await import("../src/app/api/v1/ops/coverage/route")
    const res = await GET(new Request("http://localhost:3456/api/v1/ops/coverage", { headers: { authorization: "Bearer test-token-cloud" } }))
    assert.equal(res.status, 200)
    assert.deepEqual(((await res.json()) as { rows: unknown[] }).rows, [])
    delete process.env.OPS_API_TOKEN
  })

  test("OP-AC-2 trang /ops và Thu thập render được, nói «Độ tươi chỉ đo ở máy local»", async () => {
    needDb()
    const [ops, col] = await renderBoth()
    const TEXT = "Độ tươi chỉ đo ở máy thu" // ON12 đổi «máy local» → «máy thu» (nhãn theo CONTEXT.md)
    for (const [name, h, title] of [["/ops", ops, "Tổng quan"], ["/ops/collections", col, "Thu thập"]] as const) {
      // Vị trí 1 — thông báo có tên: đúng MỘT tiêu đề Alert mang câu này.
      const alerts = [...h.matchAll(/data-slot="alert-title"[^>]*>([^<]*)</g)].map((m) => m[1])
      assert.deepEqual(alerts.filter((t) => t === TEXT), [TEXT], `${name} phải có đúng một thông báo «${TEXT}»`)
      // Vị trí 2 — đầu trang: câu nằm giữa tiêu đề trang và thông báo (dòng thống kê của PageHeader).
      const head = h.slice(h.indexOf(`>${title}<`), h.indexOf('data-slot="alert-title"'))
      assert.ok(head.includes(TEXT), `${name}: đầu trang (trước thông báo) phải mang «${TEXT}»`)
      assert.ok(!h.includes("Chưa có nguồn nào"), `${name} không được nói «Chưa có nguồn nào» khi chỉ là thiếu bảng`)
      assert.deepEqual(summaries(h), ["0/0", "0/0"])
    }
  })

  test("OP-AC-2 đối chứng: có source_registry (bảng rỗng) → không hiện câu chỉ-đo-ở-local", async () => {
    needDb()
    for (const t of RAW) await admin.query(`CREATE TABLE "${SCHEMA}".${t} (LIKE public.${t} INCLUDING ALL)`)
    try {
      const { freshnessLocalOnly } = await import("../src/lib/ops-queries")
      assert.equal(await freshnessLocalOnly(), false)
      const [ops, col] = await renderBoth()
      for (const h of [ops, col]) {
        assert.ok(!h.includes("Độ tươi chỉ đo ở máy thu"))
        assert.ok(h.includes("Chưa có nguồn nào"))
      }
    } finally {
      for (const t of RAW) await admin.query(`DROP TABLE IF EXISTS "${SCHEMA}".${t}`)
    }
  })
})
