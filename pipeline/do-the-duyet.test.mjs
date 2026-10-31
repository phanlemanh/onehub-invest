// do-the-duyet.test.mjs — hồ sơ _acceptance/do-the-duyet-du-du-lieu (HD11) E1: hàm thuần tinhSo trên tập viết trước. Mỗi
// phép đo chạy trên bản thật (xanh) và bản chép hỏng cạnh bản thật (đỏ, thông điệp ghim).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as that from "./do-the-duyet.mjs";

const TEP = fileURLToPath(new URL("./do-the-duyet.mjs", import.meta.url));
async function banChep(tim, thay, chay) {
  const goc = readFileSync(TEP, "utf8");
  const moi = goc.replace(tim, thay);
  assert.notEqual(moi, goc, "bản chép không đổi được — mẫu thay đã lệch mã");
  const ban = path.join(path.dirname(TEP), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-do-the-duyet.mjs`);
  writeFileSync(ban, moi);
  try {
    return await chay(await import(pathToFileURL(ban).href));
  } finally {
    rmSync(ban, { force: true });
  }
}

const DU = {
  price_vnd: 5e9, area_m2: 80, price_perm2: 6.25e7, area_id: "vn-hanoi-x", property_type: "apartment", bedrooms: 2,
  bathrooms: 2, street_raw: "Phố A", block_raw: "Toà B", floor_raw: "12", seller_phone_hash: "h1", seller_name: null,
};
const TIN = new Map([
  ["o1", { offer_id: "o1", source: "S03", ...DU }],
  ["o2", { offer_id: "o2", source: "S05", ...DU, property_type: "unknown", bedrooms: null }],
  ["o5", { offer_id: "o5", source: "S05", ...DU }],
  ["o4", {
    offer_id: "o4", source: "S03", price_vnd: 3e9, area_m2: null, price_perm2: null, area_id: null, property_type: null,
    bedrooms: null, bathrooms: null, street_raw: "", block_raw: null, floor_raw: null, seller_phone_hash: null,
    seller_name: "  ",
  }],
]);
const KHOA = "0123456789abcdef0123456789abcdef";
const MEDIA = new Map([
  ["o1", [{ media_key: "k1", media_url: "https://anh.example/1.jpg", local_file: "hanoi__zalo__2026-10-30T000000/media/a1.jpg" }]],
  ["o2", [{ media_key: "khoa-sai-khuon", media_url: "https://anh.example/2.jpg", local_file: null }]], // không lấy hộ được
  ["o5", [{ media_key: KHOA, media_url: "https://anh.example/5.jpg", local_file: null }]], // máy chủ lấy hộ theo khoá
]);
const the = (item_type, status, a, b, extra = {}) => ({
  item_type, status, evidence: { offer_a: { offer_id: a, ...extra.a }, offer_b: { offer_id: b } },
});
const THE = [
  the("entity_match", "pending", "o1", "o2"), // T1: bên B chỉ URL gốc khoá sai khuôn, thiếu PN, loại hình unknown
  the("entity_match", "pending", "o3", "o1"), // T2: bên A rời kho, 0 dòng media
  the("entity_match", "approved", "o9", "o9"), // T3: đã quyết — không đếm
  { item_type: "agent_output", status: "pending", evidence: { offer_id: "o9" } }, // T4: loại thẻ khác — không đếm
  the("entity_match", "pending", "o4", "o1", { a: { image_url: "https://anh.example/the.jpg" } }), // T5: bên A 0 media; image_url của thẻ không tính
  the("entity_match", "pending", "o5", "o1"), // T6: bên A ảnh lấy hộ theo khoá — đủ ảnh
];

/** Ma trận viết trước: (kiểm, đối tượng) → khoá → số. */
const MONG = {
  "the-duyet:roi-kho|entity_match": { status: "fail", tong: 4, so: 1, ben: 1 },
  "the-duyet:anh-ops|entity_match": { status: "fail", tong: 4, so: 3, ben: 3 },
  "the-duyet:anh-admin|entity_match": { status: "fail", tong: 4, so: 3, ben: 3 },
  "the-duyet:do-day|S03": {
    status: "pass", tong: 2, gia: 2, dt: 1, gia_m2: 1, phuong: 1, loai: 1, pn: 1, wc: 1, duong: 1, toa: 1, tang: 1,
    nguoi_dang: 1,
  },
  "the-duyet:do-day|S05": {
    status: "pass", tong: 2, gia: 2, dt: 2, gia_m2: 2, phuong: 2, loai: 1, pn: 1, wc: 2, duong: 2, toa: 2, tang: 2,
    nguoi_dang: 2,
  },
};
const SO_PHAN_TU = Object.values(MONG).reduce((n, o) => n + Object.keys(o).length, 0);

const docDetail = (s) => Object.fromEntries(s.split(" ").map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)]));

/** So mọi ô; trả số assert đã làm. Thông điệp ghim theo lớp lỗi để bản chép đỏ gọi đúng tên. */
function kiemSo(m) {
  const dong = m.veDong(m.tinhSo({ the: THE, tin: TIN, media: MEDIA }));
  const thay = new Map(dong.map((d) => [`${d.check_name}|${d.entity}`, d]));
  assert.deepEqual([...thay.keys()].sort(), Object.keys(MONG).sort(), "tập (kiểm, đối tượng) lệch ma trận viết trước");
  let n = 0;
  for (const [o, mong] of Object.entries(MONG)) {
    const d = thay.get(o);
    const so = docDetail(d.detail);
    for (const [khoa, v] of Object.entries(mong)) {
      const that_ = khoa === "status" ? d.status : so[khoa];
      if (that_ !== v) {
        if (khoa === "tong" && o.includes("entity_match")) throw new Error(`DEM CA THE DA QUYET: ${o} tong=${that_}`);
        if (o.startsWith("the-duyet:anh-ops")) throw new Error(`ANH OPS NHAN URL GOC: ${o} ${khoa}=${that_}`);
        if (khoa === "loai") throw new Error(`UNKNOWN TINH LA CO: ${o} loai=${that_}`);
        throw new Error(`LECH ${o} ${khoa}: ${that_} ≠ ${v}`);
      }
      n++;
    }
    assert.deepEqual(Object.keys(so).sort(), Object.keys(mong).filter((k) => k !== "status").sort(), `khoá detail lệch ở ${o}`);
  }
  return n;
}

test("E1 ma trận viết trước: mọi ô khớp, số assert = số phần tử", () => {
  assert.equal(kiemSo(that), SO_PHAN_TU);
});

test("E1 không thẻ chờ → ba kiểm đầu tong=0 đạt, không dòng độ đầy", () => {
  const dong = that.veDong(that.tinhSo({ the: [THE[2], THE[3]], tin: TIN, media: MEDIA }));
  assert.deepEqual(dong.map((d) => `${d.check_name} ${d.status} ${d.detail}`), [
    "the-duyet:roi-kho pass tong=0 so=0 ben=0",
    "the-duyet:anh-ops pass tong=0 so=0 ben=0",
    "the-duyet:anh-admin pass tong=0 so=0 ben=0",
  ]);
});

test("E1 detail chỉ số đếm: không offer_id, không URL", () => {
  for (const d of that.veDong(that.tinhSo({ the: THE, tin: TIN, media: MEDIA }))) {
    assert.match(d.detail, /^([a-z_0-9]+=\d+ ?)+$/, d.detail);
    assert.ok(!/o\d|https?:/.test(d.detail), d.detail);
  }
});

test("E1 luật ảnh khớp khuôn của bộ đọc app", () => {
  assert.ok(that.anhDaTai("hanoi__zalo__x/media/a.jpg"));
  assert.ok(!that.anhDaTai("media/a.jpg"), "thiếu snapshot");
  assert.ok(!that.anhDaTai("snap/../media/a.jpg"));
  assert.ok(!that.anhDaTai("snap/khac/a.jpg"), "không nằm trong media/");
  assert.ok(that.layHoDuoc({ media_key: KHOA, media_url: "https://x.example/a.jpg" }));
  assert.ok(!that.layHoDuoc({ media_key: KHOA, media_url: null }), "không URL gốc thì không có gì để lấy hộ");
  assert.ok(!that.layHoDuoc({ media_key: "ABCDEF0123456789abcdef0123456789", media_url: "https://x.example/a.jpg" }), "khoá hoa");
  assert.ok(!that.layHoDuoc({ media_key: null, media_url: "https://x.example/a.jpg" }));
});

test("E1 đối chứng đỏ: đếm cả thẻ đã quyết → bắt", () =>
  banChep('t.item_type === LOAI_THE && t.status === "pending"', "t.item_type === LOAI_THE",
    (m) => assert.throws(() => kiemSo(m), /DEM CA THE DA QUYET/)));

test("E1 đối chứng đỏ: coi dòng media chỉ URL (khoá sai khuôn) là ảnh vai ops thấy → bắt", () =>
  banChep("const ops = dong.some((m) => anhDaTai(m.local_file) || layHoDuoc(m));",
    "const ops = dong.some((m) => anhDaTai(m.local_file) || Boolean(m.media_url));",
    (m) => assert.throws(() => kiemSo(m), /ANH OPS NHAN URL GOC/)));

test("E1 đối chứng đỏ: tính 'unknown' là có loại hình → bắt", () =>
  banChep(' && t.property_type !== "unknown"', "", (m) => assert.throws(() => kiemSo(m), /UNKNOWN TINH LA CO/)));
