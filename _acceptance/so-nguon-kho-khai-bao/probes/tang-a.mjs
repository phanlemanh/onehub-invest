#!/usr/bin/env node
// tang-a.mjs — E6 (AC-6) của so-nguon-kho-khai-bao: tên thật, tên miền S09, S17 không vào kho.
// Danh sách tên: hai tệp cục bộ của làn thu (thư mục đợt, `tam/s09-mien.txt`, `tam/s17-mien.txt`) khi còn; đã xoá sau lượt điền
// thì đọc dòng S09, S17 của sổ máy thu (chỉ đọc). Mỗi tên sinh biến thể gập (chữ thường, bỏ đuôi miền, bỏ khoảng trắng và gạch).
// Dòng bắt đầu bằng «/» (tiền tố đường dẫn API) không tính là tên: đó là đoạn đường dẫn chung (đo 21/11: hai dòng S17 là từ
// thường 6–7 chữ, trúng giả 30 chỗ trong kho); tên thật và tên miền vẫn đủ để nhận diện nguồn.
// Quét: tệp đổi của nhánh so với merge-base origin/main + MỌI tệp trong hồ sơ này. Chỉ in mã nguồn và số chỗ — không in tên.
//   node _acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs [--tam <thư mục>]
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const HO_SO = "_acceptance/so-nguon-kho-khai-bao";
const MIG = "db/migrations/122_source_registry_family_cadence.sql";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const TAM = arg("--tam") ?? "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam";
const MA = ["S09", "S17"];

const gap = (s) => s.toLowerCase().normalize("NFC").replace(/[\s\-_]+/g, "");
const boDuoiMien = (s) => s.replace(/\.(com\.vn|net\.vn|org\.vn|gov\.vn|edu\.vn|vn|com|net|org|io)$/i, "");

/** Một giá trị gốc (tên, tên miền, tiền tố đường dẫn) → các biến thể gập, bỏ biến thể dưới 4 ký tự. */
export function bienThe(v) {
  const out = new Set();
  const t = v.trim();
  if (!t) return [];
  const goc = [t, t.replace(/\s*\(.*\)\s*$/, ""), t.replace(/^\/+|\/+$/g, "")];
  for (const g of goc) {
    for (const x of [g, boDuoiMien(g), boDuoiMien(boDuoiMien(g)), g.replace(/^www\./i, "")]) {
      const k = gap(x);
      if (k.length >= 4) out.add(k);
    }
    // tên miền nhiều tầng: phần nhãn chính (trước đuôi miền, sau tiền tố phụ) — vd x.abc.vn → abc
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(g)) {
      const nhan = boDuoiMien(boDuoiMien(g)).split(".").at(-1);
      if (nhan && gap(nhan).length >= 4) out.add(gap(nhan));
    }
  }
  return [...out];
}

async function docDanhSach() {
  const tep = Object.fromEntries(MA.map((m) => [m, path.join(TAM, `${m.toLowerCase()}-mien.txt`)]));
  if (MA.every((m) => existsSync(tep[m]))) {
    const ds = Object.fromEntries(MA.map((m) => [m, readFileSync(tep[m], "utf8").split("\n").map((x) => x.trim()).filter((x) => x && !x.startsWith("/"))]));
    return { nguon: "tệp cục bộ", ds };
  }
  const require = createRequire(path.join(ROOT, "app/package.json"));
  const pg = require("pg");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  try {
    await c.connect();
    await c.query("SET default_transaction_read_only = on");
    const { rows } = await c.query("SELECT code, real_name, source_ids FROM source_registry WHERE code = ANY($1)", [MA]);
    const ds = Object.fromEntries(MA.map((m) => {
      const r = rows.find((x) => x.code === m);
      return [m, r ? [r.real_name, ...(r.source_ids ?? [])].filter((x) => typeof x === "string" && x.trim()) : []];
    }));
    return { nguon: "sổ máy thu", ds };
  } catch {
    return { nguon: "không đọc được", ds: Object.fromEntries(MA.map((m) => [m, []])) };
  } finally {
    await c.end().catch(() => {});
  }
}

