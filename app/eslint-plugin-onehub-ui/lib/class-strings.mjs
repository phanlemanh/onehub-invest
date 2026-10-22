// Duyệt "đơn vị chuỗi class" dùng chung cho mọi luật class: Literal (chuỗi), TemplateLiteral
// (xét TỪNG quasi — `text-${x}-600` không bị báo nhầm) và JSXText.
// cb(value, reportNode): reportNode là node để báo lỗi/đọc vị trí (quasi với template).

/** Literal là nguồn import/export (không phải class, không phải văn bản hiển thị). */
function isModuleSource(node) {
  const p = node.parent;
  return (
    !!p &&
    (p.type === "ImportDeclaration" ||
      p.type === "ExportNamedDeclaration" ||
      p.type === "ExportAllDeclaration" ||
      p.type === "ImportExpression") &&
    p.source === node
  );
}

export function forEachClassString(context, node, cb) {
  void context;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string" && !isModuleSource(node)) cb(node.value, node);
      break;
    case "TemplateLiteral":
      for (const quasi of node.quasis) {
        const value = quasi.value.cooked ?? quasi.value.raw;
        if (value) cb(value, quasi);
      }
      break;
    case "JSXText":
      cb(node.value, node);
      break;
    default:
  }
}

/** Visitor sẵn: gọi cb cho mọi đơn vị chuỗi trong file. */
export function classStringVisitor(context, cb) {
  const visit = (node) => forEachClassString(context, node, cb);
  return { Literal: visit, TemplateLiteral: visit, JSXText: visit };
}

/** Tách chuỗi class thành token: { raw, variants[], base } — base là phần sau dấu ':' cuối. */
export function tokenize(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const i = raw.lastIndexOf(":");
      const variants = i === -1 ? [] : raw.slice(0, i).split(":");
      const base = (i === -1 ? raw : raw.slice(i + 1)).replace(/^[!-]+/, "");
      return { raw, variants, base };
    });
}
