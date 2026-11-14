// noi-du-an-s06-lop.test.mjs — hồ sơ _acceptance/ma-du-an-s06-thanh-nut (DA32) E2: hàm thuần phân lớp mã dự án S06 và thẻ
// luật. Không DB. Ma trận viết trước 10 ô (AC-2); ca 2c thẻ không lộ mã + băm; ca 2d chuẩn hoá tên.
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { phanLop, ketCucChuan, bamKetCuc, dungThe, chuanTen, laTenRong } from "../lib/noi-du-an-s06-lop.mjs";

const HCM = "vn-hcmc";
const HN = "vn-hanoi";
const NUT = [
  { id: 16, name: "Vinhomes Grand Park", aliases: ["grand park", "quang trung"], tinh: HCM, catalog_tier: "xac_minh" },
  { id: 5, name: "Vinhomes Riverside", aliases: ["riverside"], tinh: HN, catalog_tier: "xac_minh" },
  { id: 17, name: "Celadon City", aliases: ["celadon"], tinh: HCM, catalog_tier: "xac_minh" },
  { id: 90, name: "Khu Đôi A", aliases: ["khu doi chung"], tinh: HCM, catalog_tier: "xac_minh" },
  { id: 91, name: "Khu Đôi B", aliases: ["khu doi chung"], tinh: HCM, catalog_tier: "xac_minh" },
  { id: 92, name: "Ngắn", aliases: ["abc"], tinh: HCM, catalog_tier: "xac_minh" },
  { id: 300, name: "Sunrise Riverside", aliases: ["sunrise riverside"], tinh: HCM, catalog_tier: "mot_loi_khai" },
];
const ma = (o) => ({ ma: "1000", ten: "Khu Thử", tinh: [HCM], xaNhieu: "vn-hcmc-long-binh", soTin: 12, dlatM: 0, ...o });

/** Bản thật và bản phá dùng cùng ma trận; ô mang `nhan` để thông điệp gọi tên. */
function chayMaTran(fn) {
  const MA_TRAN = [
    ["ten-rong", ma({ ten: "" }), { status: "chua_noi", ly_do: "khong-ten", co_diem_tan: false }],
    ["dang-cap-nhat", ma({ ten: "Đang cập nhật" }), { status: "chua_noi", ly_do: "khong-ten", co_diem_tan: false }],
    ["hai-tinh", ma({ ten: "Khu Hai Tỉnh", tinh: [HCM, HN] }), { status: "chua_noi", ly_do: "lech-tinh", co_diem_tan: false }],
    ["mot-nut", ma({ ten: "The Origami – Vinhomes Grand Park" }), { status: "noi", node_id: 16, co_diem_tan: false }],
    ["hai-nut", ma({ ten: "Tháp Khu Doi Chung" }), { status: "chua_noi", ly_do: "nhieu-ung-vien", co_diem_tan: false }],
    ["khac-tinh", ma({ ten: "Sunrise Riverside" }), { status: "duc", co_diem_tan: false }],
    ["bi-danh-ngan", ma({ ten: "Tòa ABC Tower" }), { status: "duc", co_diem_tan: false }],
    ["nut-ung-vien", ma({ ten: "Sunrise Riverside Tower" }), { status: "duc", co_diem_tan: false }],
    ["con-lai", ma({ ten: "Akari City" }), { status: "duc", co_diem_tan: false }],
    ["diem-tan", ma({ ten: "Orchid Park", dlatM: 3186 }), { status: "duc", co_diem_tan: true }],
  ];
  assert.equal(MA_TRAN.length, 10, "MS6-AC-2: ma trận viết trước phải đúng 10 ô");
  const lech = [];
  for (const [nhan, m, ky] of MA_TRAN) {
    try { assert.deepEqual(fn(m, NUT), ky); } catch { lech.push(nhan); }
  }
  return lech;
}

test("MS6-AC-2 ma trận lớp mã viết trước (10 ô)", () => {
  assert.deepEqual(chayMaTran(phanLop), [], "MS6-AC-2: ô lệch kết cục viết trước");
});

test("MS6-AC-2 đối chứng đỏ: bỏ điều kiện cùng tỉnh thì ô Sunrise Riverside ra noi", () => {
  // Bản phá: coi mọi nút cùng tỉnh với mã (xoá điều kiện tỉnh), giữ phần còn lại của luật.
  const banPha = (m, nut) => phanLop(m, nut.map((n) => ({ ...n, tinh: m.tinh[0] })));
  const lech = chayMaTran(banPha);
  assert.ok(lech.includes("khac-tinh"), `cung-tinh: bản phá không làm lệch ô khác tỉnh (lệch: ${lech.join(",")})`);
});

