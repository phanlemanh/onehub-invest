// context-resolver-chung.ts — luật E1 CŨ chép đóng băng (legacyType) và lối quét-tin-trước (textFirstType), dùng chung cho
// tests/context-resolver.test.ts (suite) và probes/context-resolver-that.test.ts (dữ liệu thật — hồ sơ l2-bao-thu-doi-probe-that).
import { resolvePropertyType } from "../src/agents/context-resolver.js";
/** Luật E1 loại BĐS TRƯỚC vòng enrich-hau-ky (context-resolver.ts @148c073) — chép đóng băng. */
export function legacyType(text: string, groupName: string | null): string | null {
  const t = `${text} ${groupName ?? ""}`.toLowerCase();
  const RULES: [RegExp, string][] = [
    [/chung cư|căn hộ|cc |chcc|apartment|condo|studio/, "apartment"],
    [/nhà mặt tiền|mặt phố|biệt thự|liền kề|nhà phố|nhà riêng|nhà ngõ|nhà hẻm/, "house"],
    [/đất|nền|lô đất|diện tích đất/, "land"],
    [/phòng trọ|phòng thuê|nhà trọ/, "room"],
    [/văn phòng|mặt bằng kinh doanh|shop house/, "commercial"],
  ];
  for (const [re, type] of RULES) if (re.test(t)) return type;
  return null;
}

/** Lối khác của Hỏi-4 (bị bác): quét mọi luật trên tin trước rồi mới tới tên nhóm. */
export function textFirstType(text: string, groupName: string | null): string | null {
  return resolvePropertyType(text, null)?.type ?? (groupName ? resolvePropertyType("", groupName)?.type ?? null : null);
}

