// mau-hai-khoa.mjs — E1, E2, E3, E5, E6: lệnh thật bằng tiến trình con trên DB thử, fixture một nhóm hai dạng khoá, tiền tố kênh giả.
// Kỳ vọng tính tay từ fixture dưới đây, không suy từ mã. Mỗi lời hứa có chiều đỏ riêng ở một bản đột biến, cùng fixture.
import { spawnSync } from "node:child_process"

import { kiem, noiDbThu, ROOT, URL_THU } from "../../gan-nhan-theo-nhom-s03/probes/_db.mjs"
import { docThiTruongNhom } from "../../../pipeline/transform-zalo.mjs"
import { LENH, voiDotBien } from "./_dot.mjs"

const SNAP = "hanoi__s03__ndkmau"
const c = await noiDbThu()
const don = async () => {
  await c.query(`DELETE FROM eval_label_items WHERE lat LIKE 'ndk-%'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'ndk-%'`)
  await c.query(`DELETE FROM collection_units WHERE group_key LIKE '%ndk-%'`)
  await c.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id = $1`, [SNAP])
}
await don()
await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1,'hanoi','s03','{}'::jsonb)`, [SNAP])
const { rows: [{ id: thiTruong }] } = await c.query(`SELECT id FROM areas WHERE region_type = 'market' ORDER BY id LIMIT 1`)
const MA = {}
const dangKy = async (ten, khoa, { note = null, market = [] } = {}) => {
  const { rows } = await c.query(
    `INSERT INTO collection_units (source_code, name, group_key, note, market_codes) VALUES ('S03', $1, $2, $3, $4) RETURNING unit_code`,
    [`NDK ${ten}`, khoa, note, market])
  MA[ten] = rows[0].unit_code
}
const THE = "Thẻ nhóm NDK"
// Dòng có tiền tố đăng ký trước để mã nhỏ hơn dòng khoá trần: đại diện vẫn phải là dòng khoá trần.
await dangKy("Dp", "ndkk:group:ndk-d", { note: THE, market: [thiTruong] })
await dangKy("D", "ndk-d", { note: THE, market: [thiTruong] })
await dangKy("Sp", "ndkk:group:ndk-s")
await dangKy("S", "ndk-s")
await dangKy("Tp", "ndkk:group:ndk-t", { note: "Thẻ một" })
await dangKy("T", "ndk-t", { note: "Thẻ hai" })
await dangKy("L1", "ndk-l1")
await dangKy("L2", "ndk-l2")
await dangKy("Ka", "ndkz:ndk-k") // một dấu hai chấm, không có `group:`: không phải tiền tố, không gộp
await dangKy("Kb", "ndk-k")
await dangKy("Ma", "ndka:ndkb:group:ndk-m") // hai đoạn trước `group:`: không gộp
await dangKy("Mb", "ndk-m")

let dem = 0
const them = (khoa, nhom, chu) => c.query(
  `INSERT INTO stg_zalo_posts (post_id, snapshot_id, conversation_id, group_name, text) VALUES ($1,$2,$3,$4,$5)`,
  [`ndk-${++dem}`, SNAP, khoa, `NDK ${nhom}`, chu])
const loat = async (khoa, nhom, tu, n) => { for (let i = 0; i < n; i++) await them(khoa, nhom, `NDK bài ${nhom} số ${tu + i}`) }
await loat("ndk-l1", "L1", 0, 40)
await loat("ndk-l2", "L2", 0, 20)
// D: khoá trần 12 nội dung; khoá phụ 12 nội dung khác + 3 bản trùng chữ với khoá trần. Hợp = 24 nội dung, khoá phụ 15 bài.
await loat("ndk-d", "D", 0, 12)
await loat("ndkk:group:ndk-d", "D", 12, 12)
await loat("ndkk:group:ndk-d", "D", 0, 3)
// S: khoá trần 2, khoá phụ 6, cộng 8 nội dung: vẫn là nhóm nhỏ, hạn mức 5.
await loat("ndk-s", "S", 0, 2)
await loat("ndkk:group:ndk-s", "S", 2, 6)
// T: hai dòng khác thẻ.
await loat("ndk-t", "T", 0, 2)
await loat("ndkk:group:ndk-t", "T", 2, 1)
await loat("ndkz:ndk-k", "K", 0, 3)
await loat("ndk-k", "K", 3, 3)
await loat("ndka:ndkb:group:ndk-m", "M", 0, 2)
await loat("ndk-m", "M", 2, 2)

