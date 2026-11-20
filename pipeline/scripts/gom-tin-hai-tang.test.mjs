// GT5 khoa-gom-hai-tang: hàm gom hai tầng — AC-2 (bản chữ), AC-3 (khoá có người), AC-4 (bản chữ thiếu trường), AC-5 (phân khu),
// AC-8 (dạng bài). Một assert mỗi ô. Chữ viết ngắn theo dạng bài thật (kho công khai: không chép chữ bài vào test).
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { gomHaiTang, nguoiDang, doGiong } from "../lib/gom-tin-hai-tang.mjs";
import { dungTuDien } from "../lib/gom-tin-phan-khu.mjs";
import { gatSo } from "../transform-zalo.mjs";

const TD = dungTuDien([
  { du_an: "16", name: "The Origami", aliases: [], bi_danh: ["ori"] },
  { du_an: "16", name: "The Rainbow", aliases: [], bi_danh: ["rb"] },
]);
let n = 0;
/** Một bài đã đọc. Mặc định: đủ mọi trường của khoá (pn, dt, phân khu Origami, mã S1006). */
function bai({ sender = "u1", text = "Bán căn Origami S1006 2pn 69m2 giá 3,2 tỷ full đồ", ngay = 1, kind = "sale", gia = 3.2e9, pn = 2, dt = 69, phones = [], dangBai, unit = null } = {}) {
  n++;
  return { kind, priceVnd: gia, pricePerm2Vnd: null, bedrooms: pn, areaM2: dt, unit, phones, dangBai,
    post: { post_id: `p${String(n).padStart(4, "0")}`, posted_at: new Date(Date.UTC(2026, 10, ngay, 8)).toISOString(), sender_id: sender, text } };
}
const gom = (ds, o = {}) => gomHaiTang(ds, { tuDien: TD, gatSo, ...o });
const soTin = (ds, o) => gom(ds, o).length;

// ---- AC-2: tầng một ----
test("GT5-AC-2 ô 1: cùng người cùng chữ → 1 tin", () => assert.equal(soTin([bai(), bai({ ngay: 2 })]), 1));
test("GT5-AC-2 ô 2: cùng người, chữ chỉ khác SĐT và link → 1 tin", () => assert.equal(soTin([
  bai({ text: "Bán căn Origami S1006 2pn 69m2 giá 3,2 tỷ lh 0912345678" }),
  bai({ text: "Bán căn Origami S1006 2pn 69m2 giá 3,2 tỷ lh 0987654321 https://x.y/z" })]), 1));
test("GT5-AC-2 ô 3: cùng người, chữ khác, trường khác (diện tích) → 2 tin", () =>
  assert.equal(soTin([bai(), bai({ text: "Bán căn Origami S1006 2pn 75m2 giá 3,2 tỷ", dt: 75 })]), 2));
test("GT5-AC-2 ô 4: khác người cùng chữ → 2 tin", () => assert.equal(soTin([bai({ sender: "u1" }), bai({ sender: "u2" })]), 2));
test("GT5-AC-2 ô 5: không sender, cùng SĐT → 1 tin; khác SĐT → 2 tin", () => {
  assert.equal(soTin([bai({ sender: null, phones: ["0912345678"] }), bai({ sender: null, phones: ["0912345678"] })]), 1);
  assert.equal(soTin([bai({ sender: null, phones: ["0912345678"] }), bai({ sender: null, phones: ["0987654321"] })]), 2);
});
test("GT5-AC-2 ô 6: không sender, không SĐT → mỗi bài một tin", () => assert.equal(soTin([bai({ sender: null }), bai({ sender: null })]), 2));
test("GT5-AC-2 sender chuỗi rỗng coi như vắng (rơi sang SĐT)", () => {
  assert.equal(nguoiDang({ phones: ["0912345678"] }, { sender_id: "" }), "phone:0912345678");
  assert.equal(soTin([bai({ sender: "", phones: ["0912345678"] }), bai({ sender: "  ", phones: ["0912345678"] })]), 1);
});

