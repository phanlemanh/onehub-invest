// ghep-tin-danh-muc-cham.test.mjs — PL20: chấm độ đúng ba nhóm nguồn từ đầu ra đóng băng và nhãn người (AC-9).
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { dungDanhBa } from "../lib/ghep-tin-danh-muc.mjs";
import { chamBai, chamLat, docBaoCao, docNhap, gopKetQua, kiemDauRa, quyNhan, tachLoaiThe, tiLeSua, vietBaoCao } from "./ghep-tin-danh-muc-cham.mjs";

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

// Bài máy sai phải in kèm cách quy nhãn để người soát lỗ danh bạ trước khi kết luận nhóm hụt.
test("bai-may-sai-ghi-cach-quy-nhan", () => {
  const { dong, nhan } = tapDu(); sai(nhan, "n1-0"); nhan.set("n1-1", [{ labeler_id: "m", building: "h9" }]);
  const r = chamLat({ dong, nhan, danhBa: hai });
  assert.deepEqual(r.nhom.n1.ds_sai, [
    { ref_id: "n1-0", may: "toa/bld_a", nhan: [{ building: "s2.05", subzone: null, quy: { toa: "bld_b" } }] },
    { ref_id: "n1-1", may: "toa/bld_a", nhan: [{ building: "h9", subzone: null, quy: {} }] },
  ]);
  assert.deepEqual(r.nhom.n2.ds_sai, []);
  const md = vietBaoCao(r, "abc");
  assert.match(md, /n1-0 .*toa\/bld_a.*s2\.05.*toa=bld_b/);
  assert.match(md, /n1-1 .*h9.*không quy được/);
});

const CSV = `# chú thích đầu tệp, có dấu phẩy, bỏ qua
item_id,de_xuat_toa,de_xuat_khu,can_cu,luu_toa,luu_khu,manh_sua,gio_de_xuat
1,S1.02,The Sapphire 1,"căn cứ, có phẩy",s1.02,the sapphire 1,không,t
2,S1.02,,x,s2.05,,có,t
3,(Mạnh tự ghi S2.05),S2,x,s2.05,s2,Mạnh quyết,t
4,(KO),S2,x,,s2,không,t
5,S2.03,S2 (Mạnh: «để phân khu cụm luôn»),x,s2.03,s2,,t
6,S1.02,,x,s1.02,,trợ lý bấm Lưu trước lời duyệt; Mạnh duyệt hồi tố «Duyệt hết» 2026-11-21T00:13:33Z,t
7,S1.02,,x,s1.02,,lưu bởi trợ lý sau duyệt lô «Duyệt lô 2» 2026-11-21T00:18:11Z,t
# Từ thẻ 3: đổi model
`;
test("doc-nhap-bo-chu-thich-giu-phay-trong-nhay", () => {
  const m = docNhap(CSV);
  assert.equal(m.size, 7);
  assert.deepEqual(m.get("1"), { toa: "S1.02", khu: "The Sapphire 1", tu_quyet: false, loai: "manh-tung-the", gio_duyet: null });
  assert.deepEqual([m.get("6").loai, m.get("6").gio_duyet], ["luu-truoc-duyet-hoi-to", "2026-11-21T00:13:33Z"]);
  assert.deepEqual([m.get("7").loai, m.get("7").gio_duyet], ["duyet-lo-truoc-luu", "2026-11-21T00:18:11Z"]);
  assert.equal(m.get("3").tu_quyet, true);
  assert.deepEqual([m.get("4").toa, m.get("4").khu, m.get("4").tu_quyet], ["", "S2", false], "«(KO)» là không nêu");
  assert.equal(m.get("5").tu_quyet, true, "ghi chú «(Mạnh: …)» ở ô khu là Mạnh tự quyết");
});
test("ti-le-manh-sua-tinh-tu-nhan-trong-db-theo-nhom", () => {
  const dong = [{ ref_id: "a", stratum: "n1" }, { ref_id: "b", stratum: "n1" }, { ref_id: "c", stratum: "n1" }, { ref_id: "d", stratum: "n2" }, { ref_id: "e", stratum: "n1" }];
  const nhan = new Map([
    ["a", [{ item_id: 1, building: "s1.02", subzone: "the sapphire 1" }]],
    ["b", [{ item_id: 2, building: "s2.05", subzone: null }]],
    ["c", [{ item_id: 3, building: "s2.05", subzone: "s2" }]],
    ["d", [{ item_id: 9, building: "x", subzone: null }]],
    ["e", [{ item_id: 4, building: null, subzone: "s2" }]],
  ]);
  const t = tiLeSua({ dong, nhan, nhap: docNhap(CSV) });
  assert.deepEqual(t.n1, { co_nhap: 4, giu: 2, sua: 1, tu_quyet: 1, ds_sua: ["b"], ds_tu_quyet: ["c"] });
  assert.deepEqual(t.n2, { co_nhap: 0, giu: 0, sua: 0, tu_quyet: 0, ds_sua: [], ds_tu_quyet: [], khong_nhap: 1 });
});

