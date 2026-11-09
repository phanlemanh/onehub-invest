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

// thang-bac-moi-b0-b5: máy thu chưa áp 087 thì bac-du-lieu ghi skip «chua-ap-087» — chữ tiếng Việt, chỉ cho đúng kiểm này.
test("nhãn dòng skip chưa áp 087 của data-level:distribution", () => {
  assert.deepEqual(dqDetail("data-level:distribution", "chua-ap-087"), {
    text: "Tạm dừng: máy thu chưa áp bản cập nhật thang bậc 08/11 (087)",
    known: true,
  })
  assert.equal(dqDetail("vocab:x", "chua-ap-087").known, false, "chỉ đọc cho đúng kiểm data-level:distribution")
})

// Kiểm 450 so-chua-xac-minh (070): #329 (enrich-nguoi-s03, 079) thêm vế «S03 qua người đăng». Đầu vào chép đúng chuỗi 450 ghi.
test("nhãn kiểm so-chua-xac-minh: dạng 079 có vế S03 qua người đăng và dạng 070 cũ đều diễn giải được", () => {
  assert.deepEqual(dqDetail("so-chua-xac-minh", "S06 có số: 57667, chưa xác minh: 44664, nguồn khác có nhãn: 0, S03 qua người đăng: 758"), {
    text: "57.667 tin S06 có số · 44.664 số chưa xác minh · 0 tin nguồn khác mang nhãn · 758 tin S03 có số qua người đăng",
    known: true,
  })
  assert.deepEqual(dqDetail("so-chua-xac-minh", "S06 có số: 57667, chưa xác minh: 44664, nguồn khác có nhãn: 0"), {
    text: "57.667 tin S06 có số · 44.664 số chưa xác minh · 0 tin nguồn khác mang nhãn",
    known: true,
  })
  assert.equal(dqDetail("so-chua-xac-minh", "S06 có số: 1, chưa xác minh: 2").known, false, "thiếu vế nguồn khác phải là khuôn lạ")
  assert.equal(dqDetail("vocab:x", "S06 có số: 1, chưa xác minh: 2, nguồn khác có nhãn: 0").known, false, "chỉ đọc cho đúng kiểm so-chua-xac-minh")
})
