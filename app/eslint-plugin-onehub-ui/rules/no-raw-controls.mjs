const PRIMITIVES = {
  select: "Select",
  input: "Input",
  textarea: "Textarea",
  button: "Button",
};

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm control HTML trần (<select> <input> <textarea> <button>); dùng primitive shadcn/ReUI." },
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
        context.report({ node, messageId: "rawControl", data: { tag, primitive: PRIMITIVES[tag] } });
      },
    };
  },
};
