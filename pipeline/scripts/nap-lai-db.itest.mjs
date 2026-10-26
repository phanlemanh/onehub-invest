// nap-lai-db.itest.mjs — PL14 nạp lại không xoá (ND-AC-n ↔ _acceptance/nap-lai-khong-xoa/evals.yaml).
// Cần DB local :5433. Mọi ca trong BEGIN … ROLLBACK; ca cuối so pg_constraint/relkind trước-sau để chứng DB thật không đổi.
// Ca chạy được cả khi DB đã áp 044 (áp lại = kiểm idempotent) lẫn khi chưa (áp lần đầu).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { writeOffers } from "../lib/write-offers.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { chupMaTran, gieoQuyetDinh, gieoTinKhoaCu, inMaTran, soMaTran } from "../lib/nap-lai-matrix.mjs";
import { parsePost, runTransformZalo } from "../transform-zalo.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { MARKETS, runReassign } from "../reassign-areas.mjs";
import { ghiListing } from "../transform-airbnb.mjs";
import { localReadSql } from "../sync-cloud.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PIPE, "..");
const MIG = readFileSync(join(ROOT, "db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

export async function trongGiaoDich(client, fn) {
  await client.query("BEGIN");
  // Cùng khoá với write-offers.test.mjs / test-posts / agent tests: nạp 044 (DDL + CREATE OR REPLACE) song song là deadlock.
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  try { return await fn(); } finally { await client.query("ROLLBACK"); }
}
const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
const relkind = async (name) => (await one("SELECT relkind FROM pg_class WHERE oid = to_regclass($1)", [name]))?.relkind ?? null;
const sha = (rows) => createHash("sha256").update(rows.map((r) => Object.values(r)[0]).sort().join("\n")).digest("hex");
/** Tên thật của bảng tin / listing ở trạng thái hiện tại của DB (trước hay sau 044). */
const bangTin = async () => ((await relkind("sale_offer_records")) ? "sale_offer_records" : "sale_offers");
const bangListing = async () => ((await relkind("listing_records")) ? "listing_records" : "listings");

// Ma trận viết trước: 6 khoá ngoại phải trỏ bảng bản ghi và là RESTRICT.
const FK = [
  ["nights", "nights_listing_id_fkey", "listing_records"],
  ["listing_stats", "listing_stats_listing_id_fkey", "listing_records"],
  ["property_offers", "property_offers_offer_id_fkey", "sale_offer_records"],
  ["property_candidates", "property_candidates_offer_a_fkey", "sale_offer_records"],
  ["property_candidates", "property_candidates_offer_b_fkey", "sale_offer_records"],
  ["enrichment_proposals", "enrichment_proposals_offer_id_fkey", "sale_offer_records"],
];
// Chỉ hai view sống đọc thẳng bảng bản ghi; mọi view khác (thước giá) phải đi qua view sống.
const PHU_THUOC_CHO_PHEP = ["listings", "sale_offers"];

async function viewPhuThuoc() {
  const { rows } = await c.query(
    `SELECT DISTINCT v.relname FROM pg_depend d
       JOIN pg_rewrite r ON r.oid = d.objid
       JOIN pg_class v ON v.oid = r.ev_class
      WHERE d.refobjid IN ('sale_offer_records'::regclass, 'listing_records'::regclass)
        AND v.relname NOT IN ('sale_offer_records','listing_records')
      ORDER BY 1`);
  return rows.map((r) => r.relname);
}

let truoc;
test("ND-AC-1 áp 044 (hai lần): bảng bản ghi + view sống, 6 FK RESTRICT, CHECK lý do, thước giá, phụ thuộc đúng tập", async () => {
  truoc = { tin: await relkind("sale_offers"), listing: await relkind("listings"), fk: (await c.query(
    "SELECT conname, confdeltype FROM pg_constraint WHERE conname = ANY($1) ORDER BY 1", [FK.map((f) => f[1])])).rows };
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    assert.equal(await relkind("sale_offer_records"), "r");
    assert.equal(await relkind("listing_records"), "r");
    assert.equal(await relkind("sale_offers"), "v", "sale_offers phải là VIEW");
    assert.equal(await relkind("listings"), "v", "listings phải là VIEW");
    for (const [tbl, con, cha] of FK) {
      const r = await one(
        "SELECT confrelid::regclass::text AS cha, confdeltype FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass", [con, tbl]);
      assert.ok(r, `thiếu khoá ngoại ${con}`);
      assert.equal(r.cha, cha, `${con} phải trỏ ${cha}`);
      assert.equal(r.confdeltype, "r", `${con} phải RESTRICT`);
    }
    await c.query("SAVEPOINT s");
    await assert.rejects(
      c.query("UPDATE sale_offer_records SET retired_reason = 'khac' WHERE offer_id = (SELECT min(offer_id) FROM sale_offer_records)"),
      /sale_offer_records_retired_reason_chk/);
    await c.query("ROLLBACK TO SAVEPOINT s");
    await c.query("UPDATE sale_offer_records SET retired_reason = 'doi_khoa' WHERE offer_id = (SELECT min(offer_id) FROM sale_offer_records)");
    await c.query("SELECT count(*) FROM v_ruler_p2");
    await c.query("SELECT count(*) FROM v_ruler_p2_area");
    assert.deepEqual(await viewPhuThuoc(), PHU_THUOC_CHO_PHEP);
    for (const v of ["v_ruler_p2", "v_ruler_p2_area"]) {
      const r = await one(`SELECT count(*)::int AS n FROM pg_depend d JOIN pg_rewrite r ON r.oid = d.objid
        WHERE r.ev_class = $1::regclass AND d.refobjid = 'sale_offers'::regclass`, [v]);
      assert.ok(r.n > 0, `${v} phải đọc qua view sống sale_offers`);
    }
    const n = (await one("SELECT count(*)::int AS n FROM sale_offer_records")).n;
    await c.query(MIG);
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offer_records")).n, n, "áp lần hai đổi số dòng");
  });
});

