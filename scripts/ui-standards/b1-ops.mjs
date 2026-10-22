#!/usr/bin/env node
// Harness nghiệm thu đợt B1 dọn cổng Ops (_acceptance/ui-clean-b1-ops). Mỗi lệnh một kiểu kiểm;
// thoát 0 đạt, 1 hỏng (in "<lệnh>: <lý do> @ <file>:<dòng>"), 2 dùng sai.
// Dùng: node scripts/ui-standards/b1-ops.mjs <lệnh> [--root <thư mục gốc repo>]
// Đọc mã bằng AST của TypeScript (mượn app/node_modules/typescript — gốc repo không có node_modules).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(HERE, "..", "..");
const args = process.argv.slice(2);
const cmd = args[0];
const rootIdx = args.indexOf("--root");
const ROOT = rootIdx >= 0 ? args[rootIdx + 1] : DEFAULT_ROOT;
const ts = createRequire(join(DEFAULT_ROOT, "app", "package.json"))("typescript");

const SRC = () => join(ROOT, "app", "src");
const rel = (p) => relative(ROOT, p).split(sep).join("/");
const read = (p) => readFileSync(p, "utf8");
const json = (p) => JSON.parse(read(p));
const BLOCK_MAP = () => json(join(ROOT, "scripts/ui-standards/b1-block-map.json"));

/** Phạm vi file của đợt (đường tương đối app/src). ops/deals thuộc B5. */
function inScope(srcRel) {
  if (srcRel.startsWith("app/ops/deals/")) return false;
  return srcRel.startsWith("app/ops/") || srcRel.startsWith("components/ops/") || srcRel.startsWith("components/shell/ops-shell/");
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const scopeFiles = () =>
  walk(SRC()).filter((p) => /\.(tsx?|mjs)$/.test(p) && inScope(relative(SRC(), p).split(sep).join("/")));

const fails = [];
const fail = (check, msg, file, node, sf) => {
  const line = node && sf ? sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 : 0;
  fails.push(`${check}: ${msg}${file ? ` @ ${rel(file)}${line ? `:${line}` : ""}` : ""}`);
};
const ok = (msg) => console.log(`  OK  ${msg}`);

function parse(file) {
  return ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}
function visit(node, fn) {
  fn(node);
  ts.forEachChild(node, (c) => visit(c, fn));
}
const tagName = (n) => (n.tagName ? n.tagName.getText() : null);
function jsxOpenings(sf) {
  const out = [];
  visit(sf, (n) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) out.push(n);
  });
  return out;
}
function attr(opening, name) {
  return opening.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText() === name);
}
function attrString(a) {
  if (!a || !a.initializer) return null;
  if (ts.isStringLiteral(a.initializer)) return a.initializer.text;
  if (ts.isJsxExpression(a.initializer) && a.initializer.expression) {
    const e = a.initializer.expression;
    if (ts.isStringLiteralLike(e)) return e.text;
    return e.getText();
  }
  return null;
}
function imports(sf) {
  return sf.statements.filter(ts.isImportDeclaration).map((d) => ({
    from: d.moduleSpecifier.text,
    names: [
      ...(d.importClause?.name ? [d.importClause.name.text] : []),
      ...(d.importClause?.namedBindings && ts.isNamedImports(d.importClause.namedBindings)
        ? d.importClause.namedBindings.elements.map((e) => e.name.text)
        : []),
    ],
    node: d,
  }));
}

