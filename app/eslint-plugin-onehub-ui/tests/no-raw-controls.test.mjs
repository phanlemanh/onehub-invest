import rule from "../rules/no-raw-controls.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-raw-controls", rule, {
  valid: [
    { code: "const a = <Select />;" },
    { code: "const a = <Input />;" },
    { code: "const a = <Button render={<Link href=\"/x\" />} />;" },
    // Ô ẩn của form (server action, $ACTION_ID_) không có giao diện — không có primitive thay
    { code: 'const a = <input type="hidden" name="next" value="/ops" />;' },
    { code: "const a = <input type='hidden' />;" },
  ],
  invalid: [
    { code: "const a = <select/>;", errors: [{ messageId: "rawControl", data: { tag: "select", primitive: "Select" } }] },
    { code: "const a = <input/>;", errors: [{ messageId: "rawControl", data: { tag: "input", primitive: "Input" } }] },
    { code: 'const a = <input type="text" />;', errors: [{ messageId: "rawControl", data: { tag: "input", primitive: "Input" } }] },
    // type động không chứng minh được là hidden → vẫn báo
    { code: "const a = <input type={t} />;", errors: [{ messageId: "rawControl", data: { tag: "input", primitive: "Input" } }] },
    { code: 'const a = <input type={"hidden"} />;', errors: [{ messageId: "rawControl", data: { tag: "input", primitive: "Input" } }] },
    { code: "const a = <textarea/>;", errors: [{ messageId: "rawControl", data: { tag: "textarea", primitive: "Textarea" } }] },
    { code: "const a = <button>x</button>;", errors: [{ messageId: "rawControl", data: { tag: "button", primitive: "Button" } }] },
  ],
});
assertMessages(rule, { rawControl: "{{primitive}}" });
