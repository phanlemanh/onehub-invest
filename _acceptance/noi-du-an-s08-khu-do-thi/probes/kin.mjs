// kin.mjs — E7: S08 không rời máy. Quét kho, hồ sơ và đầu ra lệnh theo tập tên đọc từ DB bằng kết nối chỉ đọc. Báo bằng số, không in tên.
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const TU_DAY = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(TU_DAY, "../../..")
const SLUG = "noi-du-an-s08-khu-do-thi"
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const URL_DOC = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })
const chung = git("rev-parse", "--path-format=absolute", "--git-common-dir").trim()
const TEP_BANG = process.env.DN1_TEP ?? path.join(path.dirname(chung), "research-local/s08-noi-du-an.json")
const LENH = path.join(ROOT, "pipeline/noi-du-an-s08.mjs")
const GOC = "d0b08f4d" // main lúc mở vòng: tên đã có trong migration tới đây là tên công khai có sẵn

const loi = []
const kiem = (dieu, ok, sai) => { if (dieu) console.log(`ok ${ok}`); else { console.log(`FAIL ${sai ?? ok}`); loi.push(sai ?? ok) } }

// Luật quét: casefold, bỏ dấu, bỏ hậu tố nội bộ, biên từ.
export const chuan = (s) => (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase()
export const boHauTo = (s) => chuan(s).replace(/\([^)]*\)/g, " ").replace(/[_ ](ct|tt|shop)\s*$/g, " ").replace(/\s+/g, " ").trim()
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
export function quetTen(chu, tenSet) {
  const c = chuan(chu)
  let dem = 0
  for (const t of tenSet) if (new RegExp(`(?<![\\p{L}\\p{N}])${thoat(t)}(?![\\p{L}\\p{N}])`, "u").test(c)) dem++
  return dem
}

const c = new pg.Client({ connectionString: URL_DOC, options: "-c default_transaction_read_only=on" })
await c.connect()
const { rows } = await c.query(`SELECT DISTINCT payload->>'project_id' AS id, payload->>'project_name' AS ten, payload->>'project_code' AS ma FROM public.stg_s08_inventory`)
const { rows: [{ n: soDuAn }] } = await c.query(`SELECT count(DISTINCT project_id)::int AS n FROM public.stg_s08_inventory`)
await c.end()

const tatCa = new Set(rows.map((r) => boHauTo(r.ten)).filter(Boolean))
const moiId = new Set(rows.map((r) => r.id))
// Hậu tố gộp vài tên về một (05/11: 150 dự án, 143 tên), nên đòi đủ mã, không dòng nào thiếu tên, và tập tên không teo.
kiem(moiId.size === soDuAn && rows.every((r) => r.ten) && tatCa.size >= soDuAn * 0.9, `tap ten s08 bang so du an ${soDuAn}, ${tatCa.size} ten sau chuan hoa`, `loi tap ten ${tatCa.size}, ma ${moiId.size}, du an ${soDuAn}`)
// Miễn trừ khai trước: tên ngắn dễ khớp nhầm, và tên đã có trong migration công khai trước vòng này.
const migCu = chuan(git("ls-tree", "-r", "--name-only", GOC, "db/migrations").trim().split("\n").map((f) => git("show", `${GOC}:${f}`)).join("\n"))
const canQuet = new Set([...tatCa].filter((t) => t.length >= 6 && !migCu.includes(t)))
console.log(`quet ${canQuet.size}/${tatCa.size} ten`)

// Kho
const nhac = git("grep", "-l", "s08_project_links", "--", ".", ":(exclude)_acceptance", ":(exclude)docs").trim().split("\n").sort()
const CHO_PHEP = ["db/migrations/074_noi_du_an_s08.sql", "pipeline/mappings.yaml", "pipeline/noi-du-an-s08.mjs"]
kiem(JSON.stringify(nhac) === JSON.stringify(CHO_PHEP), "chi ba tep nhac bang", `loi tep nhac bang: ${nhac.length}`)
const { FILL } = await import(pathToFileURL(path.join(ROOT, "pipeline/sync-cloud.mjs")).href)
const dongSync = (ds) => JSON.stringify(ds).includes("s08_project_links")
kiem(!dongSync(FILL), "bang khong trong danh sach sync")
kiem(dongSync([...FILL, "s08_project_links"]), "doi chung: them bang vao danh sach sync bi bat")
kiem(spawnSync("git", ["-C", path.dirname(TEP_BANG), "check-ignore", "-q", TEP_BANG]).status === 0, "tep bang noi bi git bo qua")

