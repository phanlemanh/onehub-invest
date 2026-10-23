// review-media-roundtrip.ts — AC-8 của _acceptance/review-media-backend: chạy loadReviewMedia
// trên DB local thật (:5433). Mọi dòng tạo trong MỘT giao dịch rồi ROLLBACK — không để lại gì.
// Chạy: cd app && node --import tsx scripts/review-media-roundtrip.ts
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { Pool } from "pg";

import type { User } from "../src/lib/auth";
import { loadReviewMedia, type PostMediaRow } from "../src/lib/ops/review-media";

const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("chỉ chạy trên DB local — DATABASE_URL không phải localhost");
  process.exit(2);
}

const nonce = `rmtest${randomBytes(4).toString("hex")}`;
const SNAP = `hcmc__zalo-agent__${nonce}`;
const OFFER = `offer_${nonce}`;
const OTHER = `offer_${nonce}_b`;
const POST1 = `${nonce}-p1`;
const POST2 = `${nonce}-p2`;
const ZDN_OK = `https://f1-zpg-r.zdn.vn/${nonce}/ok.jpg`;
const ZDN_ERR = `https://f1-zpg-r.zdn.vn/${nonce}/loi.jpg`;
const FB = `https://scontent.xx.fbcdn.net/v/${nonce}.jpg?oe=6720`;
const CHOTOT = `https://cdn.chotot.com/${nonce}/x.jpg`;
const ADMIN: User = { id: "0", email: "roundtrip@local", plan: "pro", role: "admin" };
const local = (file: string) =>
  `/api/zalo-media?snapshot=${encodeURIComponent(SNAP)}&file=${encodeURIComponent(file)}`;

const pool = new Pool({ connectionString: url, max: 1 });
const ok = (msg: string) => console.log(`ok   ${msg}`);

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hcmc', 'zalo-agent', '{}'::jsonb)`,
      [SNAP],
    );
    await client.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, media, media_files) VALUES
         ($1, $3, 'bài 1', $4::jsonb, $5::jsonb),
         ($2, $3, 'bài 2', $6::jsonb, NULL)`,
      [
        POST1,
        POST2,
        SNAP,
        JSON.stringify([{ url: ZDN_OK, path: null, type: "image/jpeg" }]),
        JSON.stringify([
          { url: ZDN_OK, file: "media/ok.jpg", sha256: "x", bytes: 9, snapshotId: SNAP },
          { url: ZDN_ERR, file: null, error: "timeout", snapshotId: SNAP },
        ]),
        JSON.stringify([{ url: FB, path: null, type: "image/jpeg" }]),
      ],
    );
    // post_ids cố ý đảo: POST2 (fbcdn) đứng trước POST1 → thứ tự URL gốc phải theo post_ids.
    await client.query(
      `INSERT INTO sale_offers (offer_id, kind, first_seen, last_seen, post_ids, source)
       VALUES ($1, 'sale', now(), now(), ARRAY[$2, $3], 'S05'), ($4, 'sale', now(), now(), '{}', 'S06')`,
      [OFFER, POST2, POST1, OTHER],
    );

    const items = [
      { id: 1, item_type: "agent_output", evidence: { offer_id: OFFER, fields: [] } },
      {
        id: 2,
        item_type: "entity_match",
        evidence: { offer_a: { offer_id: OFFER }, offer_b: { offer_id: OTHER, image_url: CHOTOT } },
      },
    ];
    let calls = 0;
    const query = async (text: string, values: unknown[]) => {
      calls += 1;
      return client.query<PostMediaRow>(text, values);
    };
    const out = await loadReviewMedia(items, ADMIN, query);

    const expectedOffer = [
      { src: local("media/ok.jpg"), origin: "local", expiring: false },
      { src: FB, origin: "remote", expiring: true },
      { src: ZDN_ERR, origin: "remote", expiring: true },
    ];
    assert.equal(calls, 1);
    ok("một truy vấn cho cả hàng duyệt");
    assert.deepEqual(out[1], { offer: expectedOffer });
    ok("agent_output: ảnh local trước, rồi URL gốc theo thứ tự post_ids (fbcdn của p2, zdn lỗi của p1), không lặp URL đã có local");
    assert.deepEqual(out[2], {
      offer_a: expectedOffer,
      offer_b: [{ src: CHOTOT, origin: "remote", expiring: false }],
    });
    ok("entity_match: offer_a như trên, offer_b S06 không có post → chỉ image_url của evidence");
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }

  const left = await pool.query<{ n: number }>(
    `SELECT (SELECT count(*) FROM sale_offers WHERE offer_id LIKE $1)
          + (SELECT count(*) FROM stg_zalo_posts WHERE post_id LIKE $1)
          + (SELECT count(*) FROM airbnb_snapshots WHERE snapshot_id LIKE $2) AS n`,
    [`%${nonce}%`, `%${nonce}`],
  );
  const n = Number(left.rows[0].n);
  console.log(`dọn: còn ${n} dòng của lần chạy`);
  assert.equal(n, 0);
  console.log(`ROUNDTRIP PASS (${nonce})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
