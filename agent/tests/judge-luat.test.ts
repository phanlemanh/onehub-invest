// judge-luat.test.ts — hồ sơ judge-luat-loai-tru-dac-trung (HD2): luật loại trừ theo đặc trưng nhà trong apNguong (pl25-2).
// Tên ca mở đầu bằng mã AC (LT-AC-n). Không model; probe LT-AC-6 chỉ SELECT trên DB máy thu, bỏ qua có lý do dưới CI.
// Chiều đỏ: bản luật cũ pl25-1 (tests/fixtures/judge-entity-pl25-1.ts.txt, chép từ origin/main 4307a0b8) hoặc bản đột biến
// của judge-entity.ts — chép tạm CẠNH tệp thật (src/agents/.lt-cu-<pid>-<n>.ts, import tương đối vẫn đúng), xoá cuối lượt.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stripTypeScriptTypes } from "node:module";
import pg from "pg";
import type { PairData } from "../src/tools/native.js";
import { queryPair } from "../src/tools/native.js";
import { TR, cap, type Tin } from "./judge-chung.js";
import * as that from "../src/agents/judge-entity.js";

type Mod = typeof that;
const AGENTS = join(import.meta.dirname, "../src/agents");
const GOC = readFileSync(join(AGENTS, "judge-entity.ts"), "utf8");
const CHEP: string[] = [];
after(() => {
  for (const f of CHEP) rmSync(f, { force: true });
});
async function banChep(ma: string): Promise<Mod> {
  const f = join(AGENTS, `.lt-cu-${process.pid}-${CHEP.length}.ts`);
  writeFileSync(f, ma);
  CHEP.push(f);
  return (await import(f)) as Mod;
}
async function dotBien(doi: (s: string) => string): Promise<Mod> {
  const ma = doi(GOC);
  assert.notEqual(ma, GOC, "đột biến không đổi mã — chiều đỏ vô nghĩa");
  return banChep(ma);
}
/** So nguyên văn — thân của bản đột biến «bỏ khoá». */
const NGUYEN_VAN = '(x: string | null, y: string | null) => (x === null || y === null ? "thieu" : x === y ? "khop" : "lech")';
const cu = () => banChep(readFileSync(join(import.meta.dirname, "fixtures/judge-entity-pl25-1.ts.txt"), "utf8"));

const dao = (p: PairData): PairData => ({
  a: { ...p.b, text: p.a.text } as PairData["a"],
  b: { ...p.a, subject: p.b.subject } as PairData["b"],
  score: p.score,
  signals: p.signals,
});
/** Kết luận hai chiều phải bằng nhau (luật đối xứng); trả kết quả chiều xuôi. */
function chay(mod: Mod, p: PairData) {
  const x = mod.apNguong(p);
  const y = mod.apNguong(dao(p));
  assert.equal(x.same_house, y.same_house, "luật không đối xứng A↔B");
  return x;
}

const goc: Tin = { perm2: 100 * TR, area: 50, phuong: "Bình Thạnh", loai: "house" };
const voi = (o: Partial<Tin>): Tin => ({ ...goc, perm2: 102 * TR, ...o });
const coMa = (kq: ReturnType<Mod["apNguong"]>, ma: string) => kq.ly_do.filter((l) => l.ma === ma);

