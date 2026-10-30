// node scripts/do-nen-hieu-nang/do.mjs [--luot 20] [--cong 3463] [--ra <tệp.json>]
// Hàng do-nen-hieu-nang (Mạnh giao 27/10): đo nền hiệu năng trên BUILD PROD local (next start, không đo dev).
//   1. Năm trang: 3 Invest (/vn, /vn/hanoi, /vn/hanoi/listings) + 2 Ops (/ops, /ops/data-flow, đăng nhập tài khoản ĐO riêng
//      perf-test@local.test của DB local — mật khẩu xoay mỗi lượt, chỉ trong bộ nhớ). Mỗi trang 2 lượt làm nóng (không tính)
//      rồi N lượt tuần tự: TTFB (tới khi có header) và tổng (tới khi đọc hết HTML — nội dung chính đã dựng xong ở server).
//   2. pg_stat_statements: reset trước lượt đo, sau đó 10 truy vấn theo tổng thời gian và 10 theo thời gian trung bình.
//   3. Thống kê bảng: 15 bảng lớn nhất — cỡ, n_live_tup, lần ANALYZE gần nhất.
//   4. Máy + cỡ dữ liệu. Ghi JSON (--ra) và in tóm tắt. Ghi DB chỉ có pg_stat_statements_reset() và tài khoản đo.
// Cần: app đã `next build` (thư mục app/.next), DB local :5433 có pg_stat_statements.
import { spawn } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { maskSourceNames } from "../../pipeline/lib/mask-source-names.mjs"
import { sourceRegistrySeeds } from "../lib/tier-a-source-names.mjs"
import { assertLocalDatabaseUrl, ensureAccount } from "../dev-ops-account.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const APP = path.join(ROOT, "app")
const arg = (k, md) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : md }
const LUOT = Number(arg("--luot", "20")), CONG = Number(arg("--cong", "3463")), RA = arg("--ra", "")
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
// Rào chỉ-DB-local, đứng trước mọi kết nối: script ghi DB (CREATE EXTENSION, tài khoản đo admin, reset pg_stat_statements),
// nên DATABASE_URL trỏ ra ngoài máy thì dừng ngay — không bao giờ ghi lên DB cloud/production.
assertLocalDatabaseUrl(DB_URL)
const BASE = `http://localhost:${CONG}`
// `dau`: chuỗi phải có trong <title> — lượt tính chỉ khi đúng là trang đã dựng (không phải trang lỗi hay /login).
export const TRANG = [
  { cong: "invest", duong: "/vn", dau: "Thị trường Việt Nam" },
  { cong: "invest", duong: "/vn/hanoi", dau: "Insight thị trường" },
  { cong: "invest", duong: "/vn/hanoi/listings", dau: "Listing tại" },
  { cong: "ops", duong: "/ops", dau: "Tổng quan vận hành" },
  { cong: "ops", duong: "/ops/data-flow", dau: "Dòng chảy dữ liệu" },
]
const pg = createRequire(path.join(APP, "package.json"))("pg")
// Câu truy vấn và tên bảng mang tên nguồn thật (tên bảng stg_*) — che bằng mã S0x trước khi ghi (SPL tầng A, ADR-0007).
// Danh sách che: seed của migration (để chạy được trước khi kết nối) hợp với source_registry SỐNG sau khi kết nối — tên chỉ
// có ở DB local (vd S08, AGENTS.md luật 5) không nằm trong migration.
let TEN_NGUON = sourceRegistrySeeds(ROOT).map(({ code, realName }) => ({ code, realName }))
const che = (s) => { const r = maskSourceNames(s, TEN_NGUON); if (r == null) throw new Error("không che được tên nguồn — dừng, không ghi chữ gốc"); return r }
const ms = (t0) => Number(process.hrtime.bigint() - t0) / 1e6
const phanVi = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] }
const r1 = (x) => Math.round(x * 10) / 10

async function choSan(timeoutMs = 60_000) {
  const het = Date.now() + timeoutMs
  while (Date.now() < het) {
    try { const r = await fetch(`${BASE}/`, { redirect: "manual" }); if (r.status < 500) return } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`next start không lên ở ${BASE} sau ${timeoutMs / 1000}s`)
}

