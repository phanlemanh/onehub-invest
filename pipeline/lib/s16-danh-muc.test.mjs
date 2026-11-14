// s16-danh-muc.test.mjs — DA33 nap-s16-vao-danh-ba: lõi thuần stg S16 (E3 ma trận chọn toà, phần thuần của E1).
// Fixture tổng hợp viết trước, mã tiền tố Q; không payload thật, không tên nguồn.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  KIND_S16, NOI_DU_AN_S16, boHost, chonToa, dongS16, duoiDuAn, khoaMa, s16Ref,
} from "./s16-danh-muc.mjs";
import { FIXTURE } from "../scripts/s16-fixture.mjs";

// ---- AC-3: ma trận năm ô, một assert mỗi ô ----
const nhomMot = (dong) => new Set(dong.map((d) => `${d.du_an}|${khoaMa(d.ma_can)}`)).size;

test("DA33-AC-3 ô1 cùng mã khác nhãn khu → một căn", () => {
  assert.equal(nhomMot([{ du_an: "q", ma_can: "QS2.081101" }, { du_an: "q", ma_can: "QS2.081101" }]), 1, "ô1 khác-khu");
});
test("DA33-AC-3 ô2 cùng mã khác hoa thường, khoảng trắng → một căn", () => {
  assert.equal(nhomMot([{ du_an: "q", ma_can: "qs2.081101 " }, { du_an: "q", ma_can: "QS2.081101" }]), 1, "ô2 hoa-thuong");
});
test("DA33-AC-3 ô3 toà thật + nhãn gom → chọn toà thật", () => {
  assert.deepEqual(chonToa("QS2.051101", ["QS2.05", "QRAINBOW"]), { toa: "QS2.05" }, "ô3 nhan-gom");
});
test("DA33-AC-3 ô4 hai toà đều là tiền tố → mơ hồ kèm hai tên", () => {
  assert.deepEqual(chonToa("QS2.051101", ["QS2.05", "QS2.0"]), { mo_ho: ["QS2.0", "QS2.05"] }, "ô4 hai-tien-to");
});
test("DA33-AC-3 ô5 không toà nào là tiền tố → mơ hồ", () => {
  assert.deepEqual(chonToa("QX1", ["QA", "QB"]), { mo_ho: ["QA", "QB"] }, "ô5 khong-tien-to");
});
test("DA33-AC-3 một toà duy nhất → chọn dù không là tiền tố (lô, liền kề)", () => {
  assert.deepEqual(chonToa("QLO-07", ["Q Lien Ke"]), { toa: "Q Lien Ke" });
});

// ---- dongS16: fixture đủ 11 kind (pipeline/scripts/s16-fixture.mjs) ----
const SNAP = "q__s16__2026-11-14T000000000";

test("DA33-AC-1 dongS16 đủ 11 kind: số dòng và lý do bỏ", () => {
  const r = dongS16(FIXTURE, SNAP);
  assert.equal(KIND_S16.size, 11);
  assert.equal(r.item.length, 11, "item hợp lệ");
  assert.deepEqual(r.bo, { "thieu-source-id": 1, "kind-la": 1, "csv-loi": 1, "jsonl-loi": 1 });
  assert.equal(r.khu.length, 3, "k1, k2 từ csv + k3 từ toa-khong-alias");
  assert.deepEqual(r.toa.map((t) => t.toa_id).sort(), ["t1", "t2", "t3"]);
  assert.equal(r.can.length, 5, "trùng y hệt bỏ một: 102,101,S01 pha1 + HA11 pha2 + 103 pha3");
  const t1 = r.toa.find((t) => t.toa_id === "t1");
  assert.equal(t1.khu_id, "k1", "pha 1 nối khu_id qua khu_alias");
  const c = r.can.find((x) => x.ma_can === "QS2.081102");
  assert.equal(c.toa_id, "t1", "pha 1 nối toa_id qua (du_an, khu_alias, toa_ten)");
  assert.equal(r.can.find((x) => x.ma_can === "QHA11-SP.10-02").tang, "10");
  assert.equal(r.can.find((x) => x.ma_can === "QHA11-SP.10-02").khu_nhan, "k3", "pha 2 khu lấy từ khoá toà");
  for (const it of r.item) assert.ok(!JSON.stringify(it.payload).match(/"url":"[a-z]+:\/\//), `url còn host ở ${it.source_id}`);
});

test("DA33-AC-1 boHost bỏ host, giữ đường và truy vấn", () => {
  assert.equal(boHost("https://x.y/a/b?c=1"), "/a/b?c=1");
  assert.equal(boHost("/a"), "/a");
  assert.equal(boHost(null), null);
});

test("DA33 NOI_DU_AN_S16 đúng năm cặp đã duyệt ở Cổng Phạm vi", () => {
  assert.deepEqual({ ...NOI_DU_AN_S16 }, {
    "ocean-park": "vinhomes-ocean-park-1",
    "ocean-park-2": "vinhomes-ocean-park-2",
    "ocean-park-3": "vinhomes-ocean-park-3",
    "smart-city": "vinhomes-smart-city",
    "grand-park": "vinhomes-grand-park",
  });
  assert.equal(duoiDuAn("qb-ocean-park-2"), "ocean-park-2");
});

test("DA33 s16Ref 16 hex, ổn định, khác đầu vào thì khác", () => {
  assert.match(s16Ref("qb-qa", "QS2.081101"), /^[0-9a-f]{16}$/);
  assert.equal(s16Ref("a", "b"), s16Ref("a", "b"));
  assert.notEqual(s16Ref("a", "b"), s16Ref("a", "c"));
});
