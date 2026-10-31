// judge-run.test.ts — PL25 `judge-nguong-la-code` AC-2b..AC-9 (E2b–E9): chamMotLuot sinh/cập nhật thẻ hàng duyệt.
// Thêm hồ sơ `judge-giu-quyet-dinh-nguoi` AC-1..AC-3 (E1–E3): thẻ người quyết giữa lúc chấm không bị máy ghi đè.
// Thêm hồ sơ `judge-evidence-du-truong` AC-1, AC-3, AC-4 (E1, E3, E4): thẻ mang đủ mười trường của bảng so; ca AC-6 cũ thay bằng JE-AC-1.
// Thêm hồ sơ `the-ghep-can-tin-roi-kho` RK-AC-1..8, 10, 11 (E1–E8, E10, E11): thẻ có tin rời kho rút/trả lại; ops_audit từ 018.
// DB thử RỖNG riêng trên :5433 (tạo đầu tệp, xoá cuối tệp) — không chạm `oneinvest`. Lược đồ rút từ migration thật:
// khối property_candidates của 027, 029 tới «-- Seed», 052 nguyên tệp; sale_offers tối thiểu theo hình 044: bảng
// sale_offer_records (đích khoá ngoại) + view sale_offers lọc retired_at IS NULL — tin rời kho là hàng đã nghỉ.
// Model giả MockLanguageModelV4. Mỗi ca có đối chứng đỏ chạy ĐÚNG hàm kiểm trên vật hỏng, thông điệp ghim theo evals.yaml.
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import pg from "pg";
import { MockLanguageModelV4 } from "ai/test";
import { TR, cap, khoaBangSo, khuonBen, kiemKhongNguong, kiemKhuonThe, napBangSo, type Tin } from "./judge-chung.js";
import { NGUONG, apNguong } from "../src/agents/judge-entity.js";
import type { PairData } from "../src/tools/native.js";
import {
  CAU_DEM_THIEU_THE,
  MAY,
  SQL_CAP_NHAT,
  SQL_RUT_ROI_KHO,
  SQL_TIN_SONG,
  chamMotLuot,
  evidenceThe,
  type ChamDeps,
} from "../scripts/judge-run.js";

const SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const TEN_DB = `oneinvest_p3_judge_test_${process.pid}`;
const TEST_DB_URL = `${SERVER}/${TEN_DB}`;
const MIG = (f: string) => join(import.meta.dirname, "../../db/migrations", f);

const goc: Tin = { perm2: 100 * TR, area: 50, phuong: "Bình Thạnh", loai: "nha_pho" };
const voi = (o: Partial<Tin>): Tin => ({ ...goc, ...o });
/** Số đo từng tin theo mã; queryPair giả dựng cặp đúng chiều được hỏi. */
const TIN: Record<string, Tin> = {
  o1: goc, o2: voi({ perm2: 105 * TR, area: 52 }), // yes
  o3: goc, o4: voi({ perm2: 170 * TR, area: 52 }), // no
  o5: goc, o6: voi({ perm2: 125 * TR, area: 52 }), // unsure
  o7: goc, o8: voi({ perm2: 105 * TR, area: 52 }), // cặp pending (không phải needs_llm)
  o9: goc, o10: voi({ perm2: 105 * TR, area: 52 }),
  o11: goc, o12: voi({ perm2: 105 * TR, area: 52 }),
  o13: goc, o14: voi({ perm2: 105 * TR, area: 52 }),
};
const dungCap = (a: string, b: string): PairData => {
  const p = cap(TIN[a], TIN[b]);
  return { ...p, a: { ...p.a, offerId: a }, b: { ...p.b, offerId: b } };
};
const queryPair = async (a: string, b: string) => (TIN[a] && TIN[b] ? dungCap(a, b) : null);

const usage = { inputTokens: { total: 50, noCache: 50, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 10, text: 10, reasoning: undefined } };
/** Model giả trả `text`, đếm lần gọi và bắt nguyên văn prompt nó nhận. */
function modelTra(text: string, modelId = "mock-giai-thich") {
  const bat: string[] = [];
  const m = new MockLanguageModelV4({
    modelId,
    doGenerate: async (o) => {
      bat.push(JSON.stringify(o.prompt));
      return { content: [{ type: "text", text }], finishReason: { unified: "stop", raw: "stop" }, usage, warnings: [] };
    },
  });
  return { m, bat };
}
class LoiCoPrompt extends Error {
  name = "LoiCoPrompt";
  responseBody = '{"prompt":"PROMPT-MAU bí mật"}';
}
const modelLoi = () =>
  new MockLanguageModelV4({ modelId: "mock-loi", doGenerate: async () => { throw new LoiCoPrompt("hỏng"); } });
const khongGhiSo = async () => {};
const deps = (o: Partial<ChamDeps> = {}): ChamDeps => ({ queryPair, recordCall: khongGhiSo, ...o });

