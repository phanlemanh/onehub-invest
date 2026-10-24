#!/usr/bin/env node
// Smoke chữ hiển thị của 7 trang cổng Ops trên app ĐANG CHẠY (ON12 `ops-nhan-theo-context` AC-8; design doc §3.2).
// Đây là phép đo đúng ngưỡng của hàng: «Quét chữ hiển thị của 7 trang Ops: 0 từ _Avoid_ của CONTEXT.md, 0 mã thô DQ;
// nhãn sr-only của thanh bên tiếng Việt», cộng 0 tiếng Anh ngoài danh sách giữ, 0 mã khu vực, 0 dấu dự phòng.
//
// App: BASE_URL nếu có; không thì tự bật `next dev` TỪ app/ của chính worktree này trên một cổng trống, tắt khi xong.
// Phiên: tạo một user admin tạm (`*.verify.test`) + phiên tạm trong DB local, xoá trong finally (khuôn
// smoke-portal-compliance.mjs) — không đụng dữ liệu khác. Chạy: node scripts/smoke-ops-nhan.mjs
import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { KEEP_EN, allowPhrases, avoidTerms, boldAsciiWords, htmlVisibleText, soiChu } from "./lib/ops-nhan.mjs"

// Root repo không có node_modules — mượn pg từ app/ (AGENTS.md bẫy 6).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"

const TRANG = ["/ops", "/ops/collections", "/ops/sources", "/ops/deals", "/ops/quality", "/ops/review", "/ops/design"]
const CONTEXT = readFileSync(path.join(ROOT, "CONTEXT.md"), "utf8")
const RUNG = { terms: avoidTerms(CONTEXT), allow: allowPhrases(CONTEXT), keep: new Set([...boldAsciiWords(CONTEXT), ...KEEP_EN]) }

/** Mọi lỗi chữ của một trang theo luật (a)–(f): chữ ngoài <code> đủ sáu luật, chữ trong <code>/<kbd> miễn luật tiếng Anh. */
export function soiTrang(html) {
  const { text, code } = htmlVisibleText(html)
  const loi = [
    ...text.flatMap((s) => soiChu(s, RUNG).map((l) => ({ ...l, chu: s }))),
    ...code.flatMap((s) => soiChu(s, { ...RUNG, inCode: true }).map((l) => ({ ...l, chu: s }))),
  ]
  return { loi, soKyTu: text.join(" ").length, code }
}

