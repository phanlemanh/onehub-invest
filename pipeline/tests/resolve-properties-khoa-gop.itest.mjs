// resolve-properties-khoa-gop.itest.mjs — hồ sơ _acceptance/khoa-gop-can-khong-gia (DA6, T3): migration 098 dọn link thừa + UNIQUE,
// resolver giữ căn cho tin đã gắn. Chỉ chạy trên DB của riêng lượt chép dữ liệu máy thu (db/db-thu.sh oneinvest_suite_kgc --chay);
// DB ấy xoá khi lệnh dừng. Chiều đỏ chạy resolver bản gốc của nhánh chính (git show origin/main) trong SAVEPOINT rồi hoàn lại.
// Thứ tự ca (node:test tuần tự): AC-8 (trước 098) → AC-1 → AC-2 → AC-3 → AC-4 → AC-5 → AC-6 → AC-7 → AC-9.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test, after } from "node:test";

import pg from "pg";

import { chayResolve } from "../resolve-properties.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("resolve-properties-khoa-gop.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
}
const PIPE = join(import.meta.dirname, "..");
const GOC = join(PIPE, "..");
const MIG = readFileSync(join(GOC, "db/migrations/098_khoa_gop_can.sql"), "utf8");
const im = () => {}; // nuốt log resolver

