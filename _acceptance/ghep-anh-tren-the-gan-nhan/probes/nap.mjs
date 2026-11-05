// nap.mjs — E2, E4, E7, E9, E10. Chạy dưới tsx từ app/. Trên DB thử; `ghep` sinh bằng lệnh ghép thật. Không ghi DB oneinvest: đếm dấu vết trước, sau.
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { M076, ROOT, SERVER, THU_MUC, URL_THU, banGhiKiem, noiDbThu, pg } from "./_db.mjs"

process.env.DATABASE_URL = URL_THU
delete process.env.VERCEL
const { loi, kiem } = banGhiKiem()
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const tuApp = createRequire(path.join(ROOT, "app/package.json"))
const { renderToStaticMarkup } = await import(pathToFileURL(tuApp.resolve("react-dom/server")).href)
const { taoNguoi } = await nap("app/tests/helpers/phien-thu.ts")
const { LabelsContent } = await nap("app/src/components/ops/labels/labels-content.tsx")
const { tinKe, baiDeGhi, tienDo } = await nap("app/src/lib/labels-queries.ts")
const { doiChieu, ghiTruongHop } = await nap("app/src/lib/labels-luot-hai.ts")
const { docGhep, ghepHien } = await nap("app/src/lib/labels-anh.ts")
const nhanRoute = await nap("app/src/app/api/v1/ops/labels/route.ts")
const { ghepLat } = await nap("pipeline/label-ghep.mjs")
const { layMau } = await nap("pipeline/label-sample.mjs")

// Mốc của lời hứa «bài không ghép giữ nguyên»: chính hàm ở commit trước vòng này, cùng DB, cùng bài.
const MOC = "ee17f25e67dbf137eedf53810025ad974e097be9"
const LIB = path.join(ROOT, "app/src/lib")
fs.mkdirSync(THU_MUC, { recursive: true })
const banMoc = async (ten) => {
  const tep = path.join(THU_MUC, `moc-${ten}`)
  fs.writeFileSync(tep, execFileSync("git", ["show", `${MOC}:app/src/lib/${ten}`], { cwd: ROOT, encoding: "utf8" }).replaceAll('from "./', `from "${LIB}/`))
  return import(pathToFileURL(tep).href)
}
const { doiChieu: doiChieuMoc } = await banMoc("labels-luot-hai.ts")
const { tinKe: tinKeMoc } = await banMoc("labels-queries.ts")

const that = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await that.connect()
const dauVet = async (k) => (await k.query(`SELECT
  (SELECT count(*) FROM eval_label_items WHERE lat LIKE 'ghep-nap%')::int AS items,
  (SELECT count(*) FROM stg_zalo_posts WHERE post_id LIKE 'ghep-nap-%')::int AS bai,
  (SELECT count(*) FROM silver_labels WHERE post_id LIKE 'ghep-nap-%')::int AS silver,
  (SELECT count(*) FROM field_assertions WHERE subject_key = 'S03:ghep-nap-o')::int AS fa,
  (SELECT count(*) FROM enrichment_proposals WHERE offer_id = 'ghep-nap-o')::int AS ep,
  (SELECT count(*) FROM sale_offer_records WHERE offer_id = 'ghep-nap-o')::int AS offer,
  (SELECT count(*) FROM collection_units WHERE group_key = 'ghep-nap-g')::int AS nhom,
  (SELECT count(*) FROM users WHERE email LIKE '%@ghep-nap.test')::int AS nguoi,
  (SELECT count(*) FROM eval_labels l JOIN users u ON u.id = l.labeler_id WHERE u.email LIKE '%@ghep-nap.test')::int AS nhan`)).rows[0]
const coVet = (v) => Object.entries(v).filter(([, n]) => n > 0).map(([k]) => k)
const vetTruoc = coVet(await dauVet(that))

