// dac-trung-nha-s06-len-canonical (HD5) — ca DB «DT-AC-1, 4, 5, 6» trên DB thử (DATABASE_URL), mỗi ca một giao dịch ROLLBACK
// giữ khoá 33033: nạp 045 + 059 (mở cổng) rồi 061. Ca đỏ chạy bản sao đột biến (061 qua chuỗi SQL, transform chép cạnh tệp
// thật rồi xoá). Số trong tin mồi là số bịa.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_061, napDacTrung } from "../lib/nap-061.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { resolveOffers, writeAssertions } from "../lib/assert.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n3";
const BAY_COT = { street_number: "text", unit_number: "text", frontage_length: "numeric", lot_size_dimensions: "text",
  stories: "integer", latitude: "numeric", longitude: "numeric" };
const SNAP = "dt-s06-snap";
const LIST_ID = 9900006101;
const SUBJ = `S06:${LIST_ID}`;

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
async function trongGiaoDich(fn, { sql061 } = {}) {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    await napPhatBieu(c);
    await napDacTrung(c, sql061 ? { sql: sql061 } : undefined);
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}
/** Chạy câu trong SAVEPOINT; trả thông điệp lỗi (null khi câu chạy được). */
async function loiCua(sql, p = []) {
  await c.query("SAVEPOINT dt");
  try {
    await c.query(sql, p);
    await c.query("RELEASE SAVEPOINT dt");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT dt");
    return e.message;
  }
}
async function tinMoi({ payload, toilets = 3, latitude = 21.0285, longitude = 105.8542 } = {}) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'chotot', '{}')
    ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  await c.query("DELETE FROM stg_chotot_ads");   // trong giao dịch — chỉ chạy tin mồi
  await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, price, size_m2, rooms,
    toilets, latitude, longitude, payload, snapshot_id, list_time)
    VALUES ($1, 12000, 'vn-hanoi', 1020, 's', 'Bán nhà', 5100000000, 60, 3, $2, $3, $4, $5, $6, '2026-10-25T00:00:00Z')`,
  [LIST_ID, toilets, latitude, longitude, JSON.stringify(payload), SNAP]);
}
const PAYLOAD = { street_number: "số 88", unitnumber_display: "A-12.05", width: 4.5, length: 15, floors: 4 };
const MONG = { street_number: "số 88", unit_number: "A-12.05", frontage_length: "4.5", lot_size_dimensions: "4.5 x 15",
  stories: "4", bathrooms: "3", latitude: "21.0285", longitude: "105.8542" };
const phatBieuSong = async (field) => (await c.query(`SELECT value, evidence_tier, method, rule_id, observed_at FROM field_assertions
  WHERE subject_key = $1 AND field = $2 AND retracted_at IS NULL ORDER BY id`, [SUBJ, field])).rows;
const demPhatBieu = async () => Number((await one("SELECT count(*) AS n FROM field_assertions WHERE subject_key = $1", [SUBJ])).n);

test("DT-AC-1: 061 áp hai lần — bảy cột đúng kiểu, CHECK miền, trục phát biểu 13 mã, không ghi dòng dữ liệu", { timeout: 300_000 }, async () => {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    await napPhatBieu(c);
    const dem = async () => (await one(`SELECT (SELECT count(*) FROM sale_offer_records) AS tin, (SELECT count(*) FROM field_assertions) AS pb`));
    const truoc = await dem();
    await napDacTrung(c);
    await napDacTrung(c);
    assert.deepEqual(await dem(), truoc, "DT-AC-1: áp 061 không được ghi dòng tin hay phát biểu nào");
    for (const bang of ["sale_offer_records", "sale_offers"]) {
      const { rows } = await c.query(`SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = ANY ($2)`, [bang, Object.keys(BAY_COT)]);
      assert.deepEqual(Object.fromEntries(rows.map((r) => [r.column_name, r.data_type])), BAY_COT, `DT-AC-1 cột của ${bang}`);
    }
    const id = (await one("SELECT offer_id FROM sale_offer_records LIMIT 1")).offer_id;
    for (const [cot, gt, rang] of [["frontage_length", 0, "frontage_length"], ["stories", 0, "stories"], ["latitude", 91, "latitude"], ["longitude", 181, "longitude"]]) {
      const loi = await loiCua(`UPDATE sale_offer_records SET ${cot} = $1 WHERE offer_id = $2`, [gt, id]);
      assert.match(loi ?? "", new RegExp(`sale_offer_records_${rang}_chk`), `DT-AC-1 CHECK ${cot}=${gt} phải bị chặn`);
    }
    const truc = ["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw", "offer_status", ...Object.keys(BAY_COT)];
    const chk = (await one(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'field_assertions_field_chk'`)).d;
    for (const ma of truc) assert.ok(chk.includes(`'${ma}'`), `DT-AC-1 trục phát biểu thiếu «${ma}»`);
  } finally {
    await c.query("ROLLBACK");
  }
});

