// sdt-trong-ten-duong — ca DB «SDT-AC-1 Postgres», «SDT-AC-2..3», «SDT-AC-5» trên DB thử (DATABASE_URL), mỗi ca một giao dịch ROLLBACK
// giữ khoá 33033. Transform và resolve chạy thật, chỉ trên tin mồi. Ca đỏ chạy bản sao đột biến chép cạnh tệp thật rồi xoá. Số trong tệp là số bịa.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { writeAssertions } from "../lib/assert.mjs";
import { dienDuongCan, hoanTacDuong } from "../lib/duong-can.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napDacTrung } from "../lib/nap-061.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { MAU_DAY_SO } from "../lib/sdt-trong-chuoi.mjs";
import { catChuyen } from "../phat-bieu-cat-chuyen.mjs";
import { chayResolve } from "../resolve-properties.mjs";
import { buildSwapSql, CLOUD_ALLOW, FILL, localReadSql, selectList } from "../sync-cloud.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt";
const SNAP = "sdt-snap";
const yenLang = { ghi: () => {} };
const SO = "0900 000 001";
const SO_KEM = "a/c Nam 0900.000.002";
/** Định nghĩa độc lập với MAU_DAY_SO: gộp chữ số cách nhau một dấu rồi tìm 9 chữ số liền. */
const coSo = (s) => /\d{9}/.test(String(s ?? "").replace(/(\d)[ .-](?=\d)/g, "$1"));

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

const mot = async (sql, p = []) => (await c.query(sql, p)).rows[0];
async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    await napPhatBieu(c);
    await napDacTrung(c);
    await c.query("DELETE FROM stg_chotot_ads");
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'chotot', '{}')
      ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}
/** Tin mồi: mọi tin cùng `gia` rơi vào cùng một căn. */
async function tin(listId, duong, { gia = 5_100_000_000 } = {}) {
  const payload = duong === undefined ? {} : { street_name: duong };
  await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, price, size_m2, rooms,
      latitude, longitude, payload, snapshot_id, list_time)
    VALUES ($1, 12000, 'vn-hanoi', 1020, 's', 'Bán nhà', $2, 60, 3, 21.0285, 105.8542, $3, $4, '2026-10-25T00:00:00Z')
    ON CONFLICT (list_id) DO UPDATE SET payload = EXCLUDED.payload`,
  [listId, gia, JSON.stringify(payload), SNAP]);
}
let dem = 0;
/** Nạp bản sao đột biến của một tệp pipeline, xoá tệp ngay sau khi nạp. */
async function banSao(tuongDoi, cu, moi) {
  const tep = join(PIPE, tuongDoi);
  const goc = readFileSync(tep, "utf8");
  assert.ok(goc.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const sao = tep.replace(/\.mjs$/, `.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(sao, goc.replace(cu, moi));
  try {
    return await import(pathToFileURL(sao).href);
  } finally {
    unlinkSync(sao);
  }
}
const lapLai = (ham) => async (...a) => { const log = console.log; console.log = () => {}; try { return await ham(...a); } finally { console.log = log; } };
const chayTransform = lapLai(runTransformChotot);
const offer = (id) => mintOfferId("S06", String(id));
const dongTin = async (id) => mot("SELECT street_raw, field_provenance FROM sale_offers WHERE offer_id = $1", [offer(id)]);
const cot = async (id) => (await dongTin(id)).street_raw;