// ---------- LT-AC-1 ----------
// Ma trận viết trước: 5 đặc trưng × {khác, giống, thiếu một bên}.
const DAC_TRUNG: { ten: string; ma: string; khac: [Partial<Tin>, Partial<Tin>]; giong: [Partial<Tin>, Partial<Tin>]; thieu: [Partial<Tin>, Partial<Tin>] }[] = [
  { ten: "phòng ngủ", ma: "khac_pn", khac: [{ pn: 3 }, { pn: 4 }], giong: [{ pn: 3 }, { pn: 3 }], thieu: [{ pn: null }, { pn: 4 }] },
  { ten: "WC", ma: "khac_wc", khac: [{ bathrooms: 2 }, { bathrooms: 3 }], giong: [{ bathrooms: 2 }, { bathrooms: 2 }], thieu: [{ bathrooms: 2 }, { bathrooms: null }] },
  { ten: "đường", ma: "khac_duong", khac: [{ street: "Đinh Bộ Lĩnh" }, { street: "Phan Văn Trị" }], giong: [{ street: "Đinh Bộ Lĩnh" }, { street: "Đinh Bộ Lĩnh" }], thieu: [{ street: null }, { street: "Phan Văn Trị" }] },
  { ten: "toà", ma: "khac_toa", khac: [{ block: "A1" }, { block: "B2" }], giong: [{ block: "A1" }, { block: "A1" }], thieu: [{ block: "A1" }, { block: null }] },
  { ten: "tầng", ma: "khac_tang", khac: [{ floor: "12" }, { floor: "15" }], giong: [{ floor: "12" }, { floor: "12" }], thieu: [{ floor: null }, { floor: "15" }] },
];

function kiemAc1(mod: Mod): number {
  let n = 0;
  for (const d of DAC_TRUNG) {
    const khac = chay(mod, cap(voi(d.khac[0]), voi(d.khac[1])));
    assert.equal(khac.same_house, "no", `LT-AC-1 đặc trưng khác không loại: ${d.ten}`);
    n += 2;
    const giong = chay(mod, cap(voi(d.giong[0]), voi(d.giong[1])));
    assert.equal(giong.same_house, "yes", `LT-AC-1 đặc trưng giống mà không ra cùng căn: ${d.ten}`);
    n += 2;
    const thieu = chay(mod, cap(voi(d.thieu[0]), voi(d.thieu[1])));
    assert.notEqual(thieu.same_house, "no", `LT-AC-1 thiếu một bên thành lý do loại: ${d.ten}`);
    n += 2;
  }
  return n;
}

test("LT-AC-1 ma trận đặc trưng", async () => {
  assert.equal(kiemAc1(that), 30);
  await assert.rejects(async () => kiemAc1(await cu()), /LT-AC-1 đặc trưng khác không loại: phòng ngủ/);
  const thieuLaKhac = await dotBien((s) => s.replace("if (ga !== null && gb !== null && ga !== gb) khac(ma, ten, ga, gb);", "if (ga !== gb) khac(ma, ten, ga, gb);"));
  await assert.rejects(async () => kiemAc1(thieuLaKhac), /LT-AC-1 thiếu một bên thành lý do loại/);
});

// ---------- LT-AC-2 ----------
function kiemAc2(mod: Mod): number {
  const nha = (a: number | null, b: number | null) => cap(voi({ area: a }), voi({ area: b }));
  const ch = (a: number, b: number) => cap(voi({ area: a, loai: "apartment" }), voi({ area: b, loai: "apartment" }));
  const MA_TRAN: [string, PairData, boolean, string][] = [
    ["nhà 52↔54", nha(52, 54), true, "LT-AC-2 diện tích lệch quá làm tròn không loại"],
    ["nhà 52↔53", nha(52, 53), false, "LT-AC-2 lệch trong sai số làm tròn bị loại"],
    ["nhà 40,5↔41,5", nha(40.5, 41.5), false, "LT-AC-2 lệch trong sai số làm tròn bị loại"],
    ["nhà 45↔45", nha(45, 45), false, "LT-AC-2 diện tích bằng nhau bị loại"],
    ["nhà 50↔trống", nha(50, null), false, "LT-AC-2 diện tích thiếu một bên thành lý do loại"],
    ["căn hộ 70↔76", ch(70, 76), false, "LT-AC-2 căn hộ lệch trong sai số cách đo bị loại"],
    ["căn hộ 70↔80", ch(70, 80), true, "LT-AC-2 căn hộ lệch quá cách đo không loại"],
  ];
  let n = 0;
  for (const [ten, p, khac, tb] of MA_TRAN) {
    for (const q of [p, dao(p)]) {
      const kq = mod.apNguong(q);
      const co = coMa(kq, "khac_dien_tich").length === 1 && kq.same_house === "no";
      assert.equal(co, khac, `${tb} (${ten})`);
      if (!khac) assert.notEqual(kq.same_house, "no", `${tb} (${ten})`);
      n++;
    }
  }
  assert.equal(chay(mod, nha(45, 45)).same_house, "yes", "LT-AC-2 diện tích bằng nhau bị loại");
  return n;
}

