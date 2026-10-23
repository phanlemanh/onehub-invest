const PRIMITIVES = {
  select: "Select",
  input: "Input",
  textarea: "Textarea",
  button: "Button",
};

/** `<input type="hidden">` (chuỗi literal) là ô dữ liệu của form, không có giao diện → miễn. */
function isHiddenInput(node) {
  return node.attributes.some(
    (a) =>
      a.type === "JSXAttribute" &&
      a.name.type === "JSXIdentifier" &&
      a.name.name === "type" &&
      a.value?.type === "Literal" &&
      a.value.value === "hidden",
  );
}

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm control HTML trần (<select> <input> <textarea> <button>); dùng primitive shadcn/ReUI. Miễn <input type=\"hidden\">." },
    messages: {
      rawControl: "Control tự dựng: dùng {{primitive}} (components/ui) thay cho <{{tag}}>.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const tag = node.name.name;
        if (!Object.hasOwn(PRIMITIVES, tag)) return;
        if (tag === "input" && isHiddenInput(node)) return;
        context.report({ node, messageId: "rawControl", data: { tag, primitive: PRIMITIVES[tag] } });
      },
    };
  },
};
