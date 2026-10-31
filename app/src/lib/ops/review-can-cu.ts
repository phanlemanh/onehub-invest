/**
 * Căn cứ từng trường trên thẻ hàng duyệt /ops/review (PL3, hồ sơ the-duyet-du-can-cu). Module thường, hàm thuần —
 * trang server và thẻ client dùng chung (bẫy `"use client"`, copy-vi.md).
 *
 * Căn cứ của một trường = lớp căn cứ + phương pháp của phát biểu thắng, đọc từ `sale_offers.field_provenance` (PL15,
 * migration 045) cho năm trường trục; nhãn theo sổ từ vựng (CONTEXT.md «Lớp căn cứ», «Phương pháp phát biểu»).
 * Trường ngoài trục hay chưa có phát biểu ghi thẳng là chưa có căn cứ — không để ô trống (thẻ không được im về thứ
 * nó không biết). Không độ tự tin, không điểm (Q9).
 */
import { LABELS_VI, type AssertionMethod, type EvidenceTier } from "@/lib/vocab.generated";

/** Lớp căn cứ + phương pháp của phát biểu thắng một trường. */
export type CanCu = { lop: EvidenceTier; phuongPhap: AssertionMethod };

/** Căn cứ theo trường trục (`property_type`, `bedrooms`…) của một tin. */
export type CanCuTin = Partial<Record<string, CanCu>>;

/** Ô căn cứ của trường ngoài trục hay chưa có phát biểu (thẻ ghép căn). */
export const CHUA_CAN_CU_TIN = "Chưa ghi căn cứ — đọc từ tin";
/** Ô căn cứ của đề xuất bổ sung tin không có `basis`. */
export const CHUA_CAN_CU = "Chưa ghi căn cứ";

const LOP = new Set<string>(Object.keys(LABELS_VI.evidence_tier));
const PHUONG_PHAP = new Set<string>(Object.keys(LABELS_VI.assertion_method));

/** `field_provenance` (jsonb) → căn cứ theo trường; ô hỏng hay giá trị ngoài sổ bị bỏ (thành «chưa ghi căn cứ»). */
export function docCanCu(provenance: unknown): CanCuTin {
  const out: CanCuTin = {};
  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) return out;
  for (const [field, raw] of Object.entries(provenance as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const { tier, method } = raw as { tier?: unknown; method?: unknown };
    if (typeof tier === "string" && typeof method === "string" && LOP.has(tier) && PHUONG_PHAP.has(method)) {
      out[field] = { lop: tier as EvidenceTier, phuongPhap: method as AssertionMethod };
    }
  }
  return out;
}

/**
 * Câu căn cứ cho người duyệt. `legacy` (giá trị có trước 045) không có bằng chứng — nói thẳng thay vì mượn nhãn lớp
 * «Quan sát có trích dẫn» mà 045 gán cho nó.
 */
export function nhanCanCu(c: CanCu | undefined): string {
  if (!c) return CHUA_CAN_CU_TIN;
  const pp = LABELS_VI.assertion_method[c.phuongPhap];
  if (c.phuongPhap === "legacy") return `${pp} — chưa có căn cứ`;
  return `${LABELS_VI.evidence_tier[c.lop]} · ${pp}`;
}

export type So = "khop" | "lech" | "thieu";
export const SO_LABEL: Record<So, string> = { khop: "Khớp", lech: "Lệch", thieu: "Thiếu" };

/** Một bên của thẻ ghép căn như evidence ghi (029 + 030). */
export type BenGhepCan = {
  price_vnd?: number | null;
  area_m2?: number | null;
  price_perm2?: number | null;
  phuong?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  property_type?: string | null;
  street?: string | null;
  block?: string | null;
  floor?: string | null;
};

type TruongGhepCan = { key: keyof BenGhepCan; label: string; truc?: string };

