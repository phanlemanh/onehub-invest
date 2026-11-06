// chu-nguon-tren-cong.test.tsx — hồ sơ chu-nguon-tren-cong: chữ về giá bán, thuê đúng hiện trạng. Không cần DB. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"

const APP = join(import.meta.dirname, "..")
const doc = (f: string) => readFileSync(join(APP, f), "utf8")

// ── AC-4: giá bán, thuê là giá rao của tin thật ────────────────────────────────────────────────

/** Câu nói sai hiện trạng: tin rao giả lập, hay dữ liệu (không phải số mô hình) là mô phỏng. */
const SAI_HIEN_TRANG = /giả lập|dữ liệu mô phỏng/i

const TEP_CHU = [
  "src/app/(marketing)/page.tsx",
  "src/components/marketing/methodology-definitions.tsx",
  "src/components/insight/insight-tables.tsx",
  "src/app/(app)/yield/page.tsx",
  "src/components/yield/yield-form.tsx",
  "src/components/compare/comparison.tsx",
]

test("CN-AC-4 sáu tệp chữ không còn nói tin rao là giả lập; đều nói giá rao, chưa phải giá giao dịch", () => {
  for (const f of TEP_CHU) {
    const s = doc(f)
    assert.doesNotMatch(s, SAI_HIEN_TRANG, `${f} còn nói sai hiện trạng`)
    assert.match(s, /giá rao/, `${f} thiếu «giá rao»`)
    assert.match(s, /chưa phải giá giao dịch/, `${f} thiếu «chưa phải giá giao dịch»`)
  }
  // Số mô hình vẫn mang nhãn: ô Yield dài hạn, đầu trang /yield, nhóm Lợi suất của So sánh.
  const trang = doc("src/app/(app)/yield/page.tsx")
  assert.match(trang, /label: "Mô phỏng", variant: "warning-light"/)
  assert.match(trang, /<Badge variant="warning-light">MÔ PHỎNG<\/Badge>/)
  assert.match(doc("src/components/compare/compare-body.tsx"), /badge: "Mô phỏng"/)
  // Chiều đỏ: cùng phép đo trên câu cũ của hai tệp phải bắt được.
  assert.match("Tin rao bán và thuê đang là dữ liệu giả lập để dựng tính năng", SAI_HIEN_TRANG)
  assert.match("Badge DỮ LIỆU MÔ PHỎNG", SAI_HIEN_TRANG)
})

test("CN-AC-4 bảng Lợi suất giữ nhãn MÔ PHỎNG cho số mô hình, ô Phương pháp không còn nhãn đó", async () => {
  assert.match(doc("src/components/insight/insight-tables.tsx"), /<Badge variant="warning-light">MÔ PHỎNG<\/Badge>/)
  const { SOURCES } = await import("../src/components/marketing/methodology-definitions")
  const gia = SOURCES.find((d) => d.id === "gia-rao")
  assert.ok(gia && typeof gia.answer === "string", "ô gia-rao phải là chữ thuần")
  assert.match(gia.answer as string, /Trung vị giá rao của tin bán, tin thuê thật/)
  assert.doesNotMatch(gia.answer as string, /mô phỏng|giả lập/i)
})

test("CN-AC-4 dữ liệu lượt quét của /vn/[market] không mang mã snapshot ra trình duyệt", () => {
  const q = doc("src/lib/queries.ts")
  const kieu = q.slice(q.indexOf("export type SupplyPoint"), q.indexOf("export type SupplyPoint") + 200)
  assert.doesNotMatch(kieu, /snapshotId/)
  assert.doesNotMatch(q.slice(q.indexOf("export async function getSupplyHistory"), q.indexOf("export type BreakdownRow")), /snapshotId/)
})

// ── AC-2: ngoại lệ tiêu đề tin đi qua bộ vẽ thật, không tự dựng đúng khuôn bên đọc ─────────────

test("CN-AC-2 round-trip: tiêu đề mang tên vẽ bằng thẻ thật, thẻ và alt được miễn, chữ của cổng thì không", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { ListingCard } = await import("../src/components/listing/listing-card")
  const { sourceRegistrySeeds } = await import("../../scripts/lib/tier-a-source-names.mjs")
  const { quetHtml } = await import("../../scripts/quet-ten-nguon-html.mjs")
  const { htmlEscapeJsonString } = await import("next/dist/shared/lib/htmlescape")
  const seeds = sourceRegistrySeeds()
  const ten = seeds.find((s: { code: string }) => s.code === "S01").realName
  const tieuDe = `Phòng đẹp ${ten} "xịn" & phố cổ`
  const listing = {
    id: "abnb_1", name: tieuDe, roomType: "Private room", bedrooms: 1, accommodates: 2, priceListed: 500000, photoUrls: ["https://x.test/a.jpg"],
    occupancy: 0.5, adr: 500000, revpar: 250000, reviewCount: null, areaName: "Phường Một", areaPath: "/vn/hanoi/phuong-mot", href: "/listing/abnb_1",
  }
  const ve = renderToStaticMarkup(<ListingCard listing={listing as never} active={false} onHover={() => {}} />)
  assert.ok(ve.includes("&amp;"), "thẻ thật phải thoát HTML để ca này đo đúng dạng bên đọc gặp")
  // Cùng cách Next ghi dữ liệu nhúng: một lớp JSON cho props, một lớp cho khung, rồi htmlEscapeJsonString.
  const nhung = `<script>self.__next_f.push(${htmlEscapeJsonString(JSON.stringify([1, JSON.stringify(listing)]))})</script>`
  assert.ok(nhung.includes("\\u0026"), "dữ liệu nhúng phải qua bộ thoát thật của Next")
  const trang = (than: string) => `<!doctype html><html><body><h1>T</h1>${than}${nhung}</body></html>`
  const r = quetHtml(trang(ve), seeds, { tieuDe: [tieuDe] })
  assert.deepEqual(r.hien, {}, "CN-AC-2 tiêu đề trong thẻ thật phải được miễn")
  assert.deepEqual(r.html, {})
  assert.ok((r.tieuDeTin as Record<string, number>).S01 >= 2, "CN-AC-2 thẻ và alt phải đếm riêng")
  assert.deepEqual(quetHtml(trang(`${ve}<p>${ten} tự thu</p>`), seeds, { tieuDe: [tieuDe] }).hien, { S01: 1 }, "CN-AC-2 chữ của cổng phải đỏ")
})