test("ND-AC-1 đối chứng: view phụ tạo trước 044 trên sale_offers bị bắt, nêu tên", async () => {
  await trongGiaoDich(c, async () => {
    if ((await relkind("sale_offers")) === "v") {
      // DB đã áp 044: dựng view phụ trên bảng bản ghi để giả lập view cũ bị RENAME kéo theo
      await c.query("CREATE VIEW v_thu_phu AS SELECT offer_id FROM sale_offer_records");
    } else {
      await c.query("CREATE VIEW v_thu_phu AS SELECT offer_id FROM sale_offers");
      await c.query(MIG);
    }
    const ds = await viewPhuThuoc();
    assert.ok(ds.includes("v_thu_phu"), `phải bắt view phụ: ${ds.join(",")}`);
    assert.notDeepEqual(ds, PHU_THUOC_CHO_PHEP);
  });
});

test("ND-AC-2 view sống trả đúng tập khoá như bảng trước 044; đối chứng: cho nghỉ một tin thì view mất đúng khoá đó", async () => {
  await trongGiaoDich(c, async () => {
    const tin0 = sha((await c.query(`SELECT offer_id FROM ${await bangTin()} ${(await relkind("sale_offer_records")) ? "WHERE retired_at IS NULL" : ""}`)).rows);
    const ls0 = sha((await c.query(`SELECT id FROM ${await bangListing()} ${(await relkind("listing_records")) ? "WHERE retired_at IS NULL" : ""}`)).rows);
    await c.query(MIG);
    assert.equal(sha((await c.query("SELECT offer_id FROM sale_offers")).rows), tin0);
    assert.equal(sha((await c.query("SELECT id FROM listings")).rows), ls0);
    const k = (await one("SELECT min(offer_id) AS k FROM sale_offers")).k;
    await c.query("UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = $1", [k]);
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offers WHERE offer_id = $1", [k])).n, 0);
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offer_records WHERE offer_id = $1", [k])).n, 1);
  });
});

