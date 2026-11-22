// loop.ts — harness runtime loop (ADR-0012 "3 tầng + 1 hợp đồng")
// ReAct: reason → tool → observe → repeat, với:
//   - step budget (default 8) — không chạy vô hạn
//   - hooks: onStep / onToolCall / onToolResult (fail-soft, không chặn loop)
//   - trace JSONL mọi bước → agent/traces/<ISO>-<agent>.jsonl
//   - agents-as-config: plain object, KHÔNG class/framework
// Đường gọi (MH1, Mạnh 22/11 «Anthropic thẳng»): model và đường đọc từ agent/config/model-agent.json theo tên agent. "anthropic"
// gọi Messages API bằng @anthropic-ai/sdk (vòng tool tự viết, cùng budget); "gateway" qua AI SDK generateText kèm cờ không giữ dữ
// liệu. tu_lui: đường đang dùng gặp lớp dừng (hết tiền, khoá sai) thì lùi sang đường kế cho chính lời này và mọi lời sau của tiến
// trình (một dòng `chuyen-duong`). Mỗi lần gọi một dòng sổ ai_calls, model `<đường>:<mã gọi>`; LoopResult.model giữ mã model.
import Anthropic from "@anthropic-ai/sdk";
import { asSchema, generateText, stepCountIs, type Tool, type LanguageModel } from "ai";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { offload } from "./context.js";
import { modelGateway, modelParams } from "./models.js";
import { LoiThieuKhoa, duongCoKhoa, khoaThieuAgent, modelCuaAgent, tuyChonGateway, type Duong, type ModelAgent } from "./model-agent.js";
import { recordCallDb, soToken, tenLop, type RecordCall } from "./ai-call-log.js";
import { chuoiLoi, laLopDung, phanLoaiLoi } from "./loi-nha-cung-cap.js";
import { DUONG_ANTHROPIC, KHOA_DUONG, modelSo } from "../enrich/doc-gop-s03/cau-hinh.js";

export type AgentTool = Tool<Record<string, unknown>>;

/** Model của agent KHÔNG khai ở đây: runAgent đọc agent/config/model-agent.json theo `name` (MH1, AC-2). */
export type AgentConfig = {
  name: string;
  systemPrompt: string;
  tools: Record<string, AgentTool>;
  budget?: number; // max steps (default 8)
};

export type StepRecord = {
  t: string;
  step: number;
  type: "model" | "tool-call" | "tool-result" | "final" | "budget-exceeded" | "error" | "ai-call-log-error" | "chuyen-duong";
  data: Record<string, unknown>;
};

export type LoopResult = {
  output: string;
  steps: number;
  tracePath: string;
  toolCalls: { name: string; args: Record<string, unknown> }[];
  /** Mã model (mã Gateway, không đổi theo đường — danh tính đề xuất) và số token của lời gọi — để trần tiền và căn cứ đề xuất. */
  model: string;
  /** Đường đã trả lời (vắng khi model tiêm thẳng). */
  duong?: Duong;
  usage: { inputTokens: number | null; outputTokens: number | null };
};

export type LoopHooks = {
  onStep?: (step: number) => void;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onToolResult?: (name: string, result: unknown) => void;
};

/** Phụ thuộc tiêm được (test): model thay cho model của tệp cấu hình, writer sổ cuộc gọi AI thay cho ghi DB, client Anthropic,
 * nơi in dòng chuyen-duong. */
export type LoopDeps = {
  model?: LanguageModel;
  recordCall?: RecordCall;
  taoAnthropic?: () => Anthropic;
  log?: (dong: string) => void;
};

const TRACES_DIR = join(import.meta.dirname, "../../traces");

function tracePathFor(name: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return join(TRACES_DIR, `${ts}--${name}.jsonl`);
}

async function writeTrace(path: string, records: StepRecord[]): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return path;
}

/** Ghi sổ cuộc gọi AI, fail-soft: sổ hỏng không làm hỏng lượt agent — chỉ để lại một dòng trong trace (PL29 AC-4). */
async function ghiSo(recordCall: RecordCall, r: Parameters<RecordCall>[0], trace: StepRecord[]): Promise<void> {
  try {
    await recordCall(r);
  } catch (err) {
    trace.push({ t: new Date().toISOString(), step: trace.length, type: "ai-call-log-error", data: { error: tenLop(err) } });
  }
}

