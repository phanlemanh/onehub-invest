// ops-nhan-ma-nguon.test.tsx — ON7 `ops-nhan-ma-nguon`: ngoài /ops/sources, Ops chỉ hiện mã S0x kèm vai trò, không tên
// nguồn thật. Dựng HTML thật (renderToStaticMarkup) rồi quét TOÀN BỘ HTML — chữ lẫn thuộc tính — bằng lõi khớp tên dùng
// chung; tên thật lấy lúc chạy từ db/migrations (tệp này không chứa tên). Cần DB local :5433 (vai trò, trang /ops/quality).
// Cây log tạm cho readSchedulerStatus: cwd = <tạm>/app TRƯỚC mọi import (ROOT của collections-queries đọc cwd lúc nạp).
// Ca cloud: ops-nhan-ma-nguon-cloud.test.tsx; ca DB chết: ops-nhan-ma-nguon-db-chet.test.tsx. Tên ca mở đầu bằng mã AC.
delete process.env.VERCEL // nhánh local

import { after, describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { findSourceNames, fold, sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs"
import { readable } from "./ops-html"

type Seed = { code: string; realName: string }
const SEEDS: Seed[] = sourceRegistrySeeds()
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }))
const nameOf = (code: string) => SEEDS.find((s) => s.code === code)!.realName
const leaks = (html: string): string[] =>
  readable(html).flatMap((t, i) => findSourceNames(t, ENTRIES).map((h: { code: string }) => `${h.code} @mảnh ${i}`))

const ORIG_CWD = process.cwd()
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-nhan-ma-nguon-")))
mkdirSync(path.join(TMP, "app"), { recursive: true })
mkdirSync(path.join(TMP, "pipeline/logs"), { recursive: true })
writeFileSync(path.join(TMP, "pipeline/logs/airdna-daily.log"), `2026-10-24T19:06:00 ${nameOf("S02")} rotation xong\n`)
writeFileSync(path.join(TMP, "pipeline/logs/launchd-smoke.log"), `2026-10-24T20:00:00 smoke ${fold(nameOf("S01")).replace(/\s+/g, "")} ok\n`)
writeFileSync(path.join(TMP, "pipeline/logs/weekly-20261024.log"), `2026-10-24T19:30:00 thu ${nameOf("S06")} xong\n`)
process.chdir(path.join(TMP, "app"))
after(async () => {
  process.chdir(ORIG_CWD)
  rmSync(TMP, { recursive: true, force: true })
  const { pool } = await import("../src/lib/db")
  await pool.end()
})

async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}

/** Neo trong trang: mỗi href="#x" phải có đúng một phần tử id="x". Trả danh sách lỗi (nêu tên neo). */
function anchorProblems(h: string): string[] {
  const out: string[] = []
  for (const m of h.matchAll(/href="#([^"]+)"/g)) {
    const n = [...h.matchAll(new RegExp(`id="${m[1]}"`, "g"))].length
    if (n !== 1) out.push(`neo #${m[1]}: ${n} phần tử mang id`)
  }
  return out
}

/** Khối phần tử (cân thẻ div) bắt đầu ở mỗi `data-slot="alert"`; trả khối đầu tiên chứa `marker`, hoặc null. */
function alertBlock(h: string, marker: string): string | null {
  for (const m of h.matchAll(/<div[^>]*data-slot="alert"[^>]*>/g)) {
    let depth = 0
    const re = /<\/?div\b[^>]*>/g
    re.lastIndex = m.index!
    for (let t = re.exec(h); t; t = re.exec(h)) {
      depth += t[0].startsWith("</") ? -1 : 1
      if (depth === 0) {
        const block = h.slice(m.index!, re.lastIndex)
        if (block.includes(marker)) return block
        break
      }
    }
  }
  return null
}

// Bảng nhánh viết trước của issuesOf (attention-list.tsx): 9 nhánh, mỗi nhánh một tiêu đề phải hiện ở lượt «canh-bao».
const ISSUE_TITLES = [
  "Lượt máy tự trả lời hôm nay", "Lớp L1", "Kênh S03 · Cộng đồng đứt", "Máy thu có thể mất kết nối", "S05 trễ SLO", // ON12: nhãn theo CONTEXT.md
  "S06 chưa có dữ liệu", "Ống S03 · Cộng đồng im 24h", "Danh sách cho phép lệch nhóm tham gia", "1 nhóm S03 · Cộng đồng im > 72h",
]
const feed = (code: string, freshness: "stale" | "none"): import("../src/lib/ops-queries").SourceFeedHealth => ({
  code, labelVi: code, status: "active", note: null, lastRunAt: null, lastRunSource: null, items24h: 0, stgRows: 0,
  offers: null, freshnessHrs: freshness === "stale" ? 99 : null, sloHours: 26, freshness,
})

