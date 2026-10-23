// Tiện ích dùng chung cho test luật: RuleTester gắn vào node:test + kiểm lời nhắn chứa từ khoá thay thế.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RuleTester } from "eslint";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

export const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

/** Mỗi messageId của luật phải chứa từ khoá thay thế đã chốt trong brief. */
export function assertMessages(rule, expected) {
  describe("lời nhắn chứa từ khoá thay thế", () => {
    for (const [id, needle] of Object.entries(expected)) {
      it(`${id} chứa "${needle}"`, () => {
        assert.ok(rule.meta.messages[id], `thiếu messageId ${id}`);
        assert.ok(
          rule.meta.messages[id].includes(needle),
          `${id}: "${rule.meta.messages[id]}" không chứa "${needle}"`,
        );
      });
    }
  });
}