/** Client thật: khoá ANTHROPIC_API_KEY đọc lúc gọi và truyền TƯỜNG MINH (không rơi về hồ sơ đăng nhập trên đĩa); base URL theo
 * ANTHROPIC_BASE_URL (SDK tự đọc — probe trỏ máy giả). SDK tự thử lại 429/5xx 2 lần, không thử lại 402/401. */
const taoAnthropicMacDinh = () =>
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", authToken: null, maxRetries: 2, timeout: 240_000 });

/** Dòng log khi lùi đường — để biết credit một đường đã cạn. */
export const dongChuyenDuong = (agent: string, gateway: string, tu: Duong, sang: Duong, lyDo: string): string =>
  `JOB WARN [${agent}] chuyen-duong: ${gateway} ${tu} -> ${sang} (${lyDo})`;

/** Đường còn dùng của từng (agent, model, bảng đường) trong tiến trình: đường đã lùi không thử lại ở lời sau. */
const duongCon = new Map<string, Duong[]>();
/** Xoá trạng thái lùi đường (test; một tiến trình CLI là một lượt nên không cần gọi). */
export const datLaiDuong = () => duongCon.clear();

type KetQuaGoi = {
  text: string;
  steps: number;
  finishReason: string | undefined;
  toolCalls: { name: string; args: Record<string, unknown> }[];
  usage: { inputTokens: number | null; outputTokens: number | null };
};
type NguCanh = { config: AgentConfig; input: string; budget: number; hooks: LoopHooks; trace: StepRecord[] };

/** Đường gateway (hay model tiêm thẳng): AI SDK generateText — loop ReAct nội bộ với tool calling. */
async function goiGateway(nc: NguCanh, model: LanguageModel, providerOptions: Record<string, any> | undefined): Promise<KetQuaGoi> {
  const { config, input, budget, hooks, trace } = nc;
  const toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  const result = await generateText({
    model,
    system: config.systemPrompt,
    prompt: input,
    tools: config.tools,
    stopWhen: stepCountIs(budget),
    ...modelParams,
    // Cờ Gateway không giữ dữ liệu, không huấn luyện — cùng hàm tuyChonGui của PL30 (AC-3).
    ...(providerOptions ? { providerOptions } : {}),
    // AI SDK 7: mỗi bước mang cả mảng toolCalls / toolResults (không còn stepType/toolName/toolArgs của bản cũ).
    onStepFinish: ({ toolCalls: calls, toolResults }) => {
      const stepNum = trace.filter((t) => t.type === "model").length;
      for (const tc of calls ?? []) {
        const args = (tc.input ?? {}) as Record<string, unknown>;
        trace.push({ t: new Date().toISOString(), step: stepNum, type: "tool-call", data: { name: tc.toolName, args } });
        toolCalls.push({ name: tc.toolName ?? "?", args });
        hooks.onToolCall?.(tc.toolName ?? "?", args);
      }
      for (const tr of toolResults ?? []) {
        trace.push({
          t: new Date().toISOString(),
          step: stepNum,
          type: "tool-result",
          // offload: giữ head/tail trong trace (chuẩn T2)
          data: { name: tr.toolName, result: offload(typeof tr.output === "string" ? tr.output : JSON.stringify(tr.output)) },
        });
        hooks.onToolResult?.(tr.toolName ?? "?", tr.output);
      }
      hooks.onStep?.(stepNum);
    },
  });
  // Ghi tool calls vào trace từ result (bảo đảm có dù callback miss)
  for (const tc of result.toolCalls ?? []) {
    if (!trace.some((r) => r.type === "tool-call" && r.data.name === tc.toolName)) {
      trace.push({ t: new Date().toISOString(), step: trace.length, type: "tool-call", data: { name: tc.toolName, args: (tc.input ?? {}) as Record<string, unknown> } });
    }
  }
  const usage = result.totalUsage ?? result.usage;
  // dùng result.toolCalls (AI SDK aggregate) thay vì local tracking
  const finalToolCalls = (result.toolCalls ?? []).map((tc) => ({ name: tc.toolName, args: (tc.input ?? {}) as Record<string, unknown> }));
  return {
    text: result.text,
    steps: result.steps?.length ?? 0,
    finishReason: result.finishReason,
    toolCalls: finalToolCalls.length > 0 ? finalToolCalls : toolCalls,
    usage: { inputTokens: soToken(usage?.inputTokens), outputTokens: soToken(usage?.outputTokens) },
  };
}

