// migration.mjs — E1 (AC-1): 072 trên DB rỗng riêng có sẵn nhãn và mẫu đời trước. Áp hai lần, băm dòng cũ không đổi, đồng thuận đo bằng
// kết quả view (mỗi trường mới một cặp khớp, một cặp lệch), không bảng nhãn nào trên đường đẩy lên cloud. Đối chứng cùng fixture.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { M054, M072, ROOT, SERVER, kiem, pg } from "./_db.mjs"

const DB = "oneinvest_gcn_nhan_mig"
const TRUONG_MOI = ["subzone", "stack", "floor", "bathrooms", "bedrooms_plus", "multi_unit", "seller_name", "seller_phone"]

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
/** Mọi tệp .mjs nội bộ mà một tệp nạp, kể cả gián tiếp: push-ops-facts đọc số qua các module có SQL riêng. */
function baoDong(goc, da = new Set()) {
  if (da.has(goc) || !existsSync(goc)) return da
  da.add(goc)
  for (const m of readFileSync(goc, "utf8").matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']|import\(\s*["'](\.{1,2}\/[^"']+)["']/g)) {
    baoDong(path.resolve(path.dirname(goc), m[1] ?? m[2]), da)
  }
  return da
}

const bam = async (c) =>
  (await c.query(`SELECT md5(string_agg(x, '|' ORDER BY x)) AS b FROM (
     SELECT concat_ws(',', 'i', item_id, lat, ref_id, split, double_label) AS x FROM eval_label_items
     UNION ALL SELECT concat_ws(',', 'l', item_id, labeler_id, field, value, not_stated) FROM eval_labels) t`)).rows[0].b

async function kiemBan(sql, { sync = null } = {}) {
  const loi = []
  const c = await dbRong()
  try {
    await c.query(M054)
    await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ('cu','S03','p0','h0','dev',true,'s')`)
    await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES (1,'u1','kind','sale'),(1,'u2','kind','sale')`)
    const truoc = await bam(c)
    await c.query(sql)
    await c.query(sql)
    kiem(loi, (await bam(c)) === truoc, "bam dong cu khong doi, ap hai lan khong loi", "loi bam dong cu doi")
    const cot = async (b) => new Set((await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [b])).rows.map((r) => r.column_name))
    kiem(loi, (await cot("eval_labels")).has("basis"), "cot basis", "loi thieu cot basis")
    kiem(loi, (await cot("eval_label_items")).has("stratum"), "stratum", "loi thieu stratum")
    kiem(loi, (await cot("eval_label_reasons")).has("reason"), "bang ly do", "loi thieu bang ly do")
    kiem(loi, (await cot("eval_label_cases")).has("the_nhom_dung"), "bang truong hop", "loi thieu bang truong hop")
    let n = 0
    for (const f of TRUONG_MOI) {
      for (const [ref, v2] of [[`${f}-khop`, "a"], [`${f}-lech`, "b"]]) {
        const { rows } = await c.query(
          `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ('moi','S03',$1,$1,'dev',true,'s','u1') RETURNING item_id`, [ref])
        await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1,'u1',$2,'a','chu_bai'),($1,'u2',$2,$3,'ngu_canh_nhom')`, [rows[0].item_id, f, v2])
      }
    }
    kiem(loi, true, "truong moi 8", "")
    const { rows: view } = await c.query(`SELECT field, cap_du, khop FROM eval_label_agreement WHERE lat = 'moi'`)
    kiem(loi, view.length === 17, "view 17 truong", "loi view thieu truong")
    for (const f of TRUONG_MOI) {
      const r = view.find((x) => x.field === f)
      if (r?.cap_du === 2) n++
      if (r?.khop === 1) n++
    }
    kiem(loi, n === 16, `dong thuan 8 truong moi ${n} assert`, `loi dong thuan truong moi: ${n}/16`)
    let chan = false
    try { await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES (1,'u9','kind','sale','doan')`) } catch { chan = true }
    kiem(loi, chan, "chan can cu la", "loi khong chan can cu la")
  } finally {
    await c.end()
  }
  // Tập bảng thật của đường đẩy: giá trị FILL và CLOUD_ALLOW nạp từ module, không đọc chữ. push-ops-facts không có danh sách bảng nên đọc câu SQL.
  const m = await import(pathToFileURL(sync ?? path.join(ROOT, "pipeline/sync-cloud.mjs")).href)
  const allow = m.CLOUD_ALLOW instanceof Map ? [...m.CLOUD_ALLOW.keys()] : Object.keys(m.CLOUD_ALLOW)
  kiem(loi, m.FILL.length > 0 && allow.length > 0, `doc duoc tap bang that: FILL ${m.FILL.length}, CLOUD_ALLOW ${allow.length}`, "loi khong doc duoc tap bang")
  kiem(loi, ![...m.FILL, ...allow].some((t) => /^eval_label/.test(t)), "khong tren duong day: pipeline/sync-cloud.mjs", "loi bang nhan tren duong day")
  const dong = baoDong(path.join(ROOT, "pipeline/push-ops-facts.mjs"))
  kiem(loi, dong.size > 3, `bao dong push-ops-facts: ${dong.size} tep`, "loi khong doc duoc bao dong")
  const nhac = [...dong].filter((f) => /eval_label/.test(readFileSync(f, "utf8")))
  kiem(loi, nhac.length === 0, "khong tren duong day: pipeline/push-ops-facts.mjs va moi tep no nap", `loi bang nhan tren duong day: ${nhac}`)
  return loi
}