let db: pg.Client;
const nap = async (caps: [string, string, string][]) => {
  for (const [a, b, st] of caps) {
    await db.query(`INSERT INTO sale_offers (offer_id) VALUES ($1), ($2) ON CONFLICT DO NOTHING`, [a, b]);
    await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ($1, $2, 0.92, $3)`, [a, b, st]);
  }
};
const FIX_AC6: [string, string, string][] = [
  ["o1", "o2", "needs_llm"], ["o3", "o4", "needs_llm"], ["o5", "o6", "needs_llm"], ["o7", "o8", "pending"],
];
const the = async (itemId: string) =>
  (await db.query(`SELECT * FROM review_queue WHERE item_type = 'entity_match' AND item_id = $1`, [itemId])).rows[0];
const tatCaThe = async () => (await db.query(`SELECT * FROM review_queue WHERE item_type = 'entity_match' ORDER BY id`)).rows;

before(async () => {
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.query(`CREATE DATABASE ${TEN_DB}`);
  await admin.end();
  db = new pg.Client({ connectionString: TEST_DB_URL });
  await db.connect();
  const m027 = await readFile(MIG("027_properties.sql"), "utf8");
  const khoiPC = m027.match(/CREATE TABLE IF NOT EXISTS property_candidates \([\s\S]*?\n\);/);
  assert.ok(khoiPC, "không rút được khối property_candidates từ 027");
  const m029 = (await readFile(MIG("029_review_queue.sql"), "utf8")).split("-- Seed")[0];
  await db.query(`CREATE TABLE sale_offer_records (offer_id text PRIMARY KEY, ghi_chu text, retired_at timestamptz)`);
  await db.query(`CREATE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL`);
  await db.query(khoiPC[0].replace(/REFERENCES sale_offers\b/g, "REFERENCES sale_offer_records"));
  await db.query(m029);
  await db.query(await readFile(MIG("052_ai_calls.sql"), "utf8"));
  await db.query(await readFile(MIG("018_ops_audit.sql"), "utf8"));
  process.env.DATABASE_URL = TEST_DB_URL; // recordCallDb đọc DATABASE_URL lúc gọi
});

beforeEach(async () => {
  await db.query("TRUNCATE review_queue, property_candidates, sale_offer_records, ai_calls, ops_audit RESTART IDENTITY CASCADE");
});

after(async () => {
  await db?.end();
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.end();
});

// ── AC-2b
test("AC-2 prompt model nhận — không chứa ngưỡng (yes/no/unsure)", async () => {
  await nap(FIX_AC6.slice(0, 3));
  const { m, bat } = modelTra('{"giai_thich":"GT-MAU"}');
  await chamMotLuot(db, deps({ model: m }));
  assert.equal(bat.length, 3);
  const ketLuan = new Set(FIX_AC6.slice(0, 3).map(([a, b]) => apNguong(dungCap(a, b)).same_house));
  assert.deepEqual([...ketLuan].sort(), ["no", "unsure", "yes"]);
  for (const p of bat) kiemKhongNguong(p);
  // đối chứng đỏ: một đoạn có NGUONG nối vào prompt bắt được
  assert.throws(() => kiemKhongNguong(`${bat[0]}\n${JSON.stringify(NGUONG)}`), /AC-2 prompt chứa ngưỡng/);
});

// ── AC-3
const kiemKhongDe = (t: { ai_suggestion: string | null; ai_reasoning: string | null; evidence: { cham?: { ket_luan?: string } } }, kyVong: string) =>
  assert.ok(
    t.ai_suggestion === kyVong && t.evidence.cham?.ket_luan === kyVong &&
      (t.ai_reasoning ?? "").includes("GT-MAU") && !(t.ai_reasoning ?? "").includes("same_house"),
    "AC-3 model đè kết luận luật",
  );
test("AC-3 model trái luật — kết luận vẫn theo luật", async () => {
  await nap([["o1", "o2", "needs_llm"]]);
  assert.equal(apNguong(dungCap("o1", "o2")).same_house, "yes");
  const { m } = modelTra('{"same_house":"no","giai_thich":"GT-MAU"}');
  await chamMotLuot(db, deps({ model: m }));
  const t = await the("pair:o1|o2");
  kiemKhongDe(t, "yes");
  assert.throws(() => kiemKhongDe({ ...t, ai_suggestion: "no" }, "yes"), /AC-3 model đè kết luận luật/);
});

// ── AC-4
const kiemSo = (n: number) => assert.equal(n, 1, "AC-4 sổ ai_calls thiếu cuộc gọi");
const kiemThe = (c: { model?: string | null; trace?: string | null }, dong: { model: string; trace: string }) =>
  assert.ok(c.model && c.trace && c.model === dong.model && c.trace === dong.trace, "AC-4 thẻ thiếu model/trace");
test("AC-4 model và trace — thẻ khớp dòng ai_calls", async () => {
  await nap([["o1", "o2", "needs_llm"]]);
  const { m } = modelTra('{"giai_thich":"GT-MAU"}', "mock-giai-thich");
  await chamMotLuot(db, { queryPair, model: m }); // recordCall mặc định: bản bọc gọi tiếp recordCallDb thật
  const dongs = (await db.query(`SELECT * FROM ai_calls WHERE viec = 'judge-entity'`)).rows;
  kiemSo(dongs.length);
  const t = await the("pair:o1|o2");
  const c = t.evidence.cham;
  kiemThe(c, dongs[0]);
  assert.equal(c.model, "mock-giai-thich");
  assert.equal(c.ok, true);
  assert.ok(existsSync(c.trace), `tệp trace không tồn tại: ${c.trace}`);
  assert.ok(t.ai_reasoning.endsWith(`LLM mock-giai-thich · trace ${basename(c.trace)}`), t.ai_reasoning);
  assert.equal(t.ai_confidence, null);
  // đối chứng đỏ 1: bản bọc không gọi tiếp sổ thật → sổ trống
  await db.query("TRUNCATE review_queue, ai_calls RESTART IDENTITY");
  await chamMotLuot(db, deps({ model: modelTra('{"giai_thich":"GT-MAU"}').m }));
  const n = (await db.query(`SELECT count(*)::int AS n FROM ai_calls`)).rows[0].n;
  assert.throws(() => kiemSo(n), /AC-4 sổ ai_calls thiếu cuộc gọi/);
  // đối chứng đỏ 2: thẻ thiếu cham.trace
  assert.throws(() => kiemThe({ ...c, trace: null }, dongs[0]), /AC-4 thẻ thiếu model\/trace/);
});

// ── AC-5
const kiemGiuKetLuan = (t: { ai_suggestion: string | null; ai_reasoning: string | null }, kyVong: string) =>
  assert.ok(t.ai_suggestion === kyVong && (t.ai_reasoning ?? "").includes("Luật:"), "AC-5 lỗi model làm mất kết luận");
test("AC-5 model lỗi — ma trận 3 ô, kết luận luật giữ", async () => {
  await nap([["o1", "o2", "needs_llm"]]);
  const kv = apNguong(dungCap("o1", "o2")).same_house;
  // (a) model ném lỗi có thân chứa prompt
  await chamMotLuot(db, deps({ model: modelLoi() }));
  let t = await the("pair:o1|o2");
  kiemGiuKetLuan(t, kv);
  assert.equal(t.evidence.cham.ok, false);
  assert.equal(t.evidence.cham.model, "mock-loi");
  assert.ok(t.evidence.cham.loi.length <= 80 && !t.evidence.cham.loi.includes("PROMPT-MAU"), t.evidence.cham.loi);
  // (b) model trả sai khuôn
  await chamMotLuot(db, deps({ model: modelTra("khong phai json").m }));
  t = await the("pair:o1|o2");
  kiemGiuKetLuan(t, kv);
  assert.equal(t.evidence.cham.ok, false);
  assert.equal(t.evidence.cham.loi, "sai-khuon");
  // (c) khongLlm — model không được gọi
  const dem = modelTra('{"giai_thich":"GT-MAU"}');
  await chamMotLuot(db, deps({ model: dem.m, khongLlm: true }));
  t = await the("pair:o1|o2");
  kiemGiuKetLuan(t, kv);
  assert.equal(dem.bat.length, 0);
  assert.equal(t.evidence.cham.model, null);
  assert.equal(t.evidence.cham.loi, "khong-llm");
  // đối chứng đỏ
  assert.throws(() => kiemGiuKetLuan({ ...t, ai_suggestion: null }, kv), /AC-5 lỗi model làm mất kết luận/);
});

// ── AC-6 cũ (judge-nguong-la-code/E6) thay bởi judge-evidence-du-truong#AC-1 — khuôn khoá = seed 029 ∪ bảng so.
const kiemDuThe = async () => {
  const { rows } = await db.query(`SELECT pc.offer_a || '|' || pc.offer_b AS cap FROM property_candidates pc
    WHERE pc.status = 'needs_llm' AND NOT EXISTS (SELECT 1 FROM review_queue r WHERE r.item_type = 'entity_match'
      AND r.item_id IN ('pair:' || pc.offer_a || '|' || pc.offer_b, 'pair:' || pc.offer_b || '|' || pc.offer_a))`);
  assert.equal(rows.length, 0, `JE-AC-1 ứng viên thiếu thẻ: ${rows.map((r) => r.cap).join(", ")}`);
};
const demThieu = async () => (await db.query(CAU_DEM_THIEU_THE)).rows[0].n as number;
const BON = ["street", "block", "floor", "bathrooms"] as const;
/** Khoá rơi khi JSON hoá (undefined) cũng là lệch khuôn: so trên bản đã qua JSON như cột jsonb nhận. */
const khoaSauJson = (o: object) => Object.keys(JSON.parse(JSON.stringify(o))).sort();

test("JE-AC-1 sinh thẻ đủ mười trường — mọi cặp needs_llm có đúng một thẻ, khuôn seed 029 ∪ bảng so", async () => {
  await nap(FIX_AC6);
  const bangSo = await khoaBangSo();
  assert.equal(bangSo.length, 10, "JE-AC-1 bảng so không đủ mười trường");
  const mauA = await khuonBen("offer_a");
  const mauB = await khuonBen("offer_b");
  // đối chứng đỏ (1): bỏ bước sinh (chưa thẻ nào)
  assert.equal(await demThieu(), 3);
  await assert.rejects(kiemDuThe(), /JE-AC-1 ứng viên thiếu thẻ: o1\|o2/);

  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  assert.equal(dem.sinh, 3);
  const ts = await tatCaThe();
  assert.equal(ts.length, 3);
  for (const [a, b] of FIX_AC6.slice(0, 3)) {
    const t = await the(`pair:${a}|${b}`);
    assert.ok(t, `thiếu thẻ pair:${a}|${b}`);
    assert.equal(t.status, "pending");
    assert.equal(t.evidence.offer_a.offer_id, a);
    assert.equal(t.evidence.offer_b.offer_id, b);
    assert.equal(t.ai_suggestion, apNguong(dungCap(a, b)).same_house);
    assert.ok(t.title.startsWith("Cùng căn? "), t.title);
    kiemKhuonThe(Object.keys(t.evidence.offer_a).sort(), mauA);
    kiemKhuonThe(Object.keys(t.evidence.offer_b).sort(), mauB);
    for (const ben of ["offer_a", "offer_b"] as const)
      for (const k of BON) {
        assert.ok(Object.hasOwn(t.evidence[ben], k), `JE-AC-1 thẻ lệch khuôn: ${k}`);
        assert.equal(t.evidence[ben][k], null);
      }
  }
  assert.equal(await the("pair:o7|o8"), undefined);
  assert.equal(await demThieu(), 0);
  await kiemDuThe();
  // đối chứng đỏ (2): bộ khoá bỏ 'street'
  assert.throws(() => kiemKhuonThe(mauA.filter((k) => k !== "street"), mauA), /JE-AC-1 thẻ lệch khuôn: street/);
  // đối chứng đỏ (3): bên A có street = undefined → khoá rơi khi JSON hoá
  const benA = { ...evidenceThe(dungCap("o1", "o2")).offer_a, street: undefined };
  assert.throws(() => kiemKhuonThe(khoaSauJson(benA), mauA), /JE-AC-1 thẻ lệch khuôn: street/);
  // đối chứng đỏ (4): không rút được TRUONG_GHEP_CAN
  await assert.rejects(khoaBangSo("TRUONG_GHEP_CAN_SAI"), /JE-AC-1 không rút được TRUONG_GHEP_CAN/);
});

// ── judge-evidence-du-truong AC-3: bốn trường mang giá trị của đúng bên, và bảng so thật hiện đúng.
const CO_A = { street: "Đường Phan Văn Trị", block: "A1", floor: "12", bathrooms: 2 };
const CO_B = { street: "Phan Văn Trị", block: "B2", floor: "7", bathrooms: 3 };
TIN.o15 = voi(CO_A);
TIN.o16 = voi({ ...CO_B, perm2: 105 * TR, area: 52 });
TIN.o17 = goc;
TIN.o18 = voi({ perm2: 105 * TR, area: 52 });
type Ev = { offer_a: Record<string, unknown>; offer_b: Record<string, unknown> };
/** 16 ô viết trước: 4 trường × 2 bên × {có (o15|o16), null (o17|o18)}. Trả số assert đã chạy. */
const kiemGiaTri = (evCo: Ev, evNull: Ev, pCo: PairData) => {
  let n = 0;
  for (const [ben, p] of [["offer_a", pCo.a], ["offer_b", pCo.b]] as const)
    for (const k of BON) {
      assert.equal(evCo[ben][k], p[k], `JE-AC-3 thẻ sai giá trị: ${ben}.${k}`);
      assert.equal(evNull[ben][k], null, `JE-AC-3 thẻ sai giá trị: ${ben}.${k}`);
      n += 2;
    }
  return n;
};
const kiemBangSo = (hang: { key: string; a: unknown; b: unknown; so: string }[], kyVongA: Record<string, unknown>, kyVongB: Record<string, unknown>, rong: boolean) => {
  let n = 0;
  for (const k of BON) {
    const h = hang.find((x) => x.key === k);
    assert.ok(h, `JE-AC-3 bảng so thiếu hàng: ${k}`);
    assert.equal(h.a, rong ? null : kyVongA[k], `JE-AC-3 bảng so sai: ${k}.a`);
    assert.equal(h.b, rong ? null : kyVongB[k], `JE-AC-3 bảng so sai: ${k}.b`);
    if (rong) assert.equal(h.so, "thieu", `JE-AC-3 bảng so sai: ${k}.so`);
    n += 2;
  }
  return n;
};
test("JE-AC-3 thẻ mang giá trị bốn trường — evidence và bảng so thật", async () => {
  await nap([["o15", "o16", "needs_llm"], ["o17", "o18", "needs_llm"]]);
  await chamMotLuot(db, deps({ khongLlm: true }));
  const evCo = (await the("pair:o15|o16")).evidence as Ev;
  const evNull = (await the("pair:o17|o18")).evidence as Ev;
  const pCo = dungCap("o15", "o16");
  assert.deepEqual([pCo.a.street, pCo.b.street], [CO_A.street, CO_B.street]);
  assert.equal(kiemGiaTri(evCo, evNull, pCo), 16);
  const bs = await napBangSo();
  try {
    let n = kiemBangSo(bs.soTruongGhepCan(evCo.offer_a, evCo.offer_b), CO_A, CO_B, false);
    n += kiemBangSo(bs.soTruongGhepCan(evNull.offer_a, evNull.offer_b), {}, {}, true);
    assert.equal(n, 16);
    // đối chứng đỏ (2): bên A ghi 'street_raw' thay 'street' → hàng Đường mất giá trị
    const { street, ...conLai } = evCo.offer_a;
    assert.throws(
      () => kiemBangSo(bs.soTruongGhepCan({ ...conLai, street_raw: street }, evCo.offer_b), CO_A, CO_B, false),
      /JE-AC-3 bảng so sai: street\.a/,
    );
  } finally {
    await bs.don();
  }
  // đối chứng đỏ (1): tráo bốn trường hai bên
  const trao = (e: Ev): Ev => {
    const a = { ...e.offer_a }, b = { ...e.offer_b };
    for (const k of BON) [a[k], b[k]] = [b[k], a[k]];
    return { offer_a: a, offer_b: b };
  };
  assert.throws(() => kiemGiaTri(trao(evCo), evNull, pCo), /JE-AC-3 thẻ sai giá trị: offer_a\.street/);
});

// ── judge-evidence-du-truong AC-4: thẻ cũ khuôn tám khoá — dữ liệu hai tin không đổi khi chạy lại.
const anhTin = async (itemId: string) =>
  (await db.query(`SELECT evidence->'offer_a' AS a, evidence->'offer_b' AS b, evidence ? 'cham' AS co_cham
    FROM review_queue WHERE item_id = $1`, [itemId])).rows[0];
const kiemTheCu = (truoc: { a: unknown; b: unknown }, sau: { a: unknown; b: unknown }) => {
  assert.deepEqual(sau.a, truoc.a, "JE-AC-4 thẻ cũ bị sửa dữ liệu tin: offer_a");
  assert.deepEqual(sau.b, truoc.b, "JE-AC-4 thẻ cũ bị sửa dữ liệu tin: offer_b");
};
test("JE-AC-4 thẻ cũ giữ khuôn — chạy lại chỉ nối kết quả chấm", async () => {
  await nap([["o1", "o2", "needs_llm"]]);
  const tin8 = (id: string, cuoi: Record<string, string>) => ({
    offer_id: id, source: "S03", price_vnd: 5e9, area_m2: 50, price_perm2: 1e8, bedrooms: null, phuong: "Bình Thạnh",
    property_type: "nha_pho", ...cuoi,
  });
  await db.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence) VALUES ('entity_match', 'pair:o1|o2', 'Cùng căn? cũ', $1::jsonb)`,
    [JSON.stringify({ offer_a: tin8("o1", { text: "tin A" }), offer_b: tin8("o2", { subject: "tin B" }), stage_b_score: 0.92 })],
  );
  const truoc = await anhTin("pair:o1|o2");
  assert.equal(Object.keys(truoc.a).length, 9);
  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  assert.equal(dem.sinh, 0);
  assert.equal(dem.capNhat, 1);
  const sau = await anhTin("pair:o1|o2");
  kiemTheCu(truoc, sau);
  assert.equal(sau.co_cham, true);
  // đối chứng đỏ: câu ghi thay evidence bằng evidenceThe của lượt
  await db.query(`UPDATE review_queue SET evidence = $1::jsonb WHERE item_id = 'pair:o1|o2'`, [
    JSON.stringify(evidenceThe(dungCap("o1", "o2"))),
  ]);
  const hong = await anhTin("pair:o1|o2");
  assert.throws(() => kiemTheCu(truoc, hong), /JE-AC-4 thẻ cũ bị sửa dữ liệu tin: offer_a/);
});

