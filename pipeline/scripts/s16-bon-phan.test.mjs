import test from "node:test";
import assert from "node:assert/strict";
import { duPhan } from "./s16-bon-phan.mjs";

const lanh = { tong: 1294, biDanh: 1292, gop: 2, lech: 0, moHo: 0, toaThe: 0 };
const PHAN = ["biDanh", "gop", "lech", "moHo", "toaThe"];

test("đủ phần: bí danh + gộp vào căn S16 bằng tổng", () => assert.equal(duPhan(lanh), true));
test("đỏ khi bỏ phần gộp (thước trước DA37)", () => assert.equal(duPhan({ ...lanh, gop: 0 }), false));

// Ma trận viết trước: mỗi phần một ca khác 0 cân với tổng (xanh), một ca thiếu, một ca thừa (đỏ).
for (const p of PHAN) {
  const can = { ...lanh, [p]: lanh[p] + 7, tong: lanh.tong + 7 };
  test(`${p}: phần khác 0 được cộng vào tổng`, () => assert.equal(duPhan(can), true));
  test(`${p}: tổng thiếu một thì đỏ`, () => assert.equal(duPhan({ ...can, tong: can.tong - 1 }), false));
  test(`${p}: tổng thừa một thì đỏ`, () => assert.equal(duPhan({ ...can, tong: can.tong + 1 }), false));
}