test("DT-AC-1 đỏ: bản sao 061 bỏ CHECK vĩ độ thì latitude=91 lọt", { timeout: 300_000 }, async () => {
  const cu = "ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_latitude_chk CHECK (latitude BETWEEN -90 AND 90);";
  assert.ok(MIG_061.includes(cu), "đột biến không khớp 061");
  await trongGiaoDich(async () => {
    const id = (await one("SELECT offer_id FROM sale_offer_records LIMIT 1")).offer_id;
    const loi = await loiCua("UPDATE sale_offer_records SET latitude = 91 WHERE offer_id = $1", [id]);
    assert.equal(loi, null, `DT-AC-1 đỏ: bản sao bỏ CHECK latitude mà latitude=91 vẫn bị chặn — thước không đo CHECK (${loi})`);
  }, { sql061: MIG_061.replace(cu, "NULL;") });
});

test("DT-AC-4: transform ghi một phát biểu sự thật mỗi đặc trưng; trigger chặn kiểu và miền ở mọi phương pháp", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    await tinMoi({ payload: PAYLOAD });
    await runTransformChotot(c);
    const KHOA = { street_number: "payload.street_number", unit_number: "payload.unitnumber_display", frontage_length: "payload.width",
      lot_size_dimensions: "payload.width+payload.length", stories: "payload.floors", bathrooms: "toilets", latitude: "latitude", longitude: "longitude" };
    for (const [field, gt] of Object.entries(MONG)) {
      const pb = await phatBieuSong(field);
      assert.deepEqual(pb.map((r) => [r.value, r.evidence_tier, r.method, r.rule_id]), [[gt, "fact", "source_field", KHOA[field]]], `DT-AC-4 phát biểu ${field}`);
      assert.equal(new Date(pb[0].observed_at).toISOString(), "2026-10-25T00:00:00.000Z", `DT-AC-4 observed_at của ${field} = list_time`);
    }
    const SAI = { frontage_length: ["rộng", "0"], stories: ["ba", "0"], latitude: ["bắc", "91"], longitude: ["đông", "181"] };
    const DUNG = { frontage_length: "5", stories: "3", latitude: "21", longitude: "105" };
    for (const method of ["source_field", "hitl"]) {
      for (const [field, vals] of Object.entries(SAI)) {
        for (const v of vals) {
          const loi = await loiCua(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
            VALUES ('S06:dt-trigger', $1, $2, 'fact', $3, now())`, [field, v, method]);
          assert.match(loi ?? "", new RegExp(`phát biểu ${field} (phải là số|ngoài miền)`), `DT-AC-4 trigger ${method} ${field}=«${v}» phải bị chặn`);
        }
        assert.equal(await loiCua(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
          VALUES ('S06:dt-trigger', $1, $2, 'fact', $3, now())`, [field, DUNG[field], method]), null, `DT-AC-4 ${method} ${field}=${DUNG[field]} phải vào được`);
      }
    }
  });
});

