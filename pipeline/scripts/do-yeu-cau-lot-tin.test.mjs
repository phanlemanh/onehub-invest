// do-yeu-cau-lot-tin.test.mjs — hồ sơ _acceptance/yeu-cau-khong-thanh-tin-thue (PL42), AC-5: phần thuần của thước (không DB).
// Mỗi ngưỡng một cặp: ca nền (đạt, đúng tại biên) và ca vượt đúng một ngưỡng → đỏ gọi đúng tên ngưỡng đó, không tên nào khác.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  CUA_SO, NGUONG, cheSo, chonNgauNhien, demKhoi, duDoanRut, khuTrungChu, laNhanRo, tranSau, vietMau, xet, xetMoc,
} from "./do-yeu-cau-lot-tin.mjs";

/** Ca nền: mọi số đúng tại biên được phép — phải đạt. */
const nen = () => ({
  truoc: { ro: 277, gia_tot_thue_ro: 54, thue: 5709 },
  sau: { ro: 90, gia_tot_thue_ro: 17 }, // ⌈277×85/264⌉ = 90, ⌈54×16/51⌉ = 17
  doi: { khac: NGUONG.doiKhac },
  thue: { con: 5709 - 176, rutDuDoan: 176 },
  mau: { ngauNhien: NGUONG.mauNgauNhien },
});

// [tên ca, đổi, mẫu tên ngưỡng phải gọi]
const VUOT = [
  ["mốc tin rò dưới sàn", (x) => { x.truoc.ro = 261; x.sau.ro = 0; }, /^mốc dưới sàn: tin rò 261 \(sàn 262\)/],
  ["mốc giá tốt rò dưới sàn", (x) => { x.truoc.gia_tot_thue_ro = 48; x.sau.gia_tot_thue_ro = 0; }, /^mốc dưới sàn: .*giá tốt thuê rò 48 \(sàn 49\)/],
  ["tin rò sau", (x) => { x.sau.ro = 91; }, /^tin rò sau 91 > 90$/],
  ["giá tốt thuê rò sau", (x) => { x.sau.gia_tot_thue_ro = 18; }, /^tin thuê «giá tốt» rò sau 18 > 17$/],
  ["bài nhãn khác inquiry", (x) => { x.doi.khac = NGUONG.doiKhac + 1; }, /^bài nhãn khác inquiry bị đổi 11 > 10$/],
  ["tin thuê lệch rút trọn", (x) => { x.thue.con -= 1; }, /^tin thuê lệch rút trọn: sau 5532 ≠ trước 5709 − rút 176$/],
  ["mẫu thiếu", (x) => { x.mau.ngauNhien = NGUONG.mauNgauNhien - 1; }, /^mẫu thiếu: 19 < 20/],
];

describe("PL42-AC-5 ngưỡng của thước tin lọt", () => {
  test("ca nền đúng tại biên mọi ngưỡng → đạt", () => assert.deepEqual(xet(nen()), []));
  for (const [ten, doi, mau] of VUOT) {
    test(`chiều đỏ: ${ten} → hỏng gọi đúng một tên ngưỡng`, () => {
      const x = nen();
      doi(x);
      const hong = xet(x);
      assert.equal(hong.length, 1, `cần đúng một ngưỡng hỏng, thấy: ${hong.join(" · ")}`);
      assert.match(hong[0], mau);
    });
  }
  test("ngưỡng khớp hợp đồng AC-5 (mốc 264 / 51 ± 2; ≤ 85; ≤ 16; ≤ 10; mẫu 20)", () => {
    assert.deepEqual({ ...NGUONG }, { mocRo: 264, mocGiaTotRo: 51, saiMoc: 2, roSau: 85, giaTotRoSau: 16, doiKhac: 10, mauNgauNhien: 20 });
  });
  test("xetMoc: tại sàn và trên mốc bao nhiêu cũng đạt; dưới sàn một → «mốc dưới sàn»", () => {
    assert.deepEqual(xetMoc({ ro: 262, gia_tot_thue_ro: 49 }), []);
    assert.deepEqual(xetMoc({ ro: 400, gia_tot_thue_ro: 90 }), []);
    assert.match(xetMoc({ ro: 261, gia_tot_thue_ro: 51 })[0], /^mốc dưới sàn/);
  });
  test("tranSau: tại mốc 26/11 ra đúng trần hợp đồng 85 / 16; theo tỉ lệ khi mốc lượt lên", () => {
    assert.deepEqual(tranSau({ ro: 264, gia_tot_thue_ro: 51 }), { ro: 85, gia_tot_thue_ro: 16 });
    assert.deepEqual(tranSau({ ro: 277, gia_tot_thue_ro: 54 }), { ro: 90, gia_tot_thue_ro: 17 });
  });
});

