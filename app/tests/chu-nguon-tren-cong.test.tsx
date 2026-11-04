// chu-nguon-tren-cong.test.tsx — hồ sơ chu-nguon-tren-cong: chữ về giá bán, thuê đúng hiện trạng. Không cần DB. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"

const APP = join(import.meta.dirname, "..")
const doc = (f: string) => readFileSync(join(APP, f), "utf8")

// ── AC-3: giá bán, thuê là giá rao của tin thật ────────────────────────────────────────────────

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

test("CN-AC-3 sáu tệp chữ không còn nói tin rao là giả lập; đều nói giá rao, chưa phải giá giao dịch", () => {
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

test("CN-AC-3 bảng Lợi suất giữ nhãn MÔ PHỎNG cho số mô hình, ô Phương pháp không còn nhãn đó", async () => {
  assert.match(doc("src/components/insight/insight-tables.tsx"), /<Badge variant="warning-light">MÔ PHỎNG<\/Badge>/)
  const { SOURCES } = await import("../src/components/marketing/methodology-definitions")
  const gia = SOURCES.find((d) => d.id === "gia-rao")
  assert.ok(gia && typeof gia.answer === "string", "ô gia-rao phải là chữ thuần")
  assert.match(gia.answer as string, /Trung vị giá rao của tin bán, tin thuê thật/)
  assert.doesNotMatch(gia.answer as string, /mô phỏng|giả lập/i)
})

test("CN-AC-3 dữ liệu lượt quét của /vn/[market] không mang mã snapshot ra trình duyệt", () => {
  const q = doc("src/lib/queries.ts")
  const kieu = q.slice(q.indexOf("export type SupplyPoint"), q.indexOf("export type SupplyPoint") + 200)
  assert.doesNotMatch(kieu, /snapshotId/)
  assert.doesNotMatch(q.slice(q.indexOf("export async function getSupplyHistory"), q.indexOf("export type BreakdownRow")), /snapshotId/)
})
