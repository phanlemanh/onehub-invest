// gan-sdt-s06.test.mjs — hồ sơ sdt-s06-ghep-tai-khoan: SĐT S06 từ stg lên tin rao, ghép theo tài khoản có đúng một số.
// Ca DB chạy BEGIN…ROLLBACK trên Postgres local :5433, mỗi ca một lược đồ riêng (bản rỗng các bảng + bản chép hàm phân xử —
// lib/luoc-do-rieng.mjs): không chạm public, không để lại dòng nào. Mọi SĐT trong tệp này là số bịa. Mỗi phép đo có chiều đỏ
// trên cùng fixture, ghim thông điệp.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { createHash } from "node:crypto";

import { demDocLap, doSdtS06, ganSdtS06, inKhongSo, kiemBatBien, md5Sdt, SQL_GAN } from "../gan-sdt-s06.mjs";
import { resolveOffers, writeAssertions } from "../lib/assert.mjs";
import { luocDoRieng } from "../lib/luoc-do-rieng.mjs";
import { daCoPhanGiu068, MIG_068, nap068 } from "../lib/nap-068.mjs";
import { nap070 } from "../lib/nap-070.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dongGan } from "../gan-sdt-s06.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const BANG = ["stg_chotot_ads", "sale_offer_records", "field_assertions", "ops_audit"];
const MOC_1 = "field_provenance -> 'offer_status' AS fp_chao";
const MOC_2 = "ELSE jsonb_build_object('offer_status', max(o.fp_chao::text)::jsonb) END AS field_provenance";
const CHEN_1 = ", field_provenance -> 'seller_phone' AS fp_sdt";
const CHEN_2 = "\n             || CASE WHEN max(o.fp_sdt::text) IS NULL THEN '{}'::jsonb\n                     ELSE jsonb_build_object('seller_phone', max(o.fp_sdt::text)::jsonb) END";
// 099 (phuong-tu-du-an) chèn sau 068 cạnh cùng các mốc: phần chèn ở «END AS field_provenance» nằm giữa phần của 068 và
// « AS field_provenance», nên phải gỡ trước thì mốc 2 của 068 mới hiện lại. Rút nguyên văn từ tệp 099 (không chép), DB chưa áp
// 099 thì replace không đổi gì.
const MIG_099 = readFileSync(join(import.meta.dirname, "../../db/migrations/099_phuong_tu_du_an.sql"), "utf8");
const CHEN_099 = [
  MIG_099.match(/moc_1 \|\| \$m\$(, field_provenance -> 'area_id' AS fp_area)\$m\$/)?.[1],
  MIG_099.match(/replace\(dinh_nghia, moc_2, \$m\$END([\s\S]*?) AS field_provenance\$m\$\)/)?.[1],
];
assert.ok(CHEN_099.every(Boolean), "gan-sdt-s06: không rút được phần chèn của 099");

/** Định nghĩa hàm phân xử đang chạy ở public, đổi tên lược đồ, gỡ phần giữ của 068 nếu DB này đã áp. */
async function hamTruoc068(c, sc) {
  const { rows } = await c.query(`SELECT pg_get_functiondef(to_regprocedure('public.resolve_offer_fields(text[])')) AS d`);
  return rows[0].d.replace("public.resolve_offer_fields", `${sc}.resolve_offer_fields`)
    .replace(CHEN_099[0], "").replace(CHEN_099[1], "")
    .replace(CHEN_1, "").replace(CHEN_2, "");
}

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    const sc = await luocDoRieng(c, BANG, { tienTo: "gs" });
    await c.query(`INSERT INTO ops_audit (actor, action) VALUES ('test', 'phat-bieu:cat-chuyen')`);
    const truoc068 = await hamTruoc068(c, sc);
    await c.query(truoc068);
    await nap070(c);
    return await fn(c, { sc, truoc068 });
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const SO_THU = "+84900000001";
const PROV_GHEP = { tier: "observed", method: "e1_rule", rule_id: "s06-cung-tai-khoan", tu_tin: 1, measured: false };

