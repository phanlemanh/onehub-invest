// dac-trung-nha-s06-len-canonical (HD5) — ca thuần «DT-AC-3»: bộ đọc đặc trưng nhà S06. Ma trận viết trước; ca đỏ trên bản
// sao đột biến của lib/dac-trung-s06.mjs chép cạnh tệp thật (tên mang bộ đếm vì import() nhớ theo URL) rồi xoá.
import { strict as assert } from "node:assert";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { docDacTrungS06 } from "../lib/dac-trung-s06.mjs";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "..", "lib");
const f = (field, value, rule_id) => ({ field, value, rule_id });
const HN = { latitude: 21.0285, longitude: 105.8542 };

// [tên dòng, ad, tập phát biểu mong đợi] — dạng giá trị theo đo stg 31/10: width/length/floors là số JSON, toilets số nguyên,
// toạ độ số thực, street_number là chuỗi (có «số 88»).
const MA_TRAN = [
  ["số nhà · hợp lệ", { payload: { street_number: "số 88" } }, [f("street_number", "số 88", "payload.street_number")]],
  ["số nhà · chỉ cờ streetnumber_display (không đọc)", { payload: { streetnumber_display: "1" } }, []],
  ["số nhà · rác (chữ rỗng)", { payload: { street_number: "  " } }, []],
  ["số nhà · vắng", { payload: {} }, []],
  ["mã căn · hợp lệ", { payload: { unitnumber: "A-12.05" } }, [f("unit_number", "A-12.05", "payload.unitnumber")]],
  ["mã căn · chỉ unitnumber", { payload: { unitnumber: "1205" } }, [f("unit_number", "1205", "payload.unitnumber")]],
  ["mã căn · rác (chữ rỗng)", { payload: { unitnumber: "" } }, []],
  ["ngang + dài · số JSON", { payload: { width: 4.5, length: 15 } }, [f("frontage_length", "4.5", "payload.width"), f("lot_size_dimensions", "4.5 x 15", "payload.width+payload.length")]],
  ["ngang + dài · chuỗi phẩy thập phân", { payload: { width: "4,5", length: "15" } }, [f("frontage_length", "4.5", "payload.width"), f("lot_size_dimensions", "4.5 x 15", "payload.width+payload.length")]],
  ["ngang · chuỗi kèm đơn vị", { payload: { width: "5m" } }, [f("frontage_length", "5", "payload.width")]],
  ["ngang không dài", { payload: { width: 4 } }, [f("frontage_length", "4", "payload.width")]],
  ["dài không ngang", { payload: { length: 15 } }, []],
  ["ngang · rác 0", { payload: { width: 0, length: 15 } }, []],
  ["ngang · rác âm", { payload: { width: -3 } }, []],
  ["ngang · rác > 200", { payload: { width: 250, length: 10 } }, []],
  ["ngang · rác chữ", { payload: { width: "rộng" } }, []],
  ["tầng · số JSON", { payload: { floors: 4 } }, [f("stories", "4", "payload.floors")]],
  ["tầng · chuỗi kèm đơn vị", { payload: { floors: "3 tầng" } }, [f("stories", "3", "payload.floors")]],
  ["tầng · rác > 100", { payload: { floors: 120 } }, []],
  ["tầng · rác lẻ", { payload: { floors: 2.5 } }, []],
  ["tầng · vắng", { payload: {} }, []],
  ["WC · hợp lệ", { payload: {}, toilets: 3 }, [f("bathrooms", "3", "toilets")]],
  ["WC · rác 0", { payload: {}, toilets: 0 }, []],
  ["toạ độ · trong khung VN", { payload: {}, ...HN }, [f("latitude", "21.0285", "latitude"), f("longitude", "105.8542", "longitude")]],
  ["toạ độ · ngoài khung VN", { payload: {}, latitude: 48.85, longitude: 2.35 }, []],
  ["toạ độ · thiếu kinh độ", { payload: {}, latitude: 21.03, longitude: null }, []],
  ["toạ độ · vắng cả hai", { payload: {} }, []],
  ["mã căn · vắng", { payload: {} }, []],
  ["WC · vắng", { payload: {}, toilets: null }, []],
  ["WC · rác > 50", { payload: {}, toilets: 60 }, []],
  ["ngang hợp lệ + dài rác 0", { payload: { width: 4, length: 0 } }, [f("frontage_length", "4", "payload.width")]],
  ["ngang hợp lệ + dài rác > 200", { payload: { width: 4, length: 250 } }, [f("frontage_length", "4", "payload.width")]],
  ["ngang hợp lệ + dài rác chữ", { payload: { width: 4, length: "sâu" } }, [f("frontage_length", "4", "payload.width")]],
];

