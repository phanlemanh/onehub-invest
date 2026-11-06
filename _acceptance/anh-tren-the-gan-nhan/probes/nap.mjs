// nap.mjs — E6, E8. Chạy dưới tsx từ app/. Mù và băm chữ trên DB thử; migration 075 và lưu căn cứ «Ảnh» qua route thật.
// «RSC» là cây phần tử LabelsContent gồm mọi prop xuống client. Không ghi DB oneinvest: băm trước, sau cùng lượt.
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { M075, ROOT, SERVER, THU_MUC, URL_THU, banGhiKiem, noiDbThu, pg } from "./_db.mjs"

process.env.DATABASE_URL = URL_THU
delete process.env.VERCEL
const { loi, kiem } = banGhiKiem()
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const tuApp = createRequire(path.join(ROOT, "app/package.json"))
const { renderToStaticMarkup } = await import(pathToFileURL(tuApp.resolve("react-dom/server")).href)
const { taoNguoi } = await nap("app/tests/helpers/phien-thu.ts")
const { LabelsContent } = await nap("app/src/components/ops/labels/labels-content.tsx")
const { tinKe, baiDeGhi } = await nap("app/src/lib/labels-queries.ts")
const { doiChieu } = await nap("app/src/lib/labels-luot-hai.ts")
const nhanRoute = await nap("app/src/app/api/v1/ops/labels/route.ts")
const { textHash } = await nap("pipeline/lib/eval-labels.mjs")

// Mốc của lời hứa «đối chiếu giữ nguyên trừ ảnh»: chính hàm doiChieu ở commit trước vòng này, cùng DB, cùng bài.
const MOC = "43e34b40e38558df96725b6c849f4a94de5da7e0"
const LIB = path.join(ROOT, "app/src/lib")
const tepMoc = path.join(THU_MUC, "luot-hai-moc.ts")
fs.mkdirSync(THU_MUC, { recursive: true })
fs.writeFileSync(tepMoc, execFileSync("git", ["show", `${MOC}:app/src/lib/labels-luot-hai.ts`], { cwd: ROOT, encoding: "utf8" }).replaceAll('from "./', `from "${LIB}/`))
const { doiChieu: doiChieuMoc } = await import(pathToFileURL(tepMoc).href)

