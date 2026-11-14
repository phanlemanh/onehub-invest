// tap-nhan-hai-khu.test.mjs — hồ sơ tap-nhan-ghep-tin-hai-khu (PL35) E3, E4: hàm thuần, ma trận viết trước, không DB.
//   node --test pipeline/scripts/tap-nhan-hai-khu.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { khuCuaNhom } from "../lib/eval-labels.mjs";
import { mucGan, tangCua, wilsonDuoiDungHet, TANG_BAT_BUOC, TANG_HAI_KHU } from "../lib/tang-ghep.mjs";
import { chonMauHaiKhu } from "../lib/mau-hai-khu.mjs";

// ---- E3 (AC-3): khu theo tên nhóm, một assert mỗi loại nhóm ----
const NHOM = [
  { loai: "op1", ten: "CHO THUÊ - CHUYỂN NHƯỢNG OCP1", mong: "op1" },
  { loai: "op1-vhop", ten: "Hàng Hot VHOP", mong: "op1" },
  { loai: "gp", ten: "Căn Hộ Vinhomes Grand Park N1", mong: "gp" },
  { loai: "gp-vhgp", ten: "CỘNG ĐỒNG ANH EM VHGP", mong: "gp" },
  { loai: "khop-hai", ten: "Grand Park và OCP1 giá tốt", mong: null },
  { loai: "khong-khop", ten: "Chợ căn hộ toàn quốc", mong: null },
  { loai: "ocp2", ten: "OCP2 cho thuê", mong: null },
];
for (const n of NHOM) {
  test(`PL35-AC-3 nhóm ${n.loai}`, () => {
    assert.equal(khuCuaNhom(n.ten), n.mong, `PL35-AC-3 nhóm «${n.ten}»`);
  });
}

// ---- E4 (AC-4): ma trận năm ô của bộ phân tầng ----
const DANH_BA = {
  toa: [
    { key: "bld_A", ten: ["QA1"] },
    { key: "bld_B", ten: ["QB2", "Q Bê Hai"] },
    { key: "bld_D1", ten: ["QD5"] },
    { key: "bld_D2", ten: ["QD5"] },          // hai toà cùng tên → mơ hồ
    { key: "bld_S", ten: ["S10.01"] },
  ],
  truc: [{ toa_key: "bld_B", truc: "10" }],
};
const O = [
  { ma: "toa-khop", chu: "Bán căn 2PN toà QA1 view hồ, giá tốt", mong: "toa" },
  { ma: "truc-khop", chu: "Chuyển nhượng căn QB2.1210 tầng trung", mong: "truc" },
  { ma: "toa-ngoai-danh-ba", chu: "Bán căn toà QZ9 giá rẻ", mong: "khong" },
  { ma: "khong-neu-toa", chu: "Cần bán gấp căn 2 ngủ, liên hệ ngay", mong: "khong" },
  { ma: "toa-mo-ho", chu: "Căn góc toà QD5 tầng cao", mong: "khong" },
];
for (const o of O) {
  test(`PL35-AC-4 ô ${o.ma}`, () => {
    assert.equal(mucGan(o.chu, DANH_BA), o.mong, `PL35-AC-4 ô ${o.ma}`);
  });
}
test("PL35-AC-4 ranh từ: S10.01 không khớp tên S10.010, QA1 không khớp QA12; tên nhiều từ khớp", () => {
  assert.equal(mucGan("căn S10.010 view đẹp", DANH_BA), "khong");
  assert.equal(mucGan("căn QA12 view đẹp", DANH_BA), "khong");
  assert.equal(mucGan("bán căn Q BÊ HAI tầng 5", DANH_BA), "toa");
});
test("PL35-AC-4 đổi danh bạ đầu vào thì ô đổi theo (bộ phân tầng chỉ dựa danh bạ truyền vào)", () => {
  const coQZ9 = { toa: [...DANH_BA.toa, { key: "bld_Z", ten: ["QZ9"] }], truc: [] };
  assert.equal(mucGan("Bán căn toà QZ9 giá rẻ", coQZ9), "toa");
  assert.equal(mucGan.length, 2, "chữ ký hàm chỉ hai đối số: chữ bài, danh bạ");
});