// ── AC-1, phía Postgres: cùng hàng với ca thuần sdt-trong-duong.test.mjs ──
const MA_TRAN_AC1 = [
  ["0912345678", true], ["Nguyễn Xiển 0912345678", true], ["0912345678 Nguyễn Xiển", true], ["0912 345 678", true],
  ["091 234 56 78", true], ["0912.345.678", true], ["0912-345-678", true], ["+84912345678", true], ["912345678", true],
  ["a/c Nam 0912.345.678", true], ["12345678 Lê Lợi", false], ["Số 277 Đường Bến Bình Đông, Phường 14", false],
  ["Đường 3/2", false], ["12/5A Lê Lợi", false], ["Tỉnh lộ 10", false], ["Km 12 Quốc lộ 1A", false], ["123-125-127 Lê Lợi", true],
];
test("SDT-AC-1 Postgres 17 hàng", async () => {
  let n = 0;
  for (const [i, [s, mong]] of MA_TRAN_AC1.entries()) {
    assert.equal((await mot("SELECT $1::text ~ $2 AS k", [s, MAU_DAY_SO])).k, mong, `SDT-AC-1 Postgres hàng ${i + 1}`);
    n++;
  }
  assert.equal(n, 17);
});

// ── AC-2 ──
const L = "Đường Legacy", N = "Đường Nguồn";
/** Hàng của Ma trận AC-2: nguồn lượt 1, nguồn lượt 2 (vắng = không đổi), legacy, phát biểu cũ, kết quả. */
const MA_TRAN_AC2 = [
  { n: SO_KEM, l: SO, ra: null },
  { n: SO, l: L, ra: L },
  { n: SO_KEM, ra: null },
  { n: N, l: SO_KEM, ra: N },
  { n: N, l: L, ra: N },
  { n: N, ra: N },
  { l: SO, ra: null },
  { l: L, ra: L },
  { ra: null },
  { n: N, doi: SO, ra: null },
  { n: SO, doi: N, ra: N },
  { cu: SO, ra: null },
];
const idAc2 = (i) => 9900008001 + i;
const dsAc2 = MA_TRAN_AC2.map((_, i) => idAc2(i));
const songCoSo = async () => (await c.query(`SELECT subject_key, method, value FROM field_assertions
  WHERE retracted_at IS NULL AND field = 'street_raw' AND subject_key = ANY($1)`, [dsAc2.map((i) => `S06:${i}`)])).rows.filter((r) => coSo(r.value));
