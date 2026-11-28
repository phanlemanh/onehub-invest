#!/usr/bin/env node
// pha.mjs — chiều đỏ của PB10 (AC-3, eval E3). Chép data-api/ sang thư mục tạm của hệ thống (KHÔNG ghi cây nguồn — CHUNG
// điểm 16), chạy test/nguon-an-dong.test.ts trên bản chép ở từng ô, mỗi ô một DB thử riêng (db/db-thu.sh --chay):
//   goc      — không đổi: mọi ca PB10 xanh.
//   bo-chot  — taoListingsRoute bỏ nhánh 503, dựng điều kiện nguồn từ `Array.isArray(ds) ? ds : []`: PB10-AC-2 đỏ, có
//              «PB10 nguồn ẩn mở khi sổ <trạng thái>: …» ở đủ 8 trạng thái và «PB10 tin nguồn ẩn lọt khi sổ rỗng: <ô>» ở
//              đúng 6 ô viết trước.
//   bo-kiem  — kiemNguonAn trả nguyên đầu vào khi là mảng, [] khi không: PB10-AC-1 đỏ, «PB10 sổ hỏng được nhận: <trạng thái>»
//              đúng 8 lần.
// In mỗi ô một dòng JSON, cuối «pha: đủ <n> ô» (thoát 0) hoặc «pha: ô <tên> sai» (thoát 1); không cấy được → thoát 2.
// Cuối lượt soát `git status --porcelain data-api` không đổi so đầu lượt.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const trangThai = () => execFileSync("git", ["-C", ROOT, "status", "--porcelain", "--untracked-files=all", "--", "data-api"], { encoding: "utf8" });
const truoc = trangThai();

const HONG = ["rong", "phan-tu-rong", "sai-khuon", "khoang-trang", "trung", "undefined", "null", "khong-phai-mang"];
const LOT = ["khong-kind·khong-loc", "sale·khong-loc", "rent_lt·khong-loc", "gia-tot·khong-loc", "gia-tot-project·khong-loc", "chi-tiet-s02"];

const CHOT_GOC = `  if (!nguon) {
    r.all("*", (c) => c.json({ error: { ...LOI_NGUON_AN } }, 503));
    return r;
  }
  const NGUON_HIEN = dieuKienNguon(nguon);`;
const CHOT_BO = `  void LOI_NGUON_AN; void nguon;
  const NGUON_HIEN = dieuKienNguon(Array.isArray(dsNguonAn) ? (dsNguonAn as string[]) : []);`;
const KIEM_GOC = `  if (!Array.isArray(ds) || ds.length === 0) return null;`;
const KIEM_BO = `  if (true) return Array.isArray(ds) ? (ds as string[]) : [];`;

const O = [
  { o: "goc" },
  { o: "bo-chot", tep: "src/routes/listings.ts", a: CHOT_GOC, b: CHOT_BO, ca: "PB10-AC-2",
    mong: [...HONG.map((t) => new RegExp(`PB10 nguồn ẩn mở khi sổ ${t}: `)), ...LOT.map((o) => new RegExp(`PB10 tin nguồn ẩn lọt khi sổ rỗng: ${o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`))] },
  { o: "bo-kiem", tep: "src/lib/nguon-an.ts", a: KIEM_GOC, b: KIEM_BO, ca: "PB10-AC-1",
    mong: HONG.map((t) => new RegExp(`PB10 sổ hỏng được nhận: ${t}(?![a-z-])`)), dem: { re: /PB10 sổ hỏng được nhận: [a-z-]+/g, n: 8 } },
];

const env = { ...process.env };
delete env.DATABASE_URL; // db-thu.sh dựng DB riêng cho từng ô
delete env.TEST_DATABASE_URL_ADMIN;

let sai = "";
let ma = 0;
for (const o of O) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb10-pha-"));
  try {
    for (const p of ["src", "test", "package.json", "tsconfig.json"]) cpSync(path.join(ROOT, "data-api", p), path.join(tam, p), { recursive: true });
    symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(tam, "node_modules"));
    if (o.tep) {
      const f = path.join(tam, o.tep);
      const s = readFileSync(f, "utf8");
      if (s.split(o.a).length !== 2) { console.log(`pha: không cấy được ở ${o.tep} (chuỗi gốc gặp ${s.split(o.a).length - 1} lần)`); sai = o.o; ma = 2; break; }
      writeFileSync(f, s.replace(o.a, o.b));
    }
    const r = spawnSync("bash", [path.join(ROOT, "db", "db-thu.sh"), `oneinvest_suite_dapi_pb10${o.o.replace("-", "")}`, "--chay", "sh", "-c",
      `cd '${tam}' && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/nguon-an-dong.test.ts`],
      { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 << 20 });
    const ra = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
    const fail = Number(/^ℹ fail (\d+)/m.exec(ra)?.[1] ?? -1);
    const dong = { o: o.o, rc: r.status, fail };
    let dat;
    if (!o.tep) dat = r.status === 0 && fail === 0 && /^\s*✔ PB10-AC-2 sổ hỏng/m.test(ra);
    else {
      dong.ca_do = new RegExp(`^\\s*✖ ${o.ca} `, "m").test(ra);
      dong.thieu = o.mong.filter((re) => !re.test(ra)).map(String);
      if (o.dem) dong.dem = new Set(ra.match(o.dem.re) ?? []).size;
      dat = r.status !== 0 && dong.ca_do && !dong.thieu.length && (!o.dem || dong.dem === o.dem.n);
    }
    dong.dat = dat;
    console.log(JSON.stringify(dong));
    if (!dat) {
      console.log(ra.split("\n").filter((l) => /^\s*[✔✖] |PB10 |ℹ (tests|pass|fail)|db-thu|Error/.test(l)).slice(0, 30).join("\n"));
      sai = o.o; ma = 1;
    }
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  if (sai) break;
}
if (trangThai() !== truoc) { console.log(`pha: probe để tạo phẩm trong cây nguồn data-api/`); ma = ma || 1; sai = sai || "cay-nguon"; }
if (sai) { console.log(`pha: ô ${sai} sai`); process.exitCode = ma; }
else console.log(`pha: đủ ${O.length} ô; cây nguồn data-api/ không đổi`);
