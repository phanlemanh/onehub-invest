// tang-tren-tin.itest.mjs — hồ sơ _acceptance/tang-tren-tin-s03 (DV4): 095 và lượt transform S03 trên DB thử, BEGIN…ROLLBACK.
// Chỉ chạy trên DB thử (bash pipeline/scripts/tang-tren-tin-db.sh itest|luat): DB thử chưa áp 095, mỗi ca tự nạp trong giao dịch.
// Chữ trong ca là chữ dựng, không phải bài thật. Giá mỗi ca khác nhau và lạ để không gom nhầm bài thật.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { co095 } from "../lib/assert.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_095, napTang } from "../lib/nap-095.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { ASSERTION_METHOD, EVIDENCE_TIER } from "../lib/vocab.generated.mjs";
import { writeOffers } from "../lib/write-offers.mjs";
import { runTransformZalo, TANG_VERSION } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("tang-tren-tin.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>, không chạy trên oneinvest");
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const AT = "2099-01-06T01:00:00Z";
const DAI = 30 * 60_000;

async function withTx(fn, { nap = true } = {}) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    if (nap) await napTang(c);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
/** Chạy câu trong SAVEPOINT; trả thông điệp lỗi (null khi câu chạy được). */
async function loiCua(c, sql, p = []) {
  await c.query("SAVEPOINT dv4");
  try {
    await c.query(sql, p);
    await c.query("RELEASE SAVEPOINT dv4");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT dv4");
    return e.message;
  }
}
const tinS06KhongTang = async (c, n = 1) => (await c.query(
  `SELECT offer_id FROM sale_offer_records WHERE source = 'S06' AND floor_raw IS NULL AND originating_system_key IS NOT NULL
     AND retired_at IS NULL ORDER BY offer_id LIMIT $1`, [n])).rows.map((r) => r.offer_id);
const soLegacy = async (c, id) => Number((await c.query(
  `SELECT count(*) AS n FROM field_assertions WHERE field = 'floor_raw' AND method = 'legacy' AND retracted_at IS NULL AND rule_id = $1`,
  [`offer:${id}`])).rows[0].n);
