#!/usr/bin/env node
// pham-vi.mjs — phạm vi và tên nguồn thật của PB3 (AC-8 vế a, c; eval E8).
//  1. Mọi tệp nhánh đổi so với nền nằm trong ranh giới AC-8 (a); không package-lock.json, không Dockerfile.
//  2. data-api/package.json chỉ đổi scripts.dev.
//  3. data-api/test/dong-ba-route.test.ts (test HT19) chỉ thêm đúng một dòng `process.env.NODE_ENV = "test";`.
//  4. _acceptance/config.yaml chỉ THÊM khoá `dapi_khoa*`.
//  5. Toàn cây data-api/ (tệp git theo dõi) không có tên nguồn thật ngoài dạng định danh có `_` liền kề.
// Nền: merge-base với origin/main; khi nhánh đứng trên HT19 mà HT19 chưa vào origin/main thì nền là merge-base với nhánh HT19 (PB3 cắt
// sau HT19 theo lời giao gs; tệp của HT19 không phải phạm vi của PB3). Thước tự chứng chiều đỏ cùng lượt (năm ô cấy). Báo vi
// phạm tên nguồn bằng mã S0x, KHÔNG in tên.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const { sourceRegistrySeeds, findSourceNames } = await import(path.join(ROOT, "scripts", "lib", "tier-a-source-names.mjs"));
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const laToTien = (a, b) => {
  try {
    execFileSync("git", ["-C", ROOT, "merge-base", "--is-ancestor", a, b], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const SLUG = "data-api-dong-khi-thieu-khoa";
// Đỉnh nhánh HT19: lấy từ origin/fix/data-api-dong-ba-route-lo (nhánh có thể đã gộp main sau khi cắt PB3); ref vắng thì
// dùng đỉnh lúc cắt PB3 (0d48dfcb0).
const HT19_REF = "refs/remotes/origin/fix/data-api-dong-ba-route-lo";
const HT19_LUC_CAT = "0d48dfcb0";
const HT19_TEST = "data-api/test/dong-ba-route.test.ts";
const DUOC = [
  /^data-api\/src\/middleware\/auth\.ts$/,
  /^data-api\/src\/index\.ts$/,
  /^data-api\/package\.json$/, // riêng tệp này còn soát nội dung (soatPkg)
  /^data-api\/test\/auth-dong\.test\.ts$/,
  /^data-api\/test\/dong-ba-route\.test\.ts$/, // riêng tệp này còn soát từng dòng (soatHt19)
  /^data-api\/(README|CLAUDE)\.md$/,
  /^data-api\/\.env\.example$/,
  /^data-api\/docker-compose\.yml$/,
  new RegExp(`^_acceptance/${SLUG}/`),
  /^_acceptance\/config\.yaml$/, // riêng tệp này còn soát từng dòng (soatConfig)
  /^(PRODUCT-MAP\.md|LO-TRINH\.html)$/, // máy sinh, lệnh duyệt và ký của kit vẽ lại
];

/** Tệp ngoài ranh giới → dòng vi phạm. */
export function soatTep(tep) {
  return tep.filter((t) => !DUOC.some((re) => re.test(t))).map((t) => `AC-8 NGOÀI PHẠM VI: ${t}`);
}
/** package.json chỉ được đổi scripts.dev. */
export function soatPkg(cu, moi) {
  const bo = (s) => {
    const j = JSON.parse(s);
    if (j.scripts) delete j.scripts.dev;
    return j;
  };
  return isDeepStrictEqual(bo(cu), bo(moi)) ? [] : ["AC-8 NGOÀI PHẠM VI: data-api/package.json đổi ngoài scripts.dev"];
}
/** Diff -U0 của test HT19: đúng một dòng thêm đặt NODE_ENV = "test", không dòng xoá. */
export function soatHt19(diff) {
  const dong = diff.split("\n").filter((d) => /^[+-]/.test(d) && !/^(\+\+\+|---) /.test(d));
  const dat = dong.length === 1 && /^\+\s*process\.env\.NODE_ENV = "test";\s*$/.test(dong[0]);
  return diff.trim() === "" || dat ? [] : ["AC-8 test HT19 đổi ngoài một dòng NODE_ENV"];
}
/** Diff -U0 của config.yaml: chỉ được thêm dòng khoá `dapi_khoa*` (hoặc dòng trống, dòng chú thích nhắc slug). */
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (/^(\+\+\+|---|@@|diff |index )/.test(d) || d === "") continue;
    if (d.startsWith("-")) { loi.push("AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (!d.startsWith("+")) continue;
    const than = d.slice(1);
    if (than.trim() === "" || new RegExp(`^\\s*#.*${SLUG}`).test(than)) continue;
    const m = /^\s+([A-Za-z0-9_]+):\s/.exec(than);
    if (!m || !/^dapi_khoa[a-z0-9_]*$/.test(m[1])) loi.push(`AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}
/** Mã nguồn của mọi tên thật đứng trần trong văn bản (bỏ dạng định danh có `_` liền kề). */
export function tenTran(vanBan, ten) {
  const ma = new Set();
  for (const dong of vanBan.split("\n")) {
    for (const h of findSourceNames(dong, ten)) {
      if (dong[h.start - 1] === "_" || dong[h.end] === "_") continue;
      ma.add(h.code);
    }
  }
  return [...ma].sort();
}

let ten;
try {
  ten = sourceRegistrySeeds(ROOT).map((e) => ({ code: e.code, realName: e.realName }));
} catch (e) {
  console.log(`pham-vi: không rút được tên nguồn nào (${e.message})`);
  process.exit(2);
}
if (ten.length < 1) { console.log("pham-vi: không rút được tên nguồn nào"); process.exit(2); }

const mainBase = git("merge-base", "HEAD", "origin/main").trim();
let dinhHt19;
try {
  dinhHt19 = git("merge-base", "HEAD", HT19_REF).trim(); // phần HT19 mà PB3 đã chứa
} catch {
  dinhHt19 = git("rev-parse", HT19_LUC_CAT).trim();
}
const dungTrenHt19 = laToTien(HT19_LUC_CAT, "HEAD") && !laToTien(HT19_LUC_CAT, "origin/main");
const goc = dungTrenHt19 ? dinhHt19 : mainBase;
const tenNen = dungTrenHt19 ? `đỉnh HT19 ${goc.slice(0, 9)} (HT19 chưa vào origin/main)` : `merge-base ${goc.slice(0, 9)}`;

const tep = [...new Set(git("diff", "--name-only", goc).split("\n").filter(Boolean))].sort();
const pkgCu = git("show", `${goc}:data-api/package.json`);
const pkgMoi = readFileSync(path.join(ROOT, "data-api", "package.json"), "utf8");
const diffHt19 = git("diff", "-U0", goc, "--", HT19_TEST);
const diffConfig = git("diff", "-U0", goc, "--", "_acceptance/config.yaml");
const tepDataApi = git("ls-files", "data-api").split("\n").filter(Boolean);

const loi = [...soatTep(tep), ...soatPkg(pkgCu, pkgMoi), ...soatHt19(diffHt19), ...soatConfig(diffConfig)];
// Vế (c) sau lần sửa hợp đồng d-20261125T141207Z-12: tệp data-api/ nhánh đổi → soát TOÀN VĂN, đỏ; tệp data-api/ nhánh không đổi → chỗ có sẵn
// từ trước, in thành dòng «tồn đọng» (đếm theo mã, không tên), không đỏ — sửa chúng nằm ngoài ranh giới của PB3.
const tepDoi = new Set(tep);
const tonDong = new Map(); // mã → số tệp
let soTepTonDong = 0;
for (const t of tepDataApi) {
  let vanBan;
  try {
    vanBan = readFileSync(path.join(ROOT, t), "utf8");
  } catch {
    continue; // tệp đã xoá khỏi cây làm việc
  }
  const ma = tenTran(vanBan, ten);
  if (tepDoi.has(t)) {
    for (const m of ma) loi.push(`AC-8 tên nguồn thật: ${m} (${t})`);
  } else if (ma.length) {
    soTepTonDong += 1;
    for (const m of ma) tonDong.set(m, (tonDong.get(m) ?? 0) + 1);
  }
}
const dongTonDong = tonDong.size
  ? `tồn đọng: ${soTepTonDong} tệp data-api/ nhánh không đổi có tên nguồn thật từ trước (${[...tonDong].sort().map(([m, n]) => `${m}×${n}`).join(", ")}) — ngoài phạm vi PB3, đã báo gs`
  : "tồn đọng: 0 tệp";

// ── Chiều đỏ: cùng các hàm trên, đầu vào cấy ─────────────────────────────────────────────────────────────────────
const don = ten.find((e) => /^[A-Za-z0-9]{5,}$/.test(e.realName)) ?? ten[0];
const banChep = readFileSync(path.join(ROOT, "data-api", "src", "index.ts"), "utf8"); // bản chép tạm trong bộ nhớ
const o = {
  "pha-tep": soatTep([...tep, "data-api/Dockerfile"]).includes("AC-8 NGOÀI PHẠM VI: data-api/Dockerfile"),
  "pha-lock": soatTep([...tep, "data-api/package-lock.json"]).includes("AC-8 NGOÀI PHẠM VI: data-api/package-lock.json"),
  "pha-ht19": soatHt19(`${diffHt19}\n@@ -30,0 +31 @@\n+process.env.VERCEL = "1";`).includes("AC-8 test HT19 đổi ngoài một dòng NODE_ENV"),
  "pha-ten": tenTran(`${banChep}\nconst nguon = "${don.realName}";\n`, ten).includes(don.code), // bản chép tạm của một tệp nhánh đổi (src/index.ts)
  "pha-config": soatConfig(`+    khoa_la: "echo"\n+    dapi_khoa_x: "echo"`).join("|") === "AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la",
  "pha-pkg": soatPkg(pkgCu, pkgMoi.replace('"start": "node dist/index.js"', '"start": "node dist/index.js --x"')).length === 1,
  "dinh-danh": tenTran(`SELECT 1 FROM ${don.realName.toLowerCase()}_listings`, ten).length === 0,
};
for (const [ten_o, dat] of Object.entries(o)) {
  if (!dat) { console.log(`pham-vi: thước không đỏ ở ${ten_o}`); process.exit(1); }
}
console.log(`chieu-do: ${Object.keys(o).join(", ")} — mỗi ô cấy ra đúng thông điệp (pha-tep → «AC-8 NGOÀI PHẠM VI: data-api/Dockerfile», pha-lock → «AC-8 NGOÀI PHẠM VI: data-api/package-lock.json», pha-ht19 → «AC-8 test HT19 đổi ngoài một dòng NODE_ENV», pha-ten → «AC-8 tên nguồn thật: ${don.code}», pha-config → «AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la», pha-pkg → package.json đổi ngoài scripts.dev bị bắt, dinh-danh → không tính)`);

console.log(dongTonDong);
if (loi.length) {
  for (const l of loi) console.log(l);
  console.log(`pham-vi: ${loi.length} vi phạm (nền ${tenNen})`);
  process.exit(1);
}
const soTepDataApiDoi = tep.filter((t) => t.startsWith("data-api/")).length;
console.log(`pham-vi: nền ${tenNen}; ${tep.length} tệp đổi, đều trong ranh giới; package.json chỉ đổi scripts.dev; dong-ba-route.test.ts chỉ thêm 1 dòng NODE_ENV; soát ${ten.length} tên nguồn thật trên toàn văn ${soTepDataApiDoi} tệp data-api/ nhánh đổi (cây có ${tepDataApi.length} tệp), 0 khớp ngoài dạng định danh`);
