// s09-danh-ba-can.test.mjs — DA42: ma trận viết trước cho luật dự án bốn đường (AC-3) và luật toà (AC-4, AC-5). Không DB.
// Tên dự án, toà trong fixture là tên giả.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DUONG, MA_TOA, TANG_KHONG_SO, chuanTenTang, demToa, lechTangS16, phanLopDuAn, xetToa } from "./s09-danh-ba-can.mjs";

const NUT = [
  { id: 10, name: "Khu Đô Thị Sao Mai", aliases: ["sao mai city"] },
  { id: 11, name: "Hồ Gươm Plaza Tower", aliases: [] },
  { id: 12, name: "Thành phố Ngọc Lan", aliases: ["Ngọc Lan"] },
];

test("DA42-AC-3 đã nối bằng tay giữ nối", () => {
  const r = phanLopDuAn({ du_an_id: "p1", ten: "Bất kỳ" }, NUT, { noiCung: new Map([["p1", 11]]) });
  assert.deepEqual(r, { duong: DUONG.daNoi, node_id: 11, noi: true });
});

test("DA42-AC-3 trùng tên đúng một nút: thẻ luật, chưa nối khi chưa duyệt; nối khi thẻ luật hiệu lực", () => {
  const da = { du_an_id: "p2", ten: "khu đô thị SAO MAI" };
  assert.deepEqual(phanLopDuAn(da, NUT), { duong: DUONG.theLuat, node_id: 10, ly_do: "cho-the-luat", noi: false });
  assert.deepEqual(phanLopDuAn(da, NUT, { luatDuyet: true }), { duong: DUONG.theLuat, node_id: 10, noi: true });
});

test("DA42-AC-3 gần giống: thẻ từng cặp, chưa nối; duyệt nối đúng nút; từ chối vẫn không nối", () => {
  const da = { du_an_id: "p3", ten: "Ho Guom Plaza" }; // bỏ dấu, chứa trong «ho guom plaza tower»
  const cho = phanLopDuAn(da, NUT);
  assert.equal(cho.duong, DUONG.theCap, "gần giống phải ra thẻ từng cặp");
  assert.equal(cho.noi, false, "gần giống tự nối");
  assert.deepEqual(cho.ung_vien_cua, [11]);
  assert.deepEqual(phanLopDuAn(da, NUT, { theCap: { status: "approved", node_id: 11 } }),
    { duong: DUONG.theCap, node_id: 11, ung_vien_cua: [11], noi: true });
  const tc = phanLopDuAn(da, NUT, { theCap: { status: "rejected", node_id: null } });
  assert.equal(tc.noi, false, "từ chối mà vẫn nối");
  assert.equal(tc.ly_do, "the-tu-choi");
  // Duyệt chỉ một nút không nằm trong ứng viên thì không nối.
  assert.equal(phanLopDuAn(da, NUT, { theCap: { status: "approved", node_id: 99 } }).noi, false);
});

test("DA42-AC-3 không khớp: nút ứng viên; lượt sau giữ đúng nút đã đúc", () => {
  assert.deepEqual(phanLopDuAn({ du_an_id: "p4", ten: "Vườn Sen Riverside" }, NUT), { duong: DUONG.ungVien, noi: true });
  assert.deepEqual(phanLopDuAn({ du_an_id: "p4", ten: "Vườn Sen Riverside" }, NUT,
    { link: { status: "noi", asset_node_id: 77, la_ung_vien: true } }), { duong: DUONG.ungVien, node_id: 77, noi: true });
});

test("DA42-AC-3 tên ngắn không tính gần giống", () => {
  assert.equal(phanLopDuAn({ du_an_id: "p5", ten: "Lan" }, NUT).duong, DUONG.ungVien);
});

const TOA_CO = [
  { building_key: "bld_A", ten: ["S1.01"], ma_cu: true, s16: true, so_tang_s16: 30 },
  { building_key: "bld_B", ten: ["T2"], ma_cu: false, s16: false, so_tang_s16: null },
  { building_key: "bld_C", ten: ["T3"], ma_cu: false, s16: false, so_tang_s16: null },
  { building_key: "bld_D", ten: ["T3 "], ma_cu: false, s16: false, so_tang_s16: null },
  { building_key: "bld_E", ten: ["A1"], ma_cu: false, s16: true, so_tang_s16: 25 },
  { building_key: "bld_F", ten: ["A2"], ma_cu: false, s16: true, so_tang_s16: null },
];

