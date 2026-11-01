// models.ts — router model cho runtime (ADR-0012 §5, decision-models-landscape)
// Local-first: Qwen 27B (MTPLX :8000) qua AI SDK OpenAI-compat.
// kev-4b / decisions qua HTTP fetch riêng (contract /v1/systemone khác).
import { createOpenAI } from "@ai-sdk/openai";
import { createGateway } from "ai";

const MTPLX_URL = process.env.MTPLX_URL ?? "http://127.0.0.1:8000/v1";

const mtplx = createOpenAI({
  baseURL: MTPLX_URL,
  apiKey: "none", // local server không cần key
}); // MTPLX chỉ có chat completions, không Responses API — getModel dùng mtplx.chat()

export type ModelName = "qwen27b" | "kev4b" | "decisions" | "haiku";

/** Model cloud đi qua Vercel AI Gateway (KC1, Mạnh 01/11): một khoá AI_GATEWAY_API_KEY, ngân sách + nhật ký ở Gateway.
 * Đọc env lúc gọi để test trỏ được Gateway giả (AI_GATEWAY_BASE_URL). */
const gw = () => createGateway({ baseURL: process.env.AI_GATEWAY_BASE_URL || undefined, apiKey: process.env.AI_GATEWAY_API_KEY });
export const GATEWAY_MODEL = { haiku: "anthropic/claude-haiku-5.5", luna: "openai/gpt-6-luna" } as const;

/** Trả về language model cho AI SDK generateText. Chỉ qwen27b qua SDK;
 * kev/decisions dùng HTTP riêng (xem tools/native.ts). */
export function getModel(name: ModelName) {
  switch (name) {
    case "qwen27b":
      return mtplx.chat("qwen3.8-27b-local");
    case "haiku":
      return gw()(GATEWAY_MODEL.haiku);
    default:
      throw new Error(
        `${name} không dùng qua AI SDK — gọi HTTP trực tiếp (xem decision-models-landscape.md)`,
      );
  }
}

/** MTPLX reasoning param — bẫy cũ: max_tokens ≥ 2000, reasoning low ~9s. */
export const qwenParams = {
  maxOutputTokens: 4096,
  // MTPLX dùng OpenAI-compat; reasoning qua extra body nếu server hỗ trợ
  // (không set ở đây — tinh chỉnh khi gặp lỗi thực tế)
} as const;

/** Model decision (OpenAI Decisions qua AI Gateway) cho experimental_evaluate — bí danh tài liệu Gateway ghi cho ai < 7.0.128. */
export function getDecisionModel(id: string = GATEWAY_MODEL.luna) {
  return gw().evaluationModel(id);
}
