// hd9-roundtrip.ts — HD9 quyet-dinh-phai-cham-ung-vien AC-8 (E8): gọi route quyết định THẬT trên bản chép DB máy thu.
// Thẻ ghép căn không còn ứng viên chờ (khoá chết) được đặt lại về «chờ» rồi quyết lại → mỗi thẻ phải nhận 422 và không
// dòng nào được ghi; thẻ chờ thật có đúng một ứng viên → mỗi thẻ đổi đúng một ứng viên. Chiều đỏ: bản route bỏ kiểm số
// dòng phải ghi được thẻ khoá chết. GHI review_queue / property_candidates / users / sessions nên CHỈ chạy trên DB thử
// (bash db/db-thu.sh oneinvest_p2_hd9).
// Chạy: cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_hd9 node --import tsx scripts/hd9-roundtrip.ts
import { randomBytes } from "node:crypto"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { Client } from "pg"

const url = process.env.DATABASE_URL ?? ""
const ROUTE = path.join(__dirname, "..", "src", "app", "api", "v1", "ops", "review", "[id]", "decide", "route.ts")
type RouteMod = { POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> }
const HONG: string[] = []
const dong = (s: string) => console.log(s)

// Thẻ ghép căn và số ứng viên còn chờ khớp cặp của nó (hai chiều) — câu đếm độc lập với route.
const SQL_THE = `
  SELECT q.id, q.status, q.item_id,
         (SELECT count(*)::int FROM property_candidates c
           WHERE c.status IN ('pending', 'needs_llm')
             AND ((c.offer_a = split_part(substr(q.item_id, 6), '|', 1) AND c.offer_b = split_part(substr(q.item_id, 6), '|', 2))
               OR (c.offer_b = split_part(substr(q.item_id, 6), '|', 1) AND c.offer_a = split_part(substr(q.item_id, 6), '|', 2)))) AS song
    FROM review_queue q WHERE q.item_type = 'entity_match' ORDER BY q.id`
const DEM_GHI = `SELECT (SELECT count(*) FROM ops_audit WHERE action = 'review.decide')::int AS audit,
  (SELECT count(*) FROM property_candidates WHERE decided_by LIKE 'hitl:%')::int AS ung_vien`

async function goi(mod: RouteMod, cookie: string, id: number) {
  const req = new Request(`http://localhost/api/v1/ops/review/${id}/decide`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "approved", reason: "hd9 roundtrip" }),
  })
  const res = await mod.POST(req, { params: Promise.resolve({ id: String(id) }) })
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> }
}

async function main() {
  const c = new Client({ connectionString: url })
  await c.connect()
  const tam: string[] = []
  try {
    const { rows: [db] } = await c.query("SELECT current_database() AS ten")
    if (db.ten === "oneinvest") throw new Error("từ chối chạy trên DB oneinvest dùng chung — phép đo GHI, dùng DB thử")

    // Một người vai ops + phiên còn hạn (đúng cookie đăng nhập thật đặt).
    const uid = `usr_hd9_${randomBytes(4).toString("hex")}`
    const token = randomBytes(32).toString("hex")
    await c.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x$y', 'ops')`, [uid, `${uid}@local.test`])
    await c.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '1 day')`, [token, uid])
    const cookie = `oi_session=${token}`

    const the = (await c.query(SQL_THE)).rows as { id: number; status: string; item_id: string; song: number }[]
    const chet = the.filter((t) => t.song === 0)
    const cho = the.filter((t) => t.status === "pending" && t.song === 1)
    dong(`HD9 đếm độc lập: ${the.length} thẻ ghép căn · ${chet.length} không còn ứng viên chờ · ${cho.length} thẻ chờ có đúng 1 ứng viên`)
    if (!chet.length || !cho.length) HONG.push("bản chép thiếu thẻ khoá chết hoặc thẻ chờ — phép đo không đo được")

    const datLai = (ids: number[]) => c.query(
      `UPDATE review_queue SET status = 'pending', decided_by = NULL, decided_at = NULL, decision_note = NULL WHERE id = ANY ($1)`, [ids])
    const mod = (await import(ROUTE)) as RouteMod

    // Thẻ khoá chết → 422, không dòng nào ghi.
    await datLai(chet.map((t) => t.id))
    const truoc = (await c.query(DEM_GHI)).rows[0]
    let n422 = 0
    for (const t of chet) {
      const r = await goi(mod, cookie, t.id)
      const st = (await c.query(`SELECT status FROM review_queue WHERE id = $1`, [t.id])).rows[0].status
      if (r.status === 422 && r.json.code === "khong-cham-ung-vien" && st === "pending") n422++
      else dong(`  thẻ #${t.id}: ${r.status} ${JSON.stringify(r.json)} · thẻ ${st}`)
    }
    const sau = (await c.query(DEM_GHI)).rows[0]
    const ghi = sau.audit - truoc.audit + (sau.ung_vien - truoc.ung_vien)
    const okChet = n422 === chet.length && ghi === 0
    dong(`HD9 thẻ khoá chết: ${n422}/${chet.length} nhận 422, ${ghi} dòng ghi${okChet ? "" : " — LỆCH"}`)
    if (!okChet) HONG.push("thẻ khoá chết")

    // Thẻ chờ thật → đúng một ứng viên đổi mỗi thẻ.
    let nDung = 0
    for (const t of cho) {
      const a0 = (await c.query(DEM_GHI)).rows[0]
      const r = await goi(mod, cookie, t.id)
      const a1 = (await c.query(DEM_GHI)).rows[0]
      if (r.status === 200 && a1.ung_vien - a0.ung_vien === 1 && a1.audit - a0.audit === 1) nDung++
      else dong(`  thẻ #${t.id}: ${r.status} ${JSON.stringify(r.json)}`)
    }
    const okCho = nDung === cho.length
    dong(`HD9 thẻ chờ thật: ${nDung}/${cho.length} đổi đúng 1 ứng viên${okCho ? "" : " — LỆCH"}`)
    if (!okCho) HONG.push("thẻ chờ thật")

    // Chiều đỏ: bản route bỏ kiểm số dòng trên chính các thẻ khoá chết.
    const goc = readFileSync(ROUTE, "utf8")
    // bản lỗi tái hiện route cũ (H2): bỏ kiểm số dòng, vẫn đóng thẻ dù không chạm ứng viên nào
    const sai = goc.replace("if (cham.length !== 1) {", "if (false) {").replace("ungVien = cham[0].id;", "ungVien = cham[0]?.id ?? null;")
    if (sai === goc) throw new Error("chiều đỏ: route không còn «if (cham.length !== 1) {» — sửa phép đo theo route")
    const f = path.join(path.dirname(ROUTE), `.hd9-sai-${process.pid}.ts`)
    writeFileSync(f, sai)
    tam.push(f)
    await datLai(chet.map((t) => t.id))
    const modSai = (await import(f)) as RouteMod
    let nLoi = 0
    for (const t of chet) if ((await goi(modSai, cookie, t.id)).status === 200) nLoi++
    dong(`HD9 đối chứng: bản lỗi ghi ${nLoi} thẻ khoá chết`)
    if (nLoi === 0) HONG.push("chiều đỏ không đỏ — phép đo không phân biệt được")
  } finally {
    for (const f of tam) rmSync(f, { force: true })
    await c.end()
  }
  if (HONG.length) {
    console.error(`hd9-roundtrip: lệch — ${HONG.join("; ")}`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(`hd9-roundtrip: ${(e as Error).message}`)
  process.exit(1)
})