let dem = 0;
test("DT-AC-4 đỏ: bản sao transform bỏ bước đặc trưng thì không có phát biểu street_number", { timeout: 300_000 }, async () => {
  const goc = readFileSync(join(PIPE, "transform-chotot.mjs"), "utf8");
  const cu = "for (const d of docDacTrungS06(ad)) phatBieu.push({ ...chung, ...d });";
  assert.ok(goc.includes(cu), "đột biến không khớp transform-chotot");
  const tep = join(PIPE, `transform-chotot.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, goc.replace(cu, ""));
  try {
    const m = await import(pathToFileURL(tep).href);
    await trongGiaoDich(async () => {
      await tinMoi({ payload: PAYLOAD });
      await m.runTransformChotot(c);
      assert.deepEqual(await phatBieuSong("street_number"), [], "DT-AC-4 đỏ: bản sao vẫn ghi street_number — thước không đo bước đặc trưng");
    });
  } finally {
    unlinkSync(tep);
  }
});

test("DT-AC-5: phân xử điền bảy cột và WC, nguồn gốc từng trường; hitl thắng source_field", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    await tinMoi({ payload: PAYLOAD });
    await runTransformChotot(c);
    const id = mintOfferId("S06", String(LIST_ID));
    const t = await one(`SELECT street_number, unit_number, frontage_length::text, lot_size_dimensions, stories::text, latitude::text,
      longitude::text, bathrooms::text, field_provenance FROM sale_offers WHERE offer_id = $1`, [id]);
    for (const [field, gt] of Object.entries(MONG)) {
      assert.equal(t[field], gt, `DT-AC-5 cột ${field}`);
      assert.ok(t.field_provenance[field], `DT-AC-5 field_provenance thiếu ${field}`);
    }
    await writeAssertions(c, [{ subject_key: SUBJ, field: "stories", value: "6", evidence_tier: "fact", method: "hitl", changed_by: "hitl:test" }]);
    await resolveOffers(c, [id]);
    assert.equal((await one("SELECT stories FROM sale_offers WHERE offer_id = $1", [id])).stories, 6, "DT-AC-5 hitl phải thắng source_field");
  });
});

test("DT-AC-5 đỏ: bản sao 061 bỏ stories khỏi phân xử thì cột stories rỗng", { timeout: 300_000 }, async () => {
  const cu = "(max(w.v) FILTER (WHERE w.field = 'stories'))::int AS stories,";
  assert.ok(MIG_061.includes(cu), "đột biến không khớp 061");
  await trongGiaoDich(async () => {
    await tinMoi({ payload: PAYLOAD });
    await runTransformChotot(c);
    const t = await one("SELECT stories FROM sale_offers WHERE offer_id = $1", [mintOfferId("S06", String(LIST_ID))]);
    assert.equal(t.stories, null, "DT-AC-5 đỏ: bản sao vẫn điền stories — thước không đo phân xử");
  }, { sql061: MIG_061.replace(cu, "NULL::int AS stories,") });
});

test("DT-AC-6: lượt hai không đổi gì; đổi width thì rút đúng phát biểu cũ, thêm đúng một phát biểu mới", { timeout: 300_000 }, async () => {
  await trongGiaoDich(async () => {
    await tinMoi({ payload: PAYLOAD });
    await runTransformChotot(c);
    const id = mintOfferId("S06", String(LIST_ID));
    const n1 = await demPhatBieu();
    const bam1 = (await one("SELECT row_to_json(o)::text AS j FROM sale_offers o WHERE offer_id = $1", [id])).j;
    await runTransformChotot(c);
    assert.equal(await demPhatBieu(), n1, "DT-AC-6 lượt hai thêm phát biểu");
    assert.equal((await one("SELECT row_to_json(o)::text AS j FROM sale_offers o WHERE offer_id = $1", [id])).j.replace(/"last_seen":"[^"]*",?/, ""),
      bam1.replace(/"last_seen":"[^"]*",?/, ""), "DT-AC-6 lượt hai đổi ô");
    await c.query("UPDATE stg_chotot_ads SET payload = payload || '{\"width\": 5}'::jsonb WHERE list_id = $1", [LIST_ID]);
    await runTransformChotot(c);
    assert.equal(await demPhatBieu(), n1 + 2, "DT-AC-6 lượt ba phải thêm đúng hai phát biểu (mặt tiền + ngang × dài)");
    for (const [field, cu, moi] of [["frontage_length", "4.5", "5"], ["lot_size_dimensions", "4.5 x 15", "5 x 15"]]) {
      assert.deepEqual((await phatBieuSong(field)).map((r) => r.value), [moi], `DT-AC-6 ${field} sống`);
      assert.equal((await one(`SELECT retract_reason FROM field_assertions WHERE subject_key = $1 AND field = $2 AND value = $3`,
        [SUBJ, field, cu])).retract_reason, "thay-boi-luot", `DT-AC-6 rút ${field} cũ`);
    }
    const t = await one("SELECT frontage_length::text, lot_size_dimensions FROM sale_offers WHERE offer_id = $1", [id]);
    assert.deepEqual([t.frontage_length, t.lot_size_dimensions], ["5", "5 x 15"], "DT-AC-6 ô mang giá trị mới");
  });
});

test("DT-AC-6 đỏ: bản sao bỏ replaceOwn thì phát biểu mặt tiền cũ không bị rút", { timeout: 300_000 }, async () => {
  const goc = readFileSync(join(PIPE, "transform-chotot.mjs"), "utf8");
  const cu = "await writeAssertions(client, phatBieu, { replaceOwn: true });";
  assert.ok(goc.includes(cu), "đột biến không khớp transform-chotot");
  const tep = join(PIPE, `transform-chotot.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, goc.replace(cu, "await writeAssertions(client, phatBieu);"));
  try {
    const m = await import(pathToFileURL(tep).href);
    await trongGiaoDich(async () => {
      await tinMoi({ payload: PAYLOAD });
      await m.runTransformChotot(c);
      await c.query("UPDATE stg_chotot_ads SET payload = payload || '{\"width\": 5}'::jsonb WHERE list_id = $1", [LIST_ID]);
      await m.runTransformChotot(c);
      assert.equal((await phatBieuSong("frontage_length")).length, 2, "DT-AC-6 đỏ: bản sao vẫn rút phát biểu cũ — thước không đo rút");
    });
  } finally {
    unlinkSync(tep);
  }
});
