// airbnb-nghi.itest.mjs — listing Airbnb nghỉ ngoài phường không bị reassign-areas đánh thức bằng toạ độ cũ
// (AN-AC-n ↔ _acceptance/airbnb-nghi-khong-hoi-sinh/evals.yaml). Cần DB có 044 + phường OSM + listing thật có đêm và
// listing_stats; mỗi ca BEGIN … ROLLBACK. reassign-areas cập nhật hàng loạt — chạy trên DB thử riêng (DATABASE_URL),
// không trên DB `oneinvest` dùng chung (luật đo của giám sát đợt dot0-cam-mau, 27/10).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { MARKETS, runReassign } from "../reassign-areas.mjs";
import { ghiListing } from "../transform-airbnb.mjs";
import { CAU_NGHI_CU } from "./airbnb-nghi-chung.mjs";

const DB_URL = process.env.DATABASE_URL;
const IM = { log: () => {}, warn: () => {} };
// Toạ độ ngoài mọi phường VN (vịnh Guinea).
const NGOAI = { lat: 0.5, lng: 0.5 };

let c;
before(async () => {
  if (!DB_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh <tên>), không chạy trên oneinvest dùng chung");
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  // Chặn trước mọi ca: trỏ nhầm DB dùng chung thì không ca nào chạy reassign trên đó.
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
  if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — test reassign-areas chạy trên DB thử riêng");
});
after(async () => { await c?.end(); });

test("AN chốt DB: không chạy trên DB oneinvest dùng chung", async () => {
  const { db } = await one("SELECT current_database() AS db");
  assert.notEqual(db, "oneinvest", "test reassign-areas chạy trên DB thử riêng, không trên oneinvest dùng chung");
});

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  // Cùng khoá với các test nạp migration (nap-lai-db, phat-bieu-db): tránh deadlock khi chạy song song.
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try { return await fn(); } finally { await c.query("ROLLBACK"); }
}
const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];

/** Listing sống trong một market VN, có đêm và listing_stats, kèm thành phố của market. */
async function listingCoDem() {
  const l = await one(`SELECT l.*, a.parent_id FROM listings l JOIN areas a ON a.id = l.area_id
    WHERE l.latitude IS NOT NULL AND EXISTS (SELECT 1 FROM nights n WHERE n.listing_id = l.id)
      AND EXISTS (SELECT 1 FROM listing_stats s WHERE s.listing_id = l.id) AND a.parent_id = ANY ($1)
    ORDER BY l.id LIMIT 1`, [Object.values(MARKETS).map((m) => m.id)]);
  assert.ok(l, "fixture: cần một listing sống có nights và listing_stats ở market VN");
  const truoc = await chup(l.id);
  assert.ok(truoc.song === 1 && truoc.nights > 0 && truoc.stats > 0,
    `tiền đề fixture: listing ${l.id} phải sống trên view, có đêm và listing_stats (${JSON.stringify(truoc)})`);
  return { ...l, city: Object.keys(MARKETS).find((k) => MARKETS[k].id === l.parent_id) };
}
/** Lần thu mới của listing: các trường lấy từ bản ghi, toạ độ thay bằng `toaDo`. */
const lanThu = (l, toaDo) => ({ name: l.name, roomType: l.room_type, bedrooms: l.bedrooms, personCapacity: l.accommodates,
  priceListed: l.price_listed, lat: toaDo.lat, lng: toaDo.lng, photos: [], reviewCount: l.review_count });
const chup = async (id) => ({
  rec: await one(`SELECT latitude, longitude, retired_at, retired_reason, area_id,
      ST_Y(geom::geometry) AS geom_lat, ST_X(geom::geometry) AS geom_lng, geom IS NULL AS geom_null
    FROM listing_records WHERE id = $1`, [id]),
  song: (await one(`SELECT count(*)::int AS n FROM listings WHERE id = $1`, [id])).n,
  nights: (await one(`SELECT count(*)::int AS n FROM nights WHERE listing_id = $1`, [id])).n,
  stats: (await one(`SELECT count(*)::int AS n FROM listing_stats WHERE listing_id = $1`, [id])).n,
});

