import { classStringVisitor, tokenize } from "../lib/class-strings.mjs";

const DIALOG_FNS = new Set(["confirm", "alert", "prompt"]);

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
        if (name && DIALOG_FNS.has(name)) context.report({ node, messageId: "nativeDialog" });
      },
    };
  },
};
