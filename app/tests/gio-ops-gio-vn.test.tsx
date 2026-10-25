// gio-ops-gio-vn.test.tsx — cổng Ops đọc mốc theo giờ Việt Nam (OPS-7) và nguồn quá hạn hiện mức trễ (YC4).
// Hồ sơ nghiệm thu: _acceptance/gio-ops-gio-vn (AC-1…AC-5, AC-7…AC-9; AC-6 ở pipeline/scripts/vn-day.test.mjs).
// Tên ca mở đầu bằng mã AC (GV-AC-n).
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import pg from "pg"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { fmtOverdue } from "../src/lib/freshness"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")

// Lược đồ tạm cho AC-4: pool của app (src/lib/db) đọc DATABASE_URL lúc nạp — đặt TRƯỚC mọi import động, search_path
// CHỈ lược đồ tạm (không rơi về bảng thật của DB local dùng chung).
const SCHEMA = `gio_vn_test_${process.pid}`
const BASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
{
  const u = new URL(BASE_URL)
  u.searchParams.set("options", `-c search_path=${SCHEMA}`)
  process.env.DATABASE_URL = u.toString()
}
const MUI_MAY = ["UTC", "America/New_York"] as const

/**
 * Chạy bộ định dạng trong TIẾN TRÌNH CON có TZ đặt từ lúc khởi động: Intl dựng lúc nạp module theo múi máy, nên đổi
 * process.env.TZ giữa chừng không chứng gì (phá-thử 24/10: bỏ timeZone mà ca vẫn xanh trên máy giờ VN).
 */
function chayDuoiMui(mui: string, file: string, dauVao: unknown[]): { gio: string; ngay: string }[] {
  const code = `const m = await import(${JSON.stringify(pathToFileURL(file).href)});
const vao = JSON.parse(process.argv[1]).map(([k, v]) => (k === "date" ? new Date(v) : v));
process.stdout.write(JSON.stringify(vao.map((v) => ({ gio: m.fmtVnDateTime(v), ngay: m.fmtVnDate(v) }))));`
  const ma = dauVao.map((v) => (v instanceof Date ? ["date", v.toISOString()] : ["v", v]))
  const out = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code, JSON.stringify(ma)], {
    cwd: APP,
    env: { ...process.env, TZ: mui },
    encoding: "utf8",
  })
  return JSON.parse(out) as { gio: string; ngay: string }[]
}

// ---------- AC-1: bộ định dạng ----------

const MA_TRAN: [string, unknown, string, string][] = [
  ["ISO Z", "2026-10-23T12:13:00Z", "2026-10-23 19:13 (GMT+7)", "2026-10-23"],
  ["16:59Z (23:59 VN)", "2026-10-23T16:59:00Z", "2026-10-23 23:59 (GMT+7)", "2026-10-23"],
  ["17:00Z (nửa đêm VN)", "2026-10-23T17:00:00Z", "2026-10-24 00:00 (GMT+7)", "2026-10-24"],
  ["17:30Z (00:30 VN)", "2026-10-23T17:30:00Z", "2026-10-24 00:30 (GMT+7)", "2026-10-24"],
  ["date -Iseconds +07:00", "2026-10-24T00:30:12+07:00", "2026-10-24 00:30 (GMT+7)", "2026-10-24"],
  ["Postgres ::text +00", "2026-10-23 12:13:45.123+00", "2026-10-23 19:13 (GMT+7)", "2026-10-23"],
  ["không ghi múi", "2026-10-24 00:30:12", "—", "—"],
  ["Date", new Date("2026-10-23T12:13:00Z"), "2026-10-23 19:13 (GMT+7)", "2026-10-23"],
  ["số mili giây", Date.UTC(2026, 9, 23, 17, 30), "2026-10-24 00:30 (GMT+7)", "2026-10-24"],
  ["null", null, "—", "—"],
  ["chuỗi rác", "hôm qua", "—", "—"],
]

test("GV-AC-1 fmtVnDateTime/fmtVnDate ma trận viết trước dưới TZ=UTC và TZ=America/New_York", () => {
  assert.equal(MA_TRAN.length, 11)
  for (const mui of MUI_MAY) {
    const kq = chayDuoiMui(mui, join(APP, "src/lib/format.ts"), MA_TRAN.map((r) => r[1]))
    MA_TRAN.forEach(([ten, , gio, ngay], i) => {
      assert.equal(kq[i].gio, gio, `${ten} · fmtVnDateTime · TZ=${mui}`)
      assert.equal(kq[i].ngay, ngay, `${ten} · fmtVnDate · TZ=${mui}`)
    })
  }
})

