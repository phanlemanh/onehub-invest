// ghep-tin-truc-can.test.mjs — PL36 ghep-tin-vao-truc-can: ma trận hàm gắn trục, căn (AC-1, AC-2, AC-3).
// GHEP_CAN_LIB trỏ bản đột biến để probes/ham-gan.sh chứng minh từng ca biết đỏ.
// Tên toà, mã căn lấy nguyên văn từ danh bạ và bài S03 thật trên DB máy thu (đo 24/11); khoá rút gọn để đọc được.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const lib = await import(process.env.GHEP_CAN_LIB ? pathToFileURL(process.env.GHEP_CAN_LIB).href : "../lib/ghep-tin-truc-can.mjs");
const { RULE, TAT_CA_NGUON, chuanTang, khoaBiDanh, khoaGiaTriBiDanh, maTrongChu, subId, tachMa, xetBai } = lib;

// Danh bạ Ocean Park 1 (một phần): toà R1.01 và R1.05 cùng cụm R1 (R1.01 là tên toà, không phải R1 + trục 01); LD2, LD3 không cụm.
const TEN_OP1 = [
  { ten: "R1.01", key: "bld_r101" }, { ten: "R1.05", key: "bld_r105" }, { ten: "S2.09", key: "bld_s209" },
  { ten: "LD2", key: "bld_ld2" }, { ten: "Ld2", key: "bld_ld2" }, { ten: "LD3", key: "bld_ld3" }, { ten: "BE6", key: "bld_be6" },
  { ten: "S1", key: "bld_s1_trung" }, { ten: "S1.05", key: "bld_s105" },
];
const mapOf = (o) => new Map(Object.entries(o).map(([k, v]) => [k, v instanceof Map ? v : new Map(Object.entries(v))]));
const OP1 = {
  tenToa: TEN_OP1,
  // số trục chuẩn (bỏ số 0 đầu) → stack_key; trục 3 của LD3 cùng số với trục 3 của LD2 nhưng khác toà
  truc: mapOf({ bld_ld2: { 3: ["stk_ld2_03"], 11: ["stk_ld2_11"] }, bld_ld3: { 3: ["stk_ld3_03"], 2: ["stk_ld3_02"] },
    bld_s209: { 10: ["stk_s209_10"] }, bld_r105: { 16: ["stk_r105_16"] }, bld_s105: { 10: ["stk_s105_10"] } }),
  can: mapOf({ stk_s209_10: { 17: ["unt_s209_1710"] }, stk_ld2_03: { 12: ["unt_ld2_1203"], 15: ["unt_a", "unt_b"] },
    stk_r105_16: { 27: ["unt_r105_2716"] }, stk_ld3_02: { 7: ["unt_ld3_0702"], 9: ["unt_ld3_0902"] }, stk_s105_10: {} }),
  biDanh: new Map([[khoaBiDanh("S1.05", "17", "10"), ["unt_s105_1710_s16"]], [khoaBiDanh("LD2", "20", "03"), ["unt_x", "unt_y"]]]),
};
// Grand Park: S2.05 của The Rainbow, ghi mã có dấu ngăn «S2.05.24.17».
const GP = {
  tenToa: [{ ten: "S2.05", key: "bld_gp_s205" }, { ten: "S5.03", key: "bld_gp_s503" }],
  truc: mapOf({ bld_gp_s205: { 17: ["stk_gp_s205_17"] }, bld_gp_s503: { 6: ["stk_gp_s503_06"] } }),
  can: mapOf({ stk_gp_s205_17: { 24: ["unt_gp_s205_2417"] }, stk_gp_s503_06: { 22: ["unt_gp_s503_2206"] } }),
  biDanh: new Map(),
};

const moiO = (ten, vao, mong, d = OP1) => test(ten, () => {
  const kq = xetBai(vao, d, { nguonBat: TAT_CA_NGUON });
  for (const [k, v] of Object.entries(mong)) assert.deepEqual(kq[k], v, `ô «${ten}»: ${k} = ${JSON.stringify(kq[k])}, cần ${JSON.stringify(v)}`);
});

// AC-1 — đọc mã căn
moiO("ma-dang-truc", { toa: "bld_ld2", ma: ["LD2XX03"] }, { muc: "truc", stack: "stk_ld2_03", rule_id: RULE.truc });
moiO("ma-dang-tang-can", { toa: "bld_s209", ma: ["S2.091710"] }, { muc: "can", stack: "stk_s209_10", tang: "17", unit: "unt_s209_1710", rule_id: RULE.ma });
moiO("ma-co-dau-ngan-gp-tu-chu-bai", { toa: "bld_gp_s205", chu: "Cho thuê căn 3PN toà S2.05.24.17 full nội thất" },
  { muc: "can", stack: "stk_gp_s205_17", tang: "24", unit: "unt_gp_s205_2417", rule_id: RULE.ma }, GP);
