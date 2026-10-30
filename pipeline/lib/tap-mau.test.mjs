// tap-mau.test.mjs — hồ sơ _acceptance/tap-nhan-mau-ocp1 (PL8): E1 tất định, E2 đáp án theo dựng, E4 ma trận phủ, E7 dấu
// mẫu, E8 không đường tới canonical. Mỗi phép đo là một hàm kiểm nhận module bộ sinh: chạy trên bản thật (xanh) và trên bản
// chép hỏng ở thư mục tạm (đỏ, thông điệp ghim). Bộ đọc dạng viết ở đây viết riêng — không gọi lại bể giá trị của bộ sinh.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as that from "./tap-mau.mjs";
import { KHUON } from "./khuon-mau-ocp1.mjs";

const LIB = path.dirname(fileURLToPath(import.meta.url));
const PIPE = path.resolve(LIB, "..");
const ROOT = path.resolve(PIPE, "..");
const LENH = path.join(PIPE, "label-mau.mjs");
const TEP_KIEM = path.join(ROOT, "_acceptance/tap-nhan-mau-ocp1/mau-kiem.jsonl");
const SEEDS = ["a", "pl9", "kiem"];
const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Bản chép bộ sinh + thư viện khuôn ở thư mục tạm, áp một phép sửa lên một tệp; trả module đã nạp. */
async function banChep(tep, tu, thanh) {
  const dir = mkdtempSync(path.join(tmpdir(), "tap-mau-"));
  for (const f of ["tap-mau.mjs", "khuon-mau-ocp1.mjs"]) copyFileSync(path.join(LIB, f), path.join(dir, f));
  const p = path.join(dir, tep);
  const goc = readFileSync(p, "utf8");
  const moi = typeof tu === "string" ? goc.replace(tu, thanh) : goc.replace(tu, thanh);
  assert.notEqual(moi, goc, `đối chứng không áp được lên ${tep} — chỗ sửa đã đổi`);
  writeFileSync(p, moi);
  const mod = await import(pathToFileURL(path.join(dir, "tap-mau.mjs")).href);
  return { mod, dir };
}

// ── Bộ đọc dạng viết của test ─────────────────────────────────────────────────────────────────────────────────────
const MAU_O = {
  pn: "(\\d+(?:PN| ngủ|N))",
  dt: "(\\d+(?:[.,]\\d+)?(?: m²|m2|m))",
  gia: "(.+?)",
  toa: "([A-Z]+\\d+)",
  du_an: "(Vinhomes Ocean Park|Ocean Park 1|OCP1)",
  sdt: "(09xx xxx xxx)",
};
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Khung → regex + thứ tự ô. */
function regexKhuon(khung) {
  const o = [];
  const re = khung.split(/(\{[a-z_]+\})/).map((p) => {
    const m = /^\{([a-z_]+)\}$/.exec(p);
    if (!m) return thoat(p);
    o.push(m[1]);
    return MAU_O[m[1]];
  }).join("");
  return { re: new RegExp(`^${re}$`, "u"), o };
}
/** «3,15» với đơn vị 10^mu → VND nguyên. */
function soThap(s, mu) {
  const [a, b = ""] = s.split(/[.,]/);
  assert.ok(b.length <= mu);
  return BigInt(a + b.padEnd(mu, "0"));
}
const TY = 9, TRIEU = 6;
/** Đọc chữ giá → { dang, min, max } (VND). */
export function docGia(s) {
  let m;
  if ((m = /^(\d+(?:,\d+)?)–(\d+(?:,\d+)?) tỷ$/.exec(s))) return { dang: "khoang", min: soThap(m[1], TY), max: soThap(m[2], TY) };
  if ((m = /^(\d+) tỷ (\d{3})$/.exec(s))) { const v = BigInt(m[1]) * 10n ** 9n + BigInt(m[2]) * 10n ** 6n; return { dang: "x-ty-y", min: v, max: v }; }
  if ((m = /^(\d+,\d+) tỷ$/.exec(s))) { const v = soThap(m[1], TY); return { dang: "ty-phay", min: v, max: v }; }
  if ((m = /^(\d+\.\d+) tỷ$/.exec(s))) { const v = soThap(m[1], TY); return { dang: "ty-cham", min: v, max: v }; }
  if ((m = /^(\d+(?:,\d+)?) triệu$/.exec(s))) { const v = soThap(m[1], TRIEU); return { dang: "trieu", min: v, max: v }; }
  if ((m = /^(\d+(?:,\d+)?)tr\/tháng$/.exec(s))) { const v = soThap(m[1], TRIEU); return { dang: "tr-thang", min: v, max: v }; }
  if (/^\d{1,3}(?:\.\d{3})+$/.test(s)) { const v = BigInt(s.replace(/\./g, "")); return { dang: "vnd-du", min: v, max: v }; }
  throw new Error(`test: không đọc được giá «${s}»`);
}
export function docDt(s) {
  const m = /^(\d+(?:[.,]\d+)?)( m²|m2|m)$/.exec(s);
  const so = m[1].replace(",", ".").replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return { dang: m[2].trim(), value: so };
}
export function docPn(s) {
  const m = /^(\d+)(PN| ngủ|N)$/.exec(s);
  return { dang: m[2].trim(), value: String(Number(m[1])) };
}
const chuThuong = (s) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

