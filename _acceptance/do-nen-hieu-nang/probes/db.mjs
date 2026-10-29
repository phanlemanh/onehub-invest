// AC-1: cấu hình DB sau khởi động lại; bản sao lưu đúng đường + sha256 ghi trong design doc, pg_restore đọc được; compose không đổi.
// Chiều đỏ: cùng phép so sha với một chuỗi sha sai (đổi một ký tự) → «BAM SAO LUU LECH».
import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" })
console.log(`root ${ROOT} sha ${git("rev-parse", "HEAD").trim()}`)
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
let bad = 0
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" }); await c.connect()
const cfg = Object.fromEntries((await c.query("select name, setting from pg_settings where name in ('max_connections','shared_preload_libraries')")).rows.map((r) => [r.name, r.setting]))
const ext = (await c.query("select 1 from pg_extension where extname='pg_stat_statements'")).rowCount
await c.end()
const pre = String(cfg.shared_preload_libraries).split(",").map((s) => s.trim())
if (cfg.max_connections === "200" && pre.includes("pg_cron") && pre.includes("pg_stat_statements") && ext === 1) console.log("ok cau hinh: max_connections 200, preload pg_cron + pg_stat_statements, extension co")
else { console.log(`CAU HINH SAI: ${JSON.stringify(cfg)} extension ${ext}`); bad = 1 }
const dd = readFileSync(path.join(ROOT, "docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md"), "utf8")
const duong = /`~\/dev\/onehub-invest\/(research-local\/[^`]+\.dump)`/.exec(dd)?.[1]
const shaGhi = /sha256\s*`([0-9a-f]{64})`/.exec(dd)?.[1]
const tep = duong && path.join(process.env.HOME, "dev/onehub-invest", duong)
const khop = (ghi) => { const h = createHash("sha256").update(readFileSync(tep)).digest("hex"); return h === ghi }
if (!tep || !shaGhi || !existsSync(tep)) { console.log(`SAO LUU: thiếu đường/sha trong design doc hoặc tệp không có (${duong})`); bad = 1 }
else {
  const r = spawnSync("docker", ["exec", "-i", "one-invest-db", "pg_restore", "-l"], { input: readFileSync(tep), encoding: "utf8", maxBuffer: 64 * 2 ** 20 })
  const n = (r.stdout.match(/TABLE DATA/g) ?? []).length
  if (khop(shaGhi) && n >= 285) console.log(`ok sao luu: ${readFileSync(tep).length} byte, sha256 khop design doc, pg_restore -l ${n} muc`)
  else { console.log(`SAO LUU: sha khớp ${khop(shaGhi)}, pg_restore -l ${n} mục`); bad = 1 }
  const sai = shaGhi.slice(0, -1) + (shaGhi.endsWith("0") ? "1" : "0")
  if (!khop(sai)) console.log("ban sha sai: do, thong diep ghim co (BAM SAO LUU LECH)"); else { console.log("CA KHONG DO (sha sai van khop)"); bad = 1 }
}
const base = git("merge-base", "origin/main", "HEAD").trim()
if (git("diff", "--name-only", base, "HEAD", "--", "db/docker-compose.yml").trim() === "") console.log("ok docker-compose.yml khong doi")
else { console.log("COMPOSE BI DOI"); bad = 1 }
if (!bad) console.log("DB OK")
process.exit(bad)