// ---- AC-3: tầng hai, khoá có người ----
const KHAC_MOT_TRUONG = [
  ["người", { sender: "u9" }],
  ["loại", { kind: "rent_lt", text: "Cho thuê căn Origami S1006 2pn 69m2 giá 3,2 tỷ" }],
  ["giá", { gia: 3.3e9, text: "Bán căn Origami S1006 2pn 69m2 giá 3,3 tỷ" }],
  ["số phòng", { pn: 3, text: "Bán căn Origami S1006 3pn 69m2 giá 3,2 tỷ" }],
  ["diện tích", { dt: 70, text: "Bán căn Origami S1006 2pn 70m2 giá 3,2 tỷ" }],
  ["phân khu", { text: "Bán căn Rainbow S1006 2pn 69m2 giá 3,2 tỷ" }],
  ["mã", { text: "Bán căn Origami S1007 2pn 69m2 giá 3,2 tỷ" }],
];
for (const [ten, khac] of KHAC_MOT_TRUONG) {
  test(`GT5-AC-3 khác đúng trường ${ten} → 2 tin`, () => assert.equal(soTin([bai(), bai(khac)]), 2, `trường ${ten}`));
}
test("GT5-AC-3 khớp đủ bảy trường, chữ khác nhau → 1 tin", () =>
  assert.equal(soTin([bai(), bai({ text: "Chính chủ bán Origami S1006, 2pn 69m2, giá 3,2 tỷ, nhà đẹp" })]), 1));
test("GT5-AC-3 nhánh đủ phường + diện tích vẫn có người: khác người cùng chữ → 2 tin", () =>
  assert.equal(soTin([bai({ sender: "u1" }), bai({ sender: "u2" })]), 2));

// ---- AC-4: bản chữ thiếu trường ----
const DU = "Bán căn Origami S1006 2pn 69m2 giá 3,2 tỷ full đồ view hồ";
const thieuDt = (o = {}) => bai({ text: "Bán căn Origami S1006 2pn giá 3,2 tỷ full đồ view hồ", dt: null, ...o });
test("GT5-AC-4 thiếu diện tích, đúng một ứng viên, chữ giống ≥ ngưỡng, trong 7 ngày → nhập", () => {
  const a = bai({ text: DU, ngay: 1 });
  const b = thieuDt({ ngay: 3 });
  assert.ok(doGiong(gatSo(a.post.text).toLowerCase(), "") >= 0); // hàm có mặt
  assert.equal(soTin([a, b], { nguongChu: 0.5 }), 1);
});
test("GT5-AC-4 chữ giống dưới ngưỡng → tin riêng", () => assert.equal(soTin([bai({ text: DU }), thieuDt()], { nguongChu: 0.99 }), 2));
test("GT5-AC-4 ngoài cửa sổ 7 ngày → tin riêng", () => assert.equal(soTin([bai({ text: DU, ngay: 1 }), thieuDt({ ngay: 9 })], { nguongChu: 0.5 }), 2));
test("GT5-AC-4 biên đúng 7 ngày → còn trong cửa sổ", () => assert.equal(soTin([bai({ text: DU, ngay: 1 }), thieuDt({ ngay: 8 })], { nguongChu: 0.5 }), 1));
test("GT5-AC-4 không ứng viên (người khác) → tin riêng", () => assert.equal(soTin([bai({ text: DU, sender: "u2" }), thieuDt()], { nguongChu: 0.5 }), 2));
test("GT5-AC-4 hai ứng viên → tin riêng, không bắc cầu hai tin đầy đủ", () => {
  const r = gom([bai({ text: DU, dt: 69 }), bai({ text: DU.replace("69m2", "75m2"), dt: 75 }), thieuDt()], { nguongChu: 0.5 });
  assert.equal(r.length, 3);
});
test("GT5-AC-4 thiếu số phòng / phân khu / mã cũng nhập theo cùng luật", () => {
  assert.equal(soTin([bai({ text: DU }), bai({ text: "Bán căn Origami S1006 69m2 giá 3,2 tỷ full đồ view hồ", pn: null })], { nguongChu: 0.5 }), 1, "thiếu số phòng");
  assert.equal(soTin([bai({ text: DU }), bai({ text: "Bán căn S1006 2pn 69m2 giá 3,2 tỷ full đồ view hồ" })], { nguongChu: 0.5 }), 1, "thiếu phân khu");
  assert.equal(soTin([bai({ text: DU }), bai({ text: "Bán căn Origami 2pn 69m2 giá 3,2 tỷ full đồ view hồ" })], { nguongChu: 0.5 }), 1, "thiếu mã");
});
test("GT5-AC-4 ngưỡng mặc định 0,3 (Hỏi-6 B, Mạnh 20/11) và cửa sổ mặc định 7 ngày", () => {
  // chữ giống hệt trừ phần thiếu (Jaccard 3-gram ≈ 0,64) → nhập ở ngưỡng mặc định; chữ khác hẳn (≈ 0,12) → tin riêng
  assert.equal(soTin([bai({ text: DU }), thieuDt()]), 1, "giống 0,64");
  assert.equal(soTin([bai({ text: DU }), thieuDt({ text: "Cần bán gấp Origami S1006 2pn 3,2 tỷ liên hệ chủ nhà" })]), 2, "giống dưới 0,3");
});