// ---------- AC-7: mức trễ ----------

const SLO = 8 * 24
const MA_TRAN_TRE: [string, number | null, number | null, string | null][] = [
  ["8,4 ngày / 8 ngày", 8.4 * 24, SLO, "trễ 9 giờ"],
  ["SLO + 30 giây", SLO + 30 / 3600, SLO, "trễ 1 phút"],
  ["SLO + 59 phút", SLO + 59 / 60, SLO, "trễ 59 phút"],
  ["SLO + 60 phút", SLO + 1, SLO, "trễ 1 giờ"],
  ["SLO + 47 giờ 59 phút", SLO + 47 + 59 / 60, SLO, "trễ 47 giờ"],
  ["SLO + 48 giờ", SLO + 48, SLO, "trễ 2 ngày"],
  ["SLO + 3 ngày 5 giờ", SLO + 77, SLO, "trễ 3 ngày"],
  ["30 giờ / 24 giờ", 30, 24, "trễ 6 giờ"],
  ["tuổi = SLO", SLO, SLO, null],
  ["7 ngày / 8 ngày", 7 * 24, SLO, null],
  ["tuổi null", null, SLO, null],
]

test("GV-AC-7 fmtOverdue ma trận viết trước", () => {
  assert.equal(MA_TRAN_TRE.length, 11)
  for (const [ten, tuoi, slo, mong] of MA_TRAN_TRE) assert.equal(fmtOverdue(tuoi, slo), mong, ten)
})

// ---------- AC-2, AC-8, AC-9: render thật các chỗ hiện mốc trên cổng Ops ----------

async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
const h = async (path: string, name: string, props: Record<string, unknown>) => {
  const React = await import("react")
  const mod = (await import(path)) as Record<string, React.ComponentType<Record<string, unknown>>>
  return html(React.createElement(mod[name], props))
}

// Mốc mẫu ở đúng khuôn nguồn của từng chỗ: ISO «Z» của Node (toISOString / mtime), `::text` của Postgres (phiên UTC),
// `date -Iseconds` của watchdog (giờ máy, có +07:00).
const ISO = "2026-10-23T12:13:00.000Z"
const PG_TEXT = "2026-10-23 12:13:45.123+00"
const WATCHDOG = "2026-10-23T19:13:00+07:00"
const NGAY_ISO = "2026-10-23T17:30:00.000Z" // 00:30 VN ngày 24
const GIO_VN = "2026-10-23 19:13 (GMT+7)"
const NGAY_VN = "2026-10-24"

const ZERO = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
const ZALO = { connected: true, uptime24h: 1, heartbeatAgeMin: 1, lastHeartbeatAt: ISO, lastPostAt: ISO, silentAlert24h: false, driftAlert24h: false }
const cov = (code: string, ageHours: number | null, sloHours: number, status: "fresh" | "stale" | "none", lastSnapshotAt: string | null = ISO) => ({
  code, city: "hanoi", lastSnapshotAt, ageHours, sloHours, ageDays: ageHours === null ? null : Math.floor(ageHours / 24), sloDays: sloHours / 24, status,
})
const feed = (code: string, freshnessHrs: number | null, sloHours: number | null, freshness: "fresh" | "stale" | null, lastRunAt: string | null = ISO) => ({
  code, labelVi: "Nguồn thử", status: "active", note: null, lastRunAt, lastRunSource: null, items24h: 1, stgRows: 1, offers: null, freshnessHrs, sloHours, freshness,
})

const chu = (markup: string) => markup.replace(/<[^>]*>/g, " ")

