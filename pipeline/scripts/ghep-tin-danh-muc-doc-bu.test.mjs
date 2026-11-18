// ghep-tin-danh-muc-doc-bu.test.mjs — PL20: chọn bài cho lượt model đọc bù (AC-10). Phần kiểm trên DB nằm ở probes/doc-bu.sh.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { chonBaiDocBu, dongBangDanhSach, xetNacThu } from "./ghep-tin-danh-muc-doc-bu.mjs";

const banDoc = { label_id: "1", model: "m" };
const vao = (tin, bai) => ({ tin, bai: new Map(Object.entries(bai)), danhBa: new Map([["1", {}], ["16", {}]]) });
const tin = (offer_id, post_ids, du_an = "1") => ({ offer_id, post_ids, du_an, property_type: "apartment", kind: "sale" });
const kq = (theoTin, ketQuaBai = {}) => ({ theoTin: new Map(Object.entries(theoTin)), ketQuaBai: new Map(Object.entries(ketQuaBai)) });
const chua = { status: "chua_gan", ly_do: "khong-neu" };

test("mot-bai-chu-dai-nhat-moi-tin", () => {
  const v = vao([tin("t1", ["a", "b"])], { a: { chu: "ngắn", banDoc: null }, b: { chu: "dài hơn nhiều", banDoc: null } });
  assert.deepEqual(chonBaiDocBu(v, kq({ t1: chua })).post_ids, ["b"]);
});
test("uu-tien-bai-model-con-giup-duoc", () => {
  const v = vao([tin("t1", ["a", "b"])], { a: { chu: "bài dài nhất của tin này", banDoc: null }, b: { chu: "bài ngắn", banDoc: null } });
  const r = kq({ t1: { status: "chua_gan", ly_do: "ngoai-danh-ba" } }, { a: { ly_do: "ngoai-danh-ba" }, b: { ly_do: "khong-neu" } });
  assert.deepEqual(chonBaiDocBu(v, r).post_ids, ["b"]);
});
for (const [ten, v, r] of [
  ["loai-tin-da-gan", vao([tin("t1", ["a"])], { a: { chu: "x", banDoc: null } }), kq({ t1: { status: "gan" } })],
  ["loai-tin-xung-dot", vao([tin("t1", ["a"])], { a: { chu: "x", banDoc: null } }), kq({ t1: { status: "xung_dot" } })],
  ["loai-tin-da-co-ban-doc", vao([tin("t1", ["a", "b"])], { a: { chu: "x", banDoc }, b: { chu: "y", banDoc: null } }), kq({ t1: chua })],
  ["loai-tin-ngoai-hai-khu", vao([tin("t1", ["a"], "7")], { a: { chu: "x", banDoc: null } }), kq({ t1: chua })],
  ["loai-bai-thu-vi-khong-co-trong-dau-vao", vao([tin("t1", ["a"])], {}), kq({ t1: chua })],
  ["loai-bai-khong-co-chu", vao([tin("t1", ["a"])], { a: { chu: "  ", banDoc: null } }), kq({ t1: chua })],
]) test(ten, () => assert.deepEqual(chonBaiDocBu(v, r).post_ids, [], `ô «${ten}»`));

test("cung-du-lieu-ra-cung-bam", () => {
  const a = dongBangDanhSach(["b", "a"]);
  const b = dongBangDanhSach(["a", "b"]);
  assert.equal(a.sha256, b.sha256);
  assert.deepEqual(a.post_ids, ["a", "b"]);
  assert.notEqual(dongBangDanhSach(["a"]).sha256, a.sha256, "đổi danh sách phải đổi băm");
});

test("nac-thu-dat-thi-doc-tiep", () => assert.deepEqual(xetNacThu({ so_bai: 20, ok: 18, usd: 0.03 }), []));
test("nac-thu-qua-nhieu-bai-hong-thi-dung", () => assert.match(xetNacThu({ so_bai: 20, ok: 17, usd: 0.03 })[0], /qua-nhieu-bai-hong 3\/20/));
test("nac-thu-tien-moi-bai-qua-cao-thi-dung", () => assert.match(xetNacThu({ so_bai: 20, ok: 20, usd: 0.1 })[0], /tien-moi-bai/));
test("nac-thu-khong-bai-nao-doc-duoc-thi-dung", () => assert.ok(xetNacThu({ so_bai: 20, ok: 0, usd: 0 }).some((l) => l.startsWith("khong-co-bai"))));
