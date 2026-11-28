// tu-ngu-collections.test.tsx — trang Thu thập không gọi bài thô là «tin» (hồ sơ wanted-thanh-inquiry AC-7). So markup của
// SyncActivity + CollectionsTiles với bản chụp trước vòng (app/tests/fixtures/tu-ngu-collections/, chụp ở sha main ghi trong
// dòng đầu; răng _acceptance/wanted-thanh-inquiry/rang/fixture-goc.mjs dựng lại nó từ sha đó). Không DB, không git — chạy
// được trong CI. Tên ca mở đầu bằng TN-AC-7.
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"

import { renderHai } from "./fixtures/tu-ngu-collections/render"

const APP = path.resolve(import.meta.dirname, "..")
const DIR = path.join(APP, "src/components/ops/collections")
const FIX = path.join(APP, "tests/fixtures/tu-ngu-collections")
const SYNC = path.join(DIR, "sync-activity.tsx")
const TILES = path.join(DIR, "collections-tiles.tsx")

/** Ba cặp thay đã duyệt ở Cổng Phạm vi (AC-7). Nhãn thanh của ô Cổng S03 chỉ hiện trong aria-label của SegmentBar,
 * kèm đuôi «: n qua cổng, m bị chặn». */
const BA_CAP: [string, string][] = [
  ["Tin S03 · Cộng đồng", "S03 · Cộng đồng"],
  ["Tin S03 · Cộng đồng hôm nay: 5 qua cổng, 2 bị chặn", "Bài S03 · Cộng đồng hôm nay: 5 qua cổng, 2 bị chặn"],
  ["2 tin bị cổng chặn", "2 bài bị cổng chặn"],
]

/** ON25 (ops-hien-dung-chang-s03): biến màu của biểu đồ Luồng 7 ngày — tab S03 xếp bài nhận · tin rao mới · tin có bài hôm đó.
 * Khuôn khối CSS đúng như ChartContainer in; dựng từ bảng (khoá, màu sáng, màu tối), không chép tay chuỗi. */
const khoiMau = (rows: [string, string, string][]) =>
  `\n [data-chart=chart-_R_2_] {\n${rows.map(([k, l]) => `  --color-${k}: var(--color-${l});\n`).join("")}}\n\n\n` +
  `.dark [data-chart=chart-_R_2_] {\n${rows.map(([k, , d]) => `  --color-${k}: var(--color-${d});\n`).join("")}}\n`
const CAP_ON25: [string, string] = [
  khoiMau([["airbnbListingsSeen", "blue-600", "blue-400"], ["zaloOffers", "blue-600", "blue-400"], ["zaloPosts", "violet-600", "violet-400"]]),
  khoiMau([["airbnbListingsSeen", "blue-600", "blue-400"], ["zaloPosts", "violet-600", "violet-400"], ["zaloOffers", "blue-600", "blue-400"], ["s03ActiveOffers", "blue-500", "blue-300"]]),
]

/** Bản chụp: dòng đầu `<!-- sha: … sha256: … -->`, thân là markup. */
function banChup(ten: string): string {
  const text = readFileSync(path.join(FIX, ten), "utf8")
  const m = text.match(/^<!-- sha: ([0-9a-f]{40}) sha256: ([0-9a-f]{64}) -->\n/)
  assert.ok(m, `${ten} thiếu dòng đầu sha/sha256`)
  const than = text.slice(m[0].length)
  assert.equal(createHash("sha256").update(than).digest("hex"), m[2], `${ten}: băm không khớp thân`)
  return than
}

