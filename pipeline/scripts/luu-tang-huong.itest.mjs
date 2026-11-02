// luu-tang-huong.itest.mjs — hồ sơ _acceptance/s03-luu-tang-huong (SV2): 067 và lượt transform S03 trên DB thử, BEGIN…ROLLBACK.
// Chỉ chạy trên DB thử (bash pipeline/scripts/luu-tang-huong-db.sh): DB thử chưa áp 067, mỗi ca tự nạp trong giao dịch. Chữ trong ca
// là chữ dựng, không phải bài thật. Giá mỗi ca khác nhau và lạ để không gom nhầm bài thật.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import pg from "pg";
import YAML from "yaml";

import { writeOffers } from "../lib/write-offers.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { co067 } from "../lib/assert.mjs";
import { MIG_067, napTangHuong } from "../lib/nap-067.mjs";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { ASSERTION_METHOD, EVIDENCE_TIER } from "../lib/vocab.generated.mjs";
import { parsePost, runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  throw new Error("luu-tang-huong.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>, không chạy trên oneinvest");
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const AT = "2099-01-05T01:00:00Z";

async function withTx(fn, { nap = true } = {}) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    if (nap) await napTangHuong(c);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
/** Chạy câu trong SAVEPOINT; trả thông điệp lỗi (null khi câu chạy được). */
async function loiCua(c, sql, p = []) {
  await c.query("SAVEPOINT sv2");
  try {
    await c.query(sql, p);
    await c.query("RELEASE SAVEPOINT sv2");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT sv2");
    return e.message;
  }
}
const tinS06KhongTang = async (c) => (await c.query(
  `SELECT offer_id FROM sale_offer_records WHERE source = 'S06' AND floor_raw IS NULL AND originating_system_key IS NOT NULL
     AND retired_at IS NULL ORDER BY offer_id LIMIT 1`)).rows[0].offer_id;
const soLegacy = async (c, id) => Number((await c.query(
  `SELECT count(*) AS n FROM field_assertions WHERE field = 'floor_raw' AND method = 'legacy' AND retracted_at IS NULL AND rule_id = $1`,
  [`offer:${id}`])).rows[0].n);

test("SV2-AC-1 áp 067 hai lần: không lỗi, hai trường và cột có mặt, đúng một phát biểu legacy", { timeout: 1_200_000 }, async () => {
  await withTx(async (c) => {
    assert.equal(await co067(c), false, "SV2-AC-1: DB thử phải chưa áp 067 để phép đo có nghĩa");
    const id = await tinS06KhongTang(c);
    await c.query("UPDATE sale_offer_records SET floor_raw = '1114' WHERE offer_id = $1", [id]);   // giá trị ngoài miền mới, có thật ở S06
    await napTangHuong(c);
    assert.equal(await soLegacy(c, id), 1, "SV2-AC-1 lần một");
    await napTangHuong(c);
    assert.equal(await soLegacy(c, id), 1, "SV2-AC-1 lần hai");
    assert.equal(await co067(c), true);
    const cotView = (await c.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_offers' AND column_name = 'unit_facing'`)).rowCount;
    assert.equal(cotView, 1, "SV2-AC-1 view sale_offers thiếu unit_facing");
    const chk = (await c.query(`SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname = 'field_assertions_field_chk'`)).rows[0].d;
    for (const ma of ["floor_raw", "unit_facing"]) assert.ok(chk.includes(`'${ma}'`), `SV2-AC-1 trục thiếu ${ma}`);
    await c.query("SELECT resolve_offer_fields($1::text[])", [[id]]);
    assert.equal((await c.query("SELECT floor_raw FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0].floor_raw, "1114", "SV2-AC-1 phân xử làm mất tầng");
  }, { nap: false });
});

test("SV2-AC-1 đỏ: bản sao 067 bỏ NOT EXISTS của bước legacy thì lần áp thứ hai đổ ở giá trị ngoài miền", { timeout: 1_200_000 }, async () => {
  const mau = /   AND NOT EXISTS \(SELECT 1 FROM sk JOIN field_assertions fa[\s\S]*?WHERE sk\.offer_id = o_\.offer_id\)\n/;
  assert.match(MIG_067, mau, "đột biến không khớp 067");
  const sql = MIG_067.replace(mau, "");
  await withTx(async (c) => {
    const id = await tinS06KhongTang(c);
    await c.query("UPDATE sale_offer_records SET floor_raw = '1114' WHERE offer_id = $1", [id]);
    await napTangHuong(c, { sql });
    assert.match(await loiCua(c, sql) ?? "", /floor_raw/, "SV2-AC-1 đỏ: bỏ NOT EXISTS mà lần hai vẫn qua — thước không đo idempotent");
  }, { nap: false });
});

const DUNG = [["floor_raw", "12"], ["floor_raw", "tầng cao"], ["floor_raw", "tầng thấp"], ["floor_raw", "tầng trung"],
  ["unit_facing", "balcony:southeast"], ["unit_facing", "unspecified:northeast,southeast"], ["unit_facing", "door:north"]];
const SAI = [["floor_raw", "abc"], ["floor_raw", "1234"], ["floor_raw", "tầng 5"], ["floor_raw", "cao"],
  ["unit_facing", "balcony:nam"], ["unit_facing", "sideways:east"], ["unit_facing", "balcony:"], ["unit_facing", "balcony:east,east"], ["unit_facing", "balcony:west,east"]];

test("SV2-AC-2 ma trận giá trị: đúng được nhận, sai bị từ chối nêu tên trường, ở mọi phương pháp và ghi thẳng cột", { timeout: 1_200_000 }, async () => {
  await withTx(async (c) => {
    let so = 0;   // mỗi lần ghi một chủ thể: chỉ đo khuôn giá trị, không đụng khoá duy nhất của phát biểu
    const chen = (f, v, m) => loiCua(c, `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
      VALUES ($1, $2, $3, $4, $5, $6)`, [`TST:sv2-${m}-${++so}`, f, v, EVIDENCE_TIER.observed, m, AT]);
    const boQua = [];
    let soDo = 0;
    for (const m of Object.values(ASSERTION_METHOD)) {
      const dc = await chen("floor_raw", "12", m);   // phương pháp không nhận lớp quan sát thì không đo được ở đây; đếm để không lặng im
      if (dc) { boQua.push(`${m}: ${dc}`); continue; }
      soDo++;
      for (const [f, v] of DUNG) assert.equal(await chen(f, v, m), null, `SV2-AC-2 đúng bị từ chối ${f}=${v} (${m})`);
      for (const [f, v] of SAI) assert.match(await chen(f, v, m) ?? "", new RegExp(f), `SV2-AC-2 sai lọt ${f}=${v} (${m})`);
    }
    console.log(`SV2-AC-2 đo ${soDo} phương pháp, không đo được: ${JSON.stringify(boQua)}`);
    assert.ok(soDo >= 2, "SV2-AC-2 phải đo được ít nhất parser và legacy");
    const id = await tinS06KhongTang(c);
    for (const [, v] of DUNG.filter(([f]) => f === "unit_facing")) {
      assert.equal(await loiCua(c, "UPDATE sale_offer_records SET unit_facing = $1 WHERE offer_id = $2", [v, id]), null, `SV2-AC-2 cột đúng ${v}`);
    }
    for (const [, v] of SAI.filter(([f]) => f === "unit_facing")) {
      assert.match(await loiCua(c, "UPDATE sale_offer_records SET unit_facing = $1 WHERE offer_id = $2", [v, id]) ?? "", /unit_facing/, `SV2-AC-2 cột sai ${v}`);
    }
  });
});

test("SV2-AC-3 tin S06 qua 067 ghi lại bằng writeOffers hai lượt vẫn còn tầng", { timeout: 1_200_000 }, async () => {
  await withTx(async (c) => {
    const id = await tinS06KhongTang(c);
    await c.query("UPDATE sale_offer_records SET floor_raw = '1114' WHERE offer_id = $1", [id]);
    await napTangHuong(c);
    const hang = (await c.query("SELECT offer_id, kind, price_vnd, area_m2, confidence, first_seen, last_seen FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0];
    for (const lan of [1, 2]) {
      await writeOffers(c, "S06", [hang], { actor: "test:sv2" });
      assert.equal((await c.query("SELECT floor_raw FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0].floor_raw, "1114", `SV2-AC-3 lượt ${lan}`);
    }
  }, { nap: false });
});

test("SV2-AC-8 sáu điều kiện ADR-0011: sổ, kiểm DB, tài liệu RESO, DQ ba trạng thái", { timeout: 1_200_000 }, async () => {
  const doc = YAML.parse(readFileSync(join(ROOT, "pipeline/mappings.yaml"), "utf8"));
  const f = doc.canonical.fields;
  assert.equal(f.unit_facing.dd, null);
  assert.ok(f.unit_facing.rationale && f.unit_facing.checked_on, "SV2-AC-8 unit_facing thiếu rationale, checked_on");
  assert.equal(f.floor_raw.dd, "UnitFloorLocation");
  assert.deepEqual(doc.enums.unit_facing_of.values.map((v) => v.code), ["balcony", "door", "unspecified"]);
  assert.equal(doc.enums.facing_direction.values.length, 8);
  execFileSync("node", ["pipeline/vocab.mjs", "--check"], { cwd: ROOT, stdio: "pipe" });
  const reso = readFileSync(join(ROOT, "docs/architecture/reso-khung-phan-loai.md"), "utf8");
  assert.match(reso, /`unit_facing`[^\n]*Tách khỏi `DirectionFaces`/, "SV2-AC-8 tài liệu RESO chưa tách hướng S03");
  const sqlDq = readFileSync(join(ROOT, "pipeline/sql/450_dq_checks.sql"), "utf8");
  const dau = sqlDq.indexOf("-- ============ (e) s03-unit-facing-fill");
  const khoi = sqlDq.slice(dau, sqlDq.indexOf("-- Tổng kết cho log", dau));
  await withTx(async (c) => {
    assert.deepEqual((await checkDb(c, readMappings(ROOT))).map((x) => x.msg), [], "SV2-AC-8 --check-db lệch");
    const dq = async () => {
      await c.query("DELETE FROM dq_check_results WHERE check_name = 's03-unit-facing-fill'");
      await c.query(khoi);
      return (await c.query("SELECT status FROM dq_check_results WHERE check_name = 's03-unit-facing-fill'")).rows[0].status;
    };
    assert.equal(await dq(), "skip", "SV2-AC-8 chưa có phát biểu phải skip");
    const { rows: tin } = await c.query(`SELECT offer_id, post_ids[1] AS p FROM sale_offers WHERE source = 'S03' AND post_ids[1] IS NOT NULL ORDER BY offer_id`);
    const ghi = (ds) => c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
      SELECT 'S03:' || p, 'unit_facing', 'unspecified:north', 'observed', 'parser', $2 FROM unnest($1::text[]) p ON CONFLICT DO NOTHING`, [ds, AT]);
    const it = tin.slice(0, 2);
    await ghi(it.map((t) => t.p));
    await c.query("SELECT resolve_offer_fields($1::text[])", [it.map((t) => t.offer_id)]);
    assert.equal(await dq(), "fail", "SV2-AC-8 có phát biểu mà dưới 5% phải fail");
    const du = tin.slice(0, Math.ceil(tin.length * 0.06));
    await ghi(du.map((t) => t.p));
    await c.query("SELECT resolve_offer_fields($1::text[])", [du.map((t) => t.offer_id)]);
    assert.equal(await dq(), "pass", "SV2-AC-8 đủ phải pass");
  });
});

// ===== Lượt transform: chữ dựng, giá lạ để không gom nhầm bài thật =====
const SNAP = "hanoi__zalo-agent__2099-01-05T000000";
const tag = `sv2_${process.pid}`;
let seq = 0;
async function post(c, text, sender = "a") {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
    ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  const id = `t_${tag}_${++seq}`;
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử SV2', $3, $4, $5, NULL, NULL)`, [id, SNAP, text, AT, `${tag}_${sender}`]);
  return id;
}
const phatBieu = async (c, id) => (await c.query(
  `SELECT field, value, evidence_tier, method, method_version, retracted_at IS NOT NULL AS rut, retract_reason FROM field_assertions
    WHERE subject_key = $1 AND field IN ('floor_raw', 'unit_facing') ORDER BY field, id`, [`S03:${id}`])).rows;
const tinCua = async (c, id) => (await c.query(
  `SELECT offer_id, floor_raw, unit_facing, field_provenance FROM sale_offers WHERE $1 = ANY(post_ids)`, [id])).rows[0] ?? null;

test("SV2-AC-6 lượt transform: phát biểu đúng, cột đúng, chạy lại không thêm, bất đồng báo conflict, đổi giá trị thì rút", { timeout: 1_800_000 }, async () => {
  await withTx(async (c) => {
    const p1 = await post(c, "Bán căn hộ 2PN 65.1m2 giá 3.337 tỷ, tầng 12, ban công Đông Nam");
    const p2 = await post(c, "Bán căn hộ 2PN 71.3m2 giá 4.419 tỷ tầng cao hướng Tây", "b");
    const p3 = await post(c, "Bán căn hộ 2PN 71.3m2 giá 4.419 tỷ tầng thấp hướng Đông", "b");
    await runTransformZalo(c);
    assert.deepEqual((await phatBieu(c, p1)).map((r) => [r.field, r.value, r.evidence_tier, r.method, r.method_version]), [
      ["floor_raw", "12", "observed", "parser", "transform-zalo@sv2"],
      ["unit_facing", "balcony:southeast", "observed", "parser", "transform-zalo@sv2"],
    ], "SV2-AC-6 phát biểu");
    const t1 = await tinCua(c, p1);
    assert.equal(t1.floor_raw, "12", "SV2-AC-6 cột tầng");
    assert.equal(t1.unit_facing, "balcony:southeast", "SV2-AC-6 cột hướng");
    const t2 = await tinCua(c, p2);
    assert.equal(t2.offer_id, (await tinCua(c, p3)).offer_id, "SV2-AC-6 hai bài phải cùng một tin để đo bất đồng");
    for (const f of ["floor_raw", "unit_facing"]) assert.equal(t2.field_provenance[f]?.conflict, true, `SV2-AC-6 ${f} phải báo conflict`);
    const dem = async () => Number((await c.query(`SELECT count(*) AS n FROM field_assertions WHERE field IN ('floor_raw', 'unit_facing')`)).rows[0].n);
    const truoc = await dem();
    await runTransformZalo(c);
    assert.equal(await dem(), truoc, "SV2-AC-6 chạy lại thêm dòng");
    const parse = (t, o) => (t.includes("65.1m2") ? { ...parsePost(t, o), floor: "9", facing: "door:north" } : parsePost(t, o));
    await runTransformZalo(c, { parse });
    const sau = await phatBieu(c, p1);
    assert.deepEqual(sau.filter((r) => r.rut).map((r) => [r.field, r.value, r.retract_reason]), [
      ["floor_raw", "12", "thay-boi-luot"], ["unit_facing", "balcony:southeast", "thay-boi-luot"],
    ], "SV2-AC-6 phát biểu cũ phải rút");
    const t1s = await tinCua(c, p1);
    assert.deepEqual([t1s.floor_raw, t1s.unit_facing], ["9", "door:north"], "SV2-AC-6 cột theo giá trị mới");
  });
});

test("SV2-AC-10 DB chưa áp 067: lượt xong, cảnh báo 067, không phát biểu hai trường, số tin bằng bản đã áp", { timeout: 1_800_000 }, async () => {
  await withTx(async (c) => {
    const p = await post(c, "Bán căn hộ 2PN 58.7m2 giá 2.773 tỷ, tầng 9, hướng Nam");
    assert.equal(await co067(c), false, "SV2-AC-10: DB thử phải chưa áp 067");
    const canh = [];
    const goc = console.warn;
    console.warn = (...a) => canh.push(a.join(" "));
    let chua;
    try {
      chua = await runTransformZalo(c);
    } finally {
      console.warn = goc;
    }
    assert.ok(canh.some((x) => x.includes("067")), "SV2-AC-10 thiếu cảnh báo nêu 067");
    assert.deepEqual(await phatBieu(c, p), [], "SV2-AC-10 không được có phát biểu hai trường");
    await napTangHuong(c);
    const da = await runTransformZalo(c);
    assert.equal(da.offers, chua.offers, "SV2-AC-10 số tin phải bằng nhau");
    assert.equal((await phatBieu(c, p)).length, 2, "SV2-AC-10 đã áp thì ghi đủ");
    const tin = await tinCua(c, p);
    assert.deepEqual([tin.floor_raw, tin.unit_facing], ["9", "unspecified:south"], "SV2-AC-10 cột");
  }, { nap: false });
});
