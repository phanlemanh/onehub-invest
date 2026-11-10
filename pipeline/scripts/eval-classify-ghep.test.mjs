// eval-classify-ghep.test.mjs — hồ sơ eval-classify-theo-chu-ref, ca «ECR-AC-n». Hàm thuần gopNhan, chamO; ghep rút từ ghepChoMau thật.
import { test } from "node:test";
import assert from "node:assert/strict";

import { chamO, gopNhan } from "../lib/eval-classify.mjs";
import { ghepChoMau } from "../lib/ghep-mau.mjs";

const U = (n) => `https://cdn.example.test/${n}.jpg`;
const t = (s) => new Date(Date.UTC(2026, 10, 5, 3, 0, s)).toISOString();
const bai = (post_id, text, s, sender_id = "n1") => ({ post_id, text, posted_at: t(s), sender_id, conversation_id: "g1" });
const CHU = "Bán căn hộ 64,5m2 giá 3 tỷ";
const POSTS = [
  bai("T1", CHU, 0), bai("A1", U("a1"), 5), bai("A2", U("a2"), 6),
  bai("A3", U("a3"), 2000, "n3"),
  bai("T4", CHU, 3000, "n4"),
];
const ITEMS = [["1", "A1"], ["2", "A2"], ["3", "A3"], ["4", "T4"]];
const G = ghepChoMau(ITEMS.map(([item_id, ref_id]) => ({ item_id, ref_id })), POSTS);
// Chữ từng dòng theo đúng khoá của docNhanNguoi; ghep rút từ bên ghi thật.
const chuCua = (ref, g) => POSTS.find((p) => p.post_id === (g?.chu_ref ?? ref))?.text ?? null;
const tins = (dong = ITEMS) => dong.map(([item_id, ref_id]) => ({ item_id, ref_id, ghep: G.get(item_id), text: chuCua(ref_id, G.get(item_id)) }));
const nhan = (item_id, field, value) => ({ item_id, labeler_id: "a", field, value, not_stated: false });
const NHAN_CHU = (id) => [nhan(id, "area_m2", "64.5"), nhan(id, "price_min_vnd", "3000000000"), nhan(id, "kind", "sale")];
const o = (ket, truong) => chamO({ tin: ket.tin }).find((x) => x.phan_khuc === "tat-ca" && x.truong === truong);

test("ECR-AC-1 ghep rut tu ben ghi that dung bon loai dong", () => {
  assert.equal(G.get("1").chu_ref, "T1");
  assert.equal(G.get("2").trung_voi, "A1");
  assert.equal(G.get("3").chu_ref, null);
  assert.equal(G.get("4"), null);
});

test("ECR-AC-1 bo doc cham tren chu tin ghep", () => {
  const ket = gopNhan(tins(), NHAN_CHU("1"));
  assert.deepEqual(ket.tin.map((x) => x.text), [CHU]);
  for (const truong of ["area_m2", "price_min_vnd", "kind"]) assert.equal(o(ket, truong).dung, 1, truong);
});

test("ECR-AC-1 doi chung: cung nhan cham tren URL anh thi so dung tut", () => {
  const dong = [{ item_id: "1", ref_id: "A1", ghep: G.get("1"), text: U("a1") }];
  const ket = gopNhan(dong, NHAN_CHU("1"));
  assert.equal(ket.tin.length, 1);
  for (const truong of ["area_m2", "price_min_vnd", "kind"]) assert.equal(o(ket, truong).dung, 0, `đối chứng: ${truong} chấm trên URL phải sai`);
});

test("ECR-AC-2 bai anh khong tin chu co nhan: khong cham, dem khong_chu, khong tinh mat_chu", () => {
  const ket = gopNhan(tins(), NHAN_CHU("3"));
  assert.deepEqual(ket.tin, []);
  assert.equal(ket.khong_chu, 1);
  assert.equal(ket.mat_chu, 0);
  const khongNhan = gopNhan(tins(), []);
  assert.equal(khongNhan.khong_chu, 0, "chưa gắn thì không đếm");
});

test("ECR-AC-2 doi chung: bo nhanh khong tin chu thi URL vao tap cham", () => {
  const dong = tins().map((x) => ({ ...x, ghep: x.item_id === "3" ? null : x.ghep, text: x.item_id === "3" ? U("a3") : x.text }));
  const ket = gopNhan(dong, NHAN_CHU("3"));
  assert.deepEqual(ket.tin.map((x) => x.text), [U("a3")], "đối chứng: không có cờ ghép thì URL lọt vào chấm");
});

test("ECR-AC-3 dong trung cum co nhan: khong cham, dem trung_co_nhan, cum cham mot lan", () => {
  const ket = gopNhan(tins(), [...NHAN_CHU("1"), ...NHAN_CHU("2")]);
  assert.equal(ket.tin.length, 1);
  assert.equal(ket.tin[0].id, "A1");
  assert.equal(ket.trung_co_nhan, 1);
  assert.equal(gopNhan(tins(), NHAN_CHU("1")).trung_co_nhan, 0, "dòng trùng không nhãn thì không đếm");
});

test("ECR-AC-3 dai dien chua nhan: cum gop 0 dong, dong trung van dem", () => {
  const ket = gopNhan(tins(), NHAN_CHU("2"));
  assert.deepEqual(ket.tin, []);
  assert.equal(ket.trung_co_nhan, 1);
});

test("ECR-AC-3 dong vua trung vua khong chu dem vao trung_co_nhan", () => {
  const dong = [{ item_id: "7", ref_id: "A7", ghep: { chu_ref: null, anh_refs: ["A7"], so_chu_gan: 0, trung_voi: "A6" }, text: U("a7") }];
  const ket = gopNhan(dong, NHAN_CHU("7"));
  assert.equal(ket.trung_co_nhan, 1);
  assert.equal(ket.khong_chu, 0);
});

test("ECR-AC-3 doi chung: bo trung_voi thi cum cham hai lan", () => {
  const dong = tins().map((x) => (x.item_id === "2" ? { ...x, ghep: { ...x.ghep, trung_voi: null } } : x));
  assert.equal(gopNhan(dong, [...NHAN_CHU("1"), ...NHAN_CHU("2")]).tin.length, 2, "đối chứng: thiếu cờ trùng thì đếm hai lần");
});

test("ECR-AC-4 ghep null: dem moi bang 0, tin giong dong khong co cot ghep", () => {
  const coCot = gopNhan([{ item_id: "4", ref_id: "T4", ghep: null, text: CHU }, { item_id: "9", ref_id: "M", ghep: null, text: null }], [...NHAN_CHU("4"), ...NHAN_CHU("9")]);
  const khongCot = gopNhan([{ item_id: "4", ref_id: "T4", text: CHU }, { item_id: "9", ref_id: "M", text: null }], [...NHAN_CHU("4"), ...NHAN_CHU("9")]);
  assert.deepEqual(coCot, khongCot);
  assert.equal(coCot.khong_chu, 0);
  assert.equal(coCot.trung_co_nhan, 0);
  assert.equal(coCot.mat_chu, 1);
  assert.equal(coCot.tin.length, 1);
});
