// dq-the-duyet-label.test.tsx — hồ sơ _acceptance/do-the-duyet-du-du-lieu (HD11) AC-5: dòng kiểm `the-duyet:*` có nhãn
// tiếng Việt trên /ops/quality. Đầu vào sinh bằng ĐÚNG bên ghi (pipeline/do-the-duyet.mjs: veDong), không viết tay khuôn.
// Không cần DB: ca ON12-AC-5 soi cùng nhãn trên DB thử sau lượt ghi thật (probes/on12.sh).
import { test } from "node:test"
import assert from "node:assert/strict"

import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"
import * as ben from "../../pipeline/do-the-duyet.mjs"

const day = (n: number) => ({ tong: n, gia: n, dt: n, gia_m2: n, phuong: n, loai: 0, pn: n, wc: 0, duong: 0, toa: 0, tang: 0, nguoi_dang: n })
/** Hai kết quả viết trước: mọi kiểm đạt, mọi kiểm không đạt — ba nguồn ở độ đầy. */
const KET_QUA = [
  { tong: 7, roiKho: { so: 0, ben: 0 }, anhOps: { so: 0, ben: 0 }, anhAdmin: { so: 0, ben: 0 }, doDay: { S03: day(3), S05: day(2), S06: day(7) } },
  { tong: 7, roiKho: { so: 2, ben: 2 }, anhOps: { so: 7, ben: 14 }, anhAdmin: { so: 7, ben: 7 }, doDay: { S03: day(1), S05: day(2), S06: day(7) } },
]

test("AC-5 ma trận 6 dòng × (đạt, không đạt): tên kiểm, đối tượng, chi tiết đều có nhãn", () => {
  let soAssert = 0
  const trangThai = new Set<string>()
  for (const kq of KET_QUA) {
    const dong = ben.veDong(kq)
    assert.equal(dong.length, 6)
    for (const d of dong) {
      trangThai.add(d.status)
      for (const [ten, t] of [["tên", dqCheckName(d.check_name, d.entity)], ["đối tượng", dqEntityLabel(d.entity, new Map())], ["chi tiết", dqDetail(d.check_name, d.detail)]] as const)
        assert.equal(t.known, true, `${d.check_name} ${d.entity} ${ten}: ${t.code}`)
      soAssert++
    }
  }
  assert.equal(soAssert, 12)
  assert.deepEqual([...trangThai].sort(), ["fail", "pass"])
  assert.equal(dqDetail("the-duyet:anh-ops", "tong=7 so=7 ben=14").text, "7/7 thẻ chờ · 14 bên")
  assert.equal(dqEntityLabel("entity_match", new Map()).text, "Thẻ ghép căn chờ duyệt")
  assert.match(dqDetail("the-duyet:do-day", ben.veDong(KET_QUA[0])[3].detail).text, /^3 tin còn sống · giá 3 · .* · người đăng 3$/)
})

test("AC-5 đối chứng đỏ: chi tiết thiếu khoá rơi về «chưa diễn giải»", () => {
  assert.equal(dqDetail("the-duyet:roi-kho", "tong=7 so=1").known, false)
  assert.equal(dqDetail("the-duyet:do-day", "tong=3 gia=3").known, false)
})