async function dung2(transform = chayTransform) {
  for (const id of dsAc2) await tin(id, undefined);
  await chayTransform(c);
  for (const [i, h] of MA_TRAN_AC2.entries()) {
    if (h.l) await c.query("UPDATE sale_offer_records SET street_raw = $2 WHERE offer_id = $1", [offer(idAc2(i)), h.l]);
  }
  await catChuyen(c, { actor: "cat-chuyen:thu" });
  // Đối chứng dương: legacy mang số sinh từ bên ghi thật, đang sống trước lượt đo.
  const nLegacy = MA_TRAN_AC2.filter((h) => coSo(h.l)).length;
  assert.equal((await songCoSo()).filter((r) => r.method === "legacy").length, nLegacy, "SDT-AC-2 tiền đề: legacy mang số đang sống");
  for (const [i, h] of MA_TRAN_AC2.entries()) {
    if (h.cu) {
      await writeAssertions(c, [{ subject_key: `S06:${idAc2(i)}`, field: "street_raw", value: h.cu, evidence_tier: "fact", method: "source_field",
        method_version: "transform-chotot@045", rule_id: "payload.street_name", observed_at: "2026-10-20T00:00:00Z" }]);
    }
    if (h.n) await tin(idAc2(i), h.n);
  }
  await transform(c);
  for (const [i, h] of MA_TRAN_AC2.entries()) {
    if (h.doi) {
      assert.equal(await cot(idAc2(i)), coSo(h.n) ? null : h.n, `SDT-AC-2 tiền đề: lượt trước của hàng ${i + 1}`);
      await tin(idAc2(i), h.doi);
    }
  }
  await transform(c);
}
async function kiemCot2() {
  const song = await songCoSo();
  if (song.some((r) => r.method === "legacy")) throw new Error(`SDT-AC-2 legacy mang số còn sống: ${song.length} phát biểu`);
  let n = 0;
  for (const [i, h] of MA_TRAN_AC2.entries()) {
    assert.equal(await cot(idAc2(i)), h.ra, `SDT-AC-2 hàng ${i + 1}`);
    n++;
  }
  assert.equal(n, 12);
  assert.equal(song.length, 0, "SDT-AC-2 không còn phát biểu sống mang số");
}
test("SDT-AC-2 ma trận 12 hàng, legacy bị rút mà dòng còn, xuất xứ đúng, chạy lại không đổi", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  await dung2();
  await kiemCot2();
  for (const [i, h] of MA_TRAN_AC2.entries()) {
    const fp = (await dongTin(idAc2(i))).field_provenance?.street_raw;
    if (h.ra === null) {
      assert.equal(fp, undefined, `SDT-AC-2 hàng ${i + 1}: ô NULL không trỏ phát biểu`);
    } else {
      assert.ok(fp.ids.length >= 1, `SDT-AC-2 hàng ${i + 1}: có xuất xứ`);
      const { rows: pb } = await c.query("SELECT value, retracted_at FROM field_assertions WHERE id = ANY($1::bigint[])", [fp.ids]);
      assert.deepEqual(pb.map((r) => [r.value, r.retracted_at]), fp.ids.map(() => [h.ra, null]), `SDT-AC-2 hàng ${i + 1}: xuất xứ trỏ phát biểu sống`);
    }
  }
  const { rows } = await c.query(`SELECT value, retract_reason, retracted_at FROM field_assertions
    WHERE method = 'legacy' AND field = 'street_raw' AND subject_key = ANY($1)`, [dsAc2.map((i) => `S06:${i}`)]);
  const coSoL = rows.filter((r) => coSo(r.value));
  assert.equal(coSoL.length, MA_TRAN_AC2.filter((h) => coSo(h.l)).length, "SDT-AC-2 dòng legacy mang số còn đủ");
  for (const r of coSoL) assert.deepEqual([r.retract_reason, Boolean(r.retracted_at)], ["chua-sdt", true], "SDT-AC-2 lý do rút");
  // Đếm thẳng phát biểu đã rút: `retracted` của transform không gồm hai đường rút của bước này.
  const daRut = async () => (await c.query(`SELECT count(*)::int n FROM field_assertions WHERE retracted_at IS NOT NULL AND subject_key = ANY($1)`, [dsAc2.map((i) => `S06:${i}`)])).rows[0].n;
  const rutDau = await daRut();
  assert.ok(rutDau >= 1, "SDT-AC-2 đối chứng dương: lượt đầu có phát biểu bị rút");
  const lai = await chayTransform(c);
  assert.deepEqual([lai.inserted, lai.retracted, lai.offersChanged], [0, 0, 0], "SDT-AC-2 lượt kế không đổi");
  assert.equal(await daRut(), rutDau, "SDT-AC-2 lượt kế không rút thêm");
  await kiemCot2();
}));
test("SDT-AC-2 đỏ: bản sao không rút legacy mang số", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("transform-chotot.mjs", "const coSo = await rutDuongCoSo(client);", "const coSo = [];");
  await dung2(lapLai(m.runTransformChotot));
  await assert.rejects(kiemCot2(), /legacy mang số còn sống/);
}));
test("SDT-AC-2 đỏ: bản sao bỏ rút phát biểu của bộ đọc", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("transform-chotot.mjs", 'await retractRule(client, khongDuong, ENRICH_FIELD.street_raw, "payload.street_name", "nguon-bo-trong");', "");
  await dung2(lapLai(m.runTransformChotot));
  await assert.rejects(kiemCot2(), /SDT-AC-2 hàng 10/);
}));

// ── AC-3 ──
const O = "Đường Của Ô";
const CAC_O = ["so", "sach", "trong"];
const CAC_TIN = ["sach", "khong", "conSo", "ca"];
const ten = (i) => `Đường Tin ${i}`;
const o3 = CAC_O.flatMap((o, io) => CAC_TIN.map((t, it) => ({ o, t, i: io * 4 + it })));
const ra3 = ({ o, t, i }) => (o === "sach" ? O : t === "sach" || t === "ca" ? ten(i) : null);
const idTin = (i, k = 0) => 9900008100 + i * 2 + k;
const giaO = (i) => 6_100_000_000 + i * 100_000_000;
const canCua = async (id) => mot(`SELECT p.id, p.street, p.enrichment_log FROM properties p JOIN property_offers po ON po.property_id = p.id
  WHERE po.offer_id = $1`, [offer(id)]);
