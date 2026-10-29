// ai-call-log.test.ts — PL29 `so-cuoc-goi-ai` AC-2..AC-4 (E2, E3, E4, E13): runAgent ghi sổ cuộc gọi AI.
// Model giả của AI SDK (MockLanguageModelV4) — không gọi Qwen. Sổ ghi vào một DB thử RỖNG riêng trên cùng server :5433
// (tạo đầu tệp, áp db/migrations/052_ai_calls.sql, xoá cuối tệp) — không bao giờ chạm DB `oneinvest` dùng chung (LUAT
// đợt: migration chưa gộp không áp lên oneinvest). Mỗi ca có đối chứng đỏ với thông điệp ghim.
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServer, type Server, type Socket } from "node:net";
import pg from "pg";
import { MockLanguageModelV4 } from "ai/test";
import { runAgent, type AgentConfig } from "../src/runtime/loop.js";
import { taoRecordCallDb, tenLop, type AiCallRecord } from "../src/runtime/ai-call-log.js";

const SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const TEN_DB = `oneinvest_p4_sca_test_${process.pid}`;
const TEST_DB_URL = `${SERVER}/${TEN_DB}`;
const MIGRATION = join(import.meta.dirname, "../../db/migrations/052_ai_calls.sql");

const usage = (vao: number, ra: number) => ({
  inputTokens: { total: vao, noCache: vao, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: ra, text: ra, reasoning: undefined },
});
const modelOk = () =>
  new MockLanguageModelV4({
    modelId: "mock-ok",
    doGenerate: async () => {
      await new Promise((r) => setTimeout(r, 5));
      return { content: [{ type: "text", text: "xin chao" }], finishReason: { unified: "stop", raw: "stop" }, usage: usage(120, 30), warnings: [] };
    },
  });
class LoiCoPrompt extends Error {
  name = "LoiCoPrompt";
  responseBody = '{"prompt":"PROMPT-MAU bí mật"}';
}
const modelLoi = (err: Error) =>
  new MockLanguageModelV4({
    modelId: "mock-loi",
    doGenerate: async () => {
      throw err;
    },
  });
const agent = (name: string): AgentConfig => ({ name, model: "qwen27b", systemPrompt: "thử", tools: {}, budget: 1 });

let db: pg.Client;
// Hàm kiểm dùng chung cho ca thật và ca đối chứng — đối chứng chạy ĐÚNG hàm này trên vật hỏng.
const kiemGhiMot = (ghi: AiCallRecord[]) => assert.equal(ghi.length, 1, "KHONG GHI SO");
const kiemMotDong = (rows: unknown[]) => assert.equal(rows.length, 1, "KHONG GHI SO MAC DINH");
const kiemLoi = (loi: string) => assert.ok(!loi.includes("PROMPT-MAU") && loi.length <= 80, "LOI CHEP PROMPT");
const dong = async (viec: string) => (await db.query("select * from ai_calls where viec = $1 order by id", [viec])).rows;

before(async () => {
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.query(`CREATE DATABASE ${TEN_DB}`);
  await admin.end();
  db = new pg.Client({ connectionString: TEST_DB_URL });
  await db.connect();
  await db.query(await readFile(MIGRATION, "utf8"));
  process.env.DATABASE_URL = TEST_DB_URL; // writer mặc định đọc DATABASE_URL lúc gọi
});

beforeEach(async () => {
  await db.query("TRUNCATE ai_calls");
});

after(async () => {
  await db?.end();
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.end();
});

