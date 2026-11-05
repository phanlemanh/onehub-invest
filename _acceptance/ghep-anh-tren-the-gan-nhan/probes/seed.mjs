// seed.mjs — mồi cho E5, E8 (ui-check) trên DB thử: lát s03-theo-nhom chỉ còn bài mồi, ảnh giả ở thư mục chạy, tên miền example.test.
// `ghep` sinh bằng lệnh ghép thật, không chèn tay. Chạy: node seed.mjs. Bản chạy: cổng 3463, DATABASE_URL = DB thử, SNAPSHOTS_DIR = thư mục in ra.
import fs from "node:fs"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { deflateSync } from "node:zlib"

import { ghepLat } from "../../../pipeline/label-ghep.mjs"
import { M076, SNAP, SNAP_GOC, THU_MUC, URL_THU, noiDbThu } from "./_db.mjs"

const LAT = "s03-theo-nhom"
const U = (n) => `https://cdn.example.test/anh/${n}.png`

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
/** Ảnh PNG giả kẻ sọc, mỗi tấm một màu, để thấy chuyển ảnh. */
function pngGia(r, g, b) {
  const W = 240, H = 160, rows = []
  for (let y = 0; y < H; y++) {
    const dong = Buffer.alloc(1 + W * 3)
    for (let x = 0; x < W; x++) { const s = (Math.floor(x / 20) + Math.floor(y / 20)) % 2 ? 1 : 0.7; dong[1 + x * 3] = r * s; dong[2 + x * 3] = g * s; dong[3 + x * 3] = b * s }
    rows.push(dong)
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi("IHDR", ihdr), khoi("IDAT", deflateSync(Buffer.concat(rows))), khoi("IEND", Buffer.alloc(0))])
}
const dirAnh = path.join(SNAP_GOC, "hanoi", SNAP, "media")
fs.mkdirSync(dirAnh, { recursive: true })
const tep = (n) => {
  fs.writeFileSync(path.join(dirAnh, `${n}.png`), pngGia(60 + (n * 37) % 180, 60 + (n * 71) % 180, 60 + (n * 113) % 180))
  return JSON.stringify([{ url: U(n), file: `media/${n}.png`, snapshotId: SNAP }])
}

