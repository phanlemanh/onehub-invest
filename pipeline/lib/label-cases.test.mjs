// label-cases.test.mjs — gan-nhan-theo-nhom-s03 AC-8: gom theo nhóm, sắp xếp ổn định, không định danh người gắn.
import { test } from "node:test";
import assert from "node:assert/strict";

import { gomTruongHop } from "./label-cases.mjs";

const DAU = {
  lat: "l",
  items: [
    { item_id: "2", ref_id: "p2", stratum: "U-B", group_name: "Nhóm B" },
    { item_id: "1", ref_id: "p1", stratum: "U-A", group_name: "Nhóm A" },
    { item_id: "3", ref_id: "p3", stratum: "U-A", group_name: "Nhóm A" },
  ],
  reasons: [{ item_id: "3", reason: "z", labeler_id: "usr_a" }, { item_id: "1", reason: "RB = Rainbow", labeler_id: "usr_b" }],
  cases: [
    { item_id: "1", case_kind: "bi-danh", note: "RB", group_card_verdict: "correct", labeler_id: "usr_a" },
    { item_id: "1", case_kind: null, note: null, group_card_verdict: "wrong", labeler_id: "usr_b" },
  ],
  values: [{ item_id: "1", field: "subzone", value: "rainbow", basis: "ngu_canh_nhom", labeler_id: "usr_a" }],
};

test("gom theo nhóm, đúng bốn danh sách, nhóm chưa có gì vẫn hiện", () => {
  const kq = gomTruongHop(DAU);
  assert.deepEqual(kq.nhom.map((n) => [n.unit_code, n.ten]), [["U-A", "Nhóm A"], ["U-B", "Nhóm B"]]);
  const a = kq.nhom[0];
  assert.deepEqual(a.ly_do, [{ ref_id: "p1", ly_do: "RB = Rainbow" }, { ref_id: "p3", ly_do: "z" }]);
  assert.deepEqual(a.truong_hop, [{ ref_id: "p1", loai: "bi-danh", dien_giai: "RB" }]);
  assert.deepEqual(a.the_nhom, [{ ref_id: "p1", tra_loi: "correct" }, { ref_id: "p1", tra_loi: "wrong" }]);
  assert.deepEqual(a.gia_tri_ngu_canh, [{ ref_id: "p1", truong: "subzone", gia_tri: "rainbow", can_cu: "ngu_canh_nhom" }]);
  assert.deepEqual(kq.nhom[1].ly_do, []);
});

test("không có định danh người gắn", () => {
  assert.doesNotMatch(JSON.stringify(gomTruongHop(DAU)), /usr_|labeler/);
});

test("đổi thứ tự dòng đọc vào, kết quả y nguyên", () => {
  const dao = { ...DAU, items: [...DAU.items].reverse(), reasons: [...DAU.reasons].reverse(), cases: [...DAU.cases].reverse() };
  assert.equal(JSON.stringify(gomTruongHop(dao)), JSON.stringify(gomTruongHop(DAU)));
});
