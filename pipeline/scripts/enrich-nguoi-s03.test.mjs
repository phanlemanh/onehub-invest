// enrich-nguoi-s03.test.mjs — hồ sơ _acceptance/enrich-nguoi-s03 (E1, E3): phần thuần của sổ liên lạc và luật chọn số, không DB.
// Ca DB (E1–E6 qua transform S03 thật) ở enrich-nguoi-s03.itest.mjs. Mỗi phép đo có chiều đỏ trên cùng fixture, ghim thông điệp.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { RULE_QUA_NGUOI } from "../lib/danh-ba-nguoi.mjs";
import { chonSoNguoi, rutLienLac } from "../lib/lien-lac-nguoi.mjs";
import { kiemBatBien, MOC_0611 } from "../do-lien-lac-nguoi.mjs";

const so = (n) => `+84399000${String(n).padStart(3, "0")}`; // E.164 của 0399000nnn
const chu = (n) => `0399000${String(n).padStart(3, "0")}`;

// ---------- Ca thuần ----------

const bai = (post_id, sender_id, text) => ({ post_id, sender_id, text });
const tin = (offer_id, seller_ref, seller_phone, fp) => ({ offer_id, seller_ref, seller_phone, field_provenance: fp ?? {} });

/** AC-1: bảng 7 ô viết trước — người gửi → kết quả mong. */
const O_AC1 = [
  { o: "so-tren-tin", ai: "A", mong: [[so(101), "so_tren_tin"]] },
  { o: "so-trong-bai", ai: "B", mong: [[so(102), "so_trong_bai"]] },
  { o: "so-chung-hai-nguoi", ai: "C", mong: [] },
  { o: "so-da-suy", ai: "S", mong: [] },
  { o: "chua-co-nguoi", ai: "E", mong: [] },
  { o: "sai-dang", ai: "F", mong: [] },
  { o: "hai-rule-cung-so", ai: "G", mong: [[so(107), "so_tren_tin"]] },
];
const BAI_AC1 = [
  bai("p1", "A", `Cho thuê 1PN 41m2 giá 7.31 triệu lh ${chu(101)}`),
  bai("p2", "B", `ib ${chu(102)}`),
  bai("p3", "C", `${chu(103)}`),
  bai("p4", "D", `lh ${chu(103)}`),
  bai("p5", "E", `${chu(105)}`),
  bai("p6", "F", "0123 456 789"),
  bai("p7", "G", `Bán 2PN giá 3.71 tỷ lh ${chu(107)}`),
  bai("p8", "G", `${chu(107)} nhé`),
];
const TIN_AC1 = [
  tin("o1", "A", so(101)),
  tin("o7", "G", so(107)),
  tin("o9", "S", so(109), { seller_phone: { rule_id: RULE_QUA_NGUOI } }),
];
const NGUOI_AC1 = new Map(["A", "B", "C", "D", "S", "F", "G"].map((x) => [x, `pty_${x}`]));

function kiemAC1(kq) {
  assert.equal(O_AC1.length, 7);
  for (const { o, ai, mong } of O_AC1) {
    const co = kq.lienLac.filter((l) => l.party_key === `pty_${ai}`).map((l) => [l.value, l.rule_id]);
    assert.deepEqual(co, mong, `EN-AC-1 ô ${o}: liên lạc ${JSON.stringify(co)}, mong ${JSON.stringify(mong)}`);
  }
  for (const l of kq.lienLac) {
    assert.deepEqual(Object.keys(l.evidence).sort().filter((k) => !["post_ids", "n_bai", "n_bai_ngan", "offer_ids"].includes(k)), [],
      "EN-AC-1: bằng chứng chỉ mang mã bài/tin và số đếm");
  }
  assert.equal(kq.so_chung, 1, "EN-AC-1 ô so-chung-hai-nguoi: so_chung");
  assert.equal(kq.khong_nguoi, 1, "EN-AC-1 ô chua-co-nguoi: khong_nguoi");
}

test("EN-AC-1 thuần: bảng 7 ô liên lạc", () => {
  kiemAC1(rutLienLac(BAI_AC1, TIN_AC1, NGUOI_AC1));
});

