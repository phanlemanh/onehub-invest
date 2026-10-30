// nap-nhan.tsx — fixture nhãn người cho E5/E7/E9b (eval-classify-wilson) trên DB THỬ. Chạy ở app/ bằng tsx:
//   cd app && DATABASE_URL=<DB thử> node --import tsx ../_acceptance/eval-classify-wilson/probes/nap-nhan.tsx
// stg_zalo_posts + eval_label_items viết tay (mã 'ecw-thu-…'); NHÃN ghi bằng bên ghi thật của PL7: chuanHoaLuot +
// ghiNhan (src/lib/labels-queries.ts). Mỗi bước COMMIT trên kết nối riêng của probe. Từ chối chạy trên DB oneinvest.
import { createRequire } from "node:module"

import { chuanHoaLuot, type RawLabels } from "../../../app/src/lib/labels-normalize"
import { ghiNhan } from "../../../app/src/lib/labels-queries"

// Tệp nằm ngoài app/: nạp pg từ node_modules của app.
const pg = createRequire(new URL("../../../app/package.json", import.meta.url))("pg")

const DB_URL = process.env.DATABASE_URL ?? ""
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error(`nap-nhan: chỉ chạy trên DB thử oneinvest_<…> — DATABASE_URL hiện là «${DB_URL.replace(/\/\/[^@]*@/, "//***@")}»`)
  process.exit(2)
}

const A = "ecw-thu-nguoi-a"
const B = "ecw-thu-nguoi-b"
const n = (v: string): { value: string } => ({ value: v })
const KHONG = { not_stated: true }
/** Lượt gắn đủ chín trường như người gõ trên màn. */
const luot = (kind: string): RawLabels => ({
  listing_intent: n("offer"),
  kind: n(kind),
  property_type: n("apartment"),
  project: n("Ocean Park 1"),
  building: n("PR2"),
  price_min_vnd: { value: "3,15", unit: "ty" },
  price_max_vnd: { value: "3,15", unit: "ty" },
  area_m2: n("64,5"),
  bedrooms: n("2"),
})
const luotNha: RawLabels = { ...luot("sale"), property_type: n("house"), building: KHONG, project: KHONG }

type Tin = { ref: string; lat: string; split: "test" | "dev"; doi: boolean; text: string | null; gan: [string, RawLabels][] }
export const FIXTURE: Tin[] = [
  { ref: "ecw-thu-1", lat: "ocp1", split: "test", doi: false, text: "Bán căn PR2 2PN 64.5m2 giá 3,15 tỷ", gan: [[A, luot("sale")]] },
  { ref: "ecw-thu-2", lat: "ocp1", split: "test", doi: true, text: "Chính chủ bán căn PR2.05 2PN 64.5m2 3,15 tỷ", gan: [[A, luot("sale")], [B, luot("sale")]] },
  { ref: "ecw-thu-3", lat: "ocp1", split: "test", doi: true, text: "Căn PR2 2PN 64.5m2 giá 3,15 tỷ", gan: [[A, luot("sale")], [B, luot("rent_lt")]] },
  { ref: "ecw-thu-4", lat: "ocp1", split: "test", doi: false, text: null, gan: [[A, luot("sale")]] },
  { ref: "ecw-thu-5", lat: "ocp1", split: "dev", doi: false, text: "Bán nhà 64.5m2 2PN giá 3,15 tỷ", gan: [[A, luotNha]] },
  { ref: "ecw-thu-6", lat: "ecw-khac", split: "test", doi: false, text: "Bán căn PR2 2PN 64.5m2 giá 3,15 tỷ", gan: [[A, luot("sale")]] },
]

async function main() {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  try {
    // stg_zalo_posts.snapshot_id có khoá ngoài tới airbnb_snapshots: mượn một snapshot S03 có sẵn của bản chép DB.
    const snap = (await c.query(`SELECT snapshot_id FROM stg_zalo_posts LIMIT 1`)).rows[0]?.snapshot_id
    if (!snap) throw new Error("nap-nhan: DB thử không có dòng stg_zalo_posts nào để mượn snapshot")
    for (const t of FIXTURE) {
      if (t.text != null) {
        await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text) VALUES ($1, $2, $3)`, [t.ref, snap, t.text])
      }
      const { rows } = await c.query(
        `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed)
         VALUES ($1, 'S03', $2, $2, $3, $4, 'ecw-thu') RETURNING item_id::int`,
        [t.lat, t.ref, t.split, t.doi],
      )
      for (const [nguoi, raw] of t.gan) {
        const ch = chuanHoaLuot(raw)
        if (!ch.ok) throw new Error(`nap-nhan: chuanHoaLuot từ chối ${t.ref}: ${JSON.stringify(ch.loi)}`)
        const kq = await ghiNhan(c, nguoi, t.lat, rows[0].item_id, ch.rows)
        if (!kq.ok) throw new Error(`nap-nhan: ghiNhan từ chối ${t.ref}: ${kq.error}`)
      }
    }
    console.log(`nap-nhan: ${FIXTURE.length} tin, ${FIXTURE.reduce((s, t) => s + t.gan.length, 0)} lượt gắn — COMMIT`)
  } finally {
    await c.end()
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
