// mau.mjs — E2 (AC-2): lệnh lấy mẫu chạy thật bằng tiến trình con trên DB thử, dữ liệu mồi đã commit riêng, dọn sau khi đo.
// Ba nhóm lớn, hai nhóm nhỏ, post thử, nội dung trùng giữa hai nhóm, bài không có đơn vị trong sổ.
import { spawnSync } from "node:child_process"
import path from "node:path"

import { ROOT, URL_THU, kiem, noiDbThu } from "./_db.mjs"

const LENH = path.join(ROOT, "pipeline/label-sample.mjs")
const LAT = "gcn-mau"
const SNAP = "hanoi__zalo__gcnmau"
const c = await noiDbThu()
const don = async () => {
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'gcn-mau-%'`)
  await c.query(`DELETE FROM collection_units WHERE group_key LIKE 'conv-gcn-%'`)
  await c.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE '%gcnmau'`)
}
await don()
for (const [id, src] of [[SNAP, "zalo"], ["hanoi__zalo-mock__gcnmau", "zalo-mock"]])
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1,'hanoi',$2,'{}'::jsonb) ON CONFLICT DO NOTHING`, [id, src])
const NHOM = [["L1", 45], ["L2", 40], ["L3", 35], ["N1", 8], ["N2", 3]]
const MA = {}
for (const [m] of NHOM) {
  const { rows } = await c.query(
    `INSERT INTO collection_units (source_code, name, group_key) VALUES ('S03', $1, $2) RETURNING unit_code`,
    [`GCN Nhóm ${m}`, `conv-gcn-${m}`])
  MA[m] = rows[0].unit_code
}
const them = (id, snap, conv, nhom, text) =>
  c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, conversation_id, group_name, text) VALUES ($1,$2,$3,$4,$5)`, [id, snap, conv, nhom, text])
for (const [m, n] of NHOM) for (let i = 0; i < n; i++) await them(`gcn-mau-${m}-${i}`, SNAP, `conv-gcn-${m}`, `GCN ${m}`, `GCN bài ${m} số ${i}`)
// L2 có 5 bài trùng chữ với L1; L1 xếp trước nên giữ, L2 bù từ phần còn lại.
for (let i = 0; i < 5; i++) await them(`gcn-mau-T-${i}`, SNAP, "conv-gcn-L2", "GCN L2", `GCN bài L1 số ${i}`)
await them("gcn-mau-t0", "hanoi__zalo-mock__gcnmau", "conv-gcn-L1", "GCN L1", "POSTTHU mock")
await them("gcn-mau-x0", SNAP, "conv-khong-so", "GCN lạ", "GCN bài không đơn vị")

const chay = (...a) => spawnSync("node", [LENH, ...a], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" })
const ARGS = ["--lat", LAT, "--seed", "gcn", "--theo-nhom", "--moi-nhom-lon", "30", "--moi-nhom-nho", "5", "--so-nhom-lon", "3", "--nhom-khop", "^GCN"]
const loi = []
const r0 = chay(...ARGS, "--thu")
const dem = async () => (await c.query(`SELECT count(*)::int n FROM eval_label_items WHERE lat = $1`, [LAT])).rows[0].n
kiem(loi, r0.status === 0 && (await dem()) === 0, "--thu khong ghi", `loi --thu: ${r0.status} ${r0.stderr}`)
const r1 = chay(...ARGS)
kiem(loi, r1.status === 0, "lenh chay", `loi lenh: ${r1.stderr}`)
const { rows } = await c.query(
  `SELECT i.ref_id, i.stratum, i.double_label, i.text_hash, p.text FROM eval_label_items i JOIN stg_zalo_posts p ON p.post_id = i.ref_id WHERE i.lat = $1`, [LAT])
const cua = (m, f = () => true) => rows.filter((x) => x.stratum === MA[m] && f(x)).length
kiem(loi, cua("L1") === 30 && cua("L2") === 30 && cua("L3") === 30, "nhom lon 30", `loi nhom lon: ${cua("L1")},${cua("L2")},${cua("L3")}`)
kiem(loi, cua("N1") === 5 && cua("N2") === 3, "nhom nho toi 5", `loi nhom nho: ${cua("N1")},${cua("N2")}`)
kiem(loi, rows.every((x) => x.stratum), "ma nhom moi dong", "loi dong thieu ma nhom")
kiem(loi, cua("L1", (x) => x.double_label) === 6 && cua("N1", (x) => x.double_label) === 1, "trung 20 trong nhom", "loi ti le trung")
kiem(loi, rows.every((x) => !x.text.startsWith("POSTTHU")), "0 post thu", "loi post thu lot")
kiem(loi, !rows.some((x) => x.text.includes("không đơn vị")), "bai khong don vi bi bo", "loi bai khong don vi lot")
kiem(loi, new Set(rows.map((x) => x.text_hash)).size === rows.length, "noi dung trung thuoc nhom truoc", "loi hai dong cung noi dung")
kiem(loi, !rows.some((x) => x.stratum === MA.L2 && /bài L1/.test(x.text)), "nhom sau bu du", "loi nhom sau giu noi dung trung")
kiem(loi, /bỏ vì trùng [1-9]/.test(r1.stdout) && /không có đơn vị trong sổ: 1/.test(r1.stdout), "in so bo vi trung", `loi khong in so: ${r1.stdout.slice(0, 200)}`)
const truoc = await dem()
chay(...ARGS)
kiem(loi, (await dem()) === truoc, "chay lai them 0", "loi chay lai them dong")
const r2 = chay("--lat", LAT, "--seed", "khac", "--theo-nhom", "--nhom-khop", "^GCN")
kiem(loi, r2.status !== 0 && /không trộn hai mẫu/.test(r2.stderr), "doi chung: doi seed bi chan", `loi doi seed: ${r2.status} ${r2.stderr}`)
await don()
await c.end()
console.log(loi.length ? `MAU FAIL (${loi.length})` : "MAU OK")
process.exit(loi.length ? 1 : 0)
