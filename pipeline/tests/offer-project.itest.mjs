// offer-project.itest.mjs — hồ sơ _acceptance/du-an-cua-tin-len-dinh-vi (DV7, T3): migration 105 (view offer_project,
// offer_located, data_level_units) và ô Định vị của 600_data_flow.sql. Chỉ chạy trên DB của riêng lượt chép DB máy thu
// (db/db-thu.sh oneinvest_suite_dv7 --chay); DB ấy xoá khi lệnh dừng. DB thử của suite không áp migration của nhánh nên ca
// đầu tự áp 105. Fixture chèn thẳng vào bảng thật (nút, tin, phát biểu, bí danh) trong BEGIN … ROLLBACK; mọi phép so lọc
// theo mã fixture `dv7fx-…`, nên dữ liệu thật chép sẵn trong DB không làm lệch kết cục. Lớp tin lấy từ bảng phủ ca
// (discovery/bang-phu-ca.md, đếm DB máy thu 15/11), khuôn cột theo ràng buộc của bảng thật.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";

import pg from "pg";

import { than600 } from "../lib/than-600.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("offer-project.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const GOC = join(import.meta.dirname, "..", "..");
export const MIG = readFileSync(join(GOC, "db/migrations/105_offer_project.sql"), "utf8");
const SQL600 = readFileSync(join(GOC, "pipeline/sql/600_data_flow.sql"), "utf8");
const COT = ["offer_id", "source", "project_node_id", "status", "evidence", "catalog_tier", "n_posts", "n_posts_with_project"];

let c;
let khuVuc; // một phường thật để tin đủ năm trường lõi
before(async () => {
  c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  khuVuc = (await c.query(`SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1`)).rows[0].id;
});
after(async () => { await c?.end(); });

const dauLuocDo = async () => (await c.query(`
  SELECT (SELECT string_agg(column_name || ':' || data_type, ',' ORDER BY ordinal_position) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'offer_project') AS cot,
         pg_get_viewdef('public.offer_project'::regclass) AS view,
         pg_get_functiondef('offer_located(text)'::regprocedure) AS f1,
         pg_get_functiondef('data_level_units()'::regprocedure) AS f2`)).rows[0];
const soBang = async () => Number((await c.query(
  `SELECT count(*) n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`)).rows[0].n);

