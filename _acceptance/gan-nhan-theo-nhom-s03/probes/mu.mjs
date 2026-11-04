// mu.mjs — E7 (AC-5). Chạy dưới tsx từ app/. Hai chiều mù trên DB thử: giá trị máy và thẻ nhóm không lộ cho người chưa lưu bài;
// nhãn, lý do, diễn giải của người trước không lộ cho người thứ hai và viewer. «RSC» ở đây là cây phần tử LabelsContent trả về,
// gồm mọi prop truyền xuống client component: đúng phần dữ liệu đi vào RSC payload. Bản chạy thật do E8 chấm.
// Chiều đỏ `--do`: bản sao tinKe thêm JOIN sale_offers thì thoát 1 với «loi luot mot doc bang may».
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { ROOT, URL_THU, kiem, noiDbThu } from "./_db.mjs"

process.env.DATABASE_URL = URL_THU
delete process.env.VERCEL
const CAM = /\b(sale_offers|sale_offer_records|silver_labels|field_assertions|enrichment_proposals)\b/
const TEP_LUOT_MOT = ["app/src/lib/labels-queries.ts", "app/src/app/api/v1/ops/labels/route.ts"]
const quet = (nguon) => CAM.test(nguon) || /labels-luot-hai/.test(nguon)

if (process.argv.includes("--do")) {
  const goc = readFileSync(path.join(ROOT, TEP_LUOT_MOT[0]), "utf8")
  const dot = goc.replace("FROM eval_label_items i\n     LEFT JOIN LATERAL (SELECT count", "FROM eval_label_items i\n     JOIN sale_offers s ON i.ref_id = ANY (s.post_ids)\n     LEFT JOIN LATERAL (SELECT count")
  console.log(dot !== goc && quet(dot) ? "loi luot mot doc bang may" : "KHONG BAT DUOC")
  process.exit(dot !== goc && quet(dot) ? 1 : 0)
}

const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const tuApp = createRequire(path.join(ROOT, "app/package.json"))
const { renderToStaticMarkup } = await import(pathToFileURL(tuApp.resolve("react-dom/server")).href)
const { taoNguoi } = await nap("app/tests/helpers/phien-thu.ts")
const { LabelsContent } = await nap("app/src/components/ops/labels/labels-content.tsx")
const nhanRoute = await nap("app/src/app/api/v1/ops/labels/route.ts")
const haiRoute = await nap("app/src/app/api/v1/ops/labels/[itemId]/review/route.ts")

