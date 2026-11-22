// model-agent.test.ts — MH1 model-may-sang-haiku: AC-2 (model chọn bằng agent/config/model-agent.json), AC-3 (cờ Gateway không giữ
// dữ liệu), AC-6 (nhãn bạc và đọc ảnh không còn backend Qwen). Gateway giả và máy giả MTPLX chạy trong tiến trình test; không DB,
// không mạng, không khoá thật. Mỗi phép đo có chiều đỏ trên cùng fixture (hàm kiểm chạy trên vật hỏng phải ném đúng thông điệp ghim).
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { moAnthropic, moGateway, moMtplx, type MayAnthropic, type MayGia } from "./helpers/gateway-gia.js";
import { datLaiDuong, runAgent, type AgentConfig } from "../src/runtime/loop.js";
import { DUONG_CAU_HINH, LoiCauHinhModel, kiemCauHinhModel, modelCuaAgent, napCauHinhModel } from "../src/runtime/model-agent.js";
import { modelGateway } from "../src/runtime/models.js";
import { tuyChonGui } from "../src/enrich/doc-gop-s03/cau-hinh.js";
import { enrichTextAgent } from "../src/agents/enrich-text.js";
import { judgeEntityAgent } from "../src/agents/judge-entity.js";
import { docCo as docCoNhan } from "../scripts/nhan-bac-run.js";
import { BACKENDS } from "../src/agents/nhan-bac-s03.js";
import { VLM_MODELS } from "../src/agents/vlm-anh-s03.js";
import { docCo as docCoAnh } from "../scripts/vlm-anh-run.js";

const AGENT = join(import.meta.dirname, "..");
const HAIKU = "anthropic/claude-haiku-5.5";
const GLM = "zai/glm-5.3-flash";
const khongGhi = async () => {};
let gw: MayGia;
const thuMuc = mkdtempSync(join(tmpdir(), "mh1-model-agent-"));

