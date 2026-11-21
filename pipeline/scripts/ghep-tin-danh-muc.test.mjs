// ghep-tin-danh-muc.test.mjs — PL20 ghep-tin-vao-danh-muc: ma trận hàm gắn (AC-1, AC-2, AC-3, phần gộp của AC-5).
// GHEP_LIB trỏ bản đột biến để probes/ham-gan.sh chứng minh từng ca biết đỏ.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const lib = await import(process.env.GHEP_LIB ? pathToFileURL(process.env.GHEP_LIB).href : "../lib/ghep-tin-danh-muc.mjs");
const { NGUON_BAT, RULE, TAT_CA_NGUON, dungDanhBa, gopTin, xetBai, xetTin } = lib;

// Tên lấy từ danh bạ thật của hai khu; khoá rút gọn để đọc được.
const OP1 = dungDanhBa({
  toa: [
    { key: "bld_s101", upi: "urn:s101", vung_id: 101, ten: ["S1.01"] },
    { key: "bld_s102", upi: "urn:s102", vung_id: 101, ten: ["S1.02"] },
    { key: "bld_s205", upi: "urn:s205", vung_id: 102, ten: ["S2.05"] },
    { key: "bld_tr1", upi: "urn:tr1", vung_id: 103, ten: ["TR9"] },
    { key: "bld_tr2", upi: "urn:tr2", vung_id: 103, ten: ["TR9"] },
    { key: "bld_goc", upi: "urn:goc", vung_id: null, ten: ["A", "GOC1"] },
  ],
  vung: [
    { id: 101, cha_id: null, ten: ["Sapphire 1"] },
    { id: 102, cha_id: null, ten: ["Sapphire 2"] },
    { id: 103, cha_id: null, ten: ["Zenpark"] },
    { id: 104, cha_id: 101, ten: ["Sapphire 1 Dong"] },
  ],
});
const GP = dungDanhBa({
  toa: [{ key: "bld_gp_s1", upi: "urn:gp-s1", vung_id: 201, ten: ["S1.01"] }],
  vung: [{ id: 201, cha_id: null, ten: ["Origami"] }],
});
const oDoc = (v, trich, them = {}) => ({ v, cc: "chu_bai", trich, trich_ok: true, ...them });
const banDoc = (o) => ({ label_id: "9", model: "m", ...o });
const bai = (o) => ({ cot: [], chu: "", banDoc: null, ...o });

const moiO = (ten, vao, mong, d = OP1) => test(ten, () => {
  const kq = xetBai(bai(vao), d, { nguonBat: TAT_CA_NGUON });
  for (const [k, v] of Object.entries(mong)) assert.equal(kq[k], v, `ô «${ten}»: ${k} = ${kq[k]}, cần ${v}`);
});

// AC-1 — ô tên toà
moiO("cot-khop-dung", { cot: ["S1.02"] }, { nguon: "A", muc: "toa", k: "bld_s102", rule_id: RULE.cot });
moiO("cot-khop-sau-chuan-hoa", { cot: ["S102"] }, { nguon: "B", muc: "toa", k: "bld_s102", rule_id: RULE.cotChuan });
moiO("cot-mo-ho", { cot: ["TR9"] }, { ly_do: "mo-ho" });
moiO("cot-khop-vung", { cot: ["Zenpark"] }, { nguon: "A", muc: "vung", k: 103 });
moiO("cot-ngoai-danh-ba", { cot: ["H9"] }, { ly_do: "ngoai-danh-ba" });
moiO("cot-khop-nhung-chu-neu-hai-toa", { cot: ["S1.02"], chu: "Bán căn S1.02 và S2.05 giá tốt" }, { ly_do: "chu-nhieu-toa" });
moiO("cot-khop-nhung-model-bao-nhieu-can", { cot: ["S1.02"], banDoc: banDoc({ multi_unit: { v: "yes" } }) }, { ly_do: "bai-nhieu-can" });
moiO("cot-mo-ho-khong-roi-xuong-chu-bai", { cot: ["TR9"], chu: "Căn đẹp toà S1.02", banDoc: banDoc({ building: oDoc("S1.02", "toà S1.02") }) }, { ly_do: "mo-ho" });
moiO("cot-ngoai-khong-roi-xuong-chu-bai", { cot: ["H9"], chu: "Căn đẹp toà S1.02", banDoc: banDoc({ building: oDoc("S1.02", "toà S1.02") }) }, { ly_do: "ngoai-danh-ba" });
moiO("hai-gia-tri-cot-chi-hai-toa", { cot: ["S1.02", "S2.05"] }, { ly_do: "mo-ho" });

