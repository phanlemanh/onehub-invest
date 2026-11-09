// thang-bac.test.tsx — thang-bac-moi-b0-b5 E1 (AC-1), E7 (AC-7), E8 (AC-8): nhãn bậc ở mọi chỗ hiện nhãn, dòng đổi thang của
// khối «Đo hằng ngày», chữ lên bậc và lọc bậc của /ops/data-flow. Thuần (không DB): đọc tệp thật, render thành phần thật.
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { DoHangNgay } from "../src/components/ops/quality/do-hang-ngay"
import type { FlowRecord } from "../src/lib/data-flow-queries"
import { levelOf } from "../src/lib/data-level"
import type { Do1 } from "../src/lib/do-hang-ngay"
import { fmtVnDate } from "../src/lib/format"
import { LABELS_VI, VOCAB } from "../src/lib/vocab.generated"

const GOC = join(import.meta.dirname, "../..")
const doc = (p: string) => readFileSync(join(GOC, p), "utf8")
const NHAN: [string, string][] = [["B0", "Có lời khai"], ["B1", "Tin"], ["B2", "Định vị"], ["B3", "Gắn căn"], ["B4", "Làm giàu"], ["B5", "Sống"]]

// ---- E1 · AC-1: nhãn bậc ở sổ, tệp sinh và bảng sinh của CONTEXT.md ----
/** Dòng `data_level` của bảng sinh trong CONTEXT.md → [mã, nhãn]. */
export function nhanContext(text: string): [string, string][] {
  const dong = text.split("\n").find((l) => l.startsWith("| Bậc dữ liệu | `data_level` |"))
  if (!dong) throw new Error("TB-AC-1 CONTEXT.md không có dòng bảng sinh của data_level")
  return [...dong.matchAll(/`(B\d)` «([^»]+)»/g)].map((m) => [m[1], m[2]])
}
describe("TB-AC-1 nhãn năm chỗ", () => {
  test("TB-AC-1 sổ, tệp sinh của app, CONTEXT.md mang sáu nhãn thang 08/11; mã ở tệp sinh pipeline, agent; vocab --check thoát 0", () => {
    // Sổ: khối trục `  data_level:` tới khối kế; mỗi giá trị một dòng `- { code: Bn, label_vi: … }` (app không có gói yaml).
    const so = doc("pipeline/mappings.yaml")
    const khoi = so.slice(so.indexOf("\n  data_level:\n"), so.indexOf("\n  capability_level:\n"))
    assert.ok(khoi.length > 0, "không đọc được trục data_level trong mappings.yaml")
    const giaTri = [...khoi.matchAll(/- \{ code: (B\d), label_vi: ([^}]+?) \}/g)].map((m) => [m[1], m[2]])
    assert.deepEqual(giaTri, NHAN, "TB-AC-1 sổ lệch")
    assert.deepEqual(Object.entries(LABELS_VI.data_level), NHAN, "TB-AC-1 tệp sinh của app lệch")
    assert.deepEqual([...VOCAB.data_level], NHAN.map(([m]) => m))
    for (const p of ["pipeline/lib/vocab.generated.mjs", "agent/src/vocab.generated.ts"]) {
      assert.match(doc(p), /data_level: (Object\.freeze\()?\["B0", "B1", "B2", "B3", "B4", "B5"\]/, `TB-AC-1 mã lệch ở ${p}`)
    }
    assert.deepEqual(nhanContext(doc("CONTEXT.md")), NHAN, "TB-AC-1 CONTEXT.md lệch")
    execFileSync(process.execPath, [join(GOC, "pipeline/vocab.mjs"), "--check"], { cwd: GOC, stdio: "pipe" })
  })
  test("TB-AC-1 chiều đỏ: bản sao CONTEXT.md giữ nhãn B2 cũ → lệch ở B2", () => {
    const cu = doc("CONTEXT.md").replace("`B2` «Định vị»", "`B2` «Gắn căn»")
    assert.throws(() => assert.deepEqual(nhanContext(cu), NHAN, "TB-AC-1 CONTEXT.md lệch ở B2"), /TB-AC-1 CONTEXT\.md lệch ở B2/)
  })
})

// ---- E7 · AC-7: dòng đổi thang của khối «Đo hằng ngày» ----
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
const ve = (chuyenBac: Do1["chuyenBac"]) => renderToStaticMarkup(
  <AppRouterContext.Provider value={ROUTER as never}>
    <DoHangNgay data={{ giuNhap: null, boSot: null, tinHieu: null, chuyenBac, soSanh: [] }} lat="tong" />
  </AppRouterContext.Provider>)
