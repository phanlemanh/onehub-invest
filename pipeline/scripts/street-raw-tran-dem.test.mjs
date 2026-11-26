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

// TD-AC-5: đo DÂY NỐI phát biểu sống → trần trong chính runTransformChotot (finding đo AC-4 vòng 1): client giả, không
// cần DB. Mọi tin đều không có trong stg; chỉ field_assertions có N phát biểu sống S06 mang tên nguồn (sổ S90 giả). Đặt
// `nPhatBieuSong: 0` hay bỏ khoá ở transform thì ca 51 không dừng → đỏ.
async function chayGia(nSong) {
  const { runTransformChotot } = await import("../transform-chotot.mjs");
  const { SQL_SO_HINH, SQL_SO_CO_CO } = await import("../lib/source-name-entries.mjs");
  const ghi = [];
  const client = {
    async query(sql) {
      const s = typeof sql === "string" ? sql : sql.text;
      if (/^\s*(INSERT|UPDATE|DELETE)/i.test(s)) ghi.push(s.trim().slice(0, 40));
      if (s.includes("phat-bieu:cat-chuyen")) return { rows: [{ ok: true }] };
      if (s === SQL_SO_HINH) return { rows: [{ bang: true, cot: true }] };
      if (s === SQL_SO_CO_CO) return { rows: [{ code: "S90", real_name: "Nhà Thử Nghiệm", ids: [], match_whole: false }] };
      if (/SELECT id, subject_key, value FROM field_assertions/.test(s)) {
        return { rows: Array.from({ length: nSong }, (_, i) => ({ id: String(i + 1), subject_key: `S06:${i}`, value: TRUNG })) };
      }
      if (s.includes("admin_code")) return { rows: [{ ok: false }] };
      return { rows: [] };
    },
  };
  const log = console.log, warn = console.warn;
  console.log = () => {}; console.warn = () => {};
  try { await runTransformChotot(client); return { loi: null, ghi }; }
  catch (e) { return { loi: e.message, ghi }; }
  finally { console.log = log; console.warn = warn; }
}

test("TD-AC-5 transform S06: 51 phát biểu sống trúng, 0 tin mới → dừng trước mọi lần ghi; 50 thì không dừng vì trần", async () => {
  const r51 = await chayGia(TRAN_TEN_NGUON + 1);
  assert.match(r51.loi ?? "(không dừng)", /vượt trần 50 — dừng, không rút, không ghi/,
    "phát biểu sống trúng của DB không tới được trần của transform (dây nối nPhatBieuSong đứt)");
  assert.deepEqual(r51.ghi, [], "dừng trần mà đã có câu ghi trước đó");
  const r50 = await chayGia(TRAN_TEN_NGUON);
  assert.doesNotMatch(r50.loi ?? "", /vượt trần/, "50 phát biểu sống (đúng trần) mà vẫn dừng");
});