/** Đường anthropic: Messages API thẳng. Thân yêu cầu chỉ mang model, system, messages, max_tokens (+ tools khi agent có tool) — không
 * temperature (Haiku 5.5 trả 400 với giá trị lấy mẫu khác mặc định), không thinking, không trường nào khác (AC-3). Vòng tool:
 * stop_reason tool_use → chạy tool, gửi tool_result, tối đa `budget` lời. */
async function goiAnthropic(nc: NguCanh, client: Anthropic, ma: string): Promise<KetQuaGoi> {
  const { config, input, budget, hooks, trace } = nc;
  const tenTool = Object.keys(config.tools);
  const tools: Anthropic.Tool[] = await Promise.all(tenTool.map(async (name) => ({
    name,
    description: typeof config.tools[name].description === "string" ? (config.tools[name].description as string) : "",
    input_schema: (await asSchema(config.tools[name].inputSchema).jsonSchema) as Anthropic.Tool.InputSchema,
  })));
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: input }];
  const toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  let vao = 0, ra = 0, buoc = 0, text = "", finish: string | undefined;
  while (buoc < budget) {
    const r = await client.messages.create({
      model: ma, max_tokens: modelParams.maxOutputTokens, system: config.systemPrompt, messages,
      ...(tools.length ? { tools } : {}),
    });
    buoc++;
    vao += r.usage?.input_tokens ?? 0;
    ra += r.usage?.output_tokens ?? 0;
    finish = r.stop_reason ?? undefined;
    text = r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const dung = r.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (r.stop_reason !== "tool_use" || !dung.length) break;
    messages.push({
      role: "assistant",
      content: r.content.flatMap((b): Anthropic.ContentBlockParam[] =>
        b.type === "text" ? [{ type: "text", text: b.text }] : b.type === "tool_use" ? [{ type: "tool_use", id: b.id, name: b.name, input: b.input }] : []),
    });
    const ketQua: Anthropic.ToolResultBlockParam[] = [];
    for (const u of dung) {
      const args = (u.input ?? {}) as Record<string, unknown>;
      trace.push({ t: new Date().toISOString(), step: buoc, type: "tool-call", data: { name: u.name, args } });
      toolCalls.push({ name: u.name, args });
      hooks.onToolCall?.(u.name, args);
      const t = config.tools[u.name];
      let out: unknown;
      try {
        out = t?.execute ? await t.execute(args, { toolCallId: u.id, messages: [] } as never) : { error: `không có tool ${u.name}` };
      } catch (e) {
        out = { error: tenLop(e) };
      }
      const chu = typeof out === "string" ? out : JSON.stringify(out);
      trace.push({ t: new Date().toISOString(), step: buoc, type: "tool-result", data: { name: u.name, result: offload(chu) } });
      hooks.onToolResult?.(u.name, out);
      ketQua.push({ type: "tool_result", tool_use_id: u.id, content: chu });
    }
    messages.push({ role: "user", content: ketQua });
    hooks.onStep?.(buoc);
  }
  return { text, steps: buoc, finishReason: finish, toolCalls, usage: { inputTokens: soToken(vao), outputTokens: soToken(ra) } };
}

