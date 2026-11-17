// dong-dau-dia-chi.test.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2) Task 2: hàm thuần sinh dòng phát biểu từ thẻ.
// Không DB. Phục vụ E2 (AC-2), E3 (AC-3 ma trận «chữ bài × thẻ»), E5 (AC-4 bốn ô đúng chỗ) và Review Focus 3, 4, 5.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { METHOD_VERSION, RULE_ID, phatBieuDiaChiNhom } from "../lib/dia-chi-the-nhom.mjs";

// Giá trị bigint dạng chuỗi — đúng dạng bộ đọc thẻ trả (pg trả chuỗi).
const THE = new Map([
  ["g-mot", { card_code: "TN-001", version: 2, duAn: "11", areaId: "vn-p1", phanKhu: "21", mucDich: "sale" }],
  ["g-hai", { card_code: "TN-002", version: 1, duAn: null, areaId: "vn-p2", phanKhu: null, mucDich: null }],
  ["g-rong", { card_code: "TN-003", version: 1, duAn: null, areaId: null, phanKhu: null, mucDich: null }],
]);
const bai = (post_id, conversation_id) => ({ post_id, conversation_id, posted_at: "2026-11-10T00:00:00Z" });
const duAnCua = (r, pid) => r.dong.filter((d) => d.subject_key === `S03:${pid}` && d.field === "project_node_id");

describe("AC-3 ma trận chín ô «chữ bài × thẻ»: mỗi bài đúng một hoặc không dòng dự án", () => {
  // chữ: im · cùng dự án thẻ (11) · dự án khác (12) — thẻ: một dự án · hai dự án · nhóm không có thẻ đã duyệt
  const O = [
    ["im×mot", "g-mot", null, "11", "the"],
    ["cung×mot", "g-mot", "11", "11", "chu_bai"],
    ["khac×mot", "g-mot", "12", "12", "chu_bai"],
    ["im×hai", "g-hai", null, null, null],
    ["cung×hai", "g-hai", "11", "11", "chu_bai"],
    ["khac×hai", "g-hai", "12", "12", "chu_bai"],
    ["im×khong", "g-khong", null, null, null],
    ["cung×khong", "g-khong", "11", null, null],
    ["khac×khong", "g-khong", "12", null, null],
  ];
  const r = phatBieuDiaChiNhom({
    bai: O.map(([pid, g]) => bai(pid, g)),
    the: THE,
    nhanDuAn: new Map(O.filter((o) => o[2]).map((o) => [o[0], o[2]])),
  });

  for (const [pid, , chu, can, nguon] of O) {
    test(`ô ${pid}`, () => {
      const d = duAnCua(r, pid);
      assert.ok(d.length <= 1, `bài ${pid}: ${d.length} dòng dự án, cần một hoặc không`);
      assert.equal(d[0]?.value ?? null, can, `bài ${pid}: chữ bài ${chu ?? "im"} → dự án ${d[0]?.value ?? "không"} (cần ${can ?? "không"})`);
      assert.equal(d[0]?.evidence.nguon_o ?? null, nguon, `bài ${pid}: nguồn ô ${d[0]?.evidence.nguon_o} (cần ${nguon})`);
    });
  }
});

