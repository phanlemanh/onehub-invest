// deals-phi-ly.test.mjs — hồ sơ deals-loai-tin-phi-ly (ON11): luật loại tin phi lý khỏi Căn giá tốt.
// Ca DB chạy BEGIN…ROLLBACK trên Postgres local :5433 (khuôn bait-gap-sellers.test.mjs) — không để lại dòng nào.
import { createHash } from "node:crypto";
import { napSdtE164 } from "../lib/nap-060.mjs";
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { implausibleReason } from "../lib/deal-plausibility.mjs";
import { loaiTinPhiLy, refreshBaitGap } from "../refresh-bait-gap.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Ma trận viết trước: [diện tích, phòng ngủ, lý do mong đợi].
const MATRIX = [
  [null, 2, "thieu-dien-tich"],
  [0, 2, "thieu-dien-tich"],
  [9, null, "dien-tich-ngoai-khoang"],
  [1001, 3, "dien-tich-ngoai-khoang"],
  [10, 0, null],
  [1000, 3, null],
  [300, 11, "phong-ngu-ngoai-khoang"],
  [36, 3, "phong-qua-nho"],
  [37, 2, "phong-qua-nho"],
  [19, 1, "phong-qua-nho"],
  [40, 2, null],
  [60, 3, null],
  [80, null, null],
];

test("DP-AC-1 ma trận lý do", () => {
  for (const [areaM2, bedrooms, want] of MATRIX) {
    assert.equal(implausibleReason({ areaM2, bedrooms }), want, `DP-AC-1 ${areaM2} m² ${bedrooms} PN`);
  }
  // Thứ tự xét: thiếu diện tích đứng trước số phòng.
  assert.equal(implausibleReason({ areaM2: 0, bedrooms: 11 }), "thieu-dien-tich", "DP-AC-1 thứ tự xét");
});

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napSdtE164(c); // SD3: nạp 060 trong giao dịch khi DB chưa áp
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const SO_H = "+84919000011"; // số bịa
const H = createHash("sha256").update(SO_H).digest("hex").slice(0, 32);
// [offer_id, diện tích, phòng ngủ, giảm % so với thước, lý do mong đợi]
const FIX = [
  ["t_on11_hop_ly", 80, 2, 10, null],
  ["t_on11_phong_nho", 36, 3, 20, "phong-qua-nho"],
  ["t_on11_thieu_dt", null, 2, 30, "thieu-dien-tich"],
  ["t_on11_qua_rong", 5000, 3, 40, "dien-tich-ngoai-khoang"],
];

/** Dựng fixture ở một phường thật có thước; không phường nào có thước → ca FAIL có tên. */
async function fixture(c) {
  const ruler = (await c.query(`SELECT area_id, m FROM v_ruler_p2_area ORDER BY area_id LIMIT 1`)).rows[0];
  assert.ok(ruler, "DP-AC-2 không phường nào có thước (v_ruler_p2_area rỗng) — ca không chạy được");
  const m = Number(ruler.m);
  // SD3: sellers là view trên bí danh sdt + tin — người theo SĐT như bộ dựng danh bạ ghi.
  await c.query(`INSERT INTO parties (party_key, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZDP11', 'S03')`);
  await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZDP11', 'sdt', $1, 'S03')`, [SO_H]);
  for (const [id, area, beds, gap] of FIX) {
    const perm2 = Math.round(m * (1 - gap / 100));
    await c.query(
      `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
         seller_phone_hash, seller_phone, property_type, area_id, area_m2, bedrooms, price_perm2, bait_gap_pct)
       VALUES ($1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', $2, $8, 'unknown', $3, $4, $5, $6::numeric,
               ROUND((1 - $6::numeric / $7::numeric) * 100, 1))`,
      [id, H, ruler.area_id, area, beds, perm2, m, SO_H],
    );
  }
  return m;
}

const auditCount = async (c) =>
  Number((await c.query(`SELECT count(*) AS n FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly'`)).rows[0].n);
