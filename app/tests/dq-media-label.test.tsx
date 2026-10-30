// dq-media-label.test.tsx — dòng kiểm `media:local-file` (pipeline/transform-media.mjs, NH1) có nhãn tiếng Việt trên
// /ops/quality. Đầu vào rút từ đúng chuỗi bên ghi in (`rows=… local=… offers_with_media=…`, entity mã nguồn trần).
// Không cần DB: ca ON12-AC-5 (tests/ops-nhan-theo-context.test.tsx) soi cùng nhãn trên DB máy thu.
import { test } from "node:test"
import assert from "node:assert/strict"

import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"

test("media:local-file có tên kiểm, đối tượng và chi tiết tiếng Việt", () => {
  assert.deepEqual(dqCheckName("media:local-file"), { text: "Ảnh tin đã tải", known: true })
  for (const s of ["S03", "S05", "S06"]) assert.deepEqual(dqEntityLabel(s, new Map()), { text: `Nguồn ${s}`, known: true })
  assert.deepEqual(dqDetail("media:local-file", "rows=182852 local=0 offers_with_media=27702"), {
    text: "182.852 ảnh · 0 đã tải · 27.702 tin có ảnh",
    known: true,
  })
})

test("khuôn lệch của media:local-file vẫn rơi về «chưa diễn giải»", () => {
  assert.equal(dqDetail("media:local-file", "rows=10 local=2").known, false, "thiếu offers_with_media phải là khuôn lạ")
  assert.equal(dqEntityLabel("S0X", new Map()).known, false, "mã nguồn sai khuôn phải là đối tượng lạ")
})
