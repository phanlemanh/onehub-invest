// bac-roundtrip.ts — PL16 de-xuat-thanh-phat-bieu-bac AC-5…AC-8 (E5, E6, E8, E10): bên ghi thật (pipeline/bac-du-lieu.mjs
// chạy như tiến trình con, đúng như cloud-sync gọi) → data_level_snapshot + dq_check_results → câu đếm độc lập và nhãn
// thật của /ops/quality (dq-labels.ts), trên bản chép DB máy thu. CHỈ chạy trên DB thử (bash db/db-thu.sh oneinvest_p2_bac):
// lượt này GHI ảnh chụp, một dòng mốc ngày hôm qua và dòng kiểm.
// Chạy: cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_bac node --import tsx scripts/bac-roundtrip.ts
//   --chieu-do  cộng 1 vào tổng ảnh chụp trước khi so — phải thoát 1 với «AC-5 lệch tổng» (chiều đỏ của thước).
import { spawnSync } from "node:child_process"
import path from "node:path"
import { Client } from "pg"

import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"

const url = process.env.DATABASE_URL ?? ""
const CLI = path.join(__dirname, "..", "..", "pipeline", "bac-du-lieu.mjs")
const NHAN_BAC = ["Có lời khai", "Đọc được", "Gắn căn", "Đã đo", "Xác minh", "Sống"]
const MA_LOAI = ["apartment", "house", "land", "room", "commercial", "unknown"]
const HONG: string[] = []
const dong = (s: string) => console.log(s)
const hong = (s: string) => {
  dong(s)
  HONG.push(s)
}

function cli(...args: string[]): string {
  const r = spawnSync(process.execPath, [CLI, ...args], { env: { ...process.env, DATABASE_URL: url }, encoding: "utf8" })
  if (r.status !== 0) throw new Error(`bac-du-lieu ${args.join(" ")} thoát ${r.status}: ${r.stderr.trim()}`)
  return r.stdout
}

/** null khi tổng ảnh chụp bằng căn + tin lẻ đếm độc lập; ngược lại dòng ghim. */
export function kiemTong(n: number, can: number, le: number): string | null {
  return n === can + le ? null : `AC-5 lệch tổng: ảnh chụp ${n} ≠ căn ${can} + tin lẻ ${le}`
}

// Câu đếm độc lập: không qua 610 — phường → cha market bằng truy vấn con, loại hình căn từ properties.
const SQL_DEM = `
  WITH u AS (
    SELECT 'can' AS unit, p.area_id, p.property_type, b.data_level
      FROM properties p JOIN property_data_level(NULL) b ON b.property_id = p.id
    UNION ALL
    SELECT 'tin_le', o.area_id, o.property_type,
           (SELECT data_level FROM offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id, false))
      FROM sale_offers o
     WHERE o.source IN ('S03', 'S05', 'S06') AND o.offer_id NOT IN (SELECT offer_id FROM property_offers))
  SELECT coalesce((SELECT m.id FROM areas w JOIN areas m ON m.id = w.parent_id
                    WHERE w.id = u.area_id AND m.region_type = 'market'), 'chua-ro') AS market_id,
         coalesce(property_type, 'unknown') AS property_type, unit, data_level, count(*)::int AS n
    FROM u GROUP BY 1, 2, 3, 4`
const khoa = (r: { market_id: string; property_type: string; unit: string; data_level: string }) =>
  `${r.market_id}|${r.property_type}|${r.unit}|${r.data_level}`
type Dong = { market_id: string; property_type: string; unit: string; data_level: string; n: number }
const homNay = (c: Client) => c.query<Dong>(`SELECT market_id, property_type, unit, data_level, n FROM data_level_snapshot
  WHERE snap_date = current_date ORDER BY 1, 2, 3, 4`).then((r) => r.rows)
const ngayKhac = (c: Client) => c.query<{ s: string }>(`SELECT snap_date::text || '|' || market_id || '|' || property_type
  || '|' || unit || '|' || data_level || '|' || n AS s FROM data_level_snapshot WHERE snap_date <> current_date ORDER BY 1`)
  .then((r) => r.rows.map((x) => x.s))

