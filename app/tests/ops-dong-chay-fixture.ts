// ops-dong-chay-fixture.ts — fixture DÙNG CHUNG của trang «Dòng chảy dữ liệu» (không phải tệp test): bộ DF0
// (tests/ops-dong-chay.test.tsx, hồ sơ ops-dong-chay-df0) và DF1 (tests/dong-chay-cloud.test.tsx, hồ sơ
// dong-chay-len-cloud) đo trên CÙNG dữ liệu viết trước — không chép tay. Lược đồ tạm dựng bảng LIKE public.*, áp
// db/migrations/051 rồi chạy pipeline/sql/600 THẬT trên lược đồ đó (search_path), mốc ngày ghim qua `oneinvest.flow_now`.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

export const ROOT = join(import.meta.dirname, "..", "..")
export const MIGRATION_051 = join(ROOT, "db/migrations/051_data_flow_snapshot.sql")
export const FLOW_SQL_FILE = join(ROOT, "pipeline/sql/600_data_flow.sql")
export const flowSql = () => readFileSync(FLOW_SQL_FILE, "utf8")
export const migration051 = () => readFileSync(MIGRATION_051, "utf8")

/** Đoạn định nghĩa ghim trong 600 (`/*<<<TÊN*\/ … /*TÊN>>>*\/`) — IS_TEST · COMPLETE · ENRICH. */
export function fragment(name: "IS_TEST" | "COMPLETE" | "ENRICH", sql = flowSql()): string {
  const m = sql.match(new RegExp(`/\\*<<<${name}\\*/([\\s\\S]*?)/\\*${name}>>>\\*/`))
  assert.ok(m, `600_data_flow.sql thiếu đoạn ghim ${name}`)
  return m[1]
}

export const NOW = Date.parse("2026-10-26T05:00:00Z") // 12:00 VN ngày 26/10 → 7 ngày VN 20…26
export const vn = (s: string) => new Date(`${s}+07:00`).toISOString()
export const IN = "2026-10-24T09:00:00"
export const OLD = "2026-10-10T09:00:00" // ngoài 7 ngày
export const SNAP = "hanoi__zalo-agent__2026-10-24T090000"
export const TABLES = ["stg_zalo_posts", "sale_offers", "property_offers", "stg_chotot_ads", "stg_abnb_listings", "listings", "areas", "enrichment_proposals", "review_queue"]

// [post_id, snapshot_id, agent_id, group_name, posted_at, media, media_files]
export type Post = [string, string, string, string, string, unknown, unknown]
export const POSTS: Post[] = [
  ["p1", SNAP, "openclaw-hook", "Nhóm A", IN, [{ url: "https://photo-stal-1.zdn.vn/a.jpg" }, { url: "https://photo-stal-1.zdn.vn/b.jpg" }], [{ url: "https://photo-stal-1.zdn.vn/a.jpg", file: "media/a1.jpg" }]],
  ["p2", SNAP, "openclaw-hook", "Nhóm A", "2026-10-24T10:00:00", [{ url: "https://photo-stal-1.zdn.vn/c.jpg" }, { url: "https://photo-stal-1.zdn.vn/b.jpg" }], null],
  ["p3", SNAP, "openclaw-hook", "Nhóm B", "2026-10-24T11:00:00", null, null],
  ["p4", SNAP, "openclaw-hook", "Nhóm B", "2026-10-25T09:00:00", null, null],
  ["p5", SNAP, "openclaw-hook", "Nhóm A", OLD, null, null],
  ["p6", SNAP, "openclaw-hook", "Nhóm A", "2026-10-11T09:00:00", null, null],
  ["t1", "hanoi__zalo-mock__2026-10-24T090000", "openclaw-hook", "Nhóm A", IN, null, null],
  ["t2", SNAP, "e2e-agent", "Nhóm A", IN, null, null],
  ["t3", SNAP, "openclaw-hook", "TEST-G1", IN, null, null],
  ["f1", SNAP, "apify-facebook", "Nhóm FB", IN, [{ url: "https://scontent.fbcdn.net/f.jpg" }], null],
  ["f2", SNAP, "apify-facebook", "Nhóm FB", "2026-10-25T09:00:00", null, null],
]
// [offer_id, source, kind, property_type, price_vnd, area_m2, area_id, first_seen, post_ids, linked]
export type Offer = [string, string, string | null, string | null, number | null, number | null, string | null, string, string[], boolean]
export const OFFERS: Offer[] = [
  ["o1", "S03", "sale", "apartment", 3_000_000_000, 80, "vn-hanoi-a", IN, ["p1", "p2", "p3"], true],
  ["o2", "S03", "sale", "unknown", null, null, null, OLD, ["p5"], false],
  ["o3", "S05", "rent_lt", "unknown", 9_000_000, null, null, IN, ["f1"], false],
  ["c1", "S06", "sale", "house", 5_000_000_000, 60, "vn-hcmc-x", IN, [], true],
  ["c2", "S06", "rent_lt", "apartment", 8_000_000, 50, "vn-hcmc-x", IN, [], false],
  ["c3", "S06", "rent_lt", "room", 4_000_000, 25, "vn-hcmc-y", IN, [], false],
]

