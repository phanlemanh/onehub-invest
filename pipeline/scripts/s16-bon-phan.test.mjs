import test from "node:test";
import assert from "node:assert/strict";
import { duPhan } from "./s16-bon-phan.mjs";

const lanh = { tong: 1294, biDanh: 1292, gop: 2, lech: 0, moHo: 0, toaThe: 0 };

test("đủ phần: bí danh + gộp vào căn S16 bằng tổng", () => assert.equal(duPhan(lanh), true));
test("đỏ khi bỏ phần gộp (thước trước DA37)", () => assert.equal(duPhan({ ...lanh, gop: 0 }), false));
test("đỏ khi đếm thừa một căn gộp", () => assert.equal(duPhan({ ...lanh, gop: 3 }), false));
test("đỏ khi một căn vừa gộp vừa còn thẻ lệch", () => assert.equal(duPhan({ ...lanh, lech: 1 }), false));
