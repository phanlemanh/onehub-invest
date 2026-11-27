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

// Khoá lá: đường tới mọi giá trị không phải object (mảng object bung thành «[]»). Danh sách lá VIẾT TRƯỚC từ bản thu thật
// (`la:<kind>` của s09-danh-ba-v16-khoa.json, do kiemKe sinh trên MỌI căn của mọi bản thật — không tính từ fixture), mỗi lá một
// kết luận riêng; fixture phải mang ĐÚNG tập lá ấy (thiếu: lá thật không có assert; thừa: chưa kiểm kê) — review DA56 vòng 1 r2.
import { duongLa } from "../scripts/s09-v16-sinh-fixture.mjs";
const layLa = (v, duong) => duong.split(/\.|(?=\[\])/).reduce((xs, b) => xs.flatMap((x) => (b === "[]" ? (Array.isArray(x) ? x : []) : b.startsWith("[]") ? (Array.isArray(x) ? x.map((y) => y?.[b.slice(3)]) : []) : [x?.[b]])), [v]);

test("AC-2 bảng kiểm kê khoá lá quỹ căn (viết trước từ bản thu thật): mỗi lá một assert — lá «bo» vắng, lá «giu» bằng nguyên văn", () => {
  const bangLa = KHOA_V16["la:quy-can"];
  const dsLa = Object.keys(bangLa);
  assert.equal(dsLa.length, 59, "bảng lá quỹ căn phải đủ 59 lá rút từ bản thu thật (kiemKe 27/11)");
  for (const d of dsLa) {
    const goc = d.split(/[.[]/)[0];
    assert.ok(goc in KHOA_V16["quy-can"], `lá ${d}: khoá cấp một ${goc} không có trong bảng khoá`);
    assert.equal(bangLa[d], KHOA_V16["quy-can"][goc], `lá ${d}: kết luận lệch khoá cấp một ${goc}`);
  }
  const la = new Map();
  for (const it of QUY_CAN) for (const c of it.payload?.data ?? []) for (const d of duongLa(c)) if (!la.has(d)) la.set(d, { it, c });
  assert.deepEqual([...la.keys()].sort(), [...dsLa].sort(), "fixture phải mang đúng tập lá của bảng (thiếu: lá thật không có assert; thừa: chưa kiểm kê)");
  let soAssert = 0;
  for (const d of dsLa) {
    const { it, c } = la.get(d);
    const sau = locTangA("quy-can", it.payload).payload.data.find((x) => x.id === c.id);
    if (bangLa[d] === "bo") assert.deepEqual(layLa(sau, d).filter((x) => x !== undefined), [], `lá ${d} phải vắng`);
    else assert.deepEqual(layLa(sau, d), layLa(c, d), `lá ${d} phải giữ nguyên văn`);
    soAssert++;
  }
  assert.equal(soAssert, 59);
});

test("AC-2 bảng kiểm kê căn cao tầng: bảng khớp trọn bộ khoá của fixture, mỗi khoá một assert giữ nguyên văn", () => {
  const bang = KHOA_V16["can-cao-tang"];
  const khoa = Object.keys(bang).sort();
  assert.deepEqual(khoa, ["code", "id", "increment_number", "name"], "bảng kiểm kê căn cao tầng: 4 khoá rút từ bản thu thật");
  assert.deepEqual(Object.keys(KHOA_V16["la:can-cao-tang"]).sort(), khoa, "bảng lá căn cao tầng (viết trước) phải bằng 4 khoá — không có lá lồng");
  const cans = TANG.filter((t) => t.kind === "can-cao-tang").flatMap((t) => (t.payload?.data ?? []).map((c) => ({ t, c })));
  assert.ok(cans.length > 0, "fixture không có căn cao tầng");
  const thay = new Set(cans.flatMap(({ c }) => [...duongLa(c)]));
  assert.deepEqual([...thay].sort(), khoa, "khoá lá của căn cao tầng trong fixture phải đúng bằng bảng (thừa: chưa kiểm kê; thiếu: bảng thừa)");
  let soAssert = 0;
  for (const k of khoa) {
    const { t, c } = cans.find(({ c }) => k in c);
    const sau = locTangA("can-cao-tang", t.payload).payload.data.find((x) => x.id === c.id);
    assert.equal(bang[k], "giu", `khoá ${k}: căn cao tầng không có khoá bỏ`);
    assert.deepEqual(sau[k], c[k], `khoá ${k} phải giữ nguyên văn`);
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
