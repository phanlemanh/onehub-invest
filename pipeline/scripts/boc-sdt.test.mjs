// boc-sdt-du-va-chon-ro (SD2): bộ bóc SĐT đủ dạng và tin chọn số rõ. Số trong test là số bịa.
// Mỗi ma trận có ca đỏ: bản sao transform-zalo.mjs bị đột biến chép cạnh tệp thật (tên mang bộ đếm vì import() nhớ theo
// URL), nạp, kiểm ca ghim phải đỏ, rồi xoá.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chonSdtTin, extractPhones, gatSo } from "../transform-zalo.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const THAT = join(PIPE, "transform-zalo.mjs");
// Commit gốc của vòng (main trước SD2) — gatSo phải ra đúng như bản này.
const GOC = "9b40715dab682a3bff273caa72c588128c871aba";
const SO = "+84987654321"; // SD3: bộ bóc trả E.164

let dem = 0;
/** Nạp bản sao đột biến của transform-zalo.mjs (mã nguồn qua `doi`), trả module; xoá tệp ngay sau khi nạp. */
async function banSao(doi, nguon = readFileSync(THAT, "utf8")) {
  const moi = doi(nguon);
  assert.notEqual(moi, nguon, "đột biến không đổi được mã nguồn — thước đỏ chưa chạy");
  const tep = join(PIPE, `transform-zalo.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, moi);
  try {
    return await import(pathToFileURL(tep).href);
  } finally {
    unlinkSync(tep);
  }
}

// ---- SD-AC-1: ma trận hình thái toàn phần ----
const TIEN_TO = {
  "0": (s) => `098${s}765${s}4321`,
  "+84": (s) => `+84${s}987${s}654${s}321`,
  "84": (s) => `84${s}987${s}654${s}321`,
  "(+84)": (s) => `(+84)${s}987${s}654${s}321`,
  "(84)": (s) => `(84)${s}987${s}654${s}321`,
  "(0dd)": (s) => `(098)${s}765${s}4321`,
};
const TACH = [".", "-", " ", "•", "·"];
const HAI = (t) => (t === " " ? "  " : `${t} `);
const MA_TRAN_1 = [];
for (const [ten, viet] of Object.entries(TIEN_TO))
  for (const t of TACH)
    for (const [so, s] of [["một", t], ["hai", HAI(t)]]) MA_TRAN_1.push([`${ten} · «${t}» · ${so}`, `LH ${viet(s)} ạ`, [SO]]);
// Bốn dạng sót của audit 30/10 (§2.2) và dạng «·», rồi các dạng bộ bóc cũ đã bắt.
MA_TRAN_1.push(
  ["sót · ddd dd•dd ddd", "Zalo 098 76•54 321", [SO]],
  ["sót · (+dd) dddd ddddd", "LH (+84) 9876 54321", [SO]],
  ["sót · ddd. dd.ddddd", "Gọi 098. 76.54321", [SO]],
  ["sót · (ddd) dddd ddd", "Liên hệ (098) 7654 321", [SO]],
  ["sót · ddd dd·dd ddd", "Zalo 098 76·54 321", [SO]],
  ["cũ · liền", "LH 0987654321", [SO]],
  ["cũ · chấm 4-3-3", "LH 0987.654.321", [SO]],
  ["cũ · cách 4-3-3", "LH 0987 654 321", [SO]],
  ["cũ · gạch 4-3-3", "LH 0987-654-321", [SO]],
  ["cũ · từng chữ số cách", "LH 0 9 8 7 6 5 4 3 2 1", [SO]],
  ["cũ · +84 liền", "LH +84987654321", [SO]],
);

test("SD-AC-1: ma trận hình thái — mỗi ô ra đúng số +84xxxxxxxxx, số assert bằng số ô", () => {
  assert.equal(MA_TRAN_1.length, 6 * 5 * 2 + 11, "số ô ma trận phải là 60 ô sinh + 11 dòng riêng");
  let n = 0;
  for (const [ten, cau, mong] of MA_TRAN_1) {
    assert.deepEqual(extractPhones(cau), mong, `SD-AC-1 ô «${ten}»: ${JSON.stringify(cau)}`);
    n++;
  }
  assert.equal(n, MA_TRAN_1.length);
});

test("SD-AC-1 đỏ: bộ bóc dùng lại PHONE_RE cũ thì ô «•» trượt", async () => {
  const m = await banSao((s) => s.replace("const raw = [...t.matchAll(SDT_RE)]", "const raw = [...t.matchAll(PHONE_RE)]"));
  const cau = MA_TRAN_1.find(([ten]) => ten === "sót · ddd dd•dd ddd")[1];
  assert.notDeepEqual(m.extractPhones(cau), [SO], "SD-AC-1 đỏ phải trượt ô «•» với PHONE_RE cũ");
});

// ---- SD-AC-2: số 11 chữ số và hai số kề ----
const MA_TRAN_2 = [
  ["11 · liền", "Zalo 03745678901", []],
  ["11 · có dấu tách", "Zalo 0374.567.8901", []],
  ["11 · tách đuôi một chữ số", "Zalo 0912 345 678 9 nhé", []],
  ["11 · +84 kèm 10 số", "Zalo +840987654321", []],
  ["11 lẫn 10", "Zalo 03745678901 hoặc 0912345678", ["+84912345678"]],
];
for (const t of [...TACH, ...TACH.map(HAI), "\n"])
  MA_TRAN_2.push([`hai số kề · ${JSON.stringify(t)}`, `LH 0912345678${t}0987654321`, ["+84912345678", SO]]);
MA_TRAN_2.push(["hai số kề · nhóm 4-3-3", "LH 0912 345 678 0987 654 321", ["+84912345678", SO]]);

test("SD-AC-2: không nhận số 11 chữ số; hai số kề ra đủ hai số theo thứ tự", () => {
  for (const [ten, cau, mong] of MA_TRAN_2) assert.deepEqual(extractPhones(cau), mong, `SD-AC-2 «${ten}»`);
});

test("SD-AC-2 đỏ: bản sao nhận độ dài 11 thì trượt dòng «11 chữ số»", async () => {
  const m = await banSao((s) =>
    s.replace("(?:${TACH_SDT}{0,2}\\\\d){9}(?!\\\\d)", "(?:${TACH_SDT}{0,2}\\\\d){9,10}(?!\\\\d)").replace("if (digits.length !== 10) continue;", "if (digits.length !== 10 && digits.length !== 11) continue;"),
  );
  assert.notDeepEqual(m.extractPhones("Zalo 03745678901"), [], "SD-AC-2 đỏ: 11 chữ số phải lọt ở bản sao");
});

test("SD-AC-2 đỏ: bản sao cho khớp vượt 10 chữ số rồi mới bỏ thì trượt «hai số kề»", async () => {
  const m = await banSao((s) => s.replace("(?:${TACH_SDT}{0,2}\\\\d){9}(?!\\\\d)", "(?:${TACH_SDT}{0,2}\\\\d){9,}(?!\\\\d)"));
  assert.notDeepEqual(m.extractPhones("LH 0912 345 678 0987 654 321"), ["+84912345678", SO], "SD-AC-2 đỏ: hai số kề phải hỏng");
});

// ---- SD-AC-3: không bắt nhầm, có đối chứng dương; gatSo không đổi ----
const MA_TRAN_3 = [
  ["giá nhóm nghìn", "Bán gấp giá 3.000.000.000 thương lượng"],
  ["diện tích", "Nhà 65m2 mặt tiền 4,5m"],
  ["ngày", "Bàn giao 30/10/2026 nhé"],
  ["mã căn", "Căn S10.03 tầng 12 view hồ"],
  ["số cố định 024", "QLDT 02438266551"],
  ["dãy 12 số", "Mã HĐ 098765432109"],
  ["số trong URL", "Ảnh https://anh.example/r/jpg/0987654321abc.jpg"],
];

test("SD-AC-3: câu không có SĐT ra rỗng, bản đối chứng cùng câu thêm một SĐT ra đúng số ấy", () => {
  for (const [ten, cau] of MA_TRAN_3) {
    assert.deepEqual(extractPhones(cau), [], `SD-AC-3 «${ten}» không được ra số`);
    assert.deepEqual(extractPhones(`${cau} — LH 0912345678`), ["+84912345678"], `SD-AC-3 đối chứng «${ten}»`);
  }
});

test("SD-AC-3: gatSo của mọi câu trong ma trận SD-AC-1…3 bằng bản gốc của vòng", async () => {
  const goc = await banSao(() => execFileSync("git", ["show", `${GOC}:pipeline/transform-zalo.mjs`], { cwd: PIPE, encoding: "utf8" }).replace(/$/, "\n// goc"));
  const cau = [...MA_TRAN_1.map((r) => r[1]), ...MA_TRAN_2.map((r) => r[1]), ...MA_TRAN_3.map((r) => r[1])];
  for (const c of cau) assert.equal(gatSo(c), goc.gatSo(c), `SD-AC-3 gatSo đổi ở ${JSON.stringify(c)}`);
});

test("SD-AC-3 đỏ: bản sao bỏ guard chữ số đứng sau thì «dãy 12 số» ra số", async () => {
  const m = await banSao((s) => s.replace("{9}(?!\\\\d)`, \"g\")", "{9}`, \"g\")"));
  assert.notDeepEqual(m.extractPhones("Mã HĐ 098765432109"), [], "SD-AC-3 đỏ: dãy 12 số phải lọt ở bản sao");
});

