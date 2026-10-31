// hom-nay.tsx — hồ sơ do-the-duyet-du-du-lieu (HD11) E6 (AC-6): lệnh trên DB máy thu (chỉ đọc) in đủ dòng cho mọi thẻ chờ
// hôm nay; số bên không ảnh trùng bộ đọc ảnh thật của app (loadReviewMedia, vai Vận hành và quản trị) — thước ngoài lệnh và
// ngoài câu đo của probe. Đếm dq_check_results trước/sau để chứng không ghi. Chỉ in số đếm.
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import { createRequire } from "node:module"

import { loadReviewMedia, type MediaRow, type ReviewMediaItem } from "../../../app/src/lib/ops/review-media"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg") as typeof import("pg")
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
async function main() {
const c = new pg.Client({ connectionString: DB_URL })
await c.connect()
const dem = async () => Number((await c.query("SELECT count(*) FROM dq_check_results")).rows[0].count)
try {
  const truoc = await dem()
  const r = spawnSync(process.execPath, [path.join(ROOT, "pipeline/do-the-duyet.mjs")], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL } })
  assert.equal(r.status, 0, r.stderr)
  const v: Record<string, number> = {}
  const nguonDoDay = new Set<string>()
  for (const l of r.stdout.split("\n")) {
    const m = l.match(/^the-duyet:(\S+) (\S+) (pass|fail) (.*)$/)
    if (!m) continue
    console.log(l)
    if (m[1] === "do-day") nguonDoDay.add(m[2])
    for (const kv of m[4].split(" ")) {
      const [k, x] = kv.split("=")
      v[`${m[1] === "do-day" ? `do-day.${m[2]}` : m[1]}.${k}`] = Number(x)
    }
  }
  const { rows: the } = await c.query<ReviewMediaItem & { status: string }>(
    "SELECT id, item_type, evidence FROM review_queue WHERE item_type = 'entity_match' AND status = 'pending' ORDER BY id")
  for (const k of ["roi-kho", "anh-ops", "anh-admin"]) assert.equal(v[`${k}.tong`], the.length, `${k}.tong ≠ số thẻ chờ ${the.length}`)
  const { rows: nguon } = await c.query(`
    SELECT DISTINCT s.source FROM review_queue t CROSS JOIN (VALUES ('offer_a'), ('offer_b')) b(k)
    JOIN sale_offers s ON s.offer_id = t.evidence -> b.k ->> 'offer_id'
    WHERE t.item_type = 'entity_match' AND t.status = 'pending' ORDER BY 1`)
  assert.deepEqual([...nguonDoDay].sort(), nguon.map((x) => x.source), "dòng do-day không đủ nguồn có bên trong thẻ chờ")
  const query = (text: string, values: unknown[]) => c.query<MediaRow>(text, values)
  const theoVai = async (role: "ops" | "admin") => {
    const media = await loadReviewMedia(the, { id: "thu", email: "thu@local.test", plan: "free", role }, query)
    let so = 0
    let ben = 0
    for (const t of the) {
      const ev = t.evidence as Record<string, { offer_id?: unknown }>
      const khong = (["offer_a", "offer_b"] as const).filter((k) => typeof ev[k]?.offer_id === "string" && (media[t.id]?.[k] ?? []).length === 0).length
      ben += khong
      if (khong > 0) so++
    }
    return { so, ben }
  }
  const soSanhApp = (k: string, app: { so: number; ben: number }, lenh: Record<string, number>) => {
    if (lenh[`${k}.so`] !== app.so || lenh[`${k}.ben`] !== app.ben)
      throw new Error(`LECH APP ${k}: lệnh so=${lenh[`${k}.so`]} ben=${lenh[`${k}.ben`]} · app so=${app.so} ben=${app.ben}`)
  }
  const ops = await theoVai("ops")
  const admin = await theoVai("admin")
  soSanhApp("anh-ops", ops, v)
  soSanhApp("anh-admin", admin, v)
  assert.throws(() => soSanhApp("anh-ops", ops, { ...v, "anh-ops.ben": v["anh-ops.ben"] + 1 }), /LECH APP anh-ops/)
  console.log(`ok bộ đọc app: vai Vận hành so=${ops.so} ben=${ops.ben} · quản trị viên so=${admin.so} ben=${admin.ben} — trùng lệnh; đối chứng 'LECH APP'`)
  assert.equal(await dem(), truoc, "lệnh không --write mà số dòng dq_check_results đổi")
  console.log(`ok ${the.length} thẻ chờ, dòng do-day cho ${nguon.length} nguồn, dq_check_results ${truoc} trước = sau`)
  console.log("HOM NAY OK")
} finally {
  await c.end()
}
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