/** Tách markup thành nút văn bản và giá trị thuộc tính, theo thứ tự xuất hiện. */
const token = (html: string): string[] =>
  html.split(/(<[^>]+>)/).flatMap((p) =>
    p.startsWith("<") ? [...p.matchAll(/="([^"]*)"/g)].map((x) => x[1]) : p ? [p] : [])

/** Các cặp (trước, sau) khác nhau giữa hai markup, không lặp. Khác số token → một cặp «độ dài». */
export function soNutVanBan(truoc: string, sau: string): [string, string][] {
  const a = token(truoc), b = token(sau)
  if (a.length !== b.length) return [["độ dài", `${a.length} ≠ ${b.length}`]]
  const out = new Map<string, [string, string]>()
  a.forEach((x, i) => { if (x !== b[i]) out.set(`${x}\u0000${b[i]}`, [x, b[i]]) })
  return [...out.values()]
}

const sapXep = (cap: [string, string][]) => [...cap].sort((x, y) => x[0].localeCompare(y[0]))

test("TN-AC-7 markup chỉ khác bản chụp trước vòng đúng các cặp thay đã duyệt", async () => {
  const m = await renderHai(SYNC, TILES)
  const khac = [...soNutVanBan(banChup("sync.html"), m.sync), ...soNutVanBan(banChup("tiles.html"), m.tiles)]
  assert.deepEqual(sapXep(khac), sapXep([...BA_CAP, CAP_ON25]))
  for (const html of [m.sync, m.tiles]) {
    assert.ok(!html.includes("Tin S03"), "còn «Tin S03»")
    assert.ok(!html.includes("tin bị cổng chặn"), "còn «tin bị cổng chặn»")
  }
  assert.ok(m.sync.includes(">Listing<"), "nút thứ nhất phải giữ «Listing»")
})

test("TN-AC-7 vai trò nguồn vắng → nút chế độ ghi mã trần «S03»", async () => {
  const m = await renderHai(SYNC, TILES, {})
  assert.ok(m.sync.includes(">S03<"), "nút chế độ phải là «S03»")
  assert.ok(!m.sync.includes("Tin S03"))
})

test("TN-AC-7 đối chứng: thêm một chuỗi đổi trong bản sao → hàm so báo thừa đúng một cặp", async () => {
  const m = await renderHai(SYNC, TILES)
  const sao = m.tiles.replace("Qua cổng", "Đã qua cổng")
  assert.notEqual(sao, m.tiles, "bản sao phải đổi được")
  assert.deepEqual(soNutVanBan(m.tiles, sao), [["Qua cổng", "Đã qua cổng"]])
})

// ---------- ON25 (ops-hien-dung-chang-s03) AC-7: nhãn tab S03, không chồng cột, mô tả, «—» cho bản tin cũ, từ vựng ----------

const NHAN_S03 = ["S03 · Cộng đồng — bài nhận", "S03 · Cộng đồng — tin rao mới", "S03 · Cộng đồng — tin có bài hôm đó"]
/** Lỗi của tab S03: ba nhãn đúng thứ tự, không nhãn cũ, không chồng cột; tab Listing vẫn chồng. */
function loiTabS03(m: { SERIES: Record<string, string[]>; configOf: (r: Record<string, string>) => Record<string, { label: string }>; stackOf: (x: "zalo" | "listings") => string | undefined }): string[] {
  const out: string[] = []
  const cfg = m.configOf({ S01: "Tự thu", S03: "Cộng đồng" })
  const nhan = m.SERIES.zalo.map((k) => cfg[k]?.label)
  if (JSON.stringify(nhan) !== JSON.stringify(NHAN_S03)) out.push(`nhãn tab S03: ${nhan.join(" | ")}`)
  for (const l of Object.values(cfg).map((c) => c.label)) if (/tin rao vào kho|bài thô/.test(l)) out.push(`nhãn cũ: ${l}`)
  if (m.stackOf("zalo") !== undefined) out.push(`stackId tab S03: ${m.stackOf("zalo")}`)
  if (m.stackOf("listings") !== "listings") out.push(`stackId tab Listing: ${m.stackOf("listings")}`)
  return out
}

test("TN-AC-7 ON25-AC-7 tab S03 có ba nhãn bài nhận · tin rao mới · tin có bài hôm đó, không chồng cột", async () => {
  const m = await import(SYNC)
  assert.deepEqual(loiTabS03(m), [])
})
test("TN-AC-7 ON25-AC-7 đối chứng: nhãn cũ hoặc chồng cột ở tab S03 → báo nhãn, stackId", async () => {
  const m = await import(SYNC)
  const cu = { ...m, configOf: (r: Record<string, string>) => ({ ...m.configOf(r), zaloOffers: { label: "Cộng đồng — tin rao vào kho" } }), stackOf: (x: string) => x }
  const loi = loiTabS03(cu)
  assert.ok(loi.some((l) => l.startsWith("nhãn tab S03")) && loi.some((l) => l.startsWith("nhãn cũ")) && loi.includes("stackId tab S03: zalo"), loi.join(" | "))
})
test("TN-AC-7 ON25-AC-7 mô tả tab S03 nêu riêng bài nhận và tin rao mới, không «bản ghi»", async () => {
  const { describeMode } = await import(SYNC)
  const days = [1, 2, 3].map((i) => ({ day: `2026-10-2${i}`, airbnbListingsSeen: 0, airbnbSnapshots: 0, zaloPosts: 10 * i, zaloOffers: i, s03ActiveOffers: 3 * i }))
  const t = describeMode("zalo", days)
  assert.match(t, /60 bài nhận · 6 tin rao mới; mỗi ngày 3–9 tin có bài/)
  assert.doesNotMatch(t, /bản ghi/)
})
test("TN-AC-7 ON25-AC-7 bảng máy chủ: bản tin cũ (khoá vắng → null) in «—» ở cột tin có bài, không «0»", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { CloudFlowTable } = await import(path.join(APP, "src/components/ops/collections-tables"))
  const o = (n: number | null) => renderToStaticMarkup(<CloudFlowTable days={[{ day: "2026-10-25", airbnbListingsSeen: 1, zaloPosts: 2, zaloOffers: 1, s03ActiveOffers: n }]} stale={false} />)
  const o25 = (html: string) => {
    const ids = [...html.slice(html.indexOf("<thead"), html.indexOf("</thead>")).matchAll(/<th[^>]*data-col-id="([^"]+)"/g)].map((x) => x[1])
    const tds = [...html.slice(html.indexOf("<tbody")).matchAll(/<td[\s\S]*?<\/td>/g)].map((x) => x[0].replace(/<[^>]+>/g, "").trim())
    return tds[ids.indexOf("s03ActiveOffers")]
  }
  assert.equal(o25(o(null)), "—", "s03ActiveOffers bản tin cũ phải in «—»")
  assert.equal(o25(o(5)), "5", "đối chứng dương: khối có khoá in số")
  assert.notEqual(o25(o(0)), "—", "đối chứng: 0 thật không thành «—»")
})
test("TN-AC-7 ON25-AC-7 CONTEXT.md có thuật ngữ «Tin có bài hôm đó» và nhãn bài nhận, tin rao mới", () => {
  const ctx = readFileSync(path.join(APP, "..", "CONTEXT.md"), "utf8")
  for (const t of ["**Tin có bài hôm đó**", "«S03 — bài nhận»", "«S03 — tin rao mới»", "`s03ActiveOffers`"]) assert.ok(ctx.includes(t), `CONTEXT.md thiếu ${t}`)
})
