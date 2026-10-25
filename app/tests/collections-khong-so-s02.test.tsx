// collections-khong-so-s02.test.tsx — trang Thu thập không có số S02 nào (ON6, OPS-14, luật 5).
// Hồ sơ nghiệm thu: _acceptance/collections-khong-so-s02 (AC-1…AC-6; luật tĩnh ở scripts/check-portal-compliance.mjs,
// AC-7 ở scripts/smoke-collections-khong-so-s02.mjs). Ma trận 7 số lính canh viết trước ở hợp đồng §Context; đếm mọi dạng
// in (thô, vi-VN, rút gọn). Đối chứng dương: cùng dữ liệu dựng bằng mã main 9e759b4 (git show vào node_modules/.cache —
// tsc và eslint đều bỏ qua chỗ đó) phải hiện mỗi lính canh ≥ 1 lần. Tên ca mở đầu bằng mã AC (ON6-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import pg from "pg"

import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S = `on6_app_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = path.resolve(import.meta.dirname, "..")
const MAIN = "9e759b4"
const MAIN_DIR = path.join(APP, `node_modules/.cache/on6-main-${process.pid}`)
const NOW = Date.parse("2026-10-25T05:00:00Z")
const ISO = new Date(NOW - 3_600_000).toISOString()

// ---------- ma trận lính canh (hợp đồng §Context) ----------
const LINH_CANH = { s02Items24h: 987654, s02Stg: 876543, s02Offers: 765432, rotTotal: 654321, rotCursor: 543210, cloudS02: 432109 } as const
const TEN = Array.from({ length: 6 }, (_, i) => `Lính canh S02 ${i + 1}`)

type Feed = import("../src/lib/ops-queries").SourceFeedHealth
const feed = (code: string, items24h: number, extra: Partial<Feed> = {}): Feed => ({
  code, labelVi: code, status: "active", note: null, lastRunAt: ISO, lastRunSource: null, items24h, stgRows: 5, offers: 7,
  freshnessHrs: 2, sloHours: 48, freshness: "fresh", ...extra,
})
const FEEDS: Feed[] = [
  feed("S01", 3), feed("S02", LINH_CANH.s02Items24h, { stgRows: LINH_CANH.s02Stg, offers: LINH_CANH.s02Offers, freshnessHrs: 9 }),
  feed("S03", 50), feed("S06", 20),
]
const ROTATION = {
  updatedAt: ISO, cursor: LINH_CANH.rotCursor, total: LINH_CANH.rotTotal,
  next: TEN.map((name, i) => ({ id: String(100 + i), name, lastCapturedAt: null })),
}
const DAYS = Array.from({ length: 7 }, (_, i) => ({
  day: `2026-10-${String(25 - i).padStart(2, "0")}`, airbnbListingsSeen: 3, airbnbSnapshots: 1, zaloPosts: 2, zaloOffers: 1,
}))

let fmt: typeof import("../src/lib/format")
/** Số lần xuất hiện của một lính canh ở MỌI dạng in: thô, vi-VN (fmtInt), rút gọn (fmtCompact). */
function dem(html: string, v: number | string): number {
  const forms = typeof v === "string" ? [v] : [...new Set([String(v), fmt.fmtInt(v), fmt.fmtCompact(v)])]
  return forms.reduce((n, f) => n + html.split(f).length - 1, 0)
}

async function render(el: unknown): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}

/** Tệp mở đầu bằng chỉ thị "use client" (sau các dòng chú thích) — ranh giới server→client của Next. */
function laClientSrc(src: string): boolean {
  return /^(\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/))*\s*["']use client["']/.test(src)
}

// ---------- lược đồ tạm + bản sao mã main ----------
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
before(async () => {
  try {
    fmt = await import("../src/lib/format")
    await admin.connect()
    await makeOpsSchema(admin, S)
    for (const t of ["listings"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
    // S02 nhiều bản ghi nhất trong 24 giờ (5 lượt chạy) — biên «Nhiều nhất» không được là S02.
    for (let i = 0; i < 5; i++)
      await admin.query(
        `INSERT INTO "${S}".airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1, 'hanoi', 'airdna-research', now() - interval '1 hour', '{}'::jsonb)`,
        [`on6-s02-${i}`],
      )
    // Bản sao mã main của thư mục collections/: viết lại alias @/ thành đường tuyệt đối, thêm React (JSX cổ điển ngoài tsconfig).
    mkdirSync(MAIN_DIR, { recursive: true })
    const files = execFileSync("git", ["-C", APP, "ls-tree", "--name-only", MAIN, "src/components/ops/collections/"], { encoding: "utf8" }).trim().split("\n")
    files.push("src/components/ops/collections-tables.tsx")
    for (const f of files) {
      // vùng của trang (collections/*, collections-tables) trỏ vào bản sao main; mọi thứ khác trỏ mã hiện tại
      const raw = execFileSync("git", ["-C", APP, "show", `${MAIN}:app/${f}`], { encoding: "utf8" })
      if (laClientSrc(raw)) MAIN_CLIENT.add(path.join(MAIN_DIR, path.basename(f)))
      const src = raw
        .replaceAll('from "@/components/ops/collections/', `from "${MAIN_DIR}/`)
        .replaceAll('from "@/components/ops/collections-tables"', `from "${MAIN_DIR}/collections-tables"`)
        .replaceAll('from "@/', `from "${path.join(APP, "src")}/`)
        .replace(/^"use client"\n/m, "")
      writeFileSync(path.join(MAIN_DIR, path.basename(f)), (f.endsWith(".tsx") ? 'import * as React from "react";\n' : "") + src)
    }
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  rmSync(MAIN_DIR, { recursive: true, force: true })
  await dropOpsSchema(admin, S).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const MAIN_CLIENT = new Set<string>()
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm / bản sao main không được — eval đòi chạy thật: ${setupErr}`)
const mainMod = (f: string) => import(path.join(MAIN_DIR, f))

// ---------- AC-1, AC-2: biểu đồ ----------

/** Chuỗi S02 còn trong tab Listing hoặc cấu hình chú giải. */
const chuoiS02 = (series: string[], config: Record<string, unknown>) => [...new Set([...series, ...Object.keys(config)].filter((k) => /airdna|s02/i.test(k)))]

describe("ON6-AC-1 tab Listing", () => {
  test("ON6-AC-1 tab Listing chỉ chuỗi S01 listing tươi", async () => {
    const { SERIES, configOf, SyncActivity } = await import("../src/components/ops/collections/sync-activity")
    assert.deepEqual(SERIES.listings, ["airbnbListingsSeen"])
    assert.deepEqual(chuoiS02(SERIES.listings, configOf({})), [])
    const html = await render(<SyncActivity days={DAYS} />)
    assert.ok(html.includes("21 listing trong 7 ngày"), "tổng tab Listing phải chỉ cộng listing tự thu (7 × 3)")
  })
  test("ON6-AC-1 bản sao thêm chuỗi airdnaListings → báo tên chuỗi", async () => {
    const { configOf } = await import("../src/components/ops/collections/sync-activity")
    assert.deepEqual(chuoiS02(["airbnbListingsSeen", "airdnaListings"], { ...configOf({}), airdnaListings: {} }), ["airdnaListings"])
  })
})

/** Lỗi mô tả biểu đồ theo tab: phải nói đang đếm gì, kèm tổng và giờ VN. */
function loiMoTa(tab: "listings" | "zalo", text: string, total: number): string[] {
  const can = tab === "listings" ? "Listing tự thu (S01)" : "Bài thô và tin rao S03 theo ngày đăng"
  const out: string[] = []
  if (!text.includes(can)) out.push(`${tab}: thiếu «${can}»`)
  if (!text.includes(fmt.fmtInt(total))) out.push(`${tab}: thiếu tổng ${total}`)
  if (!text.includes("giờ VN")) out.push(`${tab}: thiếu «giờ VN»`)
  return out
}
describe("ON6-AC-2 mô tả biểu đồ", () => {
  test("ON6-AC-2 mô tả biểu đồ nói đang đếm gì theo tab", async () => {
    ready()
    const { describeMode } = await import("../src/components/ops/collections/sync-activity")
    assert.deepEqual(loiMoTa("listings", describeMode("listings", 21), 21), [])
    assert.deepEqual(loiMoTa("zalo", describeMode("zalo", 21), 21), [])
  })
  test("ON6-AC-2 bản sao mô tả chung → báo tab", () => {
    ready()
    assert.deepEqual(loiMoTa("listings", "21 bản ghi trong 7 ngày (ngày theo giờ VN)", 21), ["listings: thiếu «Listing tự thu (S01)»"])
  })
})

// ---------- AC-3: bảng máy thu + câu SQL ----------

const thIds = (html: string) => [...html.slice(html.indexOf("<thead"), html.indexOf("</thead>")).matchAll(/<th[^>]*data-col-id="([^"]+)"/g)].map((m) => m[1])
const sqlS02 = (sqls: string[]) => [...new Set(sqls.flatMap((q) => [...q.matchAll(/\b(airdna_\w+|ref_calib_\w+)/g)].map((m) => m[1])))]

describe("ON6-AC-3 bảng luồng máy thu", () => {
  test("ON6-AC-3 bảng máy thu 5 cột, getFlowDays không đọc airdna", async () => {
    ready()
    const { FlowTable } = await import("../src/components/ops/collections-tables")
    assert.deepEqual(thIds(await render(<FlowTable days={DAYS} />)), ["day", "airbnbSeen", "airbnbSnapshots", "zaloPosts", "zaloOffers"])
    const { pool } = await import("../src/lib/db")
    const seen: string[] = []
    const orig = pool.query.bind(pool)
    ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
      seen.push(String(typeof sql === "string" ? sql : (sql as { text?: string })?.text ?? ""))
      return (orig as (...a: unknown[]) => unknown)(sql, ...rest)
    }
    try {
      const { getFlowDays } = await import("../src/lib/collections-queries")
      await getFlowDays(7, { now: NOW })
    } finally {
      ;(pool as unknown as { query: unknown }).query = orig
    }
    console.log(`# ON6-AC-3 getFlowDays chạy ${seen.length} câu SQL`)
    assert.ok(seen.length > 0, "phép ghi câu SQL phải thấy getFlowDays chạy")
    assert.deepEqual(sqlS02(seen), [])
  })
  test("ON6-AC-3 bản sao còn cột airdnaMarkets → báo cột", async () => {
    const { FlowTable } = await import("../src/components/ops/collections-tables")
    const html = (await render(<FlowTable days={DAYS} />)).replace('<th ', '<th data-col-id="airdnaMarkets">S02</th><th ')
    assert.deepEqual(thIds(html).filter((x) => /airdna/.test(x)), ["airdnaMarkets"])
  })
  test("ON6-AC-3 bản sao SQL còn airdna_listings → báo tên bảng", () => {
    assert.deepEqual(sqlS02(["SELECT d FROM listings", "SELECT d, count(*) FROM airdna_listings WHERE x GROUP BY 1"]), ["airdna_listings"])
  })
})