// ND-AC-3: nguồn thử 'TST' để đối soát không đụng tin S03/S05 thật (hàm tham số theo nguồn, khoá mới = băm 'TST|<post>').
const TST = "TST";
const tst = (osk, posts) => ({
  offer_id: mintOfferId(TST, osk), originating_system_key: osk, kind: "sale", confidence: "high",
  first_seen: new Date("2026-10-20T00:00:00Z"), last_seen: new Date("2026-10-20T00:00:00Z"),
  n_reposts: posts.length, post_ids: posts, price_tier: "P1", property_type: "unknown", area_m2: 50, price_perm2: 100_000_000,
});
async function canThu() {
  return Number((await one(`INSERT INTO properties (kind, cluster_key, resolved_by) VALUES ('sale', 'nd-ac-3-' || gen_random_uuid(), 'test') RETURNING id`)).id);
}
async function deXuat(offerId, field, status) {
  return Number((await one(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, decided_by, evidence)
    VALUES ('nd-ac-3', $1, $2, 'v', 'v', 'e2_llm', 'review', $3, 'hitl:manh', '{}'::jsonb) RETURNING id`, [offerId, field, status])).id);
}

test("ND-AC-3 tin vắng lượt nghỉ (không xoá); dòng con chuyển sang tin kế; không kế thì giữ nguyên; quay lại thì sống lại", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    const x = tst("p1", ["p1", "p2"]); const u = tst("u1", ["u1"]); const w = tst("w1", ["w1"]);
    await writeOffers(c, TST, [x, u, w]);
    const P = await canThu(); const P2 = await canThu();
    const dx = await deXuat(x.offer_id, "street_raw", "rejected");
    const du = await deXuat(u.offer_id, "block_raw", "rejected");
    await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2), ($3, $4)`, [P, x.offer_id, P2, u.offer_id]);
    const cand = Number((await one(`INSERT INTO property_candidates (offer_a, offer_b, score, status, decided_by)
      VALUES ($1, $2, 0.9, 'merged', 'hitl:manh') RETURNING id`, [x.offer_id, w.offer_id])).id);
    const the = Number((await one(`INSERT INTO review_queue (item_type, item_id, title, evidence, status, decided_by, decided_at)
      VALUES ('entity_match', $1, 'cặp thử', '{}'::jsonb, 'approved', 'hitl:manh', now()) RETURNING id`, [`pair:${x.offer_id}|${w.offer_id}`])).id);

    // Lượt 2: x vắng (nhóm đổi, tin kế y chung p2), u vắng không kế, w còn.
    const y = tst("p2", ["p2", "p3"]);
    await writeOffers(c, TST, [y, w]);

    const rx = await one(`SELECT * FROM sale_offer_records WHERE offer_id = $1`, [x.offer_id]);
    assert.ok(rx, "tin cũ bị xoá");
    assert.ok(rx.retired_at);
    assert.deepEqual([rx.retired_reason, rx.superseded_by], ["het_trong_luot", y.offer_id]);
    assert.equal((await one(`SELECT count(*)::int AS n FROM sale_offer_records WHERE offer_id = $1`, [x.offer_id])).n, 1);
    assert.equal((await one(`SELECT offer_id FROM enrichment_proposals WHERE id = $1`, [dx])).offer_id, y.offer_id, "đề xuất chưa chuyển");
    assert.deepEqual((await c.query(`SELECT offer_id FROM property_offers WHERE property_id = $1`, [P])).rows.map((r) => r.offer_id), [y.offer_id]);
    const pc = await one(`SELECT offer_a, offer_b, status FROM property_candidates WHERE id = $1`, [cand]);
    assert.deepEqual([pc.offer_a, pc.offer_b, pc.status], [y.offer_id, w.offer_id, "merged"]);
    assert.equal((await one(`SELECT item_id FROM review_queue WHERE id = $1`, [the])).item_id, `pair:${y.offer_id}|${w.offer_id}`);

    const ru = await one(`SELECT * FROM sale_offer_records WHERE offer_id = $1`, [u.offer_id]);
    assert.ok(ru.retired_at, "tin không kế phải nghỉ");
    assert.deepEqual([ru.retired_reason, ru.superseded_by], ["het_trong_luot", null]);
    assert.equal((await one(`SELECT offer_id FROM enrichment_proposals WHERE id = $1`, [du])).offer_id, u.offer_id);
    assert.deepEqual((await c.query(`SELECT offer_id FROM property_offers WHERE property_id = $1`, [P2])).rows.map((r) => r.offer_id), [u.offer_id]);
    const audit = (await one(`SELECT detail FROM ops_audit WHERE action = 'offer:retire' ORDER BY id DESC LIMIT 1`)).detail;
    assert.deepEqual(audit.offers.map((o) => [o.offer_id, o.property_ids]), [[u.offer_id, [P2]]]);

    // Lượt 3: u quay lại → sống lại.
    await writeOffers(c, TST, [y, w, u]);
    const ru2 = await one(`SELECT retired_at, retired_reason FROM sale_offers WHERE offer_id = $1`, [u.offer_id]);
    assert.deepEqual([ru2?.retired_at, ru2?.retired_reason], [null, null], "tin quay lại phải sống lại");
  });
});

