// judge-entity-duong.test.ts — hồ sơ chuan-hoa-o-duong: khoá đường bỏ cụm vị trí, số nhà, đuôi địa chỉ (luật + thẻ duyệt).
// Tên ca mở đầu bằng mã AC (CD-AC-n). Không model, không DB: probe dữ liệu thật (CD-AC-8, CD-AC-12) ở probes/o-duong-that.test.ts,
// ngoài suite chung (hồ sơ tach-o-duong-dau-vao-ban); CD-AC-9, CD-AC-10 thêm cùng hồ sơ đó.
// Chiều đỏ: bản đột biến của judge-entity.ts đổi đúng một chỗ trong khoaDuong, chép tạm CẠNH tệp thật
// (src/agents/.cd-<pid>-<n>.ts, import tương đối vẫn đúng), xoá cuối lượt.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
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

// ---------- CD-AC-9: năm lớp đầu vào bẩn đo trên DB máy thu 15/11 (hồ sơ tach-o-duong-dau-vao-ban) ----------
// Mỗi lớp: [ô đường, ô so, kỳ vọng]. Giá trị lấy nguyên văn từ sale_offers.street_raw (bảng phủ ca ở design doc §2).
const L1: [string, string, string][] = [["Hẻm 5 ,,1/ Đường chùa Pháp thạnh", "Chùa Pháp Thạnh", "khop"], ["Ngõ 5 , Kim Mã", "Kim Mã", "khop"]];
const L2: [string, string, string][] = [
  ["208, Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, Tp Hồ Chí Minh", "Nguyễn Hữu Cảnh", "khop"],
  ["46, Đường Điện Biên Phủ, Phường Hòa Khê, Quận Thanh Khê, Đà Nẵng", "Điện Biên Phủ", "khop"],
  ["Đường 70, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội", "Minh Khai", "thieu"],
  // Tên đường dạng ngày/tháng đứng trước phẩy KHÔNG phải số nhà (S4 r1 bắt được).
  ["3/2, Phường 12, Quận 10", "3/2", "khop"],
  ["30/4, Phường 1", "Đường 30/4", "khop"],
  ["Đường 3/2, Phường 12", "3/2", "khop"],
  ["19/5, Tân Bình", "Đường 19/5", "khop"],
];
const L3: [string, string, string][] = [
  ["Đường Kiệt 91 Lê Tân Trung", "Lê Tân Trung", "khop"],
  ["Đường Kiệt 322 Đường Hải Phòng", "Hải Phòng", "khop"],
  ["Số nhà 17 ngõ 60 Dương Khuê, Dịch Vọng Hậu, Cầu Giấy", "Dương Khuê", "khop"],
  ["Ngách xxx Ngõ 364 Phố Giải Phóng", "Giải Phóng", "khop"],
  ["Đường Kiệt 91 Lê Tân Trung", "Tô Hiệu", "lech"],
  ["Đường số 7", "Đường số 9", "lech"],
  // Cụm đứng CUỐI ô: tên đường ở trước cụm (S4 r1 bắt được, giá trị thật «tôn thất tùng hẻm 86»).
  ["tôn thất tùng hẻm 86", "Tôn Thất Tùng", "khop"],
  ["Lê Văn Sỹ hẻm 12", "Lê Văn Sỹ", "khop"],
];
const L4: [string, string, string][] = [["hẻm 3,5m Lê Văn Sỹ", "Lê Văn Sỹ", "khop"], ["Ngõ 2.5m", "Minh Khai", "thieu"]];
const L5: [string, string, string][] = [
  ["Hẻm 822 /131A HƯƠNG LỘ 2 BÌNH TRỊ ĐÔNG A, QUẬN BÌNH TÂN , TPHCM", "Hương Lộ 2 Bình Trị Đông A", "khop"],
  ["1/ TRẦN VĂN MƯỜI", "Trần Văn Mười", "khop"],
];
const LOP: [string, string, [string, string, string][]][] = [
  ["L1", "dấu phẩy lặp", L1], ["L2", "số nhà rồi phẩy", L2], ["L3", "cụm sau chữ khác", L3], ["L4", "bề rộng hẻm", L4], ["L5", "trắng trước gạch chéo", L5],
];
// Năm dòng mới của khoaDuong, nguyên văn — chỗ đột biến của chiều đỏ.
const DONG_L4 = '    .replace(/(ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)(\\.?\\s*\\d+)[.,](\\d+\\s*m)(?=[\\s,]|$)/gu, "$1$2$3")\n';
const DONG_L5 = '    .replace(/(\\d)\\s+\\/(?=\\d)/gu, "$1/")\n';
const DONG_L1 = '    .replace(/\\s*,[\\s,]*/gu, ", ")\n';
const DONG_L2 = '    .replace(/^(?!(?:3\\/2|30\\/4|19\\/5|2\\/9|1\\/5|23\\/9)\\s*,)\\d[\\p{L}\\d/-]*\\s*,(?!\\s*(?:phường|p\\.|quận|q\\.|huyện|xã|thị xã|thành phố|tỉnh|tp(?=[\\s.]|$)))\\s*/u, "")\n';
const DONG_L3 = '    .replace(/^.*\\S\\s+(?:ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\\.?\\s*\\d[\\p{L}\\d/-]*(?:\\s+|$)/u, "")\n';
function kiemLop(mod: Mod, ma: string): number {
  const [, ten, ds] = LOP.find(([m]) => m === ma)!;
  let n = 0;
  for (const [a, b, ky] of ds)
    for (const [x, y] of [[a, b], [b, a]]) {
      const kq = mod.apNguong(cap(voi({ street: x }), voi({ street: y })));
      const ok = mod.soDuong(x, y) === ky && (ky === "lech" ? coDuong(kq).length === 1 : coDuong(kq).length === 0);
      assert.ok(ok, `CD-AC-9 ${ma} ${ten}: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("CD-AC-9 lớp đầu vào bẩn", async () => {
  assert.equal(LOP.reduce((s, [m]) => s + kiemLop(that, m), 0), 42);
  const R = "hẻm 3,5m, 1 trục thẳng thới tam thôn 16";
  const kiemRac = (mod: Mod) => assert.deepEqual(mod.khoaDuong(R), ["truc thang thoi tam thon 16", "1 truc thang thoi tam thon 16"], "CD-AC-9 L4 bề rộng hẻm thành khoá rác");
  const boDong = async (dong: string) => dotBien((s) => s.replace(dong, ""));
  assert.throws(() => kiemLop(boL1, "L1"), /CD-AC-9 L1 dấu phẩy lặp: Hẻm 5 ,,1\/ Đường chùa Pháp thạnh ↔ Chùa Pháp Thạnh/);
  const boL2 = await boDong(DONG_L2);
  assert.throws(() => kiemLop(boL2, "L2"), /CD-AC-9 L2 số nhà rồi phẩy: 208, Nguyễn Hữu Cảnh/);
  assert.throws(() => kiemLop(boL3Mod, "L3"), /CD-AC-9 L3 cụm sau chữ khác: Đường Kiệt 91 Lê Tân Trung ↔ Lê Tân Trung/);
  kiemRac(that);
  const boL4 = await boDong(DONG_L4);
  assert.throws(() => kiemLop(boL4, "L4"), /CD-AC-9 L4 bề rộng hẻm: Ngõ 2\.5m ↔ Minh Khai/);
  assert.throws(() => kiemRac(boL4), /CD-AC-9 L4 bề rộng hẻm thành khoá rác/);
  const boL5 = await boDong(DONG_L5);
  assert.throws(() => kiemLop(boL5, "L5"), /CD-AC-9 L5 trắng trước gạch chéo/);
});
let boL1: Mod;
let boL3Mod: Mod;
before(async () => {
  boL1 = await dotBien((s) => s.replace(DONG_L1, ""));
  boL3Mod = await dotBien((s) => s.replace(DONG_L3, ""));
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
  ...LOP.flatMap(([, , ds]) => ds),
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
  assert.equal(MA_TRAN_7.length, 50);
  assert.equal(kiemAc7(that.soDuong), 100);
  assert.throws(() => kiemAc7(boCumMod.soDuong), /CD-AC-7 luật lệch thẻ duyệt ở: Ngõ 254 Minh Khai \| Minh Khai/);
  assert.throws(() => kiemAc7(boL3Mod.soDuong), /CD-AC-7 luật lệch thẻ duyệt ở: Đường Kiệt 91 Lê Tân Trung/);
});

// ---------- CD-AC-8: probe DB máy thu (chỉ SELECT) ----------
/** Bộ tách độc lập: bỏ cụm vị trí ở đầu, cắt từ dấu phẩy — regex riêng, không dùng khoaDuong. */
// Cụm cuối chuỗi cũng là cụm: «Ngách 84, ngõ 255» (dữ liệu thật 04/11) không có tên đường nào để so, ngoài diện AC-8.
const CUM = /^((số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\.?\s*\d\S*?(?:[\s,]+|$))+/iu;
const phanTen = (v: string) => v.normalize("NFC").replace(CUM, "").split(",")[0].trim();
// «Đường 297» chỉ có chữ ở tiền tố: đường đánh số không có khoá (khoaDuong bỏ khoá toàn số), soDuong ra Thiếu, không ra Lệch.
const coCum = (v: string) => CUM.test(v.normalize("NFC")) && /\p{L}/u.test(phanTen(v).replace(/^(?:đường|phố)(?=[\s-]|$)/iu, ""));
test("CD-AC-8 bộ tách: cụm vị trí không kèm tên đường thì ngoài diện, có tên đường thì vẫn so", () => {
  for (const v of ["Ngách 84, ngõ 255", "Ngõ 10", "Hẻm 3m", "số 3 đường 297", "hẻm 80 đường 13"]) assert.equal(coCum(v), false, `CD-AC-8 không có tên đường: ${v}`);
  assert.equal(that.soDuong("số 3 đường 297", "đường 297"), "thieu", "CD-AC-8 đường đánh số phải ra Thiếu, không ra Lệch");
  for (const v of ["Ngõ 10 Minh Khai", "Ngách 84, ngõ 255 Lạc Long Quân", "Số 5 Đường Láng"]) assert.equal(coCum(v), true, `CD-AC-8 có tên đường phải so: ${v}`);
  assert.equal(phanTen("Ngách 84, ngõ 255 Lạc Long Quân"), "Lạc Long Quân");
});

// ---------- CD-AC-10: suite chung không thêm probe dữ liệu thật ----------
// Dấu probe = ca bỏ qua dưới CI vì «cần DB máy thu». Nợ đo 15/11: bốn ca còn lại (Hỏi-2 — dời ở hàng riêng).
const NO_PROBE: Record<string, number> = { "judge-entity-khong-dau.test.ts": 1, "judge-luat.test.ts": 2 };
const DAU_PROBE = /t\.skip\("cần DB máy thu/g;
const TEN_PROBE = "CD-AC-8 probe ô đường thật";
const AGENT = join(import.meta.dirname, "..");
function tepSuite(): string[] {
  const lenh = JSON.parse(readFileSync(join(AGENT, "package.json"), "utf8")).scripts.test as string;
  const glob = lenh.match(/"(tests\/[^"]*\.test\.ts)"/)?.[1];
  assert.equal(glob, "tests/*.test.ts", `CD-AC-10 glob suite agent đổi: ${lenh}`);
  return readdirSync(join(AGENT, "tests")).filter((f) => f.endsWith(".test.ts")).map((f) => `tests/${f}`);
}
function kiemAc10(tep: string[], doc: (t: string) => string): number {
  let tong = 0;
  for (const t of tep) {
    const noi = doc(t);
    assert.ok(!noi.includes(`test("${TEN_PROBE}"`), `CD-AC-10 tệp suite có probe dữ liệu thật: ${t}`);
    const n = (noi.match(DAU_PROBE) ?? []).length;
    const ten = t.split("/").pop()!;
    assert.ok(n <= (NO_PROBE[ten] ?? 0), `CD-AC-10 probe dữ liệu thật vượt danh sách nợ: ${ten} ${n} > ${NO_PROBE[ten] ?? 0}`);
    tong += n;
  }
  return tong;
}
test("CD-AC-10 suite chung không thêm probe dữ liệu thật", (t) => {
  const tep = tepSuite();
  const doc = (f: string) => readFileSync(join(AGENT, f), "utf8");
  assert.ok(tep.length >= 10, `CD-AC-10 glob suite quá ít tệp: ${tep.length}`);
  const tong = kiemAc10(tep, doc);
  t.diagnostic(`CD-AC-10: ${tep.length} tệp suite · ${tong} ca probe dữ liệu thật còn nợ`);
  assert.ok(doc("probes/o-duong-that.test.ts").includes(`test("${TEN_PROBE}"`), "CD-AC-10 probe ô đường không nằm ở probes/o-duong-that.test.ts");
  const cfg = readFileSync(join(AGENT, "../_acceptance/config.yaml"), "utf8").split("\n").find((l) => /^\s+judge_entity_duong:/.test(l)) ?? "";
  assert.ok(cfg.includes("probes/o-duong-that.test.ts"), "CD-AC-10 executor judge_entity_duong không chạy tệp probe");
  // Chiều đỏ trên cùng hàm: thêm tệp probe vào danh sách suite; thêm một dấu probe vào judge-luat.
  assert.throws(() => kiemAc10([...tep, "probes/o-duong-that.test.ts"], doc), /CD-AC-10 tệp suite có probe dữ liệu thật: probes\/o-duong-that\.test\.ts/);
  const docThem = (f: string) => (f.endsWith("judge-luat.test.ts") ? `${doc(f)}\nt.skip(${JSON.stringify("cần DB máy thu — thêm")});` : doc(f));
  assert.throws(() => kiemAc10(tep, docThem), /CD-AC-10 probe dữ liệu thật vượt danh sách nợ: judge-luat\.test\.ts 3 > 2/);
});
