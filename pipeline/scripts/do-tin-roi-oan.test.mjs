// do-tin-roi-oan.test.mjs — PL43 AC-5: ngưỡng của thước, trường bắt buộc của tệp mẫu, phép che, phép gán phần luật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { NGUONG, TRUONG_MAU, phanLuatCua, vietMau, xet } from "./do-tin-roi-oan.mjs";
import { cheSo } from "./do-yeu-cau-lot-tin.mjs";

const TRUOC = { tin: 9700, ro: 78, gia_tot_thue_ro: 12 };
const SAU = { tin: 9922, ro: 86, gia_tot_thue_ro: 14 };
const MAU = { ngauNhien: 20, phanC: 10, conRoi: 20 };

test("PL43-AC-5 ngưỡng khớp hợp đồng", () => {
  assert.deepEqual({ ...NGUONG }, { themToiThieu: 150, roTran: 90, giaTotThueRoTran: 17, mauNgauNhien: 20, mauPhanC: 10, mauConRoi: 20 });
  assert.deepEqual([...TRUONG_MAU], ["ma_tin", "phan_luat", "kind", "price_vnd", "nhan", "chu_bai"]);
});

test("PL43-AC-5 số đạt → không ngưỡng nào hỏng", () => {
  assert.deepEqual(xet({ truoc: TRUOC, sau: SAU, mau: MAU }), []);
});

test("PL43-AC-5 chiều đỏ: vượt từng ngưỡng thì gọi tên ngưỡng ấy", () => {
  const CA = [
    [{ sau: { ...SAU, tin: TRUOC.tin + 149 } }, /tin S03 thêm 149 < 150/],
    [{ sau: { ...SAU, ro: 91 } }, /tin rò 91 > 90/],
    [{ sau: { ...SAU, gia_tot_thue_ro: 18 } }, /tin thuê «giá tốt» rò 18 > 17/],
    [{ mau: { ...MAU, ngauNhien: 19 } }, /mẫu thiếu: 19 < 20 tin mới ngẫu nhiên/],
    [{ mau: { ...MAU, phanC: 9 } }, /mẫu thiếu: 9 < 10 tin mới phần C/],
    [{ mau: { ...MAU, conRoi: 19 } }, /mẫu thiếu: 19 < 20 bài còn rơi/],
  ];
  for (const [doi, re] of CA) {
    const hong = xet({ truoc: TRUOC, sau: SAU, mau: MAU, ...doi });
    assert.equal(hong.length, 1, `PL43-AC-5 ca ${re} phải hỏng đúng một ngưỡng, ra: ${hong.join(" · ")}`);
    assert.match(hong[0], re);
  }
  // Biên: đúng ngưỡng thì đạt.
  assert.deepEqual(xet({ truoc: TRUOC, sau: { tin: TRUOC.tin + 150, ro: 90, gia_tot_thue_ro: 17 }, mau: MAU }), []);
});

const MUC = { ma_tin: "offer_x", phan_luat: "A", kind: "rent_lt", price_vnd: "15000000", nhan: null, chu_bai: "BE 2PN2w 15tr, LH 0912345678 hay 123456789012" };
const che = (t) => cheSo(t);

test("PL43-AC-5 tệp mẫu: đầu tệp có sha và hạt giống, mỗi mục đủ sáu trường, số từ 8 chữ số thành «#»", () => {
  const md = vietMau({ ngauNhien: [MUC], phanC: [], roMoi: [], conRoi: [] }, { sha: "abc123", che });
  assert.match(md, /^sha: abc123$/m);
  assert.match(md, /^hat_giong: pl43-mau-tin-moi$/m);
  assert.match(md, /`offer_x` · phần A · rent_lt · 15\.000\.000 đ · nhãn chưa nhãn: BE 2PN2w 15tr, LH # hay #/);
  assert.doesNotMatch(md, /\d{8,}/, "PL43-AC-5 tệp mẫu còn chuỗi từ 8 chữ số");
});

test("PL43-AC-5 chiều đỏ: mục thiếu trường thì ném «mẫu thiếu trường» gọi tên trường", () => {
  for (const k of TRUONG_MAU) {
    const { [k]: _bo, ...thieu } = MUC;
    assert.throws(() => vietMau({ ngauNhien: [thieu], phanC: [], roMoi: [], conRoi: [] }, { sha: "x", che }), new RegExp(`mẫu thiếu trường: ${k}`));
  }
  assert.throws(() => vietMau({ ngauNhien: [MUC], phanC: [], roMoi: [], conRoi: [] }, { sha: "x", che: () => null }), /không che được tên nguồn/);
});

test("PL43-AC-5 gán phần luật cho bài mới nhận", () => {
  const CA = [
    ["BE 2PN2w, view cv full nội thất 15tr", "ca-hai", "A"],
    ["🏠 S205 · 55m · 9,5tr · Full", "ca-hai", "B"],
    ["2PN2vs view sông Giá: 3.7 (thu nét về ) sẵn sổ", "ca-hai", "C"],
    ["Rainbow / 1PN+ 47m2 Giá 1t920 BTP có sổ", "ca-hai", "D"],
    ["HÀNG THUÊ 2PN BE TRỐNG 9.5TR Tìm nhà không khó – Có em Như lo!", "ca-hai", "G"],
    ["Cho thuê căn 1pn 45m2 full đồ 7tr/tháng", "ca-hai", null],
    ["Tìm 1 ngủ toà Be dưới 7 triệu", "ca-hai", null],
  ];
  for (const [t, md, phan] of CA) assert.equal(phanLuatCua(t, md), phan, `PL43-AC-5 «${t}» gán sai phần`);
});
