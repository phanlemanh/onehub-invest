// so-ghep-s06.test.mjs — hồ sơ so-ghep-s06-nhan-danh-ba: số S06 chỉ vào danh bạ khi có dấu trực tiếp, số còn lại mang nhãn.
// Ca DB chạy BEGIN…ROLLBACK trên Postgres local :5433, mỗi ca một lược đồ riêng; không chạm public. Mọi SĐT là số bịa.
// Mỗi phép đo có ca đỏ trên cùng fixture, ghim thông điệp.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { ganSdtS06 } from "../gan-sdt-s06.mjs";
import { coBangChungSdt, dungNguoi, RULE_TRUC_TIEP, rutDinhDanh, sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { luocDoRieng } from "../lib/luoc-do-rieng.mjs";
import { nap068 } from "../lib/nap-068.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const BANG = ["stg_chotot_ads", "stg_zalo_posts", "sale_offer_records", "field_assertions", "ops_audit",
  "parties", "registry_aliases", "registry_events", "party_roles"];

/** View của public dựng lại trong lược đồ riêng: lấy định nghĩa khi search_path chỉ có public để tên bảng không gắn lược đồ. */
async function chepView(c, sc, ten) {
  await c.query("SET LOCAL search_path = public");
  const { rows } = await c.query("SELECT pg_get_viewdef($1::regclass) AS d", [`public.${ten}`]);
  await c.query(`SET LOCAL search_path = ${sc}, public`);
  await c.query(`CREATE VIEW ${sc}.${ten} AS ${rows[0].d}`);
}

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    const sc = await luocDoRieng(c, BANG, { tienTo: "sg" });
    await chepView(c, sc, "sale_offers");
    await chepView(c, sc, "sellers");
    await nap068(c);
    return await fn(c, { sc });
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const yen = { out: () => {} };

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
    await dungNguoi(c, yen);

    const docSeller = async (phone) => (await c.query(
      `SELECT s.n_ads FROM sellers s JOIN sale_offers o ON o.seller_phone_hash = s.phone_hash WHERE o.seller_phone = $1 LIMIT 1`, [phone])).rows;
    assert.deepEqual((await docSeller("+84900000201")).map((r) => r.n_ads), [2], "SG-AC-3 số A phải một dòng, n_ads gồm cả tin ghép");
    assert.deepEqual(await docSeller("+84900000211"), [], "SG-AC-3 số B không được có dòng");
    assert.deepEqual(await sellersThieuNguoi(c), [], "SG-AC-3 số ghép bị báo thiếu");

    // Đối chứng dương: số trực tiếp chưa có bí danh vẫn bị báo, cùng fixture.
    await themTin(c, { id: 212, tk: 22 });
    await themStg(c, { id: 212, tk: 22, so: "+84900000212" });
    await ganSdtS06(c);
    const thieu = await sellersThieuNguoi(c);
    assert.equal(thieu.length, 1, `SG-AC-3 số trực tiếp thiếu bí danh phải bị báo: ${thieu.join(", ")}`);
    assert.ok(thieu[0].endsWith(":S06"), `SG-AC-3 báo sai nguồn: ${thieu[0]}`);
  });
});