/** Tin S06 tối thiểu; `fp` là field_provenance ban đầu. */
async function themTin(c, { id, osk = id, source = "S06", kind = "sale", fp = {}, so = null, hash = null, retired = false }) {
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, originating_system_key, field_provenance,
                                     seller_phone, seller_phone_hash, retired_at)
     VALUES ($1, $2, now(), now(), $3, $4, $5, $6, $7, ${retired ? "now()" : "NULL"})`,
    [String(id), kind, source, String(osk), JSON.stringify(fp), so, hash]);
}

const docTin = async (c, id) => (await c.query(`SELECT * FROM sale_offer_records WHERE offer_id = $1`, [String(id)])).rows[0];

/** Dấu mọi dòng tin: 068 chỉ đổi hàm, không được đổi dòng nào. */
const dauDong = async (c) => (await c.query(
  `SELECT md5(string_agg(t::text, '|' ORDER BY t.offer_id)) AS m FROM sale_offer_records t`)).rows[0].m;

function kiemGiuKhoa(tin) {
  assert.ok(tin.field_provenance.seller_phone, `MAT-NGUON-GOC-SDT ${tin.offer_id}`);
  assert.ok(tin.field_provenance.offer_status, `MAT-NGUON-GOC-SDT offer_status ${tin.offer_id}`);
}

/** Fixture AC-1: tin 1 có khoá SĐT + offer_status + một phát biểu phòng ngủ; tin 2 không có khoá SĐT. */
async function fixtureGiuKhoa(c) {
  const chao = { tier: "fact", method: "source_field" };
  await themTin(c, { id: 1, fp: { seller_phone: PROV_GHEP, offer_status: chao }, so: SO_THU, hash: "h" });
  await themTin(c, { id: 2, fp: { offer_status: chao } });
  const chung = { evidence_tier: "fact", method: "source_field", method_version: "test", observed_at: new Date() };
  await writeAssertions(c, [
    { ...chung, subject_key: "S06:1", field: "bedrooms", value: "2", rule_id: "rooms" },
    { ...chung, subject_key: "S06:2", field: "bedrooms", value: "3", rule_id: "rooms" },
  ]);
}

const boKhoaSdt = (fp) => { const { seller_phone: _b, ...con } = fp; return con; };

test("GS-AC-1 (068) giữ khoá SĐT qua phân xử, áp hai lần không đổi dòng nào", async () => {
  await withTx(async (c) => {
    await fixtureGiuKhoa(c);
    assert.equal(await daCoPhanGiu068(c), false, "GS-AC-1 tiền đề: chưa áp 068");

    // Bản trước 068 trên cùng tin: khoá khác và cột phát biểu dùng làm mốc so.
    await c.query("SAVEPOINT truoc");
    await resolveOffers(c, ["1", "2"]);
    const moc = [await docTin(c, 1), await docTin(c, 2)];
    await c.query("ROLLBACK TO SAVEPOINT truoc");

    const dau = await dauDong(c);
    assert.equal(await nap068(c), true, "GS-AC-1 lần áp đầu");
    assert.equal(await nap068(c), false, "GS-AC-1 lần áp hai bỏ qua");
    await c.query(MIG_068); // chạy thẳng lần nữa: khối DO không được lỗi
    assert.equal(await dauDong(c), dau, "GS-AC-1 068 đổi dòng tin");
    assert.equal(await daCoPhanGiu068(c), true);

    await resolveOffers(c, ["1", "2"]);
    const [t1, t2] = [await docTin(c, 1), await docTin(c, 2)];
    kiemGiuKhoa(t1);
    assert.deepEqual(t1.field_provenance.seller_phone, PROV_GHEP, "GS-AC-1 khoá SĐT đổi");
    assert.equal(t1.seller_phone, SO_THU, "GS-AC-1 số đổi");
    assert.equal("seller_phone" in t2.field_provenance, false, "GS-AC-1 tin không khoá sinh khoá");
    assert.equal(t1.bedrooms, moc[0].bedrooms, "GS-AC-1 cột phát biểu đổi");
    assert.equal(t1.bedrooms, 2);
    assert.deepEqual(boKhoaSdt(t1.field_provenance), boKhoaSdt(moc[0].field_provenance), "GS-AC-1 khoá khác đổi");
    assert.deepEqual(t2.field_provenance, moc[1].field_provenance, "GS-AC-1 tin không khoá đổi");

    const lan2 = await resolveOffers(c, ["1", "2"]);
    assert.equal(lan2.offers_changed, 0, "GS-AC-1 lượt hai đổi dòng");
  });
});

test("GS-AC-1 (068) chiều đỏ: hàm trước 068 làm mất khoá", async () => {
  await withTx(async (c) => {
    await fixtureGiuKhoa(c);
    await resolveOffers(c, ["1", "2"]);
    assert.throws(() => kiemGiuKhoa({ offer_id: "1", field_provenance: { offer_status: {} } }), /MAT-NGUON-GOC-SDT/);
    const t1 = await docTin(c, 1);
    assert.throws(() => kiemGiuKhoa(t1), /MAT-NGUON-GOC-SDT/);
  });
});

test("GS-AC-1 (068) chiều đỏ: mất mốc văn bản thì RAISE có tên", async () => {
  for (const [ten, tu, den] of [
    ["mốc 1", MOC_1, "field_provenance -> 'offer_status'  AS fp_chao"],
    ["mốc 2", MOC_2, MOC_2.replace(" END AS", " END  AS")],
  ]) {
    await withTx(async (c, { truoc068 }) => {
      assert.ok(truoc068.includes(tu), `GS-AC-1 định nghĩa hiện tại không có ${ten}`);
      await c.query(truoc068.replace(tu, den));
      await assert.rejects(() => nap068(c), /MOC-068/, `GS-AC-1 ${ten}`);
    });
  }
});

// ——— Ma trận AC-2: bốn trục, kỳ vọng đọc từ bảng L1–L9 viết tay (hợp đồng), không suy từ mã đang test.
const TRUC = {
  rieng: ["hop_le", "khong", "sai"],
  an: [false, true],
  tk: ["trong", "0", "1", "2"],
  dang: ["trong", "truc_tiep", "ghep", "khong_ro"],
};
const KHONG_HOP_LE = ["khong", "sai"];
const BANG_LUAT = [
  { d: "L1", rieng: ["hop_le"], an: [false, true], tk: ["trong", "1", "2"], dang: ["trong", "truc_tiep", "ghep"], kq: "so_rieng", o: 18 },
  { d: "L2", rieng: ["hop_le"], an: [false, true], tk: ["trong", "1", "2"], dang: ["khong_ro"], kq: "giu", o: 6 },
  { d: "L3", rieng: KHONG_HOP_LE, an: [true], tk: TRUC.tk, dang: ["ghep"], kq: "rut", o: 8 },
  { d: "L4", rieng: KHONG_HOP_LE, an: [true], tk: TRUC.tk, dang: ["trong", "truc_tiep", "khong_ro"], kq: "giu", o: 24 },
  { d: "L5", rieng: KHONG_HOP_LE, an: [false], tk: ["1"], dang: ["trong", "ghep"], kq: "so_tk", o: 4 },
  { d: "L6", rieng: KHONG_HOP_LE, an: [false], tk: ["1"], dang: ["truc_tiep", "khong_ro"], kq: "giu", o: 4 },
  { d: "L7", rieng: KHONG_HOP_LE, an: [false], tk: ["2"], dang: ["ghep"], kq: "rut", o: 2 },
  { d: "L8", rieng: KHONG_HOP_LE, an: [false], tk: ["2"], dang: ["trong", "truc_tiep", "khong_ro"], kq: "giu", o: 6 },
  { d: "L9", rieng: KHONG_HOP_LE, an: [false], tk: ["trong", "0"], dang: TRUC.dang, kq: "giu", o: 16 },
];
const dongLuat = (o) => BANG_LUAT.filter((l) => l.rieng.includes(o.rieng) && l.an.includes(o.an) && l.tk.includes(o.tk) && l.dang.includes(o.dang));

function sinhO() {
  const o = [];
  const gach = [];
  for (const rieng of TRUC.rieng) for (const an of TRUC.an) for (const tk of TRUC.tk) for (const dang of TRUC.dang) {
    (rieng === "hop_le" && tk === "0" ? gach : o).push({ rieng, an, tk, dang });
  }
  return { o, gach };
}

const bam = (so) => createHash("sha256").update(so).digest("hex").slice(0, 32);
let demSo = 0;
const soBia = () => `+849${String(++demSo).padStart(8, "0")}`;
const SAI_DANG = "0912345678"; // đủ mười chữ số nhưng không phải E.164
const PROV_TRUC_TIEP = { tier: "fact", method: "source_field", rule_id: "s06-so-tren-tin", measured: false };

async function themStg(c, { id, tk, so, an }) {
  const payload = {};
  if (tk !== undefined) payload.account_id = tk;
  if (an !== undefined) payload.phone_hidden = an;
  await c.query(
    `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, seller, price, size_m2)
     VALUES ($1, 1, 'x', 1010, 's', $2, 'gs', $3, 1000000000, 50)`,
    [id, JSON.stringify(payload), JSON.stringify(so === undefined ? { full_name: "Người bán thử" } : { full_name: "Người bán thử", phone: so })]);
}

/** Một ô: tin chính + dòng stg phụ mang số của tài khoản; giá trị đang có theo trục dang. Trả ô kèm số mong đợi. */
async function dungO(c, o, base) {
  const taiKhoan = o.tk === "trong" ? undefined : `tk${base}`;
  const soRieng = o.rieng === "hop_le" ? soBia() : o.rieng === "sai" ? SAI_DANG : undefined;
  let phu = [];
  if (o.tk === "1" && o.rieng !== "hop_le") phu = [soBia()];
  if (o.tk === "2") phu = o.rieng === "hop_le" ? [soBia()] : [soBia(), soBia()];
  await themStg(c, { id: base, tk: taiKhoan, so: soRieng, an: o.an ? true : undefined });
  for (const [i, so] of phu.entries()) await themStg(c, { id: base + 1 + i, tk: taiKhoan, so });
  const cu = o.dang === "trong" ? null : soBia();
  const fp = o.dang === "truc_tiep" ? { seller_phone: PROV_TRUC_TIEP }
    : o.dang === "ghep" ? { seller_phone: { ...PROV_GHEP, tu_tin: 0 } } : {};
  await themTin(c, { id: base, fp, so: cu, hash: cu && bam(cu) });
  return { ...o, base, soRieng, phu, cu, taiKhoan };
}

async function dungMaTran(c) {
  const { o } = sinhO();
  const ds = [];
  for (const [i, x] of o.entries()) ds.push(await dungO(c, x, 1000 + i * 10));
  return ds;
}

/** Kiểm từng ô theo bảng luật. Lỗi nhóm nặng ghim mã riêng để chiều đỏ đo đúng bất biến, không chỉ «khác kỳ vọng». */
async function kiemMaTran(c, ds) {
  for (const o of ds) {
    const t = await docTin(c, o.base);
    const khoa = t.field_provenance.seller_phone;
    const ten = `${o.rieng}/${o.an ? "an" : "hien"}/${o.tk}/${o.dang}`;
    if (o.rieng !== "hop_le") {
      assert.notEqual(t.seller_phone, SAI_DANG, `SAI-E164-VAO-TIN ${ten}`);
      assert.ok(!(o.an && khoa?.rule_id === "s06-cung-tai-khoan"), `AN-SO-BI-GHEP ${ten}`);
      assert.ok(!(o.tk === "2" && khoa?.rule_id === "s06-cung-tai-khoan"), `HAI-SO-BI-GHEP ${ten}`);
    }
    const [luat] = dongLuat(o);
    if (luat.kq === "so_rieng") {
      assert.equal(t.seller_phone, o.soRieng, `O-LECH số ${luat.d} ${ten}`);
      assert.deepEqual(khoa, PROV_TRUC_TIEP, `O-LECH xuất xứ ${luat.d} ${ten}`);
    } else if (luat.kq === "so_tk") {
      assert.equal(t.seller_phone, o.phu[0], `O-LECH số ${luat.d} ${ten}`);
      assert.deepEqual(khoa, { ...PROV_GHEP, tu_tin: o.base + 1 }, `TU-TIN-LECH ${luat.d} ${ten}`);
      const nguon = (await c.query(`SELECT seller->>'phone' AS so, payload->>'account_id' AS tk FROM stg_chotot_ads WHERE list_id = $1`, [khoa.tu_tin])).rows[0];
      assert.equal(nguon?.so, t.seller_phone, `TU-TIN-LECH số ${ten}`);
      assert.equal(nguon?.tk, o.taiKhoan, `TU-TIN-LECH tài khoản ${ten}`);
    } else if (luat.kq === "rut") {
      assert.equal(t.seller_phone, null, `O-LECH còn số ${luat.d} ${ten}`);
      assert.equal(t.seller_phone_hash, null, `O-LECH còn băm ${luat.d} ${ten}`);
      assert.equal(khoa, undefined, `O-LECH còn khoá ${luat.d} ${ten}`);
    } else {
      assert.equal(t.seller_phone, o.cu, `O-LECH đổi số ${luat.d} ${ten}`);
      if (o.dang === "khong_ro" || o.dang === "trong") assert.equal(khoa, undefined, `O-LECH sinh khoá ${luat.d} ${ten}`);
      else assert.equal(khoa?.rule_id, o.dang === "truc_tiep" ? "s06-so-tren-tin" : "s06-cung-tai-khoan", `O-LECH đổi khoá ${luat.d} ${ten}`);
    }
    assert.equal(t.seller_phone_hash, t.seller_phone && bam(t.seller_phone), `O-LECH băm ${ten}`);
  }
}

function dotBien(tu, den) {
  assert.ok(SQL_GAN.includes(tu), `đột biến không khớp câu SQL: ${tu}`);
  return SQL_GAN.replace(tu, den);
}

test("GS-AC-2 ma trận đúng 88 ô, mỗi ô đúng một dòng luật", () => {
  const { o, gach } = sinhO();
  assert.equal(o.length, 88, "GS-AC-2 số ô");
  assert.equal(gach.length, 8, "GS-AC-2 số ô gạch");
  assert.ok(gach.every((x) => x.rieng === "hop_le" && x.tk === "0"), "GS-AC-2 ô gạch");
  for (const x of o) assert.equal(dongLuat(x).length, 1, `GS-AC-2 ô ${JSON.stringify(x)}`);
  for (const l of BANG_LUAT) assert.equal(o.filter((x) => dongLuat(x)[0] === l).length, l.o, `GS-AC-2 số ô ${l.d}`);
});

test("GS-AC-2 bộ gán đúng cả 88 ô, chạy lại đổi 0 dòng", async () => {
  await withTx(async (c) => {
    const ds = await dungMaTran(c);
    await nap068(c);
    const r = await ganSdtS06(c);
    assert.equal(r.bo_qua, null);
    assert.ok(r.doi > 0 && r.ghep > 0 && r.truc_tiep > 0 && r.rut > 0, "GS-AC-2 có đủ ba việc");
    await kiemMaTran(c, ds);
    assert.equal((await ganSdtS06(c)).doi, 0, "GS-AC-2 chạy lại đổi dòng");
  });
});

for (const [ma, tu, den] of [
  ["AN-SO-BI-GHEP", "WHEN m.an AND m.lop = 'ghep' THEN 'rut'\n", "\n"],
  ["AN-SO-BI-GHEP", "WHEN m.an THEN 'giu'\n", "\n"],
  ["HAI-SO-BI-GHEP", "WHEN m.n = 1 AND m.lop IN ('trong', 'ghep') THEN 'ghep'", "WHEN m.n >= 1 AND m.lop IN ('trong', 'ghep') THEN 'ghep'"],
  ["TU-TIN-LECH", "min(d.list_id) AS tu_tin", "(SELECT max(list_id) FROM stg_chotot_ads) AS tu_tin"],
  ["SAI-E164-VAO-TIN", "CASE WHEN tho ~ '^\\+84[35789][0-9]{8}$' THEN tho END AS so", "tho AS so"],
]) {
  test(`GS-AC-2 chiều đỏ: ${ma} qua «${tu.trim().slice(0, 40)}»`, async () => {
    await withTx(async (c) => {
      const ds = await dungMaTran(c);
      await nap068(c);
      await ganSdtS06(c, { sql: dotBien(tu, den) });
      await assert.rejects(() => kiemMaTran(c, ds), new RegExp(ma));
    });
  });
}

/** Fixture AC-3: tài khoản A có một số ở tin 10; tin 11 sẽ nhận số ghép; tin 12 có số trực tiếp sẵn (số của chính nó trong
 * stg đã mất); tin 13 có số không rõ gốc. */
async function fixtureRut(c) {
  const so = soBia();
  const [soCuTrucTiep, soKhongRo] = [soBia(), soBia()];
  await themStg(c, { id: 10, tk: "A", so });
  await themStg(c, { id: 11, tk: "A" });
  await themStg(c, { id: 12, tk: "A" });
  await themStg(c, { id: 13, tk: "A" });
  await themTin(c, { id: 10 });
  await themTin(c, { id: 11 });
  await themTin(c, { id: 12, fp: { seller_phone: PROV_TRUC_TIEP }, so: soCuTrucTiep, hash: bam(soCuTrucTiep) });
  await themTin(c, { id: 13, so: soKhongRo, hash: bam(soKhongRo) });
  return { so, soCuTrucTiep, soKhongRo };
}

const BIEN_DOI_RUT = {
  a: ["GS-AC-3a chuyển ẩn số", "CON-SO-GHEP-SAU-AN", "WHEN m.an AND m.lop = 'ghep' THEN 'rut'",
    (c) => c.query(`UPDATE stg_chotot_ads SET payload = payload || '{"phone_hidden": true}' WHERE list_id = ANY ('{11,12,13}')`)],
  b: ["GS-AC-3b thêm số thứ hai", "CON-SO-GHEP-HAI-SO", "WHEN m.n >= 2 AND m.lop = 'ghep' THEN 'rut'",
    (c) => themStg(c, { id: 14, tk: "A", so: soBia() })],
};

async function kiemRut(c, f, ma) {
  const t11 = await docTin(c, 11);
  assert.equal(t11.seller_phone, null, `${ma} còn số`);
  assert.equal(t11.seller_phone_hash, null, `${ma} còn băm`);
  assert.equal(t11.field_provenance.seller_phone, undefined, `${ma} còn khoá`);
  const [t12, t13] = [await docTin(c, 12), await docTin(c, 13)];
  assert.equal(t12.seller_phone, f.soCuTrucTiep, "số trực tiếp bị rút");
  assert.deepEqual(t12.field_provenance.seller_phone, PROV_TRUC_TIEP, "khoá trực tiếp bị rút");
  assert.equal(t13.seller_phone, f.soKhongRo, "số không rõ gốc bị rút");
}

for (const [ten, ma, cau, bienDoi] of Object.values(BIEN_DOI_RUT)) {
  test(ten, async () => {
    await withTx(async (c) => {
      const f = await fixtureRut(c);
      await nap068(c);
      await ganSdtS06(c);
      assert.equal((await docTin(c, 11)).seller_phone, f.so, `${ten} lượt một có số ghép`);
      await bienDoi(c);
      const r = await ganSdtS06(c);
      assert.equal(r.rut, 1, `${ten} rút đúng một tin`);
      await kiemRut(c, f, ma);
    });
  });
  test(`${ten} chiều đỏ: bỏ bước rút`, async () => {
    await withTx(async (c) => {
      const f = await fixtureRut(c);
      await nap068(c);
      await ganSdtS06(c);
      await bienDoi(c);
      await ganSdtS06(c, { sql: dotBien(cau, cau.replace("'rut'", "'giu'")) });
      await assert.rejects(() => kiemRut(c, f, ma), new RegExp(ma));
    });
  });
}

/** AC-5: tài khoản một số đúng cộng một số sai dạng vẫn đếm một số, tin không số nhận số đúng. */
async function fixtureSai(c) {
  const so = soBia();
  await themStg(c, { id: 20, tk: "S", so });
  await themStg(c, { id: 21, tk: "S", so: SAI_DANG });
  await themStg(c, { id: 22, tk: "S" });
  for (const id of [20, 21, 22]) await themTin(c, { id });
  return so;
}

test("GS-AC-5 số sai dạng không vào tin, không tính vào tài khoản, được đếm; băm khớp node:crypto", async () => {
  await withTx(async (c) => {
    const so = await fixtureSai(c);
    await nap068(c);
    const r = await ganSdtS06(c);
    assert.equal(r.sai_e164, 1, "GS-AC-5 đếm số sai");
    assert.equal(r.tai_khoan_hai_so, 0, "GS-AC-5 số sai bị tính là số thứ hai");
    for (const id of [21, 22]) {
      const t = await docTin(c, id);
      assert.equal(t.seller_phone, so, `SAI-E164-VAO-TIN tin ${id}`);
      assert.equal(t.seller_phone_hash, bam(so), `GS-AC-5 băm tin ${id}`);
      assert.equal(t.field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan");
    }
  });
});

test("GS-AC-5 chiều đỏ: bỏ lọc dạng thì số sai vào tin", async () => {
  await withTx(async (c) => {
    await fixtureSai(c);
    await nap068(c);
    await ganSdtS06(c, { sql: dotBien("CASE WHEN tho ~ '^\\+84[35789][0-9]{8}$' THEN tho END AS so", "tho AS so") });
    const t = await docTin(c, 21);
    assert.throws(() => assert.notEqual(t.seller_phone, SAI_DANG, "SAI-E164-VAO-TIN"), /SAI-E164-VAO-TIN/);
  });
});

async function fixtureNguon(c) {
  const so = soBia();
  await themStg(c, { id: 30, tk: "N", so });
  await themTin(c, { id: "s03_30", osk: 30, source: "S03" });
  await themTin(c, { id: 30 });
  await themStg(c, { id: 31, tk: "N" });
  await themTin(c, { id: 31, kind: "rent_lt", retired: true });
  return so;
}

const kiemNguonKhac = (t) => assert.equal(t.seller_phone, null, `DUNG-NGUON-KHAC ${t.offer_id}`);

test("GS-AC-7 tin nguồn khác không đổi, tin đã nghỉ vẫn được gán", async () => {
  await withTx(async (c) => {
    const so = await fixtureNguon(c);
    await nap068(c);
    await ganSdtS06(c);
    const s03 = await docTin(c, "s03_30");
    kiemNguonKhac(s03);
    assert.deepEqual(s03.field_provenance, {}, "DUNG-NGUON-KHAC khoá");
    assert.equal((await docTin(c, 30)).seller_phone, so, "GS-AC-7 tin sống");
    assert.equal((await docTin(c, 31)).seller_phone, so, "GS-AC-7 tin nghỉ");
  });
});

test("GS-AC-7 chiều đỏ: bỏ lọc nguồn thì chạm tin S03", async () => {
  await withTx(async (c) => {
    await fixtureNguon(c);
    await nap068(c);
    await ganSdtS06(c, { sql: dotBien("r.source = 'S06' AND ", "") });
    const s03 = await docTin(c, "s03_30");
    assert.throws(() => kiemNguonKhac(s03), /DUNG-NGUON-KHAC/);
  });
});

// ——— Review Focus của kế hoạch: năm loại đầu vào hợp đồng không nói thẳng.
test("GS-RF nhiều tin cùng một số vẫn là một số; số dạng 0 không thành số thứ hai", async () => {
  await withTx(async (c) => {
    const so = soBia();
    await themStg(c, { id: 40, tk: "R1", so });
    await themStg(c, { id: 41, tk: "R1", so });
    await themStg(c, { id: 42, tk: "R1", so: `0${so.slice(3)}` });
    await themStg(c, { id: 43, tk: "R1" });
    for (const id of [40, 41, 42, 43]) await themTin(c, { id });
    await nap068(c);
    const r = await ganSdtS06(c);
    assert.equal(r.tai_khoan_hai_so, 0, "GS-RF đếm hai số");
    assert.equal(r.sai_e164, 1, "GS-RF số dạng 0 phải là sai dạng");
    for (const id of [42, 43]) assert.equal((await docTin(c, id)).seller_phone, so, `GS-RF tin ${id}`);
  });
});

test("GS-RF dòng stg không có tin vẫn góp số; tu_tin nhỏ nhất theo số, không theo chữ", async () => {
  await withTx(async (c) => {
    const so = soBia();
    await themStg(c, { id: 9, tk: "R2", so });   // không có tin canonical
    await themStg(c, { id: 10, tk: "R2", so });
    await themStg(c, { id: 11, tk: "R2" });
    await themTin(c, { id: 11 });
    await nap068(c);
    await ganSdtS06(c);
    const t = await docTin(c, 11);
    assert.equal(t.seller_phone, so, "GS-RF số từ dòng không có tin");
    assert.equal(t.field_provenance.seller_phone.tu_tin, 9, "GS-RF tu_tin");
  });
});

test("GS-RF account_id toàn khoảng trắng là trống mã; phone_hidden dạng chuỗi vẫn là ẩn", async () => {
  await withTx(async (c) => {
    const [so, so2] = [soBia(), soBia()];
    await themStg(c, { id: 50, tk: "   ", so });
    await themStg(c, { id: 51, tk: "   " });
    await themStg(c, { id: 52, tk: "R3", so: so2 });
    await themStg(c, { id: 53, tk: "R3", an: "true" });
    for (const id of [50, 51, 52, 53]) await themTin(c, { id });
    await nap068(c);
    await ganSdtS06(c);
    assert.equal((await docTin(c, 51)).seller_phone, null, "GS-RF khoảng trắng gom nhóm");
    assert.equal((await docTin(c, 53)).seller_phone, null, "GS-RF chuỗi true không tính là ẩn");
  });
});

// ——— Chuỗi qua runTransformChotot thật: tin do transform sinh, số do bộ gán ghi, rồi phân xử.
const dauTin = async (c, ids) => {
  const kq = {};
  for (const id of ids) {
    const t = await docTin(c, mintOfferId("S06", String(id)));
    kq[id] = { so: t.seller_phone, bam: t.seller_phone_hash, khoa: t.field_provenance.seller_phone };
  }
  return kq;
};

/** Một tài khoản: tin 60 có số riêng, tin 61 không số, tin 62 ẩn số. */
async function fixtureChuoi(c) {
  const so = soBia();
  await themStg(c, { id: 60, tk: "C", so });
  await themStg(c, { id: 61, tk: "C" });
  await themStg(c, { id: 62, tk: "C", an: true });
  return so;
}
const xoaSoStg = (c) => c.query(`UPDATE stg_chotot_ads SET seller = seller - 'phone'`);

test("GS-AC-1 tin do bộ gán ghi, qua phân xử giữ khoá, khoá khác giống bản trước 068", async () => {
  await withTx(async (c, { truoc068 }) => {
    await fixtureChuoi(c);
    await c.query("SAVEPOINT truoc");
    await runTransformChotot(c);   // chưa áp 068: bộ gán bỏ qua, chỉ còn phần phân xử
    const id = mintOfferId("S06", "61");
    const moc = await docTin(c, id);
    await c.query("ROLLBACK TO SAVEPOINT truoc");

    await nap068(c);
    await runTransformChotot(c);
    await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance || '{"offer_status": {"tier": "fact"}}'`);
    const lan1 = await resolveOffers(c, null);
    assert.ok(lan1.offers >= 3, "GS-AC-1 có tin");
    const t = await docTin(c, id);
    kiemGiuKhoa(t);
    assert.equal(t.field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan", "GS-AC-1 khoá của bộ gán");
    const { offer_status: _s, ...con } = boKhoaSdt(t.field_provenance);
    // ids là mã dòng phát biểu: dãy số không lùi khi ROLLBACK TO SAVEPOINT, nên so phần còn lại.
    const boIds = (fp) => Object.fromEntries(Object.entries(fp).map(([k, { ids: _i, ...v }]) => [k, v]));
    assert.deepEqual(boIds(con), boIds(moc.field_provenance), "GS-AC-1 khoá khác khác bản trước 068");
    for (const cot of ["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw"]) {
      assert.equal(t[cot], moc[cot], `GS-AC-1 cột ${cot}`);
    }
    assert.equal((await resolveOffers(c, null)).offers_changed, 0, "GS-AC-1 lượt hai đổi dòng");

    // Chiều đỏ cùng fixture: một migration sau ghi đè hàm về bản không phần giữ.
    await c.query(truoc068);
    await resolveOffers(c, null);
    const mat = await docTin(c, id);
    assert.throws(() => kiemGiuKhoa(mat), /MAT-NGUON-GOC-SDT/);
  });
});

