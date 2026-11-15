// goi-thang-anthropic.test.ts — hồ sơ _acceptance/goi-thang-anthropic (E1–E6): Haiku đi thẳng API Anthropic theo bảng chọn,
// chuỗi ai_calls.loi theo lớp lỗi nhà cung cấp, dừng sớm khi hết tiền / khoá sai, thoát 5 khi thiếu khoá.
// Máy chủ Anthropic giả (HTTP, qua ANTHROPIC_BASE_URL) cho SDK thật dựng lỗi thật; Gateway giả là máy chủ HTTP cho SDK Gateway thật
// (AI_GATEWAY_BASE_URL) hoặc model giả của AI SDK. Ca DB chạy trong BEGIN…ROLLBACK trên DB của riêng lượt, ngày bài xa (2001-02).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import { MockLanguageModelV4 } from "ai/test";
import pg from "pg";
import { DUONG_ANTHROPIC, keHoach, khoaCan, khoaThieu, kiemCauHinh, MODEL_DUYET, napCauHinh } from "../src/enrich/doc-gop-s03/cau-hinh.js";
import { chayLuot } from "../src/enrich/doc-gop-s03/chay.js";
import { hoiGop, taoAnthropicMacDinh, type TaoModel } from "../src/enrich/doc-gop-s03/doc.js";
import { chayHangNgay } from "../src/enrich/doc-gop-s03/hang-ngay.js";
import { FIELDS, type Field } from "../src/enrich/doc-gop-s03/o.js";
import { HUONG_DAN } from "../src/enrich/doc-gop-s03/prompt.js";
import type { The } from "../src/enrich/doc-gop-s03/the.js";
import type { AiCallRecord } from "../src/runtime/ai-call-log.js";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const AGENT = join(import.meta.dirname, "..");
const HAI = "anthropic/claude-haiku-5.5", GLM = "zai/glm-5.3-flash", DS = "deepseek/deepseek-v4.1-flash-1017";
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000000000300010d0a2db40000000049454e44ae426082", "hex");
const CHU_MAY_CHU = "chu may chu gia khong duoc chep vao so";
const im = { log: () => {}, logLoi: () => {} };

function json17(): string {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS as readonly Field[]) o[f] = { v: null, cc: null, trich: "" };
  return JSON.stringify(o);
}
const tinNhanTot = (text = json17()) => ({
  id: "msg_gia", type: "message", role: "assistant", model: "claude-haiku-5-5", content: [{ type: "text", text }],
  stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 5000, output_tokens: 900 },
});
const loiAnthropic = (status: number, type: string) => ({ status, body: { type: "error", error: { type, message: CHU_MAY_CHU } } });

type Yeu = { url: string; auth: string | undefined; body: Record<string, unknown> };
/** Máy chủ HTTP giả: ghi mọi yêu cầu, trả theo `tra(i)`; `retry-after-ms: 0` để SDK thử lại ngay (test nhanh). */
async function mayChu(tra: (i: number, y: Yeu) => { status: number; body: unknown; tre?: number }) {
  const ghi: Yeu[] = [];
  const sv = createServer((req: IncomingMessage, res) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => {
      const y = { url: req.url ?? "", auth: req.headers.authorization, body: b ? JSON.parse(b) : {} };
      ghi.push(y);
      const r = tra(ghi.length - 1, y);
      setTimeout(() => {
        res.writeHead(r.status, { "content-type": "application/json", "retry-after-ms": "0" });
        res.end(JSON.stringify(r.body));
      }, r.tre ?? 0);
    });
  });
  await new Promise<void>((r) => sv.listen(0, "127.0.0.1", () => r()));
  const { port } = sv.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, ghi, dong: () => new Promise<void>((r) => sv.close(() => r())) };
}

