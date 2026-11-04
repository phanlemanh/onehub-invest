#!/usr/bin/env node
// check-invest-tier-a.mjs — hồ sơ chu-nguon-tren-cong: chuỗi trong MÃ của cổng Invest không mang tên nguồn thật (AGENTS.md luật 6).
// Lối vào là mọi tệp Next nạp theo quy ước dưới app/src/app, trừ `ops/`, `api/`; thước đi theo import. Mọi chuỗi đều tính là có thể
// hiện, trừ các dạng ở `dinhDanh`. Bản tĩnh chạy ở CI không cần máy chủ; phép đo trên HTML thật ở scripts/quet-ten-nguon-html.mjs.
// Báo bằng mã S0x + tệp:dòng, không in tên. Thoát: 0 sạch · 1 còn tên.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findSourceNames, sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ts = createRequire(path.join(ROOT, "app", "package.json"))("typescript");

const THU_MUC_APP = "app/src/app";
const NGOAI_CONG = new Set(["ops", "api"]);
const TEP_QUY_UOC = /^(page|layout|template|error|global-error|not-found|loading|default)\.tsx?$/;

/** Mọi tệp Next nạp theo quy ước của cổng Invest: không qua import nên closure không tự tới được. */
export function loiVao(root = ROOT) {
  const out = [];
  const di = (rel) => {
    for (const n of readdirSync(path.join(root, rel)).sort()) {
      const con = path.posix.join(rel, n);
      if (statSync(path.join(root, con)).isDirectory()) {
        if (rel !== THU_MUC_APP || !NGOAI_CONG.has(n)) di(con);
      } else if (TEP_QUY_UOC.test(n)) out.push(con);
    }
  };
  di(THU_MUC_APP);
  return out;
}

function resolveImport(root, from, spec) {
  const base = spec.startsWith("@/") ? path.join("app/src", spec.slice(2)) : spec.startsWith(".") ? path.join(path.dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [`${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts"), base]) {
    const abs = path.join(root, c);
    if (/\.tsx?$/.test(c) && existsSync(abs) && statSync(abs).isFile()) return c;
  }
  return null;
}

/** Mọi tệp mã mà các lối vào import, gồm export … from và import(); bỏ gói ngoài. */
export function closure(root, entries) {
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

// Câu SQL: tên bảng, tên cột của nguồn nằm trong câu đọc DB, không lên trang.
const LA_SQL = /\b(SELECT|INSERT INTO|DELETE FROM|UPDATE|WITH)\b[\s\S]*\b(FROM|JOIN|SET|VALUES|AS)\b/;

/** Dạng không hiện dù khớp tên: câu SQL, tên bảng hay cột `x_y`, tên trường liền khối, đường link trang gốc của `listing-labels.ts`. */
function dinhDanh(file, text, h) {
  if (LA_SQL.test(text)) return true;
  const truoc = text[h.start - 1];
  const sau = text[h.end];
  if (truoc === "_" || sau === "_") return true;
  if (/^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(text)) return true;
  // Ngoại lệ có tên, Mạnh chốt 04/11: link nút mở trang gốc.
  if (file.endsWith("components/listing/listing-labels.ts") && text.startsWith("https://www.") && text.includes(".com/rooms/")) return true;
  return false;
}

function chuoiCua(n) {
  if (ts.isJsxText(n) || ts.isStringLiteralLike(n)) return n.text;
  if (ts.isTemplateExpression(n)) return [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(" ");
  return null;
}

/** Mọi chuỗi của một tệp mang tên, trừ import, kiểu, tên khoá, phép so và dạng định danh. */
export function quetChuoi(file, src, seeds) {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits = [];
  const visit = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isTypeNode(n) || ts.isJSDoc?.(n)) return;
    const text = chuoiCua(n);
    const laTenKhoa = n.parent && ts.isPropertyAssignment(n.parent) && n.parent.name === n;
    const laPhepSo = n.parent && ts.isBinaryExpression(n.parent) && /Equals/.test(ts.SyntaxKind[n.parent.operatorToken.kind]);
    if (text && !laTenKhoa && !laPhepSo) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      for (const h of findSourceNames(text, seeds)) {
        if (!dinhDanh(file, text, h)) hits.push({ code: h.code, file, line });
      }
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
export function checkInvestTierA({ root = ROOT, entries = loiVao(root), seeds = sourceRegistrySeeds() } = {}) {
  const files = closure(root, entries);
  const hits = files.flatMap((f) => quetChuoi(f, readFileSync(path.join(root, f), "utf8"), seeds));
  const re = docS02(seeds);
  const s02 = files.filter((f) => !f.endsWith("lib/queries.ts") && !f.endsWith("lib/db.ts") && re.test(readFileSync(path.join(root, f), "utf8")));
  return { files, hits, s02 };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { files, hits, s02 } = checkInvestTierA();
  for (const f of s02) console.log(`FAIL đọc số S02 trong mã trang ${f}`);
  for (const h of hits) console.log(`FAIL tên nguồn thật (${h.code}) ở chuỗi ${h.file}:${h.line}`);
  console.log(`invest-tier-a: ${hits.length} chỗ trúng trong ${files.length} tệp`);
  process.exit(hits.length || s02.length ? 1 : 0);
}
