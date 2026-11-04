// do-cu.mjs — E12 (AC-9): cùng fixture nhãn chín trường, trước và sau khi thêm trường mới: eval-classify, label-agreement, phút
// công không đổi; lát đời trước vẫn mở biểu mẫu chín trường. DB thử đã áp 072 thật.
import { spawnSync } from "node:child_process"
import path from "node:path"

import { ROOT, URL_THU, kiem, noiDbThu } from "./_db.mjs"

const LAT = "gcn-docu"
const CHIN = { listing_intent: "offer", kind: "sale", property_type: "apartment", project: "ocean park", building: "s1", price_min_vnd: "4000000000", price_max_vnd: "4000000000", area_m2: "60", bedrooms: "2" }
const MOI = { subzone: "rainbow", stack: "12", floor: "18", bathrooms: "1", bedrooms_plus: "no", multi_unit: "no", seller_name: "lan", seller_phone: "+84912345678" }
const c = await noiDbThu()
const loi = []
const k = (d, ok, fail) => kiem(loi, d, ok, fail)
const env = { ...process.env, DATABASE_URL: URL_THU }
const chay = (tep, ...a) => spawnSync("node", [path.join(ROOT, "pipeline", tep), ...a], { cwd: ROOT, env, encoding: "utf8" })
// Bỏ dòng mang mã lượt ngẫu nhiên nếu có; phần còn lại phải bằng nhau từng chữ.
const cham = () => chay("eval-classify.mjs", "--lat", LAT, "--split", "test", "--dry").stdout.split("\n").filter((l) => /\|/.test(l) || /\d+ ô ·/.test(l)).join("\n")
const dongThuan = () => JSON.parse(chay("label-agreement.mjs", "--lat", LAT, "--json").stdout)
const don = async () => {
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'gcn-docu-%'`)
}
try {
  await don()
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hcm__zalo__gcndocu', 'hcm', 'zalo', '{}'::jsonb) ON CONFLICT DO NOTHING`)
  const items = []
  for (let i = 1; i <= 12; i++) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text) VALUES ($1, 'hcm__zalo__gcndocu', 'GCN đo cũ', $2)`, [`gcn-docu-${i}`, `Bán căn 2PN 60m2 giá 4 tỷ tin ${i}`])
    const { rows } = await c.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ($1, 'S03', $2, $3, 'test', true, 's') RETURNING item_id`,
      [LAT, `gcn-docu-${i}`, `h${i}`])
    items.push(rows[0].item_id)
  }
  const MOC = "2026-11-01 08:00:00+07"
  const ghi = async (bo, nguoi, phut) => {
    for (const [j, it] of items.entries()) {
      for (const [f, v] of Object.entries(bo)) {
        await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, labeled_at) VALUES ($1, $2, $3, $4, false, $5::timestamptz + make_interval(mins => $6))`,
          [it, nguoi, f, v, MOC, phut + j])
      }
    }
  }
  await ghi(CHIN, "usr_gcndocu_a", 0)
  await ghi(CHIN, "usr_gcndocu_b", 0)
  const cham1 = cham()
  const dt1 = dongThuan()
  k(/\|/.test(cham1), "doi chung duong: eval-classify co o", "loi eval-classify khong in o")
  await ghi(MOI, "usr_gcndocu_a", 0)
  await ghi(MOI, "usr_gcndocu_b", 0)
  const cham2 = cham()
  const dt2 = dongThuan()
  k(cham1 === cham2, "cham chin truong khong doi", `loi cham doi:\n${cham1}\n---\n${cham2}`)
  const chin = (d) => JSON.stringify(d.truong.filter((t) => t.field in CHIN))
  k(chin(dt1) === chin(dt2), "dong thuan cu khong doi", "loi dong thuan cu doi")
  k(dt2.truong.filter((t) => t.field in MOI && t.cap_du === 12).length === 8, "dong thuan co them 8 truong moi", "loi thieu truong moi trong dong thuan")
  k(dt1.phut_cong.usr_gcndocu_a > 0 && JSON.stringify(dt1.phut_cong) === JSON.stringify(dt2.phut_cong), "phut cong", `loi phut cong ${JSON.stringify(dt1.phut_cong)} ${JSON.stringify(dt2.phut_cong)}`)
  await c.query(`DELETE FROM eval_labels WHERE item_id = $1`, [items[0]])
  const man = spawnSync("node", ["--import", "tsx", path.join(ROOT, "_acceptance/gan-nhan-theo-nhom-s03/probes/do-cu-man.tsx"), LAT], { cwd: path.join(ROOT, "app"), env, encoding: "utf8" })
  const m = JSON.parse(man.stdout.trim().split("\n").pop() || "{}")
  k(m.chin && m.khongNhom && m.cauCu, "lat cu mo bieu mau dung", `loi lat cu: ${man.stdout} ${man.stderr.slice(0, 300)}`)
} finally {
  await don()
  await c.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id = 'hcm__zalo__gcndocu'`)
  await c.end()
}
console.log(loi.length ? `DO-CU FAIL (${loi.length})` : "DO-CU OK")
process.exit(loi.length ? 1 : 0)