/** Mười trường của bảng so, theo thứ tự hiện; `truc` = tên trường trục của PL15 khi trường có phát biểu. */
export const TRUONG_GHEP_CAN: readonly TruongGhepCan[] = [
  { key: "price_vnd", label: "Giá" },
  { key: "area_m2", label: "Diện tích" },
  { key: "price_perm2", label: "Giá/m²" },
  { key: "phuong", label: "Phường" },
  { key: "bedrooms", label: LABELS_VI.enrich_field.bedrooms, truc: "bedrooms" },
  { key: "bathrooms", label: LABELS_VI.enrich_field.bathrooms, truc: "bathrooms" },
  { key: "property_type", label: LABELS_VI.enrich_field.property_type, truc: "property_type" },
  { key: "street", label: LABELS_VI.enrich_field.street_raw, truc: "street_raw" },
  { key: "block", label: LABELS_VI.enrich_field.block_raw, truc: "block_raw" },
  { key: "floor", label: "Tầng" },
];

export type HangSo = {
  key: keyof BenGhepCan;
  label: string;
  a: string | number | null;
  b: string | number | null;
  so: So;
  /** Trường trục của PL15 (có phát biểu) — căn cứ riêng từng tin; trường khác chung một câu chưa ghi căn cứ. */
  truc: boolean;
  canCuA: string;
  canCuB: string;
  /** Giá trị lúc sinh thẻ (`evidence`) khi khác giá trị sống đang hiện; null khi giống hay không có giá trị sống (HD6). */
  lucChamA: string | number | null;
  lucChamB: string | number | null;
};

/** Trống, hoặc «chưa rõ» (`unknown` của loại hình): không phải một giá trị để so — so ra Thiếu, không ra Lệch (H9). */
// Một dòng: agent/tests/judge-nguong.test.ts rút nguyên văn hằng này (khuôn `^const <tên> = .*;$`).
const trong = (v: unknown): v is null | undefined => v === null || v === undefined || (typeof v === "string" && (v.trim() === "" || v.trim().toLowerCase() === "unknown"));
const khoa = (v: string | number) => (typeof v === "number" ? String(v) : /^-?\d+(\.\d+)?$/.test(v.trim()) ? String(Number(v)) : v.trim().toLowerCase());

/** So hai giá trị: thiếu một bên (hay cả hai) → Thiếu; cùng khoá → Khớp; khác → Lệch. Tất định, không ngưỡng. */
export function soGiaTri(a: string | number | null | undefined, b: string | number | null | undefined): So {
  if (trong(a) || trong(b)) return "thieu";
  return khoa(a) === khoa(b) ? "khop" : "lech";
}

/**
 * Khoá tên phường để so hai nguồn (S05 ghi slug `binh-thanh`, S06 ghi «Phường Bình Thạnh»): bỏ MỘT tiền tố hành chính
 * trên chuỗi còn dấu, rồi slug như `slugifyName()` của queries.ts (= đuôi mã phường). Bỏ tiền tố trước khi bỏ dấu vì
 * «Phường» và «Phương» cùng thành `phuong` — «Phương Liệt», «Phượng Dực» là tên phường thật.
 * Phường số (sau tiền tố chỉ còn chữ số) mang cấp và bỏ số 0 đầu: «Phường 01», «P.1», «P1», `phuong-1` → `p-1`; «Xã 1»,
 * `xa-1` → `x-1`; «Thị trấn 1» → `tt-1`; «1» trần → `1` — khác cấp là khác phường (hồ sơ phuong-so; bản chép ở
 * agent/src/agents/judge-entity.ts).
 */
