#!/usr/bin/env node
// pha.mjs — chiều đỏ của HT19 (AC-6, eval E6). Chép data-api/ sang thư mục tạm, lần lượt đặt lại bản trên main (merge-base) của
// từng route rồi chạy CÙNG tệp test: mỗi bản cũ phải đỏ ở đường của mình ở cả hai lớp (JSON và SQL), ca của các đường khác
// phải xanh; bản chép không thay phải xanh. Mỗi ô chạy trên một DB thử riêng (db/db-thu.sh --chay), xoá khi xong.
// In mỗi ô một dòng JSON rồi «pha: đủ 4 ô» (thoát 0) hoặc «pha: N ô sai» (thoát 1); không dựng được bản cũ → thoát 2.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const CA = ["DRL-AC-1", "DRL-AC-2", "DRL-AC-3", "DRL-AC-4", "DRL-AC-5"];
const O = [
  { o: "goc", db: "goc" },
  { o: "deals-cu", db: "deals", tep: "deals.ts", ca: ["DRL-AC-1", "DRL-AC-2"], json: "DRL deals lộ", sql: "DRL deals đọc stg_zalo_posts" },
  { o: "coverage-cu", db: "cov", tep: "coverage.ts", ca: ["DRL-AC-3"], json: "DRL coverage lộ", sql: "DRL coverage đọc bảng S02" },
  { o: "listings-cu", db: "list", tep: "listings.ts", ca: ["DRL-AC-4"], json: "DRL listings/:id lộ", sql: "DRL listings/:id đọc bảng S02" },
];

let goc;
try {
  goc = git("merge-base", "HEAD", "origin/main").trim();
} catch {
  console.log("pha: không dựng được bản cũ (không tìm được merge-base với origin/main)");
  process.exit(2);
}

const env = { ...process.env };
delete env.DATABASE_URL; // để db-thu.sh dựng DB riêng cho từng ô từ bản mẫu
delete env.TEST_DATABASE_URL_ADMIN;

let sai = 0;
for (const o of O) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "drl-pha-"));
  try {
    for (const p of ["src", "test", "package.json", "tsconfig.json"]) {
      cpSync(path.join(ROOT, "data-api", p), path.join(tam, p), { recursive: true });
    }
    symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(tam, "node_modules"));
    if (o.tep) {
      let cu;
      try {
        cu = git("show", `${goc}:data-api/src/routes/${o.tep}`);
      } catch {
        console.log(`pha: không dựng được bản cũ (${o.tep} không có ở ${goc.slice(0, 9)})`);
        process.exit(2);
      }
      writeFileSync(path.join(tam, "src", "routes", o.tep), cu);
    }
    const r = spawnSync(
      "bash",
      [
        path.join(ROOT, "db", "db-thu.sh"), `oneinvest_suite_dapi_${o.db}`, "--chay", "sh", "-c",
        `cd '${tam}' && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/dong-ba-route.test.ts`,
      ],
      { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 << 20 },
    );
    const ra = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
    const xanh = CA.filter((c) => new RegExp(`^\\s*✔ ${c} `, "m").test(ra));
    const fail = Number(/^ℹ fail (\d+)/m.exec(ra)?.[1] ?? -1);
    let dat;
    const dong = { o: o.o, rc: r.status, fail, xanh };
    if (!o.tep) {
      dat = r.status === 0 && fail === 0 && xanh.length === CA.length;
    } else {
      dong.lop_json = ra.includes(o.json);
      dong.lop_sql = ra.includes(o.sql);
      const khac = CA.filter((c) => !o.ca.includes(c));
      dong.duong_khac_xanh = khac.every((c) => xanh.includes(c));
      dong.duong_minh_do = o.ca.every((c) => !xanh.includes(c));
      dat = r.status !== 0 && dong.lop_json && dong.lop_sql && dong.duong_khac_xanh && dong.duong_minh_do;
    }
    dong.dat = dat;
    console.log(JSON.stringify(dong));
    if (!dat) {
      sai++;
      console.log(ra.split("\n").filter((l) => /^\s*[✔✖] |DRL |ℹ (tests|pass|fail)|db-thu|Error/.test(l)).slice(0, 30).join("\n"));
    }
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}
if (sai) {
  console.log(`pha: ${sai} ô sai`);
  process.exit(1);
}
console.log(`pha: đủ ${O.length} ô`);
