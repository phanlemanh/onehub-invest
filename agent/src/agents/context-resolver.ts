// context-resolver.ts — E1: Lớp 2 enrichment (0đ, rule-based)
// Group name → project + property_type + building qua asset_nodes.
// Xử lý ~80% tin không cần LLM (nhóm có tên dự án rõ, keyword chuẩn).
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

export type ContextResult = {
  projectSlug: string | null;
  projectName: string | null;
  projectCandidates: string[]; // >1 node match → mờ, nhường cho LLM quyết
  propertyType: string | null;
  buildingHint: string | null;
  areaHint: string | null; // phường từ tên nhóm
  matchedBy: string; // "group_name" | "text_keyword" | "abbrev_dict" | ""
  /** Căn cứ của propertyType cho người duyệt: luật nào khớp, khớp ở tin hay tên nhóm. */
  typeBasis?: string | null;
  /** Căn cứ của buildingHint cho người duyệt. */
  buildingBasis?: string | null;
};

type AssetNode = {
  id: number;
  slug: string;
  name: string;
  node_type: string;
  aliases: string[];
  area_ids: string[];
};

let cachedNodes: AssetNode[] | null = null;

// Từ điển viết tắt mã tòa — CHỈ mã đã xác minh (nguyên tắc đồng nhất
// migration 032: không seed đoán). LBV = ví dụ gốc user 22/10.
// Mã lạ → E2 LLM decode → E5 feedback loop ghi vào asset_nodes aliases.
const ABBREV: Record<string, string> = {
  LBV: "Lumiere Boulevard",
};

