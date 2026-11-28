#!/usr/bin/env node
// pha.mjs — PB7 AC-6 (eval E6): chiều đỏ của bộ lọc nguồn ẩn trên bản chép data-api, chạy cùng lệnh của executor dapi_an.
//  goc     : bản chép không đổi → rc 0, fail 0.
//  bo-loc  : bỏ điều kiện nguồn khỏi routes/listings.ts → ca PB7-AC-3, AC-4, AC-5 đỏ; ĐÚNG tập thông điệp ghim
//            «PB7 nguồn ẩn lọt ra API: <S0x> ở <ô>» viết trước dưới đây (mỗi ô, mỗi nguồn); mọi ca PB2, DRL xanh.
//  theo-so : SOURCE_HIDDEN của bản chép data-api/src/contract/vocab.generated.ts thêm S06 → tin S06 đối chứng vắng ở MỌI ô có
//            đối chứng («PB7 đối chứng S06 vắng ở <ô>»). Ô nào vẫn có S06 → «PB7 điều kiện nguồn không theo SOURCE_HIDDEN: <ô>».
// Chỉ dòng assert mang thông điệp mới được tính (tiêu đề ca không). Ô tự đỏ cùng lượt trên nhật ký giả.
// Kết: «pha: đủ 3 ô» (thoát 0) / «pha: N ô sai» (thoát 1) / không dựng được bản chép (thoát 2).
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// Ma trận viết trước — trùng ma trận của test/tin-hien-thi.test.ts (4 đường × 5 bộ lọc; 4 ô bảng hạng; 2 ô CG8; chi tiết).
const LOC = ["area", "market", "area+bedroomsTotal", "market+bedroomsTotal", "area+trang"];
const NGUON_O = { "khong-kind": ["S02", "S08"], sale: ["S02"], rent_lt: ["S08"], rent_st: [] };
const DC_O = { "khong-kind": true, sale: true, rent_lt: true, rent_st: false };
const LOT = new Set(), DC = new Set();
for (const [d, ns] of Object.entries(NGUON_O)) for (const l of LOC) {
  for (const n of ns) LOT.add(`PB7 nguồn ẩn lọt ra API: ${n} ở ${d}·${l}`);
  if (DC_O[d]) DC.add(`${d}·${l}`);
}
for (const [o, ns] of [["hang·khong-kind", ["S02", "S08"]], ["hang·sale", ["S02"]], ["hang·rent_lt", ["S08"]], ["hang·project", ["S02"]], ["cg8·khong-kind", ["S02"]], ["cg8·sale", ["S02"]], ["chi-tiet", ["S02", "S08"]]]) {
  for (const n of ns) LOT.add(`PB7 nguồn ẩn lọt ra API: ${n} ở ${o}`);
  DC.add(o);
}
const PB7 = ["PB7-AC-3", "PB7-AC-4", "PB7-AC-5"];
const KHAC = ["PB2-AC-1", "PB2-AC-2", "PB2-AC-3", "PB2-AC-4", "PB2-AC-5", "PB2-AC-11", "PB2-AC-10c", "DRL-AC-1", "DRL-AC-2", "DRL-AC-3", "DRL-AC-4", "DRL-AC-5"];
const xanh = (ra, c) => new RegExp(`^\\s*✔ ${c} `, "m").test(ra);
const doCa = (ra, c) => new RegExp(`^\\s*✖ ${c} `, "m").test(ra);
/** Thông điệp PB7 trên các dòng KHÔNG phải tiêu đề ca. */
const thongDiep = (ra) => new Set(ra.split("\n").filter((l) => !/^\s*[✔✖] /.test(l)).flatMap((l) => [...l.matchAll(/PB7 (?:nguồn ẩn lọt ra API:|đối chứng S06 vắng ở) [^\n'"]*?(?= *$|['"])/g)].map((m) => m[0].trim())));

/** Chấm một ô từ nhật ký. */
export function cham(o, ra, rc) {
  const td = thongDiep(ra);
  if (o === "goc") return { dung: rc === 0 && [...PB7, ...KHAC].every((c) => xanh(ra, c)), thieu: [] };
  if (o === "bo-loc") {
    const thieu = [...LOT].filter((m) => !td.has(m));
    const thua = [...td].filter((m) => m.startsWith("PB7 nguồn ẩn lọt") && !LOT.has(m));
    return { dung: rc !== 0 && PB7.every((c) => doCa(ra, c)) && KHAC.every((c) => xanh(ra, c)) && !thieu.length && !thua.length, thieu, thua };
  }
  const thieu = [...DC].filter((oo) => !td.has(`PB7 đối chứng S06 vắng ở ${oo}`)).map((oo) => `PB7 điều kiện nguồn không theo SOURCE_HIDDEN: ${oo}`);
  return { dung: rc !== 0 && !thieu.length, thieu };
}
// Ô tự đỏ: nhật ký giả có ba ca PB7 đỏ nhưng thông điệp chỉ ở tiêu đề → ô bo-loc phải sai.
{
  const gia = PB7.map((c) => `✖ ${c} PB7 nguồn ẩn lọt ra API: S02 ở sale·area (1ms)`).join("\n") + "\n" + KHAC.map((c) => `✔ ${c} x (1ms)`).join("\n");
  if (cham("bo-loc", gia, 1).dung) { console.log("pha: ô tự đỏ không đỏ — thông điệp ở tiêu đề ca được tính"); process.exit(1); }
}
console.log(JSON.stringify({ viet_truoc: { lot: LOT.size, doi_chung: DC.size } }));

const O = [
  { o: "goc" },
  { o: "bo-loc", tep: "src/routes/listings.ts", a: " AND ${NGUON_HIEN}", b: "" },
  { o: "theo-so", tep: "src/contract/vocab.generated.ts", a: '["S02", "S08"]', b: '["S02", "S08", "S06"]' },
];
const env = { ...process.env };
delete env.DATABASE_URL;
delete env.TEST_DATABASE_URL_ADMIN;
let sai = 0;
for (const o of O) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb7-pha-"));
  try {
    for (const p of ["src", "test", "package.json", "tsconfig.json"]) cpSync(path.join(ROOT, "data-api", p), path.join(tam, p), { recursive: true });
    symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(tam, "node_modules"));
    if (o.tep) {
      const f = path.join(tam, o.tep);
      const s = readFileSync(f, "utf8");
      if (!s.includes(o.a)) { console.log(`pha: không dựng được bản chép (${o.tep} thiếu «${o.a}»)`); process.exit(2); }
      writeFileSync(f, s.replace(o.a, o.b));
    }
    const r = spawnSync("bash", [path.join(ROOT, "db", "db-thu.sh"), `oneinvest_suite_dapi_pb7${o.o.replace("-", "")}`, "--chay", "sh", "-c",
      `cd '${tam}' && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/tin-hien-thi.test.ts test/listing-reso.test.ts test/dong-ba-route.test.ts`],
      { cwd: ROOT, env: { ...env, PB2_GIT_ROOT: ROOT }, encoding: "utf8", maxBuffer: 64 << 20 });
    const ra = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
    const k = cham(o.o, ra, r.status);
    console.log(JSON.stringify({ o: o.o, rc: r.status, dat: k.dung, thieu: k.thieu.slice(0, 5), so_thieu: k.thieu.length, thua: k.thua?.slice(0, 5) }));
    for (const m of k.thieu) if (m.startsWith("PB7 điều kiện")) console.log(m);
    if (!k.dung) { sai++; console.log(ra.split("\n").filter((l) => /^\s*[✔✖] |ℹ (pass|fail)|Error/.test(l)).slice(0, 30).join("\n")); }
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}
if (sai) { console.log(`pha: ${sai} ô sai`); process.exit(1); }
console.log(`pha: đủ ${O.length} ô`);
