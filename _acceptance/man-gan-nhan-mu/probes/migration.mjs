// migration.mjs — E1 (AC-1): 054_labels.sql trên DB rỗng riêng: hai bảng + view đủ cột, áp hai lần không lỗi và không đổi
// số dòng, ba khoá chặn đúng ca vi phạm, hai bảng không có trong đường lên cloud. Đối chứng: bản chép đột biến bỏ khoá
// (item_id, labeler_id, field) phải bị bắt với «KHONG CHAN TRUNG NHAN».
import { readFileSync } from "node:fs"
import path from "node:path"

import { MIGRATION, ROOT, SERVER, kiem, pg } from "./_db.mjs"

const DB = "oneinvest_p4_mgn_mig"
const COT = {
  eval_label_items: ["item_id", "lat", "source_code", "ref_id", "text_hash", "split", "double_label", "seed", "sampled_at"],
  eval_labels: ["id", "item_id", "labeler_id", "field", "value", "not_stated", "labeled_at"],
  eval_label_agreement: ["lat", "field", "cap_du", "khop", "ti_le"],
}

async function dbRong() {
  const a = new pg.Client({ connectionString: `${SERVER}/postgres` })
  await a.connect()
  await a.query(`DROP DATABASE IF EXISTS ${DB}`)
  await a.query(`CREATE DATABASE ${DB}`)
  await a.end()
  const c = new pg.Client({ connectionString: `${SERVER}/${DB}` })
  await c.connect()
  return c
}

/** Chạy bộ kiểm trên một bản migration; trả danh sách chuỗi lỗi ghim. */
async function kiemBan(sql, im = false) {
  const loi = []
  const log = im ? () => {} : console.log
  const k = (d, ok, fail) => (d ? log(`ok ${ok}`) : (log(fail), loi.push(fail)))
  const c = await dbRong()
  try {
    await c.query(sql)
    for (const [bang, cot] of Object.entries(COT)) {
      const { rows } = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [bang])
      const co = new Set(rows.map((r) => r.column_name))
      const thieu = cot.filter((x) => !co.has(x))
      k(thieu.length === 0, `${bang === "eval_label_agreement" ? "view" : "bang"} ${bang}: ${cot.length} cot`, `THIEU COT ${bang}: ${thieu.join(",")}`)
    }
    await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ('mgn-mig','S03','p1','h1','dev',true,'s')`)
    await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES (1,'u1','kind','sale')`)
    const dem = async () => (await c.query(`SELECT (SELECT count(*) FROM eval_label_items) + (SELECT count(*) FROM eval_labels) AS n`)).rows[0].n
    const truoc = await dem()
    let loiLan2 = null
    try { await c.query(sql) } catch (e) { loiLan2 = e.message }
    k(loiLan2 === null && (await dem()) === truoc, "ap lan hai: khong loi, so dong khong doi", `AP LAN HAI HONG: ${loiLan2 ?? "so dong doi"}`)
    const CA = [
      ["trung (lat,text_hash)", `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, seed) VALUES ('mgn-mig','S03','p2','h1','dev','s')`, "KHONG CHAN TRUNG NOI DUNG"],
      ["trung (item_id,labeler_id,field)", `INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES (1,'u1','kind','rent_lt')`, "KHONG CHAN TRUNG NHAN"],
      ["split la", `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, seed) VALUES ('mgn-mig','S03','p3','h3','x','s')`, "KHONG CHAN SPLIT LA"],
    ]
    for (const [ten, ins, ghim] of CA) {
      let chan = false
      try { await c.query(ins) } catch { chan = true }
      k(chan, `chan ${ten}`, ghim)
    }
  } finally {
    await c.end()
  }
  return loi
}

const loi = await kiemBan(MIGRATION)
for (const tep of ["pipeline/sync-cloud.mjs", "pipeline/push-ops-facts.mjs"]) {
  const co = /eval_label/.test(readFileSync(path.join(ROOT, tep), "utf8"))
  kiem(loi, !co, `khong len cloud: ${tep} khong nhac eval_label`, `LEN CLOUD: ${tep} nhac eval_label`)
}
// Đối chứng: bản đột biến bỏ khoá (item_id, labeler_id, field) phải bị bắt.
const dotBien = MIGRATION.replace("  UNIQUE (item_id, labeler_id, field),\n", "")
if (dotBien === MIGRATION) loi.push("DOI CHUNG KHONG DUNG DUOC (khong tim thay khoa de bo)")
const loiDot = await kiemBan(dotBien, true)
kiem(loi, loiDot.includes("KHONG CHAN TRUNG NHAN"), "doi chung: ban bo khoa bi bat 'KHONG CHAN TRUNG NHAN'", "DOI CHUNG KHONG DO: ban bo khoa khong bi bat")
const a = new pg.Client({ connectionString: `${SERVER}/postgres` })
await a.connect()
await a.query(`DROP DATABASE IF EXISTS ${DB}`)
await a.end()
console.log(loi.length ? `MIGRATION FAIL (${loi.length})` : "MIGRATION OK")
process.exit(loi.length ? 1 : 0)
