// so-ghep-s06.test.mjs — hồ sơ so-ghep-s06-nhan-danh-ba: số S06 chỉ vào danh bạ khi có dấu trực tiếp, số còn lại mang nhãn.
// Ca DB chạy BEGIN…ROLLBACK trên Postgres local :5433, mỗi ca một lược đồ riêng; không chạm public. Mọi SĐT là số bịa.
// Mỗi phép đo có ca đỏ trên cùng fixture, ghim thông điệp.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { docMoc, docNhanhSoGhep, doTrenDb, kiemBatBienSoGhep, tuChoiDb, veDong } from "../do-so-ghep-s06.mjs";
import { ganSdtS06 } from "../gan-sdt-s06.mjs";
import { resolveOffers } from "../lib/assert.mjs";
import { coBangChungSdt, dungNguoi, RULE_TRUC_TIEP, rutDinhDanh, sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { khoaNgoaiDanhSach, khoaNguon, luocDoRieng } from "../lib/luoc-do-rieng.mjs";
import { nap068 } from "../lib/nap-068.mjs";
import { MIG_070, nap070 } from "../lib/nap-070.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// properties, property_offers, review_queue: view sellers và bước dựng danh bạ đọc ở public, phải khoá cùng câu NOWAIT đầu giao dịch
// (xem kiem-do-sau-070.test.mjs).
const BANG = ["stg_chotot_ads", "stg_zalo_posts", "sale_offer_records", "field_assertions", "ops_audit",
  "parties", "registry_aliases", "registry_events", "party_roles", "properties", "property_offers", "review_queue"];
// Transform thật đọc phường ở public nên chỉ khoá, không chép rỗng.
const CHI_KHOA = ["areas"];

/** View của public dựng lại trong lược đồ riêng: lấy định nghĩa khi search_path chỉ có public để tên bảng không gắn lược đồ. */
async function chepView(c, sc, ten) {
  await c.query("SET LOCAL search_path = public");
  const { rows } = await c.query("SELECT pg_get_viewdef($1::regclass) AS d", [`public.${ten}`]);
  await c.query(`SET LOCAL search_path = ${sc}, public`);
  await c.query(`CREATE VIEW ${sc}.${ten} AS ${rows[0].d}`);
}

/** Hàm phân xử chép vào lược đồ riêng: 068 sửa hàm theo search_path, không có bản riêng thì nó ghi đè hàm public trong giao
 * dịch này và deadlock với bộ test đang nạp 061 trên field_assertions. */
async function chepHamPhanXu(c, sc) {
  const { rows } = await c.query(`SELECT pg_get_functiondef('public.resolve_offer_fields(text[])'::regprocedure) AS d`);
  await c.query(rows[0].d.replace("public.resolve_offer_fields", `${sc}.resolve_offer_fields`));
}

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // PX1: transform đọc bí danh xã cũ ở public khi đã áp 084 — có bảng thì khoá cùng câu đầu giao dịch.
    const { rows: [bd] } = await c.query(`SELECT to_regclass('public.area_aliases') IS NOT NULL AS co`);
    const chiKhoa = bd.co ? [...CHI_KHOA, "area_aliases"] : CHI_KHOA;
    await khoaNguon(c, [...BANG, ...chiKhoa]);
    const sc = await luocDoRieng(c, BANG, { tienTo: "sg" });
    await chepView(c, sc, "sale_offers");
    await chepView(c, sc, "sellers");
    await chepHamPhanXu(c, sc);
    await nap068(c);
    await nap070(c);
    await c.query(`INSERT INTO ops_audit (actor, action) VALUES ('test', 'phat-bieu:cat-chuyen')`);
    const kq = await fn(c, { sc });
    assert.deepEqual(await khoaNgoaiDanhSach(c, [...BANG, ...chiKhoa]), [], "SG ca xin khoá bảng public giữa giao dịch: thêm bảng đó vào BANG");
    return kq;
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const yen = { out: () => {} };
const bam = (so) => createHash("sha256").update(so).digest("hex").slice(0, 32);
const MAU_SO = /\+84\d{9}|\b0\d{9}\b/;

async function themTin(c, { id, source = "S06", fp = {}, so = null, tk = null, posts = [] }) {
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, originating_system_key, field_provenance,
                                     seller_phone, seller_ref, post_ids)
     VALUES ($1, 'sale', now(), now(), $2, $1, $3, $4, $5, $6)`,
    [String(id), source, JSON.stringify(fp), so, tk ? `ct:${tk}` : null, posts]);
}

async function themStg(c, { id, tk, so, an = false }) {
  await c.query(
    `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, seller, price, size_m2)
     VALUES ($1, 1, 'x', 1010, 's', $2, 'sg', $3, 1000000000, 50)
     ON CONFLICT (list_id) DO UPDATE SET payload = EXCLUDED.payload, seller = EXCLUDED.seller`,
    [id, JSON.stringify({ account_id: String(tk), phone_hidden: an }),
      JSON.stringify(so ? { full_name: "Người bán thử", phone: so } : { full_name: "Người bán thử" })]);
}

const docTin = async (c, id) => (await c.query(`SELECT * FROM sale_offer_records WHERE offer_id = $1`, [String(id)])).rows[0];
const soBiDanhSdt = async (c, so) => (await c.query(
  `SELECT count(*)::int AS n FROM registry_aliases WHERE kind = 'sdt' AND value = $1 AND retired_at IS NULL`, [so])).rows[0].n;
const tapCap = async (c) => (await c.query(
  `SELECT source || '|' || kind || '|' || value || '|' || object_key AS k FROM registry_aliases WHERE retired_at IS NULL ORDER BY 1`)).rows.map((r) => r.k);
const nguoiCuaSdt = async (c, so) => (await c.query(
  `SELECT a.object_key FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key
    WHERE a.kind = 'sdt' AND a.value = $1 AND a.retired_at IS NULL`, [so])).rows[0]?.object_key ?? null;
const vaiCuaTin = async (c, subject) => (await c.query(
  `SELECT party_key FROM party_roles WHERE subject_key = $1 AND retracted_at IS NULL`, [subject])).rows;
const soNguoi = async (c) => (await c.query(`SELECT count(*)::int AS n FROM parties`)).rows[0].n;

const GHEP = { tier: "observed", method: "e1_rule", rule_id: "s06-cung-tai-khoan", tu_tin: 1, measured: false };
const TRUC = { tier: "fact", method: "source_field", rule_id: RULE_TRUC_TIEP, measured: false };

// Bảng 12 ô viết trước. S06 trực tiếp, ghép ghi bằng ganSdtS06 thật; mất dấu xoá khoá sau khi ghi. S03, S05 không đi nhánh
// mới nên chèn thẳng cột, mỗi ô một loại dấu, để chứng minh dấu không đổi gì ở hai nguồn này (dòng sổ fix của Task 1).
const MA_TRAN = [
  { o: "S06-truc-tiep", id: 101, source: "S06", so: "+84900000101", ky_vong: 1 },
  { o: "S06-ghep", id: 102, source: "S06", so: "+84900000102", ky_vong: 0 },
  { o: "S06-mat-dau", id: 103, source: "S06", so: "+84900000103", ky_vong: 0 },
  { o: "S06-khong-so", id: 104, source: "S06", so: null, ky_vong: 0 },
  { o: "S03-truc-tiep", id: 301, source: "S03", so: "+84900000301", fp: { seller_phone: TRUC }, ky_vong: 1 },
  { o: "S03-ghep", id: 302, source: "S03", so: "+84900000302", fp: { seller_phone: GHEP }, ky_vong: 1 },
  { o: "S03-mat-dau", id: 303, source: "S03", so: "+84900000303", fp: {}, ky_vong: 1 },
  { o: "S03-khong-so", id: 304, source: "S03", so: null, fp: {}, ky_vong: 0 },
  { o: "S05-truc-tiep", id: 501, source: "S05", so: "+84900000501", fp: { seller_phone: TRUC }, ky_vong: 1 },
  { o: "S05-ghep", id: 502, source: "S05", so: "+84900000502", fp: { seller_phone: GHEP }, ky_vong: 1 },
  { o: "S05-mat-dau", id: 503, source: "S05", so: "+84900000503", fp: {}, ky_vong: 1 },
  { o: "S05-khong-so", id: 504, source: "S05", so: null, fp: {}, ky_vong: 0 },
];

async function dungMaTran(c) {
  // Ô S06 đi qua bộ gán thật. Ô ghép và mất dấu: số nằm trên một dòng stg phụ không có tin trong canonical.
  await themTin(c, { id: 101, tk: 1 });
  await themStg(c, { id: 101, tk: 1, so: "+84900000101" });
  await themTin(c, { id: 102, tk: 2 });
  await themStg(c, { id: 102, tk: 2 });
  await themStg(c, { id: 9102, tk: 2, so: "+84900000102" });
  await themTin(c, { id: 103, tk: 3 });
  await themStg(c, { id: 103, tk: 3 });
  await themStg(c, { id: 9103, tk: 3, so: "+84900000103" });
  await themTin(c, { id: 104, tk: 4 });
  await themStg(c, { id: 104, tk: 4 });
  await ganSdtS06(c);
  await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance - 'seller_phone' WHERE offer_id = '103'`);
  for (const m of MA_TRAN.filter((x) => x.source !== "S06")) await themTin(c, { id: m.id, source: m.source, so: m.so, fp: m.fp });
}

