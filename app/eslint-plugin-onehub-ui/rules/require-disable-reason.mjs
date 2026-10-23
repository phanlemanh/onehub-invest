// Directive eslint-disable (cả 3 dạng) — chấp nhận kết thúc bằng khoảng trắng hoặc hết chuỗi,
// để eslint-disable-foo không bị coi là directive.
const DIRECTIVE = /^\s*eslint-disable(?:-next-line|-line)?(?=\s|$)/;
// Dấu phân cách lý do theo chuẩn ESLint: hai gạch trở lên, bao hai đầu bằng khoảng trắng.
const SEPARATOR = /\s-{2,}\s/;

export default {
  meta: {
    type: "problem",
    docs: { description: "Ngoại lệ lint cho luật onehub-ui (hoặc tắt mọi luật) phải kèm lý do sau ` -- `." },
    messages: {
      missingReason:
        "Ngoại lệ lint phải kèm lý do: `eslint-disable-next-line onehub-ui/<luật> -- <lý do>`.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const directive = DIRECTIVE.exec(comment.value);
          if (!directive) continue;

          const rest = comment.value.slice(directive[0].length);
          const sep = SEPARATOR.exec(rest);
          const list = sep ? rest.slice(0, sep.index) : rest;
          const reason = sep ? rest.slice(sep.index + sep[0].length) : "";

          const rules = list.split(",").map((r) => r.trim()).filter(Boolean);
          const coversOnehub = rules.length === 0 || rules.some((r) => r.startsWith("onehub-ui/"));
          if (coversOnehub && !reason.trim()) {
            context.report({ loc: comment.loc, messageId: "missingReason" });
          }
        }
      },
    };
  },
};
