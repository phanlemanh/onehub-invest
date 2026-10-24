// ops-app.mjs — dựng app Ops TỪ worktree đang kiểm và phiên admin tạm cho các smoke trang chạy thật (ON13).
// Phiên tạm chỉ tạo trên DB localhost (bài học ON12 Ngoài-4: smoke không được ghi admin tạm lên DB cloud).
import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import net from "node:net"
import path from "node:path"

export const DB_LOCAL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"

/** DATABASE_URL (mặc định DB local) — từ chối mọi host không phải localhost. */
export function dbUrl() {
  const url = process.env.DATABASE_URL ?? DB_LOCAL
  const host = new URL(url).hostname
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) throw new Error(`DATABASE_URL trỏ ${host} — smoke chỉ chạy trên DB local`)
  return url
}

const conTrong = () =>
  new Promise((res, rej) => {
    const s = net.createServer()
    s.unref()
    s.on("error", rej)
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address()
      s.close(() => res(port))
    })
  })

/** BASE_URL nếu có; không thì bật `next dev` từ `<root>/app` trên cổng trống. `next dev` tự ghi app/next-env.d.ts và tạo
 *  app/AGENTS.md — chụp lại rồi trả về đúng như cũ khi tắt (lưới «cây đổi trong lượt chấm»). */
export async function batApp(root, { log = console.log } = {}) {
  if (process.env.BASE_URL) return { base: process.env.BASE_URL.replace(/\/$/, ""), tat: async () => {} }
  const port = await conTrong()
  const base = `http://localhost:${port}`
  const SINH = ["app/next-env.d.ts", "app/AGENTS.md"].map((t) => path.join(root, t))
  const truoc = new Map(SINH.map((t) => [t, existsSync(t) ? readFileSync(t) : null]))
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: path.join(root, "app"),
    env: { ...process.env, DATABASE_URL: dbUrl(), NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  })
  let out = ""
  child.stdout.on("data", (d) => (out += d))
  child.stderr.on("data", (d) => (out += d))
  const tat = async () => {
    try {
      process.kill(-child.pid, "SIGTERM")
    } catch {
      /* đã thoát */
    }
    await new Promise((r) => setTimeout(r, 1500))
    for (const [t, noi] of truoc) {
      if (noi === null) rmSync(t, { force: true })
      else if (!existsSync(t) || !readFileSync(t).equals(noi)) writeFileSync(t, noi)
    }
  }
  const het = Date.now() + 180_000
  while (Date.now() < het) {
    if (child.exitCode !== null) {
      await tat()
      throw new Error(`next dev thoát sớm (mã ${child.exitCode}):\n${out.slice(-2000)}`)
    }
    try {
      const r = await fetch(`${base}/login`, { signal: AbortSignal.timeout(60_000) })
      if (r.status < 500) {
        log(`app: next dev tự bật ở ${base}`)
        return { base, tat }
      }
    } catch {
      /* chưa lên */
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  await tat()
  throw new Error(`next dev không lên trong 180 giây:\n${out.slice(-2000)}`)
}

/** User admin tạm + phiên tạm; `xoa()` dọn cả hai và trả số phiên tạm còn lại. */
export async function phienAdminTam(db, tag) {
  const nonce = randomBytes(6).toString("hex")
  const userId = `verify-${tag}-${nonce}`
  const token = `verify-${nonce}-${tag}`
  await db.query(`INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', 'admin')`, [
    userId,
    `${nonce}-${tag}@smoke.verify.test`,
  ])
  await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`, [token, userId])
  return {
    token,
    xoa: async () => {
      await db.query(`DELETE FROM sessions WHERE token = $1`, [token])
      await db.query(`DELETE FROM users WHERE id = $1`, [userId])
      return (await db.query(`SELECT count(*)::int n FROM sessions WHERE token = $1`, [token])).rows[0].n
    },
  }
}
