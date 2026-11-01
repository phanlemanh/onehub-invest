// seller-ref-theo-nguoi-gui (HD4): seller_ref của tin S03/S05 là người gửi bài neo, không phải mã agent thu (author_hash).
// Mã người gửi trong test là số bịa. Mỗi kiểm có ca đỏ: bản sao transform-zalo.mjs bị đột biến chép cạnh tệp thật (tên
// mang bộ đếm vì import() nhớ theo URL), nạp, kiểm phải đỏ với thông điệp ghim, rồi xoá.
import { strict as assert } from "node:assert";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { rutDinhDanh } from "../lib/danh-ba-nguoi.mjs";
import { chonNguoiGuiTin } from "../transform-zalo.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const THAT = join(PIPE, "transform-zalo.mjs");
const HANG = "agent-hang-chung"; // author_hash: một giá trị cho mọi bài của nguồn

let dem = 0;
/** Nạp bản sao đột biến của transform-zalo.mjs (mã nguồn qua `doi`), trả module; xoá tệp ngay sau khi nạp. */
async function banSao(doi) {
  const nguon = readFileSync(THAT, "utf8");
  const moi = doi(nguon);
  assert.notEqual(moi, nguon, "đột biến không đổi được mã nguồn — thước đỏ chưa chạy");
  const tep = join(PIPE, `transform-zalo.dotbien-sr-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, moi);
  try {
    return await import(pathToFileURL(tep).href);
  } finally {
    unlinkSync(tep);
  }
}
const MO_HAM = "export function chonNguoiGuiTin(bai) {";
const chen = (bieuThuc) => (s) => s.replace(MO_HAM, `${MO_HAM}\n  return ${bieuThuc};`);

const bai = (post_id, posted_at, sender_id) => ({ post_id, posted_at, sender_id, author_hash: HANG });

// ---- AC-1: mọi bài cùng một người gửi ----
function kiemMotNguoi(chon) {
  const r = chon([bai("p2", "2026-10-02T01:00:00Z", " 123 "), bai("p1", "2026-10-01T01:00:00Z", "123"), bai("p3", "2026-10-03T01:00:00Z", "123")]);
  if (r === HANG) throw new Error("SELLER_REF CON LA HANG");
  if (r !== "123") throw new Error(`SELLER_REF SAI NGUOI: ${r}`);
}
test("SR AC-1: tin một người gửi → seller_ref là sender_id đã trim", () => kiemMotNguoi(chonNguoiGuiTin));
test("SR AC-1 đỏ: bản sao trả author_hash → «SELLER_REF CON LA HANG»", async () => {
  const m = await banSao(chen("bai[0]?.author_hash ?? null"));
  assert.throws(() => kiemMotNguoi(m.chonNguoiGuiTin), /SELLER_REF CON LA HANG/);
});

// ---- AC-2: nhiều người gửi → người gửi bài neo (posted_at sớm nhất, hoà thì post_id nhỏ nhất). Ma trận viết trước ----
const MA_TRAN_NEO = [
  ["neo ở cuối mảng", [bai("p3", "2026-10-03T00:00:00Z", "333"), bai("p2", "2026-10-02T00:00:00Z", "222"), bai("p1", "2026-10-01T00:00:00Z", "111")], "111"],
  ["neo ở giữa", [bai("p5", "2026-10-05T00:00:00Z", "555"), bai("p4", "2026-10-01T00:00:00Z", "444"), bai("p6", "2026-10-06T00:00:00Z", "666")], "444"],
  ["hoà posted_at, post_id nhỏ thắng", [bai("p9", "2026-10-01T00:00:00Z", "999"), bai("p7", "2026-10-01T00:00:00Z", "777"), bai("p8", "2026-10-01T00:00:00Z", "888")], "777"],
  ["posted_at khác múi giờ so theo thời điểm", [bai("pa", "2026-10-01T06:00:00+07:00", "100"), bai("pb", "2026-09-30T23:30:00Z", "200")], "100"], // pa = 30/09 23:00Z, sớm hơn dù chuỗi lớn hơn
];
function kiemNeo(chon) {
  let n = 0;
  for (const [ten, ds, mong] of MA_TRAN_NEO) {
    const r = chon(ds);
    if (r !== mong) throw new Error(`SELLER_REF KHONG THEO NEO: «${ten}» ra ${r}, mong ${mong}`);
    n++;
  }
  return n;
}
test("SR AC-2: ma trận bốn ô — mỗi ô trả người gửi bài neo", () => {
  assert.equal(kiemNeo(chonNguoiGuiTin), MA_TRAN_NEO.length);
});
test("SR AC-2 đỏ: bản sao lấy bài đầu mảng → «SELLER_REF KHONG THEO NEO»", async () => {
  const m = await banSao(chen("bai[0]?.sender_id?.trim() || null"));
  assert.throws(() => kiemNeo(m.chonNguoiGuiTin), /SELLER_REF KHONG THEO NEO/);
});

// ---- AC-3: bài neo thiếu người gửi → bài kế; không ai gửi → null, không rơi về author_hash ----
const MA_TRAN_THIEU = [
  ["neo null", [bai("p1", "2026-10-01T00:00:00Z", null), bai("p2", "2026-10-02T00:00:00Z", "222")], "222"],
  ["neo rỗng", [bai("p1", "2026-10-01T00:00:00Z", ""), bai("p2", "2026-10-02T00:00:00Z", "222")], "222"],
  ["neo chỉ khoảng trắng", [bai("p1", "2026-10-01T00:00:00Z", "   "), bai("p3", "2026-10-03T00:00:00Z", "333"), bai("p2", "2026-10-02T00:00:00Z", "222")], "222"],
  ["không bài nào có người gửi", [bai("p1", "2026-10-01T00:00:00Z", null), { post_id: "p2", posted_at: "2026-10-02T00:00:00Z", author_hash: HANG }], null],
];
function kiemThieu(chon) {
  for (const [ten, ds, mong] of MA_TRAN_THIEU) {
    const r = chon(ds);
    if (r !== mong) throw new Error(`SELLER_REF ROI VE HANG: «${ten}» ra ${r}, mong ${mong}`);
  }
  return MA_TRAN_THIEU.length;
}
test("SR AC-3: bài neo thiếu người gửi → bài kế; không ai gửi → null", () => {
  assert.equal(kiemThieu(chonNguoiGuiTin), MA_TRAN_THIEU.length);
});
test("SR AC-3 đỏ: bản sao rơi về author_hash → «SELLER_REF ROI VE HANG»", async () => {
  const m = await banSao((s) => s.replace("return null; // không bài nào có người gửi", "return bai[0]?.author_hash ?? null;"));
  assert.throws(() => kiemThieu(m.chonNguoiGuiTin), /SELLER_REF ROI VE HANG/);
});

// ---- AC-6: danh bạ Người đọc người gửi theo post_ids, không theo seller_ref (S03/S05) ----
test("SR AC-6: rutDinhDanh của tin S03/S05 không đổi khi seller_ref đổi từ hằng sang người gửi", () => {
  const baiTheoId = new Map([
    ["p1", { source: "S03", sender_id: "111", sender_name: "A" }],
    ["p2", { source: "S03", sender_id: "222", sender_name: "B" }],
    ["q1", { source: "S05", sender_id: "555", sender_name: "C" }],
  ]);
  for (const [source, post_ids, moi] of [["S03", ["p1", "p2"], "111"], ["S05", ["q1"], "555"]]) {
    const tin = { source, seller_name: null, seller_phone: "+84987654321", post_ids };
    assert.deepEqual(rutDinhDanh({ ...tin, seller_ref: HANG }, baiTheoId), rutDinhDanh({ ...tin, seller_ref: moi }, baiTheoId));
  }
  // đối chứng dương: S06 đọc seller_ref — phép so phân biệt được hai giá trị
  const s06 = { source: "S06", seller_name: "D", seller_phone: null, post_ids: [] };
  assert.notDeepEqual(rutDinhDanh({ ...s06, seller_ref: "ct:1" }, baiTheoId), rutDinhDanh({ ...s06, seller_ref: "ct:2" }, baiTheoId));
});
