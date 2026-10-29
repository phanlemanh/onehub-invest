// AC-1..AC-3 (rao-db-local-do-nen): chạy do.mjs thật trong tiến trình con với DATABASE_URL ngoài máy (.invalid, TEST-NET-3,
// ?host= ghi đè) → phải chặn bằng thông điệp của rào; với localhost/127.0.0.1/postgresql ở cổng không có DB → rào cho qua
// (ECONNREFUSED). Soát thứ tự trên mã đã bỏ comment, và hai bản chép đột biến cùng thư mục (bỏ rào · chèn Pool trước rào).
// Không ca nào chạm DB thật: ngoài máy bị chặn trước khi kết nối, local đi cổng 1 không có gì nghe.
import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const DO = path.join(ROOT, "scripts/do-nen-hieu-nang/do.mjs")
const sha = spawnSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim()
console.log(`root ${ROOT} sha ${sha}`)

const RAO_NGOAI = "chỉ chạy trên Postgres local"
const RAO_GHI_DE = "ghi đè host"
const coRao = (s) => s.includes(RAO_NGOAI) || s.includes(RAO_GHI_DE)
const chay = (tep, url) => {
  const t0 = Date.now()
  const r = spawnSync(process.execPath, [tep, "--luot", "1"], { cwd: ROOT, encoding: "utf8", timeout: 20_000, env: { ...process.env, DATABASE_URL: url } })
  return { code: r.status, err: `${r.stderr ?? ""}${r.stdout ?? ""}`, ms: Date.now() - t0 }
}
let bad = 0

// AC-1: ba hình dạng ngoài máy.
for (const [nhan, url, thongDiep] of [
  ["ten-mien", "postgres://db.example.invalid:5432/x", RAO_NGOAI],
  ["ip", "postgres://203.0.113.1:5432/x", RAO_NGOAI],
  ["ghi-de-host", "postgres://localhost:5433/x?host=db.example.invalid", RAO_GHI_DE],
]) {
  const r = chay(DO, url)
  if (r.code === 0 || r.code === null) { console.log(`KHONG CHAN ${nhan}: thoat ${r.code}`); bad = 1 }
  else if (!r.err.includes(thongDiep)) { console.log(`SAI THONG DIEP ${nhan}: ${r.err.split("\n").find((l) => /Error/.test(l)) ?? r.err.slice(0, 160)}`); bad = 1 }
  else if (r.ms >= 5000) { console.log(`QUA CHAM ${nhan}: ${r.ms} ms`); bad = 1 }
  else console.log(`ok ngoai may ${nhan}: chan (${r.ms} ms)`)
}

// AC-2: ba dạng local, cổng 1 không có DB → rào cho qua, lỗi là ECONNREFUSED.
for (const [nhan, url] of [["localhost", "postgres://localhost:1/x"], ["127.0.0.1", "postgres://127.0.0.1:1/x"], ["postgresql", "postgresql://localhost:1/x"]]) {
  const r = chay(DO, url)
  if (coRao(r.err)) { console.log(`RAO CHAN NHAM LOCAL ${nhan}`); bad = 1 }
  else if (!r.err.includes("ECONNREFUSED")) { console.log(`LOCAL KHONG RA ECONNREFUSED ${nhan}: thoat ${r.code}`); bad = 1 }
  else console.log(`ok local ${nhan}: rao cho qua (ECONNREFUSED)`)
}

// AC-3: soát thứ tự trên mã đã bỏ comment. Mốc = mọi chỗ mở kết nối + mọi lệnh ghi.
const boComment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1")).join("\n")
const MOC = [/new\s+pg\.Client\b/, /new\s+pg\.Pool\b/, /new\s+Client\b/, /new\s+Pool\b/, /\.connect\(/, /ensureAccount\(/, /pg_stat_statements_reset/, /CREATE EXTENSION/]
const soat = (ma) => {
  const s = boComment(ma)
  const rao = s.search(/assertLocalDatabaseUrl\(\s*DB_URL\s*\)/)
  if (rao < 0) return { ok: false, ly_do: "khong thay loi goi assertLocalDatabaseUrl(DB_URL)" }
  const truoc = MOC.filter((m) => { const i = s.search(m); return i >= 0 && i < rao }).map(String)
  const k = MOC.filter((m) => s.search(m) >= 0).length
  return truoc.length ? { ok: false, ly_do: `moc dung truoc rao: ${truoc.join(", ")}` } : { ok: true, k }
}
const goc = readFileSync(DO, "utf8")
const t = soat(goc)
if (t.ok) console.log(`ok thu tu: rao truoc moi ket noi va lenh ghi (${t.k} moc, da bo comment)`)
else { console.log(`THU TU SAI: ${t.ly_do}`); bad = 1 }

// Đột biến (a): bỏ dòng rào → chạy với tên miền ngoài phải tới bước kết nối (ENOTFOUND) và không còn thông điệp rào.
const dongRao = goc.split("\n").filter((l) => /^\s*assertLocalDatabaseUrl\(\s*DB_URL\s*\)/.test(l))
const tamA = path.join(path.dirname(DO), `.do-bo-rao-${process.pid}.mjs`)
const tamB = path.join(path.dirname(DO), `.do-pool-truoc-${process.pid}.mjs`)
try {
  if (dongRao.length !== 1) { console.log(`CA KHONG DO: can dung 1 dong goi rao rieng, thay ${dongRao.length}`); bad = 1 }
  else {
    writeFileSync(tamA, goc.replace(dongRao[0] + "\n", ""))
    const r = chay(tamA, "postgres://db.example.invalid:5432/x")
    if (coRao(r.err) || !/ENOTFOUND|getaddrinfo/.test(r.err)) { console.log(`DOT BIEN KHONG AP DUOC (bo rao): ${r.err.split("\n").find((l) => /Error/.test(l)) ?? `thoat ${r.code}`}`); bad = 1 }
    else console.log(`ban bo rao: do RAO VANG (${path.basename(tamA)}, ENOTFOUND)`)
    // Đột biến (b): chèn new pg.Pool( phía trên dòng rào → soát thứ tự phải đỏ.
    const maB = goc.replace(dongRao[0], `const _thu = new pg.Pool({ connectionString: DB_URL })\n${dongRao[0]}`)
    writeFileSync(tamB, maB)
    const tb = soat(readFileSync(tamB, "utf8"))
    if (!tb.ok && /Pool/.test(tb.ly_do)) console.log("ban chen Pool truoc rao: do THU TU SAI")
    else { console.log(`DOT BIEN KHONG AP DUOC (chen Pool): ${tb.ok ? "soat van xanh" : tb.ly_do}`); bad = 1 }
  }
} finally { rmSync(tamA, { force: true }); rmSync(tamB, { force: true }) }

if (!bad) console.log("RAO OK")
process.exit(bad)