const c = await noiDbThu()
try {
  await c.query(M076)
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM silver_labels WHERE post_id LIKE 'ghep-seed-%'`)
  await c.query(`DELETE FROM enrichment_proposals WHERE offer_id = 'ghep-seed-o'`)
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id = 'ghep-seed-o'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'ghep-seed-%'`)
  await c.query(`DELETE FROM collection_units WHERE group_key = 'ghep-seed-g'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@ghep-seed.test'`)
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP])
  const { rows: [u] } = await c.query(`INSERT INTO collection_units (source_code, name, group_key, note) VALUES ('S03', 'Nhóm thử ghép', 'ghep-seed-g', 'Nhóm thử có thẻ.') RETURNING unit_code`)
  const goc = Date.now() - 86400000
  let so = 0
  const bai = async (id, nguoi, giay, text, files = null, media = null) => {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, sender_id, sender_name, text, posted_at, media, media_files)
                   VALUES ($1, $2, 'Nhóm thử ghép', 'ghep-seed-g', $3, 'Người thử', $4, $5, $6::jsonb, $7::jsonb)`,
      [`ghep-seed-${id}`, SNAP, nguoi, text, new Date(goc + giay * 1000), media, files])
  }
  let n = 0
  const anh = (id, nguoi, giay) => { n++; return bai(id, nguoi, giay, U(n), tep(n)) }
  // 1. một tin chữ, ba ảnh; dòng mẫu là hai bài ảnh cùng cụm, dòng sau là dòng trùng
  await bai("t1", "n1", 0, "Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu")
  await anh("a1", "n1", 5); await anh("a2", "n1", 6); await anh("a3", "n1", 7)
  // 2. nhiều tin chữ
  await bai("t2", "n2", 1000, "Bán căn 1PN thử"); await anh("a4", "n2", 1001); await bai("t3", "n2", 1010, "Bán căn 3PN thử")
  // 3. cụm 21 ảnh
  await bai("t4", "n3", 2000, "Bán căn cụm lớn thử")
  for (let i = 0; i < 21; i++) await anh(`l${i}`, "n3", 2001 + i)
  // 4. không tin chữ
  await anh("a5", "n4", 3000)
  // 5. có chữ không cụm
  await bai("t5", "n5", 4000, "Cho thuê studio thử, không ảnh")
  // 6. có chữ có cụm
  await bai("t6", "n6", 5000, "Bán căn có chữ có cụm thử"); await anh("a6", "n6", 5005); await anh("a7", "n6", 5006)
  // 7. một ảnh thiếu tệp giữa cụm
  await bai("t7", "n7", 6000, "Bán căn có ảnh lỗi thử"); await anh("a8", "n7", 6001)
  n++; await bai("a9", "n7", 6002, U(n), JSON.stringify([{ url: U(n), file: `media/${n}-khong-co.png`, snapshotId: SNAP }]))
  await anh("a10", "n7", 6003)
  for (const ref of ["a1", "a2", "a4", "l3", "a5", "t5", "t6", "a8"]) {
    so++
    await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'dev', false, 'ghep-seed', $4)`,
      [LAT, `ghep-seed-${ref}`, `h-${ref}`, u.unit_code])
  }
  const kq = await ghepLat(c, { lat: LAT, lamLai: true })
  // Mồi giá trị máy ở tin chữ và bài ảnh của cụm đầu: E8 soi phản hồi HTTP thật.
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, block_raw, area_m2) VALUES ('ghep-seed-o', 'sale', now(), now(), ARRAY['ghep-seed-t1'], 'TOAMAYSEED', 64.5)`)
  for (const id of ["t1", "a1"]) await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', $1, 'h', 'ghep-seed', 'v', 'inquiry', 'rent_lt', true, 'ghep-seed')`, [`ghep-seed-${id}`])
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) SELECT 'S03:ghep-seed-o', 'block_raw', '"MOIASSERTSEED"', 'inferred', 'e2_llm', now() WHERE NOT EXISTS (SELECT 1 FROM field_assertions WHERE subject_key = 'S03:ghep-seed-o')`)
  await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route) VALUES ('ghep-seed', 'ghep-seed-o', 'block_raw', '"MOIPROPSEED"', 'moi', 'e2_llm', 'review')`)
  const id = `usr_${randomBytes(6).toString("hex")}`
  const token = randomBytes(32).toString("hex")
  await c.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, 'ops@ghep-seed.test', 'x$y', 'ops')`, [id])
  await c.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '2 day')`, [token, id])
  fs.mkdirSync(THU_MUC, { recursive: true })
  fs.writeFileSync(path.join(THU_MUC, "cookie.txt"), `oi_session=${token}\n`, { mode: 0o600 })
  console.log(`seed xong: nhom ${u.unit_code}, ${so} dong, nhan ghep ${kq.nhan_ghep}, trung ${kq.trung}`)
  console.log("thu tu the: mot tin chu (co moi) | nhieu tin chu | cum 21 anh | khong tin chu | co chu khong cum | co chu co cum | co anh loi")
  console.log("moi may cua bai dau: TOAMAYSEED MOIASSERTSEED MOIPROPSEED rent_lt; chu seed: Cho thuê 2PN toà thử")
  console.log(`ban chay: cd app && DATABASE_URL=${URL_THU} SNAPSHOTS_DIR=${SNAP_GOC} npm run dev -- -p 3463`)
  console.log(`cookie o ${path.join(THU_MUC, "cookie.txt")}; mo /ops/labels?nhom=${u.unit_code}`)
} finally {
  await c.end()
}