// AC-2 — đúng dự án
test("ma-trung-giua-hai-du-an", () => {
  assert.equal(xetBai(bai({ cot: ["S1.01"] }), OP1).k, "bld_s101", "mã S1.01 ở dự án OP1");
  assert.equal(xetBai(bai({ cot: ["S1.01"] }), GP).k, "bld_gp_s1", "mã S1.01 ở dự án GP");
});
const docBai = () => bai({ cot: ["S1.02"] });
const hai = new Map([["1", OP1], ["16", GP]]);
for (const [ten, tin, ly] of [
  ["tin-khu-khac", { du_an: "7", property_type: "apartment", post_ids: ["p"] }, "ngoai-pham-vi"],
  ["tin-chua-co-du-an", { du_an: null, property_type: "apartment", post_ids: ["p"] }, "chua-co-du-an"],
  ["tin-khong-phai-can-ho", { du_an: "1", property_type: "house", post_ids: ["p"] }, "khong-phai-can-ho"],
]) test(ten, () => {
  const kq = xetTin(tin, docBai, hai);
  assert.equal(kq.ly_do, ly, `ô «${ten}»`);
  assert.equal(kq.bai.size, 0, `ô «${ten}» không được sinh kết quả bài`);
});
test("ma-trung-qua-xet-tin-theo-du-an-cua-tin", () => {
  const kq = xetTin({ du_an: "16", property_type: "apartment", post_ids: ["p"] }, () => bai({ cot: ["S1.01"] }), hai);
  assert.equal(kq.gop.k, "bld_gp_s1", "mã S1.01 của tin dự án 16 phải ra toà của dự án 16, không phải dự án 1");
});
test("tin-trong-pham-vi-doi-chung-duong", () => {
  const kq = xetTin({ du_an: "1", property_type: "apartment", post_ids: ["p"] }, docBai, hai);
  assert.equal(kq.gop.status, "gan");
  assert.equal(kq.gop.k, "bld_s102");
});

// AC-3 — chữ bài × bản đọc
moiO("luat-va-model-cung-toa", { chu: "Bán căn toà S1.02", banDoc: banDoc({ building: oDoc("S1.02", "toà S1.02") }) }, { nguon: "C", muc: "toa", k: "bld_s102", rule_id: RULE.chuModel });
moiO("luat-va-model-khac-toa", { chu: "Bán căn toà S1.02", banDoc: banDoc({ building: oDoc("S2.05", "toà S1.02") }) }, { ly_do: "chu-model-khac" });
moiO("luat-doc-duoc-model-chua-doc", { chu: "Bán căn toà S1.02" }, { ly_do: "chi-luat" });
moiO("model-mot-minh-ten-trong-trich", { chu: "Bán căn tòa S1 . 02 view đẹp", banDoc: banDoc({ building: oDoc("S1.02", "tòa S1 . 02") }) }, { nguon: "D", muc: "toa", k: "bld_s102", rule_id: RULE.model });
moiO("model-mot-minh-ten-ngoai-trich", { chu: "Bán căn view hồ đẹp", banDoc: banDoc({ building: oDoc("S1.02", "view hồ đẹp") }) }, { ly_do: "trich-khong-co-ten" });
moiO("luat-va-model-cung-vung", { chu: "Bán căn Zenpark", banDoc: banDoc({ subzone: oDoc("Zenpark", "căn Zenpark") }) }, { nguon: "F", muc: "vung", k: 103, rule_id: RULE.chuModel });
moiO("model-mot-minh-vung-ten-trong-trich", { chu: "Bán căn khu Zen-park đẹp", banDoc: banDoc({ subzone: oDoc("Zenpark", "khu Zen-park") }) }, { nguon: "G", muc: "vung", k: 103, rule_id: RULE.model });
moiO("model-mot-minh-vung-ten-ngoai-trich", { chu: "Bán căn đẹp", banDoc: banDoc({ subzone: oDoc("Zenpark", "căn đẹp") }) }, { ly_do: "trich-khong-co-ten" });
moiO("can-cu-kien-thuc-nghe-coi-nhu-chua-doc", { chu: "Bán căn toà S1.02", banDoc: banDoc({ building: oDoc("S1.02", "toà S1.02", { cc: "kien_thuc_nghe" }) }) }, { ly_do: "chi-luat" });
moiO("doan-trich-chua-kiem-coi-nhu-chua-doc", { chu: "Bán căn đẹp", banDoc: banDoc({ building: oDoc("S1.02", "S1.02", { trich_ok: false }) }) }, { ly_do: "khong-neu" });
moiO("khong-neu-gi", { chu: "Bán căn đẹp giá tốt" }, { ly_do: "khong-neu" });

