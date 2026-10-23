export default {
  meta: {
    type: "problem",
    docs: { description: "Cấm asChild (Radix); base-nova dùng prop render." },
    messages: {
      asChild: "asChild là API Radix: base-nova dùng prop render, vd. <Button render={<Link href=\"/x\" />} />.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "asChild") {
          context.report({ node, messageId: "asChild" });
        }
      },
    };
  },
};
