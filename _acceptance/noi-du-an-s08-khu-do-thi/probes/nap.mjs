// nap.mjs — E3–E6, E8–E10: migration 074 và lệnh nối thật trên DB thử dựng lại mỗi lần. Không ghi DB oneinvest: từ chối DB đích khác,
// băm asset_nodes của oneinvest trước bước đầu và sau bước cuối. Đầu ra chỉ có số và mã kho, không tên hay mã dự án S08.
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const TU_DAY = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(TU_DAY, "../../..")
const DB_THU = process.env.DN1_DB ?? "oneinvest_dn1_noi"
if (DB_THU !== "oneinvest_dn1_noi") { console.log(`tu choi: DB dich ${DB_THU}`); process.exit(3) }
const SERVER = "postgres://oneinvest:oneinvest@localhost:5433"
const URL_THU = `${SERVER}/${DB_THU}`
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const SLUG = "noi-du-an-s08-khu-do-thi"
const LENH = path.join(ROOT, "pipeline/noi-du-an-s08.mjs")
const M074 = fs.readFileSync(path.join(ROOT, "db/migrations/074_noi_du_an_s08.sql"), "utf8")
const chung = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: ROOT, encoding: "utf8" }).trim()
const TEP_BANG = process.env.DN1_TEP ?? path.join(path.dirname(chung), "research-local/s08-noi-du-an.json")
const THU_MUC = path.join(ROOT, ".acceptance-runs", SLUG, `nap-${process.pid}`)
fs.mkdirSync(THU_MUC, { recursive: true })

const loi = []
const kiem = (dieu, ok, sai) => { if (dieu) console.log(`ok ${ok}`); else { console.log(`FAIL ${sai ?? ok}`); loi.push(sai ?? ok) } }
const md5 = (o) => createHash("md5").update(JSON.stringify(o)).digest("hex")

// Mã toà trong block_raw là chữ tự do: bỏ tiền tố toà, cách, đuôi tầng sau dấu chấm hay gạch. Ma trận viết trước, chạy trước khi tin.
export const chuanMaToa = (s) => (s ?? "").toLowerCase().replace(/^(toà|tòa|toa|tower|block)\s*/u, "").split(/[.\-\s]/)[0]
const DANG_MA = /^[a-z]{1,3}\d{1,2}$/
const MA_TRAN = [["S10", "s10"], ["s10", "s10"], ["Toà S7", "s7"], ["tòa A1", "a1"], ["S10.05", "s10"], ["A1-12", "a1"], ["LD2 tầng 5", "ld2"], ["Tower T3", "t3"]]
for (const [vao, ra] of MA_TRAN) kiem(chuanMaToa(vao) === ra, `ma tran ma toa ${vao}`, `loi ma tran ${vao}: ${chuanMaToa(vao)}`)
// Tên viết tắt của chính khu, không phải toà; block_raw đọc nhầm ra chúng (đo 05/11: 3 tin OCP1).
const LA_KHU = new Set(["ocp1", "ocp2", "ocp3"])

const baiThat = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await baiThat.connect()
const bamThat = async () => {
  const { rows } = await baiThat.query(`SELECT id, name, aliases, area_ids FROM public.asset_nodes ORDER BY id`)
  const { rows: bang } = await baiThat.query(`SELECT to_regclass('public.s08_project_links') IS NOT NULL AS co`)
  return md5({ rows, co: bang[0].co })
}
const truocThat = await bamThat()

const dung = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB_THU], { encoding: "utf8" })
if (dung.status !== 0) { console.log(`FAIL loi dung DB thu: ${dung.stderr.slice(0, 200)}`); process.exit(1) }
console.log("ok db thu dung lai")

const c = new pg.Client({ connectionString: URL_THU })
await c.connect()
const { rows: tenDb } = await c.query(`SELECT current_database() AS d`)
if (tenDb[0].d !== DB_THU) { console.log(`FAIL sai DB ${tenDb[0].d}`); process.exit(1) }

const nutProject = async () => (await c.query(`SELECT slug, name, aliases, area_ids FROM asset_nodes WHERE node_type = 'project' ORDER BY slug`)).rows
const dongToa = async () => {
  const { rows: a } = await c.query(`SELECT DISTINCT block_raw AS v FROM sale_offers WHERE block_raw IS NOT NULL`)
  const { rows: b } = await c.query(`SELECT DISTINCT subdivision_name AS v FROM stg_s08_inventory WHERE subdivision_name IS NOT NULL`)
  return new Set([...a, ...b].map((r) => chuanMaToa(r.v)).filter((m) => DANG_MA.test(m) && !LA_KHU.has(m)))
}
const trungToa = (nut, ma) => nut.flatMap((n) => n.aliases.map(chuanMaToa).filter((al) => DANG_MA.test(al) && ma.has(al))).sort()
const coMa = async (ids) => (await c.query(`SELECT id FROM areas WHERE id = ANY($1)`, [ids])).rows.length

