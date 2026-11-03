// s03-len-cong.test.mjs — hồ sơ _acceptance/s03-len-cong (SL1): ma trận thuần khu vực và loại hình, mỗi thước có ca đỏ trên bản sao đột biến.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import { docLoaiHinh, ganKhuVuc, gopKhuVuc, loaiHinhNhom, mucTinCay } from "../transform-zalo.mjs";
import { saiNang, soTin } from "./do-s03-len-cong.mjs";

const TZ = join(import.meta.dirname, "../transform-zalo.mjs");
const PH = { id: "vn-hanoi-a", slug: "a" };
const MA = new Set(["hanoi", "hcm"]);

const MA_TRAN_KV = [
  ["khai một, không phường", { khai: ["hanoi"], ph: null }, { areaId: "hanoi", phuong: null }],
  ["khai một, có phường", { khai: ["hanoi"], ph: PH }, { areaId: PH.id, phuong: PH.slug }],
  // entries(khai) chỉ đối chiếu phường của thị trường nhóm, nên phường nơi khác đến đây với ph = null: đo ở ca DB của itest.
  ["khai một, mã không có thật", { khai: ["vn-khong-co"], ph: null }, { areaId: null, phuong: null }],
  ["chưa khai", { khai: undefined, ph: null }, { areaId: null, phuong: null }],
  ["khai hai", { khai: ["hanoi", "hcm"], ph: null }, { areaId: null, phuong: null }],
];

function kiemMaTran(gan) {
  let n = 0;
  for (const [ten, vao, ra] of MA_TRAN_KV) {
    assert.deepEqual(gan({ ...vao, maCoThat: MA }), ra, `SL1-AC-1 dòng «${ten}»`);
    n++;
  }
  return n;
}

