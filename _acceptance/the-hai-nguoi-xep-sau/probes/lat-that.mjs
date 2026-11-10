// AC-1 trên lát thật s03-theo-nhom, chỉ đọc (giao dịch READ ONLY): với từng người đã gắn và một người mới, từng nhóm,
// tinKe thật không được trả tin hai người chưa ai gắn khi nhóm còn tin đơn người đó gắn được. Đối chứng dương: thứ tự cũ
// (chỉ theo item_id sau khoá cặp-trước, chép trong đầu dò) kẹt ít nhất một nhóm. Số tin đơn với tới tính trên thứ tự chép
// tay, không qua tinKe, nên chỉ in để đọc, không là điều kiện đạt. Không ghi gì; không in chữ bài hay định danh.
import { createRequire } from "node:module"

const pg = createRequire(new URL("../../../app/package.json", import.meta.url))("pg")

const LAT = process.env.THN_LAT ?? "s03-theo-nhom"
const url = process.env.THN_DB_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const c = new pg.Client({ connectionString: url, options: "-c default_transaction_read_only=on" })
await c.connect()
const { tinKe } = await import("../../../app/src/lib/labels-queries.ts")
let loi = 0
try {
  await c.query("BEGIN READ ONLY")
  const nhom = (await c.query(`SELECT DISTINCT stratum FROM eval_label_items WHERE lat = $1 AND stratum IS NOT NULL ORDER BY 1`, [LAT])).rows.map((r) => r.stratum)
  const nguoi = (await c.query(`SELECT DISTINCT l.labeler_id FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1`, [LAT])).rows.map((r) => r.labeler_id)
  const MOI = "thn-nguoi-moi-khong-ton-tai"
  // Tin người u còn gắn được trong nhóm: chưa do u gắn, còn chỗ, không phải dòng trùng cụm.
  const conDuoc = `
    SELECT i.item_id::int, i.double_label, coalesce(n.so, 0)::int AS so
    FROM eval_label_items i
    LEFT JOIN LATERAL (SELECT count(DISTINCT labeler_id) AS so, bool_or(labeler_id = $1) AS cua_toi FROM eval_labels WHERE item_id = i.item_id) n ON true
    WHERE i.lat = $2 AND i.stratum = $3 AND NOT coalesce(n.cua_toi, false)
      AND coalesce(n.so, 0) < CASE WHEN i.double_label THEN 2 ELSE 1 END AND (i.ghep->>'trung_voi') IS NULL`
  let ketMoi = 0, ketCu = 0, donMoi = 0, donCu = 0
  for (const u of [...nguoi, MOI]) {
    for (const g of nhom) {
      const rows = (await c.query(conDuoc + " ORDER BY (i.double_label AND coalesce(n.so, 0) = 1) DESC, i.item_id", [u, LAT, g])).rows
      const conDon = rows.some((r) => !r.double_label)
      const ke = await tinKe(u, LAT, c, g)
      const r = ke ? rows.find((x) => x.item_id === ke.itemId) : undefined
      if (ke && !r) { console.log(`TIN KE NGOAI TAP CON GAN DUOC nhom ${g}`); loi = 1 }
      if (r && r.double_label && r.so === 0 && conDon) ketMoi++
      if (rows[0] && rows[0].double_label && rows[0].so === 0 && conDon) ketCu++
      if (u === MOI) {
        donMoi += rows.filter((x) => !x.double_label).length
        const dau = rows.findIndex((x) => x.double_label && x.so === 0)
        donCu += (dau < 0 ? rows : rows.slice(0, dau)).filter((x) => !x.double_label).length
      }
    }
  }
  console.log(`lat ${LAT}: ${nhom.length} nhom, ${nguoi.length} nguoi da gan + 1 nguoi moi`)
  console.log(`nhom ket (tin hai nguoi chua ai gan chan tin don): moi ${ketMoi}, cu ${ketCu}`)
  console.log(`chi de doc (thu tu chep tay, khong qua tinKe): tin don nguoi moi voi toi truoc khi cham tin hai nguoi: moi ${donMoi}, cu ${donCu}`)
  if (ketMoi !== 0) { console.log("THE HAI NGUOI CON CHAN NHOM"); loi = 1 }
  if (ketCu === 0) { console.log("DOI CHUNG KHONG DO: thu tu cu khong ket nhom nao — phep do khong phan biet"); loi = 1 }
  await c.query("ROLLBACK")
} finally {
  await c.end()
}
if (!loi) console.log("LAT-THAT OK")
process.exit(loi)