test("AN-AC-1 ghiListing cho nghỉ ngoài phường ghi toạ độ lần thu mới; đêm + thống kê còn", async () => {
  await trongGiaoDich(async () => {
    const l = await listingCoDem();
    const truoc = await chup(l.id);
    assert.equal(await ghiListing(c, { id: l.id, areaId: null, ex: lanThu(l, NGOAI), fetchedAt: new Date() }), false);
    const sau = await chup(l.id);
    assert.equal(sau.rec.retired_reason, "ngoai_phuong");
    assert.ok(sau.rec.retired_at, "listing ngoài phường phải nghỉ");
    assert.deepEqual([sau.rec.latitude, sau.rec.longitude], [NGOAI.lat, NGOAI.lng], "bản ghi nghỉ phải mang toạ độ lần thu mới");
    assert.deepEqual([sau.rec.geom_lat, sau.rec.geom_lng], [NGOAI.lat, NGOAI.lng], "geom phải là điểm của toạ độ lần thu mới");
    assert.deepEqual([sau.song, sau.nights, sau.stats], [0, truoc.nights, truoc.stats]);
  });
});

test("AN-AC-2 reassign-areas không đánh thức listing transform vừa cho nghỉ; đối chứng: câu cũ thì bị đánh thức", async () => {
  await trongGiaoDich(async () => {
    const l = await listingCoDem();
    // Đối chứng cặp trên cùng fixture: câu cho nghỉ cũ giữ toạ độ trong phường → reassign gỡ nghỉ.
    await c.query("SAVEPOINT doi_chung");
    await c.query(CAU_NGHI_CU, [l.id]);
    assert.equal((await chup(l.id)).song, 0);
    await runReassign(c, [l.city], { log: IM });
    const cu = await chup(l.id);
    assert.deepEqual([cu.rec.retired_at, cu.song], [null, 1], "đối chứng: câu cũ phải bị reassign đánh thức");
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");

    await ghiListing(c, { id: l.id, areaId: null, ex: lanThu(l, NGOAI), fetchedAt: new Date() });
    const nghi = await chup(l.id);
    await runReassign(c, [l.city], { log: IM });
    const sau = await chup(l.id);
    assert.equal(sau.rec.retired_reason, "ngoai_phuong", "reassign đánh thức listing transform vừa cho nghỉ");
    assert.deepEqual([sau.rec.retired_at, sau.song], [nghi.rec.retired_at, 0]);
  });
});

test("AN-AC-3 lần thu thiếu toạ độ: bản ghi nghỉ mang toạ độ NULL, reassign không đánh thức", async () => {
  await trongGiaoDich(async () => {
    const l = await listingCoDem();
    assert.equal(await ghiListing(c, { id: l.id, areaId: null, ex: lanThu(l, { lat: null, lng: null }), fetchedAt: new Date() }), false);
    const nghi = await chup(l.id);
    assert.deepEqual([nghi.rec.latitude, nghi.rec.longitude, nghi.rec.geom_null, nghi.rec.retired_reason],
      [null, null, true, "ngoai_phuong"], "thiếu toạ độ: bản ghi nghỉ phải mang toạ độ NULL");
    await runReassign(c, [l.city], { log: IM });
    const sau = await chup(l.id);
    assert.deepEqual([sau.rec.retired_reason, sau.song], ["ngoai_phuong", 0], "reassign đánh thức listing thiếu toạ độ");
  });
});

