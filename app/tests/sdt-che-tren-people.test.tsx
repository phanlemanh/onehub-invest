// sdt-che-tren-people.test.tsx — hồ sơ _acceptance/sdt-luu-goc-e164 (SD3) AC-8: bí danh `sdt` (số gốc E.164) hiện nhãn che
// cố định, 0 chữ số, ở mọi vai trên /ops/people (Hỏi-2) — cả trang danh sách (hangNguoi) lẫn trang một người (hienBiDanh).
// Loader thật trên DB thử: probes/people.tsx của hồ sơ. Số trong test là số bịa.
import { test } from "node:test"
import assert from "node:assert/strict"

import { hangNguoi } from "../src/components/ops/people/people-rows"
import { hienBiDanh, NHAN_CHE_SDT, type NguoiHang } from "../src/lib/ops/people"

const SO = "+84912345678"
type Hien = typeof hienBiDanh

/** Mọi chuỗi 3+ chữ số liên tiếp trong ô là lộ một phần số gốc. */
function kiemChe(hien: Hien): number {
  let n = 0
  for (const xem of [true, false]) {
    const v = hien("sdt", SO, [], xem)
    if (xem && v !== NHAN_CHE_SDT) throw new Error(`LO SO GOC TREN PEOPLE: vai xem được nhận «${v}»`)
    if (v != null && /\d{3,}/.test(v)) throw new Error(`LO SO GOC TREN PEOPLE: ô có chữ số`)
    n++
  }
  return n
}

test("AC-8 hienBiDanh: bí danh sdt → nhãn che cố định ở vai xem được, ẩn ở vai dưới", () => {
  assert.equal(kiemChe(hienBiDanh), 2)
  assert.equal(hienBiDanh("sdt", SO, [], false), null)
  assert.ok(!/\d/.test(NHAN_CHE_SDT))
})

test("AC-8 đối chứng đỏ: áp luật che cũ của sdt_bam (8 ký tự đầu) lên số gốc → bắt «LO SO GOC TREN PEOPLE»", () => {
  const luatCu: Hien = (kind, value, entries, xem) => hienBiDanh(kind === "sdt" ? "sdt_bam" : kind, value, entries, xem)
  assert.throws(() => kiemChe(luatCu), /LO SO GOC TREN PEOPLE/)
})

test("AC-8 hangNguoi: hàng danh sách dùng đúng loại bí danh, ô SĐT không mang chữ số của số gốc", () => {
  const r: NguoiHang = { partyKey: "pty_X", source: "S03", soTin: 1, soBiDanh: 1, ten: null, taiKhoan: null, sdtBam: SO, sdtKind: "sdt" }
  for (const xem of [true, false]) {
    const h = hangNguoi(r, [], xem)
    assert.ok(h.sdtBam == null || !/\d{3,}/.test(h.sdtBam), `LO SO GOC TREN PEOPLE: hàng danh sách (xem=${xem})`)
  }
  assert.equal(hangNguoi(r, [], true).sdtBam, NHAN_CHE_SDT)
  // Đối chứng dương: bí danh băm đời trước vẫn hiện 8 ký tự đầu như cũ.
  assert.equal(hangNguoi({ ...r, sdtBam: "abcdef0123456789", sdtKind: "sdt_bam" }, [], true).sdtBam, "abcdef01…")
})