// n2 gắn theo ba cách: Mạnh từng thẻ · duyệt lô rồi mới lưu · lưu trước rồi duyệt hồi tố. Số chấm tách theo cách gắn.
test("tach-so-theo-loai-the-va-bat-gio-luu-truoc-duyet", () => {
  const dong = [
    { ref_id: "p", stratum: "n2", muc: "toa", k: "bld_a", du_an: "1" },
    { ref_id: "q", stratum: "n2", muc: "toa", k: "bld_a", du_an: "1" },
    { ref_id: "r", stratum: "n2", muc: "toa", k: "bld_a", du_an: "1" },
    { ref_id: "s", stratum: "n2", muc: "toa", k: "bld_a", du_an: "1" },
  ];
  const nhan = new Map([
    ["p", [{ item_id: 1, building: "s1.02", labeled_at: "2026-11-21T00:01:00Z" }]],
    ["q", [{ item_id: 6, building: "s2.05", labeled_at: "2026-11-21T00:10:16Z" }]],
    ["r", [{ item_id: 7, building: "s1.02", labeled_at: "2026-11-21T00:18:30Z" }]],
    ["s", [{ item_id: 7, building: "s1.02", labeled_at: "2026-11-21T00:17:00Z" }]],
  ]);
  const t = tachLoaiThe({ dong, nhan, nhap: docNhap(CSV), danhBa: hai });
  assert.deepEqual(t.n2["manh-tung-the"], { n: 1, dung: 1, ds: ["p"], luu_truoc_gio_duyet: [] });
  assert.deepEqual(t.n2["luu-truoc-duyet-hoi-to"], { n: 1, dung: 0, ds: ["q"], luu_truoc_gio_duyet: ["q"] });
  assert.deepEqual(t.n2["duyet-lo-truoc-luu"], { n: 2, dung: 2, ds: ["r", "s"], luu_truoc_gio_duyet: ["s"] }, "lưu trước giờ duyệt thì ghim mã bài");
  const r = chamLat({ dong, nhan, danhBa: hai }); r.loai_the = t;
  assert.match(vietBaoCao(r, "abc"), /n2 \| luu-truoc-duyet-hoi-to \| 1 \| 0 .*\| q \|/);
});

// Vòng 2 AC-9: n1 lấy từ lượt chấm lát vòng 1, n2 từ lát mới; ngưỡng, cỡ mẫu không đổi, hai nhóm đều phải đạt.
test("vong-2-gop-n1-lat-cu-n2-lat-moi", () => {
  const g = (dung, sai) => ({ ...chamLat({ dong: [], nhan: new Map(), danhBa: hai }).nhom.n1, n: dung + sai, dung, sai, trang: sai >= 2 ? "hut" : "dat" });
  assert.deepEqual(gopKetQua(g(109, 1), g(110, 0)).dat, true);
  const r = gopKetQua(g(109, 1), g(108, 2));
  assert.equal(r.dat, false); assert.deepEqual(r.nguon_phai_tat, ["C", "F"]);
  assert.equal(gopKetQua(g(108, 2), g(110, 0)).nguon_phai_tat.join(), "A,B");
});
