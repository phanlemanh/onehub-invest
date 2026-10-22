import { classStringVisitor } from "../lib/class-strings.mjs";

const ARBITRARY = /text-\[[^\]]*(?:px|rem|em)\]/;

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm cỡ chữ tuỳ ý text-[10px]; dùng thang chữ của theme, tối thiểu text-xs." },
    messages: {
      arbitrarySize: "Cỡ chữ tuỳ ý: dùng thang chữ chuẩn (text-xs, text-sm, …), không đi dưới text-xs.",
    },
    schema: [],
  },
  create(context) {
    return classStringVisitor(context, (value, node) => {
      if (ARBITRARY.test(value)) context.report({ node, messageId: "arbitrarySize" });
    });
  },
};