/** Chạy `fn` với môi trường tạm (undefined = xoá biến), trả lại môi trường cũ. */
async function voiEnv<T>(env: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const cu = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  try { return await fn(); } finally {
    for (const [k, v] of Object.entries(cu)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
}

function theCoAnh(): The {
  const goc = mkdtempSync(join(tmpdir(), "gta-anh-"));
  const anh = [0, 1].map((i) => {
    const tep = join(goc, `a${i}.png`);
    const byte = Buffer.concat([PNG, Buffer.from([i])]);
    writeFileSync(tep, byte);
    return { tep, mime: "image/png", sha256: createHash("sha256").update(byte).digest("hex") };
  });
  return { post_id: `gta-${process.pid}-anh`, text_hash: "h-anh", group_name: "Nhóm thử GTA", group_note: null, text: "Bán căn 2PN giá 3 tỷ", anh, anh_thieu: 0 };
}

/** Bảng chọn tạm (tệp) từ object. */
function tepBang(o: unknown): string {
  const tep = join(mkdtempSync(join(tmpdir(), "gta-bang-")), "doc-gop-s03.json");
  writeFileSync(tep, JSON.stringify(o));
  return tep;
}
const BANG_HAI_ANTHROPIC = { phien_ban: 1, mac_dinh: "haiku", model: { haiku: { gateway: HAI, duong: "anthropic", gia_vao: 0.1, gia_ra: 0.5 } }, o: { bathrooms: "nguoi" } };
const BANG_CO_GW = { phien_ban: 1, mac_dinh: "haiku", model: { haiku: { gateway: HAI, duong: "anthropic", gia_vao: 0.1, gia_ra: 0.5 }, glm: { gateway: GLM, gia_vao: 0.15, gia_ra: 0.5 } }, o: { area_m2: "glm" } };

// ---------------------------------------------------------------- AC-1
test("GTA-AC-1 bảng chọn của kho: Haiku hai đường anthropic rồi gateway, tự lùi bật; GLM/DeepSeek gateway; danh sách đóng ba mã; từ chối đường sai", () => {
  const kh = keHoach(napCauHinh().cauHinh);
  const hai = kh.nhom.find((n) => n.gateway === HAI)!;
  assert.deepEqual(hai.duong, ["anthropic", "gateway"], "BANG CHON CHUA DAT HAIKU HAI DUONG, ANTHROPIC TRUOC");
  assert.equal(kh.tuLui, true);
  assert.equal(DUONG_ANTHROPIC[HAI], "claude-haiku-5-5");
  for (const n of kh.nhom.filter((x) => x.gateway !== HAI)) assert.deepEqual(n.duong, ["gateway"]);
  assert.deepEqual([...MODEL_DUYET], [HAI, GLM, DS]);
  assert.deepEqual(khoaCan(kh), ["AI_GATEWAY_API_KEY", "ANTHROPIC_API_KEY"]);
  // Tự lùi: một khoá bất kỳ là đủ; vắng cả hai thì báo cả hai.
  assert.deepEqual(khoaThieu(kh, { AI_GATEWAY_API_KEY: "x" }), []);
  assert.deepEqual(khoaThieu(kh, { ANTHROPIC_API_KEY: "x" }), []);
  assert.deepEqual(khoaThieu(kh, {}), ["AI_GATEWAY_API_KEY", "ANTHROPIC_API_KEY"]);
  // Không tự lùi: phải có khoá của đường đầu.
  const khKhong = keHoach(kiemCauHinh({ ...napCauHinh().cauHinh, tu_lui: false }));
  assert.deepEqual(khoaThieu(khKhong, { AI_GATEWAY_API_KEY: "x" }), ["ANTHROPIC_API_KEY"]);
  assert.throws(() => kiemCauHinh({ ...napCauHinh().cauHinh, tu_lui: "co" }), /tu_lui phải là true\/false/);
  const mau = (m: Record<string, unknown>) => ({ phien_ban: 1, mac_dinh: "x", model: { x: { gia_vao: 0.1, gia_ra: 0.5, ...m } }, o: {} });
  assert.throws(() => kiemCauHinh(mau({ gateway: GLM, duong: "anthropic" })), /model x \(zai\/glm-5\.3-flash\) không có đường anthropic/);
  assert.throws(() => kiemCauHinh(mau({ gateway: DS, duong: "anthropic" })), /model x \(deepseek\/deepseek-v4\.1-flash-1017\) không có đường anthropic/);
  assert.throws(() => kiemCauHinh(mau({ gateway: HAI, duong: "openai" })), /model x có duong "openai"/);
  assert.throws(() => kiemCauHinh(mau({ gateway: HAI, duong: ["anthropic", "anthropic"] })), /rỗng hay lặp/);
  assert.throws(() => kiemCauHinh(mau({ gateway: GLM, duong: ["gateway", "anthropic"] })), /không có đường anthropic/);
  assert.deepEqual(keHoach(kiemCauHinh(mau({ gateway: GLM }))).nhom[0].duong, ["gateway"], "VANG duong PHAI LA gateway");
  assert.deepEqual(khoaCan(keHoach(kiemCauHinh(BANG_CO_GW))), ["AI_GATEWAY_API_KEY", "ANTHROPIC_API_KEY"]);
});

// ---------------------------------------------------------------- AC-2
test("GTA-AC-2 lời gọi thẳng: một POST /v1/messages, model claude-haiku-5-5, khoá lúc gọi, không temperature/thinking, chữ và ảnh đúng thứ tự; GLM vẫn qua Gateway kèm cờ không giữ dữ liệu", async () => {
  const sv = await mayChu(() => ({ status: 200, body: tinNhanTot() }));
  try {
    await voiEnv({ ANTHROPIC_BASE_URL: sv.url, ANTHROPIC_API_KEY: "khoa-gia-gta", ANTHROPIC_AUTH_TOKEN: undefined }, async () => {
      const gw: { id: string; opt: unknown }[] = [];
      const tm: TaoModel = (id) => new MockLanguageModelV4({ modelId: id, doGenerate: async (o: { providerOptions?: unknown }) => {
        gw.push({ id, opt: o.providerOptions });
        return { content: [{ type: "text", text: json17() }], finishReason: { unified: "stop", raw: "stop" },
          usage: { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } }, warnings: [] };
      } } as never) as never;
      const the = theCoAnh();
      const kh = keHoach(kiemCauHinh(BANG_CO_GW));
      for (const n of kh.nhom) await hoiGop({ gateway: n.gateway, duong: n.duong[0], gia: n.gia, the, taoModel: tm, recordCall: async () => {} });
      assert.equal(sv.ghi.length, 1, `SO LOI GOI THANG ${sv.ghi.length}`);
      const y = sv.ghi[0];
      assert.equal(y.url, "/v1/messages");
      assert.equal(y.auth, "Bearer khoa-gia-gta");
      assert.equal(y.body.model, "claude-haiku-5-5");
      assert.equal(y.body.max_tokens, 8000);
      assert.equal(y.body.temperature, undefined, "GUI TEMPERATURE CHO HAIKU 5.5");
      assert.equal(y.body.thinking, undefined, "GUI THINKING");
      assert.equal(y.body.system, HUONG_DAN);
      const nd = (y.body.messages as { role: string; content: { type: string; text?: string; source?: { type: string; media_type: string; data: string } }[] }[])[0];
      assert.equal(nd.role, "user");
      assert.deepEqual(nd.content.map((c) => c.type), ["text", "text", "image", "text", "image"]);
      assert.equal(nd.content[1].text, "Ảnh 1:");
      assert.equal(nd.content[3].text, "Ảnh 2:");
      assert.equal(nd.content[2].source!.type, "base64");
      assert.equal(nd.content[2].source!.media_type, "image/png");
      assert.equal(nd.content[2].source!.data, readFileSync(the.anh[0].tep).toString("base64"));
      assert.equal(nd.content[4].source!.data, readFileSync(the.anh[1].tep).toString("base64"));
      assert.deepEqual(gw.map((g) => g.id), [GLM], "HAIKU VAN DI GATEWAY");
      assert.deepEqual((gw[0].opt as { gateway: unknown }).gateway, { zeroDataRetention: true, disallowPromptTraining: true });
    });
  } finally {
    await sv.dong();
  }
});

// ---------------------------------------------------------------- DB
async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
const theChu = (k: string): The => ({ post_id: `gta-${process.pid}-${k}`, text_hash: `h-${k}`, group_name: "Nhóm thử GTA", group_note: null, text: `Bài ${k} GTA ${process.pid}`, anh: [], anh_thieu: 0 });

// ---------------------------------------------------------------- AC-3
test("GTA-AC-3 nhãn bạc giữ danh tính model, ghi đường thật, tiền tính theo giá bảng; ai_calls model mang tiền tố đường; chạy lại không gọi lại", async () => {
  const sv = await mayChu(() => ({ status: 200, body: tinNhanTot() }));
  const bang = tepBang(BANG_HAI_ANTHROPIC);
  try {
    await voiEnv({ ANTHROPIC_BASE_URL: sv.url, ANTHROPIC_API_KEY: "khoa-gia-gta" }, () => withTx(async (c) => {
      const t = theChu("ac3");
      const co = { post: [t.post_id], tranUsd: 1, cauHinh: bang, runId: `gta-ac3-${process.pid}` };
      const kq = await chayLuot({ client: c, co, the: [t], doDaDoc: true, log: () => {} });
      assert.equal(kq.ghi, 1);
      const { rows } = await c.query(`SELECT model, probabilities p, cost_usd::float8 usd, json_ok FROM silver_labels WHERE post_id = $1`, [t.post_id]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].model, `gateway:${HAI}`, "DOI DANH TINH MODEL");
      assert.equal(rows[0].p.duong, "anthropic");
      assert.ok(Math.abs(rows[0].usd - 0.00095) < 1e-9, `cost_usd ${rows[0].usd}`);
      const { rows: ai } = await c.query(`SELECT model, ok, loi FROM ai_calls WHERE trace = $1`, [co.runId]);
      assert.deepEqual(ai, [{ model: "anthropic:claude-haiku-5-5", ok: true, loi: null }], "AI_CALLS PHAI GHI DUONG GOI");
      const lan2 = await chayLuot({ client: c, co, the: [t], doDaDoc: true, log: () => {} });
      assert.equal(lan2.goi, 0, "CHAY LAI GOI LAI BAI DA DOC");
      assert.equal(sv.ghi.length, 1);
    }));
  } finally {
    await sv.dong();
  }
});