test("LT-AC-2 diện tích theo làm tròn và cách đo", async () => {
  assert.equal(kiemAc2(that), 14);
  await assert.rejects(async () => kiemAc2(await cu()), /LT-AC-2 diện tích lệch quá làm tròn không loại/);
  const boLamTron = await dotBien((s) => s.replace("da > NGUONG.dienTichLamTronM2", "da > 0"));
  await assert.rejects(async () => kiemAc2(boLamTron), /LT-AC-2 lệch trong sai số làm tròn bị loại/);
  const boCanHo = await dotBien((s) => s.replace("(!canHo || (ld !== null && ld > NGUONG.dienTichCanHoMax))", "true"));
  await assert.rejects(async () => kiemAc2(boCanHo), /LT-AC-2 căn hộ lệch trong sai số cách đo bị loại/);
});

// ---------- LT-AC-3 ----------
function kiemAc3(mod: Mod) {
  for (const d of DAC_TRUNG) {
    const kq = mod.apNguong(cap(voi(d.khac[0]), voi(d.khac[1])));
    const l = coMa(kq, d.ma);
    assert.equal(l.length, 1, `LT-AC-3 thiếu lý do có mã ${d.ma}`);
    const [ga, gb] = [Object.values(d.khac[0])[0], Object.values(d.khac[1])[0]];
    assert.ok(l[0].so?.includes(String(ga)) && l[0].so?.includes(String(gb)), `LT-AC-3 so thiếu số hai bên: ${l[0].so}`);
    for (const x of kq.ly_do) assert.ok(!/\d/.test(x.cau), `LT-AC-3 cau mang số: «${x.cau}»`);
  }
  const dt = mod.apNguong(cap(voi({ area: 52 }), voi({ area: 54 })));
  assert.equal(coMa(dt, "khac_dien_tich").length, 1, "LT-AC-3 thiếu lý do có mã khac_dien_tich");
  for (const x of dt.ly_do) assert.ok(!/\d/.test(x.cau), `LT-AC-3 cau mang số: «${x.cau}»`);
}

test("LT-AC-3 lý do có mã", async () => {
  kiemAc3(that);
  const soVaoCau = await dotBien((s) => s.replace("cau: `${ten} khác`", "cau: `${ten} khác ${String(ga)}`"));
  assert.throws(() => kiemAc3(soVaoCau), /LT-AC-3 cau mang số/);
});

// ---------- LT-AC-4 ----------
function kiemAc4(mod: Mod) {
  const DANG = ["Đường Đinh Bộ Lĩnh", "Đinh Bộ Lĩnh", "đinh bộ lĩnh", "Đ. Đinh Bộ Lĩnh"];
  let n = 0;
  for (let i = 0; i < DANG.length; i++)
    for (let j = i + 1; j < DANG.length; j++) {
      const kq = chay(mod, cap(voi({ street: DANG[i] }), voi({ street: DANG[j] })));
      assert.ok(coMa(kq, "khac_duong").length === 0 && kq.same_house === "yes", `LT-AC-4 cùng đường viết khác dạng bị loại: ${DANG[i]} ↔ ${DANG[j]}`);
      n++;
    }
  assert.equal(n, 6);
  assert.equal(chay(mod, cap(voi({ street: "Đinh Bộ Lĩnh" }), voi({ street: "Phan Văn Trị" }))).same_house, "no", "LT-AC-4 hai đường khác không loại");
}

