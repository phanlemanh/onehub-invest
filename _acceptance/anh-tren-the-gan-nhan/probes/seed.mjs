// seed.mjs — mồi cho E4, E10, E11 (ui-check) trên DB thử: lát s03-theo-nhom chỉ còn bài mồi, ảnh giả ở thư mục chạy, tên miền example.test.
// Ảnh chứng không mang chữ hay ảnh thật. Chạy: node seed.mjs. Bản chạy: cổng 3463, DATABASE_URL = DB thử, SNAPSHOTS_DIR = thư mục in ra.
import fs from "node:fs"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { deflateSync } from "node:zlib"

import { M075, SNAP, SNAP_GOC, THU_MUC, noiDbThu, URL_THU } from "./_db.mjs"

const LAT = "s03-theo-nhom"
const U_LOI = "https://cdn.example.test/anh/khong-co.jpg"

function crc(buf) {
  let c, r = ~0
  for (const b of buf) { c = (r ^ b) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; r = c ^ (r >>> 8) }
  return ~r >>> 0
}
const khoi = (ten, data) => {
  const n = Buffer.alloc(4); n.writeUInt32BE(data.length)
  const t = Buffer.concat([Buffer.from(ten), data]); const z = Buffer.alloc(4); z.writeUInt32BE(crc(t))
  return Buffer.concat([n, t, z])
}
/** Ảnh PNG giả 480×320 kẻ sọc: đủ thấy cả khung khi xem lớn, không phải ảnh thật. */
function pngGia(r, g, b) {
  const W = 480, H = 320, rows = []
  for (let y = 0; y < H; y++) {
    const dong = Buffer.alloc(1 + W * 3)
    for (let x = 0; x < W; x++) { const s = (Math.floor(x / 40) + Math.floor(y / 40)) % 2 ? 1 : 0.7; dong[1 + x * 3] = r * s; dong[2 + x * 3] = g * s; dong[3 + x * 3] = b * s }
    rows.push(dong)
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi("IHDR", ihdr), khoi("IDAT", deflateSync(Buffer.concat(rows))), khoi("IEND", Buffer.alloc(0))])
}

const dirAnh = path.join(SNAP_GOC, "hanoi", SNAP, "media")
fs.mkdirSync(dirAnh, { recursive: true })
fs.writeFileSync(path.join(dirAnh, "gia-1.png"), pngGia(90, 140, 200))
fs.writeFileSync(path.join(dirAnh, "gia-2.png"), pngGia(200, 150, 90))

const c = await noiDbThu()
try {
  await c.query(M075)
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM silver_labels WHERE post_id LIKE 'anh-seed-%'`)
  await c.query(`DELETE FROM enrichment_proposals WHERE offer_id = 'anh-seed-o'`)
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id = 'anh-seed-o'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'anh-seed-%'`)
  await c.query(`DELETE FROM collection_units WHERE group_key = 'anh-seed-g'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@anh-seed.test'`)
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP])
  const { rows: [u] } = await c.query(`INSERT INTO collection_units (source_code, name, group_key, note) VALUES ('S03', 'Nhóm thử ảnh', 'anh-seed-g', 'Nhóm thử có thẻ.') RETURNING unit_code`)
  const tep = (f) => JSON.stringify([{ url: `https://cdn.example.test/anh/${f}`, file: `media/${f}`, snapshotId: SNAP }])
  const BAI = [
    ["1-chi-anh", "https://cdn.example.test/anh/gia-1.png", null, tep("gia-1.png")],
    ["2-chu-anh", "Bán căn 2PN trục 12, giá xem ảnh\nhttps://cdn.example.test/anh/gia-2.png", null, tep("gia-2.png")],
    ["3-anh-hong", U_LOI, JSON.stringify([{ url: U_LOI, type: "image/jpeg" }]), JSON.stringify([{ url: U_LOI, error: "http-500", snapshotId: SNAP }])],
    ["4-link-khac", "https://khac.example.test/nhom", null, null],
    ["5-khong-gi", "", null, null],
  ]
  for (const [id, text, media, files] of BAI) {
    const post = `anh-seed-${id}`
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, text, posted_at, media, media_files) VALUES ($1, $2, 'Nhóm thử ảnh', 'anh-seed-g', $3, now(), $4::jsonb, $5::jsonb)`, [post, SNAP, text, media, files])
    await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'dev', false, 'anh-seed', $4)`, [LAT, post, `h-${id}`, u.unit_code])
  }
  // Mồi giá trị máy đọc của bài đầu, để E4 soi phản hồi HTTP thật: trước khi lưu không được thấy các chữ này.
  const DAU = "anh-seed-1-chi-anh"
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, block_raw) VALUES ('anh-seed-o', 'sale', now(), now(), ARRAY[$1], 'TOAMAYSEED')`, [DAU])
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', $1, 'h', 'anh-seed', 'v', 'inquiry', 'rent_lt', true, 'anh-seed')`, [DAU])
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) SELECT 'S03:anh-seed-o', 'block_raw', '"MOIASSERTSEED"', 'inferred', 'e2_llm', now() WHERE NOT EXISTS (SELECT 1 FROM field_assertions WHERE subject_key = 'S03:anh-seed-o')`)
  await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route) VALUES ('anh-seed', 'anh-seed-o', 'block_raw', '"MOIPROPSEED"', 'moi', 'e2_llm', 'review')`)
  const id = `usr_${randomBytes(6).toString("hex")}`
  const token = randomBytes(32).toString("hex")
  await c.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, 'ops@anh-seed.test', 'x$y', 'ops')`, [id])
  await c.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '2 day')`, [token, id])
  fs.mkdirSync(THU_MUC, { recursive: true })
  fs.writeFileSync(path.join(THU_MUC, "cookie.txt"), `oi_session=${token}\n`, { mode: 0o600 })
  console.log(`seed xong: nhom ${u.unit_code}, 5 bai`)
  console.log("moi may cua bai dau: TOAMAYSEED MOIASSERTSEED MOIPROPSEED rent_lt")
  console.log(`ban chay: cd app && DATABASE_URL=${URL_THU} SNAPSHOTS_DIR=${SNAP_GOC} npm run dev -- -p 3463`)
  console.log(`cookie o ${path.join(THU_MUC, "cookie.txt")}; mo /ops/labels?nhom=${u.unit_code}`)
} finally {
  await c.end()
}