// Ô bắt buộc của ma trận (trường × lớp) — mỗi ô phải có ít nhất một dòng mang đúng tiền tố tên.
const O_BAT_BUOC = ["số nhà · hợp lệ", "số nhà · vắng", "số nhà · rác", "mã căn · hợp lệ", "mã căn · vắng", "mã căn · rác",
  "ngang + dài · số JSON", "dài không ngang", "ngang · rác", "ngang hợp lệ + dài rác", "tầng · số JSON", "tầng · vắng", "tầng · rác",
  "WC · hợp lệ", "WC · vắng", "WC · rác", "toạ độ · trong khung VN", "toạ độ · vắng cả hai", "toạ độ · ngoài khung VN"];

test("DT-AC-3: docDacTrungS06 — mỗi dòng ma trận ra đúng tập {field, value, rule_id}; số assert bằng số dòng", () => {
  let n = 0;
  for (const [ten, ad, mong] of MA_TRAN) {
    assert.deepEqual(docDacTrungS06(ad), mong, `DT-AC-3 «${ten}»`);
    n++;
  }
  assert.equal(n, MA_TRAN.length);
  assert.equal(n, 33);
  for (const o of O_BAT_BUOC) assert.ok(MA_TRAN.some(([ten]) => ten.startsWith(o)), `DT-AC-3 ma trận thiếu ô «${o}»`);
});

let dem = 0;
/** Nạp bản sao đột biến của lib/dac-trung-s06.mjs (thay `cu` bằng `moi`), trả module; xoá tệp ngay sau khi nạp. */
async function banSao(cu, moi) {
  const goc = readFileSync(join(LIB, "dac-trung-s06.mjs"), "utf8");
  assert.ok(goc.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const tep = join(LIB, `dac-trung-s06.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, goc.replace(cu, moi));
  try {
    return await import(pathToFileURL(tep).href);
  } finally {
    unlinkSync(tep);
  }
}

test("DT-AC-3 đỏ: bản sao bỏ kiểm chiều dài thì dòng «ngang hợp lệ + dài rác 0» ra ngang × dài", async () => {
  const m = await banSao("if (ngangOk && daiOk) them(", "if (ngangOk) them(");
  const dong = MA_TRAN.find(([ten]) => ten === "ngang hợp lệ + dài rác 0");
  assert.notDeepEqual(m.docDacTrungS06(dong[1]), dong[2], "DT-AC-3 đỏ: chiều dài rác phải lọt ở bản sao");
});

test("DT-AC-3 đỏ: bản sao bỏ trần WC thì dòng «WC · rác > 50» ra phát biểu", async () => {
  const m = await banSao("wc > 0 && wc <= TRAN.wc", "wc > 0");
  const dong = MA_TRAN.find(([ten]) => ten === "WC · rác > 50");
  assert.notDeepEqual(m.docDacTrungS06(dong[1]), dong[2], "DT-AC-3 đỏ: WC trên trần phải lọt ở bản sao");
});

test("DT-AC-3 đỏ: bản sao bỏ khung toạ độ VN thì dòng «toạ độ ngoài khung» ra phát biểu", async () => {
  const goc = readFileSync(join(LIB, "dac-trung-s06.mjs"), "utf8");
  const cu = "const KHUNG_VN = { vi: [8, 24], kinh: [102, 110] };";
  assert.ok(goc.includes(cu), "đột biến không khớp mã nguồn");
  const tep = join(LIB, `dac-trung-s06.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, goc.replace(cu, "const KHUNG_VN = { vi: [-90, 90], kinh: [-180, 180] };"));
  try {
    const m = await import(pathToFileURL(tep).href);
    const dong = MA_TRAN.find(([ten]) => ten === "toạ độ · ngoài khung VN");
    assert.notDeepEqual(m.docDacTrungS06(dong[1]), dong[2], "DT-AC-3 đỏ: toạ độ ngoài khung phải lọt ở bản sao");
  } finally {
    unlinkSync(tep);
  }
});