// Bảng ca viết trước: listing đã nghỉ (lý do, toạ độ gieo, mốc lùi một ngày), lần thu mới ngoài phường hoặc thiếu toạ độ.
const NGOAI_KHAC = { lat: 0.25, lng: 0.75 };
const THIEU = { lat: null, lng: null };
const DA_NGHI = [
  { ten: "nghỉ ngoai_phuong, toạ độ khác", ly_do: "ngoai_phuong", gieo: () => NGOAI, thu: NGOAI_KHAC },
  { ten: "nghỉ doi_khoa", ly_do: "doi_khoa", gieo: () => NGOAI, thu: NGOAI_KHAC },
  { ten: "nghỉ ngoai_phuong còn toạ độ cũ, lần thu thiếu toạ độ", ly_do: "ngoai_phuong", gieo: (l) => ({ lat: l.latitude, lng: l.longitude }), thu: THIEU },
];

test("AN-AC-4 listing đã nghỉ: toạ độ là của lần thu mới, mốc và lý do nghỉ giữ nguyên, reassign không đánh thức", async () => {
  let n = 0;
  for (const ca of DA_NGHI) {
    await trongGiaoDich(async () => {
      const l = await listingCoDem();
      const g = ca.gieo(l);
      const { moc } = await one(`UPDATE listing_records SET retired_at = now() - interval '1 day', retired_reason = $2,
          latitude = $3, longitude = $4 WHERE id = $1 RETURNING retired_at AS moc`, [l.id, ca.ly_do, g.lat, g.lng]);
      await ghiListing(c, { id: l.id, areaId: null, ex: lanThu(l, ca.thu), fetchedAt: new Date() });
      const sau = await chup(l.id);
      assert.deepEqual([sau.rec.latitude, sau.rec.longitude, sau.rec.geom_null ? null : sau.rec.geom_lat],
        [ca.thu.lat, ca.thu.lng, ca.thu.lat], `${ca.ten}: toạ độ lần thu mới không vào bản ghi`);
      assert.equal(sau.rec.retired_reason, ca.ly_do, `${ca.ten}: lý do nghỉ bị ghi đè`);
      assert.equal(sau.rec.retired_at.getTime(), moc.getTime(), `${ca.ten}: mốc nghỉ bị đặt lại`);
      await runReassign(c, [l.city], { log: IM });
      const ra = await chup(l.id);
      assert.deepEqual([ra.rec.retired_reason, ra.song], [ca.ly_do, 0], `${ca.ten}: reassign đánh thức listing đã nghỉ`);
      n += 4;
    });
  }
  assert.equal(n, DA_NGHI.length * 4);
});

test("AN-AC-5a listing nghỉ ngoai_phuong, lần thu mới trong phường → ghiListing gỡ nghỉ", async () => {
  await trongGiaoDich(async () => {
    const l = await listingCoDem();
    await ghiListing(c, { id: l.id, areaId: null, ex: lanThu(l, NGOAI), fetchedAt: new Date() });
    assert.equal(await ghiListing(c, { id: l.id, areaId: l.area_id, ex: lanThu(l, { lat: l.latitude, lng: l.longitude }), fetchedAt: new Date() }), true);
    const sau = await chup(l.id);
    assert.deepEqual([sau.rec.retired_at, sau.rec.retired_reason, sau.song], [null, null, 1]);
  });
});

test("AN-AC-5b listing nghỉ ngoai_phuong có toạ độ hiện hành trong phường → reassign gỡ nghỉ", async () => {
  await trongGiaoDich(async () => {
    const l = await listingCoDem();
    // Ranh nạp lại sau transform: bản ghi nghỉ mang toạ độ hiện hành nằm trong phường.
    await c.query(`UPDATE listing_records SET retired_at = now(), retired_reason = 'ngoai_phuong' WHERE id = $1`, [l.id]);
    assert.equal((await chup(l.id)).song, 0);
    await runReassign(c, [l.city], { log: IM });
    const sau = await chup(l.id);
    assert.deepEqual([sau.rec.retired_at, sau.rec.retired_reason, sau.song, sau.rec.area_id], [null, null, 1, l.area_id]);
  });
});
