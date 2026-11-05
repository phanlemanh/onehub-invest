// label-ghep.test.mjs — hồ sơ ghep-anh-tren-the-gan-nhan AC-1. Ma trận sáu loại bài và ca cụm lệch số tin chữ gần: `ghep` phải bằng
// kết quả gọi trực tiếp ganBaiAnh. Hàm thuần, không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ganBaiAnh, laChiAnh, soChuGan } from "../lib/gop-anh.mjs";
import { laDbThu } from "../label-ghep.mjs";
import { ghepChoMau } from "../lib/ghep-mau.mjs";

const LIB = join(import.meta.dirname, "../lib");
const t = (giay) => new Date(Date.UTC(2026, 10, 5, 3, 0, giay)).toISOString();
const bai = (post_id, text, giay, sender_id = "n1", conversation_id = "g1") => ({ post_id, text, posted_at: t(giay), sender_id, conversation_id });
const U = "https://cdn.example.test/a.jpg";

const POSTS = [
  // một tin chữ
  bai("T1", "Cho thuê 2PN", 0), bai("A1", U, 5), bai("A2", U, 6),
  // cụm lệch: A3 chỉ có T2 trong cửa sổ, A4 có cả T2 và T3
  bai("T2", "Bán 1PN", 1000, "n2"), bai("A3", U, 1001, "n2"), bai("A4", U, 1040, "n2"), bai("T3", "Bán 3PN", 1150, "n2"),
  // không tin chữ
  bai("A5", U, 2000, "n3"),
  // có chữ, có cụm: dòng mẫu là chính tin chữ
  bai("T4", "Bán studio", 3000, "n4"), bai("A6", U, 3010, "n4"),
  // có chữ, không cụm
  bai("T5", "Cho thuê studio", 4000, "n5"),
  // thiếu người gửi
  bai("A7", U, 5000, null),
];
const ITEMS = [["1", "A1"], ["2", "A2"], ["3", "A3"], ["4", "A5"], ["5", "T4"], ["6", "T5"], ["7", "A7"], ["8", "A4"], ["9", "khong-co"]].map(([item_id, ref_id]) => ({ item_id, ref_id }));
const G = ghepChoMau(ITEMS, POSTS);
const ganThat = ganBaiAnh(POSTS.filter((p) => !laChiAnh(p.text)), POSTS.filter((p) => laChiAnh(p.text)));

const MA_TRAN = [
  ["mot tin chu", "1", { chu_ref: "T1", anh_refs: ["A1", "A2"], so_chu_gan: 1, trung_voi: null }],
  ["dong trung cum tro ve dai dien", "2", { chu_ref: "T1", anh_refs: ["A1", "A2"], so_chu_gan: 1, trung_voi: "A1" }],
  ["cum lech lay so lon nhat tren cum", "3", { chu_ref: "T2", anh_refs: ["A3", "A4"], so_chu_gan: 2, trung_voi: null }],
  ["khong tin chu", "4", { chu_ref: null, anh_refs: ["A5"], so_chu_gan: 0, trung_voi: null }],
  ["co chu co cum", "5", { chu_ref: "T4", anh_refs: ["A6"], so_chu_gan: 1, trung_voi: null }],
  ["co chu khong cum la null", "6", null],
  ["thieu nguoi gui", "7", { chu_ref: null, anh_refs: ["A7"], so_chu_gan: 0, trung_voi: null }],
  ["cum lech: dong sau cung cum co cung co", "8", { chu_ref: "T2", anh_refs: ["A3", "A4"], so_chu_gan: 2, trung_voi: "A3" }],
  ["bai khong con trong stg la null", "9", null],
];
for (const [ten, item, ky] of MA_TRAN) {
  test(`GHEP-AC-1 ${ten}`, () => assert.deepEqual(G.get(item), ky));
}

test("GHEP-AC-1 ma tran du moi dong mau", () => assert.equal(MA_TRAN.length, ITEMS.length));

