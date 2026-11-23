// duong-goi-agent.test.ts — MH1 model-may-sang-haiku E2b (AC-2, đường gọi; Mạnh 22/11 «Anthropic thẳng»): agent chạy qua
// runAgent đi thẳng Anthropic trước, gặp lớp dừng (hết tiền, khoá sai) thì lùi sang Gateway trong cùng tiến trình, thiếu khoá thì
// lệnh dừng mã 5 trước lời gọi đầu. Anthropic giả (khuôn Messages API, SDK thật qua ANTHROPIC_BASE_URL) và Gateway giả chạy trong
// tiến trình test; không DB (CLI dừng trước khi mở DB), không mạng, không khoá thật. Mỗi ca có chiều đỏ trên cùng hàm kiểm.
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { moAnthropic, moGateway, type MayAnthropic, type MayGia } from "./helpers/gateway-gia.js";
import { datLaiDuong, runAgent } from "../src/runtime/loop.js";
import { LoiThieuKhoa } from "../src/runtime/model-agent.js";
import { modelGateway } from "../src/runtime/models.js";
import { enrichTextAgent } from "../src/agents/enrich-text.js";
import { tool } from "ai";
import { z } from "zod";
import type { AiCallRecord } from "../src/runtime/ai-call-log.js";

const AGENT = join(import.meta.dirname, "..");
const HAIKU = "anthropic/claude-haiku-5.5";
const SO_THANG = "anthropic:claude-haiku-5-5";
const SO_GW = `gateway:${HAIKU}`;
const DAU_RA = '{"property_type":"apartment","confidence":0.8}';
const KHOA = ["ANTHROPIC_API_KEY", "AI_GATEWAY_API_KEY", "ANTHROPIC_BASE_URL", "AI_GATEWAY_BASE_URL", "MODEL_AGENT_CAU_HINH"] as const;
let an: MayAnthropic;
let gw: MayGia;
const thuMuc = mkdtempSync(join(tmpdir(), "mh1-duong-goi-"));
const envCu = Object.fromEntries(KHOA.map((k) => [k, process.env[k]]));

