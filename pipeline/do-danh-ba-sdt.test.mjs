// do-danh-ba-sdt.test.mjs — hồ sơ _acceptance/do-danh-ba-sdt (SD5) E1: hàm thuần tinhSo trên tập viết trước. Mỗi phép đo
// chạy trên bản thật (xanh) và bản chép hỏng cạnh bản thật (đỏ, thông điệp ghim).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as that from "./do-danh-ba-sdt.mjs";
import * as tz from "./transform-zalo.mjs";
import { SQL as SQL_NGUOI } from "./lib/danh-ba-nguoi.mjs";

const TEP = fileURLToPath(new URL("./do-danh-ba-sdt.mjs", import.meta.url));
async function banChep(tim, thay, chay) {
  const goc = readFileSync(TEP, "utf8");
  const moi = goc.replace(tim, thay);
  assert.notEqual(moi, goc, "bản chép không đổi được — mẫu thay đã lệch mã");
  const ban = path.join(path.dirname(TEP), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-do-danh-ba-sdt.mjs`);
  writeFileSync(ban, moi);
  try {
    return await chay(await import(pathToFileURL(ban).href));
  } finally {
    rmSync(ban, { force: true });
  }
}

// Tập viết trước (số SĐT giả, không phải số thật).
const SO = { a: "0911000001", b: "0911000002", c: "0911000003", d: "0911000004", e: "0911000005" };
const tin = [
  // S03: a ↔ u1 (1–1, người SĐT pA chưa gộp) · b ↔ u2 (1–1, pB đã gộp) · c dùng chung u3, u4 · u5 dùng d và e
  { source: "S03", seller_phone: SO.a, seller_phone_hash: "ha", post_ids: ["p1"] },
  { source: "S03", seller_phone: SO.b, seller_phone_hash: "hb", post_ids: ["p2"] },
  { source: "S03", seller_phone: SO.c, seller_phone_hash: "hc", post_ids: ["p3", "p4"] },
  { source: "S03", seller_phone: SO.d, seller_phone_hash: "hd", post_ids: ["p5"] },
  { source: "S03", seller_phone: SO.e, seller_phone_hash: "he", post_ids: ["p6"] },
  // S03: tin hai bài hai số (N4 nhiều) · tin rỗng SĐT mà bài có số (N4 rỗng)
  { source: "S03", seller_phone: null, seller_phone_hash: null, post_ids: ["p7", "p8"] },
  // S05: e2 ↔ v1 (1–1, người SĐT mang bí danh `sdt` — dạng số gốc)
  { source: "S05", seller_phone: "+84911000009", seller_phone_hash: "hx", post_ids: ["q1"] },
];
const bai = {
  S03: new Map([
    ["p1", { sender_id: "u1", text: `bán căn ${SO.a}` }],
    ["p2", { sender_id: "u2", text: `bán căn ${SO.b}` }],
    ["p3", { sender_id: "u3", text: `lh ${SO.c}` }],
    ["p4", { sender_id: "u4", text: `lh ${SO.c}` }],
    ["p5", { sender_id: "u5", text: `lh ${SO.d}` }],
    ["p6", { sender_id: "u5", text: `lh ${SO.e}` }],
    ["p7", { sender_id: null, text: "lh 0912 000 001" }],
    ["p8", { sender_id: null, text: "lh 0912000002" }],
    // N5: dạng «oddd ddd ddd» bộ bóc sót · dạng «09x.xxx.xxx» bắt được · bài 4 số (chạm trần 3) không đếm
    ["r1", { sender_id: null, text: "lh o912 000 003" }], // chữ «o» thay số 0: bộ dò rộng nhận, bộ bóc không (SD2 đã bóc dạng •)
    ["r2", { sender_id: null, text: "lh 091.200.0004" }],
    ["r3", { sender_id: null, text: "0913000001 0913000002 0913000003 091 30•00 004" }],
  ]),
  S05: new Map([["q1", { sender_id: "v1", text: "bán căn 0911000009" }]]),
};
const biDanh = [
  { object_key: "pA", kind: "sdt_bam", value: "ha", source: "S03" },
  { object_key: "pB", kind: "sdt_bam", value: "hb", source: "S03" },
  { object_key: "pC", kind: "sdt_bam", value: "hc", source: "S03" },
  { object_key: "pR", kind: "sdt_bam", value: "hr", source: "S03" }, // có vai đã rút → vẫn tính không vai
  { object_key: "pV", kind: "sdt_bam", value: "hv", source: "S03" }, // có vai chưa rút → không tính
  { object_key: "pX", kind: "sdt", value: "+84911000009", source: "S05" },
  { object_key: "pT", kind: "tai_khoan_nguon", value: "u1", source: "S03" }, // không phải bí danh SĐT
];
const vao = { tin, bai, biDanh, daGop: new Set(["pB"]), coVai: new Set(["pV"]), sellers: 3, sdtTrenTin: 3 };

/** Ma trận viết trước: (nguồn, kiểm, khoá) → số. */
const MONG = [
  ["S03", "n1", "so", 1], ["S03", "n1", "tong", 2],
  ["S03", "n2", "so", 4], ["S03", "n2", "tong", 5],
  ["S03", "n4", "nhieu", 1], ["S03", "n4", "rong", 1],
  ["S03", "n5", "so", 1],
  ["S05", "n1", "so", 1], ["S05", "n1", "tong", 1],
  ["S05", "n2", "so", 1], ["S05", "n2", "tong", 1],
  ["S05", "n4", "nhieu", 0], ["S05", "n4", "rong", 0], ["S05", "n5", "so", 0],
];
function kiemSo(mod) {
  assert.equal(mod.tinhSo.length >= 0, true);
  const kq = mod.tinhSo(vao);
  let soAssert = 0;
  for (const [nguon, kiem, khoa, mong] of MONG) {
    const v = kq[nguon][kiem][khoa];
    if (v !== mong) {
      if (kiem === "n1" && khoa === "so" && v > mong) throw new Error(`N1 DEM CA CAP DA GOP: ${nguon} ${v}`);
      if (kiem === "n5" && v > mong) throw new Error(`N5 KHONG TRU TRAN 3 SO: ${nguon} ${v}`);
      if (nguon === "S05" && (kiem === "n1" || kiem === "n2") && v < mong) throw new Error(`BO SOT BI DANH sdt: ${kiem} ${v}`);
      throw new Error(`LECH ${nguon} ${kiem}.${khoa}: ${v} ≠ ${mong}`);
    }
    soAssert++;
  }
  assert.equal(soAssert, MONG.length);
  assert.deepEqual(kq.sellers.n3, { sellers: 3, sdt_tren_tin: 3 });
}

test("E1 ma trận năm số trên tập viết trước", () => kiemSo(that));
test("E1 bộ bóc là extractPhones của transform-zalo.mjs (cùng tham chiếu hàm)", () => {
  const src = readFileSync(TEP, "utf8");
  assert.match(src, /import \{ extractPhones \} from "\.\/transform-zalo\.mjs";/);
  assert.equal(typeof tz.extractPhones, "function");
});
test("E1 trạng thái theo ngưỡng Hỏi-1 (hai chiều mỗi kiểm)", () => {
  const ca = [
    ["n1", { so: 0 }, "pass"], ["n1", { so: 1 }, "fail"],
    ["n2", { so: 10 }, "pass"], ["n2", { so: 11 }, "fail"],
    ["n3", { sellers: 3, sdt_tren_tin: 3 }, "pass"], ["n3", { sellers: 19, sdt_tren_tin: 208 }, "fail"],
    ["n4", { nhieu: 5, rong: 0 }, "pass"], ["n4", { nhieu: 0, rong: 1 }, "fail"],
    ["n5", { so: 0 }, "pass"], ["n5", { so: 1 }, "fail"],
    ["n6", { trung: 0, thua: 0, thieu: 0, tong: 5 }, "pass"], ["n6", { trung: 1, thua: 0, thieu: 0 }, "fail"],
    ["n6", { trung: 0, thua: 1, thieu: 0 }, "fail"], ["n6", { trung: 0, thua: 0, thieu: 1 }, "fail"],
  ];
  for (const [k, v, mong] of ca) assert.equal(that.xepTrangThai(k, v), mong, `${k} ${JSON.stringify(v)}`);
});
test("E1 dòng ghi: 11 dòng, detail chỉ số đếm", () => {
  const dong = that.veDong(that.tinhSo(vao));
  assert.equal(dong.length, 11);
  for (const d of dong) assert.match(d.detail, /^([a-z_0-9]+=\d+)( [a-z_0-9]+=\d+)*$/, d.detail);
});
test("E1 đối chứng đỏ: đếm cả cặp đã gộp", () =>
  banChep("return k != null && !daGop.has(k) && !daTach.has(k);", "return k != null && !daTach.has(k);", (m) => assert.throws(() => kiemSo(m), /N1 DEM CA CAP DA GOP/)));
test("E1 đối chứng đỏ: không trừ bài chạm trần", () =>
  banChep("if (bat.length >= TRAN_SO_MOI_BAI) continue;", "", (m) => assert.throws(() => kiemSo(m), /N5 KHONG TRU TRAN 3 SO/)));
test("E1 đối chứng đỏ: chỉ đọc sdt_bam", () =>
  banChep('Object.freeze([ALIAS_KIND.sdt_bam, ALIAS_KIND.sdt])', 'Object.freeze([ALIAS_KIND.sdt_bam])', (m) => assert.throws(() => kiemSo(m), /BO SOT BI DANH sdt/)));

// ---- hồ sơ sd3-lam-chat-do-danh-ba (Ngoài-14 của SD3): N6 «mỗi số một người» ----
const P = (n) => `+849010000${String(n).padStart(2, "0")}`; // số bịa dạng E.164
/** Fixture lành: S03 hai tin sống (P1, P2), P3 chỉ có trên tin đã nghỉ; S05 cùng số P1 ở người khác (khác nguồn). */
function lanh() {
  return {
    tin: [
      { source: "S03", seller_phone: P(1), seller_phone_hash: "h1", post_ids: [] },
      { source: "S03", seller_phone: P(2), seller_phone_hash: "h2", post_ids: [] },
      { source: "S05", seller_phone: P(1), seller_phone_hash: "h1", post_ids: [] },
    ],
    bai: {},
    biDanh: [
      { object_key: "pA", kind: "sdt", value: P(1), source: "S03", retired_at: null },
      { object_key: "pB", kind: "sdt", value: P(2), source: "S03", retired_at: null },
      { object_key: "pC", kind: "sdt", value: P(3), source: "S03", retired_at: null },
      { object_key: "pD", kind: "sdt", value: P(1), source: "S05", retired_at: null },
      { object_key: "pE", kind: "sdt_bam", value: "h9", source: "S03", retired_at: null },
    ],
    daGop: new Set(), coVai: new Set(), sellers: 0, sdtTrenTin: 0,
    banGhiSdt: { S03: new Set([P(1), P(2), P(3)]), S05: new Set([P(1)]) },
  };
}
const NGHI = "2026-10-31T00:00:00Z";
/** Ma trận viết trước: tên ô · đột biến trên fixture lành · N6 mong của S03 [trung, thua, thieu, tong]. */
const MA_TRAN_N6 = [
  ["lành (số cùng ở nguồn khác không tính trùng; số chỉ ở tin nghỉ không thừa; sdt_bam không tính)", () => {}, [0, 0, 0, 3]],
  ["một số thuộc hai người cùng nguồn", (f) => f.biDanh.push({ object_key: "pZ", kind: "sdt", value: P(1), source: "S03", retired_at: null }), [1, 0, 0, 3]],
  ["số không có trên bản ghi tin nào của nguồn", (f) => f.biDanh.push({ object_key: "pY", kind: "sdt", value: P(9), source: "S03", retired_at: null }), [0, 1, 0, 4]],
  ["SĐT trên tin sống không người mang", (f) => { f.tin.push({ source: "S03", seller_phone: P(8), seller_phone_hash: "h8", post_ids: [] }); f.banGhiSdt.S03.add(P(8)); }, [0, 0, 1, 3]],
  ["bí danh sdt đã nghỉ trùng số với bí danh còn hiệu lực của người khác", (f) => f.biDanh.push({ object_key: "pW", kind: "sdt", value: P(1), source: "S03", retired_at: NGHI }), [0, 0, 0, 3]],
  ["số trên tin sống chỉ còn ở bí danh sdt đã nghỉ", (f) => { f.tin.push({ source: "S03", seller_phone: P(7), seller_phone_hash: "h7", post_ids: [] }); f.banGhiSdt.S03.add(P(7)); f.biDanh.push({ object_key: "pV", kind: "sdt", value: P(7), source: "S03", retired_at: NGHI }); }, [0, 0, 1, 3]],
];
const KHOA_N6 = ["trung", "thua", "thieu", "tong"];
function kiemN6(mod) {
  let soAssert = 0;
  for (const [ten, dotBien, mong] of MA_TRAN_N6) {
    const f = lanh();
    dotBien(f);
    const kq = mod.tinhSo(f);
    KHOA_N6.forEach((k, i) => {
      if (kq.S03.n6[k] !== mong[i]) throw new Error(`N6 LECH ${k}: «${ten}» ${kq.S03.n6[k]} ≠ ${mong[i]}`);
      soAssert++;
    });
    assert.deepEqual(kq.S05.n6, { trung: 0, thua: 0, thieu: 0, tong: 1 }, `N6 S05 «${ten}»`);
    assert.equal(mod.xepTrangThai("n6", kq.S03.n6), mong.slice(0, 3).every((x) => x === 0) ? "pass" : "fail", `N6 trạng thái «${ten}»`);
  }
  assert.equal(soAssert, MA_TRAN_N6.length * KHOA_N6.length);
  return soAssert;
}
test("LDB E1 ma trận N6 viết trước, mỗi ô một lỗi trên cùng fixture lành", () => {
  assert.equal(kiemN6(that), 24);
});
test("LDB E1 đối chứng đỏ: bản chép bỏ đếm thua → bắt «N6 LECH thua»", () =>
  banChep("thua: [...nguoiCuaSo.keys()].filter((so) => !banGhi.has(so)).length,", "thua: 0,", (m) => assert.throws(() => kiemN6(m), /N6 LECH thua/)));

/** Dòng ghi lên dq_check_results (bảng lên cloud) không được mang SĐT. */
function kiemDetail(dong) {
  for (const d of dong) if (/\+?84\d{9}|(?<!\d)0[35789]\d{8}(?!\d)/.test(d.detail)) throw new Error(`LO SO TRONG DETAIL: ${d.check_name}`);
  return dong.length;
}
test("LDB E2 veDong: 11 dòng, mỗi (kiểm, nguồn) một lần, detail n6 chỉ số đếm", () => {
  const dong = that.veDong(that.tinhSo(lanh()));
  assert.equal(kiemDetail(dong), 11);
  const cap = dong.map((d) => `${d.check_name}|${d.entity}`);
  assert.equal(new Set(cap).size, 11);
  for (const nguon of that.NGUON) for (const k of ["n1", "n2", "n4", "n5", "n6"]) assert.ok(cap.includes(`danh-ba-sdt:${k}|${nguon}`), `${k} ${nguon}`);
  assert.ok(cap.includes("danh-ba-sdt:n3|sellers"));
  for (const d of dong.filter((x) => x.check_name === "danh-ba-sdt:n6")) assert.match(d.detail, /^trung=\d+ thua=\d+ thieu=\d+ tong=\d+$/);
});
test("LDB E2 đối chứng đỏ: detail mang số gốc → bắt «LO SO TRONG DETAIL»", () => {
  const kq = that.tinhSo(lanh());
  kq.S03.n6 = { ...kq.S03.n6, trung: P(1) };
  assert.throws(() => kiemDetail(that.veDong(kq)), /LO SO TRONG DETAIL/);
});

// ---- hồ sơ n1-dem-nguoi-tach (Ngoài-2 của nguoi-noi-theo-sdt): N1 không đếm người đã tách ----
/** S03: ha ↔ u1 (pA) · hb ↔ u2 (pB) · hn ↔ u3 (một–một, SĐT không người nào mang). S05 một cặp hx ↔ v1 (pX). */
function tapTach({ daGop = [], daTach = [] } = {}) {
  return {
    tin: [
      { source: "S03", seller_phone: P(1), seller_phone_hash: "ha", post_ids: ["p1"] },
      { source: "S03", seller_phone: P(2), seller_phone_hash: "hb", post_ids: ["p2"] },
      { source: "S03", seller_phone: P(3), seller_phone_hash: "hn", post_ids: ["p3"] },
      { source: "S05", seller_phone: P(4), seller_phone_hash: "hx", post_ids: ["q1"] },
    ],
    bai: {
      S03: new Map([["p1", { sender_id: "u1", text: "" }], ["p2", { sender_id: "u2", text: "" }], ["p3", { sender_id: "u3", text: "" }]]),
      S05: new Map([["q1", { sender_id: "v1", text: "" }]]),
    },
    biDanh: [
      { object_key: "pA", kind: "sdt", value: P(1), source: "S03", retired_at: null },
      { object_key: "pB", kind: "sdt", value: P(2), source: "S03", retired_at: null },
      { object_key: "pX", kind: "sdt", value: P(4), source: "S05", retired_at: null },
    ],
    daGop: new Set(daGop), daTach: new Set(daTach), coVai: new Set(), sellers: 0, sdtTrenTin: 0,
  };
}
/** Ma trận viết trước: (tên, daGop, daTach) → [n1.so S03, n1.tong S03, cặp đã tách S03]. */
const MA_TRAN_TACH = [
  ["chưa ai gộp, chưa ai tách", [], [], [2, 3, 0]],
  ["pA đã tách", [], ["pA"], [1, 3, 1]],
  ["pA đã tách, pB đã gộp", ["pB"], ["pA"], [0, 3, 1]],
  ["cả hai đã tách", [], ["pA", "pB"], [0, 3, 2]],
];
function kiemTach(mod) {
  let soAssert = 0;
  for (const [ten, daGop, daTach, [so, tong, tach]] of MA_TRAN_TACH) {
    const kq = mod.tinhSo(tapTach({ daGop, daTach }));
    const v = kq.S03.n1;
    if (v.so > so && daTach.length > 0) throw new Error(`N1 DEM CA NGUOI DA TACH: «${ten}» ${v.so}`);
    if (v.so < so) throw new Error(`N1 NUOT NGUOI CHUA GOP: «${ten}» ${v.so} < ${so}`);
    assert.equal(v.so, so, `n1.so «${ten}»`);
    assert.equal(v.tong, tong, `n1.tong «${ten}»`);
    assert.equal(kq.S03.n1Tach, tach, `cặp đã tách «${ten}»`);
    assert.deepEqual(kq.S05.n1, { so: 1, tong: 1 }, `S05 «${ten}»`);
    soAssert += 4;
  }
  assert.equal(soAssert, MA_TRAN_TACH.length * 4);
}
const VE_LOC = "return k != null && !daGop.has(k) && !daTach.has(k);";
test("N1T AC-1/AC-2 ma trận người đã tách · chưa gộp · đã gộp viết trước", () => kiemTach(that));
test("N1T AC-1 đối chứng đỏ: bỏ vế loại người đã tách", () =>
  banChep(VE_LOC, "return k != null && !daGop.has(k);", (m) => assert.throws(() => kiemTach(m), /N1 DEM CA NGUOI DA TACH/)));
test("N1T AC-2 đối chứng đỏ: vế loại nuốt cả người chưa gộp", () =>
  banChep(VE_LOC, "return k != null && !daGop.has(k) && daTach.size === 0;", (m) => assert.throws(() => kiemTach(m), /N1 NUOT NGUOI CHUA GOP/)));
test("N1T AC-3 tập viết trước cũ (không người nào tách) giữ số", () => {
  kiemSo(that);
  assert.equal(that.tinhSo(vao).S03.n1Tach, 0);
});
test("N1T AC-4 không truyền daTach = truyền daTach rỗng", () => {
  const { daTach, ...khong } = tapTach();
  assert.equal(daTach.size, 0);
  const a = that.tinhSo(khong);
  assert.deepEqual(a, that.tinhSo(tapTach()));
  assert.equal(a.S03.n1.so, 2);
});
function kiemKhongNguoi(mod) {
  const v = mod.tinhSo(tapTach({ daTach: ["pZ"] })).S03.n1;
  if (v.so !== 2) throw new Error(`N1 DEM CAP KHONG NGUOI: ${v.so}`); // ha (pA) + hb (pB); hn không người mang
}
test("N1T AC-9 cặp một–một không người mang không vào n1.so, kể cả khi tập đã tách khác rỗng", () => kiemKhongNguoi(that));
test("N1T AC-9 đối chứng đỏ: bỏ vế «có người theo SĐT»", () =>
  banChep(VE_LOC, "return !daGop.has(k) && !daTach.has(k);", (m) => assert.throws(() => kiemKhongNguoi(m), /N1 DEM CAP KHONG NGUOI/)));

/** Client giả của docDuLieu: bảng parties trong bộ nhớ, trả theo vế `WHERE status = '<x>'` của chính câu docDuLieu. */
function clientGia(parties) {
  const cau = [];
  return {
    cau,
    async query(sql) {
      cau.push(sql);
      if (/FROM stg_zalo_posts/.test(sql)) return { rows: [{ post_id: "p1", sender_id: "u1", text: "", snapshot_id: "hanoi__zalo__1", agent_id: null, group_name: "nhóm" }] };
      if (/FROM sellers/.test(sql)) return { rows: [{ sellers: 0, sdt: 0 }] };
      if (/FROM sale_offer_records/.test(sql)) return { rows: [] };
      if (/FROM sale_offers/.test(sql)) return { rows: [{ source: "S03", seller_phone: P(1), seller_phone_hash: "ha", post_ids: ["p1"] }] };
      if (/FROM registry_aliases/.test(sql)) return { rows: [{ object_key: "pA", kind: "sdt", value: P(1), source: "S03", retired_at: null }] };
      const m = sql.match(/FROM parties WHERE status = '(\w+)'/);
      if (m) return { rows: Object.entries(parties).filter(([, s]) => s === m[1]).map(([party_key]) => ({ party_key })) };
      return { rows: [] };
    },
  };
}
test("N1T AC-5 docDuLieu tách tập đã gộp và tập đã tách, trong giao dịch chỉ đọc", async () => {
  const c = clientGia({ pM: "merged", pS: "split", pA: "active" });
  const d = await that.docDuLieu(c);
  assert.deepEqual([...d.daGop], ["pM"]);
  assert.deepEqual([...d.daTach], ["pS"]);
  assert.equal(c.cau[0], "BEGIN TRANSACTION READ ONLY");
  assert.equal(c.cau.at(-1), "COMMIT");
  const i = c.cau.findIndex((s) => /status = 'split'/.test(s));
  assert.ok(i > 0 && i < c.cau.length - 1, "câu đọc split nằm trong giao dịch");
});

/** Mẫu nhãn N1 rút từ bên đọc thật (app/src/lib/dq-labels.ts — chỉ đọc). */
function mauNhanN1() {
  const src = readFileSync(fileURLToPath(new URL("../app/src/lib/dq-labels.ts", import.meta.url)), "utf8");
  const m = src.match(/d\.match\(\/(\^so=[^\n]*?\$)\/\)\) && \[[^\]]*"n1"/);
  assert.ok(m, "không rút được mẫu nhãn N1 từ dq-labels.ts — bên đọc đã đổi");
  return new RegExp(m[1]);
}
function kiemNhanN1(dong) {
  const mau = mauNhanN1();
  for (const d of dong.filter((x) => x.check_name === "danh-ba-sdt:n1")) if (!mau.test(d.detail)) throw new Error(`DETAIL N1 LECH NHAN OPS: ${d.detail}`);
}
test("N1T AC-6 đường đêm docDuLieu → tinhSo → veDong: S03 đạt khi cặp duy nhất thuộc người đã tách", async () => {
  const dong = that.veDong(that.tinhSo(await that.docDuLieu(clientGia({ pA: "split" }))));
  assert.equal(dong.length, 11);
  const n1 = dong.find((d) => d.check_name === "danh-ba-sdt:n1" && d.entity === "S03");
  assert.equal(n1.status, "pass");
  assert.equal(n1.detail, "so=0 tong=1");
  kiemNhanN1(dong);
});
test("N1T AC-6 đối chứng đỏ: detail N1 thêm khoá tach= lệch nhãn ops", () => {
  const dong = that.veDong(that.tinhSo(tapTach({ daTach: ["pA"] })));
  kiemNhanN1(dong);
  for (const d of dong) if (d.check_name === "danh-ba-sdt:n1") d.detail += " tach=1";
  assert.throws(() => kiemNhanN1(dong), /DETAIL N1 LECH NHAN OPS/);
});

/** Áp một câu ghi trạng thái của danh bạ Người lên bảng trong bộ nhớ: giá trị SET và trạng thái cần có rút từ chính câu ghi. */
function apCauGhi(parties, sql, key) {
  const dat = sql.match(/SET status = '(\w+)'/)[1];
  const can = [...sql.matchAll(/status = '(\w+)'/g)].at(-1)[1];
  if (parties[key] === can) parties[key] = dat;
}
test("N1T AC-7 ba đêm active → gộp → tách, trạng thái đặt bằng SQL.gop và SQL.tach thật", async () => {
  const parties = { pA: "active" };
  const dem = async () => that.tinhSo(await that.docDuLieu(clientGia(parties))).S03.n1.so;
  const so = [await dem()];
  apCauGhi(parties, SQL_NGUOI.gop, "pA");
  assert.equal(parties.pA, "merged", "SQL.gop không đưa active về merged");
  so.push(await dem());
  apCauGhi(parties, SQL_NGUOI.tach, "pA");
  assert.equal(parties.pA, "split", "SQL.tach không đưa merged về split");
  so.push(await dem());
  assert.deepEqual(so, [1, 0, 0]);
});

test("N1T AC-8 stdout bước đêm: một dòng cap_da_tach mỗi nguồn, dòng ghi không mang số này", () => {
  const kq = that.tinhSo(tapTach({ daTach: ["pA", "pB"] }));
  const dong = that.inBang(kq);
  assert.deepEqual(dong.filter((l) => l.includes("cap_da_tach")), ["danh-ba-sdt:n1 S03 cap_da_tach=2", "danh-ba-sdt:n1 S05 cap_da_tach=0"]);
  const ghi = that.veDong(kq);
  assert.equal(ghi.length, 11);
  for (const d of ghi) assert.doesNotMatch(d.detail, /cap_da_tach/);
  for (const d of ghi) assert.ok(dong.includes(`${d.check_name} ${d.entity} ${d.status} ${d.detail}`));
  assert.match(readFileSync(TEP, "utf8"), /for \(const l of inBang\(kq\)\) console\.log\(l\);/);
});