// Trước 074
const nutTruoc = await nutProject()
const maToa = await dongToa()
kiem(JSON.stringify(trungToa(nutTruoc, maToa)) === JSON.stringify(["s10", "s7"]), "doi chung: truoc 074 thay dung s7 s10", `loi truoc 074 thay ${trungToa(nutTruoc, maToa)}`)
const ocp = (nut, n) => nut.find((x) => x.slug === `vinhomes-ocean-park-${n}`)
const maOcpTruoc = [...new Set([1, 2, 3].flatMap((n) => ocp(nutTruoc, n).area_ids))]
kiem((await coMa(maOcpTruoc)) === 0, "doi chung: truoc 074 ma ocp khong co trong areas", "loi truoc 074 ma ocp da co trong areas")

// E3: áp hai lần, CHECK
const ap = async () => { await c.query(M074) }
await ap(); await ap()
console.log("ok ap 074 hai lan")
const idNut = (await c.query(`SELECT id FROM asset_nodes WHERE node_type = 'project' LIMIT 1`)).rows[0].id
const chenSai = async (asset, status, lyDo, rang) => {
  let ten = null
  await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status, ly_do) VALUES ('thu-check', $1, $2, $3)`, [asset, status, lyDo]).catch((e) => { ten = e.constraint })
  await c.query(`DELETE FROM s08_project_links WHERE project_id = 'thu-check'`)
  return ten === rang
}
kiem(await chenSai(null, "noi", null, "s08_project_links_noi_check"), "check noi thieu nut")
kiem(await chenSai(null, "chua_noi", null, "s08_project_links_chua_noi_ly_do_check"), "check chua_noi thieu ly do")
kiem(await chenSai(idNut, "chua_noi", "x", "s08_project_links_chua_noi_nut_check"), "check chua_noi co nut")
await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ('thu-check', $1, 'noi')`, [idNut])
await c.query(`DELETE FROM s08_project_links WHERE project_id = 'thu-check'`)
console.log("ok doi chung: dong lanh qua check")

// E5: bí danh
const BO = { "phu-my-hung": ["s7", "s10"], "vinhomes-ocean-park-1": ["vuong", "vang danh"], "vinhomes-ocean-park-2": ["vu yen", "vang danh 2"], "vinhomes-ocean-park-3": ["vu yen 3"] }
const nutSau = await nutProject()
kiem(trungToa(nutSau, maToa).length === 0, "sau 074 0 bi danh trung ma toa", `loi con trung ${trungToa(nutSau, maToa)}`)
kiem(Object.entries(BO).every(([s, ds]) => ds.every((d) => !nutSau.find((n) => n.slug === s).aliases.includes(d))), "bi danh da khai da bo")
kiem(nutTruoc.every((t) => JSON.stringify(t.aliases.filter((a) => !(BO[t.slug] ?? []).includes(a))) === JSON.stringify(nutSau.find((n) => n.slug === t.slug).aliases)), "bi danh khac giu nguyen")

// E6: mã vùng
kiem(JSON.stringify(ocp(nutSau, 1).area_ids) === JSON.stringify(["vn-hanoi-gia-lam"]), "area_ids ocp1")
kiem([2, 3].every((n) => JSON.stringify(ocp(nutSau, n).area_ids) === JSON.stringify(["vn-hung-yen"])), "area_ids ocp2 ocp3")
kiem((await coMa(["vn-hanoi-gia-lam", "vn-hung-yen"])) === 2, "moi ma ocp co trong areas")
kiem([1, 2, 3].every((n) => !/vũ yên/i.test(ocp(nutSau, n).name)), "ten nut khong con Vu Yen")
kiem(nutTruoc.filter((t) => !t.slug.startsWith("vinhomes-ocean-park-")).every((t) => JSON.stringify(t.area_ids) === JSON.stringify(nutSau.find((n) => n.slug === t.slug).area_ids) && t.name === nutSau.find((n) => n.slug === t.slug).name), "area_ids nut khac khong doi")
const docMa = spawnSync("git", ["grep", "-l", "area_ids", "--", "app/src", "data-api/src"], { cwd: ROOT, encoding: "utf8" }).stdout.trim()
kiem(docMa === "", "khong ma cong doc area_ids", `loi co ma doc area_ids: ${docMa}`)