// ── AC-7
const kiemKhongTrung = async () => {
  const { rows } = await db.query(`SELECT least(split_part(substr(item_id, 6), '|', 1), split_part(substr(item_id, 6), '|', 2))
      || '|' || greatest(split_part(substr(item_id, 6), '|', 1), split_part(substr(item_id, 6), '|', 2)) AS cap
    FROM review_queue WHERE item_type = 'entity_match' GROUP BY 1 HAVING count(*) > 1`);
  assert.equal(rows.length, 0, `AC-7 nhân đôi thẻ: ${rows.map((r) => r.cap).join(", ")}`);
};
const kiemCapNhat = (capNhat: number, soThe: number) =>
  assert.equal(capNhat, soThe, "AC-3 thẻ chờ không được cập nhật");
test("AC-7 chạy lại — không nhân đôi, thẻ chiều ngược được cập nhật", async () => {
  await nap(FIX_AC6);
  await chamMotLuot(db, deps({ khongLlm: true }));
  const evCu = { offer_a: { offer_id: "o8", mau: "GIU" }, offer_b: { offer_id: "o7" } };
  await db.query(`INSERT INTO review_queue (item_type, item_id, title, evidence) VALUES ('entity_match', 'pair:o8|o7', 'thẻ cũ', $1::jsonb)`,
    [JSON.stringify(evCu)]);
  // cặp needs_llm mà thẻ cũ ghi chiều ngược — tra một chiều sẽ sinh thẻ thứ hai
  await nap([["o9", "o10", "needs_llm"]]);
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o10|o9', 'thẻ cũ')`);
  const truoc = await tatCaThe();
  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  assert.equal(dem.sinh, 0);
  // AC-3 (hồ sơ judge-giu-quyet-dinh-nguoi): mọi thẻ chờ không ai đụng vẫn được cập nhật, kết luận theo luật
  const choTruoc = truoc.filter((t) => t.status === "pending");
  // 3 thẻ lượt 1 sinh + pair:o8|o7 + pair:o10|o9 — evals.yaml E3 ghi «(4)» là đếm sót (sổ quyết định S3)
  assert.equal(choTruoc.length, 5);
  kiemCapNhat(dem.capNhat, choTruoc.length);
  for (const t of choTruoc) {
    const [, a, b] = String(t.item_id).match(/^pair:(.+)\|(.+)$/)!;
    assert.equal((await the(t.item_id)).ai_suggestion, apNguong(dungCap(a, b)).same_house, `AC-3 sai kết luận: ${t.item_id}`);
  }
  assert.throws(() => kiemCapNhat(0, choTruoc.length), /AC-3 thẻ chờ không được cập nhật/);
  const sau = await tatCaThe();
  assert.equal(sau.length, truoc.length);
  assert.deepEqual(sau.map((t) => t.id), truoc.map((t) => t.id));
  const nguoc = await the("pair:o8|o7");
  assert.equal(nguoc.ai_suggestion, apNguong(dungCap("o8", "o7")).same_house);
  assert.ok(nguoc.evidence.cham, "thẻ chiều ngược thiếu evidence.cham");
  assert.deepEqual(nguoc.evidence.offer_a, evCu.offer_a);
  assert.ok((await the("pair:o10|o9")).evidence.cham, "thẻ ngược của cặp needs_llm thiếu evidence.cham");
  await kiemKhongTrung();
  // đối chứng đỏ: thêm một thẻ trùng cặp
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o2|o1', 'trùng')`);
  await assert.rejects(kiemKhongTrung(), /AC-7 nhân đôi thẻ: o1\|o2/);
});

