// khop-tron.test.mjs — hồ sơ noi-phan-khu-trung-s16: ma trận luật khớp trọn 1–1 dùng chung (ROADMAP §3 mục 56). Hàm thuần, không DB.
import test from "node:test";
import assert from "node:assert/strict";
import { SAN_PHAN_TU_CHUNG, demBanGhiTheoNut, timNutTrungNoi, xetKhopTron } from "../lib/khop-tron.mjs";

const bg = (tong, co_bang_chung, nut) => ({ tong, co_bang_chung, nut });

// [tên ca, bản ghi, số bản ghi của nút, kỳ vọng]
const MA_TRAN = [
  ["khớp đủ mọi phần tử", bg(11, 11, [41]), 1, { ket: "khop", node_id: 41 }],
  ["khớp đúng sàn phần tử chung", bg(3, 3, [33]), 1, { ket: "khop", node_id: 33 }],
  ["khớp đúng sàn một nửa", bg(6, 3, [7]), 1, { ket: "khop", node_id: 7 }],
  ["bằng chứng trùng lặp cùng một nút", bg(7, 6, [23, 23, 23]), 1, { ket: "khop", node_id: 23 }],
  ["rẽ hai nút", bg(8, 8, [47, 46]), 1, { ket: "canh-bao", ly_do: "re-hai-nut", nut: [46, 47], co_bang_chung: 8, tong: 8 }],
  ["nút nhận từ hai bản ghi", bg(3, 3, [5]), 2, { ket: "canh-bao", ly_do: "nhieu-ban-ghi", nut: [5], co_bang_chung: 3, tong: 3 }],
  ["dưới sàn phần tử chung", bg(2, 2, [5]), 1, { ket: "canh-bao", ly_do: "it-chung", nut: [5], co_bang_chung: 2, tong: 2 }],
  ["dưới sàn một nửa", bg(7, 3, [5]), 1, { ket: "canh-bao", ly_do: "duoi-san", nut: [5], co_bang_chung: 3, tong: 7 }],
];

for (const [ten, b, soBanGhi, mong] of MA_TRAN) {
  test(`KT-1 ${ten}`, () => {
    assert.deepEqual(xetKhopTron(b, new Map(b.nut.map((id) => [id, soBanGhi]))), mong, `luật khớp trọn sai ở ca: ${ten}`);
  });
}

test("KT-2 không có bằng chứng thì trả null", () => {
  assert.equal(xetKhopTron(undefined), null);
  assert.equal(xetKhopTron(bg(4, 0, [])), null);
});

test("KT-3 sàn phần tử chung là 3", () => assert.equal(SAN_PHAN_TU_CHUNG, 3));

test("KT-4 đếm bản ghi theo nút: một bản ghi lặp một nút chỉ tính một lần", () => {
  assert.deepEqual([...demBanGhiTheoNut([{ nut: [1, 1, 2] }, { nut: [2] }])].sort(), [[1, 1], [2, 2]]);
});

test("KT-5 phép đo nút trùng nơi bắt đúng bản ghi nằm sai nút, bỏ qua ca đúng và ca chỉ cảnh báo", () => {
  const ds = [
    { node_id: 394, ...bg(11, 11, [41]) }, // nằm ở nút mới, bằng chứng trỏ nút cũ: trùng
    { node_id: 30, ...bg(4, 4, [30]) }, // đã nằm đúng nút
    { node_id: 387, ...bg(8, 8, [46, 47]) }, // rẽ hai nút: chỉ cảnh báo
    { node_id: 9, ...bg(2, 2, [8]) }, // dưới sàn: chỉ cảnh báo
    { node_id: 12, ...bg(5, 0, []) }, // không có bằng chứng
  ];
  assert.deepEqual(timNutTrungNoi(ds), [{ node_id: 394, trung_voi: 41, co_bang_chung: 11, tong: 11 }], "phải bắt đúng một nút trùng");
  assert.deepEqual(timNutTrungNoi(ds.slice(1)), [], "đối chứng: bỏ ca trùng thì phép đo phải về 0");
});

test("KT-6 hai bản ghi cùng trỏ một nút không bị coi là trùng nơi", () => {
  assert.deepEqual(timNutTrungNoi([{ node_id: 1, ...bg(3, 3, [9]) }, { node_id: 2, ...bg(3, 3, [9]) }]), []);
});
