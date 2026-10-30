// dong-thuan.mjs — E7 (AC-6). Chạy dưới tsx từ app/: `cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/dong-thuan.mjs`.
// Nhãn đi qua BỘ GHI THẬT (chuanHoaLuot + ghiNhan của app) rồi COMMIT vào lát thử mgn-dt trên DB thử; view và lệnh
// label-agreement (tiến trình con) phải ra đúng bảng kỳ vọng viết trước. Đối chứng: bản view coi «một bên tin không nêu»
// là khớp → «NULL KHONG PHAI KHOP»; bản phút công cộng cả khoảng nghỉ → «PHUT CONG CONG KHOANG NGHI».
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { MIGRATION, ROOT, URL_THU, donThu, kiem, noiDbThu } from "./_db.mjs"

process.env.DATABASE_URL = URL_THU
const { chuanHoaLuot } = await import(pathToFileURL(path.join(ROOT, "app/src/lib/labels-normalize.ts")).href)
const { ghiNhan } = await import(pathToFileURL(path.join(ROOT, "app/src/lib/labels-queries.ts")).href)

const LAT = "mgn-dt"
const CO_SO = {
  listing_intent: { value: "offer" }, kind: { value: "sale" }, property_type: { value: "apartment" },
  project: { value: "Tòa Ocean" }, building: { value: "LD2" },
  price_min_vnd: { value: "4,35", unit: "ty" }, price_max_vnd: { value: "4,35", unit: "ty" },
  area_m2: { value: "64,5" }, bedrooms: { value: "2" },
}
// d1: A cơ sở; B lệch ý định, cùng «tin không nêu» dự án, « ld2 », giá viết theo triệu, diện tích không nêu, 3 PN.
const D1_A = { ...CO_SO, project: { not_stated: true } }
const D1_B = { ...CO_SO, listing_intent: { value: "inquiry" }, project: { not_stated: true }, building: { value: " ld2 " },
  price_min_vnd: { value: "4350", unit: "trieu" }, price_max_vnd: { value: "4350", unit: "trieu" },
  area_m2: { not_stated: true }, bedrooms: { value: "3" } }
// d3: B giống A, dự án viết chữ tổ hợp (NFD).
const D3_B = { ...CO_SO, project: { value: "Tòa Ocean".normalize("NFD") } }
const KY_VONG = {
  listing_intent: [2, 1, 0.5], kind: [2, 2, 1], property_type: [2, 2, 1], project: [2, 2, 1], building: [2, 2, 1],
  price_min_vnd: [2, 2, 1], price_max_vnd: [2, 2, 1], area_m2: [2, 1, 0.5], bedrooms: [2, 1, 0.5],
}