// ---- Tầng, cỡ, Wilson (phần thuần của AC-2) ----
test("PL35 tầng: trục GP gộp vào toà GP; năm tầng, bốn tầng bắt buộc", () => {
  assert.equal(tangCua("gp", "truc"), "gp-toa");
  assert.equal(tangCua("op1", "truc"), "op1-truc");
  assert.deepEqual(TANG_HAI_KHU, ["op1-toa", "op1-truc", "op1-khong", "gp-toa", "gp-khong"]);
  assert.deepEqual(TANG_BAT_BUOC, ["op1-toa", "op1-khong", "gp-toa", "gp-khong"]);
});
test("PL35 Wilson: đúng hết 73 ca → cận dưới ≥ 0,95; 72 ca → dưới 0,95", () => {
  assert.ok(wilsonDuoiDungHet(73) >= 0.95);
  assert.ok(wilsonDuoiDungHet(72) < 0.95);
});
test("PL35 chọn mẫu thuần: mỗi tầng min(cỡ, số bài khác nhau), tầng thiếu mang nhãn bắt buộc / cho PL36", () => {
  const bai = [];
  for (let i = 0; i < 6; i++) bai.push({ post_id: `a${i}`, group_name: "OCP1", text: `Bán căn QA1 số ${i} khác nhau` });
  for (let i = 0; i < 2; i++) bai.push({ post_id: `t${i}`, group_name: "OCP1", text: `Bán căn QB2.0310 lần ${i}` });
  for (let i = 0; i < 4; i++) bai.push({ post_id: `g${i}`, group_name: "Grand Park", text: `Căn GP không nêu toà ${i}` });
  const db = { op1: DANH_BA, gp: { toa: [], truc: [] } };
  const kq = chonMauHaiKhu(bai, db, { seed: "s", co: 5 });
  assert.equal(kq.moiTang["op1-toa"].chon, 5);
  assert.equal(kq.moiTang["op1-truc"].chon, 2);
  assert.equal(kq.moiTang["op1-truc"].nhan, "cho PL36");
  assert.equal(kq.moiTang["gp-khong"].chon, 4);
  assert.equal(kq.moiTang["gp-khong"].nhan, "bắt buộc");
  assert.equal(kq.moiTang["gp-toa"].chon, 0);
  assert.ok(kq.chon.every((r) => TANG_HAI_KHU.includes(r.stratum)));
  const lai = chonMauHaiKhu(bai, db, { seed: "s", co: 5 });
  assert.deepEqual(lai.chon.map((r) => r.ref_id), kq.chon.map((r) => r.ref_id), "cùng seed cùng tập");
});

// ---- Lọc căn hộ bằng chữ bài (không đọc phát biểu loại nhà) ----
test("PL35 lọc loại nhà bằng chữ: nêu loại khác và không dấu hiệu căn hộ → loại; còn lại giữ", async () => {
  const { laLoaiKhac } = await import("../lib/mau-hai-khu.mjs");
  const O_LOC = [
    ["Cho thuê nhà phố Vinhomes Grand Park mặt tiền", true],
    ["Bán shophouse chân đế toà S1", true],
    ["Bán căn hộ 2PN view shophouse", false],
    ["Chuyển nhượng căn 2 ngủ toà S5.03 gần biệt thự", false],
    ["Bán căn S1.01 giá tốt", false],
    ["Cho thuê văn phòng tầng 1", true],
    ["Căn 1PN+1 full đồ", false],
  ];
  for (const [chu, mong] of O_LOC) assert.equal(laLoaiKhac(chu), mong, `PL35 lọc loại nhà «${chu}»`);
});
