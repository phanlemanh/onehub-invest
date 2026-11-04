// labels-nhom.test.tsx — hồ sơ _acceptance/gan-nhan-theo-nhom-s03 (GC0), ca «GCN-AC-n». Ma trận viết trước, số assert bằng số
// phần tử. Phần chuẩn hoá không DB; phần route dùng lược đồ tạm, migration 054 + 072 thật, handler thật.
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  chuanHoaLuot,
  coTrongChu,
  LABEL_FIELDS,
  LABEL_FIELDS_NHOM,
  MSG_CAN_CU,
  MSG_KHONG_TRONG_CHU,
  MSG_SDT,
  MSG_THIEU_LY_DO,
  veE164,
  type LabelField,
  type RawCell,
  type RawLabels,
} from "../src/lib/labels-normalize"

const CHU = "Bán căn 2PN S5.03 trục 12 phân khu Rainbow, Vinhomes Grand Park, 64,5m2, giá 4,35 tỷ"
const chu = (value: string): RawCell => ({ value, basis: "chu_bai" })
const DU: RawLabels = {
  listing_intent: chu("offer"),
  kind: chu("sale"),
  property_type: chu("apartment"),
  multi_unit: { value: "no" },
  project: chu("Vinhomes Grand Park"),
  subzone: chu("Rainbow"),
  building: chu("S5.03"),
  stack: chu("12"),
  floor: { not_stated: true },
  bedrooms: chu("2"),
  bedrooms_plus: chu("no"),
  bathrooms: { not_stated: true },
  area_m2: chu("64,5"),
  price_min_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" },
  price_max_vnd: { value: "4,35", unit: "ty", basis: "chu_bai" },
  seller_name: { not_stated: true },
  seller_phone: chu("0912 345 678"),
}

type Ca = { ten: string; doi: RawLabels; text?: string; reason?: unknown; loi?: [LabelField | "reason", string]; ky?: [LabelField, string | null, string | null] }
const MA_TRAN: Ca[] = [
  { ten: "toan chu bai khong ly do", doi: {}, ky: ["project", "vinhomes grand park", "chu_bai"] },
  { ten: "ngu canh nhom ly do trong", doi: { project: { value: "Ocean Park", basis: "ngu_canh_nhom" } }, loi: ["reason", MSG_THIEU_LY_DO] },
  { ten: "kien thuc nghe ly do chi khoang trang", doi: { area_m2: { value: "59", basis: "kien_thuc_nghe" } }, reason: "   ", loi: ["reason", MSG_THIEU_LY_DO] },
  { ten: "khong suy ra duoc basis rong", doi: { project: { not_stated: true, basis: "chu_bai" } }, ky: ["project", null, null] },
  { ten: "can cu la", doi: { kind: { value: "sale", basis: "doan" } }, loi: ["kind", MSG_CAN_CU] },
  { ten: "thieu can cu", doi: { kind: { value: "sale" } }, loi: ["kind", MSG_CAN_CU] },
  { ten: "sdt sai khuon", doi: { seller_phone: chu("0123 456") }, loi: ["seller_phone", MSG_SDT] },
  { ten: "sdt dau 02", doi: { seller_phone: chu("0212345678") }, loi: ["seller_phone", MSG_SDT] },
  { ten: "wc chu", doi: { bathrooms: chu("hai") }, loi: ["bathrooms", "WC phải là số nguyên không âm"] },
  { ten: "sdt ve e164", doi: {}, ky: ["seller_phone", "+84912345678", "chu_bai"] },
  { ten: "rainbow ngu canh nhom co ly do", doi: { subzone: { value: "Rainbow", basis: "ngu_canh_nhom" } }, text: "Bán RB 2PN S5.03 trục 12 Vinhomes Grand Park 64,5m2", reason: "RB = Rainbow", ky: ["subzone", "rainbow", "ngu_canh_nhom"] },
  { ten: "du an chu bai khong co", doi: { project: chu("Ocean Park") }, loi: ["project", MSG_KHONG_TRONG_CHU] },
  { ten: "phan khu chu bai khong co", doi: { subzone: chu("Sapphire") }, loi: ["subzone", MSG_KHONG_TRONG_CHU] },
  { ten: "toa chu bai khong co", doi: { building: chu("S10.05") }, loi: ["building", MSG_KHONG_TRONG_CHU] },
  { ten: "truc chu bai khong co", doi: { stack: chu("99") }, loi: ["stack", MSG_KHONG_TRONG_CHU] },
  { ten: "dien tich chu bai khong co", doi: { area_m2: chu("59") }, loi: ["area_m2", MSG_KHONG_TRONG_CHU] },
  { ten: "bai chu rong chu bai bi tu choi", doi: {}, text: "", loi: ["project", MSG_KHONG_TRONG_CHU] },
  { ten: "bai chu rong khong suy ra va ngu canh", text: "", reason: "chỉ có ảnh", doi: { project: { value: "Ocean Park", basis: "ngu_canh_nhom" }, subzone: { not_stated: true }, building: { not_stated: true }, stack: { not_stated: true }, area_m2: { not_stated: true } }, ky: ["project", "ocean park", "ngu_canh_nhom"] },
  { ten: "unicode va chu hoa", doi: { subzone: chu("RAINBOW"), area_m2: chu("34") }, text: "𝟑𝟒𝐦² S5.03 trục 12 rainbow Vinhomes Grand Park", ky: ["subzone", "rainbow", "chu_bai"] },
  { ten: "nhieu can khong nhan khong suy ra", doi: { multi_unit: { not_stated: true } }, loi: ["multi_unit", "Chọn Không hoặc Có"] },
  { ten: "nhieu can luon basis rong", doi: { multi_unit: { value: "yes", basis: "chu_bai" } }, ky: ["multi_unit", "yes", null] },
]

