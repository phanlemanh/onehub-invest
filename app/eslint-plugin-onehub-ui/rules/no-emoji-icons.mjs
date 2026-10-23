import { classStringVisitor } from "../lib/class-strings.mjs";

const EMOJI = /\p{Extended_Pictographic}/u;

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm emoji làm icon trong văn bản/chuỗi; dùng icon lucide." },
    messages: {
      emoji: "Emoji làm icon: dùng icon lucide-react (hoặc Badge variant cho trạng thái) thay vì ký tự emoji.",
    },
    schema: [],
  },
  create(context) {
    return classStringVisitor(context, (value, node) => {
      if (EMOJI.test(value)) context.report({ node, messageId: "emoji" });
    });
  },
};
