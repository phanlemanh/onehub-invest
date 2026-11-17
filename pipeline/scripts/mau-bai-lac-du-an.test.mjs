// mau-bai-lac-du-an.test.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2), AC-10.
// Thước «tỉ lệ bài lạc dự án» chỉ đạt khi CẬN TRÊN của khoảng Wilson 95% ≤ ngưỡng chốt, với cỡ mẫu
// khai TRƯỚC khi gắn nhãn. Hai hàm thuần ở đây là chỗ con số ấy được tính; rút mẫu cần DB nên không ở đây.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { chonMau, wilson95 } from "./mau-bai-lac-du-an.mjs";

/** Làm tròn 4 chữ số để so số thực. */
const r4 = (x) => Math.round(x * 1e4) / 1e4;

describe("AC-10 khoảng Wilson 95%", () => {
  test("không ca lạc nào trên 100 bài vẫn cho cận trên 3,70% — không phải 0", () => {
    const w = wilson95(0, 100);
    assert.equal(r4(w.p), 0);
    assert.equal(r4(w.duoi), 0);
    assert.equal(r4(w.tren), 0.037);
  });

  test("bốn ca lạc trên 100 bài ĐẠT ngưỡng 10%, năm ca thì TRƯỢT", () => {
    assert.equal(r4(wilson95(4, 100).tren), 0.0984);
    assert.equal(r4(wilson95(5, 100).tren), 0.1118);
    assert.ok(wilson95(4, 100).tren <= 0.10, "4/100 phải đạt");
    assert.ok(wilson95(5, 100).tren > 0.10, "5/100 phải trượt");
  });

  test("mẫu nhỏ bị phạt đúng: 0 ca lạc trên 20 bài cho cận trên 16,1%, quá ngưỡng", () => {
    assert.equal(r4(wilson95(0, 20).tren), 0.1611);
    assert.ok(wilson95(0, 20).tren > 0.10, "n=20 không được lọt ngưỡng dù 0 ca lạc");
  });

  test("cỡ mẫu 0 không trả số giả", () => {
    assert.throws(() => wilson95(0, 0), /cỡ mẫu/);
    assert.throws(() => wilson95(3, 2), /số ca lạc/);
  });
});

describe("AC-10 rút mẫu có hạt giống", () => {
  const BAI = Array.from({ length: 500 }, (_, i) => ({ post_id: `p${i}`, conversation_id: `g${i % 7}` }));

  test("cùng hạt giống cho cùng mẫu, khác hạt giống cho mẫu khác", () => {
    const a = chonMau(BAI, 100, "hat-1").map((b) => b.post_id);
    assert.equal(a.length, 100);
    assert.deepEqual(chonMau(BAI, 100, "hat-1").map((b) => b.post_id), a);
    assert.notDeepEqual(chonMau(BAI, 100, "hat-2").map((b) => b.post_id), a);
  });

  test("mẫu không lặp bài, và không im lặng trả thiếu khi kho nhỏ hơn cỡ mẫu", () => {
    const a = chonMau(BAI, 100, "hat-1").map((b) => b.post_id);
    assert.equal(new Set(a).size, 100);
    assert.throws(() => chonMau(BAI.slice(0, 50), 100, "hat-1"), /không đủ bài/);
  });
});