test("GS-AC-4 chạy lại đổi 0 dòng; stg mất số thì tin không mất gì", async () => {
  await withTx(async (c) => {
    const so = await fixtureChuoi(c);
    await nap068(c);
    const r1 = await runTransformChotot(c);
    assert.equal(r1.sdt.truc_tiep, 1, "GS-AC-4 lượt một số riêng");
    assert.equal(r1.sdt.ghep, 1, "GS-AC-4 lượt một số ghép");
    const dau = await dauTin(c, [60, 61, 62]);
    assert.equal(dau[60].so, so);
    assert.equal(dau[60].khoa.rule_id, "s06-so-tren-tin");
    assert.equal(dau[61].so, so);
    assert.equal(dau[61].khoa.tu_tin, 60);
    assert.equal(dau[62].so, null, "GS-AC-4 tin ẩn nhận số");

    const r2 = await runTransformChotot(c);
    assert.equal(r2.sdt.doi, 0, "GS-AC-4 chạy lại đổi dòng");
    assert.deepEqual(await dauTin(c, [60, 61, 62]), dau, "GS-AC-4 chạy lại đổi tin");

    await xoaSoStg(c);
    const r3 = await runTransformChotot(c);
    assert.equal(r3.sdt.doi, 0, "GS-AC-4 stg mất số mà vẫn ghi");
    assert.deepEqual(await dauTin(c, [60, 61, 62]), dau, "MAT-SO-KHI-STG-TRONG");
  });
});