type Q = { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }

/** Chạy `fn` với một client gắn lược đồ `schema` (search_path) — đóng sau đó. */
export async function inSchema<T>(schema: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: schemaUrl(schema) })
  await c.connect()
  try {
    return await fn(c)
  } finally {
    await c.end()
  }
}

/** Dựng lược đồ tạm với dữ liệu viết trước + bảng 051 (áp migration THẬT trên lược đồ). `tables` bỏ bảng để dựng
 * lược đồ «máy chủ» (không stg_*). Không làm tươi — gọi `refreshFlow`. */
export async function makeFlowSchema(
  admin: Q,
  schema: string,
  {
    offers = OFFERS,
    ads = 4,
    tables = TABLES,
    migrate = true,
    fresh = true,
  }: { offers?: Offer[]; ads?: number; tables?: string[]; migrate?: boolean; fresh?: boolean } = {},
) {
  // fresh=false: lược đồ đã có (vd makeOpsSchema của bản tin) — chỉ thêm bảng còn thiếu và dữ liệu.
  if (fresh) {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${schema}"`)
  }
  for (const t of tables) await admin.query(`CREATE TABLE IF NOT EXISTS "${schema}".${t} (LIKE public.${t} INCLUDING DEFAULTS)`)
  if (tables.includes("stg_zalo_posts"))
    for (const [id, snap, agent, group, posted, media, files] of POSTS)
      await admin.query(
        `INSERT INTO "${schema}".stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, captured_at, media, media_files)
         VALUES ($1,$2,$3,$4,'bài thử',$5,$5,$6,$7)`,
        [id, snap, agent, group, vn(posted), media === null ? null : JSON.stringify(media), files === null ? null : JSON.stringify(files)],
      )
  for (const [id, source, kind, type, price, area, areaId, seen, postIds, linked] of offers) {
    await admin.query(
      `INSERT INTO "${schema}".sale_offers (offer_id, source, kind, property_type, price_vnd, area_m2, area_id, first_seen, last_seen, post_ids, confidence, n_reposts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,'medium',$10)`,
      [id, source, kind, type, price, area, areaId, vn(seen), postIds, Math.max(1, postIds.length)],
    )
    if (linked) await admin.query(`INSERT INTO "${schema}".property_offers (property_id, offer_id) VALUES (1, $1)`, [id])
  }
  if (tables.includes("stg_chotot_ads"))
    for (let i = 0; i < ads; i++)
      await admin.query(
        `INSERT INTO "${schema}".stg_chotot_ads (list_id, snapshot_id, region_v2, city_code, category, ad_type, payload, list_time)
         VALUES ($1,'hcmc__s06__x',1,'13000',1010,'s','{}',$2)`,
        [1000 + i, vn(IN)],
      )
  for (const id of ["l1", "l2"]) {
    if (tables.includes("stg_abnb_listings"))
      await admin.query(`INSERT INTO "${schema}".stg_abnb_listings (listing_id, snapshot_id, payload, fetched_at) VALUES ($1,'hanoi__airbnb__x','{}',$2)`, [id, vn(IN)])
    await admin.query(`INSERT INTO "${schema}".listings (id, area_id, last_seen) VALUES ($1,'vn-hanoi-a','2026-10-25')`, [id])
  }
  // Listing thấy lần cuối ngày 19/10 (giờ VN): ngoài cửa sổ 7 ngày 20…26 — ca biên ép ngày theo múi giờ phiên DB.
  await admin.query(`INSERT INTO "${schema}".listings (id, area_id, last_seen) VALUES ('l3','vn-hanoi-a','2026-10-19')`)
  if (migrate) await inSchema(schema, (c) => c.query(migration051()))
}

/** Chạy 600 (hay bản đột biến `sql`) trên lược đồ, mốc ngày `now`. */
export async function refreshFlow(schema: string, { now = NOW, sql = flowSql() }: { now?: number; sql?: string } = {}) {
  await inSchema(schema, async (c) => {
    await c.query(`SELECT set_config('oneinvest.flow_now', $1, false)`, [new Date(now).toISOString()])
    await c.query(sql)
  })
}
