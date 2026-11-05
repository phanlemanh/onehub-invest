// AC-6 (E8) của ghi-nhan-chan-dong-trung-cum. Chỉ đọc DB oneinvest, trừ đối chứng bộ đếm ở lược đồ thử gtc_dc_<pid> (xoá ngay).
// Không in tên nguồn hay chữ bài. Mỗi phép đo có đối chứng đỏ trên cùng bộ kiểm.
import { execFileSync, spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(join(ROOT, "app/package.json"))("pg")
const { localDbUrl } = await import(join(ROOT, "pipeline/scripts/capture-ops-facts.mjs"))
let loi = 0
const kiem = (dk, ok, sai) => { if (dk) console.log(`ok ${ok}`); else { console.log(sai); loi = 1 } }
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })
console.log(`root ${ROOT} sha ${git("rev-parse", "HEAD").trim()}`)

// 1. Tệp được phép đổi (so với merge-base, gồm cây làm việc và tệp chưa theo dõi).
const coso = git("merge-base", "HEAD", "origin/main").trim()
const DUOC = [
  /^app\/src\/lib\/labels-queries\.ts$/, /^app\/src\/lib\/labels-normalize\.ts$/, /^CONTEXT\.md$/, /^app\/tests\/labels-trung-cum\.test\.tsx$/,
  /^_acceptance\/config\.yaml$/, /^_acceptance\/ghi-nhan-chan-dong-trung-cum\//, /^docs\//, /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/,
]
const ngoai = (ds) => ds.filter((f) => !DUOC.some((r) => r.test(f)))
const tepDoi = [...new Set([...git("diff", "--name-only", coso).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean))]
kiem(tepDoi.includes("app/src/lib/labels-queries.ts") && ngoai(tepDoi).length === 0, "chi tep duoc phep doi", `loi tep ngoai danh sach: ${ngoai(tepDoi).join(", ")}`)
kiem(ngoai([...tepDoi, "app/src/app/ops/labels/page.tsx"]).length === 1, "doi chung: tep ngoai danh sach bi bat", "loi doi chung tep ngoai danh sach")

// 2. Thuật ngữ «Dòng trùng cụm» kèm code trong CONTEXT.md.
const coThuatNgu = (chu) => /\*\*Dòng trùng cụm\*\*:[^\n]+\n- Code: `ghep\.trung_voi`/.test(chu)
const ctx = readFileSync(join(ROOT, "CONTEXT.md"), "utf8")
kiem(coThuatNgu(ctx), "thuat ngu", "loi CONTEXT.md thieu muc Dong trung cum")
kiem(!coThuatNgu(ctx.replace(/\*\*Dòng trùng cụm\*\*:[^\n]+\n- Code:[^\n]+\n/, "")), "doi chung: thieu thuat ngu bi bat", "loi doi chung thuat ngu")

// 3. Không tên nguồn thật trong dòng thêm (tên lấy từ source_registry local, không in).
const that = new pg.Client({ connectionString: localDbUrl(), options: "-c default_transaction_read_only=on" })
await that.connect()
const { rows: reg } = await that.query(`SELECT string_agg(distinct x, ' ') AS s FROM source_registry r, LATERAL (SELECT r.real_name AS x UNION ALL SELECT unnest(r.source_ids)) q`)
await that.end()
const tu = (reg[0].s ?? "").toLowerCase().split(/\s+/).filter(Boolean)
const mien = new Set(tu.filter((t) => t.includes(".")))
const tenTran = new Set(tu.filter((t) => !t.includes(".") && t.length >= 4 && /^\p{L}+$/u.test(t)))
const nhanRe = (m) => m.replace(/\./g, "\\.")
const quet = (chu) => [...mien].filter((m) => new RegExp(`(?<![a-z0-9-])${nhanRe(m)}(?![a-z0-9-])`).test(chu)).length
  + [...tenTran].filter((m) => new RegExp(`(?<![\\p{L}\\p{N}_/.-])${m}(?![\\p{L}\\p{N}_-])`, "u").test(chu)).length
const them = git("diff", "-U0", coso, "--", ".", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n").toLowerCase()
kiem(mien.size + tenTran.size > 0 && them.length > 1000 && quet(them) === 0, "khong ten nguon that", `loi ${quet(them)} ten trong dong them, dai ${them.length}`)
const mau = [...mien][0] ?? [...tenTran][0]
kiem(quet(`dong them co ${mau} day`) >= 1, "doi chung: ten nguon bi bat", "loi doi chung ten nguon")

// 4. Bảng nhãn ở public không có lượt ghi nào khi chạy test (bộ đếm pg_stat_user_tables, không phải số dòng).
const BANG = ["eval_labels", "eval_label_items", "eval_label_reasons"]
const db = new pg.Client({ connectionString: localDbUrl() })
await db.connect()
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const demBang = async (schema, bang) => {
  await db.query("SELECT pg_stat_clear_snapshot()")
  const { rows } = await db.query(
    `SELECT relname, n_tup_ins::int + n_tup_upd::int + n_tup_del::int AS n FROM pg_stat_user_tables WHERE schemaname = $1 AND relname = ANY($2) ORDER BY relname`,
    [schema, bang])
  return Object.fromEntries(rows.map((r) => [r.relname, r.n]))
}
// Đối chứng dương trước: một UPDATE và một cặp INSERT, DELETE ở lược đồ thử làm bộ đếm tăng.
const DC = `gtc_dc_${process.pid}`
try {
  await db.query(`CREATE SCHEMA "${DC}"`)
  await db.query(`CREATE TABLE "${DC}".eval_labels (id int, v text)`)
  await db.query(`INSERT INTO "${DC}".eval_labels VALUES (1, 'a')`)
  await ngu(1500)
  const dcTruoc = await demBang(DC, ["eval_labels"])
  await db.query(`UPDATE "${DC}".eval_labels SET v = 'b'`)
  await db.query(`INSERT INTO "${DC}".eval_labels VALUES (2, 'c')`)
  await db.query(`DELETE FROM "${DC}".eval_labels WHERE id = 2`)
  await db.query("SELECT pg_stat_force_next_flush()").catch(() => {})
  await ngu(1500)
  const dcSau = await demBang(DC, ["eval_labels"])
  kiem(dcSau.eval_labels - dcTruoc.eval_labels >= 3, "doi chung: bo dem bat update va insert-delete", `loi bo dem khong tang ${dcTruoc.eval_labels} -> ${dcSau.eval_labels}`)
} finally {
  await db.query(`DROP SCHEMA IF EXISTS "${DC}" CASCADE`)
}
const truoc = await demBang("public", BANG)
const chay = spawnSync("node", ["--import", "tsx", "--test", "tests/labels-trung-cum.test.tsx"], { cwd: join(ROOT, "app"), encoding: "utf8" })
await ngu(1500)
const sau = await demBang("public", BANG)
await db.end()
kiem(chay.status === 0 && Object.keys(truoc).length === BANG.length && JSON.stringify(truoc) === JSON.stringify(sau), "public khong ghi",
  `loi test ${chay.status} hoac public bi ghi ${JSON.stringify(truoc)} -> ${JSON.stringify(sau)}`)
process.exit(loi)