test("GS-AC-4 chiều đỏ: gán null khi stg trống thì mất số", async () => {
  await withTx(async (c) => {
    await fixtureChuoi(c);
    await nap068(c);
    await runTransformChotot(c);
    const dau = await dauTin(c, [60, 61, 62]);
    await xoaSoStg(c);
    await ganSdtS06(c, { sql: dotBien("ELSE 'giu' END AS viec", "WHEN m.n IS NULL THEN 'rut' ELSE 'giu' END AS viec") });
    const sau = await dauTin(c, [60, 61, 62]);
    assert.throws(() => assert.deepEqual(sau, dau, "MAT-SO-KHI-STG-TRONG"), /MAT-SO-KHI-STG-TRONG/);
  });
});

test("GS-AC-6 có phần giữ thì tin có số; chưa có thì không ghi, báo tên, không ném", async (t) => {
  const nhat = () => { const m = t.mock.method(console, "log", () => {}); return m; };
  // Hai nhánh cùng fixture, khác nhau đúng một lần áp 068.
  await withTx(async (c) => {
    const so = await fixtureChuoi(c);
    await nap068(c);
    const r = await runTransformChotot(c);
    assert.equal(r.sdt.bo_qua, null, "GS-AC-6 nhánh có 068");
    assert.equal((await docTin(c, mintOfferId("S06", "61"))).seller_phone, so, "GS-AC-6 có số ngay trong lượt");
  });
  await withTx(async (c) => {
    await fixtureChuoi(c);
    const m = nhat();
    const r = await runTransformChotot(c);
    const log = m.mock.calls.map((x) => x.arguments.join(" ")).join("\n");
    m.mock.restore();
    assert.equal(r.sdt.bo_qua, "CHUA-AP-068", "GS-AC-6 nhánh chưa áp");
    assert.match(log, /CHUA-AP-068/, "GS-AC-6 log");
    assert.equal((await c.query(`SELECT count(seller_phone)::int AS n FROM sale_offer_records`)).rows[0].n, 0, "GS-AC-6 vẫn ghi số");
  });
  // Bị migration sau ghi đè: bộ gán thấy mất phần giữ, dừng.
  await withTx(async (c, { truoc068 }) => {
    await fixtureChuoi(c);
    await nap068(c);
    await c.query(truoc068);
    const m = nhat();
    const r = await runTransformChotot(c);
    m.mock.restore();
    assert.equal(r.sdt.bo_qua, "CHUA-AP-068", "GS-AC-6 hàm bị ghi đè");
    assert.equal((await c.query(`SELECT count(seller_phone)::int AS n FROM sale_offer_records`)).rows[0].n, 0, "GS-AC-6 bị ghi đè vẫn ghi số");
  });
});

