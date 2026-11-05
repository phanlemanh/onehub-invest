// transform-thu.mjs — E4: dựng lại DB thử, chạy transform bản gốc rồi bản hiện tại bằng đúng lệnh chạy đêm, so mọi tin.
// Chỉ ghi DB thử oneinvest_gc1_m2. Mọi kết nối của transform mang application_name riêng, lấy mẫu để biết chúng vào DB nào.
import { spawn, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { ROOT, chepPipeline, docJson, donChep, kiem, pg } from "./_goc.mjs"

const SERVER = "postgres://oneinvest:oneinvest@localhost:5433"
const DB_THU = "oneinvest_gc1_m2"
const URL_THU = `${SERVER}/${DB_THU}`
const APP = `gc1-thu-${process.pid}`
const MOC = docJson("mau-bai-doi.json").moc_captured_at

/** Mọi lệch giữa hai bản chụp. Dùng chung cho phép đo và đối chứng. */
export function soTin(a, b, moc) {
  const f = (v) => (v == null ? null : Number(v))
  const mat = [], coSoDoi = [], rongSangSo = [], nhomDoi = []
  for (const [id, x] of a) {
    const y = b.get(id)
    if (!y) { mat.push(id); continue }
    if (f(x.area_m2) != null && f(x.area_m2) !== f(y.area_m2)) coSoDoi.push(id)
    if (f(x.area_m2) == null && f(y.area_m2) != null && new Date(x.first_seen) <= new Date(moc)) rongSangSo.push(id)
    if (JSON.stringify([...(x.post_ids ?? [])].sort()) !== JSON.stringify([...(y.post_ids ?? [])].sort())) nhomDoi.push(id)
  }
  return { mat, coSoDoi, rongSangSo, nhomDoi }
}

const chup = async (c) => new Map((await c.query(`SELECT offer_id, area_m2, post_ids, first_seen FROM public.sale_offers`)).rows.map((r) => [r.offer_id, r]))

/** Chạy một bản transform, lấy mẫu pg_stat_activity trong lúc chạy. Trả các DB mà kết nối của nó vào. */
function chayTransform(tep, giamSat) {
  return new Promise((resolve, reject) => {
    const dbs = new Set()
    let mau = 0
    const hen = setInterval(async () => {
      const { rows } = await giamSat.query(`SELECT DISTINCT datname FROM pg_stat_activity WHERE application_name = $1`, [APP]).catch(() => ({ rows: [] }))
      for (const r of rows) { dbs.add(r.datname); mau++ }
    }, 200)
    const con = spawn("node", [tep], { cwd: path.dirname(tep), env: { ...process.env, DATABASE_URL: URL_THU, PGAPPNAME: APP }, stdio: ["ignore", "ignore", "inherit"] })
    con.on("exit", (code) => { clearInterval(hen); code === 0 ? resolve({ dbs, mau }) : reject(new Error(`transform thoat ${code}: ${tep}`)) })
  })
}

const loi = []
const dem = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB_THU], { encoding: "utf8" })
if (dem.status !== 0) { console.log(`FAIL loi dung DB thu: ${dem.stderr}`); process.exit(1) }
console.log(`DB thu dung lai: ${DB_THU}`)

const lenhDem = fs.readFileSync(path.join(ROOT, "scripts/zalo-import-daily.sh"), "utf8").match(/^job_run .* node "\$ROOT\/pipeline\/transform-zalo\.mjs"(.*)$/m)
kiem(loi, lenhDem && lenhDem[1].trim() === "", `lenh chay dem khop: node pipeline/transform-zalo.mjs`, `loi lenh chay dem khac: ${lenhDem?.[0]}`)

