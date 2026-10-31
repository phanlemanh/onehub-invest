/**
 * Tên thị trường có dấu trên cổng Ops (ON12 `ops-nhan-theo-context`, design doc §2.4). Thuần, không truy vấn — bảng tên
 * khu vực nạp bằng `getAreaNames()` (ops-queries.ts).
 */

/** Tên Việt của 43 thị trường S02 theo mã của S02 (đọc DB local 24/10). Giữ đúng thị trường S02 chia, kể cả tỉnh đã
 *  sáp nhập (Hỏi-3); tên S02 cắt cụt («Quang Tr», «Binh Thu», «Phan RangaThap Cham») viết lại đúng. */
export const S02_MARKET_VI: Record<string, string> = {
  "47": "Hà Nội",
  "48": "Hồ Chí Minh",
  "89491": "Đà Nẵng",
  "95536": "Cần Thơ",
  "95537": "Cao Bằng",
  "95538": "Đắk Nông",
  "95541": "Hòa Bình",
  "95542": "Kiên Giang",
  "95543": "Nghệ An",
  "95544": "Sóc Trăng",
  "95545": "Sơn La",
  "95546": "Thanh Hóa",
  "95548": "An Giang",
  "95549": "Bắc Giang",
  "95551": "Bến Tre",
  "95552": "Bình Định",
  "95553": "Bình Dương",
  "95554": "Bình Phước",
  "95555": "Bình Thuận",
  "95556": "Đắk Lắk",
  "95557": "Điện Biên",
  "95558": "Đồng Tháp",
  "95559": "Gia Lai",
  "95560": "Hà Giang",
  "95563": "Khánh Hòa",
  "95564": "Kon Tum",
  "95565": "Lai Châu",
  "95566": "Lâm Đồng",
  "95567": "Lạng Sơn",
  "95568": "Lào Cai",
  "95570": "Phú Yên",
  "95571": "Quảng Bình",
  "95572": "Quảng Nam",
  "95573": "Quảng Ninh",
  "95574": "Quảng Trị",
  "95576": "Thái Nguyên",
  "95578": "Thừa Thiên Huế",
  "95579": "Trà Vinh",
  "95580": "Vĩnh Long",
  "102183": "Vũng Tàu",
  "104206": "Côn Đảo",
  "82014767": "Phan Rang – Tháp Chàm",
  "82015315": "Hà Tĩnh",
}

export type TenThiTruong = { name: string; known: boolean }

/** Tên Việt của một thị trường S02; mã chưa có trong từ điển → tên gốc kèm «(chưa có tên Việt)». */
export function s02MarketName(airdnaId: string, vendorName: string): TenThiTruong {
  const vi = S02_MARKET_VI[airdnaId]
  return vi ? { name: vi, known: true } : { name: `${vendorName} (chưa có tên Việt)`, known: false }
}

/** Bỏ tiền tố hành chính của `areas.name` («Thành phố Hà Nội» → «Hà Nội», «Tỉnh An Giang» → «An Giang»). */
export function shortAreaName(name: string): string {
  return name.replace(/^(Thành phố|Tỉnh)\s+/, "")
}

/** Mã thị trường/khu vực (`hanoi`, `vn-tinh-an-giang`, `vn`) → tên khu vực; mã lạ → «(chưa có tên Việt)».
 * TẠM (hàng khu-vuc-vung-moi-s06): areas còn 32 thị trường mã dài `vn-thanh-pho-*`/`vn-tinh-*` của lần nạp tỉnh cũ, trong
 * khi nhóm thu (S06 `da-nang` → `vn-da-nang`) theo quy ước `vn-<khoá>` — mã ngắn không thấy thì tra thêm hai dạng dài.
 * Bỏ khi hàng ma-thi-truong-ngan (migration 064) đổi mã areas về dạng ngắn. */
export function marketNameOf(code: string, areaNames: ReadonlyMap<string, string>): TenThiTruong {
  if (code === "vn") return { name: "Toàn quốc", known: true }
  const ngan = code.startsWith("vn-") ? code.slice(3) : code
  const ten =
    areaNames.get(code) ??
    areaNames.get(`vn-${ngan}`) ??
    areaNames.get(`vn-thanh-pho-${ngan}`) ??
    areaNames.get(`vn-tinh-${ngan}`)
  return ten ? { name: ten, known: true } : { name: `${code} (chưa có tên Việt)`, known: false }
}
