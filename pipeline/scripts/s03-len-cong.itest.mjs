// s03-len-cong.itest.mjs — hồ sơ _acceptance/s03-len-cong (SL1): phân xử, bên đọc khu vực, phát biểu loại hình, sổ nhóm.
// Chỉ chạy trên DB thử (bash db/db-thu.sh oneinvest_n1_sl1), mọi ca trong BEGIN … ROLLBACK.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { resolveOffers, writeAssertions } from "../lib/assert.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_061, MIG_069 } from "../lib/nap-061.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("s03-len-cong.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>, không chạy trên oneinvest");
}
const HERE = import.meta.dirname;
const HAM_061 = MIG_061.slice(MIG_061.indexOf("-- 3. Kiểu và miền"));
const TEP_068 = join(HERE, "../../db/migrations/068_giu_nguon_goc_sdt.sql");
const MIG_068 = readFileSync(existsSync(TEP_068) ? TEP_068 : join(HERE, "fixtures/068_giu_nguon_goc_sdt.ban-sao.sql"), "utf8");
const TEP_067 = join(HERE, "../../db/migrations/067_tang_huong_tin.sql");
const MIG_067 = readFileSync(existsSync(TEP_067) ? TEP_067 : join(HERE, "fixtures/067_tang_huong_tin.ban-sao.sql"), "utf8");
let seq = 0;

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Tin S03 mồi, không đi qua transform. Trả offer_id và các post. */
async function tinMoi(c, nBai = 1, them = {}) {
  const id = `offer_sl1_${process.pid}_${++seq}`;
  const posts = Array.from({ length: nBai }, (_, i) => `sl1_${process.pid}_${seq}_${i}`);
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, confidence, first_seen, last_seen,
       n_reposts, post_ids, area_id, phuong_raw)
     VALUES ($1, $2, 'S03', 'sale', 3e9, 60, 'medium', now(), now(), $3, $4, $5, $6)`,
    [id, `S03|${posts[0]}`, nBai, posts, them.area_id ?? null, them.phuong_raw ?? null],
  );
  return { id, posts };
}
const pb = (post, field, value, tier, method = "e1_rule") => ({
  subject_key: `S03:${post}`, field, value, evidence_tier: tier, method, method_version: "test-sl1",
});
const docTin = async (c, id) => (await c.query(
  "SELECT property_type, block_raw, field_provenance fp FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0];

test("SL1-AC-5 phân xử: inferred một giá trị vào cột, hai giá trị thì không, lớp trên thắng, trường khác giữ luật", async () => {
  await withTx(async (c) => {
    const mot = await tinMoi(c);
    await writeAssertions(c, [pb(mot.posts[0], "property_type", "apartment", "inferred")]);
    await resolveOffers(c, [mot.id]);
    const a = await docTin(c, mot.id);
    assert.equal(a.property_type, "apartment", "một giá trị suy");
    assert.equal(a.fp.property_type.tier, "inferred");
    assert.equal(a.fp.property_type.goi_y, undefined);

    const hai = await tinMoi(c, 2);
    await writeAssertions(c, [pb(hai.posts[0], "property_type", "apartment", "inferred"), pb(hai.posts[1], "property_type", "house", "inferred")]);
    await resolveOffers(c, [hai.id]);
    const b = await docTin(c, hai.id);
    assert.equal(b.property_type, "unknown", "hai giá trị suy trái nhau");
    assert.equal(b.fp.property_type.goi_y.length, 2);

    const tren = await tinMoi(c, 2);
    await writeAssertions(c, [pb(tren.posts[0], "property_type", "house", "observed"), pb(tren.posts[1], "property_type", "apartment", "inferred")]);
    await resolveOffers(c, [tren.id]);
    const d = await docTin(c, tren.id);
    assert.equal(d.property_type, "house", "observed thắng");
    assert.equal(d.fp.property_type.tier, "observed");
    assert.equal(d.fp.property_type.lower_disagree, true);

    const khac = await tinMoi(c);
    await writeAssertions(c, [pb(khac.posts[0], "block_raw", "A1", "inferred")]);
    await resolveOffers(c, [khac.id]);
    const e = await docTin(c, khac.id);
    assert.equal(e.block_raw, null, "trường khác chỉ inferred không vào cột");
    assert.equal(e.fp.block_raw.goi_y.length, 1);
  });
});

test("SL1-AC-5 đỏ: bản hàm 061 chưa vá thì giá trị suy không vào cột", async () => {
  await withTx(async (c) => {
    await c.query(HAM_061);
    const t = await tinMoi(c);
    await writeAssertions(c, [pb(t.posts[0], "property_type", "apartment", "inferred")]);
    await resolveOffers(c, [t.id]);
    assert.equal((await docTin(c, t.id)).property_type, "unknown", "SL1-AC-5: thước không phân biệt được bản chưa vá");
  });
});

test("SL1-AC-5 áp 069 không đổi ô nào của tin hiện có", async () => {
  await withTx(async (c) => {
    // Trọn dòng (cả bathrooms, cột đặc trưng 061, field_provenance), trừ dấu thời gian cập nhật.
    const chup = async () => (await c.query(
      `SELECT md5(string_agg((to_jsonb(t) - 'updated_at')::text, E'\n' ORDER BY offer_id)) h, count(*)::int n FROM sale_offer_records t`)).rows[0];
    await c.query(HAM_061);
    await resolveOffers(c, null);
    const truoc = await chup();
    await c.query(MIG_069);
    await resolveOffers(c, null);
    const sau = await chup();
    assert.ok(truoc.n > 0);
    assert.equal(sau.h, truoc.h, "SL1-AC-5: có ô đổi sau khi áp 069");
    // Đối chứng: đổi đúng một ô trên cột thước cũ không đo thì băm phải đổi.
    await c.query("UPDATE sale_offer_records SET bathrooms = coalesce(bathrooms, 0) + 1 WHERE offer_id = (SELECT min(offer_id) FROM sale_offer_records)");
    assert.notEqual((await chup()).h, truoc.h, "SL1-AC-5: thước không đỏ khi đổi một ô bathrooms");
  });
});

test("SL1-AC-5 hai thứ tự với 068 giữ cả fp_sdt lẫn luật mới, chạy lại an toàn, mất mốc thì dừng", async () => {
  console.log(`bản 068 dùng: ${existsSync(TEP_068) ? "tệp đã gộp" : "bản sao trong fixtures"}`);
  console.log(`bản 067 dùng: ${existsSync(TEP_067) ? "tệp đã gộp" : "bản sao trong fixtures"}`);
  // 067 thay trọn thân hàm nên chỉ xét thứ tự 067 đứng trước 069; 069 áp trước thì 067 phải vá lại (xem sổ quyết định).
  const MA_TRAN = [
    ["chỉ 069", [MIG_069, MIG_069], { sdt: false, huong: false }],
    ["067→069", [MIG_067, MIG_069, MIG_069], { sdt: false, huong: true }],
    ["068→069", [MIG_068, MIG_069, MIG_069], { sdt: true, huong: false }],
    ["069→068", [MIG_069, MIG_068, MIG_068], { sdt: true, huong: false }],
    ["067→068→069", [MIG_067, MIG_068, MIG_069, MIG_069], { sdt: true, huong: true }],
  ];
  assert.equal(new Set(MA_TRAN.map(([ten]) => ten)).size, 5);
  for (const [ten, thuTu, mong] of MA_TRAN) {
    await withTx(async (c) => {
      await c.query(HAM_061);
      for (const s of thuTu) await c.query(s);
      const { rows: [{ def }] } = await c.query("SELECT pg_get_functiondef('resolve_offer_fields(text[])'::regprocedure) def");
      assert.equal(def.includes("fp_sdt"), mong.sdt, `${ten}: fp_sdt`);
      assert.equal(def.includes("unit_facing"), mong.huong, `${ten}: cột 067`);
      assert.ok(def.includes("inferred_vao_cot"), `${ten}: mất luật mới`);
      if (mong.sdt) assert.equal(def.split("fp_sdt").length, 4, `${ten}: 068 vá trùng`);
      const t = await tinMoi(c);
      await writeAssertions(c, [pb(t.posts[0], "property_type", "apartment", "inferred")]);
      await resolveOffers(c, [t.id]);
      assert.equal((await docTin(c, t.id)).property_type, "apartment", ten);
      // Chạy thật, đọc lại: thứ tự có 068 giữ dấu số, thứ tự không có 068 làm đối chứng đỏ (dấu số mất qua phân xử).
      const dauSo = { rule_id: "sl1-thu" }, dauChao = { rule_id: "sl1-chao" };
      const x = await tinMoi(c);
      await c.query("UPDATE sale_offer_records SET field_provenance = $2 WHERE offer_id = $1",
        [x.id, JSON.stringify({ seller_phone: dauSo, offer_status: dauChao })]);
      await writeAssertions(c, [pb(x.posts[0], "property_type", "apartment", "inferred")]);
      await resolveOffers(c, [x.id]);
      const fp = (await docTin(c, x.id)).fp;
      assert.deepEqual(fp.seller_phone, mong.sdt ? dauSo : undefined, `${ten}: dấu số sau phân xử`);
      assert.deepEqual(fp.offer_status, dauChao, `${ten}: dấu trạng thái chào sau phân xử`);
      assert.equal(fp.property_type?.tier, "inferred", `${ten}: xuất xứ loại hình`);
      if (mong.huong) {
        await writeAssertions(c, [pb(x.posts[0], "unit_facing", "balcony:east", "observed")]);
        await resolveOffers(c, [x.id]);
        const { rows: [{ unit_facing }] } = await c.query("SELECT unit_facing FROM sale_offer_records WHERE offer_id = $1", [x.id]);
        assert.equal(unit_facing, "balcony:east", `${ten}: cột của 067 không nhận phân xử`);
      }
    });
  }
  await withTx(async (c) => {
    await c.query(`CREATE OR REPLACE FUNCTION resolve_offer_fields(p_offer_ids text[]) RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$`);
    await assert.rejects(c.query(MIG_069), /MOC-069/);
  });
});

// ---- Bên đọc khu vực (AC-2, AC-3) ----
const docSql = (t) => readFileSync(join(HERE, "../sql", t), "utf8");
const IM = { log() {}, warn() {}, error() {}, info() {} };
const SQL_500 = docSql("500_asset_stats.sql");

async function thiTruongCoPhuong(c) {
  const { rows } = await c.query(
    `SELECT a.parent_id m, a.id w, count(*)::int n FROM sale_offers o JOIN areas a ON a.id = o.area_id
      WHERE o.source = 'S06' AND a.region_type = 'submarket' AND a.parent_id = 'vn-hanoi' GROUP BY 1, 2 ORDER BY 3, 2 LIMIT 1`);
  assert.ok(rows[0], "DB thử không có tin S06 theo phường");
  return { market: rows[0].m, ward: rows[0].w };
}
async function tinS03(c, areaId, { kind = "sale", phuong = null, gia = 3e9, dt = 60 } = {}) {
  const t = await tinMoi(c, 1, { area_id: areaId, phuong_raw: phuong });
  await c.query("UPDATE sale_offer_records SET kind = $2, price_vnd = $3::numeric, area_m2 = $4::numeric, price_perm2 = $3::numeric / $4::numeric, price_tier = 'P1' WHERE offer_id = $1", [t.id, kind, gia, dt]);
  return t;
}
const bam = async (c, bang, loc = "true") => (await c.query(
  `SELECT count(*)::int n, md5(coalesce(string_agg(x, E'\\n' ORDER BY x), '')) h FROM (SELECT (t.*)::text x FROM ${bang} t WHERE ${loc}) s`)).rows[0];

test("SL1-AC-2 rollup 300, 400 giữ nguyên; 500 không có dòng cấp thị trường, dòng phường không đổi", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    const { market } = await thiTruongCoPhuong(c);
    const chay = async () => {
      await c.query(docSql("300_metrics.sql"));
      await c.query(docSql("400_breakdowns.sql"));
      await c.query(SQL_500);
      return {
        mm: await bam(c, "market_metrics"),
        ab: await bam(c, "area_breakdowns"),
        phuong: await bam(c, "market_asset_stats", "area_id IN (SELECT id FROM areas WHERE region_type = 'submarket')"),
        tt: await bam(c, "market_asset_stats", "area_id IN (SELECT id FROM areas WHERE region_type = 'market')"),
      };
    };
    const nen = await chay();
    for (let i = 0; i < 4; i++) { await tinS03(c, market); await tinS03(c, market, { kind: "rent_lt", gia: 15e6 }); }
    const co = await chay();
    assert.ok(co.mm.n > 0 && co.ab.n > 0, "SL1-AC-2 rollup rỗng, băm không so được gì");
    assert.equal(co.mm.h, nen.mm.h, "SL1-AC-2 market_metrics đổi");
    assert.equal(co.ab.h, nen.ab.h, "SL1-AC-2 area_breakdowns đổi");
    assert.ok(co.phuong.n > 0, "SL1-AC-2 không có dòng phường để so");
    assert.equal(co.phuong.h, nen.phuong.h, "SL1-AC-2 dòng phường đổi");
    assert.equal(co.tt.n, 0, "SL1-AC-2 có dòng cấp thị trường");
    // Đỏ: bản 500 cũ (chỉ lọc area_id khác trống) có dòng cấp thị trường.
    const bo = SQL_500.replace(/o\.area_id IN \(SELECT id FROM areas WHERE region_type = 'submarket'\)/g, "o.area_id IS NOT NULL");
    assert.notEqual(bo, SQL_500);
    await c.query(bo);
    assert.ok((await bam(c, "market_asset_stats", "area_id IN (SELECT id FROM areas WHERE region_type = 'market')")).n > 0,
      "SL1-AC-2: thước không đỏ trên bản 500 cũ");
    // Đối chứng băm 300, 400: dữ liệu đầu vào đổi thì băm đổi; và hai tệp không đọc tin rao nên tin cấp thị trường không chạm được.
    for (const t of ["300_metrics.sql", "400_breakdowns.sql"]) assert.ok(!docSql(t).includes("sale_offers"), `SL1-AC-2 ${t} đọc tin rao`);
    await c.query("DELETE FROM nights WHERE listing_id = (SELECT min(listing_id) FROM nights)");
    const doi = await chay();
    assert.ok(doi.mm.h !== nen.mm.h || doi.ab.h !== nen.ab.h, "SL1-AC-2: băm rollup không đổi khi dữ liệu đầu vào đổi");
  });
});

test("SL1-AC-3 thước, bait, ghép, reassign, bậc dữ liệu với tin cấp thị trường", { timeout: 600_000 }, async () => {
  const { refreshBaitGap } = await import("../refresh-bait-gap.mjs");
  const { chayResolve } = await import("../resolve-properties.mjs");
  const { MARKETS, runReassign } = await import("../reassign-areas.mjs");
  const { ghiAnhChup, SQL_610 } = await import("../bac-du-lieu.mjs");
  await withTx(async (c) => {
    const { market, ward } = await thiTruongCoPhuong(c);
    const a = await tinS03(c, market), b = await tinS03(c, market);
    // Đủ để thước đạt ngưỡng 5 căn nếu tin cấp thị trường lọt vào: mỗi tin một giá nên mỗi tin một căn.
    const nhieu = [];
    for (let i = 0; i < 6; i++) nhieu.push(await tinS03(c, market, { gia: 3e9 + i * 1e8 }));
    // Đối chứng bait: tin S03 có phường, ở phường có sẵn thước.
    const { rows: [coThuoc] } = await c.query(
      `SELECT v.area_id w FROM v_ruler_p2_area v JOIN areas x ON x.id = v.area_id WHERE x.parent_id = $1 ORDER BY v.area_id LIMIT 1`, [market]);
    assert.ok(coThuoc, "SL1-AC-3 DB thử không có phường có thước");
    const coGap = await tinS03(c, coThuoc.w, { phuong: "x" });
    // Cặp đối chứng: S03 có phường và tin S06 cùng phường, cùng DT và giá.
    const doiChung = await tinS03(c, ward, { phuong: "x" });
    const s06 = `offer_sl1_s06_${process.pid}`;
    await c.query(
      `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen, n_reposts, post_ids, area_id)
       VALUES ($1, $2, 'S06', 'sale', 3e9, 60, 5e7, 'high', now(), now(), 1, '{}', $3)`, [s06, `S06|sl1${process.pid}`, ward]);
    const { rows: [{ k }] } = await c.query("SELECT (offer_subject_keys('S06', $1, '{}'))[1] k", [`S06|sl1${process.pid}`]);
    await writeAssertions(c, [{ subject_key: k, field: "property_type", value: "apartment", evidence_tier: "fact", method: "source_field" }]);
    await resolveOffers(c, [s06]);
    // Tin S06 mang mã thị trường, cùng giá, cùng diện tích với tin S03 a: không có luật thì thành cặp theo area_id.
    const s06Tt = `offer_sl1_s06tt_${process.pid}`;
    await c.query(
      `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen, n_reposts, post_ids, area_id)
       VALUES ($1, $2, 'S06', 'sale', 3e9, 60, 5e7, 'high', now(), now(), 1, '{}', $3)`, [s06Tt, `S06|sl1tt${process.pid}`, market]);
    const { rows: [{ k: kTt }] } = await c.query("SELECT (offer_subject_keys('S06', $1, '{}'))[1] k", [`S06|sl1tt${process.pid}`]);
    await writeAssertions(c, [{ subject_key: kTt, field: "property_type", value: "apartment", evidence_tier: "fact", method: "source_field" }]);
    await resolveOffers(c, [s06Tt]);
    // Tin S06 có toạ độ: mã thị trường thì không được dựng căn (không thì đủ 5 căn là thước có dòng cấp thị trường), không mã khu vực thì vẫn dựng như cũ.
    const tinS06CoToaDo = async (ma, areaId, i) => {
      const listId = 910000000 + process.pid * 100 + i;
      const { rows: [{ id }] } = await c.query("SELECT 'offer_' || substr(encode(digest('S06|' || $1::text, 'sha256'), 'hex'), 1, 16) id", [listId]);
      const gia = 4e9 + i * 1e8;
      await c.query(
        `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen, n_reposts, post_ids, area_id)
         VALUES ($1, $2, 'S06', 'sale', $3::float8, 60, $3::float8 / 60, 'high', now(), now(), 1, '{}', $4)`, [id, `S06|${listId}`, gia, areaId]);
      await c.query(
        `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, latitude, longitude)
         VALUES ($1, 0, $2, 1000, 's', '{}', (SELECT min(snapshot_id) FROM stg_chotot_ads), $3, 105.8)`, [listId, ma, 21 + i * 0.01]);
      const { rows: [{ k: kk }] } = await c.query("SELECT (offer_subject_keys('S06', $1, '{}'))[1] k", [`S06|${listId}`]);
      await writeAssertions(c, [{ subject_key: kk, field: "property_type", value: "apartment", evidence_tier: "fact", method: "source_field" }]);
      await resolveOffers(c, [id]);
      return id;
    };
    const s06TtToaDo = [];
    for (let i = 0; i < 6; i++) s06TtToaDo.push(await tinS06CoToaDo(`sl1tt${i}`, market, i));
    const s06KhongMa = await tinS06CoToaDo("sl1null", null, 6);

    // Thu hẹp bộ ghép về phường đối chứng và tin thử: chạy cả 50 nghìn tin mất hơn 10 phút. Mã bộ ghép vẫn là mã thật.
    await c.query(`CREATE TEMP VIEW sale_offers AS SELECT * FROM public.sale_offers WHERE area_id = '${ward}' OR offer_id = ANY ('{${[a, b, doiChung, coGap, ...nhieu, ...[s06Tt, ...s06TtToaDo, s06KhongMa].map((id) => ({ id }))].map((t) => t.id).join(",")},${s06}}')`);
    await refreshBaitGap(c);
    await chayResolve(c, { ghi() {}, savepoint: true });
    const thanhPho = Object.keys(MARKETS).find((k2) => MARKETS[k2].id === market);
    assert.ok(thanhPho, "SL1-AC-3 thị trường không có trong reassign");
    await runReassign(c, [thanhPho], { log: IM });

    assert.equal((await c.query(`SELECT count(*)::int n FROM v_ruler_p2_area v JOIN areas x ON x.id = v.area_id WHERE x.region_type = 'market'`)).rows[0].n, 0, "SL1-AC-3 thước cấp thị trường");
    const canCua = async (ids) => (await c.query("SELECT count(*)::int n FROM property_offers WHERE offer_id = ANY ($1)", [ids])).rows[0].n;
    assert.equal(await canCua(s06TtToaDo), 0, "SL1-AC-3 tin S06 cấp thị trường được dựng căn");
    assert.equal(await canCua([s06KhongMa]), 1, "SL1-AC-3 đối chứng: tin S06 chưa có khu vực mất căn");
    assert.ok((await c.query("SELECT count(*)::int n FROM v_ruler_p2_area v JOIN areas x ON x.id = v.area_id WHERE x.parent_id = $1", [market])).rows[0].n > 0, "SL1-AC-3 đối chứng: không còn thước phường");
    const { rows: [{ bait_gap_pct: gap }] } = await c.query("SELECT bait_gap_pct FROM sale_offer_records WHERE offer_id = $1", [coGap.id]);
    assert.notEqual(gap, null, "SL1-AC-3 đối chứng: tin có phường có thước mà gap trống");
    const { rows: dong } = await c.query("SELECT offer_id, bait_gap_pct, area_id FROM sale_offer_records WHERE offer_id = ANY ($1)", [[a.id, b.id, ...nhieu.map((t) => t.id)]]);
    for (const d of dong) {
      assert.equal(d.bait_gap_pct, null, "SL1-AC-3 bait_gap_pct");
      assert.equal(d.area_id, market, "SL1-AC-3 area_id bị dọn");
    }
    const cap = async (ids) => (await c.query("SELECT count(*)::int n FROM property_candidates WHERE offer_a = ANY ($1) OR offer_b = ANY ($1)", [ids])).rows[0].n;
    // Stage B đóng băng (V7, hồ sơ dong-bang-stage-b-resolve): resolve không dựng cặp nào nữa, nên «tin cấp thị trường
    // không thành cặp» đúng theo cấu tạo, và đối chứng «cặp cùng phường có sinh» đổi thành «không cặp mới nào».
    assert.equal(await cap([a.id, b.id, s06Tt]), 0, "SL1-AC-3 có cặp chứa tin cấp thị trường");
    assert.equal(await cap([doiChung.id]), 0, "SL1-AC-3 Stage B đóng băng (V7): có cặp mới");

    await ghiAnhChup(c);
    const tinh = async () => (await c.query(
      `SELECT coalesce(sum(n), 0)::int n FROM data_level_snapshot WHERE snap_date = current_date AND market_id = $1 AND unit = 'tin_le'`, [market])).rows[0].n;
    const co = await tinh();
    await c.query(SQL_610.replace("m.id IN (w.id, w.parent_id)", "m.id = w.parent_id"));
    const cu = await tinh();
    assert.ok(co - cu >= 2, `SL1-AC-3: bản 610 cũ không làm tin rơi vào «chua-ro» (${co} so với ${cu})`);
  });
});

// ---- Sổ nhóm (AC-6) ----
test("SL1-AC-6 khai-so-nhom: mặc định không ghi, ghi đúng, chạy lại không thêm nhật ký, lỗi không ghi", { timeout: 120_000 }, async () => {
  const { khaiSoNhom } = await import("../khai-so-nhom.mjs");
  const dir = mkdtempSync(join(tmpdir(), "sl1-so-"));
  const viet = (ten, nhom) => { const p = join(dir, ten); writeFileSync(p, JSON.stringify({ nhom })); return p; };
  await withTx(async (c) => {
    const { rows: so } = await c.query("SELECT unit_code, enabled, status FROM collection_units WHERE source_code = 'S03' ORDER BY 1");
    assert.ok(so.length >= 2, "DB thử cần ít nhất hai đơn vị S03");
    await c.query("UPDATE stg_zalo_posts SET group_name = 'Nhóm SL1 ' || conversation_id WHERE conversation_id IN (SELECT group_key FROM collection_units WHERE source_code = 'S03')");
    await c.query("UPDATE collection_units SET market_codes = '{}', note = NULL WHERE source_code = 'S03'");
    const nhom = so.map((r) => ({ unit_code: r.unit_code, market_codes: [], the: null, the_ma: null }));
    nhom[0] = { ...nhom[0], market_codes: ["vn-hanoi"], the: "Thẻ thử", the_ma: "TT" };
    const tep = viet("dung.json", nhom);
    const nk = async () => (await c.query("SELECT count(*)::int n FROM ops_audit WHERE actor = 'machine:khai-so-nhom'")).rows[0].n;
    const nk0 = await nk();
    const hang = async () => (await c.query("SELECT market_codes, note FROM collection_units WHERE unit_code = $1", [nhom[0].unit_code])).rows[0];
    const ra = [];

    const nhap = await khaiSoNhom(c, tep, { out: (s) => ra.push(s) });
    assert.equal(nhap.can_doi, 1);
    assert.equal(nhap.da_ghi, 0);
    assert.deepEqual(await hang(), { market_codes: [], note: null }, "SL1-AC-6 mặc định đã ghi");
    assert.equal(await nk(), nk0);

    const ghi = await khaiSoNhom(c, tep, { ghi: true, out: (s) => ra.push(s) });
    assert.equal(ghi.da_ghi, 1);
    assert.deepEqual(await hang(), { market_codes: ["vn-hanoi"], note: "[TT] Thẻ thử" }, "SL1-AC-6 ghi sai");
    assert.equal(await nk(), nk0 + 1);
    const { rows: [dong] } = await c.query("SELECT action, detail FROM ops_audit WHERE actor = 'machine:khai-so-nhom' ORDER BY id DESC LIMIT 1");
    assert.equal(dong.action, "unit.update_meta");
    assert.deepEqual(dong.detail, { thao_tac: "set-meta", unit_code: nhom[0].unit_code });

    await khaiSoNhom(c, tep, { ghi: true, out: (s) => ra.push(s) });
    assert.equal(await nk(), nk0 + 1, "SL1-AC-6 chạy lại thêm nhật ký");
    const { rows: sau } = await c.query("SELECT unit_code, enabled, status FROM collection_units WHERE source_code = 'S03' ORDER BY 1");
    assert.deepEqual(sau, so, "SL1-AC-6 enabled, status đổi");
    assert.ok(ra.length > 0, "SL1-AC-6 không có dòng ra để soát");
    const { rows: giaTriKhoa } = await c.query("SELECT group_key FROM collection_units WHERE source_code = 'S03' AND length(group_key) >= 4");
    const loKhoa = (s) => giaTriKhoa.some((r) => s.includes(r.group_key));
    assert.ok(giaTriKhoa.length > 0 && loKhoa(`x ${giaTriKhoa[0].group_key} y`), "SL1-AC-6 đối chứng: thước không đỏ khi dòng ra mang khoá");
    for (const s of ra) {
      assert.ok(!/Nhóm SL1|group_key|Thẻ thử/.test(s), "SL1-AC-6 stdout lộ chữ ngoài số đếm");
      assert.ok(!loKhoa(s), "SL1-AC-6 stdout lộ giá trị khoá nhóm");
    }

    // Chụp trọn đơn vị S03 và nhật ký. Mỗi tệp hỏng đều mang một thay đổi hợp lệ ở đơn vị khác: ghi trước khi ném là lộ ngay.
    assert.ok(so.length >= 3, "DB thử cần ít nhất ba đơn vị S03");
    const chupSo = async () => ({
      don_vi: (await c.query("SELECT (t.*)::text x FROM collection_units t WHERE source_code = 'S03' ORDER BY unit_code")).rows.map((r) => r.x),
      nhat_ky: await nk(),
    });
    const coDoi = nhom.map((n, i) => (i === 0 ? { ...n, market_codes: [], the: null, the_ma: null } : n));
    const truoc = await chupSo();
    // Đối chứng: chính thay đổi ấy, không kèm lỗi, làm thước đỏ.
    await c.query("SAVEPOINT doi_chung");
    assert.equal((await khaiSoNhom(c, viet("doi.json", coDoi), { ghi: true, out() {} })).da_ghi, 1, "SL1-AC-6 đối chứng không ghi");
    assert.notDeepEqual(await chupSo(), truoc, "SL1-AC-6 đối chứng: thước không thấy lần ghi");
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
    assert.deepEqual(await chupSo(), truoc);
    const hong = {
      "mã thị trường lạ": coDoi.map((n, i) => (i === 1 ? { ...n, market_codes: ["vn-khong-co"] } : n)),
      "đơn vị không có trong sổ": [...coDoi, { unit_code: "S03-N999", market_codes: [] }],
      "thiếu đơn vị": coDoi.slice(0, -1),
      "thẻ thiếu một vế": coDoi.map((n, i) => (i === 1 ? { ...n, the: "x" } : n)),
    };
    for (const [ly_do, ds] of Object.entries(hong)) {
      await assert.rejects(khaiSoNhom(c, viet("hong.json", ds), { ghi: true, out() {} }), new RegExp(ly_do), ly_do);
      assert.deepEqual(await chupSo(), truoc, `SL1-AC-6 ${ly_do}: DB đổi`);
    }
    // Nhóm cùng tên, nơi có thẻ nơi không: thiếu thẻ.
    const { rows: khoa } = await c.query("SELECT group_key FROM collection_units WHERE unit_code = ANY ($1)", [[nhom[0].unit_code, nhom[1].unit_code]]);
    await c.query("INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('sl1_so', 'hanoi', 'sl1-thu', '{}') ON CONFLICT DO NOTHING");
    for (const [i, r] of khoa.entries()) {
      await c.query(
        `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
         VALUES ($1, 'sl1_so', 'openclaw-hook', 'Nhóm SL1 chung', 'x', now() + interval '1 day', 'u', 'u', $2)`, [`sl1_so_${process.pid}_${i}`, r.group_key]);
    }
    await assert.rejects(khaiSoNhom(c, tep, { ghi: true, out() {} }), /thiếu thẻ/);
  });
  // Lệnh thật: thoát khác 0, không ghi.
  const c3 = new pg.Client({ connectionString: DB_URL });
  await c3.connect();
  const chupLenh = async () => (await c3.query(
    `SELECT (SELECT md5(string_agg((t.*)::text, E'\\n' ORDER BY unit_code)) FROM collection_units t WHERE source_code = 'S03') don_vi,
            (SELECT count(*)::int FROM ops_audit WHERE actor = 'machine:khai-so-nhom') nhat_ky`)).rows[0];
  const truocLenh = await chupLenh();
  const r = spawnSync(process.execPath, [join(HERE, "../khai-so-nhom.mjs"), "--tep", viet("cli.json", [{ unit_code: "S03-N999", market_codes: [] }]), "--ghi"], { encoding: "utf8", env: process.env });
  assert.notEqual(r.status, 0, "SL1-AC-6 lệnh thoát 0 với đơn vị lạ");
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /đơn vị không có trong sổ/, "SL1-AC-6 lệnh đỏ vì lý do khác");
  assert.deepEqual(await chupLenh(), truocLenh, "SL1-AC-6 lệnh thật báo lỗi mà DB đổi");
  await c3.end();
  // Đối chứng: lệnh thật với sổ đúng hiện trạng thoát 0, chỉ in số đếm, không ghi.
  const c2 = new pg.Client({ connectionString: DB_URL });
  await c2.connect();
  try {
    const chup = async () => (await c2.query("SELECT md5(string_agg((t.*)::text, E'\\n' ORDER BY unit_code)) h FROM collection_units t WHERE source_code = 'S03'")).rows[0].h;
    const { rows: hienTai } = await c2.query("SELECT unit_code, market_codes, group_key FROM collection_units WHERE source_code = 'S03'");
    const truoc = await chup();
    const dung = spawnSync(process.execPath, [join(HERE, "../khai-so-nhom.mjs"), "--tep", viet("cli-dung.json", hienTai.map((h) => ({ unit_code: h.unit_code, market_codes: h.market_codes ?? [] })))], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL } });
    assert.equal(dung.status, 0, "SL1-AC-6 lệnh thật với sổ đúng phải thoát 0");
    assert.equal(JSON.parse(dung.stdout).da_ghi, 0);
    assert.ok(!hienTai.some((h) => h.group_key && dung.stdout.includes(h.group_key)), "SL1-AC-6 lệnh thật in khoá nhóm");
    assert.equal(await chup(), truoc, "SL1-AC-6 lệnh thật không có --ghi mà DB đổi");
  } finally {
    await c2.end();
  }
});

test("SL1-AC-6 nháp thật đủ 30 đơn vị, 19 đơn vị có thẻ, 16 tên nhóm", { timeout: 60_000 }, async (t) => {
  const tep = join(HERE, "../../research-local/s03-len-cong/so-nhom-nhap.json");
  if (!existsSync(tep)) return t.skip("nháp không có ở máy này");
  const { khaiSoNhom } = await import("../khai-so-nhom.mjs");
  await withTx(async (c) => {
    const d = await khaiSoNhom(c, tep, { out() {} });
    assert.equal(d.don_vi, 30);
    assert.equal(d.don_vi_co_the, 19);
    assert.equal(d.ten_nhom_co_the, 16);
    assert.equal(d.da_ghi, 0);
  });
});

// ---- Qua transform thật (AC-1 DB, AC-5 phát biểu). View tạm thu hẹp về bài của ca: mã transform vẫn là mã thật. ----
const TAG = `sl1t_${process.pid}`;
const SNAP = "hanoi__zalo-agent__2099-01-03T000000";
const TZ = join(HERE, "../transform-zalo.mjs");
let nBai = 0;

async function moLuot(c) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'sl1-thu', '{}')
    ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  await c.query(`CREATE TEMP VIEW stg_zalo_posts AS SELECT * FROM public.stg_zalo_posts WHERE post_id LIKE '${TAG}%'`);
}
async function bai(c, nhom, text, sender = null) {
  const id = `${TAG}_${++nBai}`;
  await c.query(
    `INSERT INTO public.stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử N1', $3, '2099-01-03T01:00:00Z', $4, NULL, $5)`,
    [id, SNAP, text, sender ?? `nguoi_${nBai}`, `${TAG}_${nhom}`]);
  return id;
}
/** Nhiều bài cùng loại, mỗi bài một giá nên mỗi bài một tin. */
async function loat(c, nhom, n, cum) {
  const ids = [];
  for (let i = 0; i < n; i++) ids.push(await bai(c, nhom, `Bán ${cum} 2PN 60m2 giá ${3000 + ++nBai} triệu`));
  return ids;
}
const khai = (c, nhom, markets) => c.query(
  `INSERT INTO collection_units (source_code, group_key, name, unit_type, market_codes) VALUES ('S03', $1, 'Nhóm thử', 'nhom', $2)`,
  [`${TAG}_${nhom}`, markets]);
