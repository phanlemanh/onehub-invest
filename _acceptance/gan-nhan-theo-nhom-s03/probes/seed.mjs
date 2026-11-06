// seed.mjs — mồi cho E4, E8, E17 (ui-check) trên DB thử: lát s03-theo-nhom chỉ gồm bài mồi, lấy bằng lệnh thật qua --nhom-khop, để
// ảnh chứng không mang chữ bài thật (tên miền nguồn trong URL ảnh là tầng A, luật 6). Ba nhóm thử cho lượt hai (có máy đọc và
// thẻ, không máy không thẻ, bài ba tin), một bài chữ dài, và người thử vai ops, viewer. Cookie ghi vào tệp ở
// đối số `--cookie <tệp>`, không in ra. Chạy lại được: xoá dữ liệu thử trước khi đặt. `--nhan` thêm nhãn và trường hợp cho E17.
import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import path from "node:path"

import { ROOT, URL_THU, noiDbThu } from "./_db.mjs"

const LAT = "s03-theo-nhom"
const argv = process.argv.slice(2)
const tepCookie = argv.includes("--cookie") ? argv[argv.indexOf("--cookie") + 1] : null
const c = await noiDbThu()
try {
  await c.query(`DELETE FROM eval_label_items WHERE lat = $1`, [LAT])
  await c.query(`DELETE FROM sale_offer_records WHERE offer_id LIKE 'gcn-seed-%'`)
  await c.query(`DELETE FROM silver_labels WHERE post_id LIKE 'gcn-seed-%'`)
  await c.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'gcn-seed-%'`)
  await c.query(`DELETE FROM collection_units WHERE source_code = 'S03' AND group_key LIKE 'gcn-seed-%'`)
  await c.query(`DELETE FROM users WHERE email LIKE '%@gcn-seed.test'`)
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('hcm__s03__gcnseed', 'hcm', 's03', '{}'::jsonb) ON CONFLICT DO NOTHING`)
  const NHOM = [
    ["co-may", "GCN thử có máy đọc", "Nhóm môi giới chuyên Vinhomes Grand Park. Thành viên hiểu ngầm dự án nên bài thường không ghi tên."],
    ["khong-may", "GCN thử chưa có máy", null],
    ["ba-tin", "GCN thử bài ba tin", "Nhóm thử có thẻ."],
  ]
  const ma = {}
  for (const [k, ten, the] of NHOM) {
    const { rows } = await c.query(
      `INSERT INTO collection_units (source_code, name, group_key, note) VALUES ('S03', $1, $2, $3) RETURNING unit_code`, [ten, `gcn-seed-${k}`, the])
    ma[k] = rows[0].unit_code
  }
  const BAI = [
    ["gcn-seed-1", "co-may", "📍RB 🏡2PN1WC full nội thất 👉Giá: 8tr"],
    ["gcn-seed-2", "co-may", "Cho thuê 2PN+ S10.05 nội thất đầy đủ, ban công hướng Đông Nam, view nội khu.\nGiá 8,5tr/tháng, cọc 1 đóng 3. Vào ở ngay, có thể xem nhà cuối tuần.\nLH 0912 345 678.\nDiện tích 59m2, tầng trung, trục 12.\nCòn nhiều căn tương tự, nhắn để xem thêm ảnh thực tế và lịch xem nhà."],
    ["gcn-seed-3", "khong-may", "Bán căn 1PN giá tốt, nhắn riêng"],
    ["gcn-seed-4", "ba-tin", "Quỹ căn: 1PN 6tr, 2PN 8tr, 3PN 12tr, liên hệ em Lan"],
  ]
  for (const [id, k, text] of BAI) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, conversation_id, text, posted_at) VALUES ($1, 'hcm__s03__gcnseed', $2, $3, $4, now())`,
      [id, NHOM.find((n) => n[0] === k)[1], `gcn-seed-${k}`, text])
  }
  process.stdout.write(execFileSync("node", [path.join(ROOT, "pipeline/label-sample.mjs"), "--lat", LAT, "--seed", "gc0-seed", "--theo-nhom", "--moi-nhom-lon", "30", "--moi-nhom-nho", "5", "--so-nhom-lon", "10", "--nhom-khop", "^GCN thử"],
    { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" }).split("\n").slice(0, 6).join("\n") + "\n")
  const TIN = [["gcn-seed-a", "gcn-seed-1", 8000000], ["gcn-seed-b1", "gcn-seed-4", 6000000], ["gcn-seed-b2", "gcn-seed-4", 8000000], ["gcn-seed-b3", "gcn-seed-4", 12000000]]
  for (const [o, p, gia] of TIN) {
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, price_vnd, bedrooms, block_raw) VALUES ($1, 'rent_lt', now(), now(), ARRAY[$2], $3, 2, 'RB')`, [o, p, gia])
  }
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id) VALUES ('S03', 'gcn-seed-1', 'h', 'gcn-seed', 'v', 'offer', 'rent_lt', true, 'gcn-seed')`)

  const nguoi = {}
  for (const [ten, vai] of [["ops", "ops"], ["ops2", "ops"], ["viewer", "viewer"]]) {
    const id = `usr_${randomBytes(6).toString("hex")}`
    const token = randomBytes(32).toString("hex")
    await c.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'x$y', $3)`, [id, `${ten}@gcn-seed.test`, vai])
    await c.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '2 day')`, [token, id])
    nguoi[ten] = { id, cookie: `oi_session=${token}` }
  }
  if (tepCookie) writeFileSync(tepCookie, JSON.stringify(Object.fromEntries(Object.entries(nguoi).map(([k, v]) => [k, v.cookie]))), { mode: 0o600 })

  if (argv.includes("--nhan")) {
    const { rows: items } = await c.query(`SELECT item_id, stratum FROM eval_label_items WHERE lat = $1 AND ref_id IN ('gcn-seed-1', 'gcn-seed-3', 'gcn-seed-4')`, [LAT])
    for (const it of items) {
      await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, $2, 'project', 'vinhomes grand park', false, 'ngu_canh_nhom')`, [it.item_id, nguoi.ops2.id])
      await c.query(`INSERT INTO eval_label_cases (item_id, labeler_id, case_kind, note) VALUES ($1, $2, 'mac-dinh-nhom', 'LYDO-KHONG-LEN-BANG')`, [it.item_id, nguoi.ops2.id])
    }
  }
  console.log(`seed xong: nhóm thử ${Object.values(ma).join(", ")}`)
  console.log(JSON.stringify(ma))
  console.log(`mở nhóm: /ops/labels?nhom=<mã>. co-may có bản máy đọc, thẻ, bài chữ dài · khong-may không máy, không thẻ · ba-tin bài ba tin${argv.includes("--nhan") ? " · --nhan: cả ba nhóm thử đã có nhãn và trường hợp của người khác, chỉ dùng cho bảng trường hợp (E17)" : ""}`)
  const { rows: tk } = await c.query(`SELECT role FROM users WHERE email = 'ops-test@local.test'`)
  console.log(tk[0] ? `tài khoản thử ops-test@local.test có trên DB thử, vai ${tk[0].role}` : "THIẾU tài khoản ops-test@local.test trên DB thử: chạy DATABASE_URL=<DB thử> node scripts/dev-ops-account.mjs")
} finally {
  await c.end()
}
