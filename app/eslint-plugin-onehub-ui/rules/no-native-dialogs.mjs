import { classStringVisitor, tokenize } from "../lib/class-strings.mjs";

const DIALOG_FNS = new Set(["confirm", "alert", "prompt"]);

function isLocallyDeclared(context, node, id) {
  let scope = context.sourceCode.getScope(node);
  const ref = scope.references.find((r) => r.identifier === id);
  if (ref) return Boolean(ref.resolved && ref.resolved.defs.length > 0);
  for (; scope; scope = scope.upper) {
    const v = scope.set.get(id.name);
    if (v) return v.defs.length > 0;
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm confirm/alert/prompt của trình duyệt và lớp phủ tự dựng `fixed inset-0`." },
    messages: {
      nativeDialog:
        "Hộp thoại gốc của trình duyệt: dùng AlertDialog để xác nhận, toast sonner để thông báo.",
      rawOverlay:
        "Lớp phủ tự dựng (`fixed inset-0`): dùng Dialog/AlertDialog/Sheet có sẵn thay vì tự vẽ overlay.",
    },
    schema: [],
  },
  create(context) {
    return {
      ...classStringVisitor(context, (value, node) => {
        const bases = new Set(tokenize(value).map((t) => t.base));
        if (bases.has("fixed") && bases.has("inset-0")) {
          context.report({ node, messageId: "rawOverlay" });
        }
      }),
      CallExpression(node) {
        const c = node.callee;
        const name =
          c.type === "Identifier"
            ? c.name
            : c.type === "MemberExpression" &&
                !c.computed &&
                c.object.type === "Identifier" &&
                c.object.name === "window" &&
                c.property.type === "Identifier"
              ? c.property.name
              : null;
        if (!name || !DIALOG_FNS.has(name)) return;
        // `confirm(...)` mà `confirm` là biến/hàm/tham số/import khai báo trong mã → không phải hộp thoại trình duyệt
        if (c.type === "Identifier" && isLocallyDeclared(context, node, c)) return;
        context.report({ node, messageId: "nativeDialog" });
      },
    };
  },
};