const tinCua = async (c, post) => (await c.query(
  "SELECT offer_id, area_id, phuong_raw, confidence, property_type, field_provenance fp, post_ids FROM sale_offer_records WHERE $1 = ANY (post_ids)", [post])).rows[0];
const phatBieu = async (c, post) => (await c.query(
  `SELECT value AS gia_tri, evidence_tier, method, method_version, rule_id, retracted_at FROM field_assertions
    WHERE subject_key = $1 AND field = 'property_type' ORDER BY id`, [`S03:${post}`])).rows;
const song = async (c, post) => (await phatBieu(c, post)).filter((d) => !d.retracted_at);
async function transformDotBien(cu, moi) {
  const src = readFileSync(TZ, "utf8");
  assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const f = join(HERE, `../.sl1-mut-itest-${process.pid}-${++nBai}.mjs`);
  writeFileSync(f, src.replace(cu, moi));
  try {
    return (await import(pathToFileURL(f).href)).runTransformZalo;
  } finally {
    rmSync(f, { force: true });
  }
}
const IM_LOG = async (fn) => {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
};

async function maTranKhuVuc(c) {
  await moLuot(c);
  await khai(c, "a", ["vn-hanoi"]);
  await khai(c, "b", ["vn-hanoi"]);
  await khai(c, "c", ["vn-hanoi"]);
  await khai(c, "e", ["vn-hanoi", "vn-hcmc"]);
  return {
    a: await bai(c, "a", "Bán căn hộ 2PN 60m2 giá 3201 triệu"),
    b: await bai(c, "b", "Bán căn hộ 2PN 60m2 giá 3202 triệu phường Phúc Lộc"),
    c: await bai(c, "c", "Bán căn hộ 2PN 60m2 giá 3203 triệu phường Chánh Phú Hòa"),
    d: await bai(c, "d", "Bán căn hộ 2PN 60m2 giá 3204 triệu"),
    e: await bai(c, "e", "Bán căn hộ 2PN 60m2 giá 3205 triệu"),
  };
}