const NOW = Date.parse("2026-10-24T10:00:00+07:00")
async function collections(variant: "canh-bao" | "lanh"): Promise<string> {
  const React = await import("react")
  const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
  const { readSchedulerStatus } = await import("../src/lib/collections-queries")
  const { getSourceRoles } = await import("../src/lib/source-roles")
  const bad = variant === "canh-bao"
  const zero = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
  return html(
    React.createElement(CollectionsView, {
      days: [{ day: "2026-10-24", airdnaMarkets: 6, airdnaListings: 120, airbnbListingsSeen: 40, airbnbSnapshots: 3, zaloPosts: 9, zaloOffers: 4 }],
      funnel: { lastEventAt: "2026-10-24T09:00:00+07:00", today: { ...zero, messages: 5, passed: 3, skipped: 2 }, last7: zero },
      jobs: [...(await readSchedulerStatus()), { id: "cloud-sync", label: "Sync Supabase + ops facts", schedule: "mỗi 15 phút", alive: "unknown" as const, lastLogAt: null, lastLine: null }],
      rotation: { updatedAt: "2026-10-24T19:05:00", cursor: 2, total: 6, next: [{ id: "1", name: "Hà Nội", lastCapturedAt: null }] },
      zaloGroups: [{ name: "Nhóm thử A", isMockOnly: false, realPosts7d: 2, mockPosts7d: 0, lastSeenAt: bad ? "2026-10-20T00:00:00Z" : "2026-10-24T02:00:00Z", seen: 1, passed: 1, skipped: 0, accepted: 1, lastEventAt: null, ownerAccount: null }],
      zaloAllowlist: [{ groupId: "group:123456789", enabled: true }],
      zaloHealth: bad
        ? { connected: false, uptime24h: 0.5, heartbeatAgeMin: 45, lastHeartbeatAt: null, lastPostAt: "2026-10-23T00:00:00Z", silentAlert24h: true, driftAlert24h: true }
        : { connected: true, uptime24h: 1, heartbeatAgeMin: 5, lastHeartbeatAt: null, lastPostAt: "2026-10-24T02:00:00Z", silentAlert24h: false, driftAlert24h: false },
      factsPushedAt: bad ? new Date(NOW - 90 * 60_000).toISOString() : null,
      feedHealth: bad ? [feed("S05", "stale"), feed("S06", "none")] : [],
      lockdown: { layers: bad ? [{ layer: "L1", desc: "bindings", ok: false }] : [], lastWatchdogAt: null, agentTurnsToday: bad ? 1 : 0, openClawUp: true, kevUp: true, collectorUp: true },
      nowMs: NOW,
      roles: await getSourceRoles(),
    } as never),
  )
}