const tangCua = async (c, id) => (await c.query("SELECT floor_raw FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0].floor_raw;

test("DV4-AC-1 áp 095 hai lần: không lỗi, hai trường được nhận, trường lạ bị từ chối, đúng một phát biểu legacy", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    assert.equal(await co095(c), false, "DV4-AC-1: DB thử phải chưa áp 095 để phép đo có nghĩa");
    const [id, id0] = await tinS06KhongTang(c, 2);
    await c.query("UPDATE sale_offer_records SET floor_raw = '7' WHERE offer_id = $1", [id]);
    await c.query("UPDATE sale_offer_records SET floor_raw = '0' WHERE offer_id = $1", [id0]);   // giá trị ngoài miền mới, có thật ở S06
    await napTang(c);
    assert.equal(await soLegacy(c, id), 1, "DV4-AC-1 lần một");
    await napTang(c);
    assert.equal(await soLegacy(c, id), 1, "DV4-AC-1 lần hai không thêm");
    assert.equal(await soLegacy(c, id0), 1, "DV4-AC-1 giá trị cũ ngoài miền vẫn có legacy");
    assert.equal(await co095(c), true);
    const chk = (await c.query(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'field_assertions_field_chk'`)).rows[0].d;
    for (const ma of ["floor_raw", "floor_band", "builder_name", "area_id"]) assert.ok(chk.includes(`'${ma}'`), `DV4-AC-1 trục thiếu ${ma}`);
    assert.match(await loiCua(c, `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
      VALUES ('TST:dv4-la', 'floor_lol', '1', 'observed', 'parser', $1)`, [AT]) ?? "", /field_assertions_field_chk/, "DV4-AC-1 trường lạ lọt");
    await c.query("SELECT resolve_offer_fields($1::text[])", [[id, id0]]);
    assert.equal(await tangCua(c, id), "7", "DV4-AC-1 phân xử làm mất tầng");
    assert.equal(await tangCua(c, id0), "0", "DV4-AC-1 phân xử làm mất tầng cũ ngoài miền");
  }, { nap: false });
});

test("DV4-AC-1 đỏ: bản sao 095 bỏ NOT EXISTS của bước legacy thì lần áp thứ hai đổ ở giá trị ngoài miền", { timeout: DAI }, async () => {
  const mau = /   AND NOT EXISTS \(SELECT 1 FROM sk JOIN field_assertions fa[\s\S]*?WHERE sk\.offer_id = o_\.offer_id\)\n/;
  assert.match(MIG_095, mau, "đột biến không khớp 095");
  const sql = MIG_095.replace(mau, "");
  await withTx(async (c) => {
    const [id] = await tinS06KhongTang(c);
    await c.query("UPDATE sale_offer_records SET floor_raw = '0' WHERE offer_id = $1", [id]);
    await napTang(c, { sql });
    assert.match(await loiCua(c, sql) ?? "", /floor_raw/, "DV4-AC-1 đỏ: bỏ NOT EXISTS mà lần hai vẫn qua — thước không đo idempotent");
    assert.equal(await loiCua(c, MIG_095), null, "DV4-AC-1 đối chứng: bản thật áp lại được");
  }, { nap: false });
});

const DUNG = [["floor_raw", "12"], ["floor_raw", "1"], ["floor_raw", "999"], ["floor_band", "lower"], ["floor_band", "middle"], ["floor_band", "upper"]];
const SAI = [["floor_raw", "0"], ["floor_raw", "1234"], ["floor_raw", "012"], ["floor_raw", "abc"], ["floor_raw", "tầng 5"], ["floor_raw", "tầng cao"],
  ["floor_band", "cao"], ["floor_band", "UPPER"], ["floor_band", "high"], ["floor_band", "mid"]];

test("DV4-AC-1 ma trận giá trị: đúng được nhận, sai bị từ chối nêu tên trường, ở mọi phương pháp", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    let so = 0;
    const chen = (f, v, m) => loiCua(c, `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
      VALUES ($1, $2, $3, $4, $5, $6)`, [`TST:dv4-${m}-${++so}`, f, v, EVIDENCE_TIER.observed, m, AT]);
    const boQua = [];
    let soDo = 0;
    for (const m of Object.values(ASSERTION_METHOD)) {
      const dc = await chen("floor_raw", "12", m);   // phương pháp không nhận lớp quan sát thì không đo được ở đây; đếm để không lặng im
      if (dc) { boQua.push(`${m}: ${dc}`); continue; }
      soDo++;
      for (const [f, v] of DUNG) assert.equal(await chen(f, v, m), null, `DV4-AC-1 đúng bị từ chối ${f}=${v} (${m})`);
      for (const [f, v] of SAI) assert.match(await chen(f, v, m) ?? "", new RegExp(f), `DV4-AC-1 sai lọt ${f}=${v} (${m})`);
    }
    console.log(`DV4-AC-1 đo ${soDo} phương pháp, không đo được: ${JSON.stringify(boQua)}`);
    assert.ok(soDo >= 2, "DV4-AC-1 phải đo được ít nhất parser và legacy");
  });
});

test("DV4-AC-1 mốc: hàm phân xử mất mốc thì 095 dừng có tên MOC-095", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    const def = (await c.query("SELECT pg_get_functiondef('resolve_offer_fields(text[])'::regprocedure) AS d")).rows[0].d;
    const moc = "::numeric AS longitude,";
    assert.ok(def.includes(moc), "DV4-AC-1 mốc: bản thật phải có mốc");
    await c.query(def.replace(moc, "::numeric AS longitude ,"));
    assert.match(await loiCua(c, MIG_095) ?? "", /MOC-095/, "DV4-AC-1 mốc: mất mốc mà 095 vẫn qua");
  }, { nap: false });
});

test("DV4-AC-2 tin S06 qua 095 ghi lại bằng writeOffers hai lượt vẫn còn tầng; bỏ legacy thì mất (đối chứng)", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    const [id] = await tinS06KhongTang(c);
    await c.query("UPDATE sale_offer_records SET floor_raw = '11' WHERE offer_id = $1", [id]);
    await napTang(c);
    const hang = (await c.query("SELECT offer_id, kind, price_vnd, area_m2, confidence, first_seen, last_seen FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0];
    // writeOffers đối soát cả nguồn: ghi một tin thì mọi tin S06 khác bị rút (hàng chục nghìn dòng, nhiều phút). Nghỉ sẵn chúng trong
    // giao dịch (ROLLBACK cuối ca) để đối soát không còn việc — ca chỉ đo đường ghi lại của chính tin này.
    await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot'
      WHERE source = 'S06' AND offer_id <> $1 AND retired_at IS NULL`, [id]);
    for (const lan of [1, 2]) {
      await writeOffers(c, "S06", [hang], { actor: "test:dv4" });
      assert.equal(await tangCua(c, id), "11", `DV4-AC-2 lượt ${lan}`);
    }
    await c.query("UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'test-dv4' WHERE field = 'floor_raw' AND rule_id = $1 AND retracted_at IS NULL", [`offer:${id}`]);
    await c.query("SELECT resolve_offer_fields($1::text[])", [[id]]);
    assert.equal(await tangCua(c, id), null, "DV4-AC-2 đối chứng: không có legacy mà tầng vẫn còn — thước không phân biệt");
  }, { nap: false });
});

