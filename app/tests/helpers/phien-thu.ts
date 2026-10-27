// phien-thu.ts — người và phiên thật trong một lược đồ tạm cho ca thử route Ops (TV1 `quyen-bon-vai-mot-cho`).
// Route đọc phiên từ header Cookie (nguoiTuRequest), nên ca thử gửi đúng cookie mà đăng nhập thật đặt.
import { randomBytes } from "node:crypto"
import pg from "pg"

const COOKIE = "oi_session" // trùng app/src/lib/auth.ts

/** Bảng users, sessions trong lược đồ `s`, khuôn của public (cột, mặc định, khoá chính) — không FK ra ngoài. */
export async function dungBangPhien(admin: pg.Client, s: string): Promise<void> {
  await admin.query(`CREATE TABLE "${s}".users (LIKE public.users INCLUDING DEFAULTS INCLUDING INDEXES)`)
  await admin.query(`CREATE TABLE "${s}".sessions (LIKE public.sessions INCLUDING DEFAULTS INCLUDING INDEXES)`)
}

/** Một người ở vai `vai` (giá trị thô ghi vào users.role) và một phiên còn hạn (`hetHan` → phiên đã hết hạn). */
export async function taoNguoi(
  c: pg.Client,
  vai: string,
  opts: { email?: string; hetHan?: boolean } = {},
): Promise<{ id: string; email: string; cookie: string }> {
  const id = `usr_${randomBytes(6).toString("hex")}`
  const email = opts.email ?? `${id}@local.test`
  const token = randomBytes(32).toString("hex")
  await c.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x$y', $3)`, [id, email, vai])
  await c.query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + $3::interval)`,
    [token, id, opts.hetHan ? "-1 day" : "1 day"],
  )
  return { id, email, cookie: `${COOKIE}=${token}` }
}