/** Tên các ô mà luật `coChung` cho kết quả khác bảng — dùng chung cho lượt lành và lượt phá thử. */
async function oSai(c, coChung) {
  const sai = [];
  for (const m of MA_TRAN) {
    const t = await docTin(c, m.id);
    const raSo = t.seller_phone != null && (t.source !== "S06" || coChung(t)) ? 1 : 0;
    if (raSo !== m.ky_vong) sai.push(m.o);
  }
  return sai;
}

test("SG-AC-1 ma trận 12 ô: S06 chỉ số có dấu trực tiếp sinh bí danh, S03 và S05 không đổi", async () => {
  await withTx(async (c) => {
    await dungMaTran(c);
    assert.equal(MA_TRAN.length, 12, "SG-AC-1 bảng phải đủ 12 ô");
    assert.equal((await docTin(c, 101)).field_provenance.seller_phone.rule_id, RULE_TRUC_TIEP, "SG-AC-1 tiền đề ô trực tiếp");
    assert.equal((await docTin(c, 102)).field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan", "SG-AC-1 tiền đề ô ghép");
    assert.equal((await docTin(c, 103)).seller_phone, "+84900000103", "SG-AC-1 tiền đề ô mất dấu còn số");

    const sai = await oSai(c, coBangChungSdt);
    assert.deepEqual(sai, [], `SG-AC-1 luật sai ở ô: ${sai.join(", ")}`);
    const nguoiTruoc = await soNguoi(c);
    await dungNguoi(c, yen);
    let daKiem = 0;
    for (const m of MA_TRAN) {
      daKiem += 1;
      if (m.so) assert.equal(await soBiDanhSdt(c, m.so), m.ky_vong, `SG-AC-1 ô ${m.o} sai số bí danh`);
      const nguoiSdt = m.so && m.ky_vong ? await nguoiCuaSdt(c, m.so) : null;
      if (m.so && m.ky_vong) assert.ok(nguoiSdt, `SG-AC-1 ô ${m.o} thiếu người theo SĐT`);
      const vai = await vaiCuaTin(c, `${m.source}:${m.id}`);
      if (m.source === "S06") {
        assert.equal(vai.length, 1, `SG-AC-1 ô ${m.o} phải đúng một vai`);
        assert.notEqual(vai[0].party_key, nguoiSdt, `SG-AC-1 ô ${m.o} vai về người theo SĐT`);
      } else {
        assert.deepEqual(vai.map((v) => v.party_key), m.so ? [nguoiSdt] : [], `SG-AC-1 ô ${m.o} sai vai`);
      }
    }
    assert.equal(daKiem, 12, "SG-AC-1 phải kiểm đủ 12 ô");

    // Vai mọi tin S06 về người theo tài khoản, kể cả tin không sinh bí danh số.
    for (const [id, tk] of [[101, "1"], [102, "2"], [103, "3"], [104, "4"]]) {
      const { rows } = await c.query(
        `SELECT a.value FROM party_roles r JOIN registry_aliases a ON a.object_key = r.party_key AND a.kind = 'tai_khoan_nguon'
          WHERE r.subject_key = $1 AND r.retracted_at IS NULL`, [`S06:${id}`]);
      assert.deepEqual(rows.map((r) => r.value), [tk], `SG-AC-1 vai tin S06:${id} không về người tài khoản ${tk}`);
    }
    assert.ok((await soNguoi(c)) > nguoiTruoc, "SG-AC-1 đối chứng: lượt dựng phải sinh người");

    // S03, S05: kết quả rút giữ đúng bản cũ, số đi nguyên.
    for (const m of MA_TRAN.filter((x) => x.source !== "S06")) {
      assert.equal(rutDinhDanh(await docTin(c, m.id), new Map()).sdt, m.so, `SG-AC-1 ô ${m.o} đổi so với bản cũ`);
    }
  });
});

test("SG-AC-1 chiều đỏ: chỉ loại dấu ghép thì đỏ ở ô mất dấu", async () => {
  await withTx(async (c) => {
    await dungMaTran(c);
    const dotBien = (t) => t.field_provenance?.seller_phone?.rule_id !== "s06-cung-tai-khoan";
    assert.deepEqual(await oSai(c, dotBien), ["S06-mat-dau"], "SG-AC-1 phá thử phải ghim đúng ô S06-mat-dau");
  });
});

/** Tin trực tiếp 201 và tin ghép 202 cùng tài khoản 20, số thuộc tin trực tiếp. */
async function dungCapGhep(c) {
  await themTin(c, { id: 201, tk: 20 });
  await themStg(c, { id: 201, tk: 20, so: "+84900000201" });
  await themTin(c, { id: 202, tk: 20 });
  await themStg(c, { id: 202, tk: 20 });
  await ganSdtS06(c);
  assert.equal((await docTin(c, 202)).seller_phone, "+84900000201", "SG-AC-2 tiền đề: tin 202 giữ số ghép");
  await dungNguoi(c, yen);
}

test("SG-AC-2a tin chuyển ẩn số: rút số ghép, danh bạ không đổi", async () => {
  await withTx(async (c) => {
    await dungCapGhep(c);
    const moc1 = await tapCap(c);
    await themStg(c, { id: 202, tk: 20, an: true });
    await ganSdtS06(c);
    assert.equal((await docTin(c, 202)).seller_phone, null, "SG-AC-2a lượt rút phải xảy ra");
    await dungNguoi(c, yen);
    assert.deepEqual(await tapCap(c), moc1, "SG-AC-2a danh bạ đổi vì lượt rút");
    await ganSdtS06(c);
    await dungNguoi(c, yen);
    assert.deepEqual(await tapCap(c), moc1, "SG-AC-2a chạy lại đổi danh bạ");
    // Đối chứng cùng fixture: mất một cặp thì phép so phải thấy.
    await c.query(`UPDATE registry_aliases SET retired_at = now() WHERE kind = 'sdt' AND value = '+84900000201'`);
    assert.notDeepEqual(await tapCap(c), moc1, "SG-AC-2a phép so không thấy mất cặp");
  });
});

test("SG-AC-2b tài khoản có thêm số thứ hai: chỉ thêm đúng cặp của số trực tiếp mới", async () => {
  await withTx(async (c) => {
    await dungCapGhep(c);
    const moc1 = await tapCap(c);
    await themTin(c, { id: 203, tk: 20 });
    await themStg(c, { id: 203, tk: 20, so: "+84900000203" });
    await ganSdtS06(c);
    assert.equal((await docTin(c, 202)).seller_phone, null, "SG-AC-2b lượt rút phải xảy ra");
    await dungNguoi(c, yen);
    const moc2 = await tapCap(c);
    assert.deepEqual(moc1.filter((k) => !moc2.includes(k)), [], "SG-AC-2b mất cặp");
    const them = moc2.filter((k) => !moc1.includes(k));
    assert.equal(them.length, 1, `SG-AC-2b phải thêm đúng một cặp: ${them.join(", ")}`);
    assert.ok(them[0].startsWith("S06|sdt|+84900000203|"), `SG-AC-2b cặp thêm sai: ${them[0]}`);
    await ganSdtS06(c);
    await dungNguoi(c, yen);
    assert.deepEqual(await tapCap(c), moc2, "SG-AC-2b chạy lại đổi danh bạ");
  });
});

test("SG-AC-3 sellers và sellersThieuNguoi: số có tin trực tiếp hiện, số chỉ trên tin ghép không hiện, không báo thiếu", async () => {
  await withTx(async (c) => {
    await dungCapGhep(c); // số A: tin 201 trực tiếp, tin 202 ghép
    await themTin(c, { id: 211, tk: 21 }); // số B: chỉ trên tin ghép
    await themStg(c, { id: 211, tk: 21 });
    await themStg(c, { id: 9211, tk: 21, so: "+84900000211" });
    await ganSdtS06(c);
    assert.equal((await docTin(c, 211)).seller_phone, "+84900000211", "SG-AC-3 tiền đề: tin 211 giữ số B");
    await dungNguoi(c, yen);

    const docSeller = async (phone) => (await c.query(`SELECT n_ads FROM sellers WHERE phone_hash = $1`, [bam(phone)])).rows;
    assert.deepEqual((await docSeller("+84900000201")).map((r) => r.n_ads), [2], "SG-AC-3 số A phải một dòng, n_ads gồm cả tin ghép");
    assert.deepEqual(await docSeller("+84900000211"), [], "SG-AC-3 số B không được có dòng");
    assert.deepEqual(await sellersThieuNguoi(c), [], "SG-AC-3 số ghép bị báo thiếu");

    // Đối chứng dương: số trực tiếp chưa có bí danh vẫn bị báo, cùng fixture.
    await themTin(c, { id: 212, tk: 22 });
    await themStg(c, { id: 212, tk: 22, so: "+84900000212" });
    await ganSdtS06(c);
    const thieu = await sellersThieuNguoi(c);
    assert.deepEqual(thieu, [`${bam("+84900000212")}:S06`], "SG-AC-3 số trực tiếp thiếu bí danh phải bị báo đúng số, đúng nguồn");

    // Đối chứng cho chính số B: tin 211 mang dấu trực tiếp thì số B có dòng, nên «không có dòng» ở trên là do nhánh.
    await c.query(`UPDATE sale_offer_records SET field_provenance = jsonb_build_object('seller_phone', $1::jsonb) WHERE offer_id = '211'`, [JSON.stringify(TRUC)]);
    await dungNguoi(c, yen);
    assert.deepEqual((await docSeller("+84900000211")).map((r) => r.n_ads), [1], "SG-AC-3 đối chứng: số B có dấu trực tiếp phải có một dòng");
  });
});

/** View về bản SELECT * trước 070, trong lược đồ riêng; đúng cả khi public đã áp 070. */
async function veTruoc070(c, sc) {
  await c.query(`DROP VIEW ${sc}.sale_offers CASCADE`);
  await c.query(`CREATE VIEW ${sc}.sale_offers AS SELECT * FROM ${sc}.sale_offer_records WHERE retired_at IS NULL`);
}

const NAM_O = [
  { o: "S06-truc-tiep", id: 401, nhan: false },
  { o: "S06-ghep", id: 402, nhan: true },
  { o: "S06-mat-dau", id: 403, nhan: true },
  { o: "S06-khong-so", id: 404, nhan: false },
  { o: "S03-nguon-khac", id: 405, nhan: false },
];

/** Năm ô nhãn: trực tiếp, ghép ghi bằng bộ gán thật, mất dấu xoá khoá sau khi ghi. */
async function dungNamO(c) {
  await themTin(c, { id: 401, tk: 40 });
  await themStg(c, { id: 401, tk: 40, so: "+84900000401" });
  await themTin(c, { id: 402, tk: 40 });
  await themStg(c, { id: 402, tk: 40 });
  await themTin(c, { id: 403, tk: 40 });
  await themStg(c, { id: 403, tk: 40 });
  await themTin(c, { id: 404, tk: 41 });
  await themStg(c, { id: 404, tk: 41 });
  await ganSdtS06(c);
  await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance - 'seller_phone' WHERE offer_id = '403'`);
  await themTin(c, { id: 405, source: "S03", so: "+84900000405" });
}

async function oNhanSai(c) {
  const sai = [];
  for (const m of NAM_O) {
    const { rows } = await c.query(`SELECT seller_phone_inferred AS nhan FROM sale_offers WHERE offer_id = $1`, [String(m.id)]);
    if (rows[0].nhan !== m.nhan) sai.push(m.o);
  }
  return sai;
}

const dauView = async (c) => (await c.query(
  `SELECT md5(string_agg((to_jsonb(v) - 'seller_phone_inferred')::text, '|' ORDER BY v.offer_id)) AS m FROM sale_offers v`)).rows[0].m;
const dauBang = async (c) => (await c.query(
  `SELECT md5(string_agg(t::text, '|' ORDER BY t.offer_id)) AS m FROM sale_offer_records t`)).rows[0].m;
const cotBang = async (c, sc) => (await c.query(
  `SELECT column_name AS n FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'sale_offer_records' ORDER BY ordinal_position`, [sc])).rows.map((r) => r.n);

test("SG-AC-4 070 áp hai lần: cột cuối đúng năm ô, cột cũ và bảng không đổi, qua phân xử vẫn đúng", async () => {
  await withTx(async (c, { sc }) => {
    await dungNamO(c);
    assert.equal((await docTin(c, 402)).field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan", "SG-AC-4 tiền đề ô ghép");
    assert.equal((await docTin(c, 403)).seller_phone, "+84900000401", "SG-AC-4 tiền đề ô mất dấu còn số");
    await veTruoc070(c, sc);
    const truoc = { view: await dauView(c), bang: await dauBang(c), cot: await cotBang(c, sc) };
    await c.query(MIG_070);
    await c.query(MIG_070);
    const { rows } = await c.query(
      `SELECT attname AS n FROM pg_attribute WHERE attrelid = to_regclass('sale_offers') AND attnum > 0 AND NOT attisdropped ORDER BY attnum DESC LIMIT 1`);
    assert.equal(rows[0].n, "seller_phone_inferred", "SG-AC-4 cột mới không đứng cuối");
    assert.equal(NAM_O.length, 5, "SG-AC-4 bảng phải đủ 5 ô");
    const sai = await oNhanSai(c);
    assert.deepEqual(sai, [], `SG-AC-4 nhãn sai ở ô: ${sai.join(", ")}`);
    assert.equal(await dauView(c), truoc.view, "SG-AC-4 cột cũ của view đổi giá trị");
    assert.equal(await dauBang(c), truoc.bang, "SG-AC-4 bảng đổi dòng");
    assert.deepEqual(await cotBang(c, sc), truoc.cot, "SG-AC-4 bảng đổi lược đồ");

    await resolveOffers(c, NAM_O.map((m) => String(m.id)));
    const saiSau = await oNhanSai(c);
    assert.deepEqual(saiSau, [], `SG-AC-4 sau phân xử nhãn sai ở ô: ${saiSau.join(", ")}`);
    assert.equal((await docTin(c, 402)).field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan", "SG-AC-4 phân xử làm mất dấu ghép");
  });
});

test("SG-AC-4 chiều đỏ: view chỉ nhận dấu ghép thì sai ở ô mất dấu", async () => {
  await withTx(async (c, { sc }) => {
    await dungNamO(c);
    await veTruoc070(c, sc);
    const tu = "IS DISTINCT FROM 's06-so-tren-tin'";
    assert.ok(MIG_070.includes(tu), "SG-AC-4 đột biến không khớp 070");
    await c.query(MIG_070.replace(tu, "= 's06-cung-tai-khoan'"));
    assert.deepEqual(await oNhanSai(c), ["S06-mat-dau"], "SG-AC-4 phá thử phải ghim đúng ô S06-mat-dau");
  });
});

test("SG-AC-5 qua transform thật: chưa có cột thì không ghi số ghép, số trực tiếp vẫn ghi, báo tên; bị ghi đè thì lại báo", async (t) => {
  await withTx(async (c, { sc }) => {
    const chay = async () => {
      const m = t.mock.method(console, "log", () => {});
      try {
        await runTransformChotot(c);
        return m.mock.calls.map((x) => x.arguments.join(" ")).join("\n");
      } finally {
        m.mock.restore();
      }
    };
    const docId = (id) => docTin(c, mintOfferId("S06", String(id)));
    await themStg(c, { id: 60, tk: 50, so: "+84900000560" });
    await themStg(c, { id: 61, tk: 50 });
    await themStg(c, { id: 62, tk: 50 });

    await veTruoc070(c, sc);
    assert.match(await chay(), /CHUA-AP-070/, "SG-AC-5 chưa có cột phải báo tên");
    assert.equal((await docId(60)).seller_phone, "+84900000560", "SG-AC-5 chưa có cột vẫn phải ghi số trực tiếp");
    assert.equal((await docId(61)).seller_phone, null, "SG-AC-5 chưa có cột mà ghi số ghép");

    await c.query(MIG_070);
    assert.doesNotMatch(await chay(), /CHUA-AP-070/, "SG-AC-5 có cột mà vẫn báo");
    assert.equal((await docId(61)).seller_phone, "+84900000560", "SG-AC-5 có cột phải ghi số ghép");
    assert.equal((await docId(61)).field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan", "SG-AC-5 sai dấu ghép");

    await veTruoc070(c, sc);
    await themStg(c, { id: 63, tk: 50 });
    assert.match(await chay(), /CHUA-AP-070/, "SG-AC-5 view bị ghi đè phải báo lại");
    assert.equal((await docId(63)).seller_phone, null, "SG-AC-5 view bị ghi đè mà ghi số ghép mới");
    assert.equal((await docId(61)).seller_phone, "+84900000560", "SG-AC-5 view bị ghi đè làm mất số đã ghép");
  });
});

const SO_DAT = { so_ghep_ra_so: 0, so_ghep_ra_so_neu_bo_nhanh: 40, bi_danh_moi: 5, so_truc_tiep: 6, nhan_ban: 30, nhan_thue: 10, tin_khong_dau: 40 };

test("SG-AC-9 bất biến: bộ số đạt thì sạch, mỗi đột biến đỏ đúng khoá", () => {
  assert.deepEqual(kiemBatBienSoGhep(SO_DAT), []);
  const CA = [
    [{ so_ghep_ra_so: 1 }, "so_ghep_ra_so"],
    [{ so_ghep_ra_so_neu_bo_nhanh: 0 }, "so_ghep_ra_so_neu_bo_nhanh"],
    [{ bi_danh_moi: 0 }, "bi_danh_moi"],
    [{ bi_danh_moi: 7 }, "bi_danh_moi"],
    [{ nhan_ban: 29 }, "tong_nhan"],
    [{ nhan_ban: 0, nhan_thue: 0, tin_khong_dau: 0 }, "tong_nhan"],
  ];
  for (const [doi, khoa] of CA) assert.deepEqual(kiemBatBienSoGhep({ ...SO_DAT, ...doi }), [khoa], khoa);
});

test("SG-AC-9 lệnh từ chối DB dùng chung và thoát 2 trước khi nối DB", () => {
  assert.ok(tuChoiDb("oneinvest"));
  assert.equal(tuChoiDb("oneinvest_sg"), null);
  const lenh = join(dirname(fileURLToPath(import.meta.url)), "../do-so-ghep-s06.mjs");
  const r = spawnSync(process.execPath, [lenh], { env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:1/oneinvest" }, encoding: "utf8" });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /không phải DB thử/);
});

/** Giao dịch của ca do withTx giữ, nên BEGIN và COMMIT của phần đo không được đóng nó. */
const trongGiaoDich = (c) => ({ query: (q, ...a) => (q === "BEGIN" || q === "COMMIT" ? Promise.resolve({ rows: [] }) : c.query(q, ...a)) });

test("SG-AC-9 phần đo chạy thật: dữ liệu đạt trả 0, chạy lại không có bí danh mới thì bất biến sai và trả 1", async () => {
  await withTx(async (c) => {
    await themTin(c, { id: 201, tk: 20 });
    await themStg(c, { id: 201, tk: 20, so: "+84900000201" });
    await themTin(c, { id: 202, tk: 20 });
    await themStg(c, { id: 202, tk: 20 });
    const chay = async () => {
      const kq = { out: [], err: [] };
      kq.ma = await doTrenDb(trongGiaoDich(c), { out: (l) => kq.out.push(l), err: (l) => kq.err.push(l) });
      return kq;
    };
    const lan1 = await chay();
    assert.equal(lan1.ma, 0, `SG-AC-9 dữ liệu đạt phải trả 0: ${lan1.err.join(" ")}`);
    assert.ok(lan1.out.some((l) => l.includes("bi_danh truoc=0 sau=1")), `SG-AC-9 thiếu dòng số: ${lan1.out.join(" | ")}`);
    for (const l of lan1.out) assert.doesNotMatch(l, MAU_SO, "SG-AC-9 dòng in có số");
    const lan2 = await chay();
    assert.equal(lan2.ma, 1, "SG-AC-9 bất biến sai phải trả 1");
    assert.deepEqual(lan2.err, ["BẤT BIẾN SAI: bi_danh_moi"]);
  });
});

test("fixture không ghi đè hàm phân xử của public: 068 áp lên bản riêng", async () => {
  await withTx(async (c, { sc }) => {
    const { rows } = await c.query(
      `SELECT n.nspname AS luoc_do, pg_get_functiondef(p.oid) LIKE '%fp_sdt%' AS co_phan_giu
         FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.oid = to_regprocedure('resolve_offer_fields(text[])')`);
    assert.deepEqual(rows[0], { luoc_do: sc, co_phan_giu: true });
    const { rows: pub } = await c.query(
      `SELECT xmin::text = pg_current_xact_id()::text AS giao_dich_nay_ghi
         FROM pg_proc WHERE oid = 'public.resolve_offer_fields(text[])'::regprocedure`);
    assert.equal(pub[0].giao_dich_nay_ghi, false, "giao dịch test đã ghi đè hàm public, sẽ deadlock với bộ test đang nạp 061");
  });
});

test("SG-AC-9 mọi giá trị in đi qua chặn số: mang dạng số thì veDong ném, số đếm thì không", () => {
  const moc = { bi_danh: 1, nguoi: 1, nguoi_khong_tin: 1, sellers: 1, nhan_ban: 1, nhan_thue: 1 };
  const nhanh = { so_ghep_ra_so: 0, so_ghep_ra_so_neu_bo_nhanh: 1, so_truc_tiep: 1, tin_khong_dau: 1 };
  assert.doesNotThrow(() => veDong(moc, moc, nhanh));
  for (const dang of ["+84900000999", "0900000999"]) {
    for (const khoa of Object.keys(moc)) assert.throws(() => veDong(moc, { ...moc, [khoa]: dang }, nhanh), /RO-SO/, `SG-AC-9 ${khoa} lọt chặn số`);
    for (const khoa of Object.keys(nhanh)) assert.throws(() => veDong(moc, moc, { ...nhanh, [khoa]: dang }), /RO-SO/, `SG-AC-9 ${khoa} lọt chặn số`);
  }
});

test("SG-AC-9 trên fixture: nhánh chặn số ghép, bỏ nhánh thì ra số, dòng in không có số", async () => {
  await withTx(async (c) => {
    await dungMaTran(c);
    const truoc = await docMoc(c);
    await dungNguoi(c, yen);
    const sau = await docMoc(c);
    const nhanh = await docNhanhSoGhep(c);
    // Tin 102 ghép, 103 mất dấu; tin 101 trực tiếp.
    assert.equal(nhanh.so_ghep_ra_so, 0);
    assert.equal(nhanh.so_ghep_ra_so_neu_bo_nhanh, 2);
    assert.equal(nhanh.so_truc_tiep, 1);
    assert.equal(nhanh.tin_khong_dau, 2);
    assert.equal(sau.bi_danh - truoc.bi_danh, 1);
    assert.equal(sau.nhan_ban, 2);
    assert.deepEqual(kiemBatBienSoGhep({ ...sau, ...nhanh, bi_danh_moi: sau.bi_danh - truoc.bi_danh }), []);
    for (const dong of veDong(truoc, sau, nhanh)) assert.doesNotMatch(dong, MAU_SO, "SG-AC-9 dòng in có số");
    // Đối chứng cùng fixture: một số ghép bị đóng dấu trực tiếp thì đếm lệch nhãn.
    await c.query(`UPDATE sale_offer_records SET field_provenance = jsonb_build_object('seller_phone', $1::jsonb) WHERE offer_id = '102'`, [JSON.stringify(TRUC)]);
    assert.equal((await docNhanhSoGhep(c)).tin_khong_dau, 1, "SG-AC-9 phép đếm không thấy tin đổi dấu");
  });
});

test("SG-AC-10 kiểm DQ so-chua-xac-minh: skip khi chưa có cột, pass có số trực tiếp, fail khi dấu mất hàng loạt", async () => {
  const tep = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../sql/450_dq_checks.sql"), "utf8");
  const dau = tep.indexOf("INSERT INTO dq_check_results", tep.indexOf("-- Nhãn số chưa xác minh"));
  const cau = tep.slice(dau, tep.indexOf(";", dau) + 1).replace(/^INSERT INTO dq_check_results \(check_name, entity, status, detail\)\n/, "");
  assert.match(cau, /'so-chua-xac-minh'/, "không cắt được câu kiểm");
  const chay = async (c) => (await c.query(cau)).rows[0];
  await withTx(async (c, { sc }) => {
    await dungMaTran(c);
    const dat = await chay(c);
    assert.equal(dat.status, "pass", dat.detail);
    assert.match(dat.detail, /S06 có số: 3, chưa xác minh: 2, nguồn khác có nhãn: 0/);
    // Chiều đỏ trên cùng fixture: mất mọi dấu thì mọi số S06 mang nhãn.
    await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance - 'seller_phone' WHERE source = 'S06'`);
    assert.equal((await chay(c)).status, "fail");
    // View chưa có cột: dựng lại view bỏ cột, kiểm phải ra skip chứ không lỗi.
    await c.query(`DROP VIEW ${sc}.sellers, ${sc}.sale_offers`);
    await c.query(`CREATE VIEW ${sc}.sale_offers AS SELECT offer_id, source, seller_phone FROM ${sc}.sale_offer_records WHERE retired_at IS NULL`);
    assert.equal((await chay(c)).status, "skip");
  });
});