const mucGo = (p) => p.enrichment_log.filter((e) => e.src === "go-sdt-duong");
/** Toàn nội dung mục log trừ thời điểm và khoá tin — hai trường đó không phải giá trị đường. */
const logCoSo = (p) => p.enrichment_log.some((e) => { const { at: _a, offer_id: _b, ...con } = e; return coSo(Object.values(con).join(" | ")); });
async function dung3() {
  for (const { t, i } of o3) {
    await tin(idTin(i), t === "sach" || t === "ca" ? ten(i) : undefined, { gia: giaO(i) });
    if (t === "ca") await tin(idTin(i, 1), undefined, { gia: giaO(i) });
    if (t === "conSo") await tin(idTin(i, 1), undefined, { gia: giaO(i) });
  }
  await chayTransform(c);
  await chayResolve(c, yenLang);
  for (const { o, t, i } of o3) {
    const p = await canCua(idTin(i));
    if (t === "ca" || t === "conSo") assert.equal((await canCua(idTin(i, 1))).id, p.id, `SDT-AC-3 tiền đề: hai tin cùng căn, ô ${i}`);
    await c.query("UPDATE properties SET street = $2 WHERE id = $1", [p.id, o === "so" ? SO : o === "sach" ? O : null]);
    if (t === "ca" || t === "conSo") await c.query("UPDATE sale_offer_records SET street_raw = $2 WHERE offer_id = $1", [offer(idTin(i, 1)), SO_KEM]);
  }
  // Đối chứng dương: cả ô lẫn tin đang mang số trước lượt đo.
  assert.ok(coSo((await canCua(idTin(0))).street), "SDT-AC-3 tiền đề: ô mang số");
  assert.ok(coSo(await cot(idTin(2, 1))), "SDT-AC-3 tiền đề: tin mang số");
}
async function kiemCon() {
  for (const { i } of o3) if (coSo((await canCua(idTin(i))).street)) throw new Error("SDT-AC-3 ô căn còn số");
}
async function kiemNhan() {
  for (const { o, t, i } of o3) {
    if (o === "trong" && t === "conSo" && coSo((await canCua(idTin(i))).street)) throw new Error("SDT-AC-3 căn nhận số từ tin");
  }
}
test("SDT-AC-3 ma trận 12 ô, gỡ số, điền lại từ tin sạch, log không mang số, có hoàn tác", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  await dung3();
  await chayResolve(c, yenLang);
  let n = 0;
  for (const h of o3) {
    const p = await canCua(idTin(h.i));
    assert.equal(p.street, ra3(h), `SDT-AC-3 ô ${h.o} × ${h.t}`);
    assert.equal(mucGo(p).length, h.o === "so" ? 1 : 0, `SDT-AC-3 số mục log ô ${h.o} × ${h.t}`);
    assert.ok(!logCoSo(p), `SDT-AC-3 log mang số ô ${h.o} × ${h.t}`);
    n++;
  }
  assert.equal(n, 12);

  await chayResolve(c, yenLang);
  for (const h of o3) assert.equal(mucGo(await canCua(idTin(h.i))).length, h.o === "so" ? 1 : 0, "SDT-AC-3 lượt hai không thêm mục");

  assert.ok(await hoanTacDuong(c) >= 1, "SDT-AC-3 hoàn tác đảo ít nhất một mục");
  await kiemHoanTac();
}));
async function kiemHoanTac() {
  for (const { i } of o3) if (coSo((await canCua(idTin(i))).street)) throw new Error("SDT-AC-3 hoàn tác trả số");
}
test("SDT-AC-3 đỏ: bản sao bỏ bước gỡ ô", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("resolve-properties.mjs", "ghi(`Stage A: gỡ ${await goSdtKhoiCan(q)} ô đường mang số`);", "");
  await dung3();
  await lapLai(m.chayResolve)(c, yenLang);
  await assert.rejects(kiemCon(), /ô căn còn số/);
}));
test("SDT-AC-3 đỏ: bản sao bỏ điều kiện lọc ở bên điền", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("lib/duong-can.mjs", "AND o.street_raw !~ $2", "AND $2::text IS NOT NULL");
  await dung3();
  await m.dienDuongCan(c);
  await assert.rejects(kiemNhan(), /căn nhận số từ tin/);
}));
test("SDT-AC-3 đối chứng: bản thật cùng tiền đề không nhận số từ tin", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  await dung3();
  await dienDuongCan(c);
  await kiemNhan();
}));
test("SDT-AC-3 đỏ: bản sao ghi giá trị vào mục log", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("lib/duong-can.mjs", "'ly_do', 'chua-sdt'", "'ly_do', street");
  await dung3();
  await m.goSdtKhoiCan(c);
  const p = await canCua(idTin(0));
  assert.throws(() => { if (logCoSo(p)) throw new Error("SDT-AC-3 log mang số"); }, /log mang số/);
}));
// Ô và mục log sinh bằng dienDuongCan chưa lọc, đúng thứ job đêm của bản trước ghi: ô trống × tin còn số là ô 10.
async function dungLogCu() {
  const m = await banSao("lib/duong-can.mjs", "AND o.street_raw !~ $2", "AND $2::text IS NOT NULL");
  await dung3();
  await m.dienDuongCan(c);
  const p = await canCua(idTin(10));
  assert.ok(coSo(p.street) && logCoSo(p), "SDT-AC-3 tiền đề: ô và mục log cũ mang số");
}
async function kiemLogCu() {
  const p = await canCua(idTin(10));
  if (logCoSo(p)) throw new Error("SDT-AC-3 log cũ còn mang số");
  return p;
}
test("SDT-AC-3 log cũ mang số bị che, dòng còn, chạy lại không đổi", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  await dungLogCu();
  await chayResolve(c, yenLang);
  const p = await kiemLogCu();
  assert.equal(p.street, null, "SDT-AC-3 ô log cũ về NULL");
  assert.equal(mucGo(p).length, 1, "SDT-AC-3 ô log cũ có một mục gỡ");
  assert.equal(p.enrichment_log.filter((e) => e.che === "chua-sdt" && !("value" in e)).length, 1, "SDT-AC-3 đúng một mục bị che, dòng còn");
  await chayResolve(c, yenLang);
  assert.deepEqual((await canCua(idTin(10))).enrichment_log, p.enrichment_log, "SDT-AC-3 lượt hai không đổi log");
  await hoanTacDuong(c);
  assert.equal((await canCua(idTin(10))).street, null, "SDT-AC-3 hoàn tác không trả số");
}));
test("SDT-AC-3 đỏ: bản sao không che mục log cũ", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("lib/duong-can.mjs", "(e - 'value') || jsonb_build_object('che', 'chua-sdt')", "e");
  await dungLogCu();
  await m.goSdtKhoiCan(c);
  await assert.rejects(kiemLogCu(), /log cũ còn mang số/);
}));
test("SDT-AC-3 đỏ: bản sao hoàn tác trả số", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("lib/duong-can.mjs", "SET street = NULL,\n            enrichment_log = p.enrichment_log", `SET street = '${SO}',\n            enrichment_log = p.enrichment_log`);
  await dung3();
  await chayResolve(c, yenLang);
  await m.hoanTacDuong(c);
  await assert.rejects(kiemHoanTac(), /hoàn tác trả số/);
}));

