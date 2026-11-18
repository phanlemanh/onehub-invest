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

// ---- Mức TIN (AC-8): offer_project đếm mọi dòng dự án sống của MỌI bài trong tin — đóng dấu theo từng bài mà không nhìn cả
// tin là tự sinh xung đột. Đo 17/11 trên bản chép, kịch bản K1: 13 tin rơi sang xung_dot — 9 tin bài đăng lại chéo nhóm của hai
// dự án, 4 tin có một bài chữ nêu dự án khác thẻ.
describe("AC-8 hoà giải ở mức tin: không tự sinh xung đột", () => {
  const T2 = new Map([
    ["g-a", { card_code: "TN-010", version: 1, duAn: "11", areaId: null, phanKhu: null, mucDich: null }],
    ["g-b", { card_code: "TN-011", version: 1, duAn: "44", areaId: null, phanKhu: null, mucDich: null }],
  ]);
  const b = (post_id, conversation_id, tin) => ({ post_id, conversation_id, tin });
  const duAn = (r) => Object.fromEntries(r.dong.filter((d) => d.field === "project_node_id").map((d) => [d.subject_key.slice(4), d.value]));

  test("bài đăng lại chéo hai nhóm, thẻ bất đồng, chữ im: không đoán — 0 dòng dự án trong tin", () => {
    const r = phatBieuDiaChiNhom({ bai: [b("x1", "g-a", "T1"), b("x2", "g-b", "T1")], the: T2, nhanDuAn: new Map() });
    assert.deepEqual(duAn(r), {}, "tin chéo hai nhóm bất đồng mà vẫn đóng hai dự án");
    assert.equal(r.demTin.theBatDong, 1);
  });

  test("một bài chữ nêu dự án khác: chữ bài thắng trên CẢ tin — bài im cùng tin không nhận dự án của thẻ", () => {
    const r = phatBieuDiaChiNhom({
      bai: [b("y1", "g-a", "T2"), b("y2", "g-a", "T2"), b("y3", "g-a", "T2")], the: T2, nhanDuAn: new Map([["y1", "22"]]),
    });
    assert.deepEqual(duAn(r), { y1: "22" }, "bài im cùng tin vẫn nhận dự án thẻ, tin thành hai dự án");
    assert.equal(r.demTin.chuBaiThang, 1);
  });

  test("chữ bài trùng dự án thẻ: giữ cả hai nguồn, tin vẫn một dự án", () => {
    const r = phatBieuDiaChiNhom({ bai: [b("z1", "g-a", "T3"), b("z2", "g-a", "T3")], the: T2, nhanDuAn: new Map([["z1", "11"]]) });
    assert.deepEqual(duAn(r), { z1: "11", z2: "11" });
  });

  test("hai bài chữ nêu hai dự án khác nhau trong một tin: xung đột thật của chữ — 0 dòng dự án", () => {
    const r = phatBieuDiaChiNhom({
      bai: [b("w1", "g-a", "T4"), b("w2", "g-a", "T4")], the: T2, nhanDuAn: new Map([["w1", "22"], ["w2", "33"]]),
    });
    assert.deepEqual(duAn(r), {});
    assert.equal(r.demTin.chuBaiBatDong, 1);
  });

  test("bài khác cùng tin mang dòng dự án của luật khác, khác giá trị, mà hàng này không thay: không đóng dấu dự án cả tin", () => {
    // v2 thuộc nhóm KHÔNG có thẻ đã duyệt, đang mang dòng DV6 = 55; hàng này không rút dòng ấy (không đóng dấu v2).
    const r = phatBieuDiaChiNhom({
      bai: [b("v1", "g-a", "T5"), b("v2", "g-khong", "T5")], the: T2, nhanDuAn: new Map(),
      duAnKhac: new Map([["v2", ["55"]]]),
    });
    assert.deepEqual(duAn(r), {}, "đóng dấu 11 lên v1 trong khi v2 mang 55 là tự sinh xung đột");
    assert.equal(r.demTin.xungLuatKhac, 1);
  });

  test("dòng của luật khác trên CHÍNH bài được đóng dấu không tính — bước sau rút nó", () => {
    const r = phatBieuDiaChiNhom({
      bai: [b("u1", "g-a", "T6")], the: T2, nhanDuAn: new Map(), duAnKhac: new Map([["u1", ["55"]]]),
    });
    assert.deepEqual(duAn(r), { u1: "11" });
  });

  test("dòng phường và phân khu không bị hoà giải dự án kéo theo — chỉ ô dự án bị bỏ", () => {
    const the = new Map([["g-a", { ...T2.get("g-a"), areaId: "vn-p1" }], ["g-b", T2.get("g-b")]]);
    const r = phatBieuDiaChiNhom({ bai: [b("s1", "g-a", "T7"), b("s2", "g-b", "T7")], the, nhanDuAn: new Map() });
    assert.deepEqual(duAn(r), {});
    assert.ok(r.dong.some((d) => d.subject_key === "S03:s1" && d.field === "area_id"), "bỏ nhầm cả ô phường");
  });

  test("bài không mang mã tin thì xét như một tin riêng (giữ hành vi cũ)", () => {
    const r = phatBieuDiaChiNhom({ bai: [{ post_id: "k1", conversation_id: "g-a" }], the: T2, nhanDuAn: new Map() });
    assert.deepEqual(duAn(r), { k1: "11" });
  });
});