// Review Focus
moiO("bai-chi-co-anh-chu-null", { chu: null }, { ly_do: "khong-neu" });
moiO("bai-chi-co-anh-van-xet-o-ten-toa", { chu: null, cot: ["S1.02"] }, { nguon: "A" });
moiO("o-model-v-khong-phai-chuoi", { chu: "Bán căn đẹp", banDoc: banDoc({ building: oDoc(102, "S1.02") }) }, { ly_do: "khong-neu" });
moiO("o-model-trich-rong", { chu: "Bán căn đẹp", banDoc: banDoc({ building: oDoc("S1.02", "") }) }, { ly_do: "trich-khong-co-ten" });
moiO("ten-danh-ba-mot-ky-tu-khong-khop", { chu: "Căn hộ A view đẹp" }, { ly_do: "khong-neu" });

// Căn cứ ghi kèm
test("can-cu-cua-tung-nguon", () => {
  assert.deepEqual(xetBai(bai({ cot: ["S1.02"] }), OP1).can_cu, { nguon: "cot", ten: "S1.02" });
  assert.deepEqual(xetBai(bai({ cot: ["S102"] }), OP1).can_cu, { nguon: "cot", ten: "S102", ten_chuan: "S1.02" });
  const c = xetBai(bai({ chu: "toà S1.02", banDoc: banDoc({ building: oDoc("S1.02", "toà S1.02") }) }), OP1).can_cu;
  assert.deepEqual(c, { nguon: "chu-model", ten: "S1.02", label_id: "9", trich: "toà S1.02" });
  const d = xetBai(bai({ chu: "tòa S1 . 02", banDoc: banDoc({ building: oDoc("S1.02", "tòa S1 . 02") }) }), OP1, { nguonBat: TAT_CA_NGUON }).can_cu;
  assert.deepEqual(d, { nguon: "model", ten: "S1.02", label_id: "9", model: "m", trich: "tòa S1 . 02" });
});

// Tắt một nguồn
test("mac-dinh-nguon-chi-co-model-dang-tat", () => {
  assert.equal(NGUON_BAT.includes(RULE.model), false, "nguồn D, G phải tắt ở hàng này");
  const kq = xetBai(bai({ chu: "Bán căn tòa S1 . 02", banDoc: banDoc({ building: oDoc("S1.02", "tòa S1 . 02") }) }), OP1);
  assert.equal(kq.ly_do, "nguon-tat");
});
test("nguon-tat-khong-gan", () => {
  const kq = xetBai(bai({ cot: ["S1.02"] }), OP1, { nguonBat: [RULE.model] });
  assert.equal(kq.ly_do, "nguon-tat");
});

// Phần gộp của AC-5
// Tên trùng toà và vùng: ở OP1, «S1», «S2» là phân khu nhưng danh bạ còn hai dòng toà cùng tên treo thẳng dưới dự án.
// Luật phải cho cùng kết quả khi hai dòng đó còn và khi đã được gỡ.
const toaThat = [
  { key: "bld_s101", upi: "urn:s101", vung_id: 41, ten: ["S1.01"] },
  { key: "bld_s205", upi: "urn:s205", vung_id: 42, ten: ["S2.05"] },
];
const vungS = [{ id: 41, cha_id: null, ten: ["S1"] }, { id: 42, cha_id: null, ten: ["S2"] }];
const CON_DONG_TOA = dungDanhBa({
  toa: [...toaThat, { key: "bld_gia_s1", upi: "urn:gia1", vung_id: null, ten: ["S1"] }, { key: "bld_gia_s2", upi: "urn:gia2", vung_id: null, ten: ["S2"] }],
  vung: vungS,
});
const DA_GO_DONG_TOA = dungDanhBa({ toa: toaThat, vung: vungS });