// ——— Lệnh đo --thu: các hàm của nó trên fixture, chiều đỏ ghim thông điệp. Thước trên dữ liệu thật là eval E8.
const SO_LANH = { an_so_bi_ghep: 0, sai_e164: 0, ghep_lech_tu_tin: 0 };

async function fixtureDo(c) {
  const so = soBia();
  await themStg(c, { id: 70, tk: "D", so });
  await themStg(c, { id: 71, tk: "D" });
  await themStg(c, { id: 72, tk: "D" });
  await themStg(c, { id: 73, tk: "D", an: true });
  await themTin(c, { id: 70 });
  await themTin(c, { id: 71 });
  await themTin(c, { id: 72, kind: "rent_lt", retired: true });
  await themTin(c, { id: 73, kind: "rent_lt" });
  return so;
}

test("GS-AC-7 doSdtS06 tách bán, thuê, sống, nghỉ", async () => {
  await withTx(async (c) => {
    await fixtureDo(c);
    await nap068(c);
    const truoc = await doSdtS06(c);
    assert.deepEqual(truoc.ban, { tin: 2, song: 2, nghi: 0, co_so: 0, co_so_song: 0, co_so_nghi: 0, truc_tiep: 0, ghep: 0 });
    await ganSdtS06(c);
    const sau = await doSdtS06(c);
    assert.deepEqual(sau.ban, { tin: 2, song: 2, nghi: 0, co_so: 2, co_so_song: 2, co_so_nghi: 0, truc_tiep: 1, ghep: 1 });
    assert.deepEqual(sau.thue, { tin: 2, song: 1, nghi: 1, co_so: 1, co_so_song: 0, co_so_nghi: 1, truc_tiep: 0, ghep: 1 });
    for (const k of Object.keys(SO_LANH)) assert.equal(sau[k], 0, `GS-AC-7 ${k}`);
  });
});

test("GS-AC-8 câu đếm độc lập bằng số ghép sau lượt gán, và đúng khi tin đã có số từ trước", async () => {
  await withTx(async (c) => {
    await fixtureDo(c);
    await nap068(c);
    assert.equal(await demDocLap(c), 2, "GS-AC-8 đếm độc lập trước gán");
    await ganSdtS06(c);
    const sau = await doSdtS06(c);
    assert.equal(sau.ban.ghep + sau.thue.ghep, 2, "GS-AC-8 ghép");
    assert.equal(await demDocLap(c), 2, "GS-AC-8 đếm độc lập sau gán");
    await c.query(`UPDATE stg_chotot_ads SET seller = seller - 'phone'`);
    assert.equal(await demDocLap(c), 2, "GS-AC-8 đếm độc lập khi stg mất số");
    assert.deepEqual(kiemBatBien({ ...sau, dem_doc_lap: 2, md5_truoc: "a", md5_sau: "a", da_ap_068: true }), []);
  });
});

test("GS-AC-8 chiều đỏ: bất biến sai thì ra đúng mã", async () => {
  await withTx(async (c) => {
    const so = await fixtureDo(c);
    await nap068(c);
    await ganSdtS06(c);
    const lanh = { ...(await doSdtS06(c)), dem_doc_lap: 2, md5_truoc: "a", md5_sau: "a", da_ap_068: true };
    assert.deepEqual(kiemBatBien(lanh), [], "GS-AC-8 đối chứng dương");
    assert.deepEqual(kiemBatBien({ ...lanh, dem_doc_lap: 3 }), ["DEM-LECH"]);
    assert.deepEqual(kiemBatBien({ ...lanh, md5_sau: "b" }), ["DB-DOI"]);
    assert.deepEqual(kiemBatBien({ ...lanh, ban: { ...lanh.ban, ghep: 0 }, thue: { ...lanh.thue, ghep: 0 }, dem_doc_lap: 0 }), ["KHONG-CO-GHEP"]);
    assert.deepEqual(kiemBatBien({ ...lanh, da_ap_068: false }), ["CHUA-AP-068"]);

    // Vật hỏng thật trên fixture, không phải số sửa tay.
    const md5Truoc = await md5Sdt(c);
    await c.query(`UPDATE sale_offer_records SET seller_phone = $1, seller_phone_hash = $2, field_provenance = field_provenance || $3::jsonb WHERE offer_id = '73'`,
      [so, bam(so), JSON.stringify({ seller_phone: { ...PROV_GHEP, tu_tin: 70 } })]);
    assert.notEqual(await md5Sdt(c), md5Truoc, "GS-AC-8 md5 không đổi khi dòng đổi");
    let hong = await doSdtS06(c);
    assert.equal(hong.an_so_bi_ghep, 1);
    assert.ok(kiemBatBien({ ...hong, dem_doc_lap: hong.ban.ghep + hong.thue.ghep, md5_truoc: "a", md5_sau: "a", da_ap_068: true }).includes("AN-SO-BI-GHEP"));

    await c.query(`UPDATE sale_offer_records SET field_provenance = jsonb_set(field_provenance, '{seller_phone,tu_tin}', '71') WHERE offer_id = '71'`);
    hong = await doSdtS06(c);
    assert.ok(hong.ghep_lech_tu_tin >= 1, "GS-AC-8 tu_tin trỏ dòng không mang số");
    assert.ok(kiemBatBien({ ...hong, dem_doc_lap: hong.ban.ghep + hong.thue.ghep, md5_truoc: "a", md5_sau: "a", da_ap_068: true }).includes("TU-TIN-LECH"));

    await c.query(`UPDATE sale_offer_records SET seller_phone = $1 WHERE offer_id = '70'`, [SAI_DANG]);
    hong = await doSdtS06(c);
    assert.equal(hong.sai_e164, 1);
    assert.ok(kiemBatBien({ ...hong, dem_doc_lap: hong.ban.ghep + hong.thue.ghep, md5_truoc: "a", md5_sau: "a", da_ap_068: true }).includes("SAI-E164-VAO-TIN"));
  });
});

test("GS-AC-8 bộ in chặn SĐT, cho qua số đếm", () => {
  for (const dong of ["so=+84912345678", "so=0912345678", "x 0912345678 y"]) {
    assert.throws(() => inKhongSo(dong), /RO-SO/, dong);
  }
  for (const dong of ["ban truoc=217 sau=4398 tin=20873", "an_so_bi_ghep=0 sai_e164=0", "da_ap_068=true", "md5_khop=true"]) {
    assert.equal(inKhongSo(dong), dong);
  }
});

// ——— Hồ sơ sdt-s06-khoi-phuc-xuat-xu: tin mất khoá xuất xứ, dựng lại từ stg. Kiểm đọc thẳng cột số, không qua khoá; «migration ghi đè» là
// phần resolve_offer_fields trích từ tệp 061 đã commit, chứ không phải bản hàm của bộ test.
const TEP_061 = readFileSync(new URL("../../db/migrations/061_dac_trung_nha.sql", import.meta.url), "utf8");
const GHI_DE_061 = TEP_061.slice(TEP_061.indexOf("CREATE OR REPLACE FUNCTION resolve_offer_fields"), TEP_061.indexOf("-- 5. Sổ từ vựng"));
const ghiDe = (c) => c.query(GHI_DE_061);
const apLai068 = (c) => c.query(MIG_068);
const docOffer = (c, list) => docTin(c, mintOfferId("S06", String(list)));
const chuyenAn = (c, list) => c.query(`UPDATE stg_chotot_ads SET payload = payload || '{"phone_hidden": true}' WHERE list_id = $1`, [list]);
const imLog = (t) => t.mock.method(console, "log", () => {});

/** Bỏ hai nhánh khôi phục: đúng hành vi trước hồ sơ này, dùng cho chiều đỏ. */
const BO_KHOI_PHUC = () => SQL_GAN
  .replace(/\s*WHEN NOT r\.field_provenance \? 'seller_phone' AND r\.seller_phone = d\.so THEN 'truc_tiep'/, "")
  .replace(/\s*WHEN NOT r\.field_provenance \? 'seller_phone' AND r\.seller_phone = ANY \(t\.cac_so\) THEN 'ghep'/, "");