// Resolver bản gốc của nhánh chính, nạp vào tệp tạm ngoài cây (cây không đổi trong lượt chấm); import trỏ tuyệt đối.
const TAM = mkdtempSync(join(tmpdir(), "kgc-goc-"));
after(() => rmSync(TAM, { recursive: true, force: true }));
async function resolverGoc() {
  const r = spawnSync("git", ["-C", GOC, "show", "origin/main:pipeline/resolve-properties.mjs"], { encoding: "utf8" });
  assert.equal(r.status, 0, `KGC: không đọc được resolver bản gốc: ${r.stderr}`);
  const src = r.stdout
    .replace(/from "\.\/lib\/([a-z0-9-]+\.mjs)"/g, (_, f) => `from "${pathToFileURL(join(PIPE, "lib", f)).href}"`)
    .replace(/from "pg"/, `from "${import.meta.resolve("pg")}"`);
  assert.ok(!/NOT EXISTS \(SELECT 1 FROM property_offers po/.test(src), "KGC: nhánh chính đã có luật DA6 — chiều đỏ mất nghĩa");
  const tep = join(TAM, `goc-${Date.now()}.mjs`);
  writeFileSync(tep, src);
  return (await import(pathToFileURL(tep).href)).chayResolve;
}

const ketNoi = async () => { const c = new pg.Client({ connectionString: DB_URL }); await c.connect(); return c; };
const so = async (c, sql, p = []) => Number(Object.values((await c.query(sql, p)).rows[0])[0]);
const DUP = "SELECT count(*) FROM (SELECT offer_id FROM property_offers GROUP BY offer_id HAVING count(*) > 1) x";
const KHOA_LINK = `property_id::text || '|' || offer_id || '|' || coalesce(score::text, '') || '|' || signals::text || '|' || extract(epoch FROM linked_at)::text`;
const tapLink = async (c, bang = "property_offers") => new Set((await c.query(`SELECT ${KHOA_LINK} k FROM ${bang}`)).rows.map((r) => r.k));
const bamCan = async (c, maxId = null) => (await c.query(
  `SELECT md5(coalesce(string_agg(id::text || ':' || coalesce(stable_key, ''), ',' ORDER BY id), '')) h FROM properties
    WHERE $1::bigint IS NULL OR id <= $1`, [maxId])).rows[0].h;
const SAU_DOAN = `SELECT count(*) FROM properties WHERE resolved_by = 'stage-ab' AND stable_key !~ '^([^|]*\\|){5}[^|]*$'`;
const bamLuocDo = async (c) => (await c.query(
  `SELECT md5(coalesce(string_agg(x, E'\\n' ORDER BY x), '')) h FROM (
     SELECT table_name || '.' || column_name || ':' || data_type || ':' || is_nullable x FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('property_offers', 'property_offer_unlinks')
     UNION ALL SELECT conrelid::regclass || '.' || conname || ':' || pg_get_constraintdef(oid) FROM pg_constraint
      WHERE conrelid IN ('property_offers'::regclass, 'property_offer_unlinks'::regclass)) s`)).rows[0].h;
/** Một tin S06 đã gắn đúng một căn mà đổi giá ×1,3 làm đổi bậc giá; bỏ qua tin trong `tru`. */
async function tinDoiGia(c, tru = []) {
  const { rows } = await c.query(
    `SELECT po.offer_id, po.property_id, o.price_vnd FROM property_offers po JOIN sale_offers o USING (offer_id)
       JOIN stg_chotot_ads s
         ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
      WHERE o.source = 'S06' AND o.price_vnd > 0 AND o.area_m2 IS NOT NULL AND s.latitude IS NOT NULL AND NOT (po.offer_id = ANY ($1))
        AND round(o.price_vnd / 1e6) <> round(round(o.price_vnd * 1.3) / 1e6)
        -- cụm mới sau đổi giá không khớp căn nào → bản gốc chắc chắn sinh căn mới (chiều đỏ có nghĩa)
        AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.stable_key =
              floor(s.latitude / 0.0005)::text || '|' || floor(s.longitude / 0.0005)::text || '|' || o.kind || '|'
              || COALESCE(o.property_type, '?') || '|' || round(o.area_m2)::text || '|' || round(round(o.price_vnd * 1.3) / 1e6)::text)
        AND (SELECT count(*) FROM property_offers x WHERE x.offer_id = po.offer_id) = 1
      ORDER BY po.offer_id LIMIT 1`, [tru]);
  assert.equal(rows.length, 1, "KGC: không tìm được tin S06 đã gắn để đổi giá");
  return rows[0];
}
const doiGia = (c, id) => c.query("UPDATE sale_offer_records SET price_vnd = round(price_vnd * 1.3) WHERE offer_id = $1", [id]);
const soLink = (c, id) => so(c, "SELECT count(*) FROM property_offers WHERE offer_id = $1", [id]);
const maxCan = (c) => so(c, "SELECT coalesce(max(id), 0) FROM properties");
const boRangBuoc = (c) => c.query("ALTER TABLE property_offers DROP CONSTRAINT IF EXISTS property_offers_offer_id_key");

// ── Tập cắt (GS 13/11, lối B; sổ approach của hồ sơ): một lượt resolver trên dữ liệu đầy đủ mất hơn 2 giờ (95 ms/cụm × ~77k cụm),
// nên AC-8 (trong giao dịch, hoàn lại) và AC-4…AC-7 chạy trên tập cắt THEO LUẬT, lặp lại được:
//   giữ mọi tin S06 có khoá cụm thuộc K = { khoá cụm hiện tại của mọi tin từng gắn hơn một căn }
//                                      ∪ { stable_key mọi căn mà các tin ấy từng gắn }
//                                      ∪ { khoá cụm có md5('kgc-1|' || khoá) mod 100 < 3 }  (mẫu đại diện, hạt giống cố định)
//   tin khác: đánh dấu retired (biến khỏi sale_offers, không xoá, không chạm property_offers); xoá dòng stg_chotot_ads không giữ.
// «Tin từng gắn hơn một căn»: trước 098 = GROUP BY offer_id HAVING count(*) > 1; sau 098 = offer_id có trong nhật ký — cùng một tập.
const CK = `floor(s.latitude / 0.0005)::text || '|' || floor(s.longitude / 0.0005)::text || '|' || o.kind || '|'
  || COALESCE(o.property_type, '?') || '|' || round(o.area_m2)::text || '|' || round(o.price_vnd / 1e6)::text`;
async function catDuLieu(c, nhan) {
  const coNhatKy = (await c.query("SELECT to_regclass('property_offer_unlinks') r")).rows[0].r !== null
    && await so(c, "SELECT count(*) FROM property_offer_unlinks") > 0;
  const D = coNhatKy ? "SELECT DISTINCT offer_id FROM property_offer_unlinks"
    : "SELECT offer_id FROM property_offers GROUP BY offer_id HAVING count(*) > 1";
  const P = coNhatKy ? "SELECT property_id, offer_id FROM property_offers UNION SELECT property_id, offer_id FROM property_offer_unlinks"
    : "SELECT property_id, offer_id FROM property_offers";
  const t0 = Date.now();
  const tong = (await c.query(`SELECT count(*)::int tin, count(DISTINCT ck)::int cum FROM (SELECT ${CK} ck FROM sale_offers o JOIN stg_chotot_ads s
    ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
    WHERE o.source = 'S06' AND s.latitude IS NOT NULL AND o.area_m2 IS NOT NULL AND o.price_vnd > 0) x`)).rows[0];
  await c.query(`CREATE TEMP TABLE kgc_tin AS
    SELECT o.offer_id, s.list_id, ${CK} ck FROM sale_offers o JOIN stg_chotot_ads s
      ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
     WHERE o.source = 'S06' AND s.latitude IS NOT NULL AND o.area_m2 IS NOT NULL AND o.price_vnd > 0`);
  await c.query(`CREATE TEMP TABLE kgc_giu AS
    SELECT t.ck FROM kgc_tin t WHERE t.offer_id IN (${D})
    UNION SELECT p.stable_key FROM (${P}) l JOIN properties p ON p.id = l.property_id WHERE l.offer_id IN (${D}) AND p.stable_key IS NOT NULL
    UNION SELECT DISTINCT ck FROM kgc_tin WHERE ('x' || substr(md5('kgc-1|' || ck), 1, 7))::bit(28)::int % 100 < 3`);
  const giu = (await c.query(`SELECT count(*)::int tin, count(DISTINCT ck)::int cum FROM kgc_tin WHERE ck IN (SELECT ck FROM kgc_giu)`)).rows[0];
  // Tin ngoài tập: retired + đổi source sang 'kgc-cat' để câu chèn của resolver (lọc source = 'S06') không quét chúng
  // (không xoá được: mọi khoá ngoại trỏ vào bảng này là RESTRICT).
  await c.query(`UPDATE sale_offer_records r SET retired_at = now(), retired_reason = 'het_trong_luot', source = 'kgc-cat'
    WHERE r.source = 'S06' AND r.retired_at IS NULL AND r.offer_id NOT IN (SELECT offer_id FROM kgc_tin WHERE ck IN (SELECT ck FROM kgc_giu))`);
  await c.query(`DELETE FROM stg_chotot_ads WHERE list_id NOT IN (SELECT list_id FROM kgc_tin WHERE ck IN (SELECT ck FROM kgc_giu))`);
  await c.query("DROP TABLE kgc_tin; DROP TABLE kgc_giu; ANALYZE sale_offer_records; ANALYZE stg_chotot_ads");
  console.log(`KGC tập cắt (${nhan}): giữ ${giu.cum}/${tong.cum} cụm (${(100 * giu.cum / tong.cum).toFixed(1)}%), ${giu.tin}/${tong.tin} tin; cắt ${Date.now() - t0} ms`);
  return { giu, tong };
}
async function doGio(nhan, f) { const t0 = Date.now(); const r = await f(); console.log(`KGC resolver (${nhan}): ${Math.round((Date.now() - t0) / 1000)} s`); return r; }

const ca = {}; // ảnh chụp trước dọn, dùng chung AC-1 → AC-3

test("KGC-AC-8 trước 098: đổi giá một tin đã gắn không thêm link", { timeout: 2_400_000 }, async () => {
  const c = await ketNoi();
  try {
    assert.equal(await so(c, "SELECT count(*) FROM pg_constraint WHERE conname = 'property_offers_offer_id_key'"), 0,
      "KGC-AC-8: DB của lượt đã có UNIQUE trước 098");
    const d0 = await so(c, DUP);
    await c.query("BEGIN");
    await catDuLieu(c, "AC-8, trong giao dịch, hoàn lại");
    const t = await tinDoiGia(c);
    await doiGia(c, t.offer_id);
    await c.query("SAVEPOINT xanh");
    await doGio("AC-8 xanh", () => chayResolve(c, { ghi: im }));
    assert.ok(await so(c, DUP) <= d0, "KGC-AC-8: số tin gắn hơn một căn tăng");
    assert.equal(await soLink(c, t.offer_id), 1, "KGC-AC-8: tin đổi giá có link mới");
    await c.query("ROLLBACK TO SAVEPOINT xanh");
    // Chiều đỏ: resolver bản gốc cùng thao tác → link của tin tăng.
    await (await resolverGoc())(c, { ghi: im });
    assert.ok(await soLink(c, t.offer_id) > 1, "KGC-AC-8: resolver bản gốc không gắn link thứ hai — chiều đỏ không đỏ");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

test("KGC-AC-1 098 dọn link thừa, giữ căn tạo sớm nhất, không mất căn", { timeout: 1_200_000 }, async () => {
  const c = await ketNoi();
  try {
    assert.equal(await so(c, SAU_DOAN), 0, "KGC-AC-1: có căn stage-ab mà stable_key không sáu đoạn");
    ca.D = await so(c, DUP);
    assert.ok(ca.D > 0, "KGC-AC-1: dữ liệu chép không có tin gắn hơn một căn — phép đo mất nghĩa");
    // Câu độc lập: hạng theo created_at, id.
    const xep = `SELECT po.offer_id, po.property_id, row_number() OVER (PARTITION BY po.offer_id ORDER BY p.created_at, p.id) hang
                   FROM property_offers po JOIN properties p ON p.id = po.property_id`;
    ca.giu = new Map((await c.query(`SELECT offer_id, property_id FROM (${xep}) x WHERE hang = 1 AND offer_id IN (
                       SELECT offer_id FROM property_offers GROUP BY offer_id HAVING count(*) > 1)`)).rows.map((r) => [r.offer_id, String(r.property_id)]));
    ca.goKhoa = new Set((await c.query(`SELECT ${KHOA_LINK.replaceAll("property_id", "po.property_id").replaceAll("offer_id", "po.offer_id")
      .replaceAll("score", "po.score").replaceAll("signals", "po.signals").replaceAll("linked_at", "po.linked_at")} k
      FROM property_offers po JOIN (${xep}) x ON x.offer_id = po.offer_id AND x.property_id = po.property_id WHERE x.hang > 1`)).rows.map((r) => r.k));
    ca.L = ca.goKhoa.size;
    ca.N = await so(c, "SELECT count(*) FROM properties");
    ca.bam = await bamCan(c);
    ca.truoc = await tapLink(c);

    const kiemGiu = async () => {
      const sai = [];
      const { rows } = await c.query("SELECT offer_id, property_id FROM property_offers WHERE offer_id = ANY ($1)", [[...ca.giu.keys()]]);
      const co = new Map();
      for (const r of rows) co.set(r.offer_id, [...(co.get(r.offer_id) ?? []), String(r.property_id)]);
      for (const [o, p] of ca.giu) if ((co.get(o) ?? []).join() !== p) sai.push(o);
      return sai;
    };
    // Chiều đỏ trước (bảng chép vào schema tạm): bản sao 098 sắp created_at DESC → giữ sai căn.
    await c.query("BEGIN");
    await c.query(`CREATE SCHEMA kgc_do; SET LOCAL search_path = kgc_do, public;
      CREATE TABLE kgc_do.properties AS SELECT id, created_at FROM public.properties;
      CREATE TABLE kgc_do.property_offers AS SELECT * FROM public.property_offers;`);
    await c.query(MIG.replace("ORDER BY p.created_at, p.id", "ORDER BY p.created_at DESC, p.id DESC"));
    const saiDo = await kiemGiu();
    assert.ok(saiDo.length > 0, "KGC-AC-1: bản sao DESC không làm phép kiểm đỏ");
    await c.query("ROLLBACK");

    await c.query(MIG);
    assert.equal(await so(c, DUP), 0, "KGC-AC-1: còn tin gắn hơn một căn sau 098");
    assert.deepEqual(await kiemGiu(), [], "KGC-AC-1: offer_id giữ sai căn");
    const nk = await tapLink(c, "property_offer_unlinks");
    assert.equal(await so(c, "SELECT count(*) FROM property_offer_unlinks"), ca.L, "KGC-AC-1: nhật ký khác L dòng");
    assert.deepEqual([...nk].filter((k) => !ca.goKhoa.has(k)).length + [...ca.goKhoa].filter((k) => !nk.has(k)).length, 0,
      "KGC-AC-1: nhật ký khác tập link hạng > 1");
    assert.equal(await so(c, "SELECT count(*) FROM properties"), ca.N, "KGC-AC-1: số căn đổi");
    assert.equal(await bamCan(c), ca.bam, "KGC-AC-1: stable_key căn đổi");
  } finally { await c.end(); }
});

test("KGC-AC-2 098 chạy lại an toàn, UNIQUE chặn link thứ hai", async () => {
  const c = await ketNoi();
  try {
    const truoc = [await so(c, "SELECT count(*) FROM property_offers"), await so(c, "SELECT count(*) FROM property_offer_unlinks"), await bamLuocDo(c)];
    await c.query(MIG);
    assert.deepEqual([await so(c, "SELECT count(*) FROM property_offers"), await so(c, "SELECT count(*) FROM property_offer_unlinks"), await bamLuocDo(c)],
      truoc, "KGC-AC-2: áp 098 lần hai đổi dữ liệu hay lược đồ");
    const co = (await c.query("SELECT offer_id, property_id FROM property_offers ORDER BY offer_id LIMIT 1")).rows[0];
    const can = (await c.query("SELECT id FROM properties WHERE id <> $1 ORDER BY id LIMIT 1", [co.property_id])).rows[0].id;
    await c.query("BEGIN");
    await assert.rejects(c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [can, co.offer_id]),
      (e) => e.code === "23505" && e.constraint === "property_offers_offer_id_key", "KGC-AC-2: link thứ hai không bị UNIQUE chặn");
    await c.query("ROLLBACK");
    // Đối chứng dương: tin chưa có căn chèn được.
    const chua = (await c.query(
      "SELECT offer_id FROM sale_offer_records r WHERE NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = r.offer_id) LIMIT 1")).rows[0];
    await c.query("BEGIN");
    assert.equal((await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [can, chua.offer_id])).rowCount, 1);
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

test("KGC-AC-3 khôi phục được từ nhật ký", async () => {
  const c = await ketNoi();
  try {
    const hieu = (a, b) => [...a].filter((k) => !b.has(k)).length + [...b].filter((k) => !a.has(k)).length;
    await c.query("BEGIN");
    await boRangBuoc(c);
    await c.query("SAVEPOINT sp_do");
    // Chiều đỏ: bỏ một dòng nhật ký trước khi chèn lại → hiệu khác rỗng.
    await c.query("DELETE FROM property_offer_unlinks WHERE ctid = (SELECT ctid FROM property_offer_unlinks LIMIT 1)");
    await c.query("INSERT INTO property_offers (property_id, offer_id, score, signals, linked_at) SELECT property_id, offer_id, score, signals, linked_at FROM property_offer_unlinks");
    assert.equal(hieu(await tapLink(c), ca.truoc), 1, "KGC-AC-3: bỏ một dòng nhật ký mà hiệu không là 1 dòng thiếu");
    await c.query("ROLLBACK TO SAVEPOINT sp_do");
    await c.query("INSERT INTO property_offers (property_id, offer_id, score, signals, linked_at) SELECT property_id, offer_id, score, signals, linked_at FROM property_offer_unlinks");
    assert.equal(hieu(await tapLink(c), ca.truoc), 0, "KGC-AC-3: chèn lại nhật ký không bằng ảnh chụp trước dọn");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

test("KGC-CAT cắt dữ liệu theo luật trước AC-4…AC-7", { timeout: 600_000 }, async () => {
  const c = await ketNoi();
  try {
    const { giu, tong } = await catDuLieu(c, "AC-4…AC-7");
    assert.ok(giu.cum > 0 && giu.cum < tong.cum, "KGC-CAT: tập cắt rỗng hoặc không cắt gì");
    assert.equal(await so(c, DUP), 0, "KGC-CAT: cắt làm hỏng trạng thái sau 098");
  } finally { await c.end(); }
});

test("KGC-AC-4 resolver hai lần liền không sinh gì thêm", { timeout: 2_400_000 }, async () => {
  const c = await ketNoi();
  try {
    await doGio("AC-4 lượt một", () => chayResolve(c, { ghi: im }));
    const truoc = [await maxCan(c), await so(c, "SELECT count(*) FROM property_offers")];
    await doGio("AC-4 lượt hai", () => chayResolve(c, { ghi: im }));
    assert.deepEqual([await maxCan(c), await so(c, "SELECT count(*) FROM property_offers")], truoc, "KGC-AC-4: lượt hai sinh căn hay link");
    assert.equal(await so(c, DUP), 0, "KGC-AC-4: còn tin gắn hơn một căn");
    // Chiều đỏ (lược đồ như trước 098): resolver bản gốc sau khi đổi giá một tin → căn mới và tin có 2 link.
    const goc = await resolverGoc();
    await c.query("BEGIN");
    const t = await tinDoiGia(c);
    await doiGia(c, t.offer_id);
    await c.query("SAVEPOINT co_unique");
    await assert.rejects(goc(c, { ghi: im }), (e) => e.code === "23505" && e.constraint === "property_offers_offer_id_key",
      "KGC-AC-4: bản gốc trên lược đồ có 098 không ném 23505");
    await c.query("ROLLBACK TO SAVEPOINT co_unique");
    await boRangBuoc(c);
    const m0 = await maxCan(c);
    await goc(c, { ghi: im });
    assert.ok(await maxCan(c) > m0 && await soLink(c, t.offer_id) === 2, "KGC-AC-4: resolver bản gốc không sinh căn, link mới — chiều đỏ không đỏ");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

test("KGC-AC-5 đổi giá một tin không sinh căn mới", { timeout: 2_400_000 }, async () => {
  const c = await ketNoi();
  try {
    const goc = await resolverGoc();
    // Chiều đỏ trước, trên một tin, rồi hoàn lại: bản gốc với UNIQUE đã bỏ → 2 link và có căn mới.
    await c.query("BEGIN");
    const tDo = await tinDoiGia(c);
    await boRangBuoc(c);
    await doiGia(c, tDo.offer_id);
    const m0 = await maxCan(c);
    await goc(c, { ghi: im });
    assert.equal(await soLink(c, tDo.offer_id), 2, "KGC-AC-5: bản gốc không cho tin 2 link — chiều đỏ không đỏ");
    assert.ok(await maxCan(c) > m0, "KGC-AC-5: bản gốc không sinh căn mới — chiều đỏ không đỏ");
    await c.query("ROLLBACK");
    // Xanh.
    const t = await tinDoiGia(c);
    await doiGia(c, t.offer_id);
    const m1 = await maxCan(c);
    await chayResolve(c, { ghi: im });
    assert.equal(await maxCan(c), m1, "KGC-AC-5: đổi giá sinh căn mới");
    const { rows } = await c.query("SELECT property_id FROM property_offers WHERE offer_id = $1", [t.offer_id]);
    assert.deepEqual(rows.map((r) => String(r.property_id)), [String(t.property_id)], "KGC-AC-5: tin đổi giá không còn đúng một link tới căn cũ");
  } finally { await c.end(); }
});

test("KGC-AC-6 căn có sẵn giữ stable_key, mọi căn stage-ab sáu đoạn", { timeout: 2_400_000 }, async () => {
  const c = await ketNoi();
  try {
    const m = await maxCan(c);
    const h = await bamCan(c, m);
    await chayResolve(c, { ghi: im });
    assert.equal(await bamCan(c, m), h, "KGC-AC-6: stable_key căn cũ đổi");
    assert.equal(await so(c, SAU_DOAN), 0, "KGC-AC-6: có căn stage-ab không sáu đoạn");
    // Chiều đỏ: sửa stable_key một căn cũ giữa hai lần băm → phép băm đổi; tìm đúng id.
    await c.query("BEGIN");
    const id = (await c.query("SELECT id FROM properties WHERE id <= $1 ORDER BY id LIMIT 1", [m])).rows[0].id;
    const truoc = new Map((await c.query("SELECT id, stable_key FROM properties WHERE id <= $1", [m])).rows.map((r) => [String(r.id), r.stable_key]));
    await c.query("UPDATE properties SET stable_key = stable_key || '#do' WHERE id = $1", [id]);
    assert.notEqual(await bamCan(c, m), h, "KGC-AC-6: băm không đổi khi stable_key đổi");
    const lech = (await c.query("SELECT id, stable_key FROM properties WHERE id <= $1", [m])).rows.filter((r) => truoc.get(String(r.id)) !== r.stable_key).map((r) => String(r.id));
    assert.deepEqual(lech, [String(id)], "KGC-AC-6: phép so không gọi đúng id");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});

test("KGC-AC-7 tin chưa gắn vào căn đúng khoá, tin đã gắn không theo cụm mới", { timeout: 2_400_000 }, async () => {
  const c = await ketNoi();
  try {
    // Dòng mồi tổng hợp: ô xa mọi dữ liệu thật, mã tin giả; không dữ liệu thật.
    const SID = "vn__kgc-mau-thu__2000-01-01T000000000";
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'kgc-mau-thu', '{}'::jsonb)
                   ON CONFLICT (snapshot_id) DO NOTHING`, [SID]);
    const OFF = (lid) => `'offer_' || substr(encode(digest('S06|' || ${lid}::text, 'sha256'), 'hex'), 1, 16)`;
    const gieo = async (lid, lat, lng, dt) => {
      await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, latitude, longitude)
                     VALUES ($1, 0, 'kgc', 1010, 's', '{}'::jsonb, $2, $3, $4)`, [lid, SID, lat, lng]);
      const id = (await c.query(
        `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, price_vnd, area_m2, property_type)
         VALUES (${OFF("$1::bigint")}, 'sale', now(), now(), 'S06', 3500000000, $2, 'apartment') RETURNING offer_id`, [lid, dt])).rows[0].offer_id;
      return id;
    };
    const A = await gieo(990000000001, 23.91234, 102.01234, 70);
    await chayResolve(c, { ghi: im });
    const P = (await c.query("SELECT property_id FROM property_offers WHERE offer_id = $1", [A])).rows.map((r) => String(r.property_id));
    assert.equal(P.length, 1, "KGC-AC-7: lượt một không sinh đúng một căn cho A");
    const m0 = await maxCan(c);
    const buocHai = async () => {
      const B = await gieo(990000000002, 23.91236, 102.01236, 70);
      await c.query("UPDATE sale_offer_records SET area_m2 = 85 WHERE offer_id = $1", [A]);
      const C = await gieo(990000000003, 23.95, 102.05, 70);
      return { B, C };
    };
    const canRiengA = () => so(c, `SELECT count(*) FROM properties p WHERE p.id > $1 AND
      (SELECT array_agg(offer_id) FROM property_offers po WHERE po.property_id = p.id) = ARRAY[$2]::text[]`, [m0, A]);
    // Chiều đỏ: resolver bản gốc, UNIQUE đã bỏ → sinh căn cho riêng A.
    await c.query("BEGIN");
    await boRangBuoc(c);
    await buocHai();
    await (await resolverGoc())(c, { ghi: im });
    assert.ok(await canRiengA() > 0, "KGC-AC-7: bản gốc không sinh căn cho riêng A — chiều đỏ không đỏ");
    await c.query("ROLLBACK");
    // Xanh.
    const { B, C } = await buocHai();
    await chayResolve(c, { ghi: im });
    const lk = async (o) => (await c.query("SELECT property_id FROM property_offers WHERE offer_id = $1", [o])).rows.map((r) => String(r.property_id));
    assert.deepEqual(await lk(B), P, "KGC-AC-7: B không gắn đúng căn có sẵn");
    assert.deepEqual(await lk(A), P, "KGC-AC-7: A không còn đúng một link tới căn cũ");
    const lc = await lk(C);
    assert.equal(lc.length, 1, "KGC-AC-7: C không có đúng một căn");
    assert.ok(Number(lc[0]) > m0, "KGC-AC-7: căn của C không phải căn mới");
    assert.equal(await so(c, "SELECT count(*) FROM properties WHERE id > $1", [m0]), 1, "KGC-AC-7: lượt hai sinh khác một căn mới");
    assert.equal(await canRiengA(), 0, "KGC-AC-7: có căn sinh cho riêng A");
  } finally { await c.end(); }
});

// AC-9 (mở lại phạm vi 13/11): migration 101 thay reconcile_stale_offers — tin kế đã có căn khác thì link của tin cũ vào nhật ký.
const MIG101 = readFileSync(join(GOC, "db/migrations/101_doi_soat_chuyen_link.sql"), "utf8");
function ham044() {
  const r = spawnSync("git", ["-C", GOC, "show", "origin/main:db/migrations/044_nap_lai_khong_xoa.sql"], { encoding: "utf8" });
  assert.equal(r.status, 0, `KGC: không đọc được 044 bản gốc: ${r.stderr}`);
  const m = r.stdout.match(/CREATE OR REPLACE FUNCTION reconcile_stale_offers[\s\S]*?\nEND \$\$;/);
  assert.ok(m, "KGC: không cắt được hàm reconcile_stale_offers của 044");
  return m[0];
}

test("KGC-AC-9 đối soát đêm không làm căn mất link âm thầm", { timeout: 600_000 }, async () => {
  const c = await ketNoi();
  const NGUON = "kgc-ac9";
  // Dòng mồi tổng hợp: nguồn thử, mã tin giả. X→P1, Y→P2 (Y kế X); X2→P3, Y2 chưa gắn (Y2 kế X2).
  const gieo = async () => {
    const can = async () => (await c.query("INSERT INTO properties DEFAULT VALUES RETURNING id")).rows[0].id;
    const tin = async (id, posts) => c.query(
      `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids)
       VALUES ($1, 'sale', now(), now(), $2, $3)`, [id, NGUON, posts]);
    const lk = (p, o, s) => c.query(
      `INSERT INTO property_offers (property_id, offer_id, score, signals, linked_at)
       VALUES ($1, $2, $3, '{"kgc":"ac9"}'::jsonb, '2001-01-01T00:00:00Z')`, [p, o, s]);
    const [P1, P2, P3] = [await can(), await can(), await can()];
    await tin("kgc9_X", ["kgc9_bai1"]); await tin("kgc9_Y", ["kgc9_bai1"]);
    await tin("kgc9_X2", ["kgc9_bai2"]); await tin("kgc9_Y2", ["kgc9_bai2"]);
    await lk(P1, "kgc9_X", 0.91); await lk(P2, "kgc9_Y", 0.92); await lk(P3, "kgc9_X2", 0.93);
    return { P1: String(P1), P2: String(P2), P3: String(P3) };
  };
  const chay = async () => (await c.query("SELECT reconcile_stale_offers($1, $2, 'kgc-ac9') s", [NGUON, ["kgc9_Y", "kgc9_Y2"]])).rows[0].s;
  const lk = async (o) => (await c.query("SELECT property_id FROM property_offers WHERE offer_id = $1", [o])).rows.map((r) => String(r.property_id));
  /** Trả danh sách lỗi theo AC-9; rỗng = đạt. */
  const kiem = async ({ P1, P2, P3 }, tongKet) => {
    const loi = [];
    const y = await lk("kgc9_Y"); if (y.join() !== P2) loi.push(`Y không đúng một link tới P2 (có ${y})`);
    const nk = (await c.query(
      `SELECT property_id::text p, score::text s, signals, linked_at, reason FROM property_offer_unlinks WHERE offer_id = 'kgc9_X'`)).rows;
    if (nk.length !== 1 || nk[0].p !== P1 || nk[0].s !== "0.91" || nk[0].signals?.kgc !== "ac9"
        || new Date(nk[0].linked_at).toISOString() !== "2001-01-01T00:00:00.000Z" || !nk[0].reason.includes("kgc9_Y")) {
      loi.push(`nhật ký không có đúng dòng (P1, X) — có ${nk.length} dòng`);
    }
    const y2 = await lk("kgc9_Y2"); if (y2.join() !== P3) loi.push(`Y2 không đúng một link tới P3 (có ${y2})`);
    for (const o of ["kgc9_X", "kgc9_X2"]) if ((await lk(o)).length) loi.push(`${o} còn link`);
    if (await so(c, "SELECT count(*) FROM property_offer_unlinks WHERE offer_id = 'kgc9_X2'")) loi.push("X2 bị ghi nhật ký dù Y2 chưa gắn");
    if (tongKet?.links_journaled !== 1) loi.push(`tổng kết links_journaled = ${tongKet?.links_journaled}`);
    return loi;
  };
  try {
    await c.query(MIG); // 098 đã áp ở AC-1; áp lại an toàn (AC-2) để ca chạy được một mình
    // Chiều đỏ 1: hàm của 044 → link (P1, X) biến mất, nhật ký trống.
    await c.query("BEGIN");
    await c.query(ham044());
    const g1 = await gieo();
    await chay();
    assert.equal(await so(c, "SELECT count(*) FROM property_offer_unlinks WHERE offer_id = 'kgc9_X'"), 0, "KGC-AC-9: 044 đã ghi nhật ký — chiều đỏ mất nghĩa");
    assert.equal(await so(c, "SELECT count(*) FROM property_offers WHERE property_id = $1", [g1.P1]), 0, "KGC-AC-9: 044 vẫn giữ link của P1 — chiều đỏ mất nghĩa");
    assert.ok((await kiem(g1, null)).some((l) => l.startsWith("nhật ký")), "KGC-AC-9: phép kiểm không bắt được 044 mất link");
    await c.query("ROLLBACK");
    // Chiều đỏ 2: bản sao 101 bỏ câu ghi nhật ký → phép kiểm đỏ.
    const boGhi = MIG101.replace(/WITH j AS \([\s\S]*?SELECT journaled \+ count\(\*\) INTO journaled FROM j;/, "");
    assert.notEqual(boGhi, MIG101, "KGC: không cắt được câu ghi nhật ký của 101");
    await c.query("BEGIN");
    await c.query(boGhi);
    const g2 = await gieo();
    const t2 = await chay();
    assert.ok((await kiem(g2, t2)).length > 0, "KGC-AC-9: bản bỏ ghi nhật ký vẫn đạt — phép kiểm không phân biệt");
    await c.query("ROLLBACK");
    // Xanh: áp 101 hai lần (chạy lại an toàn) rồi đối soát.
    await c.query("BEGIN");
    await c.query(MIG101);
    await c.query(MIG101);
    const g = await gieo();
    const t = await chay();
    assert.deepEqual(await kiem(g, t), [], "KGC-AC-9");
    await c.query("ROLLBACK");
  } finally { await c.end(); }
});
