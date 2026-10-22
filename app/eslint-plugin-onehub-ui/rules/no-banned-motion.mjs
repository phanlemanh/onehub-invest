import { classStringVisitor, tokenize } from "../lib/class-strings.mjs";

const ALLOWED_DURATIONS = new Set(["0", "100", "150", "200", "300", "500"]);
const WHILE_PROPS = new Set(["whileHover", "whileTap", "whileFocus"]);

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm chuyển động ngoài chuẩn: transition-all, animate-bounce, ease-in/out, duration lạ, framer-motion, while*." },
    messages: {
      transitionAll: "transition-all bị cấm: dùng transition-colors (hover) hoặc nêu rõ thuộc tính cần chuyển.",
      bounce: "animate-bounce bị cấm: dùng motion/react với một hiệu ứng vào (entrance) tối đa mỗi view.",
      ease: "ease-in/out/in-out bị cấm: dùng ease-[cubic-bezier(0.22,1,0.36,1)] cho hiệu ứng vào, transition-colors cho hover.",
      duration: "duration lạ: chỉ dùng 0, 100, 150, 200, 300 hoặc 500 (mặc định duration-200).",
      framer: "framer-motion bị cấm: import từ motion/react.",
      whileProp: "Prop while* (whileHover/whileTap/whileFocus) bị cấm: dùng transition-colors hoặc motion/react theo chuẩn chuyển động.",
    },
    schema: [],
  },
  create(context) {
    return {
      ...classStringVisitor(context, (value, node) => {
        for (const { base } of tokenize(value)) {
          if (base === "transition-all") context.report({ node, messageId: "transitionAll" });
          else if (base === "animate-bounce") context.report({ node, messageId: "bounce" });
          else if (/^ease-(?:in|out|in-out)$/.test(base)) context.report({ node, messageId: "ease" });
          else {
            const m = /^duration-(\d+)$/.exec(base);
            if (m && !ALLOWED_DURATIONS.has(m[1])) context.report({ node, messageId: "duration" });
          }
        }
      }),
      ImportDeclaration(node) {
        if (node.source.value === "framer-motion") context.report({ node, messageId: "framer" });
      },
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && WHILE_PROPS.has(node.name.name)) {
          context.report({ node, messageId: "whileProp" });
        }
      },
    };
  },
};
