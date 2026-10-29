// loop.ts — harness runtime loop (ADR-0012 "3 tầng + 1 hợp đồng")
// ReAct: reason → tool → observe → repeat, với:
//   - step budget (default 8) — không chạy vô hạn
//   - hooks: onStep / onToolCall / onToolResult (fail-soft, không chặn loop)
//   - trace JSONL mọi bước → agent/traces/<ISO>-<agent>.jsonl
//   - agents-as-config: plain object, KHÔNG class/framework
import { generateText, stepCountIs, type Tool, type LanguageModel } from "ai";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { offload } from "./context.js";
import { getModel, qwenParams, type ModelName } from "./models.js";
import { recordCallDb, soToken, tenLop, type RecordCall } from "./ai-call-log.js";

export type AgentTool = Tool<Record<string, unknown>>;

export type AgentConfig = {
  name: string;
  model: ModelName;
  systemPrompt: string;
  tools: Record<string, AgentTool>;
  budget?: number; // max steps (default 8)
};

export type StepRecord = {
  t: string;
  step: number;
  type: "model" | "tool-call" | "tool-result" | "final" | "budget-exceeded" | "error" | "ai-call-log-error";
  data: Record<string, unknown>;
};

export type LoopResult = {
  output: string;
  steps: number;
  tracePath: string;
  toolCalls: { name: string; args: Record<string, unknown> }[];
};

export type LoopHooks = {
  onStep?: (step: number) => void;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onToolResult?: (name: string, result: unknown) => void;
};

/** Phụ thuộc tiêm được (test): model thay cho getModel(config.model), writer sổ cuộc gọi AI thay cho ghi DB. */
export type LoopDeps = {
  model?: LanguageModel;
  recordCall?: RecordCall;
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

/** Chạy 1 agent loop. Fail → throw (caller quyết định retry/abort). */
export async function runAgent(
  config: AgentConfig,
  input: string,
  hooks: LoopHooks = {},
  deps: LoopDeps = {},
): Promise<LoopResult> {
  const budget = config.budget ?? 8;
  const trace: StepRecord[] = [];
  const toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  const model: LanguageModel = deps.model ?? getModel(config.model);
  const recordCall = deps.recordCall ?? recordCallDb;
  // Tên model vào sổ: id thật của model (khớp bảng giá ai_model_prices), không phải bí danh ModelName.
  const modelId = typeof model === "string" ? model : (model as { modelId?: string }).modelId ?? config.model;
  const tracePath = tracePathFor(config.name);
  const t0 = performance.now();

  const toolNames = Object.keys(config.tools);

  trace.push({
    t: new Date().toISOString(),
    step: 0,
    type: "model",
    data: {
      agent: config.name,
      model: config.model,
      budget,
      tools: toolNames,
      inputLength: input.length,
    },
  });

  try {
    // AI SDK generateText đã là loop ReAct nội bộ với tool calling;
    // ta wrap để trace + budget + hooks.
    // stopWhen: stepCountIs(budget) — AI SDK v2 đúng cách giới hạn bước
    const result = await generateText({
      model,
      system: config.systemPrompt,
      prompt: input,
      tools: config.tools,
      stopWhen: stepCountIs(budget),
      ...qwenParams,
      // AI SDK 7: mỗi bước mang cả mảng toolCalls / toolResults (không còn stepType/toolName/toolArgs của bản cũ).
      onStepFinish: ({ toolCalls: calls, toolResults }) => {
        const stepNum = trace.filter((t) => t.type === "model").length;

        for (const tc of calls ?? []) {
          const args = (tc.input ?? {}) as Record<string, unknown>;
          trace.push({
            t: new Date().toISOString(),
            step: stepNum,
            type: "tool-call",
            data: { name: tc.toolName, args },
          });
          toolCalls.push({ name: tc.toolName ?? "?", args });
          hooks.onToolCall?.(tc.toolName ?? "?", args);
        }
        for (const tr of toolResults ?? []) {
          trace.push({
            t: new Date().toISOString(),
            step: stepNum,
            type: "tool-result",
            data: {
              name: tr.toolName,
              // offload: giữ head/tail trong trace (chuẩn T2)
              result: offload(typeof tr.output === "string" ? tr.output : JSON.stringify(tr.output)),
            },
          });
          hooks.onToolResult?.(tr.toolName ?? "?", tr.output);
        }

        hooks.onStep?.(stepNum);
      },
    });

    // Ghi tool calls vào trace từ result (bảo đảm có dù callback miss)
    for (const tc of result.toolCalls ?? []) {
      if (!trace.some((r) => r.type === "tool-call" && r.data.name === tc.toolName)) {
        trace.push({
          t: new Date().toISOString(),
          step: trace.length,
          type: "tool-call",
          data: { name: tc.toolName, args: (tc.input ?? {}) as Record<string, unknown> },
        });
      }
    }
    const usage = result.totalUsage ?? result.usage;
    const inputTokens = soToken(usage?.inputTokens);
    const outputTokens = soToken(usage?.outputTokens);
    trace.push({
      t: new Date().toISOString(),
      step: trace.length,
      type: "final",
      data: {
        output: offload(result.text, 500, 300),
        finishReason: result.finishReason,
        steps: result.steps?.length ?? 0,
        toolCalls: (result.toolCalls ?? []).length,
        usage: { inputTokens, outputTokens },
      },
    });

    await ghiSo(
      recordCall,
      { viec: config.name, model: modelId, inputTokens, outputTokens, latencyMs: performance.now() - t0, ok: true, loi: null, trace: tracePath },
      trace,
    );
    await writeTrace(tracePath, trace);
    // dùng result.toolCalls (AI SDK aggregate) thay vì local tracking
    const finalToolCalls = (result.toolCalls ?? []).map((tc) => ({
      name: tc.toolName,
      args: (tc.input ?? {}) as Record<string, unknown>,
    }));
    return {
      output: result.text,
      steps: result.steps?.length ?? 0,
      tracePath,
      toolCalls: finalToolCalls.length > 0 ? finalToolCalls : toolCalls,
    };
  } catch (err) {
    trace.push({
      t: new Date().toISOString(),
      step: trace.length,
      type: "error",
      data: { error: err instanceof Error ? err.message : String(err) },
    });
    await ghiSo(
      recordCall,
      { viec: config.name, model: modelId, inputTokens: null, outputTokens: null, latencyMs: performance.now() - t0, ok: false, loi: tenLop(err), trace: tracePath },
      trace,
    );
    await writeTrace(tracePath, trace);
    throw err;
  }
}
