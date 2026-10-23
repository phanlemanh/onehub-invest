// bait-gap-sellers.test.mjs — vòng canonical-khong-tin-gia (PL2) AC-7: registry sellers bỏ người bán
// không còn tin nào. BEGIN…ROLLBACK trên Postgres local :5433 — không để lại dòng nào.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { refreshBaitGap } from "../refresh-bait-gap.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // Cùng khoá với write-offers.test.mjs / agent tests: bộ đó nạp lại hàm 039 trong giao dịch —
    // chạy song song với một lượt đối soát là deadlock.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const H_ORPHAN = "t_pl2_orphan_hash_000000000000000";
const H_LIVE = "t_pl2_live_hash_00000000000000000";

async function seller(c, hash, nAds) {
  await c.query(
    `INSERT INTO sellers (phone_hash, sources, n_ads, first_seen, last_seen)
     VALUES ($1, '{S03}', $2, now(), now())`,
    [hash, nAds],
  );
}

async function offer(c, id, hash) {
  await c.query(
    `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids,
       price_tier, seller_phone_hash, property_type)
     VALUES ($1, 'TST', 'sale', 'medium', now(), now(), '{}', 'P1', $2, 'unknown')`,
    [id, hash],
  );
}

const exists = async (c, hash) => (await c.query(`SELECT n_ads FROM sellers WHERE phone_hash = $1`, [hash])).rows[0];

test("AC-7 sellers mồ côi", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seller(c, H_ORPHAN, 3);
    await seller(c, H_LIVE, 999);
    await offer(c, "t_pl2_live_offer", H_LIVE);
    const maxId = Number((await c.query(`SELECT coalesce(max(id), 0) AS m FROM ops_audit`)).rows[0].m);

    const res = await refreshBaitGap(c);

    assert.equal(await exists(c, H_ORPHAN), undefined, "AC-7 người bán mồ côi còn");
    const live = await exists(c, H_LIVE);
    assert.ok(live, "AC-7 xoá nhầm người bán còn tin");
    assert.equal(live.n_ads, 1, "AC-7 cột tổng hợp của người bán còn tin không làm mới");
    const audit = (await c.query(
      `SELECT detail FROM ops_audit WHERE id > $1 AND action = 'bait-gap:sellers-orphan'`, [maxId],
    )).rows;
    assert.equal(audit.length, 1, "AC-7 thiếu dòng audit bait-gap:sellers-orphan");
    assert.ok(audit[0].detail.deleted >= 1);
    const n = Number((await c.query(`SELECT count(*) AS n FROM sellers`)).rows[0].n);
    assert.equal(audit[0].detail.remaining, n, "AC-7 remaining lệch số dòng sellers");
    assert.equal(res.sellersRemaining, n);
  });
});

test("AC-7 cặp hai chiều: người bán có tin thì không bị xoá", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seller(c, H_ORPHAN, 3);
    await offer(c, "t_pl2_orphan_offer", H_ORPHAN);
    await refreshBaitGap(c);
    assert.ok(await exists(c, H_ORPHAN), "AC-7 xoá nhầm người bán còn tin");
  });
});
