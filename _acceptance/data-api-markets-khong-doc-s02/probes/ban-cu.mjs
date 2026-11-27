#!/usr/bin/env node
// HT20 E6 (AC-6) — bản chép tạm data-api/ với markets.ts ở merge-base phải đỏ đủ năm ca HT20-AC-1…AC-5; bản không thay xanh.
// Chạy trên DB thử: bash db/db-thu.sh oneinvest_suite_dapi_mk --chay node _acceptance/data-api-markets-khong-doc-s02/probes/ban-cu.mjs
// Thoát 0 = cả hai ô đúng; 1 = có ô sai; 2 = không dựng được bản chép.
import { cpSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RUN = path.join(ROOT, ".acceptance-runs/data-api-markets-khong-doc-s02", `ban-cu-${process.pid}`);
const CA = ["HT20-AC-1", "HT20-AC-2", "HT20-AC-3", "HT20-AC-4", "HT20-AC-5"];
let base, cu;
try {
  base = execFileSync("git", ["-C", ROOT, "merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim();
  cu = execFileSync("git", ["-C", ROOT, "show", `${base}:data-api/src/routes/markets.ts`], { encoding: "utf8" });
} catch (e) {
  console.error(`ban-cu: không đọc được markets.ts ở merge-base: ${e.message}`);
  process.exit(2);
}
/** Chấm một ô từ nhật ký test. Bản cũ (thay): đủ năm ca đỏ, mỗi ca kèm thông điệp ghim «HT20-AC-n …» của nó (dòng
 *  assert, không phải tiêu đề ca) — ca đỏ vì văng lỗi, timeout, SQL hỏng ở before không có thông điệp ghim nên không được
 *  tính (finding S4 r1, AC-6). Bản gốc: đủ năm ca xanh. */
export function cham(ra, rc, thay) {
  const doCa = CA.filter((c) => new RegExp(`✖ ${c} `).test(ra));
  const xanhCa = CA.filter((c) => new RegExp(`✔ ${c} `).test(ra));
  const tieuDe = new Set([...ra.matchAll(/[✔✖] (HT20-AC-\d[^(\n]*)\(/g)].map((m) => m[1].trim()));
  const ghim = [...new Set([...ra.matchAll(/(HT20-AC-\d [^\n'"|]{3,90})/g)].map((m) => m[1].trim()))]
    .filter((g) => !tieuDe.has(g) && !/ms\)$/.test(g) && ![...tieuDe].some((t) => g.startsWith(t)));
  const thieuGhim = thay ? doCa.filter((c) => !ghim.some((g) => g.startsWith(c + " "))) : [];
  const dung = thay ? doCa.length === CA.length && thieuGhim.length === 0 && rc !== 0 : xanhCa.length === CA.length && rc === 0;
  return { doCa, xanhCa, thieuGhim, ghim, dung };
}

// Ô tự đỏ cùng lượt: nhật ký giả có đủ năm ca đỏ nhưng AC-3 đỏ vì văng lỗi (không thông điệp ghim) → ô phải sai.
{
  const gia = CA.map((c) => `✖ ${c} tiêu đề giả (1ms)`).join("\n") + "\n" +
    CA.filter((c) => c !== "HT20-AC-3").map((c) => `AssertionError: ${c} sai tập khoá: x`).join("\n") + "\nTypeError: boom\n";
  const k = cham(gia, 1, true);
  if (k.dung || k.thieuGhim.join() !== "HT20-AC-3") {
    console.error("ban-cu: ô tự đỏ không đỏ — ca thiếu thông điệp ghim lọt qua");
    process.exit(1);
  }
  console.log("ô tự đỏ: ca đỏ không thông điệp ghim → ô sai (đúng)");
}

let sai = 0;
mkdirSync(RUN, { recursive: true });
for (const [i, o] of [{ ten: "goc", thay: false }, { ten: "markets-cu", thay: true }].entries()) {
  const dir = path.join(RUN, o.ten, "data-api");
  cpSync(path.join(ROOT, "data-api"), dir, { recursive: true, filter: (s) => !s.includes(`${path.sep}node_modules`) });
  symlinkSync(path.join(ROOT, "data-api/node_modules"), path.join(dir, "node_modules"));
  if (o.thay) writeFileSync(path.join(dir, "src/routes/markets.ts"), cu);
  const r = spawnSync("node", ["--import", "tsx", "--test", "test/markets-khong-s02.test.ts"], {
    cwd: dir, encoding: "utf8", env: { ...process.env, HT20_HAT: String(60000 + i * 1000 + (process.pid % 1000)) }, maxBuffer: 64 * 1024 * 1024,
  });
  const ra = `${r.stdout}\n${r.stderr}`;
  writeFileSync(path.join(RUN, `${o.ten}.log`), ra);
  const { doCa, xanhCa, thieuGhim, ghim, dung } = cham(ra, r.status, o.thay);
  console.log(JSON.stringify({ o: o.ten, rc: r.status, do: doCa, xanh: xanhCa, thieuGhim, dung }));
  if (o.thay) for (const c of doCa) console.log(`  ${c}: ${ghim.find((g) => g.startsWith(c + " ")) ?? "(KHÔNG có thông điệp ghim — ô sai)"}`);
  if (!dung) sai++;
  rmSync(path.join(RUN, o.ten), { recursive: true, force: true });
}
console.log(`nhật ký: ${path.relative(ROOT, RUN)}/<ô>.log`);
console.log(sai ? `pha: ${sai} ô sai` : "pha: đủ 2 ô");
process.exit(sai ? 1 : 0);
