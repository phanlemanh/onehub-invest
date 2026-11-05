import { strict as assert } from "node:assert";
import { test } from "node:test";

import { boDau, kiemBangNoi } from "./noi-du-an-s08.mjs";

const NUT = new Map([["khu-a", "project"], ["khu-b", "project"], ["toa-x", "building"]]);
const DU_AN = [
  { project_id: "1", ten: "KHU Á MỘT", ma: "KA1", phan_khu: "P1" },
  { project_id: "2", ten: "NHÀ PHỐ (KA)", ma: "NP", phan_khu: "P2" },
  { project_id: "3", ten: "KHU BÊ", ma: "KB", phan_khu: "Q1" },
  { project_id: "4", ten: "NƠI KHÁC", ma: "NK", phan_khu: "R1" },
  { project_id: "5", ten: "KHU BÊ XA", ma: "KBX_CG", phan_khu: "S1" },
];
const BANG = {
  noi: [
    { project_id: "1", slug: "khu-a", tin_hieu: "khu a" },
    { project_id: "2", slug: "khu-a", tin_hieu: "(ka)" },
    { project_id: "3", slug: "khu-b", tin_hieu: "khu be" },
  ],
  tu_khoa_lat: { "khu-a": ["khu a", "(ka)"], "khu-b": ["khu be"] },
  loai: [{ project_id: "5", ly_do: "ở nơi khác" }],
};
const kiem = (bang, duAn = DU_AN) => kiemBangNoi({ bang, duAn, nut: NUT });

test("DN1-AC-1 boDau bo dau va thuong hoa", () => {
  assert.equal(boDau("LUMIÈRE Đảo"), "lumiere dao");
});

test("DN1-AC-1 dung so dong theo nut, ngoai bang thanh chua_noi", () => {
  const { loi, dong } = kiem(BANG);
  assert.deepEqual(loi, []);
  assert.equal(dong.filter((d) => d.slug === "khu-a").length, 2);
  assert.equal(dong.filter((d) => d.slug === "khu-b").length, 1);
  assert.deepEqual(dong.find((d) => d.project_id === "4"), { project_id: "4", slug: null, status: "chua_noi", ly_do: "ngoai-lat" });
  assert.equal(dong.find((d) => d.project_id === "5").ly_do, "loai-khoi-lat");
  assert.equal(dong.length, DU_AN.length);
});

test("DN1-AC-1 doi chung: them mot du an thi tong doi dung mot", () => {
  const { dong } = kiem(BANG, [...DU_AN, { project_id: "9", ten: "MOI", ma: "M", phan_khu: "" }]);
  assert.equal(dong.length, DU_AN.length + 1);
  assert.equal(dong.at(-1).status, "chua_noi");
});

const SAI = [
  ["nut-khong-phai-project", (b) => { b.noi[0].slug = "toa-x"; }],
  ["slug-khong-co", (b) => { b.noi[0].slug = "khu-z"; }],
  ["project-id-la", (b) => { b.noi[0].project_id = "99"; }],
  ["du-an-hai-dong", (b) => { b.noi.push({ ...b.noi[0] }); }],
  ["bang-rong", (b) => { b.noi = []; }],
  ["tin-hieu-khong-khop", (b) => { b.noi[0].tin_hieu = "khac han"; }],
  ["tin-hieu-khong-khop", (b) => { [b.noi[0].slug, b.noi[2].slug] = [b.noi[2].slug, b.noi[0].slug]; }],
  ["ung-vien-bi-sot", (b) => { b.noi.splice(2, 1); }],
];
for (const [ma, pha] of SAI) {
  test(`DN1-AC-2 tu choi ${ma}: ${pha.toString().slice(0, 44)}`, () => {
    const b = structuredClone(BANG);
    pha(b);
    const { loi, dong } = kiem(b);
    assert.ok(loi.includes(ma), `can ${ma}, co ${loi}`);
    assert.deepEqual(dong, []);
  });
}

test("DN1-AC-2 doi chung: tep lanh tren cung fixture qua duoc", () => {
  assert.deepEqual(kiem(structuredClone(BANG)).loi, []);
});
