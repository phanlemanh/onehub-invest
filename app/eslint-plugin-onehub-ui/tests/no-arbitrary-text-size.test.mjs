import rule from "../rules/no-arbitrary-text-size.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-arbitrary-text-size", rule, {
  valid: [
    { code: 'const c = "text-xs text-sm";' },
    { code: 'const c = "text-[var(--x)]";' },
    { code: "const c = `text-${size}`;" },
  ],
  invalid: [
    { code: 'const c = "text-[10px]";', errors: [{ messageId: "arbitrarySize" }] },
    { code: 'const a = <p className="md:text-[0.7rem] font-bold" />;', errors: [{ messageId: "arbitrarySize" }] },
    { code: 'const c = cn("text-[1.2em]");', errors: [{ messageId: "arbitrarySize" }] },
  ],
});
assertMessages(rule, { arbitrarySize: "text-xs" });