test("LT-AC-4 khoá đường", async () => {
  kiemAc4(that);
  const nguyenVan = await dotBien((s) => s.replace('soDuong(pair.a.street, pair.b.street)', `(${NGUYEN_VAN})(pair.a.street, pair.b.street)`));
  assert.throws(() => kiemAc4(nguyenVan), /LT-AC-4 cùng đường viết khác dạng bị loại/);
});

// ---------- LT-AC-8 ----------
function kiemAc8(mod: Mod) {
  const cung = (k: "floor" | "block", ds: string[], ma: string) => {
    for (let i = 0; i < ds.length; i++)
      for (let j = i + 1; j < ds.length; j++) {
        const kq = chay(mod, cap(voi({ [k]: ds[i] }), voi({ [k]: ds[j] })));
        assert.equal(coMa(kq, ma).length, 0, `LT-AC-8 cùng tầng hay toà viết khác dạng bị loại: «${ds[i]}» ↔ «${ds[j]}»`);
      }
  };
  cung("floor", ["12", "Tầng 12", "tầng 12 "], "khac_tang");
  cung("block", ["A1", "a1", "Toà A1", "Block A1"], "khac_toa");
  assert.equal(coMa(chay(mod, cap(voi({ floor: "tầng cao" }), voi({ floor: "12" }))), "khac_tang").length, 0, "LT-AC-8 tầng không có số thành lý do loại");
  assert.equal(chay(mod, cap(voi({ floor: "12" }), voi({ floor: "15" }))).same_house, "no", "LT-AC-8 hai tầng khác không loại");
  assert.equal(chay(mod, cap(voi({ block: "A1" }), voi({ block: "B2" }))).same_house, "no", "LT-AC-8 hai toà khác không loại");
}

test("LT-AC-8 tầng và toà viết khác dạng", async () => {
  kiemAc8(that);
  const nguyenVan = await dotBien((s) =>
    s.replace("soToa(pair.a.block, pair.b.block)", `(${NGUYEN_VAN})(pair.a.block, pair.b.block)`).replace("soTang(pair.a.floor, pair.b.floor)", `(${NGUYEN_VAN})(pair.a.floor, pair.b.floor)`),
  );
  assert.throws(() => kiemAc8(nguyenVan), /LT-AC-8 cùng tầng hay toà viết khác dạng bị loại/);
});

// ---------- LT-AC-7 ----------
function kiemAc7(mod: Mod) {
  assert.equal(mod.PHIEN_BAN_NGUONG, "pl25-2", "LT-AC-7 phiên bản luật chưa đổi");
  assert.deepEqual({ ...mod.NGUONG }, { giaM2YesMax: 0.15, giaM2NoMin: 0.3, dienTichLamTronM2: 1, dienTichCanHoMax: 0.1 });
}

test("LT-AC-7 phiên bản", async () => {
  kiemAc7(that);
  await assert.rejects(async () => kiemAc7(await cu()), /LT-AC-7 phiên bản luật chưa đổi/);
});