test("GHEP-AC-1 moi dong khop ganBaiAnh goi truc tiep", () => {
  for (const it of ITEMS) {
    const p = POSTS.find((x) => x.post_id === it.ref_id);
    const g = G.get(it.item_id);
    if (!p) continue;
    if (laChiAnh(p.text)) assert.equal(g.chu_ref, ganThat.get(p.post_id) ?? null, it.ref_id);
    for (const a of g?.chu_ref ? g.anh_refs : []) assert.equal(ganThat.get(a), g.chu_ref, a);
  }
});

test("GHEP-AC-1 cum lech that: moi bai khac so tin chu gan, co cua cum la so lon nhat, dot bien bo so lon nhat thi do", async () => {
  const chu = POSTS.filter((p) => !laChiAnh(p.text));
  const so = (id) => soChuGan(chu, POSTS.find((p) => p.post_id === id));
  assert.equal(so("A3"), 1, "A3 chỉ có một tin chữ gần");
  assert.equal(so("A4"), 2, "A4 có hai tin chữ gần");
  assert.equal(G.get("3").so_chu_gan, 2);
  const d = mkdtempSync(join(tmpdir(), "ghep-"));
  try {
    writeFileSync(join(d, "gop-anh.mjs"), readFileSync(join(LIB, "gop-anh.mjs"), "utf8"));
    writeFileSync(join(d, "ghep-mau.mjs"), readFileSync(join(LIB, "ghep-mau.mjs"), "utf8").replace("Math.max(...ds.map(chuGan))", "chuGan(ds[0])"));
    const m = await import(join(d, "ghep-mau.mjs"));
    assert.equal(m.ghepChoMau(ITEMS, POSTS).get("3").so_chu_gan, 1, "bỏ số lớn nhất thì dòng đại diện mất cờ");
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

for (const [ten, url, ky] of [
  ["DB thu", "postgres://localhost:5433/oneinvest_ghep_nhan", true],
  ["DB that", "postgres://localhost:5433/oneinvest", false],
  ["ten khac", "postgres://localhost:5433/postgres", false],
  ["may khac cung ten thu", "postgres://db.example.test:5432/oneinvest_ghep_nhan", false],
]) {
  test(`GHEP-AC-2 dich lenh ghep: ${ten}`, () => assert.equal(laDbThu(url), ky));
}

test("GHEP-AC-1 cach 119 giay do khi doi cua so sang 60: doi chung ban sao dot bien", async () => {
  const moc = [bai("TX", "Bán", 0, "m"), bai("AX", U, 119, "m")];
  const it = [{ item_id: "1", ref_id: "AX" }];
  assert.equal(ghepChoMau(it, moc).get("1").chu_ref, "TX");
  const d = mkdtempSync(join(tmpdir(), "ghep-"));
  try {
    writeFileSync(join(d, "gop-anh.mjs"), readFileSync(join(LIB, "gop-anh.mjs"), "utf8").replace("CUA_SO_GIAY = 120", "CUA_SO_GIAY = 60"));
    copyFileSync(join(LIB, "ghep-mau.mjs"), join(d, "ghep-mau.mjs"));
    const m = await import(join(d, "ghep-mau.mjs"));
    assert.equal(m.ghepChoMau(it, moc).get("1").chu_ref, null, "đột biến cửa sổ phải đổi kết quả");
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

// Quét lớp: mã của vòng này không có cửa sổ thời gian riêng.
const tepQuet = (goc) => {
  const out = [];
  const di = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== "node_modules") di(p); } else if (/\.(ts|tsx|mjs)$/.test(f)) out.push(p); } };
  di(goc);
  return out;
};
test("GHEP-AC-1 khong co luat thu hai", () => {
  const goc = join(import.meta.dirname, "../..");
  // Toàn app/src: tên hàm, tên hằng của luật, cửa sổ thời gian dạng SQL. Đường đọc cụm: thêm cả số 120 trần.
  const LUAT = /ganBaiAnh|cuaSoGiay|CUA_SO_GIAY|interval\s*'\s*\d+\s*(?:s|sec|second|minute|min)|120\s*(?:giây|seconds?)/i;
  // Phạm vi phép quét là đúng các dạng trong bảng đối chứng dưới đây: giây, mili-giây, biểu thức 2 * 60, so sánh cột thời gian hai chiều. Quét chữ không chứng minh được mọi cách viết.
  const LUAT_CUM = new RegExp(`${LUAT.source}|\\b120(?:[_,]?000)?\\b|\\b2\\s*\\*\\s*60\\b|posted_?at\\b[^\\n]{0,40}(?:[<>]|BETWEEN|getTime|\\s-\\s)|[<>]=?\\s*[\\w.]*posted_?at\\b`, "i");
  // `t.length > 120` là ngưỡng gấp chữ dài trên thẻ, không phải cửa sổ thời gian.
  const boChuThich = (s) => s.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n").replace("t.length > 120", "");
  const quet = (tep, mau) => tep.filter((f) => mau.test(boChuThich(readFileSync(f, "utf8"))));
  const tepCum = [...tepQuet(join(goc, "app/src/components/ops/labels")), ...["labels-anh", "labels-cum", "labels-queries", "labels-luot-hai", "labels-normalize", "ops/zalo-media"].map((t) => join(goc, `app/src/lib/${t}.ts`))];
  assert.ok(tepCum.length > 10 && tepCum.every((f) => statSync(f).isFile()), "phải quét đủ đường đọc cụm của app");
  assert.ok(tepCum.some((f) => f.endsWith("labels-cum.ts")) && tepCum.some((f) => f.endsWith("zalo-media.ts")));
  const tepApp = tepQuet(join(goc, "app/src"));
  assert.ok(tepApp.length > 200, "phải quét toàn app/src");
  assert.deepEqual(quet(["pipeline/lib/ghep-mau.mjs", "pipeline/label-ghep.mjs"].map((f) => join(goc, f)), /\b120\b/), []);
  assert.deepEqual(quet(tepCum, LUAT_CUM), []);
  assert.deepEqual(quet(tepApp, LUAT), []);
  // Đối chứng: chèn thật vào một tệp rồi cho qua đúng phép quét.
  const d = mkdtempSync(join(tmpdir(), "ghep-luat-"));
  try {
    const nhiem = [
      ["hang.ts", "const CUA = 120", LUAT_CUM],
      ["sql.ts", "const s = `p.posted_at BETWEEN a - interval '120 seconds' AND b`", LUAT],
      ["goi.ts", "ganBaiAnh(a, b)", LUAT],
      ["giay.tsx", "const c = '120 giây'", LUAT],
      ["so-sanh.ts", "const s = `WHERE p.posted_at < a`", LUAT_CUM],
      ["mili.ts", "if (Math.abs(a.postedAt - b.postedAt) < 120_000) gan()", LUAT_CUM],
      ["mili2.ts", "if (Math.abs(ta - tb) < 120000) gan()", LUAT_CUM],
      ["bieu-thuc.ts", "if (hieu < 2 * 60 * 1000) gan()", LUAT_CUM],
      ["get-time.ts", "if (new Date(p.posted_at).getTime() - t < 120_000) gan()", LUAT_CUM],
      ["dao-ve.ts", "const s = `WHERE a < p.posted_at`", LUAT_CUM],
    ];
    for (const [ten, chu, mau] of nhiem) {
      const f = join(d, ten);
      writeFileSync(f, `${chu}\n`);
      assert.deepEqual(quet([f], mau), [f], `đối chứng ${ten} phải đỏ`);
    }
    const lanh = join(d, "lanh.ts");
    writeFileSync(lanh, "// 120 giây trong chú thích\nconst x = 1\n");
    assert.deepEqual(quet([lanh], LUAT_CUM), [], "chú thích không tính");
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});
