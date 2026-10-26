// route.ts — luật định tuyến enrichment THUẦN (không DB, không model).
// Spec: docs/superpowers/specs/2026-10-22-enrich-qua-de-xuat-design.md §3.1–3.2.
//
// Mỗi field còn trống của offer:
//   E1 luật hợp lệ                         → direct
//   LLM, E1 cùng giá trị (sau chuẩn hoá)   → corroborated by 'e1' (thay cho E1 direct)
//   LLM, E1 khác giá trị                   → CẢ HAI review + conflict (người chọn, AC-7)
//   field đang giữ (thẻ xung đột còn chờ)  → mọi đề xuất của field: review + conflict
//   LLM block_raw khớp tên/alias building  → corroborated by 'asset_nodes:<slug>', value = tên chuẩn
//   LLM không căn cứ                       → review
// Confidence LLM KHÔNG BAO GIỜ là căn cứ. Field đã có giá trị → không đề xuất (fill-gap).
import type { EnrichResult } from "../agents/enrich-text.js";
import { PROPERTY_TYPE, VOCAB, type EnrichField } from "../vocab.generated.js";

export type { EnrichField };

/** Trường nhận đề xuất enrich — trục enrich_field của sổ từ vựng (CHECK migration 033). */
export const ENRICH_FIELDS: readonly EnrichField[] = VOCAB.enrich_field;

/** Tập CHECK của migration 025 ('unknown' coi như trống). */
const PROPERTY_TYPES: ReadonlySet<string> = new Set(VOCAB.property_type.filter((c) => c !== PROPERTY_TYPE.unknown));

export type Current = Partial<Record<EnrichField, string | number | null>>;

export type BuildingNode = { slug: string; name: string; aliases: string[] };

export type Routed = {
  field: EnrichField;
  value: string;
  source: "e1_rule" | "e2_llm";
  route: "direct" | "corroborated" | "review" | "superseded";
  corroboratedBy: string | null;
  /** Field có hai giá trị E1/LLM trái nhau (hoặc đang giữ vì thẻ xung đột còn chờ). */
  conflict?: true;
};

/** NFC + trim + gộp khoảng trắng. */
function cleanText(s: string): string {
  return s.normalize("NFC").replace(/\s+/g, " ").trim();
}

function normalizeCount(raw: unknown): string | null {
  let n: number;
  if (typeof raw === "number") {
    n = raw;
  } else if (typeof raw === "string" && /^\s*\d+\s*$/.test(raw)) {
    n = Number(raw.trim());
  } else {
    return null;
  }
  if (!Number.isInteger(n) || n < 0 || n > 20) return null;
  return String(n);
}

function normalizeTextField(raw: unknown, maxLen: number): string | null {
  if (typeof raw !== "string") return null;
  const s = cleanText(raw);
  if (s.length < 2 || s.length > maxLen) return null;
  return s;
}

/**
 * Chuẩn hoá giá trị một field (dùng cho cả E1 lẫn LLM) — null = không hợp lệ, bỏ.
 * property_type: chữ thường, thuộc tập CHECK; bedrooms/bathrooms: số nguyên 0–20
 * dạng chuỗi thập phân; street_raw/block_raw: NFC, trim, gộp khoảng trắng, giữ hoa
 * thường gốc, dài 2–200 (block ≤30).
 */
export function normalizeValue(field: EnrichField, raw: unknown): string | null {
  switch (field) {
    case "property_type": {
      if (typeof raw !== "string") return null;
      const v = raw.trim().toLowerCase();
      return PROPERTY_TYPES.has(v) ? v : null;
    }
    case "bedrooms":
    case "bathrooms":
      return normalizeCount(raw);
    case "street_raw":
      return normalizeTextField(raw, 200);
    case "block_raw":
      return normalizeTextField(raw, 30);
  }
}

/** Khoá so sánh «cùng giá trị» — trùng `value_key = lower(value)` của migration 033. */
function valueKey(v: string): string {
  return v.toLowerCase();
}

/** Ô trống: null/undefined/chuỗi rỗng, hoặc property_type='unknown'. */
function isEmpty(field: EnrichField, v: string | number | null | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return true;
    if (field === "property_type" && s.toLowerCase() === "unknown") return true;
  }
  return false;
}

function matchBuilding(value: string, buildings: BuildingNode[]): BuildingNode | null {
  const key = valueKey(cleanText(value));
  for (const b of buildings) {
    const names = [b.name, ...b.aliases].map((n) => valueKey(cleanText(n)));
    if (names.includes(key)) return b;
  }
  return null;
}

