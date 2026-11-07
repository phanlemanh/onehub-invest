// migration.mjs — truong-nhan-s03-081 E1 (AC-1): 081 trên DB rỗng riêng có sẵn nhãn 17 trường của hai người.
// Danh sách trường và căn cứ để chèn lấy từ hằng của app (LABEL_FIELDS_NHOM, BASIS) — không gõ trong đầu dò.
// Chạy: cd app && node --import tsx ../_acceptance/truong-nhan-s03-081/probes/migration.mjs  (DB rỗng oneinvest_tn081_mig, xoá cuối lượt)
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const { LABEL_FIELDS_NHOM, BASIS } = await import(path.join(ROOT, "app/src/lib/labels-normalize.ts"))
const SERVER = process.env.TN081_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433"
const DB = "oneinvest_tn081_mig"
const doc = (f) => readFileSync(path.join(ROOT, "db/migrations", f), "utf8")
// ref_lookup, ref_field_lookup: chỉ hai câu CREATE TABLE của 043 (phần còn lại của 043 đụng sale_offers).
const M043_BANG = [...doc("043_ref_vocabulary.sql").matchAll(/CREATE TABLE IF NOT EXISTS ref_[a-z_]+ \([\s\S]*?\n\);/g)].map((m) => m[0]).join("\n")
const NEN = [M043_BANG, ...["054_labels.sql", "072_labels_nhom.sql", "073_labels_nhom_sua.sql", "075_labels_can_cu_anh.sql", "076_labels_ghep.sql"].map(doc)]
const M081 = doc("081_labels_truong_moi.sql")
const CU = ["listing_intent", "kind", "property_type", "project", "building", "price_min_vnd", "price_max_vnd", "area_m2", "bedrooms",
  "subzone", "stack", "floor", "bathrooms", "bedrooms_plus", "multi_unit", "seller_name", "seller_phone"]
const MOI = LABEL_FIELDS_NHOM.filter((f) => !CU.includes(f))

async function dbRong() {
  const a = new pg.Client({ connectionString: `${SERVER}/postgres` })
  await a.connect()
  await a.query(`DROP DATABASE IF EXISTS ${DB}`)
  await a.query(`CREATE DATABASE ${DB}`)
  await a.end()
  const c = new pg.Client({ connectionString: `${SERVER}/${DB}` })
  await c.connect()
  for (const s of NEN) await c.query(s)
  return c
}
async function xoaDb() {
  const a = new pg.Client({ connectionString: `${SERVER}/postgres` })
  await a.connect()
  await a.query(`DROP DATABASE IF EXISTS ${DB}`)
  await a.end()
}
const bam = async (c) =>
  (await c.query(`SELECT md5(string_agg(x, '|' ORDER BY x)) AS b FROM (
     SELECT concat_ws(',', 'i', item_id, lat, ref_id, split, double_label) AS x FROM eval_label_items
     UNION ALL SELECT concat_ws(',', 'l', item_id, labeler_id, field, value, not_stated, basis) FROM eval_labels) t`)).rows[0].b
const chen = async (c, sql, args) => { try { await c.query(sql, args); return true } catch { return false } }

