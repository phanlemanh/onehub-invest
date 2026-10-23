import rule from "../rules/no-hardcoded-color.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-hardcoded-color", rule, {
  valid: [
    { code: 'const x = "var(--color-violet-500)";' },
    { code: 'const a = <div style={{ color: "var(--color-violet-500)" }} />;' },
    { code: 'const a = <div className="bg-primary" />;' },
    { code: 'const label = "Căn hộ #123abc";' },
    { code: 'const meta = { title: "#fff" };' },
  ],
  invalid: [
    { code: 'const a = <div className="bg-[#2563eb]"/>;', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const a = <div style={{ color: "#fff" }} />;', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const a = <div style={{ width: 1, background: "rgba(0,0,0,.5)" }} />;', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const a = <div style={s ? { x: "hsl(1 2% 3%)" } : undefined} />;', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const c = cn("p-2", cond && "text-[#abc]");', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const c = cva(["a", { b: "oklch(0.5 0.1 200)" }]);', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const o = { fill: "#ff0000" };', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const o = { borderColor: cond ? "#000" : "#111" };', errors: [{ messageId: "hardcodedColor" }, { messageId: "hardcodedColor" }] },
    { code: 'const o = { stroke: `rgb(1,2,3)` };', errors: [{ messageId: "hardcodedColor" }] },
    { code: 'const x = "w-[#fff]";', errors: [{ messageId: "hardcodedColor" }] },
  ],
});
assertMessages(rule, { hardcodedColor: "token" });
