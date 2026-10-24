// gio-ops-gio-vn.test.tsx — cổng Ops đọc mốc theo giờ Việt Nam (OPS-7) và nguồn quá hạn hiện mức trễ (YC4).
// Hồ sơ nghiệm thu: _acceptance/gio-ops-gio-vn (AC-1…AC-5, AC-7…AC-9; AC-6 ở pipeline/scripts/vn-day.test.mjs).
// Tên ca mở đầu bằng mã AC (GV-AC-n).
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { fmtOverdue } from "../src/lib/freshness"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
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
