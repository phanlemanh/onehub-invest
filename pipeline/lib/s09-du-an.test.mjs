// s09-du-an.test.mjs — hồ sơ toa-s09-hai-khu-vao-danh-ba, E2 (AC-2) + phần thuần của AC-1, AC-10. Fixture tổng hợp, không payload thật.
//   node --test pipeline/lib/s09-du-an.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { cumS09, dongItemS09, khoaTenS09, tienToCum, toaS09 } from "./s09-du-an.mjs";

const b = (id, code, sector, ngay) => ({ id, block_code: code, block_name: code, sector_uuid: sector, handover_date_from: ngay });

// Ma trận viết trước (AC-2): mỗi ô một dự án, một assert.
const MA_TRAN = [
  {
    o: "cung-ten-cung-phan-khu",
    du_an: { insight_by_block: [b("q1", "QA1", "sx", "2027-01-01"), b("q2", "QA1", "sx", null)] },
    mong: { toa: [{ ten: "QA1", ten_chuan: "QA1", block_ids: ["q1", "q2"], sector_id: "sx", handover_date_from: "2027-01-01" }], mo_ho: [] },
  },
  {
    o: "cung-ten-mot-ban-khong-phan-khu-OS2",
    du_an: { insight_by_block: [b("q3", "QS2", undefined, undefined), b("q4", "QS2", "sy", "2026-06-30")] },
    mong: { toa: [{ ten: "QS2", ten_chuan: "QS2", block_ids: ["q3", "q4"], sector_id: "sy", handover_date_from: "2026-06-30" }], mo_ho: [] },
  },
  {
    o: "cung-ten-khac-phan-khu",
    du_an: { insight_by_block: [b("q5", "QB1", "sx", null), b("q6", "QB1", "sy", null)] },
    mong: { toa: [], mo_ho: [{ ten_chuan: "QB1", sector_ids: ["sx", "sy"], block_ids: ["q5", "q6"] }] },
  },
  {
    o: "cach-viet-khac",
    du_an: { insight_by_block: [b("q7", "S1.01", "sz", "2025-01-01"), { id: "q8", block_name: "s1 01", sector_uuid: "sz" }] },
    mong: { toa: [{ ten: "S1.01", ten_chuan: "S1.01", block_ids: ["q7", "q8"], sector_id: "sz", handover_date_from: "2025-01-01" }], mo_ho: [] },
  },
];

for (const ca of MA_TRAN) {
  test(`DA31-AC-2 ô ${ca.o}`, () => {
    assert.deepEqual(toaS09(ca.du_an), ca.mong, `DA31-AC-2 ô ${ca.o}`);
  });
}

test("DA31-AC-2 khoá tên không xoá dấu chấm (S10.1 ≠ S1.01)", () => {
  assert.notEqual(khoaTenS09("S10.1"), khoaTenS09("S1.01"));
  assert.equal(khoaTenS09("s1 01"), "S1.01");
});

// Ma trận cụm viết trước (AC-10, phần thuần).
const CUM = [
  { o: "S10-hai-toa-cung-phan-khu", toa: [["S10.01", "sx"], ["S10.02", "sx"]], mong: [{ tien_to: "S10", sector_id: "sx", ten_chuan: ["S10.01", "S10.02"] }] },
  { o: "GH1-toa-le", toa: [["GH1", "sx"], ["GH2", "sx"]], mong: [] },
  { o: "cung-tien-to-khac-phan-khu", toa: [["S7.01", "sx"], ["S7.02", "sy"]], mong: [] },
  { o: "mot-toa-co-dau-cham", toa: [["S8.01", "sx"]], mong: [] },
];
for (const ca of CUM) {
  test(`DA31-AC-10 ô ${ca.o}`, () => {
    const toa = ca.toa.map(([t, s]) => ({ ten_chuan: t, sector_id: s }));
    assert.deepEqual(cumS09(toa), ca.mong, `DA31-AC-10 ô ${ca.o}`);
  });
}
test("DA31-AC-10 tiền tố", () => {
  assert.equal(tienToCum("S10.07"), "S10");
  assert.equal(tienToCum("GH1"), null);
});

test("DA31-AC-1 dongItemS09 bỏ item hỏng theo lý do, khoá từ payload không từ meta", () => {
  const items = [
    { sourceId: "danh-muc", kind: "danh-muc", fetchedAt: "2026-11-13T12:00:00Z", payload: { soDuAn: 2 } },
    { sourceId: "du-an-p1", kind: "du-an", payload: { chiTiet: { meta: { code: "200" }, data: { id: "p1" } } }, meta: { duAnId: "khac" } },
    { kind: "du-an", payload: { chiTiet: { data: { id: "p2" } } } },
    { sourceId: "x", kind: "la", payload: {} },
    { sourceId: "du-an-p3", kind: "du-an", payload: { chiTiet: { meta: { code: "404" } } } },
  ];
  const { dong, bo } = dongItemS09(items, "snap");
  assert.deepEqual(bo, { "thieu-source-id": 1, "kind-la": 1, "chi-tiet-loi": 1 });
  assert.deepEqual(dong.map((d) => d.source_id), ["danh-muc", "du-an-p1"]);
  assert.ok(!("meta" in dong[1]), "không mang meta");
});