const LAT = "gcn-mu"
// Cả dạng thô ở bảng máy lẫn dạng đã qua hiển thị, cộng chuỗi riêng của silver_labels và khoá dữ liệu lượt hai.
const MAY = ["TOAMAYDOAN", "toamaydoan", "TENMAYDOAN", "tenmaydoan", "THE-MAY-DAU", "9876000000", "9,876", "AI-TRICH-DAU", "boDoc", "aiDoc"]
const NGUOI_A = ["LYDO-A-DAU", "GHICHEP-A-DAU", "nhan-a-dau"]
const CHU = "CHUGOC-GCN Bán căn 2PN trục 12 64,5m2"
const c = await noiDbThu()
const loi = []
const k = (d, ok, fail) => kiem(loi, d, ok, fail)
const chu = (value) => ({ value, basis: "chu_bai" })
const KN = { not_stated: true }
const DU = (project) => ({
  listing_intent: chu("offer"), kind: chu("sale"), property_type: chu("apartment"), multi_unit: { value: "no" },
  project: { value: project, basis: "ngu_canh_nhom" }, subzone: KN, building: KN, stack: chu("12"), floor: KN,
  bedrooms: chu("2"), bedrooms_plus: chu("no"), bathrooms: KN, area_m2: chu("64,5"),
  price_min_vnd: KN, price_max_vnd: KN, seller_name: KN, seller_phone: KN,
})
const nguoiCua = (n, role) => ({ id: n.id, email: n.email, plan: "free", role })
/** Dữ liệu đi xuống client: cả cây phần tử server trả về, gồm prop. */
const cay = (el) => JSON.stringify(el, (key, v) => (key.startsWith("_") || typeof v === "function" || typeof v === "symbol" ? undefined : v))
async function manCua(user, unit, xem) {
  const el = await LabelsContent({ user, lat: LAT, nhom: unit, xem })
  return { html: renderToStaticMarkup(el), rsc: cay(el) }
}
const getNhan = async (cookie, unit) => (await nhanRoute.GET(new Request(`http://localhost/api/v1/ops/labels?lat=${LAT}&nhom=${unit}`, { headers: { cookie } }))).text()
const ctx = (id) => ({ params: Promise.resolve({ itemId: String(id) }) })
const postNhan = (cookie, item, values, reason) => nhanRoute.POST(new Request("http://localhost/api/v1/ops/labels", {
  method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ lat: LAT, item_id: item, values, reason }),
}))
const khongCo = (chuoi, ds) => ds.filter((d) => chuoi.includes(d))
async function don() {
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id LIKE 'gcn-mu-%'`)
  await c.query(`DELETE FROM silver_labels WHERE post_id LIKE 'gcn-mu-%'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'gcn-mu-%'`)
  await c.query(`DELETE FROM collection_units WHERE source_code = 'S03' AND group_key LIKE 'gcn-mu-%'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@gcn-mu.test'`)
}
try {
  await don()
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hcm__zalo__gcnmu', 'hcm', 'zalo', '{}'::jsonb) ON CONFLICT DO NOTHING`)
  const { rows: u } = await c.query(`INSERT INTO collection_units (source_code, name, group_key, note) VALUES ('S03', 'GCN mù', 'gcn-mu-g', 'THE-MAY-DAU') RETURNING unit_code`)
  const unit = u[0].unit_code
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, text, posted_at) VALUES ('gcn-mu-1', 'hcm__zalo__gcnmu', 'GCN mù', 'gcn-mu-g', $1, now())`, [CHU])
  const { rows: it } = await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', 'gcn-mu-1', 'h', 'dev', true, 's', $2) RETURNING item_id`, [LAT, unit])
  const item = Number(it[0].item_id)
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, price_vnd, bedrooms, block_raw, seller_name) VALUES ('gcn-mu-o', 'sale', now(), now(), ARRAY['gcn-mu-1'], 9876000000, 7, 'TOAMAYDOAN', 'TENMAYDOAN')`)
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, quote, json_ok, run_id) VALUES ('S03', 'gcn-mu-1', 'h', 'gcn-mu', 'v', 'inquiry', 'rent_lt', 'AI-TRICH-DAU', true, 'gcn-mu')`)
  const a = await taoNguoi(c, "ops", { email: "a@gcn-mu.test" })
  const b = await taoNguoi(c, "ops", { email: "b@gcn-mu.test" })
  const v = await taoNguoi(c, "viewer", { email: "v@gcn-mu.test" })

  // Chưa lưu: kể cả gõ thẳng ?xem= cũng không mở được.
  const m0 = await manCua(nguoiCua(a, "ops"), unit, item)
  const api0 = await getNhan(a.cookie, unit)
  k(m0.html.includes("CHUGOC-GCN") && api0.includes("CHUGOC-GCN"), "doi chung duong: chu goc co tren HTML va API", "loi phep do khong chay: khong thay chu goc")
  k(khongCo(m0.html + m0.rsc + api0, MAY).length === 0, "chua luu khong co gia tri may", `LO GIA TRI MAY: ${khongCo(m0.html + m0.rsc + api0, MAY)}`)
  const r403 = await haiRoute.GET(new Request("http://localhost/x", { headers: { cookie: a.cookie } }), ctx(item))
  k(r403.status === 403 && khongCo(await r403.text(), MAY).length === 0, "luot hai 403 khi chua luu", `loi luot hai ${r403.status}`)

  // A lưu và ghi trường hợp.
  const luu = await postNhan(a.cookie, item, DU("NHAN-A-DAU"), "LYDO-A-DAU")
  k(luu.status === 200, "A luu duoc", `loi A luu: ${luu.status} ${await luu.clone().text()}`)
  await haiRoute.POST(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json", cookie: a.cookie }, body: JSON.stringify({ case_kind: "khac", note: "GHICHEP-A-DAU" }) }), ctx(item))
  const m1 = await manCua(nguoiCua(a, "ops"), unit, item)
  // Quan hệ: giá trị của nguồn nào nằm ở cột nào, trường nào; ô AI khác nhãn mang Badge, ô Bộ đọc trùng nhãn thì không.
  const dong = (f) => {
    const m = m1.html.match(new RegExp(`<tr[^>]*data-field="${f}"[^>]*>(.*?)</tr>`))
    return (m?.[1] ?? "").split("<td").slice(1).map((o) => o.slice(o.indexOf(">") + 1))
  }
  const chuO = (o) => (o ?? "").replace(/<[^>]+>/g, "").trim()
  const so = (f) => dong(f).slice(1).map(chuO).join(" | ")
  k(so("kind") === "Bán | Bán | Cho thuê" && so("listing_intent") === "Tin rao | Tin rao | Yêu cầu" && so("building") === "Không suy ra được | toamaydoan | —",
    "da luu thay ba cot", `loi da luu khong thay ba cot: ${so("kind")} · ${so("listing_intent")} · ${so("building")}`)
  k(m1.html.includes("THE-MAY-DAU"), "da luu thay the nhom", "loi da luu khong thay the nhom")
  k(dong("kind")[3]?.includes("<span") && !dong("kind")[2]?.includes("<span"), "o khac may mang badge, o trung thi khong", "loi badge cho khac")

  // B chưa lưu: không thấy gì của máy, không thấy gì của A.
  const CHUOI = [...MAY, ...NGUOI_A]
  const mB = await manCua(nguoiCua(b, "ops"), unit, item)
  const apiB = await getNhan(b.cookie, unit)
  k(mB.html.includes("CHUGOC-GCN") && khongCo(mB.html + mB.rsc + apiB, CHUOI).length === 0, "nguoi B 0 chuoi tren HTML RSC API", `LO CHO NGUOI B: ${khongCo(mB.html + mB.rsc + apiB, CHUOI)}`)
  // B lưu: thấy máy, vẫn không thấy A.
  k((await postNhan(b.cookie, item, DU("Ocean Park"), "lý do B")).status === 200, "B luu duoc", "loi B luu")
  const mB2 = await manCua(nguoiCua(b, "ops"), unit, item)
  const apiB2 = await (await haiRoute.GET(new Request("http://localhost/x", { headers: { cookie: b.cookie } }), ctx(item))).text()
  k(mB2.html.includes("toamaydoan") && khongCo(mB2.html + mB2.rsc + apiB2, NGUOI_A).length === 0, "nguoi hai khong thay nhan nguoi truoc", `NGUOI HAI THAY: ${khongCo(mB2.html + mB2.rsc + apiB2, NGUOI_A)}`)

  const mV = await manCua(nguoiCua(v, "viewer"), unit, item)
  k(mV.html.includes("Cần vai ops") && /data-nhom="[^"]+"[^>]*>.*?1\/1.*?Khác 1/.test(mV.html), "doi chung duong: viewer thay so cua bang truong hop", "loi viewer khong thay so")
  k(khongCo(mV.html + mV.rsc, CHUOI).length === 0 && !mV.html.includes("CHUGOC-GCN"), "viewer 0 chuoi tren HTML RSC", `LO CHO VIEWER: ${khongCo(mV.html + mV.rsc, CHUOI)}`)

  const xuat = spawnSync("node", [path.join(ROOT, "pipeline/label-cases.mjs"), "--lat", LAT, "--json"], { cwd: ROOT, env: process.env, encoding: "utf8" })
  k(xuat.stdout.includes("LYDO-A-DAU") && xuat.stdout.includes("GHICHEP-A-DAU"), "label-cases thay chuoi", `loi label-cases khong thay: ${xuat.stderr}`)

  const nhac = TEP_LUOT_MOT.filter((f) => quet(readFileSync(path.join(ROOT, f), "utf8")))
  k(nhac.length === 0, "tep luot mot khong doc bang may", `loi luot mot doc bang may: ${nhac}`)
  const r = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--do"], { cwd: path.join(ROOT, "app"), env: process.env, encoding: "utf8" })
  k(r.status === 1 && /loi luot mot doc bang may/.test(r.stdout), "doi chung: ban sao tinKe them JOIN sale_offers bi bat", `loi doi chung: ${r.status} ${r.stdout} ${r.stderr.slice(0, 200)}`)
} finally {
  await don()
  await c.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id = 'hcm__zalo__gcnmu'`)
  await c.end()
  const { pool } = await nap("app/src/lib/db.ts")
  await pool.end().catch(() => {})
}
console.log(loi.length ? `MU FAIL (${loi.length})` : "MU OK")
process.exit(loi.length ? 1 : 0)
