// do-danh-ba-sdt.test.mjs — hồ sơ _acceptance/do-danh-ba-sdt (SD5) E1: hàm thuần tinhSo trên tập viết trước. Mỗi phép đo
// chạy trên bản thật (xanh) và bản chép hỏng cạnh bản thật (đỏ, thông điệp ghim).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as that from "./do-danh-ba-sdt.mjs";
import * as tz from "./transform-zalo.mjs";

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
  ];
  for (const [k, v, mong] of ca) assert.equal(that.xepTrangThai(k, v), mong, `${k} ${JSON.stringify(v)}`);
});
test("E1 dòng ghi: 9 dòng, detail chỉ số đếm", () => {
  const dong = that.veDong(that.tinhSo(vao));
  assert.equal(dong.length, 9);
  for (const d of dong) assert.match(d.detail, /^([a-z_0-9]+=\d+)( [a-z_0-9]+=\d+)*$/, d.detail);
});
test("E1 đối chứng đỏ: đếm cả cặp đã gộp", () =>
  banChep("return k != null && !daGop.has(k);", "return k != null;", (m) => assert.throws(() => kiemSo(m), /N1 DEM CA CAP DA GOP/)));
test("E1 đối chứng đỏ: không trừ bài chạm trần", () =>
  banChep("if (bat.length >= TRAN_SO_MOI_BAI) continue;", "", (m) => assert.throws(() => kiemSo(m), /N5 KHONG TRU TRAN 3 SO/)));
test("E1 đối chứng đỏ: chỉ đọc sdt_bam", () =>
  banChep('Object.freeze([ALIAS_KIND.sdt_bam, ALIAS_KIND.sdt])', 'Object.freeze([ALIAS_KIND.sdt_bam])', (m) => assert.throws(() => kiemSo(m), /BO SOT BI DANH sdt/)));