moiO("trung-ten-toa-vung-o-cot-gan-muc-vung", { cot: ["S1"] }, { nguon: "A", muc: "vung", k: 41, rule_id: RULE.cot }, CON_DONG_TOA);
moiO("trung-ten-toa-vung-ma-can-la-gan-muc-vung", { cot: ["S1.99"] }, { nguon: "B", muc: "vung", k: 41 }, CON_DONG_TOA);
moiO("trung-ten-khong-dem-la-toa-thu-hai-trong-chu", { chu: "Bán căn S1.01 khu S1" }, { ly_do: "chi-luat" }, CON_DONG_TOA);
moiO("hai-vung-trung-ten-khong-dem-la-hai-toa", { chu: "Có căn ở S1 và S2" }, { ly_do: "chu-nhieu-vung" }, CON_DONG_TOA);
moiO("ten-toa-rieng-van-gan-muc-toa", { cot: ["S1.01"] }, { nguon: "A", muc: "toa", k: "bld_s101" }, CON_DONG_TOA);

// Đuôi mã căn chỉ đi sau tên toà. «S1006» là toà S10.06, không phải vùng S1 cộng đuôi 006, dù model cũng đọc nhầm ra S1.
test("ma-dinh-so-khong-doc-ra-vung-ngan", () => {
  const kq = xetBai(bai({ chu: "Bán 1pn+ S1006 giá tốt", banDoc: banDoc({ building: oDoc("S1", "S1006"), subzone: oDoc("S1", "S1006") }) }), CON_DONG_TOA);
  assert.equal(kq.muc, undefined, `không được gắn, nhận ${kq.muc}:${kq.k}`);
  assert.equal(kq.ly_do, "nguon-tat");
});
moiO("ma-can-co-dau-sau-ten-toa-van-doc-ra-toa", { chu: "Bán căn S1.01.1508", banDoc: banDoc({ building: oDoc("S1.01", "S1.01.1508") }) }, { nguon: "C", muc: "toa", k: "bld_s101" }, CON_DONG_TOA);
moiO("ma-can-dinh-lien-sau-ten-toa-van-doc-ra-toa", { chu: "Bán căn S1.011508", banDoc: banDoc({ building: oDoc("S1.01", "S1.011508") }) }, { nguon: "C", muc: "toa", k: "bld_s101" }, CON_DONG_TOA);
moiO("ten-vung-dung-rieng-van-doc-ra-vung", { chu: "Bán căn khu S1 giá tốt", banDoc: banDoc({ subzone: oDoc("S1", "khu S1") }) }, { nguon: "F", muc: "vung", k: 41 }, CON_DONG_TOA);

for (const [ten, vao] of [
  ["o-cot", { cot: ["S1"] }],
  ["o-cot-ma-can-la", { cot: ["S2.99"] }],
  ["chu-va-model-cung-vung", { chu: "Bán căn khu S1 giá tốt", banDoc: banDoc({ subzone: oDoc("S1", "khu S1") }) }],
  ["model-ghi-vao-o-toa", { chu: "Bán căn khu S1 giá tốt", banDoc: banDoc({ building: oDoc("S1", "khu S1") }) }],
  ["chu-mot-toa-mot-vung", { chu: "Bán căn S1.01 khu S1" }],
  ["chu-hai-vung", { chu: "Có căn ở S1 và S2" }],
]) test(`trung-ten-cung-ket-qua-khi-con-va-da-go-dong-toa: ${ten}`, () => {
  assert.deepEqual(xetBai(bai(vao), CON_DONG_TOA, { nguonBat: TAT_CA_NGUON }), xetBai(bai(vao), DA_GO_DONG_TOA, { nguonBat: TAT_CA_NGUON }));
});