/** Đọc lại một tin bằng khung của khuôn: giá trị từng ô trên chữ tin. */
function docTin(t) {
  const kh = KHUON.find((k) => k.id === t.khuon);
  const { re, o } = regexKhuon(kh.khung);
  const m = re.exec(t.text);
  if (!m) throw new Error(`DAP AN LECH: ${t.id} chữ không khớp khung ${kh.id}`);
  const doc = {};
  o.forEach((ten, i) => { doc[ten] = m[i + 1]; });
  return { kh, doc };
}

// ── Hàm kiểm ──────────────────────────────────────────────────────────────────────────────────────────────────────
function kiemTatDinh(mod) {
  for (const seed of SEEDS) for (const n of [1, 40, 200]) {
    const a = mod.veJsonl(mod.sinhTapMau({ lat: "ocp1", n, seed }));
    const b = mod.veJsonl(mod.sinhTapMau({ lat: "ocp1", n, seed }));
    if (a !== b) throw new Error(`TAP KHONG TAT DINH: seed ${seed} n ${n}`);
  }
}
function kiemTepKiem(mod, tep) {
  const ky = mod.veJsonl(mod.sinhTapMau({ lat: "ocp1", n: 40, seed: "kiem" }));
  if (readFileSync(tep, "utf8") !== ky) throw new Error(`TEP KIEM CU: ${path.basename(tep)} khác bản sinh lại`);
}
const O_TRUONG = { project: "du_an", building: "toa", price_min_vnd: "gia", price_max_vnd: "gia", area_m2: "dt", bedrooms: "pn" };
function kiemDapAn(mod) {
  let soTin = 0;
  for (const seed of SEEDS) for (const t of mod.sinhTapMau({ lat: "ocp1", n: 200, seed }).tin) {
    const { kh, doc } = docTin(t);
    for (const [f, o] of Object.entries(O_TRUONG)) {
      if (doc[o] === undefined && !(t.nhan[f].value === null && t.nhan[f].not_stated === true)) {
        throw new Error(`O VANG KHONG LA TIN KHONG NEU: ${t.id} ${f}`);
      }
    }
    for (const f of ["kind", "property_type"]) {
      const ky = kh[f] === null ? { value: null, not_stated: true } : { value: kh[f], not_stated: false };
      if (kh[f] === null && !(t.nhan[f].value === null && t.nhan[f].not_stated === true)) throw new Error(`O VANG KHONG LA TIN KHONG NEU: ${t.id} ${f}`);
      assert.deepEqual(t.nhan[f], ky, `${t.id} ${f}`);
    }
    assert.deepEqual(t.nhan.listing_intent, { value: kh.listing_intent, not_stated: false });
    if (doc.gia !== undefined) {
      const g = docGia(doc.gia);
      if (t.nhan.price_min_vnd.value !== String(g.min) || t.nhan.price_max_vnd.value !== String(g.max)) {
        throw new Error(`DAP AN LECH O GIA: ${t.id} «${doc.gia}» → ${g.min}–${g.max}, nhãn ${t.nhan.price_min_vnd.value}–${t.nhan.price_max_vnd.value}`);
      }
    }
    if (doc.dt !== undefined) assert.deepEqual(t.nhan.area_m2, { value: docDt(doc.dt).value, not_stated: false }, `${t.id} area_m2`);
    if (doc.pn !== undefined) assert.deepEqual(t.nhan.bedrooms, { value: docPn(doc.pn).value, not_stated: false }, `${t.id} bedrooms`);
    if (doc.toa !== undefined) assert.deepEqual(t.nhan.building, { value: chuThuong(doc.toa), not_stated: false }, `${t.id} building`);
    if (doc.du_an !== undefined) assert.deepEqual(t.nhan.project, { value: chuThuong(doc.du_an), not_stated: false }, `${t.id} project`);
    soTin++;
  }
  return soTin;
}

