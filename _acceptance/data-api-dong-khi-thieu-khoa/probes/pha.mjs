#!/usr/bin/env node
// pha.mjs — chiều đỏ của PB3 (AC-7, eval E7). Chép data-api/ sang thư mục tạm, đặt lại src/middleware/auth.ts và src/index.ts
// bằng bản ở merge-base với origin/main (bản «không khoá là mở»), rồi chạy CÙNG lệnh test của E1 trên bản sao:
//   - đầu ra phải có ít nhất một tên ca «PB3-AC-» (tệp test nạp được trên bản cũ);
//   - test phải thoát khác 0, và tập ca đỏ gồm ít nhất PB3-AC-1, PB3-AC-4, PB3-AC-5.
// Rồi chạy cùng lệnh trên cây thật → phải thoát 0. Mỗi lượt một DB thử riêng (db/db-thu.sh --chay). Thư mục tạm xoá cuối lượt.
// Thoát 0 khi đủ; 1 khi thước không đỏ hay cây thật đỏ; 2 khi không dựng được bản cũ.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const CA_GHIM = ["PB3-AC-1", "PB3-AC-4", "PB3-AC-5"];
const TEP_CU = ["src/middleware/auth.ts", "src/index.ts"];
const LENH_TEST = "node --import tsx --test --test-reporter=spec --test-concurrency=1 test/auth-dong.test.ts";

// PB11 (GS phán 28/11): mốc so CỐ ĐỊNH — cha của lần gộp PB3 trên main (c16ebe9df). Trước đây lấy merge-base với
// origin/main; sau khi hàng gộp, merge-base của mọi nhánh mới đã chứa hàng nên «bản cũ» = bản mới. PB11_MOC_THU chỉ để ô đột
// biến của PB11 đổi mốc; mốc nào đã chứa lần gộp của hàng → thoát 2 «mốc so hỏng».
const MOC = process.env.PB11_MOC_THU ?? "816796cf304c9fcdd5511991d7010963a6c1e1eb";
const GOP_HANG = "c16ebe9df8da4bda019e4fa062dab6614667d9d1";
try {
  execFileSync("git", ["-C", ROOT, "merge-base", "--is-ancestor", GOP_HANG, MOC], { stdio: "ignore" });
  console.log(`pha: mốc so hỏng: ${MOC.slice(0, 9)} đã chứa lần gộp ${GOP_HANG.slice(0, 9)} của hàng`);
  process.exit(2);
} catch { /* không chứa — đúng */ }
let goc;
try {
  goc = MOC;
} catch {
  console.log("pha: không dựng được bản cũ (không tìm được merge-base với origin/main)");
  process.exit(2);
}

const env = { ...process.env };
delete env.DATABASE_URL; // để db-thu.sh dựng DB riêng cho từng lượt
delete env.TEST_DATABASE_URL_ADMIN;

function chay(thuMuc, db) {
  const r = spawnSync(
    "bash",
    [path.join(ROOT, "db", "db-thu.sh"), db, "--chay", "sh", "-c", `cd '${thuMuc}' && ${LENH_TEST}`],
    { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 << 20 },
  );
  return { rc: r.status, ra: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}
const tomTat = (ra) => ra.split("\n").filter((l) => /^\s*[✔✖] |^ℹ (tests|pass|fail)|db-thu|Error/.test(l)).slice(0, 30).join("\n");

// ── Bản cũ ───────────────────────────────────────────────────────────────────────────────────────────────────────
const tam = mkdtempSync(path.join(os.tmpdir(), "pb3-pha-"));
let cu;
try {
  for (const p of ["src", "test", "package.json", "tsconfig.json"]) {
    cpSync(path.join(ROOT, "data-api", p), path.join(tam, p), { recursive: true });
  }
  symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(tam, "node_modules"));
  for (const t of TEP_CU) {
    let noiDung;
    try {
      noiDung = git("show", `${goc}:data-api/${t}`);
    } catch {
      console.log(`pha: không dựng được bản cũ (data-api/${t} không có ở ${goc.slice(0, 9)})`);
      process.exit(2);
    }
    writeFileSync(path.join(tam, t), noiDung);
  }
  cu = chay(tam, "oneinvest_suite_dapi_pha");
} finally {
  rmSync(tam, { recursive: true, force: true });
}

if (!/PB3-AC-/.test(cu.ra)) {
  console.log("pha: bản sao không nạp được tệp test");
  console.log(tomTat(cu.ra));
  process.exit(1);
}
const do_ = [...new Set([...cu.ra.matchAll(/^\s*✖ (PB3-AC-\d+b?) /gm)].map((m) => m[1]))].sort();
const thieu = CA_GHIM.filter((c) => !do_.includes(c));
if (cu.rc === 0 || thieu.length) {
  console.log(`pha: thước không đỏ ở ${cu.rc === 0 ? "toàn bộ (bản cũ thoát 0)" : thieu.join(", ")}`);
  console.log(tomTat(cu.ra));
  process.exit(1);
}
console.log(`pha: bản cũ (auth.ts, index.ts ở ${goc.slice(0, 9)}) đỏ ở ${do_.join(", ")}`);

// ── Cây thật ─────────────────────────────────────────────────────────────────────────────────────────────────────
const that = chay(path.join(ROOT, "data-api"), "oneinvest_suite_dapi_pha_that");
if (that.rc !== 0) {
  console.log(`pha: cây thật đỏ (thoát ${that.rc})`);
  console.log(tomTat(that.ra));
  process.exit(1);
}
console.log("pha: cây thật xanh");