const mau = docJson("mau-do.json")
const goc = chepPipeline("transform-thu")
const c = new pg.Client({ connectionString: URL_THU })
const giamSat = new pg.Client({ connectionString: URL_THU })
try {
  await c.connect()
  await giamSat.connect()
  const { rows: tenDb } = await c.query(`SELECT current_database() AS d`)
  if (tenDb[0].d !== DB_THU) throw new Error(`sai DB: ${tenDb[0].d}`)

  const r1 = await chayTransform(path.join(goc, "pipeline/transform-zalo.mjs"), giamSat)
  const a = await chup(c)
  const rongSauCu = mau.tin.filter((t) => a.get(t.offer_id) && a.get(t.offer_id).area_m2 == null).length
  kiem(loi, rongSauCu === mau.tin.length, `doi chung: ban cu ${rongSauCu}/${mau.tin.length} rong`, `loi doi chung: sau ban cu chi ${rongSauCu}/${mau.tin.length} rong`)

  const r2 = await chayTransform(path.join(ROOT, "pipeline/transform-zalo.mjs"), giamSat)
  const b = await chup(c)
  const dungSo = mau.tin.filter((t) => b.get(t.offer_id) && Number(b.get(t.offer_id).area_m2) === t.area_m2).length
  kiem(loi, dungSo === mau.tin.length, `${mau.tin.length} tin dung so`, `loi chi ${dungSo}/${mau.tin.length} tin dung so`)
  const giuRong = mau.giu_rong.filter((t) => b.get(t.offer_id)?.area_m2 == null).length
  kiem(loi, giuRong === mau.giu_rong.length, `${mau.giu_rong.length} tin giu rong`, `loi chi ${giuRong}/${mau.giu_rong.length} tin giu rong`)

  const danhSach = new Set(mau.tin.map((t) => t.offer_id))
  const kq = soTin(a, b, MOC)
  kiem(loi, kq.coSoDoi.length === 0, "0 tin co so bi doi", `loi ${kq.coSoDoi.length} tin co so bi doi: ${kq.coSoDoi.slice(0, 5)}`)
  const ngoai = kq.rongSangSo.filter((id) => !danhSach.has(id))
  kiem(loi, ngoai.length === 0 && kq.rongSangSo.length === danhSach.size, "tap tin doi khop danh sach", `loi tap tin doi: ${kq.rongSangSo.length} tin, ngoai danh sach ${ngoai.length}: ${ngoai.slice(0, 5)}`)
  kiem(loi, kq.mat.length === 0, "offer_id khong mat", `loi mat ${kq.mat.length} offer_id`)
  kiem(loi, kq.nhomDoi.length === 0, "nhom gom khong doi", `loi ${kq.nhomDoi.length} nhom gom doi: ${kq.nhomDoi.slice(0, 5)}`)

  const dbs = new Set([...r1.dbs, ...r2.dbs])
  kiem(loi, r1.mau > 0 && r2.mau > 0 && dbs.size === 1 && dbs.has(DB_THU), "moi ket noi vao db thu", `loi ket noi transform: mau ${r1.mau},${r2.mau}, DB ${[...dbs]}`)

  // Đối chứng trên hai bản chụp vừa đo, phá trong bộ nhớ.
  const coSo = [...b.keys()].find((id) => a.get(id)?.area_m2 != null)
  const bSua = new Map(b)
  bSua.set(coSo, { ...b.get(coSo), area_m2: Number(b.get(coSo).area_m2) + 1 })
  kiem(loi, soTin(a, bSua, MOC).coSoDoi.length === 1, "doi chung: sua dien tich mot tin bi bat", "loi doi chung: khong bat duoc tin co so bi doi")
  const bXoa = new Map(b)
  bXoa.delete(coSo)
  kiem(loi, soTin(a, bXoa, MOC).mat.length === 1, "doi chung: xoa mot tin bi bat", "loi doi chung: khong bat duoc tin bi mat")
} finally {
  await c.end().catch(() => {})
  await giamSat.end().catch(() => {})
  donChep(goc)
}
if (loi.length) process.exit(1)
console.log("TRANSFORM-THU OK")
