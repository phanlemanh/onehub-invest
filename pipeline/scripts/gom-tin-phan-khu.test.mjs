// GT5 khoa-gom-hai-tang AC-5: tập phân khu theo danh bạ. Từ điển dựng từ dòng cùng khuôn câu SQL.tuDien (tên nút là thông tin dự án
// công khai, ROADMAP §3 mục 38).
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { dungTuDien, tapPhanKhu, khoaTen, SQL } from "../lib/gom-tin-phan-khu.mjs";

const DONG = [
  { du_an: "16", name: "Rainbow", aliases: ["rainbow"], bi_danh: [] },
  { du_an: "16", name: "The Rainbow", aliases: ["the rainbow"], bi_danh: ["rb"] },
  { du_an: "16", name: "The Origami", aliases: ["the origami"], bi_danh: ["ori"] },
  { du_an: "16", name: "The Beverly", aliases: ["the beverly"], bi_danh: [] },
  { du_an: "16", name: "The Beverly Solari", aliases: ["the beverly solari"], bi_danh: [] },
  { du_an: "1", name: "Hải Âu", aliases: ["hải âu"], bi_danh: [] },
];
const TD = dungTuDien(DONG);

test("GT5-AC-5 khoá bỏ «the», gập dấu", () => { assert.equal(khoaTen("The Rainbow"), "rainbow"); assert.equal(khoaTen("Hải Âu"), "hai au"); });
test("GT5-AC-5 hai nút trùng tên chờ DA46 cùng một khoá", () =>
  assert.deepEqual(tapPhanKhu("căn rainbow", TD), tapPhanKhu("căn The Rainbow", TD)));
test("GT5-AC-5 tên đầy đủ", () => assert.deepEqual(tapPhanKhu("Bán căn The Origami 2PN", TD), ["16:origami"]));
test("GT5-AC-5 bí danh danh bạ (viết tắt do dãy danh bạ thêm)", () => assert.deepEqual(tapPhanKhu("ori 2pn view hồ", TD), ["16:origami"]));
test("GT5-AC-5 hai phân khu trong một bài → hai khoá", () =>
  assert.deepEqual(tapPhanKhu("rb hoặc Origami đều được", TD), ["16:origami", "16:rainbow"]));
test("GT5-AC-5 cụm dài thắng: beverly solari không đếm thêm beverly", () =>
  assert.deepEqual(tapPhanKhu("căn Beverly Solari", TD), ["16:beverly solari"]));
test("GT5-AC-5 chữ không nêu phân khu → rỗng", () => assert.deepEqual(tapPhanKhu("chính chủ bán 2pn giá tốt", TD), []));
test("GT5-AC-5 không khớp giữa từ (orion, rbx)", () => assert.deepEqual(tapPhanKhu("orion rbx", TD), []));
test("GT5-AC-5 có dấu và không dấu như nhau", () => assert.deepEqual(tapPhanKhu("ban can hai au", TD), ["1:hai au"]));
test("GT5-AC-5 câu SQL chỉ đọc nút subzone con của project và bí danh ten còn sống", () => {
  assert.match(SQL.tuDien, /n\.node_type = 'subzone'/);
  assert.match(SQL.tuDien, /p\.node_type = 'project'/);
  assert.match(SQL.tuDien, /a\.kind = 'ten' AND a\.retired_at IS NULL/);
  assert.doesNotMatch(SQL.tuDien, /\b(INSERT|UPDATE|DELETE)\b/i);
});