// ---------------------------------------------------------------- AC-4
test("GTA-AC-4 thiếu khoá: hang-ngay/chay/cham thoát 5 trước DB và trước mọi lời gọi, gọi tên biến; client nhận khoá tường minh", async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: "postgresql://127.0.0.1:9/khong" };
  delete env.ANTHROPIC_API_KEY;
  delete env.AI_GATEWAY_API_KEY;
  const bangGw = tepBang(BANG_CO_GW);
  const bangHai = tepBang(BANG_HAI_ANTHROPIC);
  const ca: [string[], NodeJS.ProcessEnv, string][] = [
    [["hang-ngay", "--ngay", "2001-02-02"], env, "THIEU KHOA ANTHROPIC_API_KEY"],
    [["hang-ngay", "--ngay", "2001-02-02"], env, "THIEU KHOA AI_GATEWAY_API_KEY"],
    [["chay", "--post", "x", "--tran-usd", "1"], env, "THIEU KHOA ANTHROPIC_API_KEY"],
    [["cham", "--split", "test", "--tran-usd", "1"], env, "THIEU KHOA ANTHROPIC_API_KEY"],
    [["hang-ngay", "--ngay", "2001-02-02", "--cau-hinh", bangHai], { ...env, AI_GATEWAY_API_KEY: "co" }, "THIEU KHOA ANTHROPIC_API_KEY"],
    [["hang-ngay", "--ngay", "2001-02-02", "--cau-hinh", bangGw], { ...env, ANTHROPIC_API_KEY: "co" }, "THIEU KHOA AI_GATEWAY_API_KEY"],
  ];
  for (const [args, e, can] of ca) {
    const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/doc-gop-s03.ts", ...args], { cwd: AGENT, env: e, encoding: "utf8" });
    assert.equal(r.status, 5, `THIEU KHOA KHONG THOAT 5 — ${args.join(" ")} (mã ${r.status}) ${r.stderr}`);
    assert.ok(r.stderr.includes(can), `${args.join(" ")}: stderr thiếu «${can}»: ${r.stderr}`);
    assert.ok(!r.stderr.includes("ECONNREFUSED"), `${args.join(" ")}: đã chạm DB trước khi kiểm khoá`);
  }
  // Bảng của kho (tự lùi): chỉ có khoá Gateway là đủ — không thoát 5 (đi tiếp tới DB giả và hỏng ở đó).
  const mot = spawnSync(process.execPath, ["--import", "tsx", "scripts/doc-gop-s03.ts", "hang-ngay", "--ngay", "2001-02-02"], { cwd: AGENT, env: { ...env, AI_GATEWAY_API_KEY: "co" }, encoding: "utf8" });
  assert.notEqual(mot.status, 5, `TU LUI MA VAN DOI DU HAI KHOA: ${mot.stderr}`);
  assert.ok(!mot.stderr.includes("THIEU KHOA"), mot.stderr);
  assert.match(mot.stderr, /ECONNREFUSED|127\.0\.0\.1:9/, `TU LUI PHAI DI TIEP TOI DB (gia): ${mot.stderr}`);
  await voiEnv({ ANTHROPIC_API_KEY: "khoa-tuong-minh" }, async () => {
    assert.equal(taoAnthropicMacDinh().apiKey, "khoa-tuong-minh");
    assert.equal(taoAnthropicMacDinh().authToken, null, "CLIENT GIU HAI LOAI KHOA");
  });
});