moiO("ma-gach-ngang-gp-tu-chu-bai", { toa: "bld_gp_s503", chu: "🌻Mã căn: S5.03-22.06 🌻Loại căn: 2pn" }, { muc: "can", unit: "unt_gp_s503_2206" }, GP);
moiO("tang-che-mot-phan", { toa: "bld_ld2", ma: ["LD22X03"] }, { muc: "truc", stack: "stk_ld2_03", tang: null, rule_id: RULE.truc });
test("tầng che một phần có dấu chấm (BE3.1x13)", () => {
  assert.deepEqual(tachMa("BE3.1x13", [{ ten: "BE3", key: "k" }]), { toa: "k", tenToa: "BE3", tang: null, truc: "13", dang: "truc" });
});
moiO("toa-lech", { toa: "bld_ld2", ma: ["LD3XX03"] }, { ly_do: "toa-lech" });
moiO("ma-khong-toa", { toa: "bld_ld2", ma: ["0x18"] }, { ly_do: "ma-khong-toa" });
moiO("ma-la", { toa: "bld_be6", ma: ["be601.s13"] }, { ly_do: "ma-la" });
moiO("ma-nhieu", { toa: "bld_ld2", ma: ["LD2XX03", "LD2XX11"] }, { ly_do: "ma-nhieu" });
moiO("bai-nhieu-can", { toa: "bld_ld2", ma: ["LD2XX03"], chu: "Quỹ căn LD2xx03, sẵn 8 căn giá tốt" }, { ly_do: "bai-nhieu-can" });
moiO("khong-ma", { toa: "bld_ld2", chu: "Cho thuê 2PN LD2 full đồ" }, { ly_do: "khong-ma" });
test("R1.01 là tên toà, không tách thành R1 + trục 01 (quy ước Mã căn, bài 11543)", () => {
  assert.deepEqual(tachMa("R1.052716", TEN_OP1), { toa: "bld_r105", tenToa: "R1.05", tang: "27", truc: "16", dang: "tang-can" });
  assert.equal(tachMa("R1.01XX05", TEN_OP1).toa, "bld_r101", "R1.01XX05 phải khớp toà R1.01");
  assert.equal(tachMa("S1.051710", TEN_OP1).toa, "bld_s105", "tên dài nhất S1.05 thắng toà trùng tên S1");
});
test("diện tích và mã tin sàn không phải mã căn trong chữ bài", () => {
  assert.deepEqual(maTrongChu("Cho thuê 2PN 67m2 S10.07 67 FULL, mã NTL02362", [{ ten: "S10.07", key: "k" }]), []);
});

// AC-2 — trục trong danh bạ
moiO("truc-so-0-dau", { toa: "bld_ld3", ma: ["LD3.0702"] }, { muc: "can", stack: "stk_ld3_02", unit: "unt_ld3_0702" });
moiO("truc-ngoai-danh-ba", { toa: "bld_ld2", ma: ["LD2XX19"] }, { ly_do: "truc-ngoai-danh-ba" });
moiO("truc-cung-so-toa-khac-khong-chon", { toa: "bld_ld3", ma: ["LD3XX03"] }, { muc: "truc", stack: "stk_ld3_03" });

// AC-3 — căn và tầng
moiO("truc-va-tang-chu-bai", { toa: "bld_ld2", ma: ["LD2xx03"], tangChu: ["12"] }, { muc: "can", unit: "unt_ld2_1203", rule_id: RULE.trucTang, tangTuMa: null });
moiO("can-ngoai-danh-ba", { toa: "bld_s209", ma: ["S2.092210"] }, { muc: "truc", stack: "stk_s209_10", ly_do: "can-ngoai-danh-ba" });
moiO("tang-lech", { toa: "bld_s209", ma: ["S2.091710"], tangChu: ["21"] }, { muc: "truc", ly_do: "tang-lech", tangTuMa: null });
moiO("chi-tang-tu-ma", { toa: "bld_r105", ma: ["R1.052716"] }, { muc: "can", unit: "unt_r105_2716", tangTuMa: "27" });
// Hai cách viết tầng khác nhau (finding S4 r2): mã ghi «09», chữ bài ghi «9» — phải khớp, ra căn tầng 9, không tang-lech.
moiO("tang-09-khop-9", { toa: "bld_ld3", ma: ["LD3.0902"], tangChu: ["9"] }, { muc: "can", unit: "unt_ld3_0902", ly_do: undefined, tangTuMa: null });
moiO("tang-12a-khong-can-sai-tang", { toa: "bld_s209", ma: ["S2.0912A10"] }, { muc: "truc", ly_do: "can-ngoai-danh-ba" });
moiO("bi-danh-khop-mot-can", { toa: "bld_s105", ma: ["S1.051710"] }, { muc: "can", unit: "unt_s105_1710_s16" });
moiO("bi-danh-hai-can", { toa: "bld_ld2", ma: ["LD2.2003"] }, { muc: "truc", ly_do: "bi-danh-mo-ho" });
moiO("hai-can-cung-truc-tang", { toa: "bld_ld2", ma: ["LD2.1503"] }, { muc: "truc", ly_do: "bi-danh-mo-ho" });
test("tầng chuẩn và giá trị SubId", () => {
  assert.equal(chuanTang("09"), "9"); assert.equal(chuanTang("12a"), "12A"); assert.equal(chuanTang("tầng 7"), "7"); assert.equal(chuanTang("cao"), null);
  assert.equal(subId({ stack: "stk_x", muc: "can", tang: "9" }), "stk_x:9");
  assert.equal(subId({ stack: "stk_x", muc: "truc", tang: null }), "stk_x:*");
  assert.equal(khoaGiaTriBiDanh("vinhomes-grand-park/S6.0220.08"), khoaBiDanh("S6.02", "20", "8"));
});
test("tắt một nguồn thì bài của nguồn đó không gắn", () => {
  assert.equal(xetBai({ toa: "bld_ld2", ma: ["LD2XX03"] }, OP1, { nguonBat: [RULE.ma] }).ly_do, "nguon-tat");
});
