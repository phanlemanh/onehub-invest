// doi-chieu.mjs — Đường đo ngưỡng nghiệm thu so-cuoc-goi-ai (Hỏi-4): N ngày gần nhất, đếm lượt runAgent theo trace
// (agent/traces/*--<việc>.jsonl, ngày giờ VN) và tổng token của dòng `final`, so với số dòng + tổng token của ai_calls theo
// việc × ngày (DATABASE_URL — sau khi gộp và áp 052 là DB máy thu). Lệch 0 → «DOI CHIEU OK».
//   node _acceptance/so-cuoc-goi-ai/probes/doi-chieu.mjs --ngay 7
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { ROOT, pg } from "./_db.mjs"
import { ngayVN } from "../../../pipeline/lib/ai-calls.mjs"
const N = Number(process.argv[process.argv.indexOf("--ngay") + 1] || 7)
const tu = Date.now() - N * 86400e3
const dir = path.join(ROOT, "agent/traces")
const trace = new Map()
for (const f of (() => { try { return readdirSync(dir) } catch { return [] } })()) {
  const m = f.match(/--(.+)\.jsonl$/)
  if (!m) continue
  const dong = readFileSync(path.join(dir, f), "utf8").trim().split("\n").map((l) => JSON.parse(l))
  const dau = dong[0]
  if (!dau || Date.parse(dau.t) < tu) continue
  const fin = dong.find((d) => d.type === "final")
  const k = `${ngayVN(dau.t)}|${m[1]}`
  const v = trace.get(k) ?? { luot: 0, token: 0 }
  v.luot++
  v.token += (fin?.data?.usage?.inputTokens ?? 0) + (fin?.data?.usage?.outputTokens ?? 0)
  trace.set(k, v)
}
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" })
await c.connect()
const { rows } = await c.query(
  `select (at at time zone 'Asia/Ho_Chi_Minh')::date::text as ngay, viec, count(*)::int as luot,
          coalesce(sum(coalesce(input_tokens,0) + coalesce(output_tokens,0)),0)::int as token
   from ai_calls where at >= to_timestamp($1 / 1000.0) group by 1, 2`, [tu])
await c.end()
const so = new Map(rows.map((r) => [`${r.ngay}|${r.viec}`, { luot: r.luot, token: r.token }]))
let lech = 0
for (const k of new Set([...trace.keys(), ...so.keys()])) {
  const a = trace.get(k) ?? { luot: 0, token: 0 }, b = so.get(k) ?? { luot: 0, token: 0 }
  const ok = a.luot === b.luot && a.token === b.token
  if (!ok) lech++
  console.log(`${ok ? "ok" : "LECH"} ${k}: trace ${a.luot} luot/${a.token} token · so ${b.luot} luot/${b.token} token`)
}
console.log(lech ? `DOI CHIEU LECH: ${lech} nhom` : "DOI CHIEU OK")
process.exit(lech ? 1 : 0)