test("GT5-AC-4 hai bản chữ cùng thiếu trường («?» = «?») không tự khớp ở tầng hai → 2 tin", () => {
  // Thiết kế §2: bản chữ thiếu trường chỉ nhập vào tin ĐẦY ĐỦ qua luật 7 ngày, đúng một ứng viên, chữ giống từ 0,9.
  // Ca từ mẫu giữ riêng một: môi giới đăng hai căn khác nhau cùng giá, cùng số phòng, cùng không ghi diện tích, mã, phân khu.
  const a = bai({ text: "Cho thuê căn 2pn full đồ view hồ giá 11tr", kind: "rent_lt", gia: 11e6, dt: null });
  const b = bai({ text: "Cho thuê căn 2pn nội thất cơ bản view nội khu giá 11tr", kind: "rent_lt", gia: 11e6, dt: null });
  assert.equal(soTin([a, b]), 2); // chữ giống ≈ 0,12, dưới ngưỡng của luật cùng thiếu
});

// ---- AC-4 (Hỏi-6 lối B, Mạnh «GT5 chọn B» 20/11): bản chữ cùng người, cùng thiếu ĐÚNG các trường, trường có mặt khớp ----
const thue = (o = {}) => bai({ text: "Cho thuê căn 2pn full đồ view hồ giá 11tr nhà mới", kind: "rent_lt", gia: 11e6, dt: null, ...o });
const thue2 = (o = {}) => thue({ text: "Cho thuê căn 2pn full đồ view hồ giá 11tr nhà mới tinh", ...o });
test("GT5-AC-4 B cùng thiếu đúng các trường, chữ giống ≥ 0,3, trong 7 ngày → 1 tin", () => assert.equal(soTin([thue(), thue2({ ngay: 4 })]), 1));
test("GT5-AC-4 B chữ giống dưới ngưỡng → 2 tin", () => assert.equal(soTin([thue(), thue2()], { nguongChu: 0.95 }), 2));
test("GT5-AC-4 B ngoài cửa sổ 7 ngày → 2 tin", () => assert.equal(soTin([thue({ ngay: 1 }), thue2({ ngay: 9 })]), 2));
test("GT5-AC-4 B tập trường thiếu khác nhau → 2 tin", () =>
  assert.equal(soTin([thue(), thue2({ text: "Cho thuê căn full đồ view hồ giá 11tr nhà mới tinh", pn: null })]), 2));
test("GT5-AC-4 B trường có mặt khác nhau (số phòng) → 2 tin", () =>
  assert.equal(soTin([thue(), thue2({ text: "Cho thuê căn 3pn full đồ view hồ giá 11tr nhà mới tinh", pn: 3 })]), 2));