function kiemTinAnMatSo(tin) {
  assert.equal(tin.seller_phone, null, "TIN-AN-GIU-SO-GHEP");
  assert.equal(tin.seller_phone_hash, null, "TIN-AN-GIU-SO-GHEP băm");
  assert.equal(tin.field_provenance.seller_phone, undefined, "TIN-AN-GIU-SO-GHEP khoá");
}

test("KP «ghi đè» là bản hàm thật của tệp 061: chưa có phần giữ nhưng còn hai mốc của 068", () => {
  assert.ok(GHI_DE_061.includes("fp_chao"), "KP-061 thiếu mốc");
  assert.ok(!GHI_DE_061.includes("fp_sdt"), "KP-061 đã có phần giữ");
});

/** Tài khoản K: tin 80 có số riêng; 81, 82 nhận số ghép; bộ gán thật ghi. Trả số và bản xuất xứ gốc. */
async function chuoiCoSo(c) {
  const so = soBia();
  await themStg(c, { id: 80, tk: "K", so });
  await themStg(c, { id: 81, tk: "K" });
  await themStg(c, { id: 82, tk: "K" });
  await nap068(c);
  await runTransformChotot(c);
  const goc = {
    t80: await docOffer(c, 80), t81: await docOffer(c, 81), t82: await docOffer(c, 82),
  };
  assert.equal(goc.t81.seller_phone, so, "KP chuỗi chưa có số ghép");
  assert.equal(goc.t82.field_provenance.seller_phone.rule_id, "s06-cung-tai-khoan", "KP chuỗi chưa có khoá ghép");
  await ghiDe(c);
  await runTransformChotot(c);
  assert.equal((await docOffer(c, 81)).field_provenance.seller_phone, undefined, "KP khoá chưa mất sau lượt bị ghi đè");
  assert.equal((await docOffer(c, 81)).seller_phone, so, "KP số phải còn sau lượt bị ghi đè");
  return { so, goc };
}

for (const [ten, khoiPhuc] of [["KP-AC-1", true], ["KP-AC-1 chiều đỏ: bỏ nhánh khôi phục", false]]) {
  test(ten, async (t) => {
    const m = imLog(t);
    await withTx(async (c) => {
      await chuoiCoSo(c);
      await apLai068(c);
      await chuyenAn(c, 82);
      if (khoiPhuc) {
        await runTransformChotot(c);
        kiemTinAnMatSo(await docOffer(c, 82));
      } else {
        await ganSdtS06(c, { sql: BO_KHOI_PHUC() });
        await assert.rejects(async () => kiemTinAnMatSo(await docOffer(c, 82)), /TIN-AN-GIU-SO-GHEP/);
      }
    });
    m.mock.restore();
  });
}

for (const [ten, khoiPhuc] of [["KP-AC-2", true], ["KP-AC-2 chiều đỏ: bỏ nhánh khôi phục", false]]) {
  test(ten, async (t) => {
    const m = imLog(t);
    await withTx(async (c) => {
      const { so } = await chuoiCoSo(c);
      await chuyenAn(c, 82);
      await runTransformChotot(c);
      assert.equal((await docOffer(c, 82)).seller_phone, so, "KP-AC-2 trong lúc bị ghi đè tin ẩn còn số");
      await apLai068(c);
      if (khoiPhuc) {
        await runTransformChotot(c);
        kiemTinAnMatSo(await docOffer(c, 82));
        assert.equal((await docOffer(c, 81)).seller_phone, so, "KP-AC-2 tin ghép không ẩn mất số");
        assert.equal((await docOffer(c, 80)).seller_phone, so, "KP-AC-2 tin trực tiếp mất số");
      } else {
        await ganSdtS06(c, { sql: BO_KHOI_PHUC() });
        await assert.rejects(async () => kiemTinAnMatSo(await docOffer(c, 82)), /TIN-AN-GIU-SO-GHEP/);
      }
    });
    m.mock.restore();
  });
}

test("KP-AC-3 xuất xứ dựng lại giống hệt bản bộ gán thật ghi, chạy lại không đổi", async (t) => {
  const m = imLog(t);
  await withTx(async (c) => {
    const { goc } = await chuoiCoSo(c);
    await apLai068(c);
    const r = await ganSdtS06(c);
    assert.equal(r.khoi_phuc, 3, "KP-AC-3 số tin dựng lại");
    for (const [ten, list] of [["t80", 80], ["t81", 81], ["t82", 82]]) {
      const sau = await docOffer(c, list);
      assert.deepEqual(sau.field_provenance.seller_phone, goc[ten].field_provenance.seller_phone, `XUAT-XU-KHAC-GOC ${ten}`);
      assert.equal(sau.seller_phone, goc[ten].seller_phone, `KP-AC-3 số ${ten}`);
      assert.equal(sau.seller_phone_hash, goc[ten].seller_phone_hash, `KP-AC-3 băm ${ten}`);
    }
    const lai = await ganSdtS06(c);
    assert.equal(lai.doi, 0, "KP-AC-3 lượt kế đổi dòng");
    assert.equal(lai.khoi_phuc, 0, "KP-AC-3 lượt kế còn khôi phục");
  });
  m.mock.restore();
});

for (const [ten, dot] of [["KP-AC-3 tài khoản có hai dòng mang số: tu_tin dựng lại giữ dòng nhỏ nhất", false], ["KP-AC-3 chiều đỏ: tu_tin tính khác công thức cũ thì lệch bản gốc", true]]) {
  test(ten, async (t) => {
    const m = imLog(t);
    await withTx(async (c) => {
      const { so, goc } = await chuoiCoSo(c);
      await themStg(c, { id: 90, tk: "K", so });
      await apLai068(c);
      await ganSdtS06(c, dot ? { sql: dotBien("min(d.list_id) AS tu_tin", "max(d.list_id) AS tu_tin") } : {});
      const sau = await docOffer(c, 81);
      const kiem = () => assert.deepEqual(sau.field_provenance.seller_phone, goc.t81.field_provenance.seller_phone, "XUAT-XU-KHAC-GOC t81");
      if (dot) assert.throws(kiem, /XUAT-XU-KHAC-GOC/);
      else kiem();
    });
    m.mock.restore();
  });
}

// Bảng K1–K7 viết tay từ hợp đồng AC-4; ô sinh bằng tích Đề-các, ô gạch có lý do.
const BANG_K = [
  { d: "K1", rieng: "hop_le", an: "*", tk: ["trong", "1", "2"], tren: "rieng", kq: "so_rieng", so_o: 6 },
  { d: "K2", rieng: "hop_le", an: "*", tk: ["2"], tren: "tk_khac", kq: "so_rieng", so_o: 2 },
  { d: "K3", rieng: "hop_le", an: "*", tk: ["trong", "1", "2"], tren: "la", kq: "giu", so_o: 6 },
  { d: "K4", rieng: "khong", an: false, tk: ["1"], tren: "tk", kq: "so_tk", so_o: 1 },
  { d: "K5", rieng: "khong", an: true, tk: ["1"], tren: "tk", kq: "rut", so_o: 1 },
  { d: "K6", rieng: "khong", an: "*", tk: ["2"], tren: "tk", kq: "rut", so_o: 2 },
  { d: "K7", rieng: "khong", an: "*", tk: ["trong", "0", "1", "2"], tren: "la", kq: "giu", so_o: 8 },
];

function sinhOK() {
  const o = [];
  let gach = 0;
  for (const rieng of ["hop_le", "khong"]) for (const an of [false, true]) for (const tk of ["trong", "0", "1", "2"]) for (const trenTin of ["rieng", "tk", "la"]) {
    if (rieng === "hop_le" && tk === "0") { gach++; continue; }                  // có số riêng thì tài khoản có số
    if (rieng === "khong" && trenTin === "rieng") { gach++; continue; }          // không có số riêng để bằng
    if ((tk === "trong" || tk === "0") && trenTin === "tk") { gach++; continue; } // tài khoản không có số để bằng
    if (rieng === "hop_le" && tk === "1" && trenTin === "tk") { gach++; continue; } // số duy nhất của tài khoản chính là số riêng
    o.push({ rieng, an, tk, tren: rieng === "hop_le" && trenTin === "tk" ? "tk_khac" : trenTin });
  }
  return { o, gach };
}

const luatK = (x) => BANG_K.filter((l) => l.rieng === x.rieng && l.tren === x.tren && l.tk.includes(x.tk) && (l.an === "*" || l.an === x.an));

