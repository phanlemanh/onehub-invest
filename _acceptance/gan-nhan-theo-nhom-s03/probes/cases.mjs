// cases.mjs — E11 (AC-8): lệnh thật `pipeline/label-cases.mjs` trên DB thử: đủ bốn loại nội dung, không định danh người gắn,
// chạy lại y nguyên, lát không có mẫu thoát khác 0.
import { spawnSync } from "node:child_process"
import path from "node:path"

import { ROOT, URL_THU, kiem, noiDbThu } from "./_db.mjs"

const LAT = "gcn-cases"
const c = await noiDbThu()
const loi = []
const k = (d, ok, fail) => kiem(loi, d, ok, fail)
const chay = (...a) => spawnSync("node", [path.join(ROOT, "pipeline/label-cases.mjs"), ...a], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" })
const don = () => c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
try {
  await don()
  const { rows } = await c.query(
    `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum)
     VALUES ($1, 'S03', 'gcn-cases-1', 'h1', 'dev', false, 's', 'U-A'), ($1, 'S03', 'gcn-cases-2', 'h2', 'dev', false, 's', 'U-B') RETURNING item_id`, [LAT])
  const [a, b] = rows.map((r) => r.item_id)
  await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, 'usr_gcncases', 'subzone', 'rainbow', false, 'ngu_canh_nhom'), ($1, 'usr_gcncases', 'bedrooms', '2', false, 'chu_bai')`, [a])
  await c.query(`INSERT INTO eval_label_reasons (item_id, labeler_id, reason) VALUES ($1, 'usr_gcncases', 'RB = Rainbow')`, [a])
  await c.query(`INSERT INTO eval_label_cases (item_id, labeler_id, case_kind, note, group_card_verdict) VALUES ($1, 'usr_gcncases', 'bi-danh', 'viết tắt', 'wrong')`, [a])
  void b
  const r1 = chay("--lat", LAT, "--json")
  k(r1.status === 0, "lenh chay", `loi lenh: ${r1.stderr}`)
  const j = JSON.parse(r1.stdout || "{}")
  const ua = j.nhom?.find((n) => n.unit_code === "U-A") ?? {}
  k(ua.ly_do?.[0]?.ly_do === "RB = Rainbow", "co ly do", "loi thieu ly do")
  k(ua.truong_hop?.[0]?.loai === "bi-danh" && ua.truong_hop?.[0]?.dien_giai === "viết tắt", "co truong hop", "loi thieu truong hop")
  k(ua.the_nhom?.[0]?.tra_loi === "wrong", "tra loi the", "loi thieu tra loi the")
  k(ua.gia_tri_ngu_canh?.length === 1 && ua.gia_tri_ngu_canh[0].gia_tri === "rainbow", "gia tri ngu canh", "loi gia tri ngu canh")
  k(j.nhom?.some((n) => n.unit_code === "U-B"), "nhom chua gan van co dong", "loi mat nhom chua gan")
  k(!/usr_gcncases|labeler/.test(r1.stdout), "khong co labeler", "loi lo dinh danh nguoi gan")
  const r2 = chay("--lat", LAT, "--json")
  k(r2.stdout === r1.stdout, "chay lai y nguyen", "loi chay lai khac")
  const r3 = chay("--lat", LAT, "--nhom", "U-B", "--json")
  k(JSON.parse(r3.stdout || "{}").nhom?.length === 1, "loc mot nhom", "loi loc nhom")
  const r4 = chay("--lat", "gcn-khong-co", "--json")
  k(r4.status !== 0 && /lát không có mẫu/.test(r4.stderr), "doi chung: lat khong co mau thoat khac 0", `loi lat khong co: ${r4.status} ${r4.stderr}`)
} finally {
  await don()
  await c.end()
}
console.log(loi.length ? `CASES FAIL (${loi.length})` : "CASES OK")
process.exit(loi.length ? 1 : 0)
