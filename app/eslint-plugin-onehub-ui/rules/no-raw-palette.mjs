import { classStringVisitor, tokenize } from "../lib/class-strings.mjs";

// Lớp palette thô của Tailwind (ngoài token ngữ nghĩa). Token: prefix-màu-sắc độ, tuỳ chọn /opacity.
const PALETTE =
  /^(?:text|bg|border|ring|fill|stroke|from|via|to|outline|divide|decoration)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/.+)?$/;

// Từ trạng thái (ReUI C3) — dòng chứa chúng nghĩa là đang tô màu trạng thái bằng tay.
const STATE_WORDS =
  /\b(success|paid|active|completed?|done|approved|online|healthy|live|error|failed|critical|overdue|declined|rejected|cancell?ed|blocked|expired|warning|pending|degraded|due|info|processing|running|scheduled|queued)\b/i;

export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm lớp palette thô (text-red-500…): dùng token ngữ nghĩa, Badge variant cho trạng thái, hoặc cặp dark:." },
    messages: {
      state:
        "Màu trạng thái tự tô: dùng Badge variant (vd. success-light, destructive-light) thay vì lớp palette thô.",
      noDarkPair:
        "Lớp palette thô thiếu cặp dark:: dùng token ngữ nghĩa (text-foreground, bg-muted…) hoặc thêm lớp dark: tương ứng.",
    },
    schema: [],
  },
  create(context) {
    const lines = context.sourceCode.lines;
    return classStringVisitor(context, (value, node) => {
      const palette = tokenize(value).filter((t) => PALETTE.test(t.base));
      if (!palette.length) return;
      const line = lines[node.loc.start.line - 1] ?? "";
      if (STATE_WORDS.test(line)) {
        context.report({ node, messageId: "state" });
        return;
      }
      const hasLight = palette.some((t) => !t.variants.includes("dark"));
      const hasDark = palette.some((t) => t.variants.includes("dark"));
      if (hasLight && !hasDark) context.report({ node, messageId: "noDarkPair" });
    });
  },
};
