// s09-danh-ba-can.test.mjs — DA42: ma trận viết trước cho luật dự án bốn đường (AC-3) và luật toà (AC-4, AC-5). Không DB.
// Tên dự án, toà trong fixture là tên giả.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DUONG, MA_TOA, demToa, lechTangS16, phanLopDuAn, xetToa } from "./s09-danh-ba-can.mjs";

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
  assert.deepEqual(demToa(kq), { da_noi: 1, bi_danh: 2, tao_moi: 1, the: 3, khong_so: 0,
    the_theo_ly_do: { "khop-hai": 1, "trung-ten-trong-du-an": 2 } });
});

test("DA42-AC-5 toà S16: tầng khớp thành bí danh, lệch quá 2 lên thẻ (hai toà cùng tên), không so được thành bí danh đếm riêng", () => {
  const kq = xetToa([
    { toa_id: "a1", ten: "A1", so_tang: 27 },  // 27 vs 25: khớp
    { toa_id: "a1b", ten: "S1.01", so_tang: 34 }, // 34 vs 30: lệch 4
    { toa_id: "a2", ten: "A2", so_tang: 18 },  // S16 không có số tầng
  ], TOA_CO);
  const theo = Object.fromEntries(kq.map((x) => [x.toa_id, x]));
  assert.equal(theo.a1.loai, "bi_danh");
  assert.equal(theo.a1b.loai, "the", "hai toà cùng tên: lệch tầng mà vẫn thành bí danh");
  assert.equal(theo.a1b.ly_do, "lech-tang-s16");
  assert.equal(theo.a2.loai, "bi_danh"); assert.equal(theo.a2.khong_so, true);
  assert.equal(demToa(kq).khong_so, 1);
});

test("DA42-AC-5 ngưỡng tầng: đúng 2 không lệch, 3 lệch, thiếu số trả null", () => {
  assert.equal(lechTangS16(32, 30), false);
  assert.equal(lechTangS16(33, 30), true);
  assert.equal(lechTangS16(27, 30), true);
  assert.equal(lechTangS16(0, 30), null);
  assert.equal(lechTangS16(30, null), null);
});
