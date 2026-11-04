// _db.mjs — hàm chung của đầu dò gan-nhan-theo-nhom-s03. Mọi phép đo chạy trên DB thử, không chạy migration chưa gộp trên
// `oneinvest`: `oneinvest_gcn_nhan` dựng bằng `bash db/db-thu.sh oneinvest_gcn_nhan --neu-chua-co`; phép đo migration dùng DB rỗng riêng.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
export const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
export const SERVER = process.env.GCN_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433"
export const DB_THU = process.env.GCN_DB ?? "oneinvest_gcn_nhan"
export const URL_THU = `${SERVER}/${DB_THU}`
export const M054 = readFileSync(path.join(ROOT, "db/migrations/054_labels.sql"), "utf8")
export const M072 = readFileSync(path.join(ROOT, "db/migrations/072_labels_nhom.sql"), "utf8")
export const M073 = readFileSync(path.join(ROOT, "db/migrations/073_labels_nhom_sua.sql"), "utf8")
if (!/^oneinvest_gcn_nhan[a-z0-9_]*$/.test(DB_THU)) throw new Error(`tên DB thử sai: ${DB_THU}`)

/** Client nối DB thử, đã áp 054, 072, 073 (idempotent). */
export async function noiDbThu() {
  const c = new pg.Client({ connectionString: URL_THU })
  await c.connect()
  await c.query(M054)
  await c.query(M072)
  await c.query(M073)
  return c
}

export function kiem(loi, dieu, okMsg, failMsg) {
  if (dieu) console.log(`ok ${okMsg}`)
  else {
    console.log(failMsg)
    loi.push(failMsg)
  }
}
