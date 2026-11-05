// _db.mjs — hàm chung của đầu dò ghep-anh-tren-the-gan-nhan. Mọi phép đo ghi chỉ chạy trên DB thử; từ chối DB khác.
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
export const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
export const SERVER = "postgres://oneinvest:oneinvest@localhost:5433"
export const DB_THU = process.env.GHEP_DB ?? "oneinvest_ghep_nhan"
if (DB_THU !== "oneinvest_ghep_nhan") { console.log(`tu choi: DB dich ${DB_THU}`); process.exit(3) }
export const URL_THU = `${SERVER}/${DB_THU}`
export const M076 = fs.readFileSync(path.join(ROOT, "db/migrations/076_labels_ghep.sql"), "utf8")
export const THU_MUC = path.join(ROOT, ".acceptance-runs/ghep-anh-tren-the-gan-nhan")
export const SNAP = "hanoi__s03__ghepthu"
export const SNAP_GOC = path.join(THU_MUC, "snapshots")
export const gocKho = () => path.dirname(execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: ROOT, encoding: "utf8" }).trim())

export async function noiDbThu() {
  const r = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB_THU, "--neu-chua-co"], { encoding: "utf8" })
  if (r.status !== 0) { console.log(`FAIL loi dung DB thu: ${r.stderr.slice(0, 200)}`); process.exit(1) }
  const c = new pg.Client({ connectionString: URL_THU })
  await c.connect()
  const { rows } = await c.query("SELECT current_database() AS d")
  if (rows[0].d !== DB_THU) { console.log(`FAIL sai DB ${rows[0].d}`); process.exit(1) }
  return c
}

export const banGhiKiem = () => {
  const loi = []
  return { loi, kiem: (dieu, ok, sai) => { if (dieu) console.log(`ok ${ok}`); else { console.log(`FAIL ${sai ?? ok}`); loi.push(sai ?? ok) } } }
}