async function main() {
  const c = new Client({ connectionString: url })
  await c.connect()
  try {
    const { rows: [db] } = await c.query<{ db: string; t: string | null }>(
      "SELECT current_database() AS db, to_regclass('public.data_level_snapshot')::text AS t")
    if (db.db === "oneinvest") throw new Error("probe GHI data_level_snapshot — chỉ chạy trên DB thử")
    if (!db.t) throw new Error(`DB ${db.db} chưa có data_level_snapshot — áp db/migrations/056_data_level.sql trước`)

    await c.query(`INSERT INTO data_level_snapshot VALUES (current_date - 1, 'chua-ro', 'unknown', 'tin_le', 'B0', 7)
      ON CONFLICT (snap_date, market_id, property_type, unit, data_level) DO UPDATE SET n = 7`)
    const khacTruoc = await ngayKhac(c)
    const { rows: [mocKiem] } = await c.query<{ id: number }>("SELECT coalesce(max(id), 0) AS id FROM dq_check_results")

    cli("--write")
    const lan1 = await homNay(c)
    const { rows: [d] } = await c.query<{ can: number; le: number }>(`SELECT (SELECT count(*)::int FROM properties) AS can,
      (SELECT count(*)::int FROM sale_offers o WHERE o.source IN ('S03', 'S05', 'S06')
         AND NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id)) AS le`)
    const n = lan1.reduce((a, r) => a + r.n, 0) + (process.argv.includes("--chieu-do") ? 1 : 0)
    const lech = kiemTong(n, d.can, d.le)
    if (lech) hong(lech)
    else dong(`AC-5 tổng n=${n} = căn ${d.can} + tin lẻ ${d.le}`)
    if (kiemTong(n + 1, d.can, d.le) === null) hong("AC-5 thước tổng không đỏ khi tổng lệch 1")

    const dem = new Map((await c.query<Dong>(SQL_DEM)).rows.map((r) => [khoa(r), r.n]))
    const anh = new Map(lan1.map((r) => [khoa(r), r.n]))
    const tatCa = new Set([...dem.keys(), ...anh.keys()])
    const khop = [...tatCa].filter((k) => dem.get(k) === anh.get(k)).length
    if (khop === tatCa.size) dong(`AC-5 phân khúc: ${khop}/${tatCa.size} phân khúc khớp câu đếm độc lập`)
    else hong(`AC-5 phân khúc lệch: ${khop}/${tatCa.size} — ví dụ ${[...tatCa].find((k) => dem.get(k) !== anh.get(k))}`)

    cli("--write")
    const lan2 = await homNay(c)
    if (JSON.stringify(lan2) === JSON.stringify(lan1)) dong(`AC-5 lần hai: cùng ${lan2.length} dòng, cùng số`)
    else hong(`AC-5 lần hai lệch: ${lan1.length} → ${lan2.length} dòng`)
    const khacSau = await ngayKhac(c)
    if (khacSau.length >= 1 && JSON.stringify(khacSau) === JSON.stringify(khacTruoc)) dong(`AC-5 ngày khác: ${khacSau.length} dòng không đổi`)
    else hong(`AC-5 ngày khác bị đổi: ${khacTruoc.length} → ${khacSau.length} dòng`)

    const bang = cli()
    dong(bang.trimEnd())
    const [, tieuDe = ""] = bang.split("\n")
    const thieuNhan = NHAN_BAC.filter((x) => !tieuDe.includes(x))
    if (thieuNhan.length) hong(`AC-6 tiêu đề thiếu nhãn bậc: ${thieuNhan.join(", ")}`)
    const maTho = MA_LOAI.filter((x) => new RegExp(`\\b${x}\\b`).test(bang))
    if (maTho.length) hong(`AC-6 bảng còn mã loại hình chưa dịch: ${maTho.join(", ")}`)
    const tongIn = Number(bang.trimEnd().split("\n").at(-1)?.trim().split(/\s+/).at(-1))
    const tongAnh = lan2.reduce((a, r) => a + r.n, 0)
    if (tongIn === tongAnh) dong(`AC-6 dòng tổng = ${tongIn} khớp ảnh chụp`)
    else hong(`AC-6 dòng tổng ${tongIn} ≠ ảnh chụp ${tongAnh}`)

    const { rows: kiem } = await c.query<{ check_name: string; entity: string; status: string; detail: string }>(
      `SELECT check_name, entity, status, detail FROM dq_check_results
        WHERE id > $1 AND check_name IN ('enrich:proposal-assertion', 'data-level:distribution') ORDER BY id`, [mocKiem.id])
    const deXuat = kiem.filter((r) => r.check_name === "enrich:proposal-assertion").at(-1)
    if (deXuat) dong(`AC-7 enrich:proposal-assertion ${deXuat.status} ${deXuat.detail}`)
    else hong("AC-7 không thấy dòng kiểm enrich:proposal-assertion vừa ghi")
    if (deXuat && (deXuat.status === "fail") !== !/ missing=0$/.test(deXuat.detail)) hong("AC-7 trạng thái lệch số thiếu")
    const la = kiem.filter((r) => !dqCheckName(r.check_name).known || !dqEntityLabel(r.entity, new Map()).known
      || !dqDetail(r.check_name, r.detail).known)
    if (kiem.length >= 2 && la.length === 0) dong(`AC-8 ${kiem.length} dòng kiểm do bac-du-lieu ghi: 0 chưa diễn giải`)
    else hong(`AC-8 ${kiem.length} dòng kiểm do bac-du-lieu ghi: ${la.length} chưa diễn giải`)
  } finally {
    await c.end()
  }
  if (HONG.length) {
    dong(`bac-roundtrip: ${HONG.length} chỗ hỏng`)
    process.exit(1)
  }
  dong("bac-roundtrip: xanh")
}

main().catch((e) => {
  console.error(`bac-roundtrip: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