before(async () => {
  gw = await moGateway({ text: '{"property_type":"apartment","confidence":0.8}', vao: 120, ra: 30 });
  process.env.AI_GATEWAY_BASE_URL = gw.url;
  process.env.AI_GATEWAY_API_KEY = "khoa-gia";
  (globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;
});
after(async () => {
  await gw.dong();
});
afterEach(() => {
  delete process.env.MODEL_AGENT_CAU_HINH;
  gw.datLai();
  datLaiDuong();
});

/** Bảng mẫu hợp lệ; `doi` sửa một phần để dựng ca. */
function bang(doi: (b: Record<string, any>) => void = () => {}) {
  const b: Record<string, any> = {
    phien_ban: 1,
    mac_dinh: "haiku",
    model: { haiku: { gateway: HAIKU, gia_vao: 0.1, gia_ra: 0.5 }, glm: { gateway: GLM, gia_vao: 0.15, gia_ra: 0.5 } },
    agent: { "enrich-text": { model: "haiku", tran_usd: 0.5 }, "judge-entity": { model: "haiku", tran_usd: 1 } },
  };
  doi(b);
  return b;
}
let soTep = 0;
const ghiTep = (chu: string) => {
  const p = join(thuMuc, `bang-${++soTep}.json`);
  writeFileSync(p, chu);
  return p;
};
const dungBang = (b: unknown) => (process.env.MODEL_AGENT_CAU_HINH = ghiTep(JSON.stringify(b)));

// ---------- AC-2 ----------
test("MH1 AC-2 bảng của kho: enrich-text, judge-entity gán Haiku, trần 0,5 và 1 USD (Hỏi-1 Mạnh duyệt 21/11), đường Anthropic thẳng rồi Gateway, tự lùi (Mạnh 22/11)", () => {
  const c = napCauHinhModel(DUONG_CAU_HINH);
  const duong = { duong: ["anthropic", "gateway"], tuLui: true };
  assert.deepEqual(modelCuaAgent("enrich-text", c), { khoa: "haiku", gateway: HAIKU, gia: { vao: 0.1, ra: 0.5 }, tranUsd: 0.5, ...duong });
  assert.deepEqual(modelCuaAgent("judge-entity", c), { khoa: "haiku", gateway: HAIKU, gia: { vao: 0.1, ra: 0.5 }, tranUsd: 1, ...duong });
  assert.deepEqual(modelCuaAgent("smoke-echo", c), { khoa: "haiku", gateway: HAIKU, gia: { vao: 0.1, ra: 0.5 }, tranUsd: 0.01, ...duong });
});

test("MH1 AC-2 đổi khoá model trong tệp thì lời gọi mang mã Gateway mới, mã agent không đổi", async () => {
  for (const [agent, khoa, ma] of [
    [enrichTextAgent, "haiku", HAIKU], [enrichTextAgent, "glm", GLM], [judgeEntityAgent, "haiku", HAIKU], [judgeEntityAgent, "glm", GLM],
  ] as const) {
    gw.datLai();
    dungBang(bang((b) => (b.agent[agent.name].model = khoa)));
    const r = await runAgent(agent, "thử", {}, { recordCall: khongGhi });
    assert.equal(gw.yeuCau.length, 1, `MH1 AC-2 ${agent.name}/${khoa}: số yêu cầu Gateway`);
    assert.equal(gw.yeuCau[0].model, ma, `MH1 AC-2 ${agent.name}/${khoa} gọi sai model`);
    assert.equal(r.model, ma);
    assert.deepEqual(r.usage, { inputTokens: 120, outputTokens: 30 });
  }
});

/** Năm ca lỗi viết trước: mỗi ca một tệp hỏng và đúng mẩu thông điệp phải có. */
const CA_LOI: { ten: string; tep: () => string; mau: RegExp }[] = [
  { ten: "tệp thiếu", tep: () => join(thuMuc, "khong-co.json"), mau: /không đọc được tệp/ },
  { ten: "JSON hỏng", tep: () => ghiTep("{ phien_ban: 1"), mau: /không phải JSON/ },
  { ten: "mã ngoài danh sách", tep: () => ghiTep(JSON.stringify(bang((b) => (b.model.glm.gateway = "openai/gpt-6-luna")))), mau: /ngoài danh sách duyệt/ },
  { ten: "agent không có khoá", tep: () => ghiTep(JSON.stringify(bang((b) => delete b.agent["enrich-text"]))), mau: /agent enrich-text không có khoá/ },
  { ten: "giá âm", tep: () => ghiTep(JSON.stringify(bang((b) => (b.model.haiku.gia_ra = -1)))), mau: /giá thiếu hay âm/ },
  { ten: "đường lạ", tep: () => ghiTep(JSON.stringify(bang((b) => (b.model.haiku.duong = ["bedrock"])))), mau: /duong "bedrock"/ },
  { ten: "đường anthropic cho model không phải Claude", tep: () => ghiTep(JSON.stringify(bang((b) => { b.model.glm.duong = "anthropic"; b.agent["enrich-text"].model = "glm"; }))), mau: /không có đường anthropic/ },
];
test("MH1 AC-2 năm ca lỗi cấu hình: dừng trước lời gọi đầu, thông điệp gọi tên ca, Gateway nhận 0 yêu cầu", async () => {
  for (const ca of CA_LOI) {
    gw.datLai();
    process.env.MODEL_AGENT_CAU_HINH = ca.tep();
    await assert.rejects(runAgent(enrichTextAgent, "thử", {}, { recordCall: khongGhi }), (e: unknown) => {
      assert.ok(e instanceof LoiCauHinhModel, `MH1 AC-2 ca «${ca.ten}»: lỗi không phải LoiCauHinhModel`);
      assert.match((e as Error).message, ca.mau, `MH1 AC-2 ca «${ca.ten}»: thông điệp sai`);
      return true;
    });
    assert.equal(gw.yeuCau.length, 0, `MH1 AC-2 ca «${ca.ten}»: đã có lời gọi Gateway`);
  }
});

/** Hàm kiểm dùng chung cho ca thật và chiều đỏ: bộ kiểm phải chặn mã model ngoài danh sách duyệt. */
function kiemChanNgoaiDanhSach(kiem: (x: unknown) => unknown) {
  const sai = bang((b) => (b.model.glm.gateway = "openai/gpt-6-luna"));
  let bat = false;
  try {
    kiem(sai);
  } catch (e) {
    bat = /ngoài danh sách duyệt/.test((e as Error).message);
  }
  if (!bat) assert.fail("MH1 AC-2 ca «mã ngoài danh sách» không bị chặn");
}
test("MH1 AC-2 bộ kiểm chặn mã model ngoài danh sách duyệt", () => kiemChanNgoaiDanhSach(kiemCauHinhModel));
test("chiều đỏ MH1 AC-2: bộ kiểm bỏ kiểm danh sách → đỏ «ca mã ngoài danh sách không bị chặn»", () => {
  assert.throws(() => kiemChanNgoaiDanhSach((x) => x), /MH1 AC-2 ca «mã ngoài danh sách» không bị chặn/);
});

// ---------- AC-3 ----------
/** Hàm kiểm dùng chung: mọi yêu cầu Gateway mang đúng cờ của tuyChonGui(mã model). */
function kiemCo(yeuCau: MayGia["yeuCau"]) {
  assert.ok(yeuCau.length > 0, "MH1 AC-3 không có yêu cầu nào để kiểm");
  for (const y of yeuCau) {
    const co = (y.than.providerOptions as Record<string, unknown> | undefined)?.gateway;
    if (!co) assert.fail(`MH1 AC-3 thiếu cờ không giữ dữ liệu (${y.model})`);
    assert.deepEqual(co, tuyChonGui(y.model).gateway, `MH1 AC-3 cờ sai cho ${y.model}`);
  }
}
test("MH1 AC-3 enrich-text và judge-entity gửi cờ zeroDataRetention, disallowPromptTraining", async () => {
  dungBang(bang());
  await runAgent(enrichTextAgent, "thử", {}, { recordCall: khongGhi });
  await runAgent(judgeEntityAgent, "thử", {}, { recordCall: khongGhi });
  assert.equal(gw.yeuCau.length, 2);
  kiemCo(gw.yeuCau);
  assert.deepEqual((gw.yeuCau[0].than.providerOptions as any).gateway, { zeroDataRetention: true, disallowPromptTraining: true });
});
test("chiều đỏ MH1 AC-3: lời gọi không qua tệp cấu hình (model tiêm thẳng) → đỏ «thiếu cờ không giữ dữ liệu»", async () => {
  const cauHinhRong: AgentConfig = { name: "khong-co-khoa", systemPrompt: "thử", tools: {}, budget: 1 };
  await runAgent(cauHinhRong, "thử", {}, { model: modelGateway(HAIKU), recordCall: khongGhi });
  assert.throws(() => kiemCo(gw.yeuCau), /MH1 AC-3 thiếu cờ không giữ dữ liệu/);
});

/** Khoá được phép trong thân yêu cầu đường thẳng (AC-3, Mạnh chấp nhận 22/11 không có cờ theo lời gọi như đọc gộp). */
const KHOA_THANG = new Set(["model", "system", "messages", "max_tokens", "temperature"]);
/** Hàm kiểm dùng chung: mọi thân yêu cầu Anthropic chỉ mang khoá trong KHOA_THANG. */
function kiemThanThang(yeuCau: MayAnthropic["yeuCau"]) {
  assert.ok(yeuCau.length > 0, "MH1 AC-3 không có yêu cầu thẳng nào để kiểm");
  for (const y of yeuCau) for (const k of Object.keys(y.than)) if (!KHOA_THANG.has(k)) assert.fail(`AC-3 đường thẳng mang trường lạ ${k}`);
}
test("MH1 AC-3 đường thẳng: thân yêu cầu enrich-text, judge-entity chỉ có model, system, messages, max_tokens", async () => {
  const an = await moAnthropic({ text: '{"property_type":"apartment","confidence":0.8}', vao: 120, ra: 30 });
  const cu = { url: process.env.ANTHROPIC_BASE_URL, khoa: process.env.ANTHROPIC_API_KEY };
  process.env.ANTHROPIC_BASE_URL = an.url;
  process.env.ANTHROPIC_API_KEY = "khoa-gia";
  try {
    dungBang(bang((b) => (b.model.haiku.duong = ["anthropic", "gateway"])));
    await runAgent(enrichTextAgent, "thử", {}, { recordCall: khongGhi });
    await runAgent(judgeEntityAgent, "thử", {}, { recordCall: khongGhi });
    assert.equal(an.yeuCau.length, 2);
    assert.equal(gw.yeuCau.length, 0, "MH1 AC-3 đường thẳng xanh mà vẫn gọi Gateway");
    kiemThanThang(an.yeuCau);
    // Chiều đỏ trên bản sao thân yêu cầu: thêm một khoá lạ thì hàm kiểm đỏ gọi tên khoá.
    const saoHong = { ...an.yeuCau[0], than: { ...an.yeuCau[0].than, metadata: { user_id: "x" } } };
    assert.throws(() => kiemThanThang([saoHong]), /AC-3 đường thẳng mang trường lạ metadata/);
  } finally {
    if (cu.url === undefined) delete process.env.ANTHROPIC_BASE_URL; else process.env.ANTHROPIC_BASE_URL = cu.url;
    if (cu.khoa === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = cu.khoa;
    await an.dong();
  }
});

// ---------- AC-6 ----------
/** Hàm kiểm dùng chung: danh sách model của lệnh không còn qwen, vẫn còn haiku. */
function kiemKhongQwen(ten: string, ds: readonly string[]) {
  if (ds.includes("qwen")) assert.fail(`MH1 AC-6 qwen còn chạy ở ${ten}`);
  assert.ok(ds.includes("haiku"), `MH1 AC-6 ${ten} mất haiku`);
}
test("MH1 AC-6 nhãn bạc và đọc ảnh: danh sách model không còn qwen; --model haiku đọc được", () => {
  kiemKhongQwen("nhan-bac", BACKENDS);
  kiemKhongQwen("vlm-anh", VLM_MODELS);
  assert.equal(docCoNhan(["--model", "haiku"]).model, "haiku");
  assert.equal(docCoAnh(["--model", "haiku"]).model, "haiku");
});
test("chiều đỏ MH1 AC-6: thêm lại qwen vào danh sách → đỏ «qwen còn chạy»", () => {
  assert.throws(() => kiemKhongQwen("nhan-bac", ["qwen", ...BACKENDS]), /MH1 AC-6 qwen còn chạy ở nhan-bac/);
});

function chayCli(tep: string, args: string[], env: Record<string, string>): Promise<{ ma: number | null; out: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ["--import", "tsx", tep, ...args], { cwd: AGENT, env: { ...process.env, ...env } });
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
test("MH1 AC-6 CLI thật --model qwen: thoát 2, «model không được duyệt», 0 lời gọi Gateway và MTPLX", async () => {
  const mtplx = await moMtplx();
  try {
    for (const tep of ["scripts/nhan-bac-run.ts", "scripts/vlm-anh-run.ts"]) {
      gw.datLai();
      const kq = await chayCli(tep, ["--model", "qwen", "--limit", "1"], { AI_GATEWAY_BASE_URL: gw.url, MTPLX_URL: mtplx.url });
      assert.equal(kq.ma, 2, `MH1 AC-6 ${tep} --model qwen phải thoát 2: ${kq.out.slice(0, 200)}`);
      assert.match(kq.out, /model không được duyệt/, `MH1 AC-6 ${tep} thiếu lời «model không được duyệt»`);
      assert.equal(gw.yeuCau.length, 0, `MH1 AC-6 ${tep} đã gọi Gateway`);
    }
    assert.equal(mtplx.dem(), 0, "MH1 AC-6 đã gọi MTPLX");
  } finally {
    await mtplx.dong();
  }
});
