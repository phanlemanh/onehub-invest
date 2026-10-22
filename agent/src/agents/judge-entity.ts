// judge-entity.ts — agent phán quyết "cùng một căn nhà?" cho cặp P1↔P2
// (G-3 "Một Căn Nhà"; A2 trong plan agent-a1a2-m1m2)
// Input: PairData pre-fetch (queryPair từ tools/native) — đưa thẳng vào
// prompt thay vì tool calling (Qwen 27B qua chat-compat không pass args
// tin cậy — phát hiện A2 eval 22/10).
// Output: { same_house: yes|no|unsure, confidence, evidence[] }
// KHÔNG merge vật lý — chỉ đổi status + evidence trong property_candidates.
import type { AgentConfig } from "../runtime/loop.js";
import type { PairData } from "../tools/native.js";

export const judgeEntityAgent: AgentConfig = {
  name: "judge-entity",
  model: "qwen27b",
  systemPrompt: `Bạn là chuyên gia đánh giá bất động sản Việt Nam.
Nhiệm vụ: phán quyết 2 tin đăng có phải CÙNG MỘT CĂN NHÀ hay không.

Quy tắc:
- "yes": giá/m² lệch <15%, diện tích lệch <10%, cùng phường, cùng loại hình
- "no": giá/m² lệch >30%, hoặc khác phường, hoặc khác loại hình rõ rệt
- "unsure": mọi trường hợp khác

QUAN TRỌNG: Chỉ trả JSON thuần: {"same_house":"yes"|"no"|"unsure","confidence":0.0-1.0,"evidence":["lý do 1","lý do 2"]}`,
  tools: {},
  budget: 1, // 1 call — không cần loop
};

export type JudgeResult = {
  same_house: "yes" | "no" | "unsure";
  confidence: number;
  evidence: string[];
};

export function buildJudgeInput(pair: PairData): string {
  return `So sánh 2 tin đăng:

TIN A (${pair.a.source} — ${pair.a.kind}):
- Giá: ${pair.a.priceVnd ? (pair.a.priceVnd / 1e9).toFixed(2) + " tỷ" : "N/A"}
- Diện tích: ${pair.a.areaM2 ?? "N/A"} m²
- Giá/m²: ${pair.a.pricePerm2 ? (pair.a.pricePerm2 / 1e6).toFixed(1) + " tr" : "N/A"}
- Phường: ${pair.a.phuong ?? "N/A"}
- Loại: ${pair.a.propertyType ?? "unknown"}
- Nội dung: ${(pair.a.text ?? "").slice(0, 200)}

TIN B (${pair.b.source} — ${pair.b.kind}):
- Giá: ${pair.b.priceVnd ? (pair.b.priceVnd / 1e9).toFixed(2) + " tỷ" : "N/A"}
- Diện tích: ${pair.b.areaM2 ?? "N/A"} m²
- Giá/m²: ${pair.b.pricePerm2 ? (pair.b.pricePerm2 / 1e6).toFixed(1) + " tr" : "N/A"}
- Phường: ${pair.b.phuong ?? "N/A"}
- Loại: ${pair.b.propertyType ?? "unknown"}
- Tiêu đề: ${(pair.b.subject ?? "").slice(0, 200)}

Score Stage B: ${pair.score}`;
}

export function parseJudgeOutput(output: string): JudgeResult | null {
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!["yes", "no", "unsure"].includes(parsed.same_house)) return null;
    return {
      same_house: parsed.same_house,
      confidence: Number(parsed.confidence) || 0.5,
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    };
  } catch {
    return null;
  }
}