// ---------- AC-4: Rotation ----------

/** Lỗi Rotation theo Hỏi-2: còn tên thị trường hoặc số thị trường/con trỏ ở mọi dạng. */
function loiRotation(html: string): string[] {
  const out = TEN.filter((t) => html.includes(t)).map((t) => `tên «${t}»`)
  if (dem(html, LINH_CANH.rotTotal)) out.push(`lính canh số thị trường ${LINH_CANH.rotTotal}`)
  if (dem(html, LINH_CANH.rotCursor)) out.push(`lính canh con trỏ ${LINH_CANH.rotCursor}`)
  return out
}
describe("ON6-AC-4 Rotation", () => {
  test("ON6-AC-4 Rotation theo Hỏi-2: lịch, lượt thu mỗi đêm, giờ cập nhật — không số thị trường, con trỏ, tên", async () => {
    ready()
    const { RotationPanel } = await import("../src/components/ops/collections/pipe-panels")
    const html = await render(<RotationPanel rotation={ROTATION} />)
    assert.deepEqual(loiRotation(html), [])
    assert.ok(html.includes("6 lượt thu mỗi đêm lúc 19:05"), "thiếu lịch và lượt thu")
    assert.ok(html.includes(`Cập nhật ${fmt.fmtVnDateTime(ISO)}`), "thiếu giờ cập nhật")
  })
  test("ON6-AC-4 bản sao liệt tên → báo tên", async () => {
    ready()
    const { RotationPanel } = await import("../src/components/ops/collections/pipe-panels")
    const html = (await render(<RotationPanel rotation={ROTATION} />)) + `<span>${TEN[2]}</span>`
    assert.deepEqual(loiRotation(html), [`tên «${TEN[2]}»`])
  })
  test("ON6-AC-4 bản sao hiện số thị trường → báo lính canh", async () => {
    ready()
    const old = await mainMod("pipe-panels.tsx")
    const loi = loiRotation(await render(<old.RotationPanel rotation={ROTATION} />))
    assert.ok(loi.includes(`lính canh số thị trường ${LINH_CANH.rotTotal}`), loi.join(" | "))
  })
})

