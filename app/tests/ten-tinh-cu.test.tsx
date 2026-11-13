/**
 * Tên tỉnh cũ đã sáp nhập trên Ops (hồ sơ nhan-vung-moi-ops): vùng thu S06 `binh-duong` không có trong `areas` (34 thị
 * trường mới), nên `marketNameOf` tra bảng TINH_CU thay vì in «(chưa có tên Việt)». Không DB.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { TINH_CU, marketNameOf } from "../src/lib/market-names"
import { SAP_NHAP } from "../../pipeline/lib/thi-truong.mjs"

const TEN = new Map([
  ["vn-hcmc", "Hồ Chí Minh"],
  ["vn-hai-phong", "Hải Phòng"],
  ["vn-khanh-hoa", "Khánh Hòa"],
  ["vn-da-nang", "Đà Nẵng"],
])

test("TC-1 TINH_CU khớp SAP_NHAP của pipeline (cùng khoá, cùng thị trường mới)", () => {
  const sap = SAP_NHAP as Record<string, string>
  assert.deepEqual(Object.keys(TINH_CU).sort(), Object.keys(sap).sort(), "lech-sap-nhap: khoá TINH_CU khác SAP_NHAP")
  for (const [k, v] of Object.entries(TINH_CU)) assert.equal(v.nay, sap[k], `lech-sap-nhap: ${k}`)
})

test("TC-2 ma trận tên vùng thu viết trước", () => {
  const MA_TRAN: [string, ReadonlyMap<string, string>, string, boolean][] = [
    ["binh-duong", TEN, "Bình Dương (nay thuộc Hồ Chí Minh)", true],
    ["vn-binh-duong", TEN, "Bình Dương (nay thuộc Hồ Chí Minh)", true],
    ["binh-duong", new Map(), "Bình Dương", true],
    ["hai-phong", TEN, "Hải Phòng", true],
    ["khanh-hoa", TEN, "Khánh Hòa", true],
    ["vung-la", TEN, "vung-la (chưa có tên Việt)", false],
  ]
  assert.equal(MA_TRAN.length, 6)
  for (const [ma, ten, ky_vong, biet] of MA_TRAN) assert.deepEqual(marketNameOf(ma, ten), { name: ky_vong, known: biet }, `ô ${ma}`)
})

test("TC-3 đối chứng đỏ: bỏ dòng binh-duong khỏi TINH_CU thì mã lại thành chữ thô", () => {
  const bang = TINH_CU as Record<string, { ten: string; nay: string }>
  const giu = bang["vn-binh-duong"]
  delete bang["vn-binh-duong"]
  try {
    const r = marketNameOf("binh-duong", TEN)
    assert.equal(r.known, false, "doi-chung-tinh-cu: thiếu dòng mà vẫn ra tên")
    assert.match(r.name, /chưa có tên Việt/)
  } finally {
    bang["vn-binh-duong"] = giu
  }
})