// ---- dựng fixture (trong giao dịch của ca) ----
let dem = 0;
const ma = (s) => `dv7fx-${s}-${++dem}`;
async function nut(loai, cha = null, tier = "xac_minh") {
  const s = ma(loai);
  return Number((await c.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, catalog_tier) VALUES ($1, $2, $2, $3, $4)
    RETURNING id`, [loai, s, cha, tier])).rows[0].id);
}
async function tin(nguon, bai, { du = true, block = null, ngay = "now()" } = {}) {
  const id = ma(`tin-${nguon}`);
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source, post_ids,
      block_raw, first_seen, last_seen, offer_status)
    VALUES ($1, 'sale', 'apartment', 3e9, $2, $3, $4, $5, $6, ${ngay}, ${ngay}, 'active')`,
  [id, du ? 70 : null, khuVuc, nguon, bai, block]);
  return id;
}
async function phatBieu(nguon, baiId, nodeId, rule = "du-an-nhom-mot-du-an", method = "e1_rule") {
  return Number((await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, rule_id, observed_at)
    VALUES ($1, 'project_node_id', $2, 'inferred', $3, $4, now()) RETURNING id`,
  [`${nguon}:${baiId}`, String(nodeId), method, rule])).rows[0].id);
}
const rut = (id) => c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'dv7 thử' WHERE id = $1`, [id]);
const dong = async (ids) => {
  const m = new Map();
  for (const r of (await c.query(`SELECT * FROM offer_project WHERE offer_id = ANY ($1)`, [ids])).rows) {
    assert.ok(!m.has(r.offer_id), `mỗi tin một dòng — ${r.offer_id} có hai dòng`);
    m.set(r.offer_id, r);
  }
  return m;
};
const kq = (r) => r ? { status: r.status, project_node_id: r.project_node_id === null ? null : Number(r.project_node_id),
  evidence: r.evidence, n_posts: r.n_posts, n_posts_with_project: r.n_posts_with_project } : "khong-dong";

/** Dựng ma trận 11 ô của AC-2 (nút con không có đường qua phát biểu: trigger 082/096 buộc project_node_id trỏ nút loại project — ô nút con đo ở AC-3); trả [tên ô, offer_id, kết cục viết trước]. */
async function maTran() {
  const A = await nut("project"), B = await nut("project");
  const o = [];
  const b = () => ma("bai");
  let x, p1, p2, p3;
  x = await tin("S03", [p1 = b()]); o.push(["1 bài 0 dự án", x, "khong-dong"]);
  x = await tin("S03", [p1 = b()]); await phatBieu("S03", p1, A);
  o.push(["1 bài 1 dự án", x, { status: "mot_du_an", project_node_id: A, evidence: "bai", n_posts: 1, n_posts_with_project: 1 }]);
  x = await tin("S03", [b(), b()]); o.push(["nhiều bài 0 dự án", x, "khong-dong"]);
  x = await tin("S03", [p1 = b(), b(), b()]); await phatBieu("S03", p1, A);
  o.push(["3 bài, 1 có dự án", x, { status: "mot_du_an", project_node_id: A, evidence: "bai", n_posts: 3, n_posts_with_project: 1 }]);
  x = await tin("S03", [p1 = b(), p2 = b(), p3 = b()]); for (const p of [p1, p2, p3]) await phatBieu("S03", p, A);
  o.push(["3 bài cùng dự án", x, { status: "mot_du_an", project_node_id: A, evidence: "bai", n_posts: 3, n_posts_with_project: 3 }]);
  x = await tin("S03", [p1 = b(), p2 = b()]); await phatBieu("S03", p1, A); await phatBieu("S03", p2, B);
  o.push(["2 bài hai dự án", x, { status: "xung_dot", project_node_id: null, evidence: "bai", n_posts: 2, n_posts_with_project: 2 }]);
  x = await tin("S03", [p1 = b()]); await phatBieu("S03", p1, A); await phatBieu("S03", p1, B, "du-an-ten-bai", "e2_llm");
  o.push(["1 bài hai dự án", x, { status: "xung_dot", project_node_id: null, evidence: "bai", n_posts: 1, n_posts_with_project: 1 }]);
  x = await tin("S03", [p1 = b()]); await phatBieu("S03", p1, A); await phatBieu("S03", p1, A, "du-an-ten-bai", "e2_llm");
  o.push(["1 bài hai luật cùng nút", x, { status: "mot_du_an", project_node_id: A, evidence: "bai", n_posts: 1, n_posts_with_project: 1 }]);
  x = await tin("S03", [p1 = b()]); await rut(await phatBieu("S03", p1, A)); o.push(["đã rút", x, "khong-dong"]);
  x = await tin("S03", []); o.push(["0 bài", x, "khong-dong"]);
  x = await tin("S05", [p1 = b()]); await phatBieu("S05", p1, B);
  o.push(["tin S05", x, { status: "mot_du_an", project_node_id: B, evidence: "bai", n_posts: 1, n_posts_with_project: 1 }]);
  return { o, A, B };
}

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try { return await fn(); } finally { await c.query("ROLLBACK"); }
}