/** Danh sách viết trước 11 chỗ hiện mốc (design doc §1): tên · cách render · chuỗi phải có. */
const CHO: [string, () => Promise<string>, string][] = [
  ["bảng kiểm tra chất lượng", () => h("../src/components/ops/quality/dq-checks-table", "DqChecksTable", { rows: [{ check_name: "c", entity: "e", status: "pass", detail: null, checked_at: PG_TEXT }] }), GIO_VN],
  ["job", () => h("../src/components/ops/collections/jobs-grid", "JobsGrid", { jobs: [{ id: "j", label: "Job thử", schedule: "19:05", alive: "yes", lastLogAt: ISO, lastLine: "ok" }] }), GIO_VN],
  ["nguồn thu", () => h("../src/components/ops/collections/feeds-grid", "FeedsGrid", { feeds: [feed("S01", 1, 24, "fresh")] }), GIO_VN],
  ["vòng xoay", () => h("../src/components/ops/collections/pipe-panels", "RotationPanel", { rotation: { updatedAt: ISO, cursor: 1, total: 2, next: [] } }), GIO_VN],
  ["sự kiện cuối cổng Kev", () => h("../src/components/ops/collections/pipe-panels", "ZaloPipePanel", { zalo: ZALO, funnel: { lastEventAt: ISO, today: ZERO, last7: ZERO }, lastPostHours: 1 }), GIO_VN],
  ["watchdog chạy cuối", () => h("../src/components/ops/collections/lockdown-grid", "LockdownGrid", { layers: [{ layer: "L1", desc: "d", ok: true }], lastWatchdogAt: WATCHDOG }), GIO_VN],
  ["snapshot cuối · bảng mục tiêu", () => h("../src/components/ops/overview/objectives-grid", "ObjectivesGrid", { rows: [cov("S01", 1, 24, "fresh", NGAY_ISO)] }), NGAY_VN],
  ["snapshot cuối · ô tổng quan", () => h("../src/components/ops/overview/overview-tiles", "OverviewTiles", { rows: [cov("S01", 1, 24, "fresh", NGAY_ISO)] }), NGAY_VN],
  ["ngày thu · độ phủ trung thực", () => h("../src/components/ops/quality-tables", "TruthfulCoverageTable", { rows: [{ areaId: "a", name: "A", ourListings: 1, airdnaActive: 1, airdnaPeriod: null, airdnaUniverse: 1, historyMonths: 1, capturedAt: NGAY_ISO, ratio: 1, nMarkets: 1 }] }), NGAY_VN],
  ["ngày thu · hiệu chuẩn", () => h("../src/components/ops/quality-tables", "CalibrationTable", { marketName: "Hà Nội", data: { marketScore: null, metrics: [], submarketCount: 0, capturedAt: NGAY_ISO } }), NGAY_VN],
  ["tin rao thấy lần đầu", () => h("../src/components/ops/deal-seen-note", "DealSeenNote", { firstSeen: NGAY_ISO, nReposts: 1 }), NGAY_VN],
]

test("GV-AC-2 danh sách chỗ hiện mốc đủ 11", () => assert.equal(CHO.length, 11))
for (const [ten, render, mong] of CHO) {
  test(`GV-AC-2 ${ten} render mốc theo giờ VN`, async () => {
    // Chữ người thấy: bỏ thẻ và thuộc tính (mã hàng của data-grid có thể mang mốc gốc, không hiện ra).
    const out = chu(await render())
    assert.ok(out.includes(mong), `${ten}: thiếu «${mong}»`)
    assert.ok(!out.includes("12:13") && !out.includes("2026-10-23T"), `${ten}: còn giờ UTC hoặc chuỗi ISO`)
  })
}

// AC-8: 8,4 ngày → freshness làm tròn xuống thành 201 giờ (lib/freshness) → trễ 9 giờ so SLO 192 giờ.
const SLO8 = 192
const TRE = [cov("S01", 201, SLO8, "stale"), cov("S02", SLO8, SLO8, "fresh"), cov("S03", 168, SLO8, "fresh")]
/** Hàng <tr> chứa `code` trong markup bảng. */
const hang = (out: string, code: string) => [...out.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).find((r) => r.includes(code)) ?? ""

test("GV-AC-8 bảng mục tiêu hiện mức trễ", async () => {
  const out = await h("../src/components/ops/overview/objectives-grid", "ObjectivesGrid", { rows: TRE })
  assert.match(hang(out, "S01"), /trễ 9 giờ/)
  for (const r of TRE) assert.equal(/trễ/.test(hang(out, r.code)), r.status === "stale", `${r.code}: «trễ» ⇔ status stale`)
})

test("GV-AC-8 bảng nguồn thu hiện mức trễ", async () => {
  const feeds = [feed("S01", 201, SLO8, "stale"), feed("S02", SLO8, SLO8, "fresh"), feed("S03", 168, SLO8, "fresh")]
  const out = await h("../src/components/ops/collections/feeds-grid", "FeedsGrid", { feeds })
  assert.match(hang(out, "S01"), /trễ 9 giờ/)
  for (const f of feeds) assert.equal(/trễ/.test(hang(out, f.code)), f.freshness === "stale", `${f.code}: «trễ» ⇔ stale`)
})

