// o-duong-that.test.ts — probe ô đường trên dữ liệu thật của DB máy thu (chỉ SELECT). Hồ sơ tach-o-duong-dau-vao-ban:
// dời khỏi suite chung (glob tests/*.test.ts) vì dữ liệu đổi mỗi đêm — một dòng S06 mới không được chặn mọi lượt chấm.
// Chạy ở: executors.test.judge_entity_duong (eval của chuan-hoa-o-duong, duong-thang-n-khong-dau, che-do-thu-tren-ops và
// hồ sơ này) và scripts/o-duong-that.sh (mục «Ô đường thật» của scripts/audit-all.sh, /ops-check đọc mỗi sáng).
// O_DUONG_DOT_BIEN=1: probe chạy bằng bản luật đột biến bỏ dòng cắt cụm — để kiểm nhánh ❌ của script.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import type { PairData } from "../src/tools/native.js";
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
  const f = join(AGENTS, `.od-${process.pid}-${CHEP.length}.ts`);
  writeFileSync(f, ma);
  CHEP.push(f);
  return (await import(f)) as Mod;
}
const DONG_CUM = '    .replace(/^(?:(?:số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\\.?\\s*\\d[\\p{L}\\d/-]*(?:\\s*,\\s*|\\s+|$))+/u, "")\n';
// Dòng mới của khoaDuong (hồ sơ tach-o-duong-dau-vao-ban), nguyên văn — chỗ đột biến của chiều đỏ từng lớp.
const DONG_LOP: Record<string, RegExp> = {
  L1: /^ {4}\.replace\(\/\\s\*,\[\\s,\]\*\/gu, ", "\)\n/m,
  L2: /^ {4}\.replace\(\/\^\(\?!\(\?:3\\\/2.*\n/m,
  L3: /^ {4}\.replace\(\/\^\.\*\\S\\s\+\(\?:ngõ.*\n/m,
  L4: /^ {4}\.replace\(\/\(ngõ\|ngo\|ngách.*"\$1\$2\$3"\)\n/m,
  L5: /^ {4}\.replace\(\/\(\\d\)\\s\+\\\/.*\n/m,
};
const NHO = new Map<string, Promise<Mod>>();
/** Bản đột biến tạo khi cần lần đầu: lượt script (/ops-check) không chạy chiều đỏ nên không ghi tệp tạm vào src/. */
const dotBienTen = (ten: string, doi: (s: string) => string) => {
  if (!NHO.has(ten)) NHO.set(ten, dotBien(doi));
  return NHO.get(ten)!;
};
const boCum = () => dotBienTen("cum", (s) => s.replace(DONG_CUM, ""));
const boLop = (ma: string) => dotBienTen(ma, (s) => s.replace(DONG_LOP[ma], ""));
/** Trong scripts/o-duong-that.sh: chỉ đo dữ liệu, không chạy chiều đỏ (chiều đỏ đã chạy ở executor judge_entity_duong). */
const trongScript = () => process.env.O_DUONG_TRONG_SCRIPT === "1";
const dotBienBat = () => process.env.O_DUONG_DOT_BIEN === "1";
/** Luật đang đo: bản thật, hoặc bản đột biến khi script kiểm nhánh ❌. */
const luat = async (): Promise<Mod> => (dotBienBat() ? boCum() : that);

const TU = "(?:ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)";
/** Chuẩn hoá độc lập: bề rộng hẻm số lẻ, trắng trước gạch chéo giữa hai số, dấu phẩy lặp. */
const chuan = (v: string) =>
  v.normalize("NFC")
    .replace(new RegExp(`(${TU})(\\.?\\s*\\d+)[.,](\\d+\\s*m)(?=[\\s,]|$)`, "giu"), "$1$2$3")
    .replace(/(\d)\s+\/(?=\d)/gu, "$1/")
    .replace(/\s*,[\s,]*/gu, ", ");
// ---------- CD-AC-8: probe DB máy thu (chỉ SELECT) — chuyển nguyên văn từ tests/judge-entity-duong.test.ts ----------
/** Bộ tách độc lập: bỏ cụm vị trí ở đầu, cắt từ dấu phẩy — regex riêng, không dùng khoaDuong. */
const CUM = /^((số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\.?\s*\d\S*?(?:[\s,]+|$))+/iu;
// Bộ tách độc lập học năm lớp của hồ sơ tach-o-duong-dau-vao-ban qua chuan(): bề rộng «hẻm 3,5m», «822 /131A», dấu phẩy lặp.
const phanTen = (v: string) => chuan(v).replace(CUM, "").split(",")[0].trim();
const coCum = (v: string) => CUM.test(v.normalize("NFC")) && /\p{L}/u.test(phanTen(v).replace(/^(?:đường|phố)(?=[\s-]|$)/iu, ""));
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
const coDuong = (kq: ReturnType<Mod["apNguong"]>) => kq.ly_do.filter((l) => l.ma === "khac_duong");

function kiemAc8(mod: Mod, giaTri: string[], the: { id: number; p: PairData }[]) {
  // Đếm hết rồi mới báo: dừng ở giá trị đầu thì không biết dữ liệu lệch bao nhiêu.
  const sai = giaTri.filter((v) => mod.soDuong(v, phanTen(v)) !== "khop");
  assert.equal(sai.length, 0, `CD-AC-8 ô đường thật có tiền tố vị trí ra Lệch: ${sai.length}/${giaTri.length} giá trị: ${sai.join(" | ")}`);
  for (const t of the) assert.equal(coDuong(mod.apNguong(t.p)).length, 0, `CD-AC-8 thẻ người nhận cùng căn bị loại theo đường: #${t.id}`);
}
async function docO(): Promise<string[]> {
  const c = new pg.Client({ connectionString: dbUrl() });
  await c.connect();
  try {
    const { rows } = await c.query<{ v: string }>("SELECT DISTINCT street_raw AS v FROM sale_offers WHERE street_raw IS NOT NULL");
    return rows.map((r) => r.v);
  } finally {
    await c.end();
  }
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
    kiemAc8(await luat(), giaTri, the);
    if (!trongScript()) {
      const bc = await boCum();
      assert.throws(() => kiemAc8(bc, giaTri, []), /CD-AC-8 ô đường thật có tiền tố vị trí ra Lệch/);
    }
  } finally {
    await c.end();
  }
});

// ---------- CD-AC-12: probe theo năm lớp đầu vào bẩn (cụm ở mọi vị trí) ----------
// Chọn và tách bằng regex riêng, không import khoaDuong. Bảng phủ ca 15/11: L1 1 · L2 3 · L3 55 · L4 2 · L5 2 giá trị hỏng.
/** Phần tên độc lập: bỏ số nhà trần trước phẩy, bỏ cụm đầu, cắt phẩy, rồi bỏ mọi thứ tới hết cụm cuối đứng sau chữ. */
function tenDocLap(v: string): string {
  const c = chuan(v);
  const so = c.match(/^(\d[\p{L}\d/-]*)\s*,\s*(.*)$/u);
  const ngayLe = (x: string) => ["3/2", "30/4", "19/5", "2/9", "1/5", "23/9"].includes(x);
  const hanhChinh = (x: string) => /^(phường|p\.|quận|q\.|huyện|xã|thị xã|thành phố|tỉnh|tp(?=[\s.]|$))/iu.test(x);
  const t0 = so && !ngayLe(so[1]) && !hanhChinh(so[2]) ? so[2] : c;
  let t = t0.replace(CUM, "").split(",")[0].trim();
  t = t.replace(new RegExp(`(\\S)\\s+${TU}\\.?\\s*\\d[\\p{L}\\d/-]*$`, "iu"), "$1");
  const m = [...t.matchAll(new RegExp(`\\S\\s+${TU}\\.?\\s*\\d[\\p{L}\\d/-]*(?:\\s+|$)`, "giu"))].pop();
  return m ? t.slice((m.index ?? 0) + m[0].length).trim() : t;
}
const LOP_CHON: [string, RegExp][] = [
  ["L1", /,\s*,|\s,/u],
  ["L2", /^\s*\d[\p{L}\d/-]*\s*,/u],
  ["L3", new RegExp(`\\S\\s+${TU}\\.?\\s*\\d`, "iu")],
  ["L4", new RegExp(`${TU}\\s*\\d+[.,]\\d+\\s*m`, "iu")],
  ["L5", /\d\s+\/\s*\d/u],
];
// Sàn từ đo 15/11 (L1 66 · L2 13 · L3 88 · L4 1 · L5 2): một lớp co về 0 là phép đo rỗng, đỏ.
const TOI_THIEU: Record<string, number> = { L1: 1, L2: 1, L3: 30, L4: 1, L5: 1 };
function kiemAc12(mod: Mod, giaTri: string[], chi?: string): Record<string, number> {
  const dem: Record<string, number> = {};
  for (const [ma, chon] of LOP_CHON) {
    if (chi && ma !== chi) continue;
    // Chỉ đo giá trị mà bộ tách độc lập rút được tên đường có khoá (đường đánh số, ô chỉ có cụm: ngoài diện).
    // Mẫu số độc lập với luật đang đo: phần tên phải còn chữ ngoài tiền tố Đường/Phố và không chỉ là số (đường đánh số).
    const coTen = (v: string) => /\p{L}/u.test(tenDocLap(v).replace(/^(?:đường|phố|duong|pho)(?=[\s-]|$)/iu, "").replace(/\bsố\b/iu, ""));
    const ds = giaTri.filter((v) => chon.test(v.normalize("NFC")) && coTen(v));
    dem[ma] = ds.length;
    const sai = ds.filter((v) => mod.soDuong(v, tenDocLap(v)) !== "khop");
    assert.equal(sai.length, 0, `CD-AC-12 ${ma} ra Lệch: ${sai.length}/${ds.length} giá trị: ${sai.slice(0, 20).join(" | ")}`);
  }
  return dem;
}
test("CD-AC-12 probe lớp ô đường thật", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  const giaTri = await docO();
  const dem = kiemAc12(await luat(), giaTri);
  t.diagnostic(`CD-AC-12 lớp: ${Object.entries(dem).map(([k, n]) => `${k}=${n}`).join(" ")}`);
  for (const [ma, n] of Object.entries(TOI_THIEU)) assert.ok(dem[ma] >= n, `CD-AC-12 bàn đo ${ma} quá ít: ${dem[ma]} < ${n}`);
  if (trongScript()) return;
  // Chiều đỏ từng lớp: bỏ đúng dòng của lớp đó trong khoaDuong → lớp ấy ra Lệch trên dữ liệu thật.
  for (const ma of Object.keys(DONG_LOP)) {
    const bl = await boLop(ma);
    assert.throws(() => kiemAc12(bl, giaTri, ma), new RegExp(`CD-AC-12 ${ma} ra Lệch: [1-9]`), `CD-AC-12 chiều đỏ ${ma} không đỏ`);
  }
});

// ---------- CD-AC-11: mục «Ô đường thật» của audit-all chạy được cả hai nhánh ----------
const GOC_KHO = join(import.meta.dirname, "../..");
const SCRIPT = join(GOC_KHO, "scripts/o-duong-that.sh");
/** Mục audit-all: gọi scripts/o-duong-that.sh, thoát 0 → pass, khác → fail. */
function kiemAuditAll(noi: string) {
  const dong = noi.split("\n").find((l) => l.includes("o-duong-that.sh"));
  assert.ok(dong && /Ô đường thật/.test(noi), "CD-AC-11 audit-all thiếu mục Ô đường thật");
  assert.ok(/o-duong-that\.sh[\s\S]{0,200}then[\s\S]{0,80}pass[\s\S]{0,80}else[\s\S]{0,80}fail/.test(noi), "CD-AC-11 mục Ô đường thật không đổi mã thoát thành pass/fail");
}
function chay(env: Record<string, string>): { ma: number; ra: string } {
  try {
    return { ma: 0, ra: execFileSync("bash", [SCRIPT], { env: { ...process.env, ...env }, encoding: "utf8", timeout: 300_000 }) };
  } catch (e) {
    const x = e as { status?: number; stdout?: string };
    return { ma: x.status ?? -1, ra: String(x.stdout ?? "") };
  }
}
test("CD-AC-11 mục Ô đường thật chạy hai nhánh", (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  // Script chạy lại chính tệp này (chỉ CD-AC-8, CD-AC-12): không tự gọi lồng.
  if (process.env.O_DUONG_TRONG_SCRIPT === "1") return t.skip("đang chạy bên trong scripts/o-duong-that.sh");
  const audit = readFileSync(join(GOC_KHO, "scripts/audit-all.sh"), "utf8");
  kiemAuditAll(audit);
  assert.throws(() => kiemAuditAll(audit.split("\n").filter((l) => !l.includes("o-duong-that.sh")).join("\n")), /CD-AC-11 audit-all thiếu mục Ô đường thật/);
  const sach = chay({});
  assert.equal(sach.ma, 0, `CD-AC-11 nhánh sạch thoát ${sach.ma}: ${sach.ra}`);
  assert.match(sach.ra, /✅ Ô đường thật: \d+ giá trị .*lớp: L1=\d+/, "CD-AC-11 nhánh sạch thiếu số giá trị hay dòng lớp");
  const hong = chay({ O_DUONG_DOT_BIEN: "1" });
  assert.equal(hong.ma, 1, `CD-AC-11 nhánh đột biến thoát ${hong.ma}: ${hong.ra}`);
  assert.match(hong.ra, /❌ Ô đường thật: .*ra Lệch/, "CD-AC-11 nhánh đột biến không in giá trị lệch");
  t.diagnostic(`CD-AC-11: ${sach.ra.trim()} · ${hong.ra.trim().slice(0, 160)}`);
});
