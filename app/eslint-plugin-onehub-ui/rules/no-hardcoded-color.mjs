import { classStringVisitor } from "../lib/class-strings.mjs";

const COLOR = /(?<![\w&])#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/;
const ARBITRARY_HEX = /-\[#/;
const CLASS_FNS = new Set(["cn", "clsx", "cva"]);
const JSX_ATTRS = new Set(["className", "style"]);
const COLOR_KEYS = /^(?:color|background.*|fill|stroke|borderColor)$/;

function keyName(prop) {
  if (prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal") return String(prop.key.value);
  return null;
}

/** Chuỗi nằm trong ngữ cảnh "màu/class"? Đi ngược chuỗi tổ tiên. */
function inColorContext(context, node) {
  const chain = [...context.sourceCode.getAncestors(node), node];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const child = chain[i + 1];
    if (a.type === "JSXAttribute" && a.name.type === "JSXIdentifier" && JSX_ATTRS.has(a.name.name)) return true;
    if (
      a.type === "CallExpression" &&
      a.callee.type === "Identifier" &&
      CLASS_FNS.has(a.callee.name) &&
      a.arguments.includes(child)
    ) {
      return true;
    }
    if (a.type === "Property" && a.value === child) {
      const k = keyName(a);
      if (k && COLOR_KEYS.test(k)) return true;
    }
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm màu cứng (#hex, rgb(), hsl(), oklch(), -[#…]) trong class/style/cn/thuộc tính màu." },
    messages: {
      hardcodedColor: "Màu cứng: dùng token màu của theme (bg-primary, text-muted-foreground, var(--color-…)) thay vì mã màu trực tiếp.",
    },
    schema: [],
  },
  create(context) {
    return classStringVisitor(context, (value, node) => {
      if (ARBITRARY_HEX.test(value) || (COLOR.test(value) && inColorContext(context, node))) {
        context.report({ node, messageId: "hardcodedColor" });
      }
    });
  },
};
