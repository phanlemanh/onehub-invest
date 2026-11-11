// dq-tang-tren-tin-label.test.tsx — hồ sơ _acceptance/tang-tren-tin-s03 (DV4) AC-7: kiểm `s03-floor-fill` (pipeline/sql/450_dq_checks.sql)
// có nhãn tiếng Việt trên /ops/quality (luật đợt 30/10: loại kiểm DQ mới phải kèm nhãn). Chi tiết lấy đúng khuôn câu SQL của 450
// ghi (đọc từ tệp), không viết tay khuôn. Không cần DB.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"

const SQL = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../pipeline/sql/450_dq_checks.sql"), "utf8")

test("DV4-AC-7 nhãn s03-floor-fill: tên kiểm, đối tượng, chi tiết đều có chữ tiếng Việt; mã lạ rơi về mã thô", () => {
  const khoi = SQL.slice(SQL.indexOf("-- ============ s03-floor-fill"))
  // Chi tiết dựng theo đúng biểu thức của 450: d.co_tang || '/' || d.tong || ' tin căn hộ S03 có tầng'
  const duoi = khoi.match(/d\.co_tang \|\| '\/' \|\| d\.tong \|\| '([^']+)'/)
  assert.ok(duoi, "450 đổi khuôn chi tiết — test phải theo")
  for (const [n, m] of [[0, 0], [712, 4801], [1, 4801]]) {
    const detail = `${n}/${m}${duoi[1]}`
    const t = dqDetail("s03-floor-fill", detail)
    assert.equal(t.known, true, `chi tiết «${detail}»`)
    assert.match(t.text, /tầng/)
  }
  const ten = dqCheckName("s03-floor-fill", "S03")
  assert.equal(ten.known, true)
  assert.match(ten.text, /Tầng/)
  assert.equal(dqEntityLabel("S03", new Map()).known, true)
  assert.equal(dqCheckName("khong-co-kiem-nay", "S03").known, false, "đối chứng: mã lạ phải rơi về mã thô")
})
