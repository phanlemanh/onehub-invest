// round-trip.mjs — E18 (AC-8): chuỗi thật trên DB thử đã áp migration thật, không chèn tay nhãn: lệnh mẫu → route lưu → route
// trường hợp → label-cases → eval-classify. Chiều đỏ `--do`: gửi trường ngoài CHECK thì thoát 1 với «loi rang buoc truong».
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { ROOT, URL_THU, kiem, noiDbThu } from "./_db.mjs"

process.env.DATABASE_URL = URL_THU
delete process.env.VERCEL
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const DO = process.argv.includes("--do")
const LAT = DO ? "gcn-rt-do" : "gcn-rt"
const TIEN = DO ? "gcn-rtd" : "gcn-rt"
const NHOM = DO ? "GCNRTD" : "GCNRT"
const { taoNguoi } = await nap("app/tests/helpers/phien-thu.ts")
const nhanRoute = await nap("app/src/app/api/v1/ops/labels/route.ts")
const haiRoute = await nap("app/src/app/api/v1/ops/labels/[itemId]/review/route.ts")
const { ghiNhan } = await nap("app/src/lib/labels-queries.ts")
const { chuanHoaLuot } = await nap("app/src/lib/labels-normalize.ts")

const c = await noiDbThu()
const loi = []
const k = (d, ok, fail) => kiem(loi, d, ok, fail)
const env = { ...process.env, DATABASE_URL: URL_THU }
const lenh = (tep, ...a) => spawnSync("node", [path.join(ROOT, "pipeline", tep), ...a], { cwd: ROOT, env, encoding: "utf8" })
const chu = (value) => ({ value, basis: "chu_bai" })
const DU = {
  listing_intent: chu("offer"), kind: chu("sale"), property_type: chu("apartment"), multi_unit: { value: "no" },
  project: chu("Vinhomes Grand Park"), subzone: { value: "Rainbow", basis: "ngu_canh_nhom" }, building: chu("S5.03"), stack: chu("12"), floor: { not_stated: true },
  bedrooms: chu("2"), bedrooms_plus: chu("no"), bathrooms: { not_stated: true }, area_m2: chu("64,5"),
  price_min_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" }, price_max_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" },
  seller_name: { not_stated: true }, seller_phone: chu("0912 345 678"),
}
const don = async () => {
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE $1`, [`${TIEN}-%`])
  await c.query(`DELETE FROM collection_units WHERE source_code = 'S03' AND group_key LIKE $1`, [`${TIEN}-%`])
  await c.query(`DELETE FROM users WHERE email LIKE $1`, [`%@${TIEN}.test`])
}
let thoat = 0
try {
  await don()
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hcm__s03__gcnrt', 'hcm', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`)
  for (const g of ["a", "b"]) {
    await c.query(`INSERT INTO collection_units (source_code, name, group_key) VALUES ('S03', $1, $2)`, [`${NHOM} ${g}`, `${TIEN}-${g}`])
    for (let i = 1; i <= 6; i++) {
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, text, posted_at) VALUES ($1, 'hcm__s03__gcnrt', $2, $3, $4, now())`,
        [`${TIEN}-${g}${i}`, `${NHOM} ${g}`, `${TIEN}-${g}`, `Bán căn 2PN S5.03 trục 12 Vinhomes Grand Park 64,5m2 giá 4,35 tỷ, bài ${g}${i}`])
    }
  }
  const mau = lenh("label-sample.mjs", "--lat", LAT, "--seed", "gc0-rt", "--theo-nhom", "--moi-nhom-lon", "6", "--moi-nhom-nho", "5", "--so-nhom-lon", "2", "--nhom-khop", `^${NHOM} `)
  const { rows: items } = await c.query(`SELECT item_id::int, stratum, split FROM eval_label_items WHERE lat = $1 ORDER BY item_id`, [LAT])
  k(mau.status === 0 && items.length === 12 && items.every((i) => i.stratum), "buoc mau: 12 dong co ma nhom", `loi buoc mau: ${items.length} ${mau.stderr}`)
  const a = await taoNguoi(c, "ops", { email: `a@${TIEN}.test` })
  if (DO) {
    const ch = chuanHoaLuot(DU, { text: "Bán căn 2PN S5.03 trục 12 Vinhomes Grand Park 64,5m2 giá 4,35 tỷ", reason: "x" })
    try {
      await ghiNhan(c, a.id, LAT, items[0].item_id, [...ch.rows, { field: "khong_co_truong", value: "x", not_stated: false, basis: null }], "x")
      console.log("KHONG BI CHAN")
    } catch (e) {
      if (/eval_labels_field_check/.test(String(e.message ?? e))) {
        console.log("loi rang buoc truong")
        thoat = 1
      } else console.log(`loi khac: ${e.message}`)
    }
  } else {
    let luu = 0
    for (const it of items) {
      const res = await nhanRoute.POST(new Request("http://localhost/api/v1/ops/labels", {
        method: "POST", headers: { "content-type": "application/json", cookie: a.cookie },
        body: JSON.stringify({ lat: LAT, item_id: it.item_id, values: DU, reason: "RB = Rainbow" }),
      }))
      if (res.status === 200) luu++
    }
    const { rows: dem } = await c.query(`SELECT count(*)::int AS n FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1`, [LAT])
    k(luu === 12 && dem[0].n === 12 * 17, "buoc luu: route ghi 17 dong moi bai tren dong cua buoc mau", `loi buoc luu: ${luu} ${dem[0].n}`)
    const it = items[0]
    const hai = await haiRoute.POST(new Request("http://localhost/x", {
      method: "POST", headers: { "content-type": "application/json", cookie: a.cookie },
      body: JSON.stringify({ case_kind: "bi-danh", note: "RB viết tắt", group_card_verdict: "unsure" }),
    }), { params: Promise.resolve({ itemId: String(it.item_id) }) })
    k(hai.status === 200, "buoc truong hop: route ghi tren bai da luu", `loi buoc truong hop: ${hai.status}`)
    const xuat = lenh("label-cases.mjs", "--lat", LAT, "--json")
    const j = JSON.parse(xuat.stdout || "{}")
    const n = j.nhom?.find((x) => x.unit_code === it.stratum) ?? {}
    k(j.nhom?.length === 2 && n.truong_hop?.some((t) => t.loai === "bi-danh") && n.ly_do?.length === 6 && n.ly_do.every((l) => l.ly_do === "RB = Rainbow")
      && n.gia_tri_ngu_canh?.length === 6 && n.gia_tri_ngu_canh.every((v) => v.truong === "subzone" && v.gia_tri === "rainbow" && v.can_cu === "ngu_canh_nhom")
      && n.the_nhom?.length === 1 && n.the_nhom[0].tra_loi === "unsure", "buoc xuat: label-cases doc du ly do, truong hop, the, gia tri ngu canh", `loi buoc xuat: ${xuat.stderr} ${xuat.stdout.slice(0, 300)}`)
    k(!xuat.stdout.includes(a.id), "buoc xuat: khong co nguoi gan", "loi lo nguoi gan")
    const split = items.some((i) => i.split === "test") ? "test" : "dev"
    const cham = lenh("eval-classify.mjs", "--lat", LAT, "--split", split, "--dry")
    k(cham.status === 0 && /\|kind\s+n [1-9]/.test(cham.stdout), "buoc cham: eval-classify doc nhan", `loi buoc cham: ${cham.stderr} ${cham.stdout.slice(0, 300)}`)
    k(loi.length === 0, "moi buoc doc duoc dong cua buoc truoc", "loi chuoi dut")
    const tu = fileURLToPath(import.meta.url)
    const r = spawnSync(process.execPath, ["--import", "tsx", tu, "--do"], { cwd: path.join(ROOT, "app"), env, encoding: "utf8" })
    k(r.status === 1 && /loi rang buoc truong/.test(r.stdout), "doi chung: truong ngoai CHECK bi chan", `loi doi chung: ${r.status} ${r.stdout.slice(-300)} ${r.stderr.slice(0, 300)}`)
  }
} finally {
  await don()
  await c.end()
  const { pool } = await nap("app/src/lib/db.ts")
  await pool.end().catch(() => {})
}
if (DO) process.exit(thoat)
console.log(loi.length ? `ROUND-TRIP FAIL (${loi.length})` : "ROUND-TRIP OK")
process.exit(loi.length ? 1 : 0)
