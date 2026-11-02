// s06-duong-du-an-len-tin (DS1) — ca DB «DS1-AC-2..5» trên DB thử (DATABASE_URL), mỗi ca một giao dịch ROLLBACK giữ khoá 33033.
// Transform và resolve chạy thật, chỉ trên tin mồi (xoá stg trong giao dịch). Ca đỏ chạy bản sao đột biến chép cạnh tệp thật
// rồi xoá. Số và tên đường trong tin mồi là bịa.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { dienDuongCan, hoanTacDuong } from "../lib/duong-can.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napDacTrung } from "../lib/nap-061.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { chayResolve } from "../resolve-properties.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_ds1";
const SNAP = "ds1-snap";
const NGUON = "payload.street_name";
const yenLang = { ghi: () => {} };

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
/** Tin mồi: mọi tin cùng `gia` rơi vào cùng một căn (cùng ô toạ độ, loại, diện tích, giá). */
async function tin(listId, duong, { gia = 5_100_000_000, ngay = "2026-10-25T00:00:00Z" } = {}) {
  const payload = duong === undefined ? {} : { street_name: duong };
  await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, price, size_m2, rooms,
      latitude, longitude, payload, snapshot_id, list_time)
    VALUES ($1, 12000, 'vn-hanoi', 1020, 's', 'Bán nhà', $2, 60, 3, 21.0285, 105.8542, $3, $4, $5)
    ON CONFLICT (list_id) DO UPDATE SET payload = EXCLUDED.payload, list_time = EXCLUDED.list_time`,
  [listId, gia, JSON.stringify(payload), SNAP, ngay]);
}
const banSaoTam = [];
/** Nạp bản sao đột biến của một tệp pipeline (thay `cu` bằng `moi`), trả module; xoá tệp ngay sau khi nạp. */
async function banSao(tuongDoi, cu, moi) {
  const tep = join(PIPE, tuongDoi);
  const goc = readFileSync(tep, "utf8");
  assert.ok(goc.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const sao = tep.replace(/\.mjs$/, `.dotbien-${process.pid}-${banSaoTam.push(tep)}.mjs`);
  writeFileSync(sao, goc.replace(cu, moi));
  try {
    return await import(pathToFileURL(sao).href);
  } finally {
    unlinkSync(sao);
  }
}
const lapLai = (ham) => async (...a) => { const log = console.log; console.log = () => {}; try { return await ham(...a); } finally { console.log = log; } };
const chayTransform = lapLai(runTransformChotot);
const phatBieuSong = async (id) => (await c.query(`SELECT id, value, evidence_tier, method, rule_id FROM field_assertions
  WHERE subject_key = $1 AND field = 'street_raw' AND retracted_at IS NULL AND method <> 'legacy' ORDER BY id`, [`S06:${id}`])).rows;
const cotDuong = async (id) => (await mot("SELECT street_raw, field_provenance FROM sale_offers WHERE offer_id = $1", [mintOfferId("S06", String(id))]));

// ── AC-2 ──
async function kiemAc2(id, gt) {
  const pb = await phatBieuSong(id);
  if (pb.length !== 1) throw new Error(`DS1-AC-2 thiếu phát biểu street_raw (${pb.length} dòng)`);
  assert.deepEqual([pb[0].value, pb[0].evidence_tier, pb[0].method, pb[0].rule_id], [gt, "fact", "source_field", NGUON]);
  const t = await cotDuong(id);
  assert.equal(t.street_raw, gt, "DS1-AC-2 cột tin");
  assert.deepEqual(t.field_provenance.street_raw?.assertion_ids ?? t.field_provenance.street_raw?.ids ?? [Number(t.field_provenance.street_raw?.assertion_id)],
    [Number(pb[0].id)], "DS1-AC-2 field_provenance phải trỏ phát biểu");
}
test("DS1-AC-2 tin mang phát biểu đường từ nguồn", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  await tin(9900007001, "  Đường Mồi   Một ");
  await chayTransform(c);
  await kiemAc2(9900007001, "Đường Mồi Một");
}));
test("DS1-AC-2 đỏ: bản sao không đọc street_name", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("transform-chotot.mjs", "const dacTrung = docDacTrungS06(ad);", 'const dacTrung = docDacTrungS06(ad).filter((d) => d.field !== "street_raw");');
  await tin(9900007001, "Đường Mồi Một");
  await lapLai(m.runTransformChotot)(c);
  await assert.rejects(kiemAc2(9900007001, "Đường Mồi Một"), /thiếu phát biểu street_raw/);
}));

// ── AC-3 ──
/** Dòng `legacy` đúng khuôn bên ghi thật (phat-bieu-cat-chuyen.mjs): tin đã có từ transform, cột do bộ phân xử dựng. */
async function legacy(id, gt, tier = "observed") {
  const offer = mintOfferId("S06", String(id));
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
    VALUES ($1, 'street_raw', $2, $3, 'legacy', '045', 'offer:' || $4, jsonb_build_object('note', 'giá trị có trước 045, không căn cứ', 'offer_id', $4::text), now())`,
  [`S06:${id}`, gt, tier, offer]);
}
const demLegacy = async (ids) => Number((await mot(`SELECT count(*) n FROM field_assertions WHERE method = 'legacy' AND field = 'street_raw' AND subject_key = ANY($1)`,
  [ids.map((i) => `S06:${i}`)])).n);
