// judge-entity-duong.test.ts — hồ sơ chuan-hoa-o-duong: khoá đường bỏ cụm vị trí, số nhà, đuôi địa chỉ (luật + thẻ duyệt).
// Tên ca mở đầu bằng mã AC (CD-AC-n). Không model; probe CD-AC-8 chỉ SELECT trên DB máy thu, bỏ qua có lý do dưới CI.
// Chiều đỏ: bản đột biến của judge-entity.ts đổi đúng một chỗ trong khoaDuong, chép tạm CẠNH tệp thật
// (src/agents/.cd-<pid>-<n>.ts, import tương đối vẫn đúng), xoá cuối lượt.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import pg from "pg";
import type { PairData } from "../src/tools/native.js";
import { TR, cap, type Tin } from "./judge-chung.js";
import * as that from "../src/agents/judge-entity.js";

type Mod = typeof that;
const AGENTS = join(import.meta.dirname, "../src/agents");
const GOC = readFileSync(join(AGENTS, "judge-entity.ts"), "utf8");
const CHEP: string[] = [];
after(() => {
  for (const f of CHEP) rmSync(f, { force: true });
});
async function dotBien(doi: (s: string) => string): Promise<Mod> {
  const ma = doi(GOC);
  assert.notEqual(ma, GOC, "đột biến không đổi mã — chiều đỏ vô nghĩa");
  const f = join(AGENTS, `.cd-${process.pid}-${CHEP.length}.ts`);
  writeFileSync(f, ma);
  CHEP.push(f);
  return (await import(f)) as Mod;
}
// Ba chỗ đột biến — chuỗi nguyên văn trong khoaDuong.
const DONG_CUM = '    .replace(/^(?:(?:số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\\.?\\s*\\d[\\p{L}\\d/-]*(?:\\s*,\\s*|\\s+|$))+/u, "")\n';
const DONG_PHAY = '    .replace(/,.*$/u, "")\n';
const DONG_ETH = '    .replace(/ð/g, "đ")\n';
const boCum = () => dotBien((s) => s.replace(DONG_CUM, ""));

const goc: Tin = { perm2: 100 * TR, area: 50, phuong: "Bình Thạnh", loai: "house" };
const voi = (o: Partial<Tin>): Tin => ({ ...goc, perm2: 102 * TR, ...o });
const coDuong = (kq: ReturnType<Mod["apNguong"]>) => kq.ly_do.filter((l) => l.ma === "khac_duong");
/** Chạy luật hai chiều trên một cặp đường; trả hai kết quả. */
function hai(mod: Mod, a: string, b: string) {
  return [mod.apNguong(cap(voi({ street: a }), voi({ street: b }))), mod.apNguong(cap(voi({ street: b }), voi({ street: a })))];
}

// ---------- Ma trận viết trước (dùng chung với CD-AC-7) ----------
const AC1: [string, string][] = [
  ["Ngõ 254 Minh Khai", "Minh Khai"],
  ["Hẻm 80/66 Dương Quảng Hàm", "Dương Quảng Hàm"],
  ["Ngõ 210A Võ Chí Công", "Võ Chí Công"],
  ["Số 10 Ngõ 9 La Dương", "La Dương"],
  ["ngõ 63 ngách 1 Ngô Thì Sỹ", "Ngô Thì Sỹ"],
  ["Ngõ 199 Phố Lò Đúc", "Lò Đúc"],
  ["Kiệt 12 Hùng Vương", "Hùng Vương"],
  ["ngo 5 Kim Ma", "Kim Mã"],
  ["Ngõ 5, Kim Mã", "Kim Mã"],
  ["Số 10, Ngõ 9, La Dương", "La Dương"],
];
const AC2: [string, string][] = [
  ["175 Lạc Long Quân", "Lạc Long Quân"],
  ["2295 Huỳnh Tấn Phát", "Đường Huỳnh Tấn Phát"],
  ["235 Nguyễn Trãi, Khương Đình, Hà Nội, Vietnam", "Nguyễn Trãi"],
  ["Số 277 Đường Bến Bình Đông, Phường 14, Quận 8", "Bến Bình Đông"],
];
const AC3_CUNG: [string, string][] = [["3 Tháng 2", "Đường 3 Tháng 2"], ["Đường số 7", "Đường số 7"]];
const AC3_KHAC: [string, string][] = [["Đường số 7", "Đường số 9"], ["30 Tháng 4", "2 Tháng 4"]];
const AC4 = ["4", "Số 8", "Ngõ", "Ngõ 12"];
const AC5: [string, string][] = [["Ngõ 254 Minh Khai", "Bạch Mai"], ["Ngõ 12 Hồng Hà", "Hồng Bàng"], ["175 Lạc Long Quân", "Âu Cơ"]];
const ETH = "Hẻm 135 Trần Hưng Ðạo";
const AC6: [string, string] = [ETH, "Trần Hưng Đạo"];

