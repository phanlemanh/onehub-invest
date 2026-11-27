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
  const doCa = CA.filter((c) => new RegExp(`✖ ${c} `).test(ra));
  const xanhCa = CA.filter((c) => new RegExp(`✔ ${c} `).test(ra));
  const dung = o.thay ? doCa.length === CA.length && r.status !== 0 : xanhCa.length === CA.length && r.status === 0;
  console.log(JSON.stringify({ o: o.ten, rc: r.status, do: doCa, xanh: xanhCa, dung }));
  if (o.thay) {
    const tieuDe = new Set([...ra.matchAll(/[✔✖] (HT20-AC-\d[^(\n]*)\(/g)].map((m) => m[1].trim()));
    const ghim = [...new Set([...ra.matchAll(/(HT20-AC-\d [^\n'"|]{3,90})/g)].map((m) => m[1].trim()))].filter((g) => !tieuDe.has(g) && !/ms\)$/.test(g) && ![...tieuDe].some((t) => g.startsWith(t)));
    for (const c of doCa) console.log(`  ${c}: ${ghim.find((g) => g.startsWith(c + " ")) ?? "(đỏ do lỗi, không có thông điệp ghim)"}`);
  }
  if (!dung) sai++;
  rmSync(path.join(RUN, o.ten), { recursive: true, force: true });
}
console.log(`nhật ký: ${path.relative(ROOT, RUN)}/<ô>.log`);
console.log(sai ? `pha: ${sai} ô sai` : "pha: đủ 2 ô");
process.exit(sai ? 1 : 0);