describe("AC-4 bốn ô đúng chỗ", () => {
  const r = phatBieuDiaChiNhom({ bai: [bai("p1", "g-mot")], the: THE, nhanDuAn: new Map() });

  test("ba trường thành phát biểu, đúng lớp, phương pháp, luật, phiên bản, căn cứ ba khoá", () => {
    assert.deepEqual(r.dong.map((d) => d.field).sort(), ["area_id", "project_node_id", "subzone_node_id"]);
    for (const d of r.dong) {
      assert.equal(d.subject_key, "S03:p1");
      assert.equal(d.evidence_tier, "inferred");
      assert.equal(d.method, "e1_rule");
      assert.equal(d.rule_id, RULE_ID);
      assert.equal(d.rule_id, "dia-chi-the-nhom");
      assert.equal(d.method_version, METHOD_VERSION);
      assert.equal(d.method_version, "dong-dau-dia-chi@1");
      assert.deepEqual(Object.keys(d.evidence).sort(), ["ban", "nguon_o", "the"], `${d.field}: căn cứ thiếu hoặc thừa khoá`);
      assert.deepEqual(d.evidence, { the: "TN-001", ban: 2, nguon_o: "the" });
      assert.equal(d.observed_at, "2026-11-10T00:00:00Z");
    }
    assert.equal(r.dong.find((d) => d.field === "area_id").value, "vn-p1");
    assert.equal(r.dong.find((d) => d.field === "subzone_node_id").value, "21");
  });

  test("bán/thuê KHÔNG thành phát biểu — nó đi cột kind qua suyLoai", () => {
    assert.ok(!r.dong.some((d) => /kind|purpose/.test(d.field)));
  });

  test("chữ bài đã nêu phường thì thẻ không ghi ô phường cho bài ấy (chữ bài trước)", () => {
    const r2 = phatBieuDiaChiNhom({ bai: [bai("p2", "g-mot")], the: THE, nhanDuAn: new Map(), phuongChu: new Set(["p2"]) });
    assert.ok(!r2.dong.some((d) => d.field === "area_id"), "thẻ đè phường mà chữ bài đã nêu");
    assert.ok(r2.dong.some((d) => d.field === "project_node_id"), "bỏ nhầm cả ô dự án");
  });

  test("thẻ khác khoá nhóm không lọt vào căn cứ (khoá nhóm là tầng A)", () => {
    assert.ok(!JSON.stringify(r.dong).includes("g-mot"), "khoá nhóm nằm trong dòng phát biểu");
  });
});

describe("Review Focus và tập bài được đóng dấu", () => {
  test("RF3 thẻ đã duyệt mà mọi ô trống: 0 dòng, không ném", () => {
    const r = phatBieuDiaChiNhom({ bai: [bai("p-rong", "g-rong")], the: THE, nhanDuAn: new Map() });
    assert.equal(r.dong.length, 0);
    assert.deepEqual(r.baiDong, []);
  });

  test("RF4 chữ bài nêu tên ngoài danh bạ (vắng trong nhanDuAn) thì rơi về thẻ, không mất dự án", () => {
    const r = phatBieuDiaChiNhom({ bai: [bai("p-ngoai", "g-mot")], the: THE, nhanDuAn: new Map() });
    assert.equal(duAnCua(r, "p-ngoai")[0].value, "11");
    assert.equal(duAnCua(r, "p-ngoai")[0].evidence.nguon_o, "the");
  });

  test("RF5 bài không có khoá nhóm: 0 dòng, không ném", () => {
    const r = phatBieuDiaChiNhom({ bai: [bai("p-tre", null)], the: THE, nhanDuAn: new Map() });
    assert.equal(r.dong.length, 0);
  });

  test("baiDong là đúng tập bài có ít nhất một dòng — phạm vi rút dòng cũ ở bước sau", () => {
    const r = phatBieuDiaChiNhom({
      bai: [bai("a", "g-mot"), bai("b", "g-hai"), bai("c", "g-rong"), bai("d", "g-khong"), bai("e", null)],
      the: THE, nhanDuAn: new Map(),
    });
    // b: thẻ hai dự án vẫn có ô phường → có dòng; c: thẻ rỗng; d: không thẻ; e: không khoá
    assert.deepEqual([...r.baiDong].sort(), ["S03:a", "S03:b"]);
  });

  test("đếm theo nguồn của ô dự án: the · chu_bai · bo", () => {
    const r = phatBieuDiaChiNhom({
      bai: [bai("a", "g-mot"), bai("b", "g-mot"), bai("c", "g-hai")],
      the: THE, nhanDuAn: new Map([["b", "12"]]),
    });
    assert.deepEqual(r.demTheoNguon, { the: 1, chu_bai: 1, bo: 1 });
  });
});
