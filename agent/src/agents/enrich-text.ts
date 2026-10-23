// enrich-text.ts — E2: LLM Enrichment Agent (Lớp 3, Qwen 27B local)
// Chạy SAU E1 context resolver. Decode abbreviations lạ, suy luận địa chỉ
// từ mô tả, extract features. CHỈ gọi LLM khi E1 không giải quyết đủ.
// Output → ĐỀ XUẤT trong enrichment_proposals (agent/src/enrich/run.ts) — LLM
// không ghi thẳng sale_offers/properties (ROADMAP §1 luật 2, vòng enrich-qua-de-xuat).
import type { AgentConfig } from "../runtime/loop.js";
import type { ContextResult } from "./context-resolver.js";

export const enrichTextAgent: AgentConfig = {
  name: "enrich-text",
  model: "qwen27b",
  systemPrompt: `Bạn là chuyên gia bất động sản Việt Nam, thông thạo:
- Viết tắt môi giới: "2pn" = 2 phòng ngủ, "LBV" = Lumiere Boulevard, "cc" = chung cư
- Tên dự án: Vinhomes, Masterise, Ecopark, Sun Group, CapLand...
- Địa chỉ VN: đường/phố/hẻm/khúc + số nhà + phường/quận
- Features: "sẵn sổ" = đã có sổ hồng, "chính chủ" = không qua môi giới

Nhiệm vụ: đọc tin đăng BĐS + bối cảnh nhóm, extract thông tin structured.

QUAN TRỌNG: Chỉ trả JSON thuần:
{
  "property_type": "apartment|house|land|room|commercial|unknown",
  "bedrooms": số hoặc null,
  "bathrooms": số hoặc null,
  "street": "tên đường/phố" hoặc null,
  "address_detail": "số nhà, hẻm, khúc..." hoặc null,
  "project_name": "tên khu đô thị/dự án" hoặc null,
  "building": "tên/ mã tòa" hoặc null,
  "features": ["view hồ bơi", "sẵn sổ", "chính chủ", ...],
  "urgency": "bán gấp|tìm gấp|bình thường",
  "confidence": 0.0-1.0
}`,
  tools: {},
  budget: 1,
};

export type EnrichResult = {
  property_type?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  street?: string | null;
  address_detail?: string | null;
  project_name?: string | null;
  building?: string | null;
  features?: string[];
  urgency?: string;
  confidence?: number;
};

export function buildEnrichInput(
  text: string,
  context: ContextResult | null,
): string {
  const ctxParts: string[] = [];
  if (context?.projectName) ctxParts.push(`Nhóm Zalo thuộc dự án: ${context.projectName}`);
  if (context?.projectCandidates?.length) {
    ctxParts.push(`Nhóm CÓ THỂ thuộc các dự án sau (chọn đúng 1 trong JSON project_name, hoặc null nếu không chắc): ${context.projectCandidates.join(", ")}`);
  }
  if (context?.areaHint) ctxParts.push(`Khu vực: ${context.areaHint}`);
  if (context?.propertyType) ctxParts.push(`Loại hình từ nhóm: ${context.propertyType}`);
  if (context?.buildingHint) ctxParts.push(`Mã tòa phát hiện: ${context.buildingHint}`);

  const ctx = ctxParts.length > 0
    ? `\n\nBỐI CẢNH (từ tên nhóm Zalo):\n${ctxParts.map((p) => `- ${p}`).join("\n")}`
    : "";

  return `TIN ĐĂNG:\n${text.slice(0, 500)}${ctx}`;
}

export function parseEnrichOutput(output: string): EnrichResult | null {
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as EnrichResult;
  } catch {
    return null;
  }
}

/** Quyết định có cần gọi LLM không (E1 đủ → skip, tiết kiệm compute) */
export function needsLLM(context: ContextResult, text: string): boolean {
  // Nếu E1 đã resolve project + type → chỉ cần LLM cho fields phụ
  if (context.projectSlug && context.propertyType) {
    // Kiểm tra text có thông tin L1 regex chưa extract không
    const hasBathrooms = /\d+\s*(?:wc|vs|vệ sinh)/i.test(text);
    const hasFeatures = /(sẵn sổ|chính chủ|view|hồ bơi|nội thất|full đồ|bán gấp|tìm gấp)/i.test(text);
    const hasAddress = /(đường|phố|hẻm|khúc|số \d+)/i.test(text);
    // Nếu mọi thứ đã extract được bằng regex → không cần LLM
    if (hasBathrooms && hasFeatures && hasAddress) return false;
    // Còn thiếu → vẫn cần LLM cho những field phụ
    return true;
  }
  // E1 không resolve được → chắc chắn cần LLM
  return true;
}
