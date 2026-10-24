// ops-visible-strings.mjs — quét CHỮ HIỂN THỊ của tệp .tsx/.ts tìm tên nguồn thật (tầng A). ON7 `ops-nhan-ma-nguon`.
// Chữ hiển thị = JsxText · chuỗi/template làm giá trị thuộc tính JSX (trừ thuộc tính kỹ thuật) · chuỗi/template nằm trong
// `{…}` con của phần tử JSX · chuỗi/template là giá trị của khoá object không thuộc nhóm kỹ thuật (TECH_KEYS). Định
// danh, tên bảng, đường log, chuỗi đem so sánh (`=== "x"`, `case "x"`) KHÔNG phải chữ hiển thị (sổ ON7 d-…-12).
// Báo [{ code, file, line }] — không bao giờ trả tên.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findSourceNames } from "./tier-a-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ts = createRequire(path.join(ROOT, "app", "package.json"))("typescript");

const TECH_ATTRS = new Set(["className", "key", "variant", "size", "type", "role", "side", "align", "tone", "ref", "style", "accessorKey", "getRowId"]);
// Khoá object mang giá trị KỸ THUẬT (định danh, biến thể, đường dẫn khối) — mọi khoá khác coi là chữ hiển thị.
export const TECH_KEYS = new Set([
  "id", "key", "value", "accessorKey", "variant", "type", "theme", "size", "mode", "kind", "tone", "color", "icon",
  "block", "route", "preview", "className", "code", "source", "path", "file", "status",
]);

/** Phần chữ của một nút chuỗi/template (template: nối các khúc tĩnh). */
function literalText(n) {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isTemplateExpression(n)) return [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(" ");
  return null;
}
const isLiteral = (n) => literalText(n) !== null;

/** Chuỗi là tên trường lowerCamelCase liền khối (vd khoá dữ liệu trong mảng chọn cột) — định danh, không hiện. */
const isFieldName = (s) => /^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(s);

/** Chuỗi đem so sánh hay làm nhãn case — giá trị định danh, không hiện. */
function isComparisonOperand(n) {
  const p = n.parent;
  if (p && ts.isBinaryExpression(p)) {
    const k = p.operatorToken.kind;
    return k === ts.SyntaxKind.EqualsEqualsEqualsToken || k === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      k === ts.SyntaxKind.EqualsEqualsToken || k === ts.SyntaxKind.ExclamationEqualsToken;
  }
  return !!p && ts.isCaseClause(p);
}

/** Leo lên tới ranh giới gần nhất quyết định chuỗi này có hiện không — ranh giới gặp TRƯỚC thắng. */
function displayContext(n) {
  if (isComparisonOperand(n) || isFieldName(literalText(n))) return false;
  for (let c = n, p = n.parent; p; c = p, p = p.parent) {
    // thuộc tính JSX: hiện, trừ thuộc tính kỹ thuật
    if (ts.isJsxAttribute(p)) {
      const a = p.name.getText();
      return !TECH_ATTRS.has(a) && !a.startsWith("data-");
    }
    // `{…}` con của phần tử JSX: hiện
    if (ts.isJsxExpression(p) && p.parent && (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent))) return true;
    // giá trị của khoá object: hiện, trừ khoá kỹ thuật; chuỗi làm TÊN khoá thì không
    if (ts.isPropertyAssignment(p)) {
      if (p.initializer !== c) return false;
      return !TECH_KEYS.has(p.name.getText().replace(/^["']|["']$/g, ""));
    }
    // đối số hàm thường (path.join, pool.query, cn…), import/export, kiểu, khai báo: không hiện
    if (ts.isCallExpression(p) && p.arguments.includes(c)) return false;
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isTypeNode(p)) return false;
    if (ts.isVariableDeclaration(p) || ts.isSourceFile(p)) return false;
  }
  return false;
}

/** Quét một nội dung tệp; trả [{ code, file, line }] mỗi chỗ trúng (một chuỗi có thể trúng nhiều tên). */
export function scanSource(file, content, entries) {
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits = [];
  const visit = (n) => {
    let txt = null;
    if (ts.isJsxText(n)) txt = n.text;
    else if (isLiteral(n) && displayContext(n)) txt = literalText(n);
    if (txt && txt.trim()) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      for (const h of findSourceNames(txt, entries)) hits.push({ code: h.code, file, line });
    }
    if (!ts.isTemplateExpression(n)) ts.forEachChild(n, visit);
  };
  visit(sf);
  return hits;
}