// ---------- LT-AC-9: luật so đường/toà/tầng bằng ĐÚNG khoá của thẻ duyệt ----------
const TEP_APP = join(import.meta.dirname, "../../app/src/lib/ops/review-can-cu.ts");
/** Rút NGUYÊN VĂN một hàm theo tên từ tệp app (cùng khuôn với bộ rút của judge-nguong.test.ts). */
function rutApp(ten: string): string {
  const m = readFileSync(TEP_APP, "utf8").match(new RegExp(`^(?:export )?function ${ten}\\([\\s\\S]*?\\n}`, "m"));
  assert.ok(m, `LT-AC-9 không rút được ${ten} từ review-can-cu.ts`);
  return m[0].replace(/^export /, "");
}
type SoFn = (a: string | null, b: string | null) => string;
function soApp(): Record<"soDuong" | "soToa" | "soTang", SoFn> {
  const ma = ["boDau", "khoaDuong", "soDuong", "khoaToa", "soToa", "khoaTang", "soTang"].map(rutApp).join("\n");
  return new Function(`${stripTypeScriptTypes(ma)}\nreturn { soDuong, soToa, soTang };`)();
}
// Ma trận viết trước: mỗi hàng [hàm, A, B, kỳ vọng].
const MA_TRAN_9: [keyof ReturnType<typeof soApp>, string | null, string | null, string][] = [
  ["soDuong", "Đường Đinh Bộ Lĩnh", "đinh bộ lĩnh", "khop"],
  ["soDuong", "Duong Lam", "PHỐ DƯƠNG LÂM", "khop"],
  ["soDuong", "Duong Lang", "Đường Láng", "khop"],
  ["soDuong", "Dương Lâm", "Đường Láng", "lech"],
  ["soDuong", "Đường Phan Văn Trị", "duong-phan-van-tri", "khop"],
  ["soDuong", "Đinh Bộ Lĩnh", null, "thieu"],
  ["soToa", "Block A", "Toà A", "khop"],
  ["soToa", "A", "B", "lech"],
  ["soToa", "Sao Biển", "S5.01", "thieu"],
  ["soToa", "CT2", "CT3", "lech"],
  ["soTang", "Tầng 12", "12", "khop"],
  ["soTang", "tầng cao", "12", "thieu"],
  ["soTang", "12", "15", "lech"],
];
function kiemAc9(luat: Record<string, SoFn>): number {
  const app = soApp();
  let n = 0;
  for (const [ten, a, b, ky] of MA_TRAN_9)
    for (const [x, y] of [[a, b], [b, a]] as const) {
      const the = app[ten](x, y);
      const lu = luat[ten](x, y);
      assert.ok(the === ky && lu === ky, `LT-AC-9 luật lệch thẻ duyệt ở ${ten}: ${x} | ${y} (thẻ ${the}, luật ${lu}, kỳ vọng ${ky})`);
      n++;
    }
  return n;
}

test("LT-AC-9 khoá đường/toà/tầng của luật trùng thẻ duyệt", async () => {
  assert.equal(kiemAc9(that as unknown as Record<string, SoFn>), 26);
  const lech = await dotBien((s) => s.replace("return ka.some((k) => kb.includes(k))", "return ka[0] === kb[0]"));
  assert.throws(() => kiemAc9(lech as unknown as Record<string, SoFn>), /LT-AC-9 luật lệch thẻ duyệt ở soDuong: Duong Lam \| PHỐ DƯƠNG LÂM/);
  assert.throws(() => rutApp("soKhongCo"), /LT-AC-9 không rút được soKhongCo/);
});

// ---------- LT-AC-10: đường viết không dấu ----------
function kiemAc10(mod: Mod) {
  const CUNG: [string, string][] = [["Duong Lam", "Phố Dương Lâm"], ["Duong Lang", "Đường Láng"], ["Pho Hue", "Phố Huế"], ["Duong Lam", "Dương Lâm"]];
  for (const [a, b] of CUNG) {
    const kq = chay(mod, cap(voi({ street: a }), voi({ street: b })));
    assert.ok(coMa(kq, "khac_duong").length === 0 && kq.same_house === "yes", `LT-AC-10 cùng đường có dấu và không dấu bị loại: ${a} ↔ ${b}`);
  }
  assert.equal(chay(mod, cap(voi({ street: "Dương Lâm" }), voi({ street: "Đường Láng" }))).same_house, "no", "LT-AC-10 hai đường khác không loại");
  return CUNG.length;
}

test("LT-AC-10 đường viết không dấu", async () => {
  assert.equal(kiemAc10(that), 4);
  // Lỗi cũ (Ngoài-2/7 của Cổng 2 lần 1): bỏ tiền tố không dấu mà không giữ cách đọc nguyên.
  const boTienTo = await dotBien((s) => s.replace('[khongDau ? boDau(khongDau[1]) : "", boDau(s)]', "[khongDau ? boDau(khongDau[1]) : boDau(s)]"));
  assert.throws(() => kiemAc10(boTienTo), /LT-AC-10 cùng đường có dấu và không dấu bị loại: Duong Lam ↔ Phố Dương Lâm/);
});

