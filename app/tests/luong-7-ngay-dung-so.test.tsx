// luong-7-ngay-dung-so.test.tsx — người vận hành đọc «Luồng 7 ngày qua» thấy mỗi cột đếm đúng thứ nhãn nói (ON5, OPS-8).
// Hồ sơ nghiệm thu: _acceptance/luong-7-ngay-dung-so (AC-1…AC-7; AC-8 ở scripts/luong-7-ngay-do.mjs, AC-9 ở
// scripts/smoke-luong-7-ngay.mjs). Lược đồ tạm từ pipeline/scripts/ops-facts-fixture.mjs + dữ liệu S03 viết trước; bên ghi
// thật qua capture-ops-facts. Tên ca mở đầu bằng mã AC (ON5-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { S03_OFFERS_SQL, S03_POSTS_SQL } from "../../pipeline/lib/ops-flow.mjs"

const S = `on5_app_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

/** Mốc đo ghim 00:30 giờ VN ngày 25/10 (17:30 UTC ngày 24) — ngày cuối của cửa sổ là ngày VN, không ngày UTC. */
const NOW = Date.parse("2026-10-24T17:30:00Z")
const DAYS = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]
const vn = (s: string) => new Date(`${s}+07:00`).toISOString()

// [post_id, snapshot_id, posted_at (giờ VN), captured_at (giờ VN)] — bài 22:49 nạp sau nửa đêm, một bài mock.
const POSTS: [string, string, string, string][] = [
  ["p1", "hanoi__zalo-agent__2026-10-23T100000", "2026-10-23T10:00:00", "2026-10-23T10:05:00"],
  ["p2", "hanoi__zalo-agent__2026-10-24T000024", "2026-10-23T22:49:00", "2026-10-24T00:00:24"],
  ["p3", "hanoi__zalo-agent__2026-10-24T090000", "2026-10-24T09:00:00", "2026-10-24T09:01:00"],
  ["p4", "hanoi__zalo-agent__2026-10-25T001000", "2026-10-25T00:10:00", "2026-10-25T00:11:00"],
  ["m1", "hanoi__zalo-mock__2026-10-23T110000", "2026-10-23T11:00:00", "2026-10-23T11:00:00"],
]
// [offer_id, source, first_seen (giờ VN)] — 23:59 và 00:01 hai bên nửa đêm, một tin S06 cùng ngày.
const OFFERS: [string, string, string][] = [
  ["o1", "S03", "2026-10-23T23:59:00"],
  ["o2", "S03", "2026-10-24T00:01:00"],
  ["o3", "S06", "2026-10-23T12:00:00"],
  ["o4", "S03", "2026-10-23T10:00:00"],
]
/** Đáp án viết trước theo ngày (ngày không ghi = 0). */
const WANT_POSTS: Record<string, number> = { "2026-10-23": 2, "2026-10-24": 1, "2026-10-25": 1 }
const WANT_OFFERS: Record<string, number> = { "2026-10-23": 2, "2026-10-24": 1 }
const want = (m: Record<string, number>) => DAYS.map((d) => [d, m[d] ?? 0] as [string, number])

const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await makeOpsSchema(admin, S)
    for (const t of ["listings", "airdna_listings"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
    for (const [id, snap, posted, captured] of POSTS)
      await admin.query(`INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, text, posted_at, captured_at) VALUES ($1, $2, 'bài thử', $3, $4)`, [
        id, snap, vn(posted), vn(captured),
      ])
    for (const [id, source, seen] of OFFERS)
      await admin.query(`INSERT INTO "${S}".sale_offers (offer_id, kind, first_seen, last_seen, source) VALUES ($1, 'sale', $2, $2, $3)`, [id, vn(seen), source])
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await dropOpsSchema(admin, S).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

/** Lỗi theo ngày: «<ngày>: <cột> <được> ≠ <đáp án>» — rỗng là khớp. */
function loiCot(cot: string, got: [string, number][], wantRows: [string, number][]): string[] {
  const g = new Map(got)
  return wantRows.filter(([d, n]) => g.get(d) !== n).map(([d, n]) => `${d}: ${cot} ${g.get(d) ?? "vắng"} ≠ ${n}`)
}
async function flow() {
  const { getFlowDays } = await import("../src/lib/collections-queries")
  return getFlowDays(7, { now: NOW })
}
/** Chạy một câu SQL đếm theo ngày (bản thật hoặc bản đột biến) trên lược đồ tạm → [ngày, số] cho 7 ngày. */
async function demSql(sql: string): Promise<[string, number][]> {
  const { pool } = await import("../src/lib/db")
  const { rows } = await pool.query<{ d: string; n: number }>(sql, [vn("2026-10-19T00:00:00")])
  const m = new Map(rows.map((r) => [r.d, r.n]))
  return DAYS.map((d) => [d, m.get(d) ?? 0])
}

describe("ON5-AC-1 tin rao S03", () => {
  test("ON5-AC-1 tin rao chỉ đếm nguồn S03 theo ngày first_seen", async () => {
    ready()
    const days = await flow()
    const got = days.map((x) => [x.day, x.zaloOffers] as [string, number])
    console.log(`# ON5-AC-1 ${got.map(([d, n]) => `${d}=${n}`).join(" ")}`)
    assert.deepEqual(loiCot("tin rao", got, want(WANT_OFFERS)), [])
  })
  test("ON5-AC-1 bản sao đếm mọi nguồn → báo ngày và hai số", async () => {
    ready()
    const sai = await demSql(S03_OFFERS_SQL.replace(" AND source = 'S03'", ""))
    assert.deepEqual(loiCot("tin rao", sai, want(WANT_OFFERS)), ["2026-10-23: tin rao 3 ≠ 2"])
  })
})

