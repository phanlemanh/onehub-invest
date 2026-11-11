// anh-chup.ts — hồ sơ app-test-chap-chon-e4b-sap (đổi khuôn theo lời Mạnh 11/11): ca đối chiếu đọc DB máy thu dùng chung với
// lượt nạp sống (S03 15′). Mọi lời đọc qua `pool.query` trong lúc giữ đi qua `n` kết nối cùng MỘT ảnh chụp REPEATABLE READ
// READ ONLY (pg_export_snapshot + SET TRANSACTION SNAPSHOT), nên dữ liệu ghi giữa chừng không lọt vào phép so.
import pg from "pg"

type Query = (text: string, values?: unknown[]) => Promise<unknown>
type CoQuery = { query: Query }

/** Giữ ảnh chụp chung cho `pool.query`; trả hàm nhả (khôi phục `pool.query`, ROLLBACK, đóng kết nối). */
export async function giuAnhChup(pool: CoQuery, url: string, n = 5): Promise<() => Promise<void>> {
  const moi = async () => {
    const c = new pg.Client({ connectionString: url })
    await c.connect()
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY")
    return c
  }
  const goc = await moi()
  const { rows } = await goc.query<{ s: string }>("SELECT pg_export_snapshot() AS s")
  const ma = rows[0].s
  if (!/^[0-9A-F-]+$/i.test(ma)) throw new Error(`ANH CHUP MA LA ${ma}`)
  const tho = await Promise.all(Array.from({ length: n }, async () => {
    const c = await moi()
    await c.query(`SET TRANSACTION SNAPSHOT '${ma}'`)
    return c
  }))
  const ranh = [...tho]
  const cho: ((c: pg.Client) => void)[] = []
  const lay = () => (ranh.length ? Promise.resolve(ranh.pop()!) : new Promise<pg.Client>((r) => cho.push(r)))
  const tra = (c: pg.Client) => { const w = cho.shift(); if (w) w(c); else ranh.push(c) }
  const cu = pool.query
  pool.query = async (text, values) => {
    const c = await lay()
    try { return await c.query(text, values as unknown[]) } finally { tra(c) }
  }
  return async () => {
    pool.query = cu
    for (const c of [...tho, goc]) {
      await c.query("ROLLBACK").catch(() => {})
      await c.end().catch(() => {})
    }
  }
}