test("E2 ghi mot dong khi thanh cong (tiem recordCall)", async () => {
  const ghi: AiCallRecord[] = [];
  const r = await runAgent(agent("sca-mau-ok"), "chào", {}, { model: modelOk(), recordCall: async (x) => void ghi.push(x) });
  assert.equal(r.output, "xin chao");
  kiemGhiMot(ghi);
  const g = ghi[0];
  assert.deepEqual(
    { viec: g.viec, model: g.model, vao: g.inputTokens, ra: g.outputTokens, ok: g.ok, loi: g.loi },
    { viec: "sca-mau-ok", model: "mock-ok", vao: 120, ra: 30, ok: true, loi: null },
  );
  assert.ok(g.latencyMs > 0);
  const trace = (await readFile(r.tracePath, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  const fin = trace.find((t) => t.type === "final");
  assert.deepEqual(fin.data.usage, { inputTokens: 120, outputTokens: 30 }, "TRACE THIEU USAGE");
});

test("E2 doi chung do: recordCall chi dem ma khong ghi thi kiemGhiMot bat KHONG GHI SO", async () => {
  const ghi: AiCallRecord[] = [];
  let goi = 0;
  await runAgent(agent("sca-mau-rong"), "chào", {}, { model: modelOk(), recordCall: async () => void goi++ });
  assert.equal(goi, 1); // runAgent có gọi writer — nhưng writer hỏng không lưu gì
  assert.throws(() => kiemGhiMot(ghi), /KHONG GHI SO/);
});

test("E13 duong mac dinh ghi so that vao DB (chi tiem model)", async () => {
  await runAgent(agent("sca-mau-mac-dinh"), "chào", {}, { model: modelOk() });
  const rows = await dong("sca-mau-mac-dinh");
  kiemMotDong(rows);
  const r = rows[0];
  assert.deepEqual(
    { model: r.model, vao: r.input_tokens, ra: r.output_tokens, ok: r.ok, khach: r.khach, loi: r.loi },
    { model: "mock-ok", vao: 120, ra: 30, ok: true, khach: "pipeline", loi: null },
  );
  assert.ok(r.latency_ms > 0);
});

test("E13 doi chung do: writer mac dinh no-op thi khong co dong", async () => {
  await runAgent(agent("sca-mau-noop"), "chào", {}, { model: modelOk(), recordCall: async () => {} });
  const rows = await dong("sca-mau-noop");
  assert.throws(() => kiemMotDong(rows), /KHONG GHI SO MAC DINH/);
});

test("E3 ghi ok=false khi model loi, loi = ten lop, khong chep PROMPT-MAU", async () => {
  for (const err of [new Error("hỏng vì PROMPT-MAU trong message"), new LoiCoPrompt("PROMPT-MAU trong responseBody")]) {
    await db.query("TRUNCATE ai_calls");
    await assert.rejects(runAgent(agent("sca-mau-loi"), "chào", {}, { model: modelLoi(err) }), (e: Error) => e.message === err.message);
    const rows = await dong("sca-mau-loi");
    assert.equal(rows.length, 1, "KHONG GHI SO KHI LOI");
    assert.equal(rows[0].ok, false);
    kiemLoi(String(rows[0].loi));
    assert.equal(rows[0].loi, tenLop(err));
  }
});

test("E3 doi chung do: ghi err.message vao loi thi bat LOI CHEP PROMPT", async () => {
  // Writer đột biến chép message thay vì tên lớp: chạy runAgent thật với lỗi mang PROMPT-MAU, rồi kiemLoi phải bắt.
  const ghi: AiCallRecord[] = [];
  const err = new Error("PROMPT-MAU trong message");
  await assert.rejects(runAgent(agent("sca-mau-loi-db"), "chào", {}, { model: modelLoi(err), recordCall: async (x) => void ghi.push({ ...x, loi: err.message }) }));
  assert.throws(() => kiemLoi(String(ghi[0].loi)), /LOI CHEP PROMPT/);
});

test("E4 so hong khong chan agent: van tra ket qua, trace co ai-call-log-error", async () => {
  const r = await runAgent(agent("sca-mau-so-hong"), "chào", {}, {
    model: modelOk(),
    recordCall: async () => {
      throw Object.assign(new Error("connect ECONNREFUSED"), { name: "ConnRefused" });
    },
  });
  assert.equal(r.output, "xin chao");
  const trace = (await readFile(r.tracePath, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.ok(trace.some((t) => t.type === "ai-call-log-error"), "THIEU DONG ai-call-log-error");
});

test("E4 doi chung: so binh thuong thi trace khong co ai-call-log-error", async () => {
  const r = await runAgent(agent("sca-mau-so-lanh"), "chào", {}, { model: modelOk(), recordCall: async () => {} });
  const trace = (await readFile(r.tracePath, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.ok(!trace.some((t) => t.type === "ai-call-log-error"));
});

// DB treo: một cổng TCP nhận kết nối mà không bao giờ trả lời (Postgres bị pause, mạng đen).
async function moCongTreo(): Promise<{ url: string; dong: () => Promise<void> }> {
  const socks: Socket[] = [];
  const srv: Server = createServer((s) => void socks.push(s));
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", ok));
  const port = (srv.address() as { port: number }).port;
  return {
    url: `postgres://u@127.0.0.1:${port}/treo`,
    dong: async () => {
      for (const s of socks) s.destroy();
      await new Promise<void>((ok) => srv.close(() => ok()));
    },
  };
}
// Hàm kiểm dùng chung: lời hứa xong trước `ms` mili giây.
const kiemKhongTreo = async <T>(p: Promise<T>, ms: number) => {
  let hen: NodeJS.Timeout | undefined;
  const het = new Promise<"het">((ok) => (hen = setTimeout(() => ok("het"), ms)));
  const kq = await Promise.race([p.then(() => "xong" as const, () => "xong" as const), het]);
  clearTimeout(hen);
  assert.equal(kq, "xong", "SO TREO CHAN AGENT");
};

test("E4 DB treo: writer mac dinh het tran, runAgent van tra ket qua va trace co ai-call-log-error", async () => {
  const treo = await moCongTreo();
  const cu = process.env.DATABASE_URL;
  process.env.DATABASE_URL = treo.url;
  try {
    const p = runAgent(agent("sca-mau-so-treo"), "chào", {}, { model: modelOk() });
    await kiemKhongTreo(p, 8000);
    const r = await p;
    assert.equal(r.output, "xin chao");
    const trace = (await readFile(r.tracePath, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
    assert.ok(trace.some((t) => t.type === "ai-call-log-error"), "THIEU DONG ai-call-log-error");
  } finally {
    process.env.DATABASE_URL = cu;
    await treo.dong();
  }
});

test("E4 doi chung do: writer khong tran tren DB treo thi kiemKhongTreo bat SO TREO CHAN AGENT", async () => {
  const treo = await moCongTreo();
  const cu = process.env.DATABASE_URL;
  process.env.DATABASE_URL = treo.url;
  try {
    const p = runAgent(agent("sca-mau-so-treo-dc"), "chào", {}, { model: modelOk(), recordCall: taoRecordCallDb(0) });
    await assert.rejects(kiemKhongTreo(p, 1500), /SO TREO CHAN AGENT/);
  } finally {
    process.env.DATABASE_URL = cu;
    await treo.dong(); // đóng socket → writer không trần nhận lỗi, lượt agent kết thúc
  }
});