// Trùng tên mà không phải đúng một toà với đúng một vùng thì vẫn là mơ hồ, theo bước 4 của thiết kế.
const MOT_TOA_HAI_VUNG = dungDanhBa({
  toa: [{ key: "bld_x", upi: "urn:x", vung_id: null, ten: ["X9"] }],
  vung: [{ id: 1, cha_id: null, ten: ["X9"] }, { id: 2, cha_id: null, ten: ["X9"] }],
});
const HAI_TOA_MOT_VUNG = dungDanhBa({
  toa: [{ key: "bld_x", upi: "urn:x", vung_id: null, ten: ["X9"] }, { key: "bld_y", upi: "urn:y", vung_id: null, ten: ["X9"] }],
  vung: [{ id: 1, cha_id: null, ten: ["X9"] }],
});
moiO("mot-toa-hai-vung-trung-ten-la-mo-ho", { cot: ["X9"] }, { ly_do: "mo-ho" }, MOT_TOA_HAI_VUNG);
moiO("mot-toa-hai-vung-ma-can-la-mo-ho", { cot: ["X9.99"] }, { ly_do: "mo-ho" }, MOT_TOA_HAI_VUNG);
moiO("hai-toa-mot-vung-trung-ten-la-mo-ho", { cot: ["X9"] }, { ly_do: "mo-ho" }, HAI_TOA_MOT_VUNG);

const T = (k) => ({ muc: "toa", k });
const V = (k) => ({ muc: "vung", k });

// Luật đi theo cây danh bạ, không biết id nút cụ thể: khi danh bạ nối phân khu chứa toà vào phân khu cùng tên S1, kết quả tự đúng.
const canhCay = (cha) => dungDanhBa({
  toa: [{ key: "bld_s105", upi: "urn:s105", vung_id: 394, ten: ["S1.05"] }],
  vung: [{ id: 41, cha_id: null, ten: ["S1"] }, { id: 394, cha_id: cha, ten: ["The Sapphire 1"] }],
});
test("gop-toa-va-phan-khu-chua-noi-thi-xung-dot", () => assert.equal(gopTin([T("bld_s105"), V(41)], canhCay(null)).status, "xung_dot"));
test("gop-toa-va-phan-khu-da-noi-ra-muc-toa", () => assert.deepEqual(gopTin([T("bld_s105"), V(41)], canhCay(41)), { status: "gan", muc: "toa", k: "bld_s105" }));
for (const [ten, ds, mong] of [
  ["gop-hai-toa-khac-nhau", [T("bld_s101"), T("bld_s205")], { status: "xung_dot" }],
  ["gop-toa-va-vung-chua-no", [T("bld_s102"), V(101)], { status: "gan", muc: "toa", k: "bld_s102" }],
  ["gop-toa-va-vung-khong-chua-no", [T("bld_s102"), V(103)], { status: "xung_dot" }],
  ["gop-hai-vung-khong-long-nhau", [V(101), V(103)], { status: "xung_dot" }],
  ["gop-hai-nguon-cung-toa", [T("bld_s102"), T("bld_s102")], { status: "gan", muc: "toa", k: "bld_s102" }],
  ["gop-hai-vung-long-nhau-lay-vung-sau", [V(101), V(104)], { status: "gan", muc: "vung", k: 104 }],
  ["gop-toa-khong-co-vung-va-mot-vung", [T("bld_goc"), V(101)], { status: "xung_dot" }],
  ["gop-khong-co-gi", [{ ly_do: "khong-neu" }], { status: "chua_gan" }],
]) test(ten, () => {
  const kq = gopTin(ds, OP1);
  for (const [k, v] of Object.entries(mong)) assert.equal(kq[k], v, `ô «${ten}»: ${k} = ${kq[k]}, cần ${v}`);
});