// ---------- LT-AC-11: toà — nhãn đúng từ vựng, chỉ mã toà mới so ----------
function kiemAc11(mod: Mod) {
  const kq = chay(mod, cap(voi({ block: "A" }), voi({ block: "B" })));
  assert.ok(coMa(kq, "khac_toa").length === 1 && kq.same_house === "no", "LT-AC-11 hai mã toà khác không loại");
  assert.ok(kq.ly_do.every((l) => !/mã căn/.test(l.cau)) && coMa(kq, "khac_toa")[0].cau === "toà khác", "LT-AC-11 nhãn lý do toà không theo từ vựng");
  const KHONG_LOAI: [string, string][] = [["Block A", "Toà A"], ["Sao Biển", "S5.01"], ["Chung Cư 38 Hoàng mai", "A"], ["Park 6", "S1001"]];
  for (const [a, b] of KHONG_LOAI) {
    const k = chay(mod, cap(voi({ block: a }), voi({ block: b })));
    assert.equal(coMa(k, "khac_toa").length, 0, `LT-AC-11 tên gọi hay tiền tố toà bị loại: ${a} ↔ ${b}`);
  }
  return KHONG_LOAI.length;
}

test("LT-AC-11 toà theo mã", async () => {
  assert.equal(kiemAc11(that), 4);
  const nguyenVan = await dotBien((s) => s.replace("soToa(pair.a.block, pair.b.block)", `(${NGUYEN_VAN})(pair.a.block, pair.b.block)`));
  assert.throws(() => kiemAc11(nguyenVan), /LT-AC-11 tên gọi hay tiền tố toà bị loại/);
  const nhanCu = await dotBien((s) => s.replace('["toa", "toà",', '["ma_can", "mã căn",'));
  assert.throws(() => kiemAc11(nhanCu), /LT-AC-11 hai mã toà khác không loại|LT-AC-11 nhãn lý do toà/);
});

// ---------- LT-AC-6: probe DB máy thu (chỉ SELECT) ----------
type Ben = Record<string, unknown>;
const so = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
const chu = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
function tuEvidence(a: Ben, b: Ben): PairData {
  const ben = (t: Ben) => ({
    offerId: String(t.offer_id), source: String(t.source ?? ""), kind: "sale",
    priceVnd: so(t.price_vnd), areaM2: so(t.area_m2), pricePerm2: so(t.price_perm2), bedrooms: so(t.bedrooms),
    phuong: chu(t.phuong), propertyType: chu(t.property_type), sellerName: null,
    street: chu(t.street), block: chu(t.block), floor: chu(t.floor), bathrooms: so(t.bathrooms),
  });
  return { a: { ...ben(a), text: null }, b: { ...ben(b), subject: null }, score: 0, signals: {} };
}
/** Tính độc lập «có ≥1 đặc trưng khác ở cả hai bên» — viết lại trong test, không import khoá hay NGUONG của luật: số
 *  viết thẳng (1 m², căn hộ 10%); đường/toà/tầng chuẩn hoá theo cách đọc rộng nhất (Ngoài-8 của Cổng 2 lần 1). */