test("ND-AC-3 tin khoá cũ (băm nội dung) vắng lượt → lý do doi_khoa", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    const cu = { ...tst("q1", ["q1"]), offer_id: "offer_00000000deadbeef", originating_system_key: "q1" };
    await writeOffers(c, TST, [cu]);
    await writeOffers(c, TST, [tst("q1", ["q1"])]);
    const r = await one(`SELECT retired_reason, superseded_by FROM sale_offer_records WHERE offer_id = $1`, [cu.offer_id]);
    assert.deepEqual([r.retired_reason, r.superseded_by], ["doi_khoa", mintOfferId(TST, "q1")]);
  });
});

test("ND-AC-5 lượt nạp đầu sau 044 đổi khoá S03/S05: khoá cũ nghỉ 'doi_khoa', ma trận quyết định/liên kết không mất", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    // Đối chứng dương: chắc chắn có quyết định đã gieo và có tin khoá cũ ở mỗi nguồn — ca không được qua rỗng.
    const fx = {};
    for (const s of ["S03", "S05"]) {
      assert.equal(await gieoQuyetDinh(c, s), 2, `${s}: fixture phải gieo được quyết định lên 2 tin`);
      fx[s] = await gieoTinKhoaCu(c, s, "nd-ac-5");
      assert.ok(fx[s], `${s}: fixture tin khoá cũ`);
    }
    const khoaCu = async (s) => (await c.query(
      `SELECT offer_id FROM sale_offers WHERE source = $1 AND (originating_system_key IS NULL OR offer_id <>
         'offer_' || substr(encode(digest($1 || '|' || originating_system_key, 'sha256'), 'hex'), 1, 16))`, [s])).rows.map((r) => r.offer_id);
    const cu = { S03: await khoaCu("S03"), S05: await khoaCu("S05") };
    for (const s of ["S03", "S05"]) assert.ok(cu[s].includes(fx[s].id), `${s}: tin khoá cũ cố định phải được đếm`);
    const truoc = await chupMaTran(c);
    assert.ok(truoc.de_xuat_da_quyet.co_mat.size >= 4 && truoc.the_review_da_quyet.co_mat.size >= 4, "ma trận trước phải có quyết định đã gieo");

    await imLang(() => runTransformZalo(c));
    await imLang(() => runTransformFb(c));

    for (const s of ["S03", "S05"]) {
      const r = (await c.query(`SELECT offer_id, retired_reason, superseded_by,
          EXISTS (SELECT 1 FROM sale_offer_records l WHERE l.source = o.source AND l.retired_at IS NULL AND l.post_ids && o.post_ids) AS co_post_chung
        FROM sale_offer_records o WHERE offer_id = ANY ($1)`, [cu[s]])).rows;
      assert.equal(r.length, cu[s].length, `${s}: tin khoá cũ bị xoá`);
      const sai = r.filter((x) => x.retired_reason !== "doi_khoa");
      assert.deepEqual(sai.map((x) => x.offer_id), [], `${s}: tin khoá cũ phải nghỉ 'doi_khoa'`);
      const treo = r.filter((x) => x.co_post_chung && x.superseded_by == null);
      assert.deepEqual(treo.map((x) => x.offer_id), [], `${s}: tin khoá cũ có post chung phải có superseded_by`);
      // Tin cố định: nghỉ doi_khoa, có tin kế sống, đề xuất + liên kết căn đã sang tin kế.
      const t = r.find((x) => x.offer_id === fx[s].id);
      assert.ok(t?.superseded_by, `${s}: tin khoá cũ cố định phải có tin kế`);
      assert.equal((await one(`SELECT offer_id FROM enrichment_proposals WHERE id = $1`, [fx[s].de])).offer_id, t.superseded_by);
      assert.deepEqual((await c.query(`SELECT offer_id FROM property_offers WHERE property_id = $1`, [fx[s].can])).rows.map((x) => x.offer_id), [t.superseded_by]);
    }
    const sau = await chupMaTran(c);
    assert.deepEqual(soMaTran(truoc, sau), [], `ma trận mất:\n${inMaTran(truoc, sau)}`);
    // Đối chứng: xoá một đề xuất đã quyết → ma trận báo mất đúng hàng ấy.
    await c.query("SAVEPOINT doi_chung");
    await c.query(`DELETE FROM enrichment_proposals WHERE id = $1`, [fx.S03.de]);
    assert.ok(soMaTran(truoc, await chupMaTran(c)).some((m) => m.hang === "de_xuat_da_quyet"), "đối chứng: ma trận phải thấy đề xuất mất");
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
  });
});