// ---------------------------------------------------------------- AC-5
async function loiCua(tra: { status: number; body: unknown; tre?: number }, them: { timeout?: number } = {}): Promise<{ loi: string | null; lop: unknown; so: number }> {
  const sv = await mayChu(() => tra);
  try {
    let ghi: AiCallRecord | null = null;
    const kq = await hoiGop({
      gateway: HAI, duong: "anthropic", gia: { vao: 0.1, ra: 0.5 }, the: theChu("ac5"),
      taoAnthropic: () => new Anthropic({ apiKey: "khoa-gia", authToken: null, baseURL: sv.url, maxRetries: 2, timeout: them.timeout ?? 10_000 }),
      recordCall: async (r) => { ghi = r; },
    });
    assert.equal((ghi as AiCallRecord | null)?.loi, kq.error_kind);
    return { loi: kq.error_kind, lop: kq.lop, so: sv.ghi.length };
  } finally {
    await sv.dong();
  }
}
async function loiGateway(status: number, type: string): Promise<string | null> {
  const sv = await mayChu(() => ({ status, body: { error: { type, message: CHU_MAY_CHU } } }));
  try {
    return await voiEnv({ AI_GATEWAY_BASE_URL: sv.url, AI_GATEWAY_API_KEY: "khoa-gia" }, async () =>
      (await hoiGop({ gateway: GLM, duong: "gateway", gia: { vao: 0.1, ra: 0.5 }, the: theChu("ac5g"), recordCall: async () => {} })).error_kind);
  } finally {
    await sv.dong();
  }
}