test("SL1-AC-1 DB: năm dòng ma trận qua transform thật", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const b = await maTranKhuVuc(c);
    await IM_LOG(() => runTransformZalo(c));
    const mong = [["a", "vn-hanoi", true], ["b", "vn-hanoi-phuc-loc", false], ["c", "vn-hanoi", true], ["d", null, false], ["e", null, false]];
    let soDong = 0;
    for (const [k, area, capThiTruong] of mong) {
      const t = await tinCua(c, b[k]);
      assert.ok(t, `SL1-AC-1 dòng ${k} không thành tin`);
      assert.equal(t.area_id, area, `SL1-AC-1 dòng ${k} khu vực`);
      if (capThiTruong) {
        assert.equal(t.phuong_raw, null, `SL1-AC-1 dòng ${k} phuong_raw`);
        assert.notEqual(t.confidence, "high", `SL1-AC-1 dòng ${k} confidence`);
      }
      soDong++;
    }
    assert.equal(soDong, mong.length);
  });
  await withTx(async (c) => {
    const b = await maTranKhuVuc(c);
    const dotBien = await transformDotBien("khai?.length === 1 &&", "khai?.length >= 1 &&");
    await IM_LOG(() => dotBien(c));
    assert.notEqual((await tinCua(c, b.e)).area_id, null, "SL1-AC-1: thước không đỏ trên bản bỏ điều kiện đúng một thị trường, dòng khai hai");
  });
});