async function kiemAc3(a, b, d) {
  const [ta, tb, td] = [await cotDuong(a), await cotDuong(b), await cotDuong(d)];
  if (ta.street_raw !== "Đường Cùng" || tb.street_raw !== "Đường Nguồn") throw new Error(`DS1-AC-3 legacy thắng nguồn: ${ta.street_raw} · ${tb.street_raw}`);
  assert.equal(td.street_raw, "Đường Giữ", "DS1-AC-3 nguồn rỗng phải giữ legacy");
}
test("DS1-AC-3 nguồn thay legacy, nguồn rỗng giữ legacy, dòng legacy còn đủ", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const khuon = readFileSync(join(PIPE, "phat-bieu-cat-chuyen.mjs"), "utf8");
  assert.ok(khuon.includes("'observed', 'legacy', '045', 'offer:' || o_.offer_id"), "DS1-AC-3 bên ghi legacy đổi khuôn — cập nhật fixture");
  const [a, b, d] = [9900007011, 9900007012, 9900007013];
  for (const [i, id] of [a, b, d].entries()) await tin(id, undefined, { gia: 5_200_000_000 + i * 1e8 });
  await chayTransform(c);
  await legacy(a, "Đường Cùng"); await legacy(b, "Đường Cũ"); await legacy(d, "Đường Giữ");
  const truoc = await demLegacy([a, b, d]);
  assert.equal(truoc, 3);
  await tin(a, "Đường Cùng"); await tin(b, "Đường Nguồn"); await tin(d, "");
  await chayTransform(c);
  await kiemAc3(a, b, d);
  assert.equal(await demLegacy([a, b, d]), truoc, "DS1-AC-3 dòng legacy bị xoá");
}));
test("DS1-AC-3 đỏ: bản sao xếp legacy trên source_field trong phép đo", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  await c.query(`CREATE OR REPLACE FUNCTION assertion_method_rank(p_method text) RETURNS int LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE p_method WHEN 'legacy' THEN 0 WHEN 'hitl' THEN 1 WHEN 'source_field' THEN 2 ELSE 99 END $$`);
  // Lớp xếp trên phương pháp, nên phép đo cho legacy cùng lớp fact; cổng cấm cặp này nên tắt trong giao dịch.
  await c.query("ALTER TABLE field_assertions DISABLE TRIGGER field_assertions_guard");
  const [a, b, d] = [9900007011, 9900007012, 9900007013];
  for (const [i, id] of [a, b, d].entries()) await tin(id, undefined, { gia: 5_200_000_000 + i * 1e8 });
  await chayTransform(c);
  await legacy(a, "Đường Cùng", "fact"); await legacy(b, "Đường Cũ", "fact"); await legacy(d, "Đường Giữ", "fact");
  await tin(a, "Đường Cùng"); await tin(b, "Đường Nguồn");
  await chayTransform(c);
  await assert.rejects(kiemAc3(a, b, d), /legacy thắng nguồn/);
}));

