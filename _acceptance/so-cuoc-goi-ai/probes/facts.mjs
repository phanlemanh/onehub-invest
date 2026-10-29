// AC-7 (so-cuoc-goi-ai, E8): khối `aiCalls` lấy từ CHÍNH đầu ra `push-ops-facts --kho` (bên ghi thật) trên DB thử đầy đủ
// (`db/db-thu.sh oneinvest_p4_sca_facts`, chép oneinvest; áp 052, mồi `sca-mau-*`, dọn trong finally) — không bao giờ trên
// DB `oneinvest`. Rồi đặt bản tin ấy vào `ops_heartbeat` của một DB thử rỗng và dựng trang ở chế độ máy chủ (VERCEL=1):
// có số → khớp hàm tổng hợp; mốc đo cũ → cảnh báo số cũ; không có khối → «Chỉ đo ở máy thu».
// Chiều đỏ: khối có trường chữ tự do → «CHU TU DO»; đổi tên một khoá ở bên ghi → «LECH KHUON».
import { spawnSync } from "node:child_process"
import { readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { ROOT, SERVER, dbRong, mau, moi, pg, xoaDb, MIGRATION } from "./_db.mjs"
import { tongHopDong } from "../../../pipeline/lib/ai-calls.mjs"

console.log(`root ${ROOT} sha ${spawnSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim()}`)
const DB_THU = "oneinvest_p4_sca_facts"
const DB_RONG = `oneinvest_p4_sca_cloud_${process.pid}`
const GIA = { "sca-mau-dat": { gia_vao: 10000, gia_ra: 40000 }, "qwen3.8-27b-local": { gia_vao: 0, gia_ra: 0 } }
const RA = path.join(os.tmpdir(), `sca-facts-${process.pid}.json`)
let bad = 0
const loi = (m) => { console.log(m); bad = 1 }

/** Mọi giá trị chuỗi của khối phải là ngày ISO, mốc đo, tên việc hay tên model — không chữ tự do. */
function chuTuDo(block) {
  const out = []
  const hop = new Set(["measured_at", "ngay", "viec", "model"])
  const di = (v, p) => {
    if (typeof v === "string") { if (!hop.has(p.split(".").pop().replace(/\[\d+\]$/, ""))) out.push(p) }
    else if (Array.isArray(v)) v.forEach((x, i) => di(x, `${p}[${i}]`))
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) di(x, p ? `${p}.${k}` : k)
  }
  di(block, "")
  return out
}

function dung(env) {
  const r = spawnSync(process.execPath, ["--import", "tsx", path.join(ROOT, "_acceptance/so-cuoc-goi-ai/probes/_render.mts"), "cloud"], {
    cwd: path.join(ROOT, "app"), encoding: "utf8", env: { ...process.env, VERCEL: "1", DATABASE_URL: `${SERVER}/${DB_RONG}`, ...env }, timeout: 120_000,
  })
  if (r.status !== 0) throw new Error(`dựng trang lỗi: ${(r.stderr || r.stdout).split("\n").slice(-4).join(" | ")}`)
  return JSON.parse(r.stdout.trim().split("\n").pop())
}

