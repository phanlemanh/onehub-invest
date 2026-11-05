// kin.mjs — E7. Tên miền nguồn không vào kho hay ảnh chứng; fixture chỉ example.test; mẫu đã sinh không đổi. Báo bằng số, không in tên miền.
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import { ROOT, SERVER, banGhiKiem, pg } from "./_db.mjs"

const { loi, kiem } = banGhiKiem()
const SLUG = "anh-tren-the-gan-nhan"
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })
const c = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await c.connect()
const { rows: urls } = await c.query(`SELECT DISTINCT substring(media_url from 'https?://([^/]+)') AS h FROM media WHERE media_url IS NOT NULL`)
const { rows: mau } = await c.query(`SELECT item_id, ref_id, text_hash, stratum FROM eval_label_items WHERE lat = 's03-theo-nhom' ORDER BY item_id`)
const { rows: reg } = await c.query(`SELECT string_agg(distinct x, ' ') AS s FROM source_registry r, LATERAL (SELECT r.real_name AS x UNION ALL SELECT unnest(r.source_ids)) q`).catch(() => ({ rows: [{ s: "" }] }))
await c.end()
const mien = new Set()
for (const { h } of urls) if (h) { const d = h.toLowerCase().split("."); mien.add(d.slice(-2).join(".")); if (d.at(-2)?.length <= 3) mien.add(d.slice(-3).join(".")) }
for (const t of (reg[0].s ?? "").toLowerCase().split(/\s+/)) if (t.includes(".")) mien.add(t)
mien.delete("com.vn"); mien.delete("example.test")
kiem(mien.size > 0, `tap ten mien khac rong ${mien.size}`, "loi tap ten mien rong")
const coso = git("merge-base", "HEAD", "origin/main").trim()
const them = git("diff", "-U0", coso, "HEAD", "--", ".", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n").toLowerCase()
const quet = (chu) => [...mien].filter((m) => new RegExp(`(?<![a-z0-9.-])${m.replace(/\./g, "\\.")}(?![a-z0-9-])`).test(chu)).length
kiem(quet(them) === 0, "dong them khong co ten mien nguon", `loi ${quet(them)} ten mien trong dong them`)
const goc = path.join(ROOT, "_acceptance", SLUG)
const tepHoSo = []
const di = (d) => { for (const t of fs.readdirSync(d)) { const p = path.join(d, t); if (fs.statSync(p).isDirectory()) di(p); else tepHoSo.push(p) } }
di(goc)
const chuHoSo = tepHoSo.filter((p) => !/\.(png|jpe?g|webp)$/i.test(p)).map((p) => fs.readFileSync(p, "utf8")).join("\n").toLowerCase()
kiem(quet(chuHoSo) === 0, "ho so khong co ten mien nguon", `loi ${quet(chuHoSo)} ten mien trong ho so`)
const tepMoi = ["seed.mjs", "nap.mjs"].map((f) => fs.readFileSync(path.join(goc, "probes", f), "utf8")).concat(fs.readFileSync(path.join(ROOT, "app/tests/labels-anh.test.ts"), "utf8")).join("\n")
const urlFixture = [...tepMoi.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]).filter((h) => !h.endsWith("example.test") && h !== "localhost" && h !== "www.w3.org")
kiem(urlFixture.length === 0, "fixture chi example.test", `loi fixture co ${urlFixture.length} ten may khac`)
kiem(quet("dong co abc." + [...mien][0] + "/x") >= 1 || quet(`dong co ${[...mien][0]}/x`) === 1, "doi chung: dong co ten mien bi bat", "loi doi chung ten mien")
kiem(quet("dong lanh example.test") === 0, "doi chung: dong lanh khong bi bat")
const bam = createHash("sha256").update(JSON.stringify(mau)).digest("hex")
const tepBam = path.join(goc, "probes/mau-bam.txt")
if (process.argv.includes("--ghi-bam")) fs.writeFileSync(tepBam, `${bam} ${mau.length}\n`)
kiem(fs.readFileSync(tepBam, "utf8").trim() === `${bam} ${mau.length}`, `mau da sinh khong doi ${mau.length} dong`, "loi mau da sinh doi so voi luc mo vong")
if (loi.length) process.exit(1)
console.log("KIN OK")
process.exit(0)