export function routeFields(input: {
  current: Current;
  e1: Partial<Record<EnrichField, unknown>>;
  llm: Partial<Record<EnrichField, unknown>> | null;
  buildings: BuildingNode[];
  /** Field đang có đề xuất queued trên thẻ xung đột — lượt này không áp gì cho chúng. */
  held?: ReadonlySet<EnrichField>;
}): Routed[] {
  const out: Routed[] = [];
  for (const field of ENRICH_FIELDS) {
    if (!isEmpty(field, input.current[field])) continue; // fill-gap: giá trị cũ thắng

    const e1Raw = normalizeValue(field, input.e1[field]);
    const llmRaw = input.llm ? normalizeValue(field, input.llm[field]) : null;
    // block_raw: CẢ HAI phía khớp node building → so/áp bằng TÊN CHUẨN của node. E1 thật trả
    // mã thô ("LBV", context-resolver buildingHint), LLM có thể trả mã hoặc tên — chuẩn hoá một
    // phía thì cùng một toà thành xung đột giả và mã thô bị áp (S4-r1, AC-3).
    const e1Node = field === "block_raw" && e1Raw !== null ? matchBuilding(e1Raw, input.buildings) : null;
    const node = field === "block_raw" && llmRaw !== null ? matchBuilding(llmRaw, input.buildings) : null;
    const e1v = e1Node ? e1Node.name : e1Raw;
    const llmv = node ? node.name : llmRaw;

    // Field đang xung đột chờ người: mọi giá trị mới vào thẻ, không áp — kể cả khi LLM lượt
    // này vắng/lỗi hay đồng ý E1 (gap-probe F1 vòng nâng phạm vi).
    if (input.held?.has(field)) {
      if (e1v !== null) out.push({ field, value: e1v, source: "e1_rule", route: "review", corroboratedBy: null, conflict: true });
      if (llmv !== null) out.push({ field, value: llmv, source: "e2_llm", route: "review", corroboratedBy: null, conflict: true });
      continue;
    }

    if (e1v !== null) {
      // E1 cùng giá trị → MỘT đề xuất LLM corroborated (by e1) được áp; dấu E1 nằm ở
      // corroborated_by. Sinh thêm E1 direct thì fill-gap sẽ biến đề xuất LLM thành
      // skipped — trái AC-3.
      if (llmv !== null && valueKey(e1v) === valueKey(llmv)) {
        out.push({ field, value: llmv, source: "e2_llm", route: "corroborated", corroboratedBy: "e1" });
        continue;
      }
      // E1 trái LLM → KHÔNG áp bên nào, cả hai lên thẻ cho người chọn (AC-7). «E1 thắng» cũ
      // để luật sai (chữ «đất» trong tên nhóm) ghi thẳng mà không ai thấy — sổ revisit d-9.
      if (llmv !== null) {
        out.push({ field, value: e1v, source: "e1_rule", route: "review", corroboratedBy: null, conflict: true });
        out.push({ field, value: llmv, source: "e2_llm", route: "review", corroboratedBy: null, conflict: true });
        continue;
      }
      out.push({ field, value: e1v, source: "e1_rule", route: "direct", corroboratedBy: null });
      continue;
    }
    if (llmv === null) continue;

    if (node) {
      out.push({
        field,
        value: node.name,
        source: "e2_llm",
        route: "corroborated",
        corroboratedBy: `asset_nodes:${node.slug}`,
      });
      continue;
    }

    out.push({ field, value: llmv, source: "e2_llm", route: "review", corroboratedBy: null });
  }
  return out;
}

/** Tổng kết lượt chạy — xungDot = số field có giá trị E1/LLM trái nhau (đếm một lần mỗi field). */
export function summarizeRun(routed: Routed[][]): {
  direct: number;
  corroborated: number;
  review: number;
  xungDot: number;
} {
  const s = { direct: 0, corroborated: 0, review: 0, xungDot: 0 };
  for (const offer of routed) {
    const conflictFields = new Set<EnrichField>();
    for (const r of offer) {
      if (r.conflict) conflictFields.add(r.field);
      if (r.route !== "superseded") s[r.route]++;
    }
    s.xungDot += conflictFields.size;
  }
  return s;
}

/** Map đầu ra E2 LLM sang tên cột: street→street_raw, building→block_raw. */
export function llmFieldsFromEnrich(e: EnrichResult): Partial<Record<EnrichField, unknown>> {
  const out: Partial<Record<EnrichField, unknown>> = {};
  if (e.property_type !== undefined) out.property_type = e.property_type;
  if (e.bedrooms !== undefined) out.bedrooms = e.bedrooms;
  if (e.bathrooms !== undefined) out.bathrooms = e.bathrooms;
  if (e.street !== undefined) out.street_raw = e.street;
  if (e.building !== undefined) out.block_raw = e.building;
  return out;
}
