// dq-danh-ba-sdt-label.test.tsx — hồ sơ _acceptance/do-danh-ba-sdt (SD5) AC-5: năm dòng kiểm `danh-ba-sdt:*` có nhãn tiếng
// Việt trên /ops/quality. Đầu vào sinh bằng ĐÚNG bên ghi (pipeline/do-danh-ba-sdt.mjs: veDong), không viết tay khuôn. Không
// cần DB: ca ON12-AC-5 soi cùng nhãn trên DB thử sau lượt ghi thật (probes/on12.sh).
import { test } from "node:test"
import assert from "node:assert/strict"

import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"
import * as ben from "../../pipeline/do-danh-ba-sdt.mjs"

/** Hai kết quả viết trước: mọi kiểm đạt, mọi kiểm không đạt — 9 dòng mỗi kết quả. */
const so = (n1: number, n2: number, n4r: number, n5: number, sellers: number, sdt: number) => ({
  S03: { n1: { so: n1, tong: 170 }, n2: { so: n2, tong: 192 }, n4: { nhieu: 23, rong: n4r, tong: 1153 }, n5: { so: n5, tong: 12800 } },
  S05: { n1: { so: n1, tong: 13 }, n2: { so: n2, tong: 20 }, n4: { nhieu: 1, rong: n4r, tong: 28 }, n5: { so: n5, tong: 96 } },
  sellers: { n3: { sellers, sdt_tren_tin: sdt } },
})
const KET_QUA = [so(0, 5, 0, 0, 208, 208), so(170, 185, 5, 48, 19, 208)]

test("AC-5 ma trận 9 dòng × (đạt, không đạt): tên kiểm, đối tượng, chi tiết đều có nhãn", () => {
  let soAssert = 0
  const trangThai = new Set<string>()
  for (const kq of KET_QUA) {
    const dong = ben.veDong(kq)
    assert.equal(dong.length, 9)
    for (const d of dong) {
      trangThai.add(d.status)
      for (const [ten, t] of [["tên", dqCheckName(d.check_name, d.entity)], ["đối tượng", dqEntityLabel(d.entity, new Map())], ["chi tiết", dqDetail(d.check_name, d.detail)]] as const)
        assert.equal(t.known, true, `${d.check_name} ${d.entity} ${ten}: ${t.code}`)
      soAssert++
    }
  }
  assert.equal(soAssert, 18)
  assert.deepEqual([...trangThai].sort(), ["fail", "pass"])
  assert.equal(dqDetail("danh-ba-sdt:n3", "sellers=19 sdt_tren_tin=208").text, "19 dòng bảng người bán · 208 SĐT trên tin")
  assert.equal(dqEntityLabel("sellers", new Map()).text, "Bảng người bán")
})

test("AC-5 đối chứng đỏ: chi tiết thiếu khoá rơi về «chưa diễn giải»", () => {
  assert.equal(dqDetail("danh-ba-sdt:n4", "nhieu=23 tong=1153").known, false)
  assert.equal(dqDetail("danh-ba-sdt:n1", "so=1").known, false)
})
