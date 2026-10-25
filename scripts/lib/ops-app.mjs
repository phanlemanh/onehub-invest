// ops-app.mjs — dựng app Ops TỪ worktree đang kiểm và phiên admin tạm cho các smoke trang chạy thật (ON13).
// Phiên tạm chỉ tạo trên DB localhost (bài học ON12 Ngoài-4: smoke không được ghi admin tạm lên DB cloud).
import { execFileSync, spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import net from "node:net"
import os from "node:os"
import path from "node:path"

export const DB_LOCAL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"

/** DATABASE_URL (mặc định DB local) — từ chối mọi host không phải localhost. `url` để kiểm một chuỗi khác (ON5). */
export function dbUrl(url = process.env.DATABASE_URL ?? DB_LOCAL) {
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
 *  app/AGENTS.md — chụp lại rồi trả về đúng như cũ khi tắt (lưới «cây đổi trong lượt chấm»). `env` thêm biến môi trường
 *  cho app (ON5: chế độ máy chủ trên lược đồ tạm) — DATABASE_URL trong đó cũng phải là localhost. */
export async function batApp(root, { log = console.log, env = {} } = {}) {
  if (process.env.BASE_URL) return { base: process.env.BASE_URL.replace(/\/$/, ""), tat: async () => {} }
  const port = await conTrong()
  const base = `http://localhost:${port}`
  const SINH = ["app/next-env.d.ts", "app/AGENTS.md"].map((t) => path.join(root, t))
  const truoc = new Map(SINH.map((t) => [t, existsSync(t) ? readFileSync(t) : null]))
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: path.join(root, "app"),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...env, DATABASE_URL: dbUrl(env.DATABASE_URL) },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  })
  let out = ""
  let loiSpawn = null
  child.on("error", (e) => (loiSpawn = e))
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
    if (loiSpawn) {
      await tat()
      throw new Error(`không bật được next dev: ${loiSpawn.message}`)
    }
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

/** User admin tạm + phiên tạm; `xoa()` dọn cả hai và trả số dòng tạm (user + phiên) còn lại. Phiên không tạo được thì
 *  xoá luôn user vừa tạo trước khi ném lỗi. */
export async function phienAdminTam(db, tag) {
  const nonce = randomBytes(6).toString("hex")
  const userId = `verify-${tag}-${nonce}`
  const token = `verify-${nonce}-${tag}`
  await db.query(`INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', 'admin')`, [
    userId,
    `${nonce}-${tag}@smoke.verify.test`,
  ])
  try {
    await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`, [token, userId])
  } catch (e) {
    await db.query(`DELETE FROM users WHERE id = $1`, [userId])
    throw e
  }
  return {
    token,
    xoa: async () => {
      await db.query(`DELETE FROM sessions WHERE token = $1`, [token])
      await db.query(`DELETE FROM users WHERE id = $1`, [userId])
      const { rows } = await db.query(
        `SELECT (SELECT count(*) FROM sessions WHERE token = $1)::int + (SELECT count(*) FROM users WHERE id = $2)::int AS n`,
        [token, userId],
      )
      return rows[0].n
    },
  }
}

/** playwright-core: app → collector của cây → collector của checkout chính (worktree không có node_modules collector). */
export function timPlaywright(root) {
  const ung = [path.join(root, "app/package.json"), path.join(root, "collector/package.json")]
  try {
    const chung = execFileSync("git", ["-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim()
    ung.push(path.join(path.dirname(chung), "collector/package.json"))
  } catch {
    /* không phải kho git */
  }
  for (const p of ung) {
    if (!existsSync(p)) continue
    try {
      return { pw: createRequire(p)("playwright-core"), tu: path.dirname(p) }
    } catch {
      /* không có ở đây */
    }
  }
  return null
}

/** Chromium mặc định của playwright; vắng thì bản headless mới nhất trong ms-playwright. */
export async function batTrinhDuyet(chromium, { log = console.log } = {}) {
  try {
    return await chromium.launch()
  } catch (e) {
    const goc = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright")
    const ban = existsSync(goc)
      ? readdirSync(goc)
          .map((d) => ({ d, so: Number(d.match(/^chromium_headless_shell-(\d+)$/)?.[1] ?? NaN) }))
          .filter((x) => Number.isFinite(x.so))
          .sort((a, b) => b.so - a.so)
      : []
    for (const { d } of ban)
      for (const con of readdirSync(path.join(goc, d))) {
        const exe = path.join(goc, d, con, "chrome-headless-shell")
        if (existsSync(exe)) {
          log(`trình duyệt: ${exe}`)
          return chromium.launch({ executablePath: exe })
        }
      }
    throw new Error(`không có Chromium cho playwright-core (${String(e.message).split("\n")[0]}) và không thấy bản headless nào trong ms-playwright`)
  }
}
