// mau.mjs — E2 (AC-2): lệnh lấy mẫu chạy THẬT bằng tiến trình con trên DB thử, dữ liệu mồi đã COMMIT ở lát thử riêng
// (nhóm «MGN-THU …»), dọn sau khi đo. Ma trận viết trước: 30 nội dung khác nhau ở nhóm lát, 5 bản trùng chữ, 6 post thử
// (mỗi dấu của lib/test-posts.mjs ít nhất một ca), 8 tin nhóm khác. Đối chứng: bản chép lệnh bỏ bộ gạt post thử phải bị
// bắt với «POST THU LOT VAO MAU».
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { ROOT, URL_THU, datSnapshot, donThu, kiem, noiDbThu } from "./_db.mjs"

const LENH = path.join(ROOT, "pipeline/label-sample.mjs")
const NHOM = "^(MGN-THU|TEST)"
const DON = { lat: "mgn-thu%", post: "mgn-mau-", tag: "mau" }

async function moi(c) {
  await donThu(c, DON)
  await datSnapshot(c, "mau")
  const them = (id, snap, nhom, text, agent = null) =>
    c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, agent_id) VALUES ($1,$2,$3,$4,$5)`,
      [id, snap, nhom, text, agent])
  for (let i = 0; i < 30; i++) await them(`mgn-mau-p${String(i).padStart(2, "0")}`, "hanoi__zalo__mgnmau", "MGN-THU OCP", `Bán căn MGN số ${i} toà S${i % 4}`)
  for (let i = 0; i < 5; i++) await them(`mgn-mau-z${i}`, "hanoi__zalo__mgnmau", "MGN-THU OCP", `  BÁN căn MGN số ${i} toà S${i % 4}!!`)
  // post thử: snapshot nguồn mock (2), snapshot example (1), agent e2e (2), nhóm TEST (1) — chữ khác mọi tin thật
  await them("mgn-mau-t0", "hanoi__zalo-mock__mgnmau", "MGN-THU OCP", "POSTTHU mock 0")
  await them("mgn-mau-t1", "hanoi__zalo-mock__mgnmau", "MGN-THU OCP", "POSTTHU mock 1")
  await them("mgn-mau-t2", "hanoi__example__mgnmau", "MGN-THU OCP", "POSTTHU example 2")
  await them("mgn-mau-t3", "hanoi__zalo__mgnmau", "MGN-THU OCP", "POSTTHU agent 3", "e2e-mgn")
  await them("mgn-mau-t4", "hanoi__zalo__mgnmau", "MGN-THU OCP", "POSTTHU agent 4", "test-mgn")
  await them("mgn-mau-t5", "hanoi__zalo__mgnmau", "TEST-MGN", "POSTTHU nhom 5")
  for (let i = 0; i < 8; i++) await them(`mgn-mau-k${i}`, "hanoi__zalo__mgnmau", "Nhóm khác MGN", `Tin nhóm khác MGN ${i}`)
}

const chay = (lenh, args) =>
  execFileSync("node", [lenh, ...args], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" })

async function doLat(c, lat) {
  const { rows } = await c.query(
    `SELECT i.ref_id, i.text_hash, i.double_label, i.split, p.group_name, p.text
     FROM eval_label_items i JOIN stg_zalo_posts p ON p.post_id = i.ref_id WHERE i.lat = $1`, [lat])
  return rows
}

/** Bộ kiểm một lần chạy lệnh (thật hoặc đột biến) trên lát mgn-thu. */
async function kiemLenh(c, lenh, im = false) {
  const loi = []
  const k = (d, ok, fail) => (d ? im || console.log(`ok ${ok}`) : (im || console.log(fail), loi.push(fail)))
  await c.query(`DELETE FROM eval_label_items WHERE lat LIKE 'mgn-thu%'`)
  const out = chay(lenh, ["--lat", "mgn-thu", "--n", "20", "--seed", "mgn", "--nhom-khop", NHOM])
  const r = await doLat(c, "mgn-thu")
  k(r.length === 20, "20 dong", `SAI SO DONG: ${r.length}`)
  k(r.every((x) => !x.text.startsWith("POSTTHU")), "0 post thu", "POST THU LOT VAO MAU")
  k(r.every((x) => /^MGN-THU/.test(x.group_name)), "0 nhom khac", "NHOM KHAC LOT VAO MAU")
  k(new Set(r.map((x) => x.text_hash)).size === r.length, "khong hai dong cung noi dung", "HAI DONG CUNG NOI DUNG")
  k(r.filter((x) => x.double_label).length === 4, "double_label = 4", "SAI SO GAN TRUNG")
  const dev = r.filter((x) => x.split === "dev").length
  k(Math.abs(dev - (r.length - dev)) <= 1, `dev/test ${dev}/${r.length - dev}`, "LECH DEV TEST")
  if (im) return loi
  const truoc = JSON.stringify(r.map((x) => [x.ref_id, x.double_label, x.split]).sort())
  const out2 = chay(lenh, ["--lat", "mgn-thu", "--n", "20", "--seed", "mgn", "--nhom-khop", NHOM])
  const sau = JSON.stringify((await doLat(c, "mgn-thu")).map((x) => [x.ref_id, x.double_label, x.split]).sort())
  k(/them 0/.test(out2) && truoc === sau, "chay lai: 0 them 0 doi", "CHAY LAI DOI MAU")
  // --thu: đếm qua kết nối thứ hai (c), lệnh chạy ở tiến trình riêng
  chay(lenh, ["--lat", "mgn-thu2", "--n", "20", "--seed", "mgn", "--nhom-khop", NHOM, "--thu"])
  k((await doLat(c, "mgn-thu2")).length === 0, "--thu: 0 dong ghi", "THU VAN GHI")
  const out3 = chay(lenh, ["--lat", "mgn-thu3", "--n", "100", "--seed", "mgn", "--nhom-khop", NHOM])
  k((await doLat(c, "mgn-thu3")).length === 30 && /thieu 70/.test(out3), "--n 100: lay 30, in 'thieu 70'", "THIEU KHONG BAO")
  void out
  return loi
}

const c = await noiDbThu()
const tmp = mkdtempSync(path.join(tmpdir(), "mgn-mau-"))
let loi = []
try {
  await moi(c)
  loi = await kiemLenh(c, LENH)
  // Đối chứng: bản chép lệnh đọc stg thẳng (bỏ bộ gạt post thử) — import đổi sang đường tuyệt đối.
  const goc = readFileSync(LENH, "utf8")
  const hongLoc = `const { rows: posts } = await client.query("SELECT DISTINCT ON (post_id) post_id, text, group_name FROM stg_zalo_posts ORDER BY post_id"); const rejected = { total: 0 };`
  const dot = goc
    .replace('const { posts, rejected } = await loadStgPosts(client, "zalo");', hongLoc)
    .replaceAll('from "./lib/', `from "${pathToFileURL(path.join(ROOT, "pipeline/lib")).href}/`)
    .replace('import pg from "pg";', `import pg from "${pathToFileURL(path.join(ROOT, "pipeline/node_modules/pg/lib/index.js")).href}";`)
  if (dot === goc) loi.push("DOI CHUNG KHONG DUNG DUOC")
  const banDot = path.join(tmp, "label-sample-dot.mjs")
  writeFileSync(banDot, dot)
  const loiDot = await kiemLenh(c, banDot, true)
  kiem(loi, loiDot.includes("POST THU LOT VAO MAU"), "doi chung: ban bo bo loc bi bat 'POST THU LOT VAO MAU'", "DOI CHUNG KHONG DO: ban bo bo loc khong bi bat")
} finally {
  await donThu(c, DON)
  await c.end()
  rmSync(tmp, { recursive: true, force: true })
}
console.log(loi.length ? `MAU FAIL (${loi.length})` : "MAU OK")
process.exit(loi.length ? 1 : 0)
