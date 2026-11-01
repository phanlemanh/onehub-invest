// judge-entity-khong-dau.test.ts — hồ sơ duong-thang-n-khong-dau: ô đường viết không dấu (hay gõ sai dấu) cho ra đúng khoá
// như dạng có dấu — «30 thang 4» ↔ «2 thang 4» khác đường, «3 thang 2» không bị coi số 3 là số nhà, «Ngo»/«Hem» là thiếu.
// Tên ca mở đầu bằng mã AC (KD-AC-n). Không model; probe KD-AC-6 phần (b) chỉ SELECT trên DB máy thu, bỏ qua dưới CI.
// Chiều đỏ: bản đột biến của judge-entity.ts bỏ đúng một dòng đưa-về-dạng-có-dấu, chép tạm cạnh tệp thật
// (src/agents/.kd-<pid>-<n>.ts), xoá cuối lượt.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import pg from "pg";
import { TR, cap, type Tin } from "./judge-chung.js";
import * as that from "../src/agents/judge-entity.js";

type Mod = typeof that;
const AGENTS = join(import.meta.dirname, "../src/agents");
const GOC = readFileSync(join(AGENTS, "judge-entity.ts"), "utf8");
const CHEP: string[] = [];
after(() => {
  for (const f of CHEP) rmSync(f, { force: true });
});
async function dotBien(tu: string, thanh: string): Promise<Mod> {
  assert.ok(GOC.includes(tu), `đột biến không tìm thấy dòng: ${tu}`);
  const f = join(AGENTS, `.kd-${process.pid}-${CHEP.length}.ts`);
  writeFileSync(f, GOC.replace(tu, thanh));
  CHEP.push(f);
  return (await import(f)) as Mod;
}
// Hai dòng đưa dạng không dấu về dạng có dấu — bỏ một dòng là trở lại lỗi trước vòng ở đúng lớp ấy.
const DONG_THANG = '\n    .replace(/(^|\\s)thang(?=\\s+\\d)/gu, "$1tháng");';
const DONG_TRAN = '  if (/^(?:so|ngo|ngach|hem|kiet)$/.test(boDau(t))) t = "ngõ";\n';
let khongThang: Mod;
let khongTran: Mod;
before(async () => {
  khongThang = await dotBien(DONG_THANG, ";");
  khongTran = await dotBien(DONG_TRAN, "");
});

const goc: Tin = { perm2: 100 * TR, area: 50, phuong: "Bình Thạnh", loai: "house" };
const voi = (o: Partial<Tin>): Tin => ({ ...goc, perm2: 102 * TR, ...o });
const coDuong = (kq: ReturnType<Mod["apNguong"]>) => kq.ly_do.filter((l) => l.ma === "khac_duong");
const hai = (mod: Mod, a: string, b: string) => [
  mod.apNguong(cap(voi({ street: a }), voi({ street: b }))),
  mod.apNguong(cap(voi({ street: b }), voi({ street: a }))),
];

// ---------- Ma trận viết trước ----------
const AC1: [string, string][] = [["30 thang 4", "2 thang 4"], ["19 thang 5", "26 thang 3"]];
const AC2: [string, string][] = [["30 thang 4", "30 Tháng 4"], ["3 thang 2", "Đường 3 Tháng 2"], ["Cach Mang Thang 8", "Cách Mạng Tháng 8"]];
const AC3: [string, string][] = [["3 thang 2", "Tháng 2"], ["3 thang 2", "thang 2"]];
const AC4 = ["Ngo", "Hem", "So", "Kiet", "Ngach"];
const AC4_DUONG = ["Ngõ", "Hẻm"];