// ===== Lượt transform: chữ dựng, giá lạ để không gom nhầm bài thật =====
const SNAP = "hanoi__zalo-agent__2099-01-06T000000";
const tag = `dv4_${process.pid}`;
let seq = 0;
async function post(c, text, sender = "a") {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
    ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  const id = `t_${tag}_${++seq}`;
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử DV4', $3, $4, $5, NULL, NULL)`, [id, SNAP, text, AT, `${tag}_${sender}`]);
  return id;
}
const phatBieu = async (c, id) => (await c.query(
  `SELECT field, value, evidence_tier, method, method_version, evidence ->> 'trich' AS trich, retracted_at IS NOT NULL AS rut, retract_reason
     FROM field_assertions WHERE subject_key = $1 AND field IN ('floor_raw', 'floor_band') ORDER BY id`, [`S03:${id}`])).rows;
const tinCua = async (c, id) => (await c.query(
  `SELECT offer_id, floor_raw, field_provenance FROM sale_offers WHERE $1 = ANY(post_ids)`, [id])).rows[0] ?? null;
const demTang = async (c) => Number((await c.query(`SELECT count(*) AS n FROM field_assertions WHERE field IN ('floor_raw', 'floor_band')`)).rows[0].n);

test("DV4-AC-4 lượt transform: phát biểu đúng, cột đúng, chạy lại không thêm, bất đồng báo conflict, đổi giá trị thì rút", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    const p1 = await post(c, "Bán căn hộ 2PN 65.1m2 giá 3.337 tỷ, tầng 12, view hồ");
    const p2 = await post(c, "Bán căn hộ 1PN 47.9m2 giá 2.113 tỷ tầng trung, full đồ", "c");
    const p3 = await post(c, "Bán căn hộ 2PN 71.3m2 giá 4.419 tỷ tầng 9", "b");
    const p4 = await post(c, "Bán căn hộ 2PN 71.3m2 giá 4.419 tỷ tầng 10", "b");
    await runTransformZalo(c);
    assert.deepEqual((await phatBieu(c, p1)).map((r) => [r.field, r.value, r.evidence_tier, r.method, r.method_version, r.trich]),
      [["floor_raw", "12", "observed", "parser", TANG_VERSION, "tầng 12"]], "DV4-AC-4 phát biểu số");
    assert.deepEqual((await phatBieu(c, p2)).map((r) => [r.field, r.value, r.trich]), [["floor_band", "middle", "tầng trung"]], "DV4-AC-4 phát biểu dải");
    assert.equal((await tinCua(c, p1)).floor_raw, "12", "DV4-AC-4 cột tầng");
    const t2 = await tinCua(c, p2);
    assert.equal(t2.floor_raw, null, "DV4-AC-4 dải không vào cột floor_raw");
    assert.equal(t2.field_provenance.floor_band?.v, "middle", "DV4-AC-4 dải phải ở field_provenance");
    const t3 = await tinCua(c, p3);
    assert.equal(t3.offer_id, (await tinCua(c, p4)).offer_id, "DV4-AC-4 hai bài phải cùng một tin để đo bất đồng");
    assert.equal(t3.field_provenance.floor_raw?.conflict, true, "DV4-AC-4 hai bài khác tầng phải báo conflict");
    const truoc = await demTang(c);
    await runTransformZalo(c);
    assert.equal(await demTang(c), truoc, "DV4-AC-4 chạy lại thêm dòng");
    await c.query("UPDATE stg_zalo_posts SET text = replace(text, 'tầng 12', 'tầng 14') WHERE post_id = $1", [p1]);
    await c.query("UPDATE stg_zalo_posts SET text = replace(text, 'tầng trung', 'tầng 8') WHERE post_id = $1", [p2]);
    await runTransformZalo(c);
    assert.deepEqual((await phatBieu(c, p1)).filter((r) => r.rut).map((r) => [r.field, r.value, r.retract_reason]),
      [["floor_raw", "12", "thay-boi-luot"]], "DV4-AC-4 số cũ phải rút");
    assert.deepEqual((await phatBieu(c, p2)).filter((r) => r.rut).map((r) => [r.field, r.value, r.retract_reason]),
      [["floor_band", "middle", "thay-boi-luot"]], "DV4-AC-4 dải cũ phải rút khi bài chuyển sang số");
    assert.equal((await tinCua(c, p1)).floor_raw, "14", "DV4-AC-4 cột theo giá trị mới");
    const t2s = await tinCua(c, p2);
    assert.equal(t2s.floor_raw, "8", "DV4-AC-4 bài dải sang số: cột theo số");
    assert.equal(t2s.field_provenance.floor_band, undefined, "DV4-AC-4 dải đã rút phải rời field_provenance");
  });
});

