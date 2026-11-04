#!/usr/bin/env node
// check-invest-tier-a.mjs — hồ sơ chu-nguon-tren-cong: chữ hiển thị trong MÃ của các trang cổng Invest (đi theo mọi tệp mà
// trang import, cả layout) không mang tên nguồn thật (AGENTS.md luật 6). Bản tĩnh chạy ở CI không cần máy chủ; phép đo trên HTML thật ở
// scripts/quet-ten-nguon-html.mjs. Báo bằng mã S0x + tệp:dòng, không in tên. Thoát: 0 sạch · 1 còn tên.
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanSource } from "./lib/ops-visible-strings.mjs";
import { findSourceNames, sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ts = createRequire(path.join(ROOT, "app", "package.json"))("typescript");

export const ENTRY = [
  "app/src/app/layout.tsx",
  "app/src/app/(marketing)/layout.tsx",
  "app/src/app/(marketing)/page.tsx",
  "app/src/app/(marketing)/methodology/page.tsx",
  "app/src/app/(app)/layout.tsx",
  "app/src/app/(app)/[country]/[market]/page.tsx",
  "app/src/app/(app)/[country]/[market]/listings/sale/page.tsx",
  "app/src/app/(app)/[country]/[market]/listings/rent/page.tsx",
  "app/src/app/(app)/[country]/page.tsx",
  "app/src/app/(app)/[country]/[market]/map/page.tsx",
  "app/src/app/(app)/[country]/[market]/[submarket]/page.tsx",
  "app/src/app/(app)/yield/page.tsx",
  "app/src/app/(app)/compare/page.tsx",
  "app/src/app/(app)/listing/[id]/page.tsx",
  "app/src/app/(auth)/register/page.tsx",
];

function resolveImport(root, from, spec) {
  const base = spec.startsWith("@/") ? path.join("app/src", spec.slice(2)) : spec.startsWith(".") ? path.join(path.dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [`${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts"), base]) {
    const abs = path.join(root, c);
    if (/\.tsx?$/.test(c) && existsSync(abs) && statSync(abs).isFile()) return c;
  }
  return null;
}

/** Mọi tệp mã mà các trang import, gồm export … from và import(); bỏ gói ngoài. */
export function closure(root, entries = ENTRY) {
  const seen = new Set();
  const stack = [...entries];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const src = readFileSync(path.join(root, f), "utf8");
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, false, f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (n) => {
      const spec =
        (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && !n.importClause?.isTypeOnly
          ? n.moduleSpecifier.text
          : ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])
            ? n.arguments[0].text
            : null;
      const to = spec && resolveImport(root, f, spec);
      if (to && !seen.has(to)) stack.push(to);
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return [...seen].sort();
}

/** Biến chuỗi của tệp .tsx: bộ quét của Ops coi khai báo là không hiện, nhưng ở đây biến ấy thường được đem vẽ (`const source = …`). */
function bienChuoi(file, src, seeds) {
  if (!file.endsWith(".tsx")) return [];
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isStringLiteralLike(n.initializer)) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      for (const h of findSourceNames(n.initializer.text, seeds)) hits.push({ code: h.code, file, line });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hits;
}

// Đọc số S02 trên trang (luật 5). `lib/queries.ts` khai các hàm chỉ Ops dùng nên không tính; trang gọi hàm thì tệp trang trúng.
const docS02 = (seeds) => {
  const ten = seeds.find((s) => s.code === "S02").realName.replace(/\W/g, "");
  return new RegExp(`\\bget${ten}\\w*|\\bgetCalibration\\w*|\\b${ten}_\\w+`, "i");
};

/** { files, hits, s02 }: hits, s02 phải rỗng. */
export function checkInvestTierA({ root = ROOT, entries = ENTRY, seeds = sourceRegistrySeeds() } = {}) {
  const files = closure(root, entries);
  const hits = files.flatMap((f) => {
    const src = readFileSync(path.join(root, f), "utf8");
    return [...scanSource(f, src, seeds), ...bienChuoi(f, src, seeds)];
  });
  const re = docS02(seeds);
  const s02 = files.filter((f) => !f.endsWith("lib/queries.ts") && !f.endsWith("lib/db.ts") && re.test(readFileSync(path.join(root, f), "utf8")));
  return { files, hits, s02 };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { files, hits, s02 } = checkInvestTierA();
  for (const f of s02) console.log(`FAIL đọc số S02 trong mã trang ${f}`);
  for (const h of hits) console.log(`FAIL tên nguồn thật (${h.code}) ở chữ hiển thị ${h.file}:${h.line}`);
  console.log(`invest-tier-a: ${hits.length} chỗ trúng trong ${files.length} tệp`);
  process.exit(hits.length || s02.length ? 1 : 0);
}