/** Chạy ma trận AC-1 trên một bản 081; trả danh sách lỗi (thông điệp ghim). */
async function kiemBan(sql) {
  const loi = []
  const ok = (dieu, msgOk, msgLoi) => { if (dieu) console.log(`ok ${msgOk}`); else loi.push(msgLoi) }
  const c = await dbRong()
  try {
    const { rows } = await c.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ('nhom','S03','p1','h1','dev',true,'s','u1') RETURNING item_id`)
    const id = rows[0].item_id
    for (const f of CU) await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1,'u1',$2,'a','chu_bai'),($1,'u2',$2,'a','chu_bai')`, [id, f])
    const truoc = await bam(c)
    const viewTruoc = (await c.query(`SELECT field, cap_du, khop, ti_le FROM eval_label_agreement WHERE lat = 'nhom' ORDER BY field`)).rows
    await c.query(sql)
    await c.query(sql)
    ok(true, "ap hai lan", "")
    ok((await bam(c)) === truoc, "dong cu nguyen ven", "DONG CU BI DOI")
    // Mọi trường của app qua CHECK — đo bằng chính hằng app sẽ gửi.
    const { rows: r2 } = await c.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ('nhom','S03','p2','h2','dev',true,'s','u1') RETURNING item_id`)
    let quaTruong = 0
    for (const f of LABEL_FIELDS_NHOM) if (await chen(c, `INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1,'u1',$2,'a','chu_bai'),($1,'u2',$2,'a','chu_bai')`, [r2[0].item_id, f])) quaTruong++
    ok(quaTruong === LABEL_FIELDS_NHOM.length, `nhan ${quaTruong} truong cua app`, `TRUONG APP KHONG QUA CHECK 081: ${quaTruong}/${LABEL_FIELDS_NHOM.length}`)
    // Căn cứ thử trên một thẻ gắn một người riêng: không chạm cặp đồng thuận của p1, p2.
    const { rows: r3 } = await c.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ('nhom','S03','p3','h3','dev',false,'s','u1') RETURNING item_id`)
    let quaCanCu = 0
    for (const b of BASIS) if (await chen(c, `INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1,$2,'kind','sale',$3)`, [r3[0].item_id, `cc-${b}`, b])) quaCanCu++
    ok(quaCanCu === BASIS.length, `nhan ${quaCanCu} can cu cua app`, `CAN CU DANH MUC BI TU CHOI: ${quaCanCu}/${BASIS.length}`)
    ok(!(await chen(c, `INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES ($1,'u9','truong_la','x')`, [id])), "tu choi truong la", "KHONG CHAN TRUONG LA")
    ok(!(await chen(c, `INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1,'u9','kind','sale','doan')`, [id])), "tu choi can cu la", "KHONG CHAN CAN CU LA")
    const viewSau = (await c.query(`SELECT field, cap_du, khop, ti_le FROM eval_label_agreement WHERE lat = 'nhom' ORDER BY field`)).rows
    const cuSau = viewSau.filter((r) => CU.includes(r.field))
    // Thẻ p2 thêm một cặp khớp cho mọi trường; cũ: cặp và khớp tăng đúng 1, không trường cũ nào mất.
    const doiDung = cuSau.length === viewTruoc.length && viewTruoc.every((t) => {
      const s = cuSau.find((x) => x.field === t.field)
      return s && s.cap_du === t.cap_du + 1 && s.khop === t.khop + 1
    })
    ok(doiDung, "dong thuan 17 truong khong doi (chi them cap cua the moi)", "DONG THUAN TRUONG CU DOI")
    const moiSau = viewSau.filter((r) => MOI.includes(r.field))
    ok(moiSau.length === MOI.length && moiSau.every((r) => r.cap_du === 1 && r.khop === 1), `dong thuan co ${MOI.length} truong moi`, `VIEW THIEU TRUONG MOI: ${moiSau.length}/${MOI.length}`)
    const tra = (await c.query(`SELECT lookup_name, count(*)::int n FROM ref_lookup GROUP BY 1 ORDER BY 1`)).rows
    ok(tra.length === 5 && tra.reduce((n, r) => n + r.n, 0) === 29, "ref_lookup nam truc 29 gia tri", `REF_LOOKUP THIEU: ${JSON.stringify(tra)}`)
  } finally {
    await c.end()
  }
  return loi
}

let thoat = 0
try {
  const loi = await kiemBan(M081)
  if (loi.length) { for (const l of loi) console.log(l); thoat = 1 }
  // Chiều đỏ trên cùng fixture: ba bản 081 hỏng, mỗi bản phải ra đúng thông điệp ghim.
  const DOT = [
    ["'direction_faces', 'view', 'availability_date'", "'direction_face', 'view', 'availability_date'", "TRUONG APP KHONG QUA CHECK 081"],
    ["'anh', 'danh_muc_cdt'));", "'anh'));", "CAN CU DANH MUC BI TU CHOI"],
    ["('price_basis'), ('rent_includes')\n)", "('price_basis')\n)", "VIEW THIEU TRUONG MOI"],
  ]
  for (const [tu, thanh, ghim] of DOT) {
    if (!M081.includes(tu)) { console.log(`DOT KHONG AP DUOC: ${ghim}`); thoat = 1; continue }
    const loiDot = await kiemBan(M081.replace(tu, thanh))
    if (loiDot.some((l) => l.startsWith(ghim))) console.log(`ok doi chung do: ${ghim}`)
    else { console.log(`DOI CHUNG KHONG DO: ${ghim} — ${JSON.stringify(loiDot)}`); thoat = 1 }
  }
} finally {
  await xoaDb()
}
console.log(thoat === 0 ? "MIGRATION OK" : "MIGRATION LOI")
process.exit(thoat)