test("GT5-AC-4 B khác giá → 2 tin", () => assert.equal(soTin([thue(), thue2({ gia: 12e6 })]), 2));
test("GT5-AC-4 B khác loại tin → 2 tin", () => assert.equal(soTin([thue(), thue2({ kind: "sale" })]), 2));
test("GT5-AC-4 B khác người → 2 tin", () => assert.equal(soTin([thue(), thue2({ sender: "u9" })]), 2));
test("GT5-AC-4 B không người đăng (không sender, không SĐT) → 2 tin", () => assert.equal(soTin([thue({ sender: null }), thue2({ sender: null })]), 2));
test("GT5-AC-4 B khác phân khu, cả hai cùng thiếu diện tích → 2 tin", () =>
  assert.equal(soTin([bai({ text: "Bán ori S1006 2pn giá 3,2 tỷ full đồ", dt: null }), bai({ text: "Bán rb S1006 2pn giá 3,2 tỷ full đồ", dt: null })], { nguongChu: 0 }), 2));
test("GT5-AC-4 B nhóm cùng thiếu vẫn nhập vào đúng một tin đầy đủ → 1 tin", () =>
  assert.equal(soTin([bai({ text: DU }), thieuDt(), thieuDt({ text: "Bán căn Origami S1006 2pn giá 3,2 tỷ full đồ view hồ đẹp", ngay: 2 })]), 1));
test("GT5-AC-4 B nhóm cùng thiếu, hai tin đầy đủ ứng viên → không bắc cầu", () =>
  assert.equal(gom([bai({ text: DU, dt: 69 }), bai({ text: DU.replace("69m2", "75m2"), dt: 75 }), thieuDt(), thieuDt({ ngay: 2 })]).length, 3));

// ---- AC-5: phân khu không bao giờ chung tin ----
test("GT5-AC-5 hai phân khu khác, cả hai không rỗng, mọi trường khác khớp → 2 tin", () =>
  assert.equal(soTin([bai({ text: "Bán ori S1006 2pn 69m2 giá 3,2 tỷ" }), bai({ text: "Bán rb S1006 2pn 69m2 giá 3,2 tỷ" })]), 2));
test("GT5-AC-5 nhánh thiếu trường cũng không nhập khác phân khu", () =>
  assert.equal(soTin([bai({ text: "Bán ori S1006 2pn 69m2 giá 3,2 tỷ full" }), bai({ text: "Bán rb S1006 2pn giá 3,2 tỷ full", dt: null })], { nguongChu: 0 }), 2));

// ---- AC-8: dạng bài ----
test("GT5-AC-8 bài rổ hàng không gộp với bài khác", () => assert.equal(soTin([bai(), bai({ dangBai: "ro_hang" })]), 2));
test("GT5-AC-8 nhãn mot_can và nhãn vắng gom như thường", () => assert.equal(soTin([bai({ dangBai: "mot_can" }), bai()]), 1));
test("GT5-AC-8 hai bài rổ cùng chữ vẫn hai tin", () => assert.equal(soTin([bai({ dangBai: "ro_hang" }), bai({ dangBai: "ro_hang" })]), 2));

// ---- Bất biến thứ tự ----
test("GT5 thứ tự đầu vào không đổi tập tin (20 lần đảo, seed cố định)", () => {
  const ds = [bai(), bai({ ngay: 2 }), bai({ sender: "u2" }), thieuDt({ ngay: 4 }), bai({ text: "Bán rb S2 1pn 40m2 giá 2 tỷ", pn: 1, dt: 40, gia: 2e9 })];
  const dau = (r) => r.map((t) => t.items.map((i) => i.post.post_id).join(",")).sort().join(" | ");
  const goc = dau(gom(ds, { nguongChu: 0.5 }));
  let s = 7;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  for (let k = 0; k < 20; k++) assert.equal(dau(gom([...ds].sort(() => rnd() - 0.5), { nguongChu: 0.5 })), goc, `lần đảo ${k}`);
});