function tepQuet() {
  const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" });
  const base = git("merge-base", "HEAD", "origin/main").trim();
  const doi = git("diff", "--name-only", "--diff-filter=d", base, "HEAD").split("\n").filter(Boolean);
  const chuaCommit = git("ls-files", "--others", "--modified", "--exclude-standard").split("\n").filter(Boolean);
  const hoSo = [];
  const di = (rel) => {
    for (const e of readdirSync(path.join(ROOT, rel))) {
      const r = path.join(rel, e);
      if (statSync(path.join(ROOT, r)).isDirectory()) di(r);
      else hoSo.push(r);
    }
  };
  di(HO_SO);
  return [...new Set([...doi, ...chuaCommit, ...hoSo])].filter((f) => existsSync(path.join(ROOT, f))).sort();
}

/** Số chỗ trúng theo mã trong một chuỗi (đã gập). */
function trung(text, bt) {
  const g = gap(text);
  const out = {};
  for (const [ma, ds] of Object.entries(bt)) {
    let n = 0;
    for (const v of ds) n += g.split(v).length - 1;
    if (n) out[ma] = n;
  }
  return out;
}

const { nguon, ds } = await docDanhSach();
const bt = Object.fromEntries(MA.map((m) => [m, [...new Set(ds[m].flatMap(bienThe))]]));
if (MA.some((m) => bt[m].length === 0)) {
  console.log(`KHONG CO DANH SACH: ${MA.filter((m) => bt[m].length === 0).join(", ")} (nguồn: ${nguon})`);
  process.exit(2);
}
console.log(`danh sách tên: ${MA.map((m) => `${m} ${bt[m].length} mục`).join(", ")}, kể cả biến thể gập (nguồn: ${nguon})`);

// Tự kiểm: cấy từng biến thể vào bản chép migration 122 → bộ quét phải trúng đúng mã.
const migGoc = readFileSync(path.join(ROOT, MIG), "utf8");
const tmp = mkdtempSync(path.join(tmpdir(), "nk-tang-a-"));
let hong = 0;
const dem = {};
try {
  for (const m of MA) {
    dem[m] = 0;
    for (const [i, v] of bt[m].entries()) {
      const f = path.join(tmp, `cay-${m}-${i}.sql`);
      writeFileSync(f, migGoc.replace("-- <<<COT-122", `-- ${v}\n-- <<<COT-122`));
      if ((trung(readFileSync(f, "utf8"), { [m]: [v] })[m] ?? 0) >= 1) dem[m]++;
      else hong++;
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (hong) {
  console.log(`TU KIEM HONG: ${hong} biến thể cấy vào không bị bắt`);
  process.exit(1);
}
console.log(`tự kiểm: cấy từng biến thể vào bản chép migration → mỗi biến thể TRÚNG (${MA.map((m) => `${m} ${dem[m]}/${bt[m].length}`).join(", ")})`);

const files = tepQuet();
console.log(`phạm vi quét: ${files.length} tệp (tệp đổi của nhánh + mọi tệp trong ${HO_SO}/)`);
let bad = 0;
for (const f of files) {
  let text;
  try {
    text = readFileSync(path.join(ROOT, f), "utf8");
  } catch {
    continue;
  }
  const t = trung(text, bt);
  if (Object.keys(t).length) {
    bad++;
    console.log(`TRUNG ${f}: ${Object.entries(t).map(([m, n]) => `${m} ${n} chỗ`).join(", ")}`);
  } else console.log(`ok ${f}`);
}

// Dòng S09, S17 của migration: không cột real_name, source_ids rỗng.
const ins = [...migGoc.matchAll(/INSERT INTO source_registry \(([^)]*)\)\s*VALUES \('(S09|S17)',[^;]*;/g)];
const migOk = ins.length === 2 && ins.every((x) => !/real_name/.test(x[1]) && /'\{\}'/.test(x[0]));
console.log(migOk ? "migration 122: S09, S17 real_name NULL, source_ids rỗng" : "TRUNG migration 122: dòng S09/S17 mang real_name hay source_ids");
if (!migOk) bad++;

if (bad) process.exit(1);
console.log("TANG-A OK");
