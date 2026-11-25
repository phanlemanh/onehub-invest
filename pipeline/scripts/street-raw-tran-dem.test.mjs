// street-raw-tran-dem.test.mjs — hồ sơ _acceptance/street-raw-tran-dem-tren-phat-bieu-song (PL41), ca «TD-AC». Không cần DB.
// Trần 50 của transform S06 đếm cái lượt thật sự đổi: phát biểu sống trúng + giá trị trúng ở tin CHƯA có bản ghi; giá trị trúng
// của tin đã có bản ghi (các đêm trước đã bỏ ghi) không vào trần. Sổ tên giả (S90), không dùng tên nguồn thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demTenNguonLuot, kiemTranTenNguon, TRAN_TEN_NGUON } from "../transform-chotot.mjs";

const SO = [{ code: "S90", realName: "Nhà Thử Nghiệm", wholeOnly: false }];
const TRUNG = "Đường Nhà Thử Nghiệm 7";
const tin = (n, cot = "street_raw", tienTo = "k") =>
  Array.from({ length: n }, (_, i) => ({ khoa: `${tienTo}${i}`, o: [[cot, TRUNG], ["phuong_raw", "Phường Sạch"]] }));
const tatCa = (ds) => new Set(ds.map((t) => t.khoa));

test("TD-AC-1 51 giá trị cũ đã xử (tin đã có bản ghi, 0 phát biểu sống trúng): không vào trần, lượt không dừng, vẫn đếm bỏ ghi", () => {
  const ds = tin(51);
  const d = demTenNguonLuot(ds, { tinCu: tatCa(ds), nPhatBieuSong: 0, entries: SO });
  assert.equal(d.boTen.street_raw, 51, "giá trị cũ vẫn phải bị bỏ ghi (đếm vào log)");
  assert.equal(d.trungMoi, 0, "giá trị trúng của tin đã có bản ghi bị tính vào trần — trần thành cộng dồn trên stg");
  assert.equal(d.tran, 0);
  assert.doesNotThrow(() => kiemTranTenNguon(d.tran, "ô chữ mới"));
});

test("TD-AC-2 51 giá trị mới trong một lượt (tin chưa có bản ghi): vào trần, lượt dừng", () => {
  const ds = tin(51, "district_raw", "moi");
  const d = demTenNguonLuot(ds, { tinCu: new Set(), nPhatBieuSong: 0, entries: SO });
  assert.equal(d.trungMoi, 51, "giá trị trúng của tin mới không được đếm vào trần");
  assert.throws(() => kiemTranTenNguon(d.tran, "ô chữ mới"), /vượt trần 50 — dừng, không rút, không ghi/);
  const vuaDu = tin(TRAN_TEN_NGUON, "district_raw", "moi");
  assert.doesNotThrow(() => kiemTranTenNguon(demTenNguonLuot(vuaDu, { tinCu: new Set(), nPhatBieuSong: 0, entries: SO }).tran, "ô chữ mới"));
});

test("TD-AC-3 phát biểu sống trúng (sổ có token chung chung) vào trần dù mọi tin đều cũ", () => {
  const ds = tin(3);
  const d = demTenNguonLuot(ds, { tinCu: tatCa(ds), nPhatBieuSong: 51, entries: SO });
  assert.equal(d.tran, 51, "phát biểu sống trúng không được cộng vào trần");
  assert.throws(() => kiemTranTenNguon(d.tran, "ô chữ mới"), /vượt trần 50/);
});

test("TD-AC-4 transform S06 đếm trần bằng hàm này trước mọi lần ghi", () => {
  const src = readFileSync(new URL("../transform-chotot.mjs", import.meta.url), "utf8");
  const than = src.slice(src.indexOf("export async function runTransformChotot"));
  const goi = than.indexOf("demTenNguonLuot(cacO,");
  const kiem = than.indexOf("kiemTranTenNguon(demLuot.tran,");
  const ghiTin = than.indexOf("INSERT INTO sale_offer_records");
  assert.ok(goi > 0 && kiem > goi, "transform không đếm trần qua demTenNguonLuot rồi kiemTranTenNguon(demLuot.tran)");
  assert.ok(kiem < ghiTin, "kiểm trần phải đứng trước câu upsert tin đầu tiên");
});
