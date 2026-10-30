// judge-run.test.ts — PL25 `judge-nguong-la-code` AC-2b..AC-9 (E2b–E9): chamMotLuot sinh/cập nhật thẻ hàng duyệt.
// Thêm hồ sơ `judge-giu-quyet-dinh-nguoi` AC-1..AC-3 (E1–E3): thẻ người quyết giữa lúc chấm không bị máy ghi đè.
// DB thử RỖNG riêng trên :5433 (tạo đầu tệp, xoá cuối tệp) — không chạm `oneinvest`. Lược đồ rút từ migration thật:
// khối property_candidates của 027, 029 tới «-- Seed», 052 nguyên tệp; sale_offers tối thiểu (chỉ để khoá ngoại).
// Model giả MockLanguageModelV4. Mỗi ca có đối chứng đỏ chạy ĐÚNG hàm kiểm trên vật hỏng, thông điệp ghim theo evals.yaml.
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import pg from "pg";
import { MockLanguageModelV4 } from "ai/test";
import { TR, cap, kiemKhongNguong, type Tin } from "./judge-chung.js";
import { NGUONG, apNguong } from "../src/agents/judge-entity.js";
import type { PairData } from "../src/tools/native.js";
import { CAU_DEM_THIEU_THE, SQL_CAP_NHAT, chamMotLuot, type ChamDeps } from "../scripts/judge-run.js";

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
  await db.query(`CREATE TABLE sale_offers (offer_id text PRIMARY KEY, ghi_chu text)`);
  await db.query(khoiPC[0]);
  await db.query(m029);
  await db.query(await readFile(MIG("052_ai_calls.sql"), "utf8"));
  process.env.DATABASE_URL = TEST_DB_URL; // recordCallDb đọc DATABASE_URL lúc gọi
});

beforeEach(async () => {
  await db.query("TRUNCATE review_queue, property_candidates, sale_offers, ai_calls RESTART IDENTITY CASCADE");
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

// ── AC-6
async function khoaSeed029(ben: "offer_a" | "offer_b"): Promise<string[]> {
  const sql = await readFile(MIG("029_review_queue.sql"), "utf8");
  const seed = sql.slice(sql.indexOf("-- Seed"));
  const dau = seed.indexOf(`'${ben}', jsonb_build_object(`);
  const cuoi = ben === "offer_a" ? seed.indexOf(`'offer_b', jsonb_build_object(`) : seed.indexOf(`'stage_b_score'`);
  assert.ok(dau >= 0 && cuoi > dau, `không rút được khối ${ben} từ seed 029`);
  const khoi = seed.slice(seed.indexOf("\n", dau), cuoi);
  return [...khoi.matchAll(/^\s*'(\w+)',/gm)].map((x) => x[1]).sort();
}
const kiemKhuon = (khoa: string[], mau: string[]) => {
  const lech = [...mau.filter((k) => !khoa.includes(k)), ...khoa.filter((k) => !mau.includes(k))];
  assert.equal(lech.length, 0, `AC-6 thẻ lệch khuôn seed 029: ${lech.join(", ")}`);
};
const kiemDuThe = async () => {
  const { rows } = await db.query(`SELECT pc.offer_a || '|' || pc.offer_b AS cap FROM property_candidates pc
    WHERE pc.status = 'needs_llm' AND NOT EXISTS (SELECT 1 FROM review_queue r WHERE r.item_type = 'entity_match'
      AND r.item_id IN ('pair:' || pc.offer_a || '|' || pc.offer_b, 'pair:' || pc.offer_b || '|' || pc.offer_a))`);
  assert.equal(rows.length, 0, `AC-6 ứng viên thiếu thẻ: ${rows.map((r) => r.cap).join(", ")}`);
};
const demThieu = async () => (await db.query(CAU_DEM_THIEU_THE)).rows[0].n as number;

test("AC-6 sinh thẻ — mọi cặp needs_llm có đúng một thẻ khuôn seed 029", async () => {
  await nap(FIX_AC6);
  // đối chứng đỏ cùng fixture: bỏ bước sinh (chưa thẻ nào) → câu đếm = 3
  assert.equal(await demThieu(), 3);
  await assert.rejects(kiemDuThe(), /AC-6 ứng viên thiếu thẻ: o1\|o2/);

  const dem = await chamMotLuot(db, deps({ khongLlm: true }));
  assert.equal(dem.sinh, 3);
  const ts = await tatCaThe();
  assert.equal(ts.length, 3);
  const mauA = await khoaSeed029("offer_a");
  const mauB = await khoaSeed029("offer_b");
  assert.ok(mauA.includes("phuong") && mauB.includes("subject"));
  for (const [a, b] of FIX_AC6.slice(0, 3)) {
    const t = await the(`pair:${a}|${b}`);
    assert.ok(t, `thiếu thẻ pair:${a}|${b}`);
    assert.equal(t.status, "pending");
    assert.equal(t.evidence.offer_a.offer_id, a);
    assert.equal(t.evidence.offer_b.offer_id, b);
    assert.equal(t.ai_suggestion, apNguong(dungCap(a, b)).same_house);
    assert.ok(t.title.startsWith("Cùng căn? "), t.title);
    kiemKhuon(Object.keys(t.evidence.offer_a).sort(), mauA);
    kiemKhuon(Object.keys(t.evidence.offer_b).sort(), mauB);
  }
  assert.equal(await the("pair:o7|o8"), undefined);
  assert.equal(await demThieu(), 0);
  await kiemDuThe();
  // đối chứng đỏ: bộ khoá thiếu 'phuong'
  assert.throws(() => kiemKhuon(mauA.filter((k) => k !== "phuong"), mauA), /AC-6 thẻ lệch khuôn seed 029: phuong/);
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
    await db.query("TRUNCATE review_queue, property_candidates, sale_offers RESTART IDENTITY CASCADE");
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