test("DA42-AC-4 khớp một thành bí danh, khớp hai lên thẻ, không khớp tạo mới, trùng tên lên thẻ, mã mới đã có giữ", () => {
  const kq = xetToa([
    { toa_id: "t1", ten: "s1 01", so_tang: 31 },
    { toa_id: "t2", ten: "T2", so_tang: 20 },
    { toa_id: "t3", ten: "T3", so_tang: 20 },
    { toa_id: "t4", ten: "Z9", so_tang: 20 },
    { toa_id: "t5", ten: "K1", so_tang: 20 },
    { toa_id: "t6", ten: "k1", so_tang: 21 },
    { toa_id: "t7", ten: "Q7", so_tang: 10 },
  ], TOA_CO, new Map([[MA_TOA("t7"), "bld_Q"]]));
  const theo = Object.fromEntries(kq.map((x) => [x.toa_id, x]));
  assert.equal(theo.t1.loai, "bi_danh"); assert.equal(theo.t1.building_key, "bld_A");
  assert.equal(theo.t2.loai, "bi_danh"); assert.equal(theo.t2.building_key, "bld_B");
  assert.equal(theo.t3.loai, "the", "khớp hai phải lên thẻ"); assert.equal(theo.t3.ly_do, "khop-hai");
  assert.deepEqual(theo.t3.building_keys, ["bld_C", "bld_D"]);
  assert.equal(theo.t4.loai, "tao_moi");
  assert.equal(theo.t5.ly_do, "trung-ten-trong-du-an"); assert.equal(theo.t6.ly_do, "trung-ten-trong-du-an");
  assert.equal(theo.t7.loai, "da_noi"); assert.equal(theo.t7.building_key, "bld_Q");
  assert.deepEqual(demToa(kq), { da_noi: 1, bi_danh: 2, tao_moi: 1, the: 3, khong_so: 0, theo_ma_cu: 0,
    the_theo_ly_do: { "khop-hai": 1, "trung-ten-trong-du-an": 2 } });
});

// Mã cũ trước tên (giám sát duyệt 22/11). Ca gốc: một toà có sẵn mang hai mã block cùng tên; gói 1 kê hai toà cùng tên đó.
test("DA42-AC-4 mã cũ trước tên: hai block cùng tên mang mã cũ → cả hai nối về toà mã cũ, 0 thẻ, không gắn tên", () => {
  const co = [{ building_key: "bld_OS", ten: ["OS2"], ma_cu: true, ma_cu_ds: ["p9/b1", "p9/b2"], s16: false, so_tang_s16: null }];
  const kq = xetToa([{ toa_id: "b1", ten: "OS2", so_tang: 20 }, { toa_id: "b2", ten: "OS2", so_tang: 20 }], co);
  assert.deepEqual(kq.map((x) => [x.loai, x.building_key, x.theo_ma_cu]), [["bi_danh", "bld_OS", true], ["bi_danh", "bld_OS", true]],
    "hai block cùng tên mang mã cũ phải nối về toà mã cũ (không lên thẻ trùng tên)");
  assert.equal(demToa(kq).the, 0);
  assert.equal(demToa(kq).theo_ma_cu, 2);
});

test("DA42-AC-4 đối chứng: hai block cùng tên KHÔNG mang mã cũ vẫn lên thẻ trùng tên", () => {
  const co = [{ building_key: "bld_OS", ten: ["OS2"], ma_cu: false, ma_cu_ds: [], s16: false, so_tang_s16: null }];
  const kq = xetToa([{ toa_id: "b1", ten: "OS2", so_tang: 20 }, { toa_id: "b2", ten: "OS2", so_tang: 20 }], co);
  assert.deepEqual(kq.map((x) => x.ly_do), ["trung-ten-trong-du-an", "trung-ten-trong-du-an"]);
});

test("DA42-AC-4 xung đột hai căn cứ: mã cũ trỏ toà A, tên khớp duy nhất toà B ≠ A → thẻ, không tự nối theo bên nào", () => {
  const co = [
    { building_key: "bld_A", ten: ["X1"], ma_cu: true, ma_cu_ds: ["p9/b1"], s16: false, so_tang_s16: null },
    { building_key: "bld_B", ten: ["Y1"], ma_cu: false, ma_cu_ds: [], s16: false, so_tang_s16: null },
  ];
  const r = xetToa([{ toa_id: "b1", ten: "Y1", so_tang: 20 }], co)[0];
  assert.equal(r.loai, "the"); assert.equal(r.ly_do, "xung-dot-ma-cu-ten"); assert.deepEqual(r.building_keys, ["bld_A", "bld_B"]);
  // Tên khớp đúng toà mang mã cũ: không xung đột.
  assert.equal(xetToa([{ toa_id: "b1", ten: "X1", so_tang: 20 }], co)[0].building_key, "bld_A");
});