// ---- SD-AC-4: tin chọn số ----
const b = (post_id, posted_at, phones) => ({ post_id, posted_at, phones });
const MA_TRAN_4 = [
  ["một bài một số", [b("p1", "2026-10-01", ["0911111111"])], "0911111111"],
  ["nhiều bài cùng số", [b("p1", "2026-10-01", ["0911111111"]), b("p2", "2026-10-02", ["0911111111"])], "0911111111"],
  [
    "nhiều bài nhất không ở bài đầu",
    [b("p1", "2026-10-01", ["0911111111"]), b("p2", "2026-10-02", ["0922222222"]), b("p3", "2026-10-03", ["0922222222", "0911111111"]), b("p4", "2026-10-04", ["0922222222"])],
    "0922222222",
  ],
  ["hoà hai số → bài neo", [b("p2", "2026-10-02", ["0922222222"]), b("p1", "2026-10-01", ["0933333333"])], "0933333333"],
  ["bài neo không số", [b("p1", "2026-10-01", []), b("p2", "2026-10-02", ["0944444444"])], "0944444444"],
  ["không bài nào có số", [b("p1", "2026-10-01", []), b("p2", "2026-10-02", null)], null],
];

test("SD-AC-4: chonSdtTin — nhiều bài nhất, hoà thì theo thứ tự neo; số assert bằng số dòng", () => {
  let n = 0;
  for (const [ten, bai, mong] of MA_TRAN_4) {
    assert.equal(chonSdtTin(bai), mong, `SD-AC-4 «${ten}»`);
    n++;
  }
  assert.equal(n, 6);
});

