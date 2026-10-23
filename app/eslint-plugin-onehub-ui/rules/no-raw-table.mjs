export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm <table> tự dựng; dùng data-grid (qua InsightGrid)." },
    messages: {
      rawTable: "Bảng tự dựng: dùng data-grid (qua InsightGrid) thay cho <table>.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "table") {
          context.report({ node, messageId: "rawTable" });
        }
      },
    };
  },
};
