// _db.mjs — hàm dùng chung của đầu dò man-gan-nhan-mu. Mọi phép đo chạy trên DB thử (không bao giờ `oneinvest` — LUAT đợt:
// migration chưa gộp không áp lên DB dùng chung): `oneinvest_p4_mgn` = bản sao oneinvest dựng bằng `bash db/db-thu.sh
// oneinvest_p4_mgn` (cần stg_zalo_posts, users…); phép đo migration dựng DB rỗng riêng. Dữ liệu thử mang tiền tố `mgn-`
// và bị xoá sau khi đo.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
export const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
export const SERVER = process.env.MGN_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433"
export const DB_THU = process.env.MGN_DB ?? "oneinvest_p4_mgn"
export const URL_THU = `${SERVER}/${DB_THU}`
export const MIGRATION_PATH = path.join(ROOT, "db/migrations/054_labels.sql")
export const MIGRATION = readFileSync(MIGRATION_PATH, "utf8")

if (!/^oneinvest_p4_mgn[a-z0-9_]*$/.test(DB_THU)) throw new Error(`tên DB thử sai: ${DB_THU} — không chạy trên DB dùng chung`)

/** Client nối DB thử, đã áp 054 (idempotent). */
export async function noiDbThu() {
  const c = new pg.Client({ connectionString: URL_THU })
  await c.connect()
  await c.query(MIGRATION)
  return c
}

/** Snapshot giả cho post thử: nguồn thật (`zalo`) và nguồn thử (`zalo-mock`, `example`). */
export async function datSnapshot(c) {
  for (const [id, src] of [["hanoi__zalo__mgnthu", "zalo"], ["hanoi__zalo-mock__mgnthu", "zalo-mock"], ["hanoi__example__mgnthu", "example"]]) {
    await c.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', $2, '{}'::jsonb) ON CONFLICT DO NOTHING`,
      [id, src])
  }
}

/** Xoá mọi dữ liệu thử `mgn-` (nhãn, tin của lát thử, post thử, snapshot thử). */
export async function donThu(c) {
  await c.query(`DELETE FROM eval_label_items WHERE lat LIKE 'mgn-%'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'mgn-%'`)
  await c.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE '%\\_\\_mgnthu'`)
}

/** In một dòng kết quả và ghi lỗi (chuỗi ghim) vào mảng. */
export function kiem(loi, dieu, okMsg, failMsg) {
  if (dieu) console.log(`ok ${okMsg}`)
  else {
    console.log(failMsg)
    loi.push(failMsg)
  }
}