// 1. DB thử đầy đủ cho bên ghi.
const co = spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost", "-tAc", `select 1 from pg_database where datname='${DB_THU}'`], { encoding: "utf8" })
if (co.stdout.trim() !== "1") {
  const d = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB_THU], { encoding: "utf8", timeout: 900_000 })
  if (d.status !== 0) { console.log(`CA KHONG DO: db-thu.sh loi ${d.stderr.slice(-200)}`); process.exit(2) }
}
const thu = new pg.Client({ connectionString: `${SERVER}/${DB_THU}` })
await thu.connect()
const rong = await dbRong(DB_RONG)
try {
  await thu.query(MIGRATION)
  await thu.query("delete from ai_calls where viec like 'sca-mau-%'")
  const calls = mau()
  await moi(thu, calls)
  const k = spawnSync(process.execPath, [path.join(ROOT, "pipeline/push-ops-facts.mjs"), "--kho", "--ra", RA], {
    cwd: path.join(ROOT, "pipeline"), encoding: "utf8", env: { ...process.env, DATABASE_URL: `${SERVER}/${DB_THU}` }, timeout: 300_000,
  })
  if (!/ops-facts khô: sạch, 0 chỗ chặn/.test(k.stdout)) loi(`SOAT TANG A: ${k.stdout.split("\n").slice(-2).join(" | ")} ${k.stderr.slice(-200)}`)
  else console.log("ok push-ops-facts --kho: soat tang A sach")
  const payload = JSON.parse(readFileSync(RA, "utf8"))
  const block = payload.blocks?.aiCalls
  if (!block || block.error) { loi(`KHOI aiCalls VANG/LOI: ${JSON.stringify(block)}`); throw new Error("dừng") }
  const ky = tongHopDong(calls, GIA)
  const mauKhoi = (block.nhom ?? []).filter((n) => n.viec.startsWith("sca-mau-"))
  if (JSON.stringify(mauKhoi) !== JSON.stringify(ky)) loi(`LECH SO KHOI: ${JSON.stringify(mauKhoi)}`)
  else console.log(`ok khoi aiCalls: ${ky.length} nhom mau khop ham tong hop`)
  const tu = chuTuDo(block)
  if (tu.length) loi(`CHU TU DO: ${tu.slice(0, 3).join(", ")}`)
  else console.log("ok khoi chi co so + ngay/viec/model")
  if (chuTuDo({ ...block, nhom: [{ ...block.nhom[0], prompt: "PROMPT-MAU" }] }).length) console.log("ban chen truong prompt: do CHU TU DO")
  else loi("CA KHONG DO: chen prompt ma khong bat")

  // 2. Máy chủ đọc đúng bản tin ấy qua ops_heartbeat.
  await rong.query("CREATE TABLE ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)")
  const day = async (p) => rong.query("insert into ops_heartbeat (id, payload, pushed_at) values ('primary', $1, now()) on conflict (id) do update set payload = excluded.payload", [JSON.stringify(p)])
  const now = new Date().toISOString()
  const tuoi = { ...payload, pushedAt: now, blocks: { ...payload.blocks, aiCalls: { ...block, measured_at: now } } }
  await day(tuoi)
  const t = dung()
  const mauTrang = t.nhom.filter((n) => n.viec.startsWith("sca-mau-"))
  if (t.state !== "fresh" || JSON.stringify(mauTrang) !== JSON.stringify(ky)) loi(`LECH SO MAY CHU: state ${t.state}`)
  else console.log("ok may chu co so: bang khop ham tong hop")
  const cu = new Date(Date.now() - 2 * 3600e3).toISOString()
  await day({ ...tuoi, blocks: { ...tuoi.blocks, aiCalls: { ...block, measured_at: cu } } })
  const s = dung()
  if (s.state === "stale" && s.html !== t.html) console.log("ok may chu so cu: canh bao so cu")
  else loi(`THIEU CANH BAO SO CU: state ${s.state}`)
  const { aiCalls: _b, ...khac } = tuoi.blocks
  await day({ ...tuoi, blocks: khac })
  const v = dung()
  if (v.html.includes("Chỉ đo ở máy thu")) console.log("ok may chu vang khoi: Chi do o may thu")
  else loi("THIEU CHU Chi do o may thu")
  // Chiều đỏ: bên ghi đổi tên khoá tokenVao → bên đọc ra số lệch.
  await day({ ...tuoi, blocks: { ...tuoi.blocks, aiCalls: { ...block, measured_at: now, nhom: block.nhom.map(({ tokenVao, ...r }) => ({ ...r, token_vao: tokenVao })) } } })
  const d = dung()
  if (JSON.stringify(d.nhom.filter((n) => n.viec.startsWith("sca-mau-"))) !== JSON.stringify(ky)) console.log("ban doi ten khoa tokenVao: do LECH KHUON")
  else loi("CA KHONG DO: doi ten khoa ma so khong doi")
} catch (e) {
  if (e.message !== "dừng") loi(`CA KHONG DO: ${e.message}`)
} finally {
  await thu.query("delete from ai_calls where viec like 'sca-mau-%'").catch(() => {})
  await thu.end()
  await rong.end()
  await xoaDb(DB_RONG)
  rmSync(RA, { force: true })
}
if (!bad) console.log("FACTS OK")
process.exit(bad)