test("GCN-AC-4 ma trận chuẩn hoá: mỗi ca đúng ô, đúng thông điệp, đọc ra đúng giá trị và căn cứ", () => {
  let so = 0
  for (const c of MA_TRAN) {
    const kq = chuanHoaLuot({ ...DU, ...c.doi }, { text: c.text ?? CHU, reason: c.reason })
    if (c.loi) {
      assert.equal(kq.ok, false, c.ten)
      if (!kq.ok) assert.equal(kq.loi[c.loi[0]], c.loi[1], `${c.ten}: ${JSON.stringify(kq.loi)}`)
    } else {
      assert.ok(kq.ok, `${c.ten}: ${JSON.stringify(kq)}`)
      if (kq.ok) {
        assert.equal(kq.rows.length, 17, c.ten)
        const r = kq.rows.find((x) => x.field === c.ky![0])!
        assert.deepEqual([r.value, r.basis], [c.ky![1], c.ky![2]], c.ten)
      }
    }
    so++
  }
  assert.equal(so, MA_TRAN.length)
  assert.equal(MA_TRAN.length, 21)
})

test("GCN-AC-4 lý do: khoảng trắng về null khi toàn chữ bài, cắt khoảng trắng khi có chữ", () => {
  const trong = chuanHoaLuot(DU, { text: CHU, reason: "  " })
  assert.ok(trong.ok && trong.reason === null)
  const co = chuanHoaLuot(DU, { text: CHU, reason: " RB = Rainbow " })
  assert.ok(co.ok && co.reason === "RB = Rainbow")
})

test("GCN-AC-4 lỗi không ghi nửa chừng: có lỗi thì không trả dòng nào", () => {
  const kq = chuanHoaLuot({ ...DU, project: chu("Ocean Park"), bathrooms: chu("hai") }, { text: CHU })
  assert.equal(kq.ok, false)
  if (!kq.ok) assert.deepEqual(Object.keys(kq.loi).sort(), ["bathrooms", "project"])
  assert.equal("rows" in kq, false)
})

test("GCN-AC-4 coTrongChu: ranh giới số và chữ, dấu, thập phân", () => {
  const CA: [string, string, boolean][] = [
    ["12", "trục 12 đẹp", true],
    ["12", "giá 120 triệu", false],
    ["12", "S5.12", false],
    ["59", "59m2", true],
    ["59", "590 triệu", false],
    ["64.5", "64,50 m2", true],
    ["64", "64,5 m2", false],
    ["park", "có parking", false],
    ["grand park", "Vinhomes GRAND  PARK", true],
    ["thành đô", "Thanh Do", true],
    ["s5.03", "toà S5.03-12", true],
    ["rainbow", "", false],
  ]
  for (const [v, t, ky] of CA) assert.equal(coTrongChu(v, t), ky, `${v} trong «${t}»`)
})

test("GCN-AC-4 veE164: cùng luật extractPhones", () => {
  const CA: [string, string | null][] = [
    ["0912 345 678", "+84912345678"],
    ["091.234.5678", "+84912345678"],
    ["+84 912 345 678", "+84912345678"],
    ["84912345678", "+84912345678"],
    ["(091) 234-5678", "+84912345678"],
    ["0212345678", null],
    ["091234567", null],
    ["09123456789", null],
    ["gọi 0912345678", null],
  ]
  for (const [s, ky] of CA) assert.equal(veE164(s), ky, s)
})

test("GCN-AC-9 lát đời trước: chín trường, không căn cứ, không lý do, câu cũ", () => {
  assert.equal(LABEL_FIELDS.length, 9)
  assert.equal(LABEL_FIELDS_NHOM.length, 17)
  for (const f of LABEL_FIELDS) assert.ok((LABEL_FIELDS_NHOM as readonly string[]).includes(f), f)
  const cu: RawLabels = Object.fromEntries(LABEL_FIELDS.map((f) => [f, { not_stated: true }]))
  const kq = chuanHoaLuot(cu)
  assert.ok(kq.ok && kq.rows.length === 9 && kq.reason === null && kq.rows.every((r) => r.basis === null))
  const thieu = chuanHoaLuot({ ...cu, kind: {} })
  assert.ok(!thieu.ok && /Tin không nêu/.test(thieu.loi.kind!))
})