// ── AC-5 ──
async function dung5() {
  await tin(9900008901, SO_KEM, { gia: 7_100_000_000 });
  await chayTransform(c);
  await chayResolve(c, yenLang);
  const p = await canCua(9900008901);
  await c.query("UPDATE properties SET street = $2 WHERE id = $1", [p.id, SO]);
  await chayResolve(c, yenLang);
  return p.id;
}
async function docLo(sync, bang, cotDoc, khoa, gt) {
  const { rows } = await c.query(sync.localReadSql(bang, sync.selectList(bang, cotDoc).sql));
  const hang = rows.map((r) => JSON.parse(r.j)).filter((r) => String(r[khoa]) === String(gt));
  if (hang.length !== 1) throw new Error(`SDT-AC-5 lô đồng bộ thiếu hàng về NULL: ${bang}`);
  return hang[0];
}
test("SDT-AC-5 lô đồng bộ chở NULL lên, không chở số", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const pid = await dung5();
  const sync = { localReadSql, selectList };
  const tinLo = await docLo(sync, "sale_offers", ["offer_id", "street_raw"], "offer_id", offer(9900008901));
  assert.equal(tinLo.street_raw, null, "SDT-AC-5 tin về NULL trong lô");
  const canLo = await docLo(sync, "properties", ["id", "street", "enrichment_log"], "id", pid);
  assert.equal(canLo.street, null, "SDT-AC-5 căn về NULL trong lô");
  assert.equal(canLo.enrichment_log.filter((e) => e.src === "go-sdt-duong").length, 1, "SDT-AC-5 đối chứng dương: mục gỡ có trong lô");
  assert.ok(!coSo(JSON.stringify(canLo.enrichment_log.map(({ at: _a, offer_id: _b, ...e }) => e))), "SDT-AC-5 log trong lô không mang số");

  const tra = (keep) => buildSwapSql({ runId: "thu1", readAt: "2026-11-03T00:00:00Z", counts: { sale_offers: 1, properties: 1 },
    columns: { sale_offers: ["offer_id", "street_raw"], properties: ["id", "street"] },
    plan: { insertOrder: ["sale_offers", "properties"], deleteOrder: ["properties", "sale_offers"], keep } });
  const upsert = tra({ sale_offers: ["offer_id"], properties: ["id"] });
  assert.ok(upsert.includes('"street_raw" = EXCLUDED."street_raw"') && upsert.includes('"street" = EXCLUDED."street"'), "SDT-AC-5 upsert ghi đè hai cột");
  const xoaChen = tra({});
  for (const b of ["sale_offers", "properties"]) {
    const xoa = xoaChen.indexOf(`DELETE FROM public."${b}";`);
    const chen = xoaChen.indexOf(`INSERT INTO public."${b}"`);
    assert.ok(xoa >= 0 && chen > xoa, `SDT-AC-5 không keep thì xoá ${b} rồi chèn`);
    assert.ok(!upsert.includes(`DELETE FROM public."${b}";`), `SDT-AC-5 có keep thì không xoá trắng ${b}`);
  }

  // Bảng lên cloud do FILL quyết; bảng trong FILL mà không có khoá CLOUD_ALLOW thì gửi mọi cột.
  assert.ok(FILL.includes("sale_offers") && FILL.includes("properties"), "SDT-AC-5 đối chứng dương: hai bảng có trong FILL");
  assert.ok(!FILL.includes("field_assertions") && !Object.keys(CLOUD_ALLOW).includes("field_assertions"), "SDT-AC-5 field_assertions không lên cloud");
  for (const k of ["street_number", "unit_number"]) assert.ok(!CLOUD_ALLOW.sale_offers.includes(k), `SDT-AC-5 ${k} không lên cloud`);
}));
test("SDT-AC-5 đỏ: bản sao câu đọc lọc street_raw khác NULL", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("sync-cloud.mjs", "FROM ${q(table)}${childFilterSql(table)}) x`", "FROM ${q(table)}${childFilterSql(table)} WHERE street_raw IS NOT NULL) x`");
  await dung5();
  await assert.rejects(docLo(m, "sale_offers", ["offer_id", "street_raw"], "offer_id", offer(9900008901)), /lô đồng bộ thiếu hàng về NULL/);
}));