async function banSao(thay) {
  let src = readFileSync(TZ, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(import.meta.dirname, `../.sl1-mut-${process.pid}.mjs`);
  writeFileSync(f, src);
  try { return await import(`${pathToFileURL(f).href}?t=${Date.now()}`); } finally { rmSync(f, { force: true }); }
}

test("SL1-AC-1 ma trận nhóm × chữ", () => {
  assert.equal(kiemMaTran(ganKhuVuc), MA_TRAN_KV.length);
  assert.equal(new Set(MA_TRAN_KV.map(([, v]) => JSON.stringify(v))).size, MA_TRAN_KV.length, "SL1-AC-1 hai dòng trùng đầu vào");
});

test("SL1-AC-1 confidence theo khu vực: cấp thị trường không lên high", () => {
  const conf = (vao) => mucTinCay({ hasPrice: true, hasArea: true, hasPhuong: ganKhuVuc({ ...vao, maCoThat: MA }).phuong !== null });
  assert.equal(conf({ khai: ["hanoi"], ph: PH }), "high");
  assert.equal(conf({ khai: ["hanoi"], ph: null }), "medium", "SL1-AC-1 tin cấp thị trường lên high");
  assert.equal(mucTinCay({ hasPrice: false, hasArea: true, hasPhuong: true }), "low");
});

test("SL1-AC-7 thước tập tin đỏ khi đổi giá, diện tích, loại tin hay mất, thêm tin", () => {
  const goc = [{ offer_id: "a", kind: "sale", price_vnd: "1", area_m2: "2" }, { offer_id: "b", kind: "sale", price_vnd: "3", area_m2: "4" }];
  assert.deepEqual(soTin(goc, goc), { thieu: 0, them: 0, doi: 0 });
  for (const doi of [{ price_vnd: "9" }, { area_m2: "9" }, { kind: "rent_lt" }]) {
    assert.equal(soTin(goc, [{ ...goc[0], ...doi }, goc[1]]).doi, 1, `SL1-AC-7 không đỏ với ${JSON.stringify(doi)}`);
  }
  assert.equal(soTin(goc, goc.slice(1)).thieu, 1);
  assert.equal(soTin(goc.slice(1), goc).them, 1);
});

test("SL1-AC-9 sai nặng: từng lý do, trường trống không tính", () => {
  const m = { kind: "sale", property_type: "apartment", market: "hanoi", price_vnd: "100", area_m2: "50" };
  assert.deepEqual(saiNang(m, { ...m, property_type: "villa", price_vnd: 110, area_m2: 50 }).sort(), ["loai_hinh"]);
  assert.deepEqual(saiNang(m, { kind: "rent_lt" }), ["kind"]);
  assert.deepEqual(saiNang(m, { market: "hcm", price_vnd: 200, area_m2: 100 }).sort(), ["dien_tich", "gia", "thi_truong"]);
  assert.deepEqual(saiNang(m, { kind: null, property_type: null, market: null, price_vnd: null, area_m2: null }), []);
});

test("SL1-AC-1 đỏ: bản bỏ điều kiện đúng một thị trường", async () => {
  const m = await banSao([["khai?.length === 1 && maCoThat", "khai?.length >= 1 && maCoThat"]]);
  assert.throws(() => kiemMaTran(m.ganKhuVuc), /SL1-AC-1 dòng «khai hai»/);
});

test("SL1-AC-1 mã thị trường không còn trong areas thì để trống", () => {
  assert.deepEqual(ganKhuVuc({ khai: ["ma-cu"], ph: null, maCoThat: MA }), { areaId: null, phuong: null });
});

test("SL1-AC-1 gộp bài: bài sau có mã thì nhận, hai thị trường thì trống và giữ trống, tin có phường không đổi", () => {
  const sau = { areaId: null, phuongRaw: null };
  gopKhuVuc(sau, "hanoi");
  assert.equal(sau.areaId, "hanoi", "bài đầu chưa khai, bài sau đã khai");
  const xung = { areaId: "hanoi", phuongRaw: null };
  gopKhuVuc(xung, "hcm");
  assert.equal(xung.areaId, null, "hai thị trường");
  gopKhuVuc(xung, "hanoi");
  assert.equal(xung.areaId, null, "đã xung thì không nhận lại");
  const coPhuong = { areaId: PH.id, phuongRaw: PH.slug };
  gopKhuVuc(coPhuong, "hcm");
  assert.equal(coPhuong.areaId, PH.id);
});

const MA_TRAN_LOAI = [
  ["bán căn hộ 2PN", "apartment"], ["Chung cư 70m2", "apartment"], ["CHCC giá tốt", "apartment"], ["studio full đồ", "apartment"],
  ["biệt thự đơn lập", "house"], ["Liền kề 90m", "house"], ["shophouse mặt đường", "house"], ["nhà phố 4 tầng", "house"],
  ["nhà mặt ngõ", "house"], ["nhà riêng chính chủ", "house"],
  ["căn hộ gần biệt thự", null], ["2PN 70m2", null], ["căn góc đẹp", null], ["giá 3 tỷ", null], ["", null],
];

function kiemLoai(doc) {
  for (const [chu, dap] of MA_TRAN_LOAI) assert.equal(doc(chu), dap, `SL1-AC-4 dòng «${chu}»`);
}

test("SL1-AC-4 ma trận đáp án loại hình theo chữ", () => kiemLoai(docLoaiHinh));

test("SL1-AC-4 đỏ: bản nhận «PN» là căn hộ", async () => {
  const m = await banSao([["/(căn hộ|chung cư|chcc|studio)/iu", "/(căn hộ|chung cư|chcc|studio|pn)/iu"]]);
  assert.throws(() => kiemLoai(m.docLoaiHinh), /SL1-AC-4 dòng «2PN 70m2»/);
});

test("SL1-AC-4 ngưỡng nhóm: 19 bài không đủ, 20 bài đủ, dưới 85% không nhận", () => {
  const bai = (k, ch, nh) => [...Array(ch).fill({ conversation_id: k, loai: "apartment" }), ...Array(nh).fill({ conversation_id: k, loai: "house" })];
  const m = loaiHinhNhom([...bai("du", 20, 0), ...bai("thieu", 19, 0), ...bai("lan", 16, 4), ...bai("bien", 17, 3), ...bai(null, 30, 0)]);
  assert.equal(m.get("du"), "apartment");
  assert.equal(m.has("thieu"), false);
  assert.equal(m.has("lan"), false, "80% dưới ngưỡng");
  assert.equal(m.get("bien"), "apartment", "85% đúng ngưỡng");
  assert.equal(m.size, 2, "bài không có nhóm không tính");
});