test("GTA-AC-5 chuỗi ai_calls.loi theo lớp lỗi nhà cung cấp: mã HTTP + kiểu lỗi + tên lớp, ≤ 80 ký tự, không chép message", async () => {
  const ca: [string, string | RegExp][] = [];
  const k401 = await loiCua(loiAnthropic(401, "authentication_error"));
  ca.push([k401.loi!, "khoa:401:authentication_error:AuthenticationError"]);
  const k402 = await loiCua(loiAnthropic(402, "billing_error"));
  ca.push([k402.loi!, /^het-tien:402:billing_error:\w+$/]);
  assert.equal(k402.so, 1, "402 KHONG DUOC THU LAI");
  const k400 = await loiCua({ status: 400, body: { type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing." } } });
  ca.push([k400.loi!, "het-tien:400:credit_balance:BadRequestError"]);
  const k400k = await loiCua(loiAnthropic(400, "invalid_request_error"));
  ca.push([k400k.loi!, "khac:400:invalid_request_error:BadRequestError"]);
  const k429 = await loiCua(loiAnthropic(429, "rate_limit_error"));
  ca.push([k429.loi!, "han-muc:429:rate_limit_error:RateLimitError"]);
  assert.equal(k429.so, 3, `429 PHAI THU LAI 2 LAN (so yeu cau ${k429.so})`);
  const k529 = await loiCua(loiAnthropic(529, "overloaded_error"));
  ca.push([k529.loi!, /^may-chu:529:overloaded_error:\w+$/]);
  const kgio = await loiCua({ status: 200, body: tinNhanTot(), tre: 1500 }, { timeout: 200 });
  ca.push([kgio.loi!, /^het-gio:-:-:\w*Timeout\w*$/]);
  ca.push([(await loiGateway(402, "insufficient_funds"))!, "het-tien:402:insufficient_funds:GatewayInternalServerError"]);
  ca.push([(await loiGateway(500, "internal_server_error"))!, /^may-chu:500:internal_server_error:Gateway\w+$/]);
  for (const [that, mong] of ca) {
    if (typeof mong === "string") assert.equal(that, mong);
    else assert.match(that, mong);
    assert.ok(that.length <= 80, `${that} dài quá 80`);
    assert.ok(!that.includes("chu may chu") && !/credit balance/i.test(that), `CHEP MESSAGE VAO SO: ${that}`);
  }
});

// ---------------------------------------------------------------- AC-6
const NGAY = "2001-02-03";
const BAY_GIO = new Date("2001-02-06T03:00:00+07:00");
async function baBai(c: pg.Client, nhan: string): Promise<string[]> {
  const snap = `hanoi__zalo-agent__2001-02-03T000000000`;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}'::jsonb) ON CONFLICT DO NOTHING`, [snap]);
  const ids: string[] = [];
  for (const i of [1, 2, 3]) {
    const post = `gta-${process.pid}-${nhan}-${i}`;
    ids.push(post);
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, text, captured_at, conversation_id, media, agent_id, media_files)
       VALUES ($1, $2, 'Nhóm thử GTA', $3, $4, $3, NULL, '[]', NULL, '[]')`,
      [post, snap, `${NGAY}T0${i}:00:00+07:00`, `Bán căn ${nhan} số ${i} GTA ${process.pid} giá ${i} tỷ`]);
  }
  return ids;
}
const dem = async (c: pg.Client, sql: string, p: unknown[]) => Number((await c.query(sql, p)).rows[0].n);

test("GTA-AC-6 hang-ngay dừng sớm: 402 → 1 lời gọi, mã 4, JOB FAIL het-tien; Gateway 402 cũng vậy; 401 → mã 1 JOB FAIL khoa; 429 không dừng", async () => {
  const bangHai = tepBang(BANG_HAI_ANTHROPIC);
  const chay = async (tra: () => { status: number; body: unknown }, nhan: string) => {
    const sv = await mayChu(tra);
    try {
      return await voiEnv({ ANTHROPIC_BASE_URL: sv.url, ANTHROPIC_API_KEY: "khoa-gia" }, () => withTx(async (c) => {
        await baBai(c, nhan);
        const loiDong: string[] = [];
        const calls: AiCallRecord[] = [];
        const kq = await chayHangNgay({
          client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: false, cauHinh: bangHai }, bayGio: BAY_GIO, log: () => {}, logLoi: (s) => loiDong.push(s),
          recordCall: async (r) => { calls.push(r); },
        });
        const nhanGhi = await dem(c, `SELECT count(*) n FROM silver_labels WHERE post_id LIKE $1`, [`gta-${process.pid}-${nhan}-%`]);
        return { kq, loiDong, calls, nhanGhi, yeu: sv.ghi.length };
      }));
    } finally {
      await sv.dong();
    }
  };
  const a = await chay(() => loiAnthropic(402, "billing_error"), "het");
  assert.equal(a.kq.tomTat.can_goi, 3);
  assert.equal(a.calls.length, 1, `HET TIEN VAN GOI TIEP: ${a.calls.length} lời gọi`);
  assert.equal(a.yeu, 1);
  assert.equal(a.nhanGhi, 0);
  assert.equal(a.kq.ma, 4);
  assert.equal(a.kq.tomTat.dung, "het-tien");
  assert.equal(a.kq.tomTat.con_lai, 2);
  assert.ok(a.loiDong.includes("JOB FAIL [doc-gop-s03] het-tien: anthropic 402 billing_error"), a.loiDong.join("\n"));

  const k = await chay(() => loiAnthropic(401, "authentication_error"), "khoa");
  assert.equal(k.calls.length, 1);
  assert.equal(k.kq.ma, 1);
  assert.ok(k.loiDong.some((d) => d.startsWith("JOB FAIL [doc-gop-s03] khoa: anthropic 401")), k.loiDong.join("\n"));

  const h = await chay(() => loiAnthropic(429, "rate_limit_error"), "han");
  assert.equal(h.calls.length, 3, "429 LAM DUNG LUOT");
  assert.equal(h.yeu, 9, `429: 3 lời gọi × 3 lần thử (so yeu cau ${h.yeu})`);
  assert.equal(h.kq.tomTat.dung ?? null, null);
  assert.equal(h.kq.ma, 1, "mọi lời gọi hỏng → mã 1 như PL34");

  // Gateway 402 (ví Vercel rỗng): SDK Gateway thật trỏ máy chủ giả.
  const bangGw = tepBang({ phien_ban: 1, mac_dinh: "glm", model: { glm: { gateway: GLM, gia_vao: 0.15, gia_ra: 0.5 } }, o: {} });
  const svg = await mayChu(() => ({ status: 402, body: { error: { type: "insufficient_funds", message: CHU_MAY_CHU } } }));
  try {
    const g = await voiEnv({ AI_GATEWAY_BASE_URL: svg.url, AI_GATEWAY_API_KEY: "khoa-gia" }, () => withTx(async (c) => {
      await baBai(c, "gw");
      const loiDong: string[] = [];
      const kq = await chayHangNgay({ client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: false, cauHinh: bangGw }, bayGio: BAY_GIO, log: () => {}, logLoi: (s) => loiDong.push(s), recordCall: async () => {} });
      return { kq, loiDong };
    }));
    assert.equal(svg.ghi.length, 1, `GATEWAY HET TIEN VAN GOI TIEP: ${svg.ghi.length}`);
    assert.equal(g.kq.ma, 4);
    assert.ok(g.loiDong.includes("JOB FAIL [doc-gop-s03] het-tien: gateway 402 insufficient_funds"), g.loiDong.join("\n"));
  } finally {
    await svg.dong();
  }
  void im;
});

// ---------------------------------------------------------------- AC-6 tự lùi
test("GTA-AC-6 tự lùi: Anthropic 402 → dòng chuyen-duong, các bài còn lại qua Gateway trong cùng trần, mã 0; thiếu khoá Anthropic → lùi ngay từ đầu; cả hai cạn → mã 4", async () => {
  const bangLui = tepBang({ phien_ban: 1, mac_dinh: "haiku", tu_lui: true, model: { haiku: { gateway: HAI, duong: ["anthropic", "gateway"], gia_vao: 0.1, gia_ra: 0.5 } }, o: { bathrooms: "nguoi" } });
  const gwTot = (ghi: string[]): TaoModel => (id) => new MockLanguageModelV4({ modelId: id, doGenerate: async () => {
    ghi.push(id);
    return { content: [{ type: "text", text: json17() }], finishReason: { unified: "stop", raw: "stop" },
      usage: { inputTokens: { total: 5000, noCache: 5000, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 900, text: 900, reasoning: undefined } }, warnings: [],
      providerMetadata: { gateway: { cost: "0.002" } } };
  } } as never) as never;
  const gwHet: TaoModel = (id) => new MockLanguageModelV4({ modelId: id, doGenerate: async () => {
    throw Object.assign(new Error("ví rỗng"), { name: "GatewayInternalServerError", statusCode: 402 });
  } } as never) as never;
  const chay = async (env: Record<string, string | undefined>, taoModel: TaoModel, nhan: string) => {
    const sv = await mayChu(() => loiAnthropic(402, "billing_error"));
    try {
      return await voiEnv({ ANTHROPIC_BASE_URL: sv.url, AI_GATEWAY_API_KEY: "khoa-gia", ...env }, () => withTx(async (c) => {
        await baBai(c, nhan);
        const loiDong: string[] = [];
        const calls: AiCallRecord[] = [];
        const kq = await chayHangNgay({
          client: c, co: { ngay: NGAY, tranNgayUsd: 20, thu: false, cauHinh: bangLui }, bayGio: BAY_GIO, taoModel, log: () => {}, logLoi: (s) => loiDong.push(s),
          recordCall: async (r) => { calls.push(r); },
        });
        const { rows } = await c.query(`SELECT model, probabilities->>'duong' duong FROM silver_labels WHERE post_id LIKE $1`, [`gta-${process.pid}-${nhan}-%`]);
        return { kq, loiDong, calls, nhan: rows as { model: string; duong: string }[], yeu: sv.ghi.length };
      }));
    } finally {
      await sv.dong();
    }
  };
  const ghi: string[] = [];
  const a = await chay({ ANTHROPIC_API_KEY: "khoa-gia" }, gwTot(ghi), "lui");
  assert.equal(a.yeu, 1, "ANTHROPIC CAN TIEN VAN GOI TIEP");
  assert.equal(ghi.length, 3, `GATEWAY PHAI DOC CA BA BAI: ${ghi.length}`);
  assert.equal(a.kq.ma, 0, a.loiDong.join("\n"));
  assert.equal(a.nhan.length, 3);
  assert.ok(a.nhan.every((r) => r.model === `gateway:${HAI}` && r.duong === "gateway"), JSON.stringify(a.nhan));
  assert.ok(a.loiDong.some((d) => d.startsWith(`JOB WARN [doc-gop-s03] chuyen-duong: ${HAI} anthropic -> gateway (het-tien:402:billing_error`)), a.loiDong.join("\n"));
  assert.deepEqual(a.calls.map((r) => r.model), ["anthropic:claude-haiku-5-5", `gateway:${HAI}`, `gateway:${HAI}`, `gateway:${HAI}`]);
  assert.equal(a.kq.tomTat.chuyen_duong?.length, 1);

  const ghi2: string[] = [];
  const b = await chay({ ANTHROPIC_API_KEY: undefined }, gwTot(ghi2), "thieu");
  assert.equal(b.yeu, 0, "THIEU KHOA ANTHROPIC VAN GOI ANTHROPIC");
  assert.equal(ghi2.length, 3);
  assert.equal(b.kq.ma, 0);
  assert.ok(b.loiDong.some((d) => d.includes("chuyen-duong") && d.includes("thieu-khoa ANTHROPIC_API_KEY")), b.loiDong.join("\n"));

  const c = await chay({ ANTHROPIC_API_KEY: "khoa-gia" }, gwHet, "can");
  assert.equal(c.yeu, 1);
  assert.equal(c.calls.length, 2, "CA HAI DUONG CAN: một lời mỗi đường rồi dừng");
  assert.equal(c.kq.ma, 4);
  assert.ok(c.loiDong.includes("JOB FAIL [doc-gop-s03] het-tien: gateway 402 -"), c.loiDong.join("\n"));
});
