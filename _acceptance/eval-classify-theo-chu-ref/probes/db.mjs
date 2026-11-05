// db.mjs — E2, E5, E6, E7 của eval-classify-theo-chu-ref. Ghi chỉ trên DB thử oneinvest_eval_ghep; `ghep` sinh bằng ghepLat thật.
// Không in chữ bài thật hay tên nguồn: báo bằng số.
import { execFileSync, spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg")
const SERVER = "postgres://oneinvest:oneinvest@localhost:5433"
const DB = process.env.ECR_DB ?? "oneinvest_eval_ghep"
if (DB !== "oneinvest_eval_ghep") { console.log(`tu choi: DB dich ${DB}`); process.exit(3) }
const URL_THU = `${SERVER}/${DB}`
process.env.DATABASE_URL = URL_THU

const loi = []
const kiem = (dieu, ok, sai) => { if (dieu) console.log(`ok ${ok}`); else { console.log(`FAIL ${sai ?? ok}`); loi.push(sai ?? ok) } }
const LIB = path.join(ROOT, "pipeline/lib/eval-classify.mjs")
const CLI = path.join(ROOT, "pipeline/eval-classify.mjs")
const { chamO, docNhanNguoi, KHOA_DETAIL } = await import(pathToFileURL(LIB).href)
const { ghepLat } = await import(pathToFileURL(path.join(ROOT, "pipeline/label-ghep.mjs")).href)

// Bản chép cạnh lõi thật, để đường nạp tương đối giữ nguyên; xoá ngay sau khi dùng.
const banChep = async (noiDung, chay) => {
  const ban = path.join(path.dirname(LIB), `.ban-${process.pid}-${randomBytes(4).toString("hex")}-eval-classify.mjs`)
  writeFileSync(ban, noiDung)
  try { return await chay(await import(pathToFileURL(ban).href)) } finally { rmSync(ban, { force: true }) }
}
const gocMoc = "467d3477"
const maMoc = execFileSync("git", ["show", `${gocMoc}:pipeline/lib/eval-classify.mjs`], { cwd: ROOT, encoding: "utf8" })

const LAT = "ecr-thu", LAT_RONG = "ecr-thu-rong"
const SNAP = "hanoi__s03__ecrthu"
const U = (n) => `https://cdn.example.test/ecr/${n}.jpg`
const CHU = "Bán căn hộ 64,5m2 giá 3 tỷ"
const CHU2 = "Bán căn hộ 70m2 giá 4 tỷ"

const that = new pg.Client({ connectionString: `${SERVER}/oneinvest`, options: "-c default_transaction_read_only=on" })
await that.connect()
const vetTungBang = async (k) => Object.values((await k.query(`SELECT
  (SELECT count(*) FROM eval_label_items WHERE lat LIKE 'ecr-thu%')::int AS nhan,
  (SELECT count(*) FROM stg_zalo_posts WHERE post_id LIKE 'ecr-thu-%')::int AS bai,
  (SELECT count(*) FROM users WHERE email LIKE '%@ecr-thu.test')::int AS nguoi,
  (SELECT count(*) FROM dq_check_results WHERE check_name = 'eval-classify' AND entity LIKE 'ecr-thu%')::int AS dq,
  (SELECT count(*) FROM airbnb_snapshots WHERE snapshot_id = $1)::int AS snap`, [SNAP])).rows[0])
const dauVet = async (k) => (await vetTungBang(k)).reduce((a, b) => a + b, 0)
const vetTruoc = await dauVet(that)

const r = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB, "--neu-chua-co"], { encoding: "utf8" })
if (r.status !== 0) { console.log(`FAIL loi dung DB thu: ${r.stderr.slice(0, 200)}`); process.exit(1) }
const c = new pg.Client({ connectionString: URL_THU })
await c.connect()
const don = async () => {
  await c.query(`DELETE FROM dq_check_results WHERE check_name = 'eval-classify' AND entity LIKE 'ecr-thu%'`)
  await c.query(`DELETE FROM eval_label_items WHERE lat LIKE 'ecr-thu%'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'ecr-thu-%'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@ecr-thu.test'`)
}
try {
  await don()
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP])
  const goc = Date.now() - 86400000
  const bai = (id, nguoi, giay, text) => c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, sender_id, sender_name, text, posted_at) VALUES ($1, $2, 'Nhóm thử', 'ecr-thu-g', $3, 'Người thử', $4, $5)`,
    [`ecr-thu-${id}`, SNAP, nguoi, text, new Date(goc + giay * 1000)])
  const anh = (id, nguoi, giay) => c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, sender_id, sender_name, text, posted_at, media) VALUES ($1, $2, 'Nhóm thử', 'ecr-thu-g', $3, 'Người thử', $4, $5, $6::jsonb)`,
    [`ecr-thu-${id}`, SNAP, nguoi, U(id), new Date(goc + giay * 1000), JSON.stringify([{ url: U(id) }])])
  await bai("t1", "n1", 0, CHU); await anh("a1", "n1", 5); await anh("a2", "n1", 6)
  await anh("a5", "n3", 2000); await anh("a7", "n6", 2500)
  // Cụm có đại diện chưa nhãn: a8 đại diện, a9 trùng, chỉ a9 có nhãn.
  await bai("t8", "n8", 5000, CHU); await anh("a8", "n8", 5005); await anh("a9", "n8", 5006)
  await bai("t4", "n4", 3000, CHU2)
  await bai("t5", "n5", 4000, CHU2); await anh("a6", "n5", 4005)
  const dong = {}
  const them = async (lat, ref, split = "test") => {
    const { rows: [x] } = await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, $4, false, 'ecr-thu', 'ECR') RETURNING item_id::int`,
      [lat, `ecr-thu-${ref}`, `h-${ref}`, split])
    dong[`${lat}/${ref}`] = x.item_id
    return x.item_id
  }
  for (const ref of ["a1", "a2", "a5", "a7", "t4", "t5"]) await them(LAT, ref)
  const lanGhep = await ghepLat(c, { lat: LAT })
  kiem(lanGhep.ghi >= 4, "ghep sinh bang lenh ghep that", `loi lenh ghep ghi ${lanGhep.ghi}`)
  const { rows: [nguoi] } = await c.query(`INSERT INTO users (id, email, password_hash, role) VALUES ('usr_ecr_thu', 'a@ecr-thu.test', 'x$y', 'ops') RETURNING id`)
  const gan = async (itemId, area, gia) => {
    for (const [field, value] of [["area_m2", area], ["price_min_vnd", gia], ["kind", "sale"]]) {
      await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) VALUES ($1, $2, $3, $4, false)`, [itemId, nguoi.id, field, value])
    }
  }
  await gan(dong[`${LAT}/a1`], "64.5", "3000000000")
  await gan(dong[`${LAT}/a2`], "64.5", "3000000000")
  await gan(dong[`${LAT}/a5`], "64.5", "3000000000")
  await gan(dong[`${LAT}/a7`], "64.5", "3000000000")
  await gan(dong[`${LAT}/t4`], "70", "4000000000")
  await gan(dong[`${LAT}/t5`], "70", "4000000000")

  // E2, AC-1.
  const ket = await docNhanNguoi(c, { lat: LAT, split: "test" })
  const chuA1 = ket.tin.find((t) => t.id === "ecr-thu-a1")?.text
  kiem(chuA1 === CHU, "chu theo chu_ref", `loi chu dong a1 dai ${chuA1?.length}`)
  kiem(ket.tin.every((t) => !/https?:|example\.test/.test(t.text)), "khong co URL trong tap cham", "loi URL vao tap cham")
  const dien = (kq) => chamO({ tin: kq.tin }).find((x) => x.phan_khuc === "tat-ca" && x.truong === "area_m2")
  kiem(dien(ket).n === 3 && dien(ket).dung === 3, "cham dung tren tin ghep", `loi cham ${dien(ket).dung}/${dien(ket).n}`)
  const KHOA = "coalesce(i.ghep->>'chu_ref', i.ref_id)"
  const goc_ = readFileSync(LIB, "utf8")
  if (!goc_.includes(KHOA)) kiem(false, "dot bien trung dung khoa doc", "loi mau dot bien lech ma")
  const hong = await banChep(goc_.replace(KHOA, "i.ref_id"), (m) => m.docNhanNguoi(c, { lat: LAT, split: "test" }))
  kiem(dien(hong).dung < dien(ket).dung, "doi chung: ban chep doc ref_id thi so dung tut", `loi doi chung ${dien(hong).dung}/${dien(hong).n}`)

  // AC-2, AC-3 trên DB thật của phép đo.
  kiem(ket.khong_chu === 2 && ket.trung_co_nhan === 1 && ket.mat_chu === 0, "dem khong chu va dong trung", `loi dem ${ket.khong_chu} ${ket.trung_co_nhan} ${ket.mat_chu}`)
  kiem(!ket.tin.some((t) => ["ecr-thu-a5", "ecr-thu-a7", "ecr-thu-a2"].includes(t.id)), "bai khong tin chu va dong trung khong vao tap", "loi dong loai vao tap")
  const boCot = goc_.replace("i.ref_id, i.ghep, p.text", "i.ref_id, p.text").replace(KHOA, "i.ref_id")
  const khongCot = await banChep(boCot, (m) => m.docNhanNguoi(c, { lat: LAT, split: "test" }))
  kiem(khongCot.tin.some((t) => t.id === "ecr-thu-a5"), "doi chung: bo cot ghep thi bai anh vao tap", "loi doi chung bo cot ghep")
  const LAT_DD = "ecr-thu-dd"
  await them(LAT_DD, "a8"); await them(LAT_DD, "a9")
  await ghepLat(c, { lat: LAT_DD })
  await gan(dong[`${LAT_DD}/a9`], "64.5", "3000000000")
  const ketDd = await docNhanNguoi(c, { lat: LAT_DD, split: "test" })
  kiem(ketDd.tin.length === 0 && ketDd.trung_co_nhan === 1, "cum cham toi da mot lan", `loi cum ${ketDd.tin.length} ${ketDd.trung_co_nhan}`)

  // E5, AC-4: lát không ghép, so từng trường với hàm ở commit mốc. Có bài có chữ, bài chỉ URL, bài mất chữ.
  for (const ref of ["t4", "a5", "khong-co-bai"]) await them(LAT_RONG, ref)
  await gan(dong[`${LAT_RONG}/t4`], "70", "4000000000")
  await gan(dong[`${LAT_RONG}/a5`], "70", "4000000000")
  await gan(dong[`${LAT_RONG}/khong-co-bai`], "70", "4000000000")
  const moi = await docNhanNguoi(c, { lat: LAT_RONG, split: "test" })
  const moc = await banChep(maMoc, (m) => m.docNhanNguoi(c, { lat: LAT_RONG, split: "test" }))
  const { khong_chu: kc, trung_co_nhan: tc, ...conLai } = moi
  kiem(moc.tin.length === 2 && moc.mat_chu === 1, "doi chung: lat so moc co tin cham", `loi lat so moc ${moc.tin.length} ${moc.mat_chu}`)
  kiem(kc === 0 && tc === 0 && JSON.stringify(conLai) === JSON.stringify(moc), "ghep null giong moc", `loi lech moc ${Object.keys(conLai).filter((k) => JSON.stringify(conLai[k]) !== JSON.stringify(moc[k]))}`)
  kiem(JSON.stringify({ ...conLai, mat_chu: 9 }) !== JSON.stringify(moc), "doi chung: doi mot truong thi phep so moc do")

  // E6, AC-5: CLI thật.
  const chay = (...them_) => spawnSync("node", [CLI, "--lat", LAT, "--split", "test", ...them_], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" })
  const demDq = async () => (await c.query(`SELECT count(*)::int AS n FROM dq_check_results WHERE check_name = 'eval-classify' AND entity LIKE 'ecr-thu|%'`)).rows[0].n
  const dry = chay("--dry")
  kiem(dry.status === 0 && dry.stdout.includes("không tin chữ 2") && dry.stdout.includes("dòng trùng có nhãn 1") && dry.stdout.includes("3 tin"), "dry in dung so", `loi dry ${dry.status} ${dry.stderr.slice(0, 120)}`)
  kiem((await demDq()) === 0, "dry khong ghi", "loi dry ghi dong")
  const ghi = chay()
  kiem(ghi.status === 0 && (await demDq()) > 0, "ghi that co dong", `loi ghi ${ghi.status} ${ghi.stderr.slice(0, 120)}`)
  const { rows: dqs } = await c.query(`SELECT entity, detail FROM dq_check_results WHERE check_name = 'eval-classify' AND entity LIKE 'ecr-thu|%'`)
  const khoaMoc = (await banChep(maMoc, (m) => m.KHOA_DETAIL)).join(",")
  // Regex thật bên đọc, rút từ app/src/lib/dq-labels.ts.
  const nguonNhan = readFileSync(path.join(ROOT, "app/src/lib/dq-labels.ts"), "utf8").match(/\/(\^run=\\S\+ tap=nguoi[^\n]*\$)\//)
  const reNhan = nguonNhan && new RegExp(nguonNhan[1])
  const dungKhuon = (d) => d.split(" ").map((kv) => kv.split("=")[0]).join(",") === khoaMoc && KHOA_DETAIL.join(",") === khoaMoc && Boolean(reNhan?.test(d))
  kiem(Boolean(reNhan) && dqs.every((x) => dungKhuon(x.detail)), "ghi that dung khuon detail", "loi khuon detail")
  kiem(!dungKhuon(`${dqs[0].detail} khong_chu=1`), "doi chung: khuon detail them khoa thi bat")
  const oDien = dqs.find((x) => x.entity === `${LAT}|tat-ca|parser|area_m2`)
  kiem(/ n=3 dung=3 /.test(oDien?.detail ?? ""), "n chi gom dong cham", `loi o dien tich ${oDien?.detail?.slice(0, 60)}`)

  // E7, AC-6.
  const cau = []
  await docNhanNguoi({ query: (s, v) => (cau.push(String(s).trim()), c.query(s, v)) }, { lat: LAT, split: "test" })
  const giua = cau.slice(1, -1).join(" ")
  kiem(cau[0] === "BEGIN TRANSACTION READ ONLY" && cau.at(-1) === "COMMIT" && giua.includes("i.ghep") && giua.includes("stg_zalo_posts"), "doc trong giao dich chi doc", `loi thu tu cau ${cau.length}`)
  // Đối chứng dương: cùng bộ đếm, trên DB thử đang có đủ fixture, từng bảng phải > 0.
  const vetThu = await vetTungBang(c)
  kiem(vetThu.every((n) => n > 0), "doi chung: bo dem dau vet thay fixture tung bang", `loi bo dem dau vet ${vetThu}`)
} finally {
  await don().catch(() => {})
  await c.end()
}

const tuChoi = spawnSync("node", [fileURLToPath(import.meta.url)], { cwd: ROOT, env: { ...process.env, ECR_DB: "oneinvest" }, encoding: "utf8" })
kiem(tuChoi.status === 3 && tuChoi.stdout.includes("tu choi"), "doi chung: tro vao oneinvest bi tu choi", `loi tu choi ${tuChoi.status}`)

const { rows: urls } = await that.query(`SELECT DISTINCT substring(media_url from 'https?://([^/]+)') AS h FROM media WHERE media_url IS NOT NULL`)
const { rows: reg } = await that.query(`SELECT string_agg(distinct x, ' ') AS s FROM source_registry r, LATERAL (SELECT r.real_name AS x UNION ALL SELECT unnest(r.source_ids)) q`)
const { rows: mauChu } = await that.query(`SELECT substring(text, 1, 40) AS d FROM stg_zalo_posts WHERE length(text) >= 60 AND text NOT LIKE 'http%' ORDER BY md5(post_id) LIMIT 3000`)
const vetSau = await dauVet(that)
kiem(vetTruoc === 0 && vetSau === 0, "oneinvest khong co dau vet", `loi oneinvest co dau vet ${vetTruoc} ${vetSau}`)
await that.end()
const mien = new Set()
for (const { h } of urls) if (h) { const d = h.toLowerCase().split("."); mien.add(d.slice(-2).join(".")); if (d.at(-2)?.length <= 3) mien.add(d.slice(-3).join(".")) }
const tu = (reg[0].s ?? "").toLowerCase().split(/\s+/)
for (const x of tu.filter((t) => t.includes("."))) mien.add(x)
const tenTran = new Set(tu.filter((t) => !t.includes(".") && t.length >= 4 && /^\p{L}+$/u.test(t)))
mien.delete("com.vn"); mien.delete("example.test")
const nhanRe = (m) => m.replace(/\./g, "\\.")
const quet = (chu) => [...mien].filter((m) => new RegExp(`(?<![a-z0-9-])${nhanRe(m)}(?![a-z0-9-])`).test(chu)).length
  + [...tenTran].filter((m) => new RegExp(`(?<![\\p{L}\\p{N}_/.-])${m}(?![\\p{L}\\p{N}_-])`, "u").test(chu)).length
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 })
const coso = git("merge-base", "HEAD", "origin/main").trim()
const them = git("diff", "-U0", coso, "--", ".", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n").toLowerCase()
kiem(mien.size > 0 && tenTran.size > 0 && them.length > 1000 && quet(them) === 0, "dong them khong co ten nguon", `loi ${quet(them)} ten trong dong them, dai ${them.length}`)
const mau1 = [...mien][0], ten1 = [...tenTran][0]
kiem([`https://cdn.${mau1}/x`, `${mau1}/x`, `dang ${ten1} day`].every((d) => quet(`dong co ${d}`) >= 1), "doi chung: moi ten nguon bi bat", "loi doi chung moi ten")
const chuThat = mauChu.map((x) => x.d.toLowerCase())
const coChuThat = (chu) => chuThat.filter((d) => chu.includes(d)).length
kiem(chuThat.length > 100 && coChuThat(them) === 0, "dong them khong co chu bai that", `loi ${coChuThat(them)} doan chu that trong dong them, mau ${chuThat.length}`)
kiem(coChuThat(`moi ${chuThat[0]} day`) >= 1, "doi chung: moi chu that bi bat", "loi doi chung chu that")
const laLanThu = (f) => /^collector\/|^\.claude\/hooks\/|^\.claude\/settings|^db\/migrations\//.test(f)
const tepDoi = git("diff", "--name-only", coso).split("\n").filter(Boolean)
kiem(tepDoi.length > 3 && tepDoi.filter(laLanThu).length === 0, "lan thu hook migration khong doi", `loi doi ${tepDoi.filter(laLanThu).length} tep`)
kiem(["collector/src/a.ts", ".claude/hooks/x.sh", "db/migrations/9_x.sql"].every(laLanThu) && !laLanThu("pipeline/a.mjs"), "doi chung: tep lan thu bi bat", "loi doi chung lan thu")
if (loi.length) process.exit(1)
console.log("DB OK")
process.exit(0)
