// do-yeu-cau.test.mjs — YC0 bang-yeu-cau-noi-lai E9: chiều đỏ của thước do-yeu-cau.mjs --kiem trên hàm đánh giá thuần, không DB.
// Vật lành (tập khớp, đủ sàn, danh sách sync thật) xanh; mỗi cách phá — thiếu bài, thừa bài, nguồn dưới sàn, lượt hai đổi, source lạ,
// cấy bảng Yêu cầu vào bản sao danh sách sync — đỏ đúng thông điệp gọi tên.
import { test } from "node:test";
import assert from "node:assert/strict";

import { danhGia, dsSyncCloud, MOC, nguonYDinh } from "./do-yeu-cau.mjs";

const MOC_NHO = { luat_va_model: 2, luat_mot_minh: 3, chi_model: 1 };
function vatLanh() {
  const trongBang = new Map([
    ["p1", { source: "S03", nguon: "luat_va_model" }], ["p2", { source: "S03", nguon: "luat_va_model" }],
    ["p3", { source: "S03", nguon: "luat_mot_minh" }], ["p4", { source: "S03", nguon: "luat_mot_minh" }],
    ["p5", { source: "S03", nguon: "luat_mot_minh" }], ["p6", { source: "S03", nguon: "chi_model" }],
  ]);
  const trangThai = new Map([...trongBang.keys()].map((k) => [k, k === "p6" ? "cho-duyet" : "song"]));
  return { trongBang, docLap: new Set(trongBang.keys()), lan1: trangThai, lan2: new Map(trangThai), moc: MOC_NHO };
}

test("YC0-AC-9 vật lành: tập khớp, đủ sàn, danh sách sync thật có sale_offers, không có bảng Yêu cầu → xanh", async () => {
  const ds = await dsSyncCloud();
  assert.ok(ds.includes("sale_offers"), "đối chứng dương: danh sách sync đọc được");
  assert.deepEqual(danhGia({ ...vatLanh(), dsSync: ds }).loi, []);
  assert.deepEqual(Object.keys(MOC), ["luat_va_model", "luat_mot_minh", "chi_model"]);
});

test("YC0-AC-9 chiều đỏ: thiếu bài, thừa bài, dưới sàn, lượt hai đổi, source lạ, cấy bảng Yêu cầu vào danh sách sync", async () => {
  const ds = await dsSyncCloud();
  const vang = vatLanh();
  vang.docLap.add("p9");
  assert.deepEqual(danhGia({ ...vang, dsSync: ds }).loi, ["VANG 1 bài (vd p9)"]);

  const thua = vatLanh();
  thua.docLap.delete("p6");
  assert.deepEqual(danhGia({ ...thua, dsSync: ds }).loi, ["THUA 1 bài (vd p6)"]);

  const duoi = vatLanh();
  duoi.trongBang.delete("p3");
  duoi.docLap.delete("p3");
  assert.deepEqual(danhGia({ ...duoi, dsSync: ds }).loi, ["DUOI SAN luat_mot_minh: 2 < 3 (90% mốc 3)"]);

  const doi = vatLanh();
  doi.lan2.set("p6", "song");
  assert.deepEqual(danhGia({ ...doi, dsSync: ds }).loi, ["LAN HAI DOI 1 bài (vd p6)"]);

  const la = vatLanh();
  la.trongBang.set("p1", { source: "zalo", nguon: "luat_va_model" });
  assert.deepEqual(danhGia({ ...la, dsSync: ds }).loi, ["SOURCE KHONG PHAI S0x: zalo"]);

  for (const b of ["inquiries", "inquiry_post_records"]) {
    assert.deepEqual(danhGia({ ...vatLanh(), dsSync: [...ds, b] }).loi, [`SYNC CO ${b}`]);
  }
  assert.deepEqual(danhGia({ ...vatLanh(), dsSync: [] }).loi, ["SYNC: không đọc được danh sách bảng (thiếu sale_offers — đối chứng dương)"]);
});

test("YC0-AC-9 nguồn ý định của dòng", () => {
  assert.equal(nguonYDinh({ luat: true, nhanYeuCau: true }), "luat_va_model");
  assert.equal(nguonYDinh({ luat: true, nhanYeuCau: false }), "luat_mot_minh");
  assert.equal(nguonYDinh({ luat: false, nhanYeuCau: true }), "chi_model");
  assert.equal(nguonYDinh({ luat: false, nhanYeuCau: false }), "khac");
});
