// s09-danh-ba-v16.test.mjs — DA56 AC-2, AC-9 (phần lọc): bộ lọc khoá tầng A của căn quỹ căn theo bảng kiểm kê viết trước.
// Fixture: pipeline/tests/fixtures/s09-v16 (sinh bằng pipeline/scripts/s09-v16-sinh-fixture.mjs từ khuôn bản thu thật, đã thay chuỗi).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { KHOA_V16, locTangA } from "./s09-danh-ba-v16.mjs";

const FIX = new URL("../tests/fixtures/s09-v16/", import.meta.url);
const docFix = (ten) => JSON.parse(gunzipSync(readFileSync(new URL(`${ten}/items-0001.json.gz`, FIX))).toString("utf8"));
const QUY_CAN = [...docFix("vn__s09-danh-ba__F-du"), ...docFix("vn__s09-danh-ba__F-hong")].filter((i) => i?.kind === "quy-can");
const TANG = docFix("vn__s09-danh-ba__F-tang");
const chuoi = (v, ra = []) => {
  if (typeof v === "string") ra.push(v);
  else if (v && typeof v === "object") Object.values(v).forEach((x) => chuoi(x, ra));
  return ra;
};

test("AC-2 bảng kiểm kê: mỗi khoá một assert — «bo» vắng sau lọc, «giu» bằng nguyên văn fixture", () => {
  const bang = KHOA_V16["quy-can"];
  const khoa = Object.keys(bang);
  assert.equal(khoa.length, 46, "bảng kiểm kê quỹ căn phải đủ 46 khoá cấp một rút từ bản thu thật");
  let soAssert = 0;
  for (const k of khoa) {
    const goc = QUY_CAN.flatMap((it) => (it.payload?.data ?? []).filter((c) => k in c).map((c) => ({ it, c })));
    assert.ok(goc.length > 0, `fixture không có căn nào mang khoá ${k}`);
    const { it, c } = goc[0];
    const { payload } = locTangA("quy-can", it.payload);
    const sau = payload.data.find((x) => x.id === c.id);
    if (bang[k] === "bo") assert.equal(k in sau, false, `khoá ${k} phải bị bỏ khỏi căn`);
    else assert.deepEqual(sau[k], c[k], `khoá ${k} phải giữ nguyên văn`);
    soAssert++;
  }
  assert.equal(soAssert, khoa.length);
});

test("AC-2 mọi căn mọi trang: không còn galleries, geolocation; đếm số căn đã bỏ khoá", () => {
  let tong = 0;
  for (const it of QUY_CAN) {
    const { payload, boKhoa } = locTangA("quy-can", it.payload);
    for (const c of payload.data ?? []) {
      assert.equal("galleries" in c, false, "galleries");
      assert.equal("geolocation" in c, false, "geolocation");
    }
    assert.equal(boKhoa, (it.payload.data ?? []).filter((c) => "galleries" in c || "geolocation" in c).length);
    tong += boKhoa;
  }
  assert.ok(tong > 0);
});

test("AC-9 sau lọc không chuỗi nào chứa http hay tên miền giả lập; toạ độ giả lập không còn", () => {
  for (const it of QUY_CAN) {
    const { payload } = locTangA("quy-can", it.payload);
    const s = chuoi(payload);
    assert.equal(s.filter((x) => /https?:|gia-lap\.test/.test(x)).length, 0, "galleries: còn URL sau lọc");
    assert.equal(JSON.stringify(payload).includes("7.654321"), false, "geolocation: toạ độ giả lập còn sau lọc");
  }
});

test("AC-2 khoá lạ chưa xếp trong bảng → ném lỗi nêu tên khoá", () => {
  const it = QUY_CAN.find((i) => i.payload?.data?.length);
  const payload = { ...it.payload, data: [{ ...it.payload.data[0], anh_moi: "x" }] };
  assert.throws(() => locTangA("quy-can", payload), /khoá chưa xếp: anh_moi/);
});

test("AC-2 không đổi đầu vào (raw bất biến) và kind khác trả nguyên", () => {
  const it = QUY_CAN.find((i) => i.payload?.data?.length);
  const truoc = JSON.stringify(it.payload);
  locTangA("quy-can", it.payload);
  assert.equal(JSON.stringify(it.payload), truoc);
  for (const t of TANG) {
    const { payload, boKhoa } = locTangA(t.kind, t.payload);
    assert.deepEqual(payload, t.payload);
    assert.equal(boKhoa, 0);
  }
  const khac = { url: "https://khac.gia-lap.test/" };
  assert.deepEqual(locTangA("du-an", khac).payload, khac);
});

test("AC-2 trang rỗng, payload thiếu data, payload null → không ném, 0 căn bỏ khoá", () => {
  assert.equal(locTangA("quy-can", { data: [], meta: { code: 200 } }).boKhoa, 0);
  assert.equal(locTangA("quy-can", { meta: { code: 500 } }).boKhoa, 0);
  assert.equal(locTangA("quy-can", null).boKhoa, 0);
});
