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
const dt = JSON.parse(fs.readFileSync(path.join(ROOT, "_acceptance", SLUG, "probes/doc-tay.json"), "utf8"))
// Chữ của các bài quanh từng mục đọc tay, chỉ giữ trong bộ nhớ để đối chiếu, không in.
const { rows: quanh } = await c.query(`SELECT i.item_id::int AS item, p.text FROM eval_label_items i JOIN stg_zalo_posts b ON b.post_id = i.ref_id
  JOIN stg_zalo_posts p ON p.conversation_id = b.conversation_id AND abs(extract(epoch FROM p.posted_at - b.posted_at)) <= 300 WHERE i.lat = 's03-theo-nhom' AND i.item_id = ANY($1::bigint[])`, [dt.cum.map((x) => x.item)])
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
kiem(them.length > 5000 && quet(them) === 0, "dong them khong co ten nguon", `loi ${quet(them)} ten trong dong them, dai ${them.length}`)
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
const KHOA = new Set(["item", "tang", "ket", "ly_do"]), KET = new Set(["dung", "sai", "khong-phan", "khong-tep"]), TANG = new Set(["mot", "nhieu", "lon"])
const chuanHoa = (s) => s.toLowerCase().normalize("NFC").replace(/\s+/g, " ")
const chuQuanh = new Map()
for (const { item, text } of quanh) chuQuanh.set(item, `${chuQuanh.get(item) ?? ""} ${chuanHoa(text ?? "")}`)
// Bốn từ liền nhau trùng chữ bài quanh mục đó thì coi là chép chữ.
const chepChu = (x) => { const tu4 = chuanHoa(x.ly_do ?? "").split(" "); return tu4.slice(0, -3).some((_, i) => (chuQuanh.get(x.item) ?? "").includes(tu4.slice(i, i + 4).join(" "))) }
const mucLanh = (x) => Object.keys(x).every((k) => KHOA.has(k)) && Number.isInteger(x.item) && chuQuanh.has(x.item) && TANG.has(x.tang) && KET.has(x.ket) && (x.ly_do ?? "").length <= 90 && !/\d{6,}|https?:/.test(x.ly_do ?? "") && !chepChu(x)
kiem(chuQuanh.size === dt.cum.length && dt.cum.every(mucLanh) && quet(JSON.stringify(dt).toLowerCase()) === 0, "doc tay khong co chu", "loi bang doc tay co chu bai")
const mau = dt.cum[0], chuMau = (chuQuanh.get(mau.item) ?? "").trim().split(" ").slice(0, 4).join(" ")
const moiDocTay = [{ ...mau, item: "abc-1234567" }, { ...mau, item: 999999999 }, { ...mau, tang: "Bán căn hộ" }, { ...mau, ly_do: "xem https://x" }, { ...mau, ly_do: "mã 1234567" }, { ...mau, them: "x" }, { ...mau, ly_do: chuMau }]
kiem(chuMau.split(" ").length === 4 && moiDocTay.every((x) => !mucLanh(x)), "doi chung: bang doc tay co ma bai hay chu bai bi bat", `loi doi chung doc tay: lot ${moiDocTay.filter(mucLanh).length}`)
const tepMoi = ["seed.mjs", "nap.mjs"].map((f) => fs.readFileSync(path.join(goc, "probes", f), "utf8")).concat(["app/tests/labels-ghep.test.ts", "pipeline/scripts/label-ghep.test.mjs"].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"))).join("\n")
const tenMayLa = (chu) => [...chu.matchAll(/https?:\/\/([a-z0-9.-]+)|(?<![a-z0-9@.-])((?:[a-z0-9-]+\.)+(?:vn|com|net|org|me|link|ly|io|info|biz))(?![a-z0-9-])/gi)].map((m) => (m[1] ?? m[2]).toLowerCase()).filter((h) => !h.endsWith("example.test") && h !== "localhost" && h !== "www.w3.org")
kiem(tenMayLa(tepMoi).length === 0, "fixture chi example.test", `loi fixture co ${tenMayLa(tepMoi).length} ten may khac`)
kiem(tenMayLa("Xem cdn.that.com/a").length === 1 && tenMayLa("https://that.vn/a").length === 1, "doi chung: fixture co ten mien khac bi bat", "loi doi chung fixture")
const laLanThu = (f) => /^collector\/|^\.claude\/hooks\/|^\.claude\/settings/.test(f)
const tepDoi = git("diff", "--name-only", coso, "HEAD").split("\n").filter(Boolean)
kiem(tepDoi.length > 10 && tepDoi.filter(laLanThu).length === 0, "collector hook khong doi", `loi lan thu doi ${tepDoi.filter(laLanThu).length} tep`)
kiem(["collector/src/a.ts", ".claude/hooks/x.sh"].every(laLanThu) && !laLanThu("pipeline/a.mjs"), "doi chung: tep lan thu bi bat", "loi doi chung lan thu")
if (loi.length) process.exit(1)
console.log("KIN OK")
process.exit(0)