/** Ma trận phủ viết trước: 37 ô theo tên. */
const MA_TRAN_PHU = [
  "offer×sale", "offer×rent_lt", "inquiry×sale", "inquiry×rent_lt", "not_listing",
  ...["kind", "property_type", "project", "building", "price_min_vnd", "price_max_vnd", "area_m2", "bedrooms"].flatMap((f) => [`${f}:nêu`, `${f}:không nêu`]),
  "gia:ty-phay", "gia:ty-cham", "gia:x-ty-y", "gia:trieu", "gia:vnd-du", "gia:khoang", "gia:tr-thang",
  "dt:m2", "dt:m²", "dt:m", "pn:PN", "pn:ngủ", "pn:N", "du_an:Ocean Park 1", "du_an:OCP1", "du_an:Vinhomes Ocean Park",
];
function demPhu(mod, seed) {
  const dem = Object.fromEntries(MA_TRAN_PHU.map((o) => [o, 0]));
  for (const t of mod.sinhTapMau({ lat: "ocp1", n: 200, seed }).tin) {
    const i = t.nhan.listing_intent.value;
    dem[i === "not_listing" ? "not_listing" : `${i}×${t.nhan.kind.value}`]++;
    for (const f of ["kind", "property_type", "project", "building", "price_min_vnd", "price_max_vnd", "area_m2", "bedrooms"]) {
      dem[`${f}:${t.nhan[f].not_stated ? "không nêu" : "nêu"}`]++;
    }
    const kh = KHUON.find((k) => k.id === t.khuon);
    const m = regexKhuon(kh.khung).re.exec(t.text);
    const { o } = regexKhuon(kh.khung);
    o.forEach((ten, j) => {
      const s = m[j + 1];
      if (ten === "gia") dem[`gia:${docGia(s).dang}`]++;
      if (ten === "dt") dem[`dt:${docDt(s).dang}`]++;
      if (ten === "pn") dem[`pn:${docPn(s).dang}`]++;
      if (ten === "du_an") dem[`du_an:${s}`]++;
    });
  }
  return dem;
}
function kiemPhu(mod) {
  let soAssert = 0;
  const bang = [];
  for (const seed of SEEDS) {
    const dem = demPhu(mod, seed);
    for (const o of MA_TRAN_PHU) {
      soAssert++;
      if (!(dem[o] >= 1)) throw new Error(`O PHU TRONG ${o} (seed ${seed})`);
    }
    bang.push([seed, dem]);
  }
  return { soAssert, bang };
}