// ---------- AC-5: lưới nguồn + ô Bản ghi 24h ----------

/** Ô «Bản ghi 24h» trên HTML trang: giá trị và mã «Nhiều nhất». */
function oBanGhi(html: string): { value: string | null; busiest: string | null; note: boolean } {
  const i = html.indexOf("Bản ghi 24h")
  const seg = i < 0 ? "" : html.slice(i, i + 2500)
  return {
    value: seg.match(/>([\d.]+|—)</)?.[1] ?? null,
    busiest: seg.match(/Nhiều nhất: ([^\s<(]+) \(/)?.[1] ?? null,
    note: seg.includes("không tính S02"),
  }
}
const loiOBanGhi = (o: ReturnType<typeof oBanGhi>, tong: number) => {
  const out: string[] = []
  if (o.value !== fmt.fmtInt(tong)) out.push(`tổng ${o.value} ≠ ${fmt.fmtInt(tong)}`)
  if (o.busiest && /^s02$/i.test(o.busiest)) out.push(`Nhiều nhất: ${o.busiest}`)
  if (!o.note) out.push("thiếu «không tính S02»")
  return out
}
/** Hàng S02 của lưới nguồn: ba ô «Xem Chất lượng» trỏ /ops/quality, độ tươi còn. */
function loiHangS02(html: string): string[] {
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => m[0]).filter((r) => r.includes(">S02<") || r.includes(">S02 "))
  if (rows.length !== 1) return [`hàng S02: ${rows.length} hàng`]
  const r = rows[0]
  const out: string[] = []
  const links = r.match(/<a[^>]*href="\/ops\/quality"[^>]*>Xem Chất lượng<\/a>/g) ?? []
  if (links.length !== 3) out.push(`hàng S02: ${links.length}/3 ô «Xem Chất lượng»`)
  for (const v of [LINH_CANH.s02Items24h, LINH_CANH.s02Stg, LINH_CANH.s02Offers]) if (dem(r, v)) out.push(`hàng S02: còn số ${v}`)
  if (!r.includes(fmtAgeOf(9))) out.push("hàng S02: mất độ tươi")
  return out
}
let fmtAgeOf: (h: number) => string = () => ""

describe("ON6-AC-5 lưới nguồn và ô Bản ghi 24h", () => {
  test("ON6-AC-5 hàng S02 lưới nguồn không số, trạng thái và độ tươi còn", async () => {
    ready()
    fmtAgeOf = (await import("../src/lib/freshness")).fmtAge
    const { FeedsGrid } = await import("../src/components/ops/collections/feeds-grid")
    assert.deepEqual(loiHangS02(await render(<FeedsGrid feeds={FEEDS} />)), [])
    const { CollectionsTiles } = await import("../src/components/ops/collections/collections-tiles")
    const funnel = { lastEventAt: null, today: { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }, last7: { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 } }
    const o = oBanGhi(await render(<CollectionsTiles feeds={FEEDS} funnel={funnel} layers={[]} agentTurnsToday={null} />))
    console.log(`# ON6-AC-5 máy thu: ô Bản ghi 24h ${o.value} · Nhiều nhất ${o.busiest}`)
    assert.deepEqual(loiOBanGhi(o, 3 + 50 + 20), [])
    assert.equal(o.busiest, "S03")
  })
  test("ON6-AC-5 máy chủ vòng trọn: bản tin bên ghi thật qua readOpsFacts, ô Bản ghi 24h = records24h trừ S02, Nhiều nhất không là S02", async () => {
    ready()
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    const by = r.payload.blocks.records24h.bySource as { code: string; n: number }[]
    const s02 = by.find((x) => x.code === "S02")?.n ?? 0
    assert.ok(by.every((x) => x.code === "S02" || x.n < s02), `S02 phải nhiều nhất trên lược đồ tạm: ${JSON.stringify(by)}`)
    await ghiBanTin(r.payload)
    const o = oBanGhi(await trangMayChu())
    const tong = by.filter((x) => x.code.toUpperCase() !== "S02").reduce((a, x) => a + x.n, 0)
    console.log(`# ON6-AC-5 máy chủ: records24h ${JSON.stringify(by)} → ô ${o.value} · Nhiều nhất ${o.busiest}`)
    assert.deepEqual(loiOBanGhi(o, tong), [])
  })
  test("ON6-AC-5 bản sao cộng cả S02 → báo tổng sai", async () => {
    ready()
    const old = await mainMod("collections-tiles.tsx")
    const funnel = { lastEventAt: null, today: { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }, last7: { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 } }
    const loi = loiOBanGhi(oBanGhi(await render(<old.CollectionsTiles feeds={FEEDS} funnel={funnel} layers={[]} agentTurnsToday={null} />)), 73)
    assert.ok(loi.some((l) => l.startsWith("tổng ")) && loi.includes("Nhiều nhất: S02"), loi.join(" | "))
  })
  test("ON6-AC-5 bên ghi viết mã s02 thường → báo", async () => {
    ready()
    const f = mutantPush("on6-s02-thuong.mjs", (src: string) =>
      src.replace("bySource: await readRecords24h(client)", 'bySource: (await readRecords24h(client)).map((x) => (x.code === "S02" ? { ...x, code: "s02" } : x))'))
    const r = await push({ script: f })
    await ghiBanTin(r.payload)
    const by = r.payload.blocks.records24h.bySource as { code: string; n: number }[]
    const tong = by.filter((x) => x.code.toUpperCase() !== "S02").reduce((a, x) => a + x.n, 0)
    const loi = loiOBanGhi(oBanGhi(await trangMayChu()), tong)
    assert.ok(loi.some((l) => l.startsWith("tổng ")), loi.join(" | "))
  })
})

// ---------- máy chủ: bản tin bên ghi thật → ops_heartbeat lược đồ tạm → readOpsFacts → trang ----------

type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
const push = (opts: Record<string, unknown> = {}) =>
  captureOpsFacts({ ...opts, env: { DATABASE_URL: schemaUrl(S), ...((opts.env as object) ?? {}) } }) as Promise<{ code: number; stderr: string; payload: Payload }>
async function ghiBanTin(payload: Payload) {
  await admin.query(
    `INSERT INTO "${S}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, now())
     ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, pushed_at = EXCLUDED.pushed_at`,
    [payload],
  )
}
const EMPTY = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
const BASE = {
  days: DAYS, funnel: { lastEventAt: null, today: EMPTY, last7: EMPTY }, jobs: [], rotation: ROTATION, zaloGroups: [], zaloAllowlist: [],
  zaloHealth: { connected: null, uptime24h: null, heartbeatAgeMin: null, lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false },
  factsPushedAt: null, lockdown: { layers: [], lastWatchdogAt: null, agentTurnsToday: null, openClawUp: false, kevUp: false, collectorUp: false }, nowMs: NOW,
}
async function trangMayChu(View?: (p: never) => unknown): Promise<string> {
  const { getCloudOpsView } = await import("../src/lib/ops-cloud")
  const { getCloudFlowDays } = await import("../src/lib/collections-queries")
  const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
  const cloud = await getCloudOpsView({ now: new Date() })
  const cloudDays = cloud.state === "none" ? [] : await getCloudFlowDays(cloud.luong7, { now: NOW })
  const V = (View ?? CollectionsView) as unknown as React.ComponentType<Record<string, unknown>>
  return render(<V {...BASE} feedHealth={cloud.feeds ?? []} cloud={cloud} cloudDays={cloudDays} />)
}

// ---------- AC-6: toàn trang, ma trận lính canh ----------

describe("ON6-AC-6 toàn trang", () => {
  test("ON6-AC-6 toàn trang máy thu và máy chủ: 7 lính canh S02 xuất hiện 0 lần", async () => {
    ready()
    const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
    const oldView = (await mainMod("collections-view.tsx")).CollectionsView
    const local = await render(<CollectionsView {...BASE} feedHealth={FEEDS} />)
    const localMain = await render(oldView({ ...BASE, feedHealth: FEEDS }))
    // máy chủ: bản tin bên ghi thật, hàng S02 của records24h mang lính canh hàng 7
    const p = (await push()).payload
    const by = (p.blocks.records24h.bySource as { code: string; n: number }[]).filter((x) => x.code !== "S02")
    p.blocks.records24h.bySource = [...by, { code: "S02", n: LINH_CANH.cloudS02 }]
    await ghiBanTin(p)
    const cloud = await trangMayChu()
    const cloudMain = await trangMayChu(oldView as never)
    const MA_TRAN: [string, string, string, number | string][] = [
      ["1", "máy thu", "lưới nguồn S02 · items24h", LINH_CANH.s02Items24h],
      ["2", "máy thu", "lưới nguồn S02 · stgRows", LINH_CANH.s02Stg],
      ["3", "máy thu", "lưới nguồn S02 · offers", LINH_CANH.s02Offers],
      ["4", "máy thu", "Rotation · total", LINH_CANH.rotTotal],
      ["5", "máy thu", "Rotation · cursor", LINH_CANH.rotCursor],
      ["6", "máy thu", "Rotation · next[].name", TEN[0]],
      ["7", "máy chủ", "records24h S02 · n", LINH_CANH.cloudS02],
    ]
    const loi: string[] = []
    for (const [so, noi, truong, v] of MA_TRAN) {
      const [sau, truoc] = noi === "máy thu" ? [dem(local, v), dem(localMain, v)] : [dem(cloud, v), dem(cloudMain, v)]
      const truocTen = so === "6" ? TEN.reduce((n, t) => n + dem(localMain, t), 0) : truoc
      const sauTen = so === "6" ? TEN.reduce((n, t) => n + dem(local, t), 0) : sau
      console.log(`# ON6-AC-6 hàng ${so} ${noi} ${truong}: ${sauTen} lần (bản sao gỡ ẩn: ${truocTen} lần)`)
      if (sauTen !== 0) loi.push(`hàng ${so} ${truong}: còn ${sauTen} lần`)
      if (truocTen < 1) loi.push(`hàng ${so} ${truong}: đối chứng dương 0 lần — phép đếm không thấy dạng in`)
    }
    assert.deepEqual(loi, [])
  })
})

// ---------- AC-6 (lượt 2): ranh giới server→client — props mà component client nhận ----------
// Next tuần tự hoá props của component "use client" vào luồng RSC trong HTML trang, kể cả trường component không in ra.
// renderToStaticMarkup không thấy luồng đó, nên đo thẳng props: đi cây phần tử từ CollectionsView, mở mọi component
// server, ghi props của mỗi component client (và của component không mở được — coi như ranh giới, chiều an toàn).

/** Giải một đặc tả import thành tệp nguồn (alias @/, tương đối, tuyệt đối); gói npm → null. */
function giaiImport(spec: string, dir: string): string | null {
  const base = spec.startsWith("@/") ? path.join(APP, "src", spec.slice(2)) : spec.startsWith(".") ? path.resolve(dir, spec) : spec.startsWith("/") ? spec : null
  if (!base) return null
  for (const ext of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext
  return null
}

/** Mọi export của các tệp client mà các tệp server của trang import. */
async function bienClient(serverFiles: string[], laClient: (f: string) => boolean): Promise<Set<unknown>> {
  const set = new Set<unknown>()
  for (const f of serverFiles)
    for (const [, spec] of readFileSync(f, "utf8").matchAll(/from "([^"]+)"/g)) {
      const file = giaiImport(spec, path.dirname(f))
      if (!file || !laClient(file)) continue
      for (const v of Object.values(await import(file))) if (v) set.add(v)
    }
  return set
}

const boKhoaRieng = (k: string, v: unknown) => (k.startsWith("_") ? undefined : v)

/** JSON props của mọi component client (hoặc không mở được) trong cây dựng từ `el`. */
async function propsClient(el: unknown, client: Set<unknown>): Promise<string> {
  const out: string[] = []
  const ghi = (props: unknown) => {
    out.push(JSON.stringify(props, boKhoaRieng) ?? "")
  }
  async function di(n: unknown): Promise<void> {
    if (n instanceof Promise) return di(await n)
    if (Array.isArray(n)) {
      for (const c of n) await di(c)
      return
    }
    if (n == null || typeof n !== "object" || !("props" in n) || !("type" in n)) return
    const { type, props } = n as { type: unknown; props: Record<string, unknown> }
    if (client.has(type)) return ghi(props)
    const fn = typeof type === "function" ? type : (type as { render?: unknown } | null)?.render
    if (typeof fn === "function") {
      let r: unknown
      try {
        r = (fn as (p: unknown) => unknown)(props)
      } catch {
        return ghi(props) // hook ngoài lượt render → component client không khai trong bộ đọc: coi là ranh giới
      }
      return di(r)
    }
    return di(props.children) // thẻ HTML, Fragment, Provider
  }
  const err = console.error
  console.error = () => {} // React báo «Invalid hook call» cho mỗi component client gọi thử — đã bắt ở catch
  try {
    await di(el)
  } finally {
    console.error = err
  }
  return out.join("\n")
}

const SERVER_FILES = ["collections-view.tsx", "pipe-panels.tsx", "attention-list.tsx", "section.tsx"]

describe("ON6-AC-6 ranh giới server→client", () => {
  test("ON6-AC-6 props component client (luồng RSC) không mang lính canh S02 hàng 1–3 và 7", async () => {
    ready()
    const dirNay = path.join(APP, "src/components/ops/collections")
    const laClientNay = (f: string) => laClientSrc(readFileSync(f, "utf8"))
    const clientNay = await bienClient(SERVER_FILES.map((f) => path.join(dirNay, f)), laClientNay)
    const clientMain = await bienClient(
      SERVER_FILES.map((f) => path.join(MAIN_DIR, f)),
      (f) => MAIN_CLIENT.has(f) || (!f.startsWith(MAIN_DIR) && laClientNay(f)),
    )
    const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
    const oldView = (await mainMod("collections-view.tsx")).CollectionsView
    const localNay = await propsClient(<CollectionsView {...BASE} feedHealth={FEEDS} />, clientNay)
    const localMain = await propsClient(oldView({ ...BASE, feedHealth: FEEDS }), clientMain)
    const p = (await push()).payload
    const by = (p.blocks.records24h.bySource as { code: string; n: number }[]).filter((x) => x.code !== "S02")
    p.blocks.records24h.bySource = [...by, { code: "S02", n: LINH_CANH.cloudS02 }]
    await ghiBanTin(p)
    const { getCloudOpsView } = await import("../src/lib/ops-cloud")
    const cloud = await getCloudOpsView({ now: new Date() })
    const cloudProps = { ...BASE, feedHealth: cloud.feeds ?? [], cloud, cloudDays: [] }
    const cloudNay = await propsClient(<CollectionsView {...(cloudProps as Parameters<typeof CollectionsView>[0])} />, clientNay)
    const cloudMain = await propsClient(oldView(cloudProps), clientMain)
    const HANG: [string, string, number, string, string][] = [
      ["1", "lưới nguồn S02 · items24h", LINH_CANH.s02Items24h, localNay, localMain],
      ["2", "lưới nguồn S02 · stgRows", LINH_CANH.s02Stg, localNay, localMain],
      ["3", "lưới nguồn S02 · offers", LINH_CANH.s02Offers, localNay, localMain],
      ["7", "records24h S02 · n (máy chủ)", LINH_CANH.cloudS02, cloudNay, cloudMain],
    ]
    const loi: string[] = []
    console.log(`# ON6-AC-6 ranh giới: ${clientNay.size} export client ở mã hiện tại, ${clientMain.size} ở bản sao main`)
    for (const [so, truong, v, nay, main] of HANG) {
      const [sau, truoc] = [dem(nay, v), dem(main, v)]
      console.log(`# ON6-AC-6 ranh giới hàng ${so} ${truong}: ${sau} lần trong props client (bản sao main: ${truoc} lần)`)
      if (sau !== 0) loi.push(`hàng ${so} ${truong}: còn ${sau} lần trong props client`)
      if (truoc < 1) loi.push(`hàng ${so} ${truong}: đối chứng dương 0 lần — bộ đi cây không thấy props client`)
    }
    assert.deepEqual(loi, [])
  })
})