// E9: lệnh thật với tệp sai, tệp giả nằm trong thư mục gitignored. Bảng phải không đổi.
const bam = async () => md5((await c.query(`SELECT project_id, asset_node_id, status, ly_do FROM s08_project_links ORDER BY project_id`)).rows)
const envThu = { ...process.env, DATABASE_URL: URL_THU }
const chay = (tep, ...them) => spawnSync("node", [LENH, "--tep", tep, ...them], { cwd: ROOT, env: envThu, encoding: "utf8" })
const bangLanh = JSON.parse(fs.readFileSync(TEP_BANG, "utf8"))
const ghiTep = (ten, b) => { const f = path.join(THU_MUC, ten); fs.writeFileSync(f, JSON.stringify(b)); return f }
const CA_SAI = [
  ["nut-khong-phai-project", (b) => { b.noi[0].slug = "gpk-the-beverly" }],
  ["slug-khong-co", (b) => { b.noi[0].slug = "khong-co-khu-nay" }],
  ["project-id-la", (b) => { b.noi[0].project_id = "khong-co-du-an" }],
  ["du-an-hai-dong", (b) => { b.noi.push({ ...b.noi[0] }) }],
  ["bang-rong", (b) => { b.noi = [] }],
  ["tin-hieu-khong-khop", (b) => { b.noi[0].tin_hieu = "khong khop gi" }],
  ["ung-vien-bi-sot", (b) => { b.noi.pop() }],
]
const truocSai = await bam()
for (const [ma, pha] of CA_SAI) {
  const b = structuredClone(bangLanh)
  pha(b)
  const r = chay(ghiTep(`${ma}.json`, b))
  kiem(r.status !== 0 && r.stdout.includes(`loi: ${ma}`) && (await bam()) === truocSai, `sai ${ma} thoat khac 0, bang khong doi`, `loi ca sai ${ma}: thoat ${r.status}`)
}
const tepKhongBoQua = path.join(TU_DAY, `tam-${process.pid}.json`)
fs.writeFileSync(tepKhongBoQua, JSON.stringify(bangLanh))
const rkb = chay(tepKhongBoQua)
fs.rmSync(tepKhongBoQua, { force: true })
kiem(rkb.status !== 0 && rkb.stdout.includes("loi: tep-khong-bi-bo-qua") && (await bam()) === truocSai, "sai tep-khong-bi-bo-qua thoat khac 0, bang khong doi")
const tepNgoai = path.join(os.tmpdir(), `dn1-${process.pid}.json`)
fs.writeFileSync(tepNgoai, JSON.stringify(bangLanh))
const rn = chay(tepNgoai)
fs.rmSync(tepNgoai, { force: true })
kiem(rn.status !== 0 && rn.stdout.includes("loi: tep-ngoai-kho") && (await bam()) === truocSai, "sai tep-ngoai-kho thoat khac 0, bang khong doi")
const rThu = chay(TEP_BANG, "--thu")
kiem(rThu.status === 0 && rThu.stdout.includes("thu: khong ghi") && (await bam()) === truocSai, "thu khong ghi", `loi --thu: ${rThu.status}`)

// E4: tệp thật, hai lần
const r1 = chay(TEP_BANG)
kiem(r1.status === 0, "tep lanh cung luong qua duoc", `loi tep lanh: ${r1.stdout.slice(0, 120)}`)
const { rows: theoKhu } = await c.query(`SELECT n.slug, count(*)::int AS n FROM s08_project_links l JOIN asset_nodes n ON n.id = l.asset_node_id WHERE l.status = 'noi' GROUP BY 1`)
const dem = (s) => theoKhu.find((x) => x.slug === s)?.n ?? 0
kiem(dem("vinhomes-ocean-park-1") === 3, "ocp1 3 du an", `loi ocp1 ${dem("vinhomes-ocean-park-1")}`)
kiem(dem("vinhomes-grand-park") === 5, "grand park 5 du an", `loi grand park ${dem("vinhomes-grand-park")}`)
const { rows: [soDuAn] } = await c.query(`SELECT count(DISTINCT project_id)::int AS n FROM stg_s08_inventory`)
const { rows: [soDong] } = await c.query(`SELECT count(*)::int AS n, count(DISTINCT project_id)::int AS k, (count(*) FILTER (WHERE status = 'chua_noi'))::int AS cn, (count(*) FILTER (WHERE status = 'chua_noi' AND ly_do IS NOT NULL))::int AS cl FROM s08_project_links`)
kiem(soDong.n === soDong.k, "moi du an s08 mot dong")
kiem(soDong.cn === soDong.cl && soDong.cn === soDuAn.n - 8, `con lai chua_noi co ly do ${soDong.cn}`, `loi chua_noi ${soDong.cn}, co ly do ${soDong.cl}`)
kiem(soDong.n === soDuAn.n, `tong bang so du an s08 ${soDuAn.n}`, `loi tong ${soDong.n} khac ${soDuAn.n}`)
const b1 = await bam()
const { rows: [t1] } = await c.query(`SELECT max(updated_at) AS m FROM s08_project_links`)
chay(TEP_BANG)
const { rows: [t2] } = await c.query(`SELECT max(updated_at) AS m FROM s08_project_links`)
kiem(b1 === (await bam()) && String(t1.m) === String(t2.m), "chay lai khong doi")