test("SL1-AC-5 phát biểu: đúng bậc, ngưỡng, chạy lại, rút, đổi đa số, tin hai bài, bộ khác", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    await moLuot(c);
    const can = await loat(c, "g1", 22, "căn hộ");
    const [nha] = await loat(c, "g1", 3, "nhà riêng");
    const [x1, xBoKhac, xLlm] = await loat(c, "g1", 3, "căn");
    await loat(c, "g2", 9, "căn hộ");
    const [x2] = await loat(c, "g2", 1, "căn");
    await loat(c, "g3", 15, "căn hộ");
    await loat(c, "g3", 10, "nhà riêng");
    const [x3] = await loat(c, "g3", 1, "căn");
    await loat(c, "g4", 21, "nhà riêng");
    const hai = [await bai(c, "g1", "Bán căn 2PN 70m2 giá 3771 triệu phường Phúc Lộc"), await bai(c, "g4", "Bán căn 2PN 70m2 giá 3771 triệu phường Phúc Lộc")];
    const ov = [await bai(c, "g1", "Bán căn hộ 2PN 72m2 giá 3881 triệu phường Phúc Lộc"), await bai(c, "g4", "Bán căn 2PN 72m2 giá 3881 triệu phường Phúc Lộc")];
    const g5 = await loat(c, "g5", 20, "căn hộ");
    const [x5] = await loat(c, "g5", 1, "căn");
    await loat(c, "g6", 20, "căn hộ");
    const [x6] = await loat(c, "g6", 1, "căn");
    await writeAssertions(c, [
      { ...pb(xBoKhac, "property_type", "house", "inferred"), method_version: "bo-khac@1" },
      pb(xLlm, "property_type", "house", "observed", "e2_llm"),
    ]);

    await IM_LOG(() => runTransformZalo(c));

    // Bậc và phương pháp.
    const [dCan] = await song(c, can[0]);
    assert.deepEqual([dCan.gia_tri, dCan.evidence_tier, dCan.method, dCan.rule_id], ["apartment", "observed", "e1_rule", "loai-hinh-chu"], "SL1-AC-5 từ chữ");
    const [dX1] = await song(c, x1);
    assert.deepEqual([dX1.gia_tri, dX1.evidence_tier, dX1.method, dX1.rule_id], ["apartment", "inferred", "e1_rule", "loai-hinh-nhom"], "SL1-AC-5 từ nhóm");
    const tX1 = await tinCua(c, x1);
    assert.equal(tX1.property_type, "apartment", "SL1-AC-5 cột theo giá trị suy");
    assert.equal(tX1.fp.property_type.tier, "inferred");
    // Chữ nói rõ khác đa số: chỉ một phát biểu từ chữ.
    assert.deepEqual((await song(c, nha)).map((d) => [d.gia_tri, d.evidence_tier]), [["house", "observed"]], "SL1-AC-5 chữ nói rõ thì nhóm im");
    // Dưới 20 bài, dưới 85%.
    assert.equal((await song(c, x2)).length, 0, "SL1-AC-5 nhóm dưới 20 bài có phát biểu");
    assert.equal((await song(c, x3)).length, 0, "SL1-AC-5 nhóm dưới 85% có phát biểu");
    // Bộ khác giữ nguyên, lượt này không chồng phát biểu.
    assert.deepEqual((await song(c, xBoKhac)).map((d) => d.method_version), ["bo-khac@1"], "SL1-AC-5 e1_rule của bộ khác");
    // e2_llm observed thắng suy từ nhóm.
    const tLlm = await tinCua(c, xLlm);
    assert.equal(tLlm.property_type, "house", "SL1-AC-5 e2_llm observed thua");
    assert.equal(tLlm.fp.property_type.lower_disagree, true);
    // Tin hai bài, hai giá trị suy trái nhau.
    const tHai = await tinCua(c, hai[0]);
    assert.equal(tHai.post_ids.length, 2, "SL1-AC-5 hai bài không gom một tin");
    assert.equal(tHai.property_type, "unknown", "SL1-AC-5 hai giá trị suy");
    assert.equal(tHai.fp.property_type.goi_y.length, 2);
    // observed ở bài A, inferred khác giá trị ở bài B.
    const tOv = await tinCua(c, ov[0]);
    assert.equal(tOv.post_ids.length, 2, "SL1-AC-5 hai bài observed, inferred không gom một tin");
    assert.equal(tOv.property_type, "apartment", "SL1-AC-5 observed thua");
    assert.equal(tOv.fp.property_type.lower_disagree, true);

    // Lần hai không thêm dòng.
    const dem = async () => (await c.query("SELECT count(*)::int n FROM field_assertions WHERE subject_key LIKE $1 AND field = 'property_type'", [`S03:${TAG}%`])).rows[0].n;
    const n1 = await dem();
    await IM_LOG(() => runTransformZalo(c));
    assert.equal(await dem(), n1, "SL1-AC-5 lần hai thêm dòng");

    // Nhóm tụt dưới ngưỡng: phát biểu suy cũ bị rút.
    assert.equal((await song(c, x5))[0]?.evidence_tier, "inferred");
    await c.query("DELETE FROM public.stg_zalo_posts WHERE post_id = ANY ($1)", [g5.slice(0, 5)]);
    // Nhóm đổi đa số: còn đúng một phát biểu sống, cột theo giá trị mới.
    await c.query("UPDATE public.stg_zalo_posts SET text = replace(text, 'căn hộ', 'nhà riêng') WHERE conversation_id = $1", [`${TAG}_g6`]);
    await IM_LOG(() => runTransformZalo(c));
    assert.equal((await song(c, x5)).length, 0, "SL1-AC-5 nhóm tụt ngưỡng chưa rút");
    assert.equal((await phatBieu(c, x5))[0].retracted_at === null, false);
    assert.notEqual((await tinCua(c, x5)).property_type, "apartment", "SL1-AC-5 cột còn giá trị đã rút");
    assert.deepEqual((await song(c, x6)).map((d) => d.gia_tri), ["house"], "SL1-AC-5 đổi đa số");
    assert.equal((await tinCua(c, x6)).property_type, "house", "SL1-AC-5 cột không theo đa số mới");
    assert.deepEqual((await song(c, xBoKhac)).map((d) => d.method_version), ["bo-khac@1"], "SL1-AC-5 e1_rule của bộ khác bị rút");
  });
  await withTx(async (c) => {
    await moLuot(c);
    await loat(c, "g3", 15, "căn hộ");
    await loat(c, "g3", 10, "nhà riêng");
    const [x3] = await loat(c, "g3", 1, "căn");
    const dotBien = await transformDotBien("const NHOM_TI_LE = 0.85;", "const NHOM_TI_LE = 0.5;");
    await IM_LOG(() => dotBien(c));
    assert.equal((await song(c, x3)).length, 1, "SL1-AC-5: thước không đỏ trên bản ngưỡng 50%");
  });
});
