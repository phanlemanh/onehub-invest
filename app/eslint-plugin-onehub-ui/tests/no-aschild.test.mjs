import rule from "../rules/no-aschild.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-aschild", rule, {
  valid: [
    { code: 'const a = <Button render={<Link href="/x" />} />;' },
    { code: "const a = <div as={x} />;" },
  ],
  invalid: [
    { code: "const a = <DialogTrigger asChild/>;", errors: [{ messageId: "asChild" }] },
    { code: "const a = <Button asChild><a href='/x'/></Button>;", errors: [{ messageId: "asChild" }] },
  ],
});
assertMessages(rule, { asChild: "render" });
