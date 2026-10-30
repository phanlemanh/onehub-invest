// AC-1 (so-cuoc-goi-ai): áp db/migrations/052_ai_calls.sql HAI lần lên một lược đồ tạm trong giao dịch ROLLBACK (DB_URL,
// mặc định DB local; lượt chấm trỏ DB thử). Kiểm 10 cột của ai_calls, giá qwen local = 0, lần hai không nhân đôi dòng giá.
// Chiều đỏ: bản chép migration bỏ cột latency_ms → «THIEU COT latency_ms». Không chạm bảng thật.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const sha = spawnSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim()
console.log(`root ${ROOT} sha ${sha}`)
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const SQL = readFileSync(path.join(ROOT, "db/migrations/052_ai_calls.sql"), "utf8")
const COT = ["id", "at", "khach", "viec", "model", "input_tokens", "output_tokens", "latency_ms", "ok", "loi", "trace"].filter((c) => c !== "id")

/** Áp `sql` hai lần trên lược đồ tạm; trả danh sách lỗi (chuỗi ghim) — rỗng nghĩa là đạt. */
async function kiem(sql, nhan) {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  const loi = []
  const schema = `sca_tam_${process.pid}_${nhan}`
  try {
    await c.query("BEGIN")
    await c.query(`CREATE SCHEMA ${schema}`)
    await c.query(`SET LOCAL search_path TO ${schema}`)
    await c.query(sql)
    await c.query(sql) // lần hai: idempotent
    const cot = (await c.query("select column_name from information_schema.columns where table_schema = $1 and table_name = 'ai_calls'", [schema])).rows.map((r) => r.column_name)
    for (const k of COT) if (!cot.includes(k)) loi.push(`THIEU COT ${k}`)
    const gia = (await c.query("select gia_vao::float as v, gia_ra::float as r from ai_model_prices where model = 'qwen3.8-27b-local'")).rows
    if (gia.length !== 1) loi.push(gia.length > 1 ? "NHAN DOI GIA" : "THIEU GIA QWEN")
    else if (gia[0].v !== 0 || gia[0].r !== 0) loi.push("GIA QWEN KHAC 0")
    if (!loi.length) {
      console.log(`ok bang ai_calls: ${COT.length} cot`)
      console.log("ok bang ai_model_prices: gia qwen3.8-27b-local = 0")
      console.log("ok ap lan hai: khong loi, 1 dong gia")
    }
  } catch (e) {
    loi.push(`AP LOI: ${e.message}`)
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
  return loi
}

let bad = 0
const that = await kiem(SQL, "that")
for (const l of that) { console.log(l); bad = 1 }

// Chiều đỏ: bỏ dòng cột latency_ms (và CHECK đi kèm trên cùng dòng) khỏi bản chép.
const dotBien = SQL.split("\n").filter((l) => !/^\s*latency_ms\s/.test(l)).join("\n")
if (dotBien === SQL) { console.log("CA KHONG DO: dot bien khong ap duoc"); bad = 1 }
else {
  const r = await kiem(dotBien, "dot_bien")
  if (r.includes("THIEU COT latency_ms")) console.log("ban bo cot latency_ms: do THIEU COT latency_ms")
  else { console.log(`CA KHONG DO: ban dot bien ra ${JSON.stringify(r)}`); bad = 1 }
}
if (!bad) console.log("MIGRATION OK")
process.exit(bad)