const coso = git("merge-base", "HEAD", "origin/main").trim()
const themDiff = git("diff", "-U0", coso, "HEAD", "--", ".", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n")
const hoSo = git("ls-files", `_acceptance/${SLUG}`).trim().split("\n").filter(Boolean).filter((f) => fs.existsSync(path.join(ROOT, f)) && !f.endsWith(".png")).map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n")
const soTrung = quetTen(`${themDiff}\n${hoSo}`, canQuet)
kiem(soTrung === 0, "diff va ho so khong co ten s08", `loi ${soTrung} ten s08 trong diff hoac ho so`)
// Mã: số dự án chỉ khớp khi đứng sau khoá project_id ở mọi khuôn (JSON, bảng, CSV), vì số trần trùng ngẫu nhiên; mã chữ khớp đúng hoa thường, từ 4 ký tự, trừ mã đã có trong migration trước vòng.
const migGoc = git("ls-tree", "-r", "--name-only", GOC, "db/migrations").trim().split("\n").map((f) => git("show", `${GOC}:${f}`)).join("\n")
const maChu = new Set(rows.map((r) => r.ma).filter((m) => m && m.length >= 4 && !migGoc.includes(m)))
const SO_SAU_KHOA = /project_id["'\s]*[:=|,]\s*["']?(\d+)/g
const soThat = (chu) => [...chu.matchAll(SO_SAU_KHOA)].filter((m) => moiId.has(m[1])).length
export const quetMa = (chu) => soThat(chu) + [...maChu].filter((m) => new RegExp(`(?<![\\p{L}\\p{N}_])${thoat(m)}(?![\\p{L}\\p{N}_])`, "u").test(chu)).length
const soMa = quetMa(`${themDiff}\n${hoSo}`)
kiem(soMa === 0, `diff va ho so khong co ma s08, quet ${maChu.size} ma chu`, `loi ${soMa} ma s08 trong diff hoac ho so`)
const mauMa = [...maChu][0]
const mauSo = [...moiId][0]
kiem(quetMa(`| project_id | ${mauSo} |`) === 1 && quetMa(`project_id: ${mauSo}`) === 1 && quetMa(`"project_id": "${mauSo}"`) === 1 && quetMa(`dong co ${mauMa} o day`) === 1 && quetMa("dong lanh, project_id: 0") === 0, "doi chung: dong co ma bi bat", "loi doi chung: khong bat duoc ma")
const mauTen = [...canQuet][0]
kiem(quetTen(`dong co ${mauTen.toUpperCase()} o day`, canQuet) >= 1, "doi chung: dong co ten bi bat", "loi doi chung: khong bat duoc ten")
kiem(quetTen("dong khong co gi", canQuet) === 0, "doi chung: dong lanh khong bi bat")

// Đầu ra lệnh: nhánh lành và nhánh lỗi, kết nối chỉ đọc qua PGOPTIONS
const env = { ...process.env, DATABASE_URL: URL_DOC, PGOPTIONS: "-c default_transaction_read_only=on" }
const THU_MUC = path.join(ROOT, ".acceptance-runs", SLUG, `kin-${process.pid}`)
fs.mkdirSync(THU_MUC, { recursive: true })
const bang = JSON.parse(fs.readFileSync(TEP_BANG, "utf8"))
const mau = [
  ["lanh", bang, "thu: khong ghi", 0],
  ["bang-rong", { ...bang, noi: [] }, "loi: bang-rong", 1],
  ["project-id-la", { ...bang, noi: [{ ...bang.noi[0], project_id: "khong-co" }, ...bang.noi.slice(1)] }, "loi: project-id-la", 1],
  ["ung-vien", { ...bang, noi: bang.noi.slice(1) }, "loi: ung-vien-bi-sot", 1],
]
const dauRa = mau.map(([k, b, cho, thoatMa]) => {
  const f = path.join(THU_MUC, `${k}.json`)
  fs.writeFileSync(f, JSON.stringify(b))
  const r = spawnSync("node", [LENH, "--tep", f, "--thu"], { cwd: ROOT, env, encoding: "utf8" })
  kiem(r.status === thoatMa && r.stdout.includes(cho), `nhanh ${k} chay toi noi`, `loi nhanh ${k}: thoat ${r.status}`)
  return r.stdout + r.stderr
}).join("\n")
fs.rmSync(THU_MUC, { recursive: true, force: true })
kiem(quetTen(dauRa, tatCa) === 0, "dau ra lenh khong co ten", "loi dau ra co ten s08")
const biSo = (chu) => chu.replace(/noi \d+ · chua_noi \d+/g, "").replace(/"[^"]+":\d+/g, "")
const moiMa = [...moiId, ...rows.map((r) => r.ma).filter(Boolean)]
const coMaRa = (chu) => moiMa.filter((m) => new RegExp(`(?<![\\p{L}\\p{N}_.])${thoat(m)}(?![\\p{L}\\p{N}_.])`, "u").test(biSo(chu))).length
const maTrongRa = coMaRa(dauRa)
kiem(maTrongRa === 0, `dau ra lenh khong co ma, quet ${moiMa.length} ma`, `loi dau ra co ${maTrongRa} ma`)
kiem(coMaRa(`loi: ${[...moiId][0]}`) === 1, "doi chung: dau ra co ma bi bat", "loi doi chung: khong bat duoc ma o dau ra")
if (loi.length) process.exit(1)
console.log("KIN OK")