// ── AC-4 ──
async function kiemBoTrong(co, khong) {
  if ((await phatBieuSong(co)).length || (await phatBieuSong(khong)).length) throw new Error("DS1-AC-4 phát biểu cũ còn sống");
  assert.equal((await cotDuong(co)).street_raw, "Đường Lịch Sử", "DS1-AC-4 có legacy thì cột bằng đúng legacy");
  assert.equal((await cotDuong(khong)).street_raw, null, "DS1-AC-4 không legacy thì NULL");
}
test("DS1-AC-4 chạy lại không đổi, nguồn đổi thì đổi theo, nguồn bỏ trống thì rút", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const [co, khong] = [9900007021, 9900007022];
  await tin(co, undefined, { gia: 5_500_000_000 }); await tin(khong, undefined, { gia: 5_600_000_000 });
  await chayTransform(c);
  await legacy(co, "Đường Lịch Sử");
  await tin(co, "Đường Một", { gia: 5_500_000_000 }); await tin(khong, "Đường Hai", { gia: 5_600_000_000 });
  await chayTransform(c);
  const anh = async () => JSON.stringify((await c.query(`SELECT id, retracted_at FROM field_assertions WHERE subject_key = ANY($1) ORDER BY id`, [[`S06:${co}`, `S06:${khong}`]])).rows);
  const truoc = await anh();
  const dongCot = async () => [(await cotDuong(co)).street_raw, (await cotDuong(khong)).street_raw];
  const cotTruoc = await dongCot();
  await chayTransform(c);
  assert.equal(await anh(), truoc, "DS1-AC-4 lượt hai thêm hoặc rút phát biểu");
  assert.deepEqual(await dongCot(), cotTruoc, "DS1-AC-4 lượt hai đổi tin");

  await tin(co, "Đường Mới", { gia: 5_500_000_000 });
  await chayTransform(c);
  assert.deepEqual((await phatBieuSong(co)).map((r) => r.value), ["Đường Mới"], "DS1-AC-4 lượt đổi phải rút phát biểu cũ");
  assert.equal((await cotDuong(co)).street_raw, "Đường Mới");

  await tin(co, "", { gia: 5_500_000_000 }); await tin(khong, undefined, { gia: 5_600_000_000 });
  await chayTransform(c);
  await kiemBoTrong(co, khong);
}));
test("DS1-AC-4 đỏ: bản sao không rút phát biểu khi nguồn trống", { timeout: 300_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("transform-chotot.mjs", 'await retractRule(client, khongDuong, ENRICH_FIELD.street_raw, "payload.street_name", "nguon-bo-trong");', "");
  const [co, khong] = [9900007021, 9900007022];
  await tin(co, "Đường Một", { gia: 5_500_000_000 }); await tin(khong, "Đường Hai", { gia: 5_600_000_000 });
  const chay = lapLai(m.runTransformChotot);
  await chay(c);
  await tin(co, ""); await tin(khong, undefined);
  await chay(c);
  await assert.rejects(kiemBoTrong(co, khong), /phát biểu cũ còn sống/);
}));

// ── AC-5 ──
const canCua = async (id) => (await mot(`SELECT p.id, p.street, p.enrichment_log FROM properties p JOIN property_offers po ON po.property_id = p.id
  WHERE po.offer_id = $1`, [mintOfferId("S06", String(id))]));