describe("ON7-AC-1 /ops/collections", () => {
  test("ON7-AC-1 collections: mọi nhánh cảnh báo → 0 tên nguồn thật, có «S03 · Cộng đồng», «S02 · Hiệu chuẩn», kênh đứt trỏ /ops/sources, không lệnh đăng nhập kênh", async () => {
    const h = await collections("canh-bao")
    assert.deepEqual(leaks(h), [], "HTML còn tên nguồn thật")
    for (const want of ["S03 · Cộng đồng", "S02 · Hiệu chuẩn", "Kênh S03 · Cộng đồng đứt", "Ống S03 · Cộng đồng im 24h"]) assert.ok(h.includes(want), `thiếu «${want}»`)
    const text = readable(h)
    const missing = ISSUE_TITLES.filter((t) => !text.some((x) => x.includes(t)))
    assert.deepEqual(missing, [], `fixture phải bật đủ ${ISSUE_TITLES.length} nhánh cảnh báo viết trước`)
    const jobRows = [...h.matchAll(/data-row-id="([^"]+)"/g)].map((m) => m[1]).filter((id) => /^(s0\d-|collector-api|kev|cloud-sync)/.test(id))
    assert.equal(new Set(jobRows).size, 6, `lưới job phải đủ 6 job: ${jobRows.join(", ")}`)
    const down = alertBlock(h, "Kênh S03 · Cộng đồng đứt")
    assert.ok(down, "phải có khối cảnh báo «Kênh S03 · Cộng đồng đứt»")
    assert.ok(down.includes('href="/ops/sources"'), "liên kết /ops/sources phải nằm TRONG cảnh báo kênh đứt")
    assert.ok(!/channels login/.test(h), "không được in lệnh đăng nhập kênh")
  })
  test("ON7-AC-1 collections: mọi thứ lành (trạng thái rỗng) → 0 tên nguồn thật", async () => {
    const h = await collections("lanh")
    assert.ok(h.includes("Mọi thứ ổn"), "tiền đề: phải là trạng thái rỗng của «Cần chú ý»")
    assert.ok(h.includes("kênh S03 · Cộng đồng kết nối"))
    assert.deepEqual(leaks(h), [], "HTML còn tên nguồn thật")
  })
  test("ON7-AC-1 neo: mỗi href=\"#…\" có đúng một id trong HTML", async () => {
    const h = await collections("canh-bao")
    assert.ok(h.includes('href="#nhom-s03"'), "tiền đề: ô KPI trỏ neo nhóm S03")
    assert.deepEqual(anchorProblems(h), [])
  })
  test("ON7-AC-1 chiều đỏ: HTML chèn một tên thật → bộ quét bắt, thông điệp nêu mã S0x", async () => {
    const h = (await collections("lanh")).replace("Mọi thứ ổn", `Mọi thứ ổn ${nameOf("S03")}`)
    const got = leaks(h)
    assert.equal(got.length, 1, "bộ quét phải bắt đúng một chỗ")
    assert.match(got[0], /^S03 @mảnh \d+$/)
    assert.deepEqual(findSourceNames(got.join(" "), ENTRIES), [], "thông điệp không được chứa tên")
  })
  test("ON7-AC-1 chiều đỏ: cảnh báo kênh đứt mất liên kết (liên kết vẫn còn chỗ khác trong trang) → bị bắt", async () => {
    const h = await collections("canh-bao")
    const down = alertBlock(h, "Kênh S03 · Cộng đồng đứt")!
    const broken = h.replace(down, down.replace(/<a [^>]*href="\/ops\/sources"[^>]*>[\s\S]*?<\/a>/, "Đăng nhập lại ở Nguồn dữ liệu"))
    assert.notEqual(broken, h, "khuôn đột biến không khớp HTML")
    assert.ok(broken.includes('href="/ops/sources"'), "tiền đề: trang vẫn còn liên kết /ops/sources ở chỗ khác")
    assert.ok(!alertBlock(broken, "Kênh S03 · Cộng đồng đứt")!.includes('href="/ops/sources"'), "phép đo phải thấy cảnh báo kênh đứt mất liên kết")
  })
  test("ON7-AC-1 chiều đỏ: id neo đổi → ca nêu tên neo", async () => {
    const h = (await collections("canh-bao")).replace('id="nhom-s03"', 'id="nhom-khac"')
    assert.deepEqual(anchorProblems(h), ["neo #nhom-s03: 0 phần tử mang id"])
  })
})

describe("ON7-AC-2 /ops/quality", () => {
  test("ON7-AC-2 /ops/quality thật trên DB local → 0 tên nguồn thật, có «S02 · Hiệu chuẩn»", async () => {
    const { default: QualityPage } = await import("../src/app/ops/quality/page")
    const h = await html(await QualityPage())
    assert.ok(h.includes("Chất lượng dữ liệu"), "tiền đề: trang dựng được")
    assert.ok(h.includes("S02 · Hiệu chuẩn"), "thiếu nhãn «S02 · Hiệu chuẩn»")
    assert.deepEqual(leaks(h), [], "HTML /ops/quality còn tên nguồn thật")
  })
})

describe("ON7-AC-5 readSchedulerStatus local", () => {
  test("ON7-AC-5 readSchedulerStatus local → nhãn, id, lastLine không tên nguồn thật; lastLine mang mã S0x", async () => {
    const { readSchedulerStatus } = await import("../src/lib/collections-queries")
    const jobs = await readSchedulerStatus()
    for (const j of jobs) for (const v of [j.id, j.label, j.lastLine ?? ""]) assert.deepEqual(findSourceNames(v, ENTRIES), [], `job ${j.id} còn tên nguồn thật`)
    const byId = Object.fromEntries(jobs.map((j) => [j.id, j]))
    assert.equal(byId["s02-daily"]?.lastLine, "2026-10-24T19:06:00 S02 rotation xong")
    assert.equal(byId["s01-smoke"]?.lastLine, "2026-10-24T20:00:00 smoke S01 ok")
    assert.equal(byId["s01-weekly"]?.lastLine, "2026-10-24T19:30:00 thu S06 xong")
    assert.match(byId["s02-daily"]!.label, /^S02 · Hiệu chuẩn — /)
  })
})

describe("ON7-AC-6 vai trò", () => {
  test("ON7-AC-6 vai trò: (a) source_registry → «S02 · Hiệu chuẩn»", async () => {
    const { getSourceRoles } = await import("../src/lib/source-roles")
    const { sourceLabel } = await import("../src/lib/source-labels")
    assert.equal(sourceLabel("S02", await getSourceRoles()), "S02 · Hiệu chuẩn")
  })
})