const chay = (lenh, ...a) => spawnSync("node", [lenh, ...a], { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" })
const co = (lat, mau = "^NDK") => ["--lat", lat, "--seed", "ndk", "--theo-nhom", "--moi-nhom-lon", "30", "--moi-nhom-nho", "5", "--so-nhom-lon", "2", "--nhom-khop", mau]
const soTang = async (lat) => Object.fromEntries((await c.query(
  `SELECT stratum, count(*)::int n FROM eval_label_items WHERE lat = $1 GROUP BY 1`, [lat])).rows.map((x) => [x.stratum, x.n]))
const bao = (a, b, n) => `gộp đơn vị trùng: ${MA[a]} ← ${MA[b]} · bài ở khoá phụ ${n}`
// Tên lát cũng bắt đầu bằng `ndk-` và được in, nên khớp đúng các khoá một chữ cái của fixture.
const KHOA_FIXTURE = /ndkk:|ndkz:|ndka:|ndk-[dstklm]\d?\b/

/** Một lượt đầy đủ trên một lát; trả về [khoá lời hứa, đạt?, thông điệp đỏ]. Bản thật in `ok <khoá>`, đột biến đọc thông điệp đỏ. */
async function doMau(lenh, lat) {
  const thu = chay(lenh, ...co(lat), "--thu")
  const ghi = chay(lenh, ...co(lat))
  if (ghi.status !== 0 || thu.status !== 0) throw new Error(`lệnh đỏ: ${ghi.stderr}${thu.stderr}`)
  const so = await soTang(lat)
  const { rows: [{ phu }] } = await c.query(
    `SELECT count(*)::int phu FROM eval_label_items i JOIN stg_zalo_posts p ON p.post_id = i.ref_id
      WHERE i.lat = $1 AND i.stratum = $2 AND p.conversation_id = 'ndkk:group:ndk-d'`, [lat, MA.D])
  const dongD = ghi.stdout.match(new RegExp(`nhóm ${MA.D}: chọn (\\d+)/(\\d+), nội dung (\\d+)`))
  const dongL2 = ghi.stdout.match(new RegExp(`nhóm ${MA.L2}: chọn (\\d+)/(\\d+)`))
  const thayBao = (s) => s.includes(bao("D", "Dp", 15)) && s.includes(bao("S", "Sp", 6)) && s.includes(bao("T", "Tp", 1))
  return [
    ["AC-1 mot tang", !so[MA.Dp] && !so[MA.Sp] && !so[MA.Tp] && so[MA.D] > 0, "loi tach tang"],
    ["AC-1 dung ma khoa tran", so[MA.S] > 0 && so[MA.T] > 0, "loi dai dien"],
    ["AC-1 khong vuot han muc", so[MA.L1] === 30 && so[MA.D] <= 30 && so[MA.S] === 5 && so[MA.T] === 3, "loi vuot han muc"],
    ["AC-1 khong gop qua tay", so[MA.Ka] === 3 && so[MA.Kb] === 3 && so[MA.Ma] === 2 && so[MA.Mb] === 2, "loi gop qua tay"],
    ["AC-2 bai khoa phu vao tang dai dien", phu === 12, "loi bai khoa phu"],
    ["AC-2 so noi dung la hop hai dang", dongD?.[3] === "24" && so[MA.D] === 24, "loi hop"],
    ["AC-2 xep theo so gop", dongD?.[2] === "30" && dongL2?.[2] === "5", "loi xep"],
    ["AC-3 bao gop ca --thu", thayBao(thu.stdout) && thayBao(ghi.stdout), "loi khong bao gop"],
    ["AC-3 canh bao khac the", ghi.stdout.includes(`${MA.T} và ${MA.Tp} khác thẻ nhóm`) && !ghi.stdout.includes(`${MA.D} và ${MA.Dp} khác thẻ`), "loi the"],
    ["AC-3 khong in khoa", !KHOA_FIXTURE.test(thu.stdout + thu.stderr + ghi.stdout + ghi.stderr), "loi in khoa"],
  ]
}

const loi = []
const banThat = await doMau(LENH, "ndk-that")
for (const [ten, dat, do_] of banThat) kiem(loi, dat, ten, do_)
// «AC-3 so bai khoa phu dung» nằm trong chuỗi báo: 15 bài của D gồm 3 bản trùng, 6 của S, 1 của T.
kiem(loi, banThat.find(([t]) => t === "AC-3 bao gop ca --thu")[1], "AC-3 so bai khoa phu dung", "loi so bai khoa phu")

kiem(loi, KHOA_FIXTURE.test("nhóm ndk-d") && KHOA_FIXTURE.test("ndkk:group:x") && !KHOA_FIXTURE.test("lát ndk-that"), "do: loi in khoa", "loi thuoc in khoa khong do")

const r = chay(LENH, ...co("ndk-sach", "^NDK L"))
kiem(loi, r.status === 0 && !/gộp đơn vị trùng|khác thẻ|tầng phụ/.test(r.stdout), "AC-3 khong co cap thi khong bao", `loi bao khi khong co cap: ${r.stdout.slice(-200)}`)

// Chiều đỏ: mỗi đột biến phải làm đỏ đúng lời hứa nó phá, trên cùng fixture.
for (const [ma, do_] of [["M1", "loi tach tang"], ["M1", "loi bai khoa phu"], ["M2", "loi dai dien"], ["M3", "loi khong bao gop"], ["M4", "loi gop qua tay"], ["M5", "loi xep"], ["M6", "loi hop"]]) {
  const lat = `ndk-dot-${ma.toLowerCase()}`
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [lat])
  const kq = await voiDotBien(ma, (lenh) => doMau(lenh, lat))
  const hong = kq.filter(([, dat]) => !dat).map(([, , d]) => d)
  kiem(loi, hong.includes(do_), `do ${ma}: ${do_}`, `loi thuoc khong do: ${ma} khong lam hong «${do_}» (hong: ${hong.join(", ")})`)
}

// AC-5: lát do chính bản khoá nguyên văn ghi ra, có dòng ở tầng phụ.
const LAT_CU = "ndk-cu"
await voiDotBien("M1", async (lenh) => {
  const g = chay(lenh, ...co(LAT_CU))
  if (g.status !== 0) throw new Error(g.stderr)
})
const banCu = await soTang(LAT_CU)
kiem(loi, banCu[MA.Dp] > 0 && banCu[MA.Sp] > 0, "AC-5 lat moi co tang phu", `loi lat moi: ${JSON.stringify(banCu)}`)
const banBam = async (lat) => (await c.query(
  `SELECT md5(string_agg(item_id::text || coalesce(stratum,'') || ref_id, '|' ORDER BY item_id)) h FROM eval_label_items WHERE lat = $1`, [lat])).rows[0].h
const truocCu = await banBam(LAT_CU)
const lai = chay(LENH, ...co(LAT_CU))
kiem(loi, lai.status === 0 && (await banBam(LAT_CU)) === truocCu, "AC-5 khong them khong doi", `loi lat cu doi: ${lai.stderr}`)
const cau = (n, ma) => `lát đã có ${n} dòng ở tầng phụ ${ma} — giữ nguyên, gắn tiếp được; số của nhóm này đang chia hai tầng, muốn một tầng thì lấy mẫu lát tên mới`
kiem(loi, lai.stdout.includes(cau(banCu[MA.Dp], MA.Dp)) && lai.stdout.includes(cau(banCu[MA.Sp], MA.Sp)), "AC-5 cau bao dung nguyen van", `loi cau bao: ${lai.stdout.slice(-300)}`)
kiem(loi, !/xoá|xóa/i.test(lai.stdout), "AC-5 khong khuyen xoa", "loi khuyen xoa")
const sach = chay(LENH, ...co("ndk-that"))
kiem(loi, sach.status === 0 && !/tầng phụ/.test(sach.stdout), "AC-5 lat sach khong bao", `loi lat sach bao: ${sach.stdout.slice(-200)}`)

// AC-6: lệnh không đổi sổ và bài; thước băm đỏ khi chính probe đổi một dòng rồi hoàn lại.
const bamSo = async () => (await c.query(`SELECT md5(string_agg(u::text, '|' ORDER BY id)) h FROM collection_units u`)).rows[0].h
const bamBai = async () => (await c.query(`SELECT md5(string_agg(p::text, '|' ORDER BY post_id)) h FROM stg_zalo_posts p`)).rows[0].h
const [so0, bai0] = [await bamSo(), await bamBai()]
await c.query(`DELETE FROM eval_label_items WHERE lat = 'ndk-bam'`)
const ghi = chay(LENH, ...co("ndk-bam"))
kiem(loi, ghi.status === 0 && (await bamSo()) === so0, "AC-6 bam so khong doi", "loi bam so")
kiem(loi, (await bamBai()) === bai0, "AC-6 bam bai khong doi", "loi bam bai")
const tenCu = "NDK L2"
await c.query(`UPDATE collection_units SET name = 'NDK đổi thử' WHERE unit_code = $1`, [MA.L2])
kiem(loi, (await bamSo()) !== so0, "do: loi bam so", "loi thuoc bam khong do")
await c.query(`UPDATE collection_units SET name = $2 WHERE unit_code = $1`, [MA.L2, tenCu])
kiem(loi, (await bamSo()) === so0, "do: bam so ve goc sau hoan lai", "loi hoan lai so")
// Đổi cột ngoài khoá: thước băm phải đỏ với cả dòng, không chỉ post_id và conversation_id.
const { rows: [{ text: chuCu }] } = await c.query(`SELECT text FROM stg_zalo_posts WHERE post_id = 'ndk-1'`)
await c.query(`UPDATE stg_zalo_posts SET text = 'NDK đổi thử' WHERE post_id = 'ndk-1'`)
kiem(loi, (await bamBai()) !== bai0, "do: loi bam bai", "loi thuoc bam bai khong do")
await c.query(`UPDATE stg_zalo_posts SET text = $1 WHERE post_id = 'ndk-1'`, [chuCu])
kiem(loi, (await bamBai()) === bai0, "do: bam bai ve goc sau hoan lai", "loi hoan lai bai")
const tt = await docThiTruongNhom(c)
kiem(loi, tt.get("ndk-d")?.includes(thiTruong) && tt.get("ndkk:group:ndk-d")?.includes(thiTruong), "AC-6 thi truong ca hai dang", "loi thi truong mat dang khoa")

await don()
await c.end()
console.log(loi.length ? `MAU HAI KHOA FAIL (${loi.length})` : "MAU HAI KHOA OK")
process.exit(loi.length ? 1 : 0)