const dongThang = (h: string) => /<p[^>]*data-do1-thang[^>]*>([\s\S]*?)<\/p>/.exec(h)?.[1]?.replace(/<[^>]+>/g, "") ?? null
describe("TB-AC-7 dòng đổi thang", () => {
  const THANG = { ma: "thang-0811", tu_ngay: "2026-11-10" }
  test("TB-AC-7 (a) ngày đổi thang: nêu thang 08/11, ngày áp, lần hạ một lần", () => {
    const d = dongThang(ve({ status: "skip", ly_do: "doi-thang", don_vi: 81922, thang: THANG }))
    assert.ok(d, "TB-AC-7 thiếu dòng thang")
    assert.match(d, /08\/11/)
    assert.ok(d.includes(fmtVnDate("2026-11-10")), `ngày áp phải theo định dạng của kho: ${d}`)
    assert.match(d, /hạ một lần/)
  })
  test("TB-AC-7 (b) ngày thường có thang: dòng thang + bảng chuyển bậc", () => {
    const h = ve({ status: "pass", thang: THANG, theo_nguon: { S03: { len: 1, tut: 2, moi: 0, mat: 0, doi_khoa: 0 } } })
    assert.ok(dongThang(h))
    assert.match(h, /data-bang="chuyen-bac"/)
    assert.doesNotMatch(dongThang(h) ?? "", /hạ một lần/)
  })
  test("TB-AC-7 (c) dòng đời trước không có thang: không dòng thang, không lỗi; chiều đỏ ghim", () => {
    const h = ve({ status: "skip", ly_do: "lap-moc", don_vi: 12 })
    assert.equal(dongThang(h), null)
    assert.throws(() => assert.notEqual(dongThang(ve({ status: "skip", ly_do: "doi-thang", don_vi: 1 })), null, "TB-AC-7 thiếu thang vẫn hiện"),
      /TB-AC-7 thiếu thang vẫn hiện/)
  })
  test("TB-AC-7 chưa áp 087: nói tạm dừng, không lập mốc giả", () => {
    const h = ve({ status: "skip", ly_do: "chua-ap-087" })
    assert.match(h, /chưa áp bản cập nhật thang bậc 08\/11/)
    assert.doesNotMatch(h, /đã lập mốc/)
  })
})

// ---- E8 · AC-8: chữ lên bậc ở ngăn chi tiết và lọc bậc ----
const rec = (p: Partial<FlowRecord>): FlowRecord => ({
  offerId: "r", source: "S06", kind: "sale", propertyType: "apartment", priceVnd: 2e9, areaM2: 60, bedrooms: 2,
  ward: "Láng", market: "Thành phố Hà Nội", confidence: "medium", nPosts: 1, located: false,
  identification: { level: "clustered", locatedPending: false, uniqueIdPending: false }, firstSeen: "2026-11-09 09:00:00+00",
  lastSeen: "2026-11-09 09:00:00+00", postText: null, postGroup: null, ...p,
})
describe("TB-AC-8 ngăn tin và lọc", () => {
  test("TB-AC-8 chữ nguồn: câu lên bậc mới có, câu cũ không còn", () => {
    const sheet = doc("app/src/components/ops/data-flow/record-sheet.tsx")
    const loc = doc("app/src/components/ops/data-flow/records-filter.tsx")
    assert.ok(sheet.includes("Lên B2 cần định vị tin vào dự án, toà hoặc trục của danh bạ."))
    assert.ok(sheet.includes("Lên B3 cần khớp đúng một căn của danh bạ."))
    for (const [ten, t] of [["record-sheet", sheet], ["records-filter", loc]]) {
      assert.ok(!t.includes("Lên B2 cần gắn được tin về một căn"), `câu cũ còn ở ${ten}`)
    }
    assert.ok(!doc("app/src/lib/data-flow-queries.ts").includes("AS linked"), "truy vấn bản ghi còn cờ cụm «linked»")
  })
  test("TB-AC-8 lọc bậc: tin S06 trong cụm (chưa định vị) ở B1, lọc B2 rỗng; chiều đỏ ghim", async () => {
    const { compileRecordFilter } = await import("../src/components/ops/data-flow/records-filter")
    const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query")
    const loc = (lv: string) => compileRecordFilter(createFilterQuery([createFilterRule({ id: "r0", path: ["level"], operator: "is_any_of", value: [lv] })]) as never)
    const ds = [rec({ offerId: "cum" }), rec({ offerId: "thieu", priceVnd: null, identification: { level: "none", locatedPending: false, uniqueIdPending: false } })]
    assert.equal(levelOf(ds[0]), "B1")
    assert.deepEqual(ds.filter(loc("B2")).map((r) => r.offerId), [])
    assert.deepEqual(ds.filter(loc("B1")).map((r) => r.offerId), ["cum"])
    // chiều đỏ: levelOf đột biến nhận cờ cụm làm định vị → tin trong cụm lên B2
    const dotBien = (r: FlowRecord) => levelOf({ ...r, located: r.identification.level === "clustered" })
    assert.throws(() => assert.notEqual(dotBien(ds[0]), "B2", "TB-AC-8 tin trong cụm lên B2"), /TB-AC-8 tin trong cụm lên B2/)
  })
})
