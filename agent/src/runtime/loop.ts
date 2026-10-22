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
  type: "model" | "tool-call" | "tool-result" | "final" | "budget-exceeded" | "error";
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

const TRACES_DIR = join(import.meta.dirname, "../../traces");

async function writeTrace(name: string, records: StepRecord[]): Promise<string> {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const path = join(TRACES_DIR, `${ts}--${name}.jsonl`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return path;
}

/** Chạy 1 agent loop. Fail → throw (caller quyết định retry/abort). */
export async function runAgent(
  config: AgentConfig,
  input: string,
  hooks: LoopHooks = {},
): Promise<LoopResult> {
  const budget = config.budget ?? 8;
  const trace: StepRecord[] = [];
  const toolCalls: { name: string; args: Record<string, unknown> }[] = [];
  const model: LanguageModel = getModel(config.model);

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
      onStepFinish: ({ stepType, toolName, toolArgs, toolResult, text }) => {
        const stepNum = trace.filter((t) => t.type === "model").length;

        if (stepType === "tool-call") {
          trace.push({
            t: new Date().toISOString(),
            step: stepNum,
            type: "tool-call",
            data: { name: toolName, args: toolArgs as Record<string, unknown> },
          });
          toolCalls.push({ name: toolName ?? "?", args: toolArgs as Record<string, unknown> });
          hooks.onToolCall?.(toolName ?? "?", toolArgs as Record<string, unknown>);
        } else if (stepType === "tool-result") {
          trace.push({
            t: new Date().toISOString(),
            step: stepNum,
            type: "tool-result",
            data: {
              name: toolName,
              // offload: giữ head/tail trong trace (chuẩn T2)
              result: offload(typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult)),
            },
          });
          hooks.onToolResult?.(toolName ?? "?", toolResult);
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
          data: { name: tc.toolName, args: tc.input ?? tc.args },
        });
      }
    }
    trace.push({
      t: new Date().toISOString(),
      step: trace.length,
      type: "final",
      data: {
        output: offload(result.text, 500, 300),
        finishReason: result.finishReason,
        steps: result.steps?.length ?? 0,
        toolCalls: (result.toolCalls ?? []).length,
      },
    });

    const tracePath = await writeTrace(config.name, trace);
    // dùng result.toolCalls (AI SDK aggregate) thay vì local tracking
    const finalToolCalls = (result.toolCalls ?? []).map((tc) => ({
      name: tc.toolName,
      args: (tc.input ?? tc.args ?? {}) as Record<string, unknown>,
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
    const tracePath = await writeTrace(config.name, trace);
    throw err;
  }
}
