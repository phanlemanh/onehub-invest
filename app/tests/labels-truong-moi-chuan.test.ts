/**
 * truong-nhan-s03-081 E3 (AC-3): chuanHoaLuot với bảy trường mới. Bảng viết trước, so deepEqual từng dòng; ba bản đột biến
 * chép tệp nguồn sang thư mục tạm và đổi đúng một chỗ (chiều đỏ). Chữ bài là chữ giả, không lấy từ bài thật.
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

import { chuanHoaLuot, LABEL_FIELDS_NHOM, MSG_KHONG_TRONG_CHU, MSG_NGAY_VAO, type RawCell, type RawLabels } from "../src/lib/labels-normalize"

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
type Chuan = typeof chuanHoaLuot

let soBanDot = 0
/** Bản chép labels-normalize.ts đổi đúng một chỗ; import trỏ về tệp thật. */
async function banDot(tu: string, thanh: string): Promise<Chuan> {
  const tep = "src/lib/labels-normalize.ts"
  const goc = readFileSync(join(APP, tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const giai = (ten: string) => {
    if (!ten.startsWith(".") && !ten.startsWith("@/")) return ten
    const g = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
    const f = [".ts", ".tsx", ""].map((d) => g + d).find((x) => existsSync(x) && !statSync(x).isDirectory())
    return pathToFileURL(f ?? g).href
  }
  const f = join(APP, "tests", `.tn081-dot-${process.pid}-${++soBanDot}.ts`)
  writeFileSync(f, goc.replace(tu, thanh).replace(/from "([^"]+)"/g, (_m, ten: string) => `from "${giai(ten)}"`))
  try {
    return ((await import(pathToFileURL(f).href)) as { chuanHoaLuot: Chuan }).chuanHoaLuot
  } finally {
    rmSync(f, { force: true })
  }
}

const CHU = "Bán căn PR6.xx10 tầng trung, view hồ, full nội thất, vào ở ngay"

/** Lượt đủ 24 ô hợp lệ; bảy ô mới để `moi` ghi đè. */
function luot(moi: Partial<Record<string, RawCell>>): RawLabels {
  const o: Record<string, RawCell> = {}
  for (const f of LABEL_FIELDS_NHOM) o[f] = { not_stated: true }
  o.listing_intent = { value: "offer", basis: "chu_bai" }
  o.kind = { value: "sale", basis: "chu_bai" }
  o.multi_unit = { value: "no" }
  return { ...o, ...moi } as RawLabels
}

type Dong = { ten: string; o: Partial<Record<string, RawCell>>; truong: string; mong: { value: string | null } | { loi: string } }

// Bảng viết trước: 30 dòng.
const BANG: Dong[] = [
  { ten: "nội thất hợp lệ", o: { furnished: { value: "furnished", basis: "chu_bai" } }, truong: "furnished", mong: { value: "furnished" } },
  { ten: "nội thất ngoài sổ", o: { furnished: { value: "full", basis: "chu_bai" } }, truong: "furnished", mong: { loi: "Giá trị không có trong sổ từ vựng" } },
  { ten: "nội thất thiếu", o: { furnished: { value: "" } }, truong: "furnished", mong: { loi: "Chưa điền — nhập giá trị hoặc chọn «Không suy ra được»" } },
  { ten: "nội thất không suy ra được", o: { furnished: { not_stated: true } }, truong: "furnished", mong: { value: null } },
  { ten: "hướng hợp lệ", o: { direction_faces: { value: "southeast", basis: "chu_bai" } }, truong: "direction_faces", mong: { value: "southeast" } },
  { ten: "hướng ngoài sổ", o: { direction_faces: { value: "dong-nam", basis: "chu_bai" } }, truong: "direction_faces", mong: { loi: "Giá trị không có trong sổ từ vựng" } },
  { ten: "hướng thiếu", o: { direction_faces: {} }, truong: "direction_faces", mong: { loi: "Chưa điền — nhập giá trị hoặc chọn «Không suy ra được»" } },
  { ten: "view nhiều giá trị, trùng", o: { view: { value: ["lake", "city", "lake"], basis: "chu_bai" } }, truong: "view", mong: { value: "city,lake" } },
  { ten: "view chuỗi dấu phẩy", o: { view: { value: "pool, city", basis: "chu_bai" } }, truong: "view", mong: { value: "city,pool" } },
  { ten: "view ngoài sổ", o: { view: { value: ["lake", "seaview"], basis: "chu_bai" } }, truong: "view", mong: { loi: "Giá trị không có trong sổ từ vựng" } },
  { ten: "view mảng rỗng", o: { view: { value: [] } }, truong: "view", mong: { loi: "Chưa điền — nhập giá trị hoặc chọn «Không suy ra được»" } },
  { ten: "view không suy ra được", o: { view: { not_stated: true } }, truong: "view", mong: { value: null } },
  { ten: "phí đã gồm nhiều giá trị", o: { rent_includes: { value: ["water", "management"], basis: "chu_bai" } }, truong: "rent_includes", mong: { value: "management,water" } },
  { ten: "phí đã gồm ngoài sổ", o: { rent_includes: { value: ["wifi"], basis: "chu_bai" } }, truong: "rent_includes", mong: { loi: "Giá trị không có trong sổ từ vựng" } },
  { ten: "cơ sở giá hợp lệ", o: { price_basis: { value: "net", basis: "chu_bai" } }, truong: "price_basis", mong: { value: "net" } },
  { ten: "cơ sở giá ngoài sổ", o: { price_basis: { value: "thu-ve", basis: "chu_bai" } }, truong: "price_basis", mong: { loi: "Giá trị không có trong sổ từ vựng" } },
  { ten: "cơ sở giá gửi mảng", o: { price_basis: { value: ["net"], basis: "chu_bai" } }, truong: "price_basis", mong: { loi: "Ô này chỉ nhận một giá trị" } },
  { ten: "ngày vào ngay", o: { availability_date: { value: "ngay", basis: "chu_bai" } }, truong: "availability_date", mong: { value: "ngay" } },
  { ten: "ngày vào Ngay hoa", o: { availability_date: { value: " Ngay ", basis: "chu_bai" } }, truong: "availability_date", mong: { value: "ngay" } },
  { ten: "ngày vào tháng", o: { availability_date: { value: "2026-12", basis: "chu_bai" } }, truong: "availability_date", mong: { value: "2026-12" } },
  { ten: "ngày vào ngày", o: { availability_date: { value: "2026-12-15", basis: "chu_bai" } }, truong: "availability_date", mong: { value: "2026-12-15" } },
  { ten: "ngày không có thật", o: { availability_date: { value: "2026-02-30", basis: "chu_bai" } }, truong: "availability_date", mong: { loi: MSG_NGAY_VAO } },
  { ten: "tháng 13", o: { availability_date: { value: "2026-13", basis: "chu_bai" } }, truong: "availability_date", mong: { loi: MSG_NGAY_VAO } },
  { ten: "khuôn 12/2026", o: { availability_date: { value: "12/2026", basis: "chu_bai" } }, truong: "availability_date", mong: { loi: MSG_NGAY_VAO } },
  { ten: "chữ tháng 12", o: { availability_date: { value: "tháng 12", basis: "chu_bai" } }, truong: "availability_date", mong: { loi: MSG_NGAY_VAO } },
  { ten: "mã căn có trong chữ", o: { unit_number: { value: "PR6.xx10", basis: "chu_bai" } }, truong: "unit_number", mong: { value: "PR6.xx10" } },
  { ten: "mã căn khoảng trắng thừa", o: { unit_number: { value: "  PR6.xx10 ", basis: "chu_bai" } }, truong: "unit_number", mong: { value: "PR6.xx10" } },
  { ten: "mã căn không có trong chữ", o: { unit_number: { value: "LD2xx11", basis: "chu_bai" } }, truong: "unit_number", mong: { loi: MSG_KHONG_TRONG_CHU } },
  { ten: "mã căn căn cứ Nghề", o: { unit_number: { value: "LD2xx11", basis: "kien_thuc_nghe" } }, truong: "unit_number", mong: { value: "LD2xx11" } },
  { ten: "mã căn thiếu", o: { unit_number: { value: " " } }, truong: "unit_number", mong: { loi: "Chưa điền — nhập giá trị hoặc chọn «Không suy ra được»" } },
]

/** Kết quả của một dòng trên một bản chuanHoaLuot. Căn cứ Nghề đòi lý do nên lượt luôn có lý do. */
function chay(fn: Chuan, d: Dong): { value: string | null } | { loi: string } {
  const kq = fn(luot(d.o), { text: CHU, reason: "lý do thử" })
  if (!kq.ok) {
    const l = kq.loi[d.truong as keyof typeof kq.loi]
    return l ? { loi: l } : { loi: `lỗi ở ô khác: ${JSON.stringify(kq.loi)}` }
  }
  const r = kq.rows.find((x) => x.field === d.truong)
  return { value: r ? r.value : "<vắng>" }
}

test("TN081-AC-3 chuanHoaLuot bảy trường mới theo bảng viết trước", async () => {
  assert.equal(BANG.length, 30)
  for (const d of BANG) assert.deepEqual(chay(chuanHoaLuot, d), d.mong, d.ten)

  // Chiều đỏ 1: hạ mã căn về chữ thường.
  const thuong = await banDot('value: v.normalize("NFC").replace(/\\s+/g, " "), not_stated', 'value: v.normalize("NFC").replace(/\\s+/g, " ").toLowerCase(), not_stated')
  const d1 = BANG.find((d) => d.ten === "mã căn có trong chữ")!
  assert.notDeepEqual(chay(thuong, d1), d1.mong, "MA CAN BI DOI CHU")
  assert.deepEqual(chay(thuong, d1), { value: "pr6.xx10" }, "MA CAN BI DOI CHU")

  // Chiều đỏ 2: nhận ngày không có thật.
  const ngay = await banDot("return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay ? t : null", "return t")
  const d2 = BANG.find((d) => d.ten === "ngày không có thật")!
  assert.deepEqual(chay(ngay, d2), { value: "2026-02-30" }, "NGAY KHONG CO THAT DUOC NHAN")

  // Chiều đỏ 3: không sắp, không bỏ trùng tập mã.
  const tap = await banDot("value: [...new Set(ds)].sort().join(\",\")", "value: ds.join(\",\")")
  const d3 = BANG.find((d) => d.ten === "view nhiều giá trị, trùng")!
  assert.deepEqual(chay(tap, d3), { value: "lake,city,lake" }, "TAP MA KHONG CHUAN")
})
