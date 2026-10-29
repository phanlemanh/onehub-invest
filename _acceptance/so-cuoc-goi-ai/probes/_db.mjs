// _db.mjs — hàm dùng chung của đầu dò so-cuoc-goi-ai: DB thử RỖNG riêng trên server :5433 (không bao giờ là `oneinvest`
// — LUAT đợt: migration chưa gộp không áp lên DB dùng chung), áp 052, mồi dòng `sca-mau-*`.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
export const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
export const SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433"
export const MIGRATION = readFileSync(path.join(ROOT, "db/migrations/052_ai_calls.sql"), "utf8")

/** Dựng lại DB thử rỗng `ten` (DROP + CREATE), áp 052; trả client đã nối. */
export async function dbRong(ten) {
  if (!/^oneinvest_p4_sca_[a-z0-9_]+$/.test(ten)) throw new Error(`tên DB thử sai: ${ten}`)
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS ${ten}`)
  await admin.query(`CREATE DATABASE ${ten}`)
  await admin.end()
  const c = new pg.Client({ connectionString: `${SERVER}/${ten}` })
  await c.connect()
  await c.query(MIGRATION)
  return c
}

export async function xoaDb(ten) {
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS ${ten}`)
  await admin.end()
}

/** Bộ mồi viết trước: hai việc, ba model (giá ≠ 0 · giá 0 · chưa có giá), lượt ok + lỗi, hai ngày. */
export const GIA_MAU = [["sca-mau-dat", 10000, 40000]] // qwen local = 0 đã có trong 052
export function mau(now = Date.now()) {
  const h = (gio) => new Date(now - gio * 3600e3).toISOString()
  return [
    { at: h(2), viec: "sca-mau-judge", model: "sca-mau-dat", input_tokens: 1000, output_tokens: 200, latency_ms: 800, ok: true },
    { at: h(3), viec: "sca-mau-judge", model: "sca-mau-dat", input_tokens: 3000, output_tokens: 600, latency_ms: 1200, ok: true },
    { at: h(4), viec: "sca-mau-judge", model: "sca-mau-dat", input_tokens: null, output_tokens: null, latency_ms: 100, ok: false },
    { at: h(5), viec: "sca-mau-enrich", model: "qwen3.8-27b-local", input_tokens: 2000, output_tokens: 400, latency_ms: 9000, ok: true },
    { at: h(30), viec: "sca-mau-enrich", model: "sca-mau-moi", input_tokens: 700, output_tokens: 70, latency_ms: 400, ok: true },
  ]
}

export async function moi(c, calls) {
  for (const [m, v, r] of GIA_MAU) await c.query("insert into ai_model_prices (model, gia_vao, gia_ra) values ($1,$2,$3) on conflict (model) do nothing", [m, v, r])
  for (const x of calls)
    await c.query(
      "insert into ai_calls (at, viec, model, input_tokens, output_tokens, latency_ms, ok, loi) values ($1,$2,$3,$4,$5,$6,$7,$8)",
      [x.at, x.viec, x.model, x.input_tokens, x.output_tokens, x.latency_ms, x.ok, x.ok ? null : "Error"],
    )
}