// ND-AC-6: listing ra ngoài mọi phường thì nghỉ 'ngoai_phuong', nights + listing_stats còn nguyên; quay lại thì sống lại.
const IM = { log: () => {}, warn: () => {} };
async function listingCoDem() {
  return one(`SELECT l.*, a.parent_id FROM listings l JOIN areas a ON a.id = l.area_id
    WHERE EXISTS (SELECT 1 FROM nights n WHERE n.listing_id = l.id) AND EXISTS (SELECT 1 FROM listing_stats s WHERE s.listing_id = l.id)
      AND a.parent_id = ANY ($1) ORDER BY l.id LIMIT 1`, [Object.values(MARKETS).map((m) => m.id)]);
}
const conLai = async (id) => ({
  nights: (await one(`SELECT count(*)::int AS n FROM nights WHERE listing_id = $1`, [id])).n,
  stats: (await one(`SELECT count(*)::int AS n FROM listing_stats WHERE listing_id = $1`, [id])).n,
  song: (await one(`SELECT count(*)::int AS n FROM listings WHERE id = $1`, [id])).n,
  rec: await one(`SELECT retired_at, retired_reason FROM listing_records WHERE id = $1`, [id]),
});

test("ND-AC-6 reassign-areas: listing ngoài mọi phường nghỉ 'ngoai_phuong', đêm + thống kê còn; quay lại phường thì sống lại", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    const l = await listingCoDem();
    assert.ok(l, "fixture: cần một listing sống có nights và listing_stats");
    const city = Object.keys(MARKETS).find((k) => MARKETS[k].id === l.parent_id);
    const truoc = await conLai(l.id);
    await c.query(`UPDATE listing_records SET latitude = 0, longitude = 0 WHERE id = $1`, [l.id]);
    await runReassign(c, [city], { log: IM });
    const ra = await conLai(l.id);
    assert.equal(ra.rec?.retired_reason, "ngoai_phuong", "listing ngoài phường phải nghỉ, không bị xoá");
    assert.ok(ra.rec.retired_at);
    assert.deepEqual([ra.nights, ra.stats, ra.song], [truoc.nights, truoc.stats, 0]);
    await c.query(`UPDATE listing_records SET latitude = $2, longitude = $3 WHERE id = $1`, [l.id, l.latitude, l.longitude]);
    await runReassign(c, [city], { log: IM });
    const ve = await conLai(l.id);
    assert.deepEqual([ve.rec.retired_at, ve.rec.retired_reason, ve.song], [null, null, 1], "quay lại phường phải sống lại");
    assert.deepEqual([ve.nights, ve.stats], [truoc.nights, truoc.stats]);
  });
});

test("ND-AC-6 transform-airbnb (ghiListing) và 200_transform: nghỉ thay xoá, đêm của listing đã nghỉ còn nguyên", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    const l = await listingCoDem();
    const truoc = await conLai(l.id);
    const ex = { name: l.name, roomType: l.room_type, bedrooms: l.bedrooms, personCapacity: l.accommodates,
      priceListed: l.price_listed, lat: l.latitude, lng: l.longitude, photos: [], reviewCount: l.review_count };
    assert.equal(await ghiListing(c, { id: l.id, areaId: null, ex, fetchedAt: new Date() }), false);
    const ra = await conLai(l.id);
    assert.deepEqual([ra.rec?.retired_reason, ra.nights, ra.stats, ra.song], ["ngoai_phuong", truoc.nights, truoc.stats, 0]);
    // Đoạn nights của 200_transform (Inside Airbnb): chỉ thay đêm của listing sống.
    const sql200 = readFileSync(join(PIPE, "sql/200_transform.sql"), "utf8");
    await c.query(sql200.slice(sql200.indexOf("-- 3) Nights")));
    assert.equal((await conLai(l.id)).nights, truoc.nights, "200_transform xoá đêm của listing đã nghỉ");
    assert.equal(await ghiListing(c, { id: l.id, areaId: l.area_id, ex, fetchedAt: new Date() }), true);
    const ve = await conLai(l.id);
    assert.deepEqual([ve.rec.retired_at, ve.song, ve.stats], [null, 1, truoc.stats]);
    assert.equal((await one(`SELECT originating_system_key FROM listing_records WHERE id = $1`, [l.id])).originating_system_key,
      l.id.replace(/^abnb_/, ""));
  });
});