const tron = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function cachDocDuong(v: string): string[] {
  const t = tron(v);
  const bo = t.replace(/^(?:duong|pho|d) /, "");
  return [t, bo];
}
function maToa(v: string): string | null {
  const t = tron(v).replace(/^(?:toa|block|thap|tower|lo|building) /, "");
  if (t.includes(" ") || !t || t.length > 8) return null;
  return /\d/.test(t) || t.length <= 3 ? t : null;
}
const soDau = (v: string) => (v.match(/\d+/) ?? [null])[0];
function coDacTrungKhac(p: PairData): boolean {
  const { a, b } = p;
  const hai = (x: unknown, y: unknown) => x !== null && y !== null;
  if (hai(a.bedrooms, b.bedrooms) && a.bedrooms !== b.bedrooms) return true;
  if (hai(a.bathrooms, b.bathrooms) && a.bathrooms !== b.bathrooms) return true;
  if (a.areaM2 && b.areaM2) {
    const d = Math.abs(a.areaM2 - b.areaM2);
    const canHo = a.propertyType === "apartment" || b.propertyType === "apartment";
    if (d > 1 + 1e-9 && (!canHo || d / Math.max(a.areaM2, b.areaM2) > 0.1)) return true;
  }
  if (a.street && b.street) {
    const da = cachDocDuong(a.street);
    if (!cachDocDuong(b.street).some((k) => k && da.includes(k))) return true;
  }
  if (a.block && b.block) {
    const ta = maToa(a.block);
    const tb = maToa(b.block);
    if (ta !== null && tb !== null && ta !== tb) return true;
  }
  if (a.floor && b.floor) {
    const fa = soDau(a.floor);
    const fb = soDau(b.floor);
    if (fa !== null && fb !== null && Number(fa) !== Number(fb)) return true;
  }
  return false;
}
async function docThe(c: pg.Client) {
  const { rows } = await c.query(
    `SELECT id::int AS id, status, evidence FROM review_queue WHERE item_type = 'entity_match' AND status IN ('approved','rejected') ORDER BY id`,
  );
  return rows.map((r) => ({ id: r.id as number, status: r.status as string, p: tuEvidence(r.evidence.offer_a, r.evidence.offer_b) }));
}
/** Luật trên mọi thẻ đã quyết, theo TÍNH CHẤT chứ không theo danh sách id (Ngoài-6 của Cổng 2 lần 1): người quyết thêm
 *  thẻ thì phép đo vẫn đứng. Trả số thẻ từ chối có đặc trưng khác. */
function kiemAc6(mod: Mod, the: Awaited<ReturnType<typeof docThe>>) {
  const loai = the.filter((t) => t.status === "rejected" && coDacTrungKhac(t.p)).map((t) => t.id);
  for (const t of the) {
    const kq = mod.apNguong(t.p).same_house;
    if (loai.includes(t.id)) assert.equal(kq, "no", `LT-AC-6 thẻ người từ chối không bị loại: #${t.id}`);
    if (t.status === "approved") assert.notEqual(kq, "no", `LT-AC-6 thẻ người nhận bị loại: #${t.id}`);
  }
  return loai.length;
}

test("LT-AC-6 probe thẻ đã quyết", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có thẻ ghép căn đã quyết — CI chỉ có lược đồ");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const the = await docThe(c);
    if (the.length === 0) return t.skip("máy thu chưa có thẻ ghép căn đã quyết — bàn đo rỗng");
    assert.ok(kiemAc6(that, the) >= 1, "LT-AC-6 không có thẻ từ chối nào có đặc trưng khác — bàn đo không phân biệt");
    await assert.rejects(async () => kiemAc6(await cu(), the), /LT-AC-6 thẻ người từ chối không bị loại/);
    const boDienTich = await dotBien((s) => s.replace("let khacDacTrung = khacDienTich;", "let khacDacTrung = false;"));
    await assert.rejects(async () => kiemAc6(boDienTich, the), /LT-AC-6 thẻ người từ chối không bị loại/);
  } finally {
    await c.end();
  }
});

test("LT-AC-6 bộ nạp cặp thật", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT offer_id FROM sale_offers WHERE source = 'S06' AND street_raw IS NOT NULL AND bathrooms IS NOT NULL ORDER BY offer_id LIMIT 2`,
    );
    if (rows.length < 2) return t.skip("máy thu không có hai tin S06 có đường và WC");
    const p = await queryPair(rows[0].offer_id, rows[1].offer_id, c);
    assert.ok(p, "queryPair trả null cho hai tin sống");
    assert.ok(p.a.street !== null && p.a.bathrooms !== null, "LT-AC-6 bộ nạp cặp thiếu trường đặc trưng");
  } finally {
    await c.end();
  }
});
