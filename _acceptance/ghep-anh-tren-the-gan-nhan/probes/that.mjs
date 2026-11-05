// that.mjs — E11. 367 bài thật của lát, kết nối chỉ đọc, chỉ báo số, không in mã hay chữ bài. Gọi hàm ghép thật, không ghi gì.
// Thước là lần đo 05/11: stg thu thêm bài có thể đổi cụm, lệch thì đỏ và in số mới để người xem.
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { ROOT, SERVER, banGhiKiem, pg } from "./_db.mjs"

const { loi, kiem } = banGhiKiem()
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const { ghepChoMau } = await nap("pipeline/lib/ghep-mau.mjs")
const { laChiAnh, soChuGan } = await nap("pipeline/lib/gop-anh.mjs")
const { loadStgPosts } = await nap("pipeline/lib/test-posts.mjs")
const c = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await c.connect()
const { rows: items } = await c.query(`SELECT item_id, ref_id FROM eval_label_items WHERE lat = 's03-theo-nhom' ORDER BY item_id`)
const { posts } = await loadStgPosts(c, "zalo")
await c.end()
const theoId = new Map(posts.map((p) => [p.post_id, p]))
const g = ghepChoMau(items, posts)
const chu = posts.filter((p) => !laChiAnh(p.text))
const ds = items.map((i) => ({ p: theoId.get(i.ref_id), g: g.get(String(i.item_id)) }))
const so = {
  ghep: ds.filter((x) => laChiAnh(x.p?.text) && x.g?.chu_ref).length,
  // Theo chính bài ảnh của dòng, không theo số lớn nhất của cụm.
  nhieu: ds.filter((x) => laChiAnh(x.p?.text) && soChuGan(chu, x.p) > 1).length,
  khong: ds.filter((x) => laChiAnh(x.p?.text) && !x.g?.chu_ref).length,
  coCum: ds.filter((x) => x.p && !laChiAnh(x.p.text) && x.g).length,
  nul: ds.filter((x) => x.g == null).length,
  nhan: ds.filter((x) => x.g?.chu_ref).length,
  trung: ds.filter((x) => x.g?.trung_voi).length,
  lon: Math.max(...ds.map((x) => (x.g?.chu_ref ? x.g.anh_refs.length : 0))),
}
console.log(`so do ${JSON.stringify(so)}`)
kiem(items.length === 367, "367 dong", `loi so dong ${items.length}`)
kiem(so.ghep === 133, "133 bai ghep", `loi bai ghep ${so.ghep}`)
kiem(so.nhieu === 22, "22 nhieu tin chu", `loi nhieu tin chu ${so.nhieu}`)
kiem(so.khong === 47, "47 khong tin chu", `loi khong tin chu ${so.khong}`)
kiem(so.coCum === 11, "11 bai co chu co cum", `loi co chu co cum ${so.coCum}`)
kiem(so.nul === 176, "176 null", `loi null ${so.nul}`)
kiem(so.nhan === 144, "144 co nhan ghep", `loi nhan ghep ${so.nhan}`)
kiem(items.length - so.trung === 356, "356 don vi", `loi don vi ${items.length - so.trung}`)
kiem(so.lon === 21, "cum lon nhat 21", `loi cum lon nhat ${so.lon}`)
// Cụm có bài ảnh nào nhiều tin chữ gần thì dòng đại diện phải mang cờ.
const daiDien = ds.filter((x) => x.g?.chu_ref && !x.g.trung_voi)
const lech = daiDien.filter((x) => x.g.so_chu_gan < 2 && ds.some((y) => y.g?.chu_ref === x.g.chu_ref && y.g.so_chu_gan > 1))
kiem(lech.length === 0, "cum lech co co", `loi ${lech.length} the mat co`)
console.log(`the co co ${daiDien.filter((x) => x.g.so_chu_gan > 1).length}`)
const tepDt = path.join(ROOT, "_acceptance/ghep-anh-tren-the-gan-nhan/probes/doc-tay.json")
const bam = createHash("sha256").update(fs.readFileSync(tepDt)).digest("hex")
const tepBam = tepDt.replace(".json", ".sha256")
if (process.argv.includes("--ghi-bam")) fs.writeFileSync(tepBam, `${bam}\n`)
kiem(fs.readFileSync(tepBam, "utf8").trim() === bam, "doc tay khop bam", "loi bang doc tay doi so voi bam da ghim")
const cum = JSON.parse(fs.readFileSync(tepDt, "utf8")).cum
const dem = (k) => cum.filter((x) => x.ket === k).length
kiem(cum.length === 30 && dem("dung") + dem("sai") + dem("khong-phan") + dem("khong-tep") === 30, "doc tay cong du 30", "loi bang doc tay khong du 30")
console.log(`doc tay dung ${dem("dung")} sai ${dem("sai")} khong phan ${dem("khong-phan")} khong tep ${dem("khong-tep")}`)
if (loi.length) process.exit(1)
console.log("THAT OK")
process.exit(0)
