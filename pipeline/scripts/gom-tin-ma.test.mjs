// GT5 khoa-gom-hai-tang AC-6: bộ tìm mã mới — ma trận viết trước, một assert mỗi ô (chữ đã qua gatSo, không SĐT).
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { maMoi, NHIEU } from "../lib/gom-tin-ma.mjs";

const O_MA = [
  ["chữ hoa", "bán căn S10 view hồ", ["S10"]],
  ["chữ thường 4 số", "chính chủ gửi s1006 full đồ", ["S1006"]],
  ["1 chữ số", "toà R1 tầng trung", ["R1"]],
  ["2 chữ số", "căn góc GH12 hướng mát", ["GH12"]],
  ["3 chữ số", "mã căn ori123 giá tốt", ["ORI123"]],
  ["4 chữ số", "S2006 hai ngủ", ["S2006"]],
  ["đuôi .03", "căn S1.03 bc đông nam", ["S1.03"]],
  ["đuôi -1203", "GH3-1203 thoáng", ["GH3-1203"]],
  ["đuôi xx13", "trục S10xx13 tầng cao", ["S10XX13"]],
  ["mã tin môi giới 2 chữ 4 số", "mã tin VH1234 liên hệ", ["VH1234"]],
  ["mã tin môi giới 4 chữ 6 số", "mã TOPS123456 mới về", ["TOPS123456"]],
  ["toà P, D, V có thật", "toà P4, căn D2.21, V3 biệt thự", ["D2.21", "P4", "V3"]],
  ["nhiều mã, sắp xếp, không trùng", "s1006 và S1006, R2", ["R2", "S1006"]],
];
const O_NHIEU = [
  ["t<số> mốc tháng", "bàn giao t4 năm sau"],
  ["m2", "rộng m2 thoáng"],
  ["pn", "pn2 rộng"],
  ["wc", "wc2 khép kín"],
  ["coc", "coc3 tháng"],
  ["ocp", "ocp2 đã có sổ"],
  ["gd", "gd1 bàn giao"],
  ["x<số>", "giá x2 thị trường"],
  ["số liền chữ (80m2)", "diện tích 80m2"],
  ["quận Q9", "Vinhomes Grand Park Q9 chuyển nhượng"],
  ["mốc tháng.năm", "ân hạn T6.2027 giá tốt"],
];

for (const [ten, chu, ky] of O_MA) test(`GT5-AC-6 ô mã: ${ten}`, () => assert.deepEqual(maMoi(chu), ky, `ô «${ten}»: ${chu}`));
for (const [ten, chu] of O_NHIEU) test(`GT5-AC-6 ô nhiễu: ${ten}`, () => assert.deepEqual(maMoi(chu), [], `ô nhiễu «${ten}» phải rỗng: ${chu}`));
test("GT5-AC-6 hai cách viết hoa thường của một mã là một", () => assert.deepEqual(maMoi("s1006"), maMoi("S1006")));
test("GT5-AC-6 S10 khác S10.06", () => assert.notDeepEqual(maMoi("S10"), maMoi("S10.06")));
test("GT5-AC-6 chiều đỏ: bỏ danh sách nhiễu thì mọi ô nhiễu có chữ cái+số đều lọt", () => {
  const lot = O_NHIEU.filter(([, chu]) => maMoi(chu, { nhieu: [] }).length > 0).map(([ten]) => ten);
  assert.deepEqual(lot, ["t<số> mốc tháng", "m2", "pn", "wc", "coc", "ocp", "gd", "x<số>", "quận Q9", "mốc tháng.năm"], `ô nhiễu lọt khi bỏ NHIEU: ${lot.join(", ")}`);
  assert.ok(NHIEU.length >= 6);
});