function kiemAc1(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC1)
    for (const kq of hai(mod, a, b)) {
      assert.ok(kq.same_house === "no" && coDuong(kq).length === 1, `KD-AC-1 hai đường đánh số không dấu không loại: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("KD-AC-1 đường đánh số không dấu khác nhau", () => {
  assert.equal(kiemAc1(that), 4);
  assert.throws(() => kiemAc1(khongThang), /KD-AC-1 hai đường đánh số không dấu không loại: 30 thang 4 ↔ 2 thang 4/);
});

function kiemAc2(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC2)
    for (const kq of hai(mod, a, b)) {
      assert.equal(coDuong(kq).length, 0, `KD-AC-2 cùng đường khác dấu bị loại: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("KD-AC-2 cùng đường khác dấu", () => {
  assert.equal(kiemAc2(that), 6);
  // Đối chứng dương cho chiều đỏ của KD-AC-1/KD-AC-3: bản đột biến vẫn giữ cách đọc nguyên nên ca này vẫn xanh.
  assert.equal(kiemAc2(khongThang), 6);
});

function kiemAc3(mod: Mod): number {
  let n = 0;
  for (const [a, b] of AC3)
    for (const [x, y] of [[a, b], [b, a]]) {
      assert.equal(mod.soDuong(x, y), "lech", `KD-AC-3 số trước thang N bị coi là số nhà: ${a} ↔ ${b}`);
      n++;
    }
  return n;
}
test("KD-AC-3 số trước thang N không phải số nhà", () => {
  assert.equal(kiemAc3(that), 4);
  assert.throws(() => kiemAc3(khongThang), /KD-AC-3 số trước thang N bị coi là số nhà: 3 thang 2 ↔ Tháng 2/);
});

function kiemAc4(mod: Mod, ds: string[]): number {
  let n = 0;
  for (const a of ds)
    for (const [x, y] of [[a, "Minh Khai"], ["Minh Khai", a]]) {
      const kq = mod.apNguong(cap(voi({ street: x }), voi({ street: y })));
      assert.ok(mod.soDuong(x, y) === "thieu" && coDuong(kq).length === 0, `KD-AC-4 từ vị trí trần không dấu thành Lệch: ${a} ↔ Minh Khai`);
      n++;
    }
  return n;
}
test("KD-AC-4 từ vị trí trần không dấu", () => {
  assert.equal(kiemAc4(that, AC4), 10);
  assert.equal(kiemAc4(that, AC4_DUONG), 4);
  assert.throws(() => kiemAc4(khongTran, AC4), /KD-AC-4 từ vị trí trần không dấu thành Lệch: Ngo ↔ Minh Khai/);
});

// ---------- KD-AC-5: thẻ duyệt và luật cùng nhãn ----------
const TEP_APP = join(import.meta.dirname, "../../app/src/lib/ops/review-can-cu.ts");
function rutApp(ten: string): string {
  const m = readFileSync(TEP_APP, "utf8").match(new RegExp(`^(?:export )?function ${ten}\\([\\s\\S]*?\\n}`, "m"));
  assert.ok(m, `KD-AC-5 không rút được ${ten} từ review-can-cu.ts`);
  return m[0].replace(/^export /, "");
}
type SoFn = (a: string | null, b: string | null) => string;
const soDuongApp = (): SoFn =>
  new Function(`${stripTypeScriptTypes(["boDau", "khoaDuong", "soDuong"].map(rutApp).join("\n"))}\nreturn soDuong;`)();
const MA_TRAN_5: [string, string, string][] = [
  ...AC1.map(([a, b]) => [a, b, "lech"] as [string, string, string]),
  ...AC2.map(([a, b]) => [a, b, "khop"] as [string, string, string]),
  ...AC3.map(([a, b]) => [a, b, "lech"] as [string, string, string]),
  ...[...AC4, ...AC4_DUONG].map((a) => [a, "Minh Khai", "thieu"] as [string, string, string]),
];
function kiemAc5(luat: SoFn): number {
  const the = soDuongApp();
  let n = 0;
  for (const [a, b, ky] of MA_TRAN_5)
    for (const [x, y] of [[a, b], [b, a]]) {
      const t = the(x, y);
      const l = luat(x, y);
      assert.ok(t === ky && l === ky, `KD-AC-5 luật lệch thẻ duyệt ở: ${x} | ${y} (thẻ ${t}, luật ${l}, kỳ vọng ${ky})`);
      n++;
    }
  return n;
}
test("KD-AC-5 thẻ và luật cùng nhãn", () => {
  assert.equal(MA_TRAN_5.length, 14);
  assert.equal(kiemAc5(that.soDuong), 28);
  assert.throws(() => kiemAc5(khongThang.soDuong), /KD-AC-5 luật lệch thẻ duyệt ở: 30 thang 4 \| 2 thang 4/);
});

// ---------- KD-AC-6: tập khoá không đổi khi bỏ dấu ----------
/** Bỏ dấu viết riêng trong test (không dùng boDau của luật): NFD, bỏ U+0300–U+036F, đ/Đ/ð/Ð → d/D. */
const boDauTest = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đð]/g, "d").replace(/[ĐÐ]/g, "D");
/** Bộ loại tự viết: trên dạng bỏ dấu viết thường, bỏ cụm vị trí + số nhà đầu chuỗi rồi xét tiền tố duong/pho (HD2). */
function biLoai(v: string): boolean {
  const s = boDauTest(v).toLowerCase().trim()
    .replace(/^((so|ngo|ngach|hem|kiet)\.?\s*\d[\w/-]*[\s,]+)+/, "")
    .replace(/^\d[\w/-]*\s+/, "");
  return /^(duong|pho)[\s-]/.test(s);
}
const khoa = (mod: Mod, v: string) => JSON.stringify([...mod.khoaDuong(v)].sort());
function kiemAc6(mod: Mod, ds: string[]): { so: number; loai: number; lech: string[] } {
  let so = 0;
  let loai = 0;
  const lech: string[] = [];
  for (const v of ds) {
    if (biLoai(v)) {
      loai++;
      continue;
    }
    so++;
    if (khoa(mod, v) !== khoa(mod, boDauTest(v))) lech.push(v);
  }
  return { so, loai, lech };
}
const TU_DUNG = ["Ngõ", "Ngỏ", "30 Tháng 4", "123 Đường Láng", "Số 5 Dương Khuê"];
test("KD-AC-6 có dấu = không dấu", async (t) => {
  // (a) tập viết trước: 3 giá trị so, 2 giá trị bị loại (tiền tố đứng sau số nhà / cụm vị trí).
  assert.deepEqual(kiemAc6(that, TU_DUNG), { so: 3, loai: 2, lech: [] });
  assert.ok(kiemAc6(khongTran, ["Ngõ"]).lech.length === 1, "KD-AC-6 khoá đổi khi bỏ dấu: Ngõ");
  assert.throws(() => assert.deepEqual(kiemAc6(khongTran, ["Ngõ"]).lech, [], "KD-AC-6 khoá đổi khi bỏ dấu: Ngõ"), /KD-AC-6 khoá đổi khi bỏ dấu: Ngõ/);
  assert.throws(() => assert.deepEqual(kiemAc6(khongThang, ["30 Tháng 4"]).lech, [], "KD-AC-6 khoá đổi khi bỏ dấu: 30 Tháng 4"), /KD-AC-6 khoá đổi khi bỏ dấu: 30 Tháng 4/);
  // (b) dữ liệu thật trên máy thu.
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const { rows } = await c.query<{ v: string }>("SELECT DISTINCT street_raw AS v FROM sale_offers WHERE street_raw IS NOT NULL");
    const kq = kiemAc6(that, rows.map((r) => r.v));
    t.diagnostic(`KD-AC-6: ${kq.so} giá trị so · ${kq.loai} giá trị loại · ${kq.lech.length} lệch`);
    assert.ok(kq.so >= 100, `KD-AC-6 bàn đo quá ít: ${kq.so} giá trị`);
    assert.deepEqual(kq.lech, [], "KD-AC-6 khoá đổi khi bỏ dấu trên dữ liệu thật");
    assert.ok(kiemAc6(khongTran, rows.map((r) => r.v)).lech.length > 0 || kiemAc6(khongThang, rows.map((r) => r.v)).lech.length > 0, "KD-AC-6 dữ liệu thật không phân biệt bản trước vòng");
  } finally {
    await c.end();
  }
});