// s06-duong-du-an-len-tin (DS1) — ca thuần «DS1-AC-1»: 27 hàng của bảng Ma trận AC-1 trong contract, cùng thứ tự.
const R = "payload.street_name";
const NFD = "Nguyễn Trãi".normalize("NFD");
const MA_TRAN_DUONG = [
  ["Nguyễn Xiển", "Nguyễn Xiển"],
  ["Đường Huỳnh Tấn Phát", "Đường Huỳnh Tấn Phát"],
  ["  Âu Cơ  ", "Âu Cơ"],
  ["Lạc   Long  Quân", "Lạc Long Quân"],
  [NFD, "Nguyễn Trãi".normalize("NFC")],
  ["Đường Tân Túc, Thị trấn Tân Túc, Bình Chánh", "Đường Tân Túc, Thị trấn Tân Túc, Bình Chánh"],
  ["Số 277 Đường Bến Bình Đông, Phường 14", "Số 277 Đường Bến Bình Đông, Phường 14"],
  ["Nguyễn Xiển 0912345678", null], // thay ở hồ sơ sdt-trong-ten-duong AC-1
  ["Đường Quận 1 cũ", "Đường Quận 1 cũ"],
  ["Xã Đàn", "Xã Đàn"],
  ["Tỉnh lộ 10", "Tỉnh lộ 10"],
  ["TP Giao Lưu", "TP Giao Lưu"],
  ["", null],
  ["   ", null],
  [123, null],
  [undefined, null],
  ["Phường Hòa Quý, Quận Ngũ Hành Sơn, Đà Nẵng", null],
  ["phường 5", null],
  ["P. Hòa Quý, Q. Ngũ Hành Sơn", null],
  ["Quận Ngũ Hành Sơn", null],
  ["Huyện Bình Chánh, Hồ Chí Minh", null],
  ["Thị trấn Tân Túc", null],
  ["Thị xã Bến Cát, Bình Dương", null],
  ["Xã Tân Nhựt, Bình Chánh", null],
  ["TP Thủ Đức, Hồ Chí Minh", null],
  ["Thành phố Thủ Đức, Hồ Chí Minh", null],
  ["Tỉnh Bình Dương, Việt Nam", null],
];
const kiemHang = (doc, i) => {
  const [vao, mong] = MA_TRAN_DUONG[i];
  const payload = vao === undefined ? {} : { street_name: vao };
  assert.deepEqual(doc({ payload }), mong === null ? [] : [f("street_raw", mong, R)], `DS1-AC-1 hàng ${i + 1}`);
};

test("DS1-AC-1 ma trận 27 hàng", () => {
  let n = 0;
  for (let i = 0; i < MA_TRAN_DUONG.length; i++) { kiemHang(docDacTrungS06, i); n++; }
  assert.equal(n, 27);
  assert.equal(docDacTrungS06({ payload: { street_name: "Nguyễn Xiển" } })[0].rule_id, R, "đối chứng dương: rule_id");
  assert.equal(docDacTrungS06({ payload: { street_name: "Tỉnh lộ 10, Bình Chánh" } })[0]?.value, "Tỉnh lộ 10, Bình Chánh", "Tỉnh lộ có phẩy vẫn là đường");
});

test("DS1 đường nguồn trả dạng mã hoá thì không phát biểu; đường thật có gạch chéo vẫn giữ", () => {
  // Đo trên bản chép 03/11: 21 tin S06 mang street_name base64 dài 44 ký tự.
  for (const v of ["6N44uSPrl/bc/6/Ms3bjYea7hylJueNm9YNsUraw4Lo=", "cwnPUW6GMww9JHw8IpEcrcgokNKRF7hkmOI1MjkmKyA="]) {
    assert.deepEqual(docDacTrungS06({ payload: { street_name: v } }), [], v);
  }
  for (const v of ["3/2", "Đường 3/2", "12/5A", "Nguyễn Văn Trỗi"]) {
    assert.equal(docDacTrungS06({ payload: { street_name: v } })[0]?.value, v, v);
  }
});

test("DS1-AC-1 đỏ: bản sao bỏ luật địa danh thì ca đỏ gọi tên hàng 17", async () => {
  const m = await banSao("if (!t || DIA_DANH.test(t) || DIA_DANH_CO_PHAY.test(t)) return null;", "if (!t) return null;");
  assert.throws(() => kiemHang(m.docDacTrungS06, 16), /DS1-AC-1 hàng 17/);
});

test("DS1-AC-1 đỏ: bản sao bỏ neo đầu chuỗi thì ca đỏ gọi tên hàng 9", async () => {
  const m = await banSao("const DIA_DANH = /^(?:", "const DIA_DANH = /(?:");
  assert.throws(() => kiemHang(m.docDacTrungS06, 8), /DS1-AC-1 hàng 9/);
});
