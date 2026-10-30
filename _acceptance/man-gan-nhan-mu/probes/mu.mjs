// mu.mjs — E5 (AC-4). Chạy dưới tsx từ app/: `cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/mu.mjs`.
// Một tin của lát thử mgn-mu mà máy «đã đọc ra» giá trị mang dấu riêng (dòng tin rao, phát biểu, đề xuất enrich) trên DB
// thử. HTML nội dung trang /ops/labels (dựng bằng chính LabelsContent) và JSON của route GET /api/v1/ops/labels không được
// chứa dấu nào; mã nguồn màn + truy vấn + route không nhắc bảng/cột giá trị máy. Đối chứng dương: chữ gốc CHUGOC-MGN CÓ.
// Đối chứng đỏ: bản truy vấn chép thêm join sale_offers → «LO GIA TRI MAY».
import { readFileSync, readdirSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { ROOT, URL_THU, datSnapshot, donThu, kiem, noiDbThu } from "./_db.mjs"

process.env.DATABASE_URL = URL_THU
delete process.env.VERCEL
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const tuApp = createRequire(path.join(ROOT, "app/package.json"))
const { renderToStaticMarkup } = await import(pathToFileURL(tuApp.resolve("react-dom/server")).href)
const { taoNguoi } = await nap("app/tests/helpers/phien-thu.ts")
const { LabelsContent } = await nap("app/src/components/ops/labels/labels-content.tsx")
const { GET } = await nap("app/src/app/api/v1/ops/labels/route.ts")
const queries = await nap("app/src/lib/labels-queries.ts")

const LAT = "mgn-mu"
const DAU = ["9876543210", "TOAMAYDOAN", "DAUPHATBIEU", "DAUDEXUAT"]
const CAM = /\b(sale_offers|sale_offer_records|field_assertions|enrichment_proposals|meta)\b/
const NGUON = ["app/src/app/ops/labels", "app/src/components/ops/labels", "app/src/lib/labels-queries.ts", "app/src/app/api/v1/ops/labels"]

const tep = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((x) => tep(path.join(p, x))) : [p])
const c = await noiDbThu()
const loi = []
const k = (d, ok, fail) => kiem(loi, d, ok, fail)
async function don() {
  await c.query(`DELETE FROM enrichment_proposals WHERE run_id = 'mgn-mu'`)
  // field_assertions chỉ thêm (trigger cấm xoá): dòng phát biểu thử ở lại DB thử — DB thử là bản bỏ đi, không phải oneinvest.
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id LIKE 'mgn-%'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@mgn.test'`)
  await donThu(c, { lat: "mgn-mu", post: "mgn-mu-", tag: "mu" })
}
try {
  await don()
  await datSnapshot(c, "mu")
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text) VALUES ('mgn-mu-1', 'hanoi__zalo__mgnmu', 'MGN-THU OCP', 'CHUGOC-MGN bán căn 2PN toà LD, giá thương lượng')`)
  await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed) VALUES ($1, 'S03', 'mgn-mu-1', 'mgn-mu-h', 'dev', false, 'mu')`, [LAT])
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, price_vnd, bedrooms, block_raw)
                 VALUES ('mgn-mu-offer', 'sale', now(), now(), ARRAY['mgn-mu-1'], 9876543210, 7, 'TOAMAYDOAN')`)
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method) VALUES ('S03:mgn-mu-1', 'block_raw', 'DAUPHATBIEU', 'observed', 'parser') ON CONFLICT DO NOTHING`)
  await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route) VALUES ('mgn-mu', 'mgn-mu-offer', 'block_raw', 'DAUDEXUAT', 'daudexuat', 'e1_rule', 'direct')`)
  const ops = await taoNguoi(c, "ops", { email: "ops@mgn.test" })
  const user = { id: ops.id, email: ops.email, plan: "free", role: "ops" }

  const html = renderToStaticMarkup(await LabelsContent({ user, lat: LAT }))
  k(html.includes("CHUGOC-MGN"), "doi chung duong: chu goc CHUGOC-MGN co trong HTML", "HTML KHONG CO CHU GOC — phep do khong chay")
  for (const d of DAU) k(!html.includes(d), `html khong co dau may ${d}`, `LO GIA TRI MAY trong HTML: ${d}`)
  const res = await GET(new Request(`http://localhost/api/v1/ops/labels?lat=${LAT}`, { headers: { cookie: ops.cookie } }))
  const json = await res.text()
  k(res.status === 200 && json.includes("CHUGOC-MGN"), "route GET 200, co chu goc", `ROUTE KHONG TRA TIN: ${res.status}`)
  for (const d of DAU) k(!json.includes(d), `route khong co dau may ${d}`, `LO GIA TRI MAY trong route: ${d}`)
  const nhac = NGUON.flatMap((p) => tep(path.join(ROOT, p))).filter((f) => CAM.test(readFileSync(f, "utf8")))
  k(nhac.length === 0, "ma nguon man + truy van + route: 0 lan nhac bang/cot gia tri may", `LO GIA TRI MAY trong ma nguon: ${nhac.join(", ")}`)

  // Đối chứng đỏ: chạy câu truy vấn tin kế bản chép thêm join sale_offers trên cùng dữ liệu.
  const src = readFileSync(path.join(ROOT, "app/src/lib/labels-queries.ts"), "utf8")
  const choPhep = src.match(/const CHO_PHEP = `([^`]+)`/)?.[1]
  const sqlGoc = choPhep && src.match(/`(SELECT i\.item_id::int[\s\S]*?LIMIT 1)`/)?.[1]?.replace("${CHO_PHEP}", choPhep)
  if (!sqlGoc) loi.push("DOI CHUNG KHONG DUNG DUOC (khong rut duoc cau tin ke)")
  else {
    const sqlDot = sqlGoc.replace("p.text, p.group_name",
      "p.text || coalesce((SELECT ' ' || s.price_vnd FROM sale_offers s WHERE i.ref_id = ANY (s.post_ids) LIMIT 1), '') AS text, p.group_name")
    const { rows } = await c.query(sqlDot, [ops.id, LAT])
    const dotJson = JSON.stringify(rows)
    k(sqlDot !== sqlGoc && dotJson.includes("9876543210") && CAM.test(sqlDot), "doi chung: ban chep them join sale_offers bi bat 'LO GIA TRI MAY'", "DOI CHUNG KHONG DO: ban join sale_offers khong lo dau")
  }
  void queries
} finally {
  await don()
  await c.end()
  const { pool } = await nap("app/src/lib/db.ts")
  await pool.end().catch(() => {})
}
console.log(loi.length ? `MU FAIL (${loi.length})` : "MU OK")
process.exit(loi.length ? 1 : 0)