export function khoaPhuong(v: string): string {
  const s = v.normalize("NFC").trim().toLowerCase();
  const so = s.match(/^(?:(phường|phuong|p)|(xã|xa)|(thị trấn|thi[\s-]*tran))?[\s.-]*0*(\d+)$/u);
  if (so) return `${so[1] ? "p-" : so[2] ? "x-" : so[3] ? "tt-" : ""}${so[4]}`;
  return s
    .replace(/^(?:(?:phường|xã|thị trấn)(?:\s+|$)|p\.\s*)/u, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * So hàng Phường theo khoá tên chuẩn. Khoá rỗng (chỉ có tiền tố) → Thiếu; còn lại cùng khoá → Khớp, khác → Lệch (bản chép
 * ở agent/src/agents/judge-entity.ts).
 */
function soPhuong(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaPhuong(String(a));
  const kb = khoaPhuong(String(b));
  if (ka === "" || kb === "") return "thieu";
  return ka === kb ? "khop" : "lech";
}

/** Bỏ dấu, hoa và ký tự lạ: «Đinh Bộ Lĩnh» → `dinh bo linh`. */
function boDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Các khoá có thể của tên đường. Tiền tố có dấu («Đường», «Phố», «Đ.», «D.») chắc là tiền tố: bỏ. Tiền tố không dấu
 * («duong», «pho») có thể là tên thật — «Duong Lam» là «Đường Lâm» hay «Dương Lâm» — nên giữ CẢ HAI cách đọc (HD2).
 * Trước đó bỏ phần chỉ vị trí (hồ sơ chuan-hoa-o-duong): cụm «Ngõ 254», «Hẻm 80/66», «Số 10 Ngõ 9» ở đầu chuỗi, rồi đuôi
 * địa chỉ sau dấu phẩy; số nhà trần («175 Lạc Long Quân») giữ hai cách đọc, trừ «3 Tháng 2» — số là một phần tên đường.
 * Ô chỉ có số hay chỉ có từ vị trí («Số 8», «Ngõ») không mang tên đường → không khoá nào. Dấu giữ tới lúc xuất khoá.
 */
export function khoaDuong(v: string): string[] {
  const t = v
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/ð/g, "đ")
    .replace(/^(?:(?:số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\.?\s*\d[\p{L}\d/-]*(?:\s*,\s*|\s+|$))+/u, "")
    .replace(/,.*$/u, "")
    .trim();
  if (/^(?:số|ngõ|ngách|hẻm|kiệt)?$/u.test(t)) return [];
  const soNha = t.match(/^\d[\p{L}\d/-]*\s+(.+)$/u);
  const cachDoc = soNha && !/^tháng\s+\d/u.test(soNha[1]) ? [soNha[1], t] : [t];
  const khoa = cachDoc.flatMap((s) => {
    const coDau = s.match(/^(?:(?:đường|phố)[\s-]+|[đd]\.\s*)(.*)$/u);
    if (coDau) return [boDau(coDau[1])];
    const khongDau = s.match(/^(?:duong|pho)[\s-]+(.*)$/u);
    return [khongDau ? boDau(khongDau[1]) : "", boDau(s)];
  });
  return [...new Set(khoa)].filter((k) => k && !/^\d+$/.test(k));
}

/** So hàng Đường: chung ít nhất một cách đọc → Khớp (bản chép ở agent/src/agents/judge-entity.ts). */
function soDuong(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaDuong(String(a));
  const kb = khoaDuong(String(b));
  if (ka.length === 0 || kb.length === 0) return "thieu";
  return ka.some((k) => kb.includes(k)) ? "khop" : "lech";
}

/**
 * Khoá toà: bỏ MỘT tiền tố «Toà/Block/Tháp/Lô», rồi bỏ dấu, hoa, khoảng trắng — «Block A» = «Toà A» = «a». Chỉ MÃ
 * toà mới so được (một từ, có chữ số hoặc không quá ba ký tự: «A», «CT2», «S5.01»); tên gọi («Sao Biển», «Park 6»,
 * «Chung Cư 38 Hoàng mai») không so được với mã của cùng toà nên coi như thiếu (HD2).
 */
export function khoaToa(v: string): string | null {
  const s = v.normalize("NFC").trim().toLowerCase().replace(/^(?:toà|tòa|toa|block|tháp|thap|tower|lô|lo|building)\s+/u, "");
  if (/\s/.test(s)) return null;
  const k = boDau(s).replace(/ /g, "");
  return k && k.length <= 8 && (/\d/.test(k) || k.length <= 3) ? k : null;
}

/** So hàng Toà theo mã toà; tên gọi không phải mã → Thiếu (bản chép ở agent/src/agents/judge-entity.ts). */
function soToa(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaToa(String(a));
  const kb = khoaToa(String(b));
  if (ka === null || kb === null) return "thieu";
  return ka === kb ? "khop" : "lech";
}

/** Khoá tầng: số đầu tiên — «Tầng 12» = «12»; chuỗi không có số («tầng cao») coi như thiếu. */
export function khoaTang(v: string): number | null {
  const m = v.match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** So hàng Tầng theo số tầng (bản chép ở agent/src/agents/judge-entity.ts). */
function soTang(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaTang(String(a));
  const kb = khoaTang(String(b));
  if (ka === null || kb === null) return "thieu";
  return ka === kb ? "khop" : "lech";
}

/** Hàng có khoá riêng; hàng còn lại so bằng `soGiaTri`. */
const SO_RIENG: Partial<Record<keyof BenGhepCan, (a: string | number | null, b: string | number | null) => So>> = {
  phuong: soPhuong,
  street: soDuong,
  block: soToa,
  floor: soTang,
};

/** Ô hiện: giá trị thật (kể cả «unknown» — hiện «Chưa rõ»), chỉ chuỗi rỗng/null về null. */
const hien = (v: unknown): string | number | null =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? null : (v as string | number);

/** Giá trị lúc chấm khi khác giá trị sống (so theo khoá: số theo trị, chuỗi bỏ hoa/khoảng trắng); không có thì null. */
function lucCham(song: string | number | null, cham: BenGhepCan | undefined, key: keyof BenGhepCan): string | number | null {
  if (!cham) return null;
  const c = hien(cham[key]);
  if (c === null && song === null) return null;
  if (c !== null && song !== null && khoa(c) === khoa(song)) return null;
  return c;
}

/**
 * Bảng so mười trường của thẻ ghép căn, mỗi giá trị kèm căn cứ của chính tin đó. `a`/`b` là giá trị đang hiện (sống từ
 * kho khi có — HD6); `lucCham` là `evidence` lúc sinh thẻ, chỉ để hiện «Lúc chấm» ở ô đã đổi, không vào nhãn So.
 */
export function soTruongGhepCan(
  a: BenGhepCan,
  b: BenGhepCan,
  canCuA: CanCuTin = {},
  canCuB: CanCuTin = {},
  lc: { a?: BenGhepCan; b?: BenGhepCan } = {},
): HangSo[] {
  return TRUONG_GHEP_CAN.map(({ key, label, truc }) => {
    const va = hien(a[key]);
    const vb = hien(b[key]);
    return {
      key,
      label,
      a: va,
      b: vb,
      so: (SO_RIENG[key] ?? soGiaTri)(va, vb),
      truc: Boolean(truc),
      canCuA: truc ? nhanCanCu(canCuA[truc]) : CHUA_CAN_CU_TIN,
      canCuB: truc ? nhanCanCu(canCuB[truc]) : CHUA_CAN_CU_TIN,
      lucChamA: lucCham(va, lc.a, key),
      lucChamB: lucCham(vb, lc.b, key),
    };
  });
}

/** Giá VND gọn: «2,35 tỷ» / «850tr»; null → «—». */
export function fmtGia(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  return `${Math.round(v / 1e6)}tr`;
}

/** Giá/m² gọn: «45tr/m²»; null → «—». */
export function fmtGiaM2(v: number | null): string {
  if (v === null) return "—";
  return `${Math.round(v / 1e6)}tr/m²`;
}

/** Trần độ dài lý do quyết định (PL3, CONTEXT «Lý do quyết định»). Route decide và ô «Lý do» dùng chung. */
export const LY_DO_TOI_DA = 1000;

/** Lý do sau khi cắt khoảng trắng hai đầu (gồm NBSP, U+3000); rỗng hay quá trần → null (chưa quyết được). */
export function lyDoHopLe(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 || t.length > LY_DO_TOI_DA ? null : t;
}