// ── AC-8
const kiemNguyen = (truoc: Record<string, unknown>, sau: Record<string, unknown>) =>
  assert.equal(JSON.stringify(sau), JSON.stringify(truoc), `AC-8 sửa thẻ người đã quyết: ${String(truoc.id)}`);
test("AC-8 thẻ đã quyết — approved · rejected · deferred y nguyên", async () => {
  const o = [["o9", "o10", "approved"], ["o11", "o12", "rejected"], ["o13", "o14", "deferred"]] as const;
  await nap(o.map(([a, b]) => [a, b, "needs_llm"]));
  for (const [a, b, st] of o)
    await db.query(`INSERT INTO review_queue (item_type, item_id, title, ai_suggestion, status, decided_by, decided_at)
      VALUES ('entity_match', $1, 'đã quyết', 'GIU', $2, 'nguoi-thu', now())`, [`pair:${a}|${b}`, st]);
  const anh = async () => (await db.query(`SELECT id, to_jsonb(r) AS j FROM review_queue r ORDER BY id`)).rows;
  const truoc = await anh();
  const dem = await chamMotLuot(db, deps({ model: modelTra('{"giai_thich":"GT-MAU"}').m }));
  assert.equal(dem.boQua, 3);
  const sau = await anh();
  assert.equal(sau.length, 3);
  for (let i = 0; i < truoc.length; i++) kiemNguyen(truoc[i].j, sau[i].j);
  const cho = (await db.query(`SELECT count(*)::int AS n FROM review_queue WHERE status = 'pending'`)).rows[0].n;
  assert.equal(cho, 0);
  // đối chứng đỏ
  assert.throws(() => kiemNguyen(truoc[0].j, { ...truoc[0].j, ai_suggestion: "yes" }), /AC-8 sửa thẻ người đã quyết: 1/);
});

