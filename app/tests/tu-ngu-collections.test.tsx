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
  assert.deepEqual(sapXep(khac), sapXep(BA_CAP))
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