// ---------- CD-AC-1 ----------
function kiemAc1(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC1)
    for (const kq of hai(mod, a, b)) {
      assert.ok(coDuong(kq).length === 0 && kq.same_house === "yes" && mod.soDuong(a, b) === "khop", `CD-AC-1 cùng đường có tiền tố vị trí bị loại: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("CD-AC-1 tiền tố vị trí", async () => {
  assert.equal(kiemAc1(that), 20);
  assert.throws(() => kiemAc1(boCumMod), /CD-AC-1 cùng đường có tiền tố vị trí bị loại: Ngõ 254 Minh Khai ↔ Minh Khai/);
  const phayTruoc = await dotBien((s) => s.replace(DONG_CUM + DONG_PHAY, DONG_PHAY + DONG_CUM));
  assert.throws(() => kiemAc1(phayTruoc), /CD-AC-1 cùng đường có tiền tố vị trí bị loại: Ngõ 5, Kim Mã ↔ Kim Mã/);
});
let boCumMod: Mod;
before(async () => {
  boCumMod = await boCum();
});

// ---------- CD-AC-2 ----------
function kiemAc2(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC2)
    for (const kq of hai(mod, a, b)) {
      assert.equal(coDuong(kq).length, 0, `CD-AC-2 số nhà hay đuôi địa chỉ bị loại: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("CD-AC-2 số nhà và đuôi địa chỉ", async () => {
  assert.equal(kiemAc2(that), 8);
  const khongPhay = await dotBien((s) => s.replace(DONG_PHAY, ""));
  assert.throws(() => kiemAc2(khongPhay), /CD-AC-2 số nhà hay đuôi địa chỉ bị loại: 235 Nguyễn Trãi, Khương Đình, Hà Nội, Vietnam ↔ Nguyễn Trãi/);
});

// ---------- CD-AC-3 ----------
function kiemAc3(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC3_CUNG)
    for (const kq of hai(mod, a, b)) {
      assert.equal(coDuong(kq).length, 0, `CD-AC-3 tên đường bắt đầu bằng số bị loại: ${a} ↔ ${b}`);
      n++;
    }
  for (const [a, b] of AC3_KHAC)
    for (const kq of hai(mod, a, b)) {
      assert.ok(kq.same_house === "no" && coDuong(kq).length === 1, `CD-AC-3 hai đường đánh số khác không loại: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("CD-AC-3 tên đường bắt đầu bằng số", async () => {
  assert.equal(kiemAc3(that), 8);
  const motCach = await dotBien((s) => s.replace("const cachDoc = soNha && !/^tháng\\s+\\d/u.test(soNha[1]) ? [soNha[1], t] : [t];", "const cachDoc = soNha ? [soNha[1]] : [t];"));
  assert.throws(() => kiemAc3(motCach), /CD-AC-3 tên đường bắt đầu bằng số bị loại: 3 Tháng 2 ↔ Đường 3 Tháng 2/);
  const boThang = await dotBien((s) => s.replace("soNha && !/^tháng\\s+\\d/u.test(soNha[1])", "soNha"));
  assert.throws(() => kiemAc3(boThang), /CD-AC-3 hai đường đánh số khác không loại: 30 Tháng 4 ↔ 2 Tháng 4/);
});

// ---------- CD-AC-4 ----------
function kiemAc4(mod: Mod): number {
  let n = 0;
  for (const a of AC4)
    for (const [x, y] of [[a, "Minh Khai"], ["Minh Khai", a]]) {
      const kq = mod.apNguong(cap(voi({ street: x }), voi({ street: y })));
      assert.ok(coDuong(kq).length === 0 && mod.soDuong(x, y) === "thieu", `CD-AC-4 ô không mang tên đường thành Lệch: ${a} ↔ Minh Khai`);
      n++;
    }
  return n;
}
test("CD-AC-4 ô đường không mang tên", async () => {
  assert.equal(kiemAc4(that), 8);
  const ngoTran = await dotBien((s) => s.replace("  if (/^(?:số|ngõ|ngách|hẻm|kiệt)?$/u.test(t)) return [];\n", ""));
  assert.throws(() => kiemAc4(ngoTran), /CD-AC-4 ô không mang tên đường thành Lệch: Ngõ ↔ Minh Khai/);
});

// ---------- CD-AC-5 ----------
function kiemAc5(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC5)
    for (const kq of hai(mod, a, b)) {
      assert.ok(kq.same_house === "no" && coDuong(kq).length === 1, `CD-AC-5 hai đường khác không loại: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("CD-AC-5 khác đường vẫn loại", async () => {
  assert.equal(kiemAc5(that), 6);
  const luonKhop = await dotBien((s) => s.replace('return ka.some((k) => kb.includes(k)) ? "khop" : "lech";', 'return "khop";'));
  assert.throws(() => kiemAc5(luonKhop), /CD-AC-5 hai đường khác không loại: Ngõ 254 Minh Khai ↔ Bạch Mai/);
});

// ---------- CD-AC-6 ----------
function kiemAc6(mod: Mod) {
  for (const kq of hai(mod, AC6[0], AC6[1])) assert.equal(coDuong(kq).length, 0, "CD-AC-6 chữ Eth thành đường khác");
}
test("CD-AC-6 chữ Eth", async () => {
  assert.equal(ETH.codePointAt(ETH.indexOf("ạo") - 1), 0xd0);
  kiemAc6(that);
  const khongEth = await dotBien((s) => s.replace(DONG_ETH, ""));
  assert.throws(() => kiemAc6(khongEth), /CD-AC-6 chữ Eth thành đường khác/);
});

// ---------- CD-AC-7: thẻ duyệt và luật cùng khoá đường ----------
const TEP_APP = join(import.meta.dirname, "../../app/src/lib/ops/review-can-cu.ts");
function rutApp(ten: string): string {
  const m = readFileSync(TEP_APP, "utf8").match(new RegExp(`^(?:export )?function ${ten}\\([\\s\\S]*?\\n}`, "m"));
  assert.ok(m, `CD-AC-7 không rút được ${ten} từ review-can-cu.ts`);
  return m[0].replace(/^export /, "");
}
type SoFn = (a: string | null, b: string | null) => string;
function soDuongApp(): SoFn {
  const ma = ["boDau", "khoaDuong", "soDuong"].map(rutApp).join("\n");
  return new Function(`${stripTypeScriptTypes(ma)}\nreturn soDuong;`)();
}
const HD2: [string, string][] = [["Duong Lam", "Dương Lâm"], ["Đường Đinh Bộ Lĩnh", "đinh bộ lĩnh"], ["Duong Lang", "Đường Láng"]];
const MA_TRAN_7: [string, string, string][] = [
  ...AC1.map(([a, b]) => [a, b, "khop"] as [string, string, string]),
  ...AC2.map(([a, b]) => [a, b, "khop"] as [string, string, string]),
  ...AC3_CUNG.map(([a, b]) => [a, b, "khop"] as [string, string, string]),
  ...AC3_KHAC.map(([a, b]) => [a, b, "lech"] as [string, string, string]),
  ...AC4.map((a) => [a, "Minh Khai", "thieu"] as [string, string, string]),
  ...AC5.map(([a, b]) => [a, b, "lech"] as [string, string, string]),
  [AC6[0], AC6[1], "khop"],
  ...HD2.map(([a, b]) => [a, b, "khop"] as [string, string, string]),
];
function kiemAc7(luat: SoFn): number {
  const the = soDuongApp();
  let n = 0;
  for (const [a, b, ky] of MA_TRAN_7)
    for (const [x, y] of [[a, b], [b, a]]) {
      const t = the(x, y);
      const l = luat(x, y);
      assert.ok(t === ky && l === ky, `CD-AC-7 luật lệch thẻ duyệt ở: ${x} | ${y} (thẻ ${t}, luật ${l}, kỳ vọng ${ky})`);
      n++;
    }
  return n;
}
test("CD-AC-7 thẻ và luật cùng khoá đường", () => {
  assert.equal(MA_TRAN_7.length, 29);
  assert.equal(kiemAc7(that.soDuong), 58);
  assert.throws(() => kiemAc7(boCumMod.soDuong), /CD-AC-7 luật lệch thẻ duyệt ở: Ngõ 254 Minh Khai \| Minh Khai/);
});

// ---------- CD-AC-8: probe DB máy thu (chỉ SELECT) ----------
/** Bộ tách độc lập: bỏ cụm vị trí ở đầu, cắt từ dấu phẩy — regex riêng, không dùng khoaDuong. */
const CUM = /^((số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\.?\s*\d\S*?[\s,]+)+/iu;
const phanTen = (v: string) => v.normalize("NFC").replace(CUM, "").split(",")[0].trim();
const coCum = (v: string) => CUM.test(v.normalize("NFC")) && /\p{L}/u.test(phanTen(v));
const dbUrl = () => process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
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
const odDuongDacBiet = (v: string | null) => !!v && (coCum(v) || /^\d/.test(v.trim()) || v.includes(","));

function kiemAc8(mod: Mod, giaTri: string[], the: { id: number; p: PairData }[]) {
  for (const v of giaTri) assert.equal(mod.soDuong(v, phanTen(v)), "khop", `CD-AC-8 ô đường thật có tiền tố vị trí ra Lệch: ${v}`);
  for (const t of the) assert.equal(coDuong(mod.apNguong(t.p)).length, 0, `CD-AC-8 thẻ người nhận cùng căn bị loại theo đường: #${t.id}`);
}
test("CD-AC-8 probe ô đường thật", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  const c = new pg.Client({ connectionString: dbUrl() });
  await c.connect();
  try {
    const { rows } = await c.query<{ v: string }>("SELECT DISTINCT street_raw AS v FROM sale_offers WHERE street_raw IS NOT NULL");
    const giaTri = rows.map((r) => r.v).filter(coCum);
    const q = await c.query(
      `SELECT id::int AS id, evidence FROM review_queue WHERE item_type = 'entity_match' AND status = 'approved' ORDER BY id`,
    );
    const the = q.rows
      .map((r) => ({ id: r.id as number, p: tuEvidence(r.evidence.offer_a, r.evidence.offer_b) }))
      .filter((x) => odDuongDacBiet(x.p.a.street) || odDuongDacBiet(x.p.b.street));
    t.diagnostic(`CD-AC-8: ${giaTri.length} giá trị street_raw có cụm vị trí · ${the.length} thẻ người nhận có ô đường đặc biệt`);
    assert.ok(giaTri.length >= 100, `CD-AC-8 bàn đo quá ít: ${giaTri.length} giá trị`);
    kiemAc8(that, giaTri, the);
    assert.throws(() => kiemAc8(boCumMod, giaTri, []), /CD-AC-8 ô đường thật có tiền tố vị trí ra Lệch/);
  } finally {
    await c.end();
  }
});