const gapOf = async (c, id) =>
  (await c.query(`SELECT bait_gap_pct FROM sale_offers WHERE offer_id = $1`, [id])).rows[0].bait_gap_pct;

test("DP-AC-2 loaiTinPhiLy", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await fixture(c);
    const rows = (await c.query(
      `SELECT offer_id, area_m2, bedrooms FROM sale_offers WHERE offer_id = ANY($1::text[]) ORDER BY offer_id`,
      [FIX.map((f) => f[0])],
    )).rows;
    const before = await auditCount(c);
    const res = await loaiTinPhiLy(c, rows);

    assert.equal(await auditCount(c), before + 1, "DP-AC-2 phải ghi đúng một dòng audit");
    const last = (await c.query(
      `SELECT actor, env, detail FROM ops_audit WHERE action = 'bait-gap:loai-phi-ly' ORDER BY id DESC LIMIT 1`,
    )).rows[0];
    assert.equal(last.actor, "refresh-bait-gap");
    assert.equal(last.detail.total, 3, "DP-AC-2 total");
    assert.deepEqual(last.detail.by_reason, { "phong-qua-nho": 1, "thieu-dien-tich": 1, "dien-tich-ngoai-khoang": 1 });
    assert.deepEqual([...last.detail.offer_ids].sort(), FIX.filter((f) => f[4]).map((f) => f[0]).sort());
    assert.deepEqual(res, last.detail);

    assert.notEqual(await gapOf(c, "t_on11_hop_ly"), null, "DP-AC-2 tin hợp lý mất số giảm");
    for (const [id, , , , why] of FIX) if (why) assert.equal(await gapOf(c, id), null, `DP-AC-2 ${id} còn số giảm`);
  });
});

test("DP-AC-2 tập toàn tin hợp lý không ghi audit", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await fixture(c);
    const rows = (await c.query(
      `SELECT offer_id, area_m2, bedrooms FROM sale_offers WHERE offer_id = 't_on11_hop_ly'`,
    )).rows;
    const before = await auditCount(c);
    const res = await loaiTinPhiLy(c, rows);
    assert.equal(res.total, 0);
    assert.equal(await auditCount(c), before, "DP-AC-2 lượt không loại gì vẫn ghi audit");
  });
});

test("DP-AC-2 refreshBaitGap giữ registry người bán", { timeout: 180_000 }, async () => {
  await withTx(async (c) => {
    await fixture(c);
    await refreshBaitGap(c);

    for (const [id, , , gap, why] of FIX) {
      if (why) assert.equal(await gapOf(c, id), null, `DP-AC-2 ${id} còn số giảm sau bước đêm`);
      else assert.equal(Number(await gapOf(c, id)), gap, `DP-AC-2 ${id} sai số giảm`);
    }
    const flags = (await c.query(`SELECT flags FROM sellers WHERE phone_hash = $1`, [H])).rows[0].flags;
    // Tính tay trên CẢ 4 tin: trung vị [10, 20, 30, 40] = 25; cả 4 tin giảm ≥ 10%.
    assert.equal(Number(flags.median_gap_pct), 25, "DP-AC-2 trung vị người bán đổi sau luật loại");
    assert.equal(Number(flags.n_good_deals), 4, "DP-AC-2 số căn giá tốt của người bán đổi sau luật loại");
    // Đối chứng: trung vị tính trên cột SAU luật (chỉ còn tin hợp lý) khác registry — luật chạy trước bước người bán
    // thì registry sẽ mang đúng số này.
    const sauLuat = (await c.query(
      `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY bait_gap_pct) AS med FROM sale_offers
       WHERE seller_phone_hash = $1 AND bait_gap_pct IS NOT NULL`,
      [H],
    )).rows[0].med;
    assert.equal(Number(sauLuat), 10);
    assert.notEqual(Number(sauLuat), Number(flags.median_gap_pct), "DP-AC-2 đối chứng không phân biệt");
  });
});
