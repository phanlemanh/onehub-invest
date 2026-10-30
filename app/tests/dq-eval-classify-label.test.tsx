// dq-eval-classify-label.test.tsx — hồ sơ _acceptance/eval-classify-wilson (PL9) AC-9: dòng kiểm `eval-classify` có nhãn
// tiếng Việt trên /ops/quality. Đầu vào sinh bằng ĐÚNG bên ghi (pipeline/lib/eval-classify.mjs: xepTrangThai, veEntity,
// veDetail), không viết tay khuôn. Không cần DB: ca ON12-AC-5 soi cùng nhãn trên DB thử sau lượt ghi thật (probes/on12.sh).
import { test } from "node:test"
import assert from "node:assert/strict"

import { dqCheckName, dqDetail, dqEntityLabel, TRUONG_DO_DUNG } from "../src/lib/dq-labels"
import { FIELD_LABEL } from "../src/lib/labels-normalize"
import * as ben from "../../pipeline/lib/eval-classify.mjs"

type O = { phan_khuc: string; cach_doc: string; truong: string; n: number; dung: number | null; ti_le: number | null } & ReturnType<typeof ben.xepTrangThai>
const META = { run: "ecw-20261030T150000-abc123", tap: "nguoi", bat_dong: 0, mat_chu: 0 }
const PHAN_KHUC = ["tat-ca", "apartment", "khong-neu"] as const
/** Bốn trạng thái viết trước: pass nhóm A, fail nhóm B, skip hai lý do. */
const TRANG_THAI = [
  { truong: "kind", n: 150, dung: 148, coDoc: true, mong: "pass" },
  { truong: "area_m2", n: 150, dung: 142, coDoc: true, mong: "fail" },
  { truong: "bedrooms", n: 0, dung: 0, coDoc: true, mong: "skip" },
  { truong: "project", n: 150, dung: null, coDoc: false, mong: "skip" },
] as const
const o = (pk: string, truong: string, n: number, dung: number | null, coDoc: boolean): O => ({
  phan_khuc: pk, cach_doc: "parser", truong, n, dung, ti_le: dung == null || n === 0 ? null : dung / n,
  ...ben.xepTrangThai(truong, n, dung ?? 0, coDoc),
})

test("AC-9 tên kiểm eval-classify có nhãn", () => {
  assert.deepEqual(dqCheckName("eval-classify"), { text: "Độ đúng cách đọc", known: true })
})

test("AC-9 ma trận 3 phân khúc × 9 trường: đối tượng có nhãn tiếng Việt, nhãn trường của màn gắn nhãn («Dự án» theo CONTEXT.md là «Khu đô thị»)", () => {
  let soAssert = 0
  for (const pk of PHAN_KHUC) {
    for (const truong of ben.TRUONG) {
      const t = dqEntityLabel(ben.veEntity("ocp1", o(pk, truong, 1, 1, true)), new Map())
      assert.equal(t.known, true, `${pk}|${truong}`)
      const nhan = truong === "project" ? "Khu đô thị" : FIELD_LABEL[truong as keyof typeof FIELD_LABEL]
      assert.equal(TRUONG_DO_DUNG[truong], nhan)
      assert.ok(t.text.endsWith(`· ${nhan}`), t.text)
      soAssert++
    }
  }
  assert.equal(soAssert, PHAN_KHUC.length * 9)
  assert.equal(dqEntityLabel("ocp1|tat-ca|parser|kind", new Map()).text, "Lát OCP1 · mọi loại hình · Bộ đọc theo luật · Loại tin")
  assert.equal(dqEntityLabel("ocp1|apartment|parser|area_m2", new Map()).text, "Lát OCP1 · Căn hộ · Bộ đọc theo luật · Diện tích")
})

test("AC-9 ma trận 4 trạng thái × 2 tập: chi tiết có nhãn, số kiểu Việt", () => {
  let soAssert = 0
  for (const split of ["test", "dev"] as const) {
    for (const x of TRANG_THAI) {
      const cell = o("tat-ca", x.truong, x.n, x.dung, x.coDoc)
      assert.equal(cell.trang_thai, x.mong)
      const t = dqDetail("eval-classify", ben.veDetail(cell, { ...META, split }))
      assert.equal(t.known, true, `${split} ${x.mong} ${x.truong}`)
      assert.ok(t.text.includes(split === "test" ? "tập chấm" : "tập chỉnh luật"), t.text)
      soAssert++
    }
  }
  assert.equal(soAssert, 8)
  const dat = o("tat-ca", "kind", 150, 148, true)
  assert.equal(dqDetail("eval-classify", ben.veDetail(dat, { ...META, split: "test" })).text,
    "Đúng 148/150 · cận dưới 0,9527 · ngưỡng 0,95 (nhóm A) · tập chấm")
  const bo = o("tat-ca", "project", 150, null, false)
  assert.equal(dqDetail("eval-classify", ben.veDetail(bo, { ...META, split: "test", bat_dong: 2, mat_chu: 1 })).text,
    "Bỏ qua — chưa có cách đọc cho trường này · ngưỡng 0,95 (nhóm A) · tập chấm · 2 trường người gắn bất đồng · 1 tin mất chữ")
})

test("AC-9 đối chứng đỏ: detail thiếu can_duoi rơi về «chưa diễn giải»", () => {
  const d = ben.veDetail(o("tat-ca", "kind", 150, 148, true), { ...META, split: "test" }).replace(/ can_duoi=\S+/, "")
  assert.equal(dqDetail("eval-classify", d).known, false)
})
