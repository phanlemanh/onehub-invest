#!/usr/bin/env node
// pha.mjs — chiều đỏ của HT19 (AC-6, eval E6). Dựng data-api/ ở thư mục tạm từ CẶP commit cố định của HT19 (PB11, GS phán 28/11):
// cây ở commit gộp HT19 (test và route lúc ký), lần lượt đặt lại bản route ở mốc trước HT19 rồi chạy CÙNG tệp test: mỗi bản cũ phải đỏ ở đường của mình ở cả hai lớp (JSON và SQL), ca của các đường khác
// phải xanh; bản chép không thay phải xanh. Mỗi ô chạy trên một DB thử riêng (db/db-thu.sh --chay), xoá khi xong.
// In mỗi ô một dòng JSON rồi «pha: đủ 4 ô» (thoát 0) hoặc «pha: N ô sai» (thoát 1); không dựng được bản cũ → thoát 2.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const CA = ["DRL-AC-1", "DRL-AC-2", "DRL-AC-3", "DRL-AC-4", "DRL-AC-5"];
const O = [
  { o: "goc", db: "goc" },
  { o: "deals-cu", db: "deals", tep: "deals.ts", ca: ["DRL-AC-1", "DRL-AC-2"], json: /DRL deals lộ (khoá cấm|chuỗi canh)/, sql: "DRL deals đọc stg_zalo_posts" },
  { o: "coverage-cu", db: "cov", tep: "coverage.ts", ca: ["DRL-AC-3"], json: /DRL coverage lộ (khoá cấm|chuỗi canh)/, sql: "DRL coverage đọc bảng S02" },
  { o: "listings-cu", db: "list", tep: "listings.ts", ca: ["DRL-AC-4"], json: /DRL listings\/:id lộ (khoá cấm|chuỗi canh|ảnh S02)/, sql: "DRL listings/:id đọc bảng S02" },
];

// PB11: trước đây «bản cũ» lấy merge-base với origin/main và đặt vào cây HÔM NAY. Sau HT19, PB2 gộp /v1/deals vào /v1/listings
// và đổi hình phần tử, nên route cũ trong cây hôm nay không còn được test đi qua — đo trên cặp commit của chính HT19.
// PB11_MOC_THU chỉ để ô đột biến của PB11 đổi mốc; mốc nào đã chứa lần gộp HT19 → thoát 2 «mốc so hỏng».
const MOC = process.env.PB11_MOC_THU ?? "0d4d8116360d51ac7e0619f8ff495233f09fe312";
const GOP_HANG = "b013b442827909b2e6a940c484be7a5a7950886a";
try {
  execFileSync("git", ["-C", ROOT, "merge-base", "--is-ancestor", GOP_HANG, MOC], { stdio: "ignore" });
  console.log(`pha: mốc so hỏng: ${MOC.slice(0, 9)} đã chứa lần gộp ${GOP_HANG.slice(0, 9)} của hàng`);
  process.exit(2);
} catch { /* không chứa — đúng */ }
const goc = MOC;

const env = { ...process.env };
delete env.DATABASE_URL; // để db-thu.sh dựng DB riêng cho từng ô từ bản mẫu
delete env.TEST_DATABASE_URL_ADMIN;

let sai = 0;
for (const o of O) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "drl-pha-"));
  try {
    // Cây data-api ở commit gộp HT19 (git archive — không ghi vào cây nguồn).
    const tar = spawnSync("sh", ["-c", `git -C '${ROOT}' archive ${GOP_HANG} data-api/src data-api/test data-api/package.json data-api/tsconfig.json | tar -x -C '${tam}' --strip-components=1`], { encoding: "utf8" });
    if (tar.status !== 0) { console.log(`pha: không dựng được cây ở ${GOP_HANG.slice(0, 9)}: ${tar.stderr}`); process.exit(2); }
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
      // Lớp JSON ghim đúng hai loại thông điệp của phép quét khoá cấm và chuỗi canh (riêng listings/:id thêm «lộ ảnh S02»),
      // không ghim tiền tố chung — thông điệp «thiếu dòng» hay «bỏ thị trường» không được tính là lớp JSON đỏ (S4 r1, t3).
      dong.lop_json = o.json.test(ra);
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
