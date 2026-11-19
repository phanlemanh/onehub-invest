// ghep-tin-danh-muc-cham.test.mjs — PL20: chấm độ đúng ba nhóm nguồn từ đầu ra đóng băng và nhãn người (AC-9).
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { dungDanhBa } from "../lib/ghep-tin-danh-muc.mjs";
import { chamBai, chamLat, docBaoCao, kiemDauRa, quyNhan, vietBaoCao } from "./ghep-tin-danh-muc-cham.mjs";

const D = dungDanhBa({
  toa: [{ key: "bld_a", upi: "u", vung_id: "101", ten: ["S1.02"] }, { key: "bld_b", upi: "u2", vung_id: "102", ten: ["S2.05"] }, { key: "bld_c", upi: "u3", vung_id: null, ten: ["GOC1"] }],
  vung: [{ id: "101", cha_id: null, ten: ["The Sapphire 1"] }, { id: "102", cha_id: null, ten: ["The Paris"] }, { id: "103", cha_id: "101", ten: ["Sapphire Dong"] }],
});
const hai = new Map([["1", D]]);
const toa = { muc: "toa", k: "bld_a" }, vung = { muc: "vung", k: "101" };

for (const [ten, may, nhan, mong] of [
  ["may-toa-nguoi-dung-toa", toa, { building: "s1.02" }, true],
  ["may-toa-nguoi-khac-toa", toa, { building: "s2.05" }, false],
  ["may-toa-nguoi-chi-ghi-vung", toa, { subzone: "the sapphire 1" }, false],
  ["may-toa-nguoi-khong-neu", toa, {}, false],
  ["may-toa-nguoi-ghi-ten-la", toa, { building: "h9" }, false],
  ["may-vung-nguoi-dung-vung", vung, { subzone: "the sapphire 1" }, true],
  ["may-vung-nguoi-ghi-toa-trong-vung", vung, { building: "s1.02" }, true],
  ["may-vung-nguoi-ghi-vung-con", vung, { subzone: "sapphire dong" }, true],
  ["may-vung-nguoi-ghi-toa-vung-khac", vung, { building: "s2.05" }, false],
  ["may-vung-nguoi-ghi-vung-khac", vung, { subzone: "the paris" }, false],
  ["may-vung-nguoi-khong-neu", vung, {}, false],
  ["may-vung-nguoi-ghi-toa-chua-co-vung-va-dung-vung", vung, { building: "goc1", subzone: "the sapphire 1" }, true],
  ["may-vung-nguoi-chi-ghi-toa-chua-co-vung", vung, { building: "goc1" }, false],
]) test(ten, () => assert.equal(chamBai(may, quyNhan(nhan, D), D), mong, `ô «${ten}»`));

// Phép chấm đi theo cây danh bạ: máy gắn phân khu S1, người ghi toà S1.05 thì chỉ đúng sau khi danh bạ nối hai phân khu.
const canhCay = (cha) => dungDanhBa({
  toa: [{ key: "bld_s105", upi: "u5", vung_id: "394", ten: ["S1.05"] }],
  vung: [{ id: "41", cha_id: null, ten: ["S1"] }, { id: "394", cha_id: cha, ten: ["The Sapphire 1"] }],
});
for (const [ten, cha, mong] of [["may-vung-nguoi-ghi-toa-phan-khu-chua-noi", null, false], ["may-vung-nguoi-ghi-toa-phan-khu-da-noi", "41", true]]) {
  test(ten, () => { const d = canhCay(cha); assert.equal(chamBai({ muc: "vung", k: "41" }, quyNhan({ building: "s1.05" }, d), d), mong); });
}

/** Tập đủ cỡ: mỗi nhóm 110 bài, người ghi đúng như máy. */
function tapDu() {
  const dong = [], nhan = new Map();
  for (const [stratum, nguon] of [["n1", "A"], ["n2", "C"]]) for (let i = 0; i < 110; i++) {
    const ref_id = `${stratum}-${i}`;
    dong.push({ ref_id, stratum, nguon, muc: "toa", k: "bld_a", du_an: "1", rule_id: "r" });
    nhan.set(ref_id, [{ labeler_id: "m", building: "s1.02" }]);
  }
  return { dong, nhan };
}
const sai = (nhan, id) => nhan.set(id, [{ labeler_id: "m", building: "s2.05" }]);

test("du-co-dung-het-thi-dat", () => {
  const { dong, nhan } = tapDu();
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.equal(r.dat, true);
  for (const n of ["n1", "n2"]) assert.equal(r.nhom[n].trang, "dat", `nhóm ${n}`);
  assert.deepEqual(r.nguon_phai_tat, []);
});
test("mot-bai-sai-van-dat", () => {
  const { dong, nhan } = tapDu(); sai(nhan, "n1-0");
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.equal(r.nhom.n1.trang, "dat");
  assert.ok(r.nhom.n1.wilson >= 0.95);
});
test("hai-bai-sai-o-n2-thi-do-dung-n2", () => {
  const { dong, nhan } = tapDu(); sai(nhan, "n2-0"); sai(nhan, "n2-1");
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.equal(r.dat, false);
  assert.equal(r.nhom.n2.trang, "hut");
  assert.equal(r.nhom.n1.trang, "dat", "nhóm khác không bị kéo theo");
});
test("n2-hut-thi-nguon-c-f-phai-tat", () => {
  const { dong, nhan } = tapDu(); sai(nhan, "n2-0"); sai(nhan, "n2-1");
  assert.deepEqual(chamLat({ dong, nhan, danhBa: hai }).nguon_phai_tat, ["C", "F"]);
});
test("thieu-co-mau-n1-thi-do", () => {
  const { dong, nhan } = tapDu(); nhan.delete("n1-0");
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.equal(r.nhom.n1.trang, "chua-du");
  assert.equal(r.dat, false);
});
test("hai-nguoi-lech-nhau-thi-loai-va-bao", () => {
  const { dong, nhan } = tapDu();
  nhan.set("n1-0", [{ labeler_id: "m", building: "s1.02" }, { labeler_id: "k", building: "s2.05" }]);
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.deepEqual(r.nhom.n1.lech, ["n1-0"]);
  assert.equal(r.nhom.n1.n, 109);
});
test("bao-cao-tach-nguon-muc-khu", () => {
  const { dong, nhan } = tapDu();
  const { n1 } = chamLat({ dong, nhan, danhBa: hai }).nhom;
  assert.deepEqual(n1.theo_nguon.A, { n: 110, dung: 110 });
  assert.deepEqual(n1.theo_muc.toa, { n: 110, dung: 110 });
  assert.deepEqual(n1.theo_khu["1"], { n: 110, dung: 110 });
});
test("dau-ra-ma-cuoi-khac-ban-dong-bang-thi-ghim-ma-bai", () => {
  const dong = [{ ref_id: "p1", muc: "toa", k: "bld_a", nguon: "A", rule_id: "r" }];
  assert.deepEqual(kiemDauRa(dong, new Map([["p1", { muc: "toa", k: "bld_a", nguon: "A", rule_id: "r" }]])), []);
  assert.match(kiemDauRa(dong, new Map([["p1", { muc: "toa", k: "bld_b", nguon: "A", rule_id: "r" }]]))[0], /p1/);
  assert.match(kiemDauRa(dong, new Map())[0], /p1/);
});
test("so-trong-bao-cao-doc-lai-duoc", () => {
  const { dong, nhan } = tapDu();
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.deepEqual(docBaoCao(vietBaoCao(r, "abc")), JSON.parse(JSON.stringify(r)));
});