before(async () => {
  an = await moAnthropic({ text: DAU_RA, vao: 120, ra: 30 });
  gw = await moGateway({ text: DAU_RA, vao: 120, ra: 30 });
  (globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;
});
after(async () => {
  await an.dong();
  await gw.dong();
  for (const k of KHOA) if (envCu[k] === undefined) delete process.env[k]; else process.env[k] = envCu[k];
});
afterEach(() => {
  an.datLai();
  gw.datLai();
  datLaiDuong();
});

let soTep = 0;
/** Bảng cấu hình tạm: Haiku hai đường anthropic → gateway, `tu_lui` theo ca. */
function bang(tuLui: boolean): string {
  const p = join(thuMuc, `bang-${++soTep}.json`);
  writeFileSync(p, JSON.stringify({
    phien_ban: 1, mac_dinh: "haiku", tu_lui: tuLui,
    model: { haiku: { gateway: HAIKU, duong: ["anthropic", "gateway"], gia_vao: 0.1, gia_ra: 0.5 } },
    agent: { "enrich-text": { model: "haiku", tran_usd: 0.5 }, "smoke-echo": { model: "haiku", tran_usd: 0.01 } },
  }));
  return p;
}
/** Môi trường trỏ hai máy giả; `khoa` chọn khoá nào có mặt. */
function datEnv(tep: string, khoa: { anthropic: boolean; gateway: boolean }) {
  process.env.MODEL_AGENT_CAU_HINH = tep;
  process.env.ANTHROPIC_BASE_URL = an.url;
  process.env.AI_GATEWAY_BASE_URL = gw.url;
  if (khoa.anthropic) process.env.ANTHROPIC_API_KEY = "khoa-gia"; else delete process.env.ANTHROPIC_API_KEY;
  if (khoa.gateway) process.env.AI_GATEWAY_API_KEY = "khoa-gia"; else delete process.env.AI_GATEWAY_API_KEY;
}

// ---------- Ca (1): lùi đường khi Anthropic hết tiền ----------
/** Hai lời enrich-text với Anthropic giả trả 402 ở lời 1. Đúng: lời 1 lùi sang Gateway và đọc được, lời 2 đi thẳng Gateway,
 * Anthropic nhận đúng 1, chuyen-duong một lần, sổ lời 1 (thành công) mang gateway:<mã>. */
async function kiemLui(tep: string) {
  datEnv(tep, { anthropic: true, gateway: true });
  an.hang.push({ text: "", status: 402 });
  const so: AiCallRecord[] = [];
  const dong: string[] = [];
  const deps = { recordCall: async (r: AiCallRecord) => void so.push(r), log: (d: string) => void dong.push(d) };
  let r1;
  try {
    r1 = await runAgent(enrichTextAgent, "thử lời 1", {}, deps);
  } catch (e) {
    assert.fail(`AC-2 không lùi sang gateway (lời 1 ném ${(e as Error).name})`);
  }
  const r2 = await runAgent(enrichTextAgent, "thử lời 2", {}, deps);
  assert.equal(an.yeuCau.length, 1, "AC-2 Anthropic phải nhận đúng 1 yêu cầu");
  assert.equal(gw.yeuCau.length, 2, "AC-2 lời 1 (sau lùi) và lời 2 phải đi Gateway");
  assert.equal(r1.output, DAU_RA, "AC-2 lời 1 sau lùi không đọc được đầu ra Gateway");
  assert.equal(r1.duong, "gateway");
  assert.equal(r2.duong, "gateway");
  assert.equal(r1.model, HAIKU, "AC-2 LoopResult.model phải giữ mã model, không đổi theo đường");
  assert.equal(dong.filter((d) => d.includes("chuyen-duong")).length, 1, "AC-2 dòng chuyen-duong phải in đúng một lần");
  assert.match(dong[0], /chuyen-duong: anthropic\/claude-haiku-5\.5 anthropic -> gateway \(het-tien:402:billing_error:/);
  assert.deepEqual(so.map((r) => [r.model, r.ok]), [[SO_THANG, false], [SO_GW, true], [SO_GW, true]], "AC-2 sổ cuộc gọi sai đường");
}
test("MH1 AC-2 ca (1): Anthropic hết tiền ở lời 1 → lùi sang Gateway, lời 2 đi thẳng Gateway, một dòng chuyen-duong", () =>
  kiemLui(bang(true)));
test("chiều đỏ MH1 AC-2 ca (1): bảng tắt lùi (tu_lui false) → đỏ «AC-2 không lùi sang gateway»", async () => {
  await assert.rejects(kiemLui(bang(false)), /AC-2 không lùi sang gateway/);
});
test("MH1 AC-2 đường thẳng xanh: sổ mang anthropic:claude-haiku-5-5, Gateway nhận 0", async () => {
  datEnv(bang(true), { anthropic: true, gateway: true });
  const so: AiCallRecord[] = [];
  const r = await runAgent(enrichTextAgent, "thử", {}, { recordCall: async (x) => void so.push(x), log: () => {} });
  assert.equal(r.duong, "anthropic");
  assert.equal(r.output, DAU_RA);
  assert.deepEqual(r.usage, { inputTokens: 120, outputTokens: 30 });
  assert.deepEqual(so.map((x) => [x.model, x.ok]), [[SO_THANG, true]]);
  assert.equal(an.yeuCau.length, 1);
  assert.equal(an.yeuCau[0].model, "claude-haiku-5-5");
  assert.equal(gw.yeuCau.length, 0);
});

// ---------- Ca (2), (3): thiếu khoá → mã 5, 0 yêu cầu ----------
function chayEnrichRun(env: Record<string, string | undefined>): Promise<{ ma: number | null; out: string }> {
  const e: NodeJS.ProcessEnv = { ...process.env, ...env };
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete e[k];
  return new Promise((resolve, reject) => {
    // DATABASE_URL trỏ cổng chết: lệnh phải dừng trước khi mở DB (mở DB thì mã 1, không phải 5).
    const p = spawn(process.execPath, ["--import", "tsx", "scripts/enrich-run.ts", "--offers", "mh1-khong-co"], {
      cwd: AGENT, env: { ...e, DATABASE_URL: "postgresql://127.0.0.1:9/khong" },
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const hen = setTimeout(() => p.kill("SIGKILL"), 60_000);
    p.on("error", reject);
    p.on("close", (ma) => {
      clearTimeout(hen);
      resolve({ ma, out });
    });
  });
}
/** Hàm kiểm chung: mã 5, lời «thiếu khoá <tên>», cả hai máy giả nhận 0 yêu cầu. */
function kiemKhongGoi(kq: { ma: number | null; out: string }, khoa: RegExp) {
  if (an.yeuCau.length + gw.yeuCau.length > 0) assert.fail(`AC-2 gọi khi thiếu khoá (anthropic ${an.yeuCau.length} · gateway ${gw.yeuCau.length})`);
  assert.equal(kq.ma, 5, `AC-2 thiếu khoá phải thoát 5: ${kq.out.slice(-300)}`);
  assert.match(kq.out, khoa, "AC-2 lời báo không gọi tên khoá thiếu");
}
test("MH1 AC-2 ca (2): tu_lui false, không ANTHROPIC_API_KEY → enrich-run thoát 5, 0 yêu cầu ở cả hai máy giả", async () => {
  const kq = await chayEnrichRun({
    MODEL_AGENT_CAU_HINH: bang(false), ANTHROPIC_BASE_URL: an.url, AI_GATEWAY_BASE_URL: gw.url,
    ANTHROPIC_API_KEY: undefined, AI_GATEWAY_API_KEY: "khoa-gia",
  });
  kiemKhongGoi(kq, /thiếu khoá ANTHROPIC_API_KEY/);
});
test("MH1 AC-2 ca (3): thiếu khoá của mọi đường với tu_lui true → enrich-run thoát 5, 0 yêu cầu", async () => {
  const kq = await chayEnrichRun({
    MODEL_AGENT_CAU_HINH: bang(true), ANTHROPIC_BASE_URL: an.url, AI_GATEWAY_BASE_URL: gw.url,
    ANTHROPIC_API_KEY: undefined, AI_GATEWAY_API_KEY: undefined,
  });
  kiemKhongGoi(kq, /thiếu khoá AI_GATEWAY_API_KEY, ANTHROPIC_API_KEY/);
});
test("MH1 AC-2 runAgent cũng tự chặn: thiếu mọi khoá → LoiThieuKhoa, 0 yêu cầu", async () => {
  datEnv(bang(true), { anthropic: false, gateway: false });
  await assert.rejects(runAgent(enrichTextAgent, "thử", {}, { recordCall: async () => {} }), (e) => e instanceof LoiThieuKhoa);
  assert.equal(an.yeuCau.length + gw.yeuCau.length, 0);
});
test("chiều đỏ MH1 AC-2 ca (2): lời gọi bỏ kiểm khoá (model tiêm thẳng, không qua bảng) → đỏ «AC-2 gọi khi thiếu khoá»", async () => {
  datEnv(bang(false), { anthropic: false, gateway: true });
  await runAgent(enrichTextAgent, "thử", {}, { model: modelGateway(HAIKU), recordCall: async () => {} });
  assert.throws(() => kiemKhongGoi({ ma: 0, out: "" }, /thiếu khoá/), /AC-2 gọi khi thiếu khoá/);
});

test("MH1 đường thẳng có tool (smoke-echo): tool_use → chạy tool → tool_result → chữ; thân lời 2 mang tool_result", async () => {
  datEnv(bang(true), { anthropic: true, gateway: true });
  an.hang.push({ text: "", toolUse: { name: "get_time", input: {} }, vao: 50, ra: 10 }, { text: "Bây giờ là 12:00", vao: 60, ra: 12 });
  let daChay = 0;
  const echo = {
    name: "smoke-echo", systemPrompt: "thử", budget: 3,
    tools: { get_time: tool({ description: "Lấy giờ", inputSchema: z.object({}), execute: async () => (daChay++, { now: "12:00" }) }) },
  };
  const r = await runAgent(echo as never, "Mấy giờ?", {}, { recordCall: async () => {}, log: () => {} });
  assert.equal(daChay, 1, "tool get_time phải chạy đúng một lần");
  assert.equal(r.output, "Bây giờ là 12:00");
  assert.equal(r.steps, 2);
  assert.deepEqual(r.toolCalls, [{ name: "get_time", args: {} }]);
  assert.deepEqual(r.usage, { inputTokens: 110, outputTokens: 22 });
  assert.equal(an.yeuCau.length, 2);
  assert.equal((an.yeuCau[0].than.tools as { name: string }[])[0].name, "get_time");
  const tin = an.yeuCau[1].than.messages as { role: string; content: unknown }[];
  assert.equal(tin.length, 3);
  assert.equal((tin[2].content as { type: string }[])[0].type, "tool_result");
  assert.equal(gw.yeuCau.length, 0);
});
