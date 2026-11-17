// mau-bai-lac-du-an.test.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2), AC-10.
// Thước «tỉ lệ bài lạc dự án» chỉ đạt khi CẬN TRÊN của khoảng Wilson 95% ≤ ngưỡng chốt, với cỡ mẫu
// khai TRƯỚC khi gắn nhãn. Hai hàm thuần ở đây là chỗ con số ấy được tính; rút mẫu cần DB nên không ở đây.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { chonMau, docBangDaDien, laLac, locKhung, soMau, wilson95 } from "./mau-bai-lac-du-an.mjs";

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

describe("AC-10 đọc bảng đã điền — chỉ dòng nhãn thật mới được tính", () => {
  const DONG = (i, lac, pid) => `| ${i} | ${lac} | \`${pid}\` | 1 | đầu bài gì đó |`;
  const BANG = ["| # | lac | post_id | dự án của nhóm | đầu bài |", "|---|---|---|---|---|",
    DONG(1, "x", "p1"), DONG(2, "", "p2"), DONG(3, "x", "p3"), DONG(4, "", "p4")].join("\n");

  test("đếm đúng cỡ mẫu và số ca lạc trên bảng hợp lệ", () => {
    assert.deepEqual(docBangDaDien(BANG), { n: 4, k: 2 });
  });

  test("bảng ngưỡng của tệp bằng chứng KHÔNG bị đếm thành bài lạc", () => {
    // Đúng khuôn trong evidence/mau-bai-lac-du-an.md: cột 1 là số, cột 2 có chữ, không có post_id.
    const nguong = ["| số bài lạc | cận trên Wilson 95% | |", "|---|---|---|",
      "| 0 | 3,70% | đạt |", "| 4 | 9,84% | đạt |", "| 5 | 11,18% | **chưa đạt** |"].join("\n");
    assert.deepEqual(docBangDaDien(nguong), { n: 0, k: 0 });
    assert.deepEqual(docBangDaDien(`${BANG}\n\n${nguong}`), { n: 4, k: 2 });
  });

  test("dòng nhãn thiếu post_id bị bỏ qua, đúng như chú thích nói", () => {
    assert.deepEqual(docBangDaDien(`${BANG}\n| 5 | x |  | 1 | thiếu mã bài |`), { n: 4, k: 2 });
  });

  test("cỡ mẫu phải là số nguyên dương, không nhận NaN hay 0", () => {
    assert.equal(soMau("100"), 100);
    for (const x of [undefined, "", "0", "-3", "abc", "1.5"]) assert.throws(() => soMau(x), /cỡ mẫu/, `nhận ${x}`);
  });
});

describe("AC-10 mẫu rút lại được", () => {
  const kho = (n) => Array.from({ length: n }, (_, i) => ({ post_id: `p${i}` }));

  test("kho lớn lên thì cùng hạt giống KHÔNG còn cho cùng mẫu — nên hồ sơ phải ghi danh sách mã bài", () => {
    const a = chonMau(kho(500), 100, "h").map((b) => b.post_id);
    const b = chonMau(kho(520), 100, "h").map((b) => b.post_id);
    const chung = a.filter((x) => b.includes(x)).length;
    assert.ok(chung < 100, "nếu bằng 100 thì câu «rút lại được bằng hạt giống» mới đúng");
    assert.ok(chung > 80, `mẫu không được đổi gần hết (trùng ${chung}/100)`);
  });
});

describe("AC-10 mẫu v2 — khung rút và định nghĩa khai trước (lối A, GS 17/11)", () => {
  test("khung «bài trong tin»: chỉ giữ bài nằm trong một tin đang rao — đúng tập bài sẽ bị đóng dấu", () => {
    const bai = [{ post_id: "a" }, { post_id: "b" }, { post_id: "c" }];
    assert.deepEqual(locKhung(bai, "bai-trong-tin", new Set(["a", "c"])).map((b) => b.post_id), ["a", "c"]);
    assert.deepEqual(locKhung(bai, "moi-bai", new Set(["a"])).map((b) => b.post_id), ["a", "b", "c"]);
    assert.throws(() => locKhung(bai, "khung-la", new Set()), /khung/);
  });

  test("định nghĩa «trong hệ VGP»: bài MCP hay LBV trong nhóm VGP không lạc; dự án khác vẫn lạc", () => {
    // Danh bạ 17/11: Vinhomes Grand Park = 16, Masteri Centre Point = 304, Lumiere Boulevard = 310.
    assert.equal(laLac("16", "304"), false);
    assert.equal(laLac("16", "310"), false);
    assert.equal(laLac("16", "16"), false);
    assert.equal(laLac("16", "2"), true, "Ocean Park 2 trong nhóm VGP phải là lạc");
    assert.equal(laLac("1", "304"), true, "hệ VGP chỉ áp cho nhóm VGP");
    assert.equal(laLac("16", null), false, "bài không nêu dự án không lạc");
  });
});