test("DV7-AC-1 migration 105: chạy hai lần, lược đồ không đổi, tám cột, chữ ký hàm giữ, không bảng mới", { timeout: 600_000 }, async () => {
  const truocF = (await c.query(`SELECT pg_get_function_arguments('offer_located(text)'::regprocedure) a,
    pg_get_function_result('offer_located(text)'::regprocedure) r`)).rows[0];
  const bang0 = await soBang();
  await c.query(MIG);
  const lan1 = await dauLuocDo();
  await c.query(MIG);
  assert.deepEqual(await dauLuocDo(), lan1, "DV7-AC-1: lần áp thứ hai đổi lược đồ");
  assert.deepEqual(lan1.cot.split(",").map((x) => x.split(":")[0]), COT, "DV7-AC-1 ten-cot: cột của offer_project lệch");
  const sauF = (await c.query(`SELECT pg_get_function_arguments('offer_located(text)'::regprocedure) a,
    pg_get_function_result('offer_located(text)'::regprocedure) r`)).rows[0];
  assert.deepEqual(sauF, truocF, "DV7-AC-1: chữ ký offer_located đổi");
  assert.deepEqual(truocF, { a: "p_offer_id text", r: "boolean" });
  assert.equal(await soBang(), bang0, "DV7-AC-1: 105 thêm bảng");

  // Đối chứng đỏ: bản sao 105 đổi tên một cột → phép so tên cột đỏ.
  const pha = MIG.replace(/x\.n_posts_with_project::int(\s+)AS n_posts_with_project/, "x.n_posts_with_project::int$1AS n_bai_co_du_an");
  assert.notEqual(pha, MIG, "không phá được bản sao 105");
  await trongGiaoDich(async () => {
    await c.query("DROP VIEW offer_project CASCADE");
    await c.query(pha.replace(/CREATE OR REPLACE FUNCTION[\s\S]*$/, ""));
    const cot = (await dauLuocDo()).cot.split(",").map((x) => x.split(":")[0]);
    assert.notDeepEqual(cot, COT, "ten-cot: bản phá vẫn ra đúng tám cột — ca không phân biệt được");
  });
});

test("DV7-AC-2 ma trận 11 lớp tin theo bài", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    const { o } = await maTran();
    assert.equal(o.length, 11, "DV7-AC-2: ma trận phải đúng 11 ô");
    const m = await dong(o.map((x) => x[1]));
    for (const [ten, id, mong] of o) assert.deepEqual(kq(m.get(id)), mong, `DV7-AC-2 ô «${ten}»`);

    // Đối chứng đỏ trên chính fixture: ba bản phá của view, mỗi bản làm đúng một ô lệch.
    const thu = async (thay, o_ten, nhan) => {
      await c.query("SAVEPOINT p");
      try {
        const vs = MIG.match(/CREATE OR REPLACE VIEW offer_project AS[\s\S]*?;\n/)[0];
        const pha = thay(vs);
        assert.notEqual(pha, vs, `${nhan}: không phá được view`);
        await c.query("DROP VIEW offer_project CASCADE");
        await c.query(pha);
        const id = o.find((x) => x[0] === o_ten)[1];
        const mong = o.find((x) => x[0] === o_ten)[2];
        assert.notDeepEqual(kq((await dong([id])).get(id)), mong, `${nhan}: bản phá vẫn ra kết cục đúng ở ô «${o_ten}»`);
      } finally { await c.query("ROLLBACK TO SAVEPOINT p"); }
    };
    await thu((v) => v.replace(" AND f.retracted_at IS NULL", ""), "đã rút", "da-rut");
    await thu((v) => v.replace("CASE WHEN x.n_roots = 1 THEN x.root_id END                       AS project_node_id",
      "x.root_id AS project_node_id").replace("CASE WHEN x.n_roots = 1 THEN 'mot_du_an' ELSE 'xung_dot' END", "'mot_du_an'::text"),
    "2 bài hai dự án", "xung-dot");
  });
});

/** Bảy tin S06 của AC-3 (bí danh mã nguồn: nút có sẵn, ứng viên, phân khu con, đã thôi, không bí danh, phân khu cháu, toà).
 *  AC-3 và AC-4 dùng chung, để AC-4 so offer_located và B2 trên cả nhánh mã nguồn. */