test("DV4-AC-6 DB chưa áp 095: lượt xong, cảnh báo 095, không phát biểu tầng, số tin bằng bản đã áp", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    const p = await post(c, "Bán căn hộ 2PN 58.7m2 giá 2.773 tỷ, tầng 9");
    assert.equal(await co095(c), false, "DV4-AC-6: DB thử phải chưa áp 095");
    const canh = [];
    const goc = console.warn;
    console.warn = (...a) => canh.push(a.join(" "));
    let chua;
    try {
      chua = await runTransformZalo(c);
    } finally {
      console.warn = goc;
    }
    assert.ok(canh.some((x) => x.includes("095")), "DV4-AC-6 thiếu cảnh báo nêu 095");
    assert.deepEqual(await phatBieu(c, p), [], "DV4-AC-6 không được có phát biểu tầng");
    await napTang(c);
    const da = await runTransformZalo(c);
    assert.equal(da.offers, chua.offers, "DV4-AC-6 số tin phải bằng nhau");
    assert.equal((await phatBieu(c, p)).length, 1, "DV4-AC-6 đã áp thì ghi (đối chứng dương)");
    assert.equal((await tinCua(c, p)).floor_raw, "9", "DV4-AC-6 cột");
  }, { nap: false });
});

// ===== AC-7: DQ s03-floor-fill trên đầu ra transform thật + vocab --check-db =====
const sqlDq = readFileSync(join(ROOT, "pipeline/sql/450_dq_checks.sql"), "utf8");
const DAU_DQ = "-- ============ s03-floor-fill";
function khoiDq() {
  const dau = sqlDq.indexOf(DAU_DQ);
  assert.ok(dau >= 0, "DV4-AC-7: 450 thiếu khối s03-floor-fill");
  return sqlDq.slice(dau, sqlDq.indexOf("-- ============", dau + DAU_DQ.length));
}
async function dq(c) {
  await c.query("DELETE FROM dq_check_results WHERE check_name = 's03-floor-fill'");
  await c.query(khoiDq());
  return (await c.query("SELECT status, detail FROM dq_check_results WHERE check_name = 's03-floor-fill'")).rows[0];
}

test("DV4-AC-7 dq: skip khi chưa có phát biểu tầng, pass trên đầu ra transform thật, fail khi rút còn dưới 5%", { timeout: DAI }, async () => {
  await withTx(async (c) => {
    assert.equal((await dq(c)).status, "skip", "DV4-AC-7 chưa có phát biểu tầng S03 phải skip");
    await runTransformZalo(c);
    const it = await dq(c);
    const so = it.detail.match(/^(\d+)\/(\d+) tin căn hộ S03 có tầng$/);
    assert.ok(so, `DV4-AC-7 detail sai khuôn: ${it.detail}`);
    const [n, m] = [Number(so[1]), Number(so[2])];
    console.log(`DV4-AC-7 dq_s03_floor_fill=${it.status} co_tang=${n}/${m}`);
    assert.ok(m > 100 && n > 0, `DV4-AC-7 đầu ra transform phải có tin căn hộ có tầng (${n}/${m})`);
    assert.equal(it.status, "pass", "DV4-AC-7 đầu ra transform thật phải pass");
    const { rows } = await c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'test-dv4'
      WHERE retracted_at IS NULL AND field IN ('floor_raw', 'floor_band') AND method_version = $1
        AND id NOT IN (SELECT min(id) FROM field_assertions WHERE method_version = $1 AND retracted_at IS NULL)
      RETURNING subject_key`, [TANG_VERSION]);
    assert.ok(rows.length > 0);
    await c.query(`SELECT resolve_offer_fields(array_agg(offer_id)) FROM sale_offer_records WHERE source = 'S03'`);
    assert.equal((await dq(c)).status, "fail", "DV4-AC-7 còn một tin có tầng phải fail (dưới 5%)");
  });
});

test("DV4-AC-7 vocab --check-db: xanh trên DB thử đã áp 095, đỏ khi chưa áp (đối chứng)", { timeout: DAI }, async () => {
  const sach = (ds) => ds.map((x) => x.msg);
  await withTx(async (c) => {
    assert.notDeepEqual(sach(await checkDb(c, readMappings(ROOT))), [], "DV4-AC-7 đối chứng: chưa áp 095 mà check-db vẫn xanh");
  }, { nap: false });
  await withTx(async (c) => {
    assert.deepEqual(sach(await checkDb(c, readMappings(ROOT))), [], "DV4-AC-7 --check-db lệch sau 095");
  });
});