async function dungOK(c, x, base) {
  const taiKhoan = x.tk === "trong" ? undefined : `k${base}`;
  const soRieng = x.rieng === "hop_le" ? soBia() : undefined;
  let phu = [];
  if (x.tk === "1" && x.rieng !== "hop_le") phu = [soBia()];
  if (x.tk === "2") phu = x.rieng === "hop_le" ? [soBia()] : [soBia(), soBia()];
  await themStg(c, { id: base, tk: taiKhoan, so: soRieng, an: x.an ? true : undefined });
  for (const [i, so] of phu.entries()) await themStg(c, { id: base + 1 + i, tk: taiKhoan, so });
  const cu = x.tren === "rieng" ? soRieng : x.tren === "la" ? soBia() : phu[0];
  await themTin(c, { id: base, so: cu, hash: bam(cu) });
  return { ...x, base, soRieng, phu, cu, taiKhoan };
}

async function dungMaTranK(c) {
  const ds = [];
  for (const [i, x] of sinhOK().o.entries()) ds.push(await dungOK(c, x, 5000 + i * 10));
  return ds;
}

async function kiemMaTranK(c, ds) {
  for (const x of ds) {
    const tin = await docTin(c, x.base);
    const khoa = tin.field_provenance.seller_phone;
    const [luat] = luatK(x);
    const ten = `${luat.d} ${x.rieng}/${x.an ? "an" : "hien"}/${x.tk}/${x.tren}`;
    if (luat.kq === "so_rieng") {
      assert.equal(tin.seller_phone, x.soRieng, `KO-LECH số ${ten}`);
      assert.deepEqual(khoa, PROV_TRUC_TIEP, `KO-LECH xuất xứ ${ten}`);
    } else if (luat.kq === "so_tk") {
      assert.equal(tin.seller_phone, x.cu, `KO-LECH số ${ten}`);
      assert.equal(khoa?.rule_id, "s06-cung-tai-khoan", `KO-LECH xuất xứ ${ten}`);
      const nguon = (await c.query(`SELECT seller->>'phone' AS so, payload->>'account_id' AS tk FROM stg_chotot_ads WHERE list_id = $1`, [khoa.tu_tin])).rows[0];
      assert.equal(nguon?.so, tin.seller_phone, `KO-LECH tu_tin số ${ten}`);
      assert.equal(nguon?.tk, x.taiKhoan, `KO-LECH tu_tin tài khoản ${ten}`);
    } else if (luat.kq === "rut") {
      assert.equal(tin.seller_phone, null, `KO-LECH còn số ${ten}`);
      assert.equal(tin.seller_phone_hash, null, `KO-LECH còn băm ${ten}`);
      assert.equal(khoa, undefined, `KO-LECH còn khoá ${ten}`);
    } else {
      assert.equal(tin.seller_phone, x.cu, `KO-LECH đổi số ${ten}`);
      assert.equal(khoa, undefined, `KO-LECH sinh khoá ${ten}`);
    }
    assert.equal(tin.seller_phone_hash, tin.seller_phone && bam(tin.seller_phone), `KO-LECH băm ${ten}`);
  }
}

test("KP-AC-4 ma trận đúng 48 ô, gạch 22, còn 26, mỗi ô đúng một dòng, số ô mỗi dòng khớp bảng", () => {
  const { o, gach } = sinhOK();
  assert.equal(o.length + gach, 48, "KP-AC-4 tổng");
  assert.equal(gach, 22, "KP-AC-4 gạch");
  assert.equal(o.length, 26, "KP-AC-4 còn");
  const dem = {};
  for (const x of o) {
    const l = luatK(x);
    assert.equal(l.length, 1, `KP-AC-4 ô thuộc ${l.length} dòng: ${JSON.stringify(x)}`);
    dem[l[0].d] = (dem[l[0].d] ?? 0) + 1;
  }
  for (const l of BANG_K) assert.equal(dem[l.d], l.so_o, `KP-AC-4 số ô dòng ${l.d}`);
});

test("KP-AC-4 bộ gán đúng cả 26 ô, tổng 12 dựng lại và 14 không rõ gốc, chạy lại đổi 0 dòng", async () => {
  await withTx(async (c) => {
    const ds = await dungMaTranK(c);
    await nap068(c);
    const r = await ganSdtS06(c);
    assert.equal(r.khoi_phuc, 12, "KP-AC-4 khoi_phuc");
    assert.equal(r.khong_ro, 14, "KP-AC-4 khong_ro");
    await kiemMaTranK(c, ds);
    const lai = await ganSdtS06(c);
    assert.equal(lai.doi, 0, "KP-AC-4 chạy lại đổi dòng");
    assert.equal(lai.khoi_phuc, 0, "KP-AC-4 chạy lại còn khôi phục");
  });
});

for (const [ten, tu] of [
  ["bỏ nhánh số riêng", "\n              WHEN NOT r.field_provenance ? 'seller_phone' AND r.seller_phone = d.so THEN 'truc_tiep'"],
  ["bỏ nhánh số tài khoản", "\n              WHEN NOT r.field_provenance ? 'seller_phone' AND r.seller_phone = ANY (t.cac_so) THEN 'ghep'"],
]) {
  test(`KP-AC-4 chiều đỏ: ${ten}`, async () => {
    await withTx(async (c) => {
      const ds = await dungMaTranK(c);
      await nap068(c);
      await ganSdtS06(c, { sql: dotBien(tu, "") });
      await assert.rejects(() => kiemMaTranK(c, ds), /KO-LECH/);
    });
  });
}

/** Tin 90 khoá lạ, tin 91 không khoá số lạ, tin 92 không khoá khớp số tài khoản (đối chứng dương), cùng tài khoản M một số. */
async function fixtureKhoaLa(c) {
  const so = soBia();
  const [soLa, soLa2] = [soBia(), soBia()];
  await themStg(c, { id: 93, tk: "M", so });
  for (const id of [90, 91, 92]) await themStg(c, { id, tk: "M" });
  await themTin(c, { id: 90, so: soLa, hash: bam(soLa), fp: { seller_phone: { rule_id: "nguon-khac", tier: "observed" } } });
  await themTin(c, { id: 91, so: soLa2, hash: bam(soLa2) });
  await themTin(c, { id: 92, so, hash: bam(so) });
  await nap068(c);
  return { soLa, soLa2 };
}

test("KP-AC-5 khoá lạ và số không khớp stg không bị rút qua cả hai bước; tin khớp số tài khoản thì bị rút", async () => {
  await withTx(async (c) => {
    const { soLa, soLa2 } = await fixtureKhoaLa(c);
    const kiem = async (buoc) => {
      const [a, b] = [await docTin(c, 90), await docTin(c, 91)];
      assert.equal(a.seller_phone, soLa, `KHOA-LA-BI-DOI số ${buoc}`);
      assert.equal(a.field_provenance.seller_phone.rule_id, "nguon-khac", `KHOA-LA-BI-DOI khoá ${buoc}`);
      assert.equal(b.seller_phone, soLa2, `KP-AC-5 số lạ bị đổi ${buoc}`);
      assert.equal(b.field_provenance.seller_phone, undefined, `KP-AC-5 sinh khoá ${buoc}`);
    };
    await c.query(`UPDATE stg_chotot_ads SET payload = payload || '{"phone_hidden": true}' WHERE list_id IN (90, 91, 92)`);
    const r1 = await ganSdtS06(c);
    assert.equal(r1.khong_ro, 2, "KP-AC-5 khong_ro bước ẩn số");
    assert.equal(r1.khoi_phuc, 1, "KP-AC-5 đối chứng dương phải khôi phục");
    assert.equal((await docTin(c, 92)).seller_phone, null, "KP-AC-5 đối chứng dương phải bị rút");
    await kiem("ẩn số");
    await themStg(c, { id: 94, tk: "M", so: soBia() });
    const r2 = await ganSdtS06(c);
    assert.equal(r2.khong_ro, 2, "KP-AC-5 khong_ro bước hai số");
    await kiem("hai số");
  });
});

for (const [ten, dot] of [["KP-AC-5 khoá lạ mà số trùng số tài khoản: giữ nguyên số và khoá", false], ["KP-AC-5 chiều đỏ: bỏ điều kiện không-có-khoá thì tin khoá lạ bị rút", true]]) {
  test(ten, async () => {
    await withTx(async (c) => {
      const { soLa } = await fixtureKhoaLa(c);
      await c.query(`UPDATE stg_chotot_ads SET seller = seller || jsonb_build_object('phone', $1::text) WHERE list_id = 93`, [soLa]);
      await c.query(`UPDATE stg_chotot_ads SET payload = payload || '{"phone_hidden": true}' WHERE list_id = 90`);
      await ganSdtS06(c, dot ? { sql: dotBien("WHEN NOT r.field_provenance ? 'seller_phone' AND r.seller_phone = ANY (t.cac_so) THEN 'ghep'", "WHEN r.seller_phone = ANY (t.cac_so) THEN 'ghep'") } : {});
      const a = await docTin(c, 90);
      const kiem = () => {
        assert.equal(a.seller_phone, soLa, "KHOA-LA-BI-DOI");
        assert.equal(a.field_provenance.seller_phone.rule_id, "nguon-khac", "KHOA-LA-BI-DOI khoá");
      };
      if (dot) assert.throws(kiem, /KHOA-LA-BI-DOI/);
      else kiem();
    });
  });
}

