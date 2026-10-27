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

/** Bảng phiên + một người admin có phiên trong lược đồ `s` đã có (ca thử cũ chuyển từ bearer sang phiên thật — TV1). */
export async function themPhienAdmin(admin: pg.Client, s: string): Promise<{ id: string; cookie: string }> {
  await dungBangPhien(admin, s)
  await admin.query(`SET search_path TO "${s}"`)
  try {
    return await taoNguoi(admin, "admin")
  } finally {
    await admin.query(`RESET search_path`)
  }
}

/**
 * Một lược đồ tạm chỉ có users, sessions, ops_audit và một người admin có phiên — cho ca thử route zalo (route nay đọc
 * phiên và ghi audit trong DB). Trả URL đặt vào DATABASE_URL trước khi nạp route, cookie admin và hàm dọn.
 */
export async function luocDoPhienAdmin(ten: string): Promise<{ url: string; cookie: string; don: () => Promise<void> }> {
  const { localDbUrl } = await import("../../../pipeline/scripts/capture-ops-facts.mjs")
  const { schemaUrl } = await import("../../../pipeline/scripts/ops-facts-fixture.mjs")
  const s = `${ten}_${process.pid}`
  const admin = new pg.Client({ connectionString: localDbUrl() })
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${s}"`)
  await admin.query(`CREATE TABLE "${s}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
  const nguoi = await themPhienAdmin(admin, s)
  return {
    url: schemaUrl(s),
    cookie: nguoi.cookie,
    don: async () => {
      await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
      await admin.end().catch(() => {})
    },
  }
}
