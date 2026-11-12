// anh-chup.test.tsx — hồ sơ app-test-chap-chon-e4b-sap, đổi khuôn 11/11: helper giữ ảnh chụp chung của ca CGT-DC. Chạy trên DB
// của riêng lượt (npm test bọc db/db-thu.sh --chay): bảng tạm thật, một kết nối khác ghi giữa chừng.
import assert from "node:assert/strict"
import { test } from "node:test"
import pg from "pg"

import { giuAnhChup } from "./helpers/anh-chup"

const URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const KHONG_DB = process.env.CI ? "CI không có DB của lượt" : false
const BANG = `anh_chup_thu_${process.pid}`

/** Đếm trước và sau một lần ghi xen giữa phải bằng nhau khi đang giữ ảnh chụp. */
function kiemGiu(truoc: number, sau: number) {
  if (truoc !== sau) throw new Error(`ANH CHUP KHONG GIU: ${truoc} → ${sau}`)
}

test("ANH-CHUP ghi xen giữa không lọt vào lời đọc qua pool khi giữ ảnh chụp; đối chứng không giữ thì đỏ", { skip: KHONG_DB }, async () => {
  const ghi = new pg.Client({ connectionString: URL })
  await ghi.connect()
  const pool = new pg.Pool({ connectionString: URL, max: 5 })
  try {
    await ghi.query(`CREATE TABLE ${BANG} (x int)`)
    await ghi.query(`INSERT INTO ${BANG} VALUES (1)`)
    const dem = async () => Number(((await pool.query(`SELECT count(*) AS n FROM ${BANG}`)) as pg.QueryResult<{ n: string }>).rows[0].n)

    const nha = await giuAnhChup(pool, URL)
    const truoc = await dem()
    await ghi.query(`INSERT INTO ${BANG} VALUES (2)`)
    // Năm lời đọc song song đều thấy cùng ảnh chụp.
    const song = await Promise.all(Array.from({ length: 8 }, dem))
    for (const s of song) kiemGiu(truoc, s)
    await nha()
    assert.equal(await dem(), 2, "nhả xong phải thấy dữ liệu sống")

    // Đối chứng: không giữ ảnh chụp thì ghi xen giữa lọt vào → đỏ đúng thông điệp.
    const t2 = await dem()
    await ghi.query(`INSERT INTO ${BANG} VALUES (3)`)
    const s2 = await dem()
    assert.throws(() => kiemGiu(t2, s2), /ANH CHUP KHONG GIU: 2 → 3/)
  } finally {
    await ghi.query(`DROP TABLE IF EXISTS ${BANG}`).catch(() => {})
    await ghi.end()
    await pool.end()
  }
})