// ---------- KD-AC-7 (vế «không đổi»): tệp test đã ký giữ nguyên so với merge-base của nhánh ----------
const GOC_KHO = join(import.meta.dirname, "../..");
const TEP_DA_KY = [
  "agent/tests/judge-entity-duong.test.ts",
  "agent/tests/judge-luat.test.ts",
  "app/tests/the-duyet-phuong-lech-gia.test.tsx",
  "app/tests/the-duyet-du-can-cu.test.tsx",
];
const git = (...a: string[]) => execFileSync("git", a, { cwd: GOC_KHO, encoding: "utf8" }).trim();
/** Tệp nào trong danh sách khác nội dung ở `base` so với cây đang làm. */
function tepDoi(base: string, ds: string[]): string[] {
  return ds.filter((f) => {
    try {
      return git("show", `${base}:${f}`) !== readFileSync(join(GOC_KHO, f), "utf8").trim();
    } catch {
      return true;
    }
  });
}
test("KD-AC-7 tệp test đã ký không đổi so với merge-base", (t) => {
  let base: string;
  try {
    base = git("merge-base", "HEAD", "origin/main");
  } catch {
    return t.skip("không có origin/main đủ lịch sử để tính merge-base (CI checkout nông)");
  }
  t.diagnostic(`KD-AC-7: merge-base ${base.slice(0, 8)} · ${TEP_DA_KY.length} tệp`);
  assert.deepEqual(tepDoi(base, TEP_DA_KY), [], "KD-AC-7 tệp test đã ký bị sửa so với merge-base");
  // Chiều đỏ: tệp có thật trong cây nhưng khác nội dung ở mốc so — một tệp của vòng này (chưa có ở merge-base).
  assert.throws(
    () => assert.deepEqual(tepDoi(base, ["agent/tests/judge-entity-khong-dau.test.ts"]), [], "KD-AC-7 tệp test đã ký bị sửa so với merge-base"),
    /KD-AC-7 tệp test đã ký bị sửa so với merge-base/,
  );
});
