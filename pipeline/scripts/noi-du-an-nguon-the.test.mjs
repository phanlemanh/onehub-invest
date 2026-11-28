// noi-du-an-nguon-the.test.mjs — DA3 bang-noi-ma-du-an AC-3 (Hỏi-2, Mạnh duyệt 28/11): mẫu thẻ tách theo căn cứ × hạng × nguồn đúc
// của nút đích. Hàm thuần oMau, không DB. Ma trận viết trước: mỗi ô một assert.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { oMau, SO_MAU, vietThe } from "../noi-du-an-nguon.mjs";
import { bamKetCuc } from "../lib/khop-du-an.mjs";

const NUT = new Map([
  [1, { id: 1, tier: "xac_minh", nguonDuc: null }],
  [2, { id: 2, tier: "mot_loi_khai", nguonDuc: "S06" }],
  [3, { id: 3, tier: "mot_loi_khai", nguonDuc: "S08" }],
  [4, { id: 4, tier: "mot_loi_khai", nguonDuc: "S09" }],
  [5, { id: 5, tier: "xac_minh", nguonDuc: "S06" }], // nút đã xác minh mang meta.nguon cũ: không tách theo nguồn
]);
const ban = (i, can, node_id) => ({ ma: `m${i}`, ten: `Dự án ${String(i).padStart(3, "0")}`, tinh: "t", xa: "x",
  kq: { nga: "noi", can_cu: can, node_id } });

test("BN-AC-3 o-mau: moi o can cu x hang x nguon duc, dem dung, thu tu K2 K3 T roi xac minh truoc", () => {
  const ds = [
    ban(1, "K3", 1), ban(2, "K3", 2), ban(3, "K3", 2), ban(4, "K3", 3), ban(5, "T", 1), ban(6, "T", 2), ban(7, "T", 3),
    ban(8, "K2", 3), ban(9, "T", 4), ban(10, "K3", 5),
    { ma: "m11", ten: "Chưa nối", kq: { nga: "chua_noi", ly_do: "khong-khop" } },
    { ma: "m12", ten: "Giữ", kq: { nga: "giu", node_id: 1, bong: { nga: "chua_noi" } } },
  ];
  const o = oMau(ds, NUT);
  assert.deepEqual(o.map((x) => [x.khoa, x.dem]), [
    ["K2|mot_loi_khai|S08", 1],
    ["K3|xac_minh|—", 2],
    ["K3|mot_loi_khai|S06", 2],
    ["K3|mot_loi_khai|S08", 1],
    ["T|xac_minh|—", 1],
    ["T|mot_loi_khai|S06", 1],
    ["T|mot_loi_khai|S08", 1],
    ["T|mot_loi_khai|S09", 1],
  ]);
  assert.equal(o.reduce((a, x) => a + x.dem, 0), 10, "mọi dòng nối vào đúng một ô; chưa nối và giữ không vào ô");
});

test("BN-AC-3 o-mau: moi o toi da SO_MAU mau, xep theo ten; dem giu so that", () => {
  const ds = Array.from({ length: 27 }, (_, i) => ban(27 - i, "T", 2));
  const [x] = oMau(ds, NUT);
  assert.equal(x.dem, 27);
  assert.equal(x.mau.length, SO_MAU);
  assert.deepEqual(x.mau.map((d) => d.ten), [...x.mau.map((d) => d.ten)].sort((a, b) => a.localeCompare(b, "vi")));
  const it = oMau([ban(1, "K2", 3)], NUT)[0];
  assert.equal(it.mau.length, 1, "ô ít cặp có đúng min(20, số cặp) mẫu");
});

test("BN-AC-3 the: bang hang nut va tieu de o in nhan san pham, khong in ma nguon", () => {
  const ds = [ban(1, "K3", 1), ban(2, "T", 3)];
  const md = vietThe({ nguon: "S07", ds: ds.map((d) => ({ ...d, tenNut: "Nút" })), tong: { K3: 1, T: 1 }, mau: oMau(ds, NUT), lech: [],
    bam: bamKetCuc(ds) });
  assert.match(md, /\*\*Nối theo hạng nút đích\*\*/);
  assert.ok(md.indexOf("**Nối theo hạng nút đích**") < md.indexOf("\n## "), "bảng đếm hạng nằm ở phần tổng, trước mục mẫu");
  assert.match(md, /\| K3 \| đã xác minh \| — \| 1 \|/);
  assert.match(md, /\| T \| ứng viên \| S08 \| 1 \|/);
  assert.match(md, /## Mẫu căn cứ T · ứng viên S08 \(1\/1\)/);
  assert.ok(!/\bm[12]\b/.test(md), "thẻ không in mã dự án nguồn");
});

test("BN-AC-3 bam: doi ket cuc, doi nut dich, doi can cu deu doi bam", () => {
  const ds = [ban(1, "K3", 1), ban(2, "T", 2)].map((d) => ({ ma: d.ma, kq: d.kq }));
  const goc = bamKetCuc(ds);
  const sua = (f) => bamKetCuc(ds.map((d, i) => (i === 0 ? { ma: d.ma, kq: f(d.kq) } : d)));
  assert.notEqual(sua((k) => ({ nga: "chua_noi", ly_do: "khong-khop" })), goc, "đổi kết cục");
  assert.notEqual(sua((k) => ({ ...k, node_id: 99 })), goc, "đổi nút đích");
  assert.notEqual(sua((k) => ({ ...k, can_cu: "T" })), goc, "đổi căn cứ");
  assert.equal(sua((k) => ({ ...k })), goc, "đối chứng: không đổi gì thì băm như cũ");
});