function kiemDau(mod) {
  for (const seed of SEEDS) {
    const tap = mod.sinhTapMau({ lat: "ocp1", n: 40, seed });
    const dong = mod.veJsonl(tap).trimEnd().split("\n").map((l) => JSON.parse(l));
    const dau = dong[0];
    if (!(dau.loai === "tap-nhan-mau" && dau.mau === true)) throw new Error("THIEU DONG DAU MAU");
    assert.equal(dau.seed, seed);
    assert.equal(dau.n, 40);
    assert.match(dau.khuon_ban, /^[0-9a-f]{64}$/);
    assert.equal(dong.length, 41);
    for (const t of dong.slice(1)) {
      assert.equal(t.mau, true);
      assert.match(t.id, /^mau-ocp1-/);
    }
  }
}

const TEP_BO_SINH = ["lib/tap-mau.mjs", "lib/khuon-mau-ocp1.mjs", "label-mau.mjs"];
const NHAP_PG = /(?:from\s+["']pg["']|import\(\s*["']pg["']\s*\)|require\(\s*["']pg["']\s*\))/;
const CAU_GHI = /\b(?:INSERT|UPDATE|DELETE|COPY|TRUNCATE)\b/;
const NHAP_BO_SINH = /(?:from\s+["'][^"']*tap-mau(?:\.mjs)?["']|import\(\s*["'][^"']*tap-mau(?:\.mjs)?["']\s*\))/;
function kiemNguonBoSinh(nguon) {
  for (const [ten, chu] of Object.entries(nguon)) {
    if (NHAP_PG.test(chu) || CAU_GHI.test(chu)) throw new Error(`BO SINH CO DUONG GHI DB: ${ten}`);
  }
}
function tepMjs(dir, goc = dir) {
  const ra = [];
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f.startsWith(".")) continue;
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) ra.push(...tepMjs(p, goc));
    else if (f.endsWith(".mjs")) ra.push(path.relative(goc, p));
  }
  return ra;
}
function kiemKhongDuong(dir) {
  const mien = new Set([...TEP_BO_SINH, "lib/tap-mau.test.mjs"]);
  for (const f of tepMjs(dir)) {
    if (mien.has(f.split(path.sep).join("/"))) continue;
    if (NHAP_BO_SINH.test(readFileSync(path.join(dir, f), "utf8"))) throw new Error(`BO SINH CO DUONG TOI PIPELINE: ${f}`);
  }
}