// ── hồ sơ judge-giu-quyet-dinh-nguoi AC-1, AC-2: người quyết giữa lúc máy đọc thẻ và lúc máy ghi
/** Câu UPDATE trước vòng (judge-run.ts tại 14f5851d), chép nguyên văn — chỉ để đối chứng đỏ. */
const SQL_CU = `UPDATE review_queue SET ai_suggestion = $1, ai_reasoning = $2, ai_confidence = NULL,
           evidence = evidence || jsonb_build_object('cham', $3::jsonb)
         WHERE id = ANY($4)`;
/** Câu UPDATE chỉ chặn status từng dòng, không chặn cả cặp — đối chứng đỏ của AC-2. */
const SQL_CHAN_DONG = `${SQL_CU} AND status = 'pending'`;
const anhThe = async (itemId: string) =>
  (await db.query(`SELECT to_jsonb(r) AS j FROM review_queue r WHERE item_type = 'entity_match' AND item_id = $1`, [itemId])).rows[0].j;
/** db bọc: ghi lại tham số mà chamMotLuot truyền cho câu cập nhật — để đối chứng đỏ chạy ĐÚNG tham số ấy. */
function dbBat(bat: unknown[][]): pg.ClientBase {
  return new Proxy(db, {
    get(t, p) {
      if (p === "query") return (sql: unknown, params?: unknown[]) => {
        if (sql === SQL_CAP_NHAT && params) bat.push(params);
        return t.query(sql as string, params);
      };
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
/** queryPair giả: người quyết thẻ `itemId` sang `st` ngay trước khi máy có cặp (tức sau khi máy đã đọc thẻ). */
const nguoiQuyetGiuaChung = (itemId: string, st: string, sauQuyet: { j?: unknown }) => async (a: string, b: string) => {
  await db.query(`UPDATE review_queue SET status = $2, decided_by = 'nguoi-thu', decided_at = now(), ai_suggestion = 'NGUOI'
    WHERE item_type = 'entity_match' AND item_id = $1`, [itemId, st]);
  sauQuyet.j = await anhThe(itemId);
  return queryPair(a, b);
};
const kiemGiuNguoiQuyet = (id: unknown, truoc: unknown, sau: unknown) =>
  assert.equal(JSON.stringify(sau), JSON.stringify(truoc), `AC-1 máy ghi đè thẻ người vừa quyết: ${String(id)}`);
test("AC-1 thẻ bị quyết giữa lúc chấm — approved · rejected · deferred giữ nguyên, đếm bỏ qua", async () => {
  let soAnh = 0;
  for (const st of ["approved", "rejected", "deferred"]) {
    await db.query("TRUNCATE review_queue, property_candidates, sale_offer_records RESTART IDENTITY CASCADE");
    await nap([["o1", "o2", "needs_llm"]]);
    await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o1|o2', 'chờ')`);
    const sauQuyet: { j?: Record<string, unknown> } = {};
    const bat: unknown[][] = [];
    const dem = await chamMotLuot(dbBat(bat), deps({ khongLlm: true, queryPair: nguoiQuyetGiuaChung("pair:o1|o2", st, sauQuyet) }));
    const sau = await anhThe("pair:o1|o2");
    assert.equal(sauQuyet.j?.status, st);
    kiemGiuNguoiQuyet(sau.id, sauQuyet.j, sau);
    soAnh++;
    assert.equal(dem.boQua, 1, `AC-1 không đếm bỏ qua ở ô ${st}`);
    assert.equal(dem.capNhat, 0, `AC-1 đếm cập nhật ở ô ${st}`);
    if (st === "approved") {
      // đối chứng đỏ: câu UPDATE cũ, đúng tham số chamMotLuot vừa dùng, lên thẻ người vừa duyệt
      assert.equal(bat.length, 1);
      await db.query(SQL_CU, bat[0]);
      const hong = await anhThe("pair:o1|o2");
      assert.throws(() => kiemGiuNguoiQuyet(hong.id, sauQuyet.j, hong), /AC-1 máy ghi đè thẻ người vừa quyết: 1/);
    }
  }
  assert.equal(soAnh, 3);
});

const kiemAnhEm = (id: unknown, truoc: unknown, sau: unknown) =>
  assert.equal(JSON.stringify(sau), JSON.stringify(truoc), `AC-2 máy sửa thẻ anh em của cặp người đã quyết: ${String(id)}`);
test("AC-2 hai chiều, một thẻ bị quyết — cả hai thẻ giữ nguyên, đếm bỏ qua", async () => {
  await nap([["o1", "o2", "needs_llm"]]);
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o1|o2', 'chờ'), ('entity_match', 'pair:o2|o1', 'chờ')`);
  const anhEmTruoc = await anhThe("pair:o1|o2");
  const sauQuyet: { j?: Record<string, unknown> } = {};
  const bat: unknown[][] = [];
  const dem = await chamMotLuot(dbBat(bat), deps({ khongLlm: true, queryPair: nguoiQuyetGiuaChung("pair:o2|o1", "rejected", sauQuyet) }));
  const quyet = await anhThe("pair:o2|o1");
  const anhEm = await anhThe("pair:o1|o2");
  kiemGiuNguoiQuyet(quyet.id, sauQuyet.j, quyet);
  kiemAnhEm(anhEm.id, anhEmTruoc, anhEm);
  assert.equal(anhEm.evidence.cham, undefined);
  assert.equal(dem.boQua, 1);
  assert.equal(dem.capNhat, 0);
  // đối chứng đỏ: chỉ chặn status từng dòng → thẻ anh em còn chờ bị sửa
  assert.equal(bat.length, 1);
  await db.query(SQL_CHAN_DONG, bat[0]);
  const hong = await anhThe("pair:o1|o2");
  assert.throws(() => kiemAnhEm(hong.id, anhEmTruoc, hong), /AC-2 máy sửa thẻ anh em của cặp người đã quyết: 1/);
});

/** Người quyết thẻ `quyetId` trong một giao dịch CHƯA commit đúng lúc máy ghi cặp — route quyết khoá dòng
 *  (`SELECT … FOR UPDATE`) rồi UPDATE. Trả rowCount câu ghi của máy sau khi người commit. */
async function ghiKhiNguoiQuyetDo(sql: string, quyetId: number, ids: number[]) {
  const nguoi = new pg.Client({ connectionString: TEST_DB_URL });
  await nguoi.connect();
  try {
    await nguoi.query("BEGIN");
    await nguoi.query(`SELECT id FROM review_queue WHERE id = $1 FOR UPDATE`, [quyetId]);
    await nguoi.query(`UPDATE review_queue SET status = 'rejected', decided_by = 'nguoi-thu', decided_at = now() WHERE id = $1`, [quyetId]);
    const ghi = db.query(sql, ["yes", "lý do", JSON.stringify({ ket_luan: "yes" }), ids]);
    await new Promise((r) => setTimeout(r, 150)); // câu ghi của máy đã vào và đứng chờ khoá của người
    await nguoi.query("COMMIT");
    return (await ghi).rowCount;
  } finally {
    await nguoi.end();
  }
}
test("AC-2 người quyết dở giao dịch đúng lúc máy ghi — thẻ anh em không bị sửa, đếm bỏ qua", async () => {
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o1|o2', 'chờ'), ('entity_match', 'pair:o2|o1', 'chờ')`);
  const id = async (itemId: string) => (await anhThe(itemId)).id as number;
  const [x, y] = [await id("pair:o2|o1"), await id("pair:o1|o2")];
  const anhEmTruoc = await anhThe("pair:o1|o2");
  const rowCount = await ghiKhiNguoiQuyetDo(SQL_CAP_NHAT, x, [y, x]);
  assert.equal(rowCount, 0, "AC-2 máy đếm cập nhật cặp người vừa quyết");
  kiemAnhEm(y, anhEmTruoc, await anhThe("pair:o1|o2"));
  // đối chứng đỏ: câu chỉ chặn bằng NOT EXISTS theo ảnh chụp câu lệnh (bản r1) ghi lên thẻ anh em
  await db.query(`UPDATE review_queue SET status = 'pending', decided_by = NULL, decided_at = NULL WHERE id = $1`, [x]);
  const SQL_R1 = `${SQL_CHAN_DONG}
     AND NOT EXISTS (SELECT 1 FROM review_queue x WHERE x.id = ANY($4) AND x.status <> 'pending')`;
  await ghiKhiNguoiQuyetDo(SQL_R1, x, [y, x]);
  const hong = await anhThe("pair:o1|o2");
  assert.throws(() => kiemAnhEm(y, anhEmTruoc, hong), /AC-2 máy sửa thẻ anh em của cặp người đã quyết: 1/);
});

// ── AC-9
const bam = async (bang: "property_candidates" | "sale_offers") =>
  (await db.query(`SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY ${bang === "sale_offers" ? "offer_id" : "id"}), '')) AS h FROM ${bang} t`)).rows[0].h as string;
const kiemBam = (truoc: string, sau: string, bang: string) => assert.equal(sau, truoc, `AC-9 judge ghi ngoài hàng duyệt: ${bang}`);
test("AC-9 không ghi ngoài hàng duyệt — băm property_candidates, sale_offers không đổi", async () => {
  await nap(FIX_AC6);
  for (const d of [deps({ model: modelTra('{"giai_thich":"GT-MAU"}').m }), deps({ khongLlm: true })]) {
    const truoc = { pc: await bam("property_candidates"), so: await bam("sale_offers") };
    await chamMotLuot(db, d);
    kiemBam(truoc.pc, await bam("property_candidates"), "property_candidates");
    kiemBam(truoc.so, await bam("sale_offers"), "sale_offers");
  }
  // đối chứng đỏ
  const truoc = await bam("property_candidates");
  await db.query(`UPDATE property_candidates SET status = 'merged' WHERE id = 1`);
  const sau = await bam("property_candidates");
  assert.throws(() => kiemBam(truoc, sau, "property_candidates"), /AC-9 judge ghi ngoài hàng duyệt: property_candidates/);
});

// ── hồ sơ the-ghep-can-tin-roi-kho (HD3): thẻ có tin rời kho
type O = { item: string; a: string; b: string; roi: string[] };
/** Ma trận viết trước E1: bên rời {A, B, cả hai} × chiều thẻ {a|b, b|a} — 6 ô, mỗi ô một cặp riêng. */
const O6: O[] = (["A", "B", "ca-hai"] as const).flatMap((ben, i) =>
  [false, true].map((nguoc, j) => {
    const n = i * 2 + j + 1;
    const [a, b] = [`ra${n}`, `rb${n}`];
    const roi = ben === "A" ? [a] : ben === "B" ? [b] : [a, b];
    return { a, b, roi, item: nguoc ? `pair:${b}|${a}` : `pair:${a}|${b}` };
  }),
);
/** Tin `k`: sống, hay đã nghỉ (rời kho — còn hàng trong sale_offer_records cho khoá ngoại, không còn trong sale_offers). */
const tin = (k: string, roi: boolean) =>
  db.query(`INSERT INTO sale_offer_records (offer_id, retired_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [k, roi ? new Date() : null]);
/** Nạp ô: cặp needs_llm, chỉ tin còn sống nằm trong sale_offers, một thẻ chờ (hoặc người quyết `st`). */
const napO = async (os: O[], st?: string) => {
  for (const o of os) {
    for (const k of [o.a, o.b]) await tin(k, o.roi.includes(k));
    await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ($1, $2, 0.92, 'needs_llm')`, [o.a, o.b]);
    if (st)
      await db.query(`INSERT INTO review_queue (item_type, item_id, title, status, decided_by, decided_at, decision_note)
        VALUES ('entity_match', $1, 'đã quyết', $2, 'user:test', now(), 'ghi chú người')`, [o.item, st]);
    else await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', $1, 'chờ')`, [o.item]);
  }
};
const audit = async () => (await db.query(`SELECT * FROM ops_audit ORDER BY id`)).rows;
/** db bọc: bắt tham số câu `sql`; `sauDoc` chạy sau câu ấy, trước khi chamMotLuot nhận kết quả. */
function dbBatSql(sql: string, bat: unknown[][], sauDoc?: () => Promise<void>): pg.ClientBase {
  return new Proxy(db, {
    get(t, p) {
      if (p === "query") return async (q: unknown, params?: unknown[]) => {
        const kq = await t.query(q as string, params);
        if (q === sql) {
          if (params) bat.push(params);
          if (sauDoc) await sauDoc();
        }
        return kq;
      };
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}

type Dong = Record<string, any>;
const kiemRut = (o: O, t: Dong) => {
  assert.ok(t.status === "deferred" && t.decided_by === MAY && t.decided_at != null, `RK-AC-1 thẻ chưa rút: ${o.item}`);
  const note = String(t.decision_note ?? "");
  const song = [o.a, o.b].filter((k) => !o.roi.includes(k));
  assert.ok(
    note.startsWith("tin rời kho") && o.roi.every((k) => note.includes(k)) && !song.some((k) => note.includes(k)),
    `RK-AC-1 lý do sai khoá: ${o.item}`,
  );
};
test("RK-AC-1 rút thẻ có tin rời kho", async () => {
  await napO(O6);
  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  let soO = 0;
  for (const o of O6) {
    kiemRut(o, await the(o.item));
    soO++;
  }
  assert.equal(soO, 6);
  assert.equal(dem.rut, 6);
  assert.equal(dem.roiKho, 6);
  // đối chứng đỏ
  const t0 = await the(O6[0].item);
  assert.throws(() => kiemRut(O6[0], { ...t0, status: "pending" }), /RK-AC-1 thẻ chưa rút: pair:ra1\|rb1/);
  const sai = `tin rời kho: ${O6[0].b} không còn trong kho`;
  assert.throws(() => kiemRut(O6[0], { ...t0, decision_note: sai }), /RK-AC-1 lý do sai khoá: pair:ra1\|rb1/);
});

const kiemAudit = (o: O, id: unknown, rows: Dong[]) => {
  const cua = rows.filter((r) => String(r.detail?.review_id) === String(id));
  const r = cua[0];
  assert.ok(
    cua.length === 1 && r.actor === MAY && r.action === "review-queue:rut-roi-kho" && r.detail.item_id === o.item &&
      r.detail.ly_do === "tin rời kho" && JSON.stringify([...r.detail.roi_kho].sort()) === JSON.stringify([...o.roi].sort()),
    `RK-AC-2 audit lệch: ${o.item}`,
  );
};
test("RK-AC-2 mỗi thẻ rút một dòng audit", async () => {
  await napO(O6);
  await chamMotLuot(db, deps({ khongLlm: true }));
  const rows = await audit();
  assert.equal(rows.length, 6);
  for (const o of O6) kiemAudit(o, (await the(o.item)).id, rows);
  // đối chứng đỏ (1): dòng trùng review_id của thẻ đầu
  const id0 = (await the(O6[0].item)).id;
  assert.throws(() => kiemAudit(O6[0], id0, [...rows, rows.find((r) => String(r.detail.review_id) === String(id0))!]),
    /RK-AC-2 audit lệch: pair:ra1\|rb1/);
  // đối chứng đỏ (2): roi_kho của ô «cả hai» thiếu một khoá
  const o = O6[4];
  const id4 = (await the(o.item)).id;
  const thieu = rows.map((r) => String(r.detail.review_id) === String(id4) ? { ...r, detail: { ...r.detail, roi_kho: [o.a] } } : r);
  assert.throws(() => kiemAudit(o, id4, thieu), /RK-AC-2 audit lệch: pair:ra5\|rb5/);
});

const kiemSong = (item: string, t: Dong) =>
  assert.ok(t.status === "pending" && t.evidence?.cham, `RK-AC-3 thẻ sống bị rút: ${item}`);
test("RK-AC-3 cặp hai bên sống chấm như cũ", async () => {
  await nap([["o1", "o2", "pending"], ["o3", "o4", "needs_llm"]]);
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o1|o2', 'chờ')`);
  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  assert.deepEqual([dem.rut, dem.roiKho, dem.capNhat, dem.sinh], [0, 0, 1, 1]);
  const x = await the("pair:o1|o2");
  kiemSong("pair:o1|o2", x);
  const y = (await tatCaThe()).filter((t) => ["pair:o3|o4", "pair:o4|o3"].includes(t.item_id));
  assert.equal(y.length, 1);
  assert.equal(y[0].status, "pending");
  assert.equal((await audit()).length, 0);
  // đối chứng đỏ
  assert.throws(() => kiemSong("pair:o1|o2", { ...x, status: "deferred" }), /RK-AC-3 thẻ sống bị rút: pair:o1\|o2/);
});

const anhQuyet = (t: Dong) => JSON.stringify([t.status, t.decided_by, t.decided_at, t.decision_note]);
const kiemNguoiGiu = (item: string, truoc: Dong, sau: Dong) =>
  assert.equal(anhQuyet(sau), anhQuyet(truoc), `RK-AC-4 thẻ người quyết bị đổi: ${item}`);
test("RK-AC-4 thẻ người đã quyết không bị rút", async () => {
  const os: [O, string][] = (["approved", "rejected", "deferred"]).map((st, i) =>
    [{ a: `qa${i}`, b: `qb${i}`, roi: [`qa${i}`], item: `pair:qa${i}|qb${i}` }, st]);
  for (const [o, st] of os) await napO([o], st);
  const truoc = new Map<string, Dong>();
  for (const [o] of os) truoc.set(o.item, await the(o.item));
  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  for (const [o] of os) kiemNguoiGiu(o.item, truoc.get(o.item)!, await the(o.item));
  assert.equal((await audit()).length, 0);
  assert.equal(dem.boQua, 3);
  // đối chứng đỏ: ô rejected bị đổi người quyết
  const r = os[1][0].item;
  assert.throws(() => kiemNguoiGiu(r, truoc.get(r)!, { ...truoc.get(r)!, decided_by: MAY }), /RK-AC-4 thẻ người quyết bị đổi: pair:qa1\|qb1/);
});

const anhTheRut = async () =>
  JSON.stringify((await db.query(`SELECT id, status, decided_by, decided_at, decision_note FROM review_queue ORDER BY id`)).rows);
const kiemKhongRutTrung = (item: string, nTruoc: number, nSau: number) =>
  assert.equal(nSau, nTruoc, `RK-AC-5 rút trùng: ${item}`);
test("RK-AC-5 chạy lại không rút trùng", async () => {
  await napO(O6);
  const bat: unknown[][] = [];
  await chamMotLuot(dbBatSql(SQL_RUT_ROI_KHO, bat), deps({ khongLlm: true }));
  const n1 = (await audit()).length;
  const anh1 = await anhTheRut();
  const dem2 = await chamMotLuot(db, deps({ khongLlm: true }));
  assert.equal(dem2.rut, 0);
  kiemKhongRutTrung(O6[0].item, n1, (await audit()).length);
  assert.equal(await anhTheRut(), anh1);
  // đối chứng đỏ: câu rút bỏ điều kiện status = 'pending', đúng tham số lượt 1 của thẻ đầu
  const hong = SQL_RUT_ROI_KHO.replace("AND status = 'pending' AND", "AND");
  assert.notEqual(hong, SQL_RUT_ROI_KHO);
  await db.query(hong, bat[0]);
  const nHong = (await audit()).length;
  assert.throws(() => kiemKhongRutTrung(O6[0].item, n1, nHong), /RK-AC-5 rút trùng: pair:ra1\|rb1/);
});

const kiemKhongLoi = (dem: { loi: number }, soThe: number) => {
  assert.equal(dem.loi, 0, "RK-AC-6 cặp rời kho tính vào loi");
  assert.equal(soThe, 0, "RK-AC-6 sinh thẻ cho cặp rời kho");
};
test("RK-AC-6 cặp rời kho chưa thẻ không sinh thẻ", async () => {
  await tin("o1", false);
  await tin("o2", true);
  await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ('o1', 'o2', 0.92, 'needs_llm')`);
  let goi = 0;
  const dem = await chamMotLuot(db, deps({ khongLlm: true, queryPair: async (a, b) => { goi++; return queryPair(a, b); } }));
  kiemKhongLoi(dem, (await tatCaThe()).length);
  assert.deepEqual([dem.roiKho, dem.rut, dem.sinh, goi], [1, 0, 0, 0]);
  // đối chứng đỏ
  assert.throws(() => kiemKhongLoi({ ...dem, loi: 1 }, 0), /RK-AC-6 cặp rời kho tính vào loi/);
  assert.throws(() => kiemKhongLoi(dem, 1), /RK-AC-6 sinh thẻ cho cặp rời kho/);
});

const kiemKhongRutCapNguoi = async (anhEm: string) => {
  const t = await the(anhEm);
  assert.ok(t.status === "pending" && (await audit()).length === 0, `RK-AC-7 rút thẻ của cặp người đã quyết: ${anhEm}`);
};
test("RK-AC-7 người quyết giữa chừng — không rút", async () => {
  const o: O = { a: "ra1", b: "rb1", roi: ["ra1"], item: "pair:ra1|rb1" };
  await napO([o]);
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:rb1|ra1', 'chờ')`);
  const bat: unknown[][] = [];
  const batRut: unknown[][] = [];
  const nguoiQuyet = async () => {
    await db.query(`UPDATE review_queue SET status = 'approved', decided_by = 'user:test', decided_at = now() WHERE item_id = 'pair:ra1|rb1'`);
  };
  const boc = dbBatSql(SQL_TIN_SONG, bat, nguoiQuyet);
  // bọc lớp hai: bắt tham số câu rút mà chamMotLuot gửi
  const boc2 = new Proxy(boc, {
    get(t, p) {
      if (p === "query") return (q: unknown, params?: unknown[]) => {
        if (q === SQL_RUT_ROI_KHO && params) batRut.push(params);
        return (t as pg.ClientBase).query(q as string, params);
      };
      return Reflect.get(t, p);
    },
  });
  const dem = await chamMotLuot(boc2, deps({ khongLlm: true }));
  const q = await the("pair:ra1|rb1");
  assert.deepEqual([q.status, q.decided_by], ["approved", "user:test"]);
  await kiemKhongRutCapNguoi("pair:rb1|ra1");
  assert.equal(dem.rut, 0);
  // đối chứng đỏ: câu rút bỏ vế khoá cặp, đúng tham số chamMotLuot vừa dùng
  const hong = SQL_RUT_ROI_KHO.replace(/AND NOT EXISTS \(SELECT 1 FROM khoa[\s\S]*?'\)\)/, "");
  assert.notEqual(hong, SQL_RUT_ROI_KHO);
  assert.equal(batRut.length, 1);
  await db.query(hong, batRut[0]);
  await assert.rejects(kiemKhongRutCapNguoi("pair:rb1|ra1"), /RK-AC-7 rút thẻ của cặp người đã quyết: pair:rb1\|ra1/);
});

const DONG_IN = "cặp có tin rời kho 3 · thẻ rút 2 · thẻ trả lại 0";
const kiemDongIn = (stdout: string) => {
  const dong = stdout.split("\n").find((l) => l.startsWith("cặp có tin rời kho")) ?? "(không có dòng)";
  assert.equal(dong, DONG_IN, `RK-AC-8 dòng in sai: ${dong}`);
};
test("RK-AC-8 dòng in tổng kết", async () => {
  await napO(O6.slice(0, 2));
  await tin("rx1", false);
  await tin("rx2", true);
  await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ('rx1', 'rx2', 0.92, 'needs_llm')`);
  const out = execFileSync("node", ["--import", "tsx", "scripts/judge-run.ts", "--khong-llm"], {
    cwd: join(import.meta.dirname, ".."),
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    encoding: "utf8",
  });
  kiemDongIn(out);
  // đối chứng đỏ
  assert.throws(() => kiemDongIn(out.replace("thẻ rút 2", "thẻ rút 3")),
    /RK-AC-8 dòng in sai: cặp có tin rời kho 3 · thẻ rút 3 · thẻ trả lại 0/);
});

const kiemCaDaKy = (ds: string[], co: Set<string>) => {
  for (const ten of ds) assert.ok(co.has(ten), `RK-AC-10 ca đã ký mất: ${ten}`);
};
test("RK-AC-10 ca đã ký còn đủ", async () => {
  const ds = (await readFile(join(import.meta.dirname, "../../_acceptance/the-ghep-can-tin-roi-kho/ca-da-ky.txt"), "utf8"))
    .split("\n").map((l) => l.trim()).filter(Boolean);
  const co = new Set<string>();
  for (const f of ["judge-run.test.ts", "judge-nguong.test.ts", "judge-pair.test.ts"]) {
    const src = await readFile(join(import.meta.dirname, f), "utf8");
    for (const m of src.matchAll(/test\("((?:[^"\\]|\\.)*)"/g)) co.add(m[1]);
  }
  let soAssert = 0;
  for (const ten of ds) {
    kiemCaDaKy([ten], co);
    soAssert++;
  }
  assert.equal(ds.length, 31);
  assert.equal(soAssert, 31);
  // đối chứng đỏ
  assert.throws(() => kiemCaDaKy([...ds, "RK-AC-X ca không có"], co), /RK-AC-10 ca đã ký mất: RK-AC-X ca không có/);
});

const kiemTraLai = (item: string, t: Dong) =>
  assert.ok(t.status === "pending" && t.decided_by == null && t.decided_at == null && t.decision_note == null && t.evidence?.cham,
    `RK-AC-11 thẻ chưa trả lại: ${item}`);
const kiemKhongTraNguoi = (item: string, t: Dong) =>
  assert.ok(t.status === "deferred" && t.decided_by === "user:test", `RK-AC-11 trả lại thẻ người quyết: ${item}`);
test("RK-AC-11 tin quay lại — thẻ máy rút được trả lại", async () => {
  await tin("o1", true);
  await tin("o2", false);
  await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ('o1', 'o2', 0.92, 'needs_llm')`);
  await db.query(`INSERT INTO review_queue (item_type, item_id, title) VALUES ('entity_match', 'pair:o1|o2', 'chờ')`);
  // ô đối chiếu: cặp hai bên sống, thẻ người hoãn
  await nap([["o3", "o4", "needs_llm"]]);
  await db.query(`INSERT INTO review_queue (item_type, item_id, title, status, decided_by, decided_at)
    VALUES ('entity_match', 'pair:o3|o4', 'người hoãn', 'deferred', 'user:test', now())`);
  await chamMotLuot(db, deps({ khongLlm: true }));
  const l1 = await the("pair:o1|o2");
  assert.deepEqual([l1.status, l1.decided_by], ["deferred", MAY]);
  const sauL1 = new Date().toISOString();
  await db.query(`UPDATE sale_offer_records SET retired_at = NULL WHERE offer_id = 'o1'`); // tin quay lại
  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  const t = await the("pair:o1|o2");
  kiemTraLai("pair:o1|o2", t);
  assert.ok(t.evidence.cham.luc >= sauL1, "RK-AC-11 thẻ không được chấm lại");
  const tra = (await audit()).filter((r) => r.action === "review-queue:tra-lai-tin-ve-kho");
  assert.equal(tra.length, 1);
  assert.equal(String(tra[0].detail.review_id), String(t.id));
  assert.deepEqual([dem.traLai, dem.capNhat], [1, 1]);
  const nguoi = await the("pair:o3|o4");
  kiemKhongTraNguoi("pair:o3|o4", nguoi);
  // đối chứng đỏ
  assert.throws(() => kiemTraLai("pair:o1|o2", l1), /RK-AC-11 thẻ chưa trả lại: pair:o1\|o2/);
  assert.throws(() => kiemKhongTraNguoi("pair:o3|o4", { ...nguoi, status: "pending" }), /RK-AC-11 trả lại thẻ người quyết: pair:o3\|o4/);
});