const fails = []
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`)
  if (!ok) fails.push(msg)
}

// ---- chiều đỏ: cùng bộ lọc trên HTML viết trước phải báo đủ chín mục ----
{
  const DO = `<html><head><title>Review Queue</title></head><body>
    <h2>Heartbeat 15′ cuối</h2><td>truthful-coverage</td><td>our=0 s02_active=1(2026-09)</td>
    <button><span class="sr-only">Toggle Sidebar</span></button><td>vn-tinh-an-giang</td><td>vn</td>
    <code>Hàng chờ duyệt</code><td>(chưa diễn giải)</td></body></html>`
  const { loi } = soiTrang(DO)
  const can = [
    ["avoid", "Review Queue"],
    ["avoid", "Heartbeat"],
    ["ma-tho", "truthful-coverage"],
    ["ma-tho", "our=0"],
    ["toggle-sidebar", "Toggle Sidebar"],
    ["ma-tho", "vn-tinh-an-giang"],
    ["ma-tho", "vn"],
    ["avoid", "hàng chờ"],
    ["du-phong", "(chưa diễn giải)"],
  ]
  const thieu = can.filter(([luat, tu]) => !loi.some((l) => l.luat === luat && l.tu.toLowerCase() === tu.toLowerCase()))
  check(
    thieu.length === 0,
    thieu.length === 0
      ? `chiều đỏ HTML viết trước: báo đủ ${can.length} mục`
      : `chiều đỏ HTML viết trước: thiếu ${thieu.map((x) => x.join(":")).join(", ")}`,
  )
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

async function batApp() {
  if (process.env.BASE_URL) return { base: process.env.BASE_URL.replace(/\/$/, ""), tat: async () => {} }
  const port = await conTrong()
  const base = `http://localhost:${port}`
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: path.join(ROOT, "app"),
    env: { ...process.env, DATABASE_URL: DB, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  })
  let log = ""
  child.stdout.on("data", (d) => (log += d))
  child.stderr.on("data", (d) => (log += d))
  const tat = async () => {
    try {
      process.kill(-child.pid, "SIGTERM")
    } catch {
      /* đã thoát */
    }
  }
  const het = Date.now() + 180_000
  while (Date.now() < het) {
    if (child.exitCode !== null) throw new Error(`next dev thoát sớm (mã ${child.exitCode}):\n${log.slice(-2000)}`)
    try {
      const r = await fetch(`${base}/login`, { signal: AbortSignal.timeout(60_000) })
      if (r.status < 500) {
        console.log(`app: next dev tự bật ở ${base}`)
        return { base, tat }
      }
    } catch {
      /* chưa lên */
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  await tat()
  throw new Error(`next dev không lên trong 180 giây:\n${log.slice(-2000)}`)
}

const db = new pg.Client({ connectionString: DB })
await db.connect()
const nonce = randomBytes(6).toString("hex")
const userId = `verify-ops-nhan-${nonce}`
const token = `verify-${nonce}-ops-nhan`
let app = null
try {
  await db.query(`INSERT INTO users (id, email, password_hash, plan, role) VALUES ($1, $2, 'verify-no-login', 'free', 'admin')`, [
    userId,
    `${nonce}-ops-nhan@smoke.verify.test`,
  ])
  await db.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`, [token, userId])
  app = await batApp()
  for (const p of TRANG) {
    const res = await fetch(app.base + p, { headers: { cookie: `oi_session=${token}` }, redirect: "manual", signal: AbortSignal.timeout(180_000) })
    const html = await res.text()
    if (process.env.OPS_NHAN_DUMP) {
      mkdirSync(process.env.OPS_NHAN_DUMP, { recursive: true })
      writeFileSync(path.join(process.env.OPS_NHAN_DUMP, `${p.replaceAll("/", "_") || "_"}.html`), html)
    }
    const { loi, soKyTu, code } = soiTrang(html)
    const dem = (luat) => loi.filter((l) => l.luat === luat).length
    const ok = res.status === 200 && soKyTu > 0 && loi.length === 0
    check(
      ok,
      `${p} ${res.status} · ${dem("avoid")} _Avoid_ · ${dem("tieng-anh")} tiếng Anh · ${dem("ma-tho")} mã DQ/mã khu vực · ` +
        `${dem("toggle-sidebar") ? "CÒN" : "không"} Toggle Sidebar · ${dem("du-phong")} dự phòng · ${soKyTu} ký tự chữ`,
    )
    for (const l of loi.slice(0, 15)) console.log(`       ${l.luat} «${l.tu}» trong «${l.chu.slice(0, 100)}»`)
    console.log(`       <code>: ${code.length ? code.map((c) => `«${c.slice(0, 60)}»`).join(" ") : "—"}`)
  }
} catch (e) {
  check(false, `smoke không chạy trọn: ${e.message}`)
} finally {
  await app?.tat()
  await db.query(`DELETE FROM sessions WHERE token = $1`, [token])
  await db.query(`DELETE FROM users WHERE id = $1`, [userId])
  const { rows } = await db.query(`SELECT count(*)::int n FROM sessions WHERE token = $1`, [token])
  console.log(`dọn: ${rows[0].n} phiên tạm còn lại`)
  await db.end()
}

console.log(fails.length === 0 ? "\nops-nhan-smoke: ĐẠT" : `\nops-nhan-smoke: ${fails.length} lỗi`)
process.exit(fails.length === 0 ? 0 : 1)