// ── Ca ───────────────────────────────────────────────────────────────────────────────────────────────────────────
test("TNM-AC-1 tất định: hàm hai lần, lệnh hai lần, hàm = lệnh, seed khác, dev/test, tệp kiểm", async () => {
  kiemTatDinh(that);
  const dir = mkdtempSync(path.join(tmpdir(), "label-mau-"));
  try {
    for (const seed of SEEDS) for (const n of [1, 40, 200]) {
      const ham = that.veJsonl(that.sinhTapMau({ lat: "ocp1", n, seed }));
      const bam = [1, 2].map((i) => {
        const out = path.join(dir, `${seed}-${n}-${i}.jsonl`);
        execFileSync(process.execPath, [LENH, "--lat", "ocp1", "--n", String(n), "--seed", seed, "--out", out], { stdio: "pipe" });
        return sha(readFileSync(out));
      });
      assert.equal(bam[0], bam[1], `lệnh hai lần khác nhau (seed ${seed} n ${n})`);
      assert.equal(bam[0], sha(ham), `lệnh khác hàm (seed ${seed} n ${n})`);
      const tin = that.sinhTapMau({ lat: "ocp1", n, seed }).tin;
      const dev = tin.filter((t) => t.split === "dev").length;
      assert.ok(Math.abs(dev - (n - dev)) <= 1, `dev ${dev} / test ${n - dev}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const a = that.sinhTapMau({ lat: "ocp1", n: 40, seed: "a" }).tin.map((t) => t.text);
  const b = that.sinhTapMau({ lat: "ocp1", n: 40, seed: "b" }).tin.map((t) => t.text);
  assert.ok(a.some((x, i) => x !== b[i]), "seed khác mà tập giống hệt");
  kiemTepKiem(that, TEP_KIEM);
  console.log("TNM-AC-1 xanh: 3 seed × n {1, 40, 200}, lệnh = hàm, tệp kiểm trùng bản sinh lại");
});

test("TNM-AC-1 đối chứng: Math.random → TAP KHONG TAT DINH; tệp kiểm sửa một byte → TEP KIEM CU", async () => {
  const { mod, dir } = await banChep("tap-mau.mjs",
    'const chiSo = (khoa, m) => Number(BigInt("0x" + sha(khoa).slice(0, 12)) % BigInt(m));',
    "const chiSo = (khoa, m) => Math.floor(Math.random() * m);");
  assert.throws(() => kiemTatDinh(mod), /TAP KHONG TAT DINH/);
  const hong = path.join(dir, "mau-kiem.jsonl");
  const buf = readFileSync(TEP_KIEM);
  buf[buf.length - 3] ^= 1;
  writeFileSync(hong, buf);
  assert.throws(() => kiemTepKiem(that, hong), /TEP KIEM CU/);
  rmSync(dir, { recursive: true, force: true });
});

test("TNM-AC-2 đáp án theo dựng: ma trận dạng viết viết trước, rồi mọi tin đọc lại từ chữ", () => {
  const MA_TRAN = [
    [docGia, "3,15 tỷ", ["ty-phay", 3150000000n, 3150000000n]],
    [docGia, "3.15 tỷ", ["ty-cham", 3150000000n, 3150000000n]],
    [docGia, "3 tỷ 150", ["x-ty-y", 3150000000n, 3150000000n]],
    [docGia, "3150 triệu", ["trieu", 3150000000n, 3150000000n]],
    [docGia, "3,1–3,3 tỷ", ["khoang", 3100000000n, 3300000000n]],
    [docGia, "12tr/tháng", ["tr-thang", 12000000n, 12000000n]],
    [docGia, "12 triệu", ["trieu", 12000000n, 12000000n]],
    [docGia, "12.000.000", ["vnd-du", 12000000n, 12000000n]],
    [docDt, "64m2", ["m2", "64"]],
    [docDt, "64,5 m²", ["m²", "64.5"]],
    [docDt, "64.5m", ["m", "64.5"]],
    [docPn, "2PN", ["PN", "2"]],
    [docPn, "2 ngủ", ["ngủ", "2"]],
    [docPn, "2N", ["N", "2"]],
    [chuThuong, "OCP1", "ocp1"],
  ];
  let soAssert = 0;
  for (const [ham, chu, ky] of MA_TRAN) {
    const r = ham(chu);
    assert.deepEqual(typeof r === "string" ? r : Object.values(r), ky, chu);
    soAssert++;
  }
  assert.equal(soAssert, MA_TRAN.length);
  const soTin = kiemDapAn(that);
  console.log(`TNM-AC-2 xanh: ${soAssert}/${MA_TRAN.length} dạng viết, ${soTin} tin đọc lại khớp nhãn`);
});

test("TNM-AC-2 đối chứng: «3 tỷ 150» → 3015000000 bị bắt; quên not_stated bị bắt", async () => {
  const a = await banChep("tap-mau.mjs", /("x-ty-y".*?)min: v, max: v/,
    "$1min: Math.floor(v / 1000) * 1000 + (v % 1000) / 10, max: Math.floor(v / 1000) * 1000 + (v % 1000) / 10");
  // bản chép vẫn in chữ «3 tỷ 150» nhưng nhãn tính sai → bộ đọc của test bắt
  assert.throws(() => kiemDapAn(a.mod), /DAP AN LECH O GIA/);
  rmSync(a.dir, { recursive: true, force: true });
  const b = await banChep("tap-mau.mjs", "const VANG = Object.freeze({ value: null, not_stated: true });",
    "const VANG = Object.freeze({ value: null, not_stated: false });");
  assert.throws(() => kiemDapAn(b.mod), /O VANG KHONG LA TIN KHONG NEU/);
  rmSync(b.dir, { recursive: true, force: true });
});

test("TNM-AC-4 ma trận phủ 37 ô × 3 seed", () => {
  assert.equal(MA_TRAN_PHU.length, 37);
  const { soAssert, bang } = kiemPhu(that);
  assert.equal(soAssert, 37 * 3);
  for (const [seed, dem] of bang) console.log(`seed ${seed}: ${MA_TRAN_PHU.map((o) => `${o}=${dem[o]}`).join(" · ")}`);
  console.log(`TNM-AC-4 xanh: ${soAssert}/${37 * 3} ô có ≥ 1 tin`);
});

test("TNM-AC-4 đối chứng: bỏ mọi khuôn inquiry × rent_lt → O PHU TRONG inquiry×rent_lt", async () => {
  const { mod, dir } = await banChep("khuon-mau-ocp1.mjs", "export const KHUON = Object.freeze(DS.map(Object.freeze));",
    'export const KHUON = Object.freeze(DS.filter((k) => !(k.listing_intent === "inquiry" && k.kind === "rent_lt")).map(Object.freeze));');
  assert.throws(() => kiemPhu(mod), /O PHU TRONG inquiry×rent_lt/);
  rmSync(dir, { recursive: true, force: true });
});

test("TNM-AC-7 dấu mẫu: mọi tin mau, id mau-, dòng đầu JSONL; lệnh không có cờ bỏ dấu", async () => {
  kiemDau(that);
  for (const co of [["--khong-dau"], ["--mau=false"]]) {
    const r = spawnSync(process.execPath, [LENH, "--lat", "ocp1", "--n", "5", "--seed", "a", ...co], { encoding: "utf8" });
    assert.notEqual(r.status, 0, `${co} phải bị từ chối`);
    assert.match(r.stderr, /co la/);
  }
  const { mod, dir } = await banChep("tap-mau.mjs", "[dau, ...tap.tin]", "[...tap.tin]");
  assert.throws(() => kiemDau(mod), /THIEU DONG DAU MAU/);
  rmSync(dir, { recursive: true, force: true });
  console.log("TNM-AC-7 xanh: dấu mẫu đủ, --khong-dau và --mau=false bị từ chối");
});

test("TNM-AC-8 không đường tới canonical/stg: bộ sinh không pg, không câu ghi; không tệp pipeline nào nạp bộ sinh", () => {
  const nguon = Object.fromEntries(TEP_BO_SINH.map((f) => [f, readFileSync(path.join(PIPE, f), "utf8")]));
  kiemNguonBoSinh(nguon);
  kiemKhongDuong(PIPE);
  // đối chứng: label-mau thêm import pg; một tệp tạm trong bản sao pipeline nạp bộ sinh
  assert.throws(() => kiemNguonBoSinh({ ...nguon, "label-mau.mjs": `import pg from "pg";\n${nguon["label-mau.mjs"]}` }), /BO SINH CO DUONG GHI DB/);
  const dir = mkdtempSync(path.join(tmpdir(), "pipe-"));
  writeFileSync(path.join(dir, "transform-thu.mjs"), 'import { sinhTapMau } from "./lib/tap-mau.mjs";\n');
  assert.throws(() => kiemKhongDuong(dir), /BO SINH CO DUONG TOI PIPELINE: transform-thu\.mjs/);
  rmSync(dir, { recursive: true, force: true });
  console.log(`TNM-AC-8 xanh: ${TEP_BO_SINH.length} tệp bộ sinh sạch, ${tepMjs(PIPE).length} tệp .mjs của pipeline không nạp bộ sinh`);
});