describe("ON5-AC-2 bài thô S03", () => {
  test("ON5-AC-2 bài thô đếm bài S03 thật theo ngày posted_at", async () => {
    ready()
    const days = await flow()
    const got = days.map((x) => [x.day, x.zaloPosts] as [string, number])
    console.log(`# ON5-AC-2 ${got.map(([d, n]) => `${d}=${n}`).join(" ")}`)
    assert.deepEqual(loiCot("bài thô", got, want(WANT_POSTS)), [])
  })
  test("ON5-AC-2 bản sao đếm theo captured_at → báo ngày và hai số", async () => {
    ready()
    const sai = await demSql(S03_POSTS_SQL.replaceAll("posted_at", "captured_at"))
    assert.deepEqual(loiCot("bài thô", sai, want(WANT_POSTS)), ["2026-10-23: bài thô 1 ≠ 2", "2026-10-24: bài thô 2 ≠ 1"])
  })
})

// ---------- AC-7: trang máy thu ----------

const COT_MAY_THU = ["day", "airdnaMarkets", "airdnaListings", "airbnbSeen", "airbnbSnapshots", "zaloPosts", "zaloOffers"]

async function render(el: unknown): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
const thIds = (html: string) => [...html.slice(html.indexOf("<thead"), html.indexOf("</thead>")).matchAll(/<th[^>]*data-col-id="([^"]+)"/g)].map((m) => m[1])
const thieuCot = (ids: string[]) => COT_MAY_THU.filter((c) => !ids.includes(c))
const MAU = DAYS.map((day) => ({ day, airdnaMarkets: 1, airdnaListings: 2, airbnbListingsSeen: 3, airbnbSnapshots: 4, zaloPosts: 5, zaloOffers: 6 }))

describe("ON5-AC-7 trang máy thu", () => {
  test("ON5-AC-7 máy thu đủ 7 cột như main, mô tả nói giờ VN và ngày đăng bài", async () => {
    const { FlowTable } = await import("../src/components/ops/collections-tables")
    const html = await render(<FlowTable days={MAU} />)
    assert.deepEqual(thIds(html), COT_MAY_THU)
    assert.ok(html.includes("giờ VN"), "mô tả thiếu «giờ VN»")
    assert.ok(html.includes("ngày đăng bài"), "mô tả thiếu «ngày đăng bài»")
    assert.ok(!html.includes("giờ máy"), "mô tả còn «giờ máy»")
  })
  test("ON5-AC-7 bản sao thiếu một cột → báo cột thiếu", async () => {
    const { FlowTable } = await import("../src/components/ops/collections-tables")
    const html = (await render(<FlowTable days={MAU} />)).replace(/<th[^>]*data-col-id="airbnbSnapshots"[\s\S]*?<\/th>/, "")
    assert.deepEqual(thieuCot(thIds(html)), ["airbnbSnapshots"])
  })
})