// Tài khoản ĐO riêng (perf-test@local.test, role admin, chỉ DB local — bảng users không lên cloud): không đụng ops-test@local.test
// mà các worktree khác dùng cho đăng nhập thử/UI. Mỗi lượt đo xoay mật khẩu của CHÍNH tài khoản này, giữ trong bộ nhớ, không ghi tệp.
export const EMAIL_DO = "perf-test@local.test"

/** Đăng nhập form server action /login bằng tài khoản đo; trả cookie oi_session (không in mật khẩu). */
async function dangNhap(sql) {
  await sql.query("BEGIN")
  let tk
  try { tk = await ensureAccount(sql, { email: EMAIL_DO, rotate: true, role: "admin" }); await sql.query("COMMIT") }
  catch (e) { await sql.query("ROLLBACK").catch(() => {}); throw e }
  const html = await (await fetch(`${BASE}/login`)).text()
  const aid = /name="(\$ACTION_ID_[0-9a-f]+)"/.exec(html)?.[1]
  if (!aid) throw new Error("không thấy trường $ACTION_ID_ trong form /login")
  const fd = new FormData()
  fd.set(aid, ""); fd.set("email", tk.email); fd.set("password", tk.password); fd.set("next", "/ops")
  const r = await fetch(`${BASE}/login`, { method: "POST", body: fd, redirect: "manual" })
  const ck = (r.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("oi_session="))
  if (r.status !== 303 || !ck) throw new Error(`đăng nhập tài khoản đo không được (HTTP ${r.status})`)
  return ck.split(";")[0]
}

async function doTrang(t, cookie) {
  const mot = async () => {
    const t0 = process.hrtime.bigint()
    const r = await fetch(`${BASE}${t.duong}`, { redirect: "manual", headers: t.cong === "ops" ? { cookie } : {} })
    const ttfb = ms(t0)
    const body = await r.text()
    const tieuDe = /<title>(.*?)<\/title>/.exec(body)?.[1] ?? ""
    return { status: r.status, ttfb, tong: ms(t0), byte: body.length, dung: r.status === 200 && tieuDe.includes(t.dau) }
  }
  for (let i = 0; i < 2; i++) await mot()
  const mau = []
  for (let i = 0; i < LUOT; i++) mau.push(await mot())
  const ok = mau.filter((m) => m.dung)
  const thong = (k) => ({ p50: r1(phanVi(ok.map((m) => m[k]), 50)), p95: r1(phanVi(ok.map((m) => m[k]), 95)), max: r1(Math.max(...ok.map((m) => m[k]))) })
  return { ...t, luot: mau.length, http200: mau.filter((m) => m.status === 200).length, dung_trang: ok.length, ma: [...new Set(mau.map((m) => m.status))], ttfb: thong("ttfb"), tong: thong("tong"), byteTb: Math.round(ok.reduce((a, m) => a + m.byte, 0) / Math.max(1, ok.length)) }
}

const sql = new pg.Client({ connectionString: DB_URL, application_name: "do-nen-hieu-nang" })
await sql.connect()
const q = async (s, v) => (await sql.query(s, v)).rows
const song = await q("select code, real_name from source_registry where real_name is not null and real_name <> ''")
if (!song.length) throw new Error("source_registry không có real_name nào — không che được, dừng")
const coSan = new Set(TEN_NGUON.map((e) => `${e.code}\u0000${e.realName}`))
TEN_NGUON = [...TEN_NGUON, ...song.map((r) => ({ code: r.code, realName: r.real_name })).filter((e) => !coSan.has(`${e.code}\u0000${e.realName}`))]
const cauHinh = Object.fromEntries((await q("select name, setting from pg_settings where name in ('max_connections','shared_preload_libraries','server_version','shared_buffers','work_mem')")).map((r) => [r.name, r.setting]))
if (!String(cauHinh.shared_preload_libraries).includes("pg_stat_statements")) throw new Error("pg_stat_statements chưa nạp (shared_preload_libraries)")
await q("CREATE EXTENSION IF NOT EXISTS pg_stat_statements")
const buildId = existsSync(path.join(APP, ".next/BUILD_ID")) ? readFileSync(path.join(APP, ".next/BUILD_ID"), "utf8").trim() : null
if (!buildId) throw new Error("app/.next/BUILD_ID không có — chạy `cd app && npx next build` trước")