test("SD-AC-4 đỏ: bản sao chọn số đầu của bài đầu thì trượt «nhiều bài nhất»", async () => {
  const m = await banSao((s) => s.replace("export function chonSdtTin(bai) {", "export function chonSdtTin(bai) {\n  return bai[0]?.phones?.[0] ?? null;"));
  const [, bai, mong] = MA_TRAN_4[2];
  assert.notEqual(m.chonSdtTin(bai), mong, "SD-AC-4 đỏ: nhiều bài nhất phải trượt ở bản sao");
});

// ---- SD3 sdt-luu-goc-e164 (E1): dạng ra E.164 cho MỌI ô của hai ma trận; khoá băm tính từ dạng ấy ----
const E164 = /^\+84[35789]\d{8}$/;
function kiemE164(boc) {
  let n = 0;
  for (const [ten, cau, mong] of [...MA_TRAN_1, ...MA_TRAN_2]) {
    for (const so of boc(cau)) if (!E164.test(so)) throw new Error(`DANG SO KHONG PHAI E164: «${ten}» ra ${so.length} ký tự`);
    n += mong.length;
  }
  return n;
}

test("SD3-E1: mọi số bộ bóc trả ở hai ma trận đều dạng +84…", () => {
  assert.ok(kiemE164(extractPhones) > 0);
});

test("SD3-E1 đỏ: bản sao trả dạng 0… → bắt «DANG SO KHONG PHAI E164»", async () => {
  const m = await banSao((s) => s.replace('const e164 = "+84" + digits.slice(1);', "const e164 = digits;"));
  assert.throws(() => kiemE164(m.extractPhones), /DANG SO KHONG PHAI E164/);
});
