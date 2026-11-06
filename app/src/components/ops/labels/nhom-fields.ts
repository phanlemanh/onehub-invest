import { CO_KHONG, FIELD_LABEL, selectOptions, type Basis, type LabelField, type TrucChon } from "@/lib/labels-normalize"

/** Sáu khối của biểu mẫu theo nhóm (bản D + khối Mô tả căn của truong-nhan-s03-081), theo hai cột từ `xl`. Nhãn trường lấy từ FIELD_LABEL, lựa chọn từ sổ từ vựng. */
export type FieldDef = {
  id: LabelField
  kind: "chon" | "chon-nhieu" | "chu" | "so" | "gia"
  options?: { value: string; label: string }[]
  placeholder?: string
  /** Bài nhiều căn không có căn cứ, không có ô «Không suy ra được». */
  noBasis?: boolean
}
export type Khoi = { id: string; title: string; hint?: string; fields: FieldDef[] }

/** Lựa chọn của sổ từ vựng, bỏ «Chưa rõ»: ô «Không suy ra được» đã nói điều đó, để hàng không xuống dòng. */
const luaChon = (axis: TrucChon) => selectOptions(axis).filter((o) => o.value !== "unknown")
const CO_KHONG_OPTIONS = CO_KHONG.map((v) => ({ value: v, label: v === "yes" ? "Có" : "Không" }))

export const KHOI: Khoi[] = [
  {
    id: "tin",
    title: "Tin",
    fields: [
      { id: "listing_intent", kind: "chon", options: luaChon("listing_intent") },
      { id: "kind", kind: "chon", options: luaChon("kind") },
      { id: "property_type", kind: "chon", options: luaChon("property_type") },
      { id: "multi_unit", kind: "chon", options: CO_KHONG_OPTIONS, noBasis: true },
    ],
  },
  {
    id: "vi-tri",
    title: "Vị trí",
    hint: "Ghi tên đầy đủ; bí danh ghi vào Lý do.",
    fields: [
      { id: "project", kind: "chu", placeholder: "Tên đầy đủ" },
      { id: "subzone", kind: "chu", placeholder: "Tên đầy đủ" },
      { id: "unit_number", kind: "chu", placeholder: "vd PR6.xx10" },
      { id: "building", kind: "chu", placeholder: "vd S5.03" },
      { id: "stack", kind: "chu", placeholder: "vd 12" },
      { id: "floor", kind: "chu", placeholder: "vd 18" },
    ],
  },
  {
    id: "can",
    title: "Căn",
    fields: [
      { id: "bedrooms", kind: "so", placeholder: "vd 2" },
      { id: "bedrooms_plus", kind: "chon", options: CO_KHONG_OPTIONS },
      { id: "bathrooms", kind: "so", placeholder: "vd 1" },
      { id: "area_m2", kind: "so", placeholder: "vd 59" },
    ],
  },
  {
    id: "mo-ta",
    title: "Mô tả căn",
    fields: [
      { id: "furnished", kind: "chon", options: luaChon("furnished") },
      { id: "direction_faces", kind: "chon", options: luaChon("direction_faces") },
      { id: "view", kind: "chon-nhieu", options: luaChon("view") },
      { id: "availability_date", kind: "chu", placeholder: "ngay, 2026-12 hoặc 2026-12-15" },
    ],
  },
  {
    id: "gia",
    title: "Giá",
    fields: [
      { id: "price_min_vnd", kind: "gia", placeholder: "vd 4,35" },
      { id: "price_max_vnd", kind: "gia", placeholder: "vd 4,35" },
      { id: "price_basis", kind: "chon", options: luaChon("price_basis") },
      { id: "rent_includes", kind: "chon-nhieu", options: luaChon("rent_includes") },
    ],
  },
  {
    id: "ban",
    title: "Người bán",
    fields: [
      { id: "seller_name", kind: "chu", placeholder: "Như người đăng" },
      { id: "seller_phone", kind: "chu", placeholder: "vd 0912 345 678" },
    ],
  },
]
export const COT_KHOI = [["tin", "can", "mo-ta"], ["vi-tri", "gia", "ban"]]
export const TAT_CA_O = KHOI.flatMap((k) => k.fields)

export const BASIS_NGAN: { value: Basis; short: string }[] = [
  { value: "chu_bai", short: "Chữ" },
  { value: "anh", short: "Ảnh" },
  { value: "ngu_canh_nhom", short: "Nhóm" },
  { value: "kien_thuc_nghe", short: "Nghề" },
  { value: "danh_muc_cdt", short: "CĐT" },
]

export type O = { value: string; basis: Basis; unknown: boolean }
export const O_TRONG: O = { value: "", basis: "chu_bai", unknown: false }

/** Nhãn hiển thị của một giá trị đã lưu hay máy đọc, cho bảng so. Giá theo tỷ, triệu; lựa chọn theo sổ từ vựng. */
export function hienGiaTri(f: LabelField, v: string | null | undefined): string {
  if (v == null || v === "") return "—"
  const def = TAT_CA_O.find((d) => d.id === f)
  // Chọn nhiều: mã nối dấu phẩy → nhãn sổ nối «, ».
  if (def?.kind === "chon-nhieu") return v.split(",").map((m) => def.options?.find((o) => o.value === m)?.label ?? m).join(", ")
  const op = def?.options?.find((o) => o.value === v)
  if (op) return op.label
  if (f === "price_min_vnd" || f === "price_max_vnd") {
    const n = Number(v)
    const fmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 })
    return n >= 1e9 ? `${fmt.format(n / 1e9)} tỷ` : `${fmt.format(n / 1e6)} triệu`
  }
  return v
}
export const nhanTruong = (f: LabelField) => FIELD_LABEL[f]
