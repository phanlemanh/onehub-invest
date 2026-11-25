// che-ten-nguon-gia-tri.test.mjs — ma trận viết trước cho hàm che giá trị (HT18, dùng lại ở HT26). Tên nguồn là chuỗi BỊA.
// Mỗi ca có cặp đỏ: chạy cùng ma trận trên một bản hàm bị phá một luật → bản ấy phải trượt đúng các ca mang luật đó, nêu tên ca.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cheGiaTri, cheChuJson, laUrl } from "./che-ten-nguon-gia-tri.mjs";
import { findSourceNames, maskSourceNames } from "./mask-source-names.mjs";

const BIA = [
  { code: "S91", realName: "Quoxa Bds", wholeOnly: false },
  { code: "S92", realName: "zelvanha", wholeOnly: false },
];

// [tên ca, giá trị vào, giá trị mong đợi, số chỗ mong đợi]
const MA_TRAN = [
  ["chu_tu_do", "Nhà gần Quoxa Bds quận 1", "Nhà gần S91 quận 1", 1],
  ["url_trong_mang_json", ["cdn.quoxabds.vn/a.jpg", "cdn.khac.vn/b.jpg"], ["cdn.khac.vn/b.jpg"], 1],
  ["url_co_luoc_do_va_chu_trong_mang", ["https://zelvanha.vn/x", "ghi chú zelvanha"], ["ghi chú S92"], 2],
  ["khoa_json", { zelvanha_id: 5, x: 1 }, { S92_id: 5, x: 1 }, 1],
  ["gia_tri_json", { source: "Zelvanha" }, { source: "S92" }, 1],
  ["sau_moi_cap", { a: { b: [{ zelvanha_ref: "Quoxa Bds" }] } }, { a: { b: [{ S92_ref: "S91" }] } }, 2],
  ["khong_trung_giu_nguyen", { a: "bình thường", n: 1.1, l: ["cdn.khac.vn/b.jpg", "chữ"] }, { a: "bình thường", n: 1.1, l: ["cdn.khac.vn/b.jpg", "chữ"] }, 0],
  ["chu_khong_trung", "chữ thường", "chữ thường", 0],
];

/** Ca trượt của một bản hàm che. */
function caTruot(fn) {
  const truot = [];
  for (const [ten, vao, mong, so] of MA_TRAN) {
    try {
      const { giaTri, soCho } = fn(structuredClone(vao), BIA);
      assert.deepEqual(giaTri, mong);
      assert.equal(soCho, so);
      if (typeof giaTri !== "number") assert.equal(findSourceNames(JSON.stringify(giaTri), BIA).length, 0);
    } catch {
      truot.push(ten);
    }
  }
  return truot;
}

test("CHE: ma trận viết trước xanh trên hàm che", () => {
  assert.deepEqual(caTruot(cheGiaTri), []);
});

// Bản phá: mỗi bản bỏ một luật.
const PHA = {
  // không che gì
  dong_nhat: (v) => ({ giaTri: v, soCho: 0 }),
  // thay chữ trên chuỗi json thô, không bỏ phần tử URL
  khong_bo_url: (v, e) => {
    const s = JSON.stringify(v);
    const n = findSourceNames(s, e).length;
    return { giaTri: n ? JSON.parse(maskSourceNames(s, e)) : v, soCho: n };
  },
  // che giá trị, giữ nguyên khoá
  khong_doi_khoa: (v, e) => {
    let so = 0;
    const di = (x) => {
      if (typeof x === "string") { const n = findSourceNames(x, e).length; so += n; return n ? maskSourceNames(x, e) : x; }
      if (Array.isArray(x)) return x.filter((y) => !(laUrl(y) && findSourceNames(y, e).length && ++so)).map(di);
      if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, y]) => [k, di(y)]));
      return x;
    };
    return { giaTri: di(v), soCho: so };
  },
  // chỉ cấp đầu
  khong_di_sau: (v, e) => {
    if (typeof v === "string") return cheGiaTri(v, e);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      let so = 0;
      const out = {};
      for (const [k, x] of Object.entries(v)) {
        const k2 = findSourceNames(k, e).length ? (so++, maskSourceNames(k, e)) : k;
        out[k2] = typeof x === "string" && findSourceNames(x, e).length ? (so++, maskSourceNames(x, e)) : x;
      }
      return { giaTri: out, soCho: so };
    }
    return cheGiaTri(v, e);
  },
};
const PHAI_TRUOT = {
  dong_nhat: ["chu_tu_do", "url_trong_mang_json", "url_co_luoc_do_va_chu_trong_mang", "khoa_json", "gia_tri_json", "sau_moi_cap"],
  khong_bo_url: ["url_trong_mang_json", "url_co_luoc_do_va_chu_trong_mang"],
  khong_doi_khoa: ["khoa_json", "sau_moi_cap"],
  khong_di_sau: ["sau_moi_cap"],
};
for (const [ten, fn] of Object.entries(PHA)) {
  test(`CHE: chiều đỏ — bản phá «${ten}» trượt đúng ca mang luật đó, nêu tên ca`, () => {
    const truot = caTruot(fn);
    for (const ca of PHAI_TRUOT[ten]) assert.ok(truot.includes(ca), `bản phá ${ten} phải trượt ca ${ca}; trượt: ${truot.join(", ") || "không ca nào"}`);
    assert.ok(!truot.includes("khong_trung_giu_nguyen") && !truot.includes("chu_khong_trung"));
  });
}

test("CHE: ô không trúng trả đúng giá trị vào (cùng tham chiếu), số chỗ 0", () => {
  const v = { a: ["x"] };
  const r = cheGiaTri(v, BIA);
  assert.equal(r.giaTri, v);
  assert.equal(r.soCho, 0);
});

test("CHE: ô json dạng chữ — khoá đổi thành mã, chữ số giữ nguyên (không làm tròn)", () => {
  const r = cheChuJson('{"zelvanha_id": 12345678901234567890, "g": 1.10, "s": "Quoxa Bds"}', BIA);
  assert.equal(r.text, '{"S92_id":12345678901234567890,"g":1.10,"s":"S91"}');
  assert.equal(r.soCho, 2);
  const k = cheChuJson('{"a": 1.10}', BIA);
  assert.equal(k.text, '{"a": 1.10}');
  assert.equal(k.soCho, 0);
});

test("CHE: nhận dạng URL", () => {
  for (const s of ["https://a.vn/x", "//a.vn/x", "www.a.vn", "cdn.a.vn/im/p.jpg", "a0.cdn-x.com:8080/p"]) assert.ok(laUrl(s), s);
  for (const s of ["ghi chú a.vn/x", "Quoxa Bds", "a.vn", "/duong/tuong-doi", 5]) assert.ok(!laUrl(s), String(s));
});

test("CHE: từ điển rỗng thì ném (đóng chặt)", () => {
  assert.throws(() => cheGiaTri("x", []), /rỗng/);
  assert.throws(() => cheGiaTri("x", null), /rỗng/);
});