const out = console.log
const loi = await kiemBan(M072)
// Đối chứng cùng fixture: bản sync có bảng trường hợp, bản view thiếu một trường phải bị bắt đúng thông điệp.
console.log = () => {}
const GOC_SYNC = readFileSync(path.join(ROOT, "pipeline/sync-cloud.mjs"), "utf8")
const BAN_SYNC = path.join(ROOT, "pipeline", `.gcn-sync-dot-${process.pid}.mjs`)
const DOT_SYNC = GOC_SYNC.replace("export const FILL = [", 'export const FILL = [\n  "eval_label_cases",')
writeFileSync(BAN_SYNC, DOT_SYNC)
let dSync = []
try {
  dSync = DOT_SYNC === GOC_SYNC ? [] : await kiemBan(M072, { sync: BAN_SYNC })
} finally {
  rmSync(BAN_SYNC, { force: true })
}
const banThieu = M072.replace(", ('seller_phone')\n", "\n")
const dView = banThieu === M072 ? [] : await kiemBan(banThieu)
console.log = out
kiem(loi, dSync.includes("loi bang nhan tren duong day"), "doi chung: sync co bang nhan bi bat", "DOI CHUNG KHONG DO: sync")
// Đối chứng bao đóng: module nạp gián tiếp có câu đọc bảng nhãn, hàm phải đi tới nó.
const TAM = mkdtempSync(path.join(tmpdir(), "gcn-bao-dong-"))
writeFileSync(path.join(TAM, "a.mjs"), 'import { b } from "./b.mjs"\nb()\n')
writeFileSync(path.join(TAM, "b.mjs"), 'import { c } from "./c.mjs"\nexport const b = c\n')
writeFileSync(path.join(TAM, "c.mjs"), 'export const c = () => "SELECT * FROM eval_label_cases"\n')
const conDoDong = [...baoDong(path.join(TAM, "a.mjs"))].filter((f) => /eval_label/.test(readFileSync(f, "utf8")))
rmSync(TAM, { recursive: true, force: true })
kiem(loi, conDoDong.length === 1, "doi chung: bao dong gian tiep bi bat", "DOI CHUNG KHONG DO: bao dong")
kiem(loi, dView.includes("loi view thieu truong"), "doi chung: view thieu truong bi bat", "DOI CHUNG KHONG DO: view")
const a = new pg.Client({ connectionString: `${SERVER}/postgres` })
await a.connect()
await a.query(`DROP DATABASE IF EXISTS ${DB}`)
await a.end()
console.log(loi.length ? `MIGRATION FAIL (${loi.length})` : "MIGRATION OK")
process.exit(loi.length ? 1 : 0)