const env = { ...process.env, NODE_ENV: "production" }; delete env.NODE_TEST_CONTEXT
const sv = spawn(path.join(APP, "node_modules/.bin/next"), ["start", "-p", String(CONG)], { cwd: APP, env, stdio: ["ignore", "pipe", "pipe"] })
let svLog = ""; sv.stdout.on("data", (d) => (svLog += d)); sv.stderr.on("data", (d) => (svLog += d))
let ketQua
try {
  await choSan()
  const cookie = await dangNhap(sql)
  // Mốc reset nằm trước lượt làm nóng đầu tiên: cửa sổ pg_stat_statements chỉ gồm lượt đo này.
  const resetLuc = (await q("select pg_stat_statements_reset()::text as luc"))[0].luc
  const batDau = new Date().toISOString()
  const trang = []
  for (const t of TRANG) trang.push(await doTrang(t, cookie))
  const ketThuc = new Date().toISOString()
  const dbid = (await q("select oid from pg_database where datname = current_database()"))[0].oid
  const cot = `left(regexp_replace(query, '\\s+', ' ', 'g'), 220) as cau, calls::int as goi, round(total_exec_time::numeric, 1)::float as tong_ms, round(mean_exec_time::numeric, 2)::float as tb_ms, round(max_exec_time::numeric, 1)::float as max_ms, rows::bigint::text as dong`
  const loc = `dbid = $1 and query !~* '^(begin|commit|rollback|set |show |select pg_stat_statements_reset|create extension)'`
  const cheCau = (rows) => rows.map((r) => ({ ...r, cau: che(r.cau) }))
  const theoTong = cheCau(await q(`select ${cot} from pg_stat_statements where ${loc} order by total_exec_time desc limit 10`, [dbid]))
  const theoTb = cheCau(await q(`select ${cot} from pg_stat_statements where ${loc} and calls >= 3 order by mean_exec_time desc limit 10`, [dbid]))
  const bang = await q(`select relname as bang, pg_size_pretty(pg_total_relation_size(relid)) as co, pg_total_relation_size(relid)::bigint::text as byte,
    n_live_tup::bigint::text as n_live_tup, coalesce(greatest(last_analyze, last_autoanalyze)::text, '') as analyze_gan_nhat,
    (select reltuples::bigint::text from pg_class where oid = relid) as reltuples
    from pg_stat_user_tables where schemaname = 'public' order by pg_total_relation_size(relid) desc limit 15`)
  for (const b of bang) b.bang = che(b.bang)
  const coDb = (await q("select pg_size_pretty(pg_database_size(current_database())) as co"))[0].co
  ketQua = {
    do_luc: { reset_pg_stat_statements: new Date(resetLuc).toISOString(), bat_dau: batDau, ket_thuc: ketThuc }, build_id: buildId, luot_moi_trang: LUOT,
    may: { os: `${os.type()} ${os.release()}`, cpu: os.cpus()[0]?.model, nhan: os.cpus().length, ram_gb: Math.round(os.totalmem() / 2 ** 30), node: process.version, postgres: cauHinh.server_version },
    db: { co: coDb, max_connections: cauHinh.max_connections, shared_buffers: cauHinh.shared_buffers, work_mem: cauHinh.work_mem },
    trang, truy_van_theo_tong: theoTong, truy_van_theo_tb: theoTb, bang,
  }
} finally {
  sv.kill("SIGTERM")
  await sql.end()
}
for (const t of ketQua.trang) console.log(`trang ${t.duong} (${t.cong}): ${t.dung_trang}/${t.luot} dung trang (HTTP 200 + tieu de) · TTFB p50 ${t.ttfb.p50} ms p95 ${t.ttfb.p95} ms · tong p50 ${t.tong.p50} ms p95 ${t.tong.p95} ms`)
console.log(`truy van theo tong: ${ketQua.truy_van_theo_tong.length} · theo trung binh: ${ketQua.truy_van_theo_tb.length} · bang: ${ketQua.bang.length}`)
if (RA) { writeFileSync(RA, JSON.stringify(ketQua, null, 2) + "\n"); console.log(`ghi ${RA}`) }
const loi = ketQua.trang.filter((t) => t.dung_trang < LUOT)
if (loi.length) { console.log(`TRANG KHONG DUNG: ${loi.map((t) => `${t.duong} ${t.ma}`).join(", ")}`); process.exit(1) }
console.log("DO NEN OK")