test("DA42-AC-4 mã cũ trỏ hai toà → thẻ; mã cũ vẫn chịu luật lệch tầng S16", () => {
  const hai = [
    { building_key: "bld_A", ten: ["X1"], ma_cu: true, ma_cu_ds: ["p9/b1"], s16: false, so_tang_s16: null },
    { building_key: "bld_B", ten: ["X2"], ma_cu: true, ma_cu_ds: ["p9/b1"], s16: false, so_tang_s16: null },
  ];
  assert.equal(xetToa([{ toa_id: "b1", ten: "X1", so_tang: 20 }], hai)[0].ly_do, "ma-cu-hai-toa");
  const s16 = [{ building_key: "bld_A", ten: ["X1"], ma_cu: true, ma_cu_ds: ["p9/b1"], s16: true, so_tang_s16: 30 }];
  assert.equal(xetToa([{ toa_id: "b1", ten: "X1", so_tang: 20 }], s16)[0].ly_do, "lech-tang-s16");
});

test("DA42-AC-5 toà S16: tầng khớp thành bí danh, S09 ít tầng hơn quá 2 lên thẻ (hai toà cùng tên), không so được thành bí danh đếm riêng", () => {
  const kq = xetToa([
    { toa_id: "a1", ten: "A1", so_tang: 27 },  // S09 nhiều hơn 2 tầng (tầng đế): khớp
    { toa_id: "a1b", ten: "S1.01", so_tang: 26 }, // 26 vs 30: S09 ít hơn 4 → lệch
    { toa_id: "a2", ten: "A2", so_tang: 18 },  // S16 không có số tầng
  ], TOA_CO);
  const theo = Object.fromEntries(kq.map((x) => [x.toa_id, x]));
  assert.equal(theo.a1.loai, "bi_danh");
  assert.equal(theo.a1b.loai, "the", "hai toà cùng tên: S09 ít tầng hơn quá 2 mà vẫn thành bí danh");
  assert.equal(theo.a1b.ly_do, "lech-tang-s16");
  assert.equal(theo.a2.loai, "bi_danh"); assert.equal(theo.a2.khong_so, true);
  assert.equal(demToa(kq).khong_so, 1);
});

test("DA42-AC-5 Q1 lệch một chiều: S09 nhiều tầng hơn S16 (tầng đế) vẫn thành bí danh", () => {
  // Đo thật 21/11: 22 toà lệch quá 2 theo luật cũ, cả 22 đều S09 nhiều hơn 3–8 tầng. Luật hai chiều thì ca này đỏ.
  const kq = xetToa([{ toa_id: "e1", ten: "A1", so_tang: 33 }], TOA_CO); // 33 vs 25
  assert.equal(kq[0].loai, "bi_danh", "S09 nhiều tầng hơn S16 bị coi là hai toà khác nhau");
});

test("DA42-AC-5 Q1 tên tầng: S16 có căn ở tầng S09 không kê thì lên thẻ; chỉ thiếu tầng 1 thì không", () => {
  const co = [{ building_key: "bld_T", ten: ["T1"], ma_cu: false, s16: true, so_tang_s16: 5, tang_s16: ["1", "02", "3", "4", "5"] }];
  const s09 = (tang) => [{ toa_id: "t", ten: "T1", so_tang: tang.length, tang }];
  // S09 kê từ tầng 2, S16 có căn tầng 1: không lệch (24 trong 29 toà thật ở bảng phủ ca).
  assert.equal(xetToa(s09(["2", "3", "4", "5", "6"]), co)[0].loai, "bi_danh", "chỉ thiếu tầng 1 mà lên thẻ");
  // S09 đặt tên tầng tránh số («3A» thay «4»): S16 có căn tầng 4 không có trong S09 → thẻ.
  const r = xetToa(s09(["2", "3", "3A", "5", "6"]), co)[0];
  assert.equal(r.loai, "the", "S16 có căn ở tầng S09 không kê mà vẫn thành bí danh");
  assert.equal(r.ly_do, "lech-tang-s16");
});

test("DA42-AC-5 ngưỡng tầng: một chiều, đúng 2 không lệch, 3 lệch, thiếu số trả null", () => {
  assert.equal(lechTangS16(28, 30), false, "S09 ít hơn đúng 2");
  assert.equal(lechTangS16(27, 30), true, "S09 ít hơn 3");
  assert.equal(lechTangS16(33, 30), false, "S09 nhiều hơn 3 không phải lệch");
  assert.equal(lechTangS16(0, 30), null);
  assert.equal(lechTangS16(30, null), null);
  assert.equal(lechTangS16({ so: null, ten: ["2", "3"] }, { so: null, ten: ["02", "3"] }), false, "«02» và «2» là một tầng");
  assert.equal(lechTangS16({ so: null, ten: ["2", "3"] }, { so: null, ten: ["1", "2"] }), false, "tầng 1 không đem so");
  assert.equal(lechTangS16({ so: null, ten: ["2", "3"] }, { so: null, ten: ["12b"] }), true);
  assert.equal(chuanTenTang(" 12b "), "12B"); assert.equal(chuanTenTang("0"), "0"); assert.equal(chuanTenTang(""), null);
  assert.ok(TANG_KHONG_SO.has("1"));
});