// E10: quan hệ trên bảng thật, cùng hàm kiểm của lệnh
const { kiemBangNoi } = await import(pathToFileURL(LENH).href)
const banDuyet = fs.readFileSync(path.join(TU_DAY, "bang-noi.sha256"), "utf8").trim()
kiem(createHash("sha256").update(fs.readFileSync(TEP_BANG)).digest("hex") === banDuyet, "bang noi dung ban da duyet", "loi bang noi khac ban da duyet")
const { rows: duAn } = await c.query(`SELECT project_id::text AS project_id, max(payload->>'project_name') AS ten, max(payload->>'project_code') AS ma, string_agg(DISTINCT subdivision_name, ' / ') AS phan_khu FROM stg_s08_inventory GROUP BY 1`)
const nut = new Map((await c.query(`SELECT slug, node_type FROM asset_nodes`)).rows.map((n) => [n.slug, n.node_type]))
kiem(kiemBangNoi({ bang: bangLanh, duAn, nut }).loi.length === 0, `moi dong noi co tin hieu rieng ${bangLanh.noi.length}`)
const tuKhoaBo = Object.values(bangLanh.tu_khoa_lat).flat().length
kiem(bangLanh.loai.length >= 1 && tuKhoaBo > 0, `ung vien tu khoa da xu ly, ${bangLanh.loai.length} loai`)
kiem(!bangLanh.noi.some((d) => bangLanh.loai.some((l) => l.project_id === d.project_id)), "khong dong nao bi loai ma van noi")
const trao = structuredClone(bangLanh)
const iA = trao.noi.findIndex((d) => d.slug === "vinhomes-ocean-park-1"), iB = trao.noi.findIndex((d) => d.slug === "vinhomes-grand-park")
;[trao.noi[iA].slug, trao.noi[iB].slug] = [trao.noi[iB].slug, trao.noi[iA].slug]
kiem(kiemBangNoi({ bang: trao, duAn, nut }).loi.includes("tin-hieu-khong-khop"), "doi chung: trao hai dong khac khu bi bat")
const xoa = structuredClone(bangLanh)
xoa.noi.splice(0, 1)
kiem(kiemBangNoi({ bang: xoa, duAn, nut }).loi.includes("ung-vien-bi-sot"), "doi chung: xoa mot dong bi bat")

// E8: mappings và DB thật
export function kiemMappings(chu) {
  const s = chu.slice(chu.indexOf("\n  S08:"))
  const khoi = s.slice(0, s.slice(1).search(/\n  [A-Za-z0-9_]+:\n/) + 1 || undefined)
  return { project_id: /\n\s+project_id:/.test(khoi), project_name: /\n\s+project_name:/.test(khoi), bang: khoi.includes("s08_project_links"), local: /chỉ local/.test(khoi) }
}
const chuMap = fs.readFileSync(path.join(ROOT, "pipeline/mappings.yaml"), "utf8")
const km = kiemMappings(chuMap)
kiem(km.project_id, "mappings co project_id"); kiem(km.project_name, "mappings co project_name")
kiem(km.bang, "mappings noi qua s08_project_links"); kiem(km.local, "mappings chi local")
kiem(!kiemMappings(chuMap.replace(/\n\s+project_name:[^\n]*/, "")).project_name, "doi chung: mappings thieu truong bi bat")
const tuChoi = spawnSync("node", [fileURLToPath(import.meta.url)], { env: { ...process.env, DN1_DB: "oneinvest" }, encoding: "utf8" })
kiem(tuChoi.status === 3 && tuChoi.stdout.includes("tu choi"), "doi chung: tro vao oneinvest bi tu choi")
kiem((await bamThat()) === truocThat, "oneinvest khong doi", "loi oneinvest doi trong luot do")

await c.end(); await baiThat.end()
fs.rmSync(THU_MUC, { recursive: true, force: true })
if (loi.length) process.exit(1)
console.log("NAP OK")