for (const [ten, dot] of [["KP-AC-5 khoá lạ mà số trùng số riêng: giữ nguyên số và khoá", false], ["KP-AC-5 chiều đỏ: bỏ điều kiện không-có-khoá ở nhánh số riêng thì khoá lạ bị thay", true]]) {
  test(ten, async () => {
    await withTx(async (c) => {
      const so = soBia();
      await themStg(c, { id: 99, tk: "R", so });
      await themTin(c, { id: 99, so, hash: bam(so), fp: { seller_phone: { rule_id: "nguon-khac", tier: "observed" } } });
      await nap068(c);
      const r = await ganSdtS06(c, dot ? { sql: dotBien("WHEN NOT r.field_provenance ? 'seller_phone' AND r.seller_phone = d.so THEN 'truc_tiep'", "WHEN r.seller_phone = d.so THEN 'truc_tiep'") } : {});
      const tin = await docTin(c, 99);
      const kiem = () => assert.equal(tin.field_provenance.seller_phone.rule_id, "nguon-khac", "KHOA-LA-BI-DOI số riêng");
      if (dot) assert.throws(kiem, /KHOA-LA-BI-DOI/);
      else {
        kiem();
        assert.equal(r.khong_ro, 1, "KP-AC-5 khoá lạ phải tính không rõ gốc");
        assert.equal(r.khoi_phuc, 0, "KP-AC-5 khoá lạ không được tính khôi phục");
      }
    });
  });
}

for (const [ten, khoiPhuc] of [["KP-AC-6 khoá bị xoá bằng lệnh phân xử toàn bộ, không qua transform", true], ["KP-AC-6 chiều đỏ: bỏ nhánh khôi phục", false]]) {
  test(ten, async (t) => {
    const m = imLog(t);
    await withTx(async (c) => {
      const so = soBia();
      await themStg(c, { id: 85, tk: "N", so });
      await themStg(c, { id: 86, tk: "N" });
      await nap068(c);
      await runTransformChotot(c);
      assert.equal((await docOffer(c, 86)).seller_phone, so, "KP-AC-6 chưa có số ghép");
      await ghiDe(c);
      await c.query("SELECT resolve_offer_fields(NULL)");
      assert.equal((await docOffer(c, 86)).field_provenance.seller_phone, undefined, "KP-AC-6 khoá chưa mất");
      await apLai068(c);
      await chuyenAn(c, 86);
      if (khoiPhuc) {
        await ganSdtS06(c);
        kiemTinAnMatSo(await docOffer(c, 86));
      } else {
        await ganSdtS06(c, { sql: BO_KHOI_PHUC() });
        await assert.rejects(async () => kiemTinAnMatSo(await docOffer(c, 86)), /TIN-AN-GIU-SO-GHEP/);
      }
    });
    m.mock.restore();
  });
}

test("KP-AC-7 hàm còn bị ghi đè thì không đổi gì, báo tên, không ném; áp lại thì khôi phục", async (t) => {
  const m = imLog(t);
  await withTx(async (c) => {
    const { so } = await chuoiCoSo(c);
    const r = await runTransformChotot(c);
    const log = m.mock.calls.map((x) => x.arguments.join(" ")).join("\n");
    assert.equal(r.sdt.bo_qua, "CHUA-AP-068", "KP-AC-7 bo_qua");
    assert.match(log, /CHUA-AP-068/, "KP-AC-7 log");
    assert.equal(r.sdt.khoi_phuc, 0, "KP-AC-7 khoi_phuc");
    assert.equal(r.sdt.khong_ro, 0, "KP-AC-7 khong_ro");
    for (const id of [80, 81, 82]) {
      const tin = await docOffer(c, id);
      assert.equal(tin.seller_phone, so, `KP-AC-7 số ${id}`);
      assert.equal(tin.seller_phone_hash, bam(so), `KP-AC-7 băm ${id}`);
      assert.equal(tin.field_provenance.seller_phone, undefined, `KP-AC-7 khoá ${id}`);
    }
    await apLai068(c);
    const sau = await runTransformChotot(c);
    assert.ok(sau.sdt.khoi_phuc > 0, "KP-AC-7 đối chứng dương");
  });
  m.mock.restore();
});

test("KP-AC-8 chưa có cột nhãn 070: tin ghép được giữ nguyên không tính là đã khôi phục", async (t) => {
  const m = imLog(t);
  await withTx(async (c) => {
    await chuoiCoSo(c);
    await apLai068(c);
    const { rows: [r] } = await c.query(SQL_GAN, [false]);
    assert.equal((await docOffer(c, 81)).field_provenance.seller_phone, undefined, "KP-AC-8 tin ghép phải giữ nguyên khi chưa có cột");
    assert.equal((await docOffer(c, 80)).field_provenance.seller_phone.rule_id, "s06-so-tren-tin", "KP-AC-8 số trực tiếp vẫn dựng lại");
    assert.equal(r.khoi_phuc, 1, "KP-AC-8 chỉ đếm tin thật sự được dựng lại");
  });
  m.mock.restore();
});

for (const [ten, matKhoa, nKhoiPhuc] of [
  ["KP-AC-8 nhật ký và dòng lệnh đo mang đúng hai số đếm, không lộ số; số lọt vào dòng thì ném", ["96"], 1],
  ["KP-AC-8 hai số đếm khác nhau: mỗi nhãn in đúng số của nó", ["96", "98"], 2],
]) test(ten, async (t) => {
  await withTx(async (c) => {
    const so = soBia();
    const soLa = soBia();
    await themStg(c, { id: 95, tk: "P", so });
    await themStg(c, { id: 96, tk: "P" });
    await themStg(c, { id: 97, tk: "P" });
    await themStg(c, { id: 98, tk: "P" });
    await nap068(c);
    const m0 = imLog(t);
    await runTransformChotot(c);
    m0.mock.restore();
    // Tin 96 mất khoá, tin 97 mang số không khớp stg: đúng một khôi phục, một không rõ gốc.
    for (const id of matKhoa) await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance - 'seller_phone' WHERE offer_id = $1`, [mintOfferId("S06", id)]);
    await c.query(`UPDATE sale_offer_records SET seller_phone = $1, seller_phone_hash = $2, field_provenance = field_provenance - 'seller_phone' WHERE offer_id = $3`, [soLa, bam(soLa), mintOfferId("S06", "97")]);
    const m = imLog(t);
    const r = await runTransformChotot(c);
    const log = m.mock.calls.map((x) => x.arguments.join(" ")).filter((d) => d.startsWith("SĐT S06")).join("\n");
    m.mock.restore();
    assert.equal(r.sdt.khoi_phuc, nKhoiPhuc, "KP-AC-8 khoi_phuc");
    assert.equal(r.sdt.khong_ro, 1, "KP-AC-8 khong_ro");
    assert.match(log, new RegExp(`khôi phục ${nKhoiPhuc} · không rõ gốc 1\\b`), "KP-AC-8 log hai số đếm");
    const dong = dongGan(r.sdt);
    assert.match(dong, new RegExp(`khoi_phuc=${nKhoiPhuc} khong_ro=1\\b`), "KP-AC-8 dòng gán");
    assert.equal(inKhongSo(dong), dong, "KP-AC-8 đối chứng dương inKhongSo");
    assert.equal(inKhongSo(log), log, "KP-AC-8 log có dạng số");
    for (const sai of [so, `0${so.slice(3)}`]) {
      assert.throws(() => dongGan({ ...r.sdt, khoi_phuc: sai }), /RO-SO/, `KP-AC-8 dạng ${sai.slice(0, 1)} không bị chặn`);
    }
  });
});

for (const [ten, doiSo, conSo] of [["KP-AC-10 G1 giới hạn đã khai: tin nguồn đổi số thì tin ẩn còn số cũ", true, true], ["KP-AC-10 G1 đối chứng: tin nguồn không đổi thì tin ẩn bị rút", false, false]]) {
  test(ten, async (t) => {
    const m = imLog(t);
    await withTx(async (c) => {
      const { so } = await chuoiCoSo(c);
      if (doiSo) await c.query(`UPDATE stg_chotot_ads SET seller = seller || jsonb_build_object('phone', $1::text) WHERE list_id = 80`, [soBia()]);
      await apLai068(c);
      await chuyenAn(c, 82);
      // Chỉ giữ tin A; dòng stg của tin nguồn còn nguyên, để số đếm đo đúng tin này.
      await c.query(`DELETE FROM sale_offer_records WHERE offer_id <> $1`, [mintOfferId("S06", "82")]);
      const r = await ganSdtS06(c);
      const tin = await docOffer(c, 82);
      if (conSo) {
        assert.equal(tin.seller_phone, so, "KP-AC-10 G1 tin ẩn phải còn số cũ");
        assert.equal(tin.field_provenance.seller_phone, undefined, "KP-AC-10 G1 không khoá");
        assert.equal(r.khong_ro, 1, "KP-AC-10 G1 đếm tin không rõ gốc");
      } else kiemTinAnMatSo(tin);
    });
    m.mock.restore();
  });
}
