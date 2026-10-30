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
};

const trong = (v: unknown): v is null | undefined => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
const khoa = (v: string | number) => (typeof v === "number" ? String(v) : v.trim().toLowerCase());

/** So hai giá trị: thiếu một bên (hay cả hai) → Thiếu; cùng khoá → Khớp; khác → Lệch. Tất định, không ngưỡng. */
export function soGiaTri(a: string | number | null | undefined, b: string | number | null | undefined): So {
  if (trong(a) || trong(b)) return "thieu";
  return khoa(a) === khoa(b) ? "khop" : "lech";
}

/**
 * Khoá tên phường để so hai nguồn (S05 ghi slug `binh-thanh`, S06 ghi «Phường Bình Thạnh»): bỏ MỘT tiền tố hành chính
 * trên chuỗi còn dấu, rồi slug như `slugifyName()` của queries.ts (= đuôi mã phường). Bỏ tiền tố trước khi bỏ dấu vì
 * «Phường» và «Phương» cùng thành `phuong` — «Phương Liệt», «Phượng Dực» là tên phường thật.
 */
export function khoaPhuong(v: string): string {
  return v
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/^(?:(?:phường|xã|thị trấn)(?:\s+|$)|p\.\s*)/u, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * So hàng Phường theo khoá tên chuẩn. Khoá rỗng (chỉ có tiền tố) → Thiếu. Khoá chỉ số («Phường 12» của hai quận khác
 * nhau cùng khoá) → so chuỗi gốc như cũ, để khoá số không làm hai chuỗi khác nhau thành Khớp.
 */
function soPhuong(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaPhuong(String(a));
  const kb = khoaPhuong(String(b));
  if (ka === "" || kb === "") return "thieu";
  if (/^\d+$/.test(ka) || /^\d+$/.test(kb)) return soGiaTri(a, b);
  return ka === kb ? "khop" : "lech";
}

/** Bảng so mười trường của thẻ ghép căn, mỗi giá trị kèm căn cứ của chính tin đó. */
export function soTruongGhepCan(a: BenGhepCan, b: BenGhepCan, canCuA: CanCuTin = {}, canCuB: CanCuTin = {}): HangSo[] {
  return TRUONG_GHEP_CAN.map(({ key, label, truc }) => {
    const va = trong(a[key]) ? null : (a[key] as string | number);
    const vb = trong(b[key]) ? null : (b[key] as string | number);
    return {
      key,
      label,
      a: va,
      b: vb,
      so: key === "phuong" ? soPhuong(va, vb) : soGiaTri(va, vb),
      truc: Boolean(truc),
      canCuA: truc ? nhanCanCu(canCuA[truc]) : CHUA_CAN_CU_TIN,
      canCuB: truc ? nhanCanCu(canCuB[truc]) : CHUA_CAN_CU_TIN,
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