/** Chạy 1 agent loop. Fail → throw (caller quyết định retry/abort). */
export async function runAgent(
  config: AgentConfig,
  input: string,
  hooks: LoopHooks = {},
  deps: LoopDeps = {},
): Promise<LoopResult> {
  const budget = config.budget ?? 8;
  const trace: StepRecord[] = [];
  // Model từ tệp cấu hình theo tên agent; tệp sai hay agent thiếu khoá → LoiCauHinhModel trước lời gọi đầu (AC-2).
  const cauHinh: ModelAgent | null = deps.model ? null : modelCuaAgent(config.name);
  const recordCall = deps.recordCall ?? recordCallDb;
  const log = deps.log ?? ((d: string) => console.error(d));
  // Tên model (danh tính): id thật của model tiêm, hay mã Gateway của tệp cấu hình.
  const modelId = deps.model
    ? typeof deps.model === "string" ? deps.model : (deps.model as { modelId?: string }).modelId ?? "?"
    : cauHinh!.gateway;
  const tracePath = tracePathFor(config.name);
  const nc: NguCanh = { config, input, budget, hooks, trace };

  // Đường còn dùng: nhớ theo tiến trình; lần đầu lọc theo khoá (thiếu khoá của mọi đường dùng được → LoiThieuKhoa, mã 5).
  let ds: Duong[] | null = null;
  if (cauHinh) {
    const k = `${config.name}|${cauHinh.gateway}|${cauHinh.duong.join(",")}|${cauHinh.tuLui}`;
    ds = duongCon.get(k) ?? null;
    if (!ds) {
      const co = duongCoKhoa(cauHinh);
      if (!co.length) throw new LoiThieuKhoa(khoaThieuAgent(cauHinh));
      if (co[0] !== cauHinh.duong[0]) {
        const d = dongChuyenDuong(config.name, cauHinh.gateway, cauHinh.duong[0], co[0], `thieu-khoa ${KHOA_DUONG[cauHinh.duong[0]]}`);
        trace.push({ t: new Date().toISOString(), step: 0, type: "chuyen-duong", data: { dong: d } });
        log(d);
      }
      ds = co;
      duongCon.set(k, ds);
    }
  }

  for (;;) {
    const duong: Duong | undefined = ds?.[0];
    const modelSoGhi = cauHinh && duong ? modelSo(cauHinh.gateway, duong) : modelId;
    const t0 = performance.now();
    trace.push({
      t: new Date().toISOString(),
      step: trace.filter((t) => t.type === "model").length,
      type: "model",
      data: { agent: config.name, model: modelSoGhi, budget, tools: Object.keys(config.tools), inputLength: input.length },
    });
    try {
      const kq = duong === "anthropic"
        ? await goiAnthropic(nc, (deps.taoAnthropic ?? taoAnthropicMacDinh)(), DUONG_ANTHROPIC[cauHinh!.gateway])
        : await goiGateway(nc, deps.model ?? modelGateway(cauHinh!.gateway), cauHinh ? tuyChonGateway(cauHinh.gateway) : undefined);
      trace.push({
        t: new Date().toISOString(),
        step: trace.length,
        type: "final",
        data: { output: offload(kq.text, 500, 300), finishReason: kq.finishReason, steps: kq.steps, toolCalls: kq.toolCalls.length, usage: kq.usage, duong },
      });
      await ghiSo(
        recordCall,
        { viec: config.name, model: modelSoGhi, inputTokens: kq.usage.inputTokens, outputTokens: kq.usage.outputTokens, latencyMs: performance.now() - t0, ok: true, loi: null, trace: tracePath },
        trace,
      );
      await writeTrace(tracePath, trace);
      return { output: kq.text, steps: kq.steps, tracePath, toolCalls: kq.toolCalls, model: modelId, duong, usage: kq.usage };
    } catch (err) {
      const p = phanLoaiLoi(err);
      trace.push({ t: new Date().toISOString(), step: trace.length, type: "error", data: { error: err instanceof Error ? err.message : String(err), loi: chuoiLoi(p), duong } });
      await ghiSo(
        recordCall,
        // loi giữ tên lớp (PL29 E3: không chép message); lớp nhà cung cấp nằm ở trace và dòng chuyen-duong.
        { viec: config.name, model: modelSoGhi, inputTokens: null, outputTokens: null, latencyMs: performance.now() - t0, ok: false, loi: tenLop(err), trace: tracePath },
        trace,
      );
      // tu_lui: đường này cạn tiền hay khoá sai → bỏ nó cho cả tiến trình, thử lại chính lời này ở đường kế (cùng trần của lượt).
      if (cauHinh?.tuLui && ds && ds.length > 1 && laLopDung(p.lop)) {
        const d = dongChuyenDuong(config.name, cauHinh.gateway, ds[0], ds[1], chuoiLoi(p));
        trace.push({ t: new Date().toISOString(), step: trace.length, type: "chuyen-duong", data: { dong: d } });
        log(d);
        ds.shift();
        continue;
      }
      await writeTrace(tracePath, trace);
      throw err;
    }
  }
}
