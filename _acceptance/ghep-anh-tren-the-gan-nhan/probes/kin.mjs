// kin.mjs — E12. Tên nguồn thật, tên miền không vào kho hay hồ sơ; bảng đọc tay không có chữ bài; fixture chỉ example.test; làn thu không đổi. Báo bằng số, không in tên.
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { ROOT, SERVER, banGhiKiem, pg } from "./_db.mjs"

const { loi, kiem } = banGhiKiem()
const SLUG = "ghep-anh-tren-the-gan-nhan"
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })
const c = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await c.connect()
const { rows: urls } = await c.query(`SELECT DISTINCT substring(media_url from 'https?://([^/]+)') AS h FROM media WHERE media_url IS NOT NULL`)
const { rows: reg } = await c.query(`SELECT string_agg(distinct x, ' ') AS s FROM source_registry r, LATERAL (SELECT r.real_name AS x UNION ALL SELECT unnest(r.source_ids)) q`)
await c.end()
const mien = new Set()
for (const { h } of urls) if (h) { const d = h.toLowerCase().split("."); mien.add(d.slice(-2).join(".")); if (d.at(-2)?.length <= 3) mien.add(d.slice(-3).join(".")) }
const tu = (reg[0].s ?? "").toLowerCase().split(/\s+/)
const tuSo = tu.filter((t) => t.includes("."))
for (const t of tuSo) mien.add(t)
const tenTran = new Set(tu.filter((t) => !t.includes(".") && t.length >= 4 && /^\p{L}+$/u.test(t)))
mien.delete("com.vn"); mien.delete("example.test")
kiem(urls.length > 0 && tuSo.length > 0 && tenTran.size > 0, `ca ba nguon cua tap ten khac rong: media ${urls.length}, ten mien so ${tuSo.length}, ten tran ${tenTran.size}`, "loi mot nguon cua tap ten rong")
const nhan = (m) => m.replace(/\./g, "\\.")
// Trước tên miền được là dấu chấm: bắt cả tên miền con. Tên trần không dính đường dẫn hay mã (zalo-media, stg_zalo_posts là tên mã có sẵn).
// Tham số kênh của `loadStgPosts` là tên mã có sẵn, không phải chữ hiện.
const boTenMa = (chu) => chu.replace(/loadstgposts\([^)]*\)/g, "")
const quet = (goc) => { const chu = boTenMa(goc); return [...mien].filter((m) => new RegExp(`(?<![a-z0-9-])${nhan(m)}(?![a-z0-9-])`).test(chu)).length
  + [...tenTran].filter((m) => new RegExp(`(?<![\\p{L}\\p{N}_/.-])${m}(?![\\p{L}\\p{N}_-])`, "u").test(chu)).length }
const coso = git("merge-base", "HEAD", "origin/main").trim()
const them = git("diff", "-U0", coso, "HEAD", "--", ".", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n").toLowerCase()
kiem(quet(them) === 0, "dong them khong co ten nguon", `loi ${quet(them)} ten trong dong them`)
const goc = path.join(ROOT, "_acceptance", SLUG)
const tepHoSo = []
const di = (d) => { for (const t of fs.readdirSync(d)) { const p = path.join(d, t); if (fs.statSync(p).isDirectory()) di(p); else tepHoSo.push(p) } }
di(goc)
const laAnh = (p) => /\.(png|jpe?g|webp)$/i.test(p)
const chuHoSo = tepHoSo.filter((p) => !laAnh(p)).map((p) => fs.readFileSync(p, "utf8")).join("\n").toLowerCase()
kiem(quet(chuHoSo) === 0, "ho so khong co ten nguon", `loi ${quet(chuHoSo)} ten trong ho so`)
console.log(`anh chung khong quet duoc ${tepHoSo.filter(laAnh).length} tep`)
const mau1 = [...mien][0], ten1 = [...tenTran][0]
const moiDang = [`https://cdn.${mau1}/x`, `www.${mau1}`, `abc.${mau1}/x`, `${mau1}/x`, `dang ${ten1} day`, `${ten1}.me/09`]
kiem(moiDang.every((d) => quet(`dong co ${d}`) >= 1), "doi chung: moi dang ten bi bat", "loi doi chung: mot dang ten lot")
kiem(quet("dong lanh example.test, tep /api/x-media") === 0, "doi chung: dong lanh khong bi bat")
const dt = JSON.parse(fs.readFileSync(path.join(goc, "probes/doc-tay.json"), "utf8"))
const KHOA = new Set(["item", "tang", "ket", "ly_do"]), KET = new Set(["dung", "sai", "khong-phan", "khong-tep"])
const lanh = dt.cum.every((x) => Object.keys(x).every((k) => KHOA.has(k)) && KET.has(x.ket) && (x.ly_do ?? "").length <= 90 && !/\d{6,}|https?:/.test(x.ly_do ?? ""))
kiem(lanh && quet(JSON.stringify(dt).toLowerCase()) === 0, "doc tay khong co chu", "loi bang doc tay co chu bai")
const tepMoi = ["seed.mjs", "nap.mjs"].map((f) => fs.readFileSync(path.join(goc, "probes", f), "utf8")).concat(["app/tests/labels-ghep.test.ts", "pipeline/scripts/label-ghep.test.mjs"].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"))).join("\n")
const tenMayLa = (chu) => [...chu.matchAll(/https?:\/\/([a-z0-9.-]+)|(?<![a-z0-9@.-])((?:[a-z0-9-]+\.)+(?:vn|com|net|org|me|link|ly|io|info|biz))(?![a-z0-9-])/gi)].map((m) => (m[1] ?? m[2]).toLowerCase()).filter((h) => !h.endsWith("example.test") && h !== "localhost" && h !== "www.w3.org")
kiem(tenMayLa(tepMoi).length === 0, "fixture chi example.test", `loi fixture co ${tenMayLa(tepMoi).length} ten may khac`)
kiem(tenMayLa("Xem cdn.that.com/a").length === 1 && tenMayLa("https://that.vn/a").length === 1, "doi chung: fixture co ten mien khac bi bat", "loi doi chung fixture")
const doi = git("diff", "--name-only", coso, "HEAD").split("\n").filter((f) => /^collector\/|^\.claude\/hooks\/|^\.claude\/settings/.test(f))
kiem(doi.length === 0, "collector hook khong doi", `loi lan thu doi ${doi.length} tep`)
if (loi.length) process.exit(1)
console.log("KIN OK")
process.exit(0)