// ---- Duyệt TỪNG ĐỢT (đo 17/11 14:39Z trên bản chép: máy thu đã có 6 thẻ duyệt thật) ----
// Tin 7695b269: bài ở TN-010 (duyệt thật, dự án 1), TN-025 (dự án 1), TN-002 (dự án 6). Lượt nền chỉ có TN-010 → tin mang dự án 1.
// Duyệt thêm TN-002 → thẻ bất đồng → bản trước bỏ hết dòng dự án → tin MẤT dự án đang có (10 bài rơi sang «không dự án»).
describe("AC-8 duyệt từng đợt: thẻ bất đồng không được làm tin mất dự án nó đang mang", () => {
  const T3 = new Map([
    ["g-x", { card_code: "TN-010", version: 1, duAn: "1", areaId: null, phanKhu: null, mucDich: null }],
    ["g-y", { card_code: "TN-025", version: 1, duAn: "1", areaId: null, phanKhu: null, mucDich: null }],
    ["g-z", { card_code: "TN-002", version: 1, duAn: "6", areaId: null, phanKhu: null, mucDich: null }],
  ]);
  const b = (post_id, conversation_id) => ({ post_id, conversation_id, tin: "T7695" });
  const bai = [b("x1", "g-x"), b("x2", "g-x"), b("y1", "g-y"), b("z1", "g-z")];
  const duAn = (r) => Object.fromEntries(r.dong.filter((d) => d.field === "project_node_id").map((d) => [d.subject_key.slice(4), d.value]));

  test("tin đang mang đúng một dự án nằm trong các thẻ bất đồng: giữ dự án ấy, chỉ bỏ dòng của thẻ khác", () => {
    const r = phatBieuDiaChiNhom({ bai, the: T3, nhanDuAn: new Map(), duAnHienTai: new Map([["x1", ["1"]], ["x2", ["1"]]]) });
    assert.deepEqual(duAn(r), { x1: "1", x2: "1", y1: "1" }, "tin mất dự án 1 nó đang mang");
    assert.equal(r.demTin.theGiuHienTai, 1);
    assert.equal(r.demTin.theBatDong, 0);
  });

  test("tin chưa mang dự án nào: vẫn không đoán", () => {
    const r = phatBieuDiaChiNhom({ bai, the: T3, nhanDuAn: new Map(), duAnHienTai: new Map() });
    assert.deepEqual(duAn(r), {});
    assert.equal(r.demTin.theBatDong, 1);
  });

  test("tin đang mang dự án KHÔNG nằm trong các thẻ: không đoán", () => {
    const r = phatBieuDiaChiNhom({ bai, the: T3, nhanDuAn: new Map(), duAnHienTai: new Map([["x1", ["9"]]]) });
    assert.deepEqual(duAn(r), {});
  });

  test("tin đang mang HAI dự án (đã xung đột sẵn): không đoán", () => {
    const r = phatBieuDiaChiNhom({ bai, the: T3, nhanDuAn: new Map(), duAnHienTai: new Map([["x1", ["1"]], ["z1", ["6"]]]) });
    assert.deepEqual(duAn(r), {});
  });
});
