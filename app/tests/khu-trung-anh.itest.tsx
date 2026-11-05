// khu-trung-anh.itest.tsx — hồ sơ _acceptance/khu-trung-anh-tin (GT1), ca «KTA-AC-7»: 20 entry 13 băm ghi qua transform-media thật vào DB
// thử, rồi ba bên đọc thật. Một giao dịch ROLLBACK; pool của app đi qua đúng client đó. Không nằm trong glob `npm test` vì cần DB thử.
import { test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { KHOA, runTransformMedia } from "../../pipeline/transform-media.mjs"
import type { User } from "../src/lib/auth"
import { loadFlowMedia } from "../src/lib/data-flow-queries"
import { pool } from "../src/lib/db"
import { getDeal } from "../src/lib/deals"
import { loadReviewMedia } from "../src/lib/ops/review-media"

const DB_URL = process.env.DATABASE_URL ?? ""
const P = `kta${process.pid}`
const ADMIN: User = { id: "1", email: "admin@x.vn", plan: "pro", role: "admin" }

const kiemBa = (ten: string, srcs: string[], mong: string[]) => assert.deepEqual(srcs, mong, `KTA-AC-7 ${ten} sai ảnh`)

test("KTA-AC-7 Hàng duyệt, hồ sơ tin, Căn giá tốt mỗi nơi nhận đúng 12 ảnh khác nội dung theo thứ tự", { timeout: 180_000 }, async () => {
  assert.match(DB_URL, /\/oneinvest_[a-z0-9_]+$/, "cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>")
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  const goc = pool.query
  ;(pool as unknown as { query: unknown }).query = (text: string, values?: unknown[]) => c.query(text, values)
  try {
    await c.query("BEGIN")
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA])
    const snap = (await c.query(`SELECT snapshot_id FROM stg_zalo_posts WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)' AND split_part(snapshot_id, '__', 2) <> 'example' LIMIT 1`)).rows[0].snapshot_id
    // 20 entry, 13 băm: lần đầu của mỗi băm là entry 0…12, bảy entry cuối đăng lại băm 0…6.
    const files = Array.from({ length: 20 }, (_, i) => ({ url: `https://img.example.test/${P}/${i}.jpg`, file: `media/${P}-${i}.jpg`, snapshotId: snap, sha256: (i % 13).toString(16).repeat(64) }))
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, media, media_files, posted_at, sender_id, conversation_id) VALUES ($1, $2, 'Bán căn hộ 2PN giá 3 tỷ', '[]'::jsonb, $3::jsonb, now(), $4, $5)`, [`${P}-p`, snap, JSON.stringify(files), `n-${P}`, `g-${P}`])
    const id = `${P}-o`
    await c.query(
      `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier, property_type, area_m2, price_vnd, price_perm2, bait_gap_pct)
       VALUES ($1, 'S03', 'sale', 'high', now(), now(), $2::text[], 'P1', 'apartment', 50, 2000000000, 40000000, 25)`,
      [id, [`${P}-p`]],
    )
    await runTransformMedia(c, ["S03"])
    const n = (await c.query("SELECT count(*)::int AS n FROM media WHERE resource_record_key = $1", [id])).rows[0].n
    assert.equal(n, 13, "KTA-AC-7 bảng phải còn đúng 13 dòng")
    const mong = Array.from({ length: 12 }, (_, i) => `media/${P}-${i}.jpg`)
    const tenTep = (imgs: { src: string }[]) => imgs.map((i) => new URL(i.src, "http://x").searchParams.get("file") ?? i.src)
    const q = (text: string, values: unknown[]) => c.query(text, values) as never

    const the = await loadReviewMedia([{ id: 1, item_type: "agent_output", evidence: { offer_id: id } }], ADMIN, q)
    kiemBa("Hàng duyệt", tenTep(the[1].offer!), mong)
    const flow = await loadFlowMedia([{ offerId: id, source: "S03" }], ADMIN, q)
    kiemBa("hồ sơ tin", tenTep(flow[id]), mong)
    const { deal } = await getDeal(id)
    assert.ok(deal, "KTA-AC-7 Căn giá tốt không thấy căn")
    kiemBa("Căn giá tốt", tenTep(deal.images), mong)
    // Đối chứng: thước phải đỏ khi thiếu một ảnh.
    assert.throws(() => kiemBa("đối chứng", tenTep(deal.images).slice(1), mong), /KTA-AC-7 đối chứng sai ảnh/)
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
  await pool.end().catch(() => {})
})