test("GV-AC-8 ô nguồn cũ nhất của tổng quan hiện mức trễ", async () => {
  const out = await h("../src/components/ops/overview/overview-tiles", "OverviewTiles", { rows: TRE })
  assert.match(out, /8 ngày · trễ 9 giờ/)
  assert.doesNotMatch(out, /8 ngày \/ 8 ngày/)
  const chiFresh = await h("../src/components/ops/overview/overview-tiles", "OverviewTiles", { rows: TRE.filter((r) => r.status === "fresh") })
  assert.doesNotMatch(chiFresh, /trễ/, "không nguồn nào quá hạn thì không có «trễ»")
})

test("GV-AC-9 luồng 7 ngày nói ngày theo giờ VN", async () => {
  const days = [{ day: "2026-10-24", airdnaMarkets: 0, airdnaListings: 0, airbnbListingsSeen: 0, airbnbSnapshots: 0, zaloPosts: 1, zaloOffers: 0 }]
  const out = await h("../src/components/ops/collections/sync-activity", "SyncActivity", { days })
  assert.match(out, /ngày theo giờ VN/)
  assert.doesNotMatch(out, /\(giờ máy\)/)
})

// ---------- AC-4: luồng 7 ngày gom theo ngày VN (lược đồ tạm trong DB local) ----------

const BANG = ["airdna_markets", "airdna_listings", "listings", "airbnb_snapshots", "stg_zalo_posts", "sale_offers"] as const
const COT: Record<(typeof BANG)[number], string> = {
  airdna_markets: "captured_at", airdna_listings: "captured_at", listings: "last_seen",
  airbnb_snapshots: "collected_at", stg_zalo_posts: "posted_at", sale_offers: "first_seen",
}
// ON5 (luong-7-ngay-dung-so): hai cột S03 đếm bài S03 thật theo ngày đăng và tin nguồn S03 — dòng chèn mang đủ hai điều kiện.
const THEM: Partial<Record<(typeof BANG)[number], [string, string]>> = {
  stg_zalo_posts: ["snapshot_id", "hanoi__zalo-agent__gv"], sale_offers: ["source", "S03"],
}
const NOW = Date.parse("2026-10-24T05:00:00Z") // 12:00 VN ngày 24 → 7 ngày VN 18…24
const admin = new pg.Client({ connectionString: BASE_URL })
let dbErr: string | null = null

