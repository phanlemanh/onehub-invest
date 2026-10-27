// AC-1: đỉnh kết nối RIÊNG của một lượt test app ≤ 40 và của `cd pipeline && npm test`; suy 2 × app + pipeline + 10 ≤ 100.
// Đỉnh riêng = số kết nối mang application_name của chính lượt (PGAPPNAME đặt cho tiến trình con, node-postgres nhận) — không
// phụ thuộc phiên khác hay lệnh chạy song song. KHÔNG chạy song song thật (đẩy DB dùng chung tới trần là gây lỗi cho phiên
// khác). Lượt app phải 0 dòng thử lại lỗi DB tạm.
import { execFileSync, spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
console.log(`root ${ROOT} sha ${execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()}`)
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
let bad = 0
const pkg = JSON.parse(readFileSync(path.join(ROOT, "app/package.json"), "utf8"))
if (/--test-concurrency=8\b/.test(pkg.scripts.test)) console.log("script test co --test-concurrency=8")
else { console.log(`THIEU CONCURRENCY: ${pkg.scripts.test}`); bad = 1 }
const c = new pg.Client({ connectionString: URL, application_name: "tn-dinh-ket-noi" }); await c.connect()
const dem = async (ten) => (await c.query("select count(*)::int n from pg_stat_activity where application_name = $1", [ten])).rows[0].n
const env = { ...process.env }; delete env.NODE_TEST_CONTEXT
async function luot(cwd) {
  const ten = `tn-dinh-${process.pid}-${cwd}`
  let dinh = 0, dung = false
  const lay = (async () => { while (!dung) { dinh = Math.max(dinh, await dem(ten)); await new Promise((r) => setTimeout(r, 100)) } })()
  const kq = await new Promise((ok) => {
    const p = spawn("npm", ["test"], { cwd: path.join(ROOT, cwd), env: { ...env, PGAPPNAME: ten }, stdio: ["ignore", "pipe", "pipe"] })
    let out = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d))
    p.on("close", () => ok({ out, tests: +(out.match(/^ℹ tests (\d+)/m)?.[1] ?? -1), fail: +(out.match(/^ℹ fail (\d+)/m)?.[1] ?? -1) }))
  })
  dung = true; await lay
  const thuLai = (kq.out.match(/# (lỗi DB tạm thời|bên ghi gặp lỗi DB tạm thời)/g) ?? []).length
  return { ...kq, rieng: dinh, thuLai }
}
const app = await luot("app")
console.log(`mot luot app: dinh rieng ${app.rieng} ket noi, tests ${app.tests} fail ${app.fail}, thu lai ${app.thuLai}`)
if (app.rieng < 5) { console.log(`DO KHONG BAT (dinh rieng ${app.rieng} — PGAPPNAME khong toi tien trinh test?)`); bad = 1 }
if (app.rieng > 40) { console.log("VUOT DINH (app > 40)"); bad = 1 }
if (app.fail !== 0 || app.tests < 1) { console.log("LUOT APP DO"); bad = 1 }
if (app.thuLai !== 0) { console.log(`THU LAI TRONG LUOT DON (${app.thuLai})`); bad = 1 }
const pl = await luot("pipeline")
console.log(`mot luot pipeline: dinh rieng ${pl.rieng} ket noi, tests ${pl.tests} fail ${pl.fail}`)
if (pl.fail !== 0 || pl.tests < 1) { console.log("LUOT PIPELINE DO"); bad = 1 }
const tong = 2 * app.rieng + pl.rieng + 10
console.log(`suy hai luot app + pipeline + nen 10: ${tong} / 100`)
if (tong > 100) { console.log("VUOT DINH (suy song song > 100)"); bad = 1 }
await c.end()
if (!bad) console.log("DINH KET NOI OK")
process.exit(bad)