test("ND-AC-9 sync-cloud: tập chép không có tin/listing đã nghỉ, bảng con không có dòng trỏ cha đã nghỉ; gỡ nghỉ thì có lại", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    const l = await listingCoDem();
    const o = await one(`SELECT offer_id FROM sale_offers o WHERE EXISTS (SELECT 1 FROM property_offers p WHERE p.offer_id = o.offer_id)
      ORDER BY offer_id LIMIT 1`);
    assert.ok(l && o, "fixture: cần listing có đêm/thống kê và tin có liên kết căn");
    const tap = async (t, col) => new Set((await c.query(localReadSql(t, `"${col}"`))).rows.map((r) => Object.values(JSON.parse(r.j))[0]));
    const chup = async () => ({
      listings: (await tap("listings", "id")).has(l.id),
      nights: (await tap("nights", "listing_id")).has(l.id),
      listing_stats: (await tap("listing_stats", "listing_id")).has(l.id),
      sale_offers: (await tap("sale_offers", "offer_id")).has(o.offer_id),
      property_offers: (await tap("property_offers", "offer_id")).has(o.offer_id),
    });
    const tatCa = (v) => ({ listings: v, nights: v, listing_stats: v, sale_offers: v, property_offers: v });
    assert.deepEqual(await chup(), tatCa(true));
    await c.query(`UPDATE listing_records SET retired_at = now(), retired_reason = 'ngoai_phuong' WHERE id = $1`, [l.id]);
    await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = $1`, [o.offer_id]);
    assert.deepEqual(await chup(), tatCa(false), "dòng của cha đã nghỉ lọt vào tập chép");
    await c.query(`UPDATE listing_records SET retired_at = NULL, retired_reason = NULL WHERE id = $1`, [l.id]);
    await c.query(`UPDATE sale_offer_records SET retired_at = NULL, retired_reason = NULL WHERE offer_id = $1`, [o.offer_id]);
    assert.deepEqual(await chup(), tatCa(true), "đối chứng: gỡ nghỉ thì dòng phải có lại");
  });
});

// NL-AC-4 qua transform thật: post dựng trong stg_zalo_posts (giao dịch), nhóm do transform tự dựng theo nội dung.
const SNAP_THU = "hanoi__zalo-agent__2099-01-01T000000";
const NGUON = {
  S03: { chay: (cl, o) => runTransformZalo(cl, o), agent: "openclaw-hook", nhom: "Nhóm thật X" },
  S05: { chay: (cl, o) => runTransformFb(cl, o), agent: "apify-facebook", nhom: "MUA BÁN NHÀ ĐẤT HÀ NỘI" },
};
let soPost = 0;
const tin = (dt, gia, pn) => `Bán căn hộ ${pn}PN ${dt}m2 Nghĩa Đô, giá ${gia} tỷ. LH 0912 000 7${String(soPost % 100).padStart(2, "0")}`;
async function chenPost(src, text, postedAt) {
  const id = `t_nl4_${src}_${process.pid}_${++soPost}`;
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, SNAP_THU, NGUON[src].agent, NGUON[src].nhom, text, postedAt]);
  return id;
}
const tinCuaPost = async (postId) => one(`SELECT offer_id, originating_system_key, source FROM sale_offers WHERE $1 = ANY (post_ids)`, [postId]);
const imLang = async (fn) => { const l = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = l; } };

// Ma trận viết trước: mỗi dòng = một biến đổi giữa hai lượt transform; kỳ vọng tin chứa p1 giữ nguyên offer_id.
const MA_TRAN_NL4 = [
  ["đổi giá", async (src, p) => { for (const x of [p.p1, p.p2]) await c.query(`UPDATE stg_zalo_posts SET text = $2 WHERE post_id = $1`, [x, tin("71.3", "4.05", 2)]); }],
  ["đổi diện tích (một post — nhóm tách)", async (src, p) => { await c.query(`UPDATE stg_zalo_posts SET text = $2 WHERE post_id = $1`, [p.p2, tin("72.9", "3.95", 2)]); }],
  ["đổi số phòng", async (src, p) => { for (const x of [p.p1, p.p2]) await c.query(`UPDATE stg_zalo_posts SET text = $2 WHERE post_id = $1`, [x, tin("71.3", "3.95", 3)]); }],
  ["đổi rule parser (diện tích đọc khác)", async () => ({ parse: (t) => { const r = parsePost(t); return r.areaM2 ? { ...r, areaM2: r.areaM2 + 0.5 } : r; } })],
  ["thêm repost muộn hơn", async (src, p) => { await chenPost(src, tin("71.3", "3.95", 2), "2026-10-25T08:00:00Z"); }],
  ["thu bù post SỚM hơn neo", async (src, p) => { await chenPost(src, tin("71.3", "3.95", 2), "2026-10-01T08:00:00Z"); }],
];

for (const src of ["S03", "S05"]) {
  test(`NL-AC-4 ${src} qua transform thật: 6 biến đổi giữ offer_id; khoá mới = băm '${src}|<post neo>'; đối chứng nhóm mới khác khoá`, async () => {
    assert.equal(MA_TRAN_NL4.length, 6);
    let o = 0;
    for (const [ten, doi] of MA_TRAN_NL4) {
      await trongGiaoDich(c, async () => {
        await c.query(MIG);
        await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT DO NOTHING`, [SNAP_THU]);
        const p = { p1: await chenPost(src, tin("71.3", "3.95", 2), "2026-10-20T08:00:00Z") };
        p.p2 = await chenPost(src, tin("71.3", "3.95", 2), "2026-10-21T08:00:00Z");
        await imLang(() => NGUON[src].chay(c));
        const truoc = await tinCuaPost(p.p1);
        assert.ok(truoc, `${src} fixture: post phải thành tin`);
        assert.equal(truoc.source, src);
        assert.equal(truoc.offer_id, mintOfferId(src, p.p1), `${src}: khoá mới phải băm '${src}|<post neo>'`);
        assert.equal(truoc.originating_system_key, p.p1);
        const opts = (await doi(src, p)) ?? {};
        await imLang(() => NGUON[src].chay(c, opts));
        const sau = await tinCuaPost(p.p1);
        assert.equal(sau?.offer_id, truoc.offer_id, `${src} ${ten}: offer_id đổi`);
        o++;
      });
    }
    assert.equal(o, MA_TRAN_NL4.length);
    // Đối chứng: post mới hoàn toàn (không chung post với tin nào) → tin mới, khoá khác.
    await trongGiaoDich(c, async () => {
      await c.query(MIG);
      await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT DO NOTHING`, [SNAP_THU]);
      const a = await chenPost(src, tin("71.3", "3.95", 2), "2026-10-20T08:00:00Z");
      const b = await chenPost(src, tin("88.1", "5.15", 3), "2026-10-22T08:00:00Z");
      await imLang(() => NGUON[src].chay(c));
      const [ta, tb] = [await tinCuaPost(a), await tinCuaPost(b)];
      assert.ok(ta && tb);
      assert.notEqual(ta.offer_id, tb.offer_id, "đối chứng: nhóm mới phải có khoá khác");
      assert.equal(tb.offer_id, mintOfferId(src, b));
    });
  });
}

test("NL-AC-4 S06: originating_system_key = list_id và offer_id = băm 'S06|<list_id>' cho mọi tin S06 (sau 044)", async () => {
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    const r = await one(`SELECT count(*)::int AS n,
        count(*) FILTER (WHERE originating_system_key IS NULL
          OR offer_id <> 'offer_' || substr(encode(digest('S06|' || originating_system_key, 'sha256'), 'hex'), 1, 16))::int AS lech
      FROM sale_offer_records WHERE source = 'S06'`);
    assert.ok(r.n > 0, "fixture: DB local phải có tin S06");
    assert.equal(r.lech, 0);
    const mau = await one(`SELECT o.originating_system_key, a.list_id::text AS list_id FROM sale_offer_records o
      JOIN stg_chotot_ads a ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || a.list_id::text, 'sha256'), 'hex'), 1, 16)
      WHERE o.source = 'S06' LIMIT 1`);
    assert.equal(mau.originating_system_key, mau.list_id);
  });
});

test("ND-AC-1 DB thật không đổi sau các ca (relkind + khoá ngoại đọc lại)", async () => {
  assert.equal(await relkind("sale_offers"), truoc.tin);
  assert.equal(await relkind("listings"), truoc.listing);
  assert.deepEqual((await c.query("SELECT conname, confdeltype FROM pg_constraint WHERE conname = ANY($1) ORDER BY 1", [FK.map((f) => f[1])])).rows, truoc.fk);
});
