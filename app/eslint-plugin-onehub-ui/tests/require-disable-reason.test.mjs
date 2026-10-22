import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Linter } from "eslint";
import rule from "../rules/require-disable-reason.mjs";
import { assertMessages } from "../test-utils.mjs";

// Không dùng RuleTester: chính ESLint sẽ áp dụng các chú thích eslint-disable trong code mẫu
// (báo "không tìm thấy luật", và `/* eslint-disable */` tắt luôn lỗi của luật này). noInlineConfig
// tắt việc áp dụng đó để chỉ kiểm logic của luật; ta lọc theo ruleId nên cảnh báo noInlineConfig bị bỏ qua.
const RULE_ID = "onehub-ui/require-disable-reason";
const linter = new Linter();
const config = [{
  plugins: { "onehub-ui": { rules: { "require-disable-reason": rule } } },
  rules: { [RULE_ID]: "error" },
  linterOptions: { noInlineConfig: true },
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
}];
const lint = (code) => linter.verify(code, config).filter((m) => m.ruleId === RULE_ID);

function run({ valid, invalid }) {
  describe("require-disable-reason", () => {
    describe("valid", () => {
      for (const { code } of valid) it(code, () => assert.deepEqual(lint(code), []));
    });
    describe("invalid", () => {
      for (const { code, errors } of invalid) {
        it(code, () => {
          const got = lint(code);
          assert.equal(got.length, errors.length, `số lỗi: ${JSON.stringify(got)}`);
          errors.forEach((e, i) => {
            assert.equal(got[i].messageId, e.messageId);
            if (e.line) assert.equal(got[i].line, e.line);
          });
        });
      }
    });
  });
}

run({
  valid: [
    { code: "// eslint-disable-next-line onehub-ui/no-raw-table -- bảng in hoá đơn, data-grid không in được\nconst a = 1;" },
    // Không phải luật onehub-ui/* nên không xét.
    { code: "// eslint-disable-next-line react-hooks/purity\nconst a = 1;" },
    { code: "/* eslint-disable react-hooks/purity, no-console */\nconst a = 1;" },
    { code: "const a = 1; // eslint-disable-line onehub-ui/no-emoji-icons -- emoji là nội dung người dùng nhập" },
    { code: "/* eslint-disable onehub-ui/no-raw-palette -- màu thương hiệu đối tác */\nconst a = 1;" },
    { code: "// eslint-disable-next-line -- tắt mọi luật vì file sinh tự động\nconst a = 1;" },
    // eslint-enable không cần lý do.
    { code: "/* eslint-enable onehub-ui/no-raw-palette */\nconst a = 1;" },
    { code: "/* eslint-enable */\nconst a = 1;" },
    // Chú thích thường, không phải directive.
    { code: "// onehub-ui/no-raw-table là luật cấm bảng thô\nconst a = 1;" },
  ],
  invalid: [
    {
      code: "// eslint-disable-next-line onehub-ui/no-raw-table\nconst a = 1;",
      errors: [{ messageId: "missingReason", line: 1 }],
    },
    {
      code: "/* eslint-disable onehub-ui/no-raw-palette */\nconst a = 1;",
      errors: [{ messageId: "missingReason" }],
    },
    // Tắt mọi luật cũng phải có lý do.
    {
      code: "/* eslint-disable */\nconst a = 1;",
      errors: [{ messageId: "missingReason" }],
    },
    {
      code: "const a = 1; // eslint-disable-line\n",
      errors: [{ messageId: "missingReason" }],
    },
    // Danh sách có lẫn luật ngoài plugin vẫn bị xét vì chứa onehub-ui/*.
    {
      code: "// eslint-disable-next-line react-hooks/purity, onehub-ui/no-raw-table\nconst a = 1;",
      errors: [{ messageId: "missingReason" }],
    },
    // Dấu -- nhưng không có chữ nào theo sau.
    {
      code: "// eslint-disable-next-line onehub-ui/no-raw-table --\nconst a = 1;",
      errors: [{ messageId: "missingReason" }],
    },
    {
      code: "/* eslint-disable onehub-ui/no-raw-table --   */\nconst a = 1;",
      errors: [{ messageId: "missingReason" }],
    },
    // Hai directive thiếu lý do → hai lỗi.
    {
      code: "// eslint-disable-next-line onehub-ui/no-raw-table\n// eslint-disable-next-line onehub-ui/no-aschild\nconst a = 1;",
      errors: [{ messageId: "missingReason", line: 1 }, { messageId: "missingReason", line: 2 }],
    },
  ],
});
assertMessages(rule, { missingReason: "-- <lý do>" });
