// db-tam-thoi.test.tsx — hồ sơ test-nen-on22-on12 (AC-2): thuLaiDbTam thử lại đúng các lỗi DB tạm thời, lỗi khác ném ngay.
// Lỗi giả, không chạm DB.
import { test } from "node:test"
import assert from "node:assert/strict"

import { laLoiBenGhiTam, MA_TAM_THOI, thuLaiDbTam } from "./helpers/db-tam-thoi"

const loi = (code: string) => Object.assign(new Error(`giả ${code}`), { code })

/** Hàm ném lần lượt các lỗi trong `tran`, hết thì trả "xong"; đếm số lần gọi. */
function gia(tran: Error[]) {
  let goi = 0
  return {
    fn: async () => {
      goi++
      const e = tran.shift()
      if (e) throw e
      return "xong"
    },
    goi: () => goi,
  }
}

for (const ma of ["53300", "40P01", "57P03"]) {
  test(`DT-AC-2 lỗi ${ma} một lần → thử lại rồi trả kết quả`, async () => {
    const g = gia([loi(ma)])
    const kq = await thuLaiDbTam(g.fn, { choMs: 1, bao: () => {} }).catch((e: Error) => assert.fail(`lỗi DB tạm thời phải được thử lại — ${ma}: ${e.message}`))
    assert.equal(kq, "xong", "lỗi DB tạm thời phải được thử lại")
    assert.equal(g.goi(), 2)
  })
}

test("DT-AC-2 lỗi tạm 3 lần → ném lỗi cuối đúng mã, gọi đúng 3 lần", async () => {
  const g = gia([loi("53300"), loi("53300"), loi("40P01")])
  await assert.rejects(thuLaiDbTam(g.fn, { choMs: 1, bao: () => {} }), { code: "40P01" })
  assert.equal(g.goi(), 3)
})

test("DT-AC-2 lỗi thường → ném ngay, không thử lại", async () => {
  const g = gia([loi("42P01")])
  await assert.rejects(thuLaiDbTam(g.fn, { choMs: 1, bao: () => {} }), { code: "42P01" })
  assert.equal(g.goi(), 1)
})

test("DT-AC-2 tập mã tạm thời đúng ba mã; stderr bên ghi nhận lỗi tạm, không nhận lỗi thường", () => {
  assert.deepEqual([...MA_TAM_THOI].sort(), ["40P01", "53300", "57P03"])
  assert.ok(laLoiBenGhiTam("error: sorry, too many clients already"))
  assert.ok(laLoiBenGhiTam("ERROR:  deadlock detected"))
  assert.ok(!laLoiBenGhiTam('relation "ops_heartbeat" does not exist'))
})