const LAT = "ghep-nap"
const U = (n) => `https://cdn.example.test/nap/${n}.jpg`
const SNAP = "hanoi__s03__ghepnap"
const CHU = "CHUGOC-GHEP Bán căn 64,5m2"
const MOI = ["TOAMAYGHEP", "MOI-ASSERT-GHEP", "MOI-PROP-GHEP", "rent_lt"]
const cay = (el) => JSON.stringify(el, (key, v) => (key.startsWith("_") || typeof v === "function" || typeof v === "symbol" ? undefined : v))
// Không phân biệt hoa thường: màn hạ chữ giá trị máy.
const coMoi = (s) => MOI.filter((m) => s.toLowerCase().includes(m.toLowerCase()))
const coLink = (s) => /https?:\/\/|example\.test/.test(s.replaceAll("http://www.w3.org/2000/svg", ""))
const coMaBai = (s) => /ghep-nap-/.test(s)

const c = await noiDbThu()
const don = async () => {
  await c.query(`DELETE FROM eval_label_items WHERE lat LIKE 'ghep-nap%'`)
  await c.query(`DELETE FROM silver_labels WHERE post_id LIKE 'ghep-nap-%'`)
  await c.query(`DELETE FROM enrichment_proposals WHERE offer_id = 'ghep-nap-o'`)
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id = 'ghep-nap-o'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'ghep-nap-%'`)
  await c.query(`DELETE FROM collection_units WHERE group_key = 'ghep-nap-g'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@ghep-nap.test'`)
}
const bamMau = async (lat) => createHash("md5").update(JSON.stringify((await c.query(`SELECT item_id, ref_id, text_hash, stratum FROM eval_label_items WHERE lat LIKE $1 ORDER BY item_id`, [lat])).rows)).digest("hex")
try {
  await don()
  // Về đúng trạng thái trước 076, để đo nhãn có từ trước.
  await c.query(`ALTER TABLE eval_label_items DROP COLUMN IF EXISTS ghep`)
  await c.query(`DELETE FROM eval_label_cases WHERE case_kind = 'ghep-sai'`)
  await c.query(`ALTER TABLE eval_label_cases DROP CONSTRAINT IF EXISTS eval_label_cases_case_kind_check`)
  await c.query(`ALTER TABLE eval_label_cases ADD CONSTRAINT eval_label_cases_case_kind_check CHECK (case_kind IS NULL OR case_kind IN ('bi-danh', 'mac-dinh-nhom', 'ma-trung-du-an', 'nhieu-can', 'che-tang', 'so-ngoai-bai', 'khong-phai-tin-rao', 'the-nhom-sai', 'khac'))`)
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP])
  const { rows: [u] } = await c.query(`INSERT INTO collection_units (source_code, name, group_key) VALUES ('S03', 'Nhóm nạp ghép', 'ghep-nap-g') RETURNING unit_code`)
  const goc = Date.now() - 86400000
  const bai = (id, nguoi, giay, text, media = null) => c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, sender_id, sender_name, text, posted_at, media) VALUES ($1, $2, 'Nhóm nạp ghép', 'ghep-nap-g', $3, 'Người thử', $4, $5, $6::jsonb)`,
    [`ghep-nap-${id}`, SNAP, nguoi, text, new Date(goc + giay * 1000), media])
  const anh = (id, nguoi, giay) => bai(id, nguoi, giay, U(id), JSON.stringify([{ url: U(id) }]))
  await bai("t1", "n1", 0, `${CHU}\nhttps://khac.example.test/x`); await anh("a1", "n1", 5); await anh("a2", "n1", 6); await anh("a3", "n1", 7)
  await bai("t2", "n2", 1000, "Bán 1PN"); await anh("a4", "n2", 1001); await bai("t3", "n2", 1010, "Bán 3PN")
  await anh("a5", "n3", 2000)
  await bai("t4", "n4", 3000, "Không có ảnh, không ghép, bán 2PN")
  await bai("t5", "n5", 4000, "Có chữ có cụm"); await anh("a6", "n5", 4005)
  const dong = {}
  const them = async (ref, stratum = u.unit_code, double = false, lat = LAT) => {
    const { rows: [r] } = await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'dev', $4, 'ghep-nap', $5) RETURNING item_id::int`,
      [lat, `ghep-nap-${ref}`, `h-${ref}`, double, stratum])
    dong[ref] = r.item_id
    return r.item_id
  }
  await them("a1", u.unit_code, true); await them("a2"); await them("a4"); await them("a5"); await them("t5")
  await them("t4", "GNR")

  // Nhãn có trước 076: bài riêng, người riêng, không chiếm chỗ cặp gắn trùng.
  const cu = await taoNguoi(c, "ops", { email: "cu@ghep-nap.test" })
  const itemCu = await them("t3", "GNC")
  for (const [field, basis] of [["floor", "chu_bai"], ["stack", "ngu_canh_nhom"], ["building", "kien_thuc_nghe"], ["subzone", "anh"], ["project", null]]) {
    await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, $2, $3, $4, $5, $6)`, [itemCu, cu.id, field, basis ? "1" : null, !basis, basis])
  }
  const bamNhan = async () => createHash("md5").update(JSON.stringify((await c.query(`SELECT item_id, labeler_id, field, value, not_stated, basis FROM eval_labels ORDER BY item_id, labeler_id, field`)).rows)).digest("hex")
  const nhanTruoc = await bamNhan()
  const mauTruoc = await bamMau("ghep-nap%")
  let tuChoiLoai = null
  const nguoiCu = cu.id
  await c.query(`INSERT INTO eval_label_cases (item_id, labeler_id, case_kind) VALUES ($1, $2, 'ghep-sai')`, [itemCu, nguoiCu]).catch((e) => { tuChoiLoai = e.constraint })
  kiem(tuChoiLoai === "eval_label_cases_case_kind_check", "doi chung: truoc 076 chua nhan ghep-sai", `loi truoc 076 nhan ghep-sai: ${tuChoiLoai}`)
  await c.query(M076)
  await c.query(M076)
  console.log("ok ap migration hai lan")

  // E2: lệnh ghép thật.
  const thu = await ghepLat(c, { lat: LAT, thu: true })
  const { rows: [sauThu] } = await c.query(`SELECT count(*) FILTER (WHERE ghep IS NOT NULL)::int AS n FROM eval_label_items WHERE lat = $1`, [LAT])
  kiem(thu.nhan_ghep >= 4 && sauThu.n === 0, "thu khong ghi", `loi --thu ghi ${sauThu.n} dong`)
  const lan1 = await ghepLat(c, { lat: LAT })
  const lan2 = await ghepLat(c, { lat: LAT, lamLai: true })
  kiem(lan1.ghi > 0 && lan2.ghi === 0, "ghep hai lan khong doi", `loi lan hai ghi ${lan2.ghi}`)
  const lan3 = await ghepLat(c, { lat: LAT })
  kiem(lan3.giu === true && lan3.ghi === 0, "lat da co ghep thi giu", "loi lat da co ghep bi ghi lai")
  const mauSau = await bamMau("ghep-nap%")
  kiem(mauTruoc === mauSau, "bon cot mau khong doi", "loi bon cot mau doi sau khi ghep")
  await c.query(`UPDATE eval_label_items SET stratum = 'x-doi' WHERE item_id = $1`, [dong.t4])
  kiem((await bamMau("ghep-nap%")) !== mauSau, "doi chung: doi mot dong thi phep bam do", "loi phep bam khong do")
  await c.query(`UPDATE eval_label_items SET stratum = 'GNR' WHERE item_id = $1`, [dong.t4])
  kiem((await bamNhan()) === nhanTruoc, "nhan cu khong doi", "loi nhan cu doi")
  const kqMoi = await layMau(c, { lat: "ghep-nap-moi", n: 3, seed: "ghep-nap-moi", nhom: /Nhóm nạp ghép/, thu: false })
  const { rows: [moiLat] } = await c.query(`SELECT count(*)::int AS n, count(*) FILTER (WHERE ghep IS NOT NULL)::int AS g FROM eval_label_items WHERE lat = 'ghep-nap-moi'`)
  kiem(kqMoi.them === 3 && moiLat.n === 3 && (await ghepLat(c, { lat: "ghep-nap-moi", thu: true })).co_ghep === moiLat.g, "lat moi co ghep", `loi lat moi ${JSON.stringify(moiLat)}`)

  // Mồi giá trị máy ở mọi bài của cụm và tin chữ.
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, block_raw) VALUES ('ghep-nap-o', 'sale', now(), now(), ARRAY['ghep-nap-t1'], 'TOAMAYGHEP')`)
  for (const id of ["t1", "a1", "a2", "a3"]) await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', $1, 'h', 'ghep-nap', 'v', 'inquiry', 'rent_lt', true, 'ghep-nap')`, [`ghep-nap-${id}`])
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) SELECT 'S03:ghep-nap-o', 'block_raw', '"MOI-ASSERT-GHEP"', 'inferred', 'e2_llm', now() WHERE NOT EXISTS (SELECT 1 FROM field_assertions WHERE subject_key = 'S03:ghep-nap-o')`)
  await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route) VALUES ('ghep-nap', 'ghep-nap-o', 'block_raw', '"MOI-PROP-GHEP"', 'moi', 'e2_llm', 'review')`)
  const { rows: [moi] } = await c.query(`SELECT (SELECT count(*) FROM silver_labels WHERE post_id LIKE 'ghep-nap-%')::int AS s, (SELECT count(*) FROM field_assertions WHERE subject_key = 'S03:ghep-nap-o' AND value::text LIKE '%MOI-ASSERT-GHEP%')::int AS f, (SELECT count(*) FROM enrichment_proposals WHERE offer_id = 'ghep-nap-o' AND value::text LIKE '%MOI-PROP-GHEP%')::int AS e`)
  kiem(moi.s === 4 && moi.f >= 1 && moi.e === 1, "doi chung: moi nam trong bang", `loi moi ${JSON.stringify(moi)}`)
  kiem(coVet(await dauVet(c)).length >= 7, "doi chung: phep dem dau vet thay du lieu tren DB thu", "loi phep dem dau vet khong thay gi")

  const a = await taoNguoi(c, "ops", { email: "a@ghep-nap.test" })
  const b = await taoNguoi(c, "ops", { email: "b@ghep-nap.test" })
  const nguoiCua = (n) => ({ id: n.id, email: n.email, plan: "free", role: "ops" })

  // E4: thẻ thật.
  const { rows: [goc1] } = await c.query(`SELECT ghep FROM eval_label_items WHERE item_id = $1`, [dong.a1])
  const g1 = docGhep(goc1.ghep)
  kiem(g1?.chu_ref === "ghep-nap-t1" && g1.anh_refs.length === 3, "ghep tu ben ghi", `loi ben ghi: ${JSON.stringify(goc1.ghep)?.slice(0, 80)}`)
  const doiTen = JSON.parse(JSON.stringify(goc1.ghep).replace("chu_ref", "chu_refx"))
  kiem(ghepHien(docGhep(doiTen))?.suyRa !== true, "doi chung: doi ten khoa cua ben ghi thi ben doc do", "loi doi ten khoa van doc duoc")
  const tin = await tinKe(a.id, LAT, c, u.unit_code)
  const chuoi = JSON.stringify(tin)
  kiem(tin?.itemId === dong.a1 && tin.text === CHU, "the ghep co chu tin chu", `loi chu the: ${tin?.itemId}`)
  kiem(tin?.anh.length === 3 && tin.ghep.suyRa && tin.ghep.soChuGan === 1, "the ghep du anh", `loi anh the: ${tin?.anh.length}`)
  kiem(!coMaBai(chuoi) && !coLink(chuoi), "the khong co ma bai", "loi the co ma bai hoac link")
  kiem(coMaBai(JSON.stringify(goc1.ghep)), "doi chung: ban ghi tho co ma bai thi phep quet do")
  const tinKhong = await tinKe(a.id, LAT, c, "GNR")
  const tinKhongMoc = await tinKeMoc(a.id, LAT, c, "GNR")
  const { ghep: gRong, ...conLai } = tinKhong
  kiem(gRong === null && JSON.stringify(conLai) === JSON.stringify(tinKhongMoc), "ghep rong giong ban truoc", `loi ghep rong lech moc`)

  // E7: mù trên cả cụm, đọc theo tin chữ sau khi lưu.
  kiem(coMoi(chuoi).length === 0, "tinKe khong co gia tri may", `loi tinKe co ${coMoi(chuoi)}`)
  const el = await LabelsContent({ user: nguoiCua(a), lat: LAT, nhom: u.unit_code })
  const trang = cay(el) + renderToStaticMarkup(el)
  kiem(coMoi(trang).length === 0 && !coMaBai(trang) && !coLink(trang), "trang khong co gia tri may", "loi trang lo gia tri may hoac ma bai")
  kiem(trang.includes("CHUGOC-GHEP"), "doi chung: trang co chu tin chu", "loi trang khong co chu seed")
  kiem(coMoi(`${chuoi}TOAMAYGHEP`).length === 1, "doi chung: chen gia tri may thi bat")

  // E9: lưu qua route thật.
  const KN = { not_stated: true }
  const chuB = (value) => ({ value, basis: "chu_bai" })
  const DU = { listing_intent: chuB("offer"), kind: chuB("sale"), property_type: chuB("apartment"), multi_unit: { value: "no" }, project: KN, subzone: KN, building: KN, stack: KN, floor: KN, bedrooms: KN, bedrooms_plus: KN, bathrooms: KN, area_m2: chuB("64,5"), price_min_vnd: KN, price_max_vnd: KN, seller_name: KN, seller_phone: KN }
  const post = (nguoi, itemId, values) => nhanRoute.POST(new Request("http://localhost/api/v1/ops/labels", { method: "POST", headers: { "content-type": "application/json", cookie: nguoi.cookie }, body: JSON.stringify({ lat: LAT, item_id: itemId, values, reason: "" }) }))
  const ghi = await baiDeGhi(dong.a1, c)
  kiem(ghi.text.startsWith(CHU), "bai de ghi la chu tin ghep", "loi baiDeGhi khong doc tin chu")
  const sai = await post(a, dong.a1, { ...DU, area_m2: chuB("99,9") })
  kiem(sai.status === 400, "doi chung: gia tri khong co trong chu tin ghep bi tu choi", `loi nhan gia tri ngoai chu ${sai.status}`)
  const dung = await post(a, dong.a1, DU)
  kiem(dung.status === 200, "can cu chu so voi chu tin ghep", `loi route ${dung.status} ${await dung.text()}`)
  const r2 = await post(b, dong.a1, DU)
  kiem(r2.status === 200, "nguoi hai luu duoc", `loi nguoi hai ${r2.status}`)

  const d = await doiChieu(a.id, dong.a1, c)
  kiem(d.boDoc?.building?.toLowerCase() === "toamayghep" && d.aiDoc?.kind === "rent_lt", "doiChieu doc theo tin chu ghep", `loi doiChieu ${JSON.stringify(d.boDoc)?.slice(0, 80)}`)
  kiem(!coMaBai(JSON.stringify(d)) && !coLink(JSON.stringify(d)), "doiChieu khong co ma bai", "loi doiChieu co ma bai")
  const dMoc = await doiChieuMoc(a.id, dong.a1, c)
  kiem(dMoc.boDoc === null, "doi chung: moc khong thay bo doc o bai anh", "loi moc thay bo doc")
  await post(a, dong.t4, DU_T4(DU))
  const dk = await doiChieu(a.id, dong.t4, c)
  const dkMoc = await doiChieuMoc(a.id, dong.t4, c)
  const { ghep: gk, ...conK } = dk
  kiem(gk === null && JSON.stringify(conK) === JSON.stringify(dkMoc), "doiChieu khong ghep giong moc", `loi lech moc: ${Object.keys(conK).filter((x) => JSON.stringify(conK[x]) !== JSON.stringify(dkMoc[x]))}`)
  kiem(JSON.stringify({ ...conK, boDoc: { x: 1 } }) !== JSON.stringify(dkMoc), "doi chung: doi mot truong thi phep so moc do")
  const kqSai = await ghiTruongHop(c, a.id, dong.a1, { case_kind: "ghep-sai" })
  const { rows: ds } = await c.query(`SELECT case_kind FROM eval_label_cases WHERE item_id = $1 AND labeler_id = $2`, [dong.a1, a.id])
  kiem(kqSai.ok && ds.some((x) => x.case_kind === "ghep-sai"), "ghi ghep sai", `loi ghi ghep sai ${JSON.stringify(kqSai)}`)
  const kqLa = await ghiTruongHop(c, a.id, dong.a1, { case_kind: "ghep-la" })
  let la = null
  await c.query(`INSERT INTO eval_label_cases (item_id, labeler_id, case_kind) VALUES ($1, $2, 'ghep-la')`, [dong.a1, a.id]).catch((e) => { la = e.constraint })
  kiem(!kqLa.ok && kqLa.status === 400 && la === "eval_label_cases_case_kind_check", "loai la bi tu choi", `loi loai la ${la}`)

  // E10: dòng trùng cụm.
  const { rows: [dem] } = await c.query(`SELECT count(*)::int AS n FROM eval_label_items WHERE lat = $1 AND stratum = $2`, [LAT, u.unit_code])
  const td = await tienDo(a.id, LAT, c, u.unit_code)
  kiem(dem.n === 5 && td.tong === 4, "tien do tru dong trung", `loi tien do ${td.tong}/${dem.n}`)
  kiem(dem.n === 5, "so dong lat khong doi", `loi so dong ${dem.n}`)
  const daThay = []
  for (const nguoi of [await taoNguoi(c, "ops", { email: "x@ghep-nap.test" })]) {
    for (let i = 0; i < 6; i++) {
      const t = await tinKe(nguoi.id, LAT, c, u.unit_code)
      if (!t) break
      daThay.push(t.itemId)
      await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, not_stated) VALUES ($1, $2, 'floor', true)`, [t.itemId, nguoi.id])
    }
  }
  kiem(!daThay.includes(dong.a2) && daThay.length >= 3, "dong trung khong hien", `loi the: ${daThay.length}`)
  const { rows: [g2] } = await c.query(`SELECT ghep FROM eval_label_items WHERE item_id = $1`, [dong.a2])
  await c.query(`UPDATE eval_label_items SET ghep = ghep - 'trung_voi' WHERE item_id = $1`, [dong.a2])
  kiem((await tienDo(a.id, LAT, c, u.unit_code)).tong === 5, "doi chung: bo trung_voi thi so the tang 1", "loi doi chung trung_voi")
  await c.query(`UPDATE eval_label_items SET ghep = $2::jsonb WHERE item_id = $1`, [dong.a2, JSON.stringify(g2.ghep)])
  await c.query(`UPDATE eval_label_items SET ghep = NULL WHERE lat = $1`, [LAT])
  kiem((await tienDo(a.id, LAT, c, u.unit_code)).tong === 5, "lat ghep rong tinh nhu cu", "loi lat ghep rong")
} finally {
  await don().catch(() => {})
  await c.end()
}
function DU_T4(du) { return { ...du, area_m2: { not_stated: true }, kind: { value: "sale", basis: "chu_bai" } } }
const tuChoi = spawnSync("node", ["--import", "tsx", fileURLToPath(import.meta.url)], { cwd: path.join(ROOT, "app"), env: { ...process.env, GHEP_DB: "oneinvest" }, encoding: "utf8" })
kiem(tuChoi.status === 3 && tuChoi.stdout.includes("tu choi"), "doi chung: tro vao oneinvest bi tu choi", `loi tu choi: ${tuChoi.status}`)
const lenh = spawnSync("node", [path.join(ROOT, "pipeline/label-ghep.mjs"), "--lat", "khong-co"], { env: { ...process.env, DATABASE_URL: `${SERVER}/oneinvest` }, encoding: "utf8" })
kiem(lenh.status === 1 && lenh.stderr.includes("--db-that"), "doi chung: lenh ghep tu choi DB that khi chua khai", `loi lenh ghep: ${lenh.status}`)
const vetSau = coVet(await dauVet(that))
kiem(vetTruoc.length === 0 && vetSau.length === 0, "oneinvest khong doi", `loi oneinvest co dau vet: ${vetTruoc} ${vetSau}`)
await that.end()
if (loi.length) process.exit(1)
console.log("NAP OK")
process.exit(0)