// ------------------------------------------------------------------ E1 suppressions
function suppressions() {
  const s = json(join(ROOT, "app", "eslint-suppressions.json"));
  const bad = Object.keys(s).filter((k) => k.startsWith("src/") && inScope(k.slice(4)));
  for (const k of bad) fail("suppressions", `còn mục baseline trong phạm vi B1 (${Object.keys(s[k]).join(", ")})`, join(ROOT, "app", k));
  for (const f of scopeFiles()) {
    read(f).split("\n").forEach((l, i) => {
      if (/eslint-disable/.test(l) && /onehub-ui\//.test(l)) fails.push(`suppressions: eslint-disable cho onehub-ui trong phạm vi @ ${rel(f)}:${i + 1}`);
    });
  }
  if (!fails.length) ok(`0 mục baseline + 0 eslint-disable onehub-ui trong ${scopeFiles().length} tệp phạm vi`);
}

// ------------------------------------------------------------------ E3 handdrawn
const ICON_CHARS = /[✓✗❌✅⏸↻✕]/;
function handdrawn() {
  for (const f of scopeFiles()) {
    const sf = parse(f);
    for (const o of jsxOpenings(sf)) {
      const t = tagName(o);
      if (!/^(div|span|li|section|p|ul)$/.test(t)) continue;
      const cls = attrString(attr(o, "className")) ?? "";
      const toks = cls.split(/[\s"'`]+/);
      const hasRounded = toks.some((x) => /^rounded(-|$)/.test(x));
      const hasBorder = toks.some((x) => x === "border" || /^border-(\d|solid|dashed)/.test(x));
      if (hasRounded && hasBorder) fail("handdrawn", `<${t}> tự kẻ khung (rounded + border)`, f, o, sf);
    }
    visit(sf, (n) => {
      if (ts.isJsxText(n) || ts.isStringLiteralLike(n)) {
        const txt = n.text ?? n.getText();
        if (ICON_CHARS.test(txt) || txt.trim() === "×") fail("handdrawn", `ký tự làm icon "${txt.trim().slice(0, 20)}"`, f, n, sf);
      }
    });
  }
  if (!fails.length) ok("không khung tự kẻ, không ký tự làm icon");
}

// ------------------------------------------------------------------ E4 frame
const PAGES = ["app/ops/page.tsx", "app/ops/collections/page.tsx", "app/ops/quality/page.tsx", "app/ops/review/page.tsx", "app/ops/sources/page.tsx", "app/ops/design/page.tsx"];
function returnedJsx(fn) {
  let found = null;
  const body = fn.body;
  if (!body) return null;
  for (const st of body.statements ?? []) {
    if (ts.isReturnStatement(st) && st.expression) {
      let e = st.expression;
      while (ts.isParenthesizedExpression(e)) e = e.expression;
      if (ts.isJsxElement(e) || ts.isJsxFragment(e) || ts.isJsxSelfClosingElement(e)) found = e;
    }
  }
  return found;
}
function frame() {
  for (const p of PAGES) {
    const f = join(SRC(), p);
    if (!existsSync(f)) { fail("frame", `thiếu ${p}`); continue; }
    const sf = parse(f);
    if (!imports(sf).some((i) => i.from === "@/components/page/page-header" && i.names.includes("PageHeader")))
      fail("frame", `${p} không import PageHeader từ @/components/page/page-header`, f);
    for (const o of jsxOpenings(sf)) if (tagName(o) === "h1") fail("frame", `${p} tự viết <h1>`, f, o, sf);
    const fn = sf.statements.find((s) => ts.isFunctionDeclaration(s) && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword));
    const root = fn && returnedJsx(fn);
    if (!root) { fail("frame", `${p}: không đọc được JSX trả về của default export`, f); continue; }
    const kids = (root.children ?? []).filter((c) => !(ts.isJsxText(c) && !c.text.trim()));
    const first = kids[0];
    const firstTag = first && (ts.isJsxSelfClosingElement(first) ? tagName(first) : ts.isJsxElement(first) ? tagName(first.openingElement) : null);
    if (firstTag !== "PageHeader") fail("frame", `${p}: con đầu tiên của gốc là ${firstTag ?? "(không phải phần tử)"}, cần PageHeader`, f, first ?? root, sf);
    if (first && ts.isJsxElement(first) && tagName(first.openingElement) === "PageHeader")
      fail("frame", `${p}: PageHeader có phần tử lồng bên trong`, f, first, sf);
  }
  if (!fails.length) ok(`${PAGES.length} trang: PageHeader đứng đầu, không tự viết h1`);
}

// ------------------------------------------------------------------ E5 one-way
function oneWay() {
  const map = BLOCK_MAP();
  const comps = join(SRC(), "components");
  for (const pg of map.pages) {
    const f = join(SRC(), pg.page);
    if (!existsSync(f)) { fail("one-way", `thiếu ${pg.page}`); continue; }
    const imps = imports(parse(f));
    if (pg.blocks.length) {
      const prefix = `@/components/${pg.adaptedDir}/`;
      if (!imps.some((i) => i.from.startsWith(prefix))) fail("one-way", `${pg.route} không import tệp chuyển thể nào ở ${prefix}`, f);
      const dirFiles = walk(join(comps, pg.adaptedDir));
      for (const b of pg.blocks) {
        if (!dirFiles.some((df) => read(df).includes(`chuyển thể từ @reui/${b}`)))
          fail("one-way", `${pg.route}: thư mục ${pg.adaptedDir} thiếu dòng "chuyển thể từ @reui/${b}"`, join(comps, pg.adaptedDir));
      }
      for (const df of dirFiles) for (const id of pg.droppedIdentifiers) {
        if (new RegExp(`\\b${id}\\b`).test(read(df))) fail("one-way", `${pg.route}: còn định danh mẫu đã bỏ "${id}"`, df);
      }
    } else if (imps.some((i) => /@\/components\/(blocks\/|ops\/(overview|collections|sources|review)\/)/.test(i.from))) {
      fail("one-way", `${pg.route} không có block Solutions nhưng import tệp block`, f);
    }
  }
  const sh = map.shell;
  const shFiles = walk(join(comps, sh.adaptedDir));
  if (!shFiles.some((x) => read(x).includes(`chuyển thể từ @reui/${sh.block}`))) fail("one-way", `shell thiếu dòng "chuyển thể từ @reui/${sh.block}"`, join(comps, sh.adaptedDir));
  for (const df of shFiles) for (const id of sh.droppedIdentifiers) if (new RegExp(`\\b${id}\\b`).test(read(df))) fail("one-way", `shell còn định danh mẫu đã bỏ "${id}"`, df);
  const adaptedDirs = [sh.adaptedDir, ...map.pages.filter((p) => p.blocks.length).map((p) => p.adaptedDir)];
  for (const f of scopeFiles()) {
    const sf = parse(f);
    const srcRel = relative(SRC(), f).split(sep).join("/");
    for (const i of imports(sf)) {
      if (i.from === "@/components/ui/table") fail("one-way", "import @/components/ui/table", f, i.node, sf);
      if (i.from.startsWith("@/components/blocks/")) fail("one-way", "import thẳng từ components/blocks (bản gốc chỉ để tham chiếu)", f, i.node, sf);
    }
    for (const o of jsxOpenings(sf)) if (tagName(o) === "table") fail("one-way", "JSX <table>", f, o, sf);
    const isAdapted = adaptedDirs.some((d) => srcRel.startsWith(`components/${d}/`));
    if (!isAdapted) visit(sf, (n) => {
      if (ts.isCallExpression(n) && n.expression.getText() === "useTable") fail("one-way", "useTable tự dựng ngoài bản chuyển thể block / InsightGrid", f, n, sf);
    });
  }
  if (!fails.length) ok("mỗi trang dựng từ đúng block đã chọn; không bảng tự dựng");
}

// ------------------------------------------------------------------ E6 dialogs
const NOTICE_ALLOW = new Set(["groupsError"]); // lỗi tải nhóm Zalo: hiện inline trong Alert kèm Thử lại (AC-6)
function enclosingFn(n) {
  let p = n.parent;
  while (p && !ts.isFunctionLike(p)) p = p.parent;
  return p;
}
function fnName(fn) {
  if (!fn) return null;
  if (fn.name) return fn.name.getText();
  if (ts.isVariableDeclaration(fn.parent)) return fn.parent.name.getText();
  return null;
}
function fetchMethod(call) {
  const opt = call.arguments[1];
  if (opt && ts.isObjectLiteralExpression(opt)) {
    const m = opt.properties.find((p) => p.name?.getText() === "method");
    if (m && ts.isPropertyAssignment(m) && ts.isStringLiteralLike(m.initializer)) return m.initializer.text.toUpperCase();
  }
  return "GET";
}
function dialogs() {
  const files = scopeFiles();
  let alertDialogInSources = false;
  for (const f of files) {
    const sf = parse(f);
    const srcRel = relative(SRC(), f).split(sep).join("/");
    if (srcRel.startsWith("components/ops/sources/") && imports(sf).some((i) => i.from === "@/components/ui/alert-dialog" && i.names.includes("AlertDialog"))) alertDialogInSources = true;
    // (a) không hộp thoại gốc
    visit(sf, (n) => {
      if (!ts.isCallExpression(n)) return;
      const c = n.expression.getText();
      if (/^(window\.)?(confirm|alert|prompt)$/.test(c)) fail("dialogs", `gọi ${c}()`, f, n, sf);
    });
    // (b) state chuỗi được set bằng chuỗi + render làm chữ JSX
    const setters = new Map(); // setter -> state
    visit(sf, (n) => {
      if (ts.isVariableDeclaration(n) && ts.isArrayBindingPattern(n.name) && n.initializer && ts.isCallExpression(n.initializer) && /useState$/.test(n.initializer.expression.getText())) {
        const [st, se] = n.name.elements;
        if (st && se && ts.isBindingElement(st) && ts.isBindingElement(se)) setters.set(se.name.getText(), st.name.getText());
      }
    });
    const messageStates = new Set();
    visit(sf, (n) => {
      if (ts.isCallExpression(n) && setters.has(n.expression.getText()) && n.arguments[0]) {
        const a = n.arguments[0];
        if (ts.isStringLiteralLike(a) || ts.isTemplateExpression(a)) messageStates.add(setters.get(n.expression.getText()));
      }
    });
    visit(sf, (n) => {
      if (ts.isJsxExpression(n) && n.parent && (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent)) && n.expression) {
        const used = new Set();
        visit(n.expression, (m) => { if (ts.isIdentifier(m)) used.add(m.text); });
        for (const s of messageStates) if (used.has(s) && !NOTICE_ALLOW.has(s)) fail("dialogs", `thông báo ngoài toast ("${s}" được set bằng chuỗi rồi render làm chữ)`, f, n, sf);
      }
    });
    // (c) hàm gọi fetch POST/DELETE (hoặc nơi gọi hàm phụ) có toast thành công + toast.error
    visit(sf, (n) => {
      if (!(ts.isCallExpression(n) && n.expression.getText() === "fetch")) return;
      const method = fetchMethod(n);
      if (method === "GET") return;
      const fn = enclosingFn(n);
      const fnTxt = fn?.getText() ?? "";
      const hasBoth = (t) => /toast\.error\(/.test(t) && /toast(\.success|\.message|\.info)?\(/.test(t.replace(/toast\.error\(/g, ""));
      if (hasBoth(fnTxt)) return;
      const name = fnName(fn);
      const callers = [];
      if (name) visit(sf, (m) => { if (ts.isCallExpression(m) && m.expression.getText() === name && enclosingFn(m) !== fn) callers.push(enclosingFn(m)); });
      if (!callers.length || !callers.every((c) => hasBoth(c?.getText() ?? ""))) fail("dialogs", `fetch ${method} không có toast thành công + toast.error ở hàm gọi`, f, n, sf);
    });
  }
  if (!alertDialogInSources) fail("dialogs", "thiếu AlertDialog ở components/ops/sources (xác nhận xoá nhóm / gỡ tài khoản)");
  if (!fails.length) ok("không hộp thoại gốc; xác nhận phá huỷ = AlertDialog; mọi kết quả qua toast");
}

// ------------------------------------------------------------------ E7 api-contract
function normUrl(arg) {
  let s;
  if (ts.isStringLiteralLike(arg)) s = arg.text;
  else if (ts.isTemplateExpression(arg)) s = arg.head.text + arg.templateSpans.map((sp) => "{}" + sp.literal.text).join("");
  else return null;
  return s.split("?")[0].replace(/\{\}$/, "");
}
function objKeys(obj, sf) {
  const keys = new Set();
  for (const p of obj.properties) {
    if (ts.isSpreadAssignment(p)) {
      const id = p.expression.getText();
      let resolved = false;
      visit(sf, (n) => {
        if (ts.isVariableDeclaration(n) && ts.isArrayBindingPattern(n.name) && n.name.elements[0]?.getText?.() === id && n.initializer && ts.isCallExpression(n.initializer)) {
          const init = n.initializer.arguments[0];
          if (init && ts.isObjectLiteralExpression(init)) { for (const k of objKeys(init, sf)) keys.add(k); resolved = true; }
        }
      });
      if (!resolved) keys.add(`...${id}`);
    } else if (p.name) keys.add(p.name.getText());
  }
  return keys;
}
function bodyKeys(call, sf) {
  const opt = call.arguments[1];
  if (!opt || !ts.isObjectLiteralExpression(opt)) return new Set();
  const b = opt.properties.find((p) => p.name?.getText() === "body");
  if (!b || !ts.isPropertyAssignment(b)) return new Set();
  const e = b.initializer;
  if (!(ts.isCallExpression(e) && e.expression.getText() === "JSON.stringify" && e.arguments[0])) return new Set(["<không đọc được>"]);
  const a = e.arguments[0];
  if (ts.isObjectLiteralExpression(a)) return objKeys(a, sf);
  if (ts.isIdentifier(a)) {
    const fn = enclosingFn(call);
    const name = fnName(fn);
    const keys = new Set();
    if (name) visit(sf, (m) => {
      if (ts.isCallExpression(m) && m.expression.getText() === name && m.arguments[0] && ts.isObjectLiteralExpression(m.arguments[0])) for (const k of objKeys(m.arguments[0], sf)) keys.add(k);
    });
    return keys.size ? keys : new Set([`<${a.text}>`]);
  }
  return new Set(["<không đọc được>"]);
}
function extractFetches() {
  const byKey = new Map();
  for (const f of walk(join(SRC(), "components", "ops")).concat(walk(join(SRC(), "app", "ops")))) {
    if (!/\.tsx?$/.test(f) || !inScope(relative(SRC(), f).split(sep).join("/"))) continue;
    const sf = parse(f);
    visit(sf, (n) => {
      if (!(ts.isCallExpression(n) && n.expression.getText() === "fetch" && n.arguments[0])) return;
      const endpoint = normUrl(n.arguments[0]);
      if (!endpoint) { fail("api", "fetch với URL không phải chuỗi/template — không trích được", f, n, sf); return; }
      const method = fetchMethod(n);
      const k = `${method} ${endpoint}`;
      const cur = byKey.get(k) ?? { endpoint, method, bodyKeys: new Set() };
      for (const b of bodyKeys(n, sf)) cur.bodyKeys.add(b);
      byKey.set(k, cur);
    });
  }
  return [...byKey.values()].map((c) => ({ ...c, bodyKeys: [...c.bodyKeys].sort() })).sort((a, b) => `${a.method} ${a.endpoint}`.localeCompare(`${b.method} ${b.endpoint}`));
}
const callKey = (c) => `${c.method} ${c.endpoint} {${c.bodyKeys.join(",")}}`;
function snapshotApi() {
  const calls = extractFetches();
  writeFileSync(join(ROOT, "scripts/ui-standards/b1-api-snapshot.json"), JSON.stringify({ _nguon: "Máy sinh bằng `b1-ops.mjs snapshot-api` từ code TRƯỚC khi sửa UI (đợt B1).", calls }, null, 2) + "\n");
  console.log(`  ghi ${calls.length} lời gọi vào b1-api-snapshot.json`);
}
function apiContract() {
  const snap = json(join(ROOT, "scripts/ui-standards/b1-api-snapshot.json")).calls.map(callKey);
  const exp = json(join(ROOT, "scripts/ui-standards/b1-api-expected.json")).calls.map(callKey);
  const now = extractFetches().map(callKey);
  for (const e of exp) if (!snap.includes(e)) fails.push(`api: bản chụp thiếu phần tử của ma trận viết tay: ${e} (bộ trích sót kiểu gọi?)`);
  for (const s of snap) if (!now.includes(s)) fails.push(`api: code sau sửa thiếu ${s}`);
  for (const n of now) if (!snap.includes(n)) fails.push(`api: code sau sửa thừa ${n}`);
  if (!fails.length) ok(`${now.length} lời gọi khớp bản chụp; bản chụp phủ đủ ${exp.length} phần tử ma trận viết tay`);
}

// ------------------------------------------------------------------ E9 design-page
const DESIGN_REQUIRED = ["PageHeader", "StatTiles", "InsightGrid", "PageError", "Empty", "Skeleton", "Badge"];
function designPage() {
  const page = join(SRC(), "app/ops/design/page.tsx");
  const files = [page, ...walk(join(SRC(), "components/ops/design"))].filter((f) => existsSync(f) && /\.tsx?$/.test(f));
  const names = new Set();
  const allText = [];
  for (const f of files) {
    const sf = parse(f);
    for (const i of imports(sf)) {
      if (i.from.startsWith("@/components/examples/")) fail("design-page", `import ${i.from}`, f, i.node, sf);
      i.names.forEach((n) => names.add(n));
    }
    visit(sf, (n) => {
      if (ts.isImportDeclaration(n)) return;
      const inHref = n.parent && ts.isJsxAttribute(n.parent.parent ?? {}) && /^(href|src)$/.test(n.parent.parent.name?.getText?.() ?? "");
      if ((ts.isJsxText(n) || ts.isStringLiteralLike(n)) && !inHref && !(n.parent && ts.isImportDeclaration(n.parent))) {
        const t = n.text ?? "";
        allText.push(t);
        // URL là đích liên kết (link xem trước), không phải chữ hiển thị cho người đọc.
        if (/^https?:\/\//.test(t.trim())) return;
        if (/skill|\breui\b|\.claude|gallery/i.test(t)) fail("design-page", `chữ thuật ngữ dev "${t.trim().slice(0, 40)}"`, f, n, sf);
      }
    });
  }
  for (const r of DESIGN_REQUIRED) if (!names.has(r)) fail("design-page", `thiếu mẫu ${r}`, page);
  const map = BLOCK_MAP();
  const blocks = [map.shell.block, ...map.pages.flatMap((p) => p.blocks)];
  for (const b of new Set(blocks)) if (!allText.some((t) => t.includes(b))) fail("design-page", `bảng block thiếu ${b}`, page);
  if (!fails.length) ok("trang trưng bày đủ mẫu, đủ block, không chữ thuật ngữ dev");
}

// ------------------------------------------------------------------ E10 docs
const ROUTE_ARCHETYPE = { "/ops": "Dashboard grid", "/ops/collections": "Dashboard grid", "/ops/quality": "Table-backed management", "/ops/review": "Table-backed management", "/ops/sources": "Frame stack", "/ops/design": "Frame stack" };
function docs() {
  const r = spawnSync("npm", ["run", "-s", "lint:ui-report"], { cwd: join(ROOT, "app"), encoding: "utf8" });
  const m = /Tổng\s+(\d+)\s+vi phạm/.exec(r.stdout);
  if (!m) { fails.push(`docs: lint:ui-report không in dòng tổng (exit ${r.status})`); return; }
  const total = Number(m[1]);
  const doc = read(join(ROOT, "docs/research/ui-baseline-2026-10.md"));
  const after = doc.split(/^##+ .*Sau B1.*$/m)[1];
  if (!after) fails.push("docs: tài liệu baseline chưa có mục 'Sau B1'");
  else {
    const dm = /Tổng\s+(\d+)\s+vi phạm/.exec(after);
    if (!dm) fails.push("docs: mục 'Sau B1' không có dòng 'Tổng N vi phạm'");
    else if (Number(dm[1]) !== total) fails.push(`docs: tổng mục 'Sau B1' = ${dm[1]}, máy đếm ${total}`);
    for (const dir of ["app/ops", "components/ops"]) {
      const row = after.split("\n").find((l) => l.startsWith(`| \`${dir}\``));
      if (row && !/\|\s*0\s*\|/.test(row.split("|").slice(2, 3).join("|") ? `|${row.split("|")[2]}|` : "")) fails.push(`docs: hàng ${dir} ở mục 'Sau B1' khác 0`);
    }
  }
  const cat = read(join(ROOT, ".claude/skills/onehub-ui/catalog.md"));
  const map = BLOCK_MAP();
  for (const need of [map.shell.block, ...new Set(map.pages.flatMap((p) => p.blocks)), "c-alert-dialog-5", "switch", "KPI và lưới theo block"])
    if (!cat.includes(need)) fails.push(`docs: catalog.md thiếu "${need}"`);
  const routes = read(join(ROOT, ".claude/skills/onehub-ui/routes.md")).split("\n");
  for (const [route, arch] of Object.entries(ROUTE_ARCHETYPE)) {
    const row = routes.find((l) => l.startsWith(`| \`${route}\` |`));
    if (!row) { fails.push(`docs: routes.md thiếu dòng ${route}`); continue; }
    if (row.includes("(chưa có, B1)")) fails.push(`docs: routes.md dòng ${route} còn "(chưa có, B1)"`);
    if (row.split("|")[4]?.trim() !== arch) fails.push(`docs: routes.md dòng ${route} archetype "${row.split("|")[4]?.trim()}", cần "${arch}"`);
  }
  if (!fails.length) ok(`tổng sau B1 = ${total} khớp tài liệu; catalog + routes đủ`);
}

// ------------------------------------------------------------------ E15 states
function states() {
  const files = scopeFiles();
  const parsed = files.map((f) => ({ f, sf: parse(f), srcRel: relative(SRC(), f).split(sep).join("/") }));
  // (1) nút quyết định ở hàng chờ duyệt có disabled
  const review = parsed.filter((p) => p.srcRel.startsWith("components/ops/review/"));
  if (!review.length) fails.push("states: chưa có components/ops/review/ (hàng chờ duyệt chuyển thể agents-5)");
  for (const { f, sf } of review) for (const o of jsxOpenings(sf)) {
    if (tagName(o) !== "Button") continue;
    const el = o.parent;
    const text = ts.isJsxElement(el) ? el.children.map((c) => c.getText()).join("") : "";
    if (/Duyệt|Từ chối|Hoãn|Cùng căn|Khác căn|Không chắc/.test(text) && !attr(o, "disabled")) fail("states", "nút quyết định thiếu disabled khi đang gửi", f, o, sf);
  }
  // (2) bật/tắt lỗi → hoàn giá trị + toast.error
  let toggles = 0;
  for (const { f, sf } of parsed) visit(sf, (n) => {
    if (!ts.isFunctionLike(n)) return;
    const name = fnName(n);
    if (!name || !/toggle/i.test(name)) return;
    toggles++;
    const t = n.getText();
    const setterCalls = {};
    visit(n, (m) => { if (ts.isCallExpression(m) && /^set[A-Z]/.test(m.expression.getText())) setterCalls[m.expression.getText()] = (setterCalls[m.expression.getText()] ?? 0) + 1; });
    if (!/toast\.error\(/.test(t)) fail("states", `${name}: thiếu toast.error khi lỗi`, f, n, sf);
    if (!Object.values(setterCalls).some((c) => c >= 2)) fail("states", `${name}: không hoàn giá trị cũ khi lỗi (setter chỉ gọi một lần)`, f, n, sf);
  });
  if (toggles < 2) fails.push(`states: cần hàm toggle cho nhóm thu và nhóm Zalo, thấy ${toggles}`);
  // (3) hàng chờ rỗng → Empty
  const reviewPage = parsed.find((p) => p.srcRel === "app/ops/review/page.tsx");
  const reviewHasEmpty = [reviewPage, ...review].filter(Boolean).some(({ sf }) => imports(sf).some((i) => i.names.includes("Empty")));
  if (!reviewHasEmpty) fails.push("states: hàng chờ duyệt không render Empty khi rỗng");
  // (4) nhóm Zalo: Skeleton lúc tải + Alert destructive có Button Thử lại gọi lại việc tải
  const sources = parsed.filter((p) => p.srcRel.startsWith("components/ops/sources/"));
  const zaloFiles = sources.filter((p) => /zalo/.test(p.srcRel))
  if (!zaloFiles.some(({ sf }) => /\/api\/v1\/ops\/zalo\/groups/.test(sf.text))) fails.push("states: không thấy tệp tải nhóm Zalo trong components/ops/sources")
  else {
    if (!zaloFiles.some(({ sf }) => imports(sf).some((i) => i.names.includes("Skeleton")))) fails.push("states: bảng nhóm Zalo thiếu Skeleton lúc tải")
    let retry = false
    for (const { sf: z } of zaloFiles) for (const o of jsxOpenings(z)) {
      if (tagName(o) === "Alert" && attrString(attr(o, "variant")) === "destructive" && ts.isJsxElement(o.parent)) {
        visit(o.parent, (m) => {
          if ((ts.isJsxOpeningElement(m) || ts.isJsxSelfClosingElement(m)) && tagName(m) === "Button") {
            const oc = attrString(attr(m, "onClick")) ?? ""
            if (/load|fetch|reload|retry/i.test(oc)) retry = true
          }
        })
      }
    }
    if (!retry) fails.push("states: lỗi tải nhóm Zalo thiếu Alert destructive kèm nút Thử lại gọi lại việc tải")
  }
  // (5) tạo nhóm thu chặn khi thiếu trường
  let creates = 0;
  for (const { f, sf } of sources) visit(sf, (n) => {
    if (!ts.isFunctionLike(n)) return;
    const name = fnName(n);
    if (!name || !/^(add|create|submit)/i.test(name)) return;
    const t = n.getText();
    if (!/fetch|call\(/.test(t) && !/onCreate|onSubmit/.test(t)) return;
    creates++;
    if (!(/\.trim\(\)/.test(t) && /toast\.error\(/.test(t) && /return/.test(t))) fail("states", `${name}: không chặn gửi khi thiếu URL/key hoặc tên`, f, n, sf);
  });
  if (!creates) fails.push("states: không thấy hàm tạo nhóm thu (add/create/submit) trong components/ops/sources");
  // (6) aria-label cho Switch và nút chỉ có icon
  for (const { f, sf } of parsed) for (const o of jsxOpenings(sf)) {
    const t = tagName(o);
    if (t === "Switch" && !attr(o, "aria-label") && !attr(o, "aria-labelledby") && !attr(o, "id")) fail("states", "Switch thiếu aria-label", f, o, sf);
    if (t === "Button" && ts.isJsxOpeningElement(o)) {
      const kids = o.parent.children.filter((c) => !(ts.isJsxText(c) && !c.text.trim()));
      const iconOnly = kids.length > 0 && kids.every((c) => (ts.isJsxSelfClosingElement(c) && /Icon$/.test(tagName(c))));
      if (iconOnly && !attr(o, "aria-label")) fail("states", "Button chỉ có icon thiếu aria-label", f, o, sf);
    }
  }
  // (7) ô tầng A bọc data-tier-a
  const TIER_A = /\.(real_name|realName|group_key|groupKey)\b/;
  for (const { f, sf } of parsed) visit(sf, (n) => {
    if (!(ts.isJsxExpression(n) && n.expression && TIER_A.test(n.expression.getText()))) return;
    if (n.parent && ts.isJsxAttribute(n.parent)) return;
    let p = n.parent;
    let tagged = false;
    while (p && !ts.isSourceFile(p)) {
      if ((ts.isJsxElement(p) && attr(p.openingElement, "data-tier-a"))) { tagged = true; break; }
      p = p.parent;
    }
    if (!tagged) fail("states", `ô tầng A "${n.expression.getText().slice(0, 40)}" không nằm trong phần tử data-tier-a`, f, n, sf);
  });
  if (!fails.length) ok("trạng thái vùng viết lại + nhãn a11y + đánh dấu tầng A đủ");
}

// ------------------------------------------------------------------ E16 shell
const GUARD_LINES = ['if (!user) redirect("/login?next=/ops");', "if (!canAccessOps(user)) notFound();"];
const OPS_HREFS = ["/ops", "/ops/collections", "/ops/quality", "/ops/review", "/ops/deals", "/ops/sources", "/ops/design"];
function shell() {
  const layout = join(SRC(), "app/ops/layout.tsx");
  const lt = read(layout);
  const lsf = parse(layout);
  if (!imports(lsf).some((i) => i.from.startsWith("@/components/shell/ops-shell"))) fail("shell", "ops/layout.tsx không import shell Ops", layout);
  if (/PortalShell/.test(lt)) fail("shell", "ops/layout.tsx vẫn dùng PortalShell", layout);
  for (const g of GUARD_LINES) if (!lt.includes(g)) fail("shell", `ops/layout.tsx mất dòng chặn quyền: ${g}`, layout);
  const appLayout = join(SRC(), "app/(app)/layout.tsx");
  const at = read(appLayout);
  if (!/PortalShell/.test(at)) fail("shell", "(app)/layout.tsx không còn PortalShell", appLayout);
  if (/ops-shell/.test(at)) fail("shell", "(app)/layout.tsx import shell Ops", appLayout);
  const nav = read(join(SRC(), "components/shell/nav.tsx"));
  const opsBlock = nav.slice(nav.indexOf("ops: ["), nav.indexOf("],", nav.indexOf("ops: [")));
  const hrefs = [...opsBlock.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
  const missing = OPS_HREFS.filter((h) => !hrefs.includes(h));
  const extra = hrefs.filter((h) => !OPS_HREFS.includes(h));
  if (missing.length) fails.push(`shell: nav ops thiếu ${missing.join(", ")}`);
  if (extra.length) fails.push(`shell: nav ops thừa ${extra.join(", ")}`);
  const shFiles = walk(join(SRC(), "components/shell/ops-shell"));
  if (!shFiles.some((f) => read(f).includes("chuyển thể từ @reui/app-shell-36"))) fails.push("shell: thiếu dòng 'chuyển thể từ @reui/app-shell-36' trong components/shell/ops-shell");
  if (!fails.length) ok("Ops trong shell riêng, Invest giữ PortalShell, nav đủ 7 mục, chặn quyền nguyên văn");
}

// ------------------------------------------------------------------ E11 selftest
// Mỗi lệnh: bản sao sạch → 0 (đối chứng dương); bản sao bị phá đúng mẫu → 1 + thông điệp ghim.
const MUTATIONS = {
  suppressions: [{ name: "thêm khoá baseline trong phạm vi", pin: "suppressions: còn mục baseline", apply: (r) => { const p = join(r, "app/eslint-suppressions.json"); const s = json(p); s["src/components/ops/x.tsx"] = { "onehub-ui/no-raw-table": { count: 1 } }; writeFileSync(p, JSON.stringify(s)); } }],
  handdrawn: [{ name: "cấy khung tự kẻ", pin: "handdrawn: <div> tự kẻ khung", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), 'export const X = () => <div className="rounded-lg border p-3">x</div>\n') },
    { name: "cấy ký tự làm icon", pin: "handdrawn: ký tự làm icon", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), "export const X = () => <span>✓ xong</span>\n") }],
  frame: [{ name: "thêm <h1> vào /ops", pin: "frame: app/ops/page.tsx tự viết <h1>", apply: (r) => { const p = join(r, "app/src/app/ops/page.tsx"); writeFileSync(p, read(p) + "\nexport const H = () => <h1>x</h1>\n"); } }],
  "one-way": [{ name: "import ui/table", pin: "one-way: import @/components/ui/table", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), 'import { Table } from "@/components/ui/table"\nexport const X = Table\n') },
    { name: "giữ RAW_SLOS", pin: 'one-way: /ops: còn định danh mẫu đã bỏ "RAW_SLOS"', apply: (r) => writeFileSync(join(r, "app/src/components/ops/overview/zz-probe.ts"), "export const RAW_SLOS = []\n") }],
  dialogs: [{ name: "setNotice + render", pin: "dialogs: thông báo ngoài toast", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), 'import { useState } from "react"\nexport function X() { const [notice, setNotice] = useState<string | null>(null); const go = () => setNotice("Lỗi"); return <p onClick={go}>{notice}</p> }\n') },
    { name: "gọi confirm()", pin: "dialogs: gọi confirm()", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), 'export const X = () => confirm("x")\n') }],
  "api-contract": [{ name: "đổi method", pin: "api: code sau sửa thừa", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), 'export const X = () => fetch("/api/v1/ops/zalo/accounts", { method: "PATCH", body: JSON.stringify({ id: 1 }) })\n') },
    { name: "lời gọi qua hàm phụ vẫn trích được", pin: "api: code sau sửa thừa", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), 'const call = (body: object) => fetch("/api/v1/ops/zz", { method: "POST", body: JSON.stringify(body) })\nexport const X = () => call({ secret: 1 })\n') }],
  "design-page": [{ name: "chữ skill reui", pin: "design-page: chữ thuật ngữ dev", apply: (r) => writeFileSync(join(r, "app/src/components/ops/design/zz-probe.tsx"), "export const X = () => <p>skill reui</p>\n") }],
  states: [{ name: "Switch thiếu aria-label", pin: "states: Switch thiếu aria-label", apply: (r) => writeFileSync(join(r, "app/src/components/ops/zz-probe.tsx"), "export const X = () => <Switch checked />\n") }],
  shell: [{ name: "bỏ /ops/review khỏi nav", pin: "shell: nav ops thiếu /ops/review", apply: (r) => { const p = join(r, "app/src/components/shell/nav.tsx"); writeFileSync(p, read(p).replace('href: "/ops/review"', 'href: "/ops/zz"')); } },
    { name: "đổi dòng canAccessOps", pin: "shell: ops/layout.tsx mất dòng chặn quyền", apply: (r) => { const p = join(r, "app/src/app/ops/layout.tsx"); writeFileSync(p, read(p).replace("if (!canAccessOps(user)) notFound();", "if (!user) notFound();")); } }],
  docs: [{ name: "lệch tổng 1", pin: "docs: tổng mục 'Sau B1'", apply: (r) => { const p = join(r, "docs/research/ui-baseline-2026-10.md"); const t = read(p); const i = t.search(/^##+ .*Sau B1/m); writeFileSync(p, t.slice(0, i) + t.slice(i).replace(/Tổng\s+(\d+)\s+vi phạm/, (_, n) => `Tổng ${Number(n) + 1} vi phạm`)); } }],
};
function copyTree() {
  const t = mkdtempSync(join(tmpdir(), "b1-ops-"));
  for (const p of ["app/src", "app/eslint-suppressions.json", "scripts/ui-standards", "docs/research/ui-baseline-2026-10.md", ".claude/skills/onehub-ui"]) cpSync(join(ROOT, p), join(t, p), { recursive: true });
  return t;
}
function runOn(root, c) {
  const extra = c === "docs" ? [] : [];
  return spawnSync(process.execPath, [fileURLToPath(import.meta.url), c, "--root", root, ...extra], { encoding: "utf8" });
}
function selftest() {
  const rows = [];
  for (const [c, muts] of Object.entries(MUTATIONS)) {
    if (c === "docs") {
      // docs cần app/node_modules để chạy eslint → chạy trên cây thật cho đối chứng dương, bản sao chỉ đổi tài liệu
    }
    const clean = copyTree();
    if (c === "docs") cpSync(join(ROOT, "app"), join(clean, "app"), { recursive: true, filter: (s) => !s.includes(`${sep}.next`) });
    const pos = runOn(clean, c);
    rows.push({ c, case: "bản sao sạch", want: 0, got: pos.status, ok: pos.status === 0, out: (pos.stdout + pos.stderr).trim().split("\n").slice(-2).join(" | ") });
    rmSync(clean, { recursive: true, force: true });
    for (const m of muts) {
      const t = copyTree();
      if (c === "docs") cpSync(join(ROOT, "app"), join(t, "app"), { recursive: true, filter: (s) => !s.includes(`${sep}.next`) });
      m.apply(t);
      const r = runOn(t, c);
      const out = r.stdout + r.stderr;
      rows.push({ c, case: m.name, want: 1, got: r.status, ok: r.status === 1 && out.includes(m.pin), out: out.trim().split("\n").find((l) => l.includes(m.pin)) ?? out.trim().split("\n")[0] });
      rmSync(t, { recursive: true, force: true });
    }
  }
  for (const r of rows) console.log(`  ${r.ok ? "OK " : "HỎNG"} ${r.c} · ${r.case}: muốn ${r.want}, được ${r.got}${r.ok ? "" : ` — ${r.out}`}`);
  const bad = rows.filter((r) => !r.ok);
  console.log(`  ${rows.length - bad.length}/${rows.length} cặp đạt`);
  if (bad.length) fails.push(`selftest: ${bad.length} ca không đạt`);
}

const COMMANDS = { suppressions, handdrawn, frame, "one-way": oneWay, dialogs, "api-contract": apiContract, "design-page": designPage, docs, states, shell, selftest, "snapshot-api": snapshotApi };
if (!COMMANDS[cmd]) {
  console.error(`Dùng: node scripts/ui-standards/b1-ops.mjs <${Object.keys(COMMANDS).join("|")}> [--root <dir>]`);
  process.exit(2);
}
console.log(`b1-ops ${cmd}`);
COMMANDS[cmd]();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL ${f}`);
  process.exit(1);
}
