// dc-tu-don.ts — hồ sơ phat-bieu-db-do-tren-main AC-7 (E7): test dòng chảy cloud tự dọn lược đồ tạm.
// (1) Gieo lược đồ của pid đã chết (hai tiền tố của test + một tiền tố khác) và của pid còn sống, chạy test → chỉ hai lược
//     đồ pid chết đúng tiền tố bị xoá. (2) Chạy test rồi gửi SIGTERM khi lược đồ của nó đã có → không còn lược đồ nào mang
//     pid ấy. Chiều đỏ: bản chép tạm của test bỏ bước quét → lược đồ pid chết nằm lại. Dọn mọi lược đồ gieo khi xong.
// Test nối DB chung :5433 (localDbUrl) — phép đo chỉ gieo/xoá lược đồ dc_* nó tự tạo.
// Chạy: cd app && node --import tsx scripts/dc-tu-don.ts
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"

const APP = path.join(__dirname, "..")
const TEST = path.join(APP, "tests", "dong-chay-cloud.test.tsx")
const HONG: string[] = []
const dong = (s: string) => console.log(s)

/** pid vừa chết: chạy một tiến trình rỗng tới khi thoát. */
const pidChet = () => spawnSync("true").pid as number
const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const c = new pg.Client({ connectionString: localDbUrl() })
  await c.connect()
  const gieo: string[] = []
  const tam: string[] = []
  let song: ChildProcess | null = null
  const coLuocDo = async (ten: string) => (await c.query(`SELECT 1 FROM pg_namespace WHERE nspname = $1`, [ten])).rowCount === 1
  const tao = async (ten: string) => {
    await c.query(`CREATE SCHEMA "${ten}"`)
    gieo.push(ten)
  }
  const chayTest = (tep: string) =>
    spawnSync(process.execPath, ["--import", "tsx", "--test", tep], { cwd: APP, encoding: "utf8", timeout: 600_000 })
  try {
    // (1) Quét đầu lượt.
    const d = pidChet()
    song = spawn("sleep", ["600"])
    const l = song.pid as number
    for (const ten of [`dc_cloud_${d}`, `dc_local_${d}`, `dc_cloud_${l}`, `dc_khac_${d}`]) await tao(ten)
    const r = chayTest(TEST)
    if (r.status !== 0) HONG.push(`test dòng chảy cloud đỏ (mã ${r.status}): ${(r.stdout + r.stderr).slice(-600)}`)
    const xoa = [!(await coLuocDo(`dc_cloud_${d}`)), !(await coLuocDo(`dc_local_${d}`))].filter(Boolean).length
    const giuSong = await coLuocDo(`dc_cloud_${l}`)
    const giuKhac = await coLuocDo(`dc_khac_${d}`)
    dong(`dc-tu-don quét: xoá ${xoa} lược đồ pid chết, ${giuSong ? "giữ" : "MẤT"} pid sống, ${giuKhac ? "giữ" : "MẤT"} tiền tố khác`)
    if (xoa !== 2 || !giuSong || !giuKhac) HONG.push("bước quét xoá sai tập lược đồ")

    // (2) Bị ngắt giữa lượt.
    const con = spawn(process.execPath, ["--import", "tsx", TEST], { cwd: APP, stdio: "ignore" })
    const p = con.pid as number
    const hetHan = Date.now() + 120_000
    while (!(await coLuocDo(`dc_local_${p}`)) && Date.now() < hetHan) await ngu(200)
    if (!(await coLuocDo(`dc_local_${p}`))) HONG.push(`test (pid ${p}) không tạo lược đồ trong 120 giây — không đo được ngắt`)
    con.kill("SIGTERM")
    await new Promise((r) => con.once("exit", r))
    const { rows } = await c.query(`SELECT nspname FROM pg_namespace WHERE nspname ~ $1`, [`^dc_(local|cloud|noflow|ta|mut|mig)_${p}$`])
    dong(`dc-tu-don ngắt: còn ${rows.length} lược đồ của pid ${p}`)
    if (rows.length !== 0) HONG.push(`ngắt bằng SIGTERM còn lược đồ: ${rows.map((x) => x.nspname).join(", ")}`)
    for (const x of rows) gieo.push(x.nspname)

    // Chiều đỏ: bản test bỏ bước quét.
    const goc = readFileSync(TEST, "utf8")
    const sai = goc.replace("    await donLuocDoChet()\n", "")
    if (sai === goc) throw new Error("chiều đỏ: test không còn «await donLuocDoChet()» — sửa phép đo theo test")
    const f = path.join(APP, "tests", `.dc-sai-${process.pid}.test.tsx`)
    writeFileSync(f, sai)
    tam.push(f)
    const d2 = pidChet()
    for (const ten of [`dc_cloud_${d2}`, `dc_local_${d2}`]) await tao(ten)
    chayTest(f)
    const con2 = [await coLuocDo(`dc_cloud_${d2}`), await coLuocDo(`dc_local_${d2}`)].filter(Boolean).length
    dong(`dc-tu-don đối chứng: còn ${con2} lược đồ pid chết`)
    if (con2 === 0) HONG.push("chiều đỏ không đỏ — phép đo không phân biệt được bước quét")
  } finally {
    for (const f of tam) rmSync(f, { force: true })
    song?.kill()
    for (const ten of gieo) await c.query(`DROP SCHEMA IF EXISTS "${ten}" CASCADE`).catch(() => {})
    await c.end()
  }
  if (HONG.length) {
    console.error(`dc-tu-don: lệch — ${HONG.join("; ")}`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(`dc-tu-don: ${(e as Error).message}`)
  process.exit(1)
})