describe("PL42-AC-5 định nghĩa đếm", () => {
  const trong = new Date("2026-11-20T00:00:00Z");
  const nhan = new Map([
    ["p-yc", { listing_intent: "inquiry", labeled_at: trong }],
    ["p-yc-cu", { listing_intent: "inquiry", labeled_at: new Date("2026-11-11T23:59:59Z") }],
    ["p-yc-sau", { listing_intent: "inquiry", labeled_at: CUA_SO.den }],
    ["p-rao", { listing_intent: "offer", labeled_at: trong }],
  ]);
  const tin = [
    { offer_id: "o1", kind: "rent_lt", post_ids: ["p-yc"] },
    { offer_id: "o2", kind: "rent_lt", post_ids: ["p-rao", "p-yc"] },
    { offer_id: "o3", kind: "sale", post_ids: ["p-yc"] },
    { offer_id: "o4", kind: "rent_lt", post_ids: ["p-yc-cu", "p-yc-sau"] },
    { offer_id: "o5", kind: "rent_lt", post_ids: ["p-rao"] },
  ];
  test("tin rò = có bài nhãn inquiry trong cửa sổ [12/11, 27/11) UTC; giá tốt rò chỉ tính tin thuê", () => {
    assert.equal(laNhanRo(nhan.get("p-yc-cu")), false, "nhãn trước cửa sổ bị tính");
    assert.equal(laNhanRo(nhan.get("p-yc-sau")), false, "nhãn đúng mốc cuối (loại trừ) bị tính");
    const k = demKhoi({ tin, nhan, giaTot: new Set(["o1", "o3", "o5"]), baiS03: ["p-yc", "p-x", "p-y"],
      nhanh: new Map([["p-x", "yeu-cau"], ["p-yc", "yeu-cau"], ["p-y", "anh-chua-ghep"]]) });
    assert.deepEqual(k, { tin: 5, ro: 3, thue: 4, gia_tot_thue: 2, gia_tot_thue_ro: 1, nhanh_yeu_cau: 1 });
  });
  test("duDoanRut: chỉ tin mà mọi bài là nhánh yeu-cau", () => {
    const nhanh = new Map([["p-yc", "yeu-cau"], ["p-yc-cu", "yeu-cau"]]);
    assert.deepEqual(duDoanRut(tin, nhanh).map((o) => o.offer_id), ["o1", "o3"]);
  });
});

describe("PL42-AC-5 tệp mẫu", () => {
  test("chọn ngẫu nhiên theo hạt giống: cùng hạt cùng kết quả bất kể thứ tự vào; khác hạt khác kết quả", () => {
    const ds = Array.from({ length: 50 }, (_, i) => `p${String(i).padStart(2, "0")}`);
    const a = chonNgauNhien(ds, 20, "h1"), b = chonNgauNhien([...ds].reverse(), 20, "h1");
    assert.deepEqual(a, b);
    assert.equal(new Set(a).size, 20);
    assert.notDeepEqual(chonNgauNhien(ds, 20, "h2"), a);
    assert.equal(chonNgauNhien(ds.slice(0, 7), 20).length, 7);
  });
  test("che chuỗi từ 8 chữ số; 7 chữ số giữ", () => {
    assert.equal(cheSo("lh 09123456789 hoặc 1234567, mã 12345678"), "lh # hoặc 1234567, mã #");
  });
  test("khử trùng theo chữ: giữ post_id nhỏ nhất", () => {
    const r = khuTrungChu([{ post_id: "b", text: "Tìm  2pn" }, { post_id: "a", text: "tìm 2pn" }, { post_id: "c", text: "Tìm studio" }]);
    assert.deepEqual(r.map((x) => x.post_id), ["a", "c"]);
  });
  test("vietMau đi qua hàm che; che trả null (sổ nguồn rỗng) thì ném, không ghi chữ trần", () => {
    const m = { khac: [{ offer_id: "o1", post_id: "p1", nhan: "offer", text: "Tìm 2pn 8tr lh 0912345678" }],
      ngauNhien: [{ offer_id: "o2", post_id: "p2", text: "Tìm studio" }] };
    const md = vietMau(m, (t) => cheSo(t).replace("Tìm", "[che]"));
    assert.match(md, /`o1` · nhãn offer: \[che\] 2pn 8tr lh #/);
    assert.match(md, /`o2` · nhãn chưa nhãn: \[che\] studio/);
    assert.throws(() => vietMau(m, () => null), /không che được tên nguồn/);
  });
});