async function fixtureS06() {
  const A = await nut("project"), U = await nut("project", null, "mot_loi_khai"), pk = await nut("subzone", A);
  const chau = await nut("subzone", pk), toa = await nut("building", A);
  const s06 = async (nodeId, { retired = false } = {}) => {
    const list = 9_000_000_000 + (++dem);
    const id = ma("tin-S06");
    const pid = `dv7fx${dem}`;
    await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id)
      VALUES ($1, 12000, '01', 1010, 's', $2, (SELECT snapshot_id FROM stg_chotot_ads LIMIT 1))`, [list, { projectid: pid }]);
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
        originating_system_key, first_seen, last_seen, offer_status)
      VALUES ($1, 'sale', 'apartment', 3e9, 70, $2, 'S06', $3, now(), now(), 'active')`, [id, khuVuc, String(list)]);
    if (nodeId !== null) {
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source, first_seen, retired_at)
        VALUES ($1, 'ma_nguon', $2, 'S06', now(), $3)`, [`node:${nodeId}`, `du_an/${pid}`, retired ? new Date() : null]);
    }
    return id;
  };
  const tCoSan = await s06(A), tUng = await s06(U), tCon = await s06(pk), tThoi = await s06(A, { retired: true }), tRong = await s06(null);
  const tChau = await s06(chau), tToa = await s06(toa);
  return { A, U, tCoSan, tUng, tCon, tThoi, tRong, tChau, tToa };
}

test("DV7-AC-3 tin S06 qua bí danh mã nguồn", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    const { A, U, tCoSan, tUng, tCon, tThoi, tRong, tChau, tToa } = await fixtureS06();
    const m = await dong([tCoSan, tUng, tCon, tThoi, tRong, tChau, tToa]);
    const s = (id) => { const r = m.get(id); return r ? { ...kq(r), catalog_tier: r.catalog_tier } : "khong-dong"; };
    assert.deepEqual(s(tCoSan), { status: "mot_du_an", project_node_id: A, evidence: "ma_nguon", n_posts: 0, n_posts_with_project: 0, catalog_tier: "xac_minh" });
    assert.deepEqual(s(tUng), { status: "mot_du_an", project_node_id: U, evidence: "ma_nguon", n_posts: 0, n_posts_with_project: 0, catalog_tier: "mot_loi_khai" });
    assert.deepEqual(s(tCon), { status: "mot_du_an", project_node_id: A, evidence: "ma_nguon", n_posts: 0, n_posts_with_project: 0, catalog_tier: "xac_minh" });
    assert.deepEqual(s(tChau), { status: "mot_du_an", project_node_id: A, evidence: "ma_nguon", n_posts: 0, n_posts_with_project: 0, catalog_tier: "xac_minh" }, "DV7-AC-3: phân khu cháu");
    assert.deepEqual(s(tToa), { status: "mot_du_an", project_node_id: A, evidence: "ma_nguon", n_posts: 0, n_posts_with_project: 0, catalog_tier: "xac_minh" }, "DV7-AC-3: toà con");
    assert.equal(s(tThoi), "khong-dong", "DV7-AC-3: bí danh đã thôi vẫn định vị");
    assert.equal(s(tRong), "khong-dong", "DV7-AC-3: tin S06 không bí danh vẫn có dòng");

    // Đối chứng đỏ: bản sao view quy nút một bước (dừng sau một tầng cha) → phân khu cháu không tới dự án gốc.
    await c.query("SAVEPOINT p");
    try {
      const vs = MIG.match(/CREATE OR REPLACE VIEW offer_project AS[\s\S]*?;\n/)[0];
      const pha = vs.replace("WHERE g.node_type <> 'project' AND g.sau < 16", "WHERE g.node_type <> 'project' AND g.sau < 1");
      assert.notEqual(pha, vs, "nut-chau: không phá được view");
      await c.query("DROP VIEW offer_project CASCADE");
      await c.query(pha);
      assert.notDeepEqual(kq((await dong([tChau])).get(tChau))?.project_node_id, A,
        "nut-chau: bản quy một bước vẫn ra dự án gốc — ca không phân biệt được");
    } finally { await c.query("ROLLBACK TO SAVEPOINT p"); }
  });
});

test("DV7-AC-4 offer_located và data_level_units đọc cùng nguồn, theo tập", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    const { o, A, B } = await maTran();
    const b = () => ma("bai");
    let p;
    const thieu = await tin("S03", [p = b()], { du: false }); await phatBieu("S03", p, A);
    const khongDuAn = await tin("S03", [b()]);
    const xd = o.find((x) => x[0] === "2 bài hai dự án")[1];
    const mot = o.find((x) => x[0] === "1 bài 1 dự án")[1];
    // Cả bảy tin S06 của AC-3 (nhánh mã nguồn) vào cùng phép so — ma trận viết trước: 11 ô AC-2 + 2 tin lõi + 7 tin S06.
    const t06 = await fixtureS06();
    const s06Ids = [t06.tCoSan, t06.tUng, t06.tCon, t06.tThoi, t06.tRong, t06.tChau, t06.tToa];
    const ids = [...o.map((x) => x[1]), thieu, khongDuAn, ...s06Ids];
    assert.equal(ids.length, 20, "DV7-AC-4: ma trận phải đủ 20 tin (11 AC-2, 2 lõi, 7 S06)");
    const m = await dong(ids);
    assert.equal(s06Ids.filter((id) => m.get(id)?.status === "mot_du_an").length, 5, "DV7-AC-4: năm tin S06 phải mot_du_an");
    for (const id of ids) {
      const loc = (await c.query(`SELECT offer_located($1) v`, [id])).rows[0].v;
      assert.equal(loc, m.get(id)?.status === "mot_du_an", `DV7-AC-4: offer_located(${id}) lệch view`);
    }
    const bac = new Map((await c.query(`SELECT unit_key, data_level FROM data_level_units() WHERE unit_key = ANY ($1)`,
      [ids.map((i) => `tin:${i}`)])).rows.map((r) => [r.unit_key.slice(4), r.data_level]));
    assert.equal(bac.get(mot), "B2", "DV7-AC-4: tin mot_du_an đủ lõi phải B2");
    assert.equal(bac.get(thieu), "B0", "DV7-AC-4: tin mot_du_an thiếu m² phải B0");
    assert.equal(bac.get(khongDuAn), "B1", "DV7-AC-4: tin không dự án đủ lõi phải B1");
    assert.equal(bac.get(xd), "B1", "DV7-AC-4: tin xung_dot đủ lõi phải B1");
    assert.equal(bac.get(t06.tCoSan), "B2", "DV7-AC-4: tin S06 có bí danh, đủ lõi phải B2");
    assert.equal(bac.get(t06.tRong), "B1", "DV7-AC-4: tin S06 không bí danh, đủ lõi phải B1");
    for (const id of ids) {
      const du = (await c.query(`SELECT offer_core_complete(kind, property_type, price_vnd, area_m2, area_id) v FROM sale_offers
        WHERE offer_id = $1`, [id])).rows[0].v;
      assert.equal(bac.get(id) === "B2", m.get(id)?.status === "mot_du_an" && du, `DV7-AC-4: B2 của ${id} lệch (định vị ∧ đủ lõi)`);
    }
    const than = (await c.query(`SELECT pg_get_functiondef('data_level_units()'::regprocedure) d`)).rows[0].d;
    assert.ok(!/offer_located\(/.test(than), "DV7-AC-4: data_level_units còn gọi offer_located từng tin");

    // Đối chứng đỏ: thân offer_located trả mọi tin có dòng → tin xung_dot ra true.
    await c.query("SAVEPOINT p");
    try {
      await c.query(`CREATE OR REPLACE FUNCTION offer_located(p_offer_id text) RETURNS boolean LANGUAGE sql STABLE AS
        $$ SELECT EXISTS (SELECT 1 FROM offer_project WHERE offer_id = p_offer_id AND status IS NOT NULL) $$`);
      assert.equal((await c.query(`SELECT offer_located($1) v`, [xd])).rows[0].v, true,
        "xung-dot-b2: bản phá vẫn trả false cho tin xung_dot — ca không phân biệt được");
    } finally { await c.query("ROLLBACK TO SAVEPOINT p"); }
    void B;
  });
});

/** Chạy thân 600 trong giao dịch hiện tại, đọc khối theo (cửa sổ, nguồn). */
async function chay600(sql) {
  await c.query("CREATE TEMP TABLE IF NOT EXISTS flow_s03_branch (post_id text PRIMARY KEY, branch text NOT NULL)");
  await c.query(than600(sql).replace(/^CREATE TEMP TABLE IF NOT EXISTS flow_s03_branch.*$/m, ""));
  const r = await c.query(`SELECT time_window, s FROM data_flow_snapshot, jsonb_array_elements(facts -> 'sources') s`);
  return new Map(r.rows.map((x) => [`${x.time_window}|${x.s.source}`, x.s]));
}

test("DV7-AC-5 ô Định vị của 600 đọc view; chờ khớp giữ nghĩa cấp toà", { timeout: 600_000 }, async () => {
  await trongGiaoDich(async () => {
    await c.query(`SET LOCAL oneinvest.flow_now = '${new Date().toISOString()}'`);
    const { o, A } = await maTran();
    const b = () => ma("bai");
    let p;
    // Tin vừa định vị cấp dự án vừa ghi toà (ô phân biệt chờ khớp), và tin định vị ngoài cửa sổ 7d.
    const vuaToa = await tin("S03", [p = b()], { block: "A1" }); await phatBieu("S03", p, A);
    const cu = await tin("S03", [p = b()], { ngay: "now() - interval '20 days'" }); await phatBieu("S03", p, A);
    void o; void vuaToa; void cu;
    const f = await chay600(SQL600);
    const doc = async (cua, nguon, dk) => Number((await c.query(`SELECT count(*) n FROM sale_offers o WHERE o.source = $1 AND ${dk}
      AND ($2::int IS NULL OR (o.first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - ($2::int - 1))`,
    [nguon, cua === "all" ? null : cua === "7d" ? 7 : 30])).rows[0].n);
    for (const cua of ["7d", "30d", "all"]) {
      for (const nguon of ["S03", "S05", "S06"]) {
        const s = f.get(`${cua}|${nguon}`);
        const loc = await doc(cua, nguon, `EXISTS (SELECT 1 FROM offer_project op WHERE op.offer_id = o.offer_id AND op.status = 'mot_du_an')`);
        const cho = await doc(cua, nguon, `coalesce(nullif(btrim(o.block_raw), '') IS NOT NULL OR o.unit_number ~* 'xx', false)`);
        assert.equal(s.located, loc, `DV7-AC-5 ${cua}/${nguon}: located lệch`);
        assert.equal(s.locatedPending, cho, `DV7-AC-5 ${cua}/${nguon} cho-khop-cap-toa: locatedPending lệch`);
        assert.equal(s.unitLinked, 0, `DV7-AC-5 ${cua}/${nguon}: unitLinked`);
        assert.equal(s.deepest.located, s.located, `DV7-AC-5 ${cua}/${nguon}: deepest.located`);
      }
    }
    assert.ok(f.get("all|S03").located > f.get("7d|S03").located, "DV7-AC-5: fixture phải có tin định vị ngoài 7d");

    // Đối chứng đỏ: bản sao 600 tính chờ khớp trừ tin đã định vị → ô S03 lệch (có tin vừa định vị vừa ghi toà).
    await c.query("SAVEPOINT p");
    try {
      const pha = SQL600.replace("count(*) FILTER (WHERE m.ghi_toa AND NOT m.toa_khop) AS located_pending",
        "count(*) FILTER (WHERE m.ghi_toa AND NOT m.located) AS located_pending");
      assert.notEqual(pha, SQL600, "cho-khop-cap-toa: không phá được bản sao 600");
      const g = await chay600(pha);
      assert.notEqual(g.get("all|S03").locatedPending, f.get("all|S03").locatedPending,
        "cho-khop-cap-toa: bản phá vẫn ra cùng số chờ khớp — ca không phân biệt được");
    } finally { await c.query("ROLLBACK TO SAVEPOINT p"); }
  });
});

test("DV7-AC-5b bộ chạy làm tươi: chưa có offer_project thì ô Định vị rỗng thay vì lỗi; có view thì giữ nguyên", { timeout: 300_000 }, async () => {
  const { dinhViKhiCoView, DONG_DINH_VI } = await import("../refresh-data-flow.mjs");
  assert.ok(DONG_DINH_VI.test(SQL600), "DV7-AC-5b: 600 không còn đúng dòng nối Định vị mà bộ chạy dò");
  await trongGiaoDich(async () => {
    await c.query(MIG);
    assert.equal(await dinhViKhiCoView(c, SQL600), SQL600, "DV7-AC-5b: có view mà bộ chạy vẫn thay dòng");
    await c.query("DROP VIEW offer_project");
    const doi = await dinhViKhiCoView(c, SQL600);
    assert.ok(!DONG_DINH_VI.test(doi) && /dinh_vi_link AS \(SELECT NULL::text AS offer_id WHERE false\)/.test(doi),
      "DV7-AC-5b: thiếu view mà dòng nối chưa thành CTE rỗng");
    await c.query(`SET LOCAL oneinvest.flow_now = '${new Date().toISOString()}'`);
    await chay600(doi); // chạy được, không lỗi relation
  });
});