test("EN-AC-1 chiều đỏ: tắt luật số chung thì ô so-chung-hai-nguoi đỏ", () => {
  assert.throws(() => kiemAC1(rutLienLac(BAI_AC1, TIN_AC1, NGUOI_AC1, { loaiSoChung: false })), /ô so-chung-hai-nguoi/);
});

/** AC-3: bảng 8 ô viết trước. */
const L = (id, value, rule_id, extra = {}) => ({ id, kind: "sdt", value, rule_id, ...extra });
const O_AC3 = [
  { o: "0-so", ds: [], mong: null },
  { o: "1-tin", ds: [L(1, so(1), "so_tren_tin")], mong: so(1) },
  { o: "1-bai", ds: [L(2, so(2), "so_trong_bai")], mong: so(2) },
  { o: "1-tin-1-bai", ds: [L(3, so(3), "so_tren_tin"), L(4, so(4), "so_trong_bai")], mong: so(3) },
  { o: "2-tin", ds: [L(5, so(5), "so_tren_tin"), L(6, so(6), "so_tren_tin")], mong: null },
  { o: "0-tin-2-bai", ds: [L(7, so(7), "so_trong_bai"), L(8, so(8), "so_trong_bai")], mong: null },
  { o: "da-gop", ds: [L(9, so(9), "so_trong_bai"), L(10, so(9), "so_tren_tin")], mong: so(9) }, // hai người trong chuỗi gộp, cùng số
  { o: "ho-so-chat-va-da-rut", ds: [{ id: 11, kind: "chat_profile", value: "z", rule_id: "so_tren_tin" },
    L(12, so(12), "so_tren_tin", { retracted_at: "2026-11-06" }), L(13, so(13), "so_trong_bai")], mong: so(13) },
];
function kiemAC3(opt) {
  assert.equal(O_AC3.length, 8);
  for (const { o, ds, mong } of O_AC3) {
    assert.equal(chonSoNguoi(ds, opt)?.value ?? null, mong, `EN-AC-3 ô ${o}`);
  }
}
test("EN-AC-3 thuần: bảng 8 ô luật chọn số", () => kiemAC3());
test("EN-AC-3 chiều đỏ: đảo ưu tiên tin/bài thì ô 1-tin-1-bai đỏ", () => {
  assert.throws(() => kiemAC3({ uuTienBai: true }), /ô 1-tin-1-bai/);
});


// ---------- AC-8: bất biến của lệnh đo (thuần) ----------


const DO_XANH = {
  md5_truoc: "a", md5_sau: "a", truoc: { co_so: 2553 }, sau: { co_so: 3308, tin_song: MOC_0611.tin_song },
  suy_truoc: 0, suy_sau: 755, gan: { so_tren_tin: 662, so_trong_bai: 93, thue: 594, ban: 161 },
};
test("EN-AC-8 thuần: lượt đo xanh không có mã lỗi; mỗi mã đỏ có ca của nó", () => {
  assert.deepEqual(kiemBatBien(DO_XANH), []);
  const ca = [
    ["DB-DOI", { md5_sau: "b" }],
    ["GAN-LECH-SO", { sau: { ...DO_XANH.sau, co_so: 3300 } }],
    ["KHONG-GAN", { suy_sau: 0, sau: { ...DO_XANH.sau, co_so: 2553 }, gan: { so_tren_tin: 0, so_trong_bai: 0, thue: 0, ban: 0 } }],
    ["LECH-MOC:so_trong_bai", { gan: { ...DO_XANH.gan, so_trong_bai: 0 } }], // tắt rule bài trả lời
    ["LECH-MOC:thue", { gan: { ...DO_XANH.gan, thue: 400 } }],
  ];
  for (const [ma, doi] of ca) assert.ok(kiemBatBien({ ...DO_XANH, ...doi }).includes(ma), `EN-AC-8: thiếu mã ${ma}`);
  // quy đổi theo số tin sống: bản sao lớn gấp đôi thì gán gấp đôi vẫn xanh
  const doi = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * 2]));
  assert.deepEqual(kiemBatBien({ ...DO_XANH, sau: { co_so: 2553 + 1510, tin_song: 2 * MOC_0611.tin_song }, suy_sau: 1510, gan: doi(DO_XANH.gan) }), []);
});