async function loadNodes(): Promise<AssetNode[]> {
  if (cachedNodes) return cachedNodes;
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT id, slug, name, node_type, aliases, area_ids FROM asset_nodes`,
    );
    cachedNodes = rows.map((r: Record<string, unknown>) => ({
      id: Number(r.id),
      slug: String(r.slug),
      name: String(r.name),
      node_type: String(r.node_type),
      aliases: (r.aliases as string[]) ?? [],
      area_ids: (r.area_ids as string[]) ?? [],
    }));
    return cachedNodes;
  } finally {
    await c.end();
  }
}

// Luật loại BĐS (vòng enrich-hau-ky, Hỏi-4 chốt 2026-10-23). Tên nhóm Zalo/FB là tên nhóm mua
// bán chung («HỘI MUA BÁN NHÀ ĐẤT…») — chữ «đất» trong đó KHÔNG nói gì về tin. Land chỉ suy từ
// NỘI DUNG tin, bằng cụm chỉ đất rõ, và bị phủ quyết khi tin tả nhà nhiều tầng/phòng ngủ. Các
// loại khác giữ cách cũ: quét chuỗi ghép tin + tên nhóm (tên nhóm cũng là text môi giới:
// "…Chung Cư Vin 1,2,3" → apartment); riêng tin có cụm đất rõ thì thắng loại chỉ khớp ở tên nhóm.
const TYPE_RULES: [RegExp, string][] = [
  [/chung cư|căn hộ|cc |chcc|apartment|condo|studio/, "apartment"],
  [/nhà mặt tiền|mặt phố|biệt thự|liền kề|nhà phố|nhà riêng|nhà ngõ|nhà hẻm/, "house"],
  [/phòng trọ|phòng thuê|nhà trọ/, "room"],
  [/văn phòng|mặt bằng kinh doanh|shop house/, "commercial"],
];
/** Thứ tự ưu tiên cũ: land đứng sau house, trước room. */
const LAND_RANK = 2;
const LAND_IN_TEXT =
  /đất nền|nền đất|lô đất|bán đất|đất thổ cư|thửa đất|đất ở|đất vườn|đất trống|đất dự án/;
const MULTI_STOREY = /\d+\s*(tầng|lầu)|trệt|\d+\s*(pn|phòng ngủ)/;

/** E1 loại BĐS từ tin + tên nhóm; null = không luật nào khớp. */
export function resolvePropertyType(
  text: string,
  groupName: string | null,
): { type: string; basis: string } | null {
  const tl = text.toLowerCase();
  // «nhà đất», «bất động sản» là chữ chung của ngành — bỏ trước khi tìm cụm chỉ đất.
  const landHit = LAND_IN_TEXT.exec(tl.replace(/nhà đất|bất động sản/g, " "));
  const land = landHit && !MULTI_STOREY.test(tl)
    ? { type: "land", basis: `luật từ khoá: «${landHit[0]}» trong tin → land` }
    : null;

  const t = `${text} ${groupName ?? ""}`.toLowerCase();
  for (const [i, [re, type]] of TYPE_RULES.entries()) {
    if (i === LAND_RANK && land) return land;
    const m = re.exec(t);
    if (!m) continue;
    const inGroup = m.index >= text.length;
    if (inGroup && land) return land;
    const where = inGroup ? `tên nhóm «${groupName}»` : "tin";
    return { type, basis: `luật từ khoá: «${m[0].trim()}» trong ${where} → ${type}` };
  }
  return land;
}

/** E1: Phân giải bối cảnh từ tên nhóm + text → project/type/building */
export async function resolveContext(
  groupName: string | null,
  text: string,
): Promise<ContextResult> {
  const nodes = await loadNodes();
  const result: ContextResult = {
    projectSlug: null, projectName: null, projectCandidates: [],
    propertyType: null, buildingHint: null, areaHint: null, matchedBy: "",
  };

  // ── 1. Group name → project match (tín hiệu mạnh nhất) ──
  if (groupName) {
    const gn = groupName.normalize("NFC").toLowerCase();
    const hits: { slug: string; name: string }[] = [];
    for (const node of nodes) {
      const allNames = [node.name, ...node.aliases].map((n) => n.normalize("NFC").toLowerCase());
      for (const name of allNames) {
        if (name.length >= 4 && gn.includes(name)) {
          hits.push({ slug: node.slug, name: node.name });
          break;
        }
      }
    }
    // ADR-0011: tên trùng giữa các khu đô thị → match 1 node mới nhận,
    // match nhiều node là MƠ HỒ → đưa candidates cho LLM phán (không đoán)
    const uniq = hits.filter((h, i) => hits.findIndex((x) => x.slug === h.slug) === i);
    if (uniq.length === 1) {
      result.projectSlug = uniq[0].slug;
      result.projectName = uniq[0].name;
      result.matchedBy = "group_name";
    } else if (uniq.length > 1) {
      result.projectCandidates = uniq.map((h) => h.name);
    }

    // Group name → area hint (phường/quận trong tên nhóm)
    const areaMatch = groupName.match(
      /(Bình Thạnh|Tây Hồ|Bắc Từ Liêm|Nam Từ Liêm|Cầu Giấy|Đống Đa|Hoàn Kiếm|Hà Đông|Long Biên|Gia Lâm|Thanh Xuân|Phú Nhuận|Quận \d+|Thủ Đức|Bình Tân|Tân Phú|Gò Vấp|Tân Bình|Ecopark|Văn Khê)/i,
    );
    if (areaMatch) result.areaHint = areaMatch[1];
  }

  // ── 2. Text + group name keywords → property_type ──
  if (!result.propertyType) {
    const pt = resolvePropertyType(text, groupName);
    if (pt) {
      result.propertyType = pt.type;
      result.typeBasis = pt.basis;
    }

    // Nếu group match project → default type từ tên dự án
    if (!result.propertyType && result.projectSlug) {
      const project = nodes.find((n) => n.slug === result.projectSlug);
      if (project?.slug.includes("vinhomes") || project?.slug.includes("masteri") ||
          project?.slug.includes("ecopark")) {
        result.propertyType = "apartment"; // khu đô thị lớn → apartment mặc định
        result.typeBasis = `luật dự án: nhóm thuộc ${project?.name} → mặc định apartment`;
      }
    }
  }

  // ── 3. Building pattern từ text ──
  // Mã tòa môi giới luôn IN HOA: LD2xx13 (masked unit), S1.03, LBV, LD2.
  // KHÔNG dùng cờ /i cho capture group — không thì "nhà đất" lọt vào thành mã tòa.
  const buildingPatterns: RegExp[] = [
    /\b([A-Z]{1,4}\d{0,2})x{2}\d{1,4}\b/,                 // "LD2xx13" → LD2 (unit che số)
    /\b([A-Z]{2,4})\s*[tT]òa\b/,                           // "LBV tòa", "RAS Tower"
    /\b[tT]òa\s+([A-Z]{1,4}\d{0,2}(?:\.\d{1,2})?|\d+[A-Z]?)\b/, // "tòa S1.03", "tòa LD2"
    /\b([A-Z]\d\.\d{2})\b/,                                 // "S1.03", "B2.07"
    /\b([A-Z]{2,4})\s+\d+\s*(?:PN|N)\b/,                    // "LBV 2PN", "LBV 2N"
    /\b([A-Z]{2}\d{1,2})\b/,                                // "LD2", "S1" standalone
  ];
  for (const pat of buildingPatterns) {
    const m = text.match(pat);
    const code = m?.[1]?.toUpperCase();
    if (!code) continue;
    // Gate chống nhiễu: mã tòa thật là (a) có chữ số, hoặc (b) trong từ điển
    // viết tắt. Mã thuần chữ CHCC/NG/HOME không nằm đâu → bỏ.
    if (!/\d/.test(code) && !ABBREV[code]) continue;
    // T1-T12 = tháng nhận nhà; OP/GP/PMH/OCP = viết tắt dự án, không phải tòa
    if (/^T\d{1,2}$/.test(code) || ["OP", "GP", "PMH", "OCP"].includes(code)) continue;
    result.buildingHint = code;
    result.buildingBasis = `luật mã toà: «${(m?.[0] ?? code).trim()}» trong tin`;
    break;
  }

  // ── 4. Đánh dấu khi mã tòa có trong từ điển (không cần LLM cho building) ──
  if (result.buildingHint && ABBREV[result.buildingHint.toUpperCase()]) {
    result.matchedBy = result.matchedBy || "abbrev_dict";
  }

  return result;
}

/** Reset cache (test) */
export function resetContextCache() {
  cachedNodes = null;
}