const that = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await that.connect()
const bamThat = async () => {
  const { rows: a } = await that.query(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'eval_labels_basis_check'`)
  const { rows: b } = await that.query(`SELECT item_id, ref_id, text_hash, stratum FROM eval_label_items ORDER BY item_id`)
  return createHash("md5").update(JSON.stringify({ a, b })).digest("hex")
}
// Dấu vết lượt đo trong mọi bảng nó ghi. DB thật đang có người gắn nên không băm eval_labels; đếm đúng dòng của người thử.
const dauVet = async (k) => (await k.query(`SELECT
  (SELECT count(*) FROM eval_label_items WHERE lat = 'anh-nap')::int AS items,
  (SELECT count(*) FROM stg_zalo_posts WHERE post_id = 'anh-nap-1')::int AS bai,
  (SELECT count(*) FROM silver_labels WHERE post_id = 'anh-nap-1')::int AS silver,
  (SELECT count(*) FROM field_assertions WHERE subject_key = 'S03:anh-nap-o')::int AS fa,
  (SELECT count(*) FROM enrichment_proposals WHERE offer_id = 'anh-nap-o')::int AS ep,
  (SELECT count(*) FROM sale_offer_records WHERE offer_id = 'anh-nap-o')::int AS offer,
  (SELECT count(*) FROM collection_units WHERE group_key = 'anh-nap-g')::int AS nhom,
  (SELECT count(*) FROM users WHERE email LIKE '%@anh-nap.test')::int AS nguoi,
  (SELECT count(*) FROM eval_labels l JOIN users u ON u.id = l.labeler_id WHERE u.email LIKE '%@anh-nap.test')::int AS nhan`)).rows[0]
const coVet = (v) => Object.entries(v).filter(([, n]) => n > 0).map(([k]) => k)
const vetTruoc = coVet(await dauVet(that))
const truocThat = await bamThat()

const LAT = "anh-nap"
const BAI = "anh-nap-1"
const U = "https://cdn.example.test/anh/nap.jpg"
const CHU = "CHUGOC-ANH Bán căn 64,5m2"
const MOI = ["TOAMAYDOAN", "MOI-ASSERT-DAU", "MOI-PROP-DAU", "rent_lt"]
const cay = (el) => JSON.stringify(el, (key, v) => (key.startsWith("_") || typeof v === "function" || typeof v === "symbol" ? undefined : v))
const coMoi = (s) => MOI.filter((m) => s.includes(m))
// Không gian tên của thẻ svg là chữ của React, không phải link của bài.
const coLink = (s) => /https?:\/\/|example\.test/.test(s.replaceAll("http://www.w3.org/2000/svg", ""))

const c = await noiDbThu()
const don = async () => {
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM silver_labels WHERE post_id = $1`, [BAI])
  await c.query(`DELETE FROM enrichment_proposals WHERE offer_id = 'anh-nap-o'`)
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id = 'anh-nap-o'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id = $1`, [BAI])
  await c.query(`DELETE FROM collection_units WHERE group_key = 'anh-nap-g'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@anh-nap.test'`)
}
try {
  await don()
  // DB thử giữ lại có thể đã mang 075 từ lượt trước: dựng lại đúng trạng thái trước 075 (CHECK của 072).
  await c.query(`DELETE FROM eval_labels WHERE basis = 'anh'`)
  await c.query(`ALTER TABLE eval_labels DROP CONSTRAINT IF EXISTS eval_labels_basis_check`)
  await c.query(`ALTER TABLE eval_labels ADD CONSTRAINT eval_labels_basis_check CHECK (basis IS NULL OR basis IN ('chu_bai', 'ngu_canh_nhom', 'kien_thuc_nghe'))`)
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hanoi__s03__anhnap', 'hanoi', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`)
  const { rows: [u] } = await c.query(`INSERT INTO collection_units (source_code, name, group_key) VALUES ('S03', 'Nhóm nạp ảnh', 'anh-nap-g') RETURNING unit_code`)
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, text, posted_at, media) VALUES ($1, 'hanoi__s03__anhnap', 'Nhóm nạp ảnh', 'anh-nap-g', $2, now(), $3::jsonb)`, [BAI, `${CHU}\n${U}`, JSON.stringify([{ url: U }])])
  const { rows: [item] } = await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'dev', true, 'anh', $4) RETURNING item_id::int`, [LAT, BAI, textHash(`${CHU}\n${U}`), u.unit_code])
  // Mồi ở mọi bảng mang giá trị máy đọc, kể cả kết quả đọc ảnh (silver_labels nhận cả dòng từ ảnh).
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, block_raw) VALUES ('anh-nap-o', 'sale', now(), now(), ARRAY[$1], 'TOAMAYDOAN')`, [BAI])
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', $1, 'h', 'anh-nap', 'v', 'inquiry', 'rent_lt', true, 'anh-nap')`, [BAI])
  // field_assertions chỉ thêm, không xoá được: mồi nằm lại DB thử, chỉ thêm khi chưa có.
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) SELECT 'S03:anh-nap-o', 'block_raw', '"MOI-ASSERT-DAU"', 'inferred', 'e2_llm', now() WHERE NOT EXISTS (SELECT 1 FROM field_assertions WHERE subject_key = 'S03:anh-nap-o')`)
  await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route) VALUES ('anh-nap', 'anh-nap-o', 'block_raw', '"MOI-PROP-DAU"', 'moi', 'e2_llm', 'review')`)
  // Mồi phải thật sự nằm trong bảng, không thì phép mù xanh suông.
  const { rows: [moi] } = await c.query(`SELECT (SELECT count(*) FROM silver_labels WHERE post_id = $1)::int AS s, (SELECT count(*) FROM field_assertions WHERE subject_key = 'S03:anh-nap-o' AND value::text LIKE '%MOI-ASSERT-DAU%')::int AS f, (SELECT count(*) FROM enrichment_proposals WHERE offer_id = 'anh-nap-o' AND value::text LIKE '%MOI-PROP-DAU%')::int AS e`, [BAI])
  kiem(moi.s === 1 && moi.f >= 1 && moi.e === 1, "moi nam trong ba bang", `loi moi ${JSON.stringify(moi)}`)
  // Nhãn có trước 075: đủ ba căn cứ cũ và một ô không suy ra, cộng mọi nhãn sẵn có trong DB thử.
  const cu = await taoNguoi(c, "ops", { email: "cu@anh-nap.test" })
  // Bài riêng, tầng riêng: người gắn cũ không chiếm chỗ của cặp gắn trùng trên bài đang đo.
  const { rows: [baiCu] } = await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', 'anh-nap-cu', 'h-cu', 'dev', false, 'anh', 'anh-nap-khac') RETURNING item_id::int`, [LAT])
  for (const [field, basis] of [["floor", "chu_bai"], ["stack", "ngu_canh_nhom"], ["building", "kien_thuc_nghe"], ["project", null]]) {
    await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, $2, $3, $4, $5, $6)`, [baiCu.item_id, cu.id, field, basis ? "1" : null, !basis, basis])
  }
  const bamNhan = async () => { const { rows } = await c.query(`SELECT item_id, labeler_id, field, value, not_stated, basis FROM eval_labels ORDER BY item_id, labeler_id, field`); return { n: rows.length, h: createHash("md5").update(JSON.stringify(rows)).digest("hex") } }
  const truocNhan = await bamNhan()
  let tuChoiAnh = null
  await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, $2, 'area_m2', '1', false, 'anh')`, [baiCu.item_id, cu.id]).catch((e) => { tuChoiAnh = e.constraint })
  kiem(tuChoiAnh === "eval_labels_basis_check", "doi chung: truoc 075 CHECK chua nhan anh", `loi truoc 075 CHECK nhan anh: ${tuChoiAnh}`)
  await c.query(M075)
  await c.query(M075)
  console.log("ok ap 075 hai lan")
  const sauNhan = await bamNhan()
  kiem(truocNhan.n >= 4 && sauNhan.h === truocNhan.h, `nhan cu khong doi ${sauNhan.n} dong`, `loi nhan cu doi: ${truocNhan.n} ${sauNhan.n}`)
  kiem(coVet(await dauVet(c)).length >= 7, "doi chung: phep dem dau vet thay du lieu tren DB thu", "loi phep dem dau vet khong thay gi")
  const a = await taoNguoi(c, "ops", { email: "a@anh-nap.test" })
  const b = await taoNguoi(c, "ops", { email: "b@anh-nap.test" })
  const nguoiCua = (n) => ({ id: n.id, email: n.email, plan: "free", role: "ops" })

  const tin = await tinKe(a.id, LAT, c, u.unit_code)
  const chuoi = JSON.stringify(tin)
  kiem(tin && coMoi(chuoi).length === 0, "tinKe khong co gia tri may", `loi tinKe co ${coMoi(chuoi)}`)
  kiem(!coLink(chuoi), "tinKe khong co http", "loi tinKe co link")
  kiem(tin.text === CHU && tin.anh.length === 1 && tin.anh[0] === `/api/zalo-media?nhan=${item.item_id}&anh=0`, "tinKe tra chu va anh", `loi tinKe: ${chuoi.slice(0, 120)}`)
  const el = await LabelsContent({ user: nguoiCua(a), lat: LAT, nhom: u.unit_code })
  const rsc = cay(el), html = renderToStaticMarkup(el)
  kiem(coMoi(rsc + html).length === 0, "trang khong co gia tri may", `loi trang co ${coMoi(rsc + html)}`)
  kiem(!coLink(rsc + html), "trang khong co link", "loi trang co link")
  kiem(coMoi(`${chuoi}TOAMAYDOAN`).length === 1, "doi chung: chen gia tri may vao ket qua bi bat")
  kiem(coLink(`${chuoi}${U}`), "doi chung: ket qua co http bi bat")

  // Băm thật: text_hash của mẫu là textHash(chữ gốc); chữ hiện đã bỏ link thì băm khác.
  const ghi = await baiDeGhi(item.item_id, c)
  const { rows: [hash] } = await c.query(`SELECT text_hash FROM eval_label_items WHERE item_id = $1`, [item.item_id])
  kiem(textHash(ghi.text) === hash.text_hash, "ghi nhan bam tren chu goc", "loi bam chu ghi khac text_hash cua mau")
  kiem(textHash(tin.text) !== hash.text_hash, "doi chung: bam chu hien khac bam chu goc", "loi doi chung bam")
  const bamBaiDb = async () => (await c.query(`SELECT md5(text) AS m FROM stg_zalo_posts WHERE post_id = $1`, [BAI])).rows[0].m
  const baiTruoc = await bamBaiDb()

  // E8: lưu căn cứ Ảnh qua route thật, không đòi lý do.
  const KN = { not_stated: true }
  const anh = (value) => ({ value, basis: "anh" })
  const DU = { listing_intent: anh("offer"), kind: anh("sale"), property_type: anh("apartment"), multi_unit: { value: "no" }, project: KN, subzone: KN, building: KN, stack: KN, floor: KN, bedrooms: anh("2"), bedrooms_plus: anh("no"), bathrooms: KN, area_m2: anh("64,5"), price_min_vnd: KN, price_max_vnd: KN, seller_name: KN, seller_phone: KN }
  const post = (nguoi, values, reason = "") => nhanRoute.POST(new Request("http://localhost/api/v1/ops/labels", { method: "POST", headers: { "content-type": "application/json", cookie: nguoi.cookie }, body: JSON.stringify({ lat: LAT, item_id: item.item_id, values, reason }) }))
  const r1 = await post(a, DU)
  kiem(r1.status === 200, "luu qua route that voi anh", `loi route: ${r1.status} ${await r1.text()}`)
  kiem((await bamBaiDb()) === baiTruoc, "bam chu khong doi sau khi luu", "loi chu trong DB doi sau khi luu")
  const { rows: dem } = await c.query(`SELECT count(*)::int AS n FROM eval_labels WHERE item_id = $1 AND labeler_id = $2 AND basis = 'anh'`, [item.item_id, a.id])
  kiem(dem[0].n === 6, "nhan luu dung can cu anh", `loi so dong anh ${dem[0].n}`)
  const giaTriLa = await post(b, { ...DU, area_m2: { value: "64,5", basis: "anh-la" } })
  kiem(giaTriLa.status === 400, "route tu choi can cu la", `loi route nhan can cu la ${giaTriLa.status}`)
  // Trực tiếp vào CHECK, không qua route: 075 nhận `anh`.
  const { rows: [thuAnh] } = await c.query(`WITH x AS (INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, $2, 'floor', '3', false, 'anh') RETURNING basis) SELECT basis FROM x`, [item.item_id, b.id])
  kiem(thuAnh.basis === "anh", "check nhan anh", "loi check khong nhan anh")
  await c.query(`DELETE FROM eval_labels WHERE item_id = $1 AND labeler_id = $2 AND field = 'floor'`, [item.item_id, b.id])
  let ten = null
  await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, 'x', 'area_m2', '1', false, 'la')`, [item.item_id]).catch((e) => { ten = e.constraint })
  kiem(ten === "eval_labels_basis_check", "check tu choi gia tri la", `loi check ${ten}`)
  const r2 = await post(b, { ...DU, area_m2: { value: "64,5", basis: "chu_bai" } })
  kiem(r2.status === 200, "nguoi hai luu duoc", `loi nguoi hai ${r2.status}`)
  const { rows: dong } = await c.query(`SELECT khop, cap_du FROM eval_label_agreement WHERE lat = $1 AND field = 'area_m2'`, [LAT])
  kiem(dong[0].cap_du === 1 && dong[0].khop === 1, "dong thuan khong xet can cu", `loi dong thuan ${JSON.stringify(dong)}`)

  const d = await doiChieu(a.id, item.item_id, c)
  kiem(d.anh.length === 1, "doiChieu co anh")
  kiem(d.text === CHU && !coLink(JSON.stringify(d)), "doiChieu khong co http", "loi doiChieu co link")
  // Quan hệ với mốc: mọi trường bằng bản trước vòng này, trừ chữ đã bỏ link và hai trường ảnh mới.
  const moc = await doiChieuMoc(a.id, item.item_id, c)
  const boAnh = ({ text, anh, soLinkKhac, ...con }) => con
  kiem(moc && moc.text === `${CHU}\n${U}`, "doi chung: moc tra chu goc co link", "loi moc khong tra chu goc")
  const giong = JSON.stringify(boAnh(d)) === JSON.stringify(boAnh(moc))
  kiem(giong && d.boDoc !== null && d.cuaToi.length > 0, "doiChieu giu nguyen tru anh", `loi doiChieu lech moc: ${Object.keys(boAnh(d)).filter((k) => JSON.stringify(d[k]) !== JSON.stringify(moc[k]))}`)
  kiem(JSON.stringify(boAnh({ ...d, boDoc: null })) !== JSON.stringify(boAnh(moc)), "doi chung: doi mot truong thi phep so moc do", "loi doi chung so moc")

} finally {
  await don().catch(() => {})
  await c.end()
}
const tuChoi = spawnSync("node", ["--import", "tsx", fileURLToPath(import.meta.url)], { cwd: path.join(ROOT, "app"), env: { ...process.env, ANH_DB: "oneinvest" }, encoding: "utf8" })
kiem(tuChoi.status === 3 && tuChoi.stdout.includes("tu choi"), "doi chung: tro vao oneinvest bi tu choi", `loi tu choi: ${tuChoi.status}`)
const vetSau = coVet(await dauVet(that))
kiem(vetTruoc.length === 0 && vetSau.length === 0 && (await bamThat()) === truocThat, "oneinvest khong doi", `loi oneinvest co dau vet: ${vetTruoc} ${vetSau}`)
await that.end()
if (loi.length) process.exit(1)
console.log("NAP OK")
process.exit(0)
