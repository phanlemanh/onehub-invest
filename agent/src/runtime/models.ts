// models.ts — router model cho runtime (ADR-0012 §5, decision-models-landscape)
// MH1 model-may-sang-haiku (Mạnh 21/11: «Dùng toàn bộ sang cloud model haiku 5.5, không mang sang»): không còn model máy (MTPLX
// :8000). Model language đi qua Vercel AI Gateway; model của từng agent chọn ở agent/config/model-agent.json (runtime/model-agent.ts).
// kev-4b / decisions qua HTTP fetch riêng (contract /v1/systemone khác).
import { createGateway } from "ai";

export type ModelName = "kev4b" | "decisions" | "haiku";

/** Model cloud đi qua Vercel AI Gateway (KC1, Mạnh 01/11): một khoá AI_GATEWAY_API_KEY, ngân sách + nhật ký ở Gateway.
 * Đọc env lúc gọi để test trỏ được Gateway giả (AI_GATEWAY_BASE_URL). */
const gw = () => createGateway({ baseURL: process.env.AI_GATEWAY_BASE_URL || undefined, apiKey: process.env.AI_GATEWAY_API_KEY });
export const GATEWAY_MODEL = { haiku: "anthropic/claude-haiku-5.5", luna: "openai/gpt-6-luna-decisions" } // Gateway liệt kê bản -decisions là evaluation; "openai/gpt-6-luna" là language model (400 khi gọi evaluate, đo 01/11) as const;

/** Language model Gateway theo mã (vd anthropic/claude-haiku-5.5) — dùng cho agent chọn model bằng tệp cấu hình. */
export const modelGateway = (ma: string) => gw()(ma);

/** Trả về language model cho AI SDK generateText. kev/decisions dùng HTTP riêng (xem tools/native.ts). */
export function getModel(name: ModelName) {
  switch (name) {
    case "haiku":
      return gw()(GATEWAY_MODEL.haiku);
    default:
      throw new Error(
        `${name} không dùng qua AI SDK — gọi HTTP trực tiếp (xem decision-models-landscape.md)`,
      );
  }
}

/** Tham số chung của lời gọi runAgent; maxOutputTokens cũng là trần token ra khi ước chi lời kế (model-agent.ts TRAN_TOKEN_RA). */
export const modelParams = {
  maxOutputTokens: 4096,
} as const;

/** Model decision (OpenAI Decisions qua AI Gateway) cho experimental_evaluate — bí danh tài liệu Gateway ghi cho ai < 7.0.128. */
export function getDecisionModel(id: string = GATEWAY_MODEL.luna) {
  return gw().evaluationModel(id);
}
