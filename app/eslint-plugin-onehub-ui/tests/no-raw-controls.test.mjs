import rule from "../rules/no-raw-controls.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-raw-controls", rule, {
  valid: [
    { code: "const a = <Select />;" },
    { code: "const a = <Input />;" },
    { code: "const a = <Button render={<Link href=\"/x\" />} />;" },
  ],
  invalid: [
    { code: "const a = <select/>;", errors: [{ messageId: "rawControl", data: { tag: "select", primitive: "Select" } }] },
    { code: "const a = <input/>;", errors: [{ messageId: "rawControl", data: { tag: "input", primitive: "Input" } }] },
    { code: "const a = <textarea/>;", errors: [{ messageId: "rawControl", data: { tag: "textarea", primitive: "Textarea" } }] },
    { code: "const a = <button>x</button>;", errors: [{ messageId: "rawControl", data: { tag: "button", primitive: "Button" } }] },
  ],
});
assertMessages(rule, { rawControl: "{{primitive}}" });