const mucLog = (p) => p.enrichment_log.filter((e) => e.src === "resolve-properties" && e.field === "street");
const GIA = { mot: 6_100_000_000, hai: 6_200_000_000, hoa: 6_300_000_000, san: 6_400_000_000, roi: 6_500_000_000, rong: 6_600_000_000 };
const CO_SAN = "Đường Có Sẵn";
/** Dựng sáu phần tử ma trận ô căn, tới ngay trước lượt resolve cần đo. */
async function dungO() {
  // Căn «có sẵn» và «rời kho» được liên kết khi tin chưa có đường, rồi tin mới mang đường.
  await tin(9900007041, undefined, { gia: GIA.san });
  await tin(9900007051, undefined, { gia: GIA.roi }); await tin(9900007052, undefined, { gia: GIA.roi });
  await chayTransform(c);
  await chayResolve(c, yenLang);
  await c.query("UPDATE properties SET street = $2 WHERE id = $1", [(await canCua(9900007041)).id, CO_SAN]);

  await tin(9900007001, "Đường Một", { gia: GIA.mot });
  await tin(9900007011, "Đường Cũ", { gia: GIA.hai, ngay: "2026-10-20T00:00:00Z" });
  await tin(9900007012, "Đường Mới", { gia: GIA.hai, ngay: "2026-10-28T00:00:00Z" });
  await tin(9900007021, "Đường Hoà A", { gia: GIA.hoa });
  await tin(9900007022, "Đường Hoà B", { gia: GIA.hoa });
  await tin(9900007041, "Đường Của Tin", { gia: GIA.san });
  await tin(9900007052, "Đường Tin Rời Kho", { gia: GIA.roi });
  await tin(9900007061, undefined, { gia: GIA.rong });
  await chayTransform(c);
  await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = $1`, [mintOfferId("S06", "9900007052")]);
}
async function kiemCoSan() {
  const p = await canCua(9900007041);
  if (p.street !== CO_SAN) throw new Error(`DS1-AC-5 ô có sẵn bị đè: ${p.street}`);
  assert.equal(mucLog(p).length, 0, "DS1-AC-5 ô có sẵn không được có mục log");
}
test("DS1-AC-5 căn điền ô trống, không đè, một mục log, có hoàn tác", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  await dungO();
  await chayResolve(c, yenLang);
  const nhoHon = [mintOfferId("S06", "9900007021"), mintOfferId("S06", "9900007022")].sort()[0];
  const hoa = nhoHon === mintOfferId("S06", "9900007021") ? "Đường Hoà A" : "Đường Hoà B";
  const dien = [[9900007001, "Đường Một"], [9900007011, "Đường Mới"], [9900007021, hoa]];
  for (const [id, gt] of dien) {
    const p = await canCua(id);
    assert.equal(p.street, gt, `DS1-AC-5 căn của tin ${id}`);
    assert.equal(mucLog(p).length, 1, `DS1-AC-5 căn của tin ${id}: đúng một mục log`);
    assert.equal(mucLog(p)[0].value, gt);
  }
  await kiemCoSan();
  assert.equal((await canCua(9900007051)).street, null, "DS1-AC-5 không nhận đường từ tin đã rời kho");
  assert.equal((await canCua(9900007061)).street, null, "DS1-AC-5 căn không tin nào có đường vẫn trống");

  await chayResolve(c, yenLang);
  for (const [id] of dien) assert.equal(mucLog(await canCua(id)).length, 1, "DS1-AC-5 lượt hai không thêm mục log");

  const soMuc = Number((await mot(`SELECT count(*) n FROM properties p, jsonb_array_elements(p.enrichment_log) e
    WHERE e->>'src' = 'resolve-properties' AND e->>'field' = 'street'`)).n);
  const n = await hoanTacDuong(c);
  assert.equal(n, soMuc, "DS1-AC-5 số ô trả về bằng số mục log");
  for (const [id] of dien) assert.equal((await canCua(id)).street, null, "DS1-AC-5 hoàn tác trả ô về trống");
  assert.equal((await canCua(9900007041)).street, CO_SAN, "DS1-AC-5 hoàn tác không đụng ô có sẵn");
  assert.equal(await hoanTacDuong(c), 0, "DS1-AC-5 hoàn tác lần hai không làm gì");
}));
test("DS1-AC-5 đỏ: bản sao đè ô có sẵn", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  const m = await banSao("lib/duong-can.mjs", "WHERE p.id = chon.property_id AND NULLIF(btrim(p.street), '') IS NULL", "WHERE p.id = chon.property_id");
  await dungO();
  assert.ok(await m.dienDuongCan(c) > 0);
  await assert.rejects(kiemCoSan(), /ô có sẵn bị đè/);
}));
test("DS1-AC-5 đối chứng: bản thật cùng tiền đề không đè", { timeout: 600_000 }, () => trongGiaoDich(async () => {
  await dungO();
  assert.equal(await dienDuongCan(c), 0, "DS1-AC-5 căn có sẵn và căn chỉ còn tin rời kho không được điền");
  await kiemCoSan();
}));
