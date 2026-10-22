// models.ts — router model cho runtime (ADR-0012 §5, decision-models-landscape)
// Local-first: Qwen 27B (MTPLX :8000) qua AI SDK OpenAI-compat.
// kev-4b / decisions qua HTTP fetch riêng (contract /v1/systemone khác).
import { createOpenAI } from "@ai-sdk/openai";

const MTPLX_URL = process.env.MTPLX_URL ?? "http://127.0.0.1:8000/v1";

const mtplx = createOpenAI({
  baseURL: MTPLX_URL,
  apiKey: "none", // local server không cần key
  compatibility: "compatible", // MTPLX chỉ có chat completions, không Responses API
});

export type ModelName = "qwen27b" | "kev4b" | "decisions";

/** Trả về language model cho AI SDK generateText. Chỉ qwen27b qua SDK;
 * kev/decisions dùng HTTP riêng (xem tools/native.ts). */
export function getModel(name: ModelName) {
  switch (name) {
    case "qwen27b":
      return mtplx.chat("qwen3.8-27b-local");
    default:
      throw new Error(
        `${name} không dùng qua AI SDK — gọi HTTP trực tiếp (xem decision-models-landscape.md)`,
      );
  }
}

/** MTPLX reasoning param — bẫy cũ: max_tokens ≥ 2000, reasoning low ~9s. */
export const qwenParams = {
  maxTokens: 4096,
  // MTPLX dùng OpenAI-compat; reasoning qua extra body nếu server hỗ trợ
  // (không set ở đây — tinh chỉnh khi gặp lỗi thực tế)
} as const;
