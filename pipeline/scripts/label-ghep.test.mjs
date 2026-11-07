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

test("GHEP-AC-3 anh_refs theo thoi gian khi nguoc thu tu ma: doi chung ban sao dot bien", async () => {
  const moc = [bai("T", "Bán", 0, "m"), bai("A9", U, 5, "m"), bai("A5", U, 6, "m"), bai("A1", U, 7, "m")];
  const it = [{ item_id: "1", ref_id: "A5" }];
  assert.deepEqual(ghepChoMau(it, moc).get("1").anh_refs, ["A9", "A5", "A1"]);
  const SAP = "const ds = [...(cum.get(chuId) ?? [])].sort((x, y) => giay(theoId.get(x).posted_at) - giay(theoId.get(y).posted_at) || x.localeCompare(y));";
  const goc = readFileSync(join(LIB, "ghep-mau.mjs"), "utf8");
  assert.ok(goc.includes(SAP), "đột biến phải trúng đúng dòng sắp");
  const d = mkdtempSync(join(tmpdir(), "ghep-sap-"));
  try {
    copyFileSync(join(LIB, "gop-anh.mjs"), join(d, "gop-anh.mjs"));
    for (const [ten, thay, thu] of [
      ["theo-ma.mjs", "const ds = [...(cum.get(chuId) ?? [])].sort((x, y) => x.localeCompare(y));", [...moc]],
      ["bo-sap.mjs", "const ds = [...(cum.get(chuId) ?? [])];", [moc[0], moc[3], moc[1], moc[2]]],
    ]) {
      writeFileSync(join(d, ten), goc.replace(SAP, thay));
      const m = await import(join(d, ten));
      assert.notDeepEqual(m.ghepChoMau(it, thu).get("1").anh_refs, ["A9", "A5", "A1"], `đột biến ${ten} phải đổi kết quả`);
      assert.deepEqual(ghepChoMau(it, thu).get("1").anh_refs, ["A9", "A5", "A1"], "bản thật không phụ thuộc thứ tự đầu vào");
    }
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

// lay-mau-khu-trung-theo-tin AC-5 — ghepLat thật trên lược đồ tạm (bảng LIKE bảng thật) trong một giao dịch ROLLBACK.
// DB là DATABASE_URL của lượt (suite chạy trên DB thử của riêng lượt); không ghi gì còn lại sau ca.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const pgGn2 = createRequire(join(import.meta.dirname, "../package.json"))("pg");
const DB_GN2 = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const AN_TAY = "2026-11-06 Mạnh cho ẩn thẻ trùng";
const SNAP_GN2 = "hanoi__zalo-agent__2026-11-07T000000";
// Lát 12 thẻ viết trước: [item_id, post_id, chữ]. Bài tin o1 = t1, t2, t3.
const THE_GN2 = [
  [1, "c1", "Bán căn 2PN view hồ https://img.example/a.jpg"], [2, "c2", "Bán căn 2PN view hồ https://img.example/b.jpg"],
  [3, "pc", "Cho thuê studio full đồ"], [5, "pa", "Cho thuê studio full đồ"], [9, "pb", "Cho thuê studio full đồ"],
  [4, "t1", "Bán shophouse mặt đường"], [6, "t2", "Bán gấp shophouse"], [7, "t3", "Shophouse còn một căn"],
  [8, "s8", "Bán đất nền"], [10, "s10", "Cho thuê kho"], [11, "s11", "Bán căn 3PN"], [12, "s12", "Cho thuê văn phòng"],
];
// Mong đợi viết tay: thẻ ẩn sau lượt → [trung_voi, khu_trung]; thẻ 5 là dấu ẩn tay giữ nguyên.
const AN_MONG = { 2: ["c1", "chu"], 3: ["pb", "chu"], 4: ["t3", "tin"], 6: ["t3", "tin"] };
const NHOM_GN2 = [[1, 2], [3, 5, 9], [4, 6, 7]];

async function gn2Lat(c, schema) {
  await c.query(`CREATE SCHEMA ${schema}`);
  for (const b of ["stg_zalo_posts", "sale_offer_records", "eval_label_items", "eval_labels"]) {
    await c.query(`CREATE TABLE ${schema}.${b} (LIKE public.${b} INCLUDING ALL)`);
  }
  await c.query(`SET LOCAL search_path = ${schema}, public`);
  for (const [id, post, text] of THE_GN2) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name, agent_id, posted_at, captured_at) VALUES ($1, $2, $3, 'Nhóm Gee', 'openclaw-hook', now(), now())`, [post, SNAP_GN2, text]);
    const ghep = id === 5 ? JSON.stringify({ chu_ref: "pa", anh_refs: [], so_chu_gan: 0, trung_voi: "pb", an_tay: AN_TAY }) : null;
    await c.query(`INSERT INTO eval_label_items (item_id, lat, source_code, ref_id, text_hash, split, seed, ghep) VALUES ($1, 'gn2', 'S03', $2, $2, 'test', 's', $3::jsonb)`, [id, post, ghep]);
  }
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids) VALUES ('o1', 'sale', now(), now(), 'S03', '{t1,t2,t3}')`);
  await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES (7, 'u1', 'kind', 'sale'), (7, 'u2', 'kind', 'sale')`);
}

async function gn2Doc(c) {
  const { rows } = await c.query(`SELECT item_id, ref_id, ghep FROM eval_label_items WHERE lat = 'gn2' ORDER BY item_id`);
  return new Map(rows.map((r) => [Number(r.item_id), r]));
}

/** Kiểm một lượt; trả danh sách lỗi (chuỗi ghim), rỗng là đạt. */
function gn2Kiem(the, anTayTruoc) {
  const loi = [];
  const an = (id) => the.get(id).ghep?.trung_voi != null;
  for (const ds of NHOM_GN2) if (ds.filter((id) => !an(id)).length !== 1) loi.push(`NHOM KHONG CON MOT THE: ${ds}`);
  if (an(7)) loi.push("THE CO NHAN BI AN");
  if (an(9)) loi.push("THE GIU AN TAY BI AN");
  if (JSON.stringify(the.get(5).ghep) !== JSON.stringify(anTayTruoc)) loi.push("DAU AN TAY BI XOA");
  for (const [id, [tv, kt]] of Object.entries(AN_MONG)) {
    const g = the.get(Number(id)).ghep;
    if (g?.trung_voi !== tv || g?.khu_trung !== kt) loi.push(`AN SAI ${id}: ${g?.trung_voi}/${g?.khu_trung}`);
  }
  for (const id of [1, 7, 8, 9, 10, 11, 12]) if (an(id)) loi.push(`THE KHONG TRUNG BI AN: ${id}`);
  return loi;
}

async function gn2ChayCa(ghepLatFn, schema) {
  const c = new pgGn2.Client({ connectionString: DB_GN2 });
  await c.connect();
  try {
    await c.query("BEGIN");
    await gn2Lat(c, schema);
    const anTayTruoc = (await gn2Doc(c)).get(5).ghep;
    const bamNhan = async () => (await c.query(`SELECT md5(string_agg(item_id || labeler_id || field || coalesce(value,''), ',' ORDER BY item_id, labeler_id)) AS b FROM eval_labels`)).rows[0].b;
    const nhanTruoc = await bamNhan();
    const r1 = await ghepLatFn(c, { lat: "gn2" });
    const loi1 = gn2Kiem(await gn2Doc(c), anTayTruoc);
    const r2 = await ghepLatFn(c, { lat: "gn2", lamLai: true });
    const loi2 = gn2Kiem(await gn2Doc(c), anTayTruoc);
    return { r1, r2, loi: [...loi1, ...loi2], nhanGiu: (await bamNhan()) === nhanTruoc };
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

test("GN2-AC-5 label-ghep thường và --lam-lai: mỗi nhóm trùng một thẻ hiện, giữ dấu ẩn tay và thẻ có nhãn", { timeout: 120_000 }, async () => {
  const { ghepLat } = await import("../label-ghep.mjs");
  const k = await gn2ChayCa(ghepLat, `gn2_ghep_${process.pid}`);
  assert.deepEqual(k.loi, []);
  assert.ok(k.nhanGiu, "eval_labels đổi");
  assert.deepEqual([k.r1.an_moi, k.r1.an_tay_giu, k.r2.an_moi, k.r2.an_tay_giu, k.r2.ghi], [4, 1, 4, 1, 0]);
  // Chiều đỏ trên cùng lát: bản chép nhomTrung bỏ giữ dấu ẩn tay; bản bỏ bậc «nhiều nhãn nhất».
  const dot = async (a, b) => {
    const goc = join(import.meta.dirname, "../label-ghep.mjs");
    const src = readFileSync(goc, "utf8");
    assert.ok(src.includes(a), `chỗ đột biến không còn: ${a}`);
    const d = mkdtempSync(join(import.meta.dirname, "..", ".gn2-ghep-"));
    try {
      writeFileSync(join(d, "label-ghep.mjs"), src.replace(a, b).replace(/from "\.\/lib\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(join(LIB, rel)).href)}`));
      const m = await import(pathToFileURL(join(d, "label-ghep.mjs")).href);
      return (await gn2ChayCa(m.ghepLat, `gn2_dot_${process.pid}_${a.length}`)).loi;
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  };
  assert.ok((await dot("  for (const it of anTay) out.set(String(it.item_id), it.ghep_cu);\n", "")).includes("DAU AN TAY BI XOA"), "DAU AN TAY BI XOA");
  assert.ok((await dot("    const [giu, ...con] = [...ung].sort((a, b) => nhan(b) - nhan(a)\n      || ", "    const [giu, ...con] = [...ung].sort((a, b) => ")).includes("THE CO NHAN BI AN"), "THE CO NHAN BI AN");
  assert.ok((await dot("      || Number(duocTro.has(b.ref_id)) - Number(duocTro.has(a.ref_id))\n", "")).includes("THE GIU AN TAY BI AN"), "THE GIU AN TAY BI AN");
});