// Vòng 2 AC-9 (21/11). (b) Tên dài nhất thắng, chữ «The» đầu tên được bỏ: bài #12274 «Beverly Solari» bị gắn The Beverly.
// (a) Bài rao nhiều căn không gắn ở mọi nguồn, đọc trên chữ còn dấu: bài #12295 «LBV – MCP sẵn 8 căn», model báo không nhiều căn.
const GP2 = dungDanhBa({
  toa: [],
  vung: [
    { id: 23, cha_id: null, ten: ["The Beverly", "Beverly"] },
    { id: 387, cha_id: null, ten: ["The Beverly Solari"] },
    { id: 21, cha_id: null, ten: ["Lumiere Boulevard", "LBV"] },
  ],
});
const vungModel = (v, trich) => banDoc({ subzone: oDoc(v, trich) });
moiO("ten-dai-beverly-solari-khong-roi-ve-beverly", { chu: "Giá tốt Beverly Solari 1PN+ 46,7m2", banDoc: vungModel("The Beverly", "Giá tốt Beverly Solari") },
  { ly_do: "chu-model-khac" }, GP2);
moiO("ten-ngan-beverly-mot-minh-van-gan", { chu: "Bán căn Beverly 2PN view hồ", banDoc: vungModel("The Beverly", "Bán căn Beverly 2PN") },
  { nguon: "F", muc: "vung", k: 23 }, GP2);
moiO("chu-the-dau-ten-duoc-bo", { chu: "Cần bán Beverly Solari 1PN", banDoc: vungModel("The Beverly Solari", "Cần bán Beverly Solari") },
  { nguon: "F", muc: "vung", k: 387 }, GP2);
moiO("nhieu-can-so-dem", { chu: "LBV – MCP SẴN 8 CĂN CHO THUÊ 2PN FULL", banDoc: vungModel("Lumière Boulevard", "LBV – MCP SẴN 8 CĂN") },
  { ly_do: "bai-nhieu-can" }, GP2);
moiO("nhieu-can-hai-can", { chu: "Bán 2 căn liền kề Lumiere Boulevard", banDoc: vungModel("Lumiere Boulevard", "Bán 2 căn liền kề Lumiere Boulevard") },
  { ly_do: "bai-nhieu-can" }, GP2);
moiO("nhieu-can-chu-nhieu", { chu: "Có nhiều căn Lumiere Boulevard cho thuê", banDoc: vungModel("Lumiere Boulevard", "nhiều căn Lumiere Boulevard") },
  { ly_do: "bai-nhieu-can" }, GP2);
moiO("can-thu-2-can-ra-khong-phai-nhieu-can", { chu: "không có căn thứ 2 Cần ra gấp 2pn Lumiere Boulevard", banDoc: vungModel("Lumiere Boulevard", "2pn Lumiere Boulevard") },
  { nguon: "F", muc: "vung", k: 21 }, GP2);
moiO("nhieu-can-chan-ca-o-ten-toa", { cot: ["S1.02"], chu: "Sẵn 3 căn S1.02 giá tốt" }, { ly_do: "bai-nhieu-can" });
moiO("so-tang-va-ma-toa-truoc-chu-can-khong-phai-nhieu-can", { cot: ["S1.02"], chu: "toà S1.02 tầng 16 căn số 10, s1.02 căn 3n2wc" }, { nguon: "A", muc: "toa", k: "bld_s102" });
// Danh bạ còn hai nút «The Rainbow» và «Rainbow»: chữ «Rainbow» vẫn chỉ về nút «Rainbow», không thành nhiều vùng.
const GP3 = dungDanhBa({ toa: [], vung: [{ id: 48, cha_id: null, ten: ["The Rainbow"] }, { id: 389, cha_id: null, ten: ["Rainbow"] }] });
moiO("bo-the-khong-dung-ten-tran-cua-nut-khac", { chu: "Cho thuê 1PN+ Rainbow full", banDoc: vungModel("Rainbow", "1PN+ Rainbow") }, { nguon: "F", muc: "vung", k: 389 }, GP3);
moiO("ten-dai-the-rainbow-thang-rainbow", { chu: "Phân khu : The Rainbow 2PN", banDoc: vungModel("The Rainbow", "Phân khu : The Rainbow") }, { nguon: "F", muc: "vung", k: 48 }, GP3);
moiO("co-2-can-ban-khong-phai-nhieu-can", { cot: ["S1.02"], chu: "Ai có 2 cần bán gấp thì liên hệ, căn S1.02" }, { nguon: "A", muc: "toa", k: "bld_s102" });
