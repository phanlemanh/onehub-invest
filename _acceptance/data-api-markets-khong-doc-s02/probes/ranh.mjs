#!/usr/bin/env node
// HT20 E7 (AC-7) — ranh giới tệp, chữ cấm ở các dòng markets của README và /openapi.json, typecheck, lưới tên nguồn.
// Chạy: cd data-api && node --import tsx ../_acceptance/data-api-markets-khong-doc-s02/probes/ranh.mjs
// (dong-ba-route, auth-dong chạy xanh trong khoá dapi_mk cùng lượt — tệp này chỉ kiểm chúng còn nguyên trong cây.)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const loi = [];
const VUNG = [
  /^data-api\/src\/routes\/markets\.ts$/, /^data-api\/src\/app\.ts$/, /^data-api\/README\.md$/, /^data-api\/CLAUDE\.md$/,
  /^data-api\/test\/markets-khong-s02\.test\.ts$/, /^_acceptance\/config\.yaml$/, /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/,
  /^_acceptance\/data-api-markets-khong-doc-s02\//, /^docs\/superpowers\/plans\/2026-11-27-data-api-markets-khong-doc-s02\.md$/,
];
const base = execFileSync("git", ["-C", ROOT, "merge-base", "HEAD", "origin/main"], { encoding: "utf8" }).trim();
const doi = execFileSync("git", ["-C", ROOT, "diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);
for (const t of doi) if (!VUNG.some((r) => r.test(t))) loi.push(`HT20 NGOÀI VÙNG: ${t}`);
console.log(`HT20 ranh giới: ${doi.length} tệp đổi`);

const CAM = /\b(score|Market Score|ADR|occupancy|revenue|metrics)\b/i;
const readme = readFileSync(path.join(ROOT, "data-api/README.md"), "utf8").split("\n").filter((l) => l.includes("/v1/markets"));
for (const l of readme) {
  if (CAM.test(l)) loi.push(`HT20 README dòng markets còn chữ cấm: ${l.trim().slice(0, 90)}`);
  if (l.includes("/insights") && !/410|Removed/.test(l)) loi.push("HT20 README còn insights như đường sống");
}
process.env.DATABASE_URL ??= "postgres://127.0.0.1:1/ht20"; // pool lười, không nối
process.env.NODE_ENV = "test";
delete process.env.DATA_API_KEYS;
const { default: app } = await import(path.join(ROOT, "data-api/src/app.ts"));
const api = await (await app.request("/openapi.json")).json();
for (const [p, v] of Object.entries(api.paths ?? {})) {
  if (!p.startsWith("/v1/markets")) continue;
  if (p.includes("insights")) loi.push("HT20 openapi còn đường insights");
  if (CAM.test(JSON.stringify(v))) loi.push(`HT20 openapi ${p} còn chữ cấm`);
}
for (const t of ["data-api/test/dong-ba-route.test.ts", "data-api/test/auth-dong.test.ts"]) if (!existsSync(path.join(ROOT, t))) loi.push(`HT20 thiếu test cũ ${t}`);

const luoi = path.join(ROOT, "scripts/data-api-ten-nguon.mjs");
if (existsSync(luoi)) {
  const r = spawnSync("node", [luoi], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) loi.push(`HT20 lưới tên nguồn PB5 đỏ: ${r.stdout.trim().split("\n").pop()}`);
  else console.log("HT20 lưới tên nguồn PB5: sạch");
} else {
  console.log("HT20 lưới tên nguồn: bỏ qua — PB5 chưa gộp");
  const { findSourceNames, sourceRegistrySeeds } = await import(path.join(ROOT, "scripts/lib/tier-a-source-names.mjs"));
  const tep = doi.filter((t) => !/^(LO-TRINH\.html|PRODUCT-MAP\.md)$/.test(t));
  const them = tep.length ? execFileSync("git", ["-C", ROOT, "diff", "-U0", base, "HEAD", "--", ...tep], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n") : "";
  const moi = findSourceNames(them, sourceRegistrySeeds(ROOT)).filter((h) => them[h.end] !== "_").length;
  console.log(`HT20 tier-a-source-names trên dòng thêm: ${moi} cụm`);
  if (moi > 0) loi.push(`HT20 dòng thêm mang ${moi} cụm tên nguồn thật`);
}
const tc = spawnSync("npx", ["tsc", "-p", "tsconfig.json", "--noEmit"], { cwd: path.join(ROOT, "data-api"), encoding: "utf8" });
if (tc.status !== 0) loi.push(`HT20 typecheck data-api đỏ: ${(tc.stdout + tc.stderr).trim().split("\n")[0]}`);
if (loi.length) {
  for (const l of loi) console.error(l);
  process.exit(1);
}
console.log("HT20 ranh giới + tài liệu + typecheck: đạt");