const c = await noiDbThu()
const tmp = mkdtempSync(path.join(tmpdir(), "mgn-dt-"))
const loi = []
const k = (d, ok, fail) => kiem(loi, d, ok, fail)
try {
  await donThu(c)
  const item = async (ref, dbl, lat = LAT) =>
    (await c.query(`INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed)
                    VALUES ($1,'S03',$2,$2,'dev',$3,'dt') RETURNING item_id::int`, [lat, ref, dbl])).rows[0].item_id
  const [d1, d2, d3, d4, d5] = [await item("mgn-d1", true), await item("mgn-d2", true), await item("mgn-d3", true), await item("mgn-d4", false), await item("mgn-d5", false)]
  const t0 = Date.parse("2026-10-30T02:00:00Z")
  const gan = async (u, id, raw, phut) => {
    const ch = chuanHoaLuot(raw)
    if (!ch.ok) throw new Error(`chuan hoa loi: ${JSON.stringify(ch.loi)}`)
    const kq = await ghiNhan(c, u, LAT, id, ch.rows)
    if (!kq.ok) throw new Error(`ghi loi: ${kq.error}`)
    await c.query(`UPDATE eval_labels SET labeled_at = $3 WHERE item_id = $1 AND labeler_id = $2`, [id, u, new Date(t0 + phut * 60_000)])
  }
  // A lưu ở phút 0, 2, 5, 45, 48 (nghỉ 40 phút giữa lượt 3 và 4) → 8 phút; B lưu ở phút 1 và 30 (cách 29 phút) → 0.
  await gan("mgn-A", d1, D1_A, 0)
  await gan("mgn-A", d2, CO_SO, 2)
  await gan("mgn-A", d3, CO_SO, 5)
  await gan("mgn-A", d4, CO_SO, 45)
  await gan("mgn-A", d5, CO_SO, 48)
  await gan("mgn-B", d1, D1_B, 1)
  await gan("mgn-B", d3, D3_B, 30)

  const kiemView = async (q, im = false) => {
    const sai = []
    const { rows } = await q.query(`SELECT field, cap_du, khop, ti_le::float8 AS ti_le FROM eval_label_agreement WHERE lat = $1`, [LAT])
    for (const [f, [cap, khop, tl]] of Object.entries(KY_VONG)) {
      const r = rows.find((x) => x.field === f)
      const dung = r && r.cap_du === cap && r.khop === khop && r.ti_le === tl
      if (!dung) sai.push(`${f}: co ${JSON.stringify(r)} can ${cap}/${khop}/${tl}`)
      else if (!im) console.log(`ok ${f} cap_du=${cap} khop=${khop} ti_le=${tl}`)
    }
    return sai
  }
  const sai = await kiemView(c)
  k(sai.length === 0, "view dung bang ky vong (khu hoi: 4,35 ty = 4350 trieu, 'LD2' = ' ld2 ', NFC = NFD)", `VIEW SAI: ${sai.join("; ")}`)

  // Trường chưa có cặp → tỉ lệ NULL, không phải 0 (lát chỉ có tin đơn).
  const s1 = await item("mgn-s1", false, "mgn-dt0")
  const ch = chuanHoaLuot(CO_SO)
  await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) SELECT $1, 'mgn-A', f, v, n FROM unnest($2::text[], $3::text[], $4::bool[]) AS t(f, v, n)`,
    [s1, ch.rows.map((r) => r.field), ch.rows.map((r) => r.value), ch.rows.map((r) => r.not_stated)])
  const { rows: r0 } = await c.query(`SELECT count(*)::int AS n, count(*) FILTER (WHERE ti_le IS NULL AND cap_du = 0)::int AS rong FROM eval_label_agreement WHERE lat = 'mgn-dt0'`)
  k(r0[0].n === 9 && r0[0].rong === 9, "chua co cap: ti_le NULL (khong phai 0) o ca 9 truong", "CHUA CO CAP MA KHONG NULL")

  // Lệnh thật, tiến trình con.
  const out = execFileSync("node", [path.join(ROOT, "pipeline/label-agreement.mjs"), "--lat", LAT, "--json"],
    { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" })
  const j = JSON.parse(out)
  const lenhDung = Object.entries(KY_VONG).every(([f, [cap, khop, tl]]) => {
    const r = j.truong.find((x) => x.field === f)
    return r && r.cap_du === cap && r.khop === khop && r.ti_le === tl
  })
  k(lenhDung, "label-agreement --json: cung so voi view", "LENH LECH VIEW")
  k(j.thap_nhat?.ti_le === 0.5, `thap_nhat ${j.thap_nhat?.field} 0.5`, `THAP NHAT SAI: ${JSON.stringify(j.thap_nhat)}`)
  k(j.phut_cong["mgn-A"] === 8 && j.phut_cong["mgn-B"] === 0, "phut_cong A=8 B=0", `PHUT CONG SAI: ${JSON.stringify(j.phut_cong)}`)

  // Đối chứng 1: view coi «một bên tin không nêu» là khớp — trong giao dịch, ROLLBACK.
  const goc = "(a.not_stated AND b.not_stated) OR (NOT a.not_stated AND NOT b.not_stated AND a.value = b.value)"
  if (!MIGRATION.includes(goc)) loi.push("DOI CHUNG VIEW KHONG DUNG DUOC")
  await c.query("BEGIN")
  try {
    await c.query(MIGRATION.replace(goc, "a.not_stated OR b.not_stated OR a.value = b.value"))
    const saiDot = await kiemView(c, true)
    k(saiDot.some((s) => s.startsWith("area_m2")), "doi chung: view coi khong-neu la khop bi bat 'NULL KHONG PHAI KHOP'", "NULL KHONG PHAI KHOP — doi chung khong do")
  } finally {
    await c.query("ROLLBACK")
  }
  // Đối chứng 2: phút công cộng cả khoảng nghỉ.
  const lib = readFileSync(path.join(ROOT, "pipeline/lib/eval-labels.mjs"), "utf8")
  const dot = lib.replace("export const NGHI_PHUT = 10;", "export const NGHI_PHUT = 1e9;")
    .replace('from "../transform-zalo.mjs"', `from "${pathToFileURL(path.join(ROOT, "pipeline/transform-zalo.mjs")).href}"`)
  if (dot === lib) loi.push("DOI CHUNG PHUT CONG KHONG DUNG DUOC")
  writeFileSync(path.join(tmp, "eval-labels-dot.mjs"), dot)
  const { phutCong } = await import(pathToFileURL(path.join(tmp, "eval-labels-dot.mjs")).href)
  const { rows: moc } = await c.query(`SELECT DISTINCT labeler_id, labeled_at FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1`, [LAT])
  k(phutCong(moc)["mgn-A"] !== 8, "doi chung: ban cong khoang nghi bi bat 'PHUT CONG CONG KHOANG NGHI'", "PHUT CONG CONG KHOANG NGHI — doi chung khong do")
} finally {
  await donThu(c)
  await c.end()
  const { pool } = await import(pathToFileURL(path.join(ROOT, "app/src/lib/db.ts")).href)
  await pool.end().catch(() => {})
  rmSync(tmp, { recursive: true, force: true })
}
console.log(loi.length ? `DONG THUAN FAIL (${loi.length})` : "DONG THUAN OK")
process.exit(loi.length ? 1 : 0)
