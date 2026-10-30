// dq-data-level-label.test.tsx — hai dòng kiểm PL16 (pipeline/bac-du-lieu.mjs --write) có nhãn tiếng Việt trên
// /ops/quality. Đầu vào rút từ đúng chuỗi bên ghi in (`applied=… missing=…`, `units=… B0=… … B5=…`). Không cần DB:
// app/scripts/bac-roundtrip.ts soi cùng nhãn trên dòng kiểm vừa ghi ở bản chép DB máy thu.
import { test } from "node:test"
import assert from "node:assert/strict"

import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"

test("nhãn hai kiểm PL16: enrich:proposal-assertion và data-level:distribution có tên kiểm, đối tượng và chi tiết tiếng Việt", () => {
  assert.deepEqual(dqCheckName("enrich:proposal-assertion"), { text: "Đề xuất có phát biểu", known: true })
  assert.deepEqual(dqCheckName("data-level:distribution"), { text: "Phân bố bậc", known: true })
  assert.deepEqual(dqEntityLabel("enrichment_proposals", new Map()), { text: "Bảng đề xuất", known: true })
  assert.deepEqual(dqEntityLabel("all", new Map()), { text: "Mọi thị trường", known: true })
  assert.deepEqual(dqDetail("enrich:proposal-assertion", "applied=4 missing=2"), {
    text: "4 đề xuất đã áp · 2 thiếu phát biểu",
    known: true,
  })
  assert.deepEqual(dqDetail("data-level:distribution", "units=26781 B0=913 B1=5 B2=25863 B3=0 B4=0 B5=0"), {
    text: "26.781 đơn vị · B0 913 · B1 5 · B2 25.863 · B3 0 · B4 0 · B5 0",
    known: true,
  })
})

test("khuôn lệch của hai dòng kiểm PL16 vẫn rơi về «chưa diễn giải»", () => {
  assert.equal(dqDetail("enrich:proposal-assertion", "applied=4").known, false, "thiếu missing phải là khuôn lạ")
  assert.equal(dqDetail("data-level:distribution", "units=10 B0=1 B1=2").known, false, "thiếu bậc B2–B5 phải là khuôn lạ")
})