before(async () => {
  try {
    await admin.connect()
    await admin.query(`CREATE SCHEMA "${SCHEMA}"`)
    for (const b of BANG) await admin.query(`CREATE TABLE "${SCHEMA}".${b} AS SELECT * FROM public.${b} WITH NO DATA`)
    const tz = ["2026-10-23T16:30:00Z", "2026-10-23T17:30:00Z"] // 23:30 VN ngày 23 · 00:30 VN ngày 24
    for (const b of BANG) {
      const vals = b === "listings" ? ["2026-10-23", "2026-10-24"] : tz
      const [c, x] = THEM[b] ?? [null, null]
      for (const v of vals)
        await admin.query(`INSERT INTO "${SCHEMA}".${b} (${COT[b]}${c ? `, ${c}` : ""}) VALUES ($1${c ? ", $2" : ""})`, c ? [v, x] : [v])
    }
    // 00:10 VN ngày cũ nhất (18) được đếm; 23:50 VN ngày 17 nằm ngoài cửa sổ.
    for (const v of ["2026-10-17T17:10:00Z", "2026-10-17T16:50:00Z"]) await admin.query(`INSERT INTO "${SCHEMA}".stg_zalo_posts (posted_at, snapshot_id) VALUES ($1, 'hanoi__zalo-agent__gv')`, [v])
  } catch (e) {
    dbErr = (e as Error).message
  }
})
after(async () => {
  await admin.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const canDb = () => assert.equal(dbErr, null, `DB local :5433 không tới được — eval đòi chạy thật: ${dbErr}`)

test("GV-AC-4 getFlowDays gom ngày theo giờ VN trên lược đồ tạm", async () => {
  canDb()
  const { getFlowDays } = await import("../src/lib/collections-queries")
  const ngay = (day: string, n: number, zalo = n) => ({ day, airdnaMarkets: n, airdnaListings: n, airbnbListingsSeen: n, airbnbSnapshots: n, zaloPosts: zalo, zaloOffers: n })
  const mong = [
    ngay("2026-10-24", 1), ngay("2026-10-23", 1), ngay("2026-10-22", 0), ngay("2026-10-21", 0),
    ngay("2026-10-20", 0), ngay("2026-10-19", 0), ngay("2026-10-18", 0, 1),
  ]
  assert.deepEqual(await getFlowDays(7, { now: NOW }), mong)
})

test("GV-AC-4 thiếu bảng tạm thì đỏ nêu tên bảng", async () => {
  canDb()
  const { getFlowDays } = await import("../src/lib/collections-queries")
  await admin.query(`ALTER TABLE "${SCHEMA}".stg_zalo_posts RENAME TO stg_zalo_posts_tam`)
  try {
    await assert.rejects(getFlowDays(7, { now: NOW }), /stg_zalo_posts/)
  } finally {
    await admin.query(`ALTER TABLE "${SCHEMA}".stg_zalo_posts_tam RENAME TO stg_zalo_posts`)
  }
})

// ---------- AC-5: funnel «hôm nay» theo ngày VN, dưới hai múi máy ----------

test("GV-AC-5 readGateFunnel đếm hôm nay theo ngày VN", () => {
  const home = mkdtempSync(join(tmpdir(), "gio-vn-home-"))
  try {
    mkdirSync(join(home, ".openclaw", "logs"), { recursive: true })
    // Khuôn dòng của hook: `${new Date().toISOString()} ${line}` (collector/openclaw/handler.js:18).
    const dong = (t: string) => `${new Date(t).toISOString()} post 202 group=nhom-thu {"accepted":1}`
    writeFileSync(join(home, ".openclaw", "logs", "oneinvest-zalo-pipe.log"), [dong("2026-10-23T16:30:00Z"), dong("2026-10-23T17:30:00Z"), ""].join("\n"))
    const code = `const m = await import(${JSON.stringify(pathToFileURL(join(APP, "src/lib/collections-queries.ts")).href)});
const f = await m.readGateFunnel({ now: ${NOW} }); process.stdout.write(JSON.stringify(f)); process.exit(0)`
    for (const mui of MUI_MAY) {
      const env: NodeJS.ProcessEnv = { ...process.env, TZ: mui, HOME: home }
      delete env.VERCEL // chạy nhánh local của readGateFunnel
      const out = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], { cwd: APP, env, encoding: "utf8" })
      const f = JSON.parse(out) as { today: { messages: number }; last7: { messages: number } }
      assert.equal(f.today.messages, 1, `TZ=${mui}: hôm nay (ngày VN 24) chỉ có dòng 17:30Z`)
      assert.equal(f.last7.messages, 2, `TZ=${mui}: 7 ngày có cả hai dòng`)
    }
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ---------- AC-3: thước tĩnh — không còn mốc cắt chuỗi hay ngày theo múi máy ----------

const MAU: [string, RegExp][] = [
  ["cắt chuỗi mốc", /\.slice\(0, ?1[06]\)/],
  ["toISOString cắt", /toISOString\(\)\.slice/],
  ["toLocale không múi", /toLocale(Date|Time)?String\((?![^)]*timeZone)/],
  ["giờ/ngày theo máy", /\.get(Hours|Date)\(/],
  ["SQL ::date thiếu AT TIME ZONE", /\b[a-z_]+::date\b/],
  ["SQL date_trunc/to_char thiếu AT TIME ZONE", /\b(date_trunc|to_char)\((?![^)]*AT TIME ZONE)/],
]
/** Danh sách miễn viết trước: tệp · mẫu · ĐÚNG đoạn khớp · lý do (miễn theo đoạn, không theo cả tệp). */
const MIEN: { tep: string; mau: string; khop: string; ly_do: string }[] = [
  { tep: "src/lib/ops-queries.ts", mau: "giờ/ngày theo máy", khop: ".getDate(", ly_do: "tên tệp log gateway theo ngày giờ MÁY (gateway và watchdog đặt tên bằng date +%Y-%m-%d) — ON2" },
  { tep: "src/lib/collections-queries.ts", mau: "SQL ::date thiếu AT TIME ZONE", khop: "last_seen::date", ly_do: "listings.last_seen là cột kiểu date, không có múi" },
]
const LIB_OPS = ["src/lib/ops-queries.ts", "src/lib/collections-queries.ts", "src/lib/freshness.ts", "src/lib/deals.ts"]
const boComment = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

function quetMoc(files: { path: string; text: string }[]): { path: string; mau: string }[] {
  const out: { path: string; mau: string }[] = []
  for (const f of files) {
    const text = boComment(f.text)
    for (const [mau, re] of MAU) {
      const khops = [...text.matchAll(new RegExp(re.source, "g"))].map((m) => m[0])
      if (khops.some((k) => !MIEN.some((m) => m.tep === f.path && m.mau === mau && m.khop === k))) out.push({ path: f.path, mau })
    }
  }
  return out
}
function tepOps(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = []
  const di = (dir: string) => {
    for (const e of readdirSync(join(APP, dir), { withFileTypes: true })) {
      const rel = join(dir, e.name)
      if (e.isDirectory()) di(rel)
      else if (/\.tsx?$/.test(e.name)) out.push({ path: rel, text: readFileSync(join(APP, rel), "utf8") })
    }
  }
  di("src/components/ops")
  di("src/app/ops")
  for (const f of LIB_OPS) out.push({ path: f, text: readFileSync(join(APP, f), "utf8") })
  return out
}

test("GV-AC-3 không còn mốc cắt chuỗi hay ngày theo múi máy ngoài danh sách miễn", () => {
  const files = tepOps()
  assert.ok(files.length > 40, "thước phải quét được cây Ops (không quét rỗng)")
  assert.deepEqual(quetMoc(files), [])
})

test("GV-AC-3 bản sao jobs-grid cắt lại lastLogAt", () => {
  const p = "src/components/ops/collections/jobs-grid.tsx"
  const goc = readFileSync(join(APP, p), "utf8")
  const sao = goc.replace("fmtVnDateTime(row.original.lastLogAt)", 'row.original.lastLogAt?.slice(0, 16).replace("T", " ")')
  assert.notEqual(sao, goc)
  assert.deepEqual(quetMoc([{ path: p, text: sao }]), [{ path: p, mau: "cắt chuỗi mốc" }])
})

test("GV-AC-3 bản sao thêm toLocaleString không múi", () => {
  const p = "src/components/ops/collections/lockdown-grid.tsx"
  const goc = readFileSync(join(APP, p), "utf8")
  const sao = goc.replace("fmtVnDateTime(lastWatchdogAt)", 'new Date(lastWatchdogAt ?? 0).toLocaleString("vi-VN")')
  assert.notEqual(sao, goc)
  assert.deepEqual(quetMoc([{ path: p, text: sao }]), [{ path: p, mau: "toLocale không múi" }])
})

test("GV-AC-3 bản sao collections-queries dùng ::date", () => {
  const p = "src/lib/collections-queries.ts"
  const goc = readFileSync(join(APP, p), "utf8")
  const sao = goc.replace("(first_seen AT TIME ZONE '${VN_TZ}')::date::text", "first_seen::date::text") // câu SQL tin rao S03 (ON5)
  assert.notEqual(sao, goc)
  assert.deepEqual(quetMoc([{ path: p, text: sao }]).map((v) => v.path), [p])
})

// ---------- AC-10: dòng log mốc hỏng — bản app (readGateFunnel) ----------

test("GV-AC-10 readGateFunnel bản app bỏ qua dòng mốc hỏng", () => {
  const home = mkdtempSync(join(tmpdir(), "gio-vn-hong-"))
  try {
    mkdirSync(join(home, ".openclaw", "logs"), { recursive: true })
    const dong = (t: string) => `${new Date(t).toISOString()} post 202 group=nhom-thu {"accepted":1}`
    const log = [dong("2026-10-23T16:30:00Z"), "2026-10-23T99:99:99.000Z post 202 group=nhom-thu", "2026-10-23T", dong("2026-10-23T17:30:00Z"), ""]
    writeFileSync(join(home, ".openclaw", "logs", "oneinvest-zalo-pipe.log"), log.join("\n"))
    const code = `const m = await import(${JSON.stringify(pathToFileURL(join(APP, "src/lib/collections-queries.ts")).href)});
const f = await m.readGateFunnel({ now: ${NOW} }); process.stdout.write(JSON.stringify(f)); process.exit(0)`
    const env: NodeJS.ProcessEnv = { ...process.env, TZ: "UTC", HOME: home }
    delete env.VERCEL
    const f = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], { cwd: APP, env, encoding: "utf8" })) as { today: { messages: number }; last7: { messages: number } }
    assert.equal(f.today.messages, 1)
    assert.equal(f.last7.messages, 2, "dòng mốc hỏng bị bỏ qua, 7 ngày chỉ hai dòng hợp lệ")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