test("MS6-AC-2 mã đã nối nút ứng viên của chính nó giữ đúng nút ấy", () => {
  const kq = phanLop(ma({ ten: "Akari City" }), NUT, { asset_node_id: 412, laUngVien: true });
  assert.deepEqual(kq, { status: "duc", node_id: 412, co_diem_tan: false });
  assert.equal(ketCucChuan(kq), "duc", "MS6-AC-2: kết cục chuẩn của mã đã có nút ứng viên phải là duc");
});

test("MS6-AC-2d chuẩn hoá tên: khoảng trắng, chữ hoa, dạng NFD cùng ra Grand Park", () => {
  for (const ten of ["  VINHOMES GRAND PARK ", "Vinhomes Grand Park".normalize("NFD"), "vinhomes   grand park"]) {
    assert.deepEqual(phanLop(ma({ ten }), NUT), { status: "noi", node_id: 16, co_diem_tan: false }, `chuan-ten: «${ten}»`);
  }
  assert.equal(chuanTen("  Đường  Ánh Dương "), "duong anh duong");
  for (const r of ["", "  ", "Đang cập nhật", "dang cap nhat", "--", "-", "0", "N/A", "n/a", null]) assert.equal(laTenRong(r), true, `rong: «${r}»`);
  assert.equal(laTenRong("A"), false);
});

test("MS6-AC-2c thẻ: không in mã nguồn, băm là sha256 của kết cục chuẩn sắp theo mã", () => {
  const ds = [];
  for (let i = 0; i < 40; i++) {
    const m = String(7000 + i);
    const kq = i < 3 ? { status: "noi", node_id: 16, co_diem_tan: false }
      : i < 5 ? { status: "chua_noi", ly_do: "khong-ten", co_diem_tan: false }
      : { status: "duc", co_diem_tan: i === 6 };
    ds.push({ ma: m, ten: i < 5 && i >= 3 ? "" : `Dự án ${i}`, tinh: HCM, xa: "Phường Thử", soTin: 100 - i, kq });
  }
  const the = dungThe(ds);
  for (const { ma: m } of ds) assert.ok(!the.markdown.includes(m), `lo-ma: thẻ in mã nguồn ${m}`);
  const chuan = ds.map((d) => [d.ma, ketCucChuan(d.kq)]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const bam = createHash("sha256").update(JSON.stringify(chuan)).digest("hex");
  assert.equal(the.bam, bam, "MS6-AC-2c: băm thẻ khác băm tính độc lập");
  assert.equal(bamKetCuc(chuan), bam);
  assert.match(the.markdown, new RegExp(`\\nbăm: ${bam}\\n?$`), "MS6-AC-2c: dòng cuối không phải «băm: <hex>»");
  assert.deepEqual(the.tong, { noi: { ma: 3, tin: 297 }, chua_noi: { ma: 2, tin: 193 }, duc: { ma: 35, tin: 2730 } });
  // Đối chứng đỏ: đổi kết cục một mã thì băm đổi.
  const pha = chuan.map(([m, k], i) => [m, i === 10 ? "chua_noi:khong-ten" : k]);
  assert.notEqual(bamKetCuc(pha), bam, "bam-ket-cuc: đổi kết cục một mã mà băm không đổi");
});

test("MS6-AC-2e bí danh địa danh không dấu không khớp tên có dấu; mã không có xã → khong-xa", () => {
  const nut = [...NUT, { id: 15, name: "Empire City", aliases: ["empire city", "thu thiEM"], tinh: HCM, catalog_tier: "xac_minh" },
    { id: 12, name: "Masteri Thảo Điền", aliases: ["masteri thao dien", "thao dien"], tinh: HCM, catalog_tier: "xac_minh" }];
  assert.deepEqual(phanLop(ma({ ten: "Thủ Thiêm Sky" }), nut), { status: "duc", co_diem_tan: false }, "dia-danh: Thủ Thiêm Sky nối Empire City qua bí danh «thu thiEM»");
  assert.deepEqual(phanLop(ma({ ten: "Thảo Điền Pearl" }), nut), { status: "duc", co_diem_tan: false }, "dia-danh: Thảo Điền Pearl nối Masteri qua «thao dien»");
  assert.deepEqual(phanLop(ma({ ten: "Empire City Thủ Thiêm" }), nut), { status: "noi", node_id: 15, co_diem_tan: false }, "MS6-AC-2e: tên chứa tên nút phải nối (đối chứng dương)");
  assert.deepEqual(phanLop(ma({ ten: "Topaz Twins", tinh: [] }), nut), { status: "chua_noi", ly_do: "khong-xa", co_diem_tan: false }, "khong-xa");
  // Đối chứng đỏ: so bỏ dấu (chuanTen) thì «Thủ Thiêm Sky» chạm «thu thiem».
  assert.ok(` ${chuanTen("Thủ Thiêm Sky")} `.includes(` ${chuanTen("thu thiEM")} `), "dia-danh: bản bỏ dấu không chạm — ca không phân biệt được");
});
